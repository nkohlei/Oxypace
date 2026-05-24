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

            // Ghost Mode / Taklit Modu kısıtlaması (Read-Only)
            if (decoded.isGhost) {
                req.user.isGhost = true;
                if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                    return res.status(403).json({ message: 'Taklit modunda (Ghost Mode) yazma işlemleri kısıtlanmıştır.' });
                }
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);

            // Differentiate between token errors and system errors (like DB connection)
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            } else {
                // Return actual system error for debugging (remove in prod if needed, but helpful now)
                return res.status(500).json({ message: 'Auth System Error: ' + error.message });
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
            if (req.user && decoded.isGhost) {
                req.user.isGhost = true;
                if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                    return res.status(403).json({ message: 'Taklit modunda (Ghost Mode) yazma işlemleri kısıtlanmıştır.' });
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
