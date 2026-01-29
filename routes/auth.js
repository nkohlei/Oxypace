import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

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
router.post('/login', async (req, res) => {
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

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                joinedPortals: user.joinedPortals,
                isAdmin: user.isAdmin,
                verificationBadge: user.verificationBadge
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/google/login
// @desc    Google OAuth login (Force account selection)
// @access  Public
router.get('/google/login',
    (req, res, next) => {
        // Set cookie to track flow
        res.cookie('auth_flow_type', 'login', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000 // 5 minutes
        });

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account'
        })(req, res, next);
    }
);

// @route   GET /api/auth/google/register
// @desc    Google OAuth register (Force account selection)
// @access  Public
router.get('/google/register',
    (req, res, next) => {
        // Set cookie to track flow
        res.cookie('auth_flow_type', 'register', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000 // 5 minutes
        });

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account'
        })(req, res, next);
    }
);

// DEPRECATED: Old regular /google route - redirect to login
router.get('/google', (req, res) => res.redirect('/api/auth/google/login'));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    (req, res, next) => {
        console.log('🔗 Google Callback Hit');
        next();
    },
    (req, res, next) => {
        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                console.error('❌ Passport Error:', err);
                return res.redirect(`${process.env.CLIENT_URL}/login?error=ServerError`);
            }

            // Retrieve Flow Type from Cookie
            const flowType = req.cookies['auth_flow_type'] || 'login'; // Default to login if missing
            console.log(`📡 Auth Flow Type (Cookie): ${flowType}`);

            // Clear the cookie
            res.clearCookie('auth_flow_type');

            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=AuthFailed`);
            }

            // --- LOGIC MATRIX ---

            // Case 1: Temp User (New) + Login Flow -> ERROR
            if (user._isTemp && flowType === 'login') {
                console.log('❌ Login attempt by New User -> Rejected');
                return res.redirect(`${process.env.CLIENT_URL}/login?error=AccountNotFound`);
            }

            // Case 2: Temp User (New) + Register Flow -> ONBOARDING
            if (user._isTemp && flowType === 'register') {
                console.log('✅ Register attempt by New User -> Onboarding');
                const preAuthToken = jwt.sign(
                    {
                        googleId: user.googleId,
                        email: user.email,
                        displayName: user.displayName,
                        avatar: user.avatar
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                return res.redirect(`${process.env.CLIENT_URL}/onboarding?preToken=${preAuthToken}`);
            }

            // Case 3: Existing User + ANY Flow -> LOGIN
            if (!user._isTemp) {
                console.log('✅ Existing User -> Logged In');
                const token = generateToken(user._id);
                return res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&isNewUser=false`);
            }

            // Fallback
            res.redirect(`${process.env.CLIENT_URL}/login?error=UnknownState`);

        })(req, res, next);
    }
);

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
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
                joinedPortals: [],
                isAdmin: user.isAdmin,
                verificationBadge: user.verificationBadge
            }
        });

    } catch (error) {
        console.error('Registration completion error:', error);
        res.status(500).json({ message: 'Registration failed or token expired' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set token and expiration (15 minutes)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        try {
            await sendPasswordResetEmail(user.email, user.username, resetCode);
            res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
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
router.post('/reset-password', async (req, res) => {
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

export default router;
