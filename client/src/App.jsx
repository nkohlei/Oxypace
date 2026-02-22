import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const AuthProcess = lazy(() => import('./pages/AuthProcess'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Profile = lazy(() => import('./pages/Profile'));
const Search = lazy(() => import('./pages/Search'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Settings = lazy(() => import('./pages/Settings'));
const Saved = lazy(() => import('./pages/Saved'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CommentDetail = lazy(() => import('./pages/CommentDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const Portal = lazy(() => import('./pages/Portal'));
const Maintenance = lazy(() => import('./pages/Maintenance'));

import PortalSidebar from './components/PortalSidebar';
import UserBar from './components/UserBar';
import SplashScreen from './components/SplashScreen';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import './AppLayout.css';

// 🔧 MAINTENANCE MODE - Set to true to show maintenance page
const MAINTENANCE_MODE = false;

import { useUI, UIProvider } from './context/UIContext';

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


// Routes that use the full-screen Discord-style layout — no footer here
const DISCORD_LAYOUT_ROUTES = ['/portal', '/inbox', '/settings'];

// Separate layout component to use useUI hook
const AppLayout = () => {
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useUI();
    const { user, token } = useAuth();
    const location = useLocation();

    // Use token (not user) to determine layout mode.
    // Token is available synchronously from localStorage, while user requires an API call.
    // This prevents the brief guest-mode flash during auth loading.
    const isLoggedIn = !!token;

    // Hide footer on full-screen Discord-layout pages
    const isDiscordRoute = DISCORD_LAYOUT_ROUTES.some(route => location.pathname.startsWith(route));

    useLayoutEffect(() => {
        if (isLoggedIn) {
            document.documentElement.classList.add('discord-layout-active');
            document.body.classList.add('discord-layout-active');

            // CRITICAL: Reset browser scroll that accumulated during guest-mode loading phase.
            // Without this, the scroll position from the guest page persists and
            // shifts the entire fixed layout (sidebars, navbar) upward.
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
        }
        return () => {
            document.documentElement.classList.remove('discord-layout-active');
            document.body.classList.remove('discord-layout-active');
        };
    }, [isLoggedIn, location.pathname]);

    return (
        <div className={`app-container ${!isLoggedIn ? 'guest-mode' : ''}`}>
            <div className="horizontal-layout-container" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Mobile Overlay */}
                <div
                    className={`mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                    onClick={closeSidebar}
                    aria-hidden="true"
                />

                {/* Sidebar Toggle Arrow - Visible on Desktop - Only if user is logged in */}
                {user && (
                    <div
                        className={`sidebar-toggle-arrow ${isSidebarOpen ? 'open' : ''}`}
                        onClick={toggleSidebar}
                        role="button"
                        tabIndex="0"
                        aria-label={isSidebarOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar(); } }}
                        title={isSidebarOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            {/* Arrow direction flips via CSS rotation */}
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                )}

                {user && (
                    <div className={`portal-sidebar-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                        <PortalSidebar />
                    </div>
                )}

                {/* Global User Bar Removed - Moved to Sidebars */}

                <div className="main-content-wrapper">
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
                                <Route path="/" element={<Home />} />

                                {/* Portal Route */}
                                <Route path="/portal/:id" element={<Portal />} />

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
                                    element={
                                        <PrivateRoute>
                                            <Inbox />
                                        </PrivateRoute>
                                    }
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

                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </Suspense>
                    </div>
                </div>
            </div>
            {/* Hide footer on Discord-layout pages (Portal, Inbox, Settings) */}
            {(!isLoggedIn || !isDiscordRoute) && <Footer />}
        </div>
    );
};

function App() {
    const [showSplash, setShowSplash] = useState(true);

    // If maintenance mode is on, show maintenance page
    if (MAINTENANCE_MODE) {
        return <Maintenance />;
    }

    return (
        <ThemeProvider>
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            <Router>
                <ScrollToTop />
                <AuthProvider>
                    <SocketProvider>
                        <UIProvider>
                            <AppLayout />
                        </UIProvider>
                    </SocketProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;
