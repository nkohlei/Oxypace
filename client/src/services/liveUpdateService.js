import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { LocalNotifications } from '@capacitor/local-notifications';
import axios from 'axios';

/**
 * Initializes Capgo Live Update Engine:
 * 1. Signals that current bundle is healthy (prevents rollback)
 * 2. Checks if an update was just completed and sends native local notification
 * 3. Downloads newer live bundles in the background if available
 */
export const initLiveUpdate = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // 1. Notify native plugin that app rendered successfully without crashing
        await CapacitorUpdater.notifyAppReady();

        // 2. Check if a newly applied update needs a confirmation notification
        const pendingNotif = localStorage.getItem('oxypace_pending_update_notif');
        if (pendingNotif) {
            localStorage.removeItem('oxypace_pending_update_notif');
            try {
                await LocalNotifications.requestPermissions();
                await LocalNotifications.schedule({
                    notifications: [{
                        id: Math.floor(Math.random() * 100000),
                        title: 'Oxypace Başarıyla Güncellendi',
                        body: `Yeni sürüm (${pendingNotif}) başarıyla yüklendi ve kullanıma hazır.`,
                        schedule: { at: new Date(Date.now() + 500) }
                    }]
                });
            } catch (notifErr) {
                console.warn('[LiveUpdate] Notification error:', notifErr);
            }
        }

        // 3. Check server for new live bundle version
        const { data } = await axios.get('/api/app/live-update').catch(() => null);
        if (data?.bundleVersion && data?.bundleUrl) {
            const currentBundle = await CapacitorUpdater.current().catch(() => null);
            const currentBundleVer = currentBundle?.bundle?.version || localStorage.getItem('oxypace_bundle_version') || '2.5.1';

            if (data.bundleVersion !== currentBundleVer) {
                console.log(`[LiveUpdate] New web bundle available: ${data.bundleVersion}. Downloading...`);
                const downloaded = await CapacitorUpdater.download({
                    url: data.bundleUrl,
                    version: data.bundleVersion
                });

                if (downloaded) {
                    await CapacitorUpdater.set(downloaded);
                    localStorage.setItem('oxypace_bundle_version', data.bundleVersion);
                    localStorage.setItem('oxypace_pending_update_notif', data.bundleVersion);
                    console.log(`[LiveUpdate] Bundle ${data.bundleVersion} set successfully.`);
                }
            }
        }
    } catch (err) {
        console.warn('[LiveUpdate] Non-fatal check error:', err?.message || err);
    }
};
