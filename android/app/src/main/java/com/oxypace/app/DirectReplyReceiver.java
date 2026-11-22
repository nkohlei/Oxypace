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
    public static final String KEY_CURRENT_USER_NAME = "current_user_name";
    public static final String KEY_CURRENT_USER_AVATAR = "current_user_avatar";

    public static void saveAuthCredentials(Context context, String token, String serverUrl, String userId, java.util.Set<String> inactiveUserIds) {
        saveAuthCredentials(context, token, serverUrl, userId, inactiveUserIds, null, null);
    }

    public static void saveAuthCredentials(Context context, String token, String serverUrl, String userId, java.util.Set<String> inactiveUserIds, String userName, String userAvatar) {
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
                if (userName != null && !userName.trim().isEmpty()) {
                    editor.putString(KEY_CURRENT_USER_NAME, userName.trim());
                }
                if (userAvatar != null) {
                    editor.putString(KEY_CURRENT_USER_AVATAR, userAvatar.trim());
                }
            } else {
                editor.remove(KEY_CURRENT_USER_ID);
                editor.remove(KEY_CURRENT_USER_NAME);
                editor.remove(KEY_CURRENT_USER_AVATAR);
            }

            if (inactiveUserIds != null) {
                java.util.Set<String> sanitizedInactive = new java.util.HashSet<>();
                for (String id : inactiveUserIds) {
                    if (id != null && !id.trim().isEmpty()) {
                        String trimmed = id.trim();
                        if (resolvedUserId == null || !trimmed.equalsIgnoreCase(resolvedUserId.trim())) {
                            sanitizedInactive.add(trimmed);
                        }
                    }
                }
                editor.putStringSet(KEY_INACTIVE_USER_IDS, sanitizedInactive);
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
                    final String apiBase = resolvedServerUrl.contains("oxypace.com.tr") && !resolvedServerUrl.contains("api.oxypace.com.tr")
                        ? "https://api.oxypace.com.tr"
                        : resolvedServerUrl.replaceAll("/+$", "");
                    new Thread(() -> {
                        try {
                            String apiUrl = apiBase + "/api/users/unbind-fcm-token";
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

    public static String getActiveUserName(Context context) {
        if (context == null) return "Ben";
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String uName = prefs.getString(KEY_CURRENT_USER_NAME, null);
            if (uName != null && !uName.trim().isEmpty()) return uName.trim();
        } catch (Exception ignored) {}
        return "Ben";
    }

    public static String getActiveUserAvatar(Context context) {
        if (context == null) return "";
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String uAvatar = prefs.getString(KEY_CURRENT_USER_AVATAR, "");
            return uAvatar != null ? uAvatar.trim() : "";
        } catch (Exception ignored) {}
        return "";
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

        final BroadcastReceiver.PendingResult pendingResult = goAsync();
        final Context appCtx = context.getApplicationContext();

        // Update notification silently (preserving prior incoming messages + own avatar)
        // and send message to backend on background thread.
        new Thread(() -> {
            try {
                OxypaceMessagingService.appendReplyAndUpdateNotification(
                    appCtx, recipientId, senderName, senderAvatar, notificationId, messageContent
                );
                sendMessageToBackend(appCtx, recipientId, messageContent);
            } finally {
                if (pendingResult != null) {
                    try { pendingResult.finish(); } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    private void sendMessageToBackend(Context context, String recipientId, String content) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String token = prefs.getString(KEY_JWT_TOKEN, "");
            String serverUrl = prefs.getString(KEY_SERVER_URL, "https://api.oxypace.com.tr");

            String apiBase = (serverUrl != null && serverUrl.contains("oxypace.com.tr") && !serverUrl.contains("api.oxypace.com.tr"))
                ? "https://api.oxypace.com.tr"
                : (serverUrl != null && !serverUrl.trim().isEmpty() ? serverUrl.trim().replaceAll("/+$", "") : "https://api.oxypace.com.tr");

            URL url = new URL(apiBase + "/api/messages");
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
