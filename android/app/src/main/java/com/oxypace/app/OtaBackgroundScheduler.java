package com.oxypace.app;

import android.content.Context;
import android.webkit.WebView;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import ee.forgr.capacitor_updater.HeadlessUpdateWorker;
import java.util.concurrent.TimeUnit;

/**
 * Schedules periodic headless OTA bundle checks (backup) and triggers immediate
 * headless background OTA downloads via Capgo HeadlessUpdateWorker when a silent
 * FCM push arrives while the app is closed or backgrounded.
 */
public final class OtaBackgroundScheduler {

    private static final String PERIODIC_WORK_NAME = "oxypace_periodic_ota_check";
    private static final String TAG = "OtaBackgroundScheduler";

    private OtaBackgroundScheduler() {}

    public static void schedulePeriodicChecks(Context context) {
        if (context == null) return;
        try {
            Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

            PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(
                HeadlessUpdateWorker.class,
                4,
                TimeUnit.HOURS
            )
                .setConstraints(constraints)
                .addTag(PERIODIC_WORK_NAME)
                .build();

            WorkManager.getInstance(context.getApplicationContext()).enqueueUniquePeriodicWork(
                PERIODIC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            );
            android.util.Log.d(TAG, "Scheduled periodic headless OTA check (every 4h when connected)");
        } catch (Throwable t) {
            android.util.Log.w(TAG, "Failed to schedule periodic headless OTA check: " + t.getMessage());
        }
    }

    public static void triggerImmediateCheck(Context context) {
        if (context == null) return;
        try {
            HeadlessUpdateWorker.enqueue(context.getApplicationContext());
            android.util.Log.i(TAG, "Enqueued immediate headless OTA update check");
        } catch (Throwable t) {
            android.util.Log.w(TAG, "Failed to enqueue HeadlessUpdateWorker: " + t.getMessage());
        }

        // If WebView is currently active in foreground, notify JS listener as well
        try {
            MainActivity act = MainActivity.getActivityInstance();
            com.getcapacitor.Bridge bridge = MainActivity.getBridgeInstance();
            if (MainActivity.isAppForeground && act != null && bridge != null) {
                act.runOnUiThread(() -> {
                    try {
                        WebView wv = bridge.getWebView();
                        if (wv != null) {
                            wv.evaluateJavascript(
                                "(function(){ window.dispatchEvent(new CustomEvent('oxypace:ota_push')); })();",
                                null
                            );
                        }
                    } catch (Exception ignored) {}
                });
            }
        } catch (Throwable ignored) {}
    }
}
