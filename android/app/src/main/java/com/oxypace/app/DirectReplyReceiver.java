package com.oxypace.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.graphics.drawable.IconCompat;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Handles WhatsApp-style Inline Direct Replies directly from Android Notifications
 * without requiring the user to open the Oxypace app.
 */
public class DirectReplyReceiver extends BroadcastReceiver {

    public static final String KEY_TEXT_REPLY = "key_text_reply";
    public static final String PREFS_NAME = "OxypaceAuthPrefs";
    public static final String KEY_JWT_TOKEN = "jwt_token";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String KEY_CURRENT_USER_ID = "current_user_id";
    public static final String KEY_INACTIVE_USER_IDS = "inactive_user_ids";

    public static void saveAuthCredentials(Context context, String token, String serverUrl, String userId, java.util.Set<String> inactiveUserIds) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String prevJwt = prefs.getString(KEY_JWT_TOKEN, "");
            String prevUserId = prefs.getString(KEY_CURRENT_USER_ID, "");
            if ((prevUserId == null || prevUserId.trim().isEmpty()) && prevJwt != null && !prevJwt.trim().isEmpty()) {
                String extractedPrev = extractUserIdFromJwt(prevJwt);
                if (extractedPrev != null) prevUserId = extractedPrev;
            }
            String storedFcmToken = prefs.getString("fcm_token", "");
            final String resolvedServerUrl = (serverUrl != null && !serverUrl.trim().isEmpty()) ? serverUrl.trim() : "https://oxypace.com.tr";

            String resolvedUserId = (userId != null && !userId.trim().isEmpty()) ? userId.trim() : null;
            if (resolvedUserId == null && token != null && !token.trim().isEmpty()) {
                resolvedUserId = extractUserIdFromJwt(token);
            }

            boolean isLogout = (token == null || token.trim().isEmpty()) || (resolvedUserId == null || resolvedUserId.isEmpty());
            boolean isUserSwitch = (prevUserId != null && !prevUserId.trim().isEmpty()) &&
                (isLogout || !prevUserId.trim().equalsIgnoreCase(resolvedUserId.trim()));

            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(KEY_JWT_TOKEN, token != null ? token : "");
            editor.putString(KEY_SERVER_URL, resolvedServerUrl);

            if (!isLogout) {
                editor.putString(KEY_CURRENT_USER_ID, resolvedUserId);
            } else {
                editor.remove(KEY_CURRENT_USER_ID);
            }

            if (inactiveUserIds != null) {
                editor.putStringSet(KEY_INACTIVE_USER_IDS, inactiveUserIds);
            } else if (isUserSwitch && prevUserId != null && !prevUserId.trim().isEmpty()) {
                java.util.Set<String> existingInactive = new java.util.HashSet<>(getInactiveUserIds(context));
                existingInactive.add(prevUserId.trim());
                if (resolvedUserId != null) {
                    existingInactive.remove(resolvedUserId.trim());
                }
                editor.putStringSet(KEY_INACTIVE_USER_IDS, existingInactive);
            }
            editor.apply();

            if (isUserSwitch || isLogout) {
                try {
                    NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) {
                        nm.cancelAll();
                    }
                    OxypaceMessagingService.clearAllHistory(context);
                } catch (Exception ignored) {}

                // Natively unbind FCM token from the previous account so it can never receive background pushes
                if (prevJwt != null && !prevJwt.trim().isEmpty()) {
                    final String jwtToUnbind = prevJwt.trim();
                    final String fcmToUnbind = storedFcmToken != null ? storedFcmToken.trim() : "";
                    new Thread(() -> {
                        try {
                            String apiUrl = resolvedServerUrl.replaceAll("/+$", "") + "/api/users/unbind-fcm-token";
                            URL url = new URL(apiUrl);
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("POST");
                            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                            conn.setRequestProperty("Authorization", "Bearer " + jwtToUnbind);
                            conn.setDoOutput(true);
                            conn.setConnectTimeout(8000);
                            conn.setReadTimeout(8000);
                            String body = "{\"token\":\"" + fcmToUnbind + "\"}";
                            try (OutputStream os = conn.getOutputStream()) {
                                os.write(body.getBytes(StandardCharsets.UTF_8));
                            }
                            conn.getResponseCode();
                            conn.disconnect();
                        } catch (Exception ignored) {}
                    }).start();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void saveAuthCredentials(Context context, String token, String serverUrl, String userId) {
        saveAuthCredentials(context, token, serverUrl, userId, null);
    }

    public static void saveAuthCredentials(Context context, String token, String serverUrl) {
        saveAuthCredentials(context, token, serverUrl, null, null);
    }

    public static java.util.Set<String> getInactiveUserIds(Context context) {
        if (context == null) return java.util.Collections.emptySet();
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            java.util.Set<String> set = prefs.getStringSet(KEY_INACTIVE_USER_IDS, null);
            return set != null ? set : java.util.Collections.emptySet();
        } catch (Exception ignored) {}
        return java.util.Collections.emptySet();
    }

    public static String getActiveUserId(Context context) {
        if (context == null) return null;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String uId = prefs.getString(KEY_CURRENT_USER_ID, null);
            if (uId != null && !uId.trim().isEmpty()) return uId.trim();
            String jwt = prefs.getString(KEY_JWT_TOKEN, null);
            if (jwt != null && !jwt.trim().isEmpty()) {
                return extractUserIdFromJwt(jwt);
            }
        } catch (Exception ignored) {}
        return null;
    }

    public static String extractUserIdFromJwt(String jwt) {
        if (jwt == null || jwt.trim().isEmpty()) return null;
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length >= 2) {
                byte[] decoded = android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE | android.util.Base64.NO_WRAP | android.util.Base64.NO_PADDING);
                String json = new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
                org.json.JSONObject obj = new org.json.JSONObject(json);
                if (obj.has("id")) return obj.getString("id");
                if (obj.has("userId")) return obj.getString("userId");
                if (obj.has("_id")) return obj.getString("_id");
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput == null) return;

        CharSequence replyText = remoteInput.getCharSequence(KEY_TEXT_REPLY);
        if (replyText == null || replyText.toString().trim().isEmpty()) return;

        String messageContent = replyText.toString().trim();
        String recipientId = intent.getStringExtra("recipientId");
        int notificationId = intent.getIntExtra("notificationId", 0);
        String senderName = intent.getStringExtra("senderName");
        String senderAvatar = intent.getStringExtra("senderAvatar");

        if (recipientId == null || recipientId.isEmpty()) return;

        // 1. Immediately update notification state with the sent message
        updateNotificationWithSentReply(context, notificationId, senderName, senderAvatar, recipientId, messageContent);

        // 2. Perform asynchronous HTTP POST request to /api/messages
        new Thread(() -> {
            sendMessageToBackend(context, recipientId, messageContent);
        }).start();
    }

    private void updateNotificationWithSentReply(
        Context context,
        int notificationId,
        String senderName,
        String senderAvatar,
        String recipientId,
        String replyText
    ) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            String channelId = "oxypace_messages_v2";

            Person userPerson = new Person.Builder()
                .setName("Ben")
                .build();

            Person senderPerson = new Person.Builder()
                .setName(senderName != null ? senderName : "Oxypace")
                .setKey(recipientId)
                .build();

            NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(userPerson)
                .setConversationTitle(senderName)
                .setGroupConversation(false);

            // Add our sent message so the thread is visible
            style.addMessage(replyText, System.currentTimeMillis(), userPerson);

            // Build a contentIntent so tapping the updated notification opens the correct chat screen
            String route = "/inbox/" + recipientId;
            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setAction("OPEN_ROUTE");
            openIntent.putExtra("route", route);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            android.app.PendingIntent contentPi = android.app.PendingIntent.getActivity(
                context,
                notificationId,
                openIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_notification)
                .setStyle(style)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setContentIntent(contentPi);  // ← tap opens the chat after reply

            nm.notify(notificationId, builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendMessageToBackend(Context context, String recipientId, String content) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String token = prefs.getString(KEY_JWT_TOKEN, "");
            String serverUrl = prefs.getString(KEY_SERVER_URL, "https://oxypace.com.tr");

            if (serverUrl == null || serverUrl.isEmpty()) {
                serverUrl = "https://oxypace.com.tr";
            }
            if (serverUrl.endsWith("/")) {
                serverUrl = serverUrl.substring(0, serverUrl.length() - 1);
            }

            URL url = new URL(serverUrl + "/api/messages");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            if (token != null && !token.isEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setDoOutput(true);

            String jsonPayload = String.format("{\"recipientId\":\"%s\",\"content\":\"%s\"}",
                recipientId.replace("\"", "\\\""),
                content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "")
            );

            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            android.util.Log.d("DirectReplyReceiver", "Direct reply POST status: " + responseCode);
        } catch (Exception e) {
            android.util.Log.e("DirectReplyReceiver", "Failed to post direct reply: " + e.getMessage(), e);
        }
    }
}
