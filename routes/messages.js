import express from 'express';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   POST /api/messages/:id/react
// @desc    React to a message
// @access  Private
router.post('/:id/react', protect, async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
            r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove reaction (toggle off)
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Remove any other reaction by this user first (optional, usually one reaction per user per message)
            const userReactionIndex = message.reactions.findIndex(
                r => r.user.toString() === req.user._id.toString()
            );
            if (userReactionIndex > -1) {
                message.reactions.splice(userReactionIndex, 1);
            }
            // Add new reaction
            message.reactions.push({ user: req.user._id, emoji });
        }

        await message.save();

        const recipientId = message.sender.toString() === req.user._id.toString()
            ? message.recipient.toString()
            : message.sender.toString();

        req.app.get('io').to(recipientId).emit('messageReaction', { messageId: message._id, reactions: message.reactions });
        req.app.get('io').to(req.user._id.toString()).emit('messageReaction', { messageId: message._id, reactions: message.reactions });

        res.json(message.reactions);
    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { recipientId, content, postId, portalId, replyToId } = req.body;
        const media = req.file ? `${process.env.R2_PUBLIC_DOMAIN}/${req.file.key}` : undefined;

        if (!recipientId || (!content && !media && !postId && !portalId)) {
            return res.status(400).json({ message: 'Mesaj veya paylaşılan içerik boş olamaz.' });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const messageData = {
            sender: req.user._id,
            recipient: recipientId,
            content: content || '',
            media,
            sharedPost: postId,
            sharedPortal: portalId,
            replyTo: replyToId
        };

        const message = await Message.create(messageData);

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username profile.displayName profile.avatar createdAt')
            .populate('recipient', 'username profile.displayName profile.avatar createdAt')
            .populate({
                path: 'sharedPost',
                populate: { path: 'author', select: 'username profile.displayName profile.avatar' }
            })
            .populate({
                path: 'sharedPortal',
                select: 'name avatar description'
            })
            .populate({
                path: 'replyTo',
                select: 'content media sender',
                populate: { path: 'sender', select: 'username' }
            });

        req.app.get('io').to(recipientId).emit('newMessage', populatedMessage);
        req.app.get('io').to(req.user._id.toString()).emit('messageSent', populatedMessage);

        // Create Notification
        try {
            const notification = await Notification.create({
                recipient: recipientId,
                sender: req.user._id,
                type: 'message'
            });

            const io = req.app.get('io');
            if (io) {
                const populatedNotif = await notification.populate('sender', 'username profile.displayName profile.avatar');
                io.to(recipientId).emit('newNotification', populatedNotif);
            }
        } catch (notifErr) {
            console.error('Message notification failed:', notifErr);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @desc    Get all conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get unique users the current user has messaged with
        const messages = await Message.find({
            $or: [{ sender: userId }, { recipient: userId }],
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'username profile.displayName profile.avatar createdAt')
            .populate('recipient', 'username profile.displayName profile.avatar createdAt')
            .populate({
                path: 'sharedPost',
                populate: {
                    path: 'author',
                    select: 'username profile.displayName profile.avatar'
                }
            })
            .populate({
                path: 'sharedPortal',
                select: 'name avatar description'
            })
            .populate({
                path: 'replyTo',
                select: 'content media sender',
                populate: { path: 'sender', select: 'username' }
            });

        // Extract unique conversations
        const conversationsMap = new Map();

        messages.forEach((msg) => {
            // Safety check for orphaned messages
            if (!msg.sender || !msg.recipient) {
                return;
            }

            const otherUser = msg.sender._id.toString() === userId.toString()
                ? msg.recipient
                : msg.sender;

            const otherUserId = otherUser._id.toString();

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount: 0,
                });
            }

            // Count unread messages
            if (msg.recipient._id.toString() === userId.toString() && !msg.read) {
                conversationsMap.get(otherUserId).unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/:userId', protect, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'username profile.displayName profile.avatar createdAt')
            .populate('recipient', 'username profile.displayName profile.avatar createdAt')
            .populate({
                path: 'sharedPost',
                populate: {
                    path: 'author',
                    select: 'username profile.displayName profile.avatar'
                }
            })
            .populate({
                path: 'sharedPortal',
                select: 'name avatar description'
            })
            .populate({
                path: 'replyTo',
                select: 'content media sender',
                populate: { path: 'sender', select: 'username' }
            });

        // Mark messages as read
        await Message.updateMany(
            { sender: otherUserId, recipient: currentUserId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is sender
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const recipientId = message.recipient.toString();

        await message.deleteOne();

        // Emit socket event for real-time deletion
        req.app.get('io').to(recipientId).emit('messageDeleted', req.params.id);
        req.app.get('io').to(req.user._id.toString()).emit('messageDeleted', req.params.id);

        res.json({ message: 'Message removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
