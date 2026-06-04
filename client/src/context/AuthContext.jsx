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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Set axios default header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // If user is already set (e.g. via login), don't re-fetch
            if (!user) {
                fetchUser(token);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        if (user && user._id) {
            if (user.securityQuestionsConfigured) {
                localStorage.setItem(`isSecurityConfigured_${user._id}`, 'true');
            } else if (localStorage.getItem(`isSecurityConfigured_${user._id}`) === 'true') {
                setUser(prev => prev ? { ...prev, securityQuestionsConfigured: true } : prev);
            }
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
        setToken(newToken);
        if (userData && userData._id && localStorage.getItem(`isSecurityConfigured_${userData._id}`) === 'true') {
            userData.securityQuestionsConfigured = true;
        }
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
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

            return {
                ...prevUser,
                ...userData,
                securityQuestionsConfigured: newConfigured
            };
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
        isAuthenticated: !!token && !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
