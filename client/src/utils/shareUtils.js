import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

export const CANONICAL_WEB_ORIGIN = 'https://oxypace.com.tr';

/**
 * Returns the canonical public web origin for shareable URLs.
 * Inside Capacitor native shells (which run on http://localhost or capacitor://localhost)
 * or local dev hosts, always resolves to https://oxypace.com.tr.
 */
export const getCanonicalOrigin = () => {
    try {
        if (Capacitor.isNativePlatform()) {
            return CANONICAL_WEB_ORIGIN;
        }
        if (typeof window !== 'undefined' && window.location?.origin) {
            const origin = window.location.origin;
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
                /^(capacitor|ionic|file):/i.test(origin)) {
                return CANONICAL_WEB_ORIGIN;
            }
            return origin;
        }
    } catch (_) {
        // Fallback cleanly to canonical origin
    }
    return CANONICAL_WEB_ORIGIN;
};

export const getPostShareUrl = (postId) => {
    if (!postId) return getCanonicalOrigin();
    return `${getCanonicalOrigin()}/post/${postId}`;
};

export const getPortalShareUrl = (portalId) => {
    if (!portalId) return getCanonicalOrigin();
    return `${getCanonicalOrigin()}/portal/${portalId}`;
};

/**
 * Copies text to the clipboard across Android/iOS Capacitor WebView and desktop/mobile browsers.
 */
export const copyTextSafely = async (text) => {
    if (!text) return false;
    try {
        if (Capacitor.isNativePlatform()) {
            await Clipboard.write({ string: String(text) });
            return true;
        }
    } catch (nativeErr) {
        console.warn('[shareUtils] Capacitor Clipboard failed, trying web API:', nativeErr);
    }

    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(String(text));
            return true;
        }
    } catch (webErr) {
        console.warn('[shareUtils] navigator.clipboard failed, trying execCommand:', webErr);
    }

    try {
        const textarea = document.createElement('textarea');
        textarea.value = String(text);
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return Boolean(ok);
    } catch (_) {
        return false;
    }
};

/**
 * Invokes native share sheet on Capacitor Android/iOS or Web Share API on browsers.
 * Returns { shared: boolean, cancelled?: boolean }.
 */
export const systemShare = async ({ title = 'Oxypace', text = '', url = '', dialogTitle = 'Gönderiyi Paylaş' }) => {
    try {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title,
                text: text || undefined,
                url,
                dialogTitle,
            });
            return { shared: true };
        }

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({
                title,
                text: text || undefined,
                url,
            });
            return { shared: true };
        }
        return { shared: false };
    } catch (err) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (err?.name === 'AbortError' || msg.includes('cancel') || msg.includes('dismiss')) {
            return { shared: false, cancelled: true };
        }
        throw err;
    }
};

export const openExternalShareUrl = (shareUrl) => {
    if (!shareUrl) return;
    try {
        if (Capacitor.isNativePlatform()) {
            // Let Android/iOS OS resolve deep links (tg://, whatsapp://, mailto:, https://wa.me...)
            window.open(shareUrl, '_system');
            return;
        }
        if (shareUrl.startsWith('mailto:') || shareUrl.startsWith('tg:') || shareUrl.startsWith('whatsapp:')) {
            window.location.href = shareUrl;
            return;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } catch (_) {
        try {
            window.location.href = shareUrl;
        } catch (__) {
            // ignore
        }
    }
};

