import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Inbox from './pages/Inbox';
import Settings from './pages/Settings';
import Saved from './pages/Saved';
import PostDetail from './pages/PostDetail';
import CommentDetail from './pages/CommentDetail';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import Portal from './pages/Portal';
import PortalSidebar from './components/PortalSidebar';
import Maintenance from './pages/Maintenance';
import UserBar from './components/UserBar';
import SplashScreen from './components/SplashScreen';
import './AppLayout.css';

// 🔧 MAINTENANCE MODE - Set to true to show maintenance page
const MAINTENANCE_MODE = false;

import { useUI, UIProvider } from './context/UIContext';

// Separate layout component to use useUI hook
const AppLayout = () => {
    const { isSidebarOpen, toggleSidebar, closeSidebar } = useUI();

    return (
        <div className="app-container">
            {/* Mobile Overlay */}
            <div
                className={`mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar Toggle Arrow - Visible on Desktop */}
            {/* Sidebar Toggle Arrow - Visible on Desktop */}
            <div
                className={`sidebar-toggle-arrow ${isSidebarOpen ? 'open' : ''}`}
                onClick={toggleSidebar}
                title={isSidebarOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    {/* Arrow direction flips via CSS rotation */}
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>

            <div className={`portal-sidebar-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <PortalSidebar />
            </div>

            {/* Global User Bar */}
            <UserBar />

            <div className="main-content-wrapper">
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
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
                    <Route
                        path="/search"
                        element={
                            <PrivateRoute>
                                <Search />
                            </PrivateRoute>
                        }
                    />
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

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </div >
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


