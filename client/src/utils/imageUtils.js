/**
 * Constructs a full URL for an image path.
 * If the path is a local upload (starts with /uploads), it prepends the API root URL.
 * If the path is already absolute (http...), it returns it as is.
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;

    // Get Base URL (e.g., https://api.com/api)
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    // We need the ROOT URL, not the API URL.
    // Usually API URL ends with '/api', so we strip it.
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    // Ensure path starts with /
    const safePath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${safePath}`;
};
