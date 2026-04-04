import { initializeVoiceHandler } from './voiceHandler.js';

export const initializeSocket = (io) => {
    // Store user socket connections
    const userSockets = new Map();

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // User joins with their ID
        socket.on('join', (userId) => {
            userSockets.set(userId, socket.id);
            socket.join(userId);
            console.log(`👤 User ${userId} joined`);

            // Broadcast online users
            io.emit('getOnlineUsers', Array.from(userSockets.keys()));
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`👋 User ${userId} disconnected`);

                    // Broadcast online users
                    io.emit('getOnlineUsers', Array.from(userSockets.keys()));
                    break;
                }
            }
        });

        // Typing indicator
        socket.on('typing', ({ recipientId, isTyping }) => {
            const recipientSocketId = userSockets.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('userTyping', { isTyping });
            }
        });

        // --- ROOM MANAGEMENT (For Feed Isolation) ---
        
        // Portal Rooms
        socket.on('join_portal', (portalId) => {
            socket.join(`portal:${portalId}`);
            console.log(`📡 Socket ${socket.id} joined portal room: ${portalId}`);
        });

        socket.on('leave_portal', (portalId) => {
            socket.leave(`portal:${portalId}`);
            console.log(`📡 Socket ${socket.id} left portal room: ${portalId}`);
        });

        // Channel Rooms
        socket.on('join_channel', (channelId) => {
            socket.join(`channel:${channelId}`);
            console.log(`📡 Socket ${socket.id} joined channel room: ${channelId}`);
        });

        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel:${channelId}`);
            console.log(`📡 Socket ${socket.id} left channel room: ${channelId}`);
        });
    });

    // Initialize voice channel handler
    initializeVoiceHandler(io);

    return io;
};

