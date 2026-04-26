import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useUI } from '../context/UIContext';
import './Navbar.css';

const Navbar = ({ centerContent = null, hideThemeToggle = false, mapMode = false }) => {
    const { user, token, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { socket } = useSocket();
    const { toggleSidebar, isMobileView } = useUI();
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hidden, setHidden] = useState(false);
    const menuRef = useRef(null);
    const lastScrollY = useRef(0);

    const isActive = (path) => {
        if (path === '/profile') {
            return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
        }
        return location.pathname === path;
    };

    // Smart Navbar scroll behavior (hide on scroll down, show on scroll up) - ONLY ON GUEST HOME PAGE
    useEffect(() => {
        // If not on '/' OR if user is logged in (meaning '/' represents the Inbox), disable smart scroll
        if (location.pathname !== '/' || user) {
            setHidden(false);
            return;
        }

        const handleScroll = (e) => {
            const target = e.target;
            let currentScrollY = 0;
            
            if (target === document || target === window) {
                currentScrollY = window.scrollY;
            } else if (target.scrollTop !== undefined) {
                currentScrollY = target.scrollTop;
            }
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
                setHidden(true); // Hide when scrolling down
            } else if (currentScrollY < lastScrollY.current) {
                setHidden(false); // Show when scrolling up
            }
            lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, [location.pathname, user]);

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
                setUnreadCount((prev) => prev + 1);
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
            // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <header className={`navbar${mapMode ? ' navbar-map-mode' : ''}${hidden ? ' navbar-hidden' : ''}`}>
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/" className="brand-logo">
                            <img src="/logo.png" alt="Oxypace Logo" className="logo-image" />
                            <img src="/oxypace-text-logo.png" alt="oxypace" className="logo-text" />
                        </Link>
                    </div>

                    {/* Optional center slot — used by map page for portal search */}
                    {centerContent && (
                        <div className="nav-center">
                            {centerContent}
                        </div>
                    )}

                    <div className="nav-right">
                        {/* Modern Neumorphic Theme Toggle */}
                        {!hideThemeToggle && (
                            <div 
                                className={`neumorphic-theme-toggle ${isDark ? 'dark' : 'light'}`} 
                                onClick={toggleTheme} 
                                title={isDark ? 'Açık Tema' : 'Koyu Tema'}
                                style={{ transform: 'scale(0.7)', transformOrigin: 'right center' }}
                            >
                                <div className="theme-track">
                                    <span className="theme-text">
                                        {isDark ? (
                                            <>DARK<br />MODE</>
                                        ) : (
                                            <>LIGHT<br />MODE</>
                                        )}
                                    </span>
                                    <div className="theme-thumb">
                                        {isDark ? (
                                            <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                            </svg>
                                        ) : (
                                            <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unified Profile Button (Toggles Dropdown) */}
                        <div className="header-menu-wrapper" ref={menuRef}>
                            {user ? (
                                <button
                                    className={`header-icon profile-unified-btn ${showMenu ? 'active' : ''}`}
                                    onClick={() => setShowMenu(!showMenu)}
                                    title="Profilim ve Menü"
                                    aria-expanded={showMenu}
                                    aria-haspopup="true"
                                >
                                    <div className="nav-icon-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {user?.profile?.avatar ? (
                                            <img
                                                src={getImageUrl(user.profile.avatar)}
                                                alt="Profile"
                                                className="nav-profile-img"
                                            />
                                        ) : (
                                            <div className="nav-profile-placeholder">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                >
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="nav-badge top-badge" style={{ transform: 'translate(25%, -25%)' }}></span>
                                        )}
                                    </div>
                                </button>
                            ) : token ? (
                                // While we have a token but no user yet, show a subtle loading state instead of Guest buttons
                                <div className="nav-right-loading" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="nav-spinner-small" />
                                </div>
                            ) : (
                                <div className="guest-nav-actions">
                                    <Link
                                        to="/login"
                                        className="guest-login-btn"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="guest-register-btn"
                                    >
                                        Kaydol
                                    </Link>
                                </div>
                            )}

                            {/* Dropdown Menu (Existing logic wrapped here) */}
                            {showMenu && (
                                <div className="header-dropdown">
                                    {/* Dropdown Header with User Info */}
                                    <div
                                        className="dropdown-user-info"
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                        }}
                                    >
                                        {user?.profile?.avatar ? (
                                            <img
                                                src={getImageUrl(user.profile.avatar)}
                                                alt="Avatar"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'var(--bg-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '18px',
                                                        fontWeight: 'bold',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {user?.username?.[0]?.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: '700',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                }}
                                            >
                                                {user?.username}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                Giriş Yapıldı
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Profilim
                                    </Link>
                                    {user?.isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="dropdown-item admin-link"
                                            onClick={() => setShowMenu(false)}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            >
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                            Yönetici Paneli
                                        </Link>
                                    )}
                                    <Link
                                        to="/saved"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Kaydedilenler
                                    </Link>
                                    <Link
                                        to="/feedback"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Geri Bildirim
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <div className="icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '20px', height: '20px' }}>
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span 
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-4px',
                                                        right: '-4px',
                                                        background: 'var(--primary-cyan)',
                                                        color: '#000',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        borderRadius: '50%',
                                                        width: '14px',
                                                        height: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 0 8px var(--primary-cyan)'
                                                    }}
                                                >
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ marginLeft: '12px' }}>Bildirimler</span>
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                        Ayarlar
                                    </Link>
                                    <div className="dropdown-divider" />
                                    <button
                                        className="dropdown-item logout"
                                        onClick={handleLogout}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <Link to="/create" className="mobile-fab-create">
                <div className="fab-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </div>
            </Link>


        </>
    );
};

export default Navbar;
