import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import BotConfig from '../models/BotConfig.js';
import ContactMessage from '../models/ContactMessage.js';
import SystemSettings from '../models/SystemSettings.js';
import BannedIP from '../models/BannedIP.js';
import jwt from 'jsonwebtoken';
import transporter from '../config/email.js';
import CustomBadge from '../models/CustomBadge.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import { processAndUploadMultiResAvatars } from '../utils/avatarOptimizer.js';

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

// @route   GET /api/admin/recovery-requests
// @desc    Get all pending recovery requests
// @access  Private/Admin
router.get('/recovery-requests', protect, admin, async (req, res) => {
    try {
        const users = await User.find({ recoveryStatus: 'pending' }).select(
            'username email profile recoveryReason securityAnswers recoveryStatus'
        );
        res.json(users);
    } catch (error) {
        console.error('Fetch recovery requests error:', error);
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
            .select('username email profile verificationBadge customBadge isVerified isBanned banReason banExpiresAt isShadowbanned lastIP createdAt isTouristAdmin touristAdminExpiresAt assignedBy')
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
            .select('name description owner avatar banner themeColor isVerified badges status statusReason suspendedUntil warnings alerts isNSFW isReadOnly createdAt members')
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
// @desc    Update portal status/badges/read-only
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
        if (typeof req.body.isReadOnly === 'boolean') {portal.isReadOnly = req.body.isReadOnly;}

        await portal.save();
        res.json({ message: 'Portal updated', portal });
    } catch (error) {
        console.error('Update portal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/portals/:id/transfer-ownership
// @desc    Transfer portal ownership to another user (ID or username)
// @access  Private/Admin
router.post('/portals/:id/transfer-ownership', protect, admin, async (req, res) => {
    try {
        const { targetUserIdentifier } = req.body;
        if (!targetUserIdentifier) {
            return res.status(400).json({ message: 'Hedef kullanıcı belirtilmelidir.' });
        }

        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        let targetUser = null;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserIdentifier);
        if (isValidObjectId) {
            targetUser = await User.findById(targetUserIdentifier);
        }
        if (!targetUser) {
            targetUser = await User.findOne({ username: targetUserIdentifier });
        }

        if (!targetUser) {
            return res.status(404).json({ message: 'Belirtilen kullanıcı bulunamadı.' });
        }

        const oldOwnerId = portal.owner;
        portal.owner = targetUser._id;

        // Ensure target user is in members
        const isMember = portal.members.some(m => m.toString() === targetUser._id.toString());
        if (!isMember) {
            portal.members.push(targetUser._id);
        }

        await portal.save();

        // Send notifications
        try {
            const systemEnabledNew = targetUser.settings?.notifications?.system !== false;
            if (systemEnabledNew) {
                await Notification.create({
                    recipient: targetUser._id,
                    type: 'system',
                    content: `"${portal.name}" portalının sahipliği size devredildi.`,
                    link: `/portal/${portal._id}`
                });
            }

            const oldOwner = await User.findById(oldOwnerId);
            if (oldOwner) {
                const systemEnabledOld = oldOwner.settings?.notifications?.system !== false;
                if (systemEnabledOld) {
                    await Notification.create({
                        recipient: oldOwner._id,
                        type: 'system',
                        content: `"${portal.name}" portalının sahipliği başka bir kullanıcıya devredildi.`,
                        link: `/portal/${portal._id}`
                    });
                }
            }
        } catch (notifErr) {
            console.error('Notification creation error during transfer ownership:', notifErr);
        }

        // Return updated portal populated
        const updatedPortal = await Portal.findById(portal._id)
            .select('name description owner avatar banner themeColor isVerified badges status statusReason suspendedUntil warnings alerts isNSFW isReadOnly createdAt members')
            .populate('owner', 'username profile.displayName');

        res.json({ message: 'Sahiplik başarıyla devredildi.', portal: updatedPortal });
    } catch (error) {
        console.error('Transfer ownership error:', error);
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

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
        }

        user.isBanned = true;
        user.banReason = reason || 'Topluluk kuralları ihlali';
        user.banExpiresAt = expiresAt ? new Date(expiresAt) : null;

        await user.save();

        // Enforce IP Ban automatically on user's last known IP address
        if (user.lastIP) {
            await BannedIP.findOneAndUpdate(
                { ip: user.lastIP },
                {
                    reason: reason || 'Kullanıcı engellendi (IP & Cihaz Banı)',
                    bannedBy: req.user._id,
                    expiresAt: expiresAt ? new Date(expiresAt) : null
                },
                { upsert: true }
            );
        }

        // Generate banned device token
        const bannedDeviceToken = jwt.sign(
            { banned: true, expiresAt: user.banExpiresAt },
            process.env.JWT_SECRET
        );

        // Aktif kullanıcının oturumunu gerçek zamanlı sonlandırmak için socket yayını gönder
        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('user_banned', {
                reason: user.banReason,
                expiresAt: user.banExpiresAt,
                bannedDeviceToken
            });
            console.log(`📡 Broadcasted user_banned to user room: ${user._id}`);
        }

        res.json({ message: 'Kullanıcı başarıyla engellendi.', user });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/shadowban
// @desc    Toggle shadowban status of a user
// @access  Private/Admin
router.put('/users/:id/shadowban', protect, admin, async (req, res) => {
    try {
        const { isShadowbanned } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
        }

        user.isShadowbanned = !!isShadowbanned;
        await user.save();

        res.json({ message: `Kullanıcı hayalet moduna ${user.isShadowbanned ? 'alındı' : 'çıkarıldı'}.`, user });
    } catch (error) {
        console.error('Shadowban user error:', error);
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

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
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

// @route   PUT /api/admin/users/:id/recover-approve
// @desc    Approve user account recovery request
// @access  Private/Admin
router.put('/users/:id/recover-approve', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
        }

        user.isDeleted = false;
        user.recoveryStatus = 'approved';
        await user.save();

        // Send Email notification
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: '✅ Hesabınız Başarıyla Kurtarıldı - Oxypace',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 16px;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center;">
                        <h1 style="color: #22c55e; margin-bottom: 20px; font-size: 24px;">Hesabınız Yeniden Aktif!</h1>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">Merhaba <strong>${user.profile?.displayName || user.username}</strong>,</p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Hesap kurtarma talebiniz yöneticilerimiz tarafından incelenmiş ve onaylanmıştır. Artık hesabınıza tekrar giriş yapabilir, paylaşımlarınıza kaldığınız yerden devam edebilirsiniz.
                        </p>
                        <div style="margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: #22c55e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Şimdi Giriş Yap
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            Oxypace Topluluk Yönetimi
                        </p>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailErr) {
            console.error('Approval email error:', emailErr);
        }

        res.json({ message: 'Hesap kurtarma talebi onaylandı ve kullanıcı bilgilendirildi.', user });
    } catch (error) {
        console.error('Recover approve error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/recover-reject
// @desc    Reject user account recovery request
// @access  Private/Admin
router.put('/users/:id/recover-reject', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
        }

        user.recoveryStatus = 'rejected';
        await user.save();

        // Send Email notification
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: '❌ Hesap Kurtarma Talebiniz Reddedildi - Oxypace',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; border-radius: 16px;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center;">
                        <h1 style="color: #ef4444; margin-bottom: 20px; font-size: 24px;">Kurtarma Talebi Reddedildi</h1>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">Merhaba <strong>${user.profile?.displayName || user.username}</strong>,</p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Hesap kurtarma talebiniz yöneticilerimiz tarafından incelenmiş, ancak maalesef uygun bulunmayarak reddedilmiştir.
                        </p>
                        <p style="color: #888; font-size: 14px; margin-top: 20px;">
                            Herhangi bir sorunuz varsa veya bunun bir hata olduğunu düşünüyorsanız destek ekibimizle iletişime geçebilirsiniz.
                        </p>
                        <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            Oxypace Topluluk Yönetimi
                        </p>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailErr) {
            console.error('Rejection email error:', emailErr);
        }

        res.json({ message: 'Hesap kurtarma talebi reddedildi ve kullanıcı bilgilendirildi.', user });
    } catch (error) {
        console.error('Recover reject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/custom-badges
// @desc    Get all custom badges
// @access  Private/Admin
router.get('/custom-badges', protect, admin, async (req, res) => {
    try {
        const badges = await CustomBadge.find().sort({ createdAt: -1 });
        res.json(badges);
    } catch (error) {
        console.error('Fetch custom badges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/custom-badges
// @desc    Add a new custom badge
// @access  Private/Admin
router.post('/custom-badges', protect, admin, async (req, res) => {
    try {
        const { name, url, key } = req.body;
        if (!name || !url || !key) {
            return res.status(400).json({ message: 'Lütfen rozet adı, görsel URL ve anahtarını belirtin.' });
        }

        const badge = await CustomBadge.create({ name, url, key });
        res.status(201).json(badge);
    } catch (error) {
        console.error('Create custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/custom-badges/:id
// @desc    Delete custom badge
// @access  Private/Admin
router.delete('/custom-badges/:id', protect, admin, async (req, res) => {
    try {
        const badge = await CustomBadge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Rozet bulunamadı.' });
        }

        // Delete from R2
        if (badge.key) {
            try {
                const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
                await r2.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: badge.key
                }));
                console.log(`Deleted custom badge image from R2: ${badge.key}`);
            } catch (r2Err) {
                console.error('Failed to delete badge image from R2:', r2Err);
            }
        }

        await badge.deleteOne();
        res.json({ message: 'Rozet başarıyla silindi.' });
    } catch (error) {
        console.error('Delete custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/custom-badge
// @desc    Assign custom badge to a user
// @access  Private/Admin
router.post('/users/:id/custom-badge', protect, admin, async (req, res) => {
    try {
        const { url, name } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || req.user.isTouristAdmin) {
            return res.status(403).json({ message: 'As yetkiliye müdahale edilemez' });
        }

        user.customBadge = {
            url: url || '',
            name: name || ''
        };

        await user.save();

        // Create notification for user
        if (url && name) {
            try {
                const systemEnabled = user.settings?.notifications?.system !== false;
                if (systemEnabled) {
                    await Notification.create({
                        recipient: user._id,
                        type: 'system',
                        content: `Tebrikler! Hesabınıza "${name}" özel rozeti tanımlandı.`,
                    });
                }
            } catch (notifErr) {
                console.error('Custom badge notification error:', notifErr);
            }
        }

        res.json({ message: 'Kullanıcı özel rozeti güncellendi.', user });
    } catch (error) {
        console.error('Assign custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/users/:id/tourist-admin
// @desc    Assign or revoke Tourist Admin role
// @access  Private/Admin (Oxypace Only)
router.post('/users/:id/tourist-admin', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu işlemi sadece baş yönetici yapabilir.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace') {
            return res.status(400).json({ message: 'Baş yöneticiye turist admin rolü atanamaz.' });
        }

        const { duration, expiresAt, revoke } = req.body;

        if (revoke) {
            user.isTouristAdmin = false;
            user.touristAdminExpiresAt = null;
            user.assignedBy = '';
            await user.save();

            try {
                const systemEnabled = user.settings?.notifications?.system !== false;
                if (systemEnabled) {
                    await Notification.create({
                        recipient: user._id,
                        type: 'system',
                        content: 'Turist Admin yetkileriniz geri alındı.',
                    });
                }
                
                const io = req.app.get('io');
                if (io) {
                    io.to(user._id.toString()).emit('tourist_admin_revoked', {
                        message: 'Turist Admin yetkileriniz geri alındı.'
                    });
                }
            } catch (notifErr) {
                console.error('Revocation notification error:', notifErr);
            }

            return res.json({ message: 'Turist Admin yetkileri geri alındı.', user });
        }

        let expiryDate = null;
        if (expiresAt) {
            expiryDate = new Date(expiresAt);
        } else if (duration) {
            const num = parseInt(duration);
            const unit = duration.slice(-1);
            if (unit === 'h') {
                expiryDate = new Date(Date.now() + num * 60 * 60 * 1000);
            } else if (unit === 'd') {
                expiryDate = new Date(Date.now() + num * 24 * 60 * 60 * 1000);
            } else {
                return res.status(400).json({ message: 'Geçersiz süre biçimi. Örn: 2h, 1d' });
            }
        } else {
            return res.status(400).json({ message: 'Lütfen bir süre veya bitiş tarihi belirtin.' });
        }

        user.isTouristAdmin = true;
        user.touristAdminExpiresAt = expiryDate;
        user.assignedBy = req.user.username;

        await user.save();

        const messageText = 'Tebrikler! Sınırlı süreliğine Turist Admin olarak atandınız. Yetkileriniz başladı!';
        
        try {
            const systemEnabled = user.settings?.notifications?.system !== false;
            if (systemEnabled) {
                await Notification.create({
                    recipient: user._id,
                    type: 'system',
                    content: messageText,
                });
            }

            if (user.fcmTokens && user.fcmTokens.length > 0 && user.settings?.notifications?.push !== false) {
                const { sendPushNotification } = await import('../services/pushService.js');
                await sendPushNotification(user.fcmTokens, {
                    title: 'Turist Admin Ataması',
                    body: messageText,
                    data: { url: '/admin' }
                });
            }

            const io = req.app.get('io');
            if (io) {
                const notif = await Notification.findOne({ recipient: user._id }).sort({ createdAt: -1 });
                if (notif) {
                    io.to(user._id.toString()).emit('newNotification', notif);
                }
                io.to(user._id.toString()).emit('tourist_admin_assigned', {
                    message: messageText
                });
            }
        } catch (notifErr) {
            console.error('Notification error during Tourist Admin assignment:', notifErr);
        }

        res.json({ message: 'Turist Admin başarıyla atandı.', user });
    } catch (error) {
        console.error('Assign tourist admin error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   POST /api/admin/mass-notification
// @desc    Send mass notification (in-app and/or push) to all active users
// @access  Private/Admin
router.post('/mass-notification', protect, admin, async (req, res) => {
    try {
        const { title, message, inApp, push, imageUrl } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Başlık ve mesaj alanları zorunludur.' });
        }

        if (!inApp && !push) {
            return res.status(400).json({ message: 'Lütfen en az bir gönderim yöntemi (Web Bildirimi veya Mobil Bildirim) seçin.' });
        }

        // Fetch all active users (not deleted, not banned)
        const activeUsers = await User.find({ isDeleted: { $ne: true }, isBanned: { $ne: true } });

        let inAppCount = 0;
        let pushCount = 0;

        if (inApp) {
            // Prepare Notification documents
            const notifications = activeUsers.map(user => ({
                recipient: user._id,
                type: 'system',
                content: `${title}: ${message}`,
                imageUrl: imageUrl || undefined,
            }));

            // Batch insert notifications (highly efficient, bypasses individual post-save hooks)
            const createdNotifs = await Notification.insertMany(notifications);
            inAppCount = createdNotifs.length;

            // Emit socket updates to online users in real-time
            const io = req.app.get('io');
            if (io) {
                for (const notif of createdNotifs) {
                    const recipientId = notif.recipient.toString();
                    // Check if recipient has an active socket room
                    if (io.sockets.adapter.rooms.has(recipientId)) {
                        io.to(recipientId).emit('newNotification', notif);
                    }
                }
            }
        }

        if (push) {
            // Get all FCM tokens of active users who have push notifications enabled
            const tokens = [];
            for (const user of activeUsers) {
                if (user.fcmTokens && user.fcmTokens.length > 0 && user.settings?.notifications?.push !== false) {
                    tokens.push(...user.fcmTokens);
                }
            }

            const uniqueTokens = [...new Set(tokens)];

            if (uniqueTokens.length > 0) {
                const { sendPushNotification } = await import('../services/pushService.js');
                const chunkSize = 500;
                for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
                    const chunk = uniqueTokens.slice(i, i + chunkSize);
                    await sendPushNotification(chunk, {
                        title: title,
                        body: message,
                        image: imageUrl,
                        data: {
                            url: '/notifications'
                        }
                    });
                }
                pushCount = uniqueTokens.length;
            }
        }

        res.json({
            message: 'Toplu bildirim gönderimi başarıyla tamamlandı.',
            inAppCount,
            pushCount
        });
    } catch (error) {
        console.error('Send mass notification error:', error);
        res.status(500).json({ message: 'Toplu bildirim gönderilirken bir hata oluştu.' });
    }
});

// @route   GET /api/admin/bots
// @desc    Get all bot users and their configurations
// @access  Private/Admin
router.get('/bots', protect, admin, async (req, res) => {
    try {
        const bots = await User.find({ isBot: true }).select('username email profile verificationBadge isBanned createdAt');
        const configs = await BotConfig.find().populate('defaultPortal', 'name avatar');
        
        const configsMap = {};
        configs.forEach(c => {
            if (c.bot) {
                configsMap[c.bot.toString()] = c;
            }
        });

        const result = bots.map(bot => {
            const config = configsMap[bot._id.toString()];
            return {
                _id: bot._id,
                username: bot.username,
                email: bot.email,
                profile: bot.profile,
                verificationBadge: bot.verificationBadge,
                isBanned: bot.isBanned,
                createdAt: bot.createdAt,
                config: config ? {
                    feeds: config.feeds || [],
                    defaultPortal: config.defaultPortal,
                    defaultChannel: config.defaultChannel || 'general'
                } : { feeds: [], defaultPortal: null, defaultChannel: 'general' }
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Fetch bots error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/bots
// @desc    Create a new bot user
// @access  Private/Admin
router.post('/bots', protect, admin, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Kullanıcı adı, e-posta ve şifre zorunludur.' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }

        const botUser = new User({
            email,
            username,
            password,
            profile: {
                displayName: username,
                bio: 'Sistem botu.',
                avatar: '',
                coverImage: ''
            },
            isBot: true,
            isVerified: true,
            verificationBadge: 'special'
        });

        await botUser.save();

        const config = new BotConfig({
            bot: botUser._id,
            feeds: [],
            defaultPortal: null,
            defaultChannel: 'general'
        });
        await config.save();

        res.status(201).json({
            message: 'Bot hesabı başarıyla oluşturuldu.',
            bot: {
                _id: botUser._id,
                username: botUser.username,
                email: botUser.email,
                profile: botUser.profile,
                isBot: botUser.isBot,
                config
            }
        });
    } catch (error) {
        console.error('Create bot error:', error);
        res.status(500).json({ message: 'Bot oluşturulurken hata oluştu: ' + error.message });
    }
});

// @route   DELETE /api/admin/bots/:id
// @desc    Delete a bot user
// @access  Private/Admin
router.delete('/bots/:id', protect, admin, async (req, res) => {
    try {
        const botUser = await User.findOne({ _id: req.params.id, isBot: true });
        if (!botUser) {
            return res.status(404).json({ message: 'Bot hesabı bulunamadı.' });
        }

        await User.deleteOne({ _id: botUser._id });
        await BotConfig.deleteOne({ bot: botUser._id });

        res.json({ message: 'Bot hesabı ve yapılandırması başarıyla silindi.' });
    } catch (error) {
        console.error('Delete bot error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/bots/:id/profile
// @desc    Update bot user profile & config
// @access  Private/Admin
router.put('/bots/:id/profile', protect, admin, async (req, res) => {
    try {
        const botUser = await User.findOne({ _id: req.params.id, isBot: true });
        if (!botUser) {
            return res.status(404).json({ message: 'Bot hesabı bulunamadı.' });
        }

        const { displayName, bio, avatar, coverImage, feeds, defaultPortal, defaultChannel } = req.body;

        if (displayName !== undefined) botUser.profile.displayName = displayName;
        if (bio !== undefined) botUser.profile.bio = bio;
        if (avatar !== undefined) {
            botUser.profile.avatar = avatar;
            try {
                // Extract R2 key from avatar URL if possible
                let mediaKey = avatar;
                if (avatar.includes('/r2-media/')) {
                    mediaKey = avatar.substring(avatar.indexOf('/r2-media/') + 10);
                } else if (avatar.includes('/api/media/')) {
                    mediaKey = decodeURIComponent(avatar.substring(avatar.indexOf('/api/media/') + 11));
                }
                
                // Only optimize if it's on R2 (not a static /system/ fallback or data URI)
                if (mediaKey && !mediaKey.startsWith('http') && !mediaKey.startsWith('data:') && !mediaKey.startsWith('blob:') && !mediaKey.startsWith('/system/')) {
                    const result = await processAndUploadMultiResAvatars(mediaKey);
                    botUser.profile.avatar = result.original;
                    botUser.profile.lowResAvatar = result.lowRes;
                }
            } catch (optErr) {
                console.error('Failed to optimize bot avatar:', optErr);
            }
        }
        if (coverImage !== undefined) botUser.profile.coverImage = coverImage;

        await botUser.save();

        let config = await BotConfig.findOne({ bot: botUser._id });
        if (!config) {
            config = new BotConfig({ bot: botUser._id });
        }

        if (feeds !== undefined) {
            if (Array.isArray(feeds)) {
                config.feeds = feeds.map(f => String(f).trim()).filter(Boolean);
            }
        }

        if (defaultPortal !== undefined) {
            config.defaultPortal = defaultPortal || null;
        }

        if (defaultChannel !== undefined) {
            config.defaultChannel = defaultChannel || 'general';
        }

        await config.save();

        res.json({
            message: 'Bot profili ve yapılandırması başarıyla güncellendi.',
            bot: {
                _id: botUser._id,
                username: botUser.username,
                email: botUser.email,
                profile: botUser.profile,
                config
            }
        });
    } catch (error) {
        console.error('Update bot profile error:', error);
        res.status(500).json({ message: 'Güncelleme hatası: ' + error.message });
    }
});

// @route   POST /api/admin/bots/:id/post
// @desc    Create a post from bot account
// @access  Private/Admin
router.post('/bots/:id/post', protect, admin, async (req, res) => {
    try {
        const botUser = await User.findOne({ _id: req.params.id, isBot: true });
        if (!botUser) {
            return res.status(404).json({ message: 'Bot hesabı bulunamadı.' });
        }

        const { content, portalId, channel, mediaUrl, mediaType } = req.body;
        if (!content && !mediaUrl) {
            return res.status(400).json({ message: 'Gönderi içeriği veya medya alanı zorunludur.' });
        }

        const Portal = await import('../models/Portal.js').then(m => m.default);
        const Post = await import('../models/Post.js').then(m => m.default);

        const postData = {
            author: botUser._id,
            content: content || '',
            channel: channel || 'general',
            isProcessing: false
        };

        if (portalId) {
            const portal = await Portal.findById(portalId);
            if (!portal) {
                return res.status(404).json({ message: 'Portal bulunamadı.' });
            }
            postData.portal = portalId;
        }

        if (mediaUrl) {
            postData.media = mediaUrl;
            postData.mediaType = mediaType || 'image';
            if (postData.mediaType === 'video') {
                postData.videoUrl = mediaUrl;
                postData.videoQualities = {
                    high: mediaUrl,
                    low: mediaUrl,
                    p1080: mediaUrl
                };
                postData.video1080 = mediaUrl;
            }
        }

        const post = await Post.create(postData);

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
            .populate('portal')
            .exec();

        await User.findByIdAndUpdate(botUser._id, { $inc: { postCount: 1 } });

        const io = req.app.get('io');
        if (io) {
            if (!postData.portal) {
                io.emit('newPost', populatedPost);
            } else {
                io.emit('global:portal_activity', {
                    portalId: postData.portal.toString(),
                    channelId: postData.channel.toString(),
                    postId: post._id.toString()
                });
            }
        }

        if (portalId) {
            try {
                const portal = await Portal.findById(portalId);
                if (portal) {
                    const memberIds = portal.members.filter(m => m.toString() !== botUser._id.toString());
                    if (memberIds.length > 0) {
                        const notificationDocs = memberIds.map(userId => ({
                            recipient: userId,
                            sender: botUser._id,
                            type: 'portal_post',
                            portal: portalId,
                            channel: postData.channel,
                            post: post._id,
                            read: false
                        }));
                        await Notification.insertMany(notificationDocs);
                    }
                }
            } catch (notifyErr) {
                console.error('Error creating bot portal post notifications:', notifyErr);
            }
        }

        res.status(201).json({ message: 'Paylaşım başarıyla yapıldı.', post: populatedPost });
    } catch (error) {
        console.error('Bot post error:', error);
        res.status(500).json({ message: 'Paylaşım yapılırken hata oluştu: ' + error.message });
    }
});

export default router;

