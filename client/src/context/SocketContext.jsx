import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

// ---
// NOT: Bu dosyayı düzeltirken iki temel sorun eliminate edildi:
//
// 1. STALE CLOSURE: socket useEffect'i [] ile mount'ta çalışıyor,
//    dolayısıyla connect handler içinde user her zaman null yakalıyor.
//    Çözüm: userIdRef (güncel user._id) + socketRef (güncel socket nesnesi)
//
// 2. REACT BATCHING RACE: socket React state iken, ikinci useEffect'in
//    [socket, connected, isAuthenticated, user._id] bağımlılığı çok karmaşık
//    bir timing gerektiriyor. Bunun yerine socket bir ref'te tutularak
//    user._id değiştiğinde doğrudan emit yapılıyor.
// ---

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
    const [onlineUsersReady, setOnlineUsersReady] = useState(false);

    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    const navigateRef = useRef(navigate);
    useEffect(() => { navigateRef.current = navigate; }, [navigate]);

    // Güncel userId'yi tutan ref — stale closure'ı önler
    const userIdRef = useRef(null);
    // Güncel socket nesnesini tutan ref — React state bağımlılığı race'ini önler
    const socketRef = useRef(null);

    // user._id her değiştiğinde ref'i güncelle
    useEffect(() => {
        userIdRef.current = user?._id ? String(user._id) : null;
    }, [user?._id]);

    // 1. Socket bağlantısını mount'ta bir kez kur
    useEffect(() => {
        let socketUrl = (import.meta.env.VITE_API_BASE_URL ||
            (!import.meta.env.DEV ? 'https://api.oxypace.com.tr' : 'http://localhost:5000'));

        if (socketUrl.endsWith('/api')) socketUrl = socketUrl.slice(0, -4);
        if (socketUrl.endsWith('/')) socketUrl = socketUrl.slice(0, -1);

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            timeout: 20000,
            withCredentials: true,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnected(true);
            // userIdRef.current: stale closure yok, her zaman güncel userId
            if (userIdRef.current) {
                newSocket.emit('join', userIdRef.current);
            }
            newSocket.emit('get_online_users');
        });

        newSocket.on('getOnlineUsers', (users) => {
            if (Array.isArray(users)) {
                setOnlineUsers(users.map(u => String(u._id || u.id || u)));
            } else {
                setOnlineUsers([]);
            }
            setOnlineUsersReady(true);
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
            if (active) window.location.reload();
        });

        newSocket.on('user_banned', ({ reason, expiresAt }) => {
            let message = 'Erişiminiz Engellendi!\n\n';
            message += `Gerekçe: ${reason || 'Belirtilmedi'}\n`;
            if (expiresAt) {
                message += `Bitiş Tarihi: ${new Date(expiresAt).toLocaleString()}`;
            } else {
                message += 'Bitiş Tarihi: Süresiz (Kalıcı)';
            }
            alert(message);
            localStorage.removeItem('token');
            window.location.reload();
        });

        newSocket.on('tourist_admin_revoked', () => {
            useGlobalStore.setState({ isTouristAdmin: false });
            updateUser({ isTouristAdmin: false });
            if (window.location.pathname.startsWith('/admin')) {
                navigateRef.current('/');
            }
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
            // Bağlantı koparsa '...' göster, stale 0 gösterme
            setOnlineUsersReady(false);
        });

        // Sekme görünürlük değişimi: uyku, Chrome açılış, mobil app switch
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            const sock = socketRef.current;
            if (!sock) return;

            if (sock.connected) {
                // Her durumda listeyi tazele
                sock.emit('get_online_users');
                if (userIdRef.current) {
                    sock.emit('join', userIdRef.current);
                    console.log('[Socket] Tab visible — re-joining and refreshing presence');
                } else {
                    console.log('[Socket] Tab visible — list refreshed, join pending auth');
                }
            } else {
                // Socket kopuksa yeniden bağlan; connect eventi join'i tetikler
                console.log('[Socket] Tab visible but disconnected — reconnecting');
                sock.connect();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.close();
            socketRef.current = null;
        };
    }, []); // Only on mount

    // 2. user._id her değiştiğinde (auth tamamlandığında) join gönder
    //    socket artık React state değil ref — timing race ortadan kalktı
    useEffect(() => {
        if (!user?._id) return;
        const sock = socketRef.current;
        if (!sock) return;

        const userId = String(user._id);

        if (sock.connected) {
            // Zaten bağlı → hemen join gönder
            sock.emit('join', userId);
            sock.emit('get_online_users');
            console.log(`[Socket] Auth ready — joining as ${userId}`);
        } else {
            // Henüz bağlı değil → bağlanınca connect handler gönderecek
            // userIdRef zaten güncel, connect tetiklendiğinde join gidecek
            console.log(`[Socket] Auth ready but socket not yet connected — join will fire on connect`);
        }
    }, [user?._id]);

    const value = { socket, connected, onlineUsers, onlineUsersReady };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
