import express from 'express';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
import multer from 'multer';
import path from 'path';

// Configure multer for message attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'msg-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, upload.single('media'), async (req, res) => {
    try {
        const { recipientId, content, postId } = req.body;
        const media = req.file ? `/uploads/${req.file.filename}` : undefined;

        if (!recipientId || (!content && !media && !postId)) {
            return res.status(400).json({ message: 'Recipient and content/media/post are required' });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        const messageData = {
            sender: req.user._id,
            recipient: recipientId,
            content: content || '',
            media,
            sharedPost: postId
        };

        const message = await Message.create(messageData);

        await message.populate('sender', 'username profile.displayName profile.avatar');
        await message.populate('recipient', 'username profile.displayName profile.avatar');

        if (postId) {
            await message.populate({
                path: 'sharedPost',
                populate: { path: 'author', select: 'username profile.displayName profile.avatar' }
            });
        }

        // Emit socket event for real-time delivery
        req.app.get('io').to(recipientId).emit('newMessage', message);
        // Also emit to sender for optimistic/confirmation update (optional but good practice)
        req.app.get('io').to(req.user._id.toString()).emit('messageSent', message);

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/conversations
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
            .populate('sender', 'username profile.displayName profile.avatar')
            .populate('recipient', 'username profile.displayName profile.avatar');

        // Extract unique conversations
        const conversationsMap = new Map();

        messages.forEach((msg) => {
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
            .populate('sender', 'username profile.displayName profile.avatar')
            .populate('recipient', 'username profile.displayName profile.avatar');

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

export default router;
