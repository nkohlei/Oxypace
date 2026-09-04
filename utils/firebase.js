import admin from 'firebase-admin';
import { sendPushNotification as sendMultiPush } from '../services/pushService.js';

let messaging = null;

export const initFirebase = () => {
    try {
        if (admin.apps.length > 0) {
            messaging = admin.messaging();
        }
    } catch (err) {
        console.error('[Firebase] initFirebase error:', err.message);
    }
};

/**
 * Sends a high-priority FCM push notification via unified pushService
 * @param {string|Array<string>} fcmToken - Device FCM token or array of tokens
 * @param {object} payload - { title, body, data }
 */
export const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
    if (!fcmToken) return null;
    const tokens = Array.isArray(fcmToken) ? fcmToken : [fcmToken];
    return await sendMultiPush(tokens, { title, body, data });
};

export default { initFirebase, sendPushNotification };

