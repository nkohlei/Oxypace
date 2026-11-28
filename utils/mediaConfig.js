/**
 * Centralized Media Configuration
 * 
 * Enforces the correct Cloudflare R2 domain and Koyeb Proxy Base.
 * Hardcoded strings ensure operational stability even if environment variables are misconfigured.
 */

// Cloudflare R2 Custom Domain (Global Edge CDN, HTTP/3 QUIC, Zero Egress, Unblocked in TR)
const LEGACY_R2_DEV = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
const rawEnvDomain = (typeof process !== 'undefined' && process.env.R2_PUBLIC_DOMAIN)
    ? process.env.R2_PUBLIC_DOMAIN.trim().replace(/\/+$/, '')
    : '';
export const R2_DOMAIN = (rawEnvDomain && !rawEnvDomain.includes('.r2.dev'))
    ? rawEnvDomain
    : 'https://cdn.oxypace.com.tr';

// Koyeb API Proxy Base URL - Dynamic with fallback to new domain
const backendBase = (typeof process !== 'undefined' && process.env.BACKEND_URL) 
    ? process.env.BACKEND_URL 
    : 'https://api.oxypace.com.tr';
export const PROXY_BASE = `${backendBase.replace(/\/$/, '')}/api/media/`;

export const constructProxiedUrl = (key) => {
    if (!key) return null;

    let cleanKey = String(key).trim();

    // Strip custom CDN domain or legacy r2.dev domain so we always normalize slashes cleanly
    if (cleanKey.startsWith(R2_DOMAIN)) {
        cleanKey = cleanKey.substring(R2_DOMAIN.length);
    } else if (cleanKey.startsWith('https://cdn.oxypace.com.tr')) {
        cleanKey = cleanKey.substring('https://cdn.oxypace.com.tr'.length);
    } else if (cleanKey.startsWith(LEGACY_R2_DEV)) {
        cleanKey = cleanKey.substring(LEGACY_R2_DEV.length);
    }

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
    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
        return cleanKey;
    }

    // Strip ALL leading slashes and collapse any accidental double slashes (prevents R2 404 on //posts/...)
    cleanKey = cleanKey.replace(/^\/+/, '').replace(/\/{2,}/g, '/');

    // Return the DIRECT R2 custom CDN URL
    return `${R2_DOMAIN}/${cleanKey}`;
};

export default {
    R2_DOMAIN,
    PROXY_BASE,
    constructProxiedUrl
};
