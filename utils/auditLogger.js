import ActivityLog from '../models/ActivityLog.js';

/**
 * Asynchronously logs user footprints and platform events without interrupting request flow.
 */
export const logActivity = async ({
    user = null,
    username = '',
    action,
    category = 'general',
    req = null,
    ip = '',
    userAgent = '',
    targetId = '',
    targetType = '',
    details = {}
}) => {
    try {
        let finalIp = ip;
        let finalUserAgent = userAgent;

        if (req) {
            finalIp = finalIp || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || '';
            finalUserAgent = finalUserAgent || req.headers['user-agent'] || '';
            if (!user && req.user) {
                user = req.user._id || req.user.id;
                username = username || req.user.username;
            }
        }

        // Basic OS & browser detection
        let os = 'Bilinmiyor';
        let browser = 'Bilinmiyor';
        let deviceType = 'Masaüstü';

        if (finalUserAgent) {
            const ua = finalUserAgent.toLowerCase();
            if (/android/i.test(ua)) { os = 'Android'; deviceType = 'Mobil'; }
            else if (/iphone|ipad|ipod/i.test(ua)) { os = 'iOS'; deviceType = 'Mobil'; }
            else if (/windows nt/i.test(ua)) { os = 'Windows'; deviceType = 'Masaüstü'; }
            else if (/macintosh|mac os x/i.test(ua)) { os = 'macOS'; deviceType = 'Masaüstü'; }
            else if (/linux/i.test(ua)) { os = 'Linux'; deviceType = 'Masaüstü'; }

            if (/edg/i.test(ua)) { browser = 'Edge'; }
            else if (/chrome/i.test(ua)) { browser = 'Chrome'; }
            else if (/firefox/i.test(ua)) { browser = 'Firefox'; }
            else if (/safari/i.test(ua)) { browser = 'Safari'; }
            else if (/opera|opr/i.test(ua)) { browser = 'Opera'; }
        }

        await ActivityLog.create({
            user: user || null,
            username: username || '',
            action: String(action || 'ACTION').toUpperCase(),
            category,
            ip: finalIp,
            userAgent: finalUserAgent,
            device: { os, browser, deviceType },
            targetId: String(targetId || ''),
            targetType: String(targetType || ''),
            details: details || {}
        });
    } catch (err) {
        // Never break request flow if logging fails
        console.error('⚠️ Audit Logger failed:', err.message);
    }
};

export default logActivity;
