import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import ContactMessage from '../models/ContactMessage.js';
import localUpload from '../middleware/localUpload.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Helper: Get or Create System Support Account
 */
const getSystemSupportAccount = async () => {
    let supportAccount = await User.findOne({ username: 'oxypace', isSystemAccount: true });
    
    if (!supportAccount) {
        // Try finding by username only and updating to system if needed
        supportAccount = await User.findOne({ username: 'oxypace' });
        if (supportAccount) {
            supportAccount.isSystemAccount = true;
            supportAccount.profile.displayName = 'Oxypace Destek';
            await supportAccount.save();
        } else {
            // Create new
            supportAccount = await User.create({
                username: 'oxypace',
                email: 'support@oxypace.com',
                password: new mongoose.Types.ObjectId().toString(), // Random password
                isSystemAccount: true,
                isVerified: true,
                verificationBadge: 'special',
                profile: {
                    displayName: 'Oxypace Destek',
                    bio: 'Oxypace Resmi Destek ve Geri Bildirim Hesabı',
                    avatar: '/system/support-avatar.png' // Needs to exist or be served
                }
            });
        }
    }
    return supportAccount;
};

// @route   POST /api/feedback/submit
// @desc    Submit new feedback
// @access  Private
router.post('/submit', protect, localUpload.array('files', 5), async (req, res) => {
    try {
        const { category, subject, message } = req.body;

        if (!category || !subject || !message) {
            return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun.' });
        }

        const fileUrls = req.files ? req.files.map(file => `/uploads/feedback/${file.filename}`) : [];

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

        // 2. Send System Message
        const supportAccount = await getSystemSupportAccount();
        
        const systemMessage = await Message.create({
            sender: supportAccount._id,
            recipient: feedback.user._id,
            content: `Merhaba ${feedback.user.username},\n\n"${feedback.subject}" konulu geri bildiriminiz için teşekkür ederiz. Ekibimizin yanıtı şu şekildedir:\n\n---\n${response}\n---\n\nHerhangi başka bir sorunuz olursa buradan yazabilirsiniz.`,
        });

        // Emit socket if available
        const io = req.app.get('io');
        if (io) {
            const populatedMsg = await Message.findById(systemMessage._id)
                .populate('sender', 'username profile.displayName profile.avatar createdAt isSystemAccount')
                .populate('recipient', 'username profile.displayName profile.avatar createdAt');
            
            io.to(feedback.user._id.toString()).emit('newMessage', populatedMsg);
        }

        res.json({ message: 'Yanıt gönderildi.', feedback });
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
            // Check if already migrated (optional check)
            const exists = await Feedback.findOne({
                user: msg.user,
                message: msg.message,
                createdAt: msg.createdAt
            });

            if (!exists) {
                await Feedback.create({
                    user: msg.user,
                    category: 'Genel İletişim',
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
