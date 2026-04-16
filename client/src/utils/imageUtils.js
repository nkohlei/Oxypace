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
            // Normalize path to backend proxy for R2-hosted images (ensures performance & consistency)
            if (r2Domain && cleanPath.includes(r2Domain)) {
                try {
                    const url = new URL(cleanPath);
                    // Extract everything after the domain (e.g., avatars/my-file.png)
                    const pathPart = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                    return `${baseUrl}/api/media/${pathPart}`;
                } catch (urlErr) {
                    console.error('URL Parsing Error:', urlErr);
                }
            }
            // Return other absolute URLs as is
            return cleanPath;
        }

        if (cleanPath.startsWith('blob:')) return cleanPath;

        // 2. Handle Relative Paths
        let relativePath = cleanPath;

        // Normalize the path by removing potential prefixes
        if (relativePath.startsWith('/api/media/')) {
            relativePath = relativePath.substring(11);
        } else if (relativePath.startsWith('api/media/')) {
            relativePath = relativePath.substring(10);
        }

        // Ensure no leading slash in relativePath for consistent joining
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }

        // Resolve through the backend proxy for optimal streaming and redirection
        return `${baseUrl}/api/media/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath; // Safety fallback
    }
};
