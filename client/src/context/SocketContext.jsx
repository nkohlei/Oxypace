import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        // Determine Socket URL
        const isNative = typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : (window.Capacitor && window.Capacitor.isNativePlatform());
        let socketUrl = (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app' : 'http://localhost:5000'));

        // Remove '/api' suffix if present, as Socket.io connects to root
        if (socketUrl.endsWith('/api')) {
            socketUrl = socketUrl.slice(0, -4);
        }
        if (socketUrl.endsWith('/')) {
            socketUrl = socketUrl.slice(0, -1);
        }

        const newSocket = io(socketUrl, {
            transports: ['polling', 'websocket'],
            upgrade: true,
            rememberUpgrade: true,
            forceNew: true,
            reconnectionAttempts: Infinity,
            timeout: 20000,
            withCredentials: true,
            secure: true,
        });

        newSocket.on('connect', () => {
            setConnected(true);
            if (isAuthenticated && user?._id) {
                const isGhost = !!localStorage.getItem('admin_backup_token');
                newSocket.emit('join', user._id, isGhost);
            }
        });

        newSocket.on('getOnlineUsers', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('maintenance_toggle', ({ active }) => {
            if (active) {
                const getCookie = (name) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop().split(';').shift();
                };
                const hasAccess = getCookie('admin_access') === 'true' || localStorage.getItem('admin_access') === 'true';
                if (!hasAccess) {
                    window.location.reload();
                }
            }
        });

        newSocket.on('user_banned', ({ reason, expiresAt }) => {
            let message = 'Erişiminiz Engellendi!\n\n';
            message += `Gerekçe: ${reason || 'Belirtilmedi'}\n`;
            if (expiresAt) {
                const date = new Date(expiresAt);
                message += `Bitiş Tarihi: ${date.toLocaleString()}`;
            } else {
                message += 'Bitiş Tarihi: Süresiz (Kalıcı)';
            }
            alert(message);
            
            // Oturumu temizle ve sayfayı yenile
            localStorage.removeItem('token');
            window.location.reload();
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [isAuthenticated, user]);

    const value = {
        socket,
        connected,
        onlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
