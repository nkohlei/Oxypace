package com.oxypace.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Handles action buttons from Oxypace Ongoing Call Notification Bar and Native PiP:
 *  1. ACTION_HANGUP: Leave room & stop service
 *  2. ACTION_TOGGLE_MIC: Toggle microphone state
 *  3. ACTION_TOGGLE_CAMERA: Toggle camera state
 *  4. ACTION_TOGGLE_SCREEN: Toggle screen sharing
 */
public class CallActionReceiver extends BroadcastReceiver {

    public static final String ACTION_HANGUP         = "com.oxypace.app.ACTION_HANGUP";
    public static final String ACTION_TOGGLE_MIC     = "com.oxypace.app.ACTION_TOGGLE_MIC";
    public static final String ACTION_TOGGLE_CAMERA  = "com.oxypace.app.ACTION_TOGGLE_CAMERA";
    public static final String ACTION_TOGGLE_SCREEN  = "com.oxypace.app.ACTION_TOGGLE_SCREEN";

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

            // Also cancel incoming call notification and active ongoing call bar if active
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(OxypaceMessagingService.VOICE_INVITE_NOTIF_ID);
                nm.cancel(ActiveCallService.NOTIFICATION_ID);
            }

            // Cleanly notify React WebView to disconnect from room
            try {
                com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().resumeTimers();
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:leave_call'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}

            // If Activity is in Picture-in-Picture mode, close the PiP overlay
            try {
                MainActivity act = MainActivity.getActivityInstance();
                if (act != null) {
                    act.runOnUiThread(() -> {
                        try {
                            if (act.isInPictureInPictureMode()) {
                                act.moveTaskToBack(true);
                            }
                        } catch (Exception ignored) {}
                    });
                }
            } catch (Exception ignored) {}

        } else if (ACTION_TOGGLE_MIC.equals(action)) {
            MainActivity.CallManager.sIsMuted = !MainActivity.CallManager.sIsMuted;
            try {
                MainActivity act = MainActivity.getActivityInstance();
                if (act != null) {
                    act.runOnUiThread(() -> MainActivity.updatePiPParams(act, true));
                }
            } catch (Exception ignored) {}

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
                        bridge.getWebView().resumeTimers();
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:toggle_mic'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}

        } else if (ACTION_TOGGLE_CAMERA.equals(action)) {
            MainActivity.CallManager.sIsCameraOn = !MainActivity.CallManager.sIsCameraOn;
            try {
                MainActivity act = MainActivity.getActivityInstance();
                if (act != null) {
                    act.runOnUiThread(() -> MainActivity.updatePiPParams(act, true));
                }
            } catch (Exception ignored) {}

            // Toggle camera state in React WebRTC context
            try {
                com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().resumeTimers();
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:toggle_camera'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}

        } else if (ACTION_TOGGLE_SCREEN.equals(action)) {
            try {
                Intent toggleScreenIntent = new Intent(context, ActiveCallService.class);
                toggleScreenIntent.setAction("TOGGLE_SCREEN");
                context.startService(toggleScreenIntent);
            } catch (Exception e) {
                android.util.Log.e("CallActionReceiver", "Failed to toggle screen: " + e.getMessage());
            }

            // Sync screen share toggle state with React WebRTC context
            try {
                com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() -> {
                        bridge.getWebView().evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('oxypace:toggle_screenshare'));", null
                        );
                    });
                }
            } catch (Exception ignored) {}
        }
    }
}
