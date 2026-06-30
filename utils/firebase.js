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
 * Send a high-priority FCM push notification.
 * Uses DATA-ONLY payload (no "notification" key) so that
 * OxypaceMessagingService.onMessageReceived() is called even when the app
 * is completely closed — this is required for call-style (Katıl/Reddet) notifications.
 *
 * @param {string} fcmToken - Device FCM registration token
 * @param {object} payload  - { title, body, data }
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
            // NO "notification" key — data-only so onMessageReceived always fires
            data: {
                title:  String(title  || ''),
                body:   String(body   || ''),
                ...Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
            },
            android: {
                priority: 'high',
                // ttl: 30 seconds — auto-expire like a real call invite
                ttl: '30s',
            },
        };

        const response = await messaging.send(message);
        console.log('[Firebase] Push sent successfully:', response);
        return response;
    } catch (err) {
        console.error('[Firebase] Failed to send push:', err.message);
    }
};
