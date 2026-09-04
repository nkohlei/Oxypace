package com.oxypace.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Handles action buttons from Oxypace Ongoing Call Notification:
 *  1. ACTION_HANGUP: Leave room & stop service
 *  2. ACTION_TOGGLE_MIC: Toggle microphone state
 */
public class CallActionReceiver extends BroadcastReceiver {

    public static final String ACTION_HANGUP     = "com.oxypace.app.ACTION_HANGUP";
    public static final String ACTION_TOGGLE_MIC = "com.oxypace.app.ACTION_TOGGLE_MIC";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        if (ACTION_HANGUP.equals(action)) {
            try {
                Intent stopService = new Intent(context, ActiveCallService.class);
                stopService.setAction("STOP_CALL");
                context.startService(stopService);
            } catch (Exception e) {
                android.util.Log.e("CallActionReceiver", "Failed to stop call service: " + e.getMessage());
            }

            // Also cancel incoming call notification if active
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(OxypaceMessagingService.VOICE_INVITE_NOTIF_ID);
            }

            // Cleanly notify React WebView to disconnect from room
            try {
                com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:leave_call'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}

        } else if (ACTION_TOGGLE_MIC.equals(action)) {
            try {
                Intent toggleMicIntent = new Intent(context, ActiveCallService.class);
                toggleMicIntent.setAction("TOGGLE_MIC");
                context.startService(toggleMicIntent);
            } catch (Exception e) {
                android.util.Log.e("CallActionReceiver", "Failed to toggle mic: " + e.getMessage());
            }

            // Sync mic toggle state with React WebRTC context
            try {
                com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:toggle_mic'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}
        }
    }
}
