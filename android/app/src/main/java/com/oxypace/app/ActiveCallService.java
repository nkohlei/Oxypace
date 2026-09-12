package com.oxypace.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

// Native LiveKit library imports
import io.livekit.android.LiveKit;
import io.livekit.android.room.Room;
import io.livekit.android.ConnectOptions;

// Coroutines support for Java-Kotlin integration
import kotlinx.coroutines.BuildersKt;
import kotlinx.coroutines.Dispatchers;

/**
 * ActiveCallService keeps the audio line and media projection alive in the background.
 * It displays a silent, sticky minimal notification bar strictly pinned inside the Android
 * notification panel (shade) without any heads-up screen popup banners.
 */
public class ActiveCallService extends Service {

    public static final String CHANNEL_ID      = "oxypace_call_shade_bar_v5";
    public static final int    NOTIFICATION_ID = 9500;

    private Handler  handler;
    private Runnable updateRunnable;
    private long roomStartedAtEpoch = 0;

    private String channelName = "Görüntülü Sohbet";
    private String route       = "";
    private boolean isMuted    = false;
    private boolean isScreenSharing = false;

    // LiveKit Room instance kept in pure Java Memory
    private Room livekitRoom = null;

    // Wake and Wifi locks to prevent background suspension on aggressive Android devices
    private android.os.PowerManager.WakeLock wakeLock = null;
    private android.net.wifi.WifiManager.WifiLock wifiLock = null;
    public static ActiveCallService sInstance = null;

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
        handler = new Handler(Looper.getMainLooper());

        try {
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "oxypace:active_call_cpu_lock");
                wakeLock.acquire();
            }
            android.net.wifi.WifiManager wm = (android.net.wifi.WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                wifiLock = wm.createWifiLock(android.net.wifi.WifiManager.WIFI_MODE_FULL_HIGH_PERF, "oxypace:active_call_wifi_lock");
                wifiLock.acquire();
            }
            android.util.Log.d("ActiveCallService", "Background WakeLock and WifiLock acquired successfully.");
        } catch (Exception e) {
            android.util.Log.w("ActiveCallService", "Failed to acquire wake/wifi locks: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();

        if ("START_CALL".equals(action)) {
            channelName = intent.getStringExtra("channelName");
            if (channelName == null || channelName.isEmpty()) channelName = "Görüntülü Sohbet";

            route = intent.getStringExtra("route");
            if (route == null) route = "";

            isMuted = intent.getBooleanExtra("isMuted", false);
            isScreenSharing = intent.getBooleanExtra("isScreenSharing", false);

            long serverStartedAt = intent.getLongExtra("startedAt", 0L);
            roomStartedAtEpoch = (serverStartedAt > 0) ? serverStartedAt : System.currentTimeMillis();

            String token = intent.getStringExtra("token");
            String serverUrl = intent.getStringExtra("serverUrl");
            String userId = intent.getStringExtra("userId");

            createNotificationChannel();

            // Start foreground initially with microphone and camera types (Android 14 requires mediaProjection only AFTER user consent)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    int fgsType = android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                    if (Build.VERSION.SDK_INT >= 30) {
                        fgsType |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
                    }
                    startForeground(
                        NOTIFICATION_ID,
                        buildNotification(formatDuration()),
                        fgsType
                    );
                } else {
                    startForeground(NOTIFICATION_ID, buildNotification(formatDuration()));
                }
            } catch (Exception e) {
                android.util.Log.w("ActiveCallService", "Typed startForeground failed, falling back: " + e.getMessage());
                try {
                    startForeground(NOTIFICATION_ID, buildNotification(formatDuration()));
                } catch (Exception fatal) {
                    android.util.Log.e("ActiveCallService", "Fatal startForeground error: " + fatal.getMessage());
                }
            }

            startUpdatingDuration();

            // Connect to LiveKit Room natively if parameters are valid
            if (token != null && !token.isEmpty() && serverUrl != null && !serverUrl.isEmpty()) {
                connectLiveKitNatively(serverUrl, token, userId);
            }

        } else if ("ENABLE_MEDIA_PROJECTION".equals(action)) {
            elevateToMediaProjection();

        } else if ("DISABLE_MEDIA_PROJECTION".equals(action)) {
            revertFromMediaProjection();

        } else if ("TOGGLE_MIC".equals(action)) {
            isMuted = !isMuted;
            if (livekitRoom != null) {
                try {
                    livekitRoom.getLocalParticipant().setMicrophoneEnabled(!isMuted, null);
                } catch (Exception e) {
                    android.util.Log.e("ActiveCallService", "Failed to toggle native mic: " + e.getMessage());
                }
            }
            // Refresh notification immediately
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, buildNotification(formatDuration()));
            }

        } else if ("TOGGLE_SCREEN".equals(action)) {
            isScreenSharing = !isScreenSharing;
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, buildNotification(formatDuration()));
            }

        } else if ("UPDATE_STATE".equals(action)) {
            if (intent.hasExtra("isMuted")) isMuted = intent.getBooleanExtra("isMuted", false);
            if (intent.hasExtra("isScreenSharing")) isScreenSharing = intent.getBooleanExtra("isScreenSharing", false);
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, buildNotification(formatDuration()));
            }

        } else if ("STOP_CALL".equals(action)) {
            stopCall();
        }

        return START_NOT_STICKY;
    }

    public void elevateToMediaProjection() {
        isScreenSharing = true;
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                int fgsType = android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                if (Build.VERSION.SDK_INT >= 30) {
                    fgsType |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
                }
                fgsType |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION;
                startForeground(NOTIFICATION_ID, buildNotification(formatDuration()), fgsType);
                android.util.Log.d("ActiveCallService", "FGS elevated to MEDIA_PROJECTION");
            }
        } catch (Exception e) {
            android.util.Log.e("ActiveCallService", "Failed to elevate FGS to mediaProjection: " + e.getMessage(), e);
        }
    }

    public void revertFromMediaProjection() {
        isScreenSharing = false;
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                int fgsType = android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                if (Build.VERSION.SDK_INT >= 30) {
                    fgsType |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
                }
                startForeground(NOTIFICATION_ID, buildNotification(formatDuration()), fgsType);
                android.util.Log.d("ActiveCallService", "FGS reverted from MEDIA_PROJECTION");
            }
        } catch (Exception e) {
            android.util.Log.e("ActiveCallService", "Failed to revert FGS mediaProjection: " + e.getMessage(), e);
        }
    }

    private void stopCall() {
        stopUpdatingDuration();
        disconnectLiveKitNatively();

        try {
            stopForeground(true);
            stopSelf();
        } catch (Exception e) {
            android.util.Log.e("ActiveCallService", "Error stopping service: " + e.getMessage());
        }
    }

    private void connectLiveKitNatively(final String serverUrl, final String token, final String userId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    android.util.Log.d("LiveKitNative", "Initializing native LiveKit room...");
                    Context ctx = getApplicationContext();
                    
                    livekitRoom = LiveKit.INSTANCE.create(
                        ctx,
                        new io.livekit.android.RoomOptions(),
                        new io.livekit.android.LiveKitOverrides()
                    );

                    ConnectOptions connectOptions = new ConnectOptions();
                    android.util.Log.d("LiveKitNative", "Connecting natively to: " + serverUrl);
                    
                    BuildersKt.runBlocking(
                        Dispatchers.getIO(),
                        (coroutineScope, continuation) -> {
                            try {
                                return livekitRoom.connect(
                                    serverUrl,
                                    token,
                                    connectOptions,
                                    continuation
                                );
                            } catch (Exception e) {
                                throw new RuntimeException(e);
                            }
                        }
                    );

                    android.util.Log.d("LiveKitNative", "Native LiveKit connected successfully!");
                    livekitRoom.getLocalParticipant().setMicrophoneEnabled(!isMuted, null);

                } catch (Exception e) {
                    android.util.Log.e("LiveKitNative", "Native LiveKit connection failed: " + e.getMessage(), e);
                }
            }
        }).start();
    }

    private void disconnectLiveKitNatively() {
        if (livekitRoom != null) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        android.util.Log.d("LiveKitNative", "Disconnecting native LiveKit room...");
                        livekitRoom.disconnect();
                        livekitRoom = null;
                        android.util.Log.d("LiveKitNative", "Disconnected native room.");
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (sInstance == this) {
            sInstance = null;
        }
        stopUpdatingDuration();
        disconnectLiveKitNatively();
        
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
            }
        } catch (Exception ignored) {}
        
        super.onDestroy();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Timer & Notification Bar with Action Buttons (Mic / Screen / Hangup)
    // ─────────────────────────────────────────────────────────────────────────

    private void startUpdatingDuration() {
        stopUpdatingDuration();
        updateRunnable = new Runnable() {
            @Override
            public void run() {
                NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.notify(NOTIFICATION_ID, buildNotification(formatDuration()));
                }
                handler.postDelayed(this, 1_000L);
            }
        };
        handler.post(updateRunnable);
    }

    private void stopUpdatingDuration() {
        if (updateRunnable != null) {
            handler.removeCallbacks(updateRunnable);
            updateRunnable = null;
        }
    }

    private String formatDuration() {
        long elapsedMs = System.currentTimeMillis() - roomStartedAtEpoch;
        if (elapsedMs < 0) elapsedMs = 0;

        int totalSec = (int) (elapsedMs / 1_000);
        int seconds  = totalSec % 60;
        int minutes  = (totalSec / 60) % 60;
        int hours    = totalSec / 3_600;

        if (hours > 0) {
            return String.format("%02d:%02d:%02d", hours, minutes, seconds);
        } else {
            return String.format("%02d:%02d", minutes, seconds);
        }
    }

    private Notification buildNotification(String duration) {
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.setAction("OPEN_ROUTE");
        mainIntent.putExtra("route", route);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent piMain = PendingIntent.getActivity(
            this, 10, mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Action 1: Toggle Mic (Sessize Al / Mikrofon Aç)
        Intent toggleMicIntent = new Intent(this, CallActionReceiver.class);
        toggleMicIntent.setAction(CallActionReceiver.ACTION_TOGGLE_MIC);
        PendingIntent piToggleMic = PendingIntent.getBroadcast(
            this, 20, toggleMicIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Action 2: Toggle Screen Share (Ekran Paylaş / Paylaşımı Durdur)
        Intent toggleScreenIntent = new Intent(this, CallActionReceiver.class);
        toggleScreenIntent.setAction(CallActionReceiver.ACTION_TOGGLE_SCREEN);
        PendingIntent piToggleScreen = PendingIntent.getBroadcast(
            this, 25, toggleScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Action 3: Hangup / Leave Room (Aramayı / Odayı Sonlandır)
        Intent hangupIntent = new Intent(this, CallActionReceiver.class);
        hangupIntent.setAction(CallActionReceiver.ACTION_HANGUP);
        PendingIntent piHangup = PendingIntent.getBroadcast(
            this, 30, hangupIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String micLabel = isMuted ? "🎙️ Aç" : "🎤 Sessiz";
        String screenLabel = isScreenSharing ? "⏹️ Durdur" : "📺 Ekran";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("📞 " + channelName)
            .setContentText("⏱️ Süre: " + duration + "  •  Aktif Görüşme")
            .setSubText("Oxypace")
            .setOngoing(true)
            .setShowWhen(false)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(piMain)
            .addAction(isMuted ? R.drawable.ic_pip_mic_off : R.drawable.ic_pip_mic, micLabel, piToggleMic)
            .addAction(isScreenSharing ? R.drawable.ic_pip_screen_off : R.drawable.ic_pip_screen, screenLabel, piToggleScreen)
            .addAction(R.drawable.ic_pip_end_call, "🔴 Ayrıl", piHangup)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            try {
                nm.deleteNotificationChannel("oxypace_active_call_v4");
            } catch (Exception ignored) {}

            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Aktif Canlı Görüşme Çubuğu",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Devam eden canlı görüşme ve oda süresi bildirim panelinde sabit çubuk olarak gösterilir.");
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            nm.createNotificationChannel(channel);
        }
    }
}
