package com.oxypace.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "Downloader")
public class DownloaderPlugin extends Plugin {

    private BroadcastReceiver downloadReceiver = null;
    private long enqueuedDownloadId = -1;
    private Handler progressHandler = null;
    private Runnable progressRunnable = null;

    @PluginMethod
    public void downloadFile(PluginCall call) {
        String url = call.getString("url");
        String filename = call.getString("filename");
        if (url == null || filename == null) {
            call.reject("URL or filename is missing");
            return;
        }

        boolean isApk = call.getBoolean("isApk", filename.toLowerCase().endsWith(".apk"));
        String mimeType = call.getString("mimeType", null);
        String title = call.getString("title", isApk ? "Oxypace Güncellemesi" : filename);
        String description = call.getString("description", isApk ? "Yeni sürüm paketi indiriliyor..." : "Dosya indiriliyor...");

        try {
            Context context = getContext();
            DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("DownloadManager not available");
                return;
            }

            // Check and clean existing target file in Downloads
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }
            File targetFile = new File(downloadsDir, filename);
            if (targetFile.exists()) {
                try {
                    targetFile.delete();
                } catch (Exception ignored) {}
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(title);
            request.setDescription(description);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            if (mimeType == null || mimeType.isEmpty()) {
                String lower = filename.toLowerCase();
                if (lower.endsWith(".apk")) mimeType = "application/vnd.android.package-archive";
                else if (lower.endsWith(".mp4")) mimeType = "video/mp4";
                else if (lower.endsWith(".mov")) mimeType = "video/quicktime";
                else if (lower.endsWith(".webm")) mimeType = "video/webm";
                else if (lower.endsWith(".mkv")) mimeType = "video/x-matroska";
                else if (lower.endsWith(".pdf")) mimeType = "application/pdf";
                else if (lower.endsWith(".png")) mimeType = "image/png";
                else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mimeType = "image/jpeg";
                else if (lower.endsWith(".gif")) mimeType = "image/gif";
                else if (lower.endsWith(".webp")) mimeType = "image/webp";
                else mimeType = "*/*";
            }
            request.setMimeType(mimeType);

            try {
                request.allowScanningByMediaScanner();
            } catch (Exception ignored) {}

            enqueuedDownloadId = manager.enqueue(request);

            // Register receiver to automatically open the APK installer ONLY IF isApk is true
            if (isApk) {
                registerDownloadReceiver(context, enqueuedDownloadId, targetFile);
            }

            // Start polling progress to notify JS frontend
            startProgressTracker(manager, enqueuedDownloadId);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("downloadId", enqueuedDownloadId);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    private void startProgressTracker(DownloadManager manager, long downloadId) {
        stopProgressTracker();
        progressHandler = new Handler(Looper.getMainLooper());
        progressRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    DownloadManager.Query query = new DownloadManager.Query();
                    query.setFilterById(downloadId);
                    Cursor cursor = manager.query(query);
                    if (cursor != null && cursor.moveToFirst()) {
                        int bytesDownloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                        int bytesTotalIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                        int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);

                        long bytesDownloaded = bytesDownloadedIdx != -1 ? cursor.getLong(bytesDownloadedIdx) : 0;
                        long bytesTotal = bytesTotalIdx != -1 ? cursor.getLong(bytesTotalIdx) : 0;
                        int status = statusIdx != -1 ? cursor.getInt(statusIdx) : 0;
                        cursor.close();

                        JSObject progressData = new JSObject();
                        progressData.put("bytesDownloaded", bytesDownloaded);
                        progressData.put("bytesTotal", bytesTotal);
                        progressData.put("status", status);
                        
                        int percentage = 0;
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            percentage = 100;
                        } else if (bytesTotal > 0) {
                            percentage = (int) ((bytesDownloaded * 100) / bytesTotal);
                        }
                        progressData.put("percentage", percentage);
                        notifyListeners("downloadProgress", progressData);

                        if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                            stopProgressTracker();
                            return;
                        }
                    } else if (cursor != null) {
                        cursor.close();
                    }
                } catch (Exception ignored) {}

                if (progressHandler != null) {
                    progressHandler.postDelayed(this, 600);
                }
            }
        };
        progressHandler.post(progressRunnable);
    }

    private void stopProgressTracker() {
        if (progressHandler != null && progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
            progressHandler = null;
            progressRunnable = null;
        }
    }

    private void registerDownloadReceiver(Context context, long downloadId, File targetFile) {
        if (downloadReceiver != null) {
            try {
                context.unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
            downloadReceiver = null;
        }

        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id == downloadId) {
                    stopProgressTracker();
                    JSObject doneData = new JSObject();
                    doneData.put("percentage", 100);
                    doneData.put("status", DownloadManager.STATUS_SUCCESSFUL);
                    notifyListeners("downloadProgress", doneData);

                    installApk(ctx, targetFile);
                    try {
                        ctx.unregisterReceiver(this);
                    } catch (Exception ignored) {}
                    downloadReceiver = null;
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                downloadReceiver,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_EXPORTED
            );
        } else {
            context.registerReceiver(
                downloadReceiver,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            );
        }
    }

    @PluginMethod
    public void installExistingApk(PluginCall call) {
        String filename = call.getString("filename", "oxypace.apk");
        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File targetFile = new File(downloadsDir, filename);
        installApk(getContext(), targetFile);
        call.resolve();
    }

    private void installApk(Context context, File apkFile) {
        try {
            // Check Unknown Sources Permission for Android 8.0 (API 26+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permIntent.setData(Uri.parse("package:" + context.getPackageName()));
                    permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(permIntent);
                }
            }

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Uri apkUri = null;

            // 1. Try DownloadManager Content Uri first (Standard for Android package installer)
            if (enqueuedDownloadId != -1) {
                DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    try {
                        apkUri = manager.getUriForDownloadedFile(enqueuedDownloadId);
                    } catch (Exception ignored) {}
                }
            }

            // 2. Fallback to FileProvider with explicit file
            if (apkUri == null && apkFile != null && apkFile.exists()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile
                    );
                } else {
                    apkUri = Uri.fromFile(apkFile);
                }
            }

            if (apkUri != null) {
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                context.startActivity(installIntent);
            }
        } catch (Exception e) {
            android.util.Log.e("DownloaderPlugin", "Failed to launch APK installer: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        stopProgressTracker();
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
            downloadReceiver = null;
        }
    }
}

