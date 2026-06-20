import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SystemSettings from '../models/SystemSettings.js';
import BannedIP from '../models/BannedIP.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';
import { authLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rate-limit.js';
import {
    registerValidation,
    loginValidation,
    passwordResetValidation,
    newPasswordValidation,
} from '../middleware/validation.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id, isAdmin = false) => {
    return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerLimiter, registerValidation, async (req, res) => {
    try {
        const { email, username, password, bannedDevice } = req.body;

        // Check Banned Device
        if (bannedDevice) {
            try {
                const decoded = jwt.verify(bannedDevice, process.env.JWT_SECRET);
                if (decoded.banned) {
                    if (!decoded.expiresAt || new Date(decoded.expiresAt) > new Date()) {
                        return res.status(403).json({ message: 'Bu cihaz platform kuralları ihlali nedeniyle engellenmiştir.' });
                    }
                }
            } catch (err) {
                // Invalid token
            }
        }

        // Check Banned IP
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const ipBan = await BannedIP.findOne({ ip: clientIP });
        if (ipBan) {
            if (!ipBan.expiresAt || new Date(ipBan.expiresAt) > new Date()) {
                return res.status(403).json({ message: 'Bu IP adresi platform kuralları ihlali nedeniyle engellenmiştir.' });
            } else {
                await BannedIP.deleteOne({ _id: ipBan._id });
            }
        }

        // Validation
        if (!email || !username || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = await User.create({
            email,
            username,
            password,
            verificationToken,
            profile: {
                displayName: username,
            },
        });

        // Send verification email
        let emailSent = false;
        try {
            await sendVerificationEmail(email, username, verificationToken);
            emailSent = true;
        } catch (emailError) {
            console.error('⚠️  Email sending failed (auto-verifying user):', emailError.message);
            // Auto-verify user if email service is not configured
            user.isVerified = true;
            user.verificationToken = undefined;
            await user.save();
        }

        res.status(201).json({
            message: emailSent
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful! Your account has been automatically verified.',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully! You can now log in.',
            success: true,
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email }).populate('joinedPortals', 'name avatar');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if soft-deleted
        if (user.isDeleted) {
            return res.status(403).json({
                isDeleted: true,
                message: 'Bu hesap silinmiştir. Kurtarmak istiyor musunuz?',
                email: user.email
            });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }

        // Check if user is banned
        if (user.isBanned) {
            // Check if ban is expired
            if (user.banExpiresAt && user.banExpiresAt < new Date()) {
                user.isBanned = false;
                user.banReason = '';
                user.banExpiresAt = null;
                await user.save();
            } else {
                const bannedDeviceToken = jwt.sign(
                    { banned: true, expiresAt: user.banExpiresAt },
                    process.env.JWT_SECRET
                );
                return res.status(403).json({
                    isBanned: true,
                    banReason: user.banReason || 'Hesabınız platform kuralları ihlali nedeniyle engellenmiştir.',
                    banExpiresAt: user.banExpiresAt,
                    bannedDeviceToken
                });
            }
        }

        // Save last active IP address
        const incomingIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const prevIP = user.lastIP;

        if (prevIP && prevIP !== incomingIP) {
            try {
                const notification = await Notification.create({
                    recipient: user._id,
                    type: 'security',
                    content: 'Hesabınıza farklı bir IP adresinden giriş yapıldı.',
                    link: '/settings',
                });

                const io = req.app.get('io');
                if (io) {
                    const populated = await Notification.findById(notification._id)
                        .populate('sender', 'username profile.displayName profile.avatar');
                    io.to(user._id.toString()).emit('newNotification', populated);
                }
            } catch (err) {
                console.error('Security login notification error:', err);
            }
        }

        user.lastIP = incomingIP;
        await user.save();

        // Generate token
        const token = generateToken(user._id, user.isAdmin);

        res.cookie('token', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                joinedPortals: user.joinedPortals,
                isAdmin: user.isAdmin,
                verificationBadge: user.verificationBadge,
                customBadge: user.customBadge,
                securityQuestionsConfigured: user.securityAnswers && user.securityAnswers.length >= 2,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth (Client handles intent)
// @access  Public
router.get(
    '/google',
    (req, res, next) => {
        const state = req.query.mobile === 'true' ? 'mobile' : 'web';
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account',
            state: state,
        })(req, res, next);
    }
);

// Aliases for compatibility (Client will set intent before calling these)
router.get('/google/login', (req, res) => res.redirect('/api/auth/google'));
router.get('/google/register', (req, res) => res.redirect('/api/auth/google'));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback -> Redirect to Frontend Processor
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login?error=GoogleAuthFailed',
    }),
    (req, res) => {
        // User here is either a real DB user or a Temp Link object from Passport
        const user = req.user;

        // Generate a temporary "Process Token" to hand off to the frontend
        // This token contains the identity and whether it's a new or existing user
        const payload = {
            id: user._isTemp ? null : user._id,
            googleId: user.googleId,
            email: user.email,
            isNew: !!user._isTemp,
            tempProfile: user._isTemp
                ? {
                      displayName: user.displayName,
                      avatar: user.avatar,
                  }
                : null,
        };

        const processToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });

        const state = req.query.state;
        
        if (state === 'mobile') {
            // Redirect to Deep Link for Capacitor app
            res.redirect(`oxypace://auth/process?token=${processToken}`);
        } else {
            // Redirect to Frontend "Auth Process" page for Web
            res.redirect(`${process.env.CLIENT_URL}/auth/process?token=${processToken}`);
        }
    }
);

// @route   POST /api/auth/google/validate
// @desc    Validate Google Login/Register Intent
// @access  Public
router.post('/google/validate', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // SMART AUTH LOGIC:
        // Use the User's existence as the ultimate source of truth.
        // If they are new, they MUST go to onboarding (even if they clicked 'Login').
        // If they exist, they MUST login (even if they clicked 'Register').

        if (decoded.isNew) {
            // New User -> Always Onboarding
            console.log('✨ Smart Auth: New User detected -> Directing to Onboarding');
            return res.json({
                action: 'onboarding',
                preToken: token,
            });
        } else {
            // Existing User -> Always Login
            console.log('✨ Smart Auth: Existing User detected -> Auto Login');
            // Fetch fresh user data with populated portals
            const user = await User.findById(decoded.id).populate('joinedPortals', 'name avatar');

            if (user && user.isBanned) {
                if (user.banExpiresAt && user.banExpiresAt < new Date()) {
                    user.isBanned = false;
                    user.banReason = '';
                    user.banExpiresAt = null;
                    await user.save();
                } else {
                    return res.status(403).json({
                        isBanned: true,
                        banReason: user.banReason || 'Hesabınız platform kuralları ihlali nedeniyle engellenmiştir.',
                        banExpiresAt: user.banExpiresAt
                    });
                }
            }

            const realToken = generateToken(decoded.id, user.isAdmin);

            res.cookie('token', realToken, {
                httpOnly: false,
                secure: true,
                sameSite: 'Lax',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            return res.json({
                action: 'login',
                token: realToken,
                user: user,
            });
        }
    } catch (error) {
        console.error('Validation Error:', error);
        res.status(500).json({ message: 'Authentication validation failed' });
    }
});

// @route   POST /api/auth/google/complete
// @desc    Complete registration for Google users
// @access  Public
router.post('/google/complete', async (req, res) => {
    try {
        const { preToken, username } = req.body;

        if (!preToken || !username) {
            return res.status(400).json({ message: 'Missing token or username' });
        }

        // Verify pre-auth token
        const decoded = jwt.verify(preToken, process.env.JWT_SECRET);
        const { googleId, email, displayName, avatar } = decoded;

        // Double check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already registered' });
        }

        // Check if username taken
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Create User
        user = await User.create({
            googleId,
            email,
            username,
            isVerified: true,
            profile: {
                displayName: displayName || username,
                avatar: avatar || '',
            },
        });

        // Generate real auth token
        const token = generateToken(user._id, user.isAdmin);

        res.cookie('token', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                joinedPortals: [],
                isAdmin: user.isAdmin,
                verificationBadge: user.verificationBadge,
                customBadge: user.customBadge,
            },
        });
    } catch (error) {
        console.error('Registration completion error:', error);
        res.status(500).json({ message: 'Registration failed or token expired' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', passwordResetLimiter, passwordResetValidation, async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({
                message: 'If an account exists with this email, a reset code has been sent.',
            });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set token and expiration (15 minutes)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        try {
            await sendPasswordResetEmail(user.email, user.username, resetCode);
            res.json({
                message: 'If an account exists with this email, a reset code has been sent.',
            });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Error sending email' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', newPasswordValidation, async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/maintenance-login
// @desc    Temporary maintenance-mode login with passphrase → auto-login as @oxypace
// @access  Public
router.post('/maintenance-login', async (req, res) => {
    try {
        const { passphrase } = req.body;
        const MAINTENANCE_PASSPHRASE = process.env.MAINTENANCE_PASSPHRASE;

        if (!MAINTENANCE_PASSPHRASE || !passphrase || passphrase !== MAINTENANCE_PASSPHRASE) {
            return res.status(401).json({ message: 'Geçersiz erişim parolası' });
        }

        // Find the @oxypace account
        const user = await User.findOne({ username: 'oxypace' }).populate('joinedPortals', 'name avatar');

        if (!user || !user.isAdmin) {
            return res.status(404).json({ message: 'Sistem yöneticisi hesabı bulunamadı veya yetkisiz' });
        }

        const token = generateToken(user._id, user.isAdmin);

        res.cookie('token', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                joinedPortals: user.joinedPortals,
                isAdmin: user.isAdmin,
                verificationBadge: user.verificationBadge,
                customBadge: user.customBadge,
            },
        });
    } catch (error) {
        console.error('Maintenance login error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @route   GET /api/auth/maintenance-status
// @desc    Get current maintenance status (Public/Edge Function check)
// @access  Public
router.get('/maintenance-status', async (req, res) => {
    try {
        let setting = await SystemSettings.findOne({ key: 'maintenance_mode' });
        const active = setting ? !!setting.value?.active : false;
        res.json({ active });
    } catch (error) {
        console.error('Fetch public maintenance status error:', error);
        res.status(500).json({ active: false });
    }
});

// @route   POST /api/auth/recover-init
// @desc    Initiate recovery flow and retrieve questions
// @access  Public
router.post('/recover-init', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Lütfen e-posta ve şifre girin.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        if (!user.isDeleted) {
            return res.status(400).json({ message: 'Bu hesap silinmemiş, normal şekilde giriş yapabilirsiniz.' });
        }

        if (user.recoveryStatus === 'pending' || user.recoveryStatus === 'rejected') {
            return res.status(400).json({
                message: `Hesabı kurtarmak için en fazla 1 kez başvuru formu doldurabilirsiniz. Mevcut durum: ${user.recoveryStatus === 'pending' ? 'Beklemede' : 'Reddedildi'}.`
            });
        }

        if (user.recoveryAttempts >= 3) {
            return res.status(400).json({ message: 'Güvenlik soruları 3 kez yanlış yanıtlandığı için kurtarma süreci kilitlenmiştir.' });
        }

        const questions = user.securityAnswers.map(qa => qa.question);
        if (questions.length < 2) {
            return res.status(400).json({ message: 'Bu hesapta tanımlı güvenlik soruları bulunamadı. Lütfen destek ekibiyle iletişime geçin.' });
        }

        res.json({ questions });
    } catch (error) {
        console.error('Recover init error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @route   POST /api/auth/recover-verify
// @desc    Verify security questions answers
// @access  Public
router.post('/recover-verify', async (req, res) => {
    try {
        const { email, password, answers } = req.body;
        if (!email || !password || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        if (!user.isDeleted) {
            return res.status(400).json({ message: 'Bu hesap silinmemiş.' });
        }

        if (user.recoveryStatus === 'pending' || user.recoveryStatus === 'rejected') {
            return res.status(400).json({ message: 'Kurtarma başvurusu hakkınız tükenmiştir.' });
        }

        if (user.recoveryAttempts >= 3) {
            return res.status(400).json({ message: 'Güvenlik soruları 3 kez yanlış yanıtlandığı için kurtarma süreci kilitlenmiştir.' });
        }

        // Compare answers
        let allCorrect = true;
        for (const submitted of answers) {
            const dbAnswer = user.securityAnswers.find(
                sa => sa.question.trim().toLowerCase() === submitted.question.trim().toLowerCase()
            );

            if (!dbAnswer) {
                allCorrect = false;
                break;
            }

            const cleanSubmitted = submitted.answer.trim().toLowerCase();
            const cleanDb = dbAnswer.answer.trim();
            let isAnswerCorrect = false;

            if (cleanDb.startsWith('$2a$') || cleanDb.startsWith('$2b$') || cleanDb.startsWith('$2y$')) {
                isAnswerCorrect = await bcrypt.compare(cleanSubmitted, cleanDb);
            } else {
                isAnswerCorrect = cleanSubmitted === cleanDb.toLowerCase();
            }

            if (!isAnswerCorrect) {
                allCorrect = false;
                break;
            }
        }

        if (allCorrect) {
            res.json({ success: true, message: 'Doğrulama başarılı. Gerekçe sayfasına geçebilirsiniz.' });
        } else {
            user.recoveryAttempts += 1;
            await user.save();

            const remaining = 3 - user.recoveryAttempts;
            if (remaining <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Güvenlik soruları 3 kez yanlış yanıtlandığı için kurtarma süreci kilitlenmiştir.',
                    remainingAttempts: 0
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Güvenlik soruları hatalı. Kalan hak: ${remaining}`,
                    remainingAttempts: remaining
                });
            }
        }
    } catch (error) {
        console.error('Recover verify error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @route   POST /api/auth/recover-request
// @desc    Submit account recovery request
// @access  Public
router.post('/recover-request', async (req, res) => {
    try {
        const { email, password, securityAnswers, recoveryReason } = req.body;
        if (!email || !password || !securityAnswers || !recoveryReason) {
            return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        if (!user.isDeleted) {
            return res.status(400).json({ message: 'Bu hesap silinmemiş.' });
        }

        if (user.recoveryStatus === 'pending' || user.recoveryStatus === 'rejected') {
            return res.status(400).json({ message: 'Kurtarma başvurusu hakkınız tükenmiştir.' });
        }

        if (user.recoveryAttempts >= 3) {
            return res.status(400).json({ message: 'Güvenlik soruları 3 kez yanlış yanıtlandığı için kurtarma süreci kilitlenmiştir.' });
        }

        // Compare answers
        let allCorrect = true;
        for (const submitted of securityAnswers) {
            const dbAnswer = user.securityAnswers.find(
                sa => sa.question.trim().toLowerCase() === submitted.question.trim().toLowerCase()
            );

            if (!dbAnswer) {
                allCorrect = false;
                break;
            }

            const cleanSubmitted = submitted.answer.trim().toLowerCase();
            const cleanDb = dbAnswer.answer.trim();
            let isAnswerCorrect = false;

            if (cleanDb.startsWith('$2a$') || cleanDb.startsWith('$2b$') || cleanDb.startsWith('$2y$')) {
                isAnswerCorrect = await bcrypt.compare(cleanSubmitted, cleanDb);
            } else {
                isAnswerCorrect = cleanSubmitted === cleanDb.toLowerCase();
            }

            if (!isAnswerCorrect) {
                allCorrect = false;
                break;
            }
        }

        if (!allCorrect) {
            user.recoveryAttempts += 1;
            await user.save();
            const remaining = 3 - user.recoveryAttempts;
            return res.status(400).json({
                message: remaining <= 0 
                    ? 'Güvenlik soruları 3 kez yanlış yanıtlandığı için kurtarma süreci kilitlenmiştir.' 
                    : `Güvenlik soruları hatalı. Kalan hak: ${remaining}`
            });
        }

        user.recoveryStatus = 'pending';
        user.recoveryReason = recoveryReason;
        await user.save();

        res.json({ message: 'Kurtarma talebiniz başarıyla alındı. Yönetici onayının ardından bilgilendirileceksiniz.' });
    } catch (error) {
        console.error('Recovery request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
