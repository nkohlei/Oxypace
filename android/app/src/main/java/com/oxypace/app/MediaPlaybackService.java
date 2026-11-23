package com.oxypace.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.webkit.WebView;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Foreground Service managing background audio playback notification,
 * hardware media button callbacks, and lockscreen MediaSession controls.
 */
public class MediaPlaybackService extends Service {

    public static final String CHANNEL_ID = "oxypace_media_playback_v1";
    public static final int NOTIFICATION_ID = 9002;

    public static final String ACTION_UPDATE = "com.oxypace.app.MEDIA_UPDATE";
    public static final String ACTION_PLAY = "com.oxypace.app.MEDIA_PLAY";
    public static final String ACTION_PAUSE = "com.oxypace.app.MEDIA_PAUSE";
    public static final String ACTION_TOGGLE = "com.oxypace.app.MEDIA_TOGGLE";
    public static final String ACTION_NEXT = "com.oxypace.app.MEDIA_NEXT";
    public static final String ACTION_PREV = "com.oxypace.app.MEDIA_PREV";
    public static final String ACTION_STOP = "com.oxypace.app.MEDIA_STOP";

    public static volatile boolean isActive = false;
    public static volatile boolean isPlaying = false;

    private MediaSession mediaSession;
    private NotificationManager notificationManager;
    private BroadcastReceiver noisyReceiver;

    private String currentTitle = "Ses Dosyası";
    private String currentArtist = "Oxypace";
    private String currentAlbum = "Oxypace Ses";
    private String currentArtworkUrl = "";
    private Bitmap cachedArtworkBmp = null;
    private boolean currentIsPlaying = false;
    private boolean hasNext = false;
    private boolean hasPrev = false;
    private long durationMs = 0L;
    private long positionMs = 0L;

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();

        mediaSession = new MediaSession(this, "OxypaceMediaSession");
        mediaSession.setFlags(
            MediaSession.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                currentIsPlaying = true;
                isPlaying = true;
                updateMediaSessionState();
                postNotification();
                dispatchActionToWebView("play", -1);
            }

            @Override
            public void onPause() {
                currentIsPlaying = false;
                isPlaying = false;
                updateMediaSessionState();
                postNotification();
                dispatchActionToWebView("pause", -1);
            }

            @Override
            public void onSkipToNext() {
                dispatchActionToWebView("next", -1);
            }

            @Override
            public void onSkipToPrevious() {
                dispatchActionToWebView("prev", -1);
            }

            @Override
            public void onSeekTo(long pos) {
                positionMs = Math.max(0L, pos);
                updateMediaSessionState();
                dispatchActionToWebView("seek", pos / 1000.0);
            }

            @Override
            public void onStop() {
                stopMediaPlayback(true);
            }
        });
        mediaSession.setActive(true);

        noisyReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction()) && currentIsPlaying) {
                    currentIsPlaying = false;
                    isPlaying = false;
                    updateMediaSessionState();
                    postNotification();
                    dispatchActionToWebView("pause", -1);
                }
            }
        };
        try {
            registerReceiver(noisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }
        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopMediaPlayback(true);
            return START_NOT_STICKY;
        }
        if (ACTION_PLAY.equals(action)) {
            currentIsPlaying = true;
            isPlaying = true;
            updateMediaSessionState();
            postNotification();
            dispatchActionToWebView("play", -1);
            return START_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            currentIsPlaying = false;
            isPlaying = false;
            updateMediaSessionState();
            postNotification();
            dispatchActionToWebView("pause", -1);
            return START_STICKY;
        }
        if (ACTION_TOGGLE.equals(action)) {
            currentIsPlaying = !currentIsPlaying;
            isPlaying = currentIsPlaying;
            updateMediaSessionState();
            postNotification();
            dispatchActionToWebView(currentIsPlaying ? "play" : "pause", -1);
            return START_STICKY;
        }
        if (ACTION_NEXT.equals(action)) {
            dispatchActionToWebView("next", -1);
            return START_STICKY;
        }
        if (ACTION_PREV.equals(action)) {
            dispatchActionToWebView("prev", -1);
            return START_STICKY;
        }

        // ACTION_UPDATE
        String title = intent.getStringExtra("title");
        String artist = intent.getStringExtra("artist");
        String album = intent.getStringExtra("album");
        String artUrl = intent.getStringExtra("artworkUrl");
        boolean nextPlaying = intent.getBooleanExtra("isPlaying", true);

        if (title != null && !title.trim().isEmpty()) currentTitle = title.trim();
        if (artist != null && !artist.trim().isEmpty()) currentArtist = artist.trim();
        if (album != null && !album.trim().isEmpty()) currentAlbum = album.trim();
        currentIsPlaying = nextPlaying;
        hasNext = intent.getBooleanExtra("hasNext", false);
        hasPrev = intent.getBooleanExtra("hasPrev", false);
        durationMs = Math.max(0L, intent.getLongExtra("durationMs", 0L));
        positionMs = Math.max(0L, intent.getLongExtra("positionMs", 0L));

        isActive = true;
        isPlaying = currentIsPlaying;

        String normalizedArt = artUrl != null ? artUrl.trim() : "";
        if (!normalizedArt.equals(currentArtworkUrl)) {
            currentArtworkUrl = normalizedArt;
            cachedArtworkBmp = null;
            if (!normalizedArt.isEmpty()) {
                loadArtworkAsync(normalizedArt);
            }
        }

        updateMediaMetadata();
        updateMediaSessionState();
        postNotification();
        return START_STICKY;
    }

    private void loadArtworkAsync(final String urlStr) {
        new Thread(() -> {
            Bitmap bmp = null;
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlStr);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(6000);
                conn.setDoInput(true);
                conn.connect();
                if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
                    try (InputStream is = conn.getInputStream()) {
                        bmp = BitmapFactory.decodeStream(is);
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) conn.disconnect();
            }

            if (bmp != null && isActive && urlStr.equals(currentArtworkUrl)) {
                cachedArtworkBmp = bmp;
                updateMediaMetadata();
                postNotification();
            }
        }).start();
    }

    private void updateMediaMetadata() {
        if (mediaSession == null) return;
        try {
            MediaMetadata.Builder mb = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, currentAlbum);
            if (durationMs > 0) {
                mb.putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs);
            }
            if (cachedArtworkBmp != null) {
                mb.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, cachedArtworkBmp);
                mb.putBitmap(MediaMetadata.METADATA_KEY_ART, cachedArtworkBmp);
            }
            mediaSession.setMetadata(mb.build());
        } catch (Exception ignored) {}
    }

    private void updateMediaSessionState() {
        if (mediaSession == null) return;
        try {
            long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_STOP
                | PlaybackState.ACTION_SEEK_TO;
            if (hasNext) actions |= PlaybackState.ACTION_SKIP_TO_NEXT;
            if (hasPrev) actions |= PlaybackState.ACTION_SKIP_TO_PREVIOUS;

            int state = currentIsPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
            PlaybackState.Builder pb = new PlaybackState.Builder()
                .setActions(actions)
                .setState(state, positionMs, currentIsPlaying ? 1.0f : 0f);
            mediaSession.setPlaybackState(pb.build());
        } catch (Exception ignored) {}
    }

    private void postNotification() {
        try {
            Notification notif = buildNotification();
            if (currentIsPlaying) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notif);
                }
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_DETACH);
                } else {
                    stopForeground(false);
                }
                if (notificationManager != null) {
                    notificationManager.notify(NOTIFICATION_ID, notif);
                }
            }
        } catch (Exception e) {
            android.util.Log.w("MediaPlaybackService", "postNotification error: " + e.getMessage());
        }
    }

    private Notification buildNotification() {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPi = PendingIntent.getActivity(
            this,
            90020,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent stopPi = createServiceActionPi(ACTION_STOP, 90021);
        int smallIcon = getSafeSmallIcon();

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        builder
            .setSmallIcon(smallIcon)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText(currentAlbum)
            .setContentIntent(contentPi)
            .setDeleteIntent(stopPi)
            .setOnlyAlertOnce(true)
            .setOngoing(currentIsPlaying)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_TRANSPORT);

        if (cachedArtworkBmp != null) {
            builder.setLargeIcon(cachedArtworkBmp);
        }

        int actionIdx = 0;
        java.util.List<Integer> compactIndices = new java.util.ArrayList<>();

        if (hasPrev) {
            PendingIntent prevPi = createServiceActionPi(ACTION_PREV, 90022);
            builder.addAction(new Notification.Action.Builder(
                android.R.drawable.ic_media_previous, "Önceki", prevPi
            ).build());
            compactIndices.add(actionIdx);
            actionIdx++;
        }

        PendingIntent togglePi = createServiceActionPi(currentIsPlaying ? ACTION_PAUSE : ACTION_PLAY, 90023);
        builder.addAction(new Notification.Action.Builder(
            currentIsPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
            currentIsPlaying ? "Duraklat" : "Oynat",
            togglePi
        ).build());
        compactIndices.add(actionIdx);
        actionIdx++;

        if (hasNext) {
            PendingIntent nextPi = createServiceActionPi(ACTION_NEXT, 90024);
            builder.addAction(new Notification.Action.Builder(
                android.R.drawable.ic_media_next, "Sonraki", nextPi
            ).build());
            compactIndices.add(actionIdx);
            actionIdx++;
        }

        builder.addAction(new Notification.Action.Builder(
            android.R.drawable.ic_menu_close_clear_cancel, "Kapat", stopPi
        ).build());

        int[] compactArr = new int[Math.min(3, compactIndices.size())];
        for (int i = 0; i < compactArr.length; i++) {
            compactArr[i] = compactIndices.get(i);
        }

        Notification.MediaStyle mediaStyle = new Notification.MediaStyle()
            .setMediaSession(mediaSession.getSessionToken())
            .setShowActionsInCompactView(compactArr);
        builder.setStyle(mediaStyle);

        return builder.build();
    }

    private PendingIntent createServiceActionPi(String action, int reqCode) {
        Intent i = new Intent(this, MediaPlaybackService.class);
        i.setAction(action);
        return PendingIntent.getService(
            this,
            reqCode,
            i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private int getSafeSmallIcon() {
        try {
            int res = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
            if (res != 0) return res;
        } catch (Exception ignored) {}
        return android.R.drawable.ic_media_play;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel existing = notificationManager.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Ses Oynatıcı",
                    NotificationManager.IMPORTANCE_LOW
                );
                ch.setDescription("Arka planda ses dosyası ve müzik kontrolü");
                ch.setShowBadge(false);
                ch.setSound(null, null);
                ch.enableVibration(false);
                ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(ch);
            }
        }
    }

    private void dispatchActionToWebView(String action, double positionSec) {
        if ("stop".equals(action)) {
            dispatchJsAction("stop", -1);
            return;
        }
        dispatchJsAction(action, positionSec);
    }

    private static void dispatchJsAction(final String action, final double positionSec) {
        try {
            MainActivity act = MainActivity.getActivityInstance();
            com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
            if (act != null && bridge != null) {
                act.runOnUiThread(() -> {
                    try {
                        WebView wv = bridge.getWebView();
                        if (wv != null) {
                            String safeAction = action.replace("'", "");
                            String script = "(function(){ window.dispatchEvent(new CustomEvent('oxypace:native_media_action', { detail: { action: '"
                                + safeAction + "', position: " + positionSec + " } })); })();";
                            wv.evaluateJavascript(script, null);
                        }
                    } catch (Exception ignored) {}
                });
            }
        } catch (Exception ignored) {}
    }

    private void stopMediaPlayback(boolean notifyJs) {
        isActive = false;
        isPlaying = false;
        currentIsPlaying = false;
        if (notifyJs) {
            dispatchActionToWebView("stop", -1);
        }
        try {
            if (mediaSession != null) {
                mediaSession.setActive(false);
            }
        } catch (Exception ignored) {}
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Exception ignored) {}
        try {
            if (notificationManager != null) {
                notificationManager.cancel(NOTIFICATION_ID);
            }
        } catch (Exception ignored) {}
        stopSelf();
    }

    @Override
    public void onDestroy() {
        isActive = false;
        isPlaying = false;
        try {
            if (noisyReceiver != null) unregisterReceiver(noisyReceiver);
        } catch (Exception ignored) {}
        try {
            if (mediaSession != null) {
                mediaSession.setActive(false);
                mediaSession.release();
                mediaSession = null;
            }
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
