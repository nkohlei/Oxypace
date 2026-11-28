import { Capacitor } from '@capacitor/core';

const URL_MEMO_CACHE = new Map();
const MAX_MEMO_ITEMS = 1500;

export const getImageUrl = (path, sizeType = 'original') => {
    if (!path) return null;

    if (Array.isArray(path)) {
        path = path[0] || '';
    }

    if (path && typeof path === 'object') {
        path = path.url || path.src || path.media || path.path || path.uri || null;
    }

    if (!path || typeof path !== 'string') {
        return null;
    }

    const memoKey = `${path}__${sizeType}`;
    if (URL_MEMO_CACHE.has(memoKey)) {
        return URL_MEMO_CACHE.get(memoKey);
    }

    let cleanPath = path.trim();

    // Fix legacy URLs stored with 'undefined' prefix
    if (cleanPath.startsWith('undefined/')) {
        cleanPath = cleanPath.replace('undefined/', '/');
    }
    if (cleanPath.startsWith('undefined')) {
        cleanPath = cleanPath.replace('undefined', '');
    }

    // Direct data or blob URLs
    if (cleanPath.startsWith('blob:') || cleanPath.startsWith('data:')) {
        return cleanPath;
    }

    // Static system assets (local to the app/web bundle)
    if (cleanPath.startsWith('/system/') || cleanPath.startsWith('system/')) {
        const res = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        if (URL_MEMO_CACHE.size < MAX_MEMO_ITEMS) URL_MEMO_CACHE.set(memoKey, res);
        return res;
    }

    // Local API proxy routes
    if (cleanPath.startsWith('/api/proxy') || cleanPath.startsWith('api/proxy')) {
        const res = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        if (URL_MEMO_CACHE.size < MAX_MEMO_ITEMS) URL_MEMO_CACHE.set(memoKey, res);
        return res;
    }

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
    const cdnBaseUrl = (import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.oxypace.com.tr').replace(/\/$/, '');
    const r2DevDomain = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';

    try {
        // Check if media is video/audio stream or HEIC (which requires backend conversion)
        const cleanForExt = cleanPath.split('?')[0].split('#')[0];
        const lastDotIdx = cleanForExt.lastIndexOf('.');
        const ext = lastDotIdx !== -1 ? cleanForExt.substring(lastDotIdx + 1).toLowerCase() : '';
        const isVideoOrAudio = ['mp4', 'webm', 'ogg', 'oga', 'opus', 'mov', 'm4v', 'm3u8', 'mpd', 'mp3', 'wav', 'm4a', 'aac'].includes(ext);
        const isHeic = ['heic', 'heif'].includes(ext);

        // Normalize internal R2 relative path
        let relativePath = cleanPath;

        // Strip initial proxy prefix if present
        if (relativePath.includes('/api/media/')) {
            relativePath = relativePath.substring(relativePath.indexOf('/api/media/') + 11);
        }

        // Recursively decode URL-encoded components (e.g. %3A%2F%2F from double-wrapped legacy proxies)
        let decodeCycles = 0;
        while (typeof relativePath === 'string' && decodeCycles < 4 && (relativePath.includes('%2F') || relativePath.includes('%3A') || relativePath.includes('%2f') || relativePath.includes('%3a'))) {
            try {
                const decoded = decodeURIComponent(relativePath);
                if (decoded === relativePath) break;
                relativePath = decoded;
                decodeCycles++;
            } catch (_) {
                break;
            }
        }

        // Re-strip nested proxy prefix if revealed after decoding
        if (relativePath.includes('/api/media/')) {
            relativePath = relativePath.substring(relativePath.indexOf('/api/media/') + 11);
        }

        // Strip known R2 / CDN domains and prefixes
        if (relativePath.startsWith(cdnBaseUrl)) {
            relativePath = relativePath.substring(cdnBaseUrl.length);
        } else if (relativePath.startsWith('https://cdn.oxypace.com.tr')) {
            relativePath = relativePath.substring('https://cdn.oxypace.com.tr'.length);
        } else if (relativePath.startsWith(r2DevDomain)) {
            relativePath = relativePath.substring(r2DevDomain.length);
        } else if (relativePath.startsWith('https://oxypace.com.tr/r2-media/')) {
            relativePath = relativePath.substring('https://oxypace.com.tr/r2-media/'.length);
        } else if (relativePath.startsWith('/r2-media/')) {
            relativePath = relativePath.substring(10);
        } else if (relativePath.startsWith('r2-media/')) {
            relativePath = relativePath.substring(9);
        }

        // Strip ALL leading slashes and collapse accidental duplicate slashes (e.g. //posts/...)
        // Cloudflare R2 Custom Domain treats leading // as part of the object key and returns 404!
        relativePath = relativePath.replace(/^\/+/, '');

        // Normalize legacy post folder structure
        if (relativePath.startsWith('post-') && !relativePath.startsWith('posts/')) {
            relativePath = `posts/general/${relativePath}`;
        }

        let finalUrl = '';

        // --- 1. EXTERNAL 3RD-PARTY MEDIA ---
        // (URLs that are not internal R2 assets)
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            // If it's a direct third-party video/stream, return as-is
            if (isVideoOrAudio) {
                finalUrl = cleanPath;
            } else {
                // For external third-party images (news, embeds), proxy through backend to bypass CORS & Referer protection
                finalUrl = `${apiBaseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
            }
        } else {
            // --- 2. INTERNAL R2 IMAGES, VIDEOS, AUDIO & ASSETS ---
            // Route directly to Cloudflare R2 Custom Domain (cdn.oxypace.com.tr) for global Edge caching,
            // HTTP/3 QUIC, zero VPS/Node proxy overhead, and complete isolation from api.oxypace.com.tr.
            relativePath = relativePath.replace(/\/{2,}/g, '/');

            if (isHeic) {
                // HEIC/HEIF requires on-the-fly JPEG conversion on backend
                finalUrl = `${apiBaseUrl}/api/media/${relativePath}`;
            } else {
                // Only request pre-generated multi-res WebP variants for avatar/portal icons (never for 'feed' post images!)
                const isAvatarVariant = sizeType === 'thumbnail' || sizeType === 'medium' || sizeType === 'lowres';
                if (isAvatarVariant && (relativePath.includes('avatars/') || relativePath.includes('portals/') || relativePath.includes('banners/'))) {
                    const pathParts = relativePath.split('?');
                    const mainPath = pathParts[0];
                    const query = pathParts[1] ? `?${pathParts[1]}` : '';
                    const dotIdx = mainPath.lastIndexOf('.');

                    if (dotIdx !== -1) {
                        const pathWithoutExt = mainPath.substring(0, dotIdx);
                        const isLegacyAvatar = /av\.+\d+/.test(pathWithoutExt) || pathWithoutExt.includes('default') || pathWithoutExt.includes('ui-avatars');

                        // Request pre-generated WebP variant (UserAvatar falls back cleanly to original on 404)
                        if (!isLegacyAvatar && !mainPath.includes('-thumbnail') && !mainPath.includes('-medium') && !mainPath.includes('-lowres') && !mainPath.includes('-banner')) {
                            relativePath = `${pathWithoutExt}-${sizeType}.webp${query}`;
                        }
                    }
                }

                // Strip ?w=720 if present so Cloudflare Edge & browser share one canonical cache key
                const cleanCdnPath = relativePath.replace(/([?&])w=\d+&?/, (m, p1) => (p1 === '?' ? '?' : '&')).replace(/[?&]$/, '').replace(/^\/+/, '');
                finalUrl = `${cdnBaseUrl}/${cleanCdnPath}`;
            }
        }

        if (URL_MEMO_CACHE.size < MAX_MEMO_ITEMS) {
            URL_MEMO_CACHE.set(memoKey, finalUrl);
        }
        return finalUrl;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
