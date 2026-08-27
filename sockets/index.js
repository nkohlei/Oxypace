import { initializeVoiceHandler } from './voiceHandler.js';
import User from '../models/User.js';
import { savePresence, removePresence, getActivePresences } from '../services/presenceService.js';

let presenceInterval = null;

// Aktif admin izleme odasındaki yöneticilere 5 saniyede bir güncelleme yayınlayan döngü
const startPresenceBroadcast = (io) => {
    if (presenceInterval) {return;}

    presenceInterval = setInterval(async () => {
        try {
            const adminPresenceRoom = io.sockets.adapter.rooms.get('admin_presence');
            if (adminPresenceRoom && adminPresenceRoom.size > 0) {
                const activeUsers = await getActivePresences();
                io.to('admin_presence').emit('admin_presence_update', activeUsers);
            } else {
                // Odada admin yoksa kaynak tüketimini önlemek için döngüyü durdur
                clearInterval(presenceInterval);
                presenceInterval = null;
            }
        } catch (err) {
            console.error('Error broadcasting admin presence:', err);
        }
    }, 5000);
};

export const initializeSocket = (io) => {
    // Store user socket connections (socket.id -> userId)
    const userSockets = new Map();

    // Store active typing states (recipientId -> Set of senderIds)
    const activeTypingDMs = new Map();

    // Store active typing states (portalId -> Map of userId -> userDetails)
    const activeTypingPortals = new Map();

    const getOnlineUsersList = () => {
        return Array.from(new Set(userSockets.values()));
    };

    io.on('connection', (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // User joins with their ID
        socket.on('join', async (userId, isGhost) => {
            socket.isGhost = !!isGhost;

            // Kullanıcı profil ve gizlilik bilgilerini çekelim
            try {
                const user = await User.findById(userId).select('username profile isAdmin settings');
                if (user) {
                    socket.user = user;
                    // Eğer çevrimiçi durumu göster ayarı kapatılmışsa ghost olarak işaretle
                    if (user.settings?.privacy?.showOnlineStatus === false) {
                        socket.isGhost = true;
                    }
                }
            } catch (err) {
                console.error('Error fetching user on socket join:', err);
            }

            if (!socket.isGhost) {
                userSockets.set(socket.id, String(userId));
            }
            socket.join(userId);
            console.log(`👤 User ${userId} joined${socket.isGhost ? ' (Ghost/Hidden)' : ''}`);

            try {
                if (!socket.isGhost) {
                    await User.findByIdAndUpdate(userId, { lastActive: new Date() });
                }
            } catch (err) {
                console.error('Error updating lastActive on join:', err);
            }

            if (!socket.isGhost) {
                io.emit('getOnlineUsers', getOnlineUsersList());
                io.emit('user_status_change', { userId, status: 'online' });

                // Send existing DM typers typing to this user
                const dmTypers = activeTypingDMs.get(userId);
                if (dmTypers) {
                    for (const senderId of dmTypers) {
                        socket.emit('dm_typing_update', { senderId, isTyping: true });
                    }
                }
            } else {
                // If ghost/hidden, send online users list ONLY to this socket
                socket.emit('getOnlineUsers', getOnlineUsersList());
            }
        });

        // Handle disconnecting to capture rooms before they are cleared
        socket.on('disconnecting', () => {
            for (const roomName of socket.rooms) {
                if (roomName.startsWith('portal:')) {
                    const portalId = roomName.split(':')[1];
                    const room = io.sockets.adapter.rooms.get(roomName);
                    const onlineCount = room ? Math.max(0, room.size - 1) : 0;
                    socket.to(roomName).emit('portal_presence_update', { portalId, onlineCount });
                }
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            if (socket.isGhost) {
                console.log(`👋 Ghost connection ${socket.id} disconnected`);
                return;
            }
            
            const userId = userSockets.get(socket.id);
            if (userId) {
                userSockets.delete(socket.id);
                console.log(`👋 Socket disconnected: ${socket.id} for user ${userId}`);

                const isStillOnline = Array.from(userSockets.values()).includes(userId);
                if (!isStillOnline) {
                    console.log(`👋 User ${userId} is now fully offline`);

                    // Clean up typing indicators in DMs for this user
                    for (const [recipientId, senderSet] of activeTypingDMs.entries()) {
                        if (senderSet.has(userId)) {
                            senderSet.delete(userId);
                            io.to(recipientId).emit('dm_typing_update', { senderId: userId, isTyping: false });
                            if (senderSet.size === 0) {
                                activeTypingDMs.delete(recipientId);
                            }
                        }
                    }

                    // Clean up typing indicators in portals for this user
                    for (const [portalId, typersMap] of activeTypingPortals.entries()) {
                        if (typersMap.has(userId)) {
                            typersMap.delete(userId);
                            io.to(`portal:${portalId}`).emit('portal_typing_update', {
                                portalId,
                                userId,
                                isTyping: false
                            });
                            if (typersMap.size === 0) {
                                activeTypingPortals.delete(portalId);
                            }
                        }
                    }

                    // Presence kaydını anında bellekten/Redis'ten kaldır ve adminleri güncelle
                    try {
                        await removePresence(userId);
                        const adminPresenceRoom = io.sockets.adapter.rooms.get('admin_presence');
                        if (adminPresenceRoom && adminPresenceRoom.size > 0) {
                            const activeUsers = await getActivePresences();
                            io.to('admin_presence').emit('admin_presence_update', activeUsers);
                        }
                    } catch (err) {
                        console.error('Error removing presence on disconnect:', err);
                    }

                    // Update the user's lastActive time in the database
                    const lastActive = new Date();
                    try {
                        await User.findByIdAndUpdate(userId, { lastActive });
                    } catch (err) {
                        console.error('Error updating status on disconnect:', err);
                    }

                    // Broadcast online users and status change
                    io.emit('getOnlineUsers', getOnlineUsersList());
                    io.emit('user_status_change', { userId, status: 'offline', lastActive });
                }
            }
        });

        // --- PRESENCE & REAL-TIME ACTIVITY ---

        socket.on('presence_update', async ({ path }) => {
            const user = socket.user;
            if (!user) {return;}
            if (socket.isGhost) {return;} // Ghost modunda ise presence kaydı oluşturma!

            try {
                await savePresence(user._id, {
                    userId: user._id.toString(),
                    username: user.username,
                    displayName: user.profile?.displayName || user.username,
                    avatar: user.profile?.avatar || '',
                    path: path || '/',
                });
            } catch (err) {
                console.error('Error handling presence_update:', err);
            }
        });

        socket.on('join_admin_presence', async () => {
            // Sadece yetkili adminlerin izleme odasına girmesine izin ver
            if (socket.user && (socket.user.isAdmin || socket.user.username === 'oxypace')) {
                socket.join('admin_presence');
                console.log(`🛡️ Admin @${socket.user.username} joined admin_presence`);

                try {
                    // İlk katılımda listeyi bekletmeden anında gönder
                    const activeUsers = await getActivePresences();
                    socket.emit('admin_presence_update', activeUsers);
                    startPresenceBroadcast(io);
                } catch (err) {
                    console.error('Error sending initial presence update:', err);
                }
            }
        });

        socket.on('leave_admin_presence', () => {
            socket.leave('admin_presence');
            console.log(`🛡️ Socket ${socket.id} left admin_presence`);
        });

        // Direct Message (DM) Typing Indicator
        socket.on('dm_typing', ({ recipientId, isTyping }) => {
            const senderId = socket.user?._id?.toString();
            if (senderId) {
                if (isTyping) {
                    if (!activeTypingDMs.has(recipientId)) {
                        activeTypingDMs.set(recipientId, new Set());
                    }
                    activeTypingDMs.get(recipientId).add(senderId);
                } else {
                    const dmTypers = activeTypingDMs.get(recipientId);
                    if (dmTypers) {
                        dmTypers.delete(senderId);
                        if (dmTypers.size === 0) {
                            activeTypingDMs.delete(recipientId);
                        }
                    }
                }
                io.to(recipientId).emit('dm_typing_update', {
                    senderId,
                    isTyping
                });
            }
        });

        // Portal Feed Typing Indicator
        socket.on('portal_typing', ({ portalId, isTyping }) => {
            const userId = socket.user?._id?.toString();
            if (userId) {
                const displayName = socket.user.profile?.displayName || socket.user.username;
                const avatar = socket.user.profile?.avatar || '';
                const username = socket.user.username;

                if (isTyping) {
                    if (!activeTypingPortals.has(portalId)) {
                        activeTypingPortals.set(portalId, new Map());
                    }
                    activeTypingPortals.get(portalId).set(userId, { username, displayName, avatar });
                } else {
                    const portalTypers = activeTypingPortals.get(portalId);
                    if (portalTypers) {
                        portalTypers.delete(userId);
                        if (portalTypers.size === 0) {
                            activeTypingPortals.delete(portalId);
                        }
                    }
                }

                io.to(`portal:${portalId}`).emit('portal_typing_update', {
                    portalId,
                    userId,
                    username,
                    displayName,
                    avatar,
                    isTyping
                });
            }
        });

        // --- ROOM MANAGEMENT (For Feed Isolation) ---
        
        // Portal Rooms
        socket.on('join_portal', (portalId) => {
            socket.join(`portal:${portalId}`);
            console.log(`📡 Socket ${socket.id} joined portal room: ${portalId}`);

            // Send existing typers in this portal to the newly joined socket
            const portalTypers = activeTypingPortals.get(portalId);
            if (portalTypers) {
                for (const [userId, details] of portalTypers.entries()) {
                    socket.emit('portal_typing_update', {
                        portalId,
                        userId,
                        username: details.username,
                        displayName: details.displayName,
                        avatar: details.avatar,
                        isTyping: true
                    });
                }
            }
            
            const room = io.sockets.adapter.rooms.get(`portal:${portalId}`);
            const onlineCount = room ? room.size : 0;
            io.to(`portal:${portalId}`).emit('portal_presence_update', { portalId, onlineCount });
        });

        socket.on('leave_portal', (portalId) => {
            socket.leave(`portal:${portalId}`);
            console.log(`📡 Socket ${socket.id} left portal room: ${portalId}`);
            
            const room = io.sockets.adapter.rooms.get(`portal:${portalId}`);
            const onlineCount = room ? room.size : 0;
            io.to(`portal:${portalId}`).emit('portal_presence_update', { portalId, onlineCount });
        });

        socket.on('get_portal_presence', (portalId) => {
            const room = io.sockets.adapter.rooms.get(`portal:${portalId}`);
            const onlineCount = room ? room.size : 0;
            socket.emit('portal_presence_update', { portalId, onlineCount });
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

