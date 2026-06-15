import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { BadgeProvider } from './context/BadgeContext';
import { VoiceProvider } from './context/VoiceContext';
import { useNavigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { ChevronLeft } from 'lucide-react';


// Advanced lazy loading wrapper to forcefully reload the page (once) 
// if a chunk fails to load due to a new deployment.
const lazyWithRetry = (componentImport) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );
        try {
            const component = await componentImport();
            // Once successful, reset the flag
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                console.warn('Chunk load error detected. Forcing page reload to fetch new chunks from server...', error);
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                // Return a promise that never resolves while the page is reloading
                return new Promise(() => { });
            }
            throw error;
        }
    });

// Lazy load pages for better performance
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'));
const GoogleCallback = lazyWithRetry(() => import('./pages/GoogleCallback'));
const AuthProcess = lazyWithRetry(() => import('./pages/AuthProcess'));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding'));
const CreatePost = lazyWithRetry(() => import('./pages/CreatePost'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Search = lazyWithRetry(() => import('./pages/Search'));
const Inbox = lazyWithRetry(() => import('./pages/Inbox'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Saved = lazyWithRetry(() => import('./pages/Saved'));
const PostDetail = lazyWithRetry(() => import('./pages/PostDetail'));
const CommentDetail = lazyWithRetry(() => import('./pages/CommentDetail'));
const Notifications = lazyWithRetry(() => import('./pages/Notifications'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const Portal = lazyWithRetry(() => import('./pages/Portal'));
const Maintenance = lazyWithRetry(() => import('./pages/Maintenance'));
const EarthSimulation = lazyWithRetry(() => import('./pages/MapDirectory/EarthSimulation'));
const Feedback = lazyWithRetry(() => import('./pages/Feedback'));
const Home = lazyWithRetry(() => import('./pages/Home'));

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Device } from '@capacitor/device';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';

import PortalSidebar from './components/PortalSidebar';
import UserBar from './components/UserBar';
import ScrollToTop from './components/ScrollToTop';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import SecurityQuestionsModal from './components/SecurityQuestionsModal';
import './AppLayout.css';
import InAppBrowser from './components/InAppBrowser';
import { Browser } from '@capacitor/browser';

// 🔧 MAINTENANCE MODE - Set to true to show maintenance page
const MAINTENANCE_MODE = false;

import { useUI, UIProvider } from './context/UIContext';

// Native Permission Helper
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

import { CapacitorUpdater } from '@capgo/capacitor-updater';

const requestNativePermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Request Filesystem (Storage)
        const fsStatus = await Filesystem.checkPermissions();
        if (fsStatus.publicStorage !== 'granted') {
            await Filesystem.requestPermissions();
        }

        // Push Notifications Registration
        let pushStatus = await PushNotifications.checkPermissions();
        if (pushStatus.receive !== 'granted') {
            pushStatus = await PushNotifications.requestPermissions();
        }

        if (pushStatus.receive === 'granted') {
            await PushNotifications.register();
            
            // Listeners
            await PushNotifications.addListener('registration', (token) => {
                // Save token locally to be sent when user logs in
                localStorage.setItem('fcm_token', token.value);
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error: ' + JSON.stringify(error));
            });

            await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('Push notification received in foreground:', notification);
                
                const imageUrl = notification.data?.picture || notification.data?.image || notification.data?.bigPicture;
                
                try {
                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                title: notification.title || 'Yeni Bildirim',
                                body: notification.body || '',
                                id: Math.floor(Math.random() * 1000000),
                                extra: notification.data || {},
                                ...(imageUrl && {
                                    attachments: [
                                        {
                                            id: 'picture',
                                            url: imageUrl
                                        }
                                    ]
                                })
                            }
                        ]
                    });
                } catch (localErr) {
                    console.error('Error triggering local notification:', localErr);
                }
            });

            // Local Notification action listener for routing when clicked in foreground
            await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
                console.log('Local notification action performed:', action);
                const data = action.notification?.extra;
                if (data) {
                    const { type, targetId, route } = data;
                    if (route) {
                        window.location.href = route;
                    } else if (type === 'message' && targetId) {
                        window.location.href = `/inbox/${targetId}`;
                    } else if (type === 'quote' && targetId) {
                        window.location.href = `/post/${targetId}`;
                    } else if (type === 'security') {
                        window.location.href = `/settings?tab=security`;
                    } else if (type === 'friend_request') {
                        window.location.href = `/notifications`;
                    }
                }
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('Push notification action performed:', notification);
                const data = notification.notification?.data;
                if (data) {
                    const { type, targetId, route } = data;
                    if (route) {
                        window.location.href = route;
                    } else if (type === 'message' && targetId) {
                        window.location.href = `/inbox/${targetId}`;
                    } else if (type === 'quote' && targetId) {
                        window.location.href = `/post/${targetId}`;
                    } else if (type === 'security') {
                        window.location.href = `/settings?tab=security`;
                    } else if (type === 'friend_request') {
                        window.location.href = `/notifications`;
                    }
                }
            });
        }

        // Configure Status Bar for professional look
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
        
        // Add native app class for CSS targeting
        document.body.classList.add('native-app');
    } catch (err) {
        console.warn('Native initialization error:', err);
    }
};

// Loading fallback component
const PageLoader = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #0a0a0a)'
    }}>
        <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
    </div>
);

// Redundant MobileHeader removed


// Separate layout component to use useUI hook
const AppLayout = () => {
    useRealtimeSync(); // Global websocket synchronization
    const { isSidebarOpen, toggleSidebar, closeSidebar, mobileChannelOpen } = useUI();
    const { user, token, updateUser } = useAuth();
    const location = useLocation();
    const { socket, connected } = useSocket();

    const isLoggedIn = !!token;

    // Gezinme (navigasyon) takibi ve 45 saniyelik heartbeat varlık bildirimi
    useEffect(() => {
        if (isLoggedIn && socket && connected) {
            const sendUpdate = () => {
                socket.emit('presence_update', { path: location.pathname });
            };

            // Sayfa değiştiğinde bildir
            sendUpdate();

            // 45 saniyede bir varlığı tazele
            const interval = setInterval(sendUpdate, 45000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [location.pathname, socket, connected, isLoggedIn]);

    // Map and admin pages get a clean full-screen layout — no sidebar, no footer
    const isMapPage = location.pathname === '/map';
    const isAdminPage = location.pathname.startsWith('/admin');
    const isPortalPage = location.pathname.startsWith('/portal/');
    const isCleanLayout = isMapPage || isAdminPage;

    // Route-based sidebar visibility for mobile (Discord-style)
    // Sidebar visible on Portal Selection screen (when channel feed is NOT open)
    const showSidebarOnMobile = isLoggedIn && isPortalPage && !mobileChannelOpen;

    useLayoutEffect(() => {
        const root = document.getElementById('root');
        if (isLoggedIn) {
            document.documentElement.classList.add('discord-layout-active');
            document.body.classList.add('discord-layout-active');

            // CRITICAL: Force-reset #root to 100vh to flush the stale guest-mode height.
            // When transitioning from guest mode (which can grow to 2000+ px), 
            // the #root flex container retains its expanded height even after overflow:hidden is applied.
            // Setting inline styles forces an immediate reflow to 100vh.
            if (root) {
                root.style.height = '100dvh';
                root.style.maxHeight = '100dvh';
                root.style.overflow = 'hidden';
            }

            // Reset browser scroll accumulated during guest-mode
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // Also reset the content scroll area
            const scrollArea = document.querySelector('.content-scroll-area');
            if (scrollArea) scrollArea.scrollTop = 0;

            // Force a layout reflow to flush the stale guest-mode dimensions
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                void appContainer.offsetHeight; // Force reflow
            }
        } else {
            document.documentElement.classList.remove('discord-layout-active');
            document.body.classList.remove('discord-layout-active');

            // Clear forced inline styles so guest pages can scroll freely
            if (root) {
                root.style.height = '';
                root.style.maxHeight = '';
                root.style.overflow = '';
            }
        }
        return () => {
            document.documentElement.classList.remove('discord-layout-active');
            document.body.classList.remove('discord-layout-active');
        };
    }, [isLoggedIn, location.pathname]);

    // Page titles for mobile header
    const getPageTitle = () => {
        if (location.pathname === '/') return 'Oxypace';
        if (location.pathname.startsWith('/portal/')) return 'Portal';
        if (location.pathname === '/profile') return 'Profilim';
        if (location.pathname.startsWith('/profile/')) return 'Profil';
        if (location.pathname === '/settings') return 'Ayarlar';
        if (location.pathname === '/inbox') return 'Mesajlar';
        if (location.pathname === '/notifications') return 'Bildirimler';
        if (location.pathname === '/search') return 'Keşfet';
        return 'Oxypace';
    };

    return (
        <div className={`app-container ${!isLoggedIn ? 'guest-mode' : ''} ${isCleanLayout ? 'map-page-active' : ''}`}>
            {user && user.securityQuestionsConfigured === false && localStorage.getItem(`isSecurityConfigured_${user._id}`) !== 'true' && (
                <SecurityQuestionsModal 
                    user={user} 
                    onCompleted={(questions) => {
                        if (user._id) {
                            localStorage.setItem(`isSecurityConfigured_${user._id}`, 'true');
                        }
                        updateUser({
                            ...user,
                            securityQuestionsConfigured: true,
                            securityAnswers: questions
                        });
                    }} 
                />
            )}
            {localStorage.getItem('admin_backup_token') && (
                <div 
                    className="ghost-mode-banner" 
                    style={{
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        padding: '10px 20px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '15px',
                        boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)',
                        flexShrink: 0,
                        zIndex: 99999
                    }}
                >
                    <span>🔴 TAKLİT MODU AKTİF: <strong>@{user?.username}</strong> olarak görüntülüyorsunuz (Salt Okunur).</span>
                    <button 
                        onClick={() => {
                            const backupToken = localStorage.getItem('admin_backup_token');
                            localStorage.setItem('token', backupToken);
                            localStorage.removeItem('admin_backup_token');
                            window.location.reload();
                        }}
                        style={{
                            backgroundColor: '#fff',
                            color: '#e74c3c',
                            border: 'none',
                            padding: '5px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            transition: '0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        Taklidi Sonlandır
                    </button>
                </div>
            )}
            <div className="horizontal-layout-container" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Mobile Overlay */}
                <div
                    className={`mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                    onClick={closeSidebar}
                    aria-hidden="true"
                />


                {/* Portal Sidebar — hidden on clean layout pages */}
                {user && !isCleanLayout && (
                    <div className={`portal-sidebar-wrapper ${isSidebarOpen ? 'sidebar-open' : ''} ${showSidebarOnMobile ? 'mobile-show-sidebar' : ''}`}>
                        <PortalSidebar />
                    </div>
                )}

                {/* Global User Bar Removed - Moved to Sidebars */}

                <div className={`main-content-wrapper ${isSidebarOpen ? 'sidebar-open' : ''} ${!showSidebarOnMobile ? 'mobile-no-sidebar' : ''}`}>
                    <div className="content-scroll-area">
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                {/* Public routes */}
                                <Route path="/login" element={<Login />} />

                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/verify-email" element={<VerifyEmail />} />
                                <Route path="/onboarding" element={<Onboarding />} />
                                <Route path="/auth/process" element={<AuthProcess />} />
                                <Route path="/auth/google/success" element={<GoogleCallback />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<TermsOfService />} />
                                <Route path="/contact" element={<Contact />} />

                                {/* Private routes */}
                                <Route path="/" element={isLoggedIn ? <Inbox /> : <Home />} />

                                {/* Portal Route */}
                                <Route path="/portal/:id" element={<Portal />} />
                                <Route
                                    path="/map"
                                    element={
                                        <PrivateRoute>
                                            <EarthSimulation />
                                        </PrivateRoute>
                                    }
                                />

                                <Route
                                    path="/create"
                                    element={
                                        <PrivateRoute>
                                            <CreatePost />
                                        </PrivateRoute>
                                    }
                                />
                                <Route path="/search" element={<Search />} />
                                <Route
                                    path="/profile"
                                    element={
                                        <PrivateRoute>
                                            <Profile />
                                        </PrivateRoute>
                                    }
                                />
                                <Route path="/profile/:username" element={<Profile />} />
                                <Route
                                    path="/inbox"
                                    element={<Navigate to="/" replace />}
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <PrivateRoute>
                                            <Settings />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/notifications"
                                    element={
                                        <PrivateRoute>
                                            <Notifications />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/admin"
                                    element={
                                        <PrivateRoute>
                                            <AdminDashboard />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/feedback"
                                    element={
                                        <PrivateRoute>
                                            <Feedback />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/saved"
                                    element={
                                        <PrivateRoute>
                                            <Saved />
                                        </PrivateRoute>
                                    }
                                />
                                <Route path="/post/:postId" element={<PostDetail />} />
                                <Route
                                    path="/comment/:commentId"
                                    element={
                                        <PrivateRoute>
                                            <CommentDetail />
                                        </PrivateRoute>
                                    }
                                />

                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </div>
                </div>
            </div>
            <InAppBrowser />
        </div>
    );
};

// Maintenance Gate — wraps AppLayout and shows maintenance page
// when MAINTENANCE_MODE is active. Bypasses for @oxypace user and
// allows auth-related routes so users can still log in.
const MaintenanceGate = ({ children }) => {
    const { user } = useAuth();

    // If maintenance mode is off, always render children
    if (!MAINTENANCE_MODE) return children;

    // Allow @oxypace to bypass maintenance entirely
    if (user && user.username === 'oxypace') return children;

    // Everyone else sees the maintenance page

    return (
        <Suspense fallback={<PageLoader />}>
            <Maintenance />
        </Suspense>
    );
};

// Separate wrapper to access AuthContext
const AppContent = () => {
    const { loading, token } = useAuth();

    // Send FCM Token to Backend if available and logged in
    useEffect(() => {
        if (token && Capacitor.isNativePlatform()) {
            const fcmToken = localStorage.getItem('fcm_token');
            if (fcmToken) {
                import('axios').then(({ default: axios }) => {
                    axios.post('/api/users/fcm-token', { token: fcmToken }, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).catch(err => console.error('FCM Token sync error:', err));
                });
            }
        }
    }, [token]);

    if (loading) {
        return <PageLoader />;
    }

    return (
        <MaintenanceGate>
            <AppLayout />
        </MaintenanceGate>
    );
};

import { App as CapacitorApp } from '@capacitor/app';

function App() {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            requestNativePermissions();
            CapacitorUpdater.notifyAppReady();

            // Handle Deep Linking for Google Auth and general routes
            CapacitorApp.addListener('appUrlOpen', (event) => {
                const url = event.url;
                if (url.includes('oxypace://auth/process')) {
                    try {
                        let token = null;
                        if (url.includes('?token=')) {
                            token = url.split('?token=')[1];
                        }
                        if (token) {
                            window.location.href = `/auth/process?token=${token}`;
                        }
                    } catch (e) {
                        console.error('Deep link error:', e);
                    }
                } else if (url.startsWith('oxypace://')) {
                    try {
                        const path = url.replace('oxypace://', '/');
                        if (path) {
                            window.location.href = path;
                        }
                    } catch (e) {
                        console.error('Custom scheme deep link error:', e);
                    }
                }
            });
        }

        // Global click interceptor for external links on native platform
        const handleExternalLinks = (e) => {
            const anchor = e.target.closest('a');
            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                    if (Capacitor.isNativePlatform()) {
                        e.preventDefault();
                        // Direct opening via safe native browser (Custom Tabs / SafariViewController)
                        // to avoid disallowed_useragent and other WebView security policy violations.
                        Browser.open({ url: href });
                    }
                }
            }
        };
        document.addEventListener('click', handleExternalLinks);

        // Global protection for images and videos - Disable Right Click
        const handleContextMenu = (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.preventDefault();
            }
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('click', handleExternalLinks);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);



    return (
        <ThemeProvider>
            <Router>
                <ScrollToTop />
                <AuthProvider>
                    <BadgeProvider>
                        <SocketProvider>
                            <VoiceProvider>
                                <UIProvider>
                                    <AppContent />
                                </UIProvider>
                            </VoiceProvider>
                        </SocketProvider>
                    </BadgeProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;
