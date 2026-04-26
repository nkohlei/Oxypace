import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { BadgeProvider } from './context/BadgeContext';
import { VoiceProvider } from './context/VoiceContext';
import { useNavigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { ChevronLeft } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

// Advanced lazy loading wrapper to forcefully reload the page (once) 
// if a chunk fails to load due to a new Vercel deployment.
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
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import './AppLayout.css';

// 🔧 MAINTENANCE MODE - Set to true to show maintenance page
const MAINTENANCE_MODE = false;

import { useUI, UIProvider } from './context/UIContext';

// Native Permission Helper
import { PushNotifications } from '@capacitor/push-notifications';

import { CapacitorUpdater } from '@capgo/capacitor-updater';

const requestNativePermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Request Camera & Photos
        const cameraStatus = await Camera.checkPermissions();
        if (cameraStatus.camera !== 'granted' || cameraStatus.photos !== 'granted') {
            await Camera.requestPermissions();
        }

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
                // TODO: Send token to backend via API
            });

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error: ' + JSON.stringify(error));
            });

            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            });
        }

        // Configure Status Bar for professional look
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
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
    const { user, token } = useAuth();
    const location = useLocation();

    // Use token (not user) to determine layout mode.
    // Token is available synchronously from localStorage, while user requires an API call.
    // This prevents the brief guest-mode flash during auth loading.
    const isLoggedIn = !!token;

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

                <div className={`main-content-wrapper ${!showSidebarOnMobile ? 'mobile-no-sidebar' : ''}`}>
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
        </div>
    );
};

// Separate wrapper to access AuthContext
const AppContent = () => {
    const { loading, token } = useAuth();
    const [showSplash, setShowSplash] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    // Coordinate splash screen with auth loading
    useEffect(() => {
        // Minimum time for splash animation (3s total, matching SplashScreen.jsx)
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Only hide splash when:
        // 1. Min animation time has passed
        // 2. Auth is no longer loading (profile fetched or no token)
        if (minTimeElapsed && !loading) {
            setShowSplash(false);
        }
    }, [minTimeElapsed, loading]);

    return (
        <>
            {showSplash && <SplashScreen onFinish={() => {}} />}
            <AppLayout />
        </>
    );
};

function App() {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            requestNativePermissions();
            CapacitorUpdater.notifyAppReady();
        }
    }, []);

    // If maintenance mode is on, show maintenance page
    if (MAINTENANCE_MODE) {
        return <Maintenance />;
    }

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
            <Analytics />
        </ThemeProvider>
    );
}

export default App;
