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
import android.media.RingtoneManager;
import android.media.AudioAttributes;
import android.net.Uri;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.io.File;
import java.io.FileOutputStream;

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

        // Strict Single-Session & Multi-Account Notification Isolation:
        // Only 1 user account can be logged in and active on the mobile app at any given time.
        // If no user is logged in (activeUserId is empty), or if the notification is targeted at
        // any account other than the currently active account, suppress it immediately.
        String activeUserId = DirectReplyReceiver.getActiveUserId(this);
        if (activeUserId == null || activeUserId.trim().isEmpty()) {
            android.util.Log.d("OxypaceMessaging", "Suppressed notification because no active user session is logged in.");
            return;
        }
        String cleanActiveUserId = activeUserId.trim();

        String targetUserId = remoteMessage.getData().get("targetUserId");
        if (targetUserId == null) targetUserId = remoteMessage.getData().get("recipientUserId");
        if (targetUserId == null) targetUserId = remoteMessage.getData().get("recipientId");

        if (targetUserId != null && !targetUserId.trim().isEmpty() && !"all".equalsIgnoreCase(targetUserId.trim())) {
            String trimmedTarget = targetUserId.trim();
            if (!cleanActiveUserId.equalsIgnoreCase(trimmedTarget)) {
                android.util.Log.d("OxypaceMessaging", "Suppressed notification for non-active account. Active: " + cleanActiveUserId + ", Target: " + trimmedTarget);
                return;
            }
            java.util.Set<String> inactiveUserIds = DirectReplyReceiver.getInactiveUserIds(this);
            if (inactiveUserIds != null && inactiveUserIds.contains(trimmedTarget)) {
                android.util.Log.d("OxypaceMessaging", "Suppressed notification for inactive background account: " + trimmedTarget);
                return;
            }
        }

        String type = remoteMessage.getData().get("type");
        if ("voice_invite".equals(type)) {
            showIncomingCallNotification(remoteMessage.getData());
        } else if ("message".equals(type)) {
            showMessageNotification(remoteMessage.getData(), remoteMessage.getNotification());
        } else if ("portal_post".equals(type)) {
            showPortalPostNotification(remoteMessage.getData(), remoteMessage.getNotification());
        } else if (remoteMessage.getData().containsKey("senderId") || remoteMessage.getData().containsKey("senderAvatar")) {
            showMessageNotification(remoteMessage.getData(), remoteMessage.getNotification());
        } else {
            String title = remoteMessage.getData().get("title");
            String body  = remoteMessage.getData().get("body");
            String imageUrl = remoteMessage.getData().get("image");
            if (imageUrl == null) imageUrl = remoteMessage.getData().get("picture");
            if (imageUrl == null) imageUrl = remoteMessage.getData().get("bigPicture");
            String avatarUrl = remoteMessage.getData().get("portalAvatar");
            if (avatarUrl == null) avatarUrl = remoteMessage.getData().get("avatar");

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
                showStandardSystemNotification(title, body, remoteMessage.getData().get("route"), imageUrl, avatarUrl);
            }
        }
    }

    // In-memory message history per sender to stack multiple incoming messages in one notification
    private static final java.util.Map<String, java.util.List<MessageItem>> messageHistory = new java.util.concurrent.ConcurrentHashMap<>();

    // Unread portal/channel post history per channelKey (portalId + "_" + channelId)
    public static final String PORTAL_NOTIF_PREFS = "OxypacePortalNotifPrefs";
    public static final int MAX_VISIBLE_PORTAL_POSTS = 5;
    private static final java.util.Map<String, java.util.List<PortalPostItem>> portalChannelHistory = new java.util.concurrent.ConcurrentHashMap<>();

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

    private static class PortalPostItem {
        final String postId;
        final String authorName;
        final String authorUsername;
        final String authorAvatar;
        final String text;
        final String mediaType;
        final String postMedia;
        final String pdfName;
        final String pdfSize;
        final long timestamp;

        PortalPostItem(String postId, String authorName, String authorUsername, String authorAvatar,
                       String text, String mediaType, String postMedia, String pdfName, String pdfSize, long timestamp) {
            this.postId = postId != null ? postId : "";
            this.authorName = authorName != null ? authorName : "Oxypace Üyesi";
            this.authorUsername = authorUsername != null ? authorUsername : "";
            this.authorAvatar = authorAvatar != null ? authorAvatar : "";
            this.text = text != null ? text : "";
            this.mediaType = mediaType != null ? mediaType : "none";
            this.postMedia = postMedia != null ? postMedia : "";
            this.pdfName = pdfName != null ? pdfName : "";
            this.pdfSize = pdfSize != null ? pdfSize : "";
            this.timestamp = timestamp > 0 ? timestamp : System.currentTimeMillis();
        }

        org.json.JSONObject toJson() {
            org.json.JSONObject obj = new org.json.JSONObject();
            try {
                obj.put("postId", postId);
                obj.put("authorName", authorName);
                obj.put("authorUsername", authorUsername);
                obj.put("authorAvatar", authorAvatar);
                obj.put("text", text);
                obj.put("mediaType", mediaType);
                obj.put("postMedia", postMedia);
                obj.put("pdfName", pdfName);
                obj.put("pdfSize", pdfSize);
                obj.put("timestamp", timestamp);
            } catch (Exception ignored) {}
            return obj;
        }

        static PortalPostItem fromJson(org.json.JSONObject obj) {
            if (obj == null) return null;
            return new PortalPostItem(
                obj.optString("postId", ""),
                obj.optString("authorName", "Oxypace Üyesi"),
                obj.optString("authorUsername", ""),
                obj.optString("authorAvatar", ""),
                obj.optString("text", ""),
                obj.optString("mediaType", "none"),
                obj.optString("postMedia", ""),
                obj.optString("pdfName", ""),
                obj.optString("pdfSize", ""),
                obj.optLong("timestamp", System.currentTimeMillis())
            );
        }
    }

    private static java.util.List<PortalPostItem> loadPortalChannelHistory(Context context, String channelKey) {
        java.util.List<PortalPostItem> memList = portalChannelHistory.get(channelKey);
        if (memList != null && !memList.isEmpty()) {
            return new java.util.ArrayList<>(memList);
        }
        java.util.List<PortalPostItem> loaded = new java.util.ArrayList<>();
        if (context != null && channelKey != null) {
            try {
                android.content.SharedPreferences prefs = context.getSharedPreferences(PORTAL_NOTIF_PREFS, Context.MODE_PRIVATE);
                String raw = prefs.getString("items_" + channelKey, null);
                if (raw != null && !raw.isEmpty()) {
                    org.json.JSONArray arr = new org.json.JSONArray(raw);
                    for (int i = 0; i < arr.length(); i++) {
                        PortalPostItem item = PortalPostItem.fromJson(arr.optJSONObject(i));
                        if (item != null) loaded.add(item);
                    }
                }
            } catch (Exception ignored) {}
        }
        return loaded;
    }

    private static void savePortalChannelHistory(Context context, String channelKey, java.util.List<PortalPostItem> items, int totalUnreadCount) {
        if (channelKey == null) return;
        portalChannelHistory.put(channelKey, new java.util.ArrayList<>(items));
        if (context != null) {
            try {
                org.json.JSONArray arr = new org.json.JSONArray();
                for (PortalPostItem item : items) {
                    arr.put(item.toJson());
                }
                android.content.SharedPreferences prefs = context.getSharedPreferences(PORTAL_NOTIF_PREFS, Context.MODE_PRIVATE);
                prefs.edit()
                    .putString("items_" + channelKey, arr.toString())
                    .putInt("count_" + channelKey, totalUnreadCount)
                    .apply();
            } catch (Exception ignored) {}
        }
    }

    public static void clearPortalHistoryForChannel(Context context, String channelKey) {
        if (channelKey == null) return;
        portalChannelHistory.remove(channelKey);
        if (context != null) {
            try {
                android.content.SharedPreferences prefs = context.getSharedPreferences(PORTAL_NOTIF_PREFS, Context.MODE_PRIVATE);
                prefs.edit()
                    .remove("items_" + channelKey)
                    .remove("count_" + channelKey)
                    .apply();
            } catch (Exception ignored) {}
        }
    }

    public static void clearPortalHistoryForPortal(Context context, String portalId) {
        if (portalId == null || portalId.isEmpty()) return;
        String prefix = portalId + "_";
        java.util.Iterator<String> it = portalChannelHistory.keySet().iterator();
        while (it.hasNext()) {
            String k = it.next();
            if (k != null && k.startsWith(prefix)) {
                it.remove();
            }
        }
        if (context != null) {
            try {
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                android.content.SharedPreferences prefs = context.getSharedPreferences(PORTAL_NOTIF_PREFS, Context.MODE_PRIVATE);
                android.content.SharedPreferences.Editor editor = prefs.edit();
                for (String key : prefs.getAll().keySet()) {
                    if (key.startsWith("items_" + prefix)) {
                        String chKey = key.substring("items_".length());
                        editor.remove(key);
                        editor.remove("count_" + chKey);
                        if (nm != null) {
                            nm.cancel(Math.abs(("portal_channel_" + chKey).hashCode()));
                        }
                    }
                }
                editor.apply();
            } catch (Exception ignored) {}
        }
    }

    public static void clearHistoryForSender(String senderId) {
        if (senderId != null) {
            messageHistory.remove(senderId.trim());
        }
    }

    public static void clearAllHistory() {
        messageHistory.clear();
        portalChannelHistory.clear();
    }

    public static void clearAllHistory(Context context) {
        messageHistory.clear();
        portalChannelHistory.clear();
        if (context != null) {
            try {
                context.getSharedPreferences(PORTAL_NOTIF_PREFS, Context.MODE_PRIVATE).edit().clear().apply();
            } catch (Exception ignored) {}
        }
    }

    private void showMessageNotification(java.util.Map<String, String> data, RemoteMessage.Notification notif) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        String senderId = getOrDefault(data, "senderId", "default_sender").trim();
        if ("default_sender".equals(senderId) || senderId.isEmpty()) {
            String route = data.get("route");
            if (route != null && route.contains("/inbox/")) {
                String[] parts = route.split("/inbox/");
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    senderId = parts[1].split("[/?#]")[0].trim();
                }
            }
        }

        // 🔇 CRITICAL SUPPRESSION CHECK:
        // If the user is currently inside the app AND actively viewing/chatting with this exact partner,
        // SUPPRESS the device notification completely! Do NOT wake screen, do NOT vibrate, do NOT play sound!
        if (MainActivity.isAppForeground && MainActivity.activeChatPartnerId != null) {
            String activePartner = MainActivity.activeChatPartnerId.trim();
            if (activePartner.equalsIgnoreCase(senderId)) {
                android.util.Log.d("OxypaceMsgService", "🔇 Suppressing device notification: user is actively chatting with " + senderId);
                try {
                    nm.cancel(Math.abs(senderId.hashCode()));
                } catch (Exception ignored) {}
                clearHistoryForSender(senderId);
                return;
            }
        }

        wakeScreen();
        String channelId = "oxypace_messages_v2";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId, "Mesaj Bildirimleri", NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Kişisel ve grup mesaj bildirimleri");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 200, 250});
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                .build();
            channel.setSound(defaultSoundUri, audioAttributes);

            nm.createNotificationChannel(channel);
        }

        String senderName = getOrDefault(data, "senderName", getOrDefault(data, "title", notif != null ? notif.getTitle() : "Oxypace"));
        String senderUsername = getOrDefault(data, "senderUsername", "");
        String messageBody = getOrDefault(data, "body", notif != null ? notif.getBody() : "");
        String senderAvatar = getOrDefault(data, "senderAvatar", "");
        String imageUrl = getOrDefault(data, "image", getOrDefault(data, "picture", getOrDefault(data, "bigPicture", "")));
        String route = getOrDefault(data, "route", "/inbox/" + senderId);

        // WhatsApp-style sender name display: e.g. "Ahmet Yılmaz (@ahmet)" or "ahmet"
        String displaySenderTitle = senderName;
        if (senderUsername != null && !senderUsername.trim().isEmpty() && !senderUsername.equalsIgnoreCase(senderName)) {
            displaySenderTitle = senderName + " (@" + senderUsername.trim() + ")";
        }

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
        // Never show pure app icon as main avatar: always sender photo or initial + Oxypace badge
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
            .setName(displaySenderTitle)
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
            .setConversationTitle(displaySenderTitle)
            .setGroupConversation(false);

        synchronized (list) {
            for (MessageItem item : list) {
                NotificationCompat.MessagingStyle.Message msg = new NotificationCompat.MessagingStyle.Message(
                    item.text, item.timestamp, senderPerson
                );
                // Use FileProvider content:// URI for inline image display (HTTP URLs are rejected by MessagingStyle)
                if (item.dataUri != null && !item.dataUri.isEmpty()) {
                    android.net.Uri contentUri = downloadImageToContentUri(item.dataUri, senderId);
                    if (contentUri != null) {
                        msg.setData("image/jpeg", contentUri);
                    }
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
        replyIntent.putExtra("senderName", displaySenderTitle);
        replyIntent.putExtra("senderAvatar", senderAvatar);

        PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
            this,
            notifId,
            replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
        );

        int smallIcon = getSafeSmallIcon();

        NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
            smallIcon,
            "Yanıtla",
            replyPendingIntent
        )
        .addRemoteInput(remoteInput)
        .setAllowGeneratedReplies(true)
        .build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(smallIcon)
            .setSubText("Oxypace")
            .setContentTitle(displaySenderTitle)
            .setContentText(messageBody)
            .setStyle(style)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .addAction(replyAction)
            .setShowWhen(true)
            .setWhen(now)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (shortcutId != null) {
            builder.setShortcutId(shortcutId);
        }

        if (avatarBitmap != null) {
            builder.setLargeIcon(avatarBitmap);
        }

        try {
            nm.notify(notifId, builder.build());
            android.util.Log.d("OxypaceMessaging", "Notification successfully posted for sender: " + senderName);
        } catch (Exception notifEx) {
            android.util.Log.e("OxypaceMessaging", "Failed to post message notification: " + notifEx.getMessage(), notifEx);
            // Fallback with minimal standard notification in case custom style fails
            try {
                NotificationCompat.Builder fallback = new NotificationCompat.Builder(this, channelId)
                    .setSmallIcon(smallIcon)
                    .setContentTitle(senderName)
                    .setContentText(messageBody)
                    .setContentIntent(pi)
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH);
                nm.notify(notifId, fallback.build());
            } catch (Exception ignored) {}
        }
    }


    private byte[] fetchBytesFromUrl(String urlString) {
        if (urlString == null || urlString.trim().isEmpty()) return null;
        String curUrl = urlString.trim();
        for (int redirectCount = 0; redirectCount < 5; redirectCount++) {
            java.net.HttpURLConnection conn = null;
            try {
                java.net.URL url = new java.net.URL(curUrl);
                conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setDoInput(true);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) OxypaceApp");
                conn.setRequestProperty("Accept", "image/*,*/*");
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(12000);
                conn.connect();

                int code = conn.getResponseCode();
                if (code == java.net.HttpURLConnection.HTTP_MOVED_PERM || 
                    code == java.net.HttpURLConnection.HTTP_MOVED_TEMP ||
                    code == java.net.HttpURLConnection.HTTP_SEE_OTHER ||
                    code == 307 || code == 308) {
                    String loc = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (loc != null && !loc.trim().isEmpty()) {
                        if (!loc.startsWith("http")) {
                            java.net.URL base = new java.net.URL(curUrl);
                            loc = new java.net.URL(base, loc).toString();
                        }
                        curUrl = loc;
                        continue;
                    }
                    return null;
                }

                if (code == java.net.HttpURLConnection.HTTP_OK) {
                    try (java.io.InputStream is = conn.getInputStream();
                         java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream()) {
                        byte[] buffer = new byte[8192];
                        int read;
                        while ((read = is.read(buffer)) != -1) {
                            bos.write(buffer, 0, read);
                        }
                        return bos.toByteArray();
                    }
                }
                return null;
            } catch (Exception e) {
                android.util.Log.w("OxypaceMessaging", "fetchBytes error for " + curUrl + ": " + e.getMessage());
                return null;
            } finally {
                if (conn != null) {
                    try { conn.disconnect(); } catch (Exception ignored) {}
                }
            }
        }
        return null;
    }

    private android.graphics.Bitmap fetchBitmapFromUrl(String urlString) {
        byte[] bytes = fetchBytesFromUrl(urlString);
        if (bytes != null && bytes.length > 0) {
            try {
                return android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            } catch (Exception e) {
                android.util.Log.w("OxypaceMessaging", "decodeByteArray error: " + e.getMessage());
            }
        }
        return null;
    }

    private android.graphics.Bitmap createCircularAvatar(android.graphics.Bitmap src) {
        if (src == null) return null;
        try {
            int size = Math.min(src.getWidth(), src.getHeight());
            if (size <= 0) return null;
            int targetSize = 192;
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
            return output;
        } catch (Exception e) {
            return null;
        }
    }

    private android.graphics.Bitmap createInitialAvatar(String name) {
        try {
            int targetSize = 192;
            android.graphics.Bitmap output = android.graphics.Bitmap.createBitmap(targetSize, targetSize, android.graphics.Bitmap.Config.ARGB_8888);
            android.graphics.Canvas canvas = new android.graphics.Canvas(output);

            android.graphics.Paint circlePaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
            int hash = Math.abs(name != null ? name.hashCode() : 0);
            int[] palette = {0xFF6366F1, 0xFF3B82F6, 0xFF0EA5E9, 0xFF10B981, 0xFF8B5CF6, 0xFFEC4899};
            circlePaint.setColor(palette[hash % palette.length]);
            canvas.drawCircle(targetSize / 2f, targetSize / 2f, targetSize / 2f, circlePaint);

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
            return output;
        } catch (Exception e) {
            return null;
        }
    }

    private android.graphics.Bitmap createInitialAvatarWithBadge(String name) {
        return createInitialAvatar(name);
    }

    private android.graphics.Bitmap fetchCircularAvatarWithBadge(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return null;
        android.graphics.Bitmap raw = fetchBitmapFromUrl(imageUrl);
        if (raw != null) {
            return createCircularAvatar(raw);
        }
        return null;
    }
    private void showStandardSystemNotification(String title, String body, String route, String imageUrl, String avatarUrl) {
        String channelId = "oxypace_general_notifications";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                channelId, "Genel Bildirimler", NotificationManager.IMPORTANCE_HIGH
            );
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
            channel.setSound(defaultSoundUri, audioAttributes);
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

        android.graphics.Bitmap avatarBitmap = null;
        if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
            avatarBitmap = fetchCircularAvatarWithBadge(avatarUrl.trim());
        }
        if (avatarBitmap == null) {
            avatarBitmap = android.graphics.BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(getSafeSmallIcon())
            .setLargeIcon(avatarBitmap)
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
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.connect();
                java.io.InputStream is = conn.getInputStream();
                android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeStream(is);
                is.close();
                conn.disconnect();
                if (bitmap != null) {
                    NotificationCompat.BigPictureStyle bigPic = new NotificationCompat.BigPictureStyle()
                        .bigPicture(bitmap)
                        .setBigContentTitle(title != null ? title : "Oxypace")
                        .setSummaryText(body != null ? body : "");
                    if (avatarBitmap != null) {
                        bigPic.bigLargeIcon(avatarBitmap);
                    }
                    builder.setStyle(bigPic);
                }
            } catch (Exception e) {
                android.util.Log.w("OxypaceMessaging", "Failed to download push notification image: " + e.getMessage());
            }
        }

        try {
            nm.notify((int) System.currentTimeMillis(), builder.build());
        } catch (Exception e) {
            android.util.Log.e("OxypaceMessaging", "Failed to notify standard system notification: " + e.getMessage());
        }
    }

    private void showStandardSystemNotification(String title, String body, String route, String imageUrl) {
        showStandardSystemNotification(title, body, route, imageUrl, null);
    }

    private void showPortalPostNotification(java.util.Map<String, String> data, RemoteMessage.Notification notif) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;

        String portalId = getOrDefault(data, "portalId", "portal").trim();
        String portalName = getOrDefault(data, "portalName", "Oxypace").trim();
        String channelName = getOrDefault(data, "channelName", "genel").trim();
        String rawChannelId = getOrDefault(data, "channelId", "").trim();
        if (rawChannelId.isEmpty() || "oxypace_messages_v2".equalsIgnoreCase(rawChannelId) || "oxypace_voice_invite_v2".equalsIgnoreCase(rawChannelId)) {
            rawChannelId = channelName.isEmpty() ? "general" : channelName;
        }
        String channelKey = portalId + "_" + rawChannelId;

        // If user is actively viewing this exact portal + channel in the foreground, suppress & clear history
        if (MainActivity.isAppForeground && MainActivity.activePortalChannelKey != null && MainActivity.activePortalChannelKey.equals(channelKey)) {
            clearPortalHistoryForChannel(this, channelKey);
            return;
        }

        wakeScreen();
        String notifChannelId = "oxypace_messages_v2";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = nm.getNotificationChannel(notifChannelId);
            if (channel == null) {
                channel = new NotificationChannel(
                    notifChannelId, "Mesaj ve Portal Bildirimleri", NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Doğrudan mesajlar ve portal gönderi bildirimleri");
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 250, 200, 250});
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

                Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
                channel.setSound(defaultSoundUri, audioAttributes);
                nm.createNotificationChannel(channel);
            }
        }

        String route = getOrDefault(data, "route", "/portal/" + portalId + "?channel=" + rawChannelId);
        String portalAvatar = getOrDefault(data, "portalAvatar", getOrDefault(data, "avatar", "")).trim();
        String postId = getOrDefault(data, "postId", String.valueOf(System.currentTimeMillis())).trim();
        String authorName = getOrDefault(data, "authorName", "Oxypace Üyesi").trim();
        String authorUsername = getOrDefault(data, "authorUsername", "").trim();
        String authorAvatar = getOrDefault(data, "authorAvatar", "").trim();
        String postText = getOrDefault(data, "postText", "").trim();
        String mediaType = getOrDefault(data, "mediaType", "none").trim();
        String postMedia = getOrDefault(data, "postMedia", "").trim();
        String pdfName = getOrDefault(data, "pdfName", "").trim();
        String pdfSize = getOrDefault(data, "pdfSize", "").trim();

        // Fallback extraction if legacy payload without postText was sent
        if (postText.isEmpty() && "none".equalsIgnoreCase(mediaType)) {
            String rawBody = getOrDefault(data, "body", notif != null && notif.getBody() != null ? notif.getBody() : "").trim();
            String prefix = authorName + ":";
            if (rawBody.startsWith(prefix)) {
                rawBody = rawBody.substring(prefix.length()).trim();
            }
            if (!"Yeni bir paylaşım yaptı".equalsIgnoreCase(rawBody)) {
                postText = rawBody;
            }
        }

        // Load persistent unread post history for this portal/channel (survives notification swipe/dismiss)
        java.util.List<PortalPostItem> existingHistory = loadPortalChannelHistory(this, channelKey);
        java.util.Map<String, PortalPostItem> mergedMap = new java.util.LinkedHashMap<>();
        for (PortalPostItem oldItem : existingHistory) {
            String key = (oldItem.postId != null && !oldItem.postId.isEmpty()) ? oldItem.postId : (oldItem.authorName + "_" + oldItem.timestamp);
            mergedMap.put(key, oldItem);
        }

        // Merge unreadItems array from backend (represents all unread posts in MongoDB for this portal/channel)
        String unreadItemsJson = getOrDefault(data, "unreadItems", "");
        if (!unreadItemsJson.isEmpty()) {
            try {
                org.json.JSONArray arr = new org.json.JSONArray(unreadItemsJson);
                for (int i = 0; i < arr.length(); i++) {
                    PortalPostItem pItem = PortalPostItem.fromJson(arr.optJSONObject(i));
                    if (pItem != null) {
                        String key = !pItem.postId.isEmpty() ? pItem.postId : (pItem.authorName + "_" + pItem.timestamp);
                        mergedMap.put(key, pItem);
                    }
                }
            } catch (Exception ignored) {}
        }

        // Ensure current incoming post is also in mergedMap
        PortalPostItem currentItem = new PortalPostItem(
            postId, authorName, authorUsername, authorAvatar,
            postText, mediaType, postMedia, pdfName, pdfSize, System.currentTimeMillis()
        );
        String currentKey = !postId.isEmpty() ? postId : (authorName + "_" + currentItem.timestamp);
        mergedMap.put(currentKey, currentItem);

        java.util.List<PortalPostItem> allMerged = new java.util.ArrayList<>(mergedMap.values());
        int backendUnreadCount = 1;
        try {
            backendUnreadCount = Integer.parseInt(getOrDefault(data, "unreadCount", "1"));
        } catch (Exception ignored) {}
        int totalUnreadCount = Math.max(backendUnreadCount, allMerged.size());

        // Enforce visual limit: only keep the latest MAX_VISIBLE_PORTAL_POSTS (5) items so notification never overflows
        java.util.List<PortalPostItem> itemsToDisplay;
        if (allMerged.size() > MAX_VISIBLE_PORTAL_POSTS) {
            itemsToDisplay = new java.util.ArrayList<>(allMerged.subList(allMerged.size() - MAX_VISIBLE_PORTAL_POSTS, allMerged.size()));
        } else {
            itemsToDisplay = allMerged;
        }

        savePortalChannelHistory(this, channelKey, itemsToDisplay, totalUnreadCount);

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("OPEN_ROUTE");
        if (!route.isEmpty()) intent.putExtra("route", route);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int notifId = Math.abs(("portal_channel_" + channelKey).hashCode());
        PendingIntent pi = PendingIntent.getActivity(
            this, notifId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Circular avatar bitmap of the portal (shown on the LEFT of the notification)
        android.graphics.Bitmap portalAvatarBitmap = null;
        if (!portalAvatar.isEmpty()) {
            android.graphics.Bitmap rawAvatar = fetchBitmapFromUrl(portalAvatar);
            if (rawAvatar != null) {
                portalAvatarBitmap = createCircularAvatar(rawAvatar);
            }
        }
        if (portalAvatarBitmap == null) {
            portalAvatarBitmap = createInitialAvatar(portalName);
        }

        androidx.core.graphics.drawable.IconCompat portalIconCompat = null;
        if (portalAvatarBitmap != null) {
            portalIconCompat = androidx.core.graphics.drawable.IconCompat.createWithBitmap(portalAvatarBitmap);
        }

        String baseTitle = portalName + " • #" + channelName;
        String headerTitle = baseTitle;
        if (totalUnreadCount > MAX_VISIBLE_PORTAL_POSTS) {
            headerTitle = baseTitle + " (+" + (totalUnreadCount - MAX_VISIBLE_PORTAL_POSTS) + " diğer • " + totalUnreadCount + " yeni)";
        } else if (totalUnreadCount > 1) {
            headerTitle = baseTitle + " (" + totalUnreadCount + " yeni)";
        }

        androidx.core.app.Person portalPerson = new androidx.core.app.Person.Builder()
            .setName(baseTitle)
            .setKey("portal_channel_" + channelKey)
            .setIcon(portalIconCompat)
            .build();

        androidx.core.app.Person userPerson = new androidx.core.app.Person.Builder()
            .setName("Ben")
            .build();

        // Push dynamic shortcut per portal/channel so each portal/channel has its own distinct conversation entry
        String shortcutId = "portal_conv_" + channelKey;
        try {
            androidx.core.content.pm.ShortcutInfoCompat.Builder scBuilder = new androidx.core.content.pm.ShortcutInfoCompat.Builder(this, shortcutId)
                .setShortLabel("#" + channelName)
                .setLongLabel(baseTitle)
                .setPerson(portalPerson)
                .setIntent(intent)
                .setLongLived(true);
            if (portalIconCompat != null) {
                scBuilder.setIcon(portalIconCompat);
            }
            androidx.core.content.pm.ShortcutManagerCompat.pushDynamicShortcut(this, scBuilder.build());
        } catch (Exception ignored) {}

        // Group conversation = true ensures Android ALWAYS displays each post's author name & @username
        NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(userPerson)
            .setConversationTitle(headerTitle)
            .setGroupConversation(true);

        boolean isAccumulated = itemsToDisplay.size() > 1;
        String latestSummaryText = "";

        if (!isAccumulated) {
            // SINGLE UNREAD POST:
            // Show Author (@username) + Post Description clearly in Message 1,
            // and if there is a PDF or Media, attach a clean minimal card/preview in Message 2 below it.
            PortalPostItem item = itemsToDisplay.get(0);
            String authorLabel = formatAuthorLabel(item.authorName, item.authorUsername);

            android.graphics.Bitmap authorBmp = null;
            if (!item.authorAvatar.isEmpty()) {
                android.graphics.Bitmap rawAuthor = fetchBitmapFromUrl(item.authorAvatar);
                if (rawAuthor != null) authorBmp = createCircularAvatar(rawAuthor);
            }
            if (authorBmp == null) {
                authorBmp = createInitialAvatar(item.authorName);
            }

            androidx.core.app.Person.Builder authorBuilder = new androidx.core.app.Person.Builder()
                .setName(authorLabel)
                .setKey("author_" + (item.authorUsername.isEmpty() ? item.authorName : item.authorUsername));
            if (authorBmp != null) {
                authorBuilder.setIcon(androidx.core.graphics.drawable.IconCompat.createWithBitmap(authorBmp));
            } else if (portalIconCompat != null) {
                authorBuilder.setIcon(portalIconCompat);
            }
            androidx.core.app.Person authorPerson = authorBuilder.build();

            String fallbackText = item.text;
            if (fallbackText.isEmpty()) {
                if ("pdf".equalsIgnoreCase(item.mediaType)) {
                    String pName = item.pdfName.isEmpty() ? "Doküman.pdf" : item.pdfName;
                    fallbackText = "📄 " + pName + (item.pdfSize.isEmpty() ? "" : " • " + item.pdfSize);
                } else if ("video".equalsIgnoreCase(item.mediaType)) {
                    fallbackText = "🎬 Video paylaştı";
                } else if ("gif".equalsIgnoreCase(item.mediaType)) {
                    fallbackText = "👾 GIF paylaştı";
                } else if (!item.postMedia.isEmpty() || "image".equalsIgnoreCase(item.mediaType)) {
                    fallbackText = "🖼️ Görsel paylaştı";
                } else {
                    fallbackText = "Yeni bir paylaşım yaptı";
                }
            }
            latestSummaryText = authorLabel + ": " + fallbackText;

            boolean addedAttachmentMsg = false;
            android.net.Uri attachmentUri = null;
            String attachmentMime = "image/jpeg";

            if ("pdf".equalsIgnoreCase(item.mediaType)) {
                android.graphics.Bitmap pageThumb = null;
                if (!item.postMedia.isEmpty() && !item.postMedia.equalsIgnoreCase(portalAvatar)) {
                    pageThumb = fetchBitmapFromUrl(item.postMedia);
                }
                android.graphics.Bitmap pdfCardBmp = createMinimalPdfCardBitmap(
                    pageThumb,
                    item.pdfName.isEmpty() ? "Doküman.pdf" : item.pdfName,
                    item.pdfSize.isEmpty() ? "PDF" : item.pdfSize
                );
                attachmentUri = saveBitmapToContentUri(pdfCardBmp, "portal_pdf_" + channelKey);
                attachmentMime = "image/png";
            } else if (!item.postMedia.isEmpty() && !item.postMedia.equalsIgnoreCase(portalAvatar)) {
                android.graphics.Bitmap rawMedia = fetchBitmapFromUrl(item.postMedia);
                if (rawMedia != null) {
                    android.graphics.Bitmap compactMedia = createCompactMediaPreviewBitmap(rawMedia);
                    attachmentUri = saveBitmapToContentUri(compactMedia, "portal_media_" + channelKey);
                    attachmentMime = "image/jpeg";
                }
            }

            // If post has description text (or has no visual attachment), add the text message first
            // so the post description is ALWAYS visible above the attachment!
            if (!item.text.isEmpty() || attachmentUri == null) {
                NotificationCompat.MessagingStyle.Message textMsg = new NotificationCompat.MessagingStyle.Message(
                    !item.text.isEmpty() ? item.text : fallbackText,
                    item.timestamp,
                    authorPerson
                );
                style.addMessage(textMsg);
            }

            // If post has a visual attachment (Minimal PDF Card or Compact Media Preview), add it cleanly
            if (attachmentUri != null) {
                NotificationCompat.MessagingStyle.Message mediaMsg = new NotificationCompat.MessagingStyle.Message(
                    fallbackText,
                    item.timestamp + 1,
                    authorPerson
                );
                mediaMsg.setData(attachmentMime, attachmentUri);
                style.addMessage(mediaMsg);
                addedAttachmentMsg = true;
            }
        } else {
            // ACCUMULATED UNREAD POSTS (itemsToDisplay.size() > 1, capped at MAX_VISIBLE_PORTAL_POSTS = 5):
            // Never attach full-size setData images when accumulated.
            // Instead, show media/PDFs in SMALL size (96x96 thumbnail icon on the message row + compact tag).
            for (int i = 0; i < itemsToDisplay.size(); i++) {
                PortalPostItem item = itemsToDisplay.get(i);
                String authorLabel = formatAuthorLabel(item.authorName, item.authorUsername);
                boolean hasMedia = "pdf".equalsIgnoreCase(item.mediaType)
                    || (!item.postMedia.isEmpty() && !item.postMedia.equalsIgnoreCase(portalAvatar))
                    || "image".equalsIgnoreCase(item.mediaType)
                    || "video".equalsIgnoreCase(item.mediaType)
                    || "gif".equalsIgnoreCase(item.mediaType);

                android.graphics.Bitmap rowIconBmp = null;
                if (hasMedia) {
                    android.graphics.Bitmap rawThumb = null;
                    if (!item.postMedia.isEmpty() && !item.postMedia.equalsIgnoreCase(portalAvatar)) {
                        rawThumb = fetchBitmapFromUrl(item.postMedia);
                    }
                    rowIconBmp = createSmallMediaThumbIcon(rawThumb, item.mediaType);
                } else {
                    if (!item.authorAvatar.isEmpty()) {
                        android.graphics.Bitmap rawAuthor = fetchBitmapFromUrl(item.authorAvatar);
                        if (rawAuthor != null) rowIconBmp = createCircularAvatar(rawAuthor);
                    }
                    if (rowIconBmp == null) {
                        rowIconBmp = createInitialAvatar(item.authorName);
                    }
                }

                androidx.core.app.Person.Builder rowPersonBuilder = new androidx.core.app.Person.Builder()
                    .setName(authorLabel)
                    .setKey("row_" + i + "_" + item.postId);
                if (rowIconBmp != null) {
                    rowPersonBuilder.setIcon(androidx.core.graphics.drawable.IconCompat.createWithBitmap(rowIconBmp));
                }

                String rowText;
                if ("pdf".equalsIgnoreCase(item.mediaType)) {
                    String pName = item.pdfName.isEmpty() ? "Doküman.pdf" : item.pdfName;
                    String pdfBadge = "📄 " + pName + (item.pdfSize.isEmpty() ? "" : " (" + item.pdfSize + ")");
                    rowText = item.text.isEmpty() ? pdfBadge : (item.text + " • " + pdfBadge);
                } else if ("video".equalsIgnoreCase(item.mediaType)) {
                    rowText = item.text.isEmpty() ? "🎬 Video" : (item.text + " • 🎬 Video");
                } else if ("gif".equalsIgnoreCase(item.mediaType)) {
                    rowText = item.text.isEmpty() ? "👾 GIF" : (item.text + " • 👾 GIF");
                } else if (!item.postMedia.isEmpty() || "image".equalsIgnoreCase(item.mediaType)) {
                    rowText = item.text.isEmpty() ? "🖼️ Görsel" : (item.text + " • 🖼️ Görsel");
                } else {
                    rowText = item.text.isEmpty() ? "Yeni bir paylaşım yaptı" : item.text;
                }

                latestSummaryText = authorLabel + ": " + rowText;
                style.addMessage(new NotificationCompat.MessagingStyle.Message(
                    rowText,
                    item.timestamp > 0 ? item.timestamp : (System.currentTimeMillis() + i),
                    rowPersonBuilder.build()
                ));
            }
        }

        int smallIcon = getSafeSmallIcon();
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, notifChannelId)
            .setSmallIcon(smallIcon)
            .setShortcutId(shortcutId)
            .setStyle(style)
            .setContentTitle(headerTitle)
            .setContentText(latestSummaryText)
            .setNumber(totalUnreadCount)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (portalAvatarBitmap != null) {
            builder.setLargeIcon(portalAvatarBitmap);
        }

        try {
            nm.notify(notifId, builder.build());
            android.util.Log.d("OxypaceMessaging", "Portal channel notification posted for " + headerTitle + " (unread=" + totalUnreadCount + ")");
        } catch (Exception e) {
            android.util.Log.e("OxypaceMessaging", "Failed to notify portal post: " + e.getMessage());
            try {
                NotificationCompat.Builder fallback = new NotificationCompat.Builder(this, notifChannelId)
                    .setSmallIcon(smallIcon)
                    .setContentTitle(headerTitle)
                    .setContentText(latestSummaryText)
                    .setContentIntent(pi)
                    .setAutoCancel(true);
                if (portalAvatarBitmap != null) fallback.setLargeIcon(portalAvatarBitmap);
                nm.notify(notifId, fallback.build());
            } catch (Exception ignored) {}
        }
    }

    private static String formatAuthorLabel(String authorName, String authorUsername) {
        String name = (authorName != null && !authorName.trim().isEmpty()) ? authorName.trim() : "Oxypace Üyesi";
        String user = (authorUsername != null && !authorUsername.trim().isEmpty()) ? authorUsername.trim() : "";
        if (!user.isEmpty()) {
            if (name.equalsIgnoreCase(user)) {
                return "@" + user;
            }
            return name + " (@" + user + ")";
        }
        return name;
    }

    /**
     * Renders a minimal horizontal PDF card bitmap matching the clean dark UI card:
     * Left: small vertical page preview with red "PDF" bottom strip.
     * Right: bold filename (e.g. EEM203_04.pdf) and muted file size (e.g. 0.48 MB).
     */
    private android.graphics.Bitmap createMinimalPdfCardBitmap(android.graphics.Bitmap pageThumb, String pdfName, String pdfSize) {
        int width = 520;
        int height = 132;
        android.graphics.Bitmap bmp = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(bmp);

        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);

        // Dark rounded card background (#14161B)
        paint.setColor(0xFF14161B);
        android.graphics.RectF cardRect = new android.graphics.RectF(2f, 2f, width - 2f, height - 2f);
        canvas.drawRoundRect(cardRect, 22f, 22f, paint);

        // Subtle border (#262A34)
        android.graphics.Paint borderPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        borderPaint.setStyle(android.graphics.Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2f);
        borderPaint.setColor(0xFF262A34);
        canvas.drawRoundRect(cardRect, 22f, 22f, borderPaint);

        // Left PDF page thumbnail box (x: 18..90, y: 16..116 -> 72x100)
        float thumbLeft = 18f;
        float thumbTop = 16f;
        float thumbWidth = 72f;
        float thumbHeight = 100f;
        android.graphics.RectF thumbRect = new android.graphics.RectF(thumbLeft, thumbTop, thumbLeft + thumbWidth, thumbTop + thumbHeight);

        android.graphics.Path clipPath = new android.graphics.Path();
        clipPath.addRoundRect(thumbRect, 12f, 12f, android.graphics.Path.Direction.CW);
        canvas.save();
        canvas.clipPath(clipPath);

        // White page background
        paint.setColor(0xFFFFFFFF);
        canvas.drawRect(thumbRect, paint);

        if (pageThumb != null) {
            android.graphics.Rect src = new android.graphics.Rect(0, 0, pageThumb.getWidth(), pageThumb.getHeight());
            android.graphics.RectF dst = new android.graphics.RectF(thumbLeft, thumbTop, thumbLeft + thumbWidth, thumbTop + thumbHeight - 24f);
            canvas.drawBitmap(pageThumb, src, dst, paint);
        } else {
            // Minimalist document lines placeholder on white page
            paint.setColor(0xFFD0D5DD);
            canvas.drawRoundRect(new android.graphics.RectF(thumbLeft + 10f, thumbTop + 14f, thumbLeft + thumbWidth - 10f, thumbTop + 20f), 3f, 3f, paint);
            canvas.drawRoundRect(new android.graphics.RectF(thumbLeft + 10f, thumbTop + 28f, thumbLeft + thumbWidth - 16f, thumbTop + 33f), 2.5f, 2.5f, paint);
            canvas.drawRoundRect(new android.graphics.RectF(thumbLeft + 10f, thumbTop + 40f, thumbLeft + thumbWidth - 12f, thumbTop + 45f), 2.5f, 2.5f, paint);
            canvas.drawRoundRect(new android.graphics.RectF(thumbLeft + 10f, thumbTop + 52f, thumbLeft + thumbWidth - 22f, thumbTop + 57f), 2.5f, 2.5f, paint);
        }

        // Red "PDF" badge banner at the bottom of the page thumbnail
        paint.setColor(0xFFE53935);
        android.graphics.RectF badgeRect = new android.graphics.RectF(thumbLeft, thumbTop + thumbHeight - 26f, thumbLeft + thumbWidth, thumbTop + thumbHeight);
        canvas.drawRect(badgeRect, paint);

        android.graphics.Paint badgeTextPaint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        badgeTextPaint.setColor(0xFFFFFFFF);
        badgeTextPaint.setTextSize(17f);
        badgeTextPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        badgeTextPaint.setTextAlign(android.graphics.Paint.Align.CENTER);
        canvas.drawText("PDF", thumbLeft + thumbWidth / 2f, thumbTop + thumbHeight - 7f, badgeTextPaint);
        canvas.restore();

        // Right side: Filename (bold white) + File size (muted gray)
        float textLeft = thumbLeft + thumbWidth + 22f;
        float maxTextWidth = width - textLeft - 20f;

        android.text.TextPaint titlePaint = new android.text.TextPaint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        titlePaint.setColor(0xFFF2F4F7);
        titlePaint.setTextSize(26f);
        titlePaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));

        String cleanName = (pdfName != null && !pdfName.isEmpty()) ? pdfName : "Doküman.pdf";
        CharSequence ellipsizedName = android.text.TextUtils.ellipsize(cleanName, titlePaint, maxTextWidth, android.text.TextUtils.TruncateAt.MIDDLE);
        canvas.drawText(ellipsizedName.toString(), textLeft, 60f, titlePaint);

        android.text.TextPaint sizePaint = new android.text.TextPaint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        sizePaint.setColor(0xFF98A2B3);
        sizePaint.setTextSize(21f);
        String cleanSize = (pdfSize != null && !pdfSize.isEmpty()) ? pdfSize : "PDF Belgesi";
        canvas.drawText(cleanSize, textLeft, 92f, sizePaint);

        return bmp;
    }

    /**
     * Creates a small 96x96 thumbnail icon for accumulated notification rows
     * so media/PDFs are displayed in small size alongside the message without taking up vertical space.
     */
    private android.graphics.Bitmap createSmallMediaThumbIcon(android.graphics.Bitmap rawBmp, String mediaType) {
        int size = 96;
        android.graphics.Bitmap out = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(out);
        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);

        android.graphics.RectF rect = new android.graphics.RectF(4f, 4f, size - 4f, size - 4f);
        android.graphics.Path path = new android.graphics.Path();
        path.addRoundRect(rect, 18f, 18f, android.graphics.Path.Direction.CW);
        canvas.save();
        canvas.clipPath(path);

        if ("pdf".equalsIgnoreCase(mediaType)) {
            paint.setColor(0xFFFFFFFF);
            canvas.drawRect(rect, paint);
            if (rawBmp != null) {
                android.graphics.Rect src = new android.graphics.Rect(0, 0, rawBmp.getWidth(), rawBmp.getHeight());
                android.graphics.RectF dst = new android.graphics.RectF(4f, 4f, size - 4f, size - 28f);
                canvas.drawBitmap(rawBmp, src, dst, paint);
            }
            paint.setColor(0xFFE53935);
            canvas.drawRect(new android.graphics.RectF(4f, size - 28f, size - 4f, size - 4f), paint);
            android.graphics.Paint tp = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
            tp.setColor(0xFFFFFFFF);
            tp.setTextSize(18f);
            tp.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
            tp.setTextAlign(android.graphics.Paint.Align.CENTER);
            canvas.drawText("PDF", size / 2f, size - 10f, tp);
        } else if (rawBmp != null) {
            int bw = rawBmp.getWidth();
            int bh = rawBmp.getHeight();
            int crop = Math.min(bw, bh);
            int cx = (bw - crop) / 2;
            int cy = (bh - crop) / 2;
            android.graphics.Rect src = new android.graphics.Rect(cx, cy, cx + crop, cy + crop);
            canvas.drawBitmap(rawBmp, src, rect, paint);
        } else {
            paint.setColor(0xFF1F242F);
            canvas.drawRect(rect, paint);
        }
        canvas.restore();
        return out;
    }

    /**
     * Scales a post media image to a clean, compact rounded preview bitmap for single-post notifications.
     */
    private android.graphics.Bitmap createCompactMediaPreviewBitmap(android.graphics.Bitmap rawBmp) {
        if (rawBmp == null) return null;
        int maxW = 540;
        int maxH = 270;
        int w = rawBmp.getWidth();
        int h = rawBmp.getHeight();
        if (w <= 0 || h <= 0) return rawBmp;

        float scale = Math.min((float) maxW / w, (float) maxH / h);
        int targetW = Math.max(120, Math.round(w * scale));
        int targetH = Math.max(80, Math.round(h * scale));

        android.graphics.Bitmap out = android.graphics.Bitmap.createBitmap(targetW, targetH, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(out);
        android.graphics.Paint paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        android.graphics.RectF rect = new android.graphics.RectF(0f, 0f, targetW, targetH);
        android.graphics.Path path = new android.graphics.Path();
        path.addRoundRect(rect, 18f, 18f, android.graphics.Path.Direction.CW);
        canvas.clipPath(path);
        canvas.drawBitmap(rawBmp, new android.graphics.Rect(0, 0, w, h), rect, paint);
        return out;
    }

    private android.net.Uri saveBitmapToContentUri(android.graphics.Bitmap bmp, String fileKey) {
        if (bmp == null) return null;
        try {
            File cacheDir = getCacheDir();
            String safeName = fileKey.replaceAll("[^a-zA-Z0-9_-]", "_");
            File imgFile = new File(cacheDir, "notif_" + safeName + ".png");
            FileOutputStream fos = new FileOutputStream(imgFile);
            bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 92, fos);
            fos.flush();
            fos.close();
            return FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", imgFile);
        } catch (Exception e) {
            android.util.Log.w("OxypaceMessaging", "saveBitmapToContentUri failed: " + e.getMessage());
            return null;
        }
    }
    private void showIncomingCallNotification(java.util.Map<String, String> data) {
        String senderName  = getOrDefault(data, "senderName",  "Birisi");
        String senderAvatar = getOrDefault(data, "senderAvatar", "");
        String channelName = getOrDefault(data, "channelName", "Görüntülü Sohbet");
        String route       = getOrDefault(data, "route",       "");
        String portalId    = getOrDefault(data, "portalId",    "");
        String channelId   = getOrDefault(data, "channelId",   "");

        if ((route == null || route.isEmpty()) && !portalId.isEmpty() && !channelId.isEmpty()) {
            route = "/portal/" + portalId + "?channel=" + channelId + "&joinVoice=true";
        }

        wakeScreen();
        createNotificationChannel();

        // JOIN intent — opens MainActivity and navigates to the voice channel (MUTABLE required on Android 12+)
        Intent joinIntent = new Intent(this, MainActivity.class);
        joinIntent.setAction("JOIN_VOICE_CALL");
        joinIntent.putExtra("route", route);
        joinIntent.putExtra("portalId", portalId);
        joinIntent.putExtra("channelId", channelId);
        joinIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent joinPI = PendingIntent.getActivity(
            this, 12, joinIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        // Full-screen intent (displayed over lock screen)
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setAction("JOIN_VOICE_CALL");
        fullScreenIntent.putExtra("route", route);
        fullScreenIntent.putExtra("portalId", portalId);
        fullScreenIntent.putExtra("channelId", channelId);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent fullScreenPI = PendingIntent.getActivity(
            this, 22, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        android.net.Uri ringtoneUri = android.media.RingtoneManager.getDefaultUri(
            android.media.RingtoneManager.TYPE_RINGTONE
        );

        int smallIcon = getSafeSmallIcon();

        // WhatsApp-style avatar: sender circular avatar with mini app logo badge
        android.graphics.Bitmap avatarBitmap = null;
        if (senderAvatar != null && !senderAvatar.trim().isEmpty()) {
            avatarBitmap = fetchCircularAvatarWithBadge(senderAvatar.trim());
        }
        if (avatarBitmap == null) {
            avatarBitmap = createInitialAvatarWithBadge(senderName);
        }

        // v2.1.1: Single "Katıl" (Join) action only — no Decline button.
        // Notification is NOT ongoing so user can swipe it away if they don't want to join.
        NotificationCompat.Action joinAction = new NotificationCompat.Action.Builder(
            smallIcon,
            "Katıl",
            joinPI
        ).build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, VOICE_INVITE_CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle("📞 Görüntülü Sohbet Daveti")
            .setContentText(senderName + " seni " + channelName + " odasına davet ediyor!")
            .setSubText("Oxypace")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOngoing(false)   // Swipeable — user can dismiss without joining
            .setSound(ringtoneUri)
            .setVibrate(new long[]{0, 1000, 500, 1000})
            .setTimeoutAfter(60_000L)  // Auto-dismiss after 60 seconds
            .setFullScreenIntent(fullScreenPI, true)
            .setContentIntent(joinPI)  // Tapping the notification body also joins
            .setDefaults(NotificationCompat.DEFAULT_LIGHTS)
            .addAction(joinAction);  // Only the Join button

        if (avatarBitmap != null) {
            builder.setLargeIcon(avatarBitmap);
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

            NotificationChannel existing = nm.getNotificationChannel(VOICE_INVITE_CHANNEL_ID);
            if (existing == null) {
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
    }


    /**
     * Downloads an image from a remote HTTP URL, saves it to the app cache directory,
     * and returns a FileProvider content:// URI suitable for MessagingStyle.Message.setData().
     * Returns null if the download fails or the URL is empty.
     */
    private android.net.Uri downloadImageToContentUri(String imageUrl, String senderId) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return null;
        try {
            java.net.URL url = new java.net.URL(imageUrl.trim());
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setDoInput(true);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) OxypaceApp");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.connect();
            if (conn.getResponseCode() != java.net.HttpURLConnection.HTTP_OK) return null;

            java.io.InputStream is = conn.getInputStream();
            android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(is);
            is.close();
            conn.disconnect();
            if (bmp == null) return null;

            // Save bitmap to cache directory with a stable name per sender
            File cacheDir = getCacheDir();
            File imgFile = new File(cacheDir, "notif_img_" + senderId.replaceAll("[^a-zA-Z0-9_-]", "_") + ".jpg");
            FileOutputStream fos = new FileOutputStream(imgFile);
            bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, fos);
            fos.flush();
            fos.close();

            // Return a FileProvider content URI that the notification system can read
            return FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", imgFile);
        } catch (Exception e) {
            android.util.Log.w("OxypaceMessaging", "downloadImageToContentUri failed: " + e.getMessage());
            return null;
        }
    }

    private static String getOrDefault(java.util.Map<String, String> map, String key, String def) {
        String val = map.get(key);
        return (val != null && !val.isEmpty()) ? val : def;
    }

    private int getSafeSmallIcon() {
        try {
            int iconRes = getResources().getIdentifier("ic_notification", "drawable", getPackageName());
            if (iconRes != 0) return iconRes;
        } catch (Exception ignored) {}
        try {
            int statRes = getResources().getIdentifier("ic_stat_name", "drawable", getPackageName());
            if (statRes != 0) return statRes;
        } catch (Exception ignored) {}
        return android.R.drawable.ic_dialog_info;
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        if (token == null || token.trim().isEmpty()) return;

        android.util.Log.d("OxypaceMessaging", "Firebase onNewToken received: " + token);

        // 1. Forward to Capacitor plugin if active
        try {
            com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin.onNewToken(token);
        } catch (Throwable ignored) {}

        // 2. Persist locally in SharedPreferences
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("OxypaceAuthPrefs", Context.MODE_PRIVATE);
            prefs.edit().putString("fcm_token", token).apply();

            // 3. If user is logged in (JWT token available in SharedPreferences), sync immediately to backend
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
                        conn.setConnectTimeout(10000);
                        conn.setReadTimeout(10000);

                        String jsonBody = "{\"token\":\"" + token + "\"}";
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            os.write(jsonBody.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        }

                        int code = conn.getResponseCode();
                        android.util.Log.d("OxypaceMessaging", "Background FCM token sync HTTP response: " + code);
                        conn.disconnect();
                    } catch (Exception e) {
                        android.util.Log.w("OxypaceMessaging", "Background FCM token sync failed: " + e.getMessage());
                    }
                }).start();
            }
        } catch (Exception e) {
            android.util.Log.w("OxypaceMessaging", "Failed to save onNewToken: " + e.getMessage());
        }
    }
}
