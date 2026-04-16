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
        // Return absolute URLs as is (this preserves Cloudflare, S3, or external links)
        return cleanPath;
    }

    if (cleanPath.startsWith('blob:')) return cleanPath;

    // 2. Handle Relative Paths
    let relativePath = cleanPath;

    if (relativePath.startsWith('/api/media/')) {
        relativePath = relativePath.substring(11);
    } else if (relativePath.startsWith('api/media/')) {
        relativePath = relativePath.substring(10);
    } else if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
    }

    // Resolve relative paths through the Cloudflare direct URL if available, otherwise proxy
    if (r2Domain) {
        return `${r2Domain}/${relativePath}`;
    }

    return `${baseUrl}/api/media/${relativePath}`;
};
