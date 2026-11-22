import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import axios from 'axios';

// Use Capacitor's built-in native plugin bridge directly so Netlify's
// isolated /client web build does not depend on root-installed
// @capgo/capacitor-updater (which remains in root package.json for Android).
const CapacitorUpdater = registerPlugin('CapacitorUpdater');

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
        if (typeof window !== 'undefined' && (window.__oxypaceVoiceActive || window.__isOxypaceVoiceActive)) return true;
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

let otaPushListenerRegistered = false;

export async function checkAndApplyOtaUpdate(force = false) {
    if (!Capacitor.isNativePlatform() || otaCheckInFlight) return;
    const now = Date.now();
    if (!force && now - lastOtaCheckAt < OTA_THROTTLE_MS) return;

    otaCheckInFlight = true;
    lastOtaCheckAt = now;

    try {
        const [{ data }, appInfo, currentOtaVer, listRes] = await Promise.all([
            axios.get('/api/app/version', { timeout: 10000 }),
            CapacitorApp.getInfo().catch(() => null),
            getActiveOtaVersion(),
            CapacitorUpdater.list().catch(() => null),
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

        const existingBundles = Array.isArray(listRes?.bundles) ? listRes.bundles : [];
        const matchedBundle = existingBundles.find((b) => String(b?.version || '') === String(data.otaVersion));

        if (matchedBundle?.status === 'downloading') {
            console.log(`[OTA] Native background download already in progress for ${data.otaVersion}`);
            return;
        }

        let targetBundle = null;
        if (matchedBundle && (matchedBundle.status === 'success' || matchedBundle.status === 'pending')) {
            console.log(`[OTA] Using already-downloaded background bundle ${data.otaVersion}`);
            targetBundle = matchedBundle;
        } else {
            console.log(`[OTA] Downloading live bundle ${data.otaVersion} from ${data.otaBundleUrl}...`);
            targetBundle = await CapacitorUpdater.download({
                url: data.otaBundleUrl,
                version: String(data.otaVersion),
            });
        }

        if (targetBundle?.id) {
            localStorage.setItem('oxypace_ota_version', String(data.otaVersion));
            await reportOtaVersionToServer(data.otaVersion);
            if (isVoiceCallActive()) {
                await CapacitorUpdater.next(targetBundle);
                console.log(`[OTA] Queued bundle ${data.otaVersion} for next restart (active call protected).`);
            } else {
                await CapacitorUpdater.set(targetBundle);
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

    // Immediately report active/headless-installed OTA bundle version to server
    try {
        const activeVer = await getActiveOtaVersion();
        if (activeVer) {
            localStorage.setItem('oxypace_ota_version', String(activeVer));
            reportOtaVersionToServer(activeVer);
        }
    } catch (_) {}

    if (!otaPushListenerRegistered && typeof window !== 'undefined') {
        otaPushListenerRegistered = true;
        window.addEventListener('oxypace:ota_push', () => {
            checkAndApplyOtaUpdate(true);
        });
    }

    // Slight delay lets native atBackground/headless updater settle without double-download race
    setTimeout(() => {
        checkAndApplyOtaUpdate(true);
    }, 3500);

    try {
        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkAndApplyOtaUpdate(false);
            }
        });
    } catch (_) {}
}
