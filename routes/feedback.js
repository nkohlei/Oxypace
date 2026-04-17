import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import ContactMessage from '../models/ContactMessage.js';
import upload from '../middleware/upload.js';
import mongoose from 'mongoose';
import { constructProxiedUrl } from '../utils/mediaConfig.js';
import Notification from '../models/Notification.js';

const router = express.Router();

/**
 * Helper: Get or Create System Support Account
 */
const getSystemSupportAccount = async () => {
    let supportAccount = await User.findOne({ username: 'oxypace_support', isSystemAccount: true });
    
    if (!supportAccount) {
        // Create new
        supportAccount = await User.create({
            username: 'oxypace_support',
            email: 'support@oxypace.com',
            password: new mongoose.Types.ObjectId().toString(), // Random password
            isSystemAccount: true,
            isVerified: true,
            verificationBadge: 'special',
            profile: {
                displayName: 'Oxypace Destek',
                bio: 'Oxypace Resmi Destek ve Geri Bildirim Hesabı',
                avatar: '/system/support_avatar.png'
            }
        });
    } else {
        // Ensure properties are up to date even if account exists
        if (supportAccount.profile.displayName !== 'Oxypace Destek' || supportAccount.profile.avatar !== '/system/support_avatar.png') {
            supportAccount.profile.displayName = 'Oxypace Destek';
            supportAccount.profile.avatar = '/system/support_avatar.png';
            await supportAccount.save();
        }
    }
    return supportAccount;
};

// @route   POST /api/feedback/submit
// @desc    Submit new feedback
// @access  Private
router.post('/submit', protect, upload.array('files', 5), async (req, res) => {
    try {
        const { category, subject, message } = req.body;

        if (!category || !subject || !message) {
            return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun.' });
        }

        const fileUrls = req.files ? req.files.map(file => {
            return constructProxiedUrl(file.key);
        }) : [];
        console.log('📬 Feedback attachment URLs:', fileUrls);

        const feedback = await Feedback.create({
            user: req.user._id,
            category,
            subject,
            message,
            files: fileUrls,
            status: 'new'
        });

        res.status(201).json({ message: 'Geri bildiriminiz başarıyla iletildi.', feedback });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ message: 'Geri bildirim gönderilirken bir hata oluştu.' });
    }
});

// @route   GET /api/feedback/me
// @desc    Get user's own feedback history
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        console.error('Fetch my feedback error:', error);
        res.status(500).json({ message: 'Geri bildirimleriniz alınamadı.' });
    }
});

// @route   GET /api/feedback/admin/list
// @desc    Get all feedback for admins
// @access  Private/Admin
router.get('/admin/list', protect, admin, async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('user', 'username profile.displayName profile.avatar')
            .populate('repliedBy', 'username profile.displayName')
            .sort({ createdAt: -1 });

        res.json(feedbacks);
    } catch (error) {
        console.error('Feedback list error:', error);
        res.status(500).json({ message: 'Listeleme hatası.' });
    }
});

// @route   POST /api/feedback/admin/reply/:id
// @desc    Admin reply to feedback
// @access  Private/Admin
router.post('/admin/reply/:id', protect, admin, async (req, res) => {
    try {
        // Only the main 'oxypace' admin can reply
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu işlem için sadece ana yönetici hesabı yetkilidir.' });
        }

        const { response } = req.body;
        if (!response) {
            return res.status(400).json({ message: 'Lütfen bir yanıt yazın.' });
        }

        const feedback = await Feedback.findById(req.params.id).populate('user');
        if (!feedback) {
            return res.status(404).json({ message: 'Geri bildirim bulunamadı.' });
        }

        // 1. Update feedback status
        feedback.adminResponse = response;
        feedback.status = 'replied';
        feedback.repliedBy = req.user._id;
        await feedback.save();

        // 2. Send System Message (only if user exists)
        if (feedback.user) {
            const supportAccount = await getSystemSupportAccount();
            const ticketIdSnippet = feedback._id.toString().substring(feedback._id.toString().length - 6);
            
            const systemMessage = await Message.create({
                sender: supportAccount._id,
                recipient: feedback.user._id,
                content: `Geri bildiriminiz (#${ticketIdSnippet}) hakkında bir yanıt paylaşıldı:\n\n---\n${response}\n---\n\nBu mesaj sistem tarafından otomatik gönderilmiştir, lütfen doğrudan yanıt vermeyiniz.`,
            });

            // Emit socket if available
            const io = req.app.get('io');
            if (io) {
                const populatedMsg = await Message.findById(systemMessage._id)
                    .populate('sender', 'username profile.displayName profile.avatar createdAt isSystemAccount')
                    .populate('recipient', 'username profile.displayName profile.avatar createdAt');
                
                io.to(feedback.user._id.toString()).emit('newMessage', populatedMsg);

                // 3. Create Notification from Support Account
                try {
                    const notification = await Notification.create({
                        recipient: feedback.user._id,
                        sender: supportAccount._id,
                        type: 'message',
                    });

                    const populatedNotif = await notification.populate(
                        'sender',
                        'username profile.displayName profile.avatar'
                    );
                    io.to(feedback.user._id.toString()).emit('newNotification', populatedNotif);
                } catch (notifErr) {
                    console.error('Feedback reply notification failed:', notifErr);
                }
            }
        }

        res.json({ message: 'Yanıt kaydedildi.', feedback });
    } catch (error) {
        console.error('Feedback reply error:', error);
        res.status(500).json({ message: 'Yanıt gönderilirken hata oluştu.' });
    }
});

// @route   POST /api/feedback/admin/migrate
// @desc    Migrate old ContactMessages to Feedback
// @access  Private/Admin
router.post('/admin/migrate', protect, admin, async (req, res) => {
    try {
        const oldMessages = await ContactMessage.find();
        
        const migrationResults = {
            total: oldMessages.length,
            migrated: 0,
            skipped: 0
        };

        for (const msg of oldMessages) {
            // Check if already migrated
            const exists = await Feedback.findOne({
                user: msg.user,
                message: msg.message,
                createdAt: msg.createdAt
            });

            if (!exists) {
                // Determine category mapping
                let category = 'Genel İletişim';
                if (msg.subject === 'Geribildirim') category = 'Öneri';
                if (msg.subject === 'Sikayet') category = 'Şikayet';
                if (msg.subject === 'Destek') category = 'Hata Bildirimi';

                await Feedback.create({
                    user: msg.user || null, // Allow legacy orphans
                    category,
                    subject: msg.subject || 'Eski İletişim Formu',
                    message: msg.message,
                    status: msg.status === 'unread' ? 'new' : 'reviewed',
                    createdAt: msg.createdAt
                });
                migrationResults.migrated++;
            } else {
                migrationResults.skipped++;
            }
        }

        res.json({ message: 'Taşıma işlemi tamamlandı.', results: migrationResults });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Veri taşıma sırasında hata oluştu.' });
    }
});

export default router;
