import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import axios from 'axios';

// Use Capacitor's built-in native plugin bridge directly so Netlify's
// isolated /client web build does not depend on root-installed
// @capgo/capacitor-updater (which remains in root package.json for Android).
const CapacitorUpdater = registerPlugin('CapacitorUpdater');

export const CURRENT_OTA_VERSION = '2.6.5-ota.8';

let otaInitialized = false;
let otaCheckInFlight = false;
let lastOtaCheckAt = 0;
const OTA_THROTTLE_MS = 60 * 1000;

async function getActiveBundleInfo() {
    if (!Capacitor.isNativePlatform()) {
        return { version: CURRENT_OTA_VERSION, isOtaBundle: false };
    }
    try {
        const state = await CapacitorUpdater.current().catch(() => null);
        const activeId = state?.bundle?.id;
        const activeVer = state?.bundle?.version;
        if (activeId && activeId !== 'builtin' && activeVer && activeVer !== 'builtin') {
            return { version: String(activeVer), isOtaBundle: true };
        }
    } catch (_) {}
    return { version: CURRENT_OTA_VERSION, isOtaBundle: false };
}

export async function getActiveOtaVersion() {
    if (!Capacitor.isNativePlatform()) return null;
    const info = await getActiveBundleInfo();
    return info.version;
}

export async function getVersionSummary() {
    if (!Capacitor.isNativePlatform()) {
        return {
            platform: 'web',
            appVersion: '2.6.5',
            versionCode: 0,
            otaVersion: CURRENT_OTA_VERSION,
            isOtaBundle: false,
        };
    }
    const [appInfo, bundleInfo] = await Promise.all([
        CapacitorApp.getInfo().catch(() => null),
        getActiveBundleInfo(),
    ]);
    return {
        platform: 'android',
        appVersion: appInfo?.version || '2.6.5',
        versionCode: appInfo?.build ? parseInt(appInfo.build, 10) : 266,
        otaVersion: bundleInfo.version,
        isOtaBundle: bundleInfo.isOtaBundle,
    };
}

/**
 * Read-only availability check for the Settings -> Sürüm Bilgisi page.
 * Does NOT download or force-apply anything; reports whether a newer OTA or APK exists.
 */
export async function checkOtaAvailability() {
    const summary = await getVersionSummary();
    try {
        const { data } = await axios.get('/api/app/version', { timeout: 10000 });
        const latestAppVersion = data?.latestVersion || summary.appVersion;
        const latestOtaVersion = data?.otaVersion || summary.otaVersion;
        const minNativeCode = Number(data?.otaMinNativeVersionCode || 0);
        const minSupportedNative = Number(data?.minSupportedVersionCode || 0);
        const currentNativeCode = Number(summary.versionCode || 0);

        const isNative = Capacitor.isNativePlatform();
        const hasApkUpdate = Boolean(
            isNative && currentNativeCode > 0 && (currentNativeCode < minSupportedNative || (minNativeCode > 0 && currentNativeCode < minNativeCode))
        );
        const hasOtaUpdate = Boolean(
            isNative &&
            !hasApkUpdate &&
            data?.otaVersion &&
            data?.otaBundleUrl &&
            String(data.otaVersion) !== String(summary.otaVersion)
        );

        return {
            ...summary,
            checked: true,
            latestAppVersion,
            latestOtaVersion,
            hasOtaUpdate,
            hasApkUpdate,
            downloadUrl: data?.downloadUrl || 'https://api.oxypace.com.tr/downloads/oxypace.apk',
            changelog: data?.changelog || '',
        };
    } catch (_) {
        return {
            ...summary,
            checked: false,
            latestAppVersion: summary.appVersion,
            latestOtaVersion: summary.otaVersion,
            hasOtaUpdate: false,
            hasApkUpdate: false,
            downloadUrl: 'https://api.oxypace.com.tr/downloads/oxypace.apk',
            changelog: '',
        };
    }
}

function showOtaUpdatedToast(versionText) {
    if (typeof document === 'undefined' || !versionText) return;
    try {
        const existing = document.getElementById('oxypace-ota-toast');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        const el = document.createElement('div');
        el.id = 'oxypace-ota-toast';
        el.textContent = `Oxypace güncellendi (v${versionText})`;
        Object.assign(el.style, {
            position: 'fixed',
            top: 'max(18px, env(safe-area-inset-top, 18px))',
            left: '50%',
            transform: 'translateX(-50%) translateY(-16px)',
            background: 'rgba(18, 20, 26, 0.94)',
            color: '#f8fafc',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '999px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.01em',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(10px)',
            zIndex: '999999',
            opacity: '0',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
        });
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateX(-50%) translateY(0)';
        });
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(-12px)';
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, 4200);
    } catch (_) {}
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
                appVersion: appInfo?.version || '2.6.5',
                versionCode: appInfo?.build ? parseInt(appInfo.build, 10) : 266,
                platform: 'android',
                otaVersion: String(otaVersion),
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
    } catch (_) {}
}

let otaPushListenerRegistered = false;

export async function checkAndApplyOtaUpdate(force = false) {
    if (!Capacitor.isNativePlatform()) {
        return { status: 'skipped', message: 'Web platformu' };
    }
    if (otaCheckInFlight) {
        return { status: 'downloading', message: 'Kontrol devam ediyor...' };
    }
    const now = Date.now();
    if (!force && now - lastOtaCheckAt < OTA_THROTTLE_MS) {
        return { status: 'skipped', message: 'Yakın zamanda kontrol edildi' };
    }

    otaCheckInFlight = true;
    lastOtaCheckAt = now;

    try {
        const [{ data }, appInfo, currentOtaVer, listRes] = await Promise.all([
            axios.get('/api/app/version', { timeout: 10000 }),
            CapacitorApp.getInfo().catch(() => null),
            getActiveOtaVersion(),
            CapacitorUpdater.list().catch(() => null),
        ]);

        if (!data?.otaVersion || !data?.otaBundleUrl) {
            return { status: 'up_to_date', version: currentOtaVer };
        }

        const nativeVerCode = Number(appInfo?.build || 266);
        const minNativeCode = Number(data.otaMinNativeVersionCode || 266);
        const minSupportedNative = Number(data.minSupportedVersionCode || 0);

        if (nativeVerCode < minNativeCode || nativeVerCode < minSupportedNative) {
            return { status: 'skipped', message: 'APK güncellemesi gerekli' };
        }

        if (String(data.otaVersion) === String(currentOtaVer)) {
            return { status: 'up_to_date', version: currentOtaVer };
        }

        const existingBundles = Array.isArray(listRes?.bundles) ? listRes.bundles : [];
        const matchedBundle = existingBundles.find((b) => String(b?.version || '') === String(data.otaVersion));

        if (matchedBundle?.status === 'downloading') {
            console.log(`[OTA] Native background download already in progress for ${data.otaVersion}`);
            return { status: 'downloading', version: String(data.otaVersion) };
        }

        let targetBundle = null;
        if (matchedBundle && (matchedBundle.status === 'success' || matchedBundle.status === 'pending')) {
            console.log(`[OTA] Using already-downloaded background bundle ${data.otaVersion}`);
            targetBundle = matchedBundle;
        } else {
            if (!data.otaChecksum) {
                console.warn('[OTA] Skipping download: server did not return otaChecksum');
                return { status: 'error', message: 'Checksum eksik' };
            }
            console.log(`[OTA] Downloading live bundle ${data.otaVersion} from ${data.otaBundleUrl}...`);
            targetBundle = await CapacitorUpdater.download({
                url: data.otaBundleUrl,
                version: String(data.otaVersion),
                checksum: String(data.otaChecksum),
            });
        }

        if (targetBundle?.id) {
            localStorage.setItem('oxypace_ota_version', String(data.otaVersion));
            await reportOtaVersionToServer(data.otaVersion);
            if (isVoiceCallActive()) {
                localStorage.setItem('oxypace_pending_ota_toast', String(data.otaVersion));
                await CapacitorUpdater.next(targetBundle);
                console.log(`[OTA] Queued bundle ${data.otaVersion} for next restart (active call protected).`);
                return { status: 'queued', version: String(data.otaVersion) };
            } else {
                localStorage.setItem('oxypace_pending_ota_toast', String(data.otaVersion));
                await CapacitorUpdater.set(targetBundle);
                console.log(`[OTA] Applied live bundle ${data.otaVersion} cleanly.`);
                return { status: 'applied', version: String(data.otaVersion) };
            }
        }
        return { status: 'up_to_date', version: currentOtaVer };
    } catch (err) {
        console.warn('[OTA] Live update check skipped/failed:', err?.message || err);
        return { status: 'error', message: err?.message || 'Kontrol başarısız' };
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

    // Report active/headless-installed OTA bundle version and notify user if freshly updated
    try {
        const bundleInfo = await getActiveBundleInfo();
        if (bundleInfo?.version) {
            localStorage.setItem('oxypace_ota_version', String(bundleInfo.version));
            reportOtaVersionToServer(bundleInfo.version);

            const pendingToast = localStorage.getItem('oxypace_pending_ota_toast');
            const lastSeenOta = localStorage.getItem('oxypace_last_seen_ota');
            if (
                pendingToast === bundleInfo.version ||
                (bundleInfo.isOtaBundle && lastSeenOta !== bundleInfo.version)
            ) {
                localStorage.removeItem('oxypace_pending_ota_toast');
                localStorage.setItem('oxypace_last_seen_ota', bundleInfo.version);
                setTimeout(() => showOtaUpdatedToast(bundleInfo.version), 900);
            } else if (!bundleInfo.isOtaBundle) {
                localStorage.setItem('oxypace_last_seen_ota', bundleInfo.version);
            }
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
