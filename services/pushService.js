import admin from 'firebase-admin';
import { R2_DOMAIN, PROXY_BASE } from '../utils/mediaConfig.js';

/**
 * Constructs the image URL for Android push notifications.
 * Uses the Koyeb proxy URL instead of the direct R2 CDN URL,
 * because Cloudflare R2 (pub-xxx.r2.dev) is blocked by Türk Telekom.
 * Koyeb runs on Google Cloud which is NOT blocked.
 */
const constructNotifImageUrl = (key) => {
    if (!key) return null;

    let cleanKey = key;

    // If it's already a direct R2 CDN URL, extract the key part
    if (cleanKey.startsWith(R2_DOMAIN)) {
        cleanKey = cleanKey.slice(R2_DOMAIN.length).replace(/^\//, '');
    }

    // Strip any proxy path prefixes
    if (cleanKey.includes('/api/media/')) {
        cleanKey = cleanKey.substring(cleanKey.indexOf('/api/media/') + 11);
    } else if (cleanKey.includes('/r2-media/')) {
        cleanKey = cleanKey.substring(cleanKey.indexOf('/r2-media/') + 10);
    }

    // Decode encoded chars (e.g. %2F → /)
    try { cleanKey = decodeURIComponent(cleanKey); } catch (e) {}

    // If it's an unrelated external URL (e.g. https://example.com/img.jpg), keep as-is
    if (cleanKey.startsWith('http')) return cleanKey;

    // Normalize leading slash
    cleanKey = cleanKey.replace(/^\//, '');

    // Return Koyeb proxy URL — accessible on TTNet without Cloudflare blocking
    return `${PROXY_BASE}${cleanKey}`;
};

// Initialize Firebase Admin only if service account is provided in env
// This ensures the app doesn't crash if the user hasn't set up Firebase yet
let isInitialized = false;

try {
    if (admin.apps.length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('📱 Firebase Admin initialized successfully for Push Notifications.');
    } else if (admin.apps.length > 0) {
        isInitialized = true;
    } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment variables. Push notifications will be disabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
}

/**
 * Send a push notification to specific FCM tokens
 * @param {Array<String>} tokens - Array of device FCM tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
export const sendPushNotification = async (tokens, payload) => {
    if (!isInitialized || !tokens || tokens.length === 0) {
        return;
    }

    try {
        const absoluteImageUrl = payload.image ? constructNotifImageUrl(payload.image) : undefined;
        const message = {
            // NO standard notification object so Android OS does not intercept it.
            // This guarantees our native OxypaceMessagingService.onMessageReceived receives it.
            data: {
                title: String(payload.title || 'Oxypace'),
                body: String(payload.body || ''),
                ...(payload.data || {}),
                ...(absoluteImageUrl && { 
                    image: absoluteImageUrl, 
                    bigPicture: absoluteImageUrl,
                    picture: absoluteImageUrl,
                    style: 'bigpicture',
                    fcm_options: JSON.stringify({ image: absoluteImageUrl })
                }),
            },
            android: {
                priority: 'high'
            },
            tokens: tokens, // Multicast message
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        if (response.failureCount > 0) {
            const failedTokens = [];
            for (let idx = 0; idx < response.responses.length; idx++) {
                const resp = response.responses[idx];
                if (!resp.success) {
                    const token = tokens[idx];
                    failedTokens.push(token);
                    console.warn('Failed to send push to token:', token, resp.error);
                    
                    // Automatically clean up expired/invalid/unregistered tokens from MongoDB
                    if (resp.error && (
                        resp.error.code === 'messaging/registration-token-not-registered' ||
                        resp.error.message === 'NotRegistered'
                    )) {
                        try {
                            const User = (await import('../models/User.js')).default;
                            await User.updateMany(
                                { $or: [{ fcmTokens: token }, { fcmToken: token }] },
                                { 
                                    $pull: { fcmTokens: token },
                                    $unset: { fcmToken: "" }
                                }
                            );
                            console.log(`🧹 Cleaned up unregistered token from database: ${token}`);
                        } catch (cleanErr) {
                            console.error('Failed to clean up invalid token from database:', cleanErr);
                        }
                    }
                }
            }
        }
        
        return response;
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
    }
};

export default { sendPushNotification };
