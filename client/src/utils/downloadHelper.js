import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const Downloader = registerPlugin('Downloader');

/**
 * Downloads a file on web or native platforms.
 * On Android, it uses the native DownloadManager to show progress in the status bar.
 * On other platforms, it uses Filesystem API or web fallback.
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The name of the file to save as
 */
export const downloadFile = async (url, filename) => {
    try {
        if (!filename) {
            filename = url.split('/').pop() || `oxypace-${Date.now()}`;
        }

        if (Capacitor.isNativePlatform()) {
            // Check storage permissions safely (non-blocking for Android DownloadManager)
            try {
                if (Capacitor.getPlatform() !== 'android') {
                    let permStatus = await Filesystem.checkPermissions();
                    if (permStatus.publicStorage !== 'granted') {
                        await Filesystem.requestPermissions();
                    }
                }
            } catch (err) {
                console.warn("Permission handling check/request error:", err);
            }

            const saveFileViaFilesystem = async () => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = async () => {
                        const base64data = reader.result;
                        try {
                            await Filesystem.writeFile({
                                path: `Oxypace/${filename}`,
                                data: base64data,
                                directory: Directory.Documents,
                                recursive: true
                            });
                            alert('Başarıyla indirildi: Belgeler/Oxypace klasörüne kaydedildi.');
                        } catch (err) {
                            console.error("Capacitor write error:", err);
                            alert("Dosya kaydedilirken hata oluştu.");
                        }
                    };
                } catch (fetchErr) {
                    console.error("Fetch media for fallback failed:", fetchErr);
                    alert("Dosya indirilirken bağlantı hatası oluştu.");
                }
            };

            if (Capacitor.getPlatform() === 'android') {
                try {
                    await Downloader.downloadFile({ url, filename });
                    alert('İndirme başlatıldı. Durumu bildirim çubuğundan takip edebilirsiniz.');
                } catch (err) {
                    console.warn("Downloader plugin failed, using Filesystem write fallback:", err);
                    await saveFileViaFilesystem();
                }
            } else {
                // iOS or other native platforms: Write to local documents folder
                await saveFileViaFilesystem();
            }
        } else {
            // Web Desktop Download via backend proxy to bypass CORS and force download with custom filename
            const proxyUrl = `/api/posts/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
            const a = document.createElement('a');
            a.href = proxyUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Download helper error:', error);
        alert('İndirme başarısız oldu.');
    }
};
