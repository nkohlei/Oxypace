package com.oxypace.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    public static float sNavBarBottomDp = 0f;
    public static float sStatusBarTopDp = 0f;
    public static boolean sIs3ButtonNav = false;

    @CapacitorPlugin(name = "SystemBarManager")
    public static class SystemBarManager extends com.getcapacitor.Plugin {
        @PluginMethod
        public void getInsets(PluginCall call) {
            JSObject ret = new JSObject();
            ret.put("navBottomDp", sNavBarBottomDp);
            ret.put("statusBarTopDp", sStatusBarTopDp);
            ret.put("is3ButtonNav", sIs3ButtonNav);
            call.resolve(ret);
        }
    }

    @CapacitorPlugin(name = "CallManager")
    public static class CallManager extends com.getcapacitor.Plugin {
        public static boolean isInCall = false;

        @PluginMethod
        public void setInCall(PluginCall call) {
            isInCall = call.getBoolean("isInCall", false);

            try {
                android.content.Context ctx = getContext();
                android.content.Intent serviceIntent = new android.content.Intent(ctx, ActiveCallService.class);
                if (isInCall) {
                    serviceIntent.setAction("START_CALL");
                    serviceIntent.putExtra("channelName", call.getString("channelName", "Görüntülü Sohbet"));
                    serviceIntent.putExtra("route", call.getString("route", ""));

                    // Pass the server-side room startedAt epoch timestamp for timer
                    // synchronization.
                    // Use getData().opt() to avoid JSObject/Number type mismatch;
                    // JS epoch ms values arrive as Double from the Capacitor bridge.
                    long startedAt = 0L;
                    try {
                        Object rawStartedAt = call.getData().opt("startedAt");
                        if (rawStartedAt instanceof Number) {
                            startedAt = ((Number) rawStartedAt).longValue();
                        }
                    } catch (Exception ignored) {
                    }

                    if (startedAt > 0) {
                        serviceIntent.putExtra("startedAt", startedAt);
                    }

                    // Extract LiveKit connection configs for Background connection
                    String token = call.getString("token", "");
                    String serverUrl = call.getString("serverUrl", "");
                    String userId = call.getString("userId", "");
                    serviceIntent.putExtra("token", token);
                    serviceIntent.putExtra("serverUrl", serverUrl);
                    serviceIntent.putExtra("userId", userId);

                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        ctx.startForegroundService(serviceIntent);
                    } else {
                        ctx.startService(serviceIntent);
                    }

                    // Ensure speakerphone and high-fidelity media audio routing are applied
                    try {
                        android.media.AudioManager am = (android.media.AudioManager) ctx
                                .getSystemService(android.content.Context.AUDIO_SERVICE);
                        if (am != null) {
                            applyAudioRouting(am, "call");
                        }
                    } catch (Exception ignored) {
                    }

                    // Update PiP Params for Android 12+ Auto-Enter and keep screen alive during
                    // call
                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            try {
                                getActivity().getWindow()
                                        .addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                            } catch (Exception ignored) {
                            }
                            updatePiPParams(getActivity(), true);
                        });
                    }
                } else {
                    MainActivity.CallManager.isInCall = false;
                    try {
                        if (ActiveCallService.sInstance != null) {
                            ActiveCallService.sInstance.stopCall();
                        }
                    } catch (Exception ignored) {
                    }

                    try {
                        android.content.Intent stopIntent = new android.content.Intent(ctx, ActiveCallService.class);
                        ctx.stopService(stopIntent);
                    } catch (Exception ignored) {
                    }

                    // Explicitly cancel ongoing call notification immediately
                    try {
                        android.app.NotificationManager nm = (android.app.NotificationManager) ctx
                                .getSystemService(android.content.Context.NOTIFICATION_SERVICE);
                        if (nm != null) {
                            nm.cancel(ActiveCallService.NOTIFICATION_ID);
                        }
                    } catch (Exception ignored) {
                    }

                    // Revert audio mode to normal when call stops
                    try {
                        android.media.AudioManager am = (android.media.AudioManager) ctx
                                .getSystemService(android.content.Context.AUDIO_SERVICE);
                        if (am != null) {
                            am.setMode(android.media.AudioManager.MODE_NORMAL);
                            am.setSpeakerphoneOn(false);
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                                am.clearCommunicationDevice();
                                if (sModeChangedListener != null) {
                                    am.removeOnModeChangedListener(
                                            (android.media.AudioManager.OnModeChangedListener) sModeChangedListener);
                                    sModeChangedListener = null;
                                }
                            }
                        }
                    } catch (Exception ignored) {
                    }

                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            try {
                                getActivity().getWindow()
                                        .clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                            } catch (Exception ignored) {
                            }
                            updatePiPParams(getActivity(), false);
                        });
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            call.resolve();
        }

        public static String sCurrentRoute = "speaker";
        public static String sUserSelectedRoute = null;
        public static boolean sHasHeadset = false;
        public static String sHeadsetName = "Kulaklık";
        public static Object sModeChangedListener = null;

        public static boolean isHeadsetConnected(android.media.AudioManager am) {
            if (am == null)
                return false;
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    android.media.AudioDeviceInfo[] devices = am
                            .getDevices(android.media.AudioManager.GET_DEVICES_OUTPUTS);
                    for (android.media.AudioDeviceInfo device : devices) {
                        int type = device.getType();
                        if (type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                                type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                                type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                                type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                                type == android.media.AudioDeviceInfo.TYPE_BLE_HEADSET ||
                                type == android.media.AudioDeviceInfo.TYPE_USB_HEADSET ||
                                type == android.media.AudioDeviceInfo.TYPE_USB_DEVICE) {
                            if (type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                                    type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                                    type == android.media.AudioDeviceInfo.TYPE_BLE_HEADSET) {
                                sHeadsetName = "Bluetooth Kulaklık";
                            } else {
                                sHeadsetName = "Kablolu Kulaklık";
                            }
                            return true;
                        }
                    }
                    return false;
                } else {
                    @SuppressWarnings("deprecation")
                    boolean wired = am.isWiredHeadsetOn();
                    @SuppressWarnings("deprecation")
                    boolean bt = am.isBluetoothScoOn() || am.isBluetoothA2dpOn();
                    if (bt)
                        sHeadsetName = "Bluetooth Kulaklık";
                    else if (wired)
                        sHeadsetName = "Kablolu Kulaklık";
                    return wired || bt;
                }
            } catch (Exception e) {
                return false;
            }
        }

        public static android.media.AudioDeviceInfo getHeadsetDevice(android.media.AudioManager am) {
            if (am == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S)
                return null;
            try {
                java.util.List<android.media.AudioDeviceInfo> devices = am.getAvailableCommunicationDevices();
                // 1. Prefer BLE Headset or Bluetooth A2DP/Hearing Aid devices
                for (android.media.AudioDeviceInfo d : devices) {
                    int t = d.getType();
                    if (t == android.media.AudioDeviceInfo.TYPE_BLE_HEADSET
                            || t == android.media.AudioDeviceInfo.TYPE_HEARING_AID) {
                        return d;
                    }
                }
                // 2. Wired headsets and USB
                for (android.media.AudioDeviceInfo d : devices) {
                    int t = d.getType();
                    if (t == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET
                            || t == android.media.AudioDeviceInfo.TYPE_USB_HEADSET) {
                        return d;
                    }
                }
                for (android.media.AudioDeviceInfo d : devices) {
                    int t = d.getType();
                    if (t == android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES
                            || t == android.media.AudioDeviceInfo.TYPE_USB_DEVICE) {
                        return d;
                    }
                }
                // 3. Fallback to bluetooth communication device if nothing else
                for (android.media.AudioDeviceInfo d : devices) {
                    int t = d.getType();
                    if (t == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                        return d;
                    }
                }
            } catch (Exception ignored) {
            }
            return null;
        }

        public static android.media.AudioDeviceInfo getSpeakerDevice(android.media.AudioManager am) {
            if (am == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S)
                return null;
            try {
                java.util.List<android.media.AudioDeviceInfo> devices = am.getAvailableCommunicationDevices();
                for (android.media.AudioDeviceInfo d : devices) {
                    if (d.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                        return d;
                    }
                }
            } catch (Exception ignored) {
            }
            return null;
        }

        public static void routeAudio(android.media.AudioManager am, String targetRoute) {
            if (am == null)
                return;
            try {
                boolean isSpeaker = !"headset".equalsIgnoreCase(targetRoute);
                sCurrentRoute = isSpeaker ? "speaker" : "headset";

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    java.util.List<android.media.AudioDeviceInfo> devices = am.getAvailableCommunicationDevices();
                    android.media.AudioDeviceInfo chosenDevice = null;
                    if (isSpeaker) {
                        for (android.media.AudioDeviceInfo d : devices) {
                            if (d.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
                                chosenDevice = d;
                                break;
                            }
                        }
                    } else {
                        // Find bluetooth, wired headset, or usb headset
                        for (android.media.AudioDeviceInfo d : devices) {
                            int type = d.getType();
                            if (type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                                    type == android.media.AudioDeviceInfo.TYPE_BLE_HEADSET ||
                                    type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                                    type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                                    type == android.media.AudioDeviceInfo.TYPE_USB_HEADSET) {
                                chosenDevice = d;
                                break;
                            }
                        }
                    }

                    if (chosenDevice != null) {
                        boolean res = am.setCommunicationDevice(chosenDevice);
                        android.util.Log.d("CallManager",
                                "setCommunicationDevice to " + chosenDevice.getProductName() + " result=" + res);
                    } else {
                        am.clearCommunicationDevice();
                    }
                }

                // Also maintain legacy speakerphone flag for older subsystems / HALs
                am.setSpeakerphoneOn(isSpeaker);
            } catch (Exception e) {
                android.util.Log.w("CallManager", "routeAudio failed: " + e.getMessage());
            }
        }

        public static void applyAudioRouting(android.media.AudioManager am, String mode) {
            if (am == null)
                return;
            try {
                // Keep MODE_NORMAL for high-fidelity stereo audio
                am.setMode(android.media.AudioManager.MODE_NORMAL);
                boolean hasHeadset = isHeadsetConnected(am);
                sHasHeadset = hasHeadset;
                // If user explicitly chose a route, respect it.
                // Otherwise: IF HEADSET CONNECTED -> DEFAULT TO HEADSET!
                // IF NO HEADSET -> DEFAULT TO SPEAKER!
                String targetRoute;
                if (sUserSelectedRoute != null) {
                    targetRoute = sUserSelectedRoute;
                } else {
                    targetRoute = hasHeadset ? "headset" : "speaker";
                }
                routeAudio(am, targetRoute);
                dispatchAudioRouteChanged(targetRoute, hasHeadset, sHeadsetName);
            } catch (Exception e) {
                android.util.Log.w("CallManager", "Failed to apply audio routing: " + e.getMessage());
            }
        }

        public static void routeToSpeaker(android.media.AudioManager am) {
            sUserSelectedRoute = "speaker";
            routeAudio(am, "speaker");
        }

        public static void routeToHeadset(android.media.AudioManager am) {
            sUserSelectedRoute = "headset";
            routeAudio(am, "headset");
        }

        public static void dispatchAudioRouteChanged(String currentRoute, boolean hasHeadset, String name) {
            try {
                MainActivity act = activityInstance;
                if (act != null) {
                    act.runOnUiThread(() -> {
                        try {
                            com.getcapacitor.Bridge bridge = act.getBridge();
                            android.webkit.WebView wv = bridge != null ? bridge.getWebView() : null;
                            if (wv != null) {
                                String script = String.format(
                                        "(function(){ window.dispatchEvent(new CustomEvent('oxypace:audio_route_changed', { detail: { currentRoute: '%s', hasHeadset: %b, headsetName: '%s' } })); })();",
                                        currentRoute, hasHeadset,
                                        (name != null && !name.isEmpty()) ? name : "Kulaklık");
                                wv.evaluateJavascript(script, null);
                            }
                        } catch (Exception ignored) {
                        }
                    });
                }
            } catch (Exception ignored) {
            }
        }

        @PluginMethod
        public void setAudioMode(PluginCall call) {
            String mode = call.getString("mode", "media");
            try {
                android.content.Context ctx = getContext();
                android.media.AudioManager am = (android.media.AudioManager) ctx
                        .getSystemService(android.content.Context.AUDIO_SERVICE);
                if (am != null) {
                    applyAudioRouting(am, mode);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }

        @PluginMethod
        public void getAudioRouting(PluginCall call) {
            try {
                android.content.Context ctx = getContext();
                android.media.AudioManager am = (android.media.AudioManager) ctx
                        .getSystemService(android.content.Context.AUDIO_SERVICE);
                boolean hasHeadset = isHeadsetConnected(am);
                sHasHeadset = hasHeadset;
                JSObject ret = new JSObject();
                ret.put("currentRoute", sCurrentRoute);
                ret.put("hasHeadset", hasHeadset);
                ret.put("headsetName", sHeadsetName);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }

        @PluginMethod
        public void setAudioOutputRoute(PluginCall call) {
            String route = call.getString("route", "speaker");
            try {
                android.content.Context ctx = getContext();
                android.media.AudioManager am = (android.media.AudioManager) ctx
                        .getSystemService(android.content.Context.AUDIO_SERVICE);
                if (am != null) {
                    sUserSelectedRoute = route;
                    routeAudio(am, route);
                    dispatchAudioRouteChanged(route, sHasHeadset, sHeadsetName);
                }
                JSObject ret = new JSObject();
                ret.put("currentRoute", sCurrentRoute);
                ret.put("hasHeadset", sHasHeadset);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }

        @PluginMethod
        public void enterPiP(PluginCall call) {
            try {
                final android.app.Activity act = getActivity();
                if (act != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    act.runOnUiThread(() -> {
                        try {
                            android.app.PictureInPictureParams params = buildPiPParams(act, true);
                            if (params != null) {
                                act.enterPictureInPictureMode(params);
                            } else {
                                act.enterPictureInPictureMode();
                            }
                        } catch (Throwable e) {
                            try {
                                act.enterPictureInPictureMode();
                            } catch (Throwable ignored) {
                            }
                        }
                    });
                    call.resolve();
                } else {
                    call.reject("PiP not supported");
                }
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }

        public static boolean sIsMuted = false;
        public static boolean sIsCameraOn = true;
        public static boolean sIsScreenSharing = false;
        public static PluginCall sScreenCaptureCall = null;
        public static final int REQUEST_CODE_SCREEN_CAPTURE = 9981;

        @PluginMethod
        public void updateCallState(PluginCall call) {
            if (!isInCall) {
                call.resolve();
                return;
            }

            sIsMuted = call.getBoolean("isMuted", sIsMuted);
            sIsCameraOn = call.getBoolean("isCameraOn", sIsCameraOn);
            sIsScreenSharing = call.getBoolean("isScreenSharing", sIsScreenSharing);

            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    updatePiPParams(getActivity(), CallManager.isInCall);
                });
            }

            try {
                android.content.Context ctx = getContext();
                android.content.Intent sIntent = new android.content.Intent(ctx, ActiveCallService.class);
                sIntent.setAction("UPDATE_STATE");
                sIntent.putExtra("isMuted", sIsMuted);
                sIntent.putExtra("isScreenSharing", sIsScreenSharing);
                ctx.startService(sIntent);
            } catch (Exception ignored) {
            }

            call.resolve();
        }

        @PluginMethod
        public void startScreenCapture(PluginCall call) {
            sScreenCaptureCall = call;
            android.app.Activity act = getActivity();
            if (act == null) {
                call.reject("Activity is null");
                return;
            }
            android.media.projection.MediaProjectionManager mpm = (android.media.projection.MediaProjectionManager) act
                    .getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (mpm == null) {
                call.reject("MediaProjectionManager not available");
                return;
            }
            act.startActivityForResult(mpm.createScreenCaptureIntent(), REQUEST_CODE_SCREEN_CAPTURE);
        }

        @PluginMethod
        public void stopScreenCapture(PluginCall call) {
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).stopScreenProjection();
            }
            call.resolve();
        }

        @PluginMethod
        public void readClipboard(PluginCall call) {
            android.app.Activity act = getActivity();
            if (act == null) {
                JSObject ret = new JSObject();
                ret.put("value", "");
                call.resolve(ret);
                return;
            }
            act.runOnUiThread(() -> {
                String clipText = "";
                try {
                    android.content.ClipboardManager cm = (android.content.ClipboardManager) act
                            .getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null && cm.hasPrimaryClip()) {
                        android.content.ClipData clip = cm.getPrimaryClip();
                        if (clip != null && clip.getItemCount() > 0) {
                            CharSequence coerced = clip.getItemAt(0).coerceToText(act);
                            if (coerced != null) {
                                clipText = coerced.toString();
                            }
                        }
                    }
                } catch (Exception e) {
                    android.util.Log.w("CallManager", "readClipboard warning: " + e.getMessage());
                }
                JSObject ret = new JSObject();
                ret.put("value", clipText);
                call.resolve(ret);
            });
        }
    }

    public static volatile boolean isAppForeground = false;
    public static volatile String activeChatPartnerId = null;
    public static volatile String activePortalChannelKey = null;

    public static void clearChatNotification(Context context, String senderId) {
        if (context == null || senderId == null || senderId.trim().isEmpty())
            return;
        try {
            android.app.NotificationManager nm = (android.app.NotificationManager) context
                    .getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                int notifId = Math.abs(senderId.trim().hashCode());
                nm.cancel(notifId);
                android.util.Log.d("ChatNotification",
                        "Cleared status bar notification for sender: " + senderId + " (id=" + notifId + ")");
            }
            OxypaceMessagingService.clearHistoryForSender(context, senderId.trim());
        } catch (Exception e) {
            android.util.Log.w("ChatNotification", "Error clearing notification: " + e.getMessage());
        }
    }

    public static void clearPortalChannelNotification(Context context, String portalId, String channelId) {
        if (context == null || portalId == null || portalId.trim().isEmpty())
            return;
        try {
            String cleanPortalId = portalId.trim();
            android.app.NotificationManager nm = (android.app.NotificationManager) context
                    .getSystemService(Context.NOTIFICATION_SERVICE);
            if (channelId != null && !channelId.trim().isEmpty() && !channelId.equalsIgnoreCase("null")
                    && !channelId.equalsIgnoreCase("undefined")) {
                String cleanChannelId = channelId.trim();
                String channelKey = cleanPortalId + "_" + cleanChannelId;
                if (nm != null) {
                    nm.cancel(Math.abs(("portal_channel_" + channelKey).hashCode()));
                    nm.cancel(Math.abs(("portal_" + cleanPortalId).hashCode()));
                }
                OxypaceMessagingService.clearPortalHistoryForChannel(context, channelKey);
            } else {
                if (nm != null) {
                    nm.cancel(Math.abs(("portal_" + cleanPortalId).hashCode()));
                }
                OxypaceMessagingService.clearPortalHistoryForPortal(context, cleanPortalId);
            }
        } catch (Exception e) {
            android.util.Log.w("ChatNotification", "Error clearing portal channel notification: " + e.getMessage());
        }
    }

    @CapacitorPlugin(name = "ChatNotificationManager")
    public static class ChatNotificationManager extends com.getcapacitor.Plugin {
        @PluginMethod
        public void setActiveChatPartner(PluginCall call) {
            String partnerId = call.getString("partnerId", null);
            if (partnerId != null && (partnerId.trim().isEmpty() || partnerId.equalsIgnoreCase("null")
                    || partnerId.equalsIgnoreCase("undefined"))) {
                partnerId = null;
            }
            MainActivity.activeChatPartnerId = partnerId != null ? partnerId.trim() : null;
            android.util.Log.d("ChatNotificationManager",
                    "Active chat partner set to: " + MainActivity.activeChatPartnerId);

            if (MainActivity.activeChatPartnerId != null) {
                clearChatNotification(getContext(), MainActivity.activeChatPartnerId);
            }
            call.resolve();
        }

        @PluginMethod
        public void setActivePortalChannel(PluginCall call) {
            String portalId = call.getString("portalId", null);
            String channelId = call.getString("channelId", null);
            if (portalId != null && (portalId.trim().isEmpty() || portalId.equalsIgnoreCase("null")
                    || portalId.equalsIgnoreCase("undefined"))) {
                portalId = null;
            }
            if (channelId != null && (channelId.trim().isEmpty() || channelId.equalsIgnoreCase("null")
                    || channelId.equalsIgnoreCase("undefined"))) {
                channelId = null;
            }
            if (portalId != null && channelId != null) {
                MainActivity.activePortalChannelKey = portalId.trim() + "_" + channelId.trim();
                MainActivity.clearPortalChannelNotification(getContext(), portalId.trim(), channelId.trim());
            } else {
                MainActivity.activePortalChannelKey = null;
            }
            call.resolve();
        }

        @PluginMethod
        public void clearPortalChannelNotification(PluginCall call) {
            String portalId = call.getString("portalId", null);
            String channelId = call.getString("channelId", null);
            if (portalId != null && !portalId.trim().isEmpty()) {
                MainActivity.clearPortalChannelNotification(getContext(), portalId.trim(), channelId);
            }
            call.resolve();
        }

        @PluginMethod
        public void clearNotificationForSender(PluginCall call) {
            String senderId = call.getString("senderId", null);
            if (senderId != null && !senderId.trim().isEmpty()) {
                clearChatNotification(getContext(), senderId.trim());
            }
            call.resolve();
        }

        @PluginMethod
        public void clearAllMessageNotifications(PluginCall call) {
            try {
                android.app.NotificationManager nm = (android.app.NotificationManager) getContext()
                        .getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancelAll();
                }
                OxypaceMessagingService.clearAllHistory(getContext());
            } catch (Exception ignored) {
            }
            call.resolve();
        }
    }

    @CapacitorPlugin(name = "ShareTargetManager")
    public static class ShareTargetManager extends com.getcapacitor.Plugin {
        public static com.getcapacitor.JSObject sLatestPayload = null;

        @PluginMethod
        public void getSharedData(PluginCall call) {
            if (sLatestPayload != null) {
                call.resolve(sLatestPayload);
            } else {
                com.getcapacitor.JSObject empty = new com.getcapacitor.JSObject();
                empty.put("hasData", false);
                call.resolve(empty);
            }
        }

        @PluginMethod
        public void clearSharedData(PluginCall call) {
            sLatestPayload = null;
            call.resolve();
        }
    }

    @CapacitorPlugin(name = "AuthSync")
    public static class AuthSync extends com.getcapacitor.Plugin {
        @PluginMethod
        public void syncAuth(PluginCall call) {
            String token = call.getString("token", "");
            String serverUrl = call.getString("serverUrl", "https://oxypace.com.tr");
            String userId = call.getString("userId", null);
            String userName = call.getString("userName", "");
            String userAvatar = call.getString("userAvatar", "");
            com.getcapacitor.JSArray inactiveArr = call.getArray("inactiveUserIds");
            java.util.Set<String> inactiveSet = new java.util.HashSet<>();
            if (inactiveArr != null) {
                try {
                    for (int i = 0; i < inactiveArr.length(); i++) {
                        String id = inactiveArr.getString(i);
                        if (id != null && !id.trim().isEmpty()) {
                            inactiveSet.add(id.trim());
                        }
                    }
                } catch (Exception ignored) {
                }
            }
            DirectReplyReceiver.saveAuthCredentials(getContext(), token, serverUrl, userId, inactiveSet, userName,
                    userAvatar);

            // If a valid JWT token was provided, immediately push device FCM token to
            // backend
            if (token != null && !token.trim().isEmpty()) {
                final Context ctx = getContext();
                final String apiBase = (serverUrl != null && serverUrl.contains("oxypace.com.tr")
                        && !serverUrl.contains("api.oxypace.com.tr"))
                                ? "https://api.oxypace.com.tr"
                                : (serverUrl != null ? serverUrl.replaceAll("/+$", "") : "https://api.oxypace.com.tr");
                com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                        .addOnCompleteListener(task -> {
                            if (task.isSuccessful() && task.getResult() != null) {
                                String fcmToken = task.getResult();
                                try {
                                    ctx.getSharedPreferences(DirectReplyReceiver.PREFS_NAME, Context.MODE_PRIVATE)
                                            .edit()
                                            .putString("fcm_token", fcmToken)
                                            .apply();
                                } catch (Exception ignored) {
                                }
                                new Thread(() -> {
                                    try {
                                        String apiUrl = apiBase + "/api/users/fcm-token";
                                        java.net.URL url = new java.net.URL(apiUrl);
                                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url
                                                .openConnection();
                                        conn.setRequestMethod("POST");
                                        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                                        conn.setRequestProperty("Authorization", "Bearer " + token);
                                        conn.setDoOutput(true);
                                        conn.setConnectTimeout(8000);
                                        conn.setReadTimeout(8000);
                                        String jsonBody = "{\"token\":\"" + fcmToken + "\"}";
                                        try (java.io.OutputStream os = conn.getOutputStream()) {
                                            os.write(jsonBody.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                                        }
                                        int code = conn.getResponseCode();
                                        android.util.Log.d("AuthSync", "Immediate FCM token sync on AuthSync: " + code);
                                        conn.disconnect();
                                    } catch (Exception e) {
                                        android.util.Log.w("AuthSync",
                                                "Immediate FCM token sync error: " + e.getMessage());
                                    }
                                }).start();
                            }
                        });
            }

            call.resolve();
        }
    }

    @CapacitorPlugin(name = "NativeMediaPreloader")
    public static class NativeMediaPreloader extends com.getcapacitor.Plugin {
        @PluginMethod
        public void preloadUrls(PluginCall call) {
            com.getcapacitor.JSArray urls = call.getArray("urls");
            if (urls != null) {
                Context ctx = getContext();
                int limit = Math.min(urls.length(), 4);
                for (int i = 0; i < limit; i++) {
                    try {
                        String url = urls.getString(i);
                        if (url != null && !url.trim().isEmpty()) {
                            NativeMediaCacheManager.preload(ctx, url.trim());
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            call.resolve();
        }
    }

    @CapacitorPlugin(name = "ScreenOrientationManager")
    public static class ScreenOrientationManager extends com.getcapacitor.Plugin {
        @PluginMethod
        public void setOrientation(PluginCall call) {
            String orientation = call.getString("orientation", "unspecified");
            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    try {
                        if ("landscape".equalsIgnoreCase(orientation)) {
                            getActivity().setRequestedOrientation(
                                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        } else if ("portrait".equalsIgnoreCase(orientation)) {
                            getActivity().setRequestedOrientation(
                                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        } else {
                            getActivity().setRequestedOrientation(
                                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        }
                    } catch (Exception ignored) {
                    }
                });
            }
            call.resolve();
        }

        @PluginMethod
        public void toggleOrientation(PluginCall call) {
            if (getActivity() != null) {
                getActivity().runOnUiThread(() -> {
                    try {
                        int current = getActivity().getRequestedOrientation();
                        boolean isLandscape = (current == android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                                ||
                                current == android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE ||
                                getActivity().getResources()
                                        .getConfiguration().orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE);
                        if (isLandscape) {
                            getActivity().setRequestedOrientation(
                                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        } else {
                            getActivity().setRequestedOrientation(
                                    android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                        }
                    } catch (Exception ignored) {
                    }
                });
            }
            call.resolve();
        }
    }

    public static class NativeMediaCacheManager {
        private static final long MAX_CACHE_SIZE_BYTES = 120L * 1024L * 1024L; // 120 MB bounded disk cache
        private static final ExecutorService sWorkerPool = Executors.newFixedThreadPool(2, r -> {
            Thread t = new Thread(r, "oxypace-media-bg");
            t.setPriority(Thread.MIN_PRIORITY);
            t.setDaemon(true);
            return t;
        });
        private static File sCacheDir = null;

        public static synchronized void init(Context context) {
            if (sCacheDir == null && context != null) {
                sCacheDir = new File(context.getCacheDir(), "oxypace_native_media_cache");
                if (!sCacheDir.exists()) {
                    sCacheDir.mkdirs();
                }
                sWorkerPool.execute(NativeMediaCacheManager::pruneCacheIfNeeded);
            }
        }

        private static String getCacheKey(String url) {
            try {
                java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
                byte[] digest = md.digest(url.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (byte b : digest) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception e) {
                return String.valueOf(url.hashCode());
            }
        }

        public static boolean isMediaUrl(String url) {
            if (url == null)
                return false;
            String clean = url.toLowerCase().split("\\?")[0];
            if (clean.contains(".mp4") || clean.contains(".m3u8") || clean.contains(".mpd")
                    || clean.contains(".ts") || clean.contains(".webm") || clean.contains(".mov")
                    || clean.contains(".mkv") || clean.contains(".mp3") || clean.contains(".wav")
                    || clean.contains(".ogg") || clean.contains(".json") || clean.contains(".js")
                    || clean.contains(".css")) {
                return false;
            }
            return clean.endsWith(".webp") || clean.endsWith(".png") || clean.endsWith(".jpg")
                    || clean.endsWith(".jpeg") || clean.endsWith(".gif") || clean.endsWith(".svg")
                    || clean.endsWith(".ico") || clean.endsWith(".avif");
        }

        public static String guessMimeType(String url) {
            String clean = url.split("\\?")[0].toLowerCase();
            if (clean.endsWith(".webp"))
                return "image/webp";
            if (clean.endsWith(".png"))
                return "image/png";
            if (clean.endsWith(".jpg") || clean.endsWith(".jpeg"))
                return "image/jpeg";
            if (clean.endsWith(".gif"))
                return "image/gif";
            if (clean.endsWith(".svg"))
                return "image/svg+xml";
            if (clean.endsWith(".ico"))
                return "image/x-icon";
            if (clean.endsWith(".avif"))
                return "image/avif";
            return "image/webp";
        }

        public static android.webkit.WebResourceResponse handleIntercept(Context ctx,
                android.webkit.WebResourceRequest request) {
            if (ctx == null || request == null || request.getUrl() == null)
                return null;
            String urlStr = request.getUrl().toString();
            if (!isMediaUrl(urlStr))
                return null;

            Map<String, String> reqHeaders = request.getRequestHeaders();
            if (reqHeaders != null && (reqHeaders.containsKey("Range") || reqHeaders.containsKey("range"))) {
                return null;
            }

            init(ctx);
            if (sCacheDir == null)
                return null;

            String key = getCacheKey(urlStr);
            File cachedFile = new File(sCacheDir, key);

            // Serve ONLY instant disk cache HITs. Cache MISS returns null immediately so
            // Chromium's parallel HTTP/2 C++ network stack fetches asynchronously without
            // blocking the WebView IO thread.
            if (cachedFile.exists() && cachedFile.length() > 0) {
                try {
                    String mimeType = guessMimeType(urlStr);
                    Map<String, String> respHeaders = new HashMap<>();
                    respHeaders.put("Access-Control-Allow-Origin", "*");
                    respHeaders.put("Cache-Control", "public, max-age=31536000, immutable");
                    respHeaders.put("X-Oxypace-Native-Cache", "HIT");
                    return new android.webkit.WebResourceResponse(mimeType, "UTF-8", 200, "OK", respHeaders,
                            new FileInputStream(cachedFile));
                } catch (Exception ignored) {
                }
            }

            return null;
        }

        public static void preload(Context ctx, String urlStr) {
            if (ctx == null || urlStr == null || !isMediaUrl(urlStr))
                return;
            init(ctx);
            if (sCacheDir == null)
                return;

            sWorkerPool.execute(() -> {
                try {
                    String key = getCacheKey(urlStr);
                    File cachedFile = new File(sCacheDir, key);
                    if (cachedFile.exists() && cachedFile.length() > 0)
                        return;

                    URL targetUrl = new URL(urlStr);
                    HttpURLConnection conn = (HttpURLConnection) targetUrl.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(3500);
                    conn.setReadTimeout(5000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "OxypaceAndroid/2.6.5 (ProactivePreloader)");

                    if (conn.getResponseCode() == 200) {
                        File tmpFile = new File(sCacheDir, key + ".tmp");
                        try (InputStream in = conn.getInputStream();
                                FileOutputStream out = new FileOutputStream(tmpFile)) {
                            byte[] buffer = new byte[8192];
                            int read;
                            while ((read = in.read(buffer)) != -1) {
                                out.write(buffer, 0, read);
                            }
                        }
                        if (tmpFile.exists() && tmpFile.length() > 0) {
                            tmpFile.renameTo(cachedFile);
                        }
                    }
                    conn.disconnect();
                } catch (Exception ignored) {
                }
            });
        }

        private static void pruneCacheIfNeeded() {
            if (sCacheDir == null || !sCacheDir.exists())
                return;
            try {
                File[] files = sCacheDir.listFiles();
                if (files == null)
                    return;
                long totalSize = 0;
                for (File f : files) {
                    totalSize += f.length();
                }
                if (totalSize > MAX_CACHE_SIZE_BYTES) {
                    java.util.Arrays.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
                    for (File f : files) {
                        if (totalSize <= (MAX_CACHE_SIZE_BYTES * 0.75))
                            break;
                        long len = f.length();
                        if (f.delete()) {
                            totalSize -= len;
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    public static android.app.PictureInPictureParams buildPiPParams(android.app.Activity activity, boolean enabled) {
        if (activity == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O)
            return null;
        try {
            android.app.PictureInPictureParams.Builder builder = new android.app.PictureInPictureParams.Builder();
            android.util.DisplayMetrics dm = activity.getResources().getDisplayMetrics();
            android.util.Rational rational = (dm.widthPixels > dm.heightPixels)
                    ? new android.util.Rational(16, 9)
                    : new android.util.Rational(9, 16);
            builder.setAspectRatio(rational);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                builder.setAutoEnterEnabled(enabled);
                builder.setSeamlessResizeEnabled(true);
            }

            if (enabled) {
                // Set up 3 native RemoteActions on the PiP overlay:
                // 1) Mic Toggle, 2) Camera Toggle, 3) Hangup
                java.util.ArrayList<android.app.RemoteAction> actions = new java.util.ArrayList<>();

                // 1. Mic
                android.content.Intent micIntent = new android.content.Intent(activity, CallActionReceiver.class);
                micIntent.setAction(CallActionReceiver.ACTION_TOGGLE_MIC);
                android.app.PendingIntent piMic = android.app.PendingIntent.getBroadcast(
                        activity, 201, micIntent,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                android.graphics.drawable.Icon micIcon = android.graphics.drawable.Icon.createWithResource(
                        activity, CallManager.sIsMuted ? R.drawable.ic_pip_mic_off : R.drawable.ic_pip_mic);
                actions.add(new android.app.RemoteAction(
                        micIcon,
                        CallManager.sIsMuted ? "Mikrofonu Aç" : "Sesi Kapat",
                        CallManager.sIsMuted ? "Mikrofonu Aç" : "Sesi Kapat",
                        piMic));

                // 2. Camera
                android.content.Intent camIntent = new android.content.Intent(activity, CallActionReceiver.class);
                camIntent.setAction(CallActionReceiver.ACTION_TOGGLE_CAMERA);
                android.app.PendingIntent piCam = android.app.PendingIntent.getBroadcast(
                        activity, 202, camIntent,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                android.graphics.drawable.Icon camIcon = android.graphics.drawable.Icon.createWithResource(
                        activity, CallManager.sIsCameraOn ? R.drawable.ic_pip_cam : R.drawable.ic_pip_cam_off);
                actions.add(new android.app.RemoteAction(
                        camIcon,
                        CallManager.sIsCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç",
                        CallManager.sIsCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç",
                        piCam));

                // 3. Hangup
                android.content.Intent endIntent = new android.content.Intent(activity, CallActionReceiver.class);
                endIntent.setAction(CallActionReceiver.ACTION_HANGUP);
                android.app.PendingIntent piEnd = android.app.PendingIntent.getBroadcast(
                        activity, 203, endIntent,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                android.graphics.drawable.Icon endIcon = android.graphics.drawable.Icon.createWithResource(
                        activity, R.drawable.ic_pip_end_call);
                actions.add(new android.app.RemoteAction(
                        endIcon,
                        "Odadan Ayrıl",
                        "Odadan Ayrıl",
                        piEnd));

                builder.setActions(actions);
            }

            return builder.build();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static void updatePiPParams(android.app.Activity activity, boolean enabled) {
        if (activity == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O)
            return;
        try {
            android.app.PictureInPictureParams params = buildPiPParams(activity, enabled);
            if (params != null) {
                activity.setPictureInPictureParams(params);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (CallManager.isInCall && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            try {
                android.app.PictureInPictureParams params = buildPiPParams(this, true);
                if (params != null) {
                    enterPictureInPictureMode(params);
                } else {
                    enterPictureInPictureMode();
                }
            } catch (Throwable e) {
                try {
                    enterPictureInPictureMode();
                } catch (Throwable ignored) {
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Screen Capture (MediaProjection + VirtualDisplay + ImageReader)
    // ─────────────────────────────────────────────────────────────────────────

    private android.media.projection.MediaProjection mediaProjection = null;
    private android.hardware.display.VirtualDisplay virtualDisplay = null;
    private android.media.ImageReader imageReader = null;
    private android.os.HandlerThread captureThread = null;
    private android.os.Handler captureHandler = null;
    private android.media.AudioRecord screenAudioRecord = null;
    private Thread screenAudioThread = null;
    private volatile boolean isScreenAudioCapturing = false;
    private long lastFrameTimeMs = 0;
    private int lastScreenCaptureWidth = 540;
    private int lastScreenCaptureHeight = 1200;
    public static volatile boolean sMoveToBackAfterScreenCapture = false;

    public boolean startScreenProjection(int resultCode, android.content.Intent data) {
        stopScreenProjection();

        try {
            android.media.projection.MediaProjectionManager mpm = (android.media.projection.MediaProjectionManager) getSystemService(
                    Context.MEDIA_PROJECTION_SERVICE);
            if (mpm == null) {
                android.util.Log.e("MainActivity", "MediaProjectionManager is null");
                return false;
            }

            mediaProjection = mpm.getMediaProjection(resultCode, data);
            if (mediaProjection == null) {
                android.util.Log.e("MainActivity", "MediaProjection is null after getMediaProjection");
                return false;
            }

            mediaProjection.registerCallback(new android.media.projection.MediaProjection.Callback() {
                @Override
                public void onStop() {
                    stopScreenProjection();
                    try {
                        com.getcapacitor.Bridge bridge = getBridgeInstance();
                        if (bridge != null && bridge.getWebView() != null) {
                            bridge.getWebView().post(() -> {
                                bridge.getWebView().evaluateJavascript(
                                        "window.dispatchEvent(new CustomEvent('oxypace:screenshare_stopped'));", null);
                            });
                        }
                    } catch (Exception ignored) {
                    }
                }
            }, null);

            android.util.DisplayMetrics dm = new android.util.DisplayMetrics();
            try {
                getWindowManager().getDefaultDisplay().getRealMetrics(dm);
            } catch (Exception e) {
                dm = getResources().getDisplayMetrics();
            }
            int realW = dm.widthPixels > 0 ? dm.widthPixels : 1080;
            int realH = dm.heightPixels > 0 ? dm.heightPixels : 2400;
            int width;
            int height;
            if (realW <= realH) {
                width = 540;
                height = Math.round(540f * ((float) realH / (float) realW));
            } else {
                height = 540;
                width = Math.round(540f * ((float) realW / (float) realH));
            }
            if (width % 2 != 0)
                width++;
            if (height % 2 != 0)
                height++;
            lastScreenCaptureWidth = width;
            lastScreenCaptureHeight = height;

            captureThread = new android.os.HandlerThread("ScreenCaptureThread");
            captureThread.start();
            captureHandler = new android.os.Handler(captureThread.getLooper());

            imageReader = android.media.ImageReader.newInstance(width, height, android.graphics.PixelFormat.RGBA_8888,
                    2);

            virtualDisplay = mediaProjection.createVirtualDisplay(
                    "OxypaceScreenCapture",
                    width, height, dm.densityDpi,
                    android.hardware.display.DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                    imageReader.getSurface(),
                    null,
                    captureHandler);

            final int captureWidth = width;
            final int captureHeight = height;

            imageReader.setOnImageAvailableListener(reader -> {
                android.media.Image image = null;
                try {
                    image = reader.acquireLatestImage();
                    if (image == null)
                        return;

                    long now = System.currentTimeMillis();
                    if (now - lastFrameTimeMs < 35) {
                        return;
                    }
                    lastFrameTimeMs = now;

                    android.media.Image.Plane[] planes = image.getPlanes();
                    java.nio.ByteBuffer buffer = planes[0].getBuffer();
                    int pixelStride = planes[0].getPixelStride();
                    int rowStride = planes[0].getRowStride();
                    int rowPadding = rowStride - pixelStride * captureWidth;

                    android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(
                            captureWidth + rowPadding / pixelStride,
                            captureHeight,
                            android.graphics.Bitmap.Config.ARGB_8888);
                    bitmap.copyPixelsFromBuffer(buffer);

                    android.graphics.Bitmap finalBitmap = (rowPadding > 0)
                            ? android.graphics.Bitmap.createBitmap(bitmap, 0, 0, captureWidth, captureHeight)
                            : bitmap;

                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream(65536);
                    finalBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 60, baos);
                    byte[] jpegBytes = baos.toByteArray();
                    String base64 = android.util.Base64.encodeToString(jpegBytes, android.util.Base64.NO_WRAP);

                    if (bitmap != finalBitmap) {
                        bitmap.recycle();
                    }
                    finalBitmap.recycle();

                    com.getcapacitor.Bridge bridge = getBridgeInstance();
                    if (bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().post(() -> {
                            try {
                                if (!isAppForeground) {
                                    bridge.getWebView().resumeTimers();
                                }
                                bridge.getWebView().evaluateJavascript(
                                        "if (window.onNativeScreenFrame) { window.onNativeScreenFrame('" + base64
                                                + "'); }",
                                        null);
                            } catch (Exception ignored) {
                            }
                        });
                    }

                } catch (Exception ignored) {
                } finally {
                    if (image != null) {
                        try {
                            image.close();
                        } catch (Exception ignored) {
                        }
                    }
                }
            }, captureHandler);

            android.util.Log.d("MainActivity", "Screen projection successfully started at " + width + "x" + height);
            startScreenAudioCapture(mediaProjection);
            return true;

        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to start screen projection: " + e.getMessage(), e);
            stopScreenProjection();
            return false;
        }
    }

    private void startScreenAudioCapture(android.media.projection.MediaProjection projection) {
        if (projection == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
            return;
        }
        try {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this,
                    android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                android.util.Log.w("MainActivity", "Skipping AudioPlaybackCapture: RECORD_AUDIO not granted");
                return;
            }
            final int sampleRate = 24000;
            android.media.AudioPlaybackCaptureConfiguration config = new android.media.AudioPlaybackCaptureConfiguration.Builder(
                    projection)
                    .addMatchingUsage(android.media.AudioAttributes.USAGE_MEDIA)
                    .addMatchingUsage(android.media.AudioAttributes.USAGE_GAME)
                    .addMatchingUsage(android.media.AudioAttributes.USAGE_UNKNOWN)
                    .build();

            int minBuf = android.media.AudioRecord.getMinBufferSize(
                    sampleRate,
                    android.media.AudioFormat.CHANNEL_IN_MONO,
                    android.media.AudioFormat.ENCODING_PCM_16BIT);
            int bufSize = Math.max(minBuf > 0 ? minBuf : 3840, 3840);

            android.media.AudioFormat format = new android.media.AudioFormat.Builder()
                    .setEncoding(android.media.AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(android.media.AudioFormat.CHANNEL_IN_MONO)
                    .build();

            screenAudioRecord = new android.media.AudioRecord.Builder()
                    .setAudioPlaybackCaptureConfig(config)
                    .setAudioFormat(format)
                    .setBufferSizeInBytes(bufSize)
                    .build();

            if (screenAudioRecord.getState() != android.media.AudioRecord.STATE_INITIALIZED) {
                android.util.Log.w("MainActivity", "AudioRecord playback capture not initialized");
                try {
                    screenAudioRecord.release();
                } catch (Exception ignored) {
                }
                screenAudioRecord = null;
                return;
            }

            isScreenAudioCapturing = true;
            screenAudioRecord.startRecording();

            screenAudioThread = new Thread(() -> {
                byte[] pcmBuf = new byte[1920]; // 960 samples @ 24kHz = 40ms PCM16
                while (isScreenAudioCapturing && screenAudioRecord != null) {
                    try {
                        int read = screenAudioRecord.read(pcmBuf, 0, pcmBuf.length);
                        if (read > 0) {
                            byte[] chunk = (read == pcmBuf.length) ? pcmBuf : java.util.Arrays.copyOf(pcmBuf, read);
                            String b64 = android.util.Base64.encodeToString(chunk, android.util.Base64.NO_WRAP);
                            com.getcapacitor.Bridge bridge = getBridgeInstance();
                            if (bridge != null && bridge.getWebView() != null) {
                                bridge.getWebView().post(() -> {
                                    try {
                                        bridge.getWebView().evaluateJavascript(
                                                "if (window.onNativeScreenAudio) { window.onNativeScreenAudio('" + b64
                                                        + "', " + sampleRate + "); }",
                                                null);
                                    } catch (Exception ignored) {
                                    }
                                });
                            }
                        } else if (read < 0) {
                            break;
                        }
                    } catch (Throwable t) {
                        break;
                    }
                }
            }, "ScreenAudioCaptureThread");
            screenAudioThread.start();
            android.util.Log.d("MainActivity", "AudioPlaybackCapture started for screen share");
        } catch (Throwable err) {
            android.util.Log.w("MainActivity", "AudioPlaybackCapture unavailable: " + err.getMessage());
            isScreenAudioCapturing = false;
            if (screenAudioRecord != null) {
                try {
                    screenAudioRecord.release();
                } catch (Exception ignored) {
                }
                screenAudioRecord = null;
            }
        }
    }

    public void stopScreenProjection() {
        isScreenAudioCapturing = false;
        try {
            if (screenAudioThread != null) {
                screenAudioThread.interrupt();
                screenAudioThread = null;
            }
            if (screenAudioRecord != null) {
                try {
                    screenAudioRecord.stop();
                } catch (Exception ignored) {
                }
                try {
                    screenAudioRecord.release();
                } catch (Exception ignored) {
                }
                screenAudioRecord = null;
            }
        } catch (Exception ignored) {
        }
        try {
            if (virtualDisplay != null) {
                virtualDisplay.release();
                virtualDisplay = null;
            }
            if (imageReader != null) {
                imageReader.close();
                imageReader = null;
            }
            if (mediaProjection != null) {
                mediaProjection.stop();
                mediaProjection = null;
            }
            if (captureThread != null) {
                captureThread.quitSafely();
                captureThread = null;
                captureHandler = null;
            }
            if (ActiveCallService.sInstance != null) {
                ActiveCallService.sInstance.revertFromMediaProjection();
            } else {
                try {
                    android.content.Intent revertIntent = new android.content.Intent(this, ActiveCallService.class);
                    revertIntent.setAction("DISABLE_MEDIA_PROJECTION");
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        startForegroundService(revertIntent);
                    } else {
                        startService(revertIntent);
                    }
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CallManager.REQUEST_CODE_SCREEN_CAPTURE) {
            if (resultCode == RESULT_OK && data != null) {
                // Elevate ActiveCallService synchronously before initializing projection on
                // Android 14+
                if (ActiveCallService.sInstance != null) {
                    ActiveCallService.sInstance.elevateToMediaProjection();
                } else {
                    try {
                        android.content.Intent elevateIntent = new android.content.Intent(this,
                                ActiveCallService.class);
                        elevateIntent.setAction("ENABLE_MEDIA_PROJECTION");
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            startForegroundService(elevateIntent);
                        } else {
                            startService(elevateIntent);
                        }
                    } catch (Exception ignored) {
                    }
                }

                boolean started = startScreenProjection(resultCode, data);
                if (CallManager.sScreenCaptureCall != null) {
                    if (started) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("width", lastScreenCaptureWidth);
                        ret.put("height", lastScreenCaptureHeight);
                        CallManager.sScreenCaptureCall.resolve(ret);
                    } else {
                        CallManager.sScreenCaptureCall.reject("Ekran paylaşımı başlatılamadı");
                    }
                    CallManager.sScreenCaptureCall = null;
                }
                if (sMoveToBackAfterScreenCapture) {
                    sMoveToBackAfterScreenCapture = false;
                    moveTaskToBack(true);
                    keepWebViewAliveInBackground();
                }
            } else {
                if (CallManager.sScreenCaptureCall != null) {
                    CallManager.sScreenCaptureCall.reject("Kullanıcı ekran paylaşım iznini reddetti");
                    CallManager.sScreenCaptureCall = null;
                }
                if (sMoveToBackAfterScreenCapture) {
                    sMoveToBackAfterScreenCapture = false;
                    moveTaskToBack(true);
                    keepWebViewAliveInBackground();
                }
            }
        }
    }

    private static com.getcapacitor.Bridge bridgeInstance = null;
    private static MainActivity activityInstance = null;
    private String pendingRoute = null;
    private boolean pendingIsJoinVoice = false;
    private int lastAppliedStatusDp = -1;
    private int lastAppliedBottomDp = -1;
    private Boolean lastAppliedIs3Btn = null;
    private static Boolean sCachedIs3Btn = null;
    private static long sLastNavCheckMs = 0L;

    public static com.getcapacitor.Bridge getBridgeInstance() {
        return bridgeInstance;
    }

    public static MainActivity getActivityInstance() {
        return activityInstance;
    }

    private static final String EXPECTED_RELEASE_SHA256 = "2867299FC89AB8ADC85D0F803AA32A85BFE7CE03FBD8DD28BF808E5BEAA45A17";

    private void verifyAppIntegrity() {
        try {
            boolean isDebuggable = (getApplicationInfo().flags
                    & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
            if (isDebuggable) {
                // Allow debug builds for local testing
                return;
            }

            // 1. Anti-Debugger check
            if (android.os.Debug.isDebuggerConnected() || android.os.Debug.waitingForDebugger()) {
                android.util.Log.e("Security", "Debugger detected. Terminating process.");
                finishAffinity();
                System.exit(0);
                return;
            }

            // 2. Cryptographic signature verification check
            String currentCertSha256 = null;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                android.content.pm.PackageInfo packageInfo = getPackageManager().getPackageInfo(
                        getPackageName(),
                        android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES);
                if (packageInfo != null && packageInfo.signingInfo != null) {
                    android.content.pm.Signature[] signatures = packageInfo.signingInfo.getApkContentsSigners();
                    if (signatures != null && signatures.length > 0) {
                        currentCertSha256 = computeSha256(signatures[0].toByteArray());
                    }
                }
            } else {
                @SuppressWarnings("deprecation")
                android.content.pm.PackageInfo packageInfo = getPackageManager().getPackageInfo(
                        getPackageName(),
                        android.content.pm.PackageManager.GET_SIGNATURES);
                if (packageInfo != null && packageInfo.signatures != null && packageInfo.signatures.length > 0) {
                    currentCertSha256 = computeSha256(packageInfo.signatures[0].toByteArray());
                }
            }

            if (currentCertSha256 == null || !currentCertSha256.equalsIgnoreCase(EXPECTED_RELEASE_SHA256)) {
                android.util.Log.e("Security", "Tamper detected: Invalid signature! Terminating process.");
                finishAffinity();
                System.exit(0);
                return;
            }
        } catch (Throwable e) {
            android.util.Log.e("Security", "Integrity check failed: " + e.getMessage());
            boolean isDebuggable = (getApplicationInfo().flags
                    & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
            if (!isDebuggable) {
                finishAffinity();
                System.exit(0);
            }
        }
    }

    private static String computeSha256(byte[] data) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02X", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        verifyAppIntegrity();
        activityInstance = this;
        registerPlugin(DownloaderPlugin.class);
        registerPlugin(CallManager.class);
        registerPlugin(AuthSync.class);
        registerPlugin(ChatNotificationManager.class);
        registerPlugin(SystemBarManager.class);
        registerPlugin(NativeMediaPreloader.class);
        registerPlugin(ScreenOrientationManager.class);
        registerPlugin(ShareTargetManager.class);
        registerPlugin(MediaControlsPlugin.class);
        super.onCreate(savedInstanceState);
        bridgeInstance = getBridge();
        OtaBackgroundScheduler.schedulePeriodicChecks(getApplicationContext());
        handleShareIntent(getIntent());

        // Dynamically detect system navigation bar mode (3-button vs gesture
        // navigation) and safe-areas via WindowInsetsListener (avoids per-frame OnGlobalLayoutListener storms)
        try {
            android.view.View decorView = getWindow().getDecorView();
            ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
                try {
                    float density = getResources().getDisplayMetrics().density;
                    if (density <= 0)
                        density = 1.0f;

                    Insets statusInsets = insets
                            .getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout());
                    float statusDp = statusInsets.top / density;
                    sStatusBarTopDp = Math.max(statusDp, 0f);

                    Insets navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                    float navDp = navInsets.bottom / density;

                    boolean is3Btn = is3ButtonNavigation(this, navDp);
                    sNavBarBottomDp = is3Btn ? Math.max(navDp, 48.0f) : (navDp > 0 ? navDp : 0f);
                    sIs3ButtonNav = is3Btn;

                    applyInsetsToWebView();
                } catch (Exception ignored) {
                }
                return insets;
            });
        } catch (Exception ignored) {
        }
        checkAndApplySystemInsets();

        // Dismiss any orphaned call notification on app launch if not in active call
        try {
            if (!CallManager.isInCall) {
                android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(
                        Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancel(ActiveCallService.NOTIFICATION_ID);
                }
            }
        } catch (Exception ignored) {
        }

        // Programmatically configure window to display over lock screen and turn screen
        // on (Android 8.0 / 27+)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            try {
                android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(
                        Context.KEYGUARD_SERVICE);
                if (km != null) {
                    km.requestDismissKeyguard(this, null);
                }
            } catch (Exception ignored) {
            }
        } else {
            // Deprecated flags for older Android versions
            getWindow().addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                            android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }

        // Android Runtime Permissions (Microphone, Camera, Notifications)
        java.util.List<String> permissionsNeeded = new java.util.ArrayList<>();
        if (androidx.core.content.ContextCompat.checkSelfPermission(this,
                android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.RECORD_AUDIO);
        }
        if (androidx.core.content.ContextCompat.checkSelfPermission(this,
                android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.CAMERA);
        }
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this,
                    android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(android.Manifest.permission.POST_NOTIFICATIONS);
            }
        }
        if (!permissionsNeeded.isEmpty()) {
            androidx.core.app.ActivityCompat.requestPermissions(
                    this,
                    permissionsNeeded.toArray(new String[0]),
                    1001);
        }

        // Proactively fetch and sync FCM token on startup
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                    .addOnCompleteListener(task -> {
                        if (task.isSuccessful() && task.getResult() != null) {
                            String currentToken = task.getResult();
                            android.util.Log.d("MainActivity", "Proactive FCM Token obtained: " + currentToken);
                            android.content.SharedPreferences prefs = getSharedPreferences("OxypaceAuthPrefs",
                                    Context.MODE_PRIVATE);
                            prefs.edit().putString("fcm_token", currentToken).apply();

                            String jwtToken = prefs.getString("jwt_token", null);
                            String serverUrl = prefs.getString("server_url", "https://api.oxypace.com.tr");
                            String apiBase = (serverUrl != null && serverUrl.contains("oxypace.com.tr")
                                    && !serverUrl.contains("api.oxypace.com.tr"))
                                            ? "https://api.oxypace.com.tr"
                                            : (serverUrl != null ? serverUrl.replaceAll("/+$", "")
                                                    : "https://api.oxypace.com.tr");
                            if (jwtToken != null && !jwtToken.isEmpty()) {
                                new Thread(() -> {
                                    try {
                                        String apiUrl = apiBase + "/api/users/fcm-token";
                                        java.net.URL url = new java.net.URL(apiUrl);
                                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url
                                                .openConnection();
                                        conn.setRequestMethod("POST");
                                        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                                        conn.setRequestProperty("Authorization", "Bearer " + jwtToken);
                                        conn.setDoOutput(true);
                                        conn.setConnectTimeout(8000);
                                        conn.setReadTimeout(8000);
                                        String jsonBody = "{\"token\":\"" + currentToken + "\"}";
                                        try (java.io.OutputStream os = conn.getOutputStream()) {
                                            os.write(jsonBody.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                                        }
                                        int code = conn.getResponseCode();
                                        android.util.Log.d("MainActivity", "Proactive FCM Token sync HTTP: " + code);
                                        conn.disconnect();
                                    } catch (Exception syncEx) {
                                        android.util.Log.w("MainActivity",
                                                "Proactive FCM sync failed: " + syncEx.getMessage());
                                    }
                                }).start();
                            }
                        }
                    });
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Could not fetch FCM token proactively: " + e.getMessage());
        }

        // Handle JOIN_VOICE_CALL intent from incoming call notification
        handleIncomingCallIntent(getIntent());

        // Initialize and register all notification channels upfront so Android OS never
        // drops notifications
        initNotificationChannels();

        // Listen for wired and Bluetooth headset connection/disconnection
        setupAudioDeviceMonitoring();

        android.webkit.WebView webView = getBridge().getWebView();

        if (webView != null) {
            // Use LAYER_TYPE_NONE on a hardware-accelerated Window so Chromium renders
            // directly without an extra full-screen offscreen FBO texture blit & VRAM allocation
            webView.setLayerType(android.view.View.LAYER_TYPE_NONE, null);

            android.webkit.WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);

            // High-performance rendering flags (avoid offscreen GPU VRAM exhaustion on low-end devices)
            try {
                settings.setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    settings.setOffscreenPreRaster(false);
                }
            } catch (Exception ignored) {
            }

            // WebChromeClient for HTML5 Video & Media in WebView
            webView.setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                    runOnUiThread(() -> request.grant(request.getResources()));
                }
            });

            // Enable hardware acceleration at the WebSettings level if supported
            try {
                android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            } catch (Exception e) {
                e.printStackTrace();
            }

            webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(getBridge()) {
                @Override
                public android.webkit.WebResourceResponse shouldInterceptRequest(android.webkit.WebView view,
                        android.webkit.WebResourceRequest request) {
                    // 1. Ultra-fast Native Disk Media Cache (<0.2ms zero-latency load for cached
                    // avatars, banners, badges, gifs, images)
                    android.webkit.WebResourceResponse cached = NativeMediaCacheManager
                            .handleIntercept(MainActivity.this, request);
                    if (cached != null) {
                        return cached;
                    }

                    // 2. Fallback to Capacitor internal assets handler
                    return super.shouldInterceptRequest(view, request);
                }

                @Override
                public boolean shouldOverrideUrlLoading(android.webkit.WebView view,
                        android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    String scheme = request.getUrl().getScheme();
                    // Intercept external app URI schemes and launch via Android Intent
                    if (scheme != null && (scheme.equals("whatsapp") ||
                            scheme.equals("twitter") ||
                            scheme.equals("fb") ||
                            scheme.equals("instagram") ||
                            scheme.equals("tg") ||
                            scheme.equals("mailto"))) {
                        try {
                            android.content.Intent intent = new android.content.Intent(
                                    android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                            MainActivity.this.startActivity(intent);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        return true;
                    }

                    // Let http/https and capacitor:// be handled normally
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public void onPageFinished(android.webkit.WebView view, String url) {
                    super.onPageFinished(view, url);
                    // Ensure system navigation safe-area insets are applied to newly loaded DOM
                    lastAppliedStatusDp = -1;
                    lastAppliedBottomDp = -1;
                    lastAppliedIs3Btn = null;
                    applyInsetsToWebView();

                    // Automatically extract auth token and user id from WebView localStorage
                    try {
                        view.evaluateJavascript(
                                "(function() { " +
                                        "  var t = localStorage.getItem('token') || ''; " +
                                        "  var u = ''; " +
                                        "  try { var user = JSON.parse(localStorage.getItem('user')); if (user && user._id) u = user._id; } catch(e){} "
                                        +
                                        "  return JSON.stringify({ token: t, userId: u }); " +
                                        "})();",
                                value -> {
                                    if (value != null && !value.isEmpty() && !value.equals("\"\"")
                                            && !value.equals("null")) {
                                        try {
                                            String clean = value;
                                            if (clean.startsWith("\"") && clean.endsWith("\"")) {
                                                clean = clean.substring(1, clean.length() - 1).replace("\\\"", "\"");
                                            }
                                            org.json.JSONObject obj = new org.json.JSONObject(clean);
                                            String cleanToken = obj.optString("token", "").trim();
                                            String cleanUserId = obj.optString("userId", "").trim();
                                            DirectReplyReceiver.saveAuthCredentials(MainActivity.this, cleanToken,
                                                    "https://oxypace.com.tr", cleanUserId);
                                        } catch (Exception ex) {
                                            String cleanToken = value.replace("\"", "").trim();
                                            DirectReplyReceiver.saveAuthCredentials(MainActivity.this, cleanToken,
                                                    "https://oxypace.com.tr");
                                        }
                                    }
                                });
                    } catch (Exception ignored) {
                    }

                    // If a notification click queued a pending route while app was cold-starting,
                    // execute it now
                    if (pendingRoute != null && !pendingRoute.isEmpty()) {
                        final String routeToDispatch = pendingRoute;
                        final boolean isVoiceToDispatch = pendingIsJoinVoice;
                        pendingRoute = null;
                        pendingIsJoinVoice = false;

                        view.postDelayed(() -> {
                            try {
                                String script = "(function(){ " +
                                        "try { " +
                                        "  sessionStorage.setItem('pending_mobile_route', '"
                                        + routeToDispatch.replace("'", "\\'") + "'); " +
                                        "  if (" + isVoiceToDispatch + ") { " +
                                        "    window.dispatchEvent(new CustomEvent('oxypace:join_voice', { detail: { route: '"
                                        + routeToDispatch.replace("'", "\\'") + "' } })); " +
                                        "  } " +
                                        "  if (window.__oxypaceNavigate) { " +
                                        "    window.__oxypaceNavigate('" + routeToDispatch.replace("'", "\\'") + "'); "
                                        +
                                        "  } else { " +
                                        "    window.location.href = '" + routeToDispatch.replace("'", "\\'") + "'; " +
                                        "  } " +
                                        "} catch(e) { window.location.href = '" + routeToDispatch.replace("'", "\\'")
                                        + "'; } " +
                                        "})();";
                                view.evaluateJavascript(script, null);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }, 500);
                    }
                }
            });
        }
    }

    public static boolean is3ButtonNavigation(android.content.Context context, float navDp) {
        if (context == null)
            return false;
        long now = android.os.SystemClock.elapsedRealtime();
        if (sCachedIs3Btn != null && (now - sLastNavCheckMs) < 5000L) {
            return sCachedIs3Btn;
        }
        try {
            android.content.ContentResolver cr = context.getContentResolver();
            Boolean resolved = null;

            // 1. Samsung OneUI: navigation_bar_gesture_while_hidden
            int samsungGesture = Settings.Global.getInt(cr, "navigation_bar_gesture_while_hidden", -1);
            if (samsungGesture == 0)
                resolved = true;
            else if (samsungGesture == 1)
                resolved = false;

            // 2. Xiaomi MIUI / HyperOS: force_fsg_nav_bar
            if (resolved == null) {
                int miuiFsg = Settings.Global.getInt(cr, "force_fsg_nav_bar", -1);
                if (miuiFsg == 0)
                    resolved = true;
                else if (miuiFsg == 1)
                    resolved = false;
            }

            // 3. Vivo / Funtouch: navigation_gesture_on
            if (resolved == null) {
                int vivoGesture = Settings.Secure.getInt(cr, "navigation_gesture_on", -1);
                if (vivoGesture == 0)
                    resolved = true;
                else if (vivoGesture == 1)
                    resolved = false;
            }

            // 4. Huawei / Honor: navigationbar_is_min
            if (resolved == null) {
                int huaweiNav = Settings.System.getInt(cr, "navigationbar_is_min", -1);
                if (huaweiNav == 0)
                    resolved = true;
                else if (huaweiNav == 1)
                    resolved = false;
            }

            // 5. AOSP Standard: navigation_mode (0 = 3 button, 1 = 2 button, 2 = gesture)
            if (resolved == null) {
                int aospMode = Settings.Secure.getInt(cr, "navigation_mode", -1);
                if (aospMode == 0 || aospMode == 1)
                    resolved = true;
                else if (aospMode == 2)
                    resolved = false;
            }

            if (resolved != null) {
                sCachedIs3Btn = resolved;
                sLastNavCheckMs = now;
                return resolved;
            }
        } catch (Exception ignored) {
        }

        // Fallback: If bottom nav insets are >= 40dp, it is definitely a 3-button bar
        return navDp >= 40.0f;
    }

    public void applyInsetsToWebView() {
        runOnUiThread(() -> {
            try {
                android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    final int navDp = Math.round(sNavBarBottomDp);
                    final int statusDp = Math.round(sStatusBarTopDp);
                    final boolean is3Btn = sIs3ButtonNav;
                    final int effectiveBottomDp = is3Btn ? Math.max(navDp, 48) : navDp;
                    if (statusDp == lastAppliedStatusDp
                            && effectiveBottomDp == lastAppliedBottomDp
                            && Boolean.valueOf(is3Btn).equals(lastAppliedIs3Btn)) {
                        return;
                    }
                    lastAppliedStatusDp = statusDp;
                    lastAppliedBottomDp = effectiveBottomDp;
                    lastAppliedIs3Btn = is3Btn;

                    String script = "(function() {" +
                            "  try {" +
                            "    var doc = document.documentElement;" +
                            "    if (!doc) return;" +
                            "    doc.style.setProperty('--safe-area-top', '" + statusDp + "px');" +
                            "    doc.style.setProperty('--system-top-height', '" + statusDp + "px');" +
                            "    if (" + is3Btn + ") {" +
                            "      doc.classList.add('has-3button-nav');" +
                            "      doc.classList.remove('has-gesture-nav');" +
                            "      doc.style.setProperty('--safe-area-bottom', '" + effectiveBottomDp + "px');" +
                            "      doc.style.setProperty('--system-nav-height', '" + effectiveBottomDp + "px');" +
                            "    } else {" +
                            "      doc.classList.remove('has-3button-nav');" +
                            "      doc.classList.add('has-gesture-nav');" +
                            "      doc.style.setProperty('--safe-area-bottom', '" + effectiveBottomDp + "px');" +
                            "      doc.style.setProperty('--system-nav-height', '" + effectiveBottomDp + "px');" +
                            "    }" +
                            "    window.__oxypaceSystemBars = { navBottom: " + effectiveBottomDp + ", statusBarTop: "
                            + statusDp + ", is3ButtonNav: " + is3Btn + " };" +
                            "    window.dispatchEvent(new CustomEvent('oxypace:systembars', { detail: window.__oxypaceSystemBars }));"
                            +
                            "  } catch(e) {}" +
                            "})();";
                    webView.evaluateJavascript(script, null);
                }
            } catch (Exception ignored) {
            }
        });
    }

    private void checkAndApplySystemInsets() {
        try {
            float density = getResources().getDisplayMetrics().density;
            if (density <= 0)
                density = 1.0f;

            float navDp = 0f;
            float statusDp = 0f;
            android.view.View decorView = getWindow().getDecorView();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
            if (insets != null) {
                Insets statusInsets = insets
                        .getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout());
                statusDp = statusInsets.top / density;
                Insets navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                navDp = navInsets.bottom / density;
            }

            sStatusBarTopDp = Math.max(statusDp, 0f);
            boolean is3Btn = is3ButtonNavigation(this, navDp);
            sNavBarBottomDp = is3Btn ? Math.max(navDp, 48.0f) : (navDp > 0 ? navDp : 0f);
            sIs3ButtonNav = is3Btn;

            applyInsetsToWebView();
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onDestroy() {
        stopScreenProjection();
        if (bridgeInstance == getBridge()) {
            bridgeInstance = null;
        }
        if (activityInstance == this) {
            activityInstance = null;
        }
        super.onDestroy();
    }

    public static void keepWebViewAliveStatic() {
        MainActivity act = activityInstance;
        if (act != null) {
            act.keepWebViewAliveInBackground();
        }
    }

    public void keepWebViewAliveInBackground() {
        if (!CallManager.isInCall)
            return;
        runOnUiThread(() -> {
            try {
                android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.onResume();
                    webView.resumeTimers();
                    webView.dispatchWindowVisibilityChanged(android.view.View.VISIBLE);
                }
            } catch (Exception ignored) {
            }
        });
    }

    private void scheduleWebViewKeepAlivePulses() {
        if (!CallManager.isInCall)
            return;
        keepWebViewAliveInBackground();
        android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
        h.postDelayed(this::keepWebViewAliveInBackground, 120);
        h.postDelayed(this::keepWebViewAliveInBackground, 400);
        h.postDelayed(this::keepWebViewAliveInBackground, 900);
    }

    @Override
    public void finish() {
        if (CallManager.isInCall) {
            android.util.Log.d("MainActivity",
                    "Intercepted finish() during active call (e.g. PiP X button); moving task to back to keep call & camera alive.");
            moveTaskToBack(true);
            scheduleWebViewKeepAlivePulses();
            return;
        }
        super.finish();
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode,
            android.content.res.Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        try {
            if (CallManager.isInCall) {
                scheduleWebViewKeepAlivePulses();
            }
            android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.resumeTimers();
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('pipModeChanged', { detail: { isInPiP: "
                                        + isInPictureInPictureMode + " } }));",
                                null);
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        checkAndApplySystemInsets();
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(this::checkAndApplySystemInsets, 120);
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppForeground = true;
        checkAndApplySystemInsets();
        if (activeChatPartnerId != null) {
            clearChatNotification(this, activeChatPartnerId);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        isAppForeground = false;
        if (CallManager.isInCall || MediaPlaybackService.isActive || (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N
                && isInPictureInPictureMode())) {
            // Keep WebView and Camera/WebRTC/Audio playback active in background
            scheduleWebViewKeepAlivePulses();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (CallManager.isInCall || MediaPlaybackService.isActive || (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N
                && isInPictureInPictureMode())) {
            // Keep WebView and Camera/WebRTC/Audio playback active in background or when
            // PiP X button hides the window
            scheduleWebViewKeepAlivePulses();
        }
    }

    // Called when app is already running and a new Intent arrives (e.g. tapping
    // notification while app is open)
    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
        handleIncomingCallIntent(intent);
    }

    /**
     * Handles external Android Send Intent (ACTION_SEND / ACTION_SEND_MULTIPLE)
     * from Gallery, File managers (Dosyalar), social apps, browser, etc.
     */
    private void handleShareIntent(android.content.Intent intent) {
        if (intent == null)
            return;
        String action = intent.getAction();
        if (!android.content.Intent.ACTION_SEND.equals(action)
                && !android.content.Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            return;
        }

        try {
            com.getcapacitor.JSObject payload = new com.getcapacitor.JSObject();
            payload.put("hasData", true);

            String sharedText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);
            String sharedSubject = intent.getStringExtra(android.content.Intent.EXTRA_SUBJECT);
            payload.put("text", sharedText != null ? sharedText : "");
            payload.put("subject", sharedSubject != null ? sharedSubject : "");

            com.getcapacitor.JSArray filesArray = new com.getcapacitor.JSArray();

            java.util.List<android.net.Uri> uris = new java.util.ArrayList<>();
            if (android.content.Intent.ACTION_SEND.equals(action)) {
                android.net.Uri uri = intent.getParcelableExtra(android.content.Intent.EXTRA_STREAM);
                if (uri != null)
                    uris.add(uri);
            } else if (android.content.Intent.ACTION_SEND_MULTIPLE.equals(action)) {
                java.util.ArrayList<android.net.Uri> list = intent
                        .getParcelableArrayListExtra(android.content.Intent.EXTRA_STREAM);
                if (list != null)
                    uris.addAll(list);
            }

            java.io.File cacheDir = new java.io.File(getCacheDir(), "shared_uploads");
            if (!cacheDir.exists())
                cacheDir.mkdirs();

            for (android.net.Uri uri : uris) {
                try {
                    String displayName = "share_" + System.currentTimeMillis();
                    String mimeType = getContentResolver().getType(uri);

                    android.database.Cursor cursor = getContentResolver().query(uri, null, null, null, null);
                    if (cursor != null) {
                        try {
                            if (cursor.moveToFirst()) {
                                int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                                if (nameIndex >= 0) {
                                    String n = cursor.getString(nameIndex);
                                    if (n != null && !n.trim().isEmpty())
                                        displayName = n.trim();
                                }
                            }
                        } finally {
                            cursor.close();
                        }
                    }

                    if (mimeType == null) {
                        mimeType = getMimeTypeFromFileName(displayName);
                    }

                    java.io.File destFile = new java.io.File(cacheDir, System.currentTimeMillis() + "_" + displayName);
                    try (java.io.InputStream in = getContentResolver().openInputStream(uri);
                            java.io.FileOutputStream out = new java.io.FileOutputStream(destFile)) {
                        byte[] buffer = new byte[16384];
                        int bytesRead;
                        while ((bytesRead = in.read(buffer)) != -1) {
                            out.write(buffer, 0, bytesRead);
                        }
                        out.flush();
                    }

                    long fileSize = destFile.length();
                    String base64 = "";
                    // If file is reasonably sized (<= 15MB), also provide base64 for direct
                    // in-memory File constructor
                    if (fileSize > 0 && fileSize <= 15 * 1024 * 1024) {
                        try (java.io.FileInputStream fis = new java.io.FileInputStream(destFile)) {
                            byte[] fileBytes = new byte[(int) fileSize];
                            int totalRead = 0;
                            while (totalRead < fileSize) {
                                int r = fis.read(fileBytes, totalRead, (int) fileSize - totalRead);
                                if (r < 0)
                                    break;
                                totalRead += r;
                            }
                            base64 = android.util.Base64.encodeToString(fileBytes, android.util.Base64.NO_WRAP);
                        } catch (Exception ignored) {
                        }
                    }

                    com.getcapacitor.JSObject fileObj = new com.getcapacitor.JSObject();
                    fileObj.put("name", displayName);
                    fileObj.put("mimeType", mimeType != null ? mimeType : "application/octet-stream");
                    fileObj.put("size", fileSize);
                    fileObj.put("path", destFile.getAbsolutePath());
                    if (!base64.isEmpty()) {
                        fileObj.put("base64", base64);
                    }
                    filesArray.put(fileObj);
                } catch (Exception fileEx) {
                    android.util.Log.e("ShareTarget", "Error processing shared uri: " + uri, fileEx);
                }
            }

            payload.put("files", filesArray);
            ShareTargetManager.sLatestPayload = payload;

            final String payloadJson = payload.toString();
            android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
            h.postDelayed(() -> {
                try {
                    android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                    if (webView != null) {
                        String script = "(function(){ " +
                                "try { " +
                                "  window.__oxypaceSharedData = " + payloadJson + "; " +
                                "  window.dispatchEvent(new CustomEvent('oxypace:shared_content', { detail: "
                                + payloadJson + " })); " +
                                "} catch(e) {} " +
                                "})();";
                        webView.evaluateJavascript(script, null);
                    }
                } catch (Exception ignored) {
                }
            }, 300);

            // Clear intent action so it doesn't re-trigger on subsequent rotations
            intent.setAction("");
        } catch (Exception e) {
            android.util.Log.e("ShareTarget", "Error handling share intent", e);
        }
    }

    private static String getMimeTypeFromFileName(String fileName) {
        if (fileName == null)
            return "application/octet-stream";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
            return "image/jpeg";
        if (lower.endsWith(".png"))
            return "image/png";
        if (lower.endsWith(".gif"))
            return "image/gif";
        if (lower.endsWith(".webp"))
            return "image/webp";
        if (lower.endsWith(".mp4"))
            return "video/mp4";
        if (lower.endsWith(".webm"))
            return "video/webm";
        if (lower.endsWith(".mov"))
            return "video/quicktime";
        if (lower.endsWith(".pdf"))
            return "application/pdf";
        if (lower.endsWith(".mp3"))
            return "audio/mpeg";
        return "application/octet-stream";
    }

    /**
     * If the intent carries a JOIN_VOICE_CALL, OPEN_ROUTE action, or deep link URI,
     * navigate the WebView to the target route using React Router
     * (__oxypaceNavigate).
     */
    private void handleIncomingCallIntent(android.content.Intent intent) {
        if (intent == null)
            return;
        String action = intent.getAction();

        if ("ACTION_NOTIFICATION_START_SCREEN".equals(action)) {
            sMoveToBackAfterScreenCapture = !isAppForeground;
            scheduleWebViewKeepAlivePulses();
            android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
            h.postDelayed(() -> {
                try {
                    keepWebViewAliveInBackground();
                    android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                    if (webView != null) {
                        webView.evaluateJavascript(
                                "window.dispatchEvent(new CustomEvent('oxypace:toggle_screenshare'));",
                                null);
                    }
                } catch (Exception ignored) {
                }
            }, 150);
            intent.setAction("");
            return;
        }

        // Check if intent contains deep link Uri (custom scheme oxypace:// or HTTPS App Link https://oxypace.com.tr/...)
        android.net.Uri data = intent.getData();
        if (data != null) {
            String scheme = data.getScheme();
            String host = data.getHost();
            String path = data.getPath();
            String query = data.getQuery();

            String targetRoute = null;
            if ("oxypace".equals(scheme)) {
                String fullPath = "/" + (host != null ? host : "") + (path != null ? path : "");
                if (query != null && !query.isEmpty()) {
                    fullPath += "?" + query;
                }
                targetRoute = fullPath;
            } else if (("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))
                    && ("oxypace.com.tr".equalsIgnoreCase(host) || "www.oxypace.com.tr".equalsIgnoreCase(host))) {
                String normalizedPath = (path != null && !path.isEmpty()) ? path : "/";
                if (query != null && !query.isEmpty()) {
                    normalizedPath += "?" + query;
                }
                targetRoute = normalizedPath;
            }

            if (targetRoute != null && !targetRoute.isEmpty()) {
                this.pendingRoute = targetRoute;
                this.pendingIsJoinVoice = false;
                intent.setData(null);

                final String finalDeepRoute = targetRoute;
                final Runnable dispatchDeepLink = () -> {
                    try {
                        android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                        if (webView != null) {
                            String escaped = finalDeepRoute.replace("'", "\\'");
                            String script = "(function(){ " +
                                    "try { " +
                                    "  sessionStorage.setItem('pending_mobile_route', '" + escaped + "'); " +
                                    "  if (window.__oxypaceNavigate) { " +
                                    "    window.__oxypaceNavigate('" + escaped + "'); " +
                                    "  } " +
                                    "} catch(e) {} " +
                                    "})();";
                            webView.evaluateJavascript(script, null);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                };
                android.os.Handler deepHandler = new android.os.Handler(android.os.Looper.getMainLooper());
                deepHandler.postDelayed(dispatchDeepLink, 250);
                deepHandler.postDelayed(dispatchDeepLink, 800);
                deepHandler.postDelayed(dispatchDeepLink, 1500);
                return;
            }
        }

        if (!"JOIN_VOICE_CALL".equals(action) && !"OPEN_ROUTE".equals(action))
            return;

        String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty())
            return;

        // Dismiss the call notification if it was a call
        if ("JOIN_VOICE_CALL".equals(action)) {
            try {
                android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(
                        NOTIFICATION_SERVICE);
                if (nm != null)
                    nm.cancel(OxypaceMessagingService.VOICE_INVITE_NOTIF_ID);
            } catch (Exception ignored) {
            }
        }

        // Cache for onPageFinished cold-start delivery
        this.pendingRoute = route;
        this.pendingIsJoinVoice = "JOIN_VOICE_CALL".equals(action);

        // Navigate WebView to the route seamlessly via React Router
        final String finalRoute = route;
        final boolean isJoinVoice = "JOIN_VOICE_CALL".equals(action);

        final Runnable dispatchNav = () -> {
            try {
                android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    String script = "(function(){ " +
                            "try { " +
                            "  sessionStorage.setItem('pending_mobile_route', '" + finalRoute.replace("'", "\\'")
                            + "'); " +
                            "  if (" + isJoinVoice + ") { " +
                            "    window.dispatchEvent(new CustomEvent('oxypace:join_voice', { detail: { route: '"
                            + finalRoute.replace("'", "\\'") + "' } })); " +
                            "  } " +
                            "  if (window.__oxypaceNavigate) { " +
                            "    window.__oxypaceNavigate('" + finalRoute.replace("'", "\\'") + "'); " +
                            "  } else { " +
                            "    window.location.href = '" + finalRoute.replace("'", "\\'") + "'; " +
                            "  } " +
                            "} catch(e) { window.location.href = '" + finalRoute.replace("'", "\\'") + "'; } " +
                            "})();";
                    webView.evaluateJavascript(script, null);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        };

        // Dispatch with multiple staggered attempts to guarantee reception regardless
        // of WebView mount delay
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.postDelayed(dispatchNav, 300);
        handler.postDelayed(dispatchNav, 800);
        handler.postDelayed(dispatchNav, 1500);
    }

    private void initNotificationChannels() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(
                    Context.NOTIFICATION_SERVICE);
            if (nm == null)
                return;

            // 1. Voice & Video Call Invites Channel
            if (nm.getNotificationChannel(OxypaceMessagingService.VOICE_INVITE_CHANNEL_ID) == null) {
                android.app.NotificationChannel callChannel = new android.app.NotificationChannel(
                        OxypaceMessagingService.VOICE_INVITE_CHANNEL_ID,
                        "Görüntülü Sohbet Davetleri",
                        android.app.NotificationManager.IMPORTANCE_MAX);
                callChannel.setDescription("Görüntülü ve sesli sohbet odası davetleri");
                callChannel.enableLights(true);
                callChannel.enableVibration(true);
                callChannel.setVibrationPattern(new long[] { 0, 1000, 500, 1000 });
                callChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                callChannel.setBypassDnd(true);

                android.net.Uri ringtoneUri = android.media.RingtoneManager
                        .getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE);
                android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();
                callChannel.setSound(ringtoneUri, audioAttributes);
                nm.createNotificationChannel(callChannel);
            }

            // 2. Direct Messages Channel
            if (nm.getNotificationChannel("oxypace_messages_v2") == null) {
                android.app.NotificationChannel msgChannel = new android.app.NotificationChannel(
                        "oxypace_messages_v2",
                        "Mesaj Bildirimleri",
                        android.app.NotificationManager.IMPORTANCE_HIGH);
                msgChannel.setDescription("Kişisel ve grup mesaj bildirimleri");
                msgChannel.enableLights(true);
                msgChannel.enableVibration(true);
                msgChannel.setVibrationPattern(new long[] { 0, 250, 200, 250 });
                msgChannel.setShowBadge(true);
                msgChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

                android.net.Uri defaultSoundUri = android.media.RingtoneManager
                        .getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
                android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                        .build();
                msgChannel.setSound(defaultSoundUri, audioAttributes);
                nm.createNotificationChannel(msgChannel);
            }

            // 3. General App Notifications Channel
            if (nm.getNotificationChannel("oxypace_general_notifications") == null) {
                android.app.NotificationChannel generalChannel = new android.app.NotificationChannel(
                        "oxypace_general_notifications",
                        "Genel Bildirimler",
                        android.app.NotificationManager.IMPORTANCE_HIGH);
                generalChannel.setDescription("Portal paylaşımları, alıntılar ve genel sistem bildirimleri");
                generalChannel.enableLights(true);
                generalChannel.enableVibration(true);
                generalChannel.setShowBadge(true);

                android.net.Uri defaultSoundUri = android.media.RingtoneManager
                        .getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
                android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                        .build();
                generalChannel.setSound(defaultSoundUri, audioAttributes);
                nm.createNotificationChannel(generalChannel);
            }
        }
    }

    private void setupAudioDeviceMonitoring() {
        try {
            android.media.AudioManager am = (android.media.AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                // Record initial headset state before registering callbacks so launch never triggers a false plug-in route switch
                CallManager.sHasHeadset = CallManager.isHeadsetConnected(am);
            }
            if (am != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                am.registerAudioDeviceCallback(new android.media.AudioDeviceCallback() {
                    @Override
                    public void onAudioDevicesAdded(android.media.AudioDeviceInfo[] addedDevices) {
                        handleAudioDevicesChanged();
                    }

                    @Override
                    public void onAudioDevicesRemoved(android.media.AudioDeviceInfo[] removedDevices) {
                        handleAudioDevicesChanged();
                    }
                }, new android.os.Handler(android.os.Looper.getMainLooper()));
            }

            android.content.IntentFilter filter = new android.content.IntentFilter();
            filter.addAction(android.content.Intent.ACTION_HEADSET_PLUG);
            filter.addAction(android.bluetooth.BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED);
            filter.addAction(android.media.AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            registerReceiver(new android.content.BroadcastReceiver() {
                @Override
                public void onReceive(Context context, android.content.Intent intent) {
                    handleAudioDevicesChanged();
                }
            }, filter);
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Audio monitoring setup error: " + e.getMessage());
        }
    }

    private void handleAudioDevicesChanged() {
        runOnUiThread(() -> {
            try {
                android.media.AudioManager am = (android.media.AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (am == null)
                    return;
                boolean hasHeadset = CallManager.isHeadsetConnected(am);
                boolean prevHas = CallManager.sHasHeadset;
                CallManager.sHasHeadset = hasHeadset;

                if (hasHeadset && !prevHas) {
                    CallManager.sUserSelectedRoute = null;
                    if (CallManager.isInCall) {
                        CallManager.routeAudio(am, "headset");
                    }
                    CallManager.dispatchAudioRouteChanged("headset", true, CallManager.sHeadsetName);
                } else if (!hasHeadset && prevHas) {
                    CallManager.sUserSelectedRoute = null;
                    if (CallManager.isInCall) {
                        CallManager.routeAudio(am, "speaker");
                    }
                    CallManager.dispatchAudioRouteChanged("speaker", false, "Kulaklık");
                }
            } catch (Exception ignored) {
            }
        });
    }

    @CapacitorPlugin(name = "MediaControls")
    public static class MediaControlsPlugin extends Plugin {
        @PluginMethod
        public void update(PluginCall call) {
            try {
                android.content.Context ctx = getContext();
                if (ctx == null) {
                    call.resolve();
                    return;
                }
                android.content.Intent intent = new android.content.Intent(ctx, MediaPlaybackService.class);
                intent.setAction(MediaPlaybackService.ACTION_UPDATE);
                intent.putExtra("title", call.getString("title", "Ses Dosyası"));
                intent.putExtra("artist", call.getString("artist", "Oxypace"));
                intent.putExtra("album", call.getString("album", "Oxypace Ses"));
                intent.putExtra("artworkUrl", call.getString("artworkUrl", ""));
                intent.putExtra("isPlaying", Boolean.TRUE.equals(call.getBoolean("isPlaying", true)));
                intent.putExtra("hasNext", Boolean.TRUE.equals(call.getBoolean("hasNext", false)));
                intent.putExtra("hasPrev", Boolean.TRUE.equals(call.getBoolean("hasPrev", false)));
                Long dur = call.getLong("durationMs", 0L);
                Long pos = call.getLong("positionMs", 0L);
                intent.putExtra("durationMs", dur != null ? dur : 0L);
                intent.putExtra("positionMs", pos != null ? pos : 0L);

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O && Boolean.TRUE.equals(call.getBoolean("isPlaying", true))) {
                    ctx.startForegroundService(intent);
                } else {
                    ctx.startService(intent);
                }
            } catch (Exception e) {
                android.util.Log.w("MediaControlsPlugin", "update error: " + e.getMessage());
            }
            call.resolve();
        }

        @PluginMethod
        public void clear(PluginCall call) {
            try {
                android.content.Context ctx = getContext();
                if (ctx != null) {
                    android.content.Intent intent = new android.content.Intent(ctx, MediaPlaybackService.class);
                    intent.setAction(MediaPlaybackService.ACTION_STOP);
                    ctx.startService(intent);
                }
            } catch (Exception ignored) {}
            call.resolve();
        }
    }
}
