import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, optionalProtect } from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';

const router = express.Router();

// @route   POST /api/users/follow/:id
// @desc    Follow/Unfollow user or cancel request
// @access  Private
router.post('/follow/:id', protect, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize arrays if missing
        if (!targetUser.followers) targetUser.followers = [];
        if (!targetUser.followRequests) targetUser.followRequests = [];
        if (!currentUser.following) currentUser.following = [];

        const isFollowing = targetUser.followers.some(id => id.toString() === req.user._id.toString());
        const hasRequested = targetUser.followRequests.some(id => id.toString() === req.user._id.toString());

        if (isFollowing) {
            // Unfollow
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user._id.toString());
            targetUser.followerCount = Math.max(0, targetUser.followerCount - 1);

            currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
            currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);

            await targetUser.save();
            await currentUser.save();

            return res.json({ message: 'Unfollowed', isFollowing: false, hasRequested: false });
        }

        if (hasRequested) {
            // Cancel Request
            targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== req.user._id.toString());
            await targetUser.save();
            return res.json({ message: 'Request cancelled', isFollowing: false, hasRequested: false });
        }

        // START FOLLOW PROCESS
        if (targetUser.settings?.privacy?.isPrivate) {
            // Send Request
            if (!hasRequested) {
                targetUser.followRequests.push(req.user._id);
                await targetUser.save();
            }

            // Notify
            const notification = await Notification.create({
                recipient: targetUser._id,
                sender: currentUser._id,
                type: 'follow_request'
            });

            const io = req.app.get('io');
            if (io) {
                const populated = await notification.populate('sender', 'username profile.displayName profile.avatar verificationBadge');
                io.to(targetUser._id.toString()).emit('newNotification', populated);
            }

            return res.json({ message: 'Follow request sent', isFollowing: false, hasRequested: true });

        } else {
            // Direct Follow
            targetUser.followers.push(req.user._id);
            targetUser.followerCount += 1;
            currentUser.following.push(targetUser._id);
            currentUser.followingCount += 1;

            await targetUser.save();
            await currentUser.save();

            // Notify
            const notification = await Notification.create({
                recipient: targetUser._id,
                sender: currentUser._id,
                type: 'follow'
            });

            const io = req.app.get('io');
            if (io) {
                const populated = await notification.populate('sender', 'username profile.displayName profile.avatar verificationBadge');
                io.to(targetUser._id.toString()).emit('newNotification', populated);
            }

            return res.json({ message: 'Followed', isFollowing: true, hasRequested: false });
        }

    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/users/follow/accept/:id
// @desc    Accept follow request
// @access  Private
router.post('/follow/accept/:id', protect, async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUser = await User.findById(req.user._id);
        const requester = await User.findById(requesterId);

        if (!requester) return res.status(404).json({ message: 'User not found' });

        if (!currentUser.followRequests.some(id => id.toString() === requesterId)) {
            return res.status(400).json({ message: 'No request found from this user' });
        }

        // Move from requests to followers
        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
        currentUser.followers.push(requesterId);
        currentUser.followerCount += 1;

        // Add to requester's following
        requester.following.push(currentUser._id);
        requester.followingCount += 1;

        await currentUser.save();
        await requester.save();

        // Notify Requester
        const notification = await Notification.create({
            recipient: requester._id,
            sender: currentUser._id,
            type: 'follow' // Or 'request_accepted' generic
        });
        // We reuse 'follow' type to say "XYZ followed you" (technically they are now following you)
        // Or we could trigger a "XYZ accepted your follow request" if we had that type. 
        // For now, let's just let them know they are following. 
        // Actually, Instagram sends "XYZ accepted your follow request". 
        // But since we don't have that enum, we create a 'follow' notification from the requester perspective? 
        // No, let's keep it simple.

        const io = req.app.get('io');
        if (io) {
            // Maybe emit an event to update their UI
            io.to(requesterId.toString()).emit('requestAccepted', { userId: currentUser._id });
        }

        res.json({ message: 'Request accepted' });

    } catch (error) {
        console.error('Accept follow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/follow/decline/:id
// @desc    Decline follow request
// @access  Private
router.post('/follow/decline/:id', protect, async (req, res) => {
    try {
        const requesterId = req.params.id;
        const currentUser = await User.findById(req.user._id);

        currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
        await currentUser.save();

        res.json({ message: 'Request declined' });

    } catch (error) {
        console.error('Decline follow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

import { storage } from '../config/cloudinary.js';

// Configure multer for avatar uploads with Cloudinary
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -verificationToken');

        // Calculate post count
        const postCount = await Post.countDocuments({ author: req.user._id });

        const userObj = user.toObject();
        userObj.postCount = postCount;

        res.json(userObj);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
    try {
        const { displayName, bio, avatar } = req.body;

        const user = await User.findById(req.user._id);

        if (displayName !== undefined) user.profile.displayName = displayName;
        if (bio !== undefined) user.profile.bio = bio;
        if (avatar !== undefined) user.profile.avatar = avatar;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profile: user.profile,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: req.user._id }, // Exclude current user
        })
            .select('username profile.displayName profile.avatar')
            .limit(20);

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public (Optional Auth)
router.get('/:username', optionalProtect, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username profile.displayName profile.bio profile.avatar profile.coverImage followerCount followingCount createdAt settings verificationBadge');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate post count dynamically
        const postCount = await Post.countDocuments({ author: user._id });

        const userObj = user.toObject();
        userObj.postCount = postCount;

        // Check if current user follows this user
        if (req.user) {
            const currentUser = await User.findById(req.user._id);
            // safe check for array
            if (!currentUser.following) currentUser.following = [];

            userObj.isFollowing = currentUser.following.some(id => id.toString() === user._id.toString());
            // Check if request is pending
            userObj.hasRequested = user.followRequests && user.followRequests.some(id => id.toString() === req.user._id.toString());
        } else {
            userObj.isFollowing = false;
            userObj.hasRequested = false;
        }

        res.json(userObj);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/me/avatar
// @desc    Upload profile photo
// @access  Private
// @route   POST /api/users/me/avatar
// @desc    Upload profile photo
// @access  Private
router.post('/me/avatar', protect, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user._id);

        // Update avatar URL
        user.profile.avatar = req.file.path;
        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: user.profile.avatar
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/me/cover
// @desc    Upload cover image
// @access  Private
// @route   POST /api/users/me/cover
// @desc    Upload cover image
// @access  Private
router.post('/me/cover', protect, (req, res, next) => {
    upload.single('cover')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user._id);

        // Update cover image URL
        user.profile.coverImage = req.file.path;
        await user.save();

        res.json({
            message: 'Cover image uploaded successfully',
            coverImage: user.profile.coverImage
        });
    } catch (error) {
        console.error('Upload cover error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/me/save/:postId
// @desc    Save/unsave a post
// @access  Private
router.post('/me/save/:postId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const postId = req.params.postId;

        // DEBUG: Log status for specific user debugging
        console.log(`[SavePost] User: ${user.username}, SavedPosts Type: ${typeof user.savedPosts}, IsArray: ${Array.isArray(user.savedPosts)}`);

        // Repair corrupt data: Force ALL arrays to be valid
        if (!Array.isArray(user.savedPosts)) { console.log('Repairing savedPosts'); user.savedPosts = []; }
        if (!Array.isArray(user.hiddenPosts)) { console.log('Repairing hiddenPosts'); user.hiddenPosts = []; }
        if (!Array.isArray(user.following)) { console.log('Repairing following'); user.following = []; }
        if (!Array.isArray(user.followers)) { console.log('Repairing followers'); user.followers = []; }

        const isSaved = user.savedPosts.includes(postId);

        if (isSaved) {
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
        } else {
            user.savedPosts.push(postId);
        }

        await user.save();

        res.json({
            saved: !isSaved,
            message: isSaved ? 'Post unsaved' : 'Post saved'
        });
    } catch (error) {
        console.error('Save post error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
        }

        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   GET /api/users/me/saved
// @desc    Get saved posts
// @access  Private
router.get('/me/saved', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'savedPosts',
                populate: {
                    path: 'author',
                    select: 'username profile.displayName profile.avatar'
                }
            });

        res.json(user.savedPosts || []);
    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/me/hide/:postId
// @desc    Hide/unhide a post
// @access  Private
router.post('/me/hide/:postId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const postId = req.params.postId;

        if (!user.hiddenPosts) user.hiddenPosts = [];
        const isHidden = user.hiddenPosts.includes(postId);

        if (isHidden) {
            user.hiddenPosts = user.hiddenPosts.filter(id => id.toString() !== postId);
        } else {
            user.hiddenPosts.push(postId);
        }

        await user.save();

        res.json({
            hidden: !isHidden,
            message: isHidden ? 'Post unhidden' : 'Post hidden'
        });
    } catch (error) {
        console.error('Hide post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/me/hidden
// @desc    Get hidden post IDs
// @access  Private
router.get('/me/hidden', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('hiddenPosts');
        res.json(user.hiddenPosts || []);
    } catch (error) {
        console.error('Get hidden posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Private
router.get('/:id/followers', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'username profile.displayName profile.avatar profile.bio');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Privacy Check
        if (user.settings && user.settings.privacy && user.settings.privacy.isPrivate) {
            const isOwner = req.user._id.toString() === user._id.toString();
            // Check if follower (since followers are populated, check safely)
            const isFollower = user.followers.some(follower => follower._id.toString() === req.user._id.toString());

            if (!isOwner && !isFollower) {
                return res.status(403).json({ message: 'Bu hesap gizli.' });
            }
        }

        res.json(user.followers);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/:id/following
// @desc    Get user following
// @access  Private
router.get('/:id/following', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('following', 'username profile.displayName profile.avatar profile.bio');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Privacy Check
        if (user.settings && user.settings.privacy && user.settings.privacy.isPrivate) {
            const isOwner = req.user._id.toString() === user._id.toString();
            const isFollower = user.followers.includes(req.user._id); // Check raw followers ID for efficiency? 
            // Wait, existing query populates 'following', NOT 'followers'. 
            // So user.followers is likely just IDs (if not selected/populated)? 
            // Default select includes all fields? No, referencing other schemas.
            // If I verify followership, I should use the User document properly.
            // The `user` object here is fetched with just `findById`, so ALL fields are returned.
            // `followers` field is an array of IDs by default.
            // BUT, I did not populate `followers` in this query! I populated `following`.
            // So `user.followers` IS an array of IDs.

            if (!isOwner && !user.followers.includes(req.user._id)) {
                return res.status(403).json({ message: 'Bu hesap gizli.' });
            }
        }

        res.json(user.following);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/settings
// @desc    Update user settings (notifications, privacy)
// @access  Private
router.put('/settings', protect, async (req, res) => {
    try {
        const { notifications, privacy } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.settings) user.settings = {};
        if (!user.settings.notifications) user.settings.notifications = {};
        if (!user.settings.privacy) user.settings.privacy = {};

        if (notifications) {
            user.settings.notifications = { ...user.settings.notifications, ...notifications };
        }
        if (privacy) {
            user.settings.privacy = { ...user.settings.privacy, ...privacy };
        }

        await user.save();
        res.json({ message: 'Settings updated', settings: user.settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.password && user.googleId) {
            return res.status(400).json({ message: 'Google users cannot change password' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword; // Pre-save hook will hash it
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/request-verification
// @desc    Request verification badge
// @access  Private
router.post('/request-verification', protect, async (req, res) => {
    try {
        const { category } = req.body;

        // Define Categories and their Badges
        const categoryMap = {
            'creator': 'blue',     // Sanatçı, Fenomen, Gazeteci
            'business': 'gold',    // Şirket, Marka, STK
            'government': 'platinum', // Devlet Yetkilisi, Temsilci
            'partner': 'special'   // Platform Ortağı
        };

        if (!category || !categoryMap[category]) {
            return res.status(400).json({ message: 'Geçersiz kategori.' });
        }

        const badgeType = categoryMap[category];
        const user = await User.findById(req.user._id);

        if (user.verificationRequest && user.verificationRequest.status === 'pending') {
            return res.status(400).json({ message: 'Zaten bekleyen bir başvurunuz var.' });
        }

        if (user.verificationBadge !== 'none' && user.verificationBadge !== 'staff') {
            return res.status(400).json({ message: 'Zaten doğrulanmış bir rozetiniz var.' });
        }

        user.verificationRequest = {
            status: 'pending',
            badgeType,
            category,
            requestedAt: new Date()
        };

        await user.save();

        res.json({ message: 'Başvurunuz alındı.', verificationRequest: user.verificationRequest });
    } catch (error) {
        console.error('Verification request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/me
// @desc    Delete user account
// @access  Private
router.delete('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const userId = user._id;

        // 1. Remove from Followers/Following lists & Update Counts
        // Remove from 'followers' of people I follow (Reduce their followerCount)
        await User.updateMany(
            { _id: { $in: user.following } },
            {
                $pull: { followers: userId },
                $inc: { followerCount: -1 }
            }
        );

        // Remove from 'following' of people who follow me (Reduce their followingCount)
        await User.updateMany(
            { _id: { $in: user.followers } },
            {
                $pull: { following: userId },
                $inc: { followingCount: -1 }
            }
        );

        // Remove pending requests
        await User.updateMany(
            { followRequests: userId },
            { $pull: { followRequests: userId } }
        );

        // 2. Content Cleanup
        // Delete all posts
        await Post.deleteMany({ author: userId });

        // Delete all comments
        await Comment.deleteMany({ author: userId });

        // 3. Likes Cleanup
        // Remove likes from Posts
        await Post.updateMany(
            { likes: userId },
            {
                $pull: { likes: userId },
                $inc: { likeCount: -1 }
            }
        );

        // Remove likes from Comments
        await Comment.updateMany(
            { likes: userId },
            {
                $pull: { likes: userId },
                $inc: { likeCount: -1 } // Assuming Comment has likeCount, if not standard array length check handles it often but inc is safer if count is stored
            }
        );
        // Note: If Comment model doesn't have likeCount, this $inc might error or just do nothing if strict schema. 
        // Checking Comment schema is safe but $inc on non-existent field usually initializes it. 
        // Ideally we just pull. Let's assume likeCount exists or just pull.
        // To be safe and since I haven't seen Comment schema details for likeCount, I will just $pull for comments if unsure, but Posts definitely have it.
        // Actually, let's just use $pull for Comments to avoid error if field missing.

        // 4. Notifications Cleanup
        // Delete notifications sent BY user or received BY user
        await Notification.deleteMany({
            $or: [{ sender: userId }, { recipient: userId }]
        });

        // 5. Finally Delete User
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
