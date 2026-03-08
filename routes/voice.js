import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { protect } from '../middleware/auth.js';
import Portal from '../models/Portal.js';

const router = express.Router();

// Helper: Get LiveKit config lazily at runtime
const getLiveKitConfig = () => {
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
    const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const LIVEKIT_HTTP_URL = LIVEKIT_URL.replace('ws://', 'http://').replace('wss://', 'https://');
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

        res.json({
            token,
            serverUrl: LIVEKIT_URL,
            roomName,
            roomMode: isStageMode ? 'stage' : 'free',
            userRole,
            channelName: channel.name,
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
            // Room may not exist yet (no one joined)
            if (err.message?.toLowerCase().includes('not found')) {
                return res.json({ participants: [], roomName });
            }
            // If it's a different error, log it specifically
            console.error('[Livekit Error inside listParticipants]:', err);
            throw err;
        }
    } catch (error) {
        console.error('List participants outer error:', error);
        res.status(500).json({ message: 'Failed to list participants' });
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

export default router;
