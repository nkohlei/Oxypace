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

    const r2Domain = import.meta.env.VITE_R2_PUBLIC_DOMAIN;

    // 1. Handle Absolute URLs
    if (cleanPath.startsWith('http')) {
        // If it's an R2 URL, convert to Proxy for stability (Fixes CORS/Mobile Hotlinking)
        if (r2Domain && cleanPath.includes(r2Domain)) {
            try {
                const url = new URL(cleanPath);
                // Extract everything after the domain (e.g., uploads/file.jpg)
                const pathPart = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                return `/api/media/${pathPart}`;
            } catch (err) {
                console.error('URL Parsing Error:', err);
            }
        }
        // If not R2 or parsing failed, return as-is
        return cleanPath;
    }

    if (cleanPath.startsWith('blob:')) return cleanPath;

    // 2. Handle Relative Paths (Legacy or Proxy)
    // If it's already a proxy path, leave it
    if (cleanPath.startsWith('/api/media/')) return cleanPath;

    // Force all relative paths through the proxy for consistency
    let relativePath = cleanPath;
    if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
    
    // If it's an uploads/ path, we can either use proxy or fallback
    return `/api/media/${relativePath}`;
};
