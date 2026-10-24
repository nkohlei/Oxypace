import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { Moon, Sun, User, Shield, Bookmark, MessageSquare, Bell, Settings, LogOut, Plus, Forward, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useUI } from '../context/UIContext';
import { useVoice } from '../context/VoiceContext';
import { ConnectionState } from 'livekit-client';
import './Navbar.css';
import UserAvatar from './UserAvatar';
import GhostModeBar from './GhostModeBar';
import AddAccountModal from './AddAccountModal';
import { useGlobalStore } from '../store/useGlobalStore';
import { useUploadStore } from '../store/useUploadStore';

const Navbar = ({ centerContent = null, hideThemeToggle = false, mapMode = false }) => {
    const location = useLocation();
    const { user, token, logout, savedAccounts, switchAccount, removeSavedAccount } = useAuth();
    const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const isGhostMode = typeof window !== 'undefined' && !!localStorage.getItem('admin_backup_token');
    const { isDark, toggleTheme } = useTheme();
    const { socket } = useSocket();
    const { toggleSidebar, isMobileView, setMobileChannelOpen } = useUI() || {};
    const { activeRoom, connectionState } = useVoice();
    const isVoiceConnected = connectionState === ConnectionState.Connected;
    const isLiveRoomActive = isVoiceConnected && !!activeRoom;
    const roomDisplayName = activeRoom?.channelName || activeRoom?.roomName || 'Canlı Oda';
    const liveTrackRef = useRef(null);
    const liveTextSpanRef = useRef(null);
    const [isLiveTextOverflowing, setIsLiveTextOverflowing] = useState(false);

    useEffect(() => {
        if (!isLiveRoomActive) {
            setIsLiveTextOverflowing(false);
            return;
        }
        const checkOverflow = () => {
            if (liveTrackRef.current && liveTextSpanRef.current) {
                const trackWidth = liveTrackRef.current.clientWidth;
                const textWidth = liveTextSpanRef.current.offsetWidth || liveTextSpanRef.current.scrollWidth;
                setIsLiveTextOverflowing(textWidth > trackWidth + 1);
            }
        };
        checkOverflow();
        const timer1 = setTimeout(checkOverflow, 120);
        const timer2 = setTimeout(checkOverflow, 400);
        window.addEventListener('resize', checkOverflow);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [isLiveRoomActive, roomDisplayName]);

    const handleGoToActiveRoom = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!activeRoom) return;
        if (setMobileChannelOpen) {
            setMobileChannelOpen(true);
        }

        window.dispatchEvent(new CustomEvent('oxypace:switch_channel', {
            detail: {
                portalId: activeRoom.portalId,
                channelId: activeRoom.channelId
            }
        }));

        navigate(`/portal/${activeRoom.portalId}?channel=${activeRoom.channelId}&joinVoice=true`);
    };

    const activeUploads = useUploadStore((state) => state.activeUploads);
    const activeUploadList = Object.values(activeUploads);
    const uploadingItem = activeUploadList.find((u) => u.status === 'uploading');
    const navigate = useNavigate();

    // Check guest status and home page for render check at the end
    const isGuest = !token;
    const isHomePage = location.pathname === '/';

    const [showMenu, setShowMenu] = useState(false);
    const unreadCount = useGlobalStore((state) => state.unreadNotificationsCount);
    const setUnreadCount = useGlobalStore((state) => state.setUnreadNotificationsCount);
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

            // Fetch admin pending items if admin or tourist admin
            if (user.isAdmin || user.isTouristAdmin) {
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
            // Don't count own actions or messages/portal_posts which have their own badge systems
            const senderId = notification?.sender?._id || notification?.sender;
            if (
                senderId !== user?._id &&
                notification?.type !== 'message' &&
                notification?.type !== 'portal_post'
            ) {
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
            // Ignore clicks within the onboarding tour components to avoid state conflicts
            if (event.target.closest('.tour-card') || event.target.closest('.tour-overlay-container')) {
                return;
            }
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
                setShowAccountSwitcher(false);
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
        if (socket) {
            try {
                socket.emit('logout');
                socket.disconnect();
            } catch (e) {}
        }
        logout();
        window.location.href = '/';
    };

    const handleLogoClick = (e) => {
        const isMobile = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && window.innerWidth <= 768);
        if (isMobile) {
            e.preventDefault();
            navigate('/messages');
        }
    };

    // Hide Navbar on non-home pages ONLY for guests (not logged-in users)
    // Placed after all hooks to guarantee identical hook count across all renders
    if (isGuest && !isHomePage) {
        return null;
    }

    const otherAccounts = (savedAccounts || []).filter(acc => acc.userId !== user?._id);

    return (
        <>
            {/* Upload Progress Bar (Floating below navbar) */}
            {uploadingItem && (
                <div className="navbar-upload-progress">
                    <div 
                        className="navbar-upload-fill" 
                        style={{ width: `${uploadingItem.progress}%` }} 
                    />
                </div>
            )}
            {/* Top Header */}
            <header className={`navbar${mapMode ? ' navbar-map-mode' : ''}${hidden ? ' navbar-hidden' : ''}`}>
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/" className="brand-logo" onClick={handleLogoClick}>
                            <img src="/logo.png" alt="Oxypace Logo" className="logo-image" width="38" height="38" decoding="async" />
                            <img src="/oxypace-text-logo2.webp" alt="oxypace" className="logo-text" width="110" height="25" decoding="async" />
                        </Link>

                        {isLiveRoomActive && (
                            <button
                                type="button"
                                className="nav-live-room-pill"
                                onClick={handleGoToActiveRoom}
                                title={`${roomDisplayName} - Canlı Odaya Git`}
                                aria-label={`${roomDisplayName} - Canlı Odaya Git`}
                            >
                                <div className={`nav-live-pill-track ${isLiveTextOverflowing ? 'is-overflowing' : ''}`} ref={liveTrackRef}>
                                    <div className={`nav-live-pill-scroll-wrapper ${isLiveTextOverflowing ? 'is-marquee' : ''}`}>
                                        <span className="nav-live-pill-text" ref={liveTextSpanRef}>{roomDisplayName}</span>
                                        {isLiveTextOverflowing && (
                                            <>
                                                <span className="nav-live-pill-spacer" aria-hidden="true" />
                                                <span className="nav-live-pill-text clone" aria-hidden="true">
                                                    {roomDisplayName}
                                                </span>
                                                <span className="nav-live-pill-spacer" aria-hidden="true" />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className="nav-live-pill-icon-box">
                                    <Forward size={13} strokeWidth={2.4} className="nav-live-pill-forward-icon" />
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Center slot — used by Ghost Mode (highest priority) OR map page portal search */}
                    {(isGhostMode || centerContent) && (
                        <div className="nav-center">
                            {isGhostMode ? <GhostModeBar user={user} /> : centerContent}
                        </div>
                    )}

                    <div className="nav-right">
                        {/* EVENT HORIZON Blog Button (Visible when logged in and in platform) */}
                        {user && !location.pathname.startsWith('/blog') && (
                            <button
                                className="event-horizon-nav-btn"
                                title="EVENT HORIZON Blog"
                                onClick={async () => {
                                    if (Capacitor.isNativePlatform()) {
                                        try {
                                            await Browser.open({
                                                url: 'https://oxypace.com.tr/blog',
                                                toolbarColor: '#060913',
                                                presentationStyle: 'fullscreen'
                                            });
                                        } catch (err) {
                                            console.error('Failed to open EVENT HORIZON in browser:', err);
                                            window.open('https://oxypace.com.tr/blog', '_system');
                                        }
                                    } else {
                                        window.location.href = '/blog';
                                    }
                                }}
                            >
                                <span className="eh-line1">EVENT</span>
                                <span className="eh-line2">HORIZON</span>
                            </button>
                        )}

                        {!hideThemeToggle && (
                            <button
                                className="nav-theme-toggle-btn"
                                onClick={toggleTheme}
                                title={isDark ? "Aydınlık Tema" : "Karanlık Tema"}
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        )}

                        {/* Oxypace Portal Button (Visible on /blog page when user is logged in) */}
                        {user && location.pathname === '/blog' && (
                            <button
                                className="oxypace-portal-nav-btn"
                                onClick={() => {
                                    if (user.joinedPortals && user.joinedPortals.length > 0) {
                                        const firstPortalId = typeof user.joinedPortals[0] === 'string' ? user.joinedPortals[0] : user.joinedPortals[0]._id;
                                        navigate(`/portal/${firstPortalId}`);
                                    } else {
                                        navigate('/messages');
                                    }
                                }}
                                title="Oxypace Platformuna Dön"
                            >
                                <span>Oxypace Portal</span>
                                <span className="arrow">→</span>
                            </button>
                        )}

                        {/* Unified Profile Button (Toggles Dropdown) */}
                        <div className="header-menu-wrapper" ref={menuRef}>
                            {user ? (
                                <button
                                    id="tour-step-profile"
                                    className={`header-icon profile-unified-btn ${showMenu ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''} ${adminPendingCount > 0 ? 'has-admin-unread' : ''}`}
                                    onClick={() => {
                                        setShowMenu(prev => !prev);
                                        setShowAccountSwitcher(false);
                                    }}
                                    title="Profilim ve Menü"
                                    aria-expanded={showMenu}
                                    aria-haspopup="true"
                                >
                                    <div className="nav-icon-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserAvatar
                                            src={user?.profile?.avatar}
                                            alt="Profile"
                                            className="nav-profile-img"
                                            size={28}
                                            loading="eager"
                                        />
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
                            {showMenu && (
                                <div className="header-dropdown glass-panel">
                                    {/* Dropdown Header Row - Link to Profile & Account Switcher Toggle */}
                                    <div className="dropdown-header-row">
                                        <Link 
                                            to="/profile" 
                                            className="dropdown-user-info"
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowAccountSwitcher(false);
                                            }}
                                        >
                                             <UserAvatar
                                                 src={user?.profile?.avatar}
                                                 alt="Avatar"
                                                 className="dropdown-avatar"
                                                 size={40}
                                             />
                                             <div className="dropdown-user-details">
                                                 <span className="dropdown-username">{user?.username}</span>
                                                 <span className="dropdown-user-status">giriş yapıldı</span>
                                             </div>
                                         </Link>

                                        <button
                                            type="button"
                                            className={`dropdown-switch-toggle-btn ${showAccountSwitcher ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAccountSwitcher(prev => !prev);
                                            }}
                                            title={showAccountSwitcher ? "Hesap Menüsünü Kapat" : "Hesap Değiştir"}
                                            aria-label="Hesap Değiştir"
                                            aria-expanded={showAccountSwitcher}
                                        >
                                            <ChevronDown size={18} className={`switch-arrow-icon ${showAccountSwitcher ? 'rotated' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Expandable Multi-Account Switcher Section */}
                                    {showAccountSwitcher && (
                                        <div className="dropdown-account-switcher-drawer animation-slide-down">
                                            <div className="account-switcher-header">
                                                <span className="account-switcher-title">Kayıtlı Hesaplar</span>
                                            </div>

                                            {otherAccounts.length > 0 ? (
                                                <div className="saved-accounts-list">
                                                    {otherAccounts.map((acc) => (
                                                        <div 
                                                            key={acc.userId}
                                                            className="saved-account-row"
                                                            onClick={() => {
                                                                setShowMenu(false);
                                                                setShowAccountSwitcher(false);
                                                                switchAccount(acc.userId);
                                                            }}
                                                            title={`@${acc.username} hesabına geçiş yap`}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <UserAvatar
                                                                src={acc.profile?.avatar}
                                                                alt={acc.username}
                                                                size={34}
                                                                className="saved-account-avatar"
                                                            />
                                                            <div className="saved-account-details">
                                                                <span className="saved-account-name">{acc.username}</span>
                                                                <span className="saved-account-action">Geçiş Yap</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="saved-account-remove-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeSavedAccount(acc.userId);
                                                                }}
                                                                title="Bu hesabı listeden kaldır"
                                                                aria-label="Hesabı kaldır"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-saved-accounts-message">
                                                    Başka kayıtlı hesap bulunmuyor
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className="dropdown-add-account-btn"
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowAccountSwitcher(false);
                                                    setShowAddAccountModal(true);
                                                }}
                                            >
                                                <div className="add-account-icon-badge">
                                                    <Plus size={16} />
                                                </div>
                                                <span>Hesap Ekle</span>
                                            </button>
                                        </div>
                                    )}

                                    {(user?.isAdmin || user?.isTouristAdmin || user?.username === 'oxypace') && (
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

            <AddAccountModal
                isOpen={showAddAccountModal}
                onClose={() => setShowAddAccountModal(false)}
            />
        </>
    );
};

export default Navbar;
