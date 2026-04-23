/**
 * Centralized Media Configuration
 * 
 * Enforces the correct Cloudflare R2 domain and Koyeb Proxy Base.
 * Hardcoded strings ensure operational stability even if environment variables are misconfigured.
 */

// Cloudflare R2 Public Domain (The 'ham' URL) - HARDCODED as per instructions
export const R2_DOMAIN = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';

// Koyeb API Proxy Base URL - HARDCODED as per instructions
export const PROXY_BASE = 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app/api/media/';

export const constructProxiedUrl = (key) => {
    if (!key) return null;
    
    // If it's already a full URL, return it
    if (key.startsWith('http')) return key;

    // Ensure key doesn't start with a slash
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    
    // Return the DIRECT R2 URL (Fastest, supports seeking, sound, and full controls)
    return `${R2_DOMAIN}/${cleanKey}`;
};

export default {
    R2_DOMAIN,
    PROXY_BASE,
    constructProxiedUrl
};
