import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import { sendPushNotification } from './pushService.js';

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

        // Determine author display name and username
        let authorName = 'Oxypace Üyesi';
        let authorUsername = '';
        if (author && typeof author === 'object' && (author.profile || author.username)) {
            authorName = author.profile?.displayName || author.username || 'Oxypace Üyesi';
            authorUsername = author.username || '';
        } else if (post.author && typeof post.author === 'object' && (post.author.profile || post.author.username)) {
            authorName = post.author.profile?.displayName || post.author.username || 'Oxypace Üyesi';
            authorUsername = post.author.username || '';
        } else if (authorIdStr) {
            try {
                const authorDoc = await User.findById(authorIdStr).select('username profile.displayName');
                if (authorDoc) {
                    authorName = authorDoc.profile?.displayName || authorDoc.username || 'Oxypace Üyesi';
                    authorUsername = authorDoc.username || '';
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

        const eligibleTokens = [];

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

            // User has notifications ENABLED for this channel!
            if (Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0) {
                for (const t of user.fcmTokens) {
                    if (t && typeof t === 'string' && t.trim()) {
                        eligibleTokens.push(t.trim());
                    }
                }
            } else if (user.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.trim()) {
                eligibleTokens.push(user.fcmToken.trim());
            }
        }

        if (eligibleTokens.length === 0) {
            return;
        }

        // 3. Construct professional notification content
        let snippet = '';
        if (post.content && post.content.trim()) {
            snippet = post.content.replace(/\s+/g, ' ').trim();
            if (snippet.length > 120) {
                snippet = snippet.substring(0, 117) + '...';
            }
        } else if (post.mediaType === 'image' || post.mediaType === 'gif') {
            snippet = 'Yeni bir görsel paylaştı 🖼️';
        } else if (post.mediaType === 'video') {
            snippet = 'Yeni bir video paylaştı 🎥';
        } else if (post.mediaType === 'pdf') {
            snippet = `Yeni bir belge paylaştı: ${post.pdfName || 'PDF'}`;
        } else {
            snippet = 'Yeni bir paylaşım yaptı ✨';
        }

        // Extract cover image
        let coverImage = '';
        if (post.pdfThumbnailUrl) {
            coverImage = post.pdfThumbnailUrl;
        } else if (post.videoThumbnail) {
            coverImage = post.videoThumbnail;
        } else if (post.media) {
            if (Array.isArray(post.media)) {
                coverImage = post.media[0] || '';
            } else if (typeof post.media === 'string') {
                coverImage = post.media;
            }
        } else if (post.linkPreview?.image) {
            coverImage = post.linkPreview.image;
        }

        const portalAvatar = portalDoc.avatar || portalDoc.lowResAvatar || '';
        const notificationTitle = `${portalDoc.name} • #${channelName}`;
        const notificationBody = `${authorName}: ${snippet}`;
        const targetRoute = `/portal/${portalIdStr}?channel=${channelIdStr}`;

        const uniqueTokens = [...new Set(eligibleTokens)];

        console.log(`📢 [PortalNotificationService] Sending device push for ${portalDoc.name} (#${channelName}) to ${uniqueTokens.length} device(s)`);

        await sendPushNotification(uniqueTokens, {
            title: notificationTitle,
            body: notificationBody,
            image: coverImage || undefined,
            data: {
                type: 'portal_post',
                portalId: portalIdStr,
                channelId: channelIdStr,
                postId: post._id ? post._id.toString() : '',
                portalName: portalDoc.name,
                channelName: channelName,
                authorId: authorIdStr,
                authorName: authorName,
                authorUsername: authorUsername,
                portalAvatar: portalAvatar,
                avatar: portalAvatar,
                route: targetRoute,
                url: targetRoute
            }
        });
    } catch (err) {
        console.error('❌ [PortalNotificationService] Error in sendPortalPostNotifications:', err);
    }
}

export default { sendPortalPostNotifications };

