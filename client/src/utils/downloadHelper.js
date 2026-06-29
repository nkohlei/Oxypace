import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

const Downloader = registerPlugin('Downloader');

// Custom top notification toast helper
const showTopToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'top-download-toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    // Style the toast dynamically to be beautiful, modern glassmorphism
    Object.assign(toast.style, {
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-100px)',
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#fff',
        padding: '14px 28px',
        borderRadius: '14px',
        fontSize: '13px',
        fontWeight: '600',
        zIndex: '999999',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        opacity: '0',
        textAlign: 'center'
    });

    // Trigger slide down and fade in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });

    // Dismiss after 1 second (1000ms)
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 1000);
};

/**
 * Downloads a file on web or native platforms.
 * Shows top toasts inside the app and status bar notifications on native device.
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The name of the file to save as
 */
export const downloadFile = async (url, filename) => {
    try {
        if (!filename) {
            filename = url.split('/').pop() || `oxypace-${Date.now()}`;
        }

        // Show start toast
        showTopToast('İndirme başladı...');

        if (Capacitor.isNativePlatform()) {
            const notifId = Math.floor(Math.random() * 1000000);
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'Dosya İndiriliyor',
                            body: `${filename} indiriliyor...`,
                            id: notifId
                        }
                    ]
                });
            } catch (err) {
                console.warn('Could not schedule starting notification', err);
            }

            try {
                const response = await fetch(url);
                const blob = await response.blob();
                
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    try {
                        // Attempt to write to public External storage or Downloads folder
                        await Filesystem.writeFile({
                            path: filename,
                            data: base64data,
                            directory: Directory.ExternalStorage,
                            recursive: true
                        });
                        
                        showTopToast('İndirme tamamlandı!');
                        try {
                            await LocalNotifications.schedule({
                                notifications: [
                                    {
                                        title: 'İndirme Tamamlandı',
                                        body: `${filename} başarıyla indirildi.`,
                                        id: notifId
                                    }
                                ]
                            });
                        } catch (err) {
                            console.warn('Could not schedule completion notification', err);
                        }
                    } catch (err) {
                        console.error("Capacitor write error, trying Documents fallback:", err);
                        try {
                            await Filesystem.writeFile({
                                path: `Oxypace/${filename}`,
                                data: base64data,
                                directory: Directory.Documents,
                                recursive: true
                            });
                            showTopToast('İndirme tamamlandı!');
                            try {
                                await LocalNotifications.schedule({
                                    notifications: [
                                        {
                                            title: 'İndirme Tamamlandı',
                                            body: `${filename} Belgeler/Oxypace klasörüne kaydedildi.`,
                                            id: notifId
                                        }
                                    ]
                                });
                            } catch (notifErr) {
                                console.warn(notifErr);
                            }
                        } catch (fallbackErr) {
                            console.error("All write fallbacks failed:", fallbackErr);
                            showTopToast('Dosya kaydedilemedi.');
                        }
                    }
                };
            } catch (fetchErr) {
                console.error("Fetch media failed:", fetchErr);
                showTopToast('Bağlantı hatası oluştu.');
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
            
            // Show finished toast for web too!
            setTimeout(() => {
                showTopToast('İndirme tamamlandı!');
            }, 1000);
        }
    } catch (error) {
        console.error('Download helper error:', error);
        showTopToast('İndirme başarısız oldu.');
    }
};
