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

    // 1. If it's an absolute URL
    if (cleanPath.startsWith('http')) {
        // Fix: If it's an R2 URL but contains legacy /uploads/ prefix, strip it
        if (r2Domain && cleanPath.includes(r2Domain)) {
            cleanPath = cleanPath.replace('/uploads/', '/');
        }
        return cleanPath;
    }

    if (cleanPath.startsWith('blob:')) return cleanPath;

    // 2. If it's a relative path, resolve it
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    // If R2 domain is available, we use it for all relative paths
    if (r2Domain) {
        // Strip leading prefixes often found in the DB
        let r2Path = cleanPath;
        if (r2Path.startsWith('/uploads/')) r2Path = r2Path.substring(9);
        else if (r2Path.startsWith('uploads/')) r2Path = r2Path.substring(8);
        else if (r2Path.startsWith('/')) r2Path = r2Path.substring(1);
        
        return `${r2Domain.endsWith('/') ? r2Domain : r2Domain + '/'}${r2Path}`;
    }

    // Fallback to API Proxy (legacy behavior)
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    const safePath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${baseUrl}${safePath}`;
};
