import { Capacitor } from '@capacitor/core';

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
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    // Local API proxy routes
    if (cleanPath.startsWith('/api/proxy') || cleanPath.startsWith('api/proxy')) {
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    const isNative = Capacitor.isNativePlatform();
    const isElectron = typeof window !== 'undefined' && (
        !!window.desktopAPI?.isElectron ||
        (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') !== -1)
    );

    // Edge CDN base for R2 media (Direct Cloudflare Edge CDN proxied via Netlify to bypass ISP DPI / SNI blocks)
    // On native mobile or Electron, must be absolute HTTPS. On web in production, can be relative.
    const edgeMediaBase = (isNative || isElectron || import.meta.env.DEV)
        ? 'https://oxypace.com.tr/r2-media'
        : '/r2-media';

    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
    const r2DevDomain = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';

    try {
        // Check if media is video or audio stream
        const cleanForExt = cleanPath.split('?')[0].split('#')[0];
        const lastDotIdx = cleanForExt.lastIndexOf('.');
        const ext = lastDotIdx !== -1 ? cleanForExt.substring(lastDotIdx + 1).toLowerCase() : '';
        const isVideoOrAudio = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'm3u8', 'mpd'].includes(ext);

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

        // Strip known R2 domains and prefixes
        if (relativePath.startsWith(r2DevDomain)) {
            relativePath = relativePath.substring(r2DevDomain.length);
        } else if (relativePath.startsWith('https://oxypace.com.tr/r2-media/')) {
            relativePath = relativePath.substring('https://oxypace.com.tr/r2-media/'.length);
        } else if (relativePath.startsWith('/r2-media/')) {
            relativePath = relativePath.substring(10);
        } else if (relativePath.startsWith('r2-media/')) {
            relativePath = relativePath.substring(9);
        }

        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }

        // Normalize legacy post folder structure
        if (relativePath.startsWith('post-') && !relativePath.startsWith('posts/')) {
            relativePath = `posts/general/${relativePath}`;
        }

        // --- 1. EXTERNAL 3RD-PARTY MEDIA ---
        // (URLs that are not internal R2 assets)
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            // If it's a direct third-party video/stream, return as-is
            if (isVideoOrAudio) {
                return cleanPath;
            }
            // For external third-party images (news, embeds), proxy through backend to bypass CORS & Referer protection
            return `${apiBaseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        // --- 2. INTERNAL R2 VIDEO & AUDIO ---
        // Video files require HTTP 206 Partial Content Range streaming which backend handles
        if (isVideoOrAudio) {
            return `${apiBaseUrl}/api/media/${relativePath}`;
        }

        // --- 3. INTERNAL R2 IMAGES (AVATARS, BANNERS, POSTS, UPLOADS) ---
        // Apply thumbnail/medium suffix ONLY if requested AND only if file was created as .webp
        // (Avoids phantom 404s on legacy JPG/PNG avatars that never had a -thumbnail.webp generated)
        if (sizeType && sizeType !== 'original' && relativePath.includes('avatars/')) {
            const pathParts = relativePath.split('?');
            const mainPath = pathParts[0];
            const query = pathParts[1] ? `?${pathParts[1]}` : '';
            const dotIdx = mainPath.lastIndexOf('.');

            if (dotIdx !== -1) {
                const fileExt = mainPath.substring(dotIdx).toLowerCase();
                const pathWithoutExt = mainPath.substring(0, dotIdx);
                const isLegacyAvatar = /av\.+\d+/.test(pathWithoutExt) || pathWithoutExt.includes('default') || pathWithoutExt.includes('ui-avatars');

                // ONLY convert if it's already a modern .webp avatar and not a GIF or legacy placeholder
                if (fileExt === '.webp' && !isLegacyAvatar && !mainPath.includes('-thumbnail') && !mainPath.includes('-medium') && !mainPath.includes('-lowres')) {
                    relativePath = `${pathWithoutExt}-${sizeType}.webp${query}`;
                }
            }
        }

        // Serve internal R2 images via Edge CDN
        return `${edgeMediaBase}/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
