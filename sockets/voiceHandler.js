/**
 * Voice Channel Socket.IO Handler
 * Manages real-time signaling for voice/video channels:
 * - Join/leave voice rooms
 * - Raise hand requests
 * - Permission grants/revokes
 * - Participant presence tracking
 */

// Track voice channel participants: roomName -> Map<userId, { socketId, username, avatar }>
// Structure:
// voiceRooms = new Map([
//    ["roomA", { participants: Map<userId, data>, startedAt: timestamp }]
// ])
import { pubClient } from './redisAdapter.js';

// Track voice channel participants: roomName -> Map<userId, { socketId, username, avatar }>
// Structure:
// voiceRooms = new Map([
//    ["roomA", { participants: Map<userId, data>, startedAt: timestamp }]
// ])
const voiceRooms = new Map();

export const initializeVoiceHandler = (io) => {
    io.on('connection', (socket) => {
        // ─── Join Voice Channel ───
        socket.on('voice:join', async ({ roomName, userId, username, avatar }) => {
            if (!roomName || !userId) return;

            const sUserId = String(userId);
            socket.join(`voice:${roomName}`);
            socket.join(sUserId); // Ensure socket is joined to its own userId room for direct cross-worker signaling

            // Track in Redis for multi-worker synchronization
            if (pubClient) {
                try {
                    await pubClient.hset(
                        `voiceroom:${roomName}`,
                        sUserId,
                        JSON.stringify({
                            userId: sUserId,
                            socketId: socket.id,
                            username,
                            avatar: avatar || '',
                            joinedAt: Date.now()
                        })
                    );
                } catch (err) {
                    console.error('Redis voiceroom join error:', err);
                }
            }

            // Track participant in local worker memory
            if (!voiceRooms.has(roomName)) {
                voiceRooms.set(roomName, {
                    participants: new Map(),
                    startedAt: Date.now(),
                    chatHistory: []
                });
            } else {
                const roomData = voiceRooms.get(roomName);
                if (roomData.cleanupTimeout) {
                    clearTimeout(roomData.cleanupTimeout);
                    roomData.cleanupTimeout = null;
                    console.log(`[Voice Room] Graceful cleanup timer cancelled for ${roomName} due to user rejoin.`);
                }
            }
            const roomData = voiceRooms.get(roomName);
            roomData.participants.set(sUserId, {
                socketId: socket.id,
                username,
                avatar: avatar || '',
                joinedAt: Date.now(),
                isMuted: true,
                isCameraOn: false,
                isScreenSharing: false
            });
            console.log(`[Backend Debug] voice:join registration: userId: ${sUserId} successfully mapped to socketId: ${socket.id} in room: ${roomName}`);

            // Send voice chat history to the newly joined client
            socket.emit('voice:chat-history', roomData.chatHistory || []);

            // Store room info on socket for cleanup on disconnect
            if (!socket._voiceRooms) socket._voiceRooms = new Set();
            socket._voiceRooms.add(roomName);
            socket._voiceUserId = sUserId;

            // Get active watchParty from Redis to ensure new users joining do not wipe out active streams
            let activeWatchParty = roomData.watchParty || null;
            if (pubClient) {
                try {
                    const wpStr = await pubClient.get(`voiceroom:${roomName}:watchparty`);
                    if (wpStr) {
                        activeWatchParty = JSON.parse(wpStr);
                        roomData.watchParty = activeWatchParty;
                    }
                } catch (err) {
                    console.error('Error fetching watchParty from Redis:', err);
                }
            }

            // Broadcast updated participant list and room start time from Redis across all cluster workers
            const participants = await getVoiceRoomParticipantsFromRedis(roomName);
            io.to(`voice:${roomName}`).emit('voice:participants', {
                roomName,
                participants,
                startedAt: roomData.startedAt,
                serverNow: Date.now(),
                watchParty: activeWatchParty
            });

            // Emit explicit join event for notifications
            io.to(`voice:${roomName}`).emit('voice:user-joined', {
                userId: sUserId,
                username,
                avatar: avatar || '',
            });

            console.log(`🎙️ User ${username} joined voice room ${roomName} (${participants.length} participants)`);
        });

        // ─── Leave Voice Channel ───
        socket.on('voice:leave', async ({ roomName, userId }) => {
            if (!roomName || !userId) return;
            await removeParticipant(io, roomName, userId);
            socket.leave(`voice:${roomName}`);
        });

        {/* ─── Raise Hand (Stage Mode) ─── */ }
        socket.on('voice:raise-hand', ({ roomName, userId, username, avatar, raised }) => {
            if (!roomName || !userId) return;

            io.to(`voice:${roomName}`).emit('voice:raise-hand', {
                userId,
                username,
                avatar: avatar || '',
                raised: raised !== false,
                timestamp: Date.now(),
            });

            console.log(`✋ User ${username} ${raised !== false ? 'raised' : 'lowered'} hand in ${roomName}`);
        });

        // ─── Toggle Chat Restrictions ───
        socket.on('voice:chat-mode-toggle', ({ roomName, restricted }) => {
            if (!roomName) return;

            io.to(`voice:${roomName}`).emit('voice:chat-mode', { restricted });
            console.log(`💬 Chat mode toggled in ${roomName}: restricted=${restricted}`);
        });

        // ─── Grant Speak Permission (Moderator → Listener) ───
        socket.on('voice:grant-speak', ({ roomName, targetUserId }) => {
            if (!roomName || !targetUserId) return;

            io.to(`voice:${roomName}`).emit('voice:permissions-updated', {
                userId: targetUserId,
                canPublish: true,
            });

            console.log(`🎤 Speak granted to ${targetUserId} in ${roomName}`);
        });

        // ─── Revoke Speak Permission ───
        socket.on('voice:revoke-speak', ({ roomName, targetUserId }) => {
            if (!roomName || !targetUserId) return;

            io.to(`voice:${roomName}`).emit('voice:permissions-updated', {
                userId: targetUserId,
                canPublish: false,
            });

            console.log(`🔇 Speak revoked from ${targetUserId} in ${roomName}`);
        });

        // ─── Broadcast Participant State (Mute/Camera/Screen) ───
        socket.on('voice:state-update', async ({ roomName, userId, isMuted, isCameraOn, isScreenSharing }) => {
            if (!roomName || !userId) return;
            const sUserId = String(userId);
            
            const roomData = voiceRooms.get(roomName);
            const participant = roomData?.participants?.get(sUserId);
            if (participant) {
                participant.isMuted = isMuted;
                participant.isCameraOn = isCameraOn;
                participant.isScreenSharing = isScreenSharing;
            }

            if (pubClient) {
                try {
                    const raw = await pubClient.hget(`voiceroom:${roomName}`, sUserId);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        parsed.isMuted = isMuted;
                        parsed.isCameraOn = isCameraOn;
                        parsed.isScreenSharing = isScreenSharing;
                        await pubClient.hset(`voiceroom:${roomName}`, sUserId, JSON.stringify(parsed));
                    }
                } catch (err) {
                    console.error('Error updating state in Redis:', err);
                }
            }

            io.to(`voice:${roomName}`).emit('voice:state-update', {
                userId: sUserId,
                isMuted,
                isCameraOn,
                isScreenSharing
            });
        });

        // ─── Broadcast Chat Messages ───
        socket.on('voice:chat-message', ({ roomName, text, senderName, senderId }) => {
            if (!roomName) return;
            
            const roomData = voiceRooms.get(roomName);
            if (roomData) {
                if (!roomData.chatHistory) roomData.chatHistory = [];
                roomData.chatHistory.push({
                    text,
                    senderName,
                    senderId,
                    timestamp: new Date().toISOString()
                });
                if (roomData.chatHistory.length > 100) {
                    roomData.chatHistory.shift();
                }
            }

            io.to(`voice:${roomName}`).emit('voice:chat-message', {
                text,
                senderName,
                senderId
            });
        });

        // ─── Watch Party (YouTube / Stream Sync) ───
        socket.on('voice:watch-start', async ({ roomName, url, isLive }) => {
            if (!roomName) return;
            const now = Date.now();
            const watchPartyState = {
                url,
                isPlaying: false,
                currentTime: 0,
                lastUpdated: now,
                serverTimestamp: now,
                isLive: !!isLive,
                senderId: socket.userId
            };
            const roomData = voiceRooms.get(roomName);
            if (roomData) {
                roomData.watchParty = watchPartyState;
            }
            if (pubClient) {
                try {
                    await pubClient.set(`voiceroom:${roomName}:watchparty`, JSON.stringify(watchPartyState));
                } catch (err) {
                    console.error('Error saving watchParty to Redis:', err);
                }
            }
            io.to(`voice:${roomName}`).emit('voice:watch-state', watchPartyState);
            console.log(`[Watch Party] started in ${roomName} with URL: ${url} (isLive: ${isLive})`);
        });

        socket.on('voice:watch-play', async ({ roomName, time }) => {
            if (!roomName) return;
            const now = Date.now();
            const roomData = voiceRooms.get(roomName);
            if (roomData && roomData.watchParty) {
                roomData.watchParty.isPlaying = true;
                roomData.watchParty.currentTime = time;
                roomData.watchParty.lastUpdated = now;
                roomData.watchParty.serverTimestamp = now;
            }
            if (pubClient) {
                try {
                    const currentStr = await pubClient.get(`voiceroom:${roomName}:watchparty`);
                    if (currentStr) {
                        const wp = JSON.parse(currentStr);
                        wp.isPlaying = true;
                        wp.currentTime = time;
                        wp.lastUpdated = now;
                        wp.serverTimestamp = now;
                        await pubClient.set(`voiceroom:${roomName}:watchparty`, JSON.stringify(wp));
                    }
                } catch (err) {}
            }
            socket.to(`voice:${roomName}`).emit('voice:watch-play', { time, serverTimestamp: now, senderId: socket.userId });
            console.log(`[Watch Party] play event in ${roomName} at time: ${time}`);
        });

        socket.on('voice:watch-pause', async ({ roomName, time }) => {
            if (!roomName) return;
            const now = Date.now();
            const roomData = voiceRooms.get(roomName);
            if (roomData && roomData.watchParty) {
                roomData.watchParty.isPlaying = false;
                roomData.watchParty.currentTime = time;
                roomData.watchParty.lastUpdated = now;
                roomData.watchParty.serverTimestamp = now;
            }
            if (pubClient) {
                try {
                    const currentStr = await pubClient.get(`voiceroom:${roomName}:watchparty`);
                    if (currentStr) {
                        const wp = JSON.parse(currentStr);
                        wp.isPlaying = false;
                        wp.currentTime = time;
                        wp.lastUpdated = now;
                        wp.serverTimestamp = now;
                        await pubClient.set(`voiceroom:${roomName}:watchparty`, JSON.stringify(wp));
                    }
                } catch (err) {}
            }
            socket.to(`voice:${roomName}`).emit('voice:watch-pause', { time, serverTimestamp: now, senderId: socket.userId });
            console.log(`[Watch Party] pause event in ${roomName} at time: ${time}`);
        });

        socket.on('voice:watch-seek', async ({ roomName, time }) => {
            if (!roomName) return;
            const now = Date.now();
            const roomData = voiceRooms.get(roomName);
            if (roomData && roomData.watchParty) {
                roomData.watchParty.currentTime = time;
                roomData.watchParty.lastUpdated = now;
                roomData.watchParty.serverTimestamp = now;
            }
            if (pubClient) {
                try {
                    const currentStr = await pubClient.get(`voiceroom:${roomName}:watchparty`);
                    if (currentStr) {
                        const wp = JSON.parse(currentStr);
                        wp.currentTime = time;
                        wp.lastUpdated = now;
                        wp.serverTimestamp = now;
                        await pubClient.set(`voiceroom:${roomName}:watchparty`, JSON.stringify(wp));
                    }
                } catch (err) {}
            }
            socket.to(`voice:${roomName}`).emit('voice:watch-seek', { time, serverTimestamp: now, senderId: socket.userId });
            console.log(`[Watch Party] seek event in ${roomName} to time: ${time}`);
        });

        socket.on('voice:watch-stop', async ({ roomName }) => {
            if (!roomName) return;
            const roomData = voiceRooms.get(roomName);
            if (roomData) {
                roomData.watchParty = null;
            }
            if (pubClient) {
                try {
                    await pubClient.del(`voiceroom:${roomName}:watchparty`);
                } catch (err) {}
            }
            io.to(`voice:${roomName}`).emit('voice:watch-stop');
            console.log(`[Watch Party] stopped in ${roomName}`);
        });

        // ─── High-Precision NTP Clock Sync ───
        socket.on('voice:time-ping', (clientSendTime, callback) => {
            if (typeof callback === 'function') {
                callback({ clientSendTime, serverTime: Date.now() });
            }
        });

        // ─── WebRTC Signaling ───
        socket.on('voice:video-offer', ({ roomName, targetUserId, sdp }) => {
            if (!roomName || !targetUserId) return;
            const sTargetId = String(targetUserId);
            const senderId = socket._voiceUserId || socket.id;
            console.log(`[Socket Backend] video-offer from ${senderId} to ${sTargetId} in room ${roomName}`);
            
            // Broadcast to the target user's direct room (works across all cluster workers via Redis)
            io.to(sTargetId).emit('voice:video-offer', {
                senderId,
                sdp
            });
        });

        socket.on('voice:video-answer', ({ roomName, targetUserId, sdp }) => {
            if (!roomName || !targetUserId) return;
            const sTargetId = String(targetUserId);
            const senderId = socket._voiceUserId || socket.id;
            console.log(`[Socket Backend] video-answer from ${senderId} to ${sTargetId} in room ${roomName}`);
            
            io.to(sTargetId).emit('voice:video-answer', {
                senderId,
                sdp
            });
        });

        socket.on('voice:new-ice-candidate', ({ roomName, targetUserId, candidate }) => {
            if (!roomName || !targetUserId) return;
            const sTargetId = String(targetUserId);
            const senderId = socket._voiceUserId || socket.id;
            console.log(`[Socket Backend] new-ice-candidate from ${senderId} to ${sTargetId} in room ${roomName}`);
            
            io.to(sTargetId).emit('voice:new-ice-candidate', {
                senderId,
                candidate
            });
        });

        socket.on('voice:ice-restart-request', ({ roomName, targetUserId }) => {
            if (!roomName || !targetUserId) return;
            const sTargetId = String(targetUserId);
            const senderId = socket._voiceUserId || socket.id;
            console.log(`[Socket Backend] ice-restart-request from ${senderId} to ${sTargetId} in room ${roomName}`);

            io.to(sTargetId).emit('voice:ice-restart-request', {
                senderId
            });
        });

        // ─── Cleanup on Disconnect ───
        socket.on('disconnect', () => {
            if (socket._voiceRooms && socket._voiceUserId) {
                for (const roomName of socket._voiceRooms) {
                    removeParticipant(io, roomName, socket._voiceUserId);
                }
            }
        });
    });
};

// ─── Helper Functions ───

async function removeParticipant(io, roomName, userId) {
    const sUserId = String(userId);
    if (pubClient) {
        try {
            await pubClient.hdel(`voiceroom:${roomName}`, sUserId);
            const count = await pubClient.hlen(`voiceroom:${roomName}`);
            if (count === 0) {
                await pubClient.del(`voiceroom:${roomName}`);
            }
        } catch (err) {
            console.error('Redis voiceroom remove error:', err);
        }
    }

    const roomData = voiceRooms.get(roomName);
    if (!roomData) return;

    let participant = roomData.participants.get(sUserId) || roomData.participants.get(userId);
    if (!participant) {
        for (const [key, val] of roomData.participants.entries()) {
            if (String(key) === sUserId || String(val.userId) === sUserId) {
                participant = val;
                roomData.participants.delete(key);
                break;
            }
        }
    } else {
        roomData.participants.delete(sUserId);
        roomData.participants.delete(userId);
    }

    // Get active watchParty from Redis
    let activeWatchParty = roomData ? (roomData.watchParty || null) : null;
    if (pubClient) {
        try {
            const wpStr = await pubClient.get(`voiceroom:${roomName}:watchparty`);
            if (wpStr) {
                activeWatchParty = JSON.parse(wpStr);
            }
        } catch (err) {}
    }

    // Always broadcast updated participant list to all clients in the room from Redis
    const participants = await getVoiceRoomParticipantsFromRedis(roomName);
    io.to(`voice:${roomName}`).emit('voice:participants', {
        roomName,
        participants,
        startedAt: roomData ? roomData.startedAt : Date.now(),
        serverNow: Date.now(),
        watchParty: activeWatchParty
    });

    // Emit explicit leave event
    io.to(`voice:${roomName}`).emit('voice:user-left', {
        userId: sUserId,
        username: participant ? participant.username : '',
    });

    // Cleanup empty rooms (with a 20s grace period for socket reconnects)
    if (roomData.participants.size === 0) {
        if (roomData.cleanupTimeout) clearTimeout(roomData.cleanupTimeout);
        roomData.cleanupTimeout = setTimeout(() => {
            const freshRoomData = voiceRooms.get(roomName);
            if (freshRoomData && freshRoomData.participants.size === 0) {
                voiceRooms.delete(roomName);
                console.log(`[Voice Room] Empty room ${roomName} deleted after grace period.`);
            }
        }, 20000);
    }

    if (participant) {
        console.log(`👋 User ${participant.username} left voice room ${roomName}`);
    }
}

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

// Export for external access (e.g., from routes)
export const getVoiceRoomData = (roomName) => voiceRooms.get(roomName);
export const getVoiceRoomParticipantsFromRedis = async (roomName) => {
    if (pubClient) {
        try {
            const hashData = await pubClient.hgetall(`voiceroom:${roomName}`);
            if (hashData && Object.keys(hashData).length > 0) {
                return Object.values(hashData).map(str => {
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
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);
            }
        } catch (err) {
            console.error('Error fetching voiceroom from Redis:', err);
        }
    }
    return getParticipantList(roomName);
};
export const getActiveVoiceRooms = () => Array.from(voiceRooms.keys());
