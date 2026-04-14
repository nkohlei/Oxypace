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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    // 1. Handle Absolute URLs
    if (cleanPath.startsWith('http')) {
        // If it's an R2 URL, convert to Absolute Koyeb Proxy (Fixes CORS/Mobile Hotlinking)
        if (r2Domain && cleanPath.includes(r2Domain)) {
            try {
                const url = new URL(cleanPath);
                // Extract everything after the domain (e.g., uploads/file.jpg)
                const pathPart = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                
                // Return full absolute Koyeb proxy URL
                return `${baseUrl}/api/media/${pathPart}`;
            } catch (err) {
                console.error('URL Parsing Error:', err);
            }
        }
        // If it's already a Koyeb or other absolute URL, return it
        return cleanPath;
    }

    if (cleanPath.startsWith('blob:')) return cleanPath;

    // 2. Handle Relative Paths (Legacy or Proxy)
    // Normalize path (ensure no leading slash)
    let relativePath = cleanPath;

    if (relativePath.startsWith('/api/media/')) {
        relativePath = relativePath.substring(11);
    } else if (relativePath.startsWith('api/media/')) {
        relativePath = relativePath.substring(10);
    } else if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
    }

    // Always resolve relative paths through the ABSOLUTE Koyeb proxy
    return `${baseUrl}/api/media/${relativePath}`;
};
