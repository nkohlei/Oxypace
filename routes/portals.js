import express from 'express';
import Portal from '../models/Portal.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, optionalProtect } from '../middleware/auth.js';
import multer from 'multer';
import upload from '../middleware/upload.js';

const router = express.Router();

// @desc    Create a new portal
// @route   POST /api/portals
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, privacy, avatar, allowedUsers } = req.body;

        const portalExists = await Portal.findOne({ name });
        if (portalExists) {
            return res.status(400).json({ message: 'Portal name already exists' });
        }

        const portal = await Portal.create({
            name,
            description,
            privacy,
            avatar,
            allowedUsers: allowedUsers || [],
            owner: req.user._id,
            admins: [req.user._id],
            members: [req.user._id],
            channels: [{ name: 'genel', type: 'text' }],
        });

        // Add to user's joined portals
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { joinedPortals: portal._id },
        });

        res.status(201).json(portal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all portals (Search & Popular)
// @route   GET /api/portals
// @access  Public (Optional Auth)
router.get('/', optionalProtect, async (req, res) => {
    try {
        const keyword = req.query.keyword
            ? {
                name: {
                    $regex: req.query.keyword,
                    $options: 'i',
                },
            }
            : {};

        // Exclude portals where user is blocked and filter by privacy
        if (req.user) {
            keyword.blockedUsers = { $ne: req.user._id };
            keyword.$or = [
                { privacy: 'public' },
                { members: req.user._id },
                { allowedUsers: req.user._id }
            ];
        } else {
            keyword.privacy = 'public';
        }

        const portals = await Portal.find(keyword)
            .select('name description avatar banner privacy members joinRequests themeColor')
            .limit(20);

        const userId = req.user?._id?.toString();
        const formattedPortals = portals.map((portal) => {
            const portalObj = portal.toObject();
            portalObj.memberCount = portal.members?.length || 0;

            if (userId) {
                portalObj.isMember = portal.members.some((m) => m.toString() === userId);
                portalObj.isRequested = portal.joinRequests?.some((r) => r.toString() === userId);
            }

            // Remove potentially large arrays before sending
            delete portalObj.members;
            delete portalObj.joinRequests;

            return portalObj;
        });

        res.json(formattedPortals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// @desc    Get portal by ID
// @route   GET /api/portals/:id
// @access  Public
router.get('/:id', optionalProtect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id)
            .populate('owner', 'username profile.displayName profile.avatar')
            .populate('admins', 'username profile.displayName profile.avatar')
            .populate('members', 'username profile.displayName profile.avatar')
            .populate('allowedUsers', 'username profile.displayName profile.avatar');

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const userId = req.user?._id?.toString();

        // Access Control: Blocked check
        if (userId && portal.blockedUsers?.includes(userId)) {
            return res.status(403).json({ message: 'Bu portala erişiminiz engellendi.' });
        }

        const portalObj = portal.toObject();

        if (userId) {
            portalObj.isMember = portal.members.some((m) => (m._id || m).toString() === userId);
            portalObj.isRequested = portal.joinRequests?.some((r) => r.toString() === userId);
        } else {
            portalObj.isMember = false;
            portalObj.isRequested = false;
        }

        // Filter out private channels for non-members
        if (!portalObj.isMember) {
            portalObj.channels = portalObj.channels.filter((ch) => !ch.isPrivate);
        }

        res.json(portalObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get posts for a specific portal
// @route   GET /api/portals/:id/posts
// @access  Public (if public portal) / Private (if private)
router.get('/:id/posts', optionalProtect, async (req, res) => {
    try {
        const portalId = req.params.id;
        const channel = req.query.channel || 'general';

        const portal = await Portal.findById(portalId);
        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        // Privacy Check
        const userId = req.user?._id;

        // Block check
        if (userId && portal.blockedUsers?.includes(userId)) {
            return res.status(403).json({ message: 'Bu portala erişiminiz engellendi.' });
        }

        if (portal.privacy === 'private') {
            let isMember = userId && portal.members.some((m) => m.toString() === userId.toString());

            // Self-Healing: Check if user has this portal in joinedPortals but is missing from portal.members
            if (!isMember && userId) {
                const user = await User.findById(userId);
                if (user && user.joinedPortals.includes(portalId)) {
                    console.log(`Self-healing membership for user ${userId} in portal ${portalId}`);
                    // Repair: Add to portal members
                    portal.members.push(userId);
                    await portal.save();
                    isMember = true;
                }
            }

            if (!isMember) {
                return res
                    .status(403)
                    .json({ message: 'Bu portal gizlidir. İçeriği görmek için üye olmalısınız.' });
            }
        }

        // Channel Privacy Check
        const targetChannel = portal.channels.find(
            (c) =>
                c.name === channel ||
                (channel === 'general' && (c.name === 'genel' || c.name === 'general'))
        );
        if (targetChannel && targetChannel.isPrivate) {
            const isMember =
                userId && portal.members.some((m) => m.toString() === userId.toString());
            // For now, private channels are only for members. Future: admins only etc.
            if (!isMember) {
                return res.status(403).json({ message: 'Bu kanal gizlidir.' });
            }
        }

        const query = { portal: portalId };

        if (channel === 'general') {
            query.$or = [
                { channel: 'general' },
                { channel: 'genel' },
                { channel: { $exists: false } },
                { channel: null }
            ];
        } else {
            query.channel = channel;
        }

        // Pagination
        const limit = parseInt(req.query.limit) || 10;
        const before = req.query.before;

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const posts = await Post.find(query)
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Join a portal
// @route   POST /api/portals/:id/join
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        if (portal.members.some((m) => m.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'Zaten üyesiniz' });
        }

        // Restricted Mode Check
        if (portal.privacy === 'restricted') {
            const isAllowed = portal.allowedUsers?.some(
                (u) => u.toString() === req.user._id.toString()
            );
            if (!isAllowed) {
                return res
                    .status(403)
                    .json({ message: 'Bu portala erişim izniniz yok (Kısıtlı Erişim).' });
            }
            // If allowed, fall through to join immediately (like public)
        }

        if (portal.blockedUsers?.includes(req.user._id)) {
            return res.status(403).json({ message: 'Bu portaldan engellendiniz.' });
        }

        if (portal.privacy === 'private') {
            // Check if already requested
            if (
                portal.joinRequests &&
                portal.joinRequests.some((r) => r.toString() === req.user._id.toString())
            ) {
                return res.status(400).json({ message: 'Zaten üyelik isteği gönderdiniz' });
            }

            portal.joinRequests.push(req.user._id);
            await portal.save();
            return res.json({ message: 'Üyelik isteğiniz gönderildi', status: 'requested' });
        }

        // Public portal: Join immediately
        portal.members.push(req.user._id);
        await portal.save();

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { joinedPortals: portal._id },
        });

        res.json({ message: 'Portala başarıyla katıldınız', status: 'joined' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Leave a portal
// @route   POST /api/portals/:id/leave
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        // Prevent owner from leaving without transferring ownership (simplified: owner can't leave)
        if (portal.owner.toString() === req.user._id.toString()) {
            return res
                .status(400)
                .json({ message: 'Owner cannot leave the portal. Transfer ownership first.' });
        }

        portal.members = portal.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );
        await portal.save();

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { joinedPortals: portal._id },
        });

        res.json({ message: 'Left portal successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update portal settings
// @route   PUT /api/portals/:id
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, description, privacy, allowedUsers } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        if (portal.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this portal' });
        }

        portal.name = name || portal.name;
        portal.description = description || portal.description;
        portal.privacy = privacy || portal.privacy;
        if (allowedUsers) {
            portal.allowedUsers = allowedUsers;
        }

        await portal.save();

        // Repopulate owner for frontend consistency
        await portal.populate('owner', 'username profile.displayName profile.avatar');
        await portal.populate('allowedUsers', 'username profile.displayName profile.avatar');

        res.json(portal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload portal avatar
// @route   POST /api/portals/:id/avatar
// @access  Private (Owner only)
router.post('/:id/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        if (portal.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.file) {
            // Use backend proxy URL instead of R2 direct URL
            const backendUrl =
                process.env.BACKEND_URL || 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app';
            const publicUrl = `${backendUrl}/api/media/${req.file.key}`;
            portal.avatar = publicUrl;
            await portal.save();
            await portal.populate('owner', 'username profile.displayName profile.avatar');
            res.json(portal);
        } else {
            res.status(400).json({ message: 'No file uploaded' });
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Upload portal banner
// @route   POST /api/portals/:id/banner
// @access  Private (Owner only)
router.post('/:id/banner', protect, upload.single('banner'), async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        if (portal.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.file) {
            // Use backend proxy URL instead of R2 direct URL
            const backendUrl =
                process.env.BACKEND_URL || 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app';
            const publicUrl = `${backendUrl}/api/media/${req.file.key}`;
            portal.banner = publicUrl; // Make sure Portal model has banner field
            await portal.save();
            await portal.populate('owner', 'username profile.displayName profile.avatar');
            res.json(portal);
        } else {
            res.status(400).json({ message: 'No file uploaded' });
        }
    } catch (error) {
        console.error('Banner upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Channel Management ---

// @desc    Add a channel
// @route   POST /api/portals/:id/channels
// @access  Private (Owner/Admin)
router.post('/:id/channels', protect, async (req, res) => {
    try {
        const { name } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        // Authorization: Owner or Admin
        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        portal.channels.push({ name });
        await portal.save();
        res.json(portal.channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a channel
// @route   DELETE /api/portals/:id/channels/:channelId
// @access  Private (Owner/Admin)
router.delete('/:id/channels/:channelId', protect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        portal.channels = portal.channels.filter(
            (ch) => ch._id.toString() !== req.params.channelId
        );
        await portal.save();
        res.json(portal.channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a channel
// @route   PUT /api/portals/:id/channels/:channelId
// @access  Private (Owner/Admin)
router.put('/:id/channels/:channelId', protect, async (req, res) => {
    try {
        const { name, isPrivate } = req.body;
        const portal = await Portal.findById(req.params.id);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const channel = portal.channels.id(req.params.channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        if (name) {
            channel.name = name;
        }
        if (isPrivate !== undefined) {
            channel.isPrivate = isPrivate;
        }

        await portal.save();
        res.json(portal.channels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Member & Role Management ---

// @desc    Link/Unlink Admin (Er Yönetici Atama/Alma)
// @route   POST /api/portals/:id/roles
// @access  Private (Owner Only - As Yönetici)
router.post('/:id/roles', protect, async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'promote' or 'demote'
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        // Only Owner (As Yönetici) can manage roles
        if (portal.owner.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Only the Owner (As Yönetici) can manage roles' });
        }

        if (action === 'promote') {
            if (!portal.admins.includes(userId)) {
                portal.admins.push(userId);
            }
        } else if (action === 'demote') {
            portal.admins = portal.admins.filter((id) => id.toString() !== userId);
        }

        await portal.save();
        // Return full member details to look reactive
        await portal.populate('admins', 'username profile.displayName profile.avatar');
        res.json(portal.admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Kick Member
// @route   POST /api/portals/:id/kick
// @access  Private (Owner/Admin)
router.post('/:id/kick', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        // Target user check
        if (portal.owner.toString() === userId) {
            return res.status(400).json({ message: 'Cannot kick the owner' });
        }

        // Permissions logic
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // Admin cannot kick another admin (Only Owner can)
        if (isAdmin && portal.admins.includes(userId) && !isOwner) {
            return res.status(403).json({ message: 'Admins cannot kick other admins' });
        }

        // Remove from members and admins
        portal.members = portal.members.filter((id) => id.toString() !== userId);
        portal.admins = portal.admins.filter((id) => id.toString() !== userId);

        await portal.save();

        // Remove from user's joined list
        await User.findByIdAndUpdate(userId, {
            $pull: { joinedPortals: portal._id },
        });

        res.json({ message: 'User kicked', userId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Block User
// @route   POST /api/portals/:id/block
// @access  Private (Owner/Admin)
router.post('/:id/block', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (portal.owner.toString() === userId) {
            return res.status(400).json({ message: 'Cannot block owner' });
        }

        // Remove from members/admins/requests
        portal.members = portal.members.filter((id) => id.toString() !== userId);
        portal.admins = portal.admins.filter((id) => id.toString() !== userId);
        portal.joinRequests = portal.joinRequests.filter((id) => id.toString() !== userId);

        // Add to blocked
        if (!portal.blockedUsers.includes(userId)) {
            portal.blockedUsers.push(userId);
        }

        await portal.save();

        // Remove from user's joined list
        await User.findByIdAndUpdate(userId, {
            $pull: { joinedPortals: portal._id },
        });

        res.json({ message: 'User blocked', userId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Unblock User
// @route   POST /api/portals/:id/unblock
// @access  Private (Owner/Admin)
router.post('/:id/unblock', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.includes(req.user._id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        portal.blockedUsers = portal.blockedUsers.filter((id) => id.toString() !== userId);
        await portal.save();

        res.json({ message: 'User unblocked', userId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get blocked users
// @route   GET /api/portals/:id/blocked
// @access  Private (Owner/Admin)
router.get('/:id/blocked', protect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id).populate(
            'blockedUsers',
            'username profile.displayName profile.avatar'
        );

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.some((a) => a.toString() === req.user._id.toString());

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(portal.blockedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Invite user to portal
// @route   POST /api/portals/:id/invite
// @access  Private
router.post('/:id/invite', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (!portal.members.some((m) => m.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Bu portala üye değilsiniz.' });
        }

        if (portal.members.some((m) => m.toString() === userId.toString())) {
            return res.status(400).json({ message: 'Bu kullanıcı zaten üye.' });
        }

        // We no longer send a specialized portal_invite notification here
        // as the frontend sends a formal message which triggers a 'message' notification.

        res.json({ message: 'Davet başarıyla açıklandı (Mesaj yoluyla)' });
    } catch (error) {
        console.error('Invite error details:', {
            portalId: req.params.id,
            targetUserId: req.body.userId,
            senderId: req.user?._id,
            error: error.message,
        });
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
});

// @desc    Get portal notifications (join requests and recent members)
// @route   GET /api/portals/:id/notifications
// @access  Private (Admin only)
router.get('/:id/notifications', protect, async (req, res) => {
    try {
        const portal = await Portal.findById(req.params.id)
            .populate('joinRequests', 'username profile.avatar profile.displayName createdAt')
            .populate('members', 'username profile.avatar profile.displayName createdAt');

        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        // Check if user is admin or owner
        const isAdmin = portal.admins.some((a) => a.toString() === req.user._id.toString());
        const isOwner = portal.owner.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Get recent members (last 10)
        const recentMembers = portal.members
            .slice(-10)
            .reverse()
            .map((member) => ({
                _id: member._id,
                username: member.username,
                profile: member.profile,
                joinedAt: member.createdAt,
            }));

        res.json({
            joinRequests: portal.joinRequests,
            recentMembers,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve join request
// @route   POST /api/portals/:id/approve-member
// @access  Private (Admin only)
router.post('/:id/approve-member', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        // Check if user is admin or owner
        const isAdmin = portal.admins.some((a) => a.toString() === req.user._id.toString());
        const isOwner = portal.owner.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Check if user is in joinRequests
        if (!portal.joinRequests.some((r) => r.toString() === userId)) {
            return res.status(400).json({ message: 'Bu kullanıcı için bekleyen istek yok' });
        }

        // Remove from joinRequests and add to members
        portal.joinRequests = portal.joinRequests.filter((r) => r.toString() !== userId);
        portal.members.push(userId);
        await portal.save();

        // Update user's joinedPortals
        await User.findByIdAndUpdate(userId, {
            $addToSet: { joinedPortals: portal._id },
        });

        res.json({ message: 'Üyelik isteği onaylandı', userId });
    } catch (error) {
        console.error('Approve member error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reject join request
// @route   POST /api/portals/:id/reject-member
// @access  Private (Admin only)
router.post('/:id/reject-member', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const portal = await Portal.findById(req.params.id);

        if (!portal) {
            return res.status(404).json({ message: 'Portal bulunamadı' });
        }

        // Check if user is admin or owner
        const isAdmin = portal.admins.some((a) => a.toString() === req.user._id.toString());
        const isOwner = portal.owner.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Check if user is in joinRequests
        if (!portal.joinRequests.some((r) => r.toString() === userId)) {
            return res.status(400).json({ message: 'Bu kullanıcı için bekleyen istek yok' });
        }

        // Remove from joinRequests
        portal.joinRequests = portal.joinRequests.filter((r) => r.toString() !== userId);
        await portal.save();

        res.json({ message: 'Üyelik isteği reddedildi', userId });
    } catch (error) {
        console.error('Reject member error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
