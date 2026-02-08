import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   GET /api/admin/verification-requests
// @desc    Get all pending verification requests
// @access  Private/Admin
router.get('/verification-requests', protect, admin, async (req, res) => {
    try {
        const users = await User.find({ 'verificationRequest.status': 'pending' }).select(
            'username email profile verificationRequest'
        );
        res.json(users);
    } catch (error) {
        console.error('Fetch requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/verify-user/:id
// @desc    Approve verification request
// @access  Private/Admin
router.post('/verify-user/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { badgeType } = user.verificationRequest;

        user.isVerified = true;
        user.verificationBadge = badgeType || 'blue';
        user.verificationRequest.status = 'approved';
        user.verificationRequest.processedAt = new Date();

        await user.save();

        // Create Notification
        await Notification.create({
            recipient: user._id,
            type: 'system', // We might need to add 'system' to Notification enum if not exists, or verify logic
            content: `Tebrikler! Hesabınız doğrulandı ve ${badgeType.toUpperCase()} rozetiniz tanımlandı.`,
        });

        res.json({ message: 'User verified successfully', user });
    } catch (error) {
        console.error('Approve verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/reject-verification/:id
// @desc    Reject verification request
// @access  Private/Admin
router.post('/reject-verification/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verificationRequest.status = 'rejected';
        user.verificationRequest.processedAt = new Date();

        await user.save();

        // Create Notification
        await Notification.create({
            recipient: user._id,
            type: 'system',
            content:
                'Üzgünüz, onaylanmış hesap başvurunuz reddedildi. Şartları sağladığınızda tekrar başvurabilirsiniz.',
        });

        res.json({ message: 'Request rejected', user });
    } catch (error) {
        console.error('Reject verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (with search)
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};

        if (q) {
            query = { username: { $regex: q, $options: 'i' } };
        }

        const users = await User.find(query)
            .select('username email profile verificationBadge isVerified createdAt')
            .sort({ createdAt: -1 })
            .limit(50); // Limit to avoid massive payloads

        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/badge
// @desc    Update user verification badge
// @access  Private/Admin
router.put('/users/:id/badge', protect, admin, async (req, res) => {
    try {
        const { badge } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verificationBadge = badge;
        // user.isVerified = badge !== 'none'; // REMOVED to prevent locking out users (isVerified = email verified)

        // If removing badge, maybe reset request status? Optional.
        // If giving badge manually, maybe approve pending request if exists?
        if (badge !== 'none' && user.verificationRequest?.status === 'pending') {
            user.verificationRequest.status = 'approved';
            user.verificationRequest.badgeType = badge;
            user.verificationRequest.processedAt = new Date();
        }

        await user.save();

        res.json({ message: 'Badge updated', user });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
