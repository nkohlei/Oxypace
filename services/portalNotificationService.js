import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import { sendPushNotification, constructNotifImageUrl } from './pushService.js';

/**
 * Helper to format audio duration in MM:SS
 */
function formatAudioDuration(seconds) {
    const num = Number(seconds);
    if (!Number.isFinite(num) || num <= 0) return '';
    const totalSec = Math.round(num);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Helper to format file size cleanly
 */
function formatAudioSize(bytes) {
    const num = Number(bytes);
    if (!Number.isFinite(num) || num <= 0) return '';
    if (num >= 1024 * 1024) {
        return `${(num / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.max(1, Math.round(num / 1024))} KB`;
}

const FILE_SNIPPET_MAP = {
    doc: '📝',
    docx: '📝',
    odt: '📝',
    rtf: '📝',
    ppt: '📽️',
    pptx: '📽️',
    ppsx: '📽️',
    odp: '📽️',
    xls: '📊',
    xlsx: '📊',
    xlsm: '📊',
    ods: '📊',
    csv: '📊',
    zip: '🗜️',
    rar: '🗜️',
    '7z': '🗜️',
    tar: '🗜️',
    gz: '🗜️',
    js: '💻',
    jsx: '💻',
    ts: '💻',
    tsx: '💻',
    py: '💻',
    html: '💻',
    htm: '💻',
    css: '💻',
    json: '💻',
    xml: '💻',
    txt: '📄',
    md: '📄',
};

function parseExtFromString(str) {
    if (!str) return '';
    const clean = String(str).split('?')[0].split('#')[0].trim();
    const lastDot = clean.lastIndexOf('.');
    if (lastDot < 0 || lastDot === clean.length - 1) return '';
    const ext = clean.slice(lastDot + 1).toLowerCase();
    return /^[a-z0-9]{1,8}$/.test(ext) ? ext : '';
}

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
            pdfSize: '',
            fileName: '',
            fileExt: '',
            fileSize: '',
            folderFileCount: '',
            audioName: '',
            audioDuration: '',
            audioSize: '',
            isVoiceRecording: false,
            audioColor: ''
        };
    }

    const rawContent = (p.content || '').replace(/\s+/g, ' ').trim();
    const text = rawContent.length > 140 ? rawContent.substring(0, 137) + '...' : rawContent;

    let mediaType = 'none';
    const attachments = Array.isArray(p.attachments) ? p.attachments : [];
    const firstAtt = attachments[0] || null;

    const VALID_KINDS = new Set(['pdf', 'audio', 'video', 'videoUrl', 'gif', 'youtube', 'image', 'file', 'folder']);
    if (firstAtt?.kind && VALID_KINDS.has(firstAtt.kind)) {
        mediaType = firstAtt.kind === 'videoUrl' ? 'video' : firstAtt.kind;
    } else if (p.mediaType && VALID_KINDS.has(p.mediaType)) {
        mediaType = p.mediaType === 'videoUrl' ? 'video' : p.mediaType;
    } else if (p.pdfUrl || p.pdfThumbnailUrl || (p.pdfName && String(p.pdfName).toLowerCase().endsWith('.pdf'))) {
        mediaType = 'pdf';
    } else if (p.videoThumbnail || p.videoUrl) {
        mediaType = 'video';
    } else if (p.gifUrl) {
        mediaType = 'gif';
    } else if (p.youtubeUrl) {
        mediaType = 'youtube';
    } else if (p.media) {
        const firstMedia = Array.isArray(p.media) ? p.media[0] : p.media;
        if (typeof firstMedia === 'string' && firstMedia.trim()) {
            const lower = firstMedia.toLowerCase();
            if (/\.pdf(\?|$)/i.test(lower)) mediaType = 'pdf';
            else if (/\.(mp3|wav|m4a|ogg|webm|flac|aac)(\?|$)/i.test(lower)) mediaType = 'audio';
            else if (/\.(mp4|mov|mkv|avi)(\?|$)/i.test(lower)) mediaType = 'video';
            else if (/\.gif(\?|$)/i.test(lower)) mediaType = 'gif';
            else if (/\.(docx?|pptx?|ppsx|odp|odt|rtf|xlsx?|xlsm|ods|csv|zip|rar|7z|tar|gz|txt|md|html?|css|jsx?|tsx?|py|json|xml)(\?|$)/i.test(lower)) mediaType = 'file';
            else mediaType = 'image';
        }
    }

    let rawMediaUrl = '';
    if (mediaType === 'audio') {
        rawMediaUrl = firstAtt?.coverUrl || firstAtt?.thumbnailUrl || '';
    } else if (mediaType === 'pdf') {
        rawMediaUrl = p.pdfThumbnailUrl || firstAtt?.thumbnailUrl || '';
    } else if (mediaType === 'file' || mediaType === 'folder') {
        rawMediaUrl = '';
    } else if (p.videoThumbnail) {
        rawMediaUrl = p.videoThumbnail;
    } else if (firstAtt && (firstAtt.kind === 'image' || firstAtt.kind === 'gif') && firstAtt.url) {
        rawMediaUrl = firstAtt.url;
    } else if (firstAtt && (firstAtt.coverUrl || firstAtt.thumbnailUrl)) {
        rawMediaUrl = firstAtt.coverUrl || firstAtt.thumbnailUrl;
    } else if (p.media) {
        if (Array.isArray(p.media) && p.media.length > 0) {
            const first = p.media[0];
            if (typeof first === 'string' && !/\.(mp4|webm|mov|pdf|pptx?|docx?|xlsx?|zip|rar|7z|mp3|wav|m4a|ogg|flac|aac)(\?|$)/i.test(first)) {
                rawMediaUrl = first;
            }
        } else if (typeof p.media === 'string' && !/\.(mp4|webm|mov|pdf|pptx?|docx?|xlsx?|zip|rar|7z|mp3|wav|m4a|ogg|flac|aac)(\?|$)/i.test(p.media)) {
            rawMediaUrl = p.media;
        }
    } else if (p.linkPreview?.image) {
        rawMediaUrl = p.linkPreview.image;
    } else if (p.gifUrl) {
        rawMediaUrl = p.gifUrl;
    } else if (p.youtubeUrl || (mediaType === 'youtube' && typeof p.media === 'string')) {
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
        pdfName = p.pdfName || (firstAtt?.kind === 'pdf' ? firstAtt.name : '') || '';
        if (!pdfName && (p.pdfUrl || firstAtt?.url)) {
            try {
                pdfName = decodeURIComponent(String(p.pdfUrl || firstAtt.url).split('/').pop().split('?')[0]);
            } catch (e) {
                pdfName = 'Doküman.pdf';
            }
        }
        if (!pdfName) pdfName = 'Doküman.pdf';

        const rawSize = typeof p.pdfSize === 'number' && p.pdfSize > 0 ? p.pdfSize : (firstAtt?.size || 0);
        if (typeof rawSize === 'number' && rawSize > 0) {
            pdfSize = formatAudioSize(rawSize);
        } else {
            pdfSize = 'PDF';
        }
    }

    let fileName = '';
    let fileExt = '';
    let fileSize = '';
    let folderFileCount = '';
    if (mediaType === 'file' || mediaType === 'folder') {
        fileName = String(
            firstAtt?.folderName || firstAtt?.name || p.pdfName || (mediaType === 'folder' ? 'Klasör' : 'Dosya')
        ).trim();
        fileExt = mediaType === 'folder'
            ? 'folder'
            : (String(firstAtt?.ext || '').replace(/^\./, '').toLowerCase() || parseExtFromString(fileName) || parseExtFromString(firstAtt?.url));
        const rawBytes = Number(firstAtt?.size) || Number(p.pdfSize) || 0;
        fileSize = formatAudioSize(rawBytes);
        if (mediaType === 'folder') {
            const cnt = Number(firstAtt?.fileCount) || (Array.isArray(firstAtt?.folderFiles) ? firstAtt.folderFiles.length : 0);
            if (cnt > 0) folderFileCount = String(cnt);
        }
    }

    let audioName = '';
    let audioDuration = '';
    let audioSize = '';
    let isVoiceRecording = false;
    let audioColor = '';
    if (mediaType === 'audio') {
        const rawAudioName = String(firstAtt?.name || p.pdfName || '').trim();
        isVoiceRecording = Boolean(
            firstAtt?.isVoiceRecording || /^ses-kaydi-\d+/i.test(rawAudioName)
        );
        const strippedName = rawAudioName.replace(/\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i, '').trim();
        audioName = isVoiceRecording ? 'Ses Kaydı' : (strippedName || 'Ses Dosyası');
        audioDuration = formatAudioDuration(firstAtt?.duration);
        audioSize = formatAudioSize(firstAtt?.size || p.pdfSize);
        audioColor = Array.isArray(firstAtt?.palette) && firstAtt.palette[0]
            ? String(firstAtt.palette[0]).trim()
            : '';
        fileExt = String(firstAtt?.ext || '').replace(/^\./, '').toLowerCase() || parseExtFromString(rawAudioName) || parseExtFromString(firstAtt?.url) || 'mp3';
        fileName = rawAudioName || audioName;
        fileSize = audioSize;
    }

    let snippet = text;
    if (!snippet) {
        if (mediaType === 'pdf') {
            snippet = `📄 ${pdfName}${pdfSize ? ` (${pdfSize})` : ''}`;
        } else if (mediaType === 'folder') {
            const countTxt = folderFileCount ? `${folderFileCount} dosya` : 'Klasör';
            snippet = `📁 ${fileName} (${countTxt}${fileSize ? ` • ${fileSize}` : ''})`;
        } else if (mediaType === 'file') {
            const emoji = FILE_SNIPPET_MAP[fileExt] || '📎';
            snippet = `${emoji} ${fileName}${fileSize ? ` (${fileSize})` : ''}`;
        } else if (mediaType === 'audio') {
            snippet = isVoiceRecording
                ? `🎙️ Ses Kaydı${audioDuration ? ` (${audioDuration})` : ''}`
                : `🎵 ${audioName}${audioDuration ? ` (${audioDuration})` : ''}`;
        } else if (mediaType === 'video') {
            snippet = '🎬 Video paylaştı';
        } else if (mediaType === 'gif') {
            snippet = '👾 GIF paylaştı';
        } else if (mediaType === 'youtube') {
            snippet = '▶️ YouTube videosu paylaştı';
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
        pdfSize,
        fileName,
        fileExt,
        fileSize,
        folderFileCount,
        audioName,
        audioDuration,
        audioSize,
        isVoiceRecording,
        audioColor
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
        if (!portalDoc.name || !portalDoc.channels || !portalDoc.members || !portalDoc.owner) {
            portalDoc = await Portal.findById(portal._id || portal).select('name avatar lowResAvatar members admins owner channels');
        }
        if (!portalDoc) return;

        const portalIdStr = portalDoc._id.toString();
        const authorIdStr = (author?._id || author || post.author?._id || post.author || '').toString();
        const channelIdStr = channelId ? channelId.toString() : '';

        // Determine channel name and canonical channel IDs for mute matching
        let channelName = 'genel';
        const channelMatchKeys = new Set();
        if (channelIdStr) channelMatchKeys.add(channelIdStr);
        if (channelIdStr && Array.isArray(portalDoc.channels)) {
            const ch = portalDoc.channels.find(c => 
                (c._id && c._id.toString() === channelIdStr) || 
                c.name === channelIdStr
            );
            if (ch) {
                if (ch.name) {
                    channelName = ch.name;
                    channelMatchKeys.add(ch.name);
                }
                if (ch._id) {
                    channelMatchKeys.add(ch._id.toString());
                }
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

        // Include members, admins, and owner (deduplicated), excluding the post author
        const memberIdSet = new Set();
        for (const m of (portalDoc.members || [])) {
            const id = (m?._id || m)?.toString();
            if (id && id !== authorIdStr) memberIdSet.add(id);
        }
        for (const a of (portalDoc.admins || [])) {
            const id = (a?._id || a)?.toString();
            if (id && id !== authorIdStr) memberIdSet.add(id);
        }
        if (portalDoc.owner) {
            const ownerId = (portalDoc.owner?._id || portalDoc.owner)?.toString();
            if (ownerId && ownerId !== authorIdStr) memberIdSet.add(ownerId);
        }
        const allMemberIds = Array.from(memberIdSet);

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

        // 2. Query members with registered FCM push tokens (use $ne: true so legacy docs without isBanned/isDeleted still match)
        const candidateUsers = await User.find({
            _id: { $in: allMemberIds },
            isBanned: { $ne: true },
            isDeleted: { $ne: true },
            $or: [
                { fcmTokens: { $exists: true, $not: { $size: 0 } } },
                { fcmToken: { $nin: [null, ''] } }
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

            // If user has muted this specific channel (match by channel ID or canonical name):
            const mutedChannels = (pSettings?.mutedChannels || []).map(id => {
                if (!id) return '';
                const chId = typeof id === 'object' ? (id._id || id.id || id) : id;
                return chId?.toString() || '';
            }).filter(Boolean);

            if (mutedChannels.some(mc => channelMatchKeys.has(mc))) {
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
                .populate('post', 'content media mediaType attachments pdfUrl pdfName pdfSize pdfThumbnailUrl videoThumbnail videoUrl createdAt')
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

            // Keep unreadItems strictly compact so total FCM data payload NEVER exceeds Firebase's 4096-byte hard limit
            const clampText = (str, maxLen = 85) => {
                const s = String(str || '').trim();
                return s.length > maxLen ? s.substring(0, maxLen - 3) + '...' : s;
            };

            if (latestFiveDocs.length > 0) {
                unreadItemsPayload = latestFiveDocs.map(doc => {
                    const pDoc = doc.post || {};
                    const sDoc = doc.sender || {};
                    const sName = sDoc.profile?.displayName || sDoc.username || authorName;
                    const sUser = sDoc.username || authorUsername || '';
                    const details = extractPostNotificationDetails(pDoc);
                    return {
                        postId: (pDoc._id || post._id || '').toString(),
                        authorName: clampText(sName, 40),
                        authorUsername: clampText(sUser, 30),
                        text: clampText(details.text || details.snippet, 85),
                        mediaType: details.mediaType,
                        postMedia: details.postMedia || '',
                        pdfName: clampText(details.pdfName, 45),
                        pdfSize: details.pdfSize || '',
                        fileName: clampText(details.fileName, 55),
                        fileExt: details.fileExt || '',
                        fileSize: details.fileSize || '',
                        folderFileCount: details.folderFileCount || '',
                        audioName: clampText(details.audioName, 45),
                        audioDuration: details.audioDuration || '',
                        audioSize: details.audioSize || '',
                        isVoiceRecording: Boolean(details.isVoiceRecording),
                        audioColor: details.audioColor || '',
                        timestamp: pDoc.createdAt ? new Date(pDoc.createdAt).getTime() : Date.now()
                    };
                });
            } else {
                unreadItemsPayload = [{
                    postId: post._id ? post._id.toString() : '',
                    authorName: clampText(authorName, 40),
                    authorUsername: clampText(authorUsername, 30),
                    text: clampText(currentPostDetails.text || currentPostDetails.snippet, 85),
                    mediaType: currentPostDetails.mediaType,
                    postMedia: currentPostDetails.postMedia || '',
                    pdfName: clampText(currentPostDetails.pdfName, 45),
                    pdfSize: currentPostDetails.pdfSize || '',
                    fileName: clampText(currentPostDetails.fileName, 55),
                    fileExt: currentPostDetails.fileExt || '',
                    fileSize: currentPostDetails.fileSize || '',
                    folderFileCount: currentPostDetails.folderFileCount || '',
                    audioName: clampText(currentPostDetails.audioName, 45),
                    audioDuration: currentPostDetails.audioDuration || '',
                    audioSize: currentPostDetails.audioSize || '',
                    isVoiceRecording: Boolean(currentPostDetails.isVoiceRecording),
                    audioColor: currentPostDetails.audioColor || '',
                    timestamp: Date.now()
                }];
            }

            // Enforce hard byte budget (< 1800 bytes for unreadItems) so full FCM data map stays safely under 4KB
            let unreadItemsJson = JSON.stringify(unreadItemsPayload);
            while (Buffer.byteLength(unreadItemsJson, 'utf8') > 1800 && unreadItemsPayload.length > 1) {
                unreadItemsPayload = unreadItemsPayload.slice(1);
                unreadItemsJson = JSON.stringify(unreadItemsPayload);
            }
            if (Buffer.byteLength(unreadItemsJson, 'utf8') > 1800) {
                unreadItemsPayload = unreadItemsPayload.map(it => ({ ...it, postMedia: '', text: clampText(it.text, 55) }));
                unreadItemsJson = JSON.stringify(unreadItemsPayload);
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
                    fileName: currentPostDetails.fileName,
                    fileExt: currentPostDetails.fileExt,
                    fileSize: currentPostDetails.fileSize,
                    folderFileCount: currentPostDetails.folderFileCount,
                    audioName: currentPostDetails.audioName,
                    audioDuration: currentPostDetails.audioDuration,
                    audioSize: currentPostDetails.audioSize,
                    isVoiceRecording: String(Boolean(currentPostDetails.isVoiceRecording)),
                    audioColor: currentPostDetails.audioColor,
                    unreadCount: String(totalUnreadCount),
                    unreadItems: unreadItemsJson,
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

