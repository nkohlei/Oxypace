/**
 * Centralized Media Configuration
 * 
 * Enforces the correct Cloudflare R2 domain and Koyeb Proxy Base.
 * Hardcoded strings ensure operational stability even if environment variables are misconfigured.
 */

// Cloudflare R2 Public Domain (The 'ham' URL) - HARDCODED as per instructions
export const R2_DOMAIN = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';

// Koyeb API Proxy Base URL - Dynamic with fallback to new domain
const backendBase = (typeof process !== 'undefined' && process.env.BACKEND_URL) 
    ? process.env.BACKEND_URL 
    : 'https://api.oxypace.com.tr';
export const PROXY_BASE = `${backendBase.replace(/\/$/, '')}/api/media/`;

export const constructProxiedUrl = (key) => {
    if (!key) return null;
    
    // If it's already a direct R2 URL, return it as-is
    if (key.startsWith(R2_DOMAIN)) {
        return key;
    }

    let cleanKey = key;

    // Extract key from absolute or relative proxy URLs
    if (cleanKey.includes('/api/media/')) {
        cleanKey = cleanKey.substring(cleanKey.indexOf('/api/media/') + 11);
    } else if (cleanKey.includes('/r2-media/')) {
        cleanKey = cleanKey.substring(cleanKey.indexOf('/r2-media/') + 10);
    }

    // Decode URL if it was encoded (e.g., %2F instead of /)
    try {
        cleanKey = decodeURIComponent(cleanKey);
    } catch (e) {
        // Fallback to original
    }

    // If it's still an external URL (starts with http), return it
    if (cleanKey.startsWith('http')) {
        return cleanKey;
    }

    // Ensure key doesn't start with a slash
    cleanKey = cleanKey.startsWith('/') ? cleanKey.substring(1) : cleanKey;
    
    // Return the DIRECT R2 URL (Fastest, supports seeking, sound, and full controls)
    return `${R2_DOMAIN}/${cleanKey}`;
};

export default {
    R2_DOMAIN,
    PROXY_BASE,
    constructProxiedUrl
};
