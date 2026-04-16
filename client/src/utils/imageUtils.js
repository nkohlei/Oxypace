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
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

    try {
        // 1. Handle Absolute URLs
        if (cleanPath.startsWith('http')) {
            const url = new URL(cleanPath);
            const isR2Domain = r2Domain && cleanPath.includes(r2Domain);

            // Case A: Cloudflare R2 Asset (Route through proxy for SSL/Browser stability)
            if (isR2Domain) {
                const pathPart = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                return `${baseUrl}/api/media/${pathPart}`;
            }

            // Case B: External Absolute URLs (NASA, Gamespot, etc.)
            // Proxy these through the backend to bypass CORS/Hotlinking
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
