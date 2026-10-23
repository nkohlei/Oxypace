import { getImageUrl } from './imageUtils';

const preloadedSet = new Set();

/**
 * Preload an image URL into browser cache asynchronously.
 */
export const preloadImage = (url, sizeType = 'original') => {
    if (!url || typeof window === 'undefined') return;
    const resolved = getImageUrl(url, sizeType);
    if (!resolved || preloadedSet.has(resolved)) return;

    preloadedSet.add(resolved);
    const img = new window.Image();
    img.decoding = 'async';
    img.src = resolved;
};

/**
 * Preload multiple image URLs into browser cache.
 */
export const preloadImages = (urls = [], sizeType = 'original') => {
    if (!Array.isArray(urls) || typeof window === 'undefined') return;
    urls.forEach((u) => preloadImage(u, sizeType));
};

/**
 * Preload portal avatars and banners into memory cache.
 */
export const preloadPortals = (portals = []) => {
    if (!Array.isArray(portals) || typeof window === 'undefined') return;
    portals.slice(0, 15).forEach((p) => {
        if (!p) return;
        if (p.avatar) {
            preloadImage(p.avatar, /\.gif($|\?)/i.test(p.avatar) ? 'original' : 'thumbnail');
        }
        const banner = p.coverImage || p.banner;
        if (banner) {
            preloadImage(banner, 'original');
        }
    });
};

/**
 * Preload user avatars and custom badge icons.
 */
export const preloadUsers = (users = []) => {
    if (!Array.isArray(users) || typeof window === 'undefined') return;
    users.slice(0, 20).forEach((u) => {
        if (!u) return;
        const avatar = u.profile?.avatar || u.avatar;
        if (avatar) {
            preloadImage(avatar, 'thumbnail');
        }
        if (u.customBadge?.url) {
            preloadImage(u.customBadge.url, 'original');
        }
    });
};
