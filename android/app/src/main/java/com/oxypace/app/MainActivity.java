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

                    // Update PiP Params for Android 12+ Auto-Enter
                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            updatePiPParams(getActivity(), true);
                        });
                    }
                } else {
                    serviceIntent.setAction("STOP_CALL");
                    ctx.startService(serviceIntent);

                    if (getActivity() != null) {
                        getActivity().runOnUiThread(() -> {
                            updatePiPParams(getActivity(), false);
                        });
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
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
            call.resolve();
        }
    }

    public static void updatePiPParams(android.app.Activity activity, boolean enabled) {
        if (activity == null) return;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            try {
                android.app.PictureInPictureParams.Builder builder = new android.app.PictureInPictureParams.Builder();
                builder.setAspectRatio(new android.util.Rational(3, 4));
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(enabled);
                }
                activity.setPictureInPictureParams(builder.build());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (CallManager.isInCall) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                try {
                    android.app.PictureInPictureParams.Builder builder = new android.app.PictureInPictureParams.Builder();
                    builder.setAspectRatio(new android.util.Rational(3, 4));
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                        builder.setAutoEnterEnabled(true);
                    }
                    enterPictureInPictureMode(builder.build());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DownloaderPlugin.class);
        super.onCreate(savedInstanceState);

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

        registerPlugin(DownloaderPlugin.class);
        registerPlugin(CallManager.class);
        registerPlugin(AuthSync.class);

        // Handle JOIN_VOICE_CALL intent from incoming call notification
        handleIncomingCallIntent(getIntent());

        android.webkit.WebView webView = getBridge().getWebView();

        if (webView != null) {
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
                }
            });
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, android.content.res.Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        try {
            android.webkit.WebView webView = getBridge().getWebView();
            if (webView != null) {
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
        if (CallManager.isInCall) {
            // Keep WebView active in background when in a call (WhatsApp style background persistence)
            try {
                android.webkit.WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.resumeTimers();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            super.onPause();
        }
    }

    @Override
    public void onStop() {
        if (CallManager.isInCall) {
            // Keep WebView active in background when in a call
            try {
                android.webkit.WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.resumeTimers();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            super.onStop();
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
     * navigate the WebView to the target route.
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
                                "window.location.href = '" + targetRoute.replace("'", "\\'") + "';",
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

        // Navigate WebView to the route after bridge is ready
        final String finalRoute = route;
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            try {
                android.webkit.WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.evaluateJavascript(
                        "window.location.href = '" + finalRoute.replace("'", "\\'") + "';",
                        null
                    );
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 800);
    }
}
