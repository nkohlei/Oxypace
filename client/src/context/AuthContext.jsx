import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useGlobalStore } from '../store/useGlobalStore';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

import { Capacitor, registerPlugin } from '@capacitor/core';
const AuthSync = registerPlugin('AuthSync');

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const cached = localStorage.getItem('user');
            return cached ? JSON.parse(cached) : null;
        } catch (_) {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(() => {
        const hasToken = !!localStorage.getItem('token');
        const hasUser = !!localStorage.getItem('user');
        return hasToken && !hasUser;
    });

    // Multi-Account Management
    const getStoredAccounts = () => {
        try {
            const raw = localStorage.getItem('oxypace_saved_accounts');
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    };

    const persistAccounts = (accounts) => {
        try {
            localStorage.setItem('oxypace_saved_accounts', JSON.stringify(accounts));
        } catch (_) {}
    };

    const [savedAccounts, setSavedAccounts] = useState(() => getStoredAccounts());

    // Keep active user synchronized in saved accounts list
    useEffect(() => {
        if (user && user._id && token) {
            setSavedAccounts(prev => {
                const filtered = prev.filter(acc => acc.userId !== user._id);
                const currentAccount = {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    profile: {
                        avatar: user.profile?.avatar,
                        displayName: user.profile?.displayName,
                    },
                    token: token,
                    lastActive: Date.now()
                };
                const updated = [currentAccount, ...filtered];
                persistAccounts(updated);
                return updated;
            });
        }
    }, [user?._id, user?.username, user?.profile?.avatar, token]);

    // Set axios default header & sync with native Android for notification direct replies
    useEffect(() => {
        const prodServerUrl = 'https://oxypace.com.tr';
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=31536000; SameSite=Lax`;
            } catch (_) {}
            if (Capacitor.isNativePlatform()) {
                AuthSync.syncAuth({ token, serverUrl: prodServerUrl }).catch(() => {});
            }
            // Always fetch fresh user profile in background (Stale-While-Revalidate)
            fetchUser(token);
        } else {
            setLoading(false);
            if (Capacitor.isNativePlatform()) {
                AuthSync.syncAuth({ token: '', serverUrl: prodServerUrl }).catch(() => {});
            }
        }
    }, [token]);

    useEffect(() => {
        if (user && user._id) {
            if (user.securityQuestionsConfigured) {
                localStorage.setItem(`isSecurityConfigured_${user._id}`, 'true');
            } else if (localStorage.getItem(`isSecurityConfigured_${user._id}`) === 'true') {
                setUser(prev => prev ? { ...prev, securityQuestionsConfigured: true } : prev);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            useGlobalStore.setState({ isTouristAdmin: !!user.isTouristAdmin });
        } else {
            useGlobalStore.setState({ isTouristAdmin: false });
        }
    }, [user]);

    const fetchUser = async (authToken = token) => {
        try {
            const response = await axios.get('/api/users/me', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const userData = response.data;
            if (userData && userData._id && localStorage.getItem(`isSecurityConfigured_${userData._id}`) === 'true') {
                userData.securityQuestionsConfigured = true;
            }
            setUser(userData);
            try {
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (_) {}
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Only logout if it's a 401 (Unauthorized) to avoid logout on network errors
            if (error.response && error.response.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        try {
            document.cookie = `token=${encodeURIComponent(newToken)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (_) {}
        setToken(newToken);
        if (userData && userData._id && localStorage.getItem(`isSecurityConfigured_${userData._id}`) === 'true') {
            userData.securityQuestionsConfigured = true;
        }
        setUser(userData);
        try {
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (_) {}
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const switchAccount = (targetUserId) => {
        const list = getStoredAccounts();
        const target = list.find(a => a.userId === targetUserId);
        if (!target || !target.token) return false;

        // Ensure current account is up-to-date in saved list before switching
        if (user && user._id && token) {
            const filtered = list.filter(a => a.userId !== user._id && a.userId !== targetUserId);
            const reordered = [
                {
                    ...target,
                    lastActive: Date.now()
                },
                {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    profile: {
                        avatar: user.profile?.avatar,
                        displayName: user.profile?.displayName,
                    },
                    token: token,
                    lastActive: Date.now()
                },
                ...filtered
            ];
            persistAccounts(reordered);
        }

        localStorage.setItem('token', target.token);
        localStorage.setItem('user', JSON.stringify({
            _id: target.userId,
            username: target.username,
            email: target.email,
            profile: target.profile
        }));
        try {
            document.cookie = `token=${encodeURIComponent(target.token)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (_) {}

        localStorage.removeItem('_oxypace_uid');
        sessionStorage.clear();
        sessionStorage.setItem('oxypace_fresh_login', 'true');

        window.location.href = '/messages';
        return true;
    };

    const addAndSwitchAccount = (newToken, newUserData) => {
        if (!newToken || !newUserData || !newUserData._id) return;

        const list = getStoredAccounts();
        const newId = String(newUserData._id);
        const currentId = user?._id ? String(user._id) : null;

        const filtered = list.filter(a => String(a.userId) !== newId && String(a.userId) !== currentId);

        const reordered = [
            {
                userId: newUserData._id,
                username: newUserData.username,
                email: newUserData.email,
                profile: {
                    avatar: newUserData.profile?.avatar,
                    displayName: newUserData.profile?.displayName,
                },
                token: newToken,
                lastActive: Date.now()
            }
        ];

        if (user && user._id && token && currentId !== newId) {
            reordered.push({
                userId: user._id,
                username: user.username,
                email: user.email,
                profile: {
                    avatar: user.profile?.avatar,
                    displayName: user.profile?.displayName,
                },
                token: token,
                lastActive: Date.now()
            });
        }

        reordered.push(...filtered);
        persistAccounts(reordered);

        login(newToken, newUserData);
        sessionStorage.setItem('oxypace_fresh_login', 'true');

        window.location.reload();
    };

    const removeSavedAccount = (targetUserId) => {
        setSavedAccounts(prev => {
            const updated = prev.filter(a => a.userId !== targetUserId);
            persistAccounts(updated);
            return updated;
        });
    };

    const logout = (removeCurrent = true) => {
        try {
            if (removeCurrent && user?._id) {
                setSavedAccounts(prev => {
                    const updated = prev.filter(a => a.userId !== user._id);
                    persistAccounts(updated);
                    return updated;
                });
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('_oxypace_uid'); // presence cache temizle
            sessionStorage.clear();
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            axios.post('/api/auth/logout').catch(() => {});
        } catch (e) {}
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        // Reset unread counts and other portal state
        useGlobalStore.getState().resetStore();
    };

    const updateUser = (userData) => {
        setUser(prevUser => {
            if (!prevUser) return userData;
            const localKey = userData?._id ? `isSecurityConfigured_${userData._id}` : (prevUser?._id ? `isSecurityConfigured_${prevUser._id}` : null);
            const isLocalConfigured = localKey ? localStorage.getItem(localKey) === 'true' : false;
            
            const prevConfigured = prevUser.securityQuestionsConfigured || isLocalConfigured;
            const newConfigured = userData?.securityQuestionsConfigured !== undefined 
                ? userData.securityQuestionsConfigured 
                : prevConfigured;

            const updated = {
                ...prevUser,
                ...userData,
                securityQuestionsConfigured: newConfigured
            };
            try {
                localStorage.setItem('user', JSON.stringify(updated));
            } catch (_) {}
            return updated;
        });
    };

    // Axios global response interceptor to detect if client IP or authenticated user is banned
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 403) {
                    const data = error.response.data;
                    if (data && data.isBanned) {
                        if (data.bannedDeviceToken) {
                            localStorage.setItem('banned_device', data.bannedDeviceToken);
                        }
                        let message = 'Erişiminiz Engellendi!\n\n';
                        message += `Gerekçe: ${data.banReason || 'Belirtilmedi'}\n`;
                        
                        if (data.banExpiresAt) {
                            const date = new Date(data.banExpiresAt);
                            message += `Bitiş Tarihi: ${date.toLocaleString()}`;
                        } else {
                            message += 'Bitiş Tarihi: Süresiz (Kalıcı)';
                        }
                        
                        alert(message);
                        
                        // Clean user session and token
                        logout();
                        
                        // Force clean page reload
                        window.location.reload();
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        savedAccounts,
        switchAccount,
        addAndSwitchAccount,
        removeSavedAccount,
        isAuthenticated: !!token && !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
