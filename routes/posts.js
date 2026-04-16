import express from 'express';
import multer from 'multer';
import { protect, optionalProtect } from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { postValidation, mongoIdValidation } from '../middleware/validation.js';

const router = express.Router();

// Configure multer for file uploads
import upload from '../middleware/upload.js';

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post(
    '/',
    protect,
    postValidation,
    (req, res, next) => {
        console.log('📤 POST /api/posts - Upload request received');
        console.log('📤 Content-Type:', req.headers['content-type']);
        console.log('📤 Content-Length:', req.headers['content-length']);

        upload.single('media')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('❌ Multer Error:', err.message);
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            } else if (err) {
                console.error('❌ Upload Error:', err.message);
                return res.status(400).json({ message: err.message });
            }
            console.log('📤 Multer processing complete. File present:', !!req.file);
            if (req.file) {
                console.log('📤 File details:', {
                    key: req.file.key,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            console.log('📤 Handler started. Body keys:', Object.keys(req.body));
            const { content, portalId, media, mediaType } = req.body;

            // If no file and no content and no external media, reject
            if (!content && !req.file && !media) {
                console.log('📤 Rejected: No content, no file, and no external media');
                return res.status(400).json({ message: 'Post must have content or media' });
            }

            const postData = {
                author: req.user._id,
                content: content || '',
            };

            // Handle external media (like YouTube)
            if (media && mediaType) {
                postData.media = media;
                postData.mediaType = mediaType;
            }

            if (portalId) {
                const Portal = (await import('../models/Portal.js')).default;
                const portal = await Portal.findById(portalId);
                if (!portal) {
                    return res.status(404).json({ message: 'Portal bulunamadı' });
                }

                const isMember = portal.members.some(
                    (m) => m.toString() === req.user._id.toString()
                );
                if (!isMember) {
                    return res
                        .status(403)
                        .json({ message: 'Gönderi paylaşmak için bu portala üye olmalısınız.' });
                }

                postData.portal = portalId;
                postData.channel = req.body.channel || 'general';
            }

            if (req.file) {
                const domain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');
                postData.media = domain ? `${domain}/${req.file.key}` : `/api/media/${req.file.key}`;
                console.log('📤 Media URL:', postData.media);

                if (req.file.mimetype.includes('video')) {
                    postData.mediaType = 'video';
                } else {
                    postData.mediaType = req.file.mimetype.includes('gif') ? 'gif' : 'image';
                }
            }

            console.log('📤 About to create post with data:', {
                author: postData.author,
                content: postData.content ? postData.content.substring(0, 50) : '(empty)',
                media: postData.media,
                mediaType: postData.mediaType,
                portal: postData.portal,
            });

            const post = await Post.create(postData);
            console.log('✅ Post created successfully! ID:', post._id);
            console.log('✅ Post media in DB:', post.media);

            await post.populate(
                'author',
                'username profile.displayName profile.avatar verificationBadge'
            );

            // Increment post count
            await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: 1 } });

            // Only emit global socket event for non-portal posts
            if (!postData.portal) {
                req.app.get('io').emit('newPost', post);
            } else {
                // For portal posts, emit a lightweight activity signal globally for sidebar unread indicators
                // We include the postId and channelId so the client can track unique unread messages per channel
                req.app.get('io').emit('global:portal_activity', { 
                    portalId: postData.portal.toString(),
                    channelId: postData.channel.toString(),
                    postId: post._id.toString()
                });
            }

            res.status(201).json(post);
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET /api/posts
// @desc    Get all posts (global feed)
// @access  Public (Optional Auth)
router.get('/', optionalProtect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Only show posts that are NOT assigned to a portal in the global feed
        // Unless the user explicitly asks for portal posts (not implemented yet for global)
        const query = { portal: { $exists: false } };

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 10)
            .populate(
                'author',
                'username profile.displayName profile.avatar verificationBadge settings.privacy'
            );

        if (req.user && !req.user.following) {
            req.user.following = [];
        }

        const visiblePosts = posts.filter((post) => {
            if (!post.author) {
                return false;
            }

            // 1. Account is NOT private -> Visible to everyone
            if (!post.author.settings?.privacy?.isPrivate) {
                return true;
            }

            // 2. If User is NOT logged in -> Only public posts (already handled above)
            // Since we are here, author is private.
            if (!req.user) {
                return false;
            }

            // 3. User logged in:
            // Own post
            if (post.author._id.toString() === req.user._id.toString()) {
                return true;
            }
            // Following
            return req.user.following.some((id) => id.toString() === post.author._id.toString());
        });

        const paginatedPosts = visiblePosts.slice(0, limit);
        const total = await Post.countDocuments(); // Approximate

        res.json({
            posts: paginatedPosts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total,
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public (Optional Auth)
router.get('/:id', optionalProtect, mongoIdValidation('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate(
            'author',
            'username profile.displayName profile.avatar verificationBadge settings.privacy'
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Privacy Check
        if (post.author.settings?.privacy?.isPrivate) {
            // Not logged in -> cannot see private post
            if (!req.user) {
                return res.status(403).json({ message: 'This account is private' });
            }

            const isOwn = post.author._id.toString() === req.user._id.toString();
            const isFollowing = req.user.following.some(
                (id) => id.toString() === post.author._id.toString()
            );

            if (!isOwn && !isFollowing) {
                return res.status(403).json({ message: 'This account is private' });
            }
        }

        res.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user ID
// @access  Public (Optional Auth)
router.get('/user/:userId', optionalProtect, mongoIdValidation('userId'), async (req, res) => {
    try {
        // Privacy Check First
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.settings?.privacy?.isPrivate) {
            if (!req.user) {
                return res.status(403).json({ message: 'This account is private' });
            }

            const isOwn = req.params.userId === req.user._id.toString();
            // ensure following is array
            if (!req.user.following) {
                req.user.following = [];
            }
            const isFollowing = req.user.following.some(
                (id) => id.toString() === req.params.userId
            );

            if (!isOwn && !isFollowing) {
                return res.status(403).json({ message: 'This account is private' });
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ author: req.params.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username profile.displayName profile.avatar verificationBadge')
            .populate('portal', 'name avatar channels');

        // Resolve channel names from portal.channels subdocuments
        const postsWithChannelNames = posts.map(post => {
            const postObj = post.toObject();
            if (postObj.portal && postObj.channel && postObj.channel !== 'general' && postObj.portal.channels) {
                const matchedChannel = postObj.portal.channels.find(
                    ch => ch._id.toString() === postObj.channel
                );
                if (matchedChannel) {
                    postObj.channel = { _id: postObj.channel, name: matchedChannel.name };
                } else {
                    postObj.channel = { _id: postObj.channel, name: 'genel' };
                }
            } else if (postObj.portal && postObj.channel === 'general') {
                postObj.channel = { _id: 'general', name: 'genel' };
            }
            // Remove channels array from portal to keep response lean
            if (postObj.portal && postObj.portal.channels) {
                delete postObj.portal.channels;
            }
            return postObj;
        });

        const total = await Post.countDocuments({ author: req.params.userId });

        res.json({
            posts: postsWithChannelNames,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total,
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/posts/:id/pin
// @desc    Toggle pin status of a post
// @access  Private (Admin/Owner only)
router.put('/:id/pin', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.portal) {
            return res.status(400).json({ message: 'Only portal posts can be pinned' });
        }

        // Check permissions
        const Portal = (await import('../models/Portal.js')).default;
        const portal = await Portal.findById(post.portal);

        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const isOwner = portal.owner.toString() === req.user._id.toString();
        const isAdmin = portal.admins.some((a) => a.toString() === req.user._id.toString());

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to pin posts in this portal' });
        }

        // Toggle pin status
        post.isPinned = !post.isPinned;
        post.pinnedAt = post.isPinned ? new Date() : null;
        await post.save();

        // Populate author for frontend update
        await post.populate(
            'author',
            'username profile.displayName profile.avatar verificationBadge settings.privacy'
        );

        res.json(post);
    } catch (error) {
        console.error('Pin post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
