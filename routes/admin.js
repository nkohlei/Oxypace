import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin, requirePermission } from '../middleware/admin.js';
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
import { escapeRegex } from '../utils/security.js';
import Post from '../models/Post.js';
import Portal from '../models/Portal.js';
import ActivityLog from '../models/ActivityLog.js';
import logActivity from '../utils/auditLogger.js';

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
router.get('/verification-requests', protect, requirePermission('canManageRequests'), async (req, res) => {
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
router.get('/recovery-requests', protect, requirePermission('canManageRecovery'), async (req, res) => {
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
router.post('/verify-user/:id', protect, requirePermission('canManageRequests'), async (req, res) => {
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
router.post('/reject-verification/:id', protect, requirePermission('canManageRequests'), async (req, res) => {
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
// @desc    Get all users (with search and enriched dossier data)
// @access  Private/Admin
router.get('/users', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const q = req.query.q || req.query.search;
        const accountType = req.query.accountType;
        let query = {};

        if (q) {
            const escaped = escapeRegex(q);
            query = {
                $or: [
                    { username: { $regex: escaped, $options: 'i' } },
                    { email: { $regex: escaped, $options: 'i' } },
                    { 'profile.displayName': { $regex: escaped, $options: 'i' } },
                    { lastIP: { $regex: escaped, $options: 'i' } }
                ]
            };
        }

        if (accountType && accountType !== 'all') {
            const typeFilter = {};
            if (accountType === 'deleted' || accountType === 'passive') {
                typeFilter.isDeleted = true;
            } else if (accountType === 'admin') {
                typeFilter.$or = [{ isAdmin: true }, { username: 'oxypace' }];
            } else if (accountType === 'tourist') {
                typeFilter.isTouristAdmin = true;
            } else if (accountType === 'bot') {
                typeFilter.isBot = true;
            } else if (accountType === 'verified') {
                typeFilter.isVerified = true;
                typeFilter.isDeleted = { $ne: true };
            } else if (accountType === 'banned') {
                typeFilter.isBanned = true;
            } else if (accountType === 'standard') {
                typeFilter.isAdmin = { $ne: true };
                typeFilter.isTouristAdmin = { $ne: true };
                typeFilter.isBot = { $ne: true };
                typeFilter.isDeleted = { $ne: true };
                typeFilter.username = { $ne: 'oxypace' };
            } else if (accountType === 'outdated_app') {
                typeFilter.appPlatform = 'android';
                typeFilter.isDeleted = { $ne: true };
                typeFilter.$or = [
                    { versionCode: { $lt: 255 } },
                    { versionCode: null },
                    { versionCode: 0 }
                ];
            }

            if (Object.keys(typeFilter).length > 0) {
                if (query.$or) {
                    query = { $and: [{ $or: query.$or }, typeFilter] };
                } else {
                    Object.assign(query, typeFilter);
                }
            }
        }

        const users = await User.find(query)
            .select('username email profile verificationBadge customBadge isVerified isAdmin isBot isBanned banReason banExpiresAt isShadowbanned lastIP registeredDevices followerCount followingCount postCount isTouristAdmin touristAdminExpiresAt touristAdminPermissions assignedBy createdAt lastActive recoveryStatus joinedPortals isDeleted deletedAt deletionReason status appVersion versionCode appPlatform lastAppSyncAt')
            .populate('joinedPortals', 'name avatar members channels')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        // Cross-query Portals where these users are members or owners to guarantee complete memberPortals
        const userIds = users.map(u => u._id);
        const portalsForUsers = await Portal.find({
            $or: [
                { members: { $in: userIds } },
                { owner: { $in: userIds } }
            ]
        }).select('name avatar members channels owner').lean();

        users.forEach(u => {
            const uIdStr = String(u._id);
            const userP = portalsForUsers.filter(p =>
                (p.owner && String(p.owner) === uIdStr) ||
                (Array.isArray(p.members) && p.members.some(m => String(m) === uIdStr)) ||
                (Array.isArray(u.joinedPortals) && u.joinedPortals.some(jp => String(jp._id || jp) === String(p._id)))
            );
            u.memberPortals = userP.map(p => ({
                _id: p._id,
                name: p.name,
                avatar: p.avatar,
                isOwner: String(p.owner) === uIdStr,
                memberCount: p.members?.length || 0,
                channelCount: p.channels?.length || 0
            }));
        });

        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/users/:id/dossier
// @desc    Get full user dossier / genealogy (tüm şecere)
// @access  Private/Admin
router.get('/users/:id/dossier', protect, requirePermission('users', 'details'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('joinedPortals', 'name avatar members channels isVerified badges')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Comprehensive user activity logs query (actor or target)
        const uIdStr = String(user._id);
        let uObjId = null;
        try { uObjId = new mongoose.Types.ObjectId(user._id); } catch(e) {}
        const userLogsQuery = {
            $or: [
                ...(uObjId ? [{ user: uObjId }] : []),
                { user: uIdStr },
                { username: user.username },
                { targetId: uIdStr },
                { targetName: user.username },
                { 'details.userId': uIdStr },
                { 'details.targetUserId': uIdStr },
                { 'details.username': user.username },
                { 'details.targetUsername': user.username },
                { 'details.email': user.email }
            ]
        };

        // Count posts and fetch recent post summaries & audit logs & member portals
        const [totalPosts, recentPosts, rawUserLogs, ownedPortals, memberPortals] = await Promise.all([
            Post.countDocuments({ author: user._id }),
            Post.find({ author: user._id }).sort({ createdAt: -1 }).limit(10).populate('portal', 'name avatar channels').lean(),
            ActivityLog.find(userLogsQuery)
                .populate('user', 'username profile.displayName profile.avatar')
                .populate('portal', 'name avatar channels')
                .sort({ createdAt: -1 })
                .limit(200)
                .lean(),
            Portal.find({ owner: user._id }).select('name avatar members channels createdAt isVerified isReadOnly isNSFW').lean(),
            Portal.find({
                $or: [
                    { members: user._id },
                    { owner: user._id },
                    { _id: { $in: user.joinedPortals || [] } }
                ]
            }).select('name avatar description members channels isVerified badges isReadOnly isNSFW createdAt owner')
              .populate('owner', 'username profile.displayName')
              .lean()
        ]);

        // Enrich user logs with friendly portalName, channelName, mediaUrl, durationSec
        const recentActivities = rawUserLogs.map(log => {
            const pName = log.portalName || log.portal?.name || log.details?.portalName || (typeof log.details?.portal === 'string' && !/^[a-f0-9]{24}$/i.test(log.details.portal) ? log.details.portal : '');
            let chName = log.channel || log.details?.channelName || (typeof log.details?.channel === 'string' && !/^[a-f0-9]{24}$/i.test(log.details.channel) ? log.details.channel : '');
            if (!chName && log.portal?.channels) {
                const chId = log.channel || log.details?.channelId;
                if (chId) {
                    const matched = log.portal.channels.find(c => c._id?.toString() === String(chId) || c.name === String(chId));
                    if (matched) chName = matched.name;
                }
            }
            const mediaUrl = log.details?.mediaUrl || log.details?.media || (Array.isArray(log.details?.media) ? log.details?.media[0] : null) || log.details?.pdfUrl || null;
            const hasMedia = !!(log.details?.hasMedia || mediaUrl || log.details?.pdfUrl);
            const mediaType = log.details?.mediaType || (log.details?.pdfUrl ? 'pdf' : (log.details?.url ? 'video' : 'none'));
            const content = log.details?.content || log.details?.snippet || log.details?.postSnapshot?.content || '';
            const durationSec = log.details?.durationSec || null;

            return {
                ...log,
                portalName: pName,
                channel: chName || 'Genel',
                mediaUrl,
                hasMedia,
                mediaType,
                content,
                durationSec
            };
        });

        // Aggregate unique IP addresses known for this user
        const ipSet = new Set();
        if (user.lastIP) ipSet.add(user.lastIP);
        if (Array.isArray(user.registeredDevices)) {
            user.registeredDevices.forEach(d => {
                if (d.lastIP) ipSet.add(d.lastIP);
            });
        }
        recentActivities.forEach(a => {
            if (a.ip) ipSet.add(a.ip);
        });

        res.json({
            user,
            totalPosts,
            recentPosts,
            recentActivities,
            recentLogs: recentActivities,
            ownedPortals,
            memberPortals,
            avatarHistory: user.avatarHistory || user.profile?.avatarHistory || [],
            bannerHistory: user.bannerHistory || user.profile?.bannerHistory || [],
            allKnownIPs: Array.from(ipSet)
        });
    } catch (error) {
        console.error('Fetch user dossier error:', error);
        res.status(500).json({ message: 'Kullanıcı şeceresi getirilemedi.' });
    }
});

// @route   GET /api/admin/users/:id/posts
// @desc    Get all posts created by a specific user with search (including archived/deleted posts)
// @access  Private/Admin
router.get('/users/:id/posts', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const { q, limit = 50, page = 1 } = req.query;
        let query = { author: req.params.id };

        if (q) {
            query.content = { $regex: escapeRegex(q), $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [posts, totalActive] = await Promise.all([
            Post.find(query)
                .populate('portal', 'name avatar channels')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Post.countDocuments(query)
        ]);

        // Also fetch deleted posts from ActivityLog archive so deleted posts remain accessible forever
        let deletedLogsQuery = {
            action: 'POST_DELETE',
            $or: [
                { user: req.params.id },
                { 'details.author._id': req.params.id },
                { 'details.author': req.params.id }
            ]
        };
        if (q) {
            deletedLogsQuery['details.content'] = { $regex: escapeRegex(q), $options: 'i' };
        }
        const deletedLogs = await ActivityLog.find(deletedLogsQuery).sort({ createdAt: -1 }).limit(100).lean();
        const deletedPostsFormatted = deletedLogs.map(dl => {
            const snap = dl.details?.postSnapshot || dl.details || {};
            return {
                _id: snap.postId || dl.targetId || dl._id,
                content: snap.content || dl.details?.content || '',
                media: snap.media || dl.details?.media || '',
                mediaType: snap.mediaType || dl.details?.mediaType || 'none',
                pdfUrl: snap.pdfUrl || dl.details?.pdfUrl || '',
                pdfName: snap.pdfName || dl.details?.pdfName || '',
                portal: {
                    _id: snap.portalId || dl.portal,
                    name: snap.portalName || dl.portalName || 'Portal'
                },
                channel: snap.channelName || dl.channel || 'genel',
                createdAt: snap.createdAt || dl.createdAt,
                deletedAt: snap.deletedAt || dl.createdAt,
                deletedBy: snap.deletedBy || dl.username,
                isDeleted: true
            };
        });

        // Merge active posts with deleted archived posts
        const activeFormatted = posts.map(p => ({
            ...p,
            isDeleted: false
        }));

        const combinedPosts = [...activeFormatted, ...deletedPostsFormatted].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            posts: combinedPosts,
            total: totalActive + deletedPostsFormatted.length,
            activeCount: totalActive,
            deletedCount: deletedPostsFormatted.length,
            page: parseInt(page),
            pages: Math.ceil((totalActive + deletedPostsFormatted.length) / parseInt(limit))
        });
    } catch (error) {
        console.error('Fetch user posts error:', error);
        res.status(500).json({ message: 'Kullanıcı gönderileri getirilemedi.' });
    }
});

// @route   PUT /api/admin/users/:id/badge
// @desc    Update user verification badge
// @access  Private/Admin
router.put('/users/:id/badge', protect, requirePermission('canManageBadges'), async (req, res) => {
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

        const updateData = {
            verificationBadge: sanitizedBadge,
            isVerified: sanitizedBadge !== 'none'
        };

        // If giving badge manually, approve pending request if exists
        if (sanitizedBadge !== 'none' && user.verificationRequest?.status === 'pending') {
            updateData['verificationRequest.status'] = 'approved';
            updateData['verificationRequest.badgeType'] = sanitizedBadge;
            updateData['verificationRequest.processedAt'] = new Date();
        } else if (sanitizedBadge === 'none' && user.verificationRequest?.status === 'approved') {
            updateData['verificationRequest.status'] = 'none';
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        res.json({ message: 'Badge updated', user: updatedUser });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/contact-messages
// @desc    Get all contact messages (Only for oxypace)
// @access  Private/Admin
router.get('/contact-messages', protect, requirePermission('canManageFeedback'), async (req, res) => {
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
router.put('/contact-messages/:id/status', protect, requirePermission('canManageFeedback'), async (req, res) => {
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
router.get('/portals', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const q = req.query.q || req.query.search;
        let query = {};

        if (q) {
            query = { name: { $regex: escapeRegex(q), $options: 'i' } };
        }

        const portals = await Portal.find(query)
            .select('name description owner avatar banner themeColor isVerified badges customBadge status statusReason suspendedUntil warnings alerts isNSFW isReadOnly createdAt members channels')
            .populate('owner', 'username profile.displayName')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(portals);
    } catch (error) {
        console.error('Fetch portals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/portals/:id/dossier
// @desc    Get portal full dossier (tüm bilgiler, üyeler, kanallar, istatistikler)
// @access  Private/Admin
router.get('/portals/:id/dossier', protect, requirePermission('portals', 'details'), async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id)
            .populate('owner', 'username profile.displayName profile.avatar email createdAt lastActive')
            .populate('admins', 'username profile.displayName profile.avatar email')
            .populate({
                path: 'members',
                select: 'username profile.displayName profile.avatar email createdAt lastActive isVerified'
            })
            .populate('blockedUsers', 'username profile.displayName profile.avatar')
            .populate('joinRequests', 'username profile.displayName profile.avatar')
            .lean();

        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }

        const pIdStr = String(portal._id);
        let pObjId = null;
        try { pObjId = new mongoose.Types.ObjectId(portal._id); } catch(e) {}
        const portalLogsQuery = {
            $or: [
                ...(pObjId ? [{ portal: pObjId }] : []),
                { portal: pIdStr },
                { 'details.portalId': pIdStr },
                { 'details.portalName': portal.name },
                { 'details.portal': portal.name },
                { portalName: portal.name }
            ]
        };

        const [postCount, recentPosts, rawPortalLogs] = await Promise.all([
            Post.countDocuments({ portal: portal._id }),
            Post.find({ portal: portal._id })
                .populate('author', 'username profile.displayName profile.avatar')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            ActivityLog.find(portalLogsQuery)
                .populate('user', 'username profile.displayName profile.avatar')
                .populate('portal', 'name avatar channels')
                .sort({ createdAt: -1 })
                .limit(200)
                .lean()
        ]);

        // Enrich channel names and format for detailed portal audit feed
        const portalChannels = portal.channels || [];
        const recentActivities = rawPortalLogs.map(log => {
            let chId = log.channel || log.details?.channelName || log.details?.channel || log.details?.channelId;
            let channelName = '';
            if (chId && portalChannels.length > 0) {
                const matched = portalChannels.find(c => c._id?.toString() === String(chId) || c.name.toLowerCase() === String(chId).toLowerCase());
                channelName = matched ? matched.name : String(chId);
            }
            const mediaUrl = log.details?.mediaUrl || log.details?.media || (Array.isArray(log.details?.media) ? log.details?.media[0] : null) || log.details?.pdfUrl || null;
            const hasMedia = !!(log.details?.hasMedia || mediaUrl || log.details?.pdfUrl);
            const mediaType = log.details?.mediaType || (log.details?.pdfUrl ? 'pdf' : (log.details?.url ? 'video' : 'none'));
            const content = log.details?.content || log.details?.snippet || log.details?.postSnapshot?.content || '';
            const durationSec = log.details?.durationSec || null;

            return {
                ...log,
                portalName: portal.name,
                channel: channelName || log.channel || 'Genel',
                mediaUrl,
                hasMedia,
                mediaType,
                content,
                durationSec
            };
        });

        // Calculate channel stats with 100% precision for every channel in portal.channels
        const channelStats = {};
        const channels = portal.channels || [];
        
        if (channels.length > 0) {
            await Promise.all(channels.map(async (ch, idx) => {
                const targetIdStr = ch._id.toString();
                const isPrimary = idx === 0;
                let chQuery = { portal: portal._id };

                if (isPrimary) {
                    const otherChannelIds = [];
                    channels.forEach((c, cIdx) => {
                        if (cIdx !== 0) {
                            otherChannelIds.push(c._id.toString());
                            try {
                                otherChannelIds.push(new mongoose.Types.ObjectId(c._id));
                            } catch (e) {}
                            if (c.name) otherChannelIds.push(c.name);
                        }
                    });
                    if (otherChannelIds.length > 0) {
                        chQuery.channel = { $nin: otherChannelIds };
                    }
                } else {
                    const directMatches = [targetIdStr, ch.name];
                    try {
                        directMatches.push(new mongoose.Types.ObjectId(targetIdStr));
                    } catch (e) {}
                    chQuery.channel = { $in: directMatches };
                }

                const count = await Post.countDocuments(chQuery);
                channelStats[targetIdStr] = count;
                channelStats[ch.name] = count;
            }));
        }

        res.json({
            portal,
            postCount,
            recentPosts,
            channelStats,
            recentActivities,
            avatarHistory: portal.avatarHistory || [],
            bannerHistory: portal.bannerHistory || []
        });
    } catch (error) {
        console.error('Fetch portal dossier error:', error);
        res.status(500).json({ message: 'Portal detayları getirilemedi.' });
    }
});

// @route   POST /api/admin/portals/:id/channels
// @desc    Admin add channel to portal
// @access  Private/Admin
router.post('/portals/:id/channels', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const { name, type = 'text', roomMode = 'free', maxParticipants = 25, isPrivate = false } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Kanal adı gereklidir.' });
        }
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }
        const newChannel = {
            name: name.trim().toLowerCase().replace(/\s+/g, '-'),
            type: ['text', 'voice', 'conference', 'image'].includes(type) ? type : 'text',
            roomMode: ['free', 'stage'].includes(roomMode) ? roomMode : 'free',
            maxParticipants: Number(maxParticipants) || 25,
            isPrivate: !!isPrivate,
            order: portal.channels.length
        };
        portal.channels.push(newChannel);
        await portal.save();

        logActivity({
            action: 'portal_channel_create',
            category: 'portal',
            user: req.user._id,
            username: req.user.username,
            req,
            portal: portal._id,
            details: { portalName: portal.name, channelName: newChannel.name, channelType: newChannel.type }
        });

        res.json({ message: 'Kanal başarıyla eklendi.', channels: portal.channels });
    } catch (error) {
        console.error('Admin create channel error:', error);
        res.status(500).json({ message: 'Kanal eklenemedi.' });
    }
});

// @route   PUT /api/admin/portals/:id/channels/:channelId
// @desc    Admin edit channel in portal
// @access  Private/Admin
router.put('/portals/:id/channels/:channelId', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const { name, type, roomMode, maxParticipants, isPrivate } = req.body;
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }
        const channel = portal.channels.id(req.params.channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Kanal bulunamadı.' });
        }
        if (name && name.trim()) {
            channel.name = name.trim().toLowerCase().replace(/\s+/g, '-');
        }
        if (type && ['text', 'voice', 'conference', 'image'].includes(type)) {
            channel.type = type;
        }
        if (roomMode && ['free', 'stage'].includes(roomMode)) {
            channel.roomMode = roomMode;
        }
        if (maxParticipants !== undefined) {
            channel.maxParticipants = Number(maxParticipants) || 25;
        }
        if (isPrivate !== undefined) {
            channel.isPrivate = !!isPrivate;
        }
        await portal.save();

        logActivity({
            action: 'portal_channel_update',
            category: 'portal',
            user: req.user._id,
            username: req.user.username,
            req,
            portal: portal._id,
            details: { portalName: portal.name, channelName: channel.name, channelId: channel._id }
        });

        res.json({ message: 'Kanal başarıyla güncellendi.', channel, channels: portal.channels });
    } catch (error) {
        console.error('Admin update channel error:', error);
        res.status(500).json({ message: 'Kanal güncellenemedi.' });
    }
});

// @route   DELETE /api/admin/portals/:id/channels/:channelId
// @desc    Admin delete channel from portal
// @access  Private/Admin
router.delete('/portals/:id/channels/:channelId', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }
        if (portal.channels.length <= 1) {
            return res.status(400).json({ message: 'Portalın son kalan kanalı silinemez.' });
        }
        const chToDelete = portal.channels.id(req.params.channelId);
        const chName = chToDelete ? chToDelete.name : req.params.channelId;

        portal.channels = portal.channels.filter(c => String(c._id) !== String(req.params.channelId));
        await portal.save();

        logActivity({
            action: 'portal_channel_delete',
            category: 'portal',
            user: req.user._id,
            username: req.user.username,
            req,
            portal: portal._id,
            details: { portalName: portal.name, deletedChannelName: chName }
        });

        res.json({ message: 'Kanal silindi.', channels: portal.channels });
    } catch (error) {
        console.error('Admin delete channel error:', error);
        res.status(500).json({ message: 'Kanal silinemedi.' });
    }
});

// @route   GET /api/admin/portals/:id/posts
// @desc    Get all posts in a specific portal with channel and search filters
// @access  Private/Admin
router.get('/portals/:id/posts', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const { q, channelId, limit = 50, page = 1 } = req.query;
        const portal = await Portal.findById(req.params.id).lean();
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }

        let query = { portal: portal._id };

        if (channelId && channelId !== 'all') {
            const channels = portal.channels || [];
            const targetChannel = channels.find(c => 
                c._id.toString() === String(channelId) || 
                c.name.toLowerCase() === String(channelId).toLowerCase()
            );

            if (targetChannel) {
                const targetIdStr = targetChannel._id.toString();
                const isPrimary = channels.length > 0 && channels[0]._id.toString() === targetIdStr;

                if (isPrimary) {
                    const otherChannelIds = [];
                    channels.forEach((c, idx) => {
                        if (idx !== 0) {
                            otherChannelIds.push(c._id.toString());
                            try {
                                otherChannelIds.push(new mongoose.Types.ObjectId(c._id));
                            } catch (e) {}
                            if (c.name) otherChannelIds.push(c.name);
                        }
                    });
                    if (otherChannelIds.length > 0) {
                        query.channel = { $nin: otherChannelIds };
                    }
                } else {
                    const directMatches = [targetIdStr, targetChannel.name];
                    try {
                        directMatches.push(new mongoose.Types.ObjectId(targetIdStr));
                    } catch (e) {}
                    query.channel = { $in: directMatches };
                }
            } else {
                query.channel = channelId;
            }
        }

        if (q) {
            query.content = { $regex: escapeRegex(q), $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [posts, total] = await Promise.all([
            Post.find(query)
                .populate('author', 'username profile.displayName profile.avatar')
                .populate('portal', 'name avatar channels')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Post.countDocuments(query)
        ]);

        // Resolve channel display name from portal.channels for each post
        const portalChannels = portal.channels || [];
        const formattedPosts = posts.map(p => {
            let channelName = '';
            const chIdStr = p.channel ? String(p.channel) : '';
            const matchedCh = portalChannels.find(c => 
                c._id.toString() === chIdStr || 
                c.name.toLowerCase() === chIdStr.toLowerCase()
            );

            if (matchedCh) {
                channelName = matchedCh.name;
            } else if (chIdStr === 'general' || !chIdStr) {
                channelName = portalChannels[0]?.name || 'Genel';
            } else {
                channelName = chIdStr;
            }

            return {
                ...p,
                channelName
            };
        });

        // Also fetch deleted posts from ActivityLog archive for this portal
        let deletedLogsQuery = {
            action: 'POST_DELETE',
            $or: [
                { portal: portal._id },
                { 'details.portalId': String(portal._id) }
            ]
        };
        if (q) {
            deletedLogsQuery['details.content'] = { $regex: escapeRegex(q), $options: 'i' };
        }
        const deletedLogs = await ActivityLog.find(deletedLogsQuery).sort({ createdAt: -1 }).limit(100).lean();
        const deletedPostsFormatted = deletedLogs.map(dl => {
            const snap = dl.details?.postSnapshot || dl.details || {};
            return {
                _id: snap.postId || dl.targetId || dl._id,
                content: snap.content || dl.details?.content || '',
                media: snap.media || dl.details?.media || '',
                mediaType: snap.mediaType || dl.details?.mediaType || 'none',
                pdfUrl: snap.pdfUrl || dl.details?.pdfUrl || '',
                pdfName: snap.pdfName || dl.details?.pdfName || '',
                portal: {
                    _id: portal._id,
                    name: portal.name
                },
                channelName: snap.channelName || dl.channel || 'Genel',
                channel: { _id: snap.channelId || 'general', name: snap.channelName || dl.channel || 'Genel' },
                author: snap.author || {
                    username: dl.username || 'Kullanıcı',
                    profile: { displayName: dl.username || 'Kullanıcı' }
                },
                createdAt: snap.createdAt || dl.createdAt,
                deletedAt: snap.deletedAt || dl.createdAt,
                deletedBy: snap.deletedBy || dl.username,
                isDeleted: true
            };
        });

        const activeFormatted = formattedPosts.map(p => ({
            ...p,
            isDeleted: false
        }));

        const combinedPortalPosts = [...activeFormatted, ...deletedPostsFormatted].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            posts: combinedPortalPosts,
            total: total + deletedPostsFormatted.length,
            activeCount: total,
            deletedCount: deletedPostsFormatted.length,
            page: parseInt(page),
            pages: Math.ceil((total + deletedPostsFormatted.length) / parseInt(limit))
        });
    } catch (error) {
        console.error('Fetch portal posts error:', error);
        res.status(500).json({ message: 'Portal gönderileri getirilemedi.' });
    }
});

// @route   PUT /api/admin/portals/:id AND /api/admin/portals/:id/status
// @desc    Update portal status/badges/read-only/customBadge
// @access  Private/Admin
router.put(['/portals/:id', '/portals/:id/status'], protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const { status, badges, isVerified, customBadge } = req.body;
        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const updateData = {};

        // Validate status value
        const ALLOWED_STATUSES = ['active', 'suspended', 'closed'];
        if (status) {
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({ message: 'Geçersiz durum değeri.' });
            }
            updateData.status = status;
        }

        if (req.body.statusReason !== undefined) {
            updateData.statusReason = String(req.body.statusReason).slice(0, 500);
        }
        if (req.body.suspendedUntil !== undefined) {
            updateData.suspendedUntil = req.body.suspendedUntil;
        }

        // Clear suspendedUntil when activating
        if (status === 'active') {
            updateData.suspendedUntil = null;
            updateData.statusReason = '';
        }

        // Validate badges array or string
        if (badges !== undefined) {
            let normalizedBadges = badges;
            if (typeof normalizedBadges === 'string') {
                normalizedBadges = normalizedBadges === 'none' || !normalizedBadges.trim() ? [] : [normalizedBadges.trim()];
            }
            if (!Array.isArray(normalizedBadges) || normalizedBadges.some(b => typeof b !== 'string')) {
                return res.status(400).json({ message: 'Rozetler dizi formatında olmalı.' });
            }
            const cleanBadges = normalizedBadges.map(b => b.trim().toLowerCase().slice(0, 50)).filter(Boolean);
            updateData.badges = cleanBadges;
            if (isVerified === undefined) {
                updateData.isVerified = cleanBadges.length > 0;
            }
        }

        if (customBadge !== undefined) {
            updateData.customBadge = {
                url: customBadge?.url || '',
                name: customBadge?.name || '',
                shape: customBadge?.shape || 'round',
                borderStyle: customBadge?.borderStyle || 'thin'
            };
        }

        if (typeof isVerified === 'boolean') {
            updateData.isVerified = isVerified;
        }
        if (typeof req.body.isNSFW === 'boolean') {
            updateData.isNSFW = req.body.isNSFW;
        }
        if (typeof req.body.isReadOnly === 'boolean') {
            updateData.isReadOnly = req.body.isReadOnly;
        }

        const updatedPortal = await Portal.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        res.json({ message: 'Portal updated', portal: updatedPortal });
    } catch (error) {
        console.error('Update portal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/portals/:id/custom-badge
// @desc    Assign custom badge to a portal
// @access  Private/Admin
router.post('/portals/:id/custom-badge', protect, requirePermission('canManagePortals'), async (req, res) => {
    try {
        const { url, name, shape, borderStyle } = req.body;
        const Portal = await import('../models/Portal.js').then(m => m.default);
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı.' });
        }

        const customBadgeObj = {
            url: url || '',
            name: name || '',
            shape: shape || 'round',
            borderStyle: borderStyle || 'thin'
        };

        const updatedPortal = await Portal.findByIdAndUpdate(
            req.params.id,
            { $set: { customBadge: customBadgeObj } },
            { new: true, runValidators: false }
        );

        // Create notification for portal owner if assigned
        if (url && name && portal.owner) {
            try {
                const User = await import('../models/User.js').then(m => m.default);
                const owner = await User.findById(portal.owner);
                if (owner && owner.settings?.notifications?.system !== false) {
                    await Notification.create({
                        recipient: owner._id,
                        type: 'system',
                        content: `"${portal.name}" portalınıza "${name}" özel ikon rozeti tanımlandı.`,
                    });
                }
            } catch (notifErr) {
                console.error('Portal custom badge notification error:', notifErr);
            }
        }

        res.json({ message: 'Özel rozet portala atandı.', customBadge: updatedPortal?.customBadge || customBadgeObj });
    } catch (error) {
        console.error('Assign portal custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/admin/portals/:id/transfer-ownership
// @desc    Transfer portal ownership to another user (ID or username)
// @access  Private/Admin
router.post('/portals/:id/transfer-ownership', protect, requirePermission('canManagePortals'), async (req, res) => {
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
router.post('/portals/:id/warning', protect, requirePermission('canManagePortals'), async (req, res) => {
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
router.post('/portals/:id/alert', protect, requirePermission('canManagePortals'), async (req, res) => {
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
router.delete('/portals/:id/alert/:alertId', protect, requirePermission('canManagePortals'), async (req, res) => {
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
// @desc    Get current maintenance mode status (Decommissioned)
// @access  Private/Admin
router.get('/system-settings/maintenance', protect, admin, async (req, res) => {
    res.json({ active: false });
});

// @route   PUT /api/admin/system-settings/maintenance
// @desc    Toggle maintenance mode (Decommissioned)
// @access  Private/Admin
router.put('/system-settings/maintenance', protect, admin, async (req, res) => {
    res.json({ active: false, message: 'Bakım modu sistemden tamamen kaldırılmıştır.' });
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user profile and broadcast socket logout signal
// @access  Private/Admin
router.put('/users/:id/ban', protect, requirePermission('canBanUsers'), async (req, res) => {
    try {
        const { reason, expiresAt } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına ceza verilemez veya müdahale edilemez.' });
        }

        user.isBanned = true;
        user.banReason = reason || 'Topluluk kuralları ihlali';
        user.banExpiresAt = expiresAt ? new Date(expiresAt) : null;
        // CRIT-3: Invalidate all existing tokens for this user immediately
        user.tokenValidFrom = new Date();

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

        logActivity({
            action: 'BAN_USER',
            category: 'security',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username, reason: user.banReason, expiresAt: user.banExpiresAt }
        });

        res.json({ message: 'Kullanıcı başarıyla engellendi.', user });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/shadowban
// @desc    Toggle shadowban status of a user
// @access  Private/Admin
router.put('/users/:id/shadowban', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const { isShadowbanned } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        user.isShadowbanned = !!isShadowbanned;
        await user.save();

        logActivity({
            action: user.isShadowbanned ? 'SHADOWBAN_USER' : 'UNSHADOWBAN_USER',
            category: 'security',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username, isShadowbanned: user.isShadowbanned }
        });

        res.json({ message: `Kullanıcı hayalet moduna ${user.isShadowbanned ? 'alındı' : 'çıkarıldı'}.`, user });
    } catch (error) {
        console.error('Shadowban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user profile
// @access  Private/Admin
router.put('/users/:id/unban', protect, requirePermission('canBanUsers'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        user.isBanned = false;
        user.banReason = '';
        user.banExpiresAt = null;

        await user.save();

        logActivity({
            action: 'UNBAN_USER',
            category: 'security',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username }
        });

        res.json({ message: 'Kullanıcının engeli başarıyla kaldırıldı.', user });
    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/deactivate
// @desc    Deactivate/Soft-delete a user account (marks as passive, keeps all data permanently)
// @access  Private/Admin
router.put('/users/:id/deactivate', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        user.isDeleted = true;
        user.status = 'passive';
        user.deletedAt = new Date();
        user.deletionReason = reason || 'Yönetici tarafından pasife alındı / silindi';
        user.tokenValidFrom = new Date(); // Revoke active sessions

        await user.save();

        logActivity({
            action: 'ADMIN_USER_DEACTIVATE',
            category: 'admin',
            severity: 'warning',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username, reason: user.deletionReason, deletedAt: user.deletedAt }
        });

        res.json({ message: 'Kullanıcı hesabı başarıyla pasife alındı (silindi olarak işaretlendi). Tüm veriler güvendedir.', user });
    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   PUT /api/admin/users/:id/restore
// @desc    Restore/Reactivate a soft-deleted user account
// @access  Private/Admin
router.put('/users/:id/restore', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        user.isDeleted = false;
        user.status = 'active';
        user.deletedAt = null;
        user.deletionReason = '';
        user.recoveryStatus = 'none';

        await user.save();

        logActivity({
            action: 'ADMIN_USER_RESTORE',
            category: 'admin',
            severity: 'info',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username }
        });

        res.json({ message: 'Kullanıcı hesabı başarıyla yeniden aktif edildi.', user });
    } catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// @route   GET /api/admin/ip-bans
// @desc    Get all active IP bans
// @access  Private/Admin
router.get('/ip-bans', protect, requirePermission('canBanUsers'), async (req, res) => {
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
router.post('/ip-bans', protect, requirePermission('canBanUsers'), async (req, res) => {
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
router.delete('/ip-bans/:ip', protect, requirePermission('canBanUsers'), async (req, res) => {
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
router.put('/users/:id/recover-approve', protect, requirePermission('canManageRecovery'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        user.isDeleted = false;
        user.status = 'active';
        user.deletedAt = null;
        user.deletionReason = '';
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
router.put('/users/:id/recover-reject', protect, requirePermission('canManageRecovery'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || user.isAdmin || (user.isTouristAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
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
router.get('/custom-badges', protect, requirePermission('canManageBadges'), async (req, res) => {
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
router.post('/custom-badges', protect, requirePermission('canManageBadges'), async (req, res) => {
    try {
        const { name, url, key, shape, borderStyle } = req.body;
        if (!name || !url || !key) {
            return res.status(400).json({ message: 'Lütfen rozet adı, görsel URL ve anahtarını belirtin.' });
        }

        const badge = await CustomBadge.create({
            name,
            url,
            key,
            shape: shape || 'round',
            borderStyle: borderStyle || 'thin'
        });
        res.status(201).json(badge);
    } catch (error) {
        console.error('Create custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/admin/custom-badges/:id
// @desc    Update custom badge details
// @access  Private/Admin
router.put('/custom-badges/:id', protect, requirePermission('canManageBadges'), async (req, res) => {
    try {
        const { name, url, key, shape, borderStyle } = req.body;
        const badge = await CustomBadge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: 'Rozet bulunamadı.' });
        }

        const oldUrl = badge.url;

        if (name) badge.name = name.trim();
        if (url) badge.url = url;
        if (key) badge.key = key;
        if (shape) badge.shape = shape;
        if (borderStyle) badge.borderStyle = borderStyle;

        await badge.save();

        // Cascade update to portals and users currently using this badge
        try {
            const Portal = await import('../models/Portal.js').then(m => m.default);
            const User = await import('../models/User.js').then(m => m.default);

            const portalUpdate = {};
            if (name) portalUpdate['customBadge.name'] = badge.name;
            if (url) portalUpdate['customBadge.url'] = badge.url;
            if (shape) portalUpdate['customBadge.shape'] = badge.shape;
            if (borderStyle) portalUpdate['customBadge.borderStyle'] = badge.borderStyle;

            await Promise.all([
                Portal.updateMany({ 'customBadge.url': oldUrl }, { $set: portalUpdate }),
                User.updateMany({ 'customBadge.url': oldUrl }, { $set: portalUpdate })
            ]);
        } catch (cascadeErr) {
            console.error('Cascade custom badge update error:', cascadeErr);
        }

        res.json({ message: 'Özel rozet başarıyla güncellendi.', badge });
    } catch (error) {
        console.error('Update custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/custom-badges/:id
// @desc    Delete custom badge
// @access  Private/Admin
router.delete('/custom-badges/:id', protect, requirePermission('canManageBadges'), async (req, res) => {
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
router.post('/users/:id/custom-badge', protect, requirePermission('canManageBadges'), async (req, res) => {
    try {
        const { url, name, shape, borderStyle } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (user.username === 'oxypace' || (user.isAdmin && req.user.username !== 'oxypace')) {
            return res.status(403).json({ message: 'Yönetici hesaplarına müdahale edilemez.' });
        }

        const customBadgeObj = {
            url: url || '',
            name: name || '',
            shape: shape || 'round',
            borderStyle: borderStyle || 'thin'
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { customBadge: customBadgeObj } },
            { new: true, runValidators: false }
        );

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

        res.json({ message: 'Kullanıcı özel rozeti güncellendi.', user: updatedUser });
    } catch (error) {
        console.error('Assign custom badge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/my-permissions
// @desc    Get current user's live admin and tourist admin permissions
// @access  Private
router.get('/my-permissions', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('username isAdmin isTouristAdmin touristAdminExpiresAt touristAdminPermissions')
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isOxypace = user.username === 'oxypace';
        const isFullAdmin = isOxypace || (user.isAdmin && !user.isTouristAdmin);
        let isTouristAdmin = !!user.isTouristAdmin;

        if (isTouristAdmin && user.touristAdminExpiresAt && new Date(user.touristAdminExpiresAt) < new Date()) {
            isTouristAdmin = false;
        }

        res.json({
            isOxypace,
            isAdmin: !!user.isAdmin,
            isFullAdmin,
            isTouristAdmin,
            expiresAt: user.touristAdminExpiresAt,
            permissions: user.touristAdminPermissions || {}
        });
    } catch (err) {
        console.error('Fetch my-permissions error:', err);
        res.status(500).json({ message: 'Yetkiler alınamadı.' });
    }
});

// @route   GET /api/admin/tourist-admins
// @desc    Get all active tourist admins
// @access  Private/Admin (Oxypace Only)
router.get('/tourist-admins', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu sayfayı sadece baş yönetici görüntüleyebilir.' });
        }
        const touristAdmins = await User.find({ isTouristAdmin: true })
            .select('username email profile verificationBadge customBadge isVerified isAdmin isTouristAdmin touristAdminExpiresAt touristAdminPermissions assignedBy createdAt lastActive')
            .sort({ createdAt: -1 })
            .lean();
        res.json(touristAdmins);
    } catch (error) {
        console.error('Fetch tourist admins error:', error);
        res.status(500).json({ message: 'Turist adminler yüklenemedi.' });
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

        const { duration, expiresAt, revoke, permissions } = req.body;

        if (revoke) {
            user.isTouristAdmin = false;
            user.touristAdminExpiresAt = null;
            user.assignedBy = '';
            await user.save();

            logActivity({
                action: 'TOURIST_ADMIN_REVOKE',
                category: 'admin',
                req,
                targetId: user._id,
                targetType: 'User',
                details: { username: user.username }
            });

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

        // Apply granular Tourist Admin permissions
        if (permissions && typeof permissions === 'object') {
            user.touristAdminPermissions = {
                ...permissions,
                canManageRequests: !!permissions.canManageRequests,
                canManageRecovery: !!permissions.canManageRecovery,
                canManageFeedback: !!permissions.canManageFeedback,
                canManageUsers: !!permissions.canManageUsers,
                canBanUsers: !!permissions.canBanUsers,
                canManagePortals: !!permissions.canManagePortals,
                canManageReports: !!permissions.canManageReports,
                canManageBadges: !!permissions.canManageBadges,
                canManageBots: !!permissions.canManageBots,
                canViewLogs: !!permissions.canViewLogs,
                canSendNotifications: !!permissions.canSendNotifications,
                canManageBlog: !!permissions.canManageBlog,
                canManageMobile: !!permissions.canManageMobile,
                modules: permissions.modules || {}
            };
            user.markModified('touristAdminPermissions');
        }

        await user.save();

        logActivity({
            action: 'TOURIST_ADMIN_ASSIGN',
            category: 'admin',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username, expiryDate, permissions: user.touristAdminPermissions }
        });

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
                    message: messageText,
                    permissions: user.touristAdminPermissions,
                    expiresAt: user.touristAdminExpiresAt
                });
                io.to(user._id.toString()).emit('tourist_admin_permissions_updated', {
                    permissions: user.touristAdminPermissions,
                    expiresAt: user.touristAdminExpiresAt
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

// @route   PUT /api/admin/users/:id/tourist-admin/permissions
// @desc    Update permissions of an active Tourist Admin
// @access  Private/Admin (Oxypace Only)
router.put('/users/:id/tourist-admin/permissions', protect, admin, async (req, res) => {
    try {
        if (req.user.username !== 'oxypace') {
            return res.status(403).json({ message: 'Bu işlemi sadece baş yönetici yapabilir.' });
        }

        const user = await User.findById(req.params.id);
        if (!user || !user.isTouristAdmin) {
            return res.status(404).json({ message: 'Aktif turist admin bulunamadı.' });
        }

        const { permissions, expiresAt, duration } = req.body;
        if (permissions && typeof permissions === 'object') {
            user.touristAdminPermissions = {
                ...permissions,
                canManageRequests: !!permissions.canManageRequests,
                canManageRecovery: !!permissions.canManageRecovery,
                canManageFeedback: !!permissions.canManageFeedback,
                canManageUsers: !!permissions.canManageUsers,
                canBanUsers: !!permissions.canBanUsers,
                canManagePortals: !!permissions.canManagePortals,
                canManageReports: !!permissions.canManageReports,
                canManageBadges: !!permissions.canManageBadges,
                canManageBots: !!permissions.canManageBots,
                canViewLogs: !!permissions.canViewLogs,
                canSendNotifications: !!permissions.canSendNotifications,
                canManageBlog: !!permissions.canManageBlog,
                canManageMobile: !!permissions.canManageMobile,
                modules: permissions.modules || {}
            };
            user.markModified('touristAdminPermissions');
        }

        if (expiresAt) {
            user.touristAdminExpiresAt = new Date(expiresAt);
        } else if (duration) {
            const num = parseInt(duration);
            const unit = duration.slice(-1);
            if (unit === 'h') {
                user.touristAdminExpiresAt = new Date(Date.now() + num * 60 * 60 * 1000);
            } else if (unit === 'd') {
                user.touristAdminExpiresAt = new Date(Date.now() + num * 24 * 60 * 60 * 1000);
            }
        }

        await user.save();

        logActivity({
            action: 'TOURIST_ADMIN_PERMISSIONS_UPDATE',
            category: 'admin',
            req,
            targetId: user._id,
            targetType: 'User',
            details: { username: user.username, permissions: user.touristAdminPermissions, expiresAt: user.touristAdminExpiresAt }
        });

        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('tourist_admin_permissions_updated', {
                permissions: user.touristAdminPermissions,
                expiresAt: user.touristAdminExpiresAt
            });
        }

        res.json({ message: 'Turist Admin yetkileri güncellendi.', user });
    } catch (error) {
        console.error('Update tourist admin permissions error:', error);
        res.status(500).json({ message: 'Yetkiler güncellenemedi.' });
    }
});

// @route   GET /api/admin/activity-logs/stats
// @desc    Get real-time telemetry metrics for platform activity logs
// @access  Private/Admin
router.get('/activity-logs/stats', protect, requirePermission('canViewLogs'), async (req, res) => {
    try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            total24h,
            categoryStats,
            severityStats,
            recentSecurityAlerts,
            topActiveUsers
        ] = await Promise.all([
            ActivityLog.countDocuments({ createdAt: { $gte: last24h } }),
            ActivityLog.aggregate([
                { $match: { createdAt: { $gte: last24h } } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            ActivityLog.aggregate([
                { $match: { createdAt: { $gte: last24h } } },
                { $group: { _id: '$severity', count: { $sum: 1 } } }
            ]),
            ActivityLog.find({
                severity: { $in: ['security', 'critical'] },
                createdAt: { $gte: last24h }
            })
                .populate('user', 'username profile.displayName profile.avatar')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            ActivityLog.aggregate([
                { $match: { createdAt: { $gte: last24h }, user: { $ne: null } } },
                { $group: { _id: '$username', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        const categories = {};
        categoryStats.forEach(c => { if (c._id) categories[c._id] = c.count; });

        const severities = {};
        severityStats.forEach(s => { if (s._id) severities[s._id] = s.count; });

        res.json({
            total24h,
            categories: {
                auth: categories.auth || 0,
                portal: categories.portal || 0,
                rtc: categories.rtc || 0,
                storage: categories.storage || 0,
                bot: categories.bot || 0,
                content: categories.content || 0,
                system: categories.system || 0,
            },
            severities: {
                info: severities.info || 0,
                warning: severities.warning || 0,
                critical: severities.critical || 0,
                security: severities.security || 0,
            },
            recentSecurityAlerts,
            topActiveUsers
        });
    } catch (error) {
        console.error('Fetch activity logs stats error:', error);
        res.status(500).json({ message: 'Log istatistikleri alınamadı.' });
    }
});

// @route   GET /api/admin/activity-logs/export
// @desc    Export platform activity logs as JSON or CSV
// @access  Private/Admin
router.get('/activity-logs/export', protect, requirePermission('activity', 'canExport'), async (req, res) => {
    try {
        const { category, severity, q, format = 'json', limit = 1000 } = req.query;
        let query = {};

        if (category && category !== 'all') query.category = category;
        if (severity && severity !== 'all') query.severity = severity;
        if (q) {
            const escaped = escapeRegex(q);
            query.$or = [
                { username: { $regex: escaped, $options: 'i' } },
                { action: { $regex: escaped, $options: 'i' } },
                { ip: { $regex: escaped, $options: 'i' } },
                { targetName: { $regex: escaped, $options: 'i' } },
                { portalName: { $regex: escaped, $options: 'i' } }
            ];
        }

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        if (format === 'csv') {
            const headers = ['Tarih', 'Kategori', 'Eylem', 'Önem', 'Kullanıcı', 'IP', 'Ülke/Şehir', 'Hedef', 'Detay'];
            const rows = logs.map(l => [
                `"${new Date(l.createdAt).toISOString()}"`,
                `"${l.category}"`,
                `"${l.action}"`,
                `"${l.severity}"`,
                `"${l.username || 'Sistem'}"`,
                `"${l.ip || ''}"`,
                `"${l.country || ''} - ${l.city || ''}"`,
                `"${l.targetName || l.targetId || ''}"`,
                `"${(typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '')).replace(/"/g, '""')}"`
            ]);
            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="platform-logs-${Date.now()}.csv"`);
            return res.send(csvContent);
        }

        res.setHeader('Content-Disposition', `attachment; filename="platform-logs-${Date.now()}.json"`);
        res.json(logs);
    } catch (error) {
        console.error('Export activity logs error:', error);
        res.status(500).json({ message: 'Log dışa aktarma başarısız.' });
    }
});

// @route   GET /api/admin/activity-logs
// @desc    Get enterprise system activity logs / platform footprints
// @access  Private/Admin
router.get('/activity-logs', protect, requirePermission('canViewLogs'), async (req, res) => {
    try {
        const {
            q,
            category,
            severity,
            action,
            userId,
            portalId,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        let query = {};

        if (userId) query.user = userId;
        if (portalId) query.portal = portalId;

        if (category && category !== 'all') {
            query.category = category;
        }

        if (severity && severity !== 'all') {
            query.severity = severity;
        }

        if (action && action !== 'all') {
            query.action = action.toUpperCase();
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (q) {
            const escaped = escapeRegex(q);
            query.$or = [
                { username: { $regex: escaped, $options: 'i' } },
                { ip: { $regex: escaped, $options: 'i' } },
                { action: { $regex: escaped, $options: 'i' } },
                { targetId: { $regex: escaped, $options: 'i' } },
                { targetName: { $regex: escaped, $options: 'i' } },
                { portalName: { $regex: escaped, $options: 'i' } },
                { 'details.reason': { $regex: escaped, $options: 'i' } },
                { 'details.title': { $regex: escaped, $options: 'i' } },
                { 'details.fileName': { $regex: escaped, $options: 'i' } },
                { 'details.securityAlert': { $regex: escaped, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .populate('user', 'username profile.displayName profile.avatar')
                .populate('portal', 'name avatar channels')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ActivityLog.countDocuments(query)
        ]);

        // Enrich logs with portalName and friendly channelName if missing or unpopulated
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            let pId = log.portal?._id || log.portal || log.details?.portalId;
            let chId = log.channel || log.details?.channelName || log.details?.channel || log.details?.channelId;

            // Check if portal name is already stored or passed as string in details.portal
            let pName = log.portalName || log.portal?.name || log.details?.portalName || '';
            if (!pName && typeof log.details?.portal === 'string' && !/^[a-f0-9]{24}$/i.test(log.details.portal)) {
                pName = log.details.portal;
            }

            if (log.details?.roomName && typeof log.details.roomName === 'string') {
                const match = log.details.roomName.match(/portal_([a-f0-9]{24})_channel_([\w-]+)/i);
                if (match) {
                    pId = pId || match[1];
                    chId = chId || match[2];
                }
            }

            if (pId && (!pName || !chId || /^[a-f0-9]{24}$/i.test(chId))) {
                try {
                    const pDoc = await Portal.findById(pId).select('name channels').lean();
                    if (pDoc) {
                        if (!pName) pName = pDoc.name;
                        if (chId && pDoc.channels) {
                            const ch = pDoc.channels.find(c => c._id?.toString() === String(chId) || c.name === String(chId));
                            if (ch) chId = ch.name;
                        }
                    }
                } catch (e) {}
            }

            if (pName) {
                log.portalName = pName;
                if (log.details) {
                    log.details.portalName = pName;
                    if (!log.details.portal) log.details.portal = pName;
                }
            }
            if (chId) {
                log.channel = String(chId);
                if (log.details) {
                    log.details.channelName = String(chId);
                    if (!log.details.channel) log.details.channel = String(chId);
                }
            }
            return log;
        }));

        res.json({
            logs: enrichedLogs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Fetch activity logs error:', error);
        res.status(500).json({ message: 'Platform günlükleri getirilemedi.' });
    }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete post by admin
// @access  Private/Admin
router.delete('/posts/:id', protect, admin, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Gönderi bulunamadı.' });
        }

        const snippet = post.content ? post.content.substring(0, 80) : '';
        await Post.deleteOne({ _id: post._id });

        logActivity({
            action: 'ADMIN_POST_DELETE',
            category: 'content',
            req,
            targetId: post._id,
            targetType: 'Post',
            details: { snippet, authorId: post.author, portalId: post.portal }
        });

        res.json({ message: 'Gönderi sistemden kalıcı olarak silindi.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Gönderi silinemedi.' });
    }
});

// @route   POST /api/admin/mass-notification
// @desc    Send mass notification (in-app and/or push) to all active users
// @access  Private/Admin
router.post('/mass-notification', protect, requirePermission('canSendNotifications'), async (req, res) => {
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
router.get('/bots', protect, requirePermission('canManageBots'), async (req, res) => {
    try {
        const bots = await User.find({ isBot: true }).select('username email profile verificationBadge isBanned createdAt postCount');
        const configs = await BotConfig.find()
            .populate('defaultPortal', 'name avatar channels')
            .populate('creator', 'username profile.displayName');
        
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
                postCount: bot.postCount || 0,
                config: config ? {
                    _id: config._id,
                    feeds: config.feeds || [],
                    defaultPortal: config.defaultPortal,
                    defaultChannel: config.defaultChannel || 'general',
                    intervalMinutes: config.intervalMinutes || 15,
                    isActive: config.isActive !== false,
                    autoTranslate: config.autoTranslate !== false,
                    postPrefix: config.postPrefix || '📢',
                    creator: config.creator ? { _id: config.creator._id, username: config.creator.username, displayName: config.creator.profile?.displayName } : null,
                    stats: config.stats || {}
                } : { feeds: [], defaultPortal: null, defaultChannel: 'general', intervalMinutes: 15, isActive: true, autoTranslate: true, stats: {} }
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
router.post('/bots', protect, requirePermission('canManageBots'), async (req, res) => {
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
router.delete('/bots/:id', protect, requirePermission('canManageBots'), async (req, res) => {
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
router.put('/bots/:id/profile', protect, requirePermission('canManageBots'), async (req, res) => {
    try {
        const botUser = await User.findOne({ _id: req.params.id, isBot: true });
        if (!botUser) {
            return res.status(404).json({ message: 'Bot hesabı bulunamadı.' });
        }

        const { displayName, bio, avatar, coverImage, feeds, defaultPortal, defaultChannel, intervalMinutes, isActive, autoTranslate, postPrefix, includeSourceLink } = req.body;

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

        if (intervalMinutes !== undefined) {
            config.intervalMinutes = Math.max(5, Math.min(1440, Number(intervalMinutes) || 15));
        }

        if (isActive !== undefined) {
            config.isActive = Boolean(isActive);
        }

        if (autoTranslate !== undefined) {
            config.autoTranslate = Boolean(autoTranslate);
        }

        if (postPrefix !== undefined) {
            config.postPrefix = postPrefix;
        }

        if (includeSourceLink !== undefined) {
            config.includeSourceLink = Boolean(includeSourceLink);
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
router.post('/bots/:id/post', protect, requirePermission('canManageBots'), async (req, res) => {
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

// @route   POST /api/admin/bots/:id/run
// @desc    Manually test and run bot right now
// @access  Private/Admin
router.post('/bots/:id/run', protect, requirePermission('canManageBots'), async (req, res) => {
    try {
        const { runSingleBot } = await import('../bots/newsBot.js');
        const result = await runSingleBot(req.params.id, req.app.get('io'));
        res.json(result);
    } catch (error) {
        console.error('Admin run bot error:', error);
        res.status(500).json({ success: false, message: 'Bot çalıştırma hatası: ' + error.message });
    }
});

// @route   PUT /api/admin/bots/:id/toggle
// @desc    Toggle bot active / paused status
// @access  Private/Admin
router.put('/bots/:id/toggle', protect, requirePermission('canManageBots'), async (req, res) => {
    try {
        const botUser = await User.findOne({ _id: req.params.id, isBot: true });
        if (!botUser) return res.status(404).json({ message: 'Bot bulunamadı' });

        let config = await BotConfig.findOne({ bot: botUser._id });
        if (!config) {
            config = new BotConfig({ bot: botUser._id });
        }

        config.isActive = !config.isActive;
        await config.save();

        res.json({
            message: config.isActive ? 'Bot etkinleştirildi.' : 'Bot duraklatıldı.',
            isActive: config.isActive
        });
    } catch (error) {
        console.error('Admin toggle bot error:', error);
        res.status(500).json({ message: 'Durum değiştirilemedi: ' + error.message });
    }
});

// @route   POST /api/admin/broadcast-announcement
// @desc    Broadcast release announcement / notification to all active users across web and mobile
// @access  Private/Admin
router.post('/broadcast-announcement', protect, requirePermission('canSendNotifications'), async (req, res) => {
    try {
        const { title, body, link, imageUrl } = req.body;
        if (!title || !body) {
            return res.status(400).json({ message: 'Title ve body alanları zorunludur.' });
        }

        const targetRoute = link || '/';
        const notifTitle = title.trim();
        const notifBody = body.trim();

        // 1. Fetch all active non-deleted users
        const users = await User.find({ isDeleted: { $ne: true } }).select('_id fcmTokens settings');
        if (!users || users.length === 0) {
            return res.json({ message: 'Gönderilecek kullanıcı bulunamadı.', count: 0 });
        }

        // 2. Prepare database notifications
        const notificationDocs = users.map(u => ({
            recipient: u._id,
            sender: req.user._id,
            type: 'system',
            content: notifBody,
            link: targetRoute,
            imageUrl: imageUrl || undefined,
            read: false
        }));

        // Insert in bulk
        await Notification.insertMany(notificationDocs);

        // 3. Emit real-time socket notification to online users
        const io = req.app.get('io');
        if (io) {
            io.emit('newNotification', {
                title: notifTitle,
                content: notifBody,
                link: targetRoute,
                imageUrl: imageUrl || undefined,
                type: 'system',
                createdAt: new Date(),
                sender: {
                    username: req.user.username,
                    profile: req.user.profile
                }
            });
        }

        // 4. Collect all valid FCM tokens for mobile push
        const allTokens = [];
        for (const u of users) {
            if (u.settings?.notifications?.push !== false && Array.isArray(u.fcmTokens)) {
                for (const t of u.fcmTokens) {
                    if (t && typeof t === 'string' && !allTokens.includes(t)) {
                        allTokens.push(t);
                    }
                }
            }
        }

        // 5. Send FCM push notification
        if (allTokens.length > 0) {
            const { sendPushNotification } = await import('../services/pushService.js');
            // Multicast in batches of 500
            for (let i = 0; i < allTokens.length; i += 500) {
                const batch = allTokens.slice(i, i + 500);
                await sendPushNotification(batch, {
                    title: notifTitle,
                    body: notifBody,
                    image: imageUrl,
                    data: {
                        url: targetRoute,
                        route: targetRoute,
                        type: 'system',
                        title: notifTitle,
                        body: notifBody,
                        imageUrl: imageUrl || ''
                    }
                });
            }
        }

        res.json({
            message: 'Duyuru başarıyla tüm kullanıcılara web ve mobil olarak iletildi.',
            userCount: users.length,
            fcmTokenCount: allTokens.length
        });
    } catch (error) {
        console.error('Broadcast announcement error:', error);
        res.status(500).json({ message: 'Duyuru gönderilirken hata oluştu: ' + error.message });
    }
});

// @route   POST /api/admin/users/send-update-prompt
// @desc    Send system update prompt notification to users with outdated app versions
// @access  Private/Admin
router.post('/users/send-update-prompt', protect, requirePermission('canManageUsers'), async (req, res) => {
    try {
        const { userId, minVersionCode = 255, customMessage } = req.body;
        const io = req.app.get('io');
        const defaultMsg = customMessage || 'Oxypace v2.5.5 yayınlandı! Canlı görüntülü odalarda veri tasarrufu modu, ses çıkışı ve mikrofon kararlılık iyileştirmelerini kullanabilmek için lütfen uygulamanızı güncelleyin.';

        let targetUsers = [];
        if (userId) {
            targetUsers = await User.find({ _id: userId, isDeleted: { $ne: true } }).select('_id username fcmTokens settings');
        } else {
            // Find all users who are on android and have versionCode < minVersionCode
            targetUsers = await User.find({
                isDeleted: { $ne: true },
                appPlatform: 'android',
                $or: [
                    { versionCode: { $lt: minVersionCode } },
                    { versionCode: null },
                    { versionCode: 0 }
                ]
            }).select('_id username fcmTokens settings');
        }

        if (targetUsers.length === 0) {
            return res.json({ message: 'Güncelleme gönderilecek kullanıcı bulunamadı.', count: 0 });
        }

        // 1. In-app system notifications
        const notificationDocs = targetUsers.map(u => ({
            recipient: u._id,
            sender: req.user._id,
            type: 'system',
            content: `📢 [Sistem Güncellemesi] ${defaultMsg}`,
            link: '/downloads/oxypace.apk',
            read: false
        }));
        await Notification.insertMany(notificationDocs);

        // 2. Socket notification & instant update trigger
        if (io) {
            targetUsers.forEach(u => {
                const uIdStr = String(u._id);
                io.to(uIdStr).emit('newNotification', {
                    title: 'Yeni Sürüm Güncellemesi Mevcut!',
                    content: defaultMsg,
                    link: '/downloads/oxypace.apk',
                    type: 'system',
                    createdAt: new Date()
                });
                io.to(uIdStr).emit('prompt_app_update', {
                    latestVersion: '2.5.5',
                    versionCode: 255,
                    changelog: defaultMsg,
                    downloadUrl: 'https://api.oxypace.com.tr/downloads/oxypace.apk'
                });
            });
        }

        // 3. FCM push notifications
        const allTokens = [];
        for (const u of targetUsers) {
            if (u.settings?.notifications?.push !== false && Array.isArray(u.fcmTokens)) {
                for (const t of u.fcmTokens) {
                    if (t && typeof t === 'string' && !allTokens.includes(t)) {
                        allTokens.push(t);
                    }
                }
            }
        }

        if (allTokens.length > 0) {
            try {
                const { sendPushNotification } = await import('../services/pushService.js');
                for (let i = 0; i < allTokens.length; i += 500) {
                    const batch = allTokens.slice(i, i + 500);
                    await sendPushNotification(batch, {
                        title: '📢 Oxypace Güncellemesi Mevcut!',
                        body: defaultMsg,
                        url: 'https://api.oxypace.com.tr/downloads/oxypace.apk',
                        notificationType: 'system'
                    });
                }
            } catch (pushErr) {
                console.warn('send-update-prompt push warning:', pushErr.message);
            }
        }

        res.json({ message: `${targetUsers.length} kullanıcıya sistem güncelleme mesajı gönderildi.`, count: targetUsers.length });
    } catch (err) {
        console.error('send-update-prompt error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;

