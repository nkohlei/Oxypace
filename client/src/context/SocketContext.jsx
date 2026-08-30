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

    // userId'yi localStorage'da cache'le.
    // Chrome açılınca veya sekme restore edilince auth API cevabı gelmeden önce
    // socket bağlanabilir. userIdRef'i localStorage'daki önceki değerle başlatarak
    // join'i anında gönderiyoruz — auth API'yı beklemeye gerek kalmıyor.
    const cachedUserId = localStorage.getItem('_oxypace_uid');
    const userIdRef = useRef(cachedUserId || null);
    useEffect(() => {
        if (user?._id) {
            const uid = String(user._id);
            userIdRef.current = uid;
            localStorage.setItem('_oxypace_uid', uid); // Bir sonraki açılış için cache
        }
        // Logout'ta cache'i temizleme — socket olmadan gereksiz
    }, [user?._id]);

    const socketRef = useRef(null);

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
            reconnectionAttempts: Infinity,
            timeout: 20000,
            withCredentials: true,
            secure: true,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        const syncPresence = () => {
            const uid = userIdRef.current || (user?._id ? String(user._id) : null);
            if (newSocket.connected) {
                if (uid) {
                    const isGhost = !!localStorage.getItem('admin_backup_token');
                    newSocket.emit('join', uid, isGhost);
                    console.log(`[Socket] SyncPresence — joined: ${uid}`);
                }
                newSocket.emit('get_online_users');
            } else if (!newSocket.connected) {
                newSocket.connect();
            }
        };

        newSocket.on('connect', () => {
            setConnected(true);
            syncPresence();
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        newSocket.on('getOnlineUsers', (users) => {
            if (Array.isArray(users)) {
                setOnlineUsers(users.map(String));
            }
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
                message += `Bitiş Tarihi: ${new Date(expiresAt).toLocaleString('tr-TR')}`;
            } else {
                message += 'Süre: Süresiz';
            }
            alert(message);
            updateUser(null);
            navigateRef.current('/login');
        });

        newSocket.on('tourist_admin_revoked', ({ message }) => {
            useGlobalStore.setState({ isTouristAdmin: false });
            updateUser({ isTouristAdmin: false });
            if (window.location.pathname.startsWith('/admin')) {
                navigateRef.current('/');
            }
        });

        // Mobil ve masaüstü tarayıcı yaşam döngüsü event'leri
        // (Ekran kilidi açılınca, sekme öne gelince, ağ geri gelince, app arka plandan dönünce)
        const handleLifecycleEvent = () => {
            if (document.visibilityState === 'visible' || document.hasFocus()) {
                syncPresence();
            }
        };

        newSocket.io.on('reconnect', () => {
            setConnected(true);
            syncPresence();
        });

        document.addEventListener('visibilitychange', handleLifecycleEvent);
        window.addEventListener('focus', handleLifecycleEvent);
        window.addEventListener('pageshow', handleLifecycleEvent);
        window.addEventListener('online', handleLifecycleEvent);
        window.addEventListener('resume', handleLifecycleEvent);
        window.addEventListener('pointerdown', handleLifecycleEvent, { passive: true, once: false });

        // Mobilde bağlantının uyumaması için 25 saniyelik periyodik canlılık nabzı (heartbeat)
        const heartbeatInterval = setInterval(() => {
            syncPresence();
        }, 25000);

        return () => {
            clearInterval(heartbeatInterval);
            document.removeEventListener('visibilitychange', handleLifecycleEvent);
            window.removeEventListener('focus', handleLifecycleEvent);
            window.removeEventListener('pageshow', handleLifecycleEvent);
            window.removeEventListener('online', handleLifecycleEvent);
            window.removeEventListener('resume', handleLifecycleEvent);
            window.removeEventListener('pointerdown', handleLifecycleEvent);
            newSocket.close();
        };
    }, []); // Only run on mount

    // 2. Auth tamamlanınca veya kullanıcı değişince join gönder
    useEffect(() => {
        const s = socketRef.current || socket;
        const uid = user?._id ? String(user._id) : userIdRef.current;
        if (s && connected && uid) {
            const isGhost = !!localStorage.getItem('admin_backup_token');
            s.emit('join', uid, isGhost);
            s.emit('get_online_users');
            console.log(`[Socket] Auth ready — joined as ${uid}`);
        }
    }, [socket, connected, isAuthenticated, user?._id]);

    // Aktif oturum açmış kullanıcı varsa ve socket bağlıysa,
    // gizlilik ayarına (showOnlineStatus) göre kendi ID'sinin onlineUsers listesinde yer almasını sağla
    const effectiveOnlineUsers = (() => {
        const set = new Set((onlineUsers || []).map(String));
        const showMyOnline = user?.settings?.privacy?.showOnlineStatus !== false;
        if (user?._id && connected && showMyOnline) {
            set.add(String(user._id));
        } else if (user?._id && !showMyOnline) {
            set.delete(String(user._id));
        }
        return Array.from(set);
    })();

    const value = {
        socket,
        connected,
        onlineUsers: effectiveOnlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
