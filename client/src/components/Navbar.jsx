import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { Moon, Sun, User, Shield, Bookmark, MessageSquare, Bell, Settings, LogOut, Plus } from 'lucide-react';
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
    const [adminPendingCount, setAdminPendingCount] = useState(0);
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

            // Fetch admin pending items if admin
            if (user.isAdmin) {
                const fetchAdminCount = async () => {
                    try {
                        const response = await axios.get('/api/admin/pending-count');
                        setAdminPendingCount(response.data.count || 0);
                    } catch (error) {
                        console.error('Fetch admin pending count error:', error);
                    }
                };
                fetchAdminCount();
            }
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
                            <img src="/oxypace-text-logo1.webp" alt="oxypace" className="logo-text" />
                        </Link>
                    </div>

                    {/* Optional center slot — used by map page for portal search */}
                    {centerContent && (
                        <div className="nav-center">
                            {centerContent}
                        </div>
                    )}

                    <div className="nav-right">


                        {/* Unified Profile Button (Toggles Dropdown) */}
                        <div className="header-menu-wrapper" ref={menuRef}>
                            {user ? (
                                <button
                                    className={`header-icon profile-unified-btn ${showMenu ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''} ${adminPendingCount > 0 ? 'has-admin-unread' : ''}`}
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
                                                <User size={20} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="nav-badge count-badge">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
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
                                        preventScrollReset={true}
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="guest-register-btn"
                                        preventScrollReset={true}
                                    >
                                        Kaydol
                                    </Link>
                                </div>
                            )}

                            {/* Dropdown Menu (Existing logic wrapped here) */}
                            {showMenu && (
                                <div className="header-dropdown">
                                    {/* Dropdown Header - Link to Profile */}
                                    <Link 
                                        to="/profile" 
                                        className="dropdown-user-info"
                                        onClick={() => setShowMenu(false)}
                                    >
                                         {user?.profile?.avatar ? (
                                             <img
                                                 src={getImageUrl(user.profile.avatar)}
                                                 alt="Avatar"
                                                 className="dropdown-avatar"
                                             />
                                         ) : (
                                             <div className="dropdown-avatar-placeholder">
                                                 <span>{user?.username?.[0]?.toUpperCase()}</span>
                                             </div>
                                         )}
                                         <div className="dropdown-user-details">
                                             <span className="dropdown-username">{user?.username}</span>
                                             <span className="dropdown-user-status">giriş yapıldı</span>
                                         </div>
                                     </Link>

                                    {user?.username === 'oxypace' && (
                                        <Link
                                            to="/admin"
                                            className="dropdown-item admin-link"
                                            onClick={() => setShowMenu(false)}
                                        >
                                            <Shield size={20} strokeWidth={1.5} />
                                            Yönetici Paneli
                                        </Link>
                                    )}
                                    <Link
                                        to="/feedback"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <MessageSquare size={20} strokeWidth={1.5} />
                                        Destek
                                    </Link>

                                    <Link
                                        to="/notifications"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <Bell size={20} strokeWidth={1.5} />
                                        <span>Bildirimler</span>
                                        {unreadCount > 0 && <span className="badge-pill">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                                    </Link>

                                    <Link
                                        to="/settings"
                                        className="dropdown-item"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <Settings size={20} strokeWidth={1.5} />
                                        Ayarlar
                                    </Link>
                                    <div className="dropdown-divider" />
                                    <button
                                        className="dropdown-item logout"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={20} strokeWidth={1.5} />
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
                    <Plus size={24} strokeWidth={2} />
                </div>
            </Link>


        </>
    );
};

export default Navbar;
