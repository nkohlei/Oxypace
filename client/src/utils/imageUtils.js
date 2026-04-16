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
            const pathSegments = url.pathname.split('/').filter(Boolean);
            
            // Define known R2 directories
            const r2Directories = ['posts', 'avatars', 'banners', 'feedback', 'uploads'];
            
            // Check if any segment of the path matches a known R2 directory
            const folderSegmentIndex = pathSegments.findIndex(segment => r2Directories.includes(segment));
            const isR2Domain = r2Domain && cleanPath.includes(r2Domain);

            if (isR2Domain || folderSegmentIndex !== -1) {
                // Extract the R2 Key (starting from the recognized folder segment)
                // This strips any incorrect domains or prefixes like 'r2-media'
                let key;
                if (folderSegmentIndex !== -1) {
                    key = pathSegments.slice(folderSegmentIndex).join('/');
                } else {
                    key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                }
                
                // Route through our smart proxy
                return `${baseUrl}/api/media/${key}`;
            }

            // Case B: External Absolute URLs (NASA, Gamespot, etc. - Proxy to bypass CORS)
            return `${baseUrl}/api/media/${encodeURIComponent(cleanPath)}`;
        }

        if (cleanPath.startsWith('blob:')) return cleanPath;

        // 2. Handle Relative Paths (uploads/..., avatars/...)
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

        // Resolve through the backend proxy
        return `${baseUrl}/api/media/${relativePath}`;
    } catch (err) {
        console.error('getImageUrl Error:', err);
        return cleanPath; // Safety fallback
    }
};
