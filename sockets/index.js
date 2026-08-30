import { initializeVoiceHandler } from './voiceHandler.js';
import User from '../models/User.js';
import { savePresence, removePresence, getActivePresences } from '../services/presenceService.js';
import { pubClient } from './redisAdapter.js';

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
    // Map of userId -> Set of socket.ids
    const activeUsersMap = new Map();
    // Map of socket.id -> userId
    const userSockets = new Map();
    // Store active typing states (recipientId -> Set of senderIds)
    const activeTypingDMs = new Map();
    // Store active typing states (portalId -> Map of userId -> userDetails)
    const activeTypingPortals = new Map();
    // Global map of disconnect grace timers (userId -> setTimeout)
    const disconnectTimers = new Map();

    const getOnlineUserIds = async () => {
        const localSet = new Set(activeUsersMap.keys());
        if (pubClient) {
            try {
                const redisMembers = await pubClient.smembers('online_user_ids');
                if (Array.isArray(redisMembers)) {
                    redisMembers.forEach(id => localSet.add(String(id)));
                }
            } catch (err) {
                console.error('⚠️ Error getting online users from Redis:', err);
            }
        }
        return Array.from(localSet);
    };

    const broadcastGlobalOnlineUsers = async () => {
        const list = await getOnlineUserIds();
        io.emit('getOnlineUsers', list);
    };

    io.on('connection', async (socket) => {
        console.log(`✅ Socket connected: ${socket.id}`);

        // Initial emit of online users to the freshly connected socket immediately
        const initialList = await getOnlineUserIds();
        socket.emit('getOnlineUsers', initialList);

        // User joins with their ID
        socket.on('join', async (userId, isGhost) => {
            if (!userId) return;
            const strUserId = String(userId);

            // Any pending disconnect timer for this user is cancelled immediately
            if (disconnectTimers.has(strUserId)) {
                clearTimeout(disconnectTimers.get(strUserId));
                disconnectTimers.delete(strUserId);
            }

            // --- Hayalet Temizliği: Aynı socket daha önce farklı bir userId ile kayıtlıysa temizle ---
            const prevUserId = userSockets.get(socket.id);
            if (prevUserId && prevUserId !== strUserId) {
                console.log(`🔄 Socket ${socket.id} re-registering: ${prevUserId} → ${strUserId}. Cleaning up previous entry.`);
                const prevSet = activeUsersMap.get(prevUserId);
                if (prevSet) {
                    prevSet.delete(socket.id);
                    if (prevSet.size === 0) {
                        activeUsersMap.delete(prevUserId);
                        if (pubClient) {
                            try {
                                await pubClient.srem('online_user_ids', prevUserId);
                            } catch (err) {}
                        }
                        io.emit('user_status_change', { userId: prevUserId, status: 'offline', lastActive: new Date() });
                        try {
                            await User.findByIdAndUpdate(prevUserId, { lastActive: new Date() });
                        } catch (err) {}
                    } else {
                        await broadcastGlobalOnlineUsers();
                    }
                }
            }
            // -----------------------------------------------------------------------------------------

            socket.data.userId = strUserId;
            socket.data.isGhost = !!isGhost;

            userSockets.set(socket.id, strUserId);
            socket.join(strUserId);

            let userDoc = null;
            try {
                userDoc = await User.findByIdAndUpdate(strUserId, { lastActive: new Date() }, { new: true });
                if (userDoc) {
                    socket.user = userDoc;
                }
            } catch (err) {
                console.error('Error updating lastActive on join:', err);
            }

            const isGhostMode = !!isGhost;
            const showOnline = !isGhostMode && userDoc?.settings?.privacy?.showOnlineStatus !== false;
            socket.data.showOnlineStatus = showOnline;

            if (showOnline) {
                if (!activeUsersMap.has(strUserId)) {
                    activeUsersMap.set(strUserId, new Set());
                }
                activeUsersMap.get(strUserId).add(socket.id);

                if (pubClient) {
                    try {
                        await pubClient.sadd('online_user_ids', strUserId);
                    } catch (err) {
                        console.error('⚠️ Error adding user to Redis online set:', err);
                    }
                }

                await broadcastGlobalOnlineUsers();
                io.emit('user_status_change', { userId: strUserId, status: 'online' });
                console.log(`👤 User ${strUserId} joined visible (active sockets: ${activeUsersMap.get(strUserId).size})`);
            } else {
                activeUsersMap.delete(strUserId);
                if (pubClient) {
                    try {
                        await pubClient.srem('online_user_ids', strUserId);
                    } catch (err) {}
                }
                await broadcastGlobalOnlineUsers();
                io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive: new Date() });
                console.log(`👤 User ${strUserId} joined in hidden/invisible mode`);
            }

            const currentOnlineList = await getOnlineUserIds();
            socket.emit('getOnlineUsers', currentOnlineList);

            // Send existing DM typers typing to this user
            const dmTypers = activeTypingDMs.get(strUserId);
            if (dmTypers) {
                for (const senderId of dmTypers) {
                    socket.emit('dm_typing_update', { senderId, isTyping: true });
                }
            }
        });

        // Toggle showOnlineStatus privacy setting live
        socket.on('update_show_online_status', async ({ showOnlineStatus }) => {
            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (!userId) return;
            const strUserId = String(userId);
            const shouldShow = !!showOnlineStatus;
            socket.data.showOnlineStatus = shouldShow;

            try {
                await User.findByIdAndUpdate(strUserId, { 'settings.privacy.showOnlineStatus': shouldShow });
            } catch (err) {
                console.error('Error updating showOnlineStatus in DB:', err);
            }

            if (!shouldShow) {
                activeUsersMap.delete(strUserId);
                if (pubClient) {
                    try {
                        await pubClient.srem('online_user_ids', strUserId);
                    } catch (err) {}
                }
                io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive: new Date() });
                await broadcastGlobalOnlineUsers();
                console.log(`👤 User ${strUserId} hid online status (invisible mode)`);
            } else {
                if (!activeUsersMap.has(strUserId)) {
                    activeUsersMap.set(strUserId, new Set());
                }
                activeUsersMap.get(strUserId).add(socket.id);
                if (pubClient) {
                    try {
                        await pubClient.sadd('online_user_ids', strUserId);
                    } catch (err) {}
                }
                io.emit('user_status_change', { userId: strUserId, status: 'online' });
                await broadcastGlobalOnlineUsers();
                console.log(`👤 User ${strUserId} unhid online status (visible mode)`);
            }
        });

        // Request online users list on demand
        socket.on('get_online_users', async () => {
            const list = await getOnlineUserIds();
            socket.emit('getOnlineUsers', list);
        });

        // Immediate logout event to clear presence instantly
        socket.on('logout', async () => {
            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (!userId) return;
            const strUserId = String(userId);
            console.log(`👋 Immediate logout received for user ${strUserId}`);

            if (disconnectTimers.has(strUserId)) {
                clearTimeout(disconnectTimers.get(strUserId));
                disconnectTimers.delete(strUserId);
            }

            activeUsersMap.delete(strUserId);
            userSockets.delete(socket.id);

            if (pubClient) {
                try {
                    await pubClient.srem('online_user_ids', strUserId);
                } catch (err) {}
            }

            const lastActive = new Date();
            try {
                await User.findByIdAndUpdate(strUserId, { lastActive });
            } catch (err) {}

            io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive });
            await broadcastGlobalOnlineUsers();
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
            const userId = socket.data?.userId || userSockets.get(socket.id);
            userSockets.delete(socket.id);

            if (userId) {
                const strUserId = String(userId);
                console.log(`👋 Socket disconnected: ${socket.id} for user ${strUserId}`);

                const userSocketsSet = activeUsersMap.get(strUserId);
                if (userSocketsSet) {
                    userSocketsSet.delete(socket.id);
                }

                const hasOtherSockets = userSocketsSet && userSocketsSet.size > 0;

                if (!hasOtherSockets) {
                    // Fast 1.5-second debounce period before checking cluster-wide sockets
                    if (disconnectTimers.has(strUserId)) {
                        clearTimeout(disconnectTimers.get(strUserId));
                    }

                    const timer = setTimeout(async () => {
                        disconnectTimers.delete(strUserId);
                        
                        // Query ALL PM2 cluster workers via Redis adapter to confirm if user has ANY live socket anywhere
                        let isStillOnlineAnywhere = false;
                        try {
                            const allSockets = await io.fetchSockets();
                            isStillOnlineAnywhere = allSockets.some(s => s.data && String(s.data.userId) === strUserId && s.data.showOnlineStatus !== false);
                        } catch (err) {
                            const latestSet = activeUsersMap.get(strUserId);
                            isStillOnlineAnywhere = !!(latestSet && latestSet.size > 0);
                        }

                        if (!isStillOnlineAnywhere) {
                            activeUsersMap.delete(strUserId);
                            console.log(`👋 User ${strUserId} is confirmed fully offline across entire cluster`);

                            // Clean up typing indicators in DMs for this user
                            for (const [recipientId, senderSet] of activeTypingDMs.entries()) {
                                if (senderSet.has(strUserId)) {
                                    senderSet.delete(strUserId);
                                    io.to(recipientId).emit('dm_typing_update', { senderId: strUserId, isTyping: false });
                                    if (senderSet.size === 0) {
                                        activeTypingDMs.delete(recipientId);
                                    }
                                }
                            }

                            // Clean up typing indicators in portals for this user
                            for (const [portalId, typersMap] of activeTypingPortals.entries()) {
                                if (typersMap.has(strUserId)) {
                                    typersMap.delete(strUserId);
                                    io.to(`portal:${portalId}`).emit('portal_typing_update', {
                                        portalId,
                                        userId: strUserId,
                                        isTyping: false
                                    });
                                    if (typersMap.size === 0) {
                                        activeTypingPortals.delete(portalId);
                                    }
                                }
                            }

                            // Remove presence record and notify admins
                            try {
                                await removePresence(strUserId);
                                const adminPresenceRoom = io.sockets.adapter.rooms.get('admin_presence');
                                if (adminPresenceRoom && adminPresenceRoom.size > 0) {
                                    const activeUsers = await getActivePresences();
                                    io.to('admin_presence').emit('admin_presence_update', activeUsers);
                                }
                            } catch (err) {
                                console.error('Error removing presence on disconnect:', err);
                            }

                            if (pubClient) {
                                try {
                                    await pubClient.srem('online_user_ids', strUserId);
                                } catch (err) {}
                            }

                            const lastActive = new Date();
                            try {
                                await User.findByIdAndUpdate(strUserId, { lastActive });
                            } catch (err) {
                                console.error('Error updating status on disconnect:', err);
                            }

                            await broadcastGlobalOnlineUsers();
                            io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive });
                        } else {
                            console.log(`🛡️ Preserved online status for ${strUserId}: active socket found on another cluster worker`);
                        }
                    }, 1500);

                    disconnectTimers.set(strUserId, timer);
                } else {
                    await broadcastGlobalOnlineUsers();
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

