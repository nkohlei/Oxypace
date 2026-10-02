import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // CRIT-3: Token invalidation check — reject tokens issued before tokenValidFrom.
            // tokenValidFrom is updated on password change, ban, or forced logout to
            // instantly revoke all prior sessions without a token blacklist.
            if (req.user.tokenValidFrom) {
                const tokenIssuedAt = decoded.iat * 1000; // JWT iat is in seconds, convert to ms
                if (tokenIssuedAt < req.user.tokenValidFrom.getTime()) {
                    return res.status(401).json({ message: 'Session expired. Please log in again.' });
                }
            }

            // Real-time ban check — even if token is cryptographically valid, block banned users immediately
            if (req.user.isBanned) {
                const banExpired = req.user.banExpiresAt && req.user.banExpiresAt < new Date();
                if (!banExpired) {
                    return res.status(403).json({ message: 'Hesabınız engellenmiştir.' });
                }
            }

            // Ghost Mode / Taklit Modu kısıtlaması (Read-Only)
            if (decoded.isGhost) {
                req.user.isGhost = true;

                // Allow safe notification read sync PUT requests through to handler so they return 200 without mutating DB
                const isSafeNotificationRead = req.method === 'PUT' && (
                    req.originalUrl.includes('/notifications/read') ||
                    req.originalUrl.includes('/notifications/portal/')
                );

                if (!isSafeNotificationRead && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                    return res.status(403).json({ message: 'Taklit modunda (Ghost Mode) yazma işlemleri kısıtlanmıştır.' });
                }
            }

            next();
        } catch (error) {
            // Differentiate between token errors and system errors (like DB connection)
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            } else {
                // HIGH-1 fix: do NOT expose internal error details to the client
                console.error('Auth Middleware Error:', error);
                return res.status(500).json({ message: 'Authentication service error. Please try again later.' });
            }
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (req.user) {
                // Token invalidation check for optional auth as well
                if (req.user.tokenValidFrom) {
                    const tokenIssuedAt = decoded.iat * 1000;
                    if (tokenIssuedAt < req.user.tokenValidFrom.getTime()) {
                        req.user = undefined; // Treat as unauthenticated
                        return next();
                    }
                }

                if (decoded.isGhost) {
                    req.user.isGhost = true;
                    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                        return res.status(403).json({ message: 'Taklit modunda (Ghost Mode) yazma işlemleri kısıtlanmıştır.' });
                    }
                }
            }
        } catch (error) {
            // Token failed - just continue without user
            console.error('Optional auth error (token invalid):', error.message);
        }
    }
    // If no token, or token failed, we just proceed. req.user will be undefined.
    next();
};
