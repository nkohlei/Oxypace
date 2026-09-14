package com.oxypace.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "Downloader")
public class DownloaderPlugin extends Plugin {

    private final ExecutorService executor = Executors.newCachedThreadPool();
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

        // Determine MIME type
        if (mimeType == null || mimeType.isEmpty() || mimeType.equals("*/*")) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".apk")) mimeType = "application/vnd.android.package-archive";
            else if (lower.endsWith(".mp4")) mimeType = "video/mp4";
            else if (lower.endsWith(".mov")) mimeType = "video/quicktime";
            else if (lower.endsWith(".webm")) mimeType = "video/webm";
            else if (lower.endsWith(".mkv")) mimeType = "video/x-matroska";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mimeType = "image/jpeg";
            else if (lower.endsWith(".png")) mimeType = "image/png";
            else if (lower.endsWith(".webp")) mimeType = "image/webp";
            else if (lower.endsWith(".gif")) mimeType = "image/gif";
            else if (lower.endsWith(".pdf")) mimeType = "application/pdf";
            else mimeType = "video/mp4";
        }

        if (isApk) {
            downloadApkViaSystem(call, url, filename, title, description, mimeType);
        } else {
            downloadMediaDirectly(call, url, filename, mimeType);
        }
    }

    /**
     * Direct Media Downloader:
     * Saves videos into Movies/Oxypace and images into Pictures/Oxypace using MediaStore.
     * Sets DATE_TAKEN, DATE_ADDED, and DATE_MODIFIED to the exact download timestamp so
     * that all Android Gallery apps display the video immediately under "Today" (current moment)
     * and play it flawlessly through the native MediaStore Video table.
     */
    private void downloadMediaDirectly(PluginCall call, String fileUrl, String filename, String mimeType) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("downloadId", System.currentTimeMillis());
        call.resolve(ret);

        executor.execute(new Runnable() {
            @Override
            public void run() {
                Context context = getContext();
                if (context == null) return;
                ContentResolver resolver = context.getContentResolver();

                String lower = filename.toLowerCase();
                boolean isVideo = mimeType.startsWith("video/") || lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.endsWith(".mkv");
                boolean isImage = mimeType.startsWith("image/") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".gif");

                Uri targetUri = null;
                OutputStream out = null;
                InputStream in = null;
                HttpURLConnection conn = null;
                File legacyFile = null;

                try {
                    long now = System.currentTimeMillis();
                    long nowSec = now / 1000;

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                        values.put(MediaStore.MediaColumns.DATE_ADDED, nowSec);
                        values.put(MediaStore.MediaColumns.DATE_MODIFIED, nowSec);
                        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                        Uri collectionUri;
                        if (isVideo) {
                            values.put(MediaStore.Video.Media.TITLE, filename);
                            values.put(MediaStore.Video.Media.DATE_TAKEN, now);
                            values.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/Oxypace");
                            collectionUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                        } else if (isImage) {
                            values.put(MediaStore.Images.Media.TITLE, filename);
                            values.put(MediaStore.Images.Media.DATE_TAKEN, now);
                            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Oxypace");
                            collectionUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                        } else {
                            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Oxypace");
                            collectionUri = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                        }

                        targetUri = resolver.insert(collectionUri, values);
                        if (targetUri == null) {
                            throw new IOException("MediaStore insert failed for " + filename);
                        }
                        out = resolver.openOutputStream(targetUri);
                    } else {
                        // Android 9 (Pie) and below
                        File baseDir = isVideo ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                                     : isImage ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                                     : Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        File appDir = new File(baseDir, "Oxypace");
                        if (!appDir.exists()) appDir.mkdirs();
                        legacyFile = new File(appDir, filename);
                        out = new FileOutputStream(legacyFile);
                    }

                    // Open HTTP connection with redirect following
                    String currentUrl = fileUrl.trim().replace(" ", "%20");
                    for (int redirect = 0; redirect < 5; redirect++) {
                        URL u = new URL(currentUrl);
                        conn = (HttpURLConnection) u.openConnection();
                        conn.setInstanceFollowRedirects(true);
                        conn.setConnectTimeout(25000);
                        conn.setReadTimeout(60000);
                        conn.setRequestProperty("User-Agent", "Oxypace/2.2.5 (Android)");
                        conn.connect();

                        int status = conn.getResponseCode();
                        if (status == HttpURLConnection.HTTP_MOVED_PERM || status == HttpURLConnection.HTTP_MOVED_TEMP || status == 307 || status == 308) {
                            String newUrl = conn.getHeaderField("Location");
                            conn.disconnect();
                            if (newUrl != null && !newUrl.isEmpty()) {
                                currentUrl = newUrl;
                                continue;
                            }
                        }
                        if (status >= 400) {
                            throw new IOException("HTTP error code: " + status);
                        }
                        break;
                    }

                    in = conn.getInputStream();
                    long totalLength = conn.getContentLengthLong();

                    byte[] buffer = new byte[65536]; // 64 KB
                    int bytesRead;
                    long totalBytesRead = 0;
                    int lastReportedPercent = -1;

                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                        totalBytesRead += bytesRead;

                        if (totalLength > 0) {
                            int percent = (int) ((totalBytesRead * 100) / totalLength);
                            if (percent != lastReportedPercent && percent <= 99) {
                                lastReportedPercent = percent;
                                JSObject progressData = new JSObject();
                                progressData.put("percentage", percent);
                                progressData.put("bytesDownloaded", totalBytesRead);
                                progressData.put("bytesTotal", totalLength);
                                progressData.put("status", 2); // STATUS_RUNNING
                                notifyListeners("downloadProgress", progressData);
                            }
                        }
                    }

                    out.flush();
                    out.close();
                    out = null;
                    in.close();
                    in = null;

                    // Finalize MediaStore entry
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && targetUri != null) {
                        ContentValues finalValues = new ContentValues();
                        finalValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        finalValues.put(MediaStore.MediaColumns.DATE_MODIFIED, System.currentTimeMillis() / 1000);
                        if (isVideo) {
                            finalValues.put(MediaStore.Video.Media.DATE_TAKEN, System.currentTimeMillis());
                        } else if (isImage) {
                            finalValues.put(MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
                        }
                        resolver.update(targetUri, finalValues, null, null);

                        // Scan file path for instant Gallery index
                        try {
                            String realPath = getPathFromUri(resolver, targetUri);
                            if (realPath != null) {
                                MediaScannerConnection.scanFile(context.getApplicationContext(), new String[]{ realPath }, new String[]{ mimeType }, null);
                            }
                        } catch (Exception ignored) {}
                    } else if (legacyFile != null && legacyFile.exists()) {
                        legacyFile.setLastModified(System.currentTimeMillis());
                        MediaScannerConnection.scanFile(context.getApplicationContext(), new String[]{ legacyFile.getAbsolutePath() }, new String[]{ mimeType }, null);
                    }

                    // Emit completion
                    JSObject doneData = new JSObject();
                    doneData.put("percentage", 100);
                    doneData.put("status", 8); // STATUS_SUCCESSFUL
                    notifyListeners("downloadProgress", doneData);
                    android.util.Log.d("DownloaderPlugin", "Media successfully downloaded and indexed into Gallery: " + filename);

                } catch (Exception e) {
                    android.util.Log.e("DownloaderPlugin", "Direct media download failed: " + e.getMessage(), e);

                    // Clean up partial file
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && targetUri != null) {
                        try {
                            resolver.delete(targetUri, null, null);
                        } catch (Exception ignored) {}
                    } else if (legacyFile != null && legacyFile.exists()) {
                        try {
                            legacyFile.delete();
                        } catch (Exception ignored) {}
                    }

                    JSObject errData = new JSObject();
                    errData.put("percentage", 0);
                    errData.put("status", 16); // STATUS_FAILED
                    errData.put("error", e.getMessage());
                    notifyListeners("downloadProgress", errData);
                } finally {
                    try { if (out != null) out.close(); } catch (Exception ignored) {}
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    try { if (conn != null) conn.disconnect(); } catch (Exception ignored) {}
                }
            }
        });
    }

    private String getPathFromUri(ContentResolver resolver, Uri uri) {
        if (uri == null) return null;
        try {
            String[] proj = { MediaStore.MediaColumns.DATA };
            Cursor cursor = resolver.query(uri, proj, null, null, null);
            if (cursor != null) {
                try {
                    int col = cursor.getColumnIndex(MediaStore.MediaColumns.DATA);
                    if (col != -1 && cursor.moveToFirst()) {
                        return cursor.getString(col);
                    }
                } finally {
                    cursor.close();
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * APK Updater Download (uses standard system DownloadManager)
     */
    private void downloadApkViaSystem(PluginCall call, String url, String filename, String title, String description, String mimeType) {
        try {
            Context context = getContext();
            DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("DownloadManager not available");
                return;
            }

            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!downloadsDir.exists()) downloadsDir.mkdirs();
            File targetFile = new File(downloadsDir, filename);
            if (targetFile.exists()) {
                try { targetFile.delete(); } catch (Exception ignored) {}
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(title);
            request.setDescription(description);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);
            request.setMimeType(mimeType);

            enqueuedDownloadId = manager.enqueue(request);

            registerApkDownloadReceiver(context, enqueuedDownloadId, targetFile);
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

    private void registerApkDownloadReceiver(Context context, long downloadId, File targetFile) {
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
            if (enqueuedDownloadId != -1) {
                DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) {
                    try {
                        apkUri = manager.getUriForDownloadedFile(enqueuedDownloadId);
                    } catch (Exception ignored) {}
                }
            }

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
        executor.shutdownNow();
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
            downloadReceiver = null;
        }
    }
}
