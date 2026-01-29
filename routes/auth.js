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

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth (Client handles intent)
// @access  Public
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

// Aliases for compatibility (Client will set intent before calling these)
router.get('/google/login', (req, res) => res.redirect('/api/auth/google'));
router.get('/google/register', (req, res) => res.redirect('/api/auth/google'));


// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback -> Redirect to Frontend Processor
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=GoogleAuthFailed' }),
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
            tempProfile: user._isTemp ? {
                displayName: user.displayName,
                avatar: user.avatar
            } : null
        };

        const processToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });

        // Redirect to Frontend "Auth Process" page
        res.redirect(`${process.env.CLIENT_URL}/auth/process?token=${processToken}`);
    }
);

// @route   POST /api/auth/google/validate
// @desc    Validate Google Login/Register Intent
// @access  Public
router.post('/google/validate', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(400).json({ message: 'No token provided' });

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
                preToken: token
            });
        } else {
            // Existing User -> Always Login
            console.log('✨ Smart Auth: Existing User detected -> Auto Login');
            const realToken = generateToken(decoded.id);
            // Fetch fresh user data
            const user = await User.findById(decoded.id);
            return res.json({
                action: 'login',
                token: realToken,
                user: user
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
