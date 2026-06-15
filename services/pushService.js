import admin from 'firebase-admin';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

// Initialize Firebase Admin only if service account is provided in env
// This ensures the app doesn't crash if the user hasn't set up Firebase yet
let isInitialized = false;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('📱 Firebase Admin initialized successfully for Push Notifications.');
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
        const absoluteImageUrl = payload.image ? constructProxiedUrl(payload.image) : undefined;
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
                // Firebase Admin SDK v13+ uses 'imageUrl' (SDK converts this to 'image' in the REST API)
                ...(absoluteImageUrl && { imageUrl: absoluteImageUrl }),
            },
            data: {
                ...(payload.data || {}),
                // data fields are used by the foreground pushNotificationReceived listener in App.jsx
                ...(absoluteImageUrl && { 
                    image: absoluteImageUrl, 
                    bigPicture: absoluteImageUrl,
                    picture: absoluteImageUrl,
                    style: 'bigpicture',
                    fcm_options: JSON.stringify({ image: absoluteImageUrl })
                }),
            },
            android: {
                notification: {
                    // Firebase Admin SDK v13+ uses 'imageUrl' for android-specific notifications
                    ...(absoluteImageUrl && { imageUrl: absoluteImageUrl })
                }
            },
            tokens: tokens, // Multicast message
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.warn('Failed to send push to token:', tokens[idx], resp.error);
                }
            });
            // Optional: You could clean up invalid tokens from DB here by throwing a custom error
        }
        
        return response;
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
    }
};

export default { sendPushNotification };
