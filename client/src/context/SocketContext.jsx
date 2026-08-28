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

    // Her zaman güncel userId'yi tutan ref.
    // connect handler [] bağımlılıkla mount'ta yaratıldığından
    // user'ı stale closure olarak yakalar. Ref bunu çözer.
    const userIdRef = useRef(null);
    useEffect(() => {
        userIdRef.current = user?._id ? String(user._id) : null;
    }, [user?._id]);

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
            transports: isNative ? ['websocket', 'polling'] : ['polling', 'websocket'],
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
            // userIdRef: stale closure olmadan güncel userId
            // Reconnect, uyku sonrası uyanma, Chrome açılışı — hepsinde join gönderilir
            const uid = userIdRef.current;
            if (uid) {
                const isGhost = !!localStorage.getItem('admin_backup_token');
                newSocket.emit('join', uid, isGhost);
                console.log(`[Socket] Connected & joined: ${uid}`);
            }
            newSocket.emit('get_online_users');
        });

        newSocket.on('getOnlineUsers', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('user_status_change', ({ userId, status }) => {
            if (!userId) return;
            const strId = String(userId);
            setOnlineUsers(prev => {
                const prevList = (prev || []).map(String);
                if (status === 'online') {
                    return prevList.includes(strId) ? prevList : [...prevList, strId];
                } else if (status === 'offline') {
                    return prevList.filter(id => id !== strId);
                }
                return prevList;
            });
        });

        newSocket.on('maintenance_toggle', ({ active }) => {
            if (active) {
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

        // Sekme tekrar görünür olduğunda (uyku, Chrome açılış, mobil geçiş)
        // join + online listesini tazele
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            const uid = userIdRef.current;
            if (newSocket.connected) {
                newSocket.emit('get_online_users');
                if (uid) {
                    const isGhost = !!localStorage.getItem('admin_backup_token');
                    newSocket.emit('join', uid, isGhost);
                    console.log('[Socket] Tab visible — re-joining');
                }
            } else {
                newSocket.connect();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.close();
        };
    }, []); // Only run on mount

    // 2. Auth tamamlanınca (user._id gelince) join gönder
    useEffect(() => {
        if (socket && connected && isAuthenticated && user?._id) {
            const isGhost = !!localStorage.getItem('admin_backup_token');
            socket.emit('join', user._id, isGhost);
            socket.emit('get_online_users');
            console.log(`[Socket] Auth ready — joined as ${user._id}`);
        }
    }, [socket, connected, isAuthenticated, user?._id]);

    const value = {
        socket,
        connected,
        onlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
