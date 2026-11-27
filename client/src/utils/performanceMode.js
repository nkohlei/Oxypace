import { Capacitor } from '@capacitor/core';

export const PERF_MODE_STORAGE_KEY = 'oxypace_perf_mode';

/**
 * Normalizes stored/requested performance mode to 'auto' | 'lite' | 'full'.
 */
export function getPerformanceMode() {
    try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(PERF_MODE_STORAGE_KEY) : null;
        if (stored === 'lite' || stored === 'full' || stored === 'auto') {
            return stored;
        }
    } catch (_) {}
    return 'auto';
}

/**
 * Detects Android native WebView, <= 4 GB RAM devices, low-core mobile CPUs,
 * or OS-level reduced-motion preferences.
 */
export function detectLowEndDevice() {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof navigator !== 'undefined') {
        const deviceMem = Number(navigator.deviceMemory || 0);
        if (deviceMem > 0 && deviceMem <= 4) return true;
        const cpuCores = Number(navigator.hardwareConcurrency || 0);
        const isCoarseMobile = typeof window !== 'undefined' && (
            window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth <= 768
        );
        if (isCoarseMobile && cpuCores > 0 && cpuCores <= 4) return true;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
        return true;
    }
    return false;
}

/**
 * Resolves whether lite/high-FPS visual reductions should currently be active.
 */
export function isPerfLiteActive(mode = getPerformanceMode()) {
    if (mode === 'lite') return true;
    if (mode === 'full') return false;
    return detectLowEndDevice();
}

/**
 * Persists user choice, updates body.perf-lite, and notifies active players.
 */
export function applyPerformanceMode(mode) {
    const normalized = mode === 'lite' || mode === 'full' ? mode : 'auto';
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PERF_MODE_STORAGE_KEY, normalized);
        }
    } catch (_) {}

    const isLite = isPerfLiteActive(normalized);
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.toggle('perf-lite', isLite);
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('oxypace:perf_mode_changed', {
            detail: { mode: normalized, isLite },
        }));
    }
    return { mode: normalized, isLite };
}

/**
 * Applies the active performance profile at startup without redundant storage writes.
 */
export function initPerformanceMode() {
    const mode = getPerformanceMode();
    const isLite = isPerfLiteActive(mode);
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.toggle('perf-lite', isLite);
    }
    return { mode, isLite };
}
