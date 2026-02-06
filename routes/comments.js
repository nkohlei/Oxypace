import express from 'express';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/comments/:commentId
// @desc    Get single comment by ID
// @access  Public
router.get('/:commentId', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .populate('post', '_id content');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.json(comment);
    } catch (error) {
        console.error('Get comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/comments/:commentId/replies
// @desc    Get replies to a comment
// @access  Public
router.get('/:commentId/replies', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const replies = await Comment.find({ parentComment: req.params.commentId })
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({ parentComment: req.params.commentId });

        res.json({
            replies,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReplies: total
        });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Helper function to extract mentions from text
const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]); // username
    }

    return mentions;
};

import upload from '../middleware/upload.js';

// ... (GET logic remains)

// @route   POST /api/comments/post/:postId
// @desc    Add comment to post
// @access  Private
router.post('/post/:postId', protect, upload.single('media'), async (req, res) => {
    try {
        const { content } = req.body;
        // Content might be optional if media exists, but usually text is required?
        // Let's make content optional if media is present, or just allow both.
        // User request didn't specify, but typical is mix.

        if ((!content || content.trim().length === 0) && !req.file) {
            return res.status(400).json({ message: 'Comment content or media is required' });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const mentionUsernames = extractMentions(content || '');

        let media = null;
        let mediaType = 'none';

        if (req.file) {
            // Use backend proxy URL instead of R2 direct URL
            const backendUrl = process.env.BACKEND_URL || 'https://globalmessage-backend.koyeb.app';
            media = `${backendUrl}/api/media/${req.file.key}`;
            mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        }

        const comment = await Comment.create({
            post: req.params.postId,
            author: req.user.id,
            content: content || ' ', // Fallback to space to pass required validation if media exists
            media,
            mediaType,
            mentions: []
        });

        // Update post comment count
        post.commentCount += 1;
        await post.save();

        // Create Notification (if not own post)
        if (post.author.toString() !== req.user.id) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user.id,
                type: 'comment',
                post: post._id,
                comment: comment._id
            });
            req.app.get('io').to(post.author.toString()).emit('newNotification', await notification.populate('sender', 'username profile.displayName profile.avatar verificationBadge'));
        }

        await comment.populate('author', 'username profile.displayName profile.avatar verificationBadge');
        res.status(201).json(comment);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   POST /api/comments/comment/:commentId
// @desc    Reply to comment
// @access  Private
router.post('/comment/:commentId', protect, upload.single('media'), async (req, res) => {
    try {
        const { content } = req.body;

        if ((!content || content.trim().length === 0) && !req.file) {
            return res.status(400).json({ message: 'Reply content or media is required' });
        }

        const parentComment = await Comment.findById(req.params.commentId);

        if (!parentComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        let media = null;
        let mediaType = 'none';

        if (req.file) {
            // Use backend proxy URL instead of R2 direct URL
            const backendUrl = process.env.BACKEND_URL || 'https://globalmessage-backend.koyeb.app';
            media = `${backendUrl}/api/media/${req.file.key}`;
            mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        }

        const reply = await Comment.create({
            post: parentComment.post,
            parentComment: req.params.commentId,
            author: req.user.id,
            content: content || ' ', // Fallback to space
            media,
            mediaType
        });

        parentComment.replyCount += 1;
        await parentComment.save();

        if (parentComment.author.toString() !== req.user.id) {
            const notification = await Notification.create({
                recipient: parentComment.author,
                sender: req.user.id,
                type: 'reply',
                post: parentComment.post,
                comment: reply._id
            });
            req.app.get('io').to(parentComment.author.toString()).emit('newNotification', await notification.populate('sender', 'username profile.displayName profile.avatar verificationBadge'));
        }

        await reply.populate('author', 'username profile.displayName profile.avatar verificationBadge');
        res.status(201).json(reply);
    } catch (error) {
        console.error('Create reply error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/comments/post/:postId
// @desc    Get post comments (top-level only)
// @access  Public
router.get('/post/:postId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({
            post: req.params.postId,
            parentComment: null // Only top-level comments
        })
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({
            post: req.params.postId,
            parentComment: null
        });

        res.json({
            comments,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalComments: total
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/comments/comment/:commentId/replies
// @desc    Get comment replies
// @access  Public
router.get('/comment/:commentId/replies', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const replies = await Comment.find({
            parentComment: req.params.commentId
        })
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .sort({ createdAt: 1 }) // Oldest first for replies
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({
            parentComment: req.params.commentId
        });

        res.json({
            replies,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReplies: total
        });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete own comment
// @access  Private
router.delete('/:commentId', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check ownership
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Update counts
        if (comment.parentComment) {
            // It's a reply, update parent reply count
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $inc: { replyCount: -1 }
            });
        } else {
            // It's a top-level comment, update post comment count
            await Post.findByIdAndUpdate(comment.post, {
                $inc: { commentCount: -1 }
            });
        }

        // Delete all replies to this comment
        await Comment.deleteMany({ parentComment: req.params.commentId });

        // Delete the comment
        await comment.deleteOne();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:commentId/like', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const userId = req.user.id;
        const isLiked = comment.likes.includes(userId);

        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userId);
            comment.likeCount -= 1;
        } else {
            comment.likes.push(userId);
            comment.likeCount += 1;
        }

        await comment.save();

        res.json({
            liked: !isLiked,
            likeCount: comment.likeCount
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/comments/user/:userId
// @desc    Get comments by user
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ author: req.params.userId })
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .populate({
                path: 'post',
                select: 'content media author',
                populate: {
                    path: 'author',
                    select: 'username profile.displayName profile.avatar verificationBadge'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({ author: req.params.userId });

        res.json({
            comments,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalComments: total
        });
    } catch (error) {
        console.error('Get user comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

