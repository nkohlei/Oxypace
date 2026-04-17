import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized Media Configuration
 * 
 * Enforces the correct Cloudflare R2 domain and Koyeb Proxy Base.
 * Hardcoded fallbacks ensure operational stability even if environment variables are misconfigured.
 */

// Cloudflare R2 Public Domain (The 'ham' URL)
export const R2_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev').replace(/\/$/, '');

// Koyeb API Proxy Base URL
export const PROXY_BASE = (process.env.BACKEND_URL || 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app').replace(/\/$/, '') + '/api/media/';

/**
 * Constructs a full proxied URL for a given R2 key.
 * @param {string} key - The R2 storage key (e.g., 'avatars/my-pic.jpg')
 * @returns {string} - The full proxied URL
 */
export const constructProxiedUrl = (key) => {
    if (!key) return null;
    
    // Ensure key doesn't start with a slash
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    
    // 1. Build the Raw R2 URL
    const rawR2Url = `${R2_DOMAIN}/${cleanKey}`;
    
    // 2. Encode and wrap with Proxy Base
    return `${PROXY_BASE}${encodeURIComponent(rawR2Url)}`;
};

export default {
    R2_DOMAIN,
    PROXY_BASE,
    constructProxiedUrl
};
