import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { protect } from '../middleware/auth.js';
import Portal from '../models/Portal.js';
import User from '../models/User.js';
import { getVoiceRoomData } from '../sockets/voiceHandler.js';
import Notification from '../models/Notification.js';
import { sendPushNotification } from '../utils/firebase.js';

const router = express.Router();

// Helper: Get LiveKit config lazily at runtime
const getLiveKitConfig = () => {
    let LIVEKIT_API_KEY = (process.env.LIVEKIT_API_KEY || 'devkey').trim();
    let LIVEKIT_API_SECRET = (process.env.LIVEKIT_API_SECRET || 'secret').trim();
    let LIVEKIT_URL = (process.env.LIVEKIT_URL || 'ws://localhost:7880').trim();

    // Ensure protocol for RoomServiceClient
    let LIVEKIT_HTTP_URL = LIVEKIT_URL;
    if (LIVEKIT_HTTP_URL.startsWith('wss://')) {
        LIVEKIT_HTTP_URL = LIVEKIT_HTTP_URL.replace('wss://', 'https://');
    } else if (LIVEKIT_HTTP_URL.startsWith('ws://')) {
        LIVEKIT_HTTP_URL = LIVEKIT_HTTP_URL.replace('ws://', 'http://');
    } else if (!LIVEKIT_HTTP_URL.startsWith('http')) {
        LIVEKIT_HTTP_URL = `https://${LIVEKIT_HTTP_URL}`; // Default to https for cloud
    }

    return { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL, LIVEKIT_HTTP_URL };
};

// Helper: Generate a unique room name from portal+channel IDs
const getRoomName = (portalId, channelId) => `portal_${portalId}_channel_${channelId}`;

// Helper: Determine user role in a portal
const getUserRole = (portal, userId) => {
    const uid = userId.toString();
    if (portal.owner.toString() === uid) return 'owner';
    if (portal.admins?.some((a) => a.toString() === uid)) return 'admin';
    if (portal.members?.some((m) => m.toString() === uid)) return 'member';
    return 'guest';
};

/**
 * POST /api/voice/token
 * Generate a LiveKit access token for the user to join a voice/conference channel
 * Body: { portalId, channelId }
 */
router.post('/token', protect, async (req, res) => {
    try {
        const { portalId, channelId } = req.body;
        if (!portalId || !channelId) {
            return res.status(400).json({ message: 'portalId and channelId are required' });
        }

        // Fetch portal and validate membership
        const portal = await Portal.findById(portalId);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const userRole = getUserRole(portal, req.user._id);
        if (userRole === 'guest') {
            return res.status(403).json({ message: 'You must be a member to join voice channels' });
        }

        // Find the channel
        const channel = portal.channels.id(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        if (channel.type !== 'voice' && channel.type !== 'conference') {
            return res.status(400).json({ message: 'This is not a voice or conference channel' });
        }

        const roomName = getRoomName(portalId, channelId);
        const isStageMode = channel.type === 'conference' || channel.roomMode === 'stage';
        const isAdmin = userRole === 'owner' || userRole === 'admin';

        const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = getLiveKitConfig();

        // Create access token with appropriate permissions
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: req.user._id.toString(),
            name: req.user.profile?.displayName || req.user.username,
            metadata: JSON.stringify({
                username: req.user.username,
                avatar: req.user.profile?.avatar || '',
                role: userRole,
            }),
        });

        // Set permissions based on room mode and user role
        if (isStageMode && !isAdmin) {
            // Stage mode: listeners can only subscribe, not publish
            at.addGrant({
                room: roomName,
                roomJoin: true,
                canPublish: false,
                canSubscribe: true,
                canPublishData: true, // Allow data messages (raise hand, etc.)
            });
        } else {
            // Free mode or admin in stage mode: full publish rights
            at.addGrant({
                room: roomName,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
            });
        }

        const token = await at.toJwt();

        const roomData = getVoiceRoomData(roomName);

        res.json({
            token,
            serverUrl: LIVEKIT_URL,
            roomName,
            roomMode: isStageMode ? 'stage' : 'free',
            userRole,
            channelName: channel.name,
            startedAt: roomData ? roomData.startedAt : null,
            serverNow: Date.now()
        });
    } catch (error) {
        console.error('Voice token generation error:', error);
        res.status(500).json({ message: 'Failed to generate voice token' });
    }
});

/**
 * GET /api/voice/rooms/:portalId/:channelId/participants
 * List participants in a voice room
 */
router.get('/rooms/:portalId/:channelId/participants', protect, async (req, res) => {
    try {
        const { portalId, channelId } = req.params;
        const roomName = getRoomName(portalId, channelId);

        const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_HTTP_URL } = getLiveKitConfig();

        const roomService = new RoomServiceClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        try {
            const participants = await roomService.listParticipants(roomName);
            const mapped = participants.map((p) => {
                let parsedMeta = {};
                if (p.metadata) {
                    try {
                        parsedMeta = JSON.parse(p.metadata);
                    } catch (e) {
                        parsedMeta = { raw: p.metadata };
                    }
                }

                return {
                    identity: p.identity,
                    name: p.name,
                    metadata: parsedMeta,
                    isSpeaking: p.isSpeaking,
                    joinedAt: p.joinedAt,
                    tracks: p.tracks?.map((t) => ({
                        source: t.source,
                        type: t.type,
                        muted: t.muted,
                    })),
                };
            });

            res.json({ participants: mapped, roomName });
        } catch (err) {
            // Log the error but don't crash the request
            console.error('[Livekit listParticipants failed]:', err.message);
            return res.json({ participants: [], roomName, error: 'LiveKit sync failed' });
        }
    } catch (error) {
        console.error('List participants outer error:', error);
        res.json({ participants: [], roomName: 'unknown' });
    }
});

/**
 * POST /api/voice/rooms/:portalId/:channelId/permissions
 * Update a participant's permissions (grant/revoke speak in stage mode)
 * Body: { targetUserId, canPublish }
 */
router.post('/rooms/:portalId/:channelId/permissions', protect, async (req, res) => {
    try {
        const { portalId, channelId } = req.params;
        const { targetUserId, canPublish } = req.body;

        // Verify requester is admin/owner
        const portal = await Portal.findById(portalId);
        if (!portal) return res.status(404).json({ message: 'Portal not found' });

        const requesterRole = getUserRole(portal, req.user._id);
        if (requesterRole !== 'owner' && requesterRole !== 'admin') {
            return res.status(403).json({ message: 'Only admins can change permissions' });
        }

        const roomName = getRoomName(portalId, channelId);
        const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_HTTP_URL } = getLiveKitConfig();
        const roomService = new RoomServiceClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

        await roomService.updateParticipant(roomName, targetUserId, undefined, {
            canPublish: canPublish,
            canSubscribe: true,
            canPublishData: true,
        });

        // Notify via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`voice:${roomName}`).emit('voice:permissions-updated', {
                userId: targetUserId,
                canPublish,
            });
        }

        res.json({ message: 'Permissions updated', targetUserId, canPublish });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: 'Failed to update permissions' });
    }
});

/**
 * POST /api/voice/rooms/:portalId/:channelId/raise-hand
 * Raise or lower hand in a stage room
 * Body: { raised } (boolean)
 */
router.post('/rooms/:portalId/:channelId/raise-hand', protect, async (req, res) => {
    try {
        const { portalId, channelId } = req.params;
        const { raised } = req.body;

        const portal = await Portal.findById(portalId);
        if (!portal) return res.status(404).json({ message: 'Portal not found' });

        const roomName = getRoomName(portalId, channelId);

        // Notify admins via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`voice:${roomName}`).emit('voice:raise-hand', {
                userId: req.user._id.toString(),
                username: req.user.username,
                displayName: req.user.profile?.displayName || req.user.username,
                avatar: req.user.profile?.avatar || '',
                raised: raised !== false,
            });
        }

        res.json({ message: raised !== false ? 'Hand raised' : 'Hand lowered' });
    } catch (error) {
        console.error('Raise hand error:', error);
        res.status(500).json({ message: 'Failed to raise hand' });
    }
});

/**
 * POST /api/voice/invite
 * Send a video/voice call invitation notification
 * Body: { portalId, channelId, targetUserIds } (targetUserIds is an array of user IDs)
 */
router.post('/invite', protect, async (req, res) => {
    try {
        const { portalId, channelId, targetUserIds } = req.body;
        if (!portalId || !channelId || !targetUserIds || !Array.isArray(targetUserIds)) {
            return res.status(400).json({ message: 'portalId, channelId, and targetUserIds array are required' });
        }

        const portal = await Portal.findById(portalId);
        if (!portal) {
            return res.status(404).json({ message: 'Portal not found' });
        }

        const userRole = getUserRole(portal, req.user._id);
        if (userRole === 'guest') {
            return res.status(403).json({ message: 'You must be a member to send voice invites' });
        }

        const channel = portal.channels.id(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        const notifications = [];
        const io = req.app.get('io');

        for (const targetId of targetUserIds) {
            if (targetId.toString() === req.user._id.toString()) continue;

            const notification = await Notification.create({
                recipient: targetId,
                sender: req.user._id,
                type: 'voice_invite',
                portal: portalId,
                channel: channelId,
                link: `/portal/${portalId}?channel=${channelId}&joinVoice=true`,
                content: `${req.user.profile?.displayName || req.user.username} seni ${portal.name} portalındaki ${channel.name} görüntülü konuşma odasına davet etti.`,
            });

            const populated = await notification.populate('sender', 'username profile.displayName profile.avatar');

            if (io) {
                io.to(targetId.toString()).emit('newNotification', populated);
                // Also emit a specific direct call event so the app displays a modal if it's currently open
                io.to(targetId.toString()).emit('voice:incoming-invite', {
                    portalId,
                    channelId,
                    channelName: channel.name,
                    portalName: portal.name,
                    senderName: req.user.profile?.displayName || req.user.username,
                    senderAvatar: req.user.profile?.avatar || '',
                    link: `/portal/${portalId}?channel=${channelId}&joinVoice=true`,
                });
            }

            notifications.push(populated);

            // Send FCM push notification so the invite arrives even when app is closed/background
            const targetUser = await User.findById(targetId).select('fcmTokens');
            if (targetUser?.fcmTokens && targetUser.fcmTokens.length > 0) {
                const joinLink = `/portal/${portalId}?channel=${channelId}&joinVoice=true`;
                // Send push notification to all of target user's registered devices
                for (const token of targetUser.fcmTokens) {
                    await sendPushNotification(token, {
                        title: '📞 Görüntülü Sohbet Daveti',
                        body: `${req.user.profile?.displayName || req.user.username} seni ${channel.name} odasına davet ediyor!`,
                        data: {
                            type: 'voice_invite',
                            route: joinLink,
                            portalId: String(portalId),
                            channelId: String(channelId),
                            channelName: channel.name,
                            senderName: req.user.profile?.displayName || req.user.username,
                        }
                    });
                }
            }
        }

        res.json({ message: 'Invitations sent successfully', count: notifications.length });
    } catch (error) {
        console.error('Voice invite error:', error);
        res.status(500).json({ message: 'Failed to send invitations' });
    }
});

export default router;
