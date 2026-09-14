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
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
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
     * 1. Downloads to app cache first for fast, reliable chunking.
     * 2. Runs MP4 optimization (faststart relocates moov atom to front for instant Gallery thumbnail and native playback).
     * 3. Patches MP4 creation/modification timestamps (mvhd, tkhd, mdhd) to the exact moment of download.
     * 4. Copies into MediaStore (Movies/Oxypace for video, Pictures/Oxypace for image) with real-time DATE_TAKEN.
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

                File tempDownloadFile = null;
                HttpURLConnection conn = null;
                InputStream in = null;
                FileOutputStream fos = null;
                Uri targetUri = null;

                try {
                    long now = System.currentTimeMillis();
                    long nowSec = now / 1000;

                    // Step 1: Download to app cache temp file
                    File cacheDir = context.getCacheDir();
                    if (!cacheDir.exists()) cacheDir.mkdirs();
                    tempDownloadFile = new File(cacheDir, "dl_" + System.currentTimeMillis() + "_" + filename);
                    fos = new FileOutputStream(tempDownloadFile);

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
                        fos.write(buffer, 0, bytesRead);
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

                    fos.flush();
                    fos.close();
                    fos = null;
                    in.close();
                    in = null;

                    // Step 2: If video, optimize MP4 container (Faststart + patch creation date to NOW)
                    if (isVideo && tempDownloadFile.exists() && tempDownloadFile.length() > 64) {
                        processAndOptimizeMp4(tempDownloadFile, now);
                    }

                    // Step 3: Insert into MediaStore (Movies/Oxypace or Pictures/Oxypace)
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

                        try (OutputStream out = resolver.openOutputStream(targetUri);
                             FileInputStream fis = new FileInputStream(tempDownloadFile)) {
                            byte[] copyBuf = new byte[65536];
                            int r;
                            while ((r = fis.read(copyBuf)) != -1) {
                                out.write(copyBuf, 0, r);
                            }
                            out.flush();
                        }

                        ContentValues finalValues = new ContentValues();
                        finalValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        finalValues.put(MediaStore.MediaColumns.DATE_MODIFIED, nowSec);
                        if (isVideo) {
                            finalValues.put(MediaStore.Video.Media.DATE_TAKEN, now);
                        } else if (isImage) {
                            finalValues.put(MediaStore.Images.Media.DATE_TAKEN, now);
                        }
                        resolver.update(targetUri, finalValues, null, null);

                        try {
                            String realPath = getPathFromUri(resolver, targetUri);
                            if (realPath == null) {
                                File fallbackDir = isVideo ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                                                           : (isImage ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                                                                      : Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS));
                                File fallbackFile = new File(fallbackDir, "Oxypace/" + filename);
                                if (fallbackFile.exists()) {
                                    realPath = fallbackFile.getAbsolutePath();
                                }
                            }
                            if (realPath != null) {
                                MediaScannerConnection.scanFile(context.getApplicationContext(), new String[]{ realPath }, new String[]{ mimeType }, null);
                            }
                        } catch (Exception ignored) {}
                    } else {
                        // Android 9 and below
                        File baseDir = isVideo ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                                     : isImage ? Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                                     : Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        File appDir = new File(baseDir, "Oxypace");
                        if (!appDir.exists()) appDir.mkdirs();
                        File legacyDest = new File(appDir, filename);

                        try (OutputStream out = new FileOutputStream(legacyDest);
                             FileInputStream fis = new FileInputStream(tempDownloadFile)) {
                            byte[] copyBuf = new byte[65536];
                            int r;
                            while ((r = fis.read(copyBuf)) != -1) {
                                out.write(copyBuf, 0, r);
                            }
                            out.flush();
                        }

                        legacyDest.setLastModified(now);
                        MediaScannerConnection.scanFile(context.getApplicationContext(), new String[]{ legacyDest.getAbsolutePath() }, new String[]{ mimeType }, null);
                    }

                    // Step 4: Emit completion 100%
                    JSObject doneData = new JSObject();
                    doneData.put("percentage", 100);
                    doneData.put("status", 8); // STATUS_SUCCESSFUL
                    notifyListeners("downloadProgress", doneData);
                    android.util.Log.d("DownloaderPlugin", "Media successfully downloaded, optimized & saved to Gallery: " + filename);

                } catch (Exception e) {
                    android.util.Log.e("DownloaderPlugin", "Direct media download failed: " + e.getMessage(), e);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && targetUri != null) {
                        try {
                            resolver.delete(targetUri, null, null);
                        } catch (Exception ignored) {}
                    }

                    JSObject errData = new JSObject();
                    errData.put("percentage", 0);
                    errData.put("status", 16); // STATUS_FAILED
                    errData.put("error", e.getMessage());
                    notifyListeners("downloadProgress", errData);
                } finally {
                    try { if (fos != null) fos.close(); } catch (Exception ignored) {}
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    try { if (conn != null) conn.disconnect(); } catch (Exception ignored) {}
                    if (tempDownloadFile != null && tempDownloadFile.exists()) {
                        try { tempDownloadFile.delete(); } catch (Exception ignored) {}
                    }
                }
            }
        });
    }

    /**
     * MP4 In-Place Optimizer:
     * 1. Relocates the moov box to the front of the file (Faststart) if it was at the end.
     *    This fixes the "broken image" thumbnail and playback failure in Android Gallery.
     * 2. Patches creation_time & modification_time in mvhd, tkhd, and mdhd boxes to targetEpochMs.
     *    This fixes the old date (e.g. 8 Mayıs) so Gallery displays today's date (moment of download).
     */
    private static void processAndOptimizeMp4(File inputFile, long targetEpochMs) {
        if (inputFile == null || !inputFile.exists() || inputFile.length() < 64) return;

        // MP4 epoch starts 1904-01-01. Difference to Unix epoch (1970-01-01) is 2082844800 seconds.
        long mp4Seconds = (targetEpochMs / 1000L) + 2082844800L;

        try {
            long fileLen = inputFile.length();
            long ftypOffset = -1;
            long ftypSize = 0;
            long mdatOffset = -1;
            long mdatSize = 0;
            long moovOffset = -1;
            long moovSize = 0;

            try (RandomAccessFile raf = new RandomAccessFile(inputFile, "r")) {
                long pos = 0;
                while (pos < fileLen - 8) {
                    raf.seek(pos);
                    long boxSize = raf.readInt() & 0xFFFFFFFFL;
                    byte[] typeBytes = new byte[4];
                    raf.readFully(typeBytes);
                    String boxType = new String(typeBytes, "US-ASCII");

                    long headerLen = 8;
                    if (boxSize == 1) { // 64-bit size
                        boxSize = raf.readLong();
                        headerLen = 16;
                    } else if (boxSize == 0) {
                        boxSize = fileLen - pos;
                    }

                    if ("ftyp".equals(boxType)) {
                        ftypOffset = pos;
                        ftypSize = boxSize;
                    } else if ("mdat".equals(boxType)) {
                        mdatOffset = pos;
                        mdatSize = boxSize;
                    } else if ("moov".equals(boxType)) {
                        moovOffset = pos;
                        moovSize = boxSize;
                    }

                    if (boxSize <= 0) break;
                    pos += boxSize;
                }
            }

            // If moov is already before mdat, just patch the dates in-place
            if (moovOffset != -1 && mdatOffset != -1 && moovOffset < mdatOffset) {
                patchMp4DatesInPlace(inputFile, moovOffset, moovSize, mp4Seconds);
                return;
            }

            // If moov is after mdat, relocate moov to front (Faststart) + patch dates
            if (moovOffset != -1 && mdatOffset != -1 && moovOffset > mdatOffset && moovSize > 0 && moovSize < 50L * 1024 * 1024) {
                File tempFaststart = new File(inputFile.getParentFile(), "fs_" + inputFile.getName());
                boolean success = relocateMoovToFront(inputFile, tempFaststart, ftypOffset, ftypSize, mdatOffset, mdatSize, moovOffset, moovSize, mp4Seconds);
                if (success && tempFaststart.exists() && tempFaststart.length() > 0) {
                    if (inputFile.delete()) {
                        tempFaststart.renameTo(inputFile);
                    }
                }
            } else if (moovOffset != -1) {
                patchMp4DatesInPlace(inputFile, moovOffset, moovSize, mp4Seconds);
            }
        } catch (Exception e) {
            android.util.Log.w("DownloaderPlugin", "processAndOptimizeMp4 failed: " + e.getMessage());
        }
    }

    private static void patchMp4DatesInPlace(File file, long moovOffset, long moovSize, long mp4Seconds) {
        try (RandomAccessFile raf = new RandomAccessFile(file, "rw")) {
            long scanStart = moovOffset;
            long scanEnd = Math.min(raf.length(), moovOffset + moovSize);
            byte[] buf = new byte[8192];

            for (long pos = scanStart; pos < scanEnd - 32; pos += 4096) {
                raf.seek(pos);
                int read = raf.read(buf);
                if (read < 32) break;

                for (int i = 0; i < read - 24; i++) {
                    boolean isMvhd = buf[i] == 'm' && buf[i+1] == 'v' && buf[i+2] == 'h' && buf[i+3] == 'd';
                    boolean isTkhd = buf[i] == 't' && buf[i+1] == 'k' && buf[i+2] == 'h' && buf[i+3] == 'd';
                    boolean isMdhd = buf[i] == 'm' && buf[i+1] == 'd' && buf[i+2] == 'h' && buf[i+3] == 'd';

                    if (isMvhd || isTkhd || isMdhd) {
                        int version = buf[i + 4] & 0xFF;
                        long datePos = pos + i + 8;
                        raf.seek(datePos);
                        if (version == 0) {
                            raf.writeInt((int) mp4Seconds);
                            raf.writeInt((int) mp4Seconds);
                        } else if (version == 1) {
                            raf.writeLong(mp4Seconds);
                            raf.writeLong(mp4Seconds);
                        }
                    }
                }
            }
        } catch (Exception e) {
            android.util.Log.w("DownloaderPlugin", "patchMp4DatesInPlace error: " + e.getMessage());
        }
    }

    private static boolean relocateMoovToFront(File src, File dest,
                                               long ftypOffset, long ftypSize,
                                               long mdatOffset, long mdatSize,
                                               long moovOffset, long moovSize,
                                               long mp4Seconds) {
        try {
            byte[] moovBytes = new byte[(int) moovSize];
            try (RandomAccessFile raf = new RandomAccessFile(src, "r")) {
                raf.seek(moovOffset);
                raf.readFully(moovBytes);
            }

            int moovLen = moovBytes.length;
            for (int i = 0; i < moovLen - 8; i++) {
                // Patch dates (mvhd, tkhd, mdhd)
                if ((moovBytes[i] == 'm' && moovBytes[i+1] == 'v' && moovBytes[i+2] == 'h' && moovBytes[i+3] == 'd') ||
                    (moovBytes[i] == 't' && moovBytes[i+1] == 'k' && moovBytes[i+2] == 'h' && moovBytes[i+3] == 'd') ||
                    (moovBytes[i] == 'm' && moovBytes[i+1] == 'd' && moovBytes[i+2] == 'h' && moovBytes[i+3] == 'd')) {
                    int version = moovBytes[i + 4] & 0xFF;
                    int dIdx = i + 8;
                    if (version == 0 && dIdx + 8 <= moovLen) {
                        writeInt(moovBytes, dIdx, (int) mp4Seconds);
                        writeInt(moovBytes, dIdx + 4, (int) mp4Seconds);
                    } else if (version == 1 && dIdx + 16 <= moovLen) {
                        writeLong(moovBytes, dIdx, mp4Seconds);
                        writeLong(moovBytes, dIdx + 8, mp4Seconds);
                    }
                }

                // Adjust stco chunk offsets (32-bit)
                if (moovBytes[i] == 's' && moovBytes[i+1] == 't' && moovBytes[i+2] == 'c' && moovBytes[i+3] == 'o') {
                    int entryCount = readInt(moovBytes, i + 8);
                    int offsetStart = i + 12;
                    for (int c = 0; c < entryCount; c++) {
                        int pos = offsetStart + (c * 4);
                        if (pos + 4 > moovLen) break;
                        int oldOffset = readInt(moovBytes, pos);
                        writeInt(moovBytes, pos, oldOffset + (int) moovSize);
                    }
                }

                // Adjust co64 chunk offsets (64-bit)
                if (moovBytes[i] == 'c' && moovBytes[i+1] == 'o' && moovBytes[i+2] == '6' && moovBytes[i+3] == '4') {
                    int entryCount = readInt(moovBytes, i + 8);
                    int offsetStart = i + 12;
                    for (int c = 0; c < entryCount; c++) {
                        int pos = offsetStart + (c * 8);
                        if (pos + 8 > moovLen) break;
                        long oldOffset = readLong(moovBytes, pos);
                        writeLong(moovBytes, pos, oldOffset + moovSize);
                    }
                }
            }

            // Write output file: [ftyp] -> [moov] -> [mdat]
            try (FileOutputStream fos = new FileOutputStream(dest);
                 RandomAccessFile raf = new RandomAccessFile(src, "r")) {

                if (ftypSize > 0) {
                    byte[] ftypBytes = new byte[(int) ftypSize];
                    raf.seek(ftypOffset);
                    raf.readFully(ftypBytes);
                    fos.write(ftypBytes);
                }

                fos.write(moovBytes);

                long copyStart = ftypSize > 0 ? (ftypOffset + ftypSize) : 0;
                long copyEnd = moovOffset;
                long bytesToCopy = copyEnd - copyStart;

                raf.seek(copyStart);
                byte[] copyBuf = new byte[65536];
                while (bytesToCopy > 0) {
                    int toRead = (int) Math.min(copyBuf.length, bytesToCopy);
                    int read = raf.read(copyBuf, 0, toRead);
                    if (read == -1) break;
                    fos.write(copyBuf, 0, read);
                    bytesToCopy -= read;
                }

                long trailingStart = moovOffset + moovSize;
                long fileLen = src.length();
                if (trailingStart < fileLen) {
                    long trailingBytes = fileLen - trailingStart;
                    raf.seek(trailingStart);
                    while (trailingBytes > 0) {
                        int toRead = (int) Math.min(copyBuf.length, trailingBytes);
                        int read = raf.read(copyBuf, 0, toRead);
                        if (read == -1) break;
                        fos.write(copyBuf, 0, read);
                        trailingBytes -= read;
                    }
                }
                fos.flush();
            }
            return true;
        } catch (Exception e) {
            android.util.Log.e("DownloaderPlugin", "relocateMoovToFront error: " + e.getMessage(), e);
            return false;
        }
    }

    private static int readInt(byte[] b, int offset) {
        return ((b[offset] & 0xFF) << 24) |
               ((b[offset + 1] & 0xFF) << 16) |
               ((b[offset + 2] & 0xFF) << 8) |
               (b[offset + 3] & 0xFF);
    }

    private static void writeInt(byte[] b, int offset, int val) {
        b[offset] = (byte) ((val >>> 24) & 0xFF);
        b[offset + 1] = (byte) ((val >>> 16) & 0xFF);
        b[offset + 2] = (byte) ((val >>> 8) & 0xFF);
        b[offset + 3] = (byte) (val & 0xFF);
    }

    private static long readLong(byte[] b, int offset) {
        return (((long) (b[offset] & 0xFF)) << 56) |
               (((long) (b[offset + 1] & 0xFF)) << 48) |
               (((long) (b[offset + 2] & 0xFF)) << 40) |
               (((long) (b[offset + 3] & 0xFF)) << 32) |
               (((long) (b[offset + 4] & 0xFF)) << 24) |
               (((long) (b[offset + 5] & 0xFF)) << 16) |
               (((long) (b[offset + 6] & 0xFF)) << 8) |
               ((long) (b[offset + 7] & 0xFF));
    }

    private static void writeLong(byte[] b, int offset, long val) {
        b[offset] = (byte) ((val >>> 56) & 0xFF);
        b[offset + 1] = (byte) ((val >>> 48) & 0xFF);
        b[offset + 2] = (byte) ((val >>> 40) & 0xFF);
        b[offset + 3] = (byte) ((val >>> 32) & 0xFF);
        b[offset + 4] = (byte) ((val >>> 24) & 0xFF);
        b[offset + 5] = (byte) ((val >>> 16) & 0xFF);
        b[offset + 6] = (byte) ((val >>> 8) & 0xFF);
        b[offset + 7] = (byte) (val & 0xFF);
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
