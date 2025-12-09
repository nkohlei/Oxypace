import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/follow/:userId
// @desc    Follow/unfollow user
// @access  Private
router.post('/:userId', protect, async (req, res) => {
    try {
        if (req.params.userId === req.user.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!currentUser.following) currentUser.following = [];
        if (!userToFollow.followers) userToFollow.followers = [];

        const followingIndex = currentUser.following.indexOf(req.params.userId);

        if (followingIndex > -1) {
            // Unfollow
            currentUser.following.splice(followingIndex, 1);
            currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);

            const followerIndex = userToFollow.followers.indexOf(req.user.id);
            if (followerIndex > -1) {
                userToFollow.followers.splice(followerIndex, 1);
                userToFollow.followerCount = Math.max(0, userToFollow.followerCount - 1);
            }

            await currentUser.save();
            await userToFollow.save();

            res.json({
                message: 'User unfollowed',
                following: false,
                followerCount: userToFollow.followerCount
            });
        } else {
            // Follow
            currentUser.following.push(req.params.userId);
            currentUser.followingCount += 1;

            userToFollow.followers.push(req.user.id);
            userToFollow.followerCount += 1;

            await currentUser.save();
            await userToFollow.save();

            // Create Notification
            // Create Notification
            const notification = await Notification.create({
                recipient: userToFollow._id,
                sender: req.user.id,
                type: 'follow'
            });

            // Emit real-time notification
            req.app.get('io').to(userToFollow._id.toString()).emit('newNotification', await notification.populate('sender', 'username profile.displayName profile.avatar'));

            res.json({
                message: 'User followed',
                following: true,
                followerCount: userToFollow.followerCount
            });
        }
    } catch (error) {
        console.error('Follow/unfollow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/follow/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get('/:userId/followers', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.params.userId)
            .populate({
                path: 'followers',
                select: 'username profile.displayName profile.avatar followerCount followingCount',
                options: { skip, limit }
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            followers: user.followers,
            currentPage: page,
            totalPages: Math.ceil(user.followerCount / limit),
            totalFollowers: user.followerCount
        });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/follow/:userId/following
// @desc    Get user's following
// @access  Public
router.get('/:userId/following', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.params.userId)
            .populate({
                path: 'following',
                select: 'username profile.displayName profile.avatar followerCount followingCount',
                options: { skip, limit }
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            following: user.following,
            currentPage: page,
            totalPages: Math.ceil(user.followingCount / limit),
            totalFollowing: user.followingCount
        });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/follow/check/:userId
// @desc    Check if current user is following another user
// @access  Private
router.get('/check/:userId', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const isFollowing = currentUser.following.includes(req.params.userId);

        res.json({ following: isFollowing });
    } catch (error) {
        console.error('Check following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
