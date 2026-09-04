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

// Initialize Firebase Admin (supports both env var and firebase-service-account.json file)
let isInitialized = false;

import fs from 'fs';
import path from 'path';

try {
    if (admin.apps.length === 0) {
        let serviceAccount = null;
        const keyPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(keyPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            isInitialized = true;
            console.log('📱 [PushService] Firebase Admin initialized successfully.');
        } else {
            console.warn('⚠️ [PushService] FIREBASE_SERVICE_ACCOUNT not found in environment or file. Push notifications will be disabled.');
        }
    } else {
        isInitialized = true;
    }
} catch (error) {
    console.error('❌ [PushService] Failed to initialize Firebase Admin:', error);
}

/**
 * Send a push notification to specific FCM tokens
 * @param {Array<String>} tokens - Array of device FCM tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
export const sendPushNotification = async (tokens, payload) => {
    if (!tokens || tokens.length === 0) {
        console.log('ℹ️ [PushService] No recipient tokens provided, skipping push.');
        return null;
    }

    if (!isInitialized) {
        // Try lazy re-init if Firebase was not ready on load
        if (admin.apps.length > 0) {
            isInitialized = true;
        } else {
            try {
                let serviceAccount = null;
                const keyPath = path.resolve(process.cwd(), 'firebase-service-account.json');
                if (fs.existsSync(keyPath)) {
                    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                }
                if (serviceAccount) {
                    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                    isInitialized = true;
                }
            } catch (e) {
                console.warn('⚠️ [PushService] Lazy Firebase re-init error:', e.message);
            }
        }
    }

    if (!isInitialized) {
        console.warn('⚠️ [PushService] Push requested but Firebase is not initialized.');
        return null;
    }

    try {
        const absoluteImageUrl = payload.image ? constructNotifImageUrl(payload.image) : undefined;
        const rawData = payload.data || {};
        const sanitizedData = {};

        for (const [key, val] of Object.entries(rawData)) {
            if (val !== undefined && val !== null) {
                if (key === 'senderAvatar' && typeof val === 'string' && val.length > 0) {
                    sanitizedData[key] = constructNotifImageUrl(val) || val;
                } else if (key === 'image' && typeof val === 'string' && val.length > 0) {
                    sanitizedData[key] = constructNotifImageUrl(val) || val;
                } else {
                    sanitizedData[key] = String(val);
                }
            }
        }

        const notificationTitle = String(payload.title || 'Oxypace');
        const notificationBody = String(payload.body || '');

        // Determine appropriate notification channel based on type
        const notifType = sanitizedData.type || 'message';
        let channelId = 'oxypace_messages_v2';
        if (notifType === 'voice_invite') {
            channelId = 'oxypace_voice_invite_v2';
        } else if (notifType !== 'message' && !sanitizedData.senderId) {
            channelId = 'oxypace_general_notifications';
        }

        const message = {
            notification: {
                title: notificationTitle,
                body: notificationBody,
                ...(absoluteImageUrl && { imageUrl: absoluteImageUrl }),
            },
            data: {
                title: notificationTitle,
                body: notificationBody,
                channelId: channelId,
                ...sanitizedData,
                ...(absoluteImageUrl && { 
                    image: absoluteImageUrl, 
                    bigPicture: absoluteImageUrl,
                    picture: absoluteImageUrl,
                    style: 'bigpicture',
                    fcm_options: JSON.stringify({ image: absoluteImageUrl })
                }),
            },
            android: {
                priority: 'high',
                ttl: 24 * 60 * 60 * 1000, // 24 hours TTL
                notification: {
                    channelId: channelId,
                    priority: 'max',
                    visibility: 'public',
                    sound: 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    ...(absoluteImageUrl && { imageUrl: absoluteImageUrl }),
                }
            },
            tokens: tokens, // Multicast message
        };

        console.log(`📡 [PushService] Sending push to ${tokens.length} token(s) | Type: ${notifType} | Title: "${notificationTitle}"`);
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ [PushService] Sent results: Success: ${response.successCount}, Failures: ${response.failureCount}`);
        
        if (response.failureCount > 0) {
            const failedTokens = [];
            for (let idx = 0; idx < response.responses.length; idx++) {
                const resp = response.responses[idx];
                if (!resp.success) {
                    const token = tokens[idx];
                    failedTokens.push(token);
                    console.warn(`⚠️ [PushService] Failed token [${idx}]: ${token.substring(0, 15)}... Error:`, resp.error?.code || resp.error?.message);
                    
                    // Automatically clean up expired/invalid/unregistered tokens from MongoDB
                    if (resp.error && (
                        resp.error.code === 'messaging/registration-token-not-registered' ||
                        resp.error.code === 'messaging/invalid-registration-token' ||
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
                            console.log(`🧹 [PushService] Cleaned unregistered token from DB: ${token.substring(0, 15)}...`);
                        } catch (cleanErr) {
                            console.error('Failed to clean up invalid token from database:', cleanErr);
                        }
                    }
                }
            }
        }
        
        return response;
    } catch (error) {
        console.error('❌ [PushService] Error sending push notification:', error);
        throw error;
    }
};

export default { sendPushNotification };

