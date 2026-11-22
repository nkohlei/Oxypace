import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import axios from 'axios';

export const CURRENT_OTA_VERSION = '2.6.2-ota.1';

let otaInitialized = false;
let otaCheckInFlight = false;
let lastOtaCheckAt = 0;
const OTA_THROTTLE_MS = 60 * 1000;

export async function getActiveOtaVersion() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const state = await CapacitorUpdater.current().catch(() => null);
        const activeVer = state?.bundle?.version;
        if (activeVer && activeVer !== 'builtin') {
            return String(activeVer);
        }
    } catch (_) {}
    try {
        return localStorage.getItem('oxypace_ota_version') || CURRENT_OTA_VERSION;
    } catch (_) {
        return CURRENT_OTA_VERSION;
    }
}

function isVoiceCallActive() {
    try {
        if (typeof window !== 'undefined' && window.__oxypaceVoiceActive) return true;
        if (typeof document !== 'undefined' && document.querySelector('.vc-container')) return true;
    } catch (_) {}
    return false;
}

async function reportOtaVersionToServer(otaVersion) {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken || !otaVersion) return;
        const appInfo = await CapacitorApp.getInfo().catch(() => null);
        await axios.post(
            '/api/users/sync-version',
            {
                appVersion: appInfo?.version || '2.6.2',
                versionCode: appInfo?.build ? parseInt(appInfo.build, 10) : 262,
                platform: 'android',
                otaVersion: String(otaVersion),
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
    } catch (_) {}
}

export async function checkAndApplyOtaUpdate(force = false) {
    if (!Capacitor.isNativePlatform() || otaCheckInFlight) return;
    const now = Date.now();
    if (!force && now - lastOtaCheckAt < OTA_THROTTLE_MS) return;

    otaCheckInFlight = true;
    lastOtaCheckAt = now;

    try {
        const [{ data }, appInfo, currentOtaVer] = await Promise.all([
            axios.get('/api/app/version', { timeout: 10000 }),
            CapacitorApp.getInfo().catch(() => null),
            getActiveOtaVersion(),
        ]);

        if (!data?.otaVersion || !data?.otaBundleUrl) return;

        const nativeVerCode = Number(appInfo?.build || 262);
        const minNativeCode = Number(data.otaMinNativeVersionCode || 262);
        const minSupportedNative = Number(data.minSupportedVersionCode || 0);

        if (nativeVerCode < minNativeCode || nativeVerCode < minSupportedNative) {
            return;
        }

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
            await reportOtaVersionToServer(data.otaVersion);
            if (isVoiceCallActive()) {
                await CapacitorUpdater.next(downloaded);
                console.log(`[OTA] Queued bundle ${data.otaVersion} for next restart (active call protected).`);
            } else {
                await CapacitorUpdater.set(downloaded);
                console.log(`[OTA] Applied live bundle ${data.otaVersion} cleanly.`);
            }
        }
    } catch (err) {
        console.warn('[OTA] Live update check skipped/failed:', err?.message || err);
    } finally {
        otaCheckInFlight = false;
    }
}

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

    await checkAndApplyOtaUpdate(true);

    try {
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkAndApplyOtaUpdate(false);
            }
        });
    } catch (_) {}
}
