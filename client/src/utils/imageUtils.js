export const getImageUrl = (path) => {
    if (!path) return null;

    let cleanPath = path;

    // Fix legacy URLs stored with 'undefined' prefix
    if (cleanPath.startsWith('undefined/')) {
        cleanPath = cleanPath.replace('undefined/', '/');
    }
    if (cleanPath.startsWith('undefined')) {
        cleanPath = cleanPath.replace('undefined', '');
    }

    // 0. STATIC ASSETS: Don't proxy or transform local system assets
    if (cleanPath.startsWith('/system/') || cleanPath.startsWith('system/')) {
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    const isNative = typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : (window.Capacitor && window.Capacitor.isNativePlatform());
    const r2Domain = (import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev').replace(/\/$/, '');
    const baseUrl = ((!isNative && !import.meta.env.DEV) ? '' : (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app' : ''))).replace(/\/$/, '');

    try {
        let absoluteUrl = cleanPath;

        // 0. QUICK EXIT: If it's already a proxied URL, sanitize and return it
        // This handles cases where the backend already saved the full proxy URL (e.g. from Vercel)
        if (cleanPath.includes('/api/media/')) {
            // Strip any legacy domains (like oxypace.vercel.app) and enforce current baseUrl
            const proxyTarget = cleanPath.substring(cleanPath.indexOf('/api/media/') + 11);
            
            // If it's an internal R2 file (not an external URL) and we are on Web, use the fast CDN!
            if (!proxyTarget.startsWith('http') && !isNative && !import.meta.env.DEV) {
                return `/r2-media/${proxyTarget}`;
            }
            
            // Otherwise, fallback to the external media proxy or native direct URL
            if (!proxyTarget.startsWith('http') && (isNative || import.meta.env.DEV)) {
                return `${r2Domain}/${proxyTarget}`;
            }

            return `${baseUrl}/api/media/${proxyTarget}`;
        }

        if (absoluteUrl.startsWith('blob:')) return absoluteUrl;

        // 1. Transform Relative Paths to Absolute R2 URLs (or use CDN edge)
        if (!cleanPath.startsWith('http')) {
            let relativePath = cleanPath;
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            
            // If on Web (Netlify), use the ultra-fast Edge Proxy for R2 directly! Bypasses Koyeb.
            if (!isNative && !import.meta.env.DEV) {
                return `/r2-media/${relativePath}`;
            }
            
            // If Native or Dev, use the direct R2 domain (Capacitor doesn't need proxy)
            absoluteUrl = `${r2Domain}/${relativePath}`;
            return absoluteUrl;
        }

        // 2. External Media Proxy (News thumbnails, external GIFs)
        // Must go through Koyeb's /api/media to bypass CORS/Hotlinking protections
        return `${baseUrl}/api/media/${encodeURIComponent(absoluteUrl)}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
