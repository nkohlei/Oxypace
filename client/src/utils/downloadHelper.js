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

            if (Capacitor.getPlatform() === 'android') {
                try {
                    await Downloader.downloadFile({ url, filename });
                    // Optional toast or alert
                    alert('İndirme başlatıldı. Durumu bildirim çubuğundan takip edebilirsiniz.');
                } catch (err) {
                    console.error("Downloader plugin error:", err);
                    alert("İndirme başlatılamadı.");
                }
            } else {
                // iOS or other native platforms: Write to local documents folder
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
            }
        } else {
            // Web Desktop Download
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Download helper error:', error);
        alert('İndirme başarısız oldu.');
    }
};
