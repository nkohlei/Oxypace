import helmet from 'helmet';

/**
 * Helmet Security Middleware Configuration
 * Provides HTTP security headers to protect against common attacks
 */
export const helmetConfig = helmet({
    // Content Security Policy - Prevents XSS attacks
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            connectSrc: [
                "'self'",
                'https://accounts.google.com',
                'https://oauth2.googleapis.com',
                'wss:',
                'ws:',
                process.env.CLIENT_URL || 'http://localhost:5173',
            ],
            frameSrc: ["'self'", 'https://accounts.google.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    // X-Content-Type-Options: nosniff
    noSniff: true,
    // X-Frame-Options: DENY (Clickjacking protection)
    frameguard: { action: 'deny' },
    // X-XSS-Protection (legacy browsers)
    xssFilter: true,
    // Strict-Transport-Security (HSTS)
    hsts:
        process.env.NODE_ENV === 'production'
            ? {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
            }
            : false,
    // Referrer-Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    // X-Download-Options (IE)
    ieNoOpen: true,
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    // Cross-Origin-Resource-Policy - Allow cross-origin resource loading for media
    crossOriginResourcePolicy: false,
});

export default helmetConfig;
