import express from 'express';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/admin.js';
import { mongoIdValidation } from '../middleware/validation.js';
import Report from '../models/Report.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import logActivity from '../utils/auditLogger.js';

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

        logActivity({
            user: req.user._id,
            username: req.user.username,
            action: 'REPORT_CREATED',
            category: 'content',
            severity: 'warning',
            req,
            targetId,
            details: { targetType, reason, details }
        });

        res.status(201).json({ message: 'Bildiriminiz başarıyla iletildi.', report });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   GET /api/reports
// @desc    Get all reports (Admin only)
// @access  Private (Admin with canManageReports)
router.get('/', protect, requirePermission('canManageReports'), async (req, res) => {
    try {
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
// @access  Private (Admin with canManageReports)
router.put('/:id/status', protect, requirePermission('canManageReports'), mongoIdValidation('id'), async (req, res) => {
    try {
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
// @access  Private (Admin with canManageReports)
router.delete('/:id', protect, requirePermission('canManageReports'), mongoIdValidation('id'), async (req, res) => {
    try {
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
