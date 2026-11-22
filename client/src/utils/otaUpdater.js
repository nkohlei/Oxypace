import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import axios from 'axios';

export const CURRENT_OTA_VERSION = '2.6.1-ota.1';

let otaInitialized = false;

/**
 * Self-hosted OTA live-update bootstrapper using @capgo/capacitor-updater.
 * Must call notifyAppReady() unconditionally on every native boot to confirm
 * bundle health and prevent automatic rollback.
 */
export async function initOtaUpdater() {
    if (!Capacitor.isNativePlatform() || otaInitialized) return;
    otaInitialized = true;

    try {
        await CapacitorUpdater.notifyAppReady();
    } catch (err) {
        console.warn('[OTA] notifyAppReady error:', err?.message || err);
    }

    try {
        const [{ data }, appInfo, currentState] = await Promise.all([
            axios.get('/api/app/version', { timeout: 10000 }),
            CapacitorApp.getInfo().catch(() => null),
            CapacitorUpdater.current().catch(() => null),
        ]);

        if (!data?.otaVersion || !data?.otaBundleUrl) return;

        const nativeVerCode = Number(appInfo?.build || 261);
        const minNativeCode = Number(data.otaMinNativeVersionCode || 261);
        const minSupportedNative = Number(data.minSupportedVersionCode || 0);

        // Require compatible native binary before applying an OTA web bundle
        if (nativeVerCode < minNativeCode || nativeVerCode < minSupportedNative) {
            return;
        }

        const activeBundleVer = currentState?.bundle?.version;
        const currentOtaVer =
            activeBundleVer && activeBundleVer !== 'builtin'
                ? activeBundleVer
                : (localStorage.getItem('oxypace_ota_version') || CURRENT_OTA_VERSION);

        if (String(data.otaVersion) === String(currentOtaVer)) {
            return;
        }

        console.log(`[OTA] Downloading live bundle ${data.otaVersion} from ${data.otaBundleUrl}...`);
        const downloaded = await CapacitorUpdater.download({
            url: data.otaBundleUrl,
            version: String(data.otaVersion),
        });

        if (downloaded?.id) {
            localStorage.setItem('oxypace_ota_version', String(data.otaVersion));
            await CapacitorUpdater.set(downloaded);
            console.log(`[OTA] Applied live bundle ${data.otaVersion} cleanly.`);
        }
    } catch (err) {
        console.warn('[OTA] Live update check skipped/failed:', err?.message || err);
    }
}
