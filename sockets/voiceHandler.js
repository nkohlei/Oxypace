/**
 * Voice Channel Socket.IO Handler
 * Manages real-time signaling for voice/video channels:
 * - Join/leave voice rooms (authenticated + membership checked)
 * - Raise hand requests / stage permissions (moderator checked)
 * - Participant presence tracking (Redis backed, cluster safe)
 * - WebRTC signaling relay (room-scoped)
 * - Watch Party synchronisation and configurable stop-consensus
 *
 * Design notes
 * ─────────────
 * • Redis is the single source of truth for everything that must be consistent across cluster
 *   workers (participants, watch party state, stop votes, chat history, room start time).
 *   The per-worker `voiceRooms` Map is only a local cache / fallback when Redis is unavailable.
 * • Identity: when the client sends a JWT in the Socket.IO handshake (`auth.token`) the verified
 *   user id ALWAYS wins over any client supplied `userId`. Set SOCKET_AUTH_STRICT=true to reject
 *   unauthenticated sockets entirely once every client build ships the handshake token.
 * • Live socket counts (via `fetchSockets`, cluster aware) – not stale Redis hash entries – decide
 *   how many participants must approve closing a watch party, so crashed workers can never leave
 *   "ghost" participants that make a unanimous vote impossible.
 */

import jwt from 'jsonwebtoken';
import { pubClient } from './redisAdapter.js';
import Portal from '../models/Portal.js';
import logActivity from '../utils/auditLogger.js';

// roomName -> { participants: Map<userId, data>, startedAt, chatHistory, watchParty, ... }
// Local per-worker cache / fallback only (see design notes above).
const voiceRooms = new Map();

// ─── Constants ──────────────────────────────────────────────────────────────
const STRICT_SOCKET_AUTH = process.env.SOCKET_AUTH_STRICT === 'true';
const ROOM_KEY_TTL_SEC = 60 * 60 * 24; // safety net for keys left behind by crashed workers
const WATCHPARTY_TTL_SEC = 60 * 60 * 12;
const STOP_VOTE_TTL_MS = 45 * 1000;
const STOP_VOTE_REDIS_TTL_SEC = 90;
const EMPTY_ROOM_GRACE_MS = 20 * 1000; // allows socket reconnects without losing room state

const MAX_URL_LENGTH = 4096;
const MAX_TITLE_LENGTH = 300;
const MAX_CHAT_LENGTH = 2000;
const MAX_CHAT_HISTORY = 100;
const MAX_SUBTITLE_CHARS = 2_000_000;
const MAX_SHARED_SUBTITLES = 10;
const MAX_SDP_LENGTH = 200_000;
const MAX_CANDIDATE_JSON = 4096;
const MAX_ROOMS_PER_SOCKET = 3;

const ROOM_NAME_RE = /^portal_([a-f0-9]{24})_channel_([\w-]{1,64})$/i;
const VALID_CONSENSUS_RULES = new Set(['all', 'majority', '1', '2', '3', '4']);

let ioRef = null;

// ─── Small utilities ────────────────────────────────────────────────────────
const parseRoomName = (roomName) => {
    if (typeof roomName !== 'string' || roomName.length > 128) return null;
    const m = ROOM_NAME_RE.exec(roomName);
    return m ? { portalId: m[1], channelId: m[2] } : null;
};

const clampString = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

const sanitizeTime = (t) => {
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 && n < 1e7 ? n : null;
};

/** Token bucket: `ratePerSec` sustained, `burst` peak. Returns a function that yields true when allowed. */
const makeLimiter = (ratePerSec, burst) => {
    let tokens = burst;
    let last = Date.now();
    return () => {
        const now = Date.now();
        tokens = Math.min(burst, tokens + ((now - last) / 1000) * ratePerSec);
        last = now;
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    };
};

/** Serialises async read-modify-write cycles per room within this worker. */
const roomLocks = new Map();
const withRoomLock = async (roomName, fn) => {
    const prev = roomLocks.get(roomName) || Promise.resolve();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const chain = prev.then(() => gate);
    roomLocks.set(roomName, chain);
    try {
        await prev;
        return await fn();
    } finally {
        release();
        if (roomLocks.get(roomName) === chain) roomLocks.delete(roomName);
    }
};

/** Tiny TTL cache for DB lookups (membership / moderator / consensus rule). */
const lookupCache = new Map();
const cachedLookup = async (key, ttlMs, loader) => {
    const now = Date.now();
    const hit = lookupCache.get(key);
    if (hit && hit.exp > now) return hit.value;
    const value = await loader();
    lookupCache.set(key, { value, exp: now + ttlMs });
    if (lookupCache.size > 5000) {
        for (const [k, v] of lookupCache) if (v.exp <= now) lookupCache.delete(k);
        if (lookupCache.size > 5000) lookupCache.clear();
    }
    return value;
};

export const invalidatePortalRuleCache = (portalId) => {
    if (portalId) lookupCache.delete(`rule:${portalId}`);
};

const isPortalMember = async (portalId, userId) => {
    try {
        return await cachedLookup(`m:${portalId}:${userId}`, 30_000, async () =>
            !!(await Portal.exists({
                _id: portalId,
                $or: [{ owner: userId }, { admins: userId }, { members: userId }]
            }))
        );
    } catch (err) {
        console.error('[Voice] membership lookup failed:', err.message);
        return false;
    }
};

const isPortalModerator = async (portalId, userId) => {
    try {
        return await cachedLookup(`a:${portalId}:${userId}`, 30_000, async () =>
            !!(await Portal.exists({
                _id: portalId,
                $or: [{ owner: userId }, { admins: userId }]
            }))
        );
    } catch (err) {
        console.error('[Voice] moderator lookup failed:', err.message);
        return false;
    }
};

const getRoomConsensusRule = async (roomName) => {
    const parsed = parseRoomName(roomName);
    if (parsed) {
        try {
            return await cachedLookup(`rule:${parsed.portalId}`, 10_000, async () => {
                const portal = await Portal.findById(parsed.portalId).select('liveRoomSettings').lean();
                const rule = portal?.liveRoomSettings?.watchPartyConsensusRule;
                return VALID_CONSENSUS_RULES.has(rule) ? rule : 'all';
            });
        } catch (err) {
            console.error('[Watch Party Consensus] Error fetching portal settings:', err.message);
        }
    }
    return 'all'; // Default: everybody currently in the live room must approve
};

const calculateRequiredVotes = (consensusRule, totalActive) => {
    if (totalActive <= 1) return 1;
    if (consensusRule === '1') return 1;
    if (consensusRule === 'majority') return Math.max(1, Math.floor(totalActive / 2) + 1);
    if (consensusRule === 'all') return totalActive;
    const num = parseInt(consensusRule, 10);
    return Number.isNaN(num) ? totalActive : Math.min(totalActive, Math.max(1, num));
};

// ─── Redis key helpers ──────────────────────────────────────────────────────
const roomKey = (r) => `voiceroom:${r}`;
const wpKey = (r) => `voiceroom:${r}:watchparty`;
const votesKey = (r) => `voiceroom:${r}:stopvotes`;
const reqKey = (r) => `voiceroom:${r}:stopvotereq`;
const chatKey = (r) => `voiceroom:${r}:chat`;
const startedKey = (r) => `voiceroom:${r}:startedAt`;

const ensureLocalRoom = (roomName) => {
    let rd = voiceRooms.get(roomName);
    if (!rd) {
        rd = { participants: new Map(), startedAt: Date.now(), chatHistory: [], watchParty: null };
        voiceRooms.set(roomName, rd);
    }
    return rd;
};

// ─── Room start time (shared across workers) ────────────────────────────────
const getRoomStartedAt = async (roomName, create = false) => {
    if (pubClient) {
        try {
            if (create) await pubClient.set(startedKey(roomName), String(Date.now()), 'EX', ROOM_KEY_TTL_SEC, 'NX');
            const v = await pubClient.get(startedKey(roomName));
            if (v) return Number(v);
        } catch (err) {
            console.error('[Voice] startedAt error:', err.message);
        }
    }
    return voiceRooms.get(roomName)?.startedAt || null;
};

// ─── Watch party state (Redis is authoritative) ─────────────────────────────
const PUBLIC_API_ORIGIN = (process.env.PUBLIC_API_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');

const toAbsoluteProxyUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
    const trimmed = rawUrl.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('/api/')) return `${PUBLIC_API_ORIGIN}${trimmed}`;
    if (trimmed.startsWith('api/')) return `${PUBLIC_API_ORIGIN}/${trimmed}`;
    if (
        trimmed.startsWith('https://oxypace.com.tr/api/') ||
        trimmed.startsWith('https://www.oxypace.com.tr/api/') ||
        trimmed.startsWith('http://localhost/api/') ||
        trimmed.startsWith('https://localhost/api/')
    ) {
        const apiIdx = trimmed.indexOf('/api/');
        return `${PUBLIC_API_ORIGIN}${trimmed.slice(apiIdx)}`;
    }
    return trimmed;
};

const normalizeSubtitleObj = (sub) => {
    if (!sub || typeof sub !== 'object') return sub;
    const copy = { ...sub };
    if (typeof copy.file === 'string') copy.file = toAbsoluteProxyUrl(copy.file);
    if (typeof copy.playableUrl === 'string') copy.playableUrl = toAbsoluteProxyUrl(copy.playableUrl);
    if (typeof copy.url === 'string') copy.url = toAbsoluteProxyUrl(copy.url);
    return copy;
};

const normalizeWatchPartyState = (wp, computeLive = true) => {
    if (!wp || typeof wp !== 'object') return null;
    const next = { ...wp };
    if (typeof next.url === 'string') {
        next.url = toAbsoluteProxyUrl(next.url);
    }
    if (Array.isArray(next.subtitles)) {
        next.subtitles = next.subtitles.map(normalizeSubtitleObj);
    }
    if (Array.isArray(next.sharedSubtitles)) {
        next.sharedSubtitles = next.sharedSubtitles.map(normalizeSubtitleObj);
    }
    if (next.activeSubtitle && typeof next.activeSubtitle === 'object') {
        next.activeSubtitle = normalizeSubtitleObj(next.activeSubtitle);
    }
    if (computeLive && next.isPlaying && !next.isLive && typeof next.serverTimestamp === 'number') {
        const now = Date.now();
        const elapsedSec = Math.max(0, (now - next.serverTimestamp) / 1000);
        next.currentTime = (Number(next.currentTime) || 0) + elapsedSec;
        next.serverTimestamp = now;
    }
    return next;
};

const loadWatchParty = async (roomName, computeLive = true) => {
    if (pubClient) {
        try {
            const s = await pubClient.get(wpKey(roomName));
            const rawWp = s ? JSON.parse(s) : null;
            const normalizedStored = normalizeWatchPartyState(rawWp, false);
            const rd = voiceRooms.get(roomName);
            if (rd) rd.watchParty = normalizedStored;
            return normalizeWatchPartyState(normalizedStored, computeLive);
        } catch (err) {
            console.error('[Watch Party] Redis load error:', err.message);
        }
    }
    const localWp = voiceRooms.get(roomName)?.watchParty || null;
    return normalizeWatchPartyState(localWp, computeLive);
};

const saveWatchParty = async (roomName, wp) => {
    const normalized = normalizeWatchPartyState(wp, false);
    const rd = voiceRooms.get(roomName);
    if (rd) rd.watchParty = normalized;
    if (pubClient) {
        try {
            await pubClient.set(wpKey(roomName), JSON.stringify(normalized), 'EX', WATCHPARTY_TTL_SEC);
        } catch (err) {
            console.error('[Watch Party] Redis save error:', err.message);
        }
    }
};

/** Atomic (per worker) read-modify-write of the watch party. Returns the new state or null if none exists. */
const mutateWatchParty = (roomName, mutator) =>
    withRoomLock(roomName, async () => {
        const current = await loadWatchParty(roomName);
        if (!current) return null;
        const next = mutator({ ...current }) || current;
        await saveWatchParty(roomName, next);
        return next;
    });

// ─── Chat history (shared across workers) ───────────────────────────────────
const pushChatMessage = async (roomName, msg) => {
    const rd = ensureLocalRoom(roomName);
    rd.chatHistory.push(msg);
    if (rd.chatHistory.length > MAX_CHAT_HISTORY) rd.chatHistory.shift();
    if (pubClient) {
        try {
            await pubClient.rpush(chatKey(roomName), JSON.stringify(msg));
            await pubClient.ltrim(chatKey(roomName), -MAX_CHAT_HISTORY, -1);
            await pubClient.expire(chatKey(roomName), ROOM_KEY_TTL_SEC);
        } catch (err) {
            console.error('[VoiceChat] Redis error:', err.message);
        }
    }
};

const loadChatHistory = async (roomName) => {
    if (pubClient) {
        try {
            const items = await pubClient.lrange(chatKey(roomName), 0, -1);
            return items.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        } catch (err) {
            console.error('[VoiceChat] Redis history error:', err.message);
        }
    }
    return voiceRooms.get(roomName)?.chatHistory || [];
};

// ─── Live (cluster-wide) socket membership ──────────────────────────────────
/** Unique user ids with at least one LIVE socket in the room. Null when it cannot be determined. */
const getLiveRoomUserIds = async (roomName) => {
    if (!ioRef) return null;
    try {
        const sockets = await ioRef.in(`voice:${roomName}`).fetchSockets();
        const ids = new Set();
        for (const s of sockets) {
            const uid = s.data?.voiceUserId || s.data?.authUserId || s.userId || s._voiceUserId;
            if (uid) {
                const sId = String(uid).trim();
                if (sId && !sId.endsWith('-screen')) {
                    ids.add(sId);
                }
            }
        }
        return ids;
    } catch (err) {
        console.error('[Voice] fetchSockets failed:', err.message);
        return null;
    }
};

/** Removes hash entries of users that no longer have a live socket (e.g. crashed worker leftovers). */
const pruneStaleParticipants = async (roomName) => {
    try {
        const live = await getLiveRoomUserIds(roomName);
        if (!live || live.size === 0) return;

        // Prune local memory participants
        const rd = voiceRooms.get(roomName);
        if (rd?.participants) {
            for (const key of Array.from(rd.participants.keys())) {
                if (!live.has(String(key))) {
                    rd.participants.delete(key);
                }
            }
        }

        // Prune Redis participants
        if (pubClient) {
            const keys = await pubClient.hkeys(roomKey(roomName));
            const stale = keys.filter((k) => !live.has(String(k)));
            if (stale.length) await pubClient.hdel(roomKey(roomName), ...stale);
        }
    } catch (err) {
        console.error('[Voice] prune stale participants failed:', err.message);
    }
};

const countParticipants = async (roomName) => {
    let count = voiceRooms.get(roomName)?.participants?.size || 0;
    if (pubClient) {
        try {
            count = Math.max(count, await pubClient.hlen(roomKey(roomName)));
        } catch { /* ignore */ }
    }
    return count;
};

// ─── Stop-vote state (Redis hash keyed by userId => natural de-duplication) ──
const stopState = {
    async getRequest(roomName) {
        const rd = voiceRooms.get(roomName);
        if (rd?.stopRequest) return rd.stopRequest;
        if (pubClient) {
            try {
                const s = await pubClient.get(reqKey(roomName));
                if (s) {
                    const parsed = JSON.parse(s);
                    if (rd) rd.stopRequest = parsed;
                    return parsed;
                }
            } catch { /* ignore */ }
        }
        return null;
    },
    async ensureRequest(roomName, request) {
        const rd = ensureLocalRoom(roomName);
        if (rd.stopRequest) return { request: rd.stopRequest, created: false };
        if (pubClient) {
            try {
                const created = await pubClient.set(reqKey(roomName), JSON.stringify(request), 'EX', STOP_VOTE_REDIS_TTL_SEC, 'NX');
                if (created === 'OK') {
                    rd.stopRequest = request;
                    return { request, created: true };
                }
                const existing = await pubClient.get(reqKey(roomName));
                if (existing) {
                    const parsed = JSON.parse(existing);
                    rd.stopRequest = parsed;
                    return { request: parsed, created: false };
                }
            } catch (err) {
                console.error('[Watch Party Stop Vote] Redis error:', err.message);
            }
        }
        rd.stopRequest = request;
        return { request, created: true };
    },
    async addVote(roomName, userId, vote) {
        const cleanId = String(userId).trim();
        const rd = ensureLocalRoom(roomName);
        if (!rd.stopVotes) rd.stopVotes = new Map();
        rd.stopVotes.set(cleanId, vote);
        if (pubClient) {
            try {
                await pubClient.hset(votesKey(roomName), cleanId, JSON.stringify(vote));
                await pubClient.expire(votesKey(roomName), STOP_VOTE_REDIS_TTL_SEC);
            } catch (err) {
                console.error('[Watch Party Stop Vote] Redis error:', err.message);
            }
        }
    },
    async getVotes(roomName) {
        const rd = voiceRooms.get(roomName);
        const map = new Map(rd?.stopVotes ? Array.from(rd.stopVotes.entries()) : []);
        if (pubClient) {
            try {
                const all = await pubClient.hgetall(votesKey(roomName));
                if (all) {
                    for (const [k, v] of Object.entries(all)) {
                        try {
                            const parsed = JSON.parse(v);
                            if (parsed) map.set(String(k).trim(), parsed);
                        } catch { /* ignore */ }
                    }
                }
            } catch { /* fall through to local */ }
        }
        return Array.from(map.values());
    },
    async clear(roomName) {
        const rd = voiceRooms.get(roomName);
        if (rd) {
            if (rd.watchStopTimer) { clearTimeout(rd.watchStopTimer); rd.watchStopTimer = null; }
            rd.stopVotes = null;
            rd.stopRequest = null;
        }
        if (pubClient) {
            try {
                await pubClient.del(votesKey(roomName), reqKey(roomName));
            } catch { /* ignore */ }
        }
    }
};

const scheduleStopVoteExpiry = (roomName, startedAt) => {
    const rd = voiceRooms.get(roomName);
    if (!rd) return;
    if (rd.watchStopTimer) clearTimeout(rd.watchStopTimer);
    rd.watchStopTimer = setTimeout(async () => {
        rd.watchStopTimer = null;
        try {
            const req = await stopState.getRequest(roomName);
            // Only expire the request this timer was created for (a newer request must not be wiped)
            if (!req || req.startedAt !== startedAt) return;
            await stopState.clear(roomName);
            ioRef?.to(`voice:${roomName}`).emit('voice:watch-stop-vote-clear');
            console.log(`[Watch Party] Stop vote timed out in ${roomName}`);
        } catch (err) {
            console.error('[Watch Party] stop vote expiry error:', err.message);
        }
    }, STOP_VOTE_TTL_MS);
    rd.watchStopTimer.unref?.();
};

/** Tears the watch party down for everybody in the room. */
const cleanupWatchParty = async (roomName) => {
    const rd = voiceRooms.get(roomName);
    if (rd) rd.watchParty = null;
    await stopState.clear(roomName);
    if (pubClient) {
        try { await pubClient.del(wpKey(roomName)); } catch { /* ignore */ }
    }
    ioRef?.to(`voice:${roomName}`).emit('voice:watch-stop-vote-clear');
    ioRef?.to(`voice:${roomName}`).emit('voice:watch-stop');
};

/**
 * Re-evaluates the pending stop request against the CURRENT live room:
 *  - votes of users who left no longer count (prevents "A votes, A leaves, B closes it for C"),
 *  - the requirement is recalculated for the current head count (a leaving user may complete consensus),
 *  - a request without any remaining voter is dropped.
 */
const evaluateStopVote = async (roomName) => {
    const request = await stopState.getRequest(roomName);
    if (!request) return;

    // Prune stale dead entries from Redis first
    await pruneStaleParticipants(roomName);

    // Determine strictly active human participants via live sockets (cluster-safe)
    const live = await getLiveRoomUserIds(roomName);
    const validParticipantIds = new Set();
    if (live && live.size > 0) {
        for (const id of live) {
            const cleanId = String(id).trim();
            if (cleanId && !cleanId.endsWith('-screen')) {
                validParticipantIds.add(cleanId);
            }
        }
    } else {
        // Fallback to Redis / local participant map only if live socket inspection is unavailable
        const participants = await getVoiceRoomParticipantsFromRedis(roomName);
        for (const p of (participants || [])) {
            const cleanId = String(p.userId).trim();
            if (cleanId && !cleanId.endsWith('-screen')) {
                validParticipantIds.add(cleanId);
            }
        }
    }

    // Always ensure the requester is treated as valid if still connected or requesting
    if (request.requesterId) {
        validParticipantIds.add(String(request.requesterId).trim());
    }

    let votes = await stopState.getVotes(roomName);
    const uniqueVoteMap = new Map();

    // The initiator of the stop request is GUARANTEED to have voted yes
    if (request.requesterId) {
        const reqIdStr = String(request.requesterId).trim();
        uniqueVoteMap.set(reqIdStr, {
            userId: reqIdStr,
            username: request.requesterName || 'Kapatma Başlatan',
            isRequester: true
        });
    }

    for (const v of votes) {
        const key = String(v.userId).trim();
        // Retain votes from active room participants
        if (key && (validParticipantIds.has(key) || (request.requesterId && key === String(request.requesterId).trim()))) {
            if (!uniqueVoteMap.has(key)) {
                uniqueVoteMap.set(key, v);
            }
        }
    }

    const uniqueVotes = Array.from(uniqueVoteMap.values());
    const voteCount = uniqueVotes.length;

    // Active count: real humans currently connected
    const totalActive = Math.max(validParticipantIds.size, voteCount, 1);
    const rule = await getRoomConsensusRule(roomName);
    const required = calculateRequiredVotes(rule, totalActive);

    console.log(`[Watch Party Consensus] Room ${roomName}: voteCount=${voteCount}/${required}, totalActive=${totalActive}, rule=${rule}`);

    if (voteCount === 0) {
        await stopState.clear(roomName);
        ioRef?.to(`voice:${roomName}`).emit('voice:watch-stop-vote-clear');
        return;
    }

    if (voteCount >= required || (totalActive > 0 && voteCount >= totalActive) || (validParticipantIds.size > 0 && voteCount >= validParticipantIds.size)) {
        await cleanupWatchParty(roomName);
        console.log(`[Watch Party] stopped in ${roomName} after consensus reached (${voteCount}/${required}, totalActive: ${totalActive}, rule: ${rule})`);
        return;
    }

    ioRef?.to(`voice:${roomName}`).emit('voice:watch-stop-vote-status', {
        voters: uniqueVotes.map((v) => String(v.userId).trim()),
        voteCount,
        required,
        rule,
        requesterName: request.requesterName,
        requesterId: request.requesterId
    });
};

// ─── Participant helpers ────────────────────────────────────────────────────
const broadcastParticipants = async (roomName) => {
    const participants = await getVoiceRoomParticipantsFromRedis(roomName);
    const watchParty = await loadWatchParty(roomName);
    const startedAt = (await getRoomStartedAt(roomName, false)) || voiceRooms.get(roomName)?.startedAt || Date.now();
    ioRef.to(`voice:${roomName}`).emit('voice:participants', {
        roomName,
        participants,
        startedAt,
        serverNow: Date.now(),
        watchParty
    });

    const parsed = parseRoomName(roomName);
    if (parsed) {
        // Scoped to the portal room only (the former global io.emit leaked channel activity of private
        // portals to every connected user and did not scale).
        ioRef.to(`portal:${parsed.portalId}`).emit('voice:channel-count-update', {
            portalId: parsed.portalId,
            channelId: parsed.channelId,
            count: participants ? participants.length : 0
        });
    }
    return participants;
};

const purgeRoomKeys = async (roomName) => {
    if (!pubClient) return;
    try {
        await pubClient.del(
            roomKey(roomName), wpKey(roomName), votesKey(roomName),
            reqKey(roomName), chatKey(roomName), startedKey(roomName)
        );
    } catch { /* ignore */ }
};

/**
 * Removes a participant. When `socketId` is supplied the removal only happens if that socket is still
 * the user's CURRENT socket – a late `disconnect` of an old socket must never evict a user who has
 * already re-joined through a new socket (classic reconnect race that made users vanish from rooms).
 */
async function removeParticipant(roomName, userId, socketId = null) {
    const sUserId = String(userId);
    const rd = voiceRooms.get(roomName);
    let participantInfo = rd?.participants.get(sUserId) || null;

    if (pubClient) {
        try {
            const raw = await pubClient.hget(roomKey(roomName), sUserId);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (socketId && parsed.socketId && parsed.socketId !== socketId) return; // superseded by a newer socket
                participantInfo = participantInfo || parsed;
            }
        } catch (err) {
            console.error('[Voice] hget on leave failed:', err.message);
        }
    }
    if (socketId && participantInfo?.socketId && participantInfo.socketId !== socketId) return;

    let removedFromRedis = 0;
    if (pubClient) {
        try {
            removedFromRedis = await pubClient.hdel(roomKey(roomName), sUserId);
        } catch (err) {
            console.error('Redis voiceroom remove error:', err);
        }
    }
    const removedLocally = rd ? rd.participants.delete(sUserId) : false;

    // Guard: never emit phantom leave events for users who were not present
    if (!removedFromRedis && !removedLocally) return;

    const participants = await broadcastParticipants(roomName);

    ioRef.to(`voice:${roomName}`).emit('voice:user-left', {
        userId: sUserId,
        username: participantInfo?.username || ''
    });

    const parsedRoom = parseRoomName(roomName);
    const durationSec = participantInfo?.joinedAt ? Math.round((Date.now() - participantInfo.joinedAt) / 1000) : 0;
    logActivity({
        user: sUserId,
        username: participantInfo?.username || sUserId,
        action: 'ROOM_LEAVE',
        category: 'rtc',
        portal: parsedRoom?.portalId,
        details: {
            roomName,
            portalId: parsedRoom?.portalId,
            channelId: parsedRoom?.channelId,
            durationSec,
            remainingParticipants: participants?.length || 0
        }
    });

    // A leaving user changes head count and voter set → re-check pending stop consensus
    try { await evaluateStopVote(roomName); } catch (err) { console.error('[Watch Party] re-evaluate failed:', err.message); }

    // Empty room: after a grace period (socket reconnects) drop ALL shared state so that a later joiner
    // never inherits a stale "ghost" watch party / chat from a finished session.
    if (!participants || participants.length === 0) {
        const room = ensureLocalRoom(roomName);
        if (room.cleanupTimeout) clearTimeout(room.cleanupTimeout);
        room.cleanupTimeout = setTimeout(async () => {
            room.cleanupTimeout = null;
            const stillEmpty = (await countParticipants(roomName)) === 0;
            if (!stillEmpty) return;
            await purgeRoomKeys(roomName);
            const fresh = voiceRooms.get(roomName);
            if (fresh && fresh.participants.size === 0) {
                if (fresh.watchStopTimer) clearTimeout(fresh.watchStopTimer);
                voiceRooms.delete(roomName);
                console.log(`[Voice Room] Empty room ${roomName} purged after grace period.`);
            }
        }, EMPTY_ROOM_GRACE_MS);
        room.cleanupTimeout.unref?.();
    }

    console.log(`👋 User ${participantInfo?.username || sUserId} left voice room ${roomName}`);
}

// ─── Socket.IO wiring ───────────────────────────────────────────────────────
export const initializeVoiceHandler = (io) => {
    ioRef = io;

    // Optional JWT handshake: the verified identity always wins over client supplied ids.
    io.use((socket, next) => {
        const token = socket.handshake?.auth?.token;
        if (token && typeof token === 'string') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded?.id) {
                    socket.data.authUserId = String(decoded.id);
                    socket.data.authIsGhost = !!decoded.isGhost;
                }
            } catch {
                if (STRICT_SOCKET_AUTH) return next(new Error('unauthorized'));
            }
        } else if (STRICT_SOCKET_AUTH) {
            return next(new Error('unauthorized'));
        }
        next();
    });

    io.on('connection', (socket) => {
        const limits = {
            join: makeLimiter(1, 8),
            watch: makeLimiter(25, 50),
            chat: makeLimiter(3, 8),
            state: makeLimiter(12, 24),
            vote: makeLimiter(2, 5),
            signal: makeLimiter(200, 400),
            moderation: makeLimiter(4, 8)
        };
        socket._sigCache = new Map();

        const myId = () => socket.data?.voiceUserId || socket._voiceUserId || socket.userId || socket.data?.authUserId || null;
        const inRoom = (roomName) => !!(roomName && (socket._voiceRooms?.has(roomName) || socket.rooms?.has(`voice:${roomName}`) || parseRoomName(roomName)));
        const settle = async () => { try { await socket._joining; } catch { /* handled in join */ } };

        // ─── Join Voice Channel ───
        const doJoin = async (payload) => {
            const { roomName, userId, username, avatar } = payload || {};
            const parsedRoom = parseRoomName(roomName);
            if (!parsedRoom) {
                socket.emit('voice:join-denied', { roomName, reason: 'invalid-room' });
                return;
            }
            if (!limits.join()) return;

            const verified = socket.data?.authUserId || null;
            const claimed = userId ? String(userId) : null;
            if (verified && claimed && verified !== claimed) {
                console.warn(`[Voice] identity mismatch on join: claimed ${claimed} but authenticated as ${verified}`);
                socket.emit('voice:join-denied', { roomName, reason: 'identity-mismatch' });
                return;
            }
            const sUserId = verified || claimed;
            if (!sUserId) return;

            if (!(await isPortalMember(parsedRoom.portalId, sUserId))) {
                socket.emit('voice:join-denied', { roomName, reason: 'not-a-member' });
                return;
            }
            if (!socket._voiceRooms) socket._voiceRooms = new Set();
            if (!socket._voiceRooms.has(roomName) && socket._voiceRooms.size >= MAX_ROOMS_PER_SOCKET) {
                socket.emit('voice:join-denied', { roomName, reason: 'too-many-rooms' });
                return;
            }

            const safeName = clampString(username, 64) || 'Kullanıcı';
            const safeAvatar = clampString(avatar, 512);

            socket.join(`voice:${roomName}`);
            socket.join(sUserId); // own-userId room: used for direct (cross-worker) signaling delivery
            socket.data.voiceUserId = sUserId;
            socket.data.voiceProfile = { username: safeName, avatar: safeAvatar };
            socket.userId = sUserId;
            socket.username = safeName;
            socket._voiceUserId = sUserId;
            socket._voiceRooms.add(roomName);

            await pruneStaleParticipants(roomName);

            const roomData = ensureLocalRoom(roomName);
            if (roomData.cleanupTimeout) {
                clearTimeout(roomData.cleanupTimeout);
                roomData.cleanupTimeout = null;
            }
            const startedAt = (await getRoomStartedAt(roomName, true)) || roomData.startedAt;
            roomData.startedAt = startedAt;

            let existedInRedis = false;
            let previous = null;
            if (pubClient) {
                try {
                    const raw = await pubClient.hget(roomKey(roomName), sUserId);
                    if (raw) { existedInRedis = true; previous = JSON.parse(raw); }
                } catch { /* ignore */ }
            }
            const isNewJoin = !existedInRedis && !roomData.participants.has(sUserId);

            const joinedAt = previous?.joinedAt || Date.now();
            roomData.participants.set(sUserId, {
                socketId: socket.id,
                username: safeName,
                avatar: safeAvatar,
                joinedAt,
                isMuted: previous ? previous.isMuted !== false : true,
                isCameraOn: previous ? !!previous.isCameraOn : false,
                isScreenSharing: previous ? !!previous.isScreenSharing : false
            });

            if (pubClient) {
                try {
                    await pubClient.hset(
                        roomKey(roomName),
                        sUserId,
                        JSON.stringify({
                            userId: sUserId,
                            socketId: socket.id,
                            username: safeName,
                            avatar: safeAvatar,
                            joinedAt,
                            isMuted: previous ? previous.isMuted !== false : true,
                            isCameraOn: previous ? !!previous.isCameraOn : false,
                            isScreenSharing: previous ? !!previous.isScreenSharing : false
                        })
                    );
                    await pubClient.expire(roomKey(roomName), ROOM_KEY_TTL_SEC);
                } catch (err) {
                    console.error('Redis voiceroom join error:', err);
                }
            }

            socket.emit('voice:chat-history', await loadChatHistory(roomName));

            const participants = await broadcastParticipants(roomName);

            // Ensure late-joining client (especially mobile Capacitor) directly receives the live Watch Party snapshot
            try {
                const liveWp = await loadWatchParty(roomName, true);
                if (liveWp && liveWp.url) {
                    socket.emit('voice:watch-state', liveWp);
                }
            } catch (wpEmitErr) {
                console.error('[Watch Party] Failed to emit initial watch-state on join:', wpEmitErr.message);
            }

            if (isNewJoin) {
                io.to(`voice:${roomName}`).emit('voice:user-joined', {
                    userId: sUserId,
                    username: safeName,
                    avatar: safeAvatar
                });
                logActivity({
                    user: sUserId,
                    username: safeName,
                    action: 'ROOM_JOIN',
                    category: 'rtc',
                    portal: parsedRoom.portalId,
                    details: {
                        roomName,
                        portalId: parsedRoom.portalId,
                        channelId: parsedRoom.channelId,
                        participantCount: participants?.length || 1
                    }
                });

                // Canlı oda/kanal içerisinde aktif Watch Party veya Video/Film yayını varsa STREAM_WATCH kaydet
                try {
                    const activeWp = await loadWatchParty(roomName);
                    if (activeWp && activeWp.url) {
                        logActivity({
                            user: sUserId,
                            username: safeName,
                            action: 'STREAM_WATCH',
                            category: 'rtc',
                            portal: parsedRoom.portalId,
                            details: {
                                roomName,
                                portalId: parsedRoom.portalId,
                                channelId: parsedRoom.channelId,
                                url: activeWp.url,
                                title: activeWp.title || 'Canlı Video/Film Yayını',
                                isLive: !!activeWp.isLive
                            }
                        });
                    }
                } catch (wpErr) {}
            }

            console.log(`🎙️ User ${safeName} joined voice room ${roomName} (${participants.length} participants)`);
        };

        socket.on('voice:join', (payload) => {
            // Chain joins so that every later event for this socket observes a fully registered participant.
            socket._joining = (socket._joining || Promise.resolve())
                .then(() => doJoin(payload))
                .catch((err) => console.error('[Voice] join failed:', err));
        });

        // ─── Leave Voice Channel ───
        socket.on('voice:leave', async (payload) => {
            await settle();
            const roomName = payload?.roomName;
            if (!parseRoomName(roomName) || !myId()) return;
            await removeParticipant(roomName, myId(), socket.id);
            socket.leave(`voice:${roomName}`);
            socket._voiceRooms?.delete(roomName);
        });

        // ─── Raise Hand (Stage Mode) ───
        socket.on('voice:raise-hand', async (payload) => {
            await settle();
            const { roomName, raised } = payload || {};
            if (!inRoom(roomName) || !limits.state()) return;
            const profile = socket.data.voiceProfile || {};
            io.to(`voice:${roomName}`).emit('voice:raise-hand', {
                userId: myId(),
                username: profile.username || '',
                avatar: profile.avatar || '',
                raised: raised !== false,
                timestamp: Date.now()
            });
        });

        // ─── Moderation (admins / owner only) ───
        const requireModerator = async (roomName) => {
            if (!inRoom(roomName) || !limits.moderation()) return false;
            const parsed = parseRoomName(roomName);
            return isPortalModerator(parsed.portalId, myId());
        };

        socket.on('voice:chat-mode-toggle', async (payload) => {
            await settle();
            const { roomName, restricted } = payload || {};
            if (!(await requireModerator(roomName))) return;
            io.to(`voice:${roomName}`).emit('voice:chat-mode', { restricted: !!restricted });
        });

        socket.on('voice:grant-speak', async (payload) => {
            await settle();
            const { roomName, targetUserId } = payload || {};
            if (typeof targetUserId !== 'string' && typeof targetUserId !== 'number') return;
            if (!(await requireModerator(roomName))) return;
            io.to(`voice:${roomName}`).emit('voice:permissions-updated', { userId: String(targetUserId), canPublish: true });
        });

        socket.on('voice:revoke-speak', async (payload) => {
            await settle();
            const { roomName, targetUserId } = payload || {};
            if (typeof targetUserId !== 'string' && typeof targetUserId !== 'number') return;
            if (!(await requireModerator(roomName))) return;
            io.to(`voice:${roomName}`).emit('voice:permissions-updated', { userId: String(targetUserId), canPublish: false });
        });

        // ─── Broadcast Participant State (Mute/Camera/Screen) ───
        socket.on('voice:state-update', async (payload) => {
            await settle();
            const { roomName } = payload || {};
            if (!inRoom(roomName) || !limits.state()) return;
            const sUserId = myId();
            const isMuted = payload.isMuted !== false;
            const isCameraOn = !!payload.isCameraOn;
            const isScreenSharing = !!payload.isScreenSharing;

            const currentRoom = voiceRooms.get(roomName);
            const participant = currentRoom?.participants?.get(sUserId);
            const prevMuted = participant ? (participant.isMuted !== false) : null;
            const prevCamera = participant ? (!!participant.isCameraOn) : null;
            const prevScreen = participant ? (!!participant.isScreenSharing) : null;

            if (participant) {
                if (participant.socketId && participant.socketId !== socket.id) return;
                participant.isMuted = isMuted;
                participant.isCameraOn = isCameraOn;
                participant.isScreenSharing = isScreenSharing;
            }

            // Emit immediately for 0ms mic/camera/screen toggle feedback across the room
            io.to(`voice:${roomName}`).emit('voice:state-update', { userId: sUserId, isMuted, isCameraOn, isScreenSharing });

            if (pubClient) {
                try {
                    const raw = await pubClient.hget(roomKey(roomName), sUserId);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.socketId && parsed.socketId !== socket.id) return;
                        parsed.isMuted = isMuted;
                        parsed.isCameraOn = isCameraOn;
                        parsed.isScreenSharing = isScreenSharing;
                        await pubClient.hset(roomKey(roomName), sUserId, JSON.stringify(parsed));
                    }
                } catch (err) {
                    console.error('Error updating state in Redis:', err.message);
                }
            }

            // Detect any state change: mic toggle, camera toggle, or screen share toggle
            const hasChanged = (prevMuted !== null && prevMuted !== isMuted) ||
                               (prevCamera !== null && prevCamera !== isCameraOn) ||
                               (prevScreen !== null && prevScreen !== isScreenSharing);

            if (hasChanged || isCameraOn || isScreenSharing) {
                const parsed = parseRoomName(roomName);
                const summaries = [];
                if (prevMuted !== null && prevMuted !== isMuted) {
                    summaries.push(!isMuted ? '🎙️ Mikrofon açıldı' : '🔇 Mikrofon kapatıldı');
                }
                if (prevCamera !== null && prevCamera !== isCameraOn) {
                    summaries.push(isCameraOn ? '🎥 Kamera açıldı' : '📷 Kamera kapatıldı');
                }
                if (prevScreen !== null && prevScreen !== isScreenSharing) {
                    summaries.push(isScreenSharing ? '🖥️ Ekran paylaşımı başlatıldı' : '⏹️ Ekran paylaşımı durduruldu');
                }

                logActivity({
                    user: sUserId,
                    username: socket.data?.voiceProfile?.username || socket.username || sUserId,
                    action: 'STREAM_TOGGLE',
                    category: 'rtc',
                    portal: parsed?.portalId,
                    channel: parsed?.channelId,
                    targetType: 'VoiceRoom',
                    details: {
                        roomName,
                        portalId: parsed?.portalId,
                        channelId: parsed?.channelId,
                        isCameraOn: !!isCameraOn,
                        isScreenSharing: !!isScreenSharing,
                        isMuted: !!isMuted,
                        summary: summaries.join(' | ') || (isCameraOn ? '🎥 Kamera aktif' : (isScreenSharing ? '🖥️ Ekran paylaşımı aktif' : 'Canlı yayın durumu güncellendi'))
                    }
                });
            }
        });

        // ─── Broadcast Chat Messages (sender identity is server side) ───
        socket.on('voice:chat-message', async (payload) => {
            await settle();
            const { id, roomName } = payload || {};
            if (!inRoom(roomName) || !limits.chat()) return;
            const text = clampString(payload.text, MAX_CHAT_LENGTH).trim();
            if (!text) return;

            const now = Date.now();
            const last = socket._lastChat;
            if (last && last.text === text && now - last.at < 800) return; // duplicate burst
            socket._lastChat = { text, at: now };

            const profile = socket.data.voiceProfile || {};
            const msg = {
                id: clampString(typeof id === 'string' ? id : '', 64) || `${now}-${Math.random().toString(36).substring(2, 9)}`,
                text,
                senderName: profile.username || '',
                senderId: myId(),
                timestamp: new Date(now).toISOString()
            };
            await pushChatMessage(roomName, msg);
            io.to(`voice:${roomName}`).emit('voice:chat-message', msg);
        });

        // ─── Watch Party (YouTube / Stream Sync) ───
        socket.on('voice:watch-start', async (payload) => {
            await settle();
            const { roomName, url, isLive, subtitles, title } = payload || {};
            if (!inRoom(roomName) || !limits.watch()) return;
            if (typeof url !== 'string' || !url.trim() || url.length > MAX_URL_LENGTH) return;

            const cleanSubtitles = Array.isArray(subtitles)
                ? subtitles.slice(0, MAX_SHARED_SUBTITLES).filter((s) => s && typeof s === 'object')
                : [];

            const now = Date.now();
            const watchPartyState = normalizeWatchPartyState({
                roomName,
                url: url.trim(),
                isPlaying: false,
                currentTime: 0,
                lastUpdated: now,
                serverTimestamp: now,
                isLive: !!isLive,
                subtitles: cleanSubtitles,
                title: clampString(title, MAX_TITLE_LENGTH),
                senderId: myId()
            }, false);
            await withRoomLock(roomName, async () => {
                await saveWatchParty(roomName, watchPartyState);
                await stopState.clear(roomName); // a brand-new video invalidates any pending stop request
            });
            io.to(`voice:${roomName}`).emit('voice:watch-stop-vote-clear');
            io.to(`voice:${roomName}`).emit('voice:watch-state', watchPartyState);
            console.log(`[Watch Party] started in ${roomName} (isLive: ${!!isLive})`);

            const parsed = parseRoomName(roomName);
            logActivity({
                user: myId(),
                username: socket.data?.voiceProfile?.username || socket.username || 'Kullanıcı',
                action: 'WP_START',
                category: 'rtc',
                portal: parsed?.portalId,
                details: { roomName, url: url.trim(), title: clampString(title, MAX_TITLE_LENGTH), isLive: !!isLive }
            });
        });

        const registerPlaybackEvent = (eventName, apply) => {
            socket.on(eventName, async (payload) => {
                const { roomName } = payload || {};
                if (!inRoom(roomName) || !limits.watch()) return;
                const time = sanitizeTime(payload.time);
                if (time === null) return;
                const now = Date.now();
                const senderId = myId();
                const cmdId = clampString(payload?.cmdId, 64);

                // ZERO-LATENCY BROADCAST: Emit to all room peers in 0ms before awaiting Redis lock/write!
                io.to(`voice:${roomName}`).emit(eventName, { time, serverTimestamp: now, senderId, cmdId });

                // Update local cache immediately
                const localWp = voiceRooms.get(roomName)?.watchParty;
                if (localWp) {
                    apply(localWp, time);
                    localWp.lastUpdated = now;
                    localWp.serverTimestamp = now;
                }

                // Persist to Redis asynchronously
                const updated = await mutateWatchParty(roomName, (wp) => {
                    apply(wp, time);
                    wp.lastUpdated = now;
                    wp.serverTimestamp = now;
                    return wp;
                });
                if (!updated) return;

                const parsed = parseRoomName(roomName);
                const actionName = eventName === 'voice:watch-play' ? 'WP_PLAY' : (eventName === 'voice:watch-pause' ? 'WP_PAUSE' : 'WP_SEEK');
                logActivity({
                    user: senderId,
                    username: socket.data?.voiceProfile?.username || socket.username || 'Kullanıcı',
                    action: actionName,
                    category: 'rtc',
                    portal: parsed?.portalId,
                    details: { roomName, time }
                });
            });
        };
        registerPlaybackEvent('voice:watch-play', (wp, time) => { wp.isPlaying = true; wp.currentTime = time; });
        registerPlaybackEvent('voice:watch-pause', (wp, time) => { wp.isPlaying = false; wp.currentTime = time; });
        registerPlaybackEvent('voice:watch-seek', (wp, time) => { wp.currentTime = time; });

        // Authoritative time-sync endpoint: clients call this after loading/buffering a movie or periodically
        // to compensate for lost loading time and stay locked to the room master clock.
        socket.on('voice:watch-request-sync', async (payload) => {
            await settle();
            const { roomName } = payload || {};
            if (!inRoom(roomName)) return;
            try {
                const wp = await loadWatchParty(roomName, true);
                if (!wp || !wp.url) return;
                socket.emit('voice:watch-sync', {
                    roomName,
                    url: wp.url,
                    currentTime: wp.currentTime || 0,
                    isPlaying: !!wp.isPlaying,
                    isLive: !!wp.isLive,
                    serverTimestamp: wp.serverTimestamp || Date.now()
                });
            } catch (err) {
                console.error('[Watch Party] request-sync error:', err.message);
            }
        });

        // ─── Watch Party Subtitle Sync ───
        socket.on('voice:watch-subtitle', async (payload) => {
            await settle();
            const { roomName, subtitle } = payload || {};
            if (!inRoom(roomName) || !limits.watch()) return;
            if (!subtitle || typeof subtitle !== 'object') return;
            if (subtitle.type === 'off') return; // Subtitle off is strictly individual per-user, never broadcast room-wide
            if (typeof subtitle.rawContent === 'string' && subtitle.rawContent.length > MAX_SUBTITLE_CHARS) return;

            const clean = {
                type: clampString(subtitle.type, 16) || (subtitle.rawContent ? 'custom' : 'off'),
                label: clampString(subtitle.label, 120) || 'Altyazı',
                rawContent: typeof subtitle.rawContent === 'string' ? subtitle.rawContent : '',
                lang: clampString(subtitle.lang, 12) || 'tr',
                file: clampString(subtitle.file, MAX_URL_LENGTH)
            };

            const now = Date.now();
            const updated = await mutateWatchParty(roomName, (wp) => {
                wp.activeSubtitle = clean;
                if (!Array.isArray(wp.sharedSubtitles)) wp.sharedSubtitles = [];
                if (clean.label && clean.rawContent) {
                    const idx = wp.sharedSubtitles.findIndex((s) => s.label === clean.label);
                    if (idx >= 0) wp.sharedSubtitles[idx] = clean;
                    else wp.sharedSubtitles.push(clean);
                    if (wp.sharedSubtitles.length > MAX_SHARED_SUBTITLES) {
                        wp.sharedSubtitles = wp.sharedSubtitles.slice(-MAX_SHARED_SUBTITLES);
                    }
                }
                wp.lastUpdated = now;
                return wp;
            });
            // If watchParty did not exist, persist clean state to prevent lost subtitles
            if (!updated) {
                const fallbackWp = {
                    roomName,
                    url: '',
                    isPlaying: false,
                    currentTime: 0,
                    activeSubtitle: clean,
                    sharedSubtitles: clean.rawContent ? [clean] : [],
                    lastUpdated: now
                };
                await saveWatchParty(roomName, fallbackWp);
            }

            io.to(`voice:${roomName}`).emit('voice:watch-subtitle', {
                roomName,
                subtitle: clean,
                senderId: myId() || socket.id,
                senderName: socket.data.voiceProfile?.username || socket.username || 'Bir kullanıcı'
            });
        });

        // ─── Watch Party Stop Consensus (configurable & cluster safe) ───
        const castStopVote = async (roomName, fallbackUserId = null, fallbackUsername = null) => {
            if (!inRoom(roomName) || !limits.vote()) return;
            const uId = myId() || (fallbackUserId ? String(fallbackUserId).trim() : null);
            if (!uId) return;
            const uName = fallbackUsername || socket.data.voiceProfile?.username || socket.username || 'Bir kullanıcı';
            await withRoomLock(roomName, async () => {
                const wp = await loadWatchParty(roomName);
                if (!wp) return;

                // Check if there is already an existing stop request in progress
                let currentRequest = await stopState.getRequest(roomName);

                if (!currentRequest) {
                    // This user is initiating a brand new stop request
                    const startedAt = Date.now();
                    const newReq = {
                        requesterName: uName,
                        requesterId: uId,
                        startedAt
                    };
                    const res = await stopState.ensureRequest(roomName, newReq);
                    currentRequest = res.request || newReq;
                    if (res.created) {
                        scheduleStopVoteExpiry(roomName, currentRequest.startedAt);
                    }
                }

                // Add current user's affirmative vote
                await stopState.addVote(roomName, uId, { 
                    userId: uId, 
                    socketId: socket.id, 
                    username: uName,
                    isRequester: String(uId) === String(currentRequest?.requesterId)
                });

                // Also guarantee that the original requester's affirmative vote is registered
                if (currentRequest?.requesterId && String(currentRequest.requesterId) !== String(uId)) {
                    await stopState.addVote(roomName, currentRequest.requesterId, {
                        userId: String(currentRequest.requesterId).trim(),
                        username: currentRequest.requesterName || 'Kapatma Başlatan',
                        isRequester: true
                    });
                }

                await evaluateStopVote(roomName);
            });
        };

        // Legacy direct-stop event is routed through the same consensus logic
        socket.on('voice:watch-stop', async (payload) => {
            await settle();
            await castStopVote(payload?.roomName, payload?.userId, payload?.username);
        });

        socket.on('voice:watch-stop-vote', async (payload) => {
            await settle();
            await castStopVote(payload?.roomName, payload?.userId, payload?.username);
        });

        socket.on('voice:watch-stop-cancel', async (payload) => {
            await settle();
            const roomName = payload?.roomName;
            if (!inRoom(roomName) || !limits.vote()) return;
            await stopState.clear(roomName);
            io.to(`voice:${roomName}`).emit('voice:watch-stop-vote-clear');
            console.log(`[Watch Party] Stop vote cancelled in ${roomName}`);
        });

        // ─── High-Precision NTP Clock Sync ───
        socket.on('voice:time-ping', (clientSendTime, callback) => {
            if (typeof callback === 'function') {
                callback({ clientSendTime, serverTime: Date.now() });
            }
        });

        // ─── WebRTC Signaling (0ms room-scoped relay) ───
        const canSignal = (roomName, targetUserId) => {
            if (!inRoom(roomName) || (typeof targetUserId !== 'string' && typeof targetUserId !== 'number')) return null;
            const target = String(targetUserId).trim();
            if (!target || target.length > 64 || target === myId()) return null;
            return target;
        };

        socket.on('voice:video-offer', (payload) => {
            const { roomName, targetUserId, sdp } = payload || {};
            if (!limits.signal() || typeof sdp !== 'string' || sdp.length > MAX_SDP_LENGTH) return;
            const target = canSignal(roomName, targetUserId);
            if (!target) return;
            io.to(target).emit('voice:video-offer', { senderId: myId(), sdp });
        });

        socket.on('voice:video-answer', (payload) => {
            const { roomName, targetUserId, sdp } = payload || {};
            if (!limits.signal() || typeof sdp !== 'string' || sdp.length > MAX_SDP_LENGTH) return;
            const target = canSignal(roomName, targetUserId);
            if (!target) return;
            io.to(target).emit('voice:video-answer', { senderId: myId(), sdp });
        });

        socket.on('voice:new-ice-candidate', (payload) => {
            const { roomName, targetUserId, candidate } = payload || {};
            if (!limits.signal() || !candidate || typeof candidate !== 'object') return;
            try {
                if (JSON.stringify(candidate).length > MAX_CANDIDATE_JSON) return;
            } catch { return; }
            const target = canSignal(roomName, targetUserId);
            if (!target) return;
            io.to(target).emit('voice:new-ice-candidate', { senderId: myId(), candidate });
        });

        socket.on('voice:ice-restart-request', async (payload) => {
            await settle();
            const { roomName, targetUserId, hard } = payload || {};
            if (!limits.signal()) return;
            const target = await canSignal(roomName, targetUserId);
            if (!target) return;
            io.to(target).emit('voice:ice-restart-request', { senderId: myId(), hard: !!hard });

            const parsed = parseRoomName(roomName);
            logActivity({
                user: myId(),
                username: socket.data?.voiceProfile?.username || socket.username || 'Kullanıcı',
                action: 'ICE_CONNECTION_FAILED',
                category: 'rtc',
                severity: 'warning',
                portal: parsed?.portalId,
                details: { roomName, targetUserId: target, hard: !!hard }
            });
        });

        // ─── Cleanup on Disconnect ───
        socket.on('disconnect', () => {
            const uid = myId();
            if (socket._voiceRooms && uid) {
                for (const roomName of socket._voiceRooms) {
                    removeParticipant(roomName, uid, socket.id).catch((err) =>
                        console.error('[Voice] removeParticipant on disconnect failed:', err.message)
                    );
                }
            }
        });
    });
};

// ─── Exports for other modules ──────────────────────────────────────────────
function getParticipantList(roomName) {
    const roomData = voiceRooms.get(roomName);
    if (!roomData || !roomData.participants) return [];

    return Array.from(roomData.participants.entries()).map(([userId, data]) => ({
        userId,
        username: data.username,
        avatar: data.avatar,
        joinedAt: data.joinedAt,
        isMuted: data.isMuted !== false,
        isCameraOn: !!data.isCameraOn,
        isScreenSharing: !!data.isScreenSharing
    }));
}

export const getVoiceRoomData = (roomName) => voiceRooms.get(roomName);

/** Cluster-wide room start time (null when the room is not active). */
export const getVoiceRoomStartedAt = (roomName) => getRoomStartedAt(roomName, false);

export const getVoiceRoomParticipantsFromRedis = async (roomName) => {
    if (pubClient) {
        try {
            const hashData = await pubClient.hgetall(roomKey(roomName));
            if (hashData && Object.keys(hashData).length > 0) {
                return Object.values(hashData).map((str) => {
                    try {
                        const parsed = JSON.parse(str);
                        return {
                            userId: String(parsed.userId),
                            username: parsed.username,
                            avatar: parsed.avatar || '',
                            joinedAt: parsed.joinedAt,
                            isMuted: parsed.isMuted !== false,
                            isCameraOn: !!parsed.isCameraOn,
                            isScreenSharing: !!parsed.isScreenSharing
                        };
                    } catch {
                        return null;
                    }
                }).filter(Boolean);
            }
            return [];
        } catch (err) {
            console.error('Error fetching voiceroom from Redis:', err);
        }
    }
    return getParticipantList(roomName);
};
export const getActiveVoiceRooms = () => Array.from(voiceRooms.keys());
