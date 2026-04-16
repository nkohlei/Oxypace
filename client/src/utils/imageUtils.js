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

    const r2Domain = import.meta.env.VITE_R2_PUBLIC_DOMAIN?.replace(/\/$/, '');
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

    try {
        // 1. Handle Absolute URLs
        if (cleanPath.startsWith('http')) {
            const url = new URL(cleanPath);
            const isR2Domain = r2Domain && cleanPath.includes(r2Domain);
            const pathSegments = url.pathname.split('/').filter(Boolean);
            const isR2Folder = ['posts', 'avatars', 'banners', 'feedback', 'uploads'].some(f => pathSegments.includes(f));

            // Case A: Cloudflare R2 URLs (Proxy through backend to bypass R2 SSL errors)
            if (isR2Domain || isR2Folder) {
                // Determine the key from the pathname
                let key;
                if (isR2Folder) {
                    const folderIndex = pathSegments.findIndex(s => ['posts', 'avatars', 'banners', 'feedback', 'uploads'].includes(s));
                    key = pathSegments.slice(folderIndex).join('/');
                } else {
                    key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                }
                
                return `${baseUrl}/api/media/${key}`;
            }

            // Case B: External Absolute URLs (NASA, Gamespot, etc. - Proxy to bypass CORS)
            return `${baseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        if (cleanPath.startsWith('blob:')) return cleanPath;

        // 2. Handle Relative Paths (uploads/..., avatars/...)
        let relativePath = cleanPath;
        if (relativePath.startsWith('/api/media/')) relativePath = relativePath.substring(11);
        else if (relativePath.startsWith('api/media/')) relativePath = relativePath.substring(10);
        if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

        // Resolve through the backend proxy
        return `${baseUrl}/api/media/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
