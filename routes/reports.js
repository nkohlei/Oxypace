import express from 'express';
import { protect } from '../middleware/auth.js';
import { mongoIdValidation } from '../middleware/validation.js';
import Report from '../models/Report.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/reports
// @desc    Create a report for a post or user
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { targetType, targetId, reason, details } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: 'Lütfen tüm gerekli alanları doldurun.' });
        }

        if (!['post', 'user'].includes(targetType)) {
            return res.status(400).json({ message: 'Geçersiz bildirim türü.' });
        }

        // Check if target exists
        if (targetType === 'post') {
            const postExists = await Post.findById(targetId);
            if (!postExists) {
                return res.status(404).json({ message: 'Bildirilecek gönderi bulunamadı.' });
            }
        } else {
            const userExists = await User.findById(targetId);
            if (!userExists) {
                return res.status(404).json({ message: 'Bildirilecek kullanıcı bulunamadı.' });
            }
        }

        // Create report
        const report = await Report.create({
            reporter: req.user._id,
            targetType,
            targetPost: targetType === 'post' ? targetId : undefined,
            targetUser: targetType === 'user' ? targetId : undefined,
            reason,
            details
        });

        res.status(201).json({ message: 'Bildiriminiz başarıyla iletildi.', report });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   GET /api/reports
// @desc    Get all reports (Admin only)
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
    try {
        const isOxypace = req.user.username === 'oxypace';
        const isAdmin = req.user.isAdmin || req.user.isTouristAdmin;
        if (!isOxypace && !isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        const reports = await Report.find()
            .populate('reporter', 'username profile.displayName profile.avatar isDeleted')
            .populate({
                path: 'targetPost',
                populate: {
                    path: 'author',
                    select: 'username profile.displayName profile.avatar isDeleted'
                }
            })
            .populate('targetUser', 'username profile.displayName profile.avatar settings.privacy.isPrivate isDeleted')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/reports/:id/status
// @desc    Update report status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const isOxypace = req.user.username === 'oxypace';
        const isAdmin = req.user.isAdmin || req.user.isTouristAdmin;
        if (!isOxypace && !isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        const { status } = req.body;
        if (!['pending', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Geçersiz durum.' });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Bildirim bulunamadı.' });
        }

        res.json({ message: 'Bildirim durumu güncellendi.', report });
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const isOxypace = req.user.username === 'oxypace';
        const isAdmin = req.user.isAdmin || req.user.isTouristAdmin;
        if (!isOxypace && !isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Bildirim bulunamadı.' });
        }

        res.json({ message: 'Bildirim silindi.' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

export default router;
