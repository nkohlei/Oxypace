import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

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
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    const navigateRef = useRef(navigate);
    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    // 1. Establish Socket Connection ONCE on mount
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        let socketUrl = (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://api.oxypace.com.tr' : 'http://localhost:5000'));

        if (socketUrl.endsWith('/api')) {
            socketUrl = socketUrl.slice(0, -4);
        }
        if (socketUrl.endsWith('/')) {
            socketUrl = socketUrl.slice(0, -1);
        }

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            forceNew: false, 
            multiplex: true, 
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: isNative ? 5 : Infinity,
            timeout: isNative ? 10000 : 20000,
            withCredentials: true,
            secure: true,
        });

        newSocket.on('connect', () => {
            setConnected(true);
            newSocket.emit('get_online_users');
            // Re-join if user is already authenticated
            if (user?._id) {
                newSocket.emit('join', String(user._id));
                console.log(`[Socket] Connected & joined user: ${user._id}`);
            }
        });

        newSocket.on('getOnlineUsers', (users) => {
            if (Array.isArray(users)) {
                setOnlineUsers(users.map(u => String(u._id || u.id || u)));
            } else {
                setOnlineUsers([]);
            }
        });

        newSocket.on('maintenance_toggle', ({ active }) => {
            if (active) {
                // Read fresh admin status from storage or local context safely
                window.location.reload();
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
            
            localStorage.removeItem('token');
            window.location.reload();
        });

        newSocket.on('tourist_admin_revoked', ({ message }) => {
            useGlobalStore.setState({ isTouristAdmin: false });
            updateUser({ isTouristAdmin: false });

            if (window.location.pathname.startsWith('/admin')) {
                navigateRef.current('/');
            }
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []); // Only run on mount

    // 2. Handle User Join / State Changes on existing socket connection
    useEffect(() => {
        if (socket && connected && isAuthenticated && user?._id) {
            socket.emit('join', String(user._id));
            socket.emit('get_online_users');
            console.log(`[Socket] Registered authentication for user ${user._id}`);
        }
    }, [socket, connected, isAuthenticated, user?._id]);

    const value = {
        socket,
        connected,
        onlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
