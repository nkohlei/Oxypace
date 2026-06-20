import express from 'express';
import multer from 'multer';
import { protect, optionalProtect } from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Notification from '../models/Notification.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';
import { postValidation, mongoIdValidation } from '../middleware/validation.js';
import axios from 'axios';
import r2 from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { generatePdfThumbnail } from '../utils/pdfHelper.js';
import { transcodeVideoInBackground } from '../utils/videoTranscoder.js';
import path from 'path';

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
            const { content, portalId, media, mediaType, quotedPostId } = req.body;

            // If no file and no content and no external media and no direct upload, reject
            if (!content && !req.file && !media && !req.body.mediaKey) {
                console.log('📤 Rejected: No content, no file, no mediaKey, and no external media');
                return res.status(400).json({ message: 'Post must have content or media' });
            }

            const postData = {
                author: req.user._id,
                content: content || '',
                quotedPost: quotedPostId || null,
            };

            // Handle external media (like YouTube)
            if (media && mediaType) {
                postData.media = media;
                postData.mediaType = mediaType;
            }

            if (portalId) {
                const portal = await Portal.findById(portalId);
                if (!portal) {
                    return res.status(404).json({ message: 'Portal bulunamadı' });
                }

                if (portal.isReadOnly) {
                    return res.status(403).json({ message: 'Bu portal salt okunurdur. Yeni gönderi paylaşılamaz.' });
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
                const channelId = req.body.channel || 'general';
                postData.channel = channelId;

                // Visual Channel Validation
                if (channelId !== 'general') {
                    const channel = portal.channels.find((c) => c._id.toString() === channelId);
                    if (channel && channel.type === 'image') {
                        const hasMedia = req.file || req.body.mediaKey || (media && mediaType);
                        if (!hasMedia) {
                            return res.status(400).json({
                                message: 'Bu kanalda en az 1 görsel paylaşılması zorunludur',
                            });
                        }
                    }
                }
            }

            // PDF File Handling & Generation
            let pdfKey = null;
            let pdfName = '';
            let pdfSize = 0;

            if (req.body.mediaKey && req.body.mediaKey.split('.').pop().toLowerCase() === 'pdf') {
                pdfKey = req.body.mediaKey;
                pdfName = req.body.pdfName || 'Doküman.pdf';
                pdfSize = Number(req.body.pdfSize) || 0;
            } else if (req.file && (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf'))) {
                pdfKey = req.file.key;
                pdfName = req.file.originalname;
                pdfSize = req.file.size;
            }

            if (pdfKey) {
                postData.mediaType = 'pdf';
                postData.pdfUrl = constructProxiedUrl(pdfKey);
                postData.pdfName = pdfName;
                postData.pdfSize = pdfSize;
                
                try {
                    console.log('📄 [POST Route] PDF detected. Downloading for thumbnail generation...');
                    const pdfFullUrl = constructProxiedUrl(pdfKey);
                    const response = await axios.get(pdfFullUrl, { responseType: 'arraybuffer' });
                    const pdfBuffer = Buffer.from(response.data);

                    console.log('📄 [POST Route] Extracting first page thumbnail...');
                    const thumbnailBuffer = await generatePdfThumbnail(pdfBuffer);

                    console.log('📄 [POST Route] Uploading PDF thumbnail to Cloudflare R2...');
                    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const thumbnailKey = `posts/${portalId || 'general'}/pdf-thumb-${uniqueSuffix}.jpg`;

                    const putCommand = new PutObjectCommand({
                        Bucket: bucketName,
                        Key: thumbnailKey,
                        ContentType: 'image/jpeg',
                        Body: thumbnailBuffer,
                    });
                    await r2.send(putCommand);

                    postData.pdfThumbnailUrl = constructProxiedUrl(thumbnailKey);
                    console.log('✅ [POST Route] PDF thumbnail uploaded successfully:', postData.pdfThumbnailUrl);
                } catch (thumbError) {
                    console.error('❌ [POST Route] Failed to generate/upload PDF thumbnail:', thumbError);
                    // Non-blocking fallback: create post even if thumbnail generation fails
                }
            } else {
                // Direct Cloud Upload support (Presigned URL)
                if (req.body.mediaKey) {
                    postData.media = constructProxiedUrl(req.body.mediaKey);
                    // If mediaType isn't provided, try to infer it from extension
                    if (req.body.mediaType) {
                        postData.mediaType = req.body.mediaType;
                    } else {
                        const ext = req.body.mediaKey.split('.').pop().toLowerCase();
                        const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];
                        postData.mediaType = videoExts.includes(ext) ? 'video' : 'image';
                    }

                    if (postData.mediaType === 'video') {
                        const actualVideoUrl = constructProxiedUrl(req.body.mediaKey);
                        postData.isProcessing = true;
                        postData.processingProgress = 0;
                        postData.estimatedTime = 'Hesaplanıyor...';
                        postData.videoQualities = {
                            high:  actualVideoUrl,
                            low:   actualVideoUrl,
                            p144:  '',
                            p360:  '',
                            p720:  '',
                            p1080: actualVideoUrl,
                            p2160: ''
                        };
                        postData.video144    = '';
                        postData.video360    = '';
                        postData.video720    = '';
                        postData.video1080   = actualVideoUrl;
                        postData.videoUrl    = actualVideoUrl;
                        postData.lowVideoUrl = actualVideoUrl;
                        postData.media       = actualVideoUrl;
                    }
                } else if (req.file) {
                    postData.media = constructProxiedUrl(req.file.key);
                    console.log('📤 Media Proxied URL (from utility):', postData.media);

                    if (req.file.mimetype.includes('video')) {
                        postData.mediaType = 'video';
                        const actualVideoUrl = postData.media;
                        postData.isProcessing = true;
                        postData.processingProgress = 0;
                        postData.estimatedTime = 'Hesaplanıyor...';
                        postData.videoQualities = {
                            high:  actualVideoUrl,
                            low:   actualVideoUrl,
                            p144:  '',
                            p360:  '',
                            p720:  '',
                            p1080: actualVideoUrl,
                            p2160: ''
                        };
                        postData.video144    = '';
                        postData.video360    = '';
                        postData.video720    = '';
                        postData.video1080   = actualVideoUrl;
                        postData.videoUrl    = actualVideoUrl;
                        postData.lowVideoUrl = actualVideoUrl;
                        postData.media       = actualVideoUrl;
                    } else {
                        postData.mediaType = req.file.mimetype.includes('gif') ? 'gif' : 'image';
                    }
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

            if (post.mediaType === 'video') {
                const videoKey = req.body.mediaKey || (req.file ? req.file.key : null);
                if (videoKey) {
                    console.log(`[POST Route] Triggering background transcoding for post ${post._id}`);
                    transcodeVideoInBackground(post._id.toString(), videoKey).catch(err => {
                        console.error('Failed to run background transcode:', err);
                    });
                }
            }
            // Re-fetch with deep population for nested quotes
            // Using a separate query to ensure fresh data from DB with all relations
            const populatedPost = await Post.findById(post._id)
                .populate({
                    path: 'author',
                    select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted'
                })
                .populate('portal')
                .populate({
                    path: 'quotedPost',
                    populate: [
                        { 
                            path: 'author', 
                            select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' 
                        },
                        { 
                            path: 'portal', 
                            select: 'name avatar icon privacy members blockedUsers allowedUsers' 
                        },
                        {
                            path: 'quotedPost',
                            populate: [
                                { 
                                    path: 'author', 
                                    select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' 
                                },
                                { 
                                    path: 'portal', 
                                    select: 'name avatar icon privacy members blockedUsers allowedUsers' 
                                }
                            ]
                        }
                    ]
                })
                .exec();


            // Increment post count
            await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: 1 } });

            // Create notification for quoted post author
            if (quotedPostId) {
                try {
                    const originalPost = await Post.findById(quotedPostId).populate('author');
                    if (originalPost && originalPost.author && originalPost.author._id.toString() !== req.user._id.toString()) {
                        const commentsEnabled = originalPost.author.settings?.notifications?.comments !== false;
                        if (commentsEnabled) {
                            const newNotif = await Notification.create({
                                recipient: originalPost.author._id,
                                sender: req.user._id,
                                type: 'quote',
                                post: post._id,
                            });
                            const io = req.app.get('io');
                            if (io) {
                                const populatedNotif = await Notification.findById(newNotif._id)
                                    .populate('sender', 'username profile.displayName profile.avatar verificationBadge customBadge')
                                    .populate('post', 'content media')
                                    .populate('comment', 'content');
                                io.to(originalPost.author._id.toString()).emit('newNotification', populatedNotif);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Quote notification error:', err);
                }
            }

            // ... emit socket events ...
            if (!postData.portal) {
                req.app.get('io').emit('newPost', populatedPost);
            } else {
                req.app.get('io').emit('global:portal_activity', { 
                    portalId: postData.portal.toString(),
                    channelId: postData.channel.toString(),
                    postId: post._id.toString()
                });

                // --- PERSISTENT NOTIFICATIONS FOR OFFLINE USERS ---
                try {
                    const portal = await Portal.findById(postData.portal);
                    if (portal) {
                        const memberIds = portal.members.filter(m => m.toString() !== req.user._id.toString());
                        if (memberIds.length > 0) {
                            const notificationDocs = memberIds.map(userId => ({
                                recipient: userId,
                                sender: req.user._id,
                                type: 'portal_post',
                                portal: postData.portal,
                                channel: postData.channel,
                                post: post._id,
                                read: false
                            }));
                            await Notification.insertMany(notificationDocs);
                        }
                    }
                } catch (err) {
                    console.error('Error creating portal notifications:', err);
                }
            }

            return res.status(201).json(populatedPost);
        } catch (error) {
            console.error('Create post error:', error);
            return res.status(500).json({ message: 'Server error' });
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

        const shadowbannedUsers = await User.find({ isShadowbanned: true }).distinct('_id');
        const query = {
            portal: { $exists: false },
            $or: [
                { author: { $nin: shadowbannedUsers } }
            ]
        };

        if (req.user) {
            query.$or.push({ author: req.user._id });
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 10)
            .populate(
                'author',
                'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted'
            )
            .populate({
                path: 'quotedPost',
                populate: [
                    { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                    { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' },
                    {
                        path: 'quotedPost',
                        populate: [
                            { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                            { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' }
                        ]
                    }
                ]
            })
            .lean();

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

// @route   GET /api/posts/download
// @desc    Download a file with custom content-disposition filename to bypass CORS on Web
// @access  Public
router.get('/download', async (req, res) => {
    try {
        const { url, filename } = req.query;
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }
        
        const response = await axios.get(url, { responseType: 'stream' });
        
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename || 'file')}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        
        response.data.pipe(res);
    } catch (err) {
        console.error('Download proxy error:', err);
        res.status(500).json({ message: 'Download failed' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public (Optional Auth)
router.get('/:id', optionalProtect, mongoIdValidation('id'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isShadowbanned isDeleted')
            .populate('portal', 'privacy members blockedUsers allowedUsers')
            .populate({
                path: 'quotedPost',
                populate: [
                    { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                    { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' },
                    {
                        path: 'quotedPost',
                        populate: [
                            { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                            { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' }
                        ]
                    }
                ]
            })
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Shadowban Check
        if (post.author && post.author.isShadowbanned) {
            const viewerId = req.user?._id;
            const isAuthor = viewerId && viewerId.toString() === post.author._id.toString();
            if (!isAuthor) {
                return res.status(404).json({ message: 'Post not found' });
            }
        }

        // --- Portal Privacy Check ---
        if (post.portal) {
            const viewerId = req.user?._id;
            const isAuthor = viewerId && viewerId.toString() === post.author._id.toString();
            
            if (!isAuthor) {
                const portal = post.portal;
                const isBlocked = viewerId && portal.blockedUsers?.some(id => id.toString() === viewerId.toString());
                
                if (isBlocked) {
                    return res.status(403).json({ message: 'Access denied to this portal' });
                }

                if (portal.privacy === 'private' || portal.privacy === 'restricted') {
                    const isMember = viewerId && portal.members?.some(id => id.toString() === viewerId.toString());
                    const isAllowed = viewerId && portal.allowedUsers?.some(id => id.toString() === viewerId.toString());
                    
                    if (!isMember && !isAllowed) {
                        return res.status(403).json({ message: 'This post is in a private portal' });
                    }
                }
            }
        }

        // --- User Privacy Check ---
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

        const viewerId = req.user?._id;
        const targetUserId = req.params.userId;
        const isAuthor = viewerId && viewerId.toString() === targetUserId;

        if (targetUser.isShadowbanned && !isAuthor) {
            return res.json({
                posts: [],
                currentPage: 1,
                totalPages: 0,
                totalPosts: 0
            });
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

        // --- Portal Privacy Filter ---
        // If the viewer is NOT the author, we must only show posts from portals they have access to

        let query = { author: targetUserId };

        if (!isAuthor) {
            // Find all portals where the target user has posted
            const userPortalsIds = await Post.find({ author: targetUserId }).distinct('portal');
            
            // Filter these portals by visibility to the current viewer
            const portalQuery = {
                _id: { $in: userPortalsIds.filter(id => id != null) },
                $or: [
                    { privacy: 'public' }
                ]
            };

            if (viewerId) {
                portalQuery.blockedUsers = { $ne: viewerId };
                portalQuery.$or.push({ members: viewerId });
                portalQuery.$or.push({ allowedUsers: viewerId });
            }
            
            const accessiblePortalIds = await Portal.find(portalQuery).distinct('_id');

            query.$or = [
                { portal: { $exists: false } },
                { portal: { $in: accessiblePortalIds } }
            ];
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge isDeleted')
            .populate('portal', 'name avatar channels privacy') // Include privacy for secondary checks if needed
            .populate({
                path: 'quotedPost',
                populate: [
                    { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                    { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' },
                    {
                        path: 'quotedPost',
                        populate: [
                            { path: 'author', select: 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted' },
                            { path: 'portal', select: 'name avatar privacy members blockedUsers allowedUsers' }
                        ]
                    }
                ]
            })
            .lean();

        // Resolve channel names from portal.channels subdocuments
        const postsWithChannelNames = posts.map(post => {
            const postObj = typeof post.toObject === 'function' ? post.toObject() : post;
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

        const total = await Post.countDocuments(query);

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

        // Check if user is the author or an admin
        const authorId = post.author && post.author._id ? post.author._id.toString() : (post.author ? post.author.toString() : '');
        if (authorId !== req.user._id.toString() && !req.user.isAdmin) {
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
            'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted'
        );

        res.json(post);
    } catch (error) {
        console.error('Pin post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
