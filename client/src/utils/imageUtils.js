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

    const r2Domain = (import.meta.env.VITE_R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

    try {
        let absoluteUrl = cleanPath;

        // 1. Transform Relative Paths to Absolute R2 URLs
        // If it doesn't start with http, it's either a local key (posts/...) or a legacy path
        if (!cleanPath.startsWith('http') && !cleanPath.startsWith('blob:')) {
            let relativePath = cleanPath;
            // Strip any leading slashes or proxy prefixes stored in DB
            if (relativePath.startsWith('/api/media/')) relativePath = relativePath.substring(11);
            else if (relativePath.startsWith('api/media/')) relativePath = relativePath.substring(10);
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            
            // Construct full R2 URL
            absoluteUrl = `${r2Domain}/${relativePath}`;
        }

        if (absoluteUrl.startsWith('blob:')) return absoluteUrl;

        // 2. Proxy the Absolute URL through the verified Encoded format
        // This Case ALWAYS works because it uses the axios fetch in the backend
        return `${baseUrl}/api/media/${encodeURIComponent(absoluteUrl)}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
