package com.oxypace.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
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

                    // Pass the server-side room startedAt epoch timestamp for timer synchronization.
                    // Use getData().opt() to avoid JSObject/Number type mismatch;
                    // JS epoch ms values arrive as Double from the Capacitor bridge.
                    long startedAt = 0L;
                    try {
                        Object rawStartedAt = call.getData().opt("startedAt");
                        if (rawStartedAt instanceof Number) {
                            startedAt = ((Number) rawStartedAt).longValue();
                        }
                    } catch (Exception ignored) {}

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

                    // Ensure speakerphone is enabled on Android for hands-free live room calls
                    try {
                        android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(android.content.Context.AUDIO_SERVICE);
                        if (am != null) {
                            am.setSpeakerphoneOn(true);
                        }
                    } catch (Exception ignored) {}

                    // Update PiP Params for Android 12+ Auto-Enter and keep screen alive during call
                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            try {
                                getActivity().getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                            } catch (Exception ignored) {}
                            updatePiPParams(getActivity(), true);
                        });
                    }
                } else {
                    serviceIntent.setAction("STOP_CALL");
                    ctx.startService(serviceIntent);

                    // Explicitly cancel ongoing call notification immediately
                    try {
                        android.app.NotificationManager nm = (android.app.NotificationManager) ctx.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
                        if (nm != null) {
                            nm.cancel(ActiveCallService.NOTIFICATION_ID);
                        }
                    } catch (Exception ignored) {}


                    // Revert audio mode to normal when call stops
                    try {
                        android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(android.content.Context.AUDIO_SERVICE);
                        if (am != null) {
                            am.setMode(android.media.AudioManager.MODE_NORMAL);
                        }
                    } catch (Exception ignored) {}

                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            try {
                                getActivity().getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                            } catch (Exception ignored) {}
                            updatePiPParams(getActivity(), false);
                        });
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            call.resolve();
        }

        @PluginMethod
        public void setAudioMode(PluginCall call) {
            String mode = call.getString("mode", "normal");
            try {
                android.content.Context ctx = getContext();
                android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(android.content.Context.AUDIO_SERVICE);
                if (am != null) {
                    if ("normal".equalsIgnoreCase(mode) || "media".equalsIgnoreCase(mode)) {
                        am.setMode(android.media.AudioManager.MODE_NORMAL);
                        am.setSpeakerphoneOn(true);
                    } else if ("communication".equalsIgnoreCase(mode)) {
                        am.setMode(android.media.AudioManager.MODE_IN_COMMUNICATION);
                        am.setSpeakerphoneOn(true);
                    }
                }
                call.resolve();
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
                            } catch (Throwable ignored) {}
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
            } catch (Exception ignored) {}

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
            android.media.projection.MediaProjectionManager mpm =
                (android.media.projection.MediaProjectionManager) act.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
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
    }

    @CapacitorPlugin(name = "AuthSync")
    public static class AuthSync extends com.getcapacitor.Plugin {
        @PluginMethod
        public void syncAuth(PluginCall call) {
            String token = call.getString("token", "");
            String serverUrl = call.getString("serverUrl", "https://oxypace.com.tr");
            DirectReplyReceiver.saveAuthCredentials(getContext(), token, serverUrl);

            // If a valid JWT token was provided, immediately push device FCM token to backend
            if (token != null && !token.trim().isEmpty()) {
                final Context ctx = getContext();
                com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                    .addOnCompleteListener(task -> {
                        if (task.isSuccessful() && task.getResult() != null) {
                            String fcmToken = task.getResult();
                            new Thread(() -> {
                                try {
                                    String apiUrl = serverUrl.replaceAll("/+$", "") + "/api/users/fcm-token";
                                    java.net.URL url = new java.net.URL(apiUrl);
                                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
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
                                    android.util.Log.w("AuthSync", "Immediate FCM token sync error: " + e.getMessage());
                                }
                            }).start();
                        }
                    });
            }

            call.resolve();
        }
    }

    public static android.app.PictureInPictureParams buildPiPParams(android.app.Activity activity, boolean enabled) {
        if (activity == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) return null;
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
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                );
                android.graphics.drawable.Icon micIcon = android.graphics.drawable.Icon.createWithResource(
                    activity, CallManager.sIsMuted ? R.drawable.ic_pip_mic_off : R.drawable.ic_pip_mic
                );
                actions.add(new android.app.RemoteAction(
                    micIcon,
                    CallManager.sIsMuted ? "Mikrofonu Aç" : "Sesi Kapat",
                    CallManager.sIsMuted ? "Mikrofonu Aç" : "Sesi Kapat",
                    piMic
                ));

                // 2. Camera
                android.content.Intent camIntent = new android.content.Intent(activity, CallActionReceiver.class);
                camIntent.setAction(CallActionReceiver.ACTION_TOGGLE_CAMERA);
                android.app.PendingIntent piCam = android.app.PendingIntent.getBroadcast(
                    activity, 202, camIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                );
                android.graphics.drawable.Icon camIcon = android.graphics.drawable.Icon.createWithResource(
                    activity, CallManager.sIsCameraOn ? R.drawable.ic_pip_cam : R.drawable.ic_pip_cam_off
                );
                actions.add(new android.app.RemoteAction(
                    camIcon,
                    CallManager.sIsCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç",
                    CallManager.sIsCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç",
                    piCam
                ));

                // 3. Hangup
                android.content.Intent endIntent = new android.content.Intent(activity, CallActionReceiver.class);
                endIntent.setAction(CallActionReceiver.ACTION_HANGUP);
                android.app.PendingIntent piEnd = android.app.PendingIntent.getBroadcast(
                    activity, 203, endIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                );
                android.graphics.drawable.Icon endIcon = android.graphics.drawable.Icon.createWithResource(
                    activity, R.drawable.ic_pip_end_call
                );
                actions.add(new android.app.RemoteAction(
                    endIcon,
                    "Odadan Ayrıl",
                    "Odadan Ayrıl",
                    piEnd
                ));

                builder.setActions(actions);
            }

            return builder.build();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static void updatePiPParams(android.app.Activity activity, boolean enabled) {
        if (activity == null || android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) return;
        try {
            android.app.PictureInPictureParams params = buildPiPParams(activity, enabled);
            if (params != null) {
                activity.setPictureInPictureParams(params);
            }
        } catch (Exception ignored) {}
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
                } catch (Throwable ignored) {}
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
    private long lastFrameTimeMs = 0;

    public boolean startScreenProjection(int resultCode, android.content.Intent data) {
        stopScreenProjection();

        try {
            android.media.projection.MediaProjectionManager mpm =
                (android.media.projection.MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
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
                                    "window.dispatchEvent(new CustomEvent('oxypace:screenshare_stopped'));", null
                                );
                            });
                        }
                    } catch (Exception ignored) {}
                }
            }, null);

            android.util.DisplayMetrics dm = getResources().getDisplayMetrics();
            int width = 540;
            int height = (int) (540f * ((float) dm.heightPixels / (float) dm.widthPixels));
            if (height % 2 != 0) height++;

            captureThread = new android.os.HandlerThread("ScreenCaptureThread");
            captureThread.start();
            captureHandler = new android.os.Handler(captureThread.getLooper());

            imageReader = android.media.ImageReader.newInstance(width, height, android.graphics.PixelFormat.RGBA_8888, 2);

            virtualDisplay = mediaProjection.createVirtualDisplay(
                "OxypaceScreenCapture",
                width, height, dm.densityDpi,
                android.hardware.display.DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader.getSurface(),
                null,
                captureHandler
            );

            final int captureWidth = width;
            final int captureHeight = height;

            imageReader.setOnImageAvailableListener(reader -> {
                android.media.Image image = null;
                try {
                    image = reader.acquireLatestImage();
                    if (image == null) return;

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
                        android.graphics.Bitmap.Config.ARGB_8888
                    );
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
                            bridge.getWebView().evaluateJavascript(
                                "if (window.onNativeScreenFrame) { window.onNativeScreenFrame('" + base64 + "'); }",
                                null
                            );
                        });
                    }

                } catch (Exception ignored) {
                } finally {
                    if (image != null) {
                        try { image.close(); } catch (Exception ignored) {}
                    }
                }
            }, captureHandler);

            android.util.Log.d("MainActivity", "Screen projection successfully started at " + width + "x" + height);
            return true;

        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to start screen projection: " + e.getMessage(), e);
            stopScreenProjection();
            return false;
        }
    }

    public void stopScreenProjection() {
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
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CallManager.REQUEST_CODE_SCREEN_CAPTURE) {
            if (resultCode == RESULT_OK && data != null) {
                // Elevate ActiveCallService synchronously before initializing projection on Android 14+
                if (ActiveCallService.sInstance != null) {
                    ActiveCallService.sInstance.elevateToMediaProjection();
                } else {
                    try {
                        android.content.Intent elevateIntent = new android.content.Intent(this, ActiveCallService.class);
                        elevateIntent.setAction("ENABLE_MEDIA_PROJECTION");
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            startForegroundService(elevateIntent);
                        } else {
                            startService(elevateIntent);
                        }
                    } catch (Exception ignored) {}
                }

                boolean started = startScreenProjection(resultCode, data);
                if (CallManager.sScreenCaptureCall != null) {
                    if (started) {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        CallManager.sScreenCaptureCall.resolve(ret);
                    } else {
                        CallManager.sScreenCaptureCall.reject("Ekran paylaşımı başlatılamadı");
                    }
                    CallManager.sScreenCaptureCall = null;
                }
            } else {
                if (CallManager.sScreenCaptureCall != null) {
                    CallManager.sScreenCaptureCall.reject("Kullanıcı ekran paylaşım iznini reddetti");
                    CallManager.sScreenCaptureCall = null;
                }
            }
        }
    }



    private static com.getcapacitor.Bridge bridgeInstance = null;
    private static MainActivity activityInstance = null;
    private String pendingRoute = null;
    private boolean pendingIsJoinVoice = false;

    public static com.getcapacitor.Bridge getBridgeInstance() {
        return bridgeInstance;
    }

    public static MainActivity getActivityInstance() {
        return activityInstance;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        activityInstance = this;
        registerPlugin(DownloaderPlugin.class);
        registerPlugin(CallManager.class);
        registerPlugin(AuthSync.class);
        super.onCreate(savedInstanceState);
        bridgeInstance = getBridge();

        // Dismiss any orphaned call notification on app launch if not in active call
        try {
            if (!CallManager.isInCall) {
                android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancel(ActiveCallService.NOTIFICATION_ID);
                }
            }
        } catch (Exception ignored) {}

        // Programmatically configure window to display over lock screen and turn screen on (Android 8.0 / 27+)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            try {
                android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                if (km != null) {
                    km.requestDismissKeyguard(this, null);
                }
            } catch (Exception ignored) {}
        } else {
            // Deprecated flags for older Android versions
            getWindow().addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        // Android Runtime Permissions (Microphone, Camera, Notifications)
        java.util.List<String> permissionsNeeded = new java.util.ArrayList<>();
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO)
                != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.RECORD_AUDIO);
        }
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA)
                != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(android.Manifest.permission.CAMERA);
        }
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(android.Manifest.permission.POST_NOTIFICATIONS);
            }
        }
        if (!permissionsNeeded.isEmpty()) {
            androidx.core.app.ActivityCompat.requestPermissions(
                this,
                permissionsNeeded.toArray(new String[0]),
                1001
            );
        }


        // Proactively fetch and sync FCM token on startup
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        String currentToken = task.getResult();
                        android.util.Log.d("MainActivity", "Proactive FCM Token obtained: " + currentToken);
                        android.content.SharedPreferences prefs = getSharedPreferences("OxypaceAuthPrefs", Context.MODE_PRIVATE);
                        prefs.edit().putString("fcm_token", currentToken).apply();

                        String jwtToken = prefs.getString("jwt_token", null);
                        String serverUrl = prefs.getString("server_url", "https://oxypace.com.tr");
                        if (jwtToken != null && !jwtToken.isEmpty()) {
                            new Thread(() -> {
                                try {
                                    String apiUrl = serverUrl.replaceAll("/+$", "") + "/api/users/fcm-token";
                                    java.net.URL url = new java.net.URL(apiUrl);
                                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
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
                                    android.util.Log.w("MainActivity", "Proactive FCM sync failed: " + syncEx.getMessage());
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

        // Initialize and register all notification channels upfront so Android OS never drops notifications
        initNotificationChannels();


        android.webkit.WebView webView = getBridge().getWebView();

        if (webView != null) {
            // Explicitly force hardware acceleration on WebView for 60/120fps smooth scrolling
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);

            android.webkit.WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            
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
                public boolean shouldOverrideUrlLoading(android.webkit.WebView view, android.webkit.WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    String scheme = request.getUrl().getScheme();
                    // Intercept external app URI schemes and launch via Android Intent
                    if (scheme != null && (
                        scheme.equals("whatsapp") ||
                        scheme.equals("twitter") ||
                        scheme.equals("fb") ||
                        scheme.equals("instagram") ||
                        scheme.equals("tg") ||
                        scheme.equals("mailto")
                    )) {
                        try {
                            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
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
                    // Automatically extract auth token from WebView localStorage for Direct Reply
                    try {
                        view.evaluateJavascript(
                            "(function() { return localStorage.getItem('token') || ''; })();",
                            value -> {
                                if (value != null && !value.isEmpty() && !value.equals("\"\"") && !value.equals("null")) {
                                    String cleanToken = value.replace("\"", "").trim();
                                    if (!cleanToken.isEmpty()) {
                                        DirectReplyReceiver.saveAuthCredentials(MainActivity.this, cleanToken, "https://oxypace.com.tr");
                                    }
                                }
                            }
                        );
                    } catch (Exception ignored) {}

                    // If a notification click queued a pending route while app was cold-starting, execute it now
                    if (pendingRoute != null && !pendingRoute.isEmpty()) {
                        final String routeToDispatch = pendingRoute;
                        final boolean isVoiceToDispatch = pendingIsJoinVoice;
                        pendingRoute = null;
                        pendingIsJoinVoice = false;

                        view.postDelayed(() -> {
                            try {
                                String script = "(function(){ " +
                                    "try { " +
                                    "  sessionStorage.setItem('pending_mobile_route', '" + routeToDispatch.replace("'", "\\'") + "'); " +
                                    "  if (" + isVoiceToDispatch + ") { " +
                                    "    window.dispatchEvent(new CustomEvent('oxypace:join_voice', { detail: { route: '" + routeToDispatch.replace("'", "\\'") + "' } })); " +
                                    "  } " +
                                    "  if (window.__oxypaceNavigate) { " +
                                    "    window.__oxypaceNavigate('" + routeToDispatch.replace("'", "\\'") + "'); " +
                                    "  } else { " +
                                    "    window.location.href = '" + routeToDispatch.replace("'", "\\'") + "'; " +
                                    "  } " +
                                    "} catch(e) { window.location.href = '" + routeToDispatch.replace("'", "\\'") + "'; } " +
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

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, android.content.res.Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        try {
            android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.resumeTimers();
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('pipModeChanged', { detail: { isInPiP: " + isInPictureInPictureMode + " } }));",
                            null
                        );
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (CallManager.isInCall || (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N && isInPictureInPictureMode())) {
            // Keep WebView active in background when in a call or PiP (WhatsApp style background persistence)
            try {
                android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.resumeTimers();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (CallManager.isInCall || (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N && isInPictureInPictureMode())) {
            // Keep WebView active in background when in a call or PiP
            try {
                android.webkit.WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.resumeTimers();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    // Called when app is already running and a new Intent arrives (e.g. tapping notification while app is open)
    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingCallIntent(intent);
    }

    /**
     * If the intent carries a JOIN_VOICE_CALL, OPEN_ROUTE action, or deep link URI,
     * navigate the WebView to the target route using React Router (__oxypaceNavigate).
     */
    private void handleIncomingCallIntent(android.content.Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        // Check if intent contains deep link Uri (e.g. oxypace://auth/process?token=...)
        android.net.Uri data = intent.getData();
        if (data != null) {
            String scheme = data.getScheme();
            String host = data.getHost();
            String path = data.getPath();
            String query = data.getQuery();

            if ("oxypace".equals(scheme)) {
                String fullPath = "/" + (host != null ? host : "") + (path != null ? path : "");
                if (query != null && !query.isEmpty()) {
                    fullPath += "?" + query;
                }
                final String targetRoute = fullPath;
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    try {
                        android.webkit.WebView webView = getBridge().getWebView();
                        if (webView != null) {
                            webView.evaluateJavascript(
                                "(function(){ if (window.__oxypaceNavigate) { window.__oxypaceNavigate('" + targetRoute.replace("'", "\\'") + "'); } else { window.location.href = '" + targetRoute.replace("'", "\\'") + "'; } })();",
                                null
                            );
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }, 500);
                return;
            }
        }

        if (!"JOIN_VOICE_CALL".equals(action) && !"OPEN_ROUTE".equals(action)) return;

        String route = intent.getStringExtra("route");
        if (route == null || route.isEmpty()) return;

        // Dismiss the call notification if it was a call
        if ("JOIN_VOICE_CALL".equals(action)) {
            try {
                android.app.NotificationManager nm =
                    (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (nm != null) nm.cancel(OxypaceMessagingService.VOICE_INVITE_NOTIF_ID);
            } catch (Exception ignored) {}
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
                        "  sessionStorage.setItem('pending_mobile_route', '" + finalRoute.replace("'", "\\'") + "'); " +
                        "  if (" + isJoinVoice + ") { " +
                        "    window.dispatchEvent(new CustomEvent('oxypace:join_voice', { detail: { route: '" + finalRoute.replace("'", "\\'") + "' } })); " +
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

        // Dispatch with multiple staggered attempts to guarantee reception regardless of WebView mount delay
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.postDelayed(dispatchNav, 300);
        handler.postDelayed(dispatchNav, 800);
        handler.postDelayed(dispatchNav, 1500);
    }

    private void initNotificationChannels() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. Voice & Video Call Invites Channel
            if (nm.getNotificationChannel(OxypaceMessagingService.VOICE_INVITE_CHANNEL_ID) == null) {
                android.app.NotificationChannel callChannel = new android.app.NotificationChannel(
                    OxypaceMessagingService.VOICE_INVITE_CHANNEL_ID,
                    "Görüntülü Sohbet Davetleri",
                    android.app.NotificationManager.IMPORTANCE_MAX
                );
                callChannel.setDescription("Görüntülü ve sesli sohbet odası davetleri");
                callChannel.enableLights(true);
                callChannel.enableVibration(true);
                callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
                callChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                callChannel.setBypassDnd(true);

                android.net.Uri ringtoneUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE);
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
                    android.app.NotificationManager.IMPORTANCE_HIGH
                );
                msgChannel.setDescription("Kişisel ve grup mesaj bildirimleri");
                msgChannel.enableLights(true);
                msgChannel.enableVibration(true);
                msgChannel.setVibrationPattern(new long[]{0, 250, 200, 250});
                msgChannel.setShowBadge(true);
                msgChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

                android.net.Uri defaultSoundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
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
                    android.app.NotificationManager.IMPORTANCE_HIGH
                );
                generalChannel.setDescription("Portal paylaşımları, alıntılar ve genel sistem bildirimleri");
                generalChannel.enableLights(true);
                generalChannel.enableVibration(true);
                generalChannel.setShowBadge(true);

                android.net.Uri defaultSoundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
                android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                    .build();
                generalChannel.setSound(defaultSoundUri, audioAttributes);
                nm.createNotificationChannel(generalChannel);
            }
        }
    }
}
