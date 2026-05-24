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
    // Store user socket connections
    const userSockets = new Map();

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
                userSockets.set(userId, socket.id);
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
                io.emit('getOnlineUsers', Array.from(userSockets.keys()));
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            if (socket.isGhost) {
                console.log(`👋 Ghost connection ${socket.id} disconnected`);
                return;
            }
            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`👋 User ${userId} disconnected`);

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
                    try {
                        await User.findByIdAndUpdate(userId, { lastActive: new Date() });
                    } catch (err) {
                        console.error('Error updating status on disconnect:', err);
                    }

                    // Broadcast online users
                    io.emit('getOnlineUsers', Array.from(userSockets.keys()));
                    break;
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

