import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

const ChatNotificationManager = registerPlugin('ChatNotificationManager');

/**
 * Tell native Android whether the user is actively viewing/chatting with a specific partner.
 * When active, native OxypaceMessagingService completely suppresses all device notifications,
 * screen wakeups, vibrations and sounds from this partner.
 * @param {string|null} partnerId - Partner user ID, or null when exiting chat.
 */
export const setActiveChatPartner = async (partnerId = null) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const strPartnerId = partnerId ? String(partnerId).trim() : null;
        await ChatNotificationManager.setActiveChatPartner({ partnerId: strPartnerId });
    } catch (err) {
        console.warn('Failed to set active chat partner on native layer:', err);
    }
};

/**
 * Dismiss delivered push and local notifications for a specific sender or message conversation.
 * Cancels native Android notifications directly via NotificationManager, plus Capacitor layers.
 * @param {string|null} senderId - Target sender user ID to clear notifications for. If null, clears all message notifications.
 */
export const dismissDeliveredMessageNotifications = async (senderId = null) => {
    if (!Capacitor.isNativePlatform()) return;

    const strSenderId = senderId ? String(senderId).trim() : null;

    // 1. Native Android direct NotificationManager cancellation
    try {
        if (strSenderId) {
            await ChatNotificationManager.clearNotificationForSender({ senderId: strSenderId });
        } else {
            await ChatNotificationManager.clearAllMessageNotifications();
        }
    } catch (err) {
        console.warn('Failed to dismiss native Android notification:', err);
    }

    // 2. Remove from LocalNotifications
    try {
        const delivered = await LocalNotifications.getDeliveredNotifications();
        if (delivered?.notifications && delivered.notifications.length > 0) {
            const matches = delivered.notifications.filter((n) => {
                const extra = n.extra || {};
                const isMsg = extra.type === 'message' || extra.url?.includes('/inbox/') || extra.route?.includes('/inbox/');
                if (!isMsg) return false;
                if (!strSenderId) return true;

                const notifSender = String(extra.senderId || extra.sender || '').trim();
                const url = String(extra.url || extra.route || '');
                return notifSender === strSenderId || url.includes(`/inbox/${strSenderId}`) || url.includes(`/messages/${strSenderId}`);
            });

            if (matches.length > 0) {
                await LocalNotifications.removeDeliveredNotifications({
                    notifications: matches.map((m) => ({ id: m.id }))
                });
                console.log(`🧹 Dismissed ${matches.length} local notification(s) for sender ${strSenderId || 'all'}`);
            }
        }
    } catch (err) {
        console.warn('Failed to dismiss local delivered notifications:', err);
    }

    // 3. Remove from PushNotifications
    try {
        const deliveredPush = await PushNotifications.getDeliveredNotifications();
        if (deliveredPush?.notifications && deliveredPush.notifications.length > 0) {
            const matchesPush = deliveredPush.notifications.filter((n) => {
                const data = n.data || {};
                const isMsg = data.type === 'message' || data.url?.includes('/inbox/') || data.route?.includes('/inbox/');
                if (!isMsg) return false;
                if (!strSenderId) return true;

                const notifSender = String(data.senderId || data.sender || '').trim();
                const url = String(data.url || data.route || '');
                return notifSender === strSenderId || url.includes(`/inbox/${strSenderId}`) || url.includes(`/messages/${strSenderId}`);
            });

            if (matchesPush.length > 0) {
                await PushNotifications.removeDeliveredNotifications({
                    notifications: matchesPush
                });
                console.log(`🧹 Dismissed ${matchesPush.length} push notification(s) for sender ${strSenderId || 'all'}`);
            }
        }
    } catch (pushErr) {
        console.warn('Failed to dismiss push delivered notifications:', pushErr);
    }
};
