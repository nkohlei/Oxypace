package com.oxypace.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Cleans up local device notification accumulation history when a user swipes/dismisses
 * a notification from the Android notification tray, WITHOUT marking items read on the backend.
 */
public class NotificationDismissReceiver extends BroadcastReceiver {

    public static final String ACTION_NOTIF_DISMISSED = "com.oxypace.app.ACTION_NOTIF_DISMISSED";
    public static final String EXTRA_NOTIF_TYPE = "notifType";
    public static final String EXTRA_SENDER_ID = "senderId";
    public static final String EXTRA_CHANNEL_KEY = "channelKey";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String type = intent.getStringExtra(EXTRA_NOTIF_TYPE);
        if ("message".equals(type)) {
            String senderId = intent.getStringExtra(EXTRA_SENDER_ID);
            if (senderId != null && !senderId.trim().isEmpty()) {
                OxypaceMessagingService.clearHistoryForSender(senderId.trim());
            }
        } else if ("portal_post".equals(type)) {
            String channelKey = intent.getStringExtra(EXTRA_CHANNEL_KEY);
            if (channelKey != null && !channelKey.trim().isEmpty()) {
                OxypaceMessagingService.clearPortalHistoryForChannel(context, channelKey.trim());
            }
        }
    }
}
