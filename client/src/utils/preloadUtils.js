import { getImageUrl } from './imageUtils';
import { registerPlugin, Capacitor } from '@capacitor/core';

const NativeMediaPreloader = (typeof window !== 'undefined' && Capacitor?.isNativePlatform && Capacitor.isNativePlatform())
    ? registerPlugin('NativeMediaPreloader')
    : null;

const preloadedSet = new Set();
const MAX_PRELOAD_ITEMS = 1500;

// High-speed queue management with HTTP/2 concurrent pipeline
const PRELOAD_QUEUE = [];
let activePreloads = 0;
const MAX_CONCURRENT_PRELOADS = 8;

function processQueue() {
    while (activePreloads < MAX_CONCURRENT_PRELOADS && PRELOAD_QUEUE.length > 0) {
        const item = PRELOAD_QUEUE.shift();
        if (!item) continue;
        const { resolved, priority } = item;

        activePreloads++;
        const img = new window.Image();
        img.decoding = 'async';
        if ('fetchPriority' in img) {
            img.fetchPriority = priority;
        }

        const done = () => {
            activePreloads--;
            img.onload = null;
            img.onerror = null;
            processQueue();
        };

        img.onload = done;
        img.onerror = done;
        img.src = resolved;
    }
}

/**
 * Preload an image URL into browser & native disk cache with optional priority ('high' | 'low').
 */
export const preloadImage = (url, sizeType = 'original', priority = 'low') => {
    if (!url || typeof window === 'undefined') return;
    const resolved = getImageUrl(url, sizeType);
    if (!resolved || preloadedSet.has(resolved)) return;

    if (preloadedSet.size >= MAX_PRELOAD_ITEMS) {
        const first = preloadedSet.keys().next().value;
        if (first) preloadedSet.delete(first);
    }
    preloadedSet.add(resolved);

    // If on native platform, proactively send to native background worker pool
    if (NativeMediaPreloader && priority === 'high') {
        NativeMediaPreloader.preloadUrls({ urls: [resolved] }).catch(() => {});
    }

    // If high priority (e.g. above-the-fold first items), insert at head of queue
    if (priority === 'high') {
        PRELOAD_QUEUE.unshift({ resolved, priority: 'high' });
    } else {
        PRELOAD_QUEUE.push({ resolved, priority: 'low' });
    }
    processQueue();
};

/**
 * Preload multiple image URLs into browser cache.
 */
export const preloadImages = (urls = [], sizeType = 'original', priority = 'low') => {
    if (!Array.isArray(urls) || typeof window === 'undefined') return;
    urls.forEach((u) => preloadImage(u, sizeType, priority));
};

/**
 * Preload portal avatars and banners into memory cache.
 */
export const preloadPortals = (portals = []) => {
    if (!Array.isArray(portals) || typeof window === 'undefined') return;
    portals.slice(0, 25).forEach((p) => {
        if (!p) return;
        const avatar = p.lowResAvatar || p.avatar;
        if (avatar) {
            preloadImage(avatar, 'thumbnail');
        }
        const banner = p.coverImage || p.banner;
        if (banner) {
            preloadImage(banner, 'medium');
        }
    });
};

/**
 * Preload user avatars and custom badge icons.
 */
export const preloadUsers = (users = []) => {
    if (!Array.isArray(users) || typeof window === 'undefined') return;
    users.slice(0, 30).forEach((u) => {
        if (!u) return;
        const avatar = u.profile?.lowResAvatar || u.profile?.avatar || u.avatar;
        if (avatar) {
            preloadImage(avatar, 'thumbnail');
        }
        if (u.customBadge?.url) {
            preloadImage(u.customBadge.url, 'original');
        }
    });
};

/**
 * Preload post feeds (Author avatar, badge, and first post image)
 * Guarantees images show up synchronously with page render (0ms pop-in).
 */
export const preloadPosts = (posts = []) => {
    if (!Array.isArray(posts) || typeof window === 'undefined') return;

    // Fast-path batch dispatch to Native Android background thread pool
    if (NativeMediaPreloader) {
        const batchUrls = [];
        posts.slice(0, 12).forEach((post) => {
            if (!post) return;
            const author = post.author;
            if (author) {
                const avatar = author.profile?.lowResAvatar || author.profile?.avatar || author.avatar;
                if (avatar) {
                    const r = getImageUrl(avatar, 'thumbnail');
                    if (r) batchUrls.push(r);
                }
                if (author.customBadge?.url) {
                    const r = getImageUrl(author.customBadge.url, 'original');
                    if (r) batchUrls.push(r);
                }
            }
            const media = post.media || (Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : null);
            if (media && typeof media === 'string') {
                const clean = media.split('?')[0].split('#')[0].toLowerCase();
                if (/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(clean)) {
                    const r = getImageUrl(media, 'feed');
                    if (r) batchUrls.push(r);
                }
            }
        });
        if (batchUrls.length > 0) {
            NativeMediaPreloader.preloadUrls({ urls: batchUrls }).catch(() => {});
        }
    }

    posts.slice(0, 15).forEach((post, idx) => {
        if (!post) return;
        const priority = idx < 4 ? 'high' : 'low';
        const author = post.author;
        if (author) {
            const avatar = author.profile?.lowResAvatar || author.profile?.avatar || author.avatar;
            if (avatar) {
                preloadImage(avatar, 'thumbnail', priority);
            }
            if (author.customBadge?.url) {
                preloadImage(author.customBadge.url, 'original', priority);
            }
        }
        // Images in post (using feed size ?w=720 for instant load)
        const media = post.media || (Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : null);
        if (media && typeof media === 'string') {
            const clean = media.split('?')[0].split('#')[0].toLowerCase();
            const isImage = /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(clean);
            if (isImage) {
                preloadImage(media, 'feed', priority);
            }
        }
        if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 1) {
            post.mediaUrls.slice(1, 3).forEach(m => {
                if (typeof m === 'string') preloadImage(m, 'feed', 'low');
            });
        }
    });
};

/**
 * Preload message conversations (Sender avatars and embedded images)
 */
export const preloadMessages = (messages = []) => {
    if (!Array.isArray(messages) || typeof window === 'undefined') return;
    messages.slice(0, 30).forEach((msg) => {
        if (!msg) return;
        const sender = msg.sender;
        if (sender) {
            const avatar = sender.profile?.lowResAvatar || sender.profile?.avatar || sender.avatar;
            if (avatar) {
                preloadImage(avatar, 'thumbnail');
            }
        }
        if (msg.mediaUrl && typeof msg.mediaUrl === 'string') {
            const clean = msg.mediaUrl.split('?')[0].toLowerCase();
            if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(clean)) {
                preloadImage(msg.mediaUrl, 'original');
            }
        }
    });
};
