const PENDING_REDIRECT_KEY = 'oxypace_pending_redirect';

/**
 * Persists a post-login in-app destination path when an unauthenticated user
 * attempts to open a protected shared URL (e.g. /post/:id or /portal/:id).
 */
export function savePendingRedirect(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return;
    const trimmed = targetPath.trim();
    if (!trimmed.startsWith('/')) return;
    if (
        trimmed === '/' ||
        trimmed.startsWith('/login') ||
        trimmed.startsWith('/register') ||
        trimmed.startsWith('/auth/')
    ) {
        return;
    }
    try {
        localStorage.setItem(PENDING_REDIRECT_KEY, trimmed);
    } catch (_) {}
}

/**
 * Reads and clears any stored post-login redirect path, returning null if invalid.
 */
export function consumePendingRedirect() {
    try {
        const stored = localStorage.getItem(PENDING_REDIRECT_KEY);
        if (!stored) return null;
        localStorage.removeItem(PENDING_REDIRECT_KEY);
        const trimmed = stored.trim();
        if (
            !trimmed.startsWith('/') ||
            trimmed.startsWith('/login') ||
            trimmed.startsWith('/register') ||
            trimmed.startsWith('/auth/')
        ) {
            return null;
        }
        return trimmed;
    } catch (_) {
        return null;
    }
}
