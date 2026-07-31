import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

                const notifications = await Notification.find({ 
            recipient: req.user.id, 
            type: { $nin: ['portal_post', 'message'] } 
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'username profile.displayName profile.avatar')
            .populate('post', 'content media')
            .populate('comment', 'content');

        const total = await Notification.countDocuments({ 
            recipient: req.user.id, 
            type: { $nin: ['portal_post', 'message'] } 
        });
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            read: false,
            type: { $nin: ['portal_post', 'message', 'security_silent'] }
        });

        res.json({
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total,
            unreadCount,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/notifications/portal-unreads
// @desc    Get unread counts grouped by portal
// @access  Private
router.get('/portal-unreads', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id,
            type: 'portal_post',
            read: false
        }).populate({
            path: 'portal',
            select: 'members channels'
        });
        
        const validNotifications = [];
        const orphanIds = [];
        
        for (const n of notifications) {
            let isOrphan = false;
            
            // 1. Check if portal exists
            if (!n.portal) {
                isOrphan = true;
            } else {
                // 2. Check if user is still a member of the portal
                const isMember = n.portal.members.some(
                    (memberId) => memberId.toString() === req.user.id
                );
                if (!isMember) {
                    isOrphan = true;
                } else if (n.channel) {
                    // 3. Check if channel still exists in the portal
                    const channelExists = n.portal.channels.some(
                        (ch) => ch._id.toString() === n.channel || ch.name === n.channel
                    );
                    if (!channelExists) {
                        isOrphan = true;
                    }
                }
            }
            
            if (isOrphan) {
                orphanIds.push(n._id);
            } else {
                // Return in the exact same shape as before (portal as an ID string)
                validNotifications.push({
                    _id: n._id,
                    portal: n.portal._id.toString(),
                    channel: n.channel,
                    post: n.post
                });
            }
        }
        
        // Clean up orphan notifications asynchronously in the background
        if (orphanIds.length > 0) {
            Notification.updateMany(
                { _id: { $in: orphanIds } },
                { $set: { read: true } }
            ).catch(err => console.error('Error cleaning up orphan notifications:', err));
        }
        
        res.json(validNotifications);
    } catch (error) {
        console.error('Portal unreads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/read
// @desc    Mark all generic notifications as read
// @access  Private
router.put('/read', protect, async (req, res) => {
    try {
        // Mark all generic notifications as read (except portal posts and messages)
        await Notification.updateMany(
            { 
                recipient: req.user.id, 
                read: false,
                type: { $nin: ['portal_post', 'message'] } 
            },
            { $set: { read: true } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/portal/:portalId/read
// @desc    Mark portal notifications as read (all or channel-specific)
// @access  Private
router.put('/portal/:portalId/read', protect, async (req, res) => {
    try {
        const { channel } = req.query;

        const filter = {
            recipient: req.user._id,
            portal: req.params.portalId,
            read: false
        };

        // If a specific channel is provided, scope to that channel only.
        // If not, mark ALL unread notifications for this portal as read.
        if (channel) {
            filter.channel = channel;
        }

        await Notification.updateMany(filter, { $set: { read: true } });

        const msg = channel
            ? `Notifications for channel ${channel} marked as read`
            : `All notifications for portal ${req.params.portalId} marked as read`;

        res.json({ message: msg });
    } catch (error) {
        console.error('Mark portal read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error('Mark single read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/notifications
// @desc    Delete all user notifications
// @access  Private
router.delete('/', protect, async (req, res) => {
    try {
        await Notification.deleteMany({ 
            recipient: req.user.id,
            type: { $ne: 'portal_post' }
        });
        res.json({ message: 'All notifications removed successfully' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await notification.deleteOne();

        res.json({ message: 'Notification removed' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
