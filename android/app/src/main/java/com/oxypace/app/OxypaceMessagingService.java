package com.oxypace.app;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Handles incoming FCM messages even when the app is completely closed.
 * For voice_invite type messages, shows a WhatsApp-style call notification
 * with "Katıl" (Join) and "Reddet" (Decline) action buttons.
 * v1.1.6: WakeLock screen wake, IMPORTANCE_HIGH channel v2.
 */
public class OxypaceMessagingService extends FirebaseMessagingService {

    public static final String VOICE_INVITE_CHANNEL_ID = "oxypace_voice_invite_v2";
    public static final int VOICE_INVITE_NOTIF_ID = 9001;

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getData().isEmpty()) {
            if (remoteMessage.getNotification() != null) {
                String imgUrl = null;
                if (remoteMessage.getNotification().getImageUrl() != null) {
                    imgUrl = remoteMessage.getNotification().getImageUrl().toString();
                }
                showStandardSystemNotification(
                    remoteMessage.getNotification().getTitle(),
                    remoteMessage.getNotification().getBody(),
                    null,
                    imgUrl
                );
            }
            return;
        }

        String type = remoteMessage.getData().get("type");
        if ("voice_invite".equals(type)) {
            showIncomingCallNotification(remoteMessage.getData());
        } else if ("message".equals(type) || remoteMessage.getData().containsKey("senderId") || remoteMessage.getData().containsKey("senderAvatar")) {
            showMessageNotification(remoteMessage.getData(), remoteMessage.getNotification());
        } else {
            String title = remoteMessage.getData().get("title");
            String body  = remoteMessage.getData().get("body");
            String imageUrl = remoteMessage.getData().get("image");
            if (imageUrl == null) imageUrl = remoteMessage.getData().get("picture");
            if (imageUrl == null) imageUrl = remoteMessage.getData().get("bigPicture");

            if (title == null && remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (body == null && remoteMessage.getNotification() != null) {
                body = remoteMessage.getNotification().getBody();
            }
            if (imageUrl == null && remoteMessage.getNotification() != null && remoteMessage.getNotification().getImageUrl() != null) {
                imageUrl = remoteMessage.getNotification().getImageUrl().toString();
            }

            if (title != null || body != null) {
                showStandardSystemNotification(title, body, remoteMessage.getData().get("route"), imageUrl);
            }
        }
    }

    // In-memory message history per sender to stack multiple incoming messages in one notification
    private static final java.util.Map<String, java.util.List<MessageItem>> messageHistory = new java.util.concurrent.ConcurrentHashMap<>();

    private static class MessageItem {
        final String text;
        final long timestamp;
        final String dataUri;
        final String mimeType;

        MessageItem(String text, long timestamp, String dataUri, String mimeType) {
            this.text = text;
            this.timestamp = timestamp;
            this.dataUri = dataUri;
            this.mimeType = mimeType;
        }
    }

    private void showMessageNotification(java.util.Map<String, String> data, RemoteMessage.Notification notif) {
        String channelId = "oxypace_messages_v2";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId, "Mesaj Bildirimleri", NotificationManager.IMPORTANCE_HIGH
            );
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            nm.createNotificationChannel(channel);
        }

        String senderId = getOrDefault(data, "senderId", "default_sender");
        String senderName = getOrDefault(data, "senderName", getOrDefault(data, "title", notif != null ? notif.getTitle() : "Oxypace"));
        String messageBody = getOrDefault(data, "body", notif != null ? notif.getBody() : "");
        String senderAvatar = getOrDefault(data, "senderAvatar", "");
        String imageUrl = getOrDefault(data, "image", getOrDefault(data, "picture", getOrDefault(data, "bigPicture", "")));
        String route = getOrDefault(data, "route", "/inbox/" + senderId);

        long now = System.currentTimeMillis();
        java.util.List<MessageItem> list = messageHistory.computeIfAbsent(senderId, k -> new java.util.ArrayList<>());
        synchronized (list) {
            String mime = (imageUrl != null && !imageUrl.isEmpty()) ? "image/jpeg" : null;
            list.add(new MessageItem(messageBody, now, imageUrl, mime));
            // Keep last 10 messages for conversation thread
            if (list.size() > 10) {
                list.remove(0);
            }
        }

        // Circular avatar bitmap with mini app logo badge (WhatsApp style)
        // If sender has no avatar or network is offline, create circular canvas avatar with user initial + Oxypace badge
        android.graphics.Bitmap avatarBitmap = null;
        if (senderAvatar != null && !senderAvatar.trim().isEmpty()) {
            avatarBitmap = fetchCircularAvatarWithBadge(senderAvatar.trim());
        }
        if (avatarBitmap == null) {
            avatarBitmap = createInitialAvatarWithBadge(senderName);
        }

        androidx.core.graphics.drawable.IconCompat avatarIconCompat = null;
        if (avatarBitmap != null) {
            avatarIconCompat = androidx.core.graphics.drawable.IconCompat.createWithBitmap(avatarBitmap);
        }

        androidx.core.app.Person.Builder personBuilder = new androidx.core.app.Person.Builder()
            .setName(senderName)
            .setKey(senderId);

        if (avatarIconCompat != null) {
            personBuilder.setIcon(avatarIconCompat);
        }

        androidx.core.app.Person senderPerson = personBuilder.build();

        // User person (device owner)
        androidx.core.app.Person userPerson = new androidx.core.app.Person.Builder()
            .setName("Ben")
            .build();

        // Dynamic Conversation Shortcut for Android 11+ (MIUI / HyperOS / OneUI Conversation Space)
        String shortcutId = "conversation_" + senderId;
        try {
            Intent shortcutIntent = new Intent(this, MainActivity.class);
            shortcutIntent.setAction("OPEN_ROUTE");
            shortcutIntent.putExtra("route", route);
            shortcutIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            androidx.core.content.pm.ShortcutInfoCompat.Builder scBuilder = new androidx.core.content.pm.ShortcutInfoCompat.Builder(this, shortcutId)
                .setShortLabel(senderName)
                .setLongLabel(senderName)
                .setPerson(senderPerson)
                .setIntent(shortcutIntent)
                .setLongLived(true);

            if (avatarIconCompat != null) {
                scBuilder.setIcon(avatarIconCompat);
            }

            androidx.core.content.pm.ShortcutManagerCompat.pushDynamicShortcut(this, scBuilder.build());
        } catch (Exception scErr) {
            // Ignore shortcut errors if not supported
        }

        // WhatsApp MessagingStyle Configuration:
        // isGroupConversation is false, but setConversationTitle gives the expanded header context
        NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(userPerson)
            .setConversationTitle(senderName)
            .setGroupConversation(false);

        synchronized (list) {
            for (MessageItem item : list) {
                NotificationCompat.MessagingStyle.Message msg = new NotificationCompat.MessagingStyle.Message(
                    item.text, item.timestamp, senderPerson
                );
                if (item.dataUri != null && !item.dataUri.isEmpty()) {
                    msg.setData(item.mimeType != null ? item.mimeType : "image/jpeg", android.net.Uri.parse(item.dataUri));
                }
                style.addMessage(msg);
            }
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("OPEN_ROUTE");
        intent.putExtra("route", route);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this, Math.abs(senderId.hashCode()), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Direct Reply RemoteInput (Inline Reply like WhatsApp)
        androidx.core.app.RemoteInput remoteInput = new androidx.core.app.RemoteInput.Builder(DirectReplyReceiver.KEY_TEXT_REPLY)
            .setLabel("Yanıtla...")
            .build();

        int notifId = Math.abs(senderId.hashCode());

        Intent replyIntent = new Intent(this, DirectReplyReceiver.class);
        replyIntent.setAction("com.oxypace.app.ACTION_DIRECT_REPLY");
        replyIntent.putExtra("recipientId", senderId);
        replyIntent.putExtra("notificationId", notifId);
        replyIntent.putExtra("senderName", senderName);
        replyIntent.putExtra("senderAvatar", senderAvatar);

        PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
            this,
            notifId,
            replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
        );

        NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
            R.drawable.ic_notification,
            "Yanıtla",
            replyPendingIntent
        )
        .addRemoteInput(remoteInput)
        .setAllowGeneratedReplies(true)
        .build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setSubText("Oxypace")
            .setContentTitle(senderName)
            .setContentText(messageBody)
            .setStyle(style)
            .setShortcutId(shortcutId)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .addAction(replyAction)
            .setShowWhen(true)
            .setWhen(now)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (avatarBitmap != null) {
            builder.setLargeIcon(avatarBitmap);
        }

        nm.notify(notifId, builder.build());
    }

    private android.graphics.Bitmap createInitialAvatarWithBadge(String name) {
        try {
            int targetSize = 192;
            android.graphics.Bitmap output = android.graphics.Bitmap.createBitmap(targetSize, targetSize, android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas canvas = new android.graphics.Canvas(output);

            android.graphics.Paint circlePaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
            // Nice vibrant gradient color based on name hash
            int hash = Math.abs(name != null ? name.hashCode() : 0);
            int[] palette = {0xFF6366F1, 0xFF3B82F6, 0xFF0EA5E9, 0xFF10B981, 0xFF8B5CF6, 0xFFEC4899};
            circlePaint.setColor(palette[hash % palette.length]);
            canvas.drawCircle(targetSize / 2f, targetSize / 2f, targetSize / 2f, circlePaint);

            // Initial letter
            String initial = (name != null && !name.trim().isEmpty()) ? name.trim().substring(0, 1).toUpperCase() : "O";
            android.graphics.Paint textPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
            textPaint.setColor(0xFFFFFFFF);
            textPaint.setTextSize(targetSize * 0.45f);
            textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
            textPaint.setTextAlign(android.graphics.Paint.Align.CENTER);

            android.graphics.Rect bounds = new android.graphics.Rect();
            textPaint.getTextBounds(initial, 0, initial.length(), bounds);
            float y = targetSize / 2f + bounds.height() / 2f;
            canvas.drawText(initial, targetSize / 2f, y, textPaint);

            // Mini badge
            try {
                android.graphics.Bitmap appLogo = android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
                if (appLogo != null) {
                    int badgeSize = (int) (targetSize * 0.38f);
                    int badgeX = targetSize - badgeSize;
                    int badgeY = targetSize - badgeSize;

                    android.graphics.Paint borderPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
                    borderPaint.setColor(0xFF090D16);
                    canvas.drawCircle(badgeX + badgeSize / 2f, badgeY + badgeSize / 2f, badgeSize / 2f + 2, borderPaint);

                    android.graphics.Bitmap circularBadge = android.graphics.Bitmap.createBitmap(badgeSize, badgeSize, android.graphics.Bitmap.Config.ARGB_8888);
                    android.graphics.Canvas badgeCanvas = new android.graphics.Canvas(circularBadge);
                    android.graphics.Paint bPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG | android.graphics.Paint.FILTER_BITMAP_FLAG);
                    badgeCanvas.drawCircle(badgeSize / 2f, badgeSize / 2f, badgeSize / 2f, bPaint);
                    bPaint.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN));
                    badgeCanvas.drawBitmap(appLogo, null, new android.graphics.Rect(0, 0, badgeSize, badgeSize), bPaint);

                    canvas.drawBitmap(circularBadge, badgeX, badgeY, null);
                }
            } catch (Exception ignored) {}

            return output;
        } catch (Exception e) {
            return null;
        }
    }

    private android.graphics.Bitmap fetchCircularAvatarWithBadge(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return null;
        try {
            java.net.URL url = new java.net.URL(imageUrl.trim());
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setDoInput(true);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) OxypaceApp");
            conn.setRequestProperty("Accept", "image/*,*/*");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.connect();

            int responseCode = conn.getResponseCode();
            if (responseCode != java.net.HttpURLConnection.HTTP_OK) {
                android.util.Log.w("OxypaceMessaging", "Avatar HTTP response code: " + responseCode + " for URL: " + imageUrl);
                return null;
            }

            java.io.InputStream is = conn.getInputStream();
            android.graphics.Bitmap src = android.graphics.BitmapFactory.decodeStream(is);
            is.close();
            conn.disconnect();

            if (src == null) {
                android.util.Log.w("OxypaceMessaging", "Decoded bitmap is null for URL: " + imageUrl);
                return null;
            }

            int size = Math.min(src.getWidth(), src.getHeight());
            if (size <= 0) return null;

            // Target uniform 192x192px avatar bitmap for crisp Android notification rendering
            int targetSize = 192;

            // 1. Create Circular Avatar
            android.graphics.Bitmap output = android.graphics.Bitmap.createBitmap(targetSize, targetSize, android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas canvas = new android.graphics.Canvas(output);

            final android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG | android.graphics.Paint.FILTER_BITMAP_FLAG);
            final android.graphics.Rect srcRect = new android.graphics.Rect(
                (src.getWidth() - size) / 2,
                (src.getHeight() - size) / 2,
                (src.getWidth() + size) / 2,
                (src.getHeight() + size) / 2
            );
            final android.graphics.Rect destRect = new android.graphics.Rect(0, 0, targetSize, targetSize);

            canvas.drawARGB(0, 0, 0, 0);
            canvas.drawCircle(targetSize / 2f, targetSize / 2f, targetSize / 2f, paint);
            paint.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN));
            canvas.drawBitmap(src, srcRect, destRect, paint);

            // 2. Draw Mini App Logo Badge in bottom right corner (WhatsApp style)
            try {
                android.graphics.Bitmap appLogo = android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
                if (appLogo != null) {
                    int badgeSize = (int) (targetSize * 0.38f);
                    int badgeX = targetSize - badgeSize;
                    int badgeY = targetSize - badgeSize;

                    // Draw dark outer border circle
                    android.graphics.Paint borderPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
                    borderPaint.setColor(0xFF090D16);
                    canvas.drawCircle(badgeX + badgeSize / 2f, badgeY + badgeSize / 2f, badgeSize / 2f + 2, borderPaint);

                    // Draw app icon inside circular badge
                    android.graphics.Bitmap circularBadge = android.graphics.Bitmap.createBitmap(badgeSize, badgeSize, android.graphics.Bitmap.Config.ARGB_8888);
                    android.graphics.Canvas badgeCanvas = new android.graphics.Canvas(circularBadge);
                    android.graphics.Paint bPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG | android.graphics.Paint.FILTER_BITMAP_FLAG);
                    badgeCanvas.drawCircle(badgeSize / 2f, badgeSize / 2f, badgeSize / 2f, bPaint);
                    bPaint.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN));
                    badgeCanvas.drawBitmap(appLogo, null, new android.graphics.Rect(0, 0, badgeSize, badgeSize), bPaint);

                    paint.setXfermode(null);
                    canvas.drawBitmap(circularBadge, badgeX, badgeY, paint);
                }
            } catch (Exception badgeErr) {
                // Ignore badge error
            }

            return output;
        } catch (Exception e) {
            android.util.Log.w("OxypaceMessaging", "Failed to fetch circular avatar: " + e.getMessage());
            return null;
        }
    }

    private void showStandardSystemNotification(String title, String body, String route, String imageUrl) {
        String channelId = "oxypace_general_notifications";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId, "Genel Bildirimler", NotificationManager.IMPORTANCE_HIGH
            );
            channel.enableLights(true);
            channel.enableVibration(true);
            nm.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("OPEN_ROUTE");
        if (route != null) intent.putExtra("route", route);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this, (int) System.currentTimeMillis(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
            .setContentTitle(title != null ? title : "Oxypace")
            .setContentText(body != null ? body : "")
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        // If an image URL is present, download bitmap and apply BigPictureStyle
        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                java.net.URL url = new java.net.URL(imageUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setDoInput(true);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.connect();
                java.io.InputStream is = conn.getInputStream();
                android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeStream(is);
                if (bitmap != null) {
                    builder.setStyle(
                        new NotificationCompat.BigPictureStyle()
                            .bigPicture(bitmap)
                            .setBigContentTitle(title != null ? title : "Oxypace")
                            .setSummaryText(body != null ? body : "")
                    );
                    builder.setLargeIcon(bitmap);
                }
            } catch (Exception e) {
                android.util.Log.w("OxypaceMessaging", "Failed to download push notification image: " + e.getMessage());
            }
        }

        nm.notify((int) System.currentTimeMillis(), builder.build());
    }

    private void showIncomingCallNotification(java.util.Map<String, String> data) {
        String senderName  = getOrDefault(data, "senderName",  "Birisi");
        String channelName = getOrDefault(data, "channelName", "Görüntülü Sohbet");
        String route       = getOrDefault(data, "route",       "");

        wakeScreen();
        createNotificationChannel();

        // JOIN intent (Must be MUTABLE for activity launch from lock screen/notification action to work correctly on Android 12+)
        Intent joinIntent = new Intent(this, MainActivity.class);
        joinIntent.setAction("JOIN_VOICE_CALL");
        joinIntent.putExtra("route", route);
        joinIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent joinPI = PendingIntent.getActivity(
            this, 12, joinIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        // DECLINE intent
        Intent declineIntent = new Intent(this, CallActionReceiver.class);
        declineIntent.setAction("DECLINE_VOICE_CALL");
        PendingIntent declinePI = PendingIntent.getBroadcast(
            this, 11, declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        // Full-screen intent (over lock screen)
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setAction("JOIN_VOICE_CALL");
        fullScreenIntent.putExtra("route", route);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent fullScreenPI = PendingIntent.getActivity(
            this, 22, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );


        android.net.Uri ringtoneUri = android.media.RingtoneManager.getDefaultUri(
            android.media.RingtoneManager.TYPE_RINGTONE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, VOICE_INVITE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
            .setContentTitle("📞 Görüntülü Sohbet Daveti")
            .setContentText(senderName + " seni " + channelName + " odasına davet ediyor!")
            .setSubText("Oxypace")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOngoing(true)
            .setSound(ringtoneUri)
            .setVibrate(new long[]{0, 1000, 500, 1000})
            .setTimeoutAfter(45_000L)
            .setFullScreenIntent(fullScreenPI, true)
            .setContentIntent(joinPI)
            .setDefaults(NotificationCompat.DEFAULT_LIGHTS);

        // Use Android's dedicated CallStyle to force standard/perfect rendering of Accept/Decline buttons on all versions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ standard CallStyle
            builder.setStyle(
                NotificationCompat.CallStyle.forIncomingCall(
                    new androidx.core.app.Person.Builder().setName(senderName).build(),
                    declinePI,
                    joinPI
                )
            );
        } else {
            // Standard action fallback for older versions
            builder.addAction(0, "✅ Katıl", joinPI)
                   .addAction(0, "❌ Reddet", declinePI);
        }

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(VOICE_INVITE_NOTIF_ID, builder.build());
        }
    }


    /**
     * Acquires a brief WakeLock to turn on the screen when an incoming call arrives.
     */
    private void wakeScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK
                        | PowerManager.ACQUIRE_CAUSES_WAKEUP
                        | PowerManager.ON_AFTER_RELEASE,
                    "oxypace:incoming_call_wake"
                );
                wl.acquire(10_000L);
            }
        } catch (Exception e) {
            android.util.Log.w("OxypaceMessaging", "WakeLock acquisition failed: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // Force delete older and current cached channels to reset OS notification priority/rendering rules
            nm.deleteNotificationChannel("oxypace_voice_invite");
            nm.deleteNotificationChannel(VOICE_INVITE_CHANNEL_ID);

            NotificationChannel channel = new NotificationChannel(
                VOICE_INVITE_CHANNEL_ID,
                "Görüntülü Sohbet Davetleri",
                NotificationManager.IMPORTANCE_MAX
            );
            channel.setDescription("Görüntülü sohbet odası davetleri - WhatsApp tarzı arama bildirimi");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);

            android.net.Uri ringtoneUri = android.media.RingtoneManager.getDefaultUri(
                android.media.RingtoneManager.TYPE_RINGTONE
            );
            android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
            channel.setSound(ringtoneUri, audioAttributes);

            nm.createNotificationChannel(channel);
        }
    }


    private static String getOrDefault(java.util.Map<String, String> map, String key, String def) {
        String val = map.get(key);
        return (val != null && !val.isEmpty()) ? val : def;
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Token refresh is handled by @capacitor/push-notifications plugin
    }
}
