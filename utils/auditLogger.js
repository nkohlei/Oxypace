import ActivityLog from '../models/ActivityLog.js';
import Portal from '../models/Portal.js';

// In-memory sliding window to detect brute force attempts and rapid anomalies
const FAILED_LOGIN_TRACKER = new Map(); // key: ip or username -> array of timestamps
const USER_LOCATION_TRACKER = new Map(); // key: userId -> { country, timestamp }
const PORTAL_RESOLVE_CACHE = new Map(); // key: portalId -> { name, channels, timestamp }

export const resolvePortalAndChannel = async (portalId, channelId) => {
    if (!portalId) return { portalName: '', channelName: '' };
    try {
        const pKey = String(portalId);
        let cached = PORTAL_RESOLVE_CACHE.get(pKey);
        const now = Date.now();
        if (!cached || now - cached.timestamp > 60000) {
            const p = await Portal.findById(portalId).select('name channels').lean();
            if (p) {
                cached = { name: p.name || '', channels: p.channels || [], timestamp: now };
                PORTAL_RESOLVE_CACHE.set(pKey, cached);
            }
        }
        if (!cached) return { portalName: '', channelName: '' };

        let channelName = '';
        if (channelId && cached.channels) {
            const ch = cached.channels.find(c => c._id?.toString() === String(channelId) || c.name === String(channelId));
            if (ch) channelName = ch.name;
        }
        return { portalName: cached.name, channelName };
    } catch (err) {
        return { portalName: '', channelName: '' };
    }
};

// Periodic cleanup of in-memory tracker (every 10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of FAILED_LOGIN_TRACKER.entries()) {
        const valid = timestamps.filter(t => now - t < 15 * 60 * 1000);
        if (valid.length === 0) FAILED_LOGIN_TRACKER.delete(key);
        else FAILED_LOGIN_TRACKER.set(key, valid);
    }
}, 10 * 60 * 1000);

/**
 * Extracts normalized IP address from request or socket
 */
export const extractClientIp = (req) => {
    if (!req) return '';
    return (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        ''
    ).replace('::ffff:', '');
};

/**
 * Extracts GeoIP location (Country & City) from Cloudflare or CDN headers
 */
export const extractGeoLocation = (req) => {
    if (!req) return { country: 'TR', city: 'Bilinmiyor' };
    const country = (
        req.headers['cf-ipcountry'] ||
        req.headers['x-country-code'] ||
        req.headers['x-geo-country'] ||
        'TR'
    ).toUpperCase();

    const city = req.headers['cf-ipcity'] || req.headers['x-geo-city'] || 'Bilinmiyor';
    return { country, city };
};

/**
 * Parses user-agent into OS, Browser, and Device Type
 */
export const parseUserAgent = (userAgentString) => {
    let os = 'Bilinmiyor';
    let browser = 'Bilinmiyor';
    let deviceType = 'Masaüstü';

    if (!userAgentString) return { os, browser, deviceType };

    const ua = userAgentString.toLowerCase();
    if (/android/i.test(ua)) { os = 'Android'; deviceType = 'Mobil'; }
    else if (/iphone|ipod/i.test(ua)) { os = 'iOS'; deviceType = 'Mobil'; }
    else if (/ipad/i.test(ua)) { os = 'iPadOS'; deviceType = 'Tablet'; }
    else if (/windows nt 10/i.test(ua)) { os = 'Windows 10/11'; deviceType = 'Masaüstü'; }
    else if (/windows nt/i.test(ua)) { os = 'Windows'; deviceType = 'Masaüstü'; }
    else if (/macintosh|mac os x/i.test(ua)) { os = 'macOS'; deviceType = 'Masaüstü'; }
    else if (/linux/i.test(ua)) { os = 'Linux'; deviceType = 'Masaüstü'; }

    if (/edg/i.test(ua)) { browser = 'Edge'; }
    else if (/chrome/i.test(ua) && !/edg/i.test(ua)) { browser = 'Chrome'; }
    else if (/firefox/i.test(ua)) { browser = 'Firefox'; }
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) { browser = 'Safari'; }
    else if (/opera|opr/i.test(ua)) { browser = 'Opera'; }

    return { os, browser, deviceType };
};

/**
 * High-performance, non-blocking asynchronous audit logger.
 * Covers all 7 enterprise categories:
 * 'auth', 'portal', 'rtc', 'storage', 'bot', 'content', 'system'.
 */
export const logActivity = async ({
    user = null,
    username = '',
    actorRole = 'user',
    action,
    category = 'general',
    severity = 'info',
    portal = null,
    portalName = '',
    channel = '',
    targetId = '',
    targetType = '',
    targetName = '',
    req = null,
    socket = null,
    ip = '',
    country = '',
    city = '',
    userAgent = '',
    details = {}
}) => {
    // Execute asynchronously to ensure zero impact on request/response cycle
    setImmediate(async () => {
        try {
            let finalIp = ip;
            let finalUserAgent = userAgent;
            let finalCountry = country;
            let finalCity = city;

            // Extract context from Express req
            if (req) {
                finalIp = finalIp || extractClientIp(req);
                finalUserAgent = finalUserAgent || req.headers['user-agent'] || '';
                const geo = extractGeoLocation(req);
                finalCountry = finalCountry || geo.country;
                finalCity = finalCity || geo.city;

                if (!user && req.user) {
                    user = req.user._id || req.user.id;
                    username = username || req.user.username;
                    actorRole = actorRole !== 'user' ? actorRole : (req.user.isAdmin ? 'admin' : (req.user.isTouristAdmin ? 'tourist_admin' : 'user'));
                }
            }

            // Extract context from Socket.IO socket
            if (socket) {
                finalIp = finalIp || (socket.handshake?.headers ? extractClientIp(socket.handshake) : socket.handshake?.address) || '';
                finalUserAgent = finalUserAgent || socket.handshake?.headers?.['user-agent'] || '';
                if (!user && socket.user) {
                    user = socket.user._id || socket.user.id;
                    username = username || socket.user.username;
                }
            }

            // Device parser
            const device = parseUserAgent(finalUserAgent);

            // Anomaly & Security Intelligence
            const upperAction = String(action || 'ACTION').toUpperCase();
            let finalSeverity = severity;

            // 1. Brute-Force Tracker on LOGIN_FAILED
            if (upperAction === 'LOGIN_FAILED') {
                finalSeverity = 'warning';
                const trackerKey = `${finalIp}_${username || 'anon'}`;
                const now = Date.now();
                const attempts = (FAILED_LOGIN_TRACKER.get(trackerKey) || []).filter(t => now - t < 5 * 60 * 1000);
                attempts.push(now);
                FAILED_LOGIN_TRACKER.set(trackerKey, attempts);

                if (attempts.length >= 5) {
                    finalSeverity = 'security';
                    details = {
                        ...details,
                        securityAlert: 'Olası Kaba Kuvvet (Brute-Force) Giriş Saldırısı!',
                        consecutiveFailures: attempts.length,
                    };
                }
            }

            // 2. Suspicious Fast Location Jump on LOGIN_SUCCESS
            if (upperAction === 'LOGIN_SUCCESS' && user) {
                const userIdStr = String(user._id || user);
                const prevLoc = USER_LOCATION_TRACKER.get(userIdStr);
                const now = Date.now();

                if (prevLoc && prevLoc.country && finalCountry && prevLoc.country !== finalCountry && (now - prevLoc.timestamp < 10 * 60 * 1000)) {
                    finalSeverity = 'security';
                    details = {
                        ...details,
                        securityAlert: `Şüpheli Hızlı Konum Atlama: ${prevLoc.country} → ${finalCountry} (10 dakika içinde!)`,
                        previousCountry: prevLoc.country,
                        newCountry: finalCountry,
                    };
                }
                USER_LOCATION_TRACKER.set(userIdStr, { country: finalCountry, timestamp: now });
            }

            // Automatic Portal & Channel Resolution if IDs or names are provided
            let resolvedPortalId = portal ? (portal._id || portal) : (details?.portalId || null);
            let resolvedChannel = channel || details?.channelName || details?.channel || details?.channelId || '';

            // Handle string portal names passed directly in portal or details.portal
            let resolvedPortalName = portalName || portal?.name || details?.portalName || '';
            if (!resolvedPortalName) {
                if (typeof details?.portal === 'string' && !/^[a-f0-9]{24}$/i.test(details.portal)) {
                    resolvedPortalName = details.portal;
                } else if (typeof portal === 'string' && !/^[a-f0-9]{24}$/i.test(portal)) {
                    resolvedPortalName = portal;
                }
            }

            // Extract from roomName if formatted as portal_{portalId}_channel_{channelId}
            if (details?.roomName && typeof details.roomName === 'string') {
                const roomMatch = details.roomName.match(/portal_([a-f0-9]{24})_channel_([\w-]+)/i);
                if (roomMatch) {
                    resolvedPortalId = resolvedPortalId || roomMatch[1];
                    resolvedChannel = resolvedChannel || roomMatch[2];
                }
            }

            // If we have a portalId, resolve friendly names from DB or cache
            if (resolvedPortalId && (!resolvedPortalName || !resolvedChannel || /^[a-f0-9]{24}$/i.test(resolvedChannel))) {
                const res = await resolvePortalAndChannel(resolvedPortalId, resolvedChannel);
                if (!resolvedPortalName && res.portalName) resolvedPortalName = res.portalName;
                if (res.channelName) resolvedChannel = res.channelName;
            }

            // Sync enriched details so both portalName and channelName are always available
            if (resolvedPortalName) {
                details.portalName = resolvedPortalName;
                if (!details.portal) details.portal = resolvedPortalName;
            }
            if (resolvedChannel) {
                details.channelName = resolvedChannel;
                if (!details.channel) details.channel = resolvedChannel;
            }
            if (resolvedPortalId && !details.portalId) details.portalId = String(resolvedPortalId);

            // Derive targetType and targetName if empty
            let finalTargetType = targetType;
            let finalTargetName = targetName;
            if (!finalTargetType) {
                if (upperAction.startsWith('STREAM_') || upperAction.startsWith('WP_') || upperAction.startsWith('ROOM_')) {
                    finalTargetType = 'VoiceRoom';
                    finalTargetName = `${resolvedPortalName || 'Portal'} > #${resolvedChannel || 'Genel'}`;
                } else if (upperAction.startsWith('POST_')) {
                    finalTargetType = 'Post';
                    finalTargetName = details?.title || details?.snippet || (resolvedPortalName ? `${resolvedPortalName} Gönderisi` : 'Gönderi');
                } else if (upperAction.startsWith('PORTAL_')) {
                    finalTargetType = 'Portal';
                    finalTargetName = resolvedPortalName || 'Portal';
                } else if (upperAction.startsWith('CHANNEL_')) {
                    finalTargetType = 'Channel';
                    finalTargetName = `#${resolvedChannel || 'Kanal'}`;
                } else if (upperAction.startsWith('LOGIN_') || upperAction === 'LOGOUT') {
                    finalTargetType = 'UserSession';
                    finalTargetName = `@${username || 'kullanici'}`;
                }
            }

            // Persistence
            const logEntry = await ActivityLog.create({
                user: user ? (user._id || user) : null,
                username: username || (user?.username || ''),
                actorRole,
                action: upperAction,
                category,
                severity: finalSeverity,
                portal: resolvedPortalId,
                portalName: resolvedPortalName,
                channel: String(resolvedChannel || ''),
                targetId: String(targetId || ''),
                targetType: String(finalTargetType || ''),
                targetName: String(finalTargetName || ''),
                ip: finalIp,
                country: finalCountry || 'TR',
                city: finalCity || 'Bilinmiyor',
                userAgent: finalUserAgent,
                device,
                details: details || {}
            });

            // Real-Time Socket Emission to Admin Live Feed
            if (global.io) {
                const livePayload = {
                    ...logEntry.toObject(),
                    user: user ? { _id: user._id || user, username: username || user.username } : null
                };

                // Broadcast to admin presence room
                global.io.to('admin_presence').emit('platform:log', livePayload);

                // If scoped to a specific portal, also broadcast to that portal's management room
                if (portal) {
                    const pId = portal._id || portal;
                    global.io.to(`portal_audit:${pId}`).emit('portal:audit_log', livePayload);
                }
            }
        } catch (err) {
            console.error('⚠️ Platform Audit Logger execution error:', err.message);
        }
    });
};

export default logActivity;
