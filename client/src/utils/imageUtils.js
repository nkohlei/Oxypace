import { Capacitor } from '@capacitor/core';

export const getImageUrl = (path, sizeType = 'original') => {
    if (!path) return null;

    let cleanPath = path;

    // Fix legacy URLs stored with 'undefined' prefix
    if (cleanPath.startsWith('undefined/')) {
        cleanPath = cleanPath.replace('undefined/', '/');
    }
    if (cleanPath.startsWith('undefined')) {
        cleanPath = cleanPath.replace('undefined', '');
    }

    if (cleanPath.startsWith('http') && !cleanPath.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) {
        const cleanUrlForCheck = cleanPath.split('?')[0].split('#')[0];
        const ext = cleanUrlForCheck.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'ogg', 'm3u8', 'mpd'].includes(ext)) {
            return `https://unlikely-rosamond-oxypace-e695aebb.koyeb.app/api/media/${encodeURIComponent(cleanPath)}`;
        }
    }

    const isNative = Capacitor.isNativePlatform();
    const r2Domain = (import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev').replace(/\/$/, '');
    const baseUrl = ((!isNative && !import.meta.env.DEV) ? '' : (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app' : ''))).replace(/\/$/, '');

    // 0. STATIC ASSETS: Don't proxy or transform local system assets
    if (cleanPath.startsWith('/system/') || cleanPath.startsWith('system/')) {
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    // 1. MOBILE NATIVE FLOW: Route EVERYTHING through the backend media proxy for absolute CORS & SSL stability
    if (isNative) {
        let relativePath = cleanPath;
        if (relativePath.includes('/api/media/')) {
            relativePath = relativePath.substring(relativePath.indexOf('/api/media/') + 11);
        } else if (relativePath.startsWith(r2Domain)) {
            relativePath = relativePath.substring(r2Domain.length);
        } else if (relativePath.startsWith('/r2-media/')) {
            relativePath = relativePath.substring(10);
        } else if (relativePath.startsWith('r2-media/')) {
            relativePath = relativePath.substring(9);
        }
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }

        if (relativePath.startsWith('blob:')) {
            return relativePath;
        }

        // Apply optimization suffix (thumbnail/medium/lowres) if requested
        if (sizeType && sizeType !== 'original') {
            const isCustomUpload = relativePath.includes('avatars/') || relativePath.includes('banners/') || relativePath.includes('posts/') || relativePath.includes('uploads/');
            if (isCustomUpload && !relativePath.startsWith('data:') && !relativePath.startsWith('blob:')) {
                let targetPath = relativePath.replace(/-medium\.webp/g, '').replace(/-thumbnail\.webp/g, '').replace(/-lowres\.webp/g, '');
                const pathParts = targetPath.split('?');
                const pathPart = pathParts[0];
                const queryPart = pathParts[1] ? `?${pathParts[1]}` : '';
                const lastDotIdx = pathPart.lastIndexOf('.');
                if (lastDotIdx !== -1) {
                    const pathWithoutExt = pathPart.substring(0, lastDotIdx);
                    const isLegacyAvatar = /av\.+\d+/.test(pathWithoutExt) || pathWithoutExt.includes('default') || pathWithoutExt.includes('ui-avatars');
                    if (!isLegacyAvatar) {
                        relativePath = `${pathWithoutExt}-${sizeType}.webp${queryPart}`;
                    }
                }
            }
        }

        if (relativePath.startsWith('http')) {
            // External url proxying
            return `${baseUrl}/api/media/${encodeURIComponent(relativePath)}`;
        }
        return `${baseUrl}/api/media/${relativePath}`;
    }

    // 2. WEB FLOW (unchanged)
    if (cleanPath.startsWith('/r2-media/') || cleanPath.startsWith('r2-media/')) {
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    try {
        let absoluteUrl = cleanPath;

        if (cleanPath.includes('/api/media/')) {
            const proxyTarget = cleanPath.substring(cleanPath.indexOf('/api/media/') + 11);
            if (!proxyTarget.startsWith('http') && !import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${proxyTarget}`;
            } else if (!proxyTarget.startsWith('http') && import.meta.env.DEV) {
                absoluteUrl = `${r2Domain}/${proxyTarget}`;
            } else {
                absoluteUrl = `${baseUrl}/api/media/${proxyTarget}`;
            }
        } else if (cleanPath.startsWith(r2Domain)) {
            let relativePath = cleanPath.substring(r2Domain.length);
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            if (!import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${relativePath}`;
            } else {
                absoluteUrl = `${r2Domain}/${relativePath}`;
            }
        } else if (cleanPath.startsWith('blob:')) {
            return cleanPath;
        } else if (!cleanPath.startsWith('http')) {
            let relativePath = cleanPath;
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            if (!import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${relativePath}`;
            } else {
                absoluteUrl = `${r2Domain}/${relativePath}`;
            }
        } else {
            absoluteUrl = `${baseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        // Apply optimization suffix (thumbnail/medium/lowres) if requested
        if (sizeType && sizeType !== 'original') {
            const isCustomUpload = absoluteUrl.includes('/avatars/') || absoluteUrl.includes('/banners/') || absoluteUrl.includes('/posts/') || absoluteUrl.includes('/r2-media/') || absoluteUrl.includes('/uploads/') || absoluteUrl.includes(r2Domain);
            if (isCustomUpload && !absoluteUrl.startsWith('data:') && !absoluteUrl.startsWith('blob:')) {
                let targetUrl = absoluteUrl.replace(/-medium\.webp/g, '').replace(/-thumbnail\.webp/g, '').replace(/-lowres\.webp/g, '');
                const urlParts = targetUrl.split('?');
                const pathPart = urlParts[0];
                const queryPart = urlParts[1] ? `?${urlParts[1]}` : '';
                const lastDotIdx = pathPart.lastIndexOf('.');
                if (lastDotIdx !== -1) {
                    const pathWithoutExt = pathPart.substring(0, lastDotIdx);
                    const isLegacyAvatar = /av\.+\d+/.test(pathWithoutExt) || pathWithoutExt.includes('default') || pathWithoutExt.includes('ui-avatars');
                    if (!isLegacyAvatar) {
                        absoluteUrl = `${pathWithoutExt}-${sizeType}.webp${queryPart}`;
                    }
                }
            }
        }

        return absoluteUrl;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
