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

    const isNative = Capacitor.isNativePlatform();
    const r2Domain = (import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev').replace(/\/$/, '');
    const baseUrl = ((!isNative && !import.meta.env.DEV) ? '' : (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app' : ''))).replace(/\/$/, '');

    // 0. STATIC ASSETS: Don't proxy or transform local system assets
    if (cleanPath.startsWith('/system/') || cleanPath.startsWith('system/')) {
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    if (cleanPath.startsWith('/r2-media/') || cleanPath.startsWith('r2-media/')) {
        if (isNative) {
            let relativePath = cleanPath;
            if (relativePath.startsWith('/r2-media/')) relativePath = relativePath.substring(10);
            else if (relativePath.startsWith('r2-media/')) relativePath = relativePath.substring(9);
            return `${r2Domain}/${relativePath}`;
        }
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    try {
        let absoluteUrl = cleanPath;

        // 0. QUICK EXIT: If it's already a proxied URL, sanitize and return it
        if (cleanPath.includes('/api/media/')) {
            const proxyTarget = cleanPath.substring(cleanPath.indexOf('/api/media/') + 11);
            
            // If it's an internal R2 file (not an external URL) and we are on Web, use the fast CDN!
            if (!proxyTarget.startsWith('http') && !isNative && !import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${proxyTarget}`;
            } else if (!proxyTarget.startsWith('http') && (isNative || import.meta.env.DEV)) {
                absoluteUrl = `${r2Domain}/${proxyTarget}`;
            } else {
                absoluteUrl = `${baseUrl}/api/media/${proxyTarget}`;
            }
        } else if (cleanPath.startsWith(r2Domain)) {
            let relativePath = cleanPath.substring(r2Domain.length);
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            
            if (!isNative && !import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${relativePath}`;
            } else {
                absoluteUrl = `${r2Domain}/${relativePath}`;
            }
        } else if (cleanPath.startsWith('blob:')) {
            return cleanPath;
        } else if (!cleanPath.startsWith('http')) {
            let relativePath = cleanPath;
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            
            if (!isNative && !import.meta.env.DEV) {
                absoluteUrl = `/r2-media/${relativePath}`;
            } else {
                absoluteUrl = `${r2Domain}/${relativePath}`;
            }
        } else {
            // External Media Proxy
            absoluteUrl = `${baseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        // Apply optimization suffix (thumbnail/medium/lowres) if requested and it's a custom upload
        if (sizeType && sizeType !== 'original') {
            const isCustomUpload = absoluteUrl.includes('/avatars/') || absoluteUrl.includes('/banners/') || absoluteUrl.includes('/posts/') || absoluteUrl.includes('/r2-media/') || absoluteUrl.includes('/uploads/') || absoluteUrl.includes(r2Domain);
            if (isCustomUpload && !absoluteUrl.startsWith('data:') && !absoluteUrl.startsWith('blob:')) {
                // Strip existing suffixes if any
                let targetUrl = absoluteUrl.replace(/-medium\.webp/g, '').replace(/-thumbnail\.webp/g, '').replace(/-lowres\.webp/g, '');
                
                const urlParts = targetUrl.split('?');
                const pathPart = urlParts[0];
                const queryPart = urlParts[1] ? `?${urlParts[1]}` : '';
                
                const lastDotIdx = pathPart.lastIndexOf('.');
                if (lastDotIdx !== -1) {
                    const pathWithoutExt = pathPart.substring(0, lastDotIdx);
                    // ✅ Apply suffix to custom user/bot uploads (not legacy avatars like 'av.XX')
                    // Explicitly ignore static/legacy avatars named like 'av.XX' or 'av..XX' or 'default'
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
