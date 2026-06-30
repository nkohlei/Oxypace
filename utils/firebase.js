import admin from 'firebase-admin';

let messaging = null;

export const initFirebase = () => {
    try {
        if (admin.apps.length === 0) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
        messaging = admin.messaging();
        console.log('[Firebase] Admin initialized successfully.');
    } catch (err) {
        console.error('[Firebase] Failed to initialize admin:', err.message);
    }
};

/**
 * Send a high-priority FCM push notification with optional action buttons.
 * Works even when the app is completely closed.
 * @param {string} fcmToken - Device FCM token
 * @param {object} payload - { title, body, data }
 */
export const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
    if (!messaging) {
        console.warn('[Firebase] Messaging not initialized.');
        return;
    }
    if (!fcmToken) return;

    try {
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data: {
                ...Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'voice_invite',
                    priority: 'max',
                    sound: 'default',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    clickAction: 'OPEN_ACTIVITY_1',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        contentAvailable: true,
                    },
                },
            },
        };

        const response = await messaging.send(message);
        console.log('[Firebase] Push sent successfully:', response);
        return response;
    } catch (err) {
        console.error('[Firebase] Failed to send push:', err.message);
    }
};
