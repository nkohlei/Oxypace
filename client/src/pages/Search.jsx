import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal, Globe, UserCheck, Users, Clock, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { preloadPortals, preloadUsers } from '../utils/preloadUtils';
import Badge from '../components/Badge';
import UserBadges from '../components/UserBadges';
import PortalBadges from '../components/PortalBadges';
import PortalInfoModal from '../components/PortalInfoModal';
import './Search.css';

const getTitleLengthTier = (name = '') => {
    const len = name.trim().length;
    if (len <= 10) return 'short';
    if (len <= 20) return 'medium';
    if (len <= 32) return 'long';
    return 'xlarge';
};

const Search = () => {
    const { user, syncPortalMembership } = useAuth(); // Auth context
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [portalResults, setPortalResults] = useState(() => {
        try {
            const cached = sessionStorage.getItem('oxypace_cached_explore_portals');
            if (cached) {
                const parsed = JSON.parse(cached);
                preloadPortals(parsed);
                return parsed;
            }
        } catch (_) {}
        return [];
    });
    const [selectedPortalForInfo, setSelectedPortalForInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [activeTab, setActiveTab] = useState('portals'); // 'portals' or 'users'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const lastScrollTopRef = useRef(0);
    const searchDebounceRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const scrollEl = document.querySelector('.content-scroll-area');
        const getScrollTop = () => {
            if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
                return scrollEl.scrollTop;
            }
            return window.scrollY || document.documentElement.scrollTop || 0;
        };

        lastScrollTopRef.current = getScrollTop();

        const handleScroll = () => {
            const currentTop = getScrollTop();
            const delta = currentTop - lastScrollTopRef.current;

            if (currentTop <= 16) {
                setIsHeaderHidden(false);
            } else if (Math.abs(delta) >= 6) {
                if (delta > 0 && currentTop > 56) {
                    setIsHeaderHidden(true);
                } else if (delta < 0) {
                    setIsHeaderHidden(false);
                }
            }

            lastScrollTopRef.current = currentTop;
        };

        if (scrollEl) {
            scrollEl.addEventListener('scroll', handleScroll, { passive: true });
        }
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (scrollEl) {
                scrollEl.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, []);

    // Initial load: fetch popular portals
    useEffect(() => {
        if (!query) {
            fetchPortals();
        }
    }, [query]);

    const fetchPortals = async (keyword = '') => {
        if (!keyword && portalResults.length === 0) {
            setLoading(true);
        }
        try {
            const res = await axios.get(`/api/portals?keyword=${keyword}`);
            if (Array.isArray(res.data)) {
                setPortalResults(res.data);
                if (!keyword) {
                    sessionStorage.setItem('oxypace_cached_explore_portals', JSON.stringify(res.data));
                }
                preloadPortals(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setSearched(false);
            setUserResults([]);
            fetchPortals(); // reset to popular
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            // Parallel search - only if user is logged in for users
            const promises = [axios.get(`/api/portals?keyword=${searchQuery}`)];

            if (user) {
                promises.push(axios.get(`/api/users/search?q=${searchQuery}`));
            }

            const results = await Promise.all(promises);
            const portalsRes = results[0];
            const usersRes = user ? results[1] : { data: [] };

            setPortalResults(portalsRes.data);
            setUserResults(usersRes.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinPortal = async (e, portalId, isPrivate) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const res = await axios.post(`/api/portals/${portalId}/join`);
            // Update local state to reflect change
            setPortalResults((prev) =>
                prev.map((p) => {
                    if (p._id === portalId) {
                        if (res.data.status === 'requested') {
                            return { ...p, isRequested: true };
                        } else {
                            return { ...p, isMember: true, memberCount: (p.memberCount || 0) + 1 };
                        }
                    }
                    return p;
                })
            );
            if (user && syncPortalMembership && res.data.status !== 'requested') {
                const targetPortal = portalResults.find((p) => p._id === portalId) || { _id: portalId };
                syncPortalMembership(targetPortal, 'joined');
            }
        } catch (err) {
            console.error('Join failed:', err);
            alert(err.response?.data?.message || 'İşlem başarısız oldu.');
        }
    };

    const handleLeavePortal = async (e, portalId, portalName) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        if (!window.confirm(`"${portalName || 'Portal'}" portaldan ayrılmak istediğinize emin misiniz?`)) {
            return;
        }
        try {
            await axios.post(`/api/portals/${portalId}/leave`);
            // Update local state to reflect change
            setPortalResults((prev) =>
                prev.map((p) => {
                    if (p._id === portalId) {
                        return {
                            ...p,
                            isMember: false,
                            memberCount: Math.max(0, (p.memberCount || 1) - 1),
                        };
                    }
                    return p;
                })
            );
            if (user && syncPortalMembership) {
                syncPortalMembership(portalId, 'left');
            }
        } catch (err) {
            console.error('Leave failed:', err);
            alert(err.response?.data?.message || 'Ayrılma işlemi başarısız oldu.');
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => handleSearch(value), 300);
    };

    const getDefaultBanner = (portal) => {
        return 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)';
    };

    const isUserMemberOfPortal = (targetPortal) => {
        if (!targetPortal) return false;
        if (targetPortal.isMember) return true;
        const currentUserId = user?._id?.toString();
        const ownerId = (targetPortal.owner?._id || targetPortal.owner)?.toString();
        if (currentUserId && ownerId && currentUserId === ownerId) return true;
        if (user && Array.isArray(user.joinedPortals)) {
            const portalIdStr = targetPortal._id?.toString();
            if (user.joinedPortals.some((p) => (p?._id || p)?.toString() === portalIdStr)) {
                return true;
            }
        }
        return false;
    };

    const handlePortalCardClick = (targetPortal) => {
        const isMember = isUserMemberOfPortal(targetPortal);
        const isPrivate = targetPortal.privacy === 'private' || targetPortal.isPrivate === true;

        if (isPrivate && !isMember) {
            setSelectedPortalForInfo(targetPortal);
        } else {
            navigate(`/portal/${targetPortal._id}`);
        }
    };

    return (
        <div className="app-wrapper search-page-wrapper">
            <Navbar />
            <main className="app-content search-main-content">
                <div className="search-container">
                    {/* Search Header */}
                    <div className={`search-header${isHeaderHidden ? ' is-hidden' : ''}`}>
                        <div className="search-controls-row">
                            <div className="search-input-group">
                                <div className="title-with-back">
                                    <button 
                                        className="mobile-back-btn-inline" 
                                        onClick={() => navigate(-1)}
                                        title="Geri"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            width="24"
                                            height="24"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="oxypace-search-input-wrapper">
                                    <svg
                                        className="oxypace-search-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        className="oxypace-search-input"
                                        placeholder={activeTab === 'portals' ? 'Portal ara (isim veya açıklama)...' : 'Kişi ara (isim veya kullanıcı adı)...'}
                                        value={query}
                                        onChange={handleInputChange}
                                    />
                                    {query && (
                                        <button
                                            className="clear-btn"
                                            onClick={() => {
                                                setQuery('');
                                                setSearched(false);
                                                fetchPortals();
                                            }}
                                            title="Temizle"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="search-right-actions">
                                <button
                                    type="button"
                                    className={`search-icon-btn ${isFilterOpen ? 'active' : ''}`}
                                    onClick={() => setIsFilterOpen((prev) => !prev)}
                                    title="Filtrele"
                                    aria-label="Filtrele"
                                    aria-expanded={isFilterOpen}
                                >
                                    <SlidersHorizontal size={18} />
                                </button>
                                <button
                                    type="button"
                                    className="search-icon-btn"
                                    onClick={() => navigate('/map')}
                                    title="Harita"
                                    aria-label="Harita"
                                >
                                    <Globe size={18} />
                                </button>
                            </div>
                        </div>

                        {isFilterOpen && (
                            <div className="search-filter-bar" role="group" aria-label="Arama filtresi">
                                <button
                                    type="button"
                                    className={`search-filter-chip ${activeTab === 'portals' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('portals')}
                                >
                                    Portallar
                                </button>
                                <button
                                    type="button"
                                    className={`search-filter-chip ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('users')}
                                >
                                    Kişiler
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="spinner-container">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && (
                        <div className="search-content">
                            {/* PORTALS TAB - Discord Style Cards */}
                            {activeTab === 'portals' && (
                                <div className="modern-portals-grid">
                                    {portalResults.length === 0 ? (
                                        <div className="empty-search">
                                            <p>Portal bulunamadı.</p>
                                        </div>
                                    ) : (
                                        portalResults.map((portal) => {
                                            const isMember = isUserMemberOfPortal(portal);
                                            const titleTier = getTitleLengthTier(portal.name);
                                            return (
                                            <div
                                                key={portal._id}
                                                className="modern-portal-card"
                                                onClick={() => handlePortalCardClick(portal)}
                                            >
                                                {/* Slim Banner + Overlaid Avatar, Title & Frameless Corner Badges */}
                                                <div
                                                    className="card-banner"
                                                    style={{
                                                        background: portal.banner
                                                            ? `url(${getImageUrl(portal.banner)}) center/cover`
                                                            : getDefaultBanner(portal),
                                                    }}
                                                >
                                                    <div className="card-banner-top-left">
                                                        <span className="banner-member-count" title="Üye">
                                                            <Users size={13} strokeWidth={2.2} />
                                                            <span>{portal.memberCount || 0}</span>
                                                        </span>
                                                    </div>

                                                    {(portal.privacy === 'private' || portal.isNSFW || isMember) && (
                                                        <div className="card-banner-top-right">
                                                            {portal.privacy === 'private' && (
                                                                <span className="banner-privacy-icon" title="Gizli Portal" aria-label="Gizli Portal">
                                                                    <Lock size={13} strokeWidth={2.3} />
                                                                </span>
                                                            )}
                                                            {portal.isNSFW && (
                                                                <span className="banner-nsfw-tag">+18</span>
                                                            )}
                                                            {isMember && (
                                                                <span className="banner-member-icon" title="Üyesiniz" aria-label="Üyesiniz">
                                                                    <UserCheck size={15} strokeWidth={2.4} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="card-banner-overlay">
                                                        <div className="card-icon-wrapper">
                                                            {portal.avatar ? (
                                                                <img
                                                                    src={getImageUrl(portal.avatar)}
                                                                    alt={portal.name}
                                                                    className="card-icon-img"
                                                                    loading="eager"
                                                                    decoding="async"
                                                                    width="36"
                                                                    height="36"
                                                                />
                                                            ) : (
                                                                <div className="card-icon-placeholder">
                                                                    {portal.name
                                                                        .substring(0, 2)
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="card-title-group">
                                                            <h3 className={`card-title title-${titleTier}`}>
                                                                <span className="card-title-text">{portal.name}</span>
                                                                <PortalBadges portal={portal} size={titleTier === 'short' ? 18 : titleTier === 'medium' ? 16 : 14} />
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Slim Single-Row Description Strip */}
                                                <div className="card-body">
                                                    <p className="card-desc" title={portal.description || ''}>
                                                        {portal.description ||
                                                            'Bu topluluk hakkında henüz bir açıklama yok.'}
                                                    </p>

                                                    {!isMember && (
                                                        portal.isRequested ? (
                                                            <button
                                                                className="join-status-btn requested"
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="İstek Gönderildi"
                                                            >
                                                                <Clock size={11} />
                                                                <span>İstek</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className={`join-action-btn ${portal.privacy === 'private' ? 'request' : 'join'}`}
                                                                onClick={(e) =>
                                                                    handleJoinPortal(
                                                                        e,
                                                                        portal._id,
                                                                        portal.privacy === 'private'
                                                                    )
                                                                }
                                                            >
                                                                {portal.privacy === 'private'
                                                                    ? 'İstek'
                                                                    : 'Katıl'}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* USERS TAB */}
                            {activeTab === 'users' && (
                                <div className="users-list">
                                    {!user ? (
                                        <div className="empty-search">
                                            <p>Kişileri aramak için giriş yapmalısınız.</p>
                                            <button
                                                onClick={() => navigate('/login')}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '8px 16px',
                                                    background: 'var(--text-primary)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: 'var(--bg-primary)',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Giriş Yap
                                            </button>
                                        </div>
                                    ) : userResults.length === 0 ? (
                                        <div className="empty-search">
                                            <p>Kullanıcı bulunamadı.</p>
                                        </div>
                                    ) : (
                                        userResults.map((user) => (
                                            <Link
                                                key={user._id}
                                                to={`/profile/${user.username}`}
                                                className="user-result-modern"
                                            >
                                                {user.profile?.avatar ? (
                                                    <img
                                                        src={getImageUrl(user.profile.avatar)}
                                                        alt={user.username}
                                                        className="result-avatar"
                                                        loading="lazy"
                                                        decoding="async"
                                                        width="48"
                                                        height="48"
                                                    />
                                                ) : (
                                                    <div className="result-avatar-placeholder">
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                        >
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="result-info">
                                                    <span className="result-name">
                                                        {user.profile?.displayName || user.username}
                                                        <UserBadges user={user} size={16} />
                                                    </span>
                                                    <span className="result-username">
                                                        @{user.username}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {selectedPortalForInfo && (
                <PortalInfoModal
                    portal={selectedPortalForInfo}
                    onClose={() => setSelectedPortalForInfo(null)}
                    isMobile={window.innerWidth <= 768}
                    onOpenSettings={() => {
                        const pId = selectedPortalForInfo._id;
                        setSelectedPortalForInfo(null);
                        navigate(`/portal/${pId}?openSettings=true`);
                    }}
                    onJoinStatusChange={(status, pId) => {
                        setPortalResults((prev) =>
                            prev.map((p) => {
                                if (p._id === pId) {
                                    if (status === 'requested') {
                                        return { ...p, isRequested: true };
                                    } else if (status === 'joined') {
                                        return { ...p, isMember: true, memberCount: (p.memberCount || 0) + 1 };
                                    }
                                }
                                return p;
                            })
                        );
                    }}
                />
            )}
        </div>
    );
};

export default Search;
