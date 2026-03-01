import { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

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
const Home = lazyWithRetry(() => import('./pages/Home'));
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


// Separate layout component to use useUI hook
const AppLayout = () => {
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useUI();
    const { user, token } = useAuth();
    const location = useLocation();

    // Use token (not user) to determine layout mode.
    // Token is available synchronously from localStorage, while user requires an API call.
    // This prevents the brief guest-mode flash during auth loading.
    const isLoggedIn = !!token;

    // Map page gets a clean full-screen layout — no sidebar, no footer
    const isMapPage = location.pathname === '/map';

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
                root.style.height = '100vh';
                root.style.maxHeight = '100vh';
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

    return (
        <div className={`app-container ${!isLoggedIn ? 'guest-mode' : ''} ${isMapPage ? 'map-page-active' : ''}`}>
            <div className="horizontal-layout-container" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Mobile Overlay */}
                <div
                    className={`mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                    onClick={closeSidebar}
                    aria-hidden="true"
                />

                {/* Sidebar Toggle Arrow - Hidden on map page */}
                {user && !isMapPage && (
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

                {/* Portal Sidebar — hidden on map page so it doesn't cover zoom controls */}
                {user && !isMapPage && (
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
            {/* Footer - always visible EXCEPT on guest homepage and map page */}
            {!(location.pathname === '/' && !isLoggedIn) && !isMapPage && <Footer />}
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
