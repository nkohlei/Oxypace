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

    const r2Domain = (import.meta.env.VITE_R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

    try {
        let absoluteUrl = cleanPath;

        // 0. QUICK EXIT: If it's already a proxied URL, return it directly
        // This handles cases where the backend already saved the full proxy URL
        if (cleanPath.includes('/api/media/')) {
            if (cleanPath.startsWith('http')) return cleanPath;
            // Handle relative proxy paths: /api/media/...
            const finalBase = baseUrl || '';
            return `${finalBase}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
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
