import express from 'express';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import ChatPreference from '../models/ChatPreference.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Notification from '../models/Notification.js';
import { messageValidation, mongoIdValidation } from '../middleware/validation.js';
import multer from 'multer';
import upload from '../middleware/upload.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';
import axios from 'axios';
import r2 from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { generatePdfThumbnail } from '../utils/pdfHelper.js';
import logActivity from '../utils/auditLogger.js';

const router = express.Router();

const ALLOWED_CHAT_THEMES = new Set(['default', 'graphite', 'obsidian', 'emerald', 'violet', 'rose', 'amber']);
const ALLOWED_DISAPPEARING_SECONDS = new Set([0, 86400, 604800, 7776000]);

const formatChatPreference = (pref) => {
    if (!pref) {
        return {
            mutedUntil: null,
            isFavorite: false,
            theme: 'default',
            disappearingSeconds: 0,
            isBlocked: false,
            clearedAt: null,
            hiddenAt: null,
        };
    }
    return {
        mutedUntil: pref.mutedUntil || null,
        isFavorite: Boolean(pref.isFavorite),
        theme: pref.theme || 'default',
        disappearingSeconds: Number(pref.disappearingSeconds) || 0,
        isBlocked: Boolean(pref.isBlocked),
        clearedAt: pref.clearedAt || null,
        hiddenAt: pref.hiddenAt || null,
    };
};

// @route   GET /api/messages/preferences
// @desc    Get all per-conversation chat preferences for current user
// @access  Private
router.get('/preferences', protect, async (req, res) => {
    try {
        const prefs = await ChatPreference.find({ user: req.user._id }).lean();
        const blockedByDocs = await ChatPreference.find({ partner: req.user._id, isBlocked: true })
            .select('user')
            .lean();
        const blockedBySet = new Set(blockedByDocs.map((d) => String(d.user)));

        const map = {};
        for (const p of prefs) {
            const partnerId = String(p.partner);
            map[partnerId] = {
                ...formatChatPreference(p),
                blockedByPartner: blockedBySet.has(partnerId),
            };
        }
        for (const partnerId of blockedBySet) {
            if (!map[partnerId]) {
                map[partnerId] = {
                    ...formatChatPreference(null),
                    blockedByPartner: true,
                };
            }
        }
        res.json(map);
    } catch (error) {
        console.error('Get chat preferences error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/messages/preferences/:partnerId
// @desc    Update chat preference for a specific partner (mute, favorite, theme, disappearing, block)
// @access  Private
router.put('/preferences/:partnerId', protect, mongoIdValidation('partnerId'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Sohbet ayarları değiştirilemez.' });
        }
        const userId = req.user._id;
        const partnerId = req.params.partnerId;
        const { mutedUntil, isFavorite, theme, disappearingSeconds, isBlocked } = req.body || {};

        const update = {};
        if (mutedUntil !== undefined) {
            update.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
        }
        if (typeof isFavorite === 'boolean') {
            update.isFavorite = isFavorite;
        }
        if (typeof theme === 'string' && ALLOWED_CHAT_THEMES.has(theme)) {
            update.theme = theme;
        }
        if (disappearingSeconds !== undefined) {
            const sec = Number(disappearingSeconds);
            if (ALLOWED_DISAPPEARING_SECONDS.has(sec)) {
                update.disappearingSeconds = sec;
            }
        }
        if (typeof isBlocked === 'boolean') {
            update.isBlocked = isBlocked;
        }

        const pref = await ChatPreference.findOneAndUpdate(
            { user: userId, partner: partnerId },
            { $set: update, $setOnInsert: { user: userId, partner: partnerId } },
            { new: true, upsert: true }
        );

        const io = req.app.get('io');

        // Sync disappearing messages timer to both sides of the conversation
        if (update.disappearingSeconds !== undefined) {
            await ChatPreference.findOneAndUpdate(
                { user: partnerId, partner: userId },
                {
                    $set: { disappearingSeconds: update.disappearingSeconds },
                    $setOnInsert: { user: partnerId, partner: userId },
                },
                { upsert: true }
            );
            if (io) {
                io.to(String(partnerId)).emit('chatSettingsUpdated', {
                    partnerId: String(userId),
                    disappearingSeconds: update.disappearingSeconds,
                });
                io.to(String(userId)).emit('chatSettingsUpdated', {
                    partnerId: String(partnerId),
                    disappearingSeconds: update.disappearingSeconds,
                });
            }
        }

        if (update.isBlocked !== undefined && io) {
            io.to(String(partnerId)).emit('chatSettingsUpdated', {
                partnerId: String(userId),
                blockedByPartner: update.isBlocked,
            });
        }

        const blockedByPartner = Boolean(
            await ChatPreference.exists({ user: partnerId, partner: userId, isBlocked: true })
        );

        res.json({
            partnerId: String(partnerId),
            ...formatChatPreference(pref),
            blockedByPartner,
        });
    } catch (error) {
        console.error('Update chat preference error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/bulk-delete
// @desc    Delete multiple messages (scope: 'me' | 'everyone')
// @access  Private
router.post('/bulk-delete', protect, async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Mesaj silinemez.' });
        }
        const { messageIds, scope = 'me' } = req.body || {};
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ message: 'Silinecek mesaj seçilmedi.' });
        }

        const userId = req.user._id;
        const userIdStr = String(userId);
        const messages = await Message.find({
            _id: { $in: messageIds },
            $or: [{ sender: userId }, { recipient: userId }],
        });

        const io = req.app.get('io');
        const deletedIds = [];

        for (const msg of messages) {
            const isSender = String(msg.sender) === userIdStr;
            if (scope === 'everyone' && isSender) {
                const recipientId = String(msg.recipient);
                await msg.deleteOne();
                deletedIds.push(String(msg._id));
                if (io) {
                    io.to(recipientId).emit('messageDeleted', String(msg._id));
                    io.to(userIdStr).emit('messageDeleted', String(msg._id));
                }
            } else {
                await Message.updateOne({ _id: msg._id }, { $addToSet: { deletedFor: userId } });
                deletedIds.push(String(msg._id));
            }
        }

        res.json({ success: true, deletedIds });
    } catch (error) {
        console.error('Bulk delete messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/conversation/:partnerId/clear
// @desc    Clear all messages in a conversation for current user
// @access  Private
router.post('/conversation/:partnerId/clear', protect, mongoIdValidation('partnerId'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Sohbet temizlenemez.' });
        }
        const now = new Date();
        await ChatPreference.findOneAndUpdate(
            { user: req.user._id, partner: req.params.partnerId },
            { $set: { clearedAt: now }, $setOnInsert: { user: req.user._id, partner: req.params.partnerId } },
            { upsert: true }
        );
        res.json({ success: true, clearedAt: now });
    } catch (error) {
        console.error('Clear conversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/messages/conversation/:partnerId
// @desc    Clear & hide a conversation from current user's inbox list
// @access  Private
router.delete('/conversation/:partnerId', protect, mongoIdValidation('partnerId'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Sohbet silinemez.' });
        }
        const now = new Date();
        await ChatPreference.findOneAndUpdate(
            { user: req.user._id, partner: req.params.partnerId },
            {
                $set: { clearedAt: now, hiddenAt: now },
                $setOnInsert: { user: req.user._id, partner: req.params.partnerId },
            },
            { upsert: true }
        );
        res.json({ success: true, hiddenAt: now });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/:id/pin
// @desc    Pin or unpin a message in a conversation
// @access  Private
router.post('/:id/pin', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Mesaj sabitlenemez.' });
        }
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const userIdStr = String(req.user._id);
        if (String(message.sender) !== userIdStr && String(message.recipient) !== userIdStr) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        message.pinned = !message.pinned;
        message.pinnedBy = message.pinned ? req.user._id : null;
        message.pinnedAt = message.pinned ? new Date() : null;
        await message.save();

        const otherId = String(message.sender) === userIdStr ? String(message.recipient) : String(message.sender);
        const payload = {
            messageId: String(message._id),
            pinned: message.pinned,
            pinnedBy: message.pinnedBy,
            pinnedAt: message.pinnedAt,
        };
        const io = req.app.get('io');
        if (io) {
            io.to(otherId).emit('messagePinned', payload);
            io.to(userIdStr).emit('messagePinned', payload);
        }

        res.json(payload);
    } catch (error) {
        console.error('Pin message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/:id/star
// @desc    Star or unstar a message for current user
// @access  Private
router.post('/:id/star', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const userIdStr = String(req.user._id);
        if (String(message.sender) !== userIdStr && String(message.recipient) !== userIdStr) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const idx = (message.starredBy || []).findIndex((id) => String(id) === userIdStr);
        let starred = false;
        if (idx > -1) {
            message.starredBy.splice(idx, 1);
            starred = false;
        } else {
            message.starredBy.push(req.user._id);
            starred = true;
        }
        await message.save();

        res.json({
            messageId: String(message._id),
            starred,
            starredBy: message.starredBy,
        });
    } catch (error) {
        console.error('Star message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/:id/forward
// @desc    Forward a message to one or more recipients
// @access  Private
router.post('/:id/forward', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Mesaj iletilemez.' });
        }
        const { recipientIds } = req.body || {};
        if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.status(400).json({ message: 'En az bir alıcı seçmelisiniz.' });
        }

        const original = await Message.findById(req.params.id);
        if (!original) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const userIdStr = String(req.user._id);
        if (String(original.sender) !== userIdStr && String(original.recipient) !== userIdStr) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const io = req.app.get('io');
        const createdMessages = [];
        const uniqueRecipients = [...new Set(recipientIds.map((r) => String(r)))].slice(0, 10);

        for (const recipientId of uniqueRecipients) {
            const recipient = await User.findById(recipientId);
            if (!recipient || recipient.isDeleted || recipient.isSystemAccount) continue;

            const blocked = await ChatPreference.exists({
                $or: [
                    { user: req.user._id, partner: recipientId, isBlocked: true },
                    { user: recipientId, partner: req.user._id, isBlocked: true },
                ],
            });
            if (blocked) continue;

            const pref = await ChatPreference.findOne({ user: req.user._id, partner: recipientId }).lean();
            const expiresAt = pref?.disappearingSeconds > 0
                ? new Date(Date.now() + pref.disappearingSeconds * 1000)
                : null;

            const created = await Message.create({
                sender: req.user._id,
                recipient: recipientId,
                content: original.content || '',
                media: original.media,
                mediaName: original.mediaName,
                mediaSize: original.mediaSize,
                mediaType: original.mediaType,
                mediaThumbnail: original.mediaThumbnail,
                sharedPost: original.sharedPost,
                sharedPortal: original.sharedPortal,
                forwarded: true,
                expiresAt,
                read: false,
            });

            const populated = await Message.findById(created._id)
                .populate('sender', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate('recipient', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate({
                    path: 'sharedPost',
                    populate: [
                        {
                            path: 'author',
                            select: 'username profile.displayName profile.avatar profile.lowResAvatar isDeleted',
                        },
                        {
                            path: 'portal',
                            select: 'name',
                        },
                    ],
                })
                .populate({ path: 'sharedPortal', select: 'name avatar banner description' });

            createdMessages.push(populated);
            if (io) {
                io.to(recipientId).emit('newMessage', populated);
                io.to(userIdStr).emit('messageSent', populated);
            }
        }

        res.status(201).json({ success: true, count: createdMessages.length, messages: createdMessages });
    } catch (error) {
        console.error('Forward message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages/:id/react
// @desc    React to a message
// @access  Private
router.post('/:id/react', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove reaction (toggle off)
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Remove any other reaction by this user first (optional, usually one reaction per user per message)
            const userReactionIndex = message.reactions.findIndex(
                (r) => r.user.toString() === req.user._id.toString()
            );
            if (userReactionIndex > -1) {
                message.reactions.splice(userReactionIndex, 1);
            }
            // Add new reaction
            message.reactions.push({ user: req.user._id, emoji });
        }

        await message.save();

        const recipientId =
            message.sender.toString() === req.user._id.toString()
                ? message.recipient.toString()
                : message.sender.toString();

        req.app
            .get('io')
            .to(recipientId)
            .emit('messageReaction', { messageId: message._id, reactions: message.reactions });
        req.app
            .get('io')
            .to(req.user._id.toString())
            .emit('messageReaction', { messageId: message._id, reactions: message.reactions });

        res.json(message.reactions);
    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post(
    '/',
    protect,
    messageValidation,
    (req, res, next) => {
        upload.single('media')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Upload error: ${err.message}` });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            const { recipientId, content, postId, portalId, replyToId } = req.body;
            
            let mediaName = req.body.mediaName || '';
            let mediaSize = Number(req.body.mediaSize) || 0;
            let mediaType = req.body.mediaType || '';
            let mediaKey = req.body.mediaKey || (req.file ? req.file.key : null);
            let media = undefined;

            if (mediaKey) {
                media = constructProxiedUrl(mediaKey);
                if (req.file) {
                    mediaName = req.file.originalname;
                    mediaSize = req.file.size;
                    mediaType = req.file.mimetype;
                }
            }

            if (!recipientId || (!content && !media && !postId && !portalId)) {
                return res
                    .status(400)
                    .json({ message: 'Mesaj veya paylaşılan içerik boş olamaz.' });
            }

            const recipient = await User.findById(recipientId);
            if (!recipient || recipient.isDeleted) {
                return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
            }

            // DM settings check
            const dmSettings = recipient.settings?.privacy?.dmSettings || 'everyone';
            if (dmSettings === 'none' && !req.user.isAdmin) {
                return res.status(403).json({ message: 'Bu kullanıcı doğrudan mesaj almayı kapatmıştır.' });
            }
            if (dmSettings === 'friends' && !req.user.isAdmin) {
                const isFriend = recipient.followers?.some(id => id.toString() === req.user._id.toString()) && 
                                 recipient.following?.some(id => id.toString() === req.user._id.toString());
                if (!isFriend) {
                    return res.status(403).json({ message: 'Bu kullanıcıya yalnızca arkadaşları doğrudan mesaj gönderebilir.' });
                }
            }

            // Block messages to system accounts
            if (recipient.isSystemAccount) {
                return res.status(403).json({ 
                    message: 'Bu hesap doğrudan mesaj kabul etmemektedir. Sorularınız için Geri Bildirim sayfasını kullanabilirsiniz.' 
                });
            }

            // Prevent sending portal invite message if recipient is already a member or owner of the portal
            if (portalId) {
                const targetPortal = await Portal.findById(portalId).select('owner members').lean();
                if (targetPortal) {
                    const recipientStr = String(recipientId);
                    const isAlreadyMember =
                        String(targetPortal.owner) === recipientStr ||
                        (targetPortal.members || []).some((m) => String(m) === recipientStr);
                    if (isAlreadyMember) {
                        return res.status(400).json({ message: 'Bu kullanıcı zaten bu portalın üyesi.' });
                    }
                }
            }

            // Check per-chat block & disappearing preferences
            const [senderPref, recipientPref] = await Promise.all([
                ChatPreference.findOne({ user: req.user._id, partner: recipientId }).lean(),
                ChatPreference.findOne({ user: recipientId, partner: req.user._id }).lean(),
            ]);

            if (senderPref?.isBlocked) {
                return res.status(403).json({ message: 'Bu kullanıcıyı engellediniz. Mesaj göndermek için engeli kaldırın.' });
            }
            if (recipientPref?.isBlocked) {
                return res.status(403).json({ message: 'Bu kullanıcıya şu anda mesaj gönderilemiyor.' });
            }

            const activeDisappearingSec = Math.max(
                Number(senderPref?.disappearingSeconds) || 0,
                Number(recipientPref?.disappearingSeconds) || 0
            );
            const expiresAt = activeDisappearingSec > 0
                ? new Date(Date.now() + activeDisappearingSec * 1000)
                : null;
            const isRecipientMuted = Boolean(
                recipientPref?.mutedUntil && new Date(recipientPref.mutedUntil) > new Date()
            );

            // Generate PDF thumbnail if applicable
            let mediaThumbnail = undefined;
            if (mediaKey && (mediaKey.toLowerCase().endsWith('.pdf') || mediaType === 'application/pdf')) {
                try {
                    console.log('📄 [Message Route] PDF detected. Downloading for thumbnail generation...');
                    const pdfFullUrl = constructProxiedUrl(mediaKey);
                    const response = await axios.get(pdfFullUrl, { responseType: 'arraybuffer' });
                    const pdfBuffer = Buffer.from(response.data);

                    console.log('📄 [Message Route] Extracting first page thumbnail...');
                    const thumbnailBuffer = await generatePdfThumbnail(pdfBuffer);

                    console.log('📄 [Message Route] Uploading PDF thumbnail to Cloudflare R2...');
                    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const thumbnailKey = `messages/pdf-thumb-${uniqueSuffix}.jpg`;

                    const putCommand = new PutObjectCommand({
                        Bucket: bucketName,
                        Key: thumbnailKey,
                        ContentType: 'image/jpeg',
                        Body: thumbnailBuffer,
                    });
                    await r2.send(putCommand);

                    mediaThumbnail = constructProxiedUrl(thumbnailKey);
                    console.log('✅ [Message Route] PDF thumbnail uploaded successfully:', mediaThumbnail);
                } catch (thumbError) {
                    console.error('⚠️ [Message Route] Failed to generate PDF thumbnail:', thumbError);
                }
            }

            const io = req.app.get('io');
            let isRecipientActiveInChat = false;
            if (io?.isUserActiveInChatWith) {
                try {
                    isRecipientActiveInChat = await io.isUserActiveInChatWith(recipientId, req.user._id.toString());
                } catch (e) {
                    isRecipientActiveInChat = false;
                }
            }

            const messageData = {
                sender: req.user._id,
                recipient: recipientId,
                content: content || '',
                media,
                mediaName,
                mediaSize,
                mediaType,
                mediaThumbnail,
                sharedPost: postId,
                sharedPortal: portalId,
                replyTo: replyToId,
                expiresAt,
                read: isRecipientActiveInChat ? true : false,
                readAt: isRecipientActiveInChat ? new Date() : null,
            };

            const message = await Message.create(messageData);

            logActivity({
                user: req.user._id,
                username: req.user.username,
                action: 'MESSAGE_SEND',
                category: 'content',
                req,
                targetId: message._id,
                targetType: 'Message',
                details: {
                    recipientId,
                    hasMedia: !!media,
                    mediaType: mediaType || 'none',
                    hasSharedPost: !!postId,
                    hasSharedPortal: !!portalId
                }
            });

            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate('recipient', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate({
                    path: 'sharedPost',
                    populate: [
                        {
                            path: 'author',
                            select: 'username profile.displayName profile.avatar profile.lowResAvatar isDeleted',
                        },
                        {
                            path: 'portal',
                            select: 'name',
                        },
                    ],
                })
                .populate({
                    path: 'sharedPortal',
                    select: 'name avatar banner description',
                })
                .populate({
                    path: 'replyTo',
                    select: 'content media sender',
                    populate: { path: 'sender', select: 'username profile.displayName' },
                });

            if (io) {
                io.to(recipientId).emit('newMessage', populatedMessage);
                io.to(req.user._id.toString()).emit('messageSent', populatedMessage);

                if (isRecipientActiveInChat) {
                    io.to(req.user._id.toString()).emit('messagesRead', { readerId: recipientId });
                }
            }

            // Create Notification
            try {
                let notificationContent = content || '';
                let notificationImage = undefined;
                if (media) {
                    const isImg = mediaType?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(media);
                    if (isImg) {
                        notificationImage = media;
                        if (!notificationContent) notificationContent = '📷 Fotoğraf';
                    } else if (!notificationContent) {
                        notificationContent = '[Medya Dosyası]';
                    }
                } else if (!notificationContent && postId) {
                    notificationContent = '[Paylaşılan Gönderi]';
                } else if (!notificationContent && portalId) {
                    notificationContent = '[Paylaşılan Portal]';
                }

                const notification = await Notification.create({
                    recipient: recipientId,
                    sender: req.user._id,
                    type: 'message',
                    content: notificationContent,
                    imageUrl: notificationImage,
                    read: isRecipientActiveInChat ? true : false,
                    skipPush: isRecipientActiveInChat || isRecipientMuted ? true : false,
                });

                if (io && !isRecipientActiveInChat) {
                    const populatedNotif = await notification.populate(
                        'sender',
                        'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge isDeleted'
                    );
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
    }
);
// @desc    Get all conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        const [messages, prefDocs] = await Promise.all([
            Message.find({
                $or: [{ sender: userId }, { recipient: userId }],
                deletedFor: { $ne: userId },
                $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }],
            })
                .sort({ createdAt: -1 })
                .populate('sender', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate('recipient', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
                .populate({
                    path: 'sharedPost',
                    populate: [
                        {
                            path: 'author',
                            select: 'username profile.displayName profile.avatar profile.lowResAvatar isDeleted',
                        },
                        {
                            path: 'portal',
                            select: 'name',
                        },
                    ],
                })
                .populate({
                    path: 'sharedPortal',
                    select: 'name avatar banner description',
                })
                .populate({
                    path: 'replyTo',
                    select: 'content media mediaType sender',
                    populate: { path: 'sender', select: 'username profile.displayName' },
                }),
            ChatPreference.find({ user: userId }).lean(),
        ]);

        const prefMap = new Map(prefDocs.map((p) => [String(p.partner), p]));

        // Extract unique conversations
        const conversationsMap = new Map();

        messages.forEach((msg) => {
            if (!msg.sender || !msg.recipient) {
                return;
            }

            const otherUser =
                msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;

            const otherUserId = otherUser._id.toString();
            const pref = prefMap.get(otherUserId);

            // Skip messages hidden by "Sohbeti temizle" / "Sohbeti sil"
            if (pref?.hiddenAt && msg.createdAt <= pref.hiddenAt) {
                return;
            }
            if (pref?.clearedAt && msg.createdAt <= pref.clearedAt) {
                return;
            }

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount: 0,
                    preferences: formatChatPreference(pref),
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

// @route   GET /api/messages/unread-count
// @desc    Get total unread messages count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            recipient: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Get unread messages count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/:userId', protect, mongoIdValidation('userId'), async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;
        const now = new Date();

        const userPref = await ChatPreference.findOne({ user: currentUserId, partner: otherUserId }).lean();
        const query = {
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId },
            ],
            deletedFor: { $ne: currentUserId },
            $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }],
        };
        if (userPref?.clearedAt) {
            query.createdAt = { $gt: userPref.clearedAt };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 })
            .populate('sender', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
            .populate('recipient', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge createdAt isDeleted')
            .populate({
                path: 'sharedPost',
                populate: [
                    {
                        path: 'author',
                        select: 'username profile.displayName profile.avatar profile.lowResAvatar isDeleted',
                    },
                    {
                        path: 'portal',
                        select: 'name',
                    },
                ],
            })
            .populate({
                path: 'sharedPortal',
                select: 'name avatar banner description',
            })
            .populate({
                path: 'replyTo',
                select: 'content media mediaType sender',
                populate: { path: 'sender', select: 'username profile.displayName' },
            });

        // Mark messages as read (Skip in Ghost Mode so observer never alters target user's unread state)
        if (!req.user?.isGhost) {
            const readNow = new Date();
            await Message.updateMany(
                { sender: otherUserId, recipient: currentUserId, read: false },
                { read: true, readAt: readNow }
            );
            await Notification.updateMany(
                { sender: otherUserId, recipient: currentUserId, type: 'message', read: false },
                { read: true }
            );
            req.app.get('io')?.to(otherUserId).emit('messagesRead', {
                readerId: currentUserId.toString(),
                readAt: readNow.toISOString(),
            });
        }

        const otherUser = await User.findById(otherUserId).select('settings');
        const hideReadReceipts = (req.user.settings?.privacy?.readReceipts === false) || 
                                 (otherUser?.settings?.privacy?.readReceipts === false);

        const messagesToSend = messages.map(msg => {
            const msgObj = msg.toObject();
            if (hideReadReceipts && msgObj.sender?._id?.toString() === currentUserId.toString()) {
                msgObj.read = false;
            }
            return msgObj;
        });

        res.json(messagesToSend);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/messages/:userId/read
// @desc    Mark conversation messages as read
// @access  Private
router.put('/:userId/read', protect, mongoIdValidation('userId'), async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        if (!req.user?.isGhost) {
            const readNow = new Date();
            await Message.updateMany(
                { sender: otherUserId, recipient: currentUserId, read: false },
                { read: true, readAt: readNow }
            );
            await Notification.updateMany(
                { sender: otherUserId, recipient: currentUserId, type: 'message', read: false },
                { read: true }
            );
            req.app.get('io')?.to(otherUserId).emit('messagesRead', {
                readerId: currentUserId.toString(),
                readAt: readNow.toISOString(),
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (supports ?scope=me or ?scope=everyone)
// @access  Private
router.delete('/:id', protect, mongoIdValidation('id'), async (req, res) => {
    try {
        if (req.user?.isGhost) {
            return res.status(403).json({ message: 'Hayalet Modu: Mesaj silinemez.' });
        }
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        const userIdStr = req.user._id.toString();
        const isSender = message.sender.toString() === userIdStr;
        const isRecipient = message.recipient.toString() === userIdStr;

        if (!isSender && !isRecipient) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const requestedScope = req.query.scope || (isSender ? 'everyone' : 'me');

        if (requestedScope === 'me' || !isSender) {
            await Message.updateOne(
                { _id: message._id },
                { $addToSet: { deletedFor: req.user._id } }
            );
            return res.json({ message: 'Message deleted for you', scope: 'me' });
        }

        const recipientId = message.recipient.toString();

        await message.deleteOne();

        // Emit socket event for real-time deletion
        const io = req.app.get('io');
        if (io) {
            io.to(recipientId).emit('messageDeleted', req.params.id);
            io.to(userIdStr).emit('messageDeleted', req.params.id);
        }

        res.json({ message: 'Message removed', scope: 'everyone' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
