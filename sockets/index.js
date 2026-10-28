import { initializeVoiceHandler } from './voiceHandler.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import { savePresence, removePresence, getActivePresences } from '../services/presenceService.js';
import { pubClient } from './redisAdapter.js';
import { logActivity } from '../utils/auditLogger.js';

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
    // Store active chat partner per user (userId -> partnerId)
    const activeConversations = new Map();

    // ── Redis Ghost-Online Temizleyici ──────────────────────────────────────
    // Her 2 dakikada bir Redis'teki online_user_ids set'ini gerçek socket'larla
    // karşılaştırır. Aktif socket'ı olmayan kullanıcıları online set'inden siler.
    // Bu sayede sunucu restart, ağ kopuklukları veya disconnect event kayıplarından
    // kaynaklanan hayalet online durumları otomatik olarak temizlenir.
    const reconcileOnlineUsersWithRedis = async () => {
        if (!pubClient) return;
        try {
            const redisOnlineIds = await pubClient.smembers('online_user_ids');
            if (!redisOnlineIds || redisOnlineIds.length === 0) return;

            // Cluster genelinde tüm aktif socket'ları sorgula
            let allSockets = [];
            try {
                allSockets = await io.fetchSockets();
            } catch (err) {
                console.warn('[Reconcile] fetchSockets failed, skipping this cycle:', err.message);
                return;
            }

            // Gerçekten bağlı kullanıcı ID'lerini topla
            const trulyOnlineIds = new Set();
            for (const s of allSockets) {
                if (s.data && s.data.userId && s.data.showOnlineStatus !== false && !s.data.isGhost && !s.data.isBackground) {
                    trulyOnlineIds.add(String(s.data.userId));
                }
            }

            // Redis'te olup gerçekte bağlı olmayan (hayalet) kayıtları temizle
            const ghostIds = redisOnlineIds.filter(id => !trulyOnlineIds.has(String(id)));
            if (ghostIds.length > 0) {
                console.log(`[Reconcile] Cleaning ${ghostIds.length} ghost online user(s) from Redis:`, ghostIds);
                const pipeline = pubClient.pipeline();
                ghostIds.forEach(id => pipeline.srem('online_user_ids', id));
                await pipeline.exec();

                // Her ghost için offline bildirgesi yayınla
                for (const ghostId of ghostIds) {
                    io.emit('user_status_change', { userId: ghostId, status: 'offline', lastActive: new Date() });
                }

                // Güncellenmiş listeyi tüm clientlara yayınla
                const updatedList = await pubClient.smembers('online_user_ids');
                const hiddenMembers = await pubClient.smembers('hidden_user_ids');
                const hiddenSet = new Set((hiddenMembers || []).map(String));
                const cleanList = (updatedList || []).filter(id => !hiddenSet.has(String(id)));
                io.emit('getOnlineUsers', cleanList);
            }
        } catch (err) {
            console.error('[Reconcile] Error during Redis online_user_ids reconciliation:', err);
        }
    };
    // 2 dakikada bir çalıştır (sunucu başladıktan 30 saniye sonra ilk kez)
    setTimeout(() => {
        reconcileOnlineUsersWithRedis();
        setInterval(reconcileOnlineUsersWithRedis, 2 * 60 * 1000);
    }, 30000);
    // ───────────────────────────────────────────────────────────────────────


    io.isUserActiveInChatWith = async (userId, partnerId) => {
        if (!userId || !partnerId) return false;
        const sUser = String(userId);
        const sPartner = String(partnerId);
        const currentPartner = activeConversations.get(sUser);
        if (currentPartner && String(currentPartner) === sPartner) {
            return true;
        }
        if (pubClient) {
            try {
                const redisPartner = await pubClient.get(`active_chat:${sUser}`);
                if (redisPartner && String(redisPartner) === sPartner) {
                    activeConversations.set(sUser, sPartner);
                    return true;
                }
            } catch (e) {}
        }
        return false;
    };

    const getOnlineUserIds = async () => {
        let redisMembers = [];
        let hiddenMembers = [];
        if (pubClient) {
            try {
                const [rOnline, rHidden] = await Promise.all([
                    pubClient.smembers('online_user_ids'),
                    pubClient.smembers('hidden_user_ids')
                ]);
                if (Array.isArray(rOnline)) redisMembers = rOnline;
                if (Array.isArray(rHidden)) hiddenMembers = rHidden;
            } catch (err) {
                console.error('⚠️ Error getting online/hidden users from Redis:', err);
            }
        }
        const hiddenSet = new Set(hiddenMembers.map(String));
        const onlineSet = new Set();

        redisMembers.forEach(id => {
            const sId = String(id);
            if (!hiddenSet.has(sId)) {
                onlineSet.add(sId);
            }
        });

        for (const [userId, sockets] of activeUsersMap.entries()) {
            const sId = String(userId);
            if (sockets && sockets.size > 0 && !hiddenSet.has(sId)) {
                onlineSet.add(sId);
            }
        }

        return Array.from(onlineSet);
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
            // ----------------------------------------------------------------
            socket.data.userId = strUserId;
            socket.data.isGhost = !!isGhost;
            socket.data.isBackground = false;
            socket.isGhost = !!isGhost;
            socket._sessionStartTime = Date.now();

            userSockets.set(socket.id, strUserId);
            socket.join(strUserId);

            let userDoc = null;
            try {
                if (isGhost) {
                    userDoc = await User.findById(strUserId);
                } else {
                    userDoc = await User.findByIdAndUpdate(strUserId, { lastActive: new Date() }, { new: true });
                }
                if (userDoc) {
                    socket.user = userDoc;
                }
            } catch (err) {
                console.error('Error fetching user on join:', err);
            }

            const isGhostMode = !!isGhost;
            if (isGhostMode) {
                // Ghost Mode: strictly observer only, never broadcast presence or alter online lists
                socket.data.showOnlineStatus = false;
                console.log(`👻 Ghost Mode active: observer joined as ${strUserId} without affecting user presence or lastActive.`);
            } else {
                const isUserHidden = userDoc?.settings?.privacy?.showOnlineStatus === false;
                socket.data.showOnlineStatus = !isUserHidden;

                if (isUserHidden) {
                    activeUsersMap.delete(strUserId);
                    if (pubClient) {
                        try {
                            await pubClient.sadd('hidden_user_ids', strUserId);
                            await pubClient.srem('online_user_ids', strUserId);
                        } catch (err) {}
                    }
                    io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive: new Date() });
                    await broadcastGlobalOnlineUsers();
                    console.log(`👤 User ${strUserId} joined in hidden/invisible mode`);
                } else {
                    if (pubClient) {
                        try {
                            await pubClient.srem('hidden_user_ids', strUserId);
                            await pubClient.sadd('online_user_ids', strUserId);
                        } catch (err) {
                            console.error('⚠️ Error adding user to Redis online set:', err);
                        }
                    }
                    if (!activeUsersMap.has(strUserId)) {
                        activeUsersMap.set(strUserId, new Set());
                    }
                    activeUsersMap.get(strUserId).add(socket.id);

                    io.emit('user_status_change', { userId: strUserId, status: 'online' });
                    await broadcastGlobalOnlineUsers();
                    console.log(`👤 User ${strUserId} joined visible (active sockets: ${activeUsersMap.get(strUserId).size})`);
                }
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

        // Sync user application version and platform for Admin Dashboard tracking
        socket.on('sync_app_version', async (payload) => {
            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (!userId || !payload) return;
            const { appVersion, versionCode, platform } = payload;
            try {
                const update = {
                    lastAppSyncAt: new Date(),
                    appPlatform: platform || 'web'
                };
                if (appVersion) update.appVersion = String(appVersion).trim();
                if (typeof versionCode === 'number') update.versionCode = versionCode;
                await User.findByIdAndUpdate(userId, { $set: update });
            } catch (err) {
                console.warn('sync_app_version socket error:', err.message);
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
                        await pubClient.sadd('hidden_user_ids', strUserId);
                        await pubClient.srem('online_user_ids', strUserId);
                    } catch (err) {}
                }
                io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive: new Date() });
                await broadcastGlobalOnlineUsers();
                console.log(`👤 User ${strUserId} hid online status (invisible mode)`);
            } else {
                if (pubClient) {
                    try {
                        await pubClient.srem('hidden_user_ids', strUserId);
                        await pubClient.sadd('online_user_ids', strUserId);
                    } catch (err) {}
                }
                if (!activeUsersMap.has(strUserId)) {
                    activeUsersMap.set(strUserId, new Set());
                }
                activeUsersMap.get(strUserId).add(socket.id);
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

        // Mobile / Web background state notification
        socket.on('app_background', async () => {
            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (!userId) return;
            const strUserId = String(userId);
            console.log(`📱 [Presence] User ${strUserId} entered background (no voice active) — marking offline`);

            socket.data.isBackground = true;

            // Check if user has ANY OTHER active foreground socket on the cluster
            let hasOtherForegroundSocket = false;
            try {
                const allSockets = await io.fetchSockets();
                hasOtherForegroundSocket = allSockets.some(s => 
                    s.id !== socket.id &&
                    s.data && 
                    String(s.data.userId) === strUserId && 
                    s.data.showOnlineStatus !== false && 
                    !s.data.isGhost && 
                    !s.data.isBackground
                );
            } catch (e) {
                const userSocketsSet = activeUsersMap.get(strUserId);
                hasOtherForegroundSocket = !!(userSocketsSet && userSocketsSet.size > 1);
            }

            if (!hasOtherForegroundSocket) {
                activeUsersMap.delete(strUserId);
                if (pubClient) {
                    try {
                        await pubClient.srem('online_user_ids', strUserId);
                    } catch (e) {}
                }
                const lastActive = new Date();
                try {
                    await User.findByIdAndUpdate(strUserId, { lastActive });
                } catch (e) {}

                io.emit('user_status_change', { userId: strUserId, status: 'offline', lastActive });
                await broadcastGlobalOnlineUsers();
            }
        });

        // Mobile / Web foreground state notification
        socket.on('app_foreground', async () => {
            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (!userId) return;
            const strUserId = String(userId);
            console.log(`📱 [Presence] User ${strUserId} returned to foreground — restoring online`);

            socket.data.isBackground = false;

            if (socket.data.showOnlineStatus !== false && !socket.data.isGhost) {
                if (!activeUsersMap.has(strUserId)) {
                    activeUsersMap.set(strUserId, new Set());
                }
                activeUsersMap.get(strUserId).add(socket.id);
                if (pubClient) {
                    try {
                        await pubClient.srem('hidden_user_ids', strUserId);
                        await pubClient.sadd('online_user_ids', strUserId);
                    } catch (e) {}
                }
                io.emit('user_status_change', { userId: strUserId, status: 'online' });
                await broadcastGlobalOnlineUsers();
            }
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
            activeConversations.delete(strUserId);
            socket.data.userId = null;
            socket.leave(strUserId);

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

            const sessionDurationSec = socket._sessionStartTime ? Math.round((Date.now() - socket._sessionStartTime) / 1000) : 0;
            logActivity({
                user: strUserId,
                username: socket.user?.username || '',
                action: 'LOGOUT',
                category: 'auth',
                severity: 'info',
                socket,
                details: { method: 'user_action', durationSec: sessionDurationSec }
            });
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
                if (socket.isGhost || socket.data?.isGhost) {
                    console.log(`👻 Ghost observer disconnected: ${socket.id} for user ${strUserId}. Skipping presence mutations.`);
                    return;
                }
                console.log(`👋 Socket disconnected: ${socket.id} for user ${strUserId}`);

                // Record portal leave if socket was in a portal room
                if (socket._currentPortalId && socket._portalJoinTime) {
                    const staySec = Math.round((Date.now() - socket._portalJoinTime) / 1000);
                    logActivity({
                        user: strUserId,
                        username: socket.user?.username || '',
                        action: 'PORTAL_LEAVE',
                        category: 'portal',
                        portal: socket._currentPortalId,
                        details: {
                            portalId: socket._currentPortalId,
                            durationSec: staySec,
                            reason: 'SOCKET_DISCONNECT'
                        }
                    });
                    socket._currentPortalId = null;
                    socket._portalJoinTime = null;
                }

                // Record channel leave if socket was in a channel room
                if (socket._currentChannelId && socket._channelJoinTime) {
                    const staySec = Math.round((Date.now() - socket._channelJoinTime) / 1000);
                    logActivity({
                        user: strUserId,
                        username: socket.user?.username || '',
                        action: 'CHANNEL_LEAVE',
                        category: 'portal',
                        portal: socket._currentPortalId,
                        channel: socket._currentChannelId,
                        details: {
                            portalId: socket._currentPortalId,
                            channelId: socket._currentChannelId,
                            durationSec: staySec,
                            reason: 'SOCKET_DISCONNECT'
                        }
                    });
                    socket._currentChannelId = null;
                    socket._channelJoinTime = null;
                }

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
                            isStillOnlineAnywhere = allSockets.some(s => s.data && String(s.data.userId) === strUserId && s.data.showOnlineStatus !== false && !s.data.isGhost && !s.data.isBackground);
                        } catch (err) {
                            const latestSet = activeUsersMap.get(strUserId);
                            isStillOnlineAnywhere = !!(latestSet && latestSet.size > 0);
                        }

                        if (!isStillOnlineAnywhere) {
                            activeUsersMap.delete(strUserId);
                            activeConversations.delete(strUserId);
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
            if (socket.isGhost || socket.data?.isGhost) {return;} // Ghost modunda ise presence kaydı oluşturma!

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
            if (socket.isGhost || socket.data?.isGhost) return; // Ghost observer never emits typing
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

        // Direct Message (DM) Mark As Read
        socket.on('mark_messages_read', async ({ senderId }) => {
            const currentUserId = socket.data?.userId || userSockets.get(socket.id);
            if (!currentUserId || !senderId || socket.isGhost || socket.data?.isGhost) return;
            try {
                const strSenderId = String(senderId);
                const strCurrentUserId = String(currentUserId);

                await Message.updateMany(
                    { sender: strSenderId, recipient: strCurrentUserId, read: false },
                    { read: true }
                );
                await Notification.updateMany(
                    { sender: strSenderId, recipient: strCurrentUserId, type: 'message', read: false },
                    { read: true }
                );

                io.to(strSenderId).emit('messagesRead', {
                    readerId: strCurrentUserId
                });
            } catch (err) {
                console.error('Socket mark_messages_read error:', err);
            }
        });

        // Direct Message (DM) Enter / Leave Active Conversation
        socket.on('enter_conversation', ({ partnerId }) => {
            const currentUserId = socket.data?.userId || userSockets.get(socket.id) || socket.user?._id;
            const targetPartnerId = partnerId && typeof partnerId === 'object' ? (partnerId._id || partnerId.id) : partnerId;
            if (currentUserId && targetPartnerId) {
                const sUser = String(currentUserId);
                const sPartner = String(targetPartnerId);
                activeConversations.set(sUser, sPartner);
                if (pubClient) {
                    try {
                        pubClient.set(`active_chat:${sUser}`, sPartner, 'EX', 86400);
                    } catch (e) {}
                }
            }
        });

        socket.on('leave_conversation', () => {
            const currentUserId = socket.data?.userId || userSockets.get(socket.id) || socket.user?._id;
            if (currentUserId) {
                const sUser = String(currentUserId);
                activeConversations.delete(sUser);
                if (pubClient) {
                    try {
                        pubClient.del(`active_chat:${sUser}`);
                    } catch (e) {}
                }
            }
        });

        // Portal Feed Typing Indicator
        socket.on('portal_typing', ({ portalId, isTyping }) => {
            if (socket.isGhost || socket.data?.isGhost) return; // Ghost observer never emits typing
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

        // --- ROOM MANAGEMENT (For Feed Isolation & Audit Logs) ---
        
        // Portal Rooms
        socket.on('join_portal', (portalId) => {
            if (!portalId) return;
            const sPortalId = String(portalId);
            socket.join(`portal:${sPortalId}`);
            console.log(`📡 Socket ${socket.id} joined portal room: ${sPortalId}`);

            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (userId) {
                const now = Date.now();
                // Check if socket was already in a different portal, calculate and log stay duration
                if (socket._currentPortalId && socket._portalJoinTime && socket._currentPortalId !== sPortalId) {
                    const staySec = Math.round((now - socket._portalJoinTime) / 1000);
                    logActivity({
                        user: userId,
                        username: socket.user?.username || '',
                        action: 'PORTAL_LEAVE',
                        category: 'portal',
                        portal: socket._currentPortalId,
                        details: {
                            portalId: socket._currentPortalId,
                            durationSec: staySec,
                            reason: 'SWITCHED_PORTAL'
                        }
                    });
                }

                socket._currentPortalId = sPortalId;
                socket._portalJoinTime = now;

                logActivity({
                    user: userId,
                    username: socket.user?.username || '',
                    action: 'PORTAL_VIEW',
                    category: 'portal',
                    portal: sPortalId,
                    details: {
                        portalId: sPortalId,
                        action: 'PORTAL_ENTER'
                    }
                });
            }

            // Send existing typers in this portal to the newly joined socket
            const portalTypers = activeTypingPortals.get(sPortalId);
            if (portalTypers) {
                for (const [tUserId, details] of portalTypers.entries()) {
                    socket.emit('portal_typing_update', {
                        portalId: sPortalId,
                        userId: tUserId,
                        username: details.username,
                        displayName: details.displayName,
                        avatar: details.avatar,
                        isTyping: true
                    });
                }
            }
            
            const room = io.sockets.adapter.rooms.get(`portal:${sPortalId}`);
            const onlineCount = room ? room.size : 0;
            io.to(`portal:${sPortalId}`).emit('portal_presence_update', { portalId: sPortalId, onlineCount });
        });

        socket.on('leave_portal', (portalId) => {
            if (!portalId) return;
            const sPortalId = String(portalId);
            socket.leave(`portal:${sPortalId}`);
            console.log(`📡 Socket ${socket.id} left portal room: ${sPortalId}`);

            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (userId && socket._currentPortalId === sPortalId && socket._portalJoinTime) {
                const staySec = Math.round((Date.now() - socket._portalJoinTime) / 1000);
                logActivity({
                    user: userId,
                    username: socket.user?.username || '',
                    action: 'PORTAL_LEAVE',
                    category: 'portal',
                    portal: sPortalId,
                    details: {
                        portalId: sPortalId,
                        durationSec: staySec,
                        reason: 'USER_LEFT_PORTAL'
                    }
                });
                socket._currentPortalId = null;
                socket._portalJoinTime = null;
            }
            
            const room = io.sockets.adapter.rooms.get(`portal:${sPortalId}`);
            const onlineCount = room ? room.size : 0;
            io.to(`portal:${sPortalId}`).emit('portal_presence_update', { portalId: sPortalId, onlineCount });
        });

        socket.on('get_portal_presence', (portalId) => {
            const room = io.sockets.adapter.rooms.get(`portal:${portalId}`);
            const onlineCount = room ? room.size : 0;
            socket.emit('portal_presence_update', { portalId, onlineCount });
        });

        // Channel Rooms
        socket.on('join_channel', (channelId) => {
            if (!channelId) return;
            const sChannelId = String(channelId);
            socket.join(`channel:${sChannelId}`);
            console.log(`📡 Socket ${socket.id} joined channel room: ${sChannelId}`);

            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (userId) {
                const now = Date.now();
                // If user was previously in another channel on this socket, record stay duration in that channel
                if (socket._currentChannelId && socket._channelJoinTime && socket._currentChannelId !== sChannelId) {
                    const staySec = Math.round((now - socket._channelJoinTime) / 1000);
                    logActivity({
                        user: userId,
                        username: socket.user?.username || '',
                        action: 'CHANNEL_LEAVE',
                        category: 'portal',
                        portal: socket._currentPortalId,
                        channel: socket._currentChannelId,
                        details: {
                            portalId: socket._currentPortalId,
                            channelId: socket._currentChannelId,
                            durationSec: staySec,
                            reason: 'SWITCHED_CHANNEL'
                        }
                    });
                }

                socket._currentChannelId = sChannelId;
                socket._channelJoinTime = now;

                logActivity({
                    user: userId,
                    username: socket.user?.username || '',
                    action: 'CHANNEL_VIEW',
                    category: 'portal',
                    portal: socket._currentPortalId,
                    channel: sChannelId,
                    details: {
                        portalId: socket._currentPortalId,
                        channelId: sChannelId
                    }
                });
            }
        });

        socket.on('leave_channel', (channelId) => {
            if (!channelId) return;
            const sChannelId = String(channelId);
            socket.leave(`channel:${sChannelId}`);
            console.log(`📡 Socket ${socket.id} left channel room: ${sChannelId}`);

            const userId = socket.data?.userId || userSockets.get(socket.id);
            if (userId && socket._currentChannelId === sChannelId && socket._channelJoinTime) {
                const staySec = Math.round((Date.now() - socket._channelJoinTime) / 1000);
                logActivity({
                    user: userId,
                    username: socket.user?.username || '',
                    action: 'CHANNEL_LEAVE',
                    category: 'portal',
                    portal: socket._currentPortalId,
                    channel: sChannelId,
                    details: {
                        portalId: socket._currentPortalId,
                        channelId: sChannelId,
                        durationSec: staySec,
                        reason: 'USER_LEFT_CHANNEL'
                    }
                });
                socket._currentChannelId = null;
                socket._channelJoinTime = null;
            }
        });
    });

    // Initialize voice channel handler
    initializeVoiceHandler(io);

    return io;
};

