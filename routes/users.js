import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

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
// @access  Private
router.get('/:username', protect, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username profile.displayName profile.bio profile.avatar profile.coverImage followerCount followingCount createdAt');

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
            userObj.isFollowing = currentUser.following.includes(user._id);
        } else {
            userObj.isFollowing = false;
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

// @route   DELETE /api/users/me
// @desc    Delete user account
// @access  Private
router.delete('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Optional: Clean up posts, comments, etc. logic here
        // For now, simple delete. Orphaned data is handled by frontend safeguards.

        await User.findByIdAndDelete(req.user._id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
