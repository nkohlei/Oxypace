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
            return `${baseUrl}/api/media/${proxyTarget}`;
        }

        if (absoluteUrl.startsWith('blob:')) return absoluteUrl;

        // 1. Transform Relative Paths to Absolute R2 URLs
        if (!cleanPath.startsWith('http')) {
            let relativePath = cleanPath;
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            
            // Construct full R2 URL
            absoluteUrl = `${r2Domain}/${relativePath}`;
        }

        // 2. Proxy the Absolute URL through the verified Encoded format
        return `${baseUrl}/api/media/${encodeURIComponent(absoluteUrl)}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
