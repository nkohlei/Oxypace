import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useUI } from '../context/UIContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { socket } = useSocket();
    const { toggleSidebar } = useUI();
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef(null);

    const isActive = (path) => {
        if (path === '/profile') {
            return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
        }
        return location.pathname === path;
    };

    // Fetch initial unread count
    useEffect(() => {
        if (user) {
            const fetchUnreadCount = async () => {
                try {
                    const response = await axios.get('/api/notifications?limit=1');
                    setUnreadCount(response.data.unreadCount || 0);
                } catch (error) {
                    console.error('Fetch unread count error:', error);
                }
            };
            fetchUnreadCount();
        }
    }, [user]);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            // Don't count own actions if they somehow come through
            if (notification.sender._id !== user?._id) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on('newNotification', handleNewNotification);

        return () => {
            socket.off('newNotification', handleNewNotification);
        };
    }, [socket, user]);

    // Reset count when visiting notifications page
    useEffect(() => {
        if (location.pathname === '/notifications') {
            setUnreadCount(0);
            // Optionally call backend to mark all as read here or keep it manual in Notifications page
        }
    }, [location.pathname]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            {/* Top Header */}
            <header className="navbar">
                <div className="nav-container">
                    <div className="nav-left">
                        {/* Mobile Sidebar Toggle - Visible only on mobile */}
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>

                        <Link to="/" className="brand-logo">
                            <img src="/logo.png" alt="Deepace Logo" className="logo-image" />
                            <span className="logo-text">deepace</span>
                        </Link>
                    </div>

                    <div className="nav-right">
                        {/* Theme Toggle Button - Modernized */}
                        <button
                            className="theme-toggle-btn-modern"
                            onClick={toggleTheme}
                            title={isDark ? 'Açık Tema' : 'Koyu Tema'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                padding: '8px 16px',
                                borderRadius: '24px',
                                marginRight: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isDark ? (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: '#fbbf24' }}>
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Koyu</span>
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#f59e0b' }}>
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Açık</span>
                                </>
                            )}
                        </button>

                        {user ? (
                            <>
                                {/* Notification Button */}
                                <Link to="/notifications" className="header-icon notification-btn">
                                    <div className="nav-icon-wrapper">
                                        <svg viewBox="0 0 24 24" fill={location.pathname === '/notifications' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                        {unreadCount > 0 && <span className="nav-badge top-badge"></span>}
                                    </div>
                                </Link>

                                {/* Menu Button for Quick Actions */}
                                <div className="header-menu-wrapper" ref={menuRef}>
                                    <button
                                        className="header-icon menu-trigger"
                                        onClick={() => setShowMenu(!showMenu)}
                                        title="Menü"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="1" />
                                            <circle cx="12" cy="5" r="1" />
                                            <circle cx="12" cy="19" r="1" />
                                        </svg>
                                    </button>
                                    {/* Dropdown Menu */}
                                    {showMenu && (
                                        <div className="header-dropdown">
                                            {/* Dropdown Header with User Info */}
                                            <div className="dropdown-user-info" style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}>
                                                {user?.profile?.avatar ? (
                                                    <img src={getImageUrl(user.profile.avatar)} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{user?.username?.[0]?.toUpperCase()}</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{user?.username}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Giriş Yapıldı</span>
                                                </div>
                                            </div>
                                            {user?.isAdmin && (
                                                <Link to="/admin" className="dropdown-item admin-link" onClick={() => setShowMenu(false)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                    Yönetici Paneli
                                                </Link>
                                            )}
                                            <Link to="/saved" className="dropdown-item" onClick={() => setShowMenu(false)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                                Kaydedilenler
                                            </Link>
                                            <Link to="/settings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                                Ayarlar
                                            </Link>
                                            <div className="dropdown-divider" />
                                            <button className="dropdown-item logout" onClick={handleLogout}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}

                        {/* Unified Profile/Login Button (Always Visible) */}
                        <Link
                            to={user ? "/profile" : "/login"}
                            className="header-icon profile-unified-btn"
                            title={user ? "Profilim" : "Giriş Yap"}
                        >
                            {user?.profile?.avatar ? (
                                <img src={getImageUrl(user.profile.avatar)} alt="Profile" className="nav-profile-img" />
                            ) : (
                                <div className="nav-profile-placeholder">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Bottom Navigation */}
            {user && (
                <nav className="bottom-nav">
                    <div className="nav-container">
                        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </Link>

                        {/* Search Removed from Bottom Nav as per request */}

                        <Link to="/create" className="nav-item create-btn">
                            <div className="create-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                        </Link>

                        <Link to="/inbox" className={`nav-item ${isActive('/inbox') ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" fill={isActive('/inbox') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                        </Link>

                        {/* Profile - Direct Link */}
                        <Link
                            to="/profile"
                            className={`nav-item profile-link ${isActive('/profile') ? 'active' : ''}`}
                        >
                            {user?.profile?.avatar ? (
                                <img src={getImageUrl(user.profile.avatar)} alt={user?.username || 'User'} className="nav-avatar" />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </Link>
                    </div>
                </nav>
            )}
        </>
    );
};

export default Navbar;

