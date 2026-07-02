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
            notification: {
                title: String(title || '📞 Görüntülü Sohbet Daveti'),
                body: String(body || 'Seni canlı odaya davet ediyor!'),
            },
            data: {
                title:  String(title  || ''),
                body:   String(body   || ''),
                ...Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
            },
            android: {
                priority: 'high',
                ttl: '45s', // 45s call ring duration
                notification: {
                    channelId: 'oxypace_voice_invite_v2',
                    priority: 'max',
                    visibility: 'public',
                    sound: 'default',
                    category: 'call',
                    sticky: true,
                    defaultSound: true,
                    defaultVibrateTimings: true,
                }
            },
        };

        const response = await messaging.send(message);
        console.log('[Firebase] Push sent successfully with Android call metadata:', response);
        return response;
    } catch (err) {
        console.error('[Firebase] Failed to send push:', err.message);
    }
};
