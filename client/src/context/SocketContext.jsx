import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useGlobalStore } from '../store/useGlobalStore';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

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

    const userRef = useRef(user);
    const authRef = useRef(isAuthenticated);
    useEffect(() => {
        userRef.current = user;
        authRef.current = isAuthenticated;
    }, [user, isAuthenticated]);

    // Keep active userId in ref
    const cachedUserId = localStorage.getItem('_oxypace_uid');
    const userIdRef = useRef(cachedUserId || null);

    const socketRef = useRef(null);

    // 1. Establish Socket Connection ONCE on mount
    useEffect(() => {
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
            autoConnect: !!(localStorage.getItem('token')), // Only connect if token exists
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        const isVoiceCallActive = () => {
            return !!(
                useGlobalStore.getState().isVoiceActive ||
                (typeof window !== 'undefined' && window.__isOxypaceVoiceActive)
            );
        };

        const syncPresence = (forceJoin = false) => {
            // Do NOT join if unauthenticated
            if (!authRef.current || !userRef.current?._id) return;
            const uid = String(userRef.current._id);

            if (!newSocket.connected) return;

            const isVoice = isVoiceCallActive();
            const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';

            // If app is hidden/backgrounded and user is NOT in a voice call, DO NOT emit join!
            if (isHidden && !isVoice && !forceJoin) {
                newSocket.emit('get_online_users');
                return;
            }

            const isGhost = !!localStorage.getItem('admin_backup_token');
            newSocket.emit('join', uid, isGhost);
            newSocket.emit('get_online_users');
            console.log(`[Socket] SyncPresence — joined visible: ${uid} (voiceActive: ${isVoice})`);
        };

        newSocket.on('connect', () => {
            setConnected(true);
            syncPresence(true);
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

        newSocket.io.on('reconnect', () => {
            setConnected(true);
            syncPresence(true);
        });

        // 📱 Background / Foreground Lifecycle Management
        // When user minimizes or exits the app (even if it stays in RAM in background):
        // If they are NOT in an active live voice room, they MUST NOT appear online!
        const handleAppStateChange = (isActive) => {
            const isVoice = isVoiceCallActive();
            console.log(`📱 [Socket] App state changed — isActive: ${isActive}, isVoice: ${isVoice}`);

            if (!isActive) {
                // Entered background
                if (!isVoice) {
                    // Not in voice call -> mark offline immediately!
                    if (newSocket.connected) {
                        newSocket.emit('app_background');
                        // On native platform (Android/iOS), disconnect socket to guarantee offline and save battery
                        if (Capacitor.isNativePlatform()) {
                            newSocket.disconnect();
                        }
                    }
                } else {
                    console.log('🎙️ [Socket] Preserving background connection because live voice call is active');
                }
            } else {
                // Returned to foreground
                if (authRef.current && userRef.current?._id) {
                    if (!newSocket.connected) {
                        newSocket.connect();
                    } else {
                        newSocket.emit('app_foreground');
                        syncPresence(true);
                    }
                }
            }
        };

        // Listen for Native Capacitor App state changes (Android/iOS Home button, app switch, etc.)
        let appStateListener = null;
        if (Capacitor.isNativePlatform()) {
            CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                handleAppStateChange(isActive);
            }).then(handle => {
                appStateListener = handle;
            }).catch(() => {});
        }

        // Listen for Web / PWA browser visibility changes
        const handleVisibilityChange = () => {
            handleAppStateChange(document.visibilityState === 'visible');
        };

        const handleWindowFocus = () => handleAppStateChange(true);
        const handleWindowResume = () => handleAppStateChange(true);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('pageshow', handleWindowFocus);
        window.addEventListener('online', handleWindowFocus);
        window.addEventListener('resume', handleWindowResume);

        // Before window/tab close or reload
        const handleBeforeUnload = () => {
            if (newSocket.connected && userRef.current?._id) {
                try {
                    newSocket.emit('logout');
                    newSocket.disconnect();
                } catch (e) {}
            }
            try { localStorage.removeItem('_oxypace_uid'); } catch (e) {}
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        // 25s Heartbeat — only pulses if active in foreground or in active voice call
        const heartbeatInterval = setInterval(() => {
            const isVoice = isVoiceCallActive();
            const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
            if (!isHidden || isVoice) {
                syncPresence();
            }
        }, 25000);

        return () => {
            clearInterval(heartbeatInterval);
            if (appStateListener && appStateListener.remove) {
                appStateListener.remove();
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('pageshow', handleWindowFocus);
            window.removeEventListener('online', handleWindowFocus);
            window.removeEventListener('resume', handleWindowResume);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
            newSocket.close();
        };
    }, []); // Only run on mount

    // 2. React to Auth State Changes (Login / Logout)
    useEffect(() => {
        const s = socketRef.current || socket;
        if (!s) return;

        if (!isAuthenticated || !user?._id) {
            // User LOGGED OUT or session invalid
            userIdRef.current = null;
            try { localStorage.removeItem('_oxypace_uid'); } catch (e) {}
            if (s.connected) {
                s.emit('logout');
                s.disconnect();
            }
            setOnlineUsers([]);
            return;
        }

        // User is LOGGED IN
        const uid = String(user._id);
        userIdRef.current = uid;
        try { localStorage.setItem('_oxypace_uid', uid); } catch (e) {}

        if (!s.connected) {
            s.connect();
        } else {
            const isGhost = !!localStorage.getItem('admin_backup_token');
            s.emit('join', uid, isGhost);
            s.emit('get_online_users');
            console.log(`[Socket] Auth ready — joined as ${uid}`);
        }
    }, [socket, isAuthenticated, user?._id]);

    // Effective online users memo — only include self if app is visible OR active in a voice call
    const effectiveOnlineUsers = useMemo(() => {
        const set = new Set((onlineUsers || []).map(String));
        const showMyOnline = user?.settings?.privacy?.showOnlineStatus !== false;
        const isVoice = !!(
            useGlobalStore.getState().isVoiceActive ||
            (typeof window !== 'undefined' && window.__isOxypaceVoiceActive)
        );
        const isAppVisible = typeof document === 'undefined' || document.visibilityState === 'visible';

        if (user?._id && connected && showMyOnline && (isAppVisible || isVoice)) {
            set.add(String(user._id));
        } else if (user?._id && (!showMyOnline || (!isAppVisible && !isVoice))) {
            set.delete(String(user._id));
        }
        return Array.from(set);
    }, [onlineUsers, user?._id, user?.settings?.privacy?.showOnlineStatus, connected]);

    const value = {
        socket,
        connected,
        onlineUsers: effectiveOnlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
