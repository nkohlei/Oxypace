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

            // Case A: Cloudflare R2 URLs (Return DIRECT for branding)
            if (isR2Domain || isR2Folder) {
                // If it's already an absolute R2-looking URL, return it as is (or normalize to r2Domain if available)
                if (isR2Domain) return cleanPath;
                
                // If it has an R2 folder but wrong domain, normalize to our R2 domain
                if (isR2Folder && r2Domain) {
                    const folderIndex = pathSegments.findIndex(s => ['posts', 'avatars', 'banners', 'feedback', 'uploads'].includes(s));
                    const key = pathSegments.slice(folderIndex).join('/');
                    return `${r2Domain}/${key}`;
                }
                return cleanPath;
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

        // Resolve through the backend proxy for safety
        return `${baseUrl}/api/media/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
