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
            // BACK TO STABLE: Entire absolute URL is encoded for the /api/media/ proxy
            return `${baseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        if (cleanPath.startsWith('blob:')) return cleanPath;

        // 2. Handle Relative Paths (uploads/..., avatars/...)
        let relativePath = cleanPath;
        if (relativePath.startsWith('/api/media/')) relativePath = relativePath.substring(11);
        else if (relativePath.startsWith('api/media/')) relativePath = relativePath.substring(10);
        
        // Remove leading slash if any
        if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

        // Case C: Standard relative paths stored in DB (uploads/..., avatars/...)
        // We route these through the backend proxy for consistency and to handle both local/R2
        return `${baseUrl}/api/media/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath;
    }
};
