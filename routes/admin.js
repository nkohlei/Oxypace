import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ContactMessage from '../models/ContactMessage.js';
import SystemSettings from '../models/SystemSettings.js';
import BannedIP from '../models/BannedIP.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   GET /api/admin/pending-count
// @desc    Get total count of items requiring admin attention
// @access  Private/Admin
router.get('/pending-count', protect, admin, async (req, res) => {
    try {
        const [pendingVerifications, unreadMessages] = await Promise.all([
            User.countDocuments({ 'verificationRequest.status': 'pending' }),
            req.user.username === 'oxypace' ? ContactMessage.countDocuments({ status: 'unread' }) : 0
        ]);
        
        res.json({ count: pendingVerifications + unreadMessages });
    } catch (error) {
        console.error('Fetch pending count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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
        const systemEnabled = user.settings?.notifications?.system !== false;
        if (systemEnabled) {
            await Notification.create({
                recipient: user._id,
                type: 'system', // We might need to add 'system' to Notification enum if not exists, or verify logic
                content: `Tebrikler! Hesabınız doğrulandı ve ${badgeType.toUpperCase()} rozetiniz tanımlandı.`,
            });
        }

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
        const systemEnabled = user.settings?.notifications?.system !== false;
        if (systemEnabled) {
            await Notification.create({
                recipient: user._id,
                type: 'system',
                content:
                    'Üzgünüz, onaylanmış hesap başvurunuz reddedildi. Şartları sağladığınızda tekrar başvurabilirsiniz.',
            });
        }

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
            .select('username email profile verificationBadge isVerified isBanned banReason banExpiresAt createdAt')
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

        // Validate badge input
        if (badge === undefined || badge === null || typeof badge !== 'string') {
            return res.status(400).json({ message: 'Geçersiz rozet değeri.' });
        }

        const sanitizedBadge = badge.trim().toLowerCase();
        if (sanitizedBadge.length > 50) {
            return res.status(400).json({ message: 'Rozet slug çok uzun.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verificationBadge = sanitizedBadge;

        // If giving badge manually, approve pending request if exists
        if (sanitizedBadge !== 'none' && user.verificationRequest?.status === 'pending') {
            user.verificationRequest.status = 'approved';
            user.verificationRequest.badgeType = sanitizedBadge;
            user.verificationRequest.processedAt = new Date();
        }

        await user.save();
        res.json({ message: 'Badge updated', user });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/contact-messages
// @desc    Get all contact messages (Only for oxypace)
// @access  Private/Admin
router.get('/contact-messages', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu alana sadece baş yönetici erişebilir.' });
        }

        const messages = await ContactMessage.find()
            .populate('user', 'username profile.displayName profile.avatar')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error('Fetch contact messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/contact-messages/:id/status
// @desc    Update contact message status
// @access  Private/Admin
router.put('/contact-messages/:id/status', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu alana sadece baş yönetici erişebilir.' });
        }

        const { status } = req.body;
        const message = await ContactMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Mesaj bulunamadı' });
        }

        message.status = status;
        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Update contact message status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/portals
// @desc    Get all portals (with search)
// @access  Private/Admin
router.get('/portals', protect, admin, async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};

        if (q) {
            query = { name: { $regex: q, $options: 'i' } };
        }

        const portals = await import('../models/Portal.js').then(m => m.default.find(query)
            .select('name description owner avatar banner themeColor isVerified badges status statusReason suspendedUntil warnings alerts isNSFW createdAt members')
            .populate('owner', 'username profile.displayName')
            .sort({ createdAt: -1 })
            .limit(50));

        res.json(portals);
    } catch (error) {
        console.error('Fetch portals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/portals/:id
// @desc    Update portal status/badges
// @access  Private/Admin
router.put('/portals/:id', protect, admin, async (req, res) => {
    try {
        const { status, badges, isVerified } = req.body;
        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        // Validate status value
        const ALLOWED_STATUSES = ['active', 'suspended', 'closed'];
        if (status) {
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({ message: 'Geçersiz durum değeri.' });
            }
            portal.status = status;
        }

        if (req.body.statusReason !== undefined) {portal.statusReason = String(req.body.statusReason).slice(0, 500);}
        if (req.body.suspendedUntil !== undefined) {portal.suspendedUntil = req.body.suspendedUntil;}

        // Clear suspendedUntil when activating
        if (status === 'active') {
            portal.suspendedUntil = null;
            portal.statusReason = '';
        }

        // Validate badges array
        if (badges) {
            if (!Array.isArray(badges) || badges.some(b => typeof b !== 'string')) {
                return res.status(400).json({ message: 'Rozetler dizi formatında olmalı.' });
            }
            portal.badges = badges.map(b => b.trim().toLowerCase().slice(0, 50));
        }

        if (typeof isVerified === 'boolean') {portal.isVerified = isVerified;}
        if (typeof req.body.isNSFW === 'boolean') {portal.isNSFW = req.body.isNSFW;}

        await portal.save();
        res.json({ message: 'Portal updated', portal });
    } catch (error) {
        console.error('Update portal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/portals/:id/warning
// @desc    Add warning to portal
// @access  Private/Admin
router.post('/portals/:id/warning', protect, admin, async (req, res) => {
    try {
        const { message } = req.body;
        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        portal.warnings.push({
            message,
            issuedBy: req.user._id,
            date: new Date()
        });

        await portal.save();

        // Notify Portal Owner
        const owner = await User.findById(portal.owner);
        const systemEnabled = owner?.settings?.notifications?.system !== false;
        if (systemEnabled) {
            await Notification.create({
                recipient: portal.owner,
                type: 'system',
                content: `Portalınız "${portal.name}" için bir yönetici uyarısı aldınız: ${message}`,
                link: `/portal/${portal._id}`
            });
        }

        res.json({ message: 'Warning sent', portal });
    } catch (error) {
        console.error('Send portal warning error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/portals/:id/alert
// @desc    Create a portal alert (timed announcement)
// @access  Private/Admin
router.post('/portals/:id/alert', protect, admin, async (req, res) => {
    try {
        const { message, expiresAt } = req.body;

        if (!message || !expiresAt) {
            return res.status(400).json({ message: 'Mesaj ve bitiş tarihi zorunludur.' });
        }

        if (String(message).length > 500) {
            return res.status(400).json({ message: 'Mesaj 500 karakteri geçemez.' });
        }

        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime()) || expDate <= new Date()) {
            return res.status(400).json({ message: 'Geçerli bir bitiş tarihi belirleyin.' });
        }

        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const alert = {
            message: String(message).slice(0, 500),
            expiresAt: expDate,
            issuedBy: req.user._id,
            isActive: true,
            createdAt: new Date()
        };

        portal.alerts.push(alert);
        await portal.save();

        // Notify Portal Owner
        const owner = await User.findById(portal.owner);
        const systemEnabled = owner?.settings?.notifications?.system !== false;
        if (systemEnabled) {
            await Notification.create({
                recipient: portal.owner,
                type: 'system',
                content: `Portalınız "${portal.name}" için bir yönetici uyarısı yayınlandı: ${String(message).slice(0, 100)}${message.length > 100 ? '...' : ''}`,
                link: `/portal/${portal._id}`
            });
        }

        const createdAlert = portal.alerts[portal.alerts.length - 1];
        res.json({ message: 'Uyarı yayınlandı', alert: createdAlert });
    } catch (error) {
        console.error('Create portal alert error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/portals/:id/alert/:alertId
// @desc    Deactivate a portal alert before expiry
// @access  Private/Admin
router.delete('/portals/:id/alert/:alertId', protect, admin, async (req, res) => {
    try {
        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const alert = portal.alerts.id(req.params.alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Uyarı bulunamadı' });
        }

        alert.isActive = false;
        await portal.save();

        res.json({ message: 'Uyarı kaldırıldı' });
    } catch (error) {
        console.error('Deactivate portal alert error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/system-settings/maintenance
// @desc    Get current maintenance mode status
// @access  Private/Admin
router.get('/system-settings/maintenance', protect, admin, async (req, res) => {
    try {
        const setting = await SystemSettings.findOne({ key: 'maintenance_mode' });
        const active = setting ? !!setting.value?.active : false;
        res.json({ active });
    } catch (error) {
        console.error('Fetch maintenance setting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/system-settings/maintenance
// @desc    Toggle maintenance mode (Only for head admin oxypace)
// @access  Private/Admin
router.put('/system-settings/maintenance', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu ayarı sadece baş yönetici değiştirebilir.' });
        }

        const { active } = req.body;
        if (typeof active !== 'boolean') {
            return res.status(400).json({ message: 'Geçersiz aktiflik değeri.' });
        }

        await SystemSettings.findOneAndUpdate(
            { key: 'maintenance_mode' },
            { value: { active } },
            { upsert: true, new: true }
        );

        // Update local global cache
        global.isMaintenanceActive = active;

        // Broadcast to all active socket connections
        const io = req.app.get('io');
        if (io) {
            io.emit('maintenance_toggle', { active });
            console.log(`📡 Broadcasted maintenance_toggle event: active = ${active}`);
        }

        res.json({ message: `Bakım modu başarıyla ${active ? 'aktifleştirildi' : 'devre dışı bırakıldı'}.`, active });
    } catch (error) {
        console.error('Update maintenance setting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user profile and broadcast socket logout signal
// @access  Private/Admin
router.put('/users/:id/ban', protect, admin, async (req, res) => {
    try {
        const { reason, expiresAt } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        user.isBanned = true;
        user.banReason = reason || 'Topluluk kuralları ihlali';
        user.banExpiresAt = expiresAt ? new Date(expiresAt) : null;

        await user.save();

        // Aktif kullanıcının oturumunu gerçek zamanlı sonlandırmak için socket yayını gönder
        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('user_banned', {
                reason: user.banReason,
                expiresAt: user.banExpiresAt
            });
            console.log(`📡 Broadcasted user_banned to user room: ${user._id}`);
        }

        res.json({ message: 'Kullanıcı başarıyla engellendi.', user });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user profile
// @access  Private/Admin
router.put('/users/:id/unban', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;

        await user.save();
        res.json({ message: 'Kullanıcının engeli başarıyla kaldırıldı.', user });
    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   GET /api/admin/ip-bans
// @desc    Get all active IP bans
// @access  Private/Admin
router.get('/ip-bans', protect, admin, async (req, res) => {
    try {
        const bans = await BannedIP.find().populate('bannedBy', 'username').sort({ createdAt: -1 });
        res.json(bans);
    } catch (error) {
        console.error('Fetch IP bans error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   POST /api/admin/ip-bans
// @desc    Ban an IP address
// @access  Private/Admin
router.post('/ip-bans', protect, admin, async (req, res) => {
    try {
        const { ip, reason, expiresAt } = req.body;

        if (!ip) {
            return res.status(400).json({ message: 'IP adresi zorunludur.' });
        }

        const ban = await BannedIP.findOneAndUpdate(
            { ip: ip.trim() },
            {
                reason: reason || 'Güvenlik ihlali',
                bannedBy: req.user._id,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            },
            { upsert: true, new: true }
        );

        res.json({ message: 'IP adresi başarıyla engellendi.', ban });
    } catch (error) {
        console.error('IP ban error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   DELETE /api/admin/ip-bans/:ip
// @desc    Unban an IP address
// @access  Private/Admin
router.delete('/ip-bans/:ip', protect, admin, async (req, res) => {
    try {
        const result = await BannedIP.deleteOne({ ip: req.params.ip });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Engellenmiş IP bulunamadı.' });
        }
        res.json({ message: 'IP adresinin engeli kaldırıldı.' });
    } catch (error) {
        console.error('IP unban error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   POST /api/admin/impersonate/:id
// @desc    Impersonate a user (generate 15 min restricted ghost JWT)
// @access  Private/Admin (Oxypace Only)
router.post('/impersonate/:id', protect, admin, async (req, res) => {
    try {
        // Güvenlik: Sadece baş yönetici (oxypace) taklit modu başlatabilir
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu işlemi sadece baş yönetici yapabilir.' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ message: 'Taklit edilecek kullanıcı bulunamadı.' });
        }

        // Baş yöneticinin kendisini taklit etmesini engelle (sonsuz döngü/mantık hatasını önlemek için)
        if (targetUser.username === 'oxypace') {
            return res.status(400).json({ message: 'Kendinizi taklit edemezsiniz.' });
        }

        // 15 dakika ömürlü, isGhost claim'ine sahip kısıtlı token üret
        const token = jwt.sign(
            { id: targetUser._id, adminId: req.user._id, isGhost: true },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        console.log(`👤 Ghost Mode Impersonation Started: Admin @${req.user.username} is now @${targetUser.username}`);

        res.json({
            message: `Taklit modu başarıyla başlatıldı: @${targetUser.username}`,
            token,
            user: {
                _id: targetUser._id,
                email: targetUser.email,
                username: targetUser.username,
                profile: targetUser.profile,
                joinedPortals: targetUser.joinedPortals,
                isAdmin: targetUser.isAdmin,
                verificationBadge: targetUser.verificationBadge,
            }
        });
    } catch (error) {
        console.error('Impersonate user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete any post (Admin only)
// @access  Private/Admin
router.delete('/posts/:id', protect, admin, async (req, res) => {
    try {
        const Post = await import('../models/Post.js').then(m => m.default);
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Gönderi bulunamadı.' });
        }

        await post.deleteOne();
        res.json({ message: 'Gönderi başarıyla silindi.' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

export default router;
