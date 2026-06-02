/**
 * Voice Channel Socket.IO Handler
 * Manages real-time signaling for voice/video channels:
 * - Join/leave voice rooms
 * - Raise hand requests
 * - Permission grants/revokes
 * - Participant presence tracking
 */

// Track voice channel participants: roomName -> Map<userId, { socketId, username, avatar }>
// Structure:
// voiceRooms = new Map([
//    ["roomA", { participants: Map<userId, data>, startedAt: timestamp }]
// ])
const voiceRooms = new Map();

export const initializeVoiceHandler = (io) => {
    io.on('connection', (socket) => {
        // ─── Join Voice Channel ───
        socket.on('voice:join', ({ roomName, userId, username, avatar }) => {
            if (!roomName || !userId) return;

            socket.join(`voice:${roomName}`);

            // Track participant
            if (!voiceRooms.has(roomName)) {
                voiceRooms.set(roomName, {
                    participants: new Map(),
                    startedAt: Date.now()
                });
            }
            const roomData = voiceRooms.get(roomName);
            roomData.participants.set(userId, {
                socketId: socket.id,
                username,
                avatar: avatar || '',
                joinedAt: Date.now(),
            });

            // Store room info on socket for cleanup on disconnect
            if (!socket._voiceRooms) socket._voiceRooms = new Set();
            socket._voiceRooms.add(roomName);
            socket._voiceUserId = userId;

            // Broadcast updated participant list and room start time
            const participants = getParticipantList(roomName);
            io.to(`voice:${roomName}`).emit('voice:participants', {
                roomName,
                participants,
                startedAt: roomData.startedAt,
                serverNow: Date.now()
            });

            // Emit explicit join event for notifications
            io.to(`voice:${roomName}`).emit('voice:user-joined', {
                userId,
                username,
                avatar: avatar || '',
            });

            console.log(`🎙️ User ${username} joined voice room ${roomName} (${participants.length} participants)`);
        });

        // ─── Leave Voice Channel ───
        socket.on('voice:leave', ({ roomName, userId }) => {
            if (!roomName || !userId) return;
            removeParticipant(io, roomName, userId);
            socket.leave(`voice:${roomName}`);
        });

        {/* ─── Raise Hand (Stage Mode) ─── */ }
        socket.on('voice:raise-hand', ({ roomName, userId, username, avatar, raised }) => {
            if (!roomName || !userId) return;

            io.to(`voice:${roomName}`).emit('voice:raise-hand', {
                userId,
                username,
                avatar: avatar || '',
                raised: raised !== false,
                timestamp: Date.now(),
            });

            console.log(`✋ User ${username} ${raised !== false ? 'raised' : 'lowered'} hand in ${roomName}`);
        });

        // ─── Toggle Chat Restrictions ───
        socket.on('voice:chat-mode-toggle', ({ roomName, restricted }) => {
            if (!roomName) return;

            io.to(`voice:${roomName}`).emit('voice:chat-mode', { restricted });
            console.log(`💬 Chat mode toggled in ${roomName}: restricted=${restricted}`);
        });

        // ─── Grant Speak Permission (Moderator → Listener) ───
        socket.on('voice:grant-speak', ({ roomName, targetUserId }) => {
            if (!roomName || !targetUserId) return;

            io.to(`voice:${roomName}`).emit('voice:permissions-updated', {
                userId: targetUserId,
                canPublish: true,
            });

            console.log(`🎤 Speak granted to ${targetUserId} in ${roomName}`);
        });

        // ─── Revoke Speak Permission ───
        socket.on('voice:revoke-speak', ({ roomName, targetUserId }) => {
            if (!roomName || !targetUserId) return;

            io.to(`voice:${roomName}`).emit('voice:permissions-updated', {
                userId: targetUserId,
                canPublish: false,
            });

            console.log(`🔇 Speak revoked from ${targetUserId} in ${roomName}`);
        });

        // ─── Broadcast Participant State (Mute/Camera/Screen) ───
        socket.on('voice:state-update', ({ roomName, userId, isMuted, isCameraOn, isScreenSharing }) => {
            if (!roomName || !userId) return;
            io.to(`voice:${roomName}`).emit('voice:state-update', {
                userId,
                isMuted,
                isCameraOn,
                isScreenSharing
            });
        });

        // ─── Broadcast Chat Messages ───
        socket.on('voice:chat-message', ({ roomName, text, senderName, senderId }) => {
            if (!roomName) return;
            io.to(`voice:${roomName}`).emit('voice:chat-message', {
                text,
                senderName,
                senderId
            });
        });

        // ─── WebRTC Signaling ───
        socket.on('voice:video-offer', ({ roomName, targetUserId, sdp }) => {
            if (!roomName || !targetUserId) return;
            console.log(`[Socket Backend] video-offer received from ${socket._voiceUserId || socket.id} for user ${targetUserId} in room ${roomName}`);
            
            const roomData = voiceRooms.get(roomName);
            const targetParticipant = roomData?.participants?.get(targetUserId);
            const destination = targetParticipant?.socketId || targetUserId;
            
            io.to(destination).emit('voice:video-offer', {
                senderId: socket._voiceUserId || socket.id,
                sdp
            });
            console.log(`[Socket Backend] video-offer forwarded to ${destination}`);
        });

        socket.on('voice:video-answer', ({ roomName, targetUserId, sdp }) => {
            if (!roomName || !targetUserId) return;
            console.log(`[Socket Backend] video-answer received from ${socket._voiceUserId || socket.id} for user ${targetUserId} in room ${roomName}`);
            
            const roomData = voiceRooms.get(roomName);
            const targetParticipant = roomData?.participants?.get(targetUserId);
            const destination = targetParticipant?.socketId || targetUserId;
            
            io.to(destination).emit('voice:video-answer', {
                senderId: socket._voiceUserId || socket.id,
                sdp
            });
            console.log(`[Socket Backend] video-answer forwarded to ${destination}`);
        });

        socket.on('voice:new-ice-candidate', ({ roomName, targetUserId, candidate }) => {
            if (!roomName || !targetUserId) return;
            console.log(`[Socket Backend] new-ice-candidate received from ${socket._voiceUserId || socket.id} for user ${targetUserId} in room ${roomName}`);
            
            const roomData = voiceRooms.get(roomName);
            const targetParticipant = roomData?.participants?.get(targetUserId);
            const destination = targetParticipant?.socketId || targetUserId;
            
            io.to(destination).emit('voice:new-ice-candidate', {
                senderId: socket._voiceUserId || socket.id,
                candidate
            });
            console.log(`[Socket Backend] new-ice-candidate forwarded to ${destination}`);
        });

        // ─── Cleanup on Disconnect ───
        socket.on('disconnect', () => {
            if (socket._voiceRooms && socket._voiceUserId) {
                for (const roomName of socket._voiceRooms) {
                    removeParticipant(io, roomName, socket._voiceUserId);
                }
            }
        });
    });
};

// ─── Helper Functions ───

function removeParticipant(io, roomName, userId) {
    const roomData = voiceRooms.get(roomName);
    if (!roomData) return;

    const participant = roomData.participants.get(userId);
    roomData.participants.delete(userId);

    // Cleanup empty rooms
    if (roomData.participants.size === 0) {
        voiceRooms.delete(roomName);
    } else {
        // Broadcast updated participant list
        const participants = getParticipantList(roomName);
        io.to(`voice:${roomName}`).emit('voice:participants', {
            roomName,
            participants,
            startedAt: roomData.startedAt,
            serverNow: Date.now()
        });

        // Emit explicit leave event for notifications
        if (participant) {
            io.to(`voice:${roomName}`).emit('voice:user-left', {
                userId,
                username: participant.username,
            });
        }
    }

    if (participant) {
        console.log(`👋 User ${participant.username} left voice room ${roomName}`);
    }
}

function getParticipantList(roomName) {
    const roomData = voiceRooms.get(roomName);
    if (!roomData || !roomData.participants) return [];

    return Array.from(roomData.participants.entries()).map(([userId, data]) => ({
        userId,
        username: data.username,
        avatar: data.avatar,
        joinedAt: data.joinedAt,
    }));
}

// Export for external access (e.g., from routes)
export const getVoiceRoomData = (roomName) => voiceRooms.get(roomName);
export const getVoiceRoomParticipants = (roomName) => getParticipantList(roomName);
export const getActiveVoiceRooms = () => Array.from(voiceRooms.keys());
