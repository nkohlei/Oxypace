import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import { sendPushNotification, constructNotifImageUrl } from './pushService.js';

/**
 * Helper to extract clean notification details from a Post document
 */
function extractPostNotificationDetails(p) {
    if (!p) {
        return {
            text: '',
            snippet: 'Yeni bir paylaşım yaptı',
            mediaType: 'none',
            postMedia: '',
            pdfName: '',
            pdfSize: ''
        };
    }

    const rawContent = (p.content || '').replace(/\s+/g, ' ').trim();
    const text = rawContent.length > 140 ? rawContent.substring(0, 137) + '...' : rawContent;

    let mediaType = 'none';
    if (p.mediaType === 'pdf' || p.pdfUrl || p.pdfName || p.pdfThumbnailUrl) {
        mediaType = 'pdf';
    } else if (p.mediaType === 'video' || p.mediaType === 'videoUrl' || p.videoThumbnail || p.videoUrl) {
        mediaType = 'video';
    } else if (p.mediaType === 'gif' || p.gifUrl) {
        mediaType = 'gif';
    } else if (p.mediaType === 'youtube' || p.youtubeUrl) {
        mediaType = 'youtube';
    } else if (p.mediaType === 'image') {
        mediaType = 'image';
    } else if (p.media) {
        const firstMedia = Array.isArray(p.media) ? p.media[0] : p.media;
        if (typeof firstMedia === 'string' && firstMedia.trim()) {
            const lower = firstMedia.toLowerCase();
            if (lower.endsWith('.pdf')) mediaType = 'pdf';
            else if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) mediaType = 'video';
            else if (lower.endsWith('.gif')) mediaType = 'gif';
            else mediaType = 'image';
        }
    }

    let rawMediaUrl = '';
    if (p.pdfThumbnailUrl) {
        rawMediaUrl = p.pdfThumbnailUrl;
    } else if (p.videoThumbnail) {
        rawMediaUrl = p.videoThumbnail;
    } else if (p.media) {
        if (Array.isArray(p.media) && p.media.length > 0) {
            const first = p.media[0];
            if (typeof first === 'string' && !/\.(mp4|webm|mov|pdf)(\?|$)/i.test(first)) {
                rawMediaUrl = first;
            }
        } else if (typeof p.media === 'string' && !/\.(mp4|webm|mov|pdf)(\?|$)/i.test(p.media)) {
            rawMediaUrl = p.media;
        }
    } else if (p.linkPreview?.image) {
        rawMediaUrl = p.linkPreview.image;
    } else if (p.gifUrl) {
        rawMediaUrl = p.gifUrl;
    } else if (p.youtubeUrl || (p.mediaType === 'youtube' && typeof p.media === 'string')) {
        const ytSource = p.youtubeUrl || p.media;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = String(ytSource).match(regExp);
        if (match && match[2].length === 11) {
            rawMediaUrl = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
        }
    }

    const postMedia = rawMediaUrl ? (constructNotifImageUrl(rawMediaUrl) || rawMediaUrl) : '';

    let pdfName = '';
    let pdfSize = '';
    if (mediaType === 'pdf') {
        pdfName = p.pdfName || '';
        if (!pdfName && p.pdfUrl) {
            try {
                pdfName = decodeURIComponent(String(p.pdfUrl).split('/').pop().split('?')[0]);
            } catch (e) {
                pdfName = 'Doküman.pdf';
            }
        }
        if (!pdfName) pdfName = 'Doküman.pdf';

        if (typeof p.pdfSize === 'number' && p.pdfSize > 0) {
            pdfSize = (p.pdfSize / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
            pdfSize = 'PDF';
        }
    }

    let snippet = text;
    if (!snippet) {
        if (mediaType === 'pdf') {
            snippet = `📄 ${pdfName}${pdfSize ? ` (${pdfSize})` : ''}`;
        } else if (mediaType === 'video') {
            snippet = '🎬 Video paylaştı';
        } else if (mediaType === 'gif') {
            snippet = '👾 GIF paylaştı';
        } else if (mediaType === 'image') {
            snippet = '🖼️ Görsel paylaştı';
        } else {
            snippet = 'Yeni bir paylaşım yaptı';
        }
    }

    return {
        text,
        snippet,
        mediaType,
        postMedia,
        pdfName,
        pdfSize
    };
}

/**
 * Sends in-app notifications and real-time FCM device push notifications
 * to portal members whose notifications are active for this channel.
 *
 * @param {Object} params
 * @param {Object} params.post - The newly created post document
 * @param {Object|String} params.portal - The portal document or portal ID
 * @param {String} params.channelId - Channel ID
 * @param {Object|String} params.author - Post author (user doc or user ID)
 */
export async function sendPortalPostNotifications({ post, portal, channelId, author }) {
    try {
        if (!post || !portal) return;

        let portalDoc = portal;
        if (!portalDoc.name || !portalDoc.channels || !portalDoc.members) {
            portalDoc = await Portal.findById(portal._id || portal).select('name avatar lowResAvatar members channels');
        }
        if (!portalDoc) return;

        const portalIdStr = portalDoc._id.toString();
        const authorIdStr = (author?._id || author || post.author?._id || post.author || '').toString();
        const channelIdStr = channelId ? channelId.toString() : '';

        // Determine channel name
        let channelName = 'genel';
        if (channelIdStr && Array.isArray(portalDoc.channels)) {
            const ch = portalDoc.channels.find(c => 
                (c._id && c._id.toString() === channelIdStr) || 
                c.name === channelIdStr
            );
            if (ch && ch.name) {
                channelName = ch.name;
            }
        }

        // Determine author display name, username, and avatar
        let authorName = 'Oxypace Üyesi';
        let authorUsername = '';
        let authorAvatar = '';
        if (author && typeof author === 'object' && (author.profile || author.username)) {
            authorName = author.profile?.displayName || author.username || 'Oxypace Üyesi';
            authorUsername = author.username || '';
            authorAvatar = author.profile?.avatar || author.profile?.lowResAvatar || '';
        } else if (post.author && typeof post.author === 'object' && (post.author.profile || post.author.username)) {
            authorName = post.author.profile?.displayName || post.author.username || 'Oxypace Üyesi';
            authorUsername = post.author.username || '';
            authorAvatar = post.author.profile?.avatar || post.author.profile?.lowResAvatar || '';
        } else if (authorIdStr) {
            try {
                const authorDoc = await User.findById(authorIdStr).select('username profile.displayName profile.avatar profile.lowResAvatar');
                if (authorDoc) {
                    authorName = authorDoc.profile?.displayName || authorDoc.username || 'Oxypace Üyesi';
                    authorUsername = authorDoc.username || '';
                    authorAvatar = authorDoc.profile?.avatar || authorDoc.profile?.lowResAvatar || '';
                }
            } catch (e) {}
        }

        // Exclude the post author from receiving their own notification
        const allMemberIds = (portalDoc.members || [])
            .map(m => (m?._id || m)?.toString())
            .filter(id => id && id !== authorIdStr);

        if (allMemberIds.length === 0) return;

        // 1. Create in-app notification records in MongoDB
        try {
            const notificationDocs = allMemberIds.map(userId => ({
                recipient: userId,
                sender: authorIdStr || undefined,
                type: 'portal_post',
                portal: portalDoc._id,
                channel: channelIdStr,
                post: post._id,
                read: false
            }));
            await Notification.insertMany(notificationDocs);
        } catch (notifErr) {
            console.error('⚠️ [PortalNotificationService] Failed to insert in-app notifications:', notifErr.message);
        }

        // 2. Query members with registered FCM push tokens
        const candidateUsers = await User.find({
            _id: { $in: allMemberIds },
            isBanned: false,
            isDeleted: false,
            $or: [
                { fcmTokens: { $exists: true, $not: { $size: 0 } } },
                { fcmToken: { $exists: true, $ne: '' } }
            ]
        }).select('_id username fcmTokens fcmToken portalNotificationSettings settings');

        if (!candidateUsers || candidateUsers.length === 0) {
            return;
        }

        const userTokensMap = new Map(); // recipientUserId -> Set<token>

        for (const user of candidateUsers) {
            // Check global notification push preference
            if (user.settings?.notifications?.push === false) {
                continue;
            }

            // Find user's portal notification settings
            const pSettings = (user.portalNotificationSettings || []).find(s => {
                if (!s || !s.portal) return false;
                const pId = typeof s.portal === 'object' ? (s.portal._id || s.portal.id || s.portal) : s.portal;
                return pId?.toString() === portalIdStr;
            });

            // If user has muted all notifications for this portal:
            if (pSettings?.isAllMuted) {
                continue;
            }

            // If user has muted this specific channel:
            const mutedChannels = (pSettings?.mutedChannels || []).map(id => {
                if (!id) return '';
                const chId = typeof id === 'object' ? (id._id || id.id || id) : id;
                return chId?.toString() || '';
            }).filter(Boolean);

            if (channelIdStr && mutedChannels.includes(channelIdStr)) {
                // Channel is muted by this user, skip device notification
                continue;
            }

            const uId = user._id.toString();
            const tokenList = new Set();

            // User has notifications ENABLED for this channel!
            if (Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0) {
                for (const t of user.fcmTokens) {
                    if (t && typeof t === 'string' && t.trim()) {
                        tokenList.add(t.trim());
                    }
                }
            } else if (user.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.trim()) {
                tokenList.add(user.fcmToken.trim());
            }

            if (tokenList.size > 0) {
                userTokensMap.set(uId, tokenList);
            }
        }

        if (userTokensMap.size === 0) {
            return;
        }

        // 3. Extract current post details (strictly separating portalAvatar from postMedia)
        const currentPostDetails = extractPostNotificationDetails(post);
        const portalAvatar = portalDoc.avatar || portalDoc.lowResAvatar || '';
        const proxiedAuthorAvatar = authorAvatar ? (constructNotifImageUrl(authorAvatar) || authorAvatar) : '';

        // 4. Query unread portal_post notifications for these recipients in this portal + channel
        // so that even if a user swiped away an earlier device notification, any unread posts in
        // this portal/channel accumulate cleanly up to the visual limit (max 5 items).
        const recipientIds = Array.from(userTokensMap.keys());
        const unreadByRecipient = new Map(); // recipientId -> Array of unread notification docs

        try {
            const allUnreadDocs = await Notification.find({
                recipient: { $in: recipientIds },
                portal: portalDoc._id,
                channel: channelIdStr,
                type: 'portal_post',
                read: false
            })
                .sort({ createdAt: -1 })
                .populate('sender', 'username profile.displayName profile.avatar profile.lowResAvatar')
                .populate('post', 'content media mediaType pdfUrl pdfName pdfSize pdfThumbnailUrl videoThumbnail videoUrl createdAt')
                .lean();

            for (const doc of allUnreadDocs) {
                if (!doc.post) continue; // skip if post was deleted
                const rId = doc.recipient.toString();
                if (!unreadByRecipient.has(rId)) {
                    unreadByRecipient.set(rId, []);
                }
                unreadByRecipient.get(rId).push(doc);
            }
        } catch (unreadErr) {
            console.warn('⚠️ [PortalNotificationService] Could not query unread notifications for accumulation:', unreadErr.message);
        }

        const notificationTitle = `${portalDoc.name} • #${channelName}`;
        const displayAuthor = authorUsername ? `${authorName} (@${authorUsername})` : authorName;
        const notificationBody = `${displayAuthor}: ${currentPostDetails.snippet}`;
        const targetRoute = `/portal/${portalIdStr}?channel=${channelIdStr}`;

        let totalSentTokens = 0;

        for (const [recipientId, tokensSet] of userTokensMap.entries()) {
            const tokens = Array.from(tokensSet);
            if (tokens.length === 0) continue;
            totalSentTokens += tokens.length;

            const userUnreadDocs = unreadByRecipient.get(recipientId) || [];
            const totalUnreadCount = Math.max(1, userUnreadDocs.length);

            // Take up to 5 latest unread posts in chronological order (oldest -> newest)
            const latestFiveDocs = userUnreadDocs.slice(0, 5).reverse();
            let unreadItemsPayload = [];

            if (latestFiveDocs.length > 0) {
                unreadItemsPayload = latestFiveDocs.map(doc => {
                    const pDoc = doc.post || {};
                    const sDoc = doc.sender || {};
                    const sName = sDoc.profile?.displayName || sDoc.username || authorName;
                    const sUser = sDoc.username || authorUsername || '';
                    const sAvatarRaw = sDoc.profile?.avatar || sDoc.profile?.lowResAvatar || '';
                    const sAvatar = sAvatarRaw ? (constructNotifImageUrl(sAvatarRaw) || sAvatarRaw) : '';
                    const details = extractPostNotificationDetails(pDoc);
                    return {
                        postId: (pDoc._id || post._id || '').toString(),
                        authorName: sName,
                        authorUsername: sUser,
                        authorAvatar: sAvatar,
                        text: details.text,
                        snippet: details.snippet,
                        mediaType: details.mediaType,
                        postMedia: details.postMedia,
                        pdfName: details.pdfName,
                        pdfSize: details.pdfSize,
                        timestamp: pDoc.createdAt ? new Date(pDoc.createdAt).getTime() : Date.now()
                    };
                });
            } else {
                unreadItemsPayload = [{
                    postId: post._id ? post._id.toString() : '',
                    authorName: authorName,
                    authorUsername: authorUsername,
                    authorAvatar: proxiedAuthorAvatar,
                    text: currentPostDetails.text,
                    snippet: currentPostDetails.snippet,
                    mediaType: currentPostDetails.mediaType,
                    postMedia: currentPostDetails.postMedia,
                    pdfName: currentPostDetails.pdfName,
                    pdfSize: currentPostDetails.pdfSize,
                    timestamp: Date.now()
                }];
            }

            sendPushNotification(tokens, {
                title: notificationTitle,
                body: notificationBody,
                image: currentPostDetails.postMedia || undefined,
                data: {
                    type: 'portal_post',
                    targetUserId: recipientId,
                    recipientUserId: recipientId,
                    portalId: portalIdStr,
                    channelId: channelIdStr,
                    postId: post._id ? post._id.toString() : '',
                    portalName: portalDoc.name,
                    channelName: channelName,
                    authorId: authorIdStr,
                    authorName: authorName,
                    authorUsername: authorUsername,
                    authorAvatar: proxiedAuthorAvatar,
                    portalAvatar: portalAvatar,
                    avatar: portalAvatar,
                    postText: currentPostDetails.text,
                    mediaType: currentPostDetails.mediaType,
                    postMedia: currentPostDetails.postMedia,
                    pdfName: currentPostDetails.pdfName,
                    pdfSize: currentPostDetails.pdfSize,
                    unreadCount: String(totalUnreadCount),
                    unreadItems: JSON.stringify(unreadItemsPayload),
                    route: targetRoute,
                    url: targetRoute
                }
            }).catch(e => console.error(`⚠️ [PortalNotificationService] Push send error for user ${recipientId}:`, e.message));
        }

        console.log(`📢 [PortalNotificationService] Dispatched device pushes for ${portalDoc.name} (#${channelName}) to ${userTokensMap.size} user(s) (${totalSentTokens} token(s))`);
    } catch (err) {
        console.error('❌ [PortalNotificationService] Error in sendPortalPostNotifications:', err);
    }
}

export default { sendPortalPostNotifications };

