import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { getImageUrl } from '../utils/imageUtils';
import Badge from '../components/Badge';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [portalResults, setPortalResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [activeTab, setActiveTab] = useState('portals'); // 'portals' or 'users'
    const navigate = useNavigate();

    // Initial load: fetch popular portals
    useEffect(() => {
        if (!query) {
            fetchPortals();
        }
    }, [query]);

    const fetchPortals = async (keyword = '') => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/portals?keyword=${keyword}`);
            // If API doesn't return member count, we might need a better endpoint, 
            // but assuming it returns basic portal objects.
            setPortalResults(res.data);
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
            // Parallel search
            const [usersRes, portalsRes] = await Promise.all([
                axios.get(`/api/users/search?q=${searchQuery}`),
                axios.get(`/api/portals?keyword=${searchQuery}`)
            ]);

            setUserResults(usersRes.data);
            setPortalResults(portalsRes.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        // Debounced search
        const timeoutId = setTimeout(() => handleSearch(value), 300);
        return () => clearTimeout(timeoutId);
    };

    const getDefaultBanner = (portal) => {
        // Generate a gradient based on portal ID or theme color
        // Simple placeholder for now
        return 'linear-gradient(45deg, #4f46e5, #9333ea)';
    };

    return (
        <div className="app-wrapper search-page-wrapper">
            <Navbar />
            <main className="app-content search-main-content">
                <div className="search-container">
                    {/* Search Header */}
                    <div className="search-header">
                        <div className="search-input-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Portal veya kişi ara..."
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
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Modern Tabs */}
                    <div className="modern-tabs">
                        <button
                            className={`modern-tab ${activeTab === 'portals' ? 'active' : ''}`}
                            onClick={() => setActiveTab('portals')}
                        >
                            Portallar
                        </button>
                        <button
                            className={`modern-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Kişiler
                        </button>
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
                                        <div className="empty-search"><p>Portal bulunamadı.</p></div>
                                    ) : (
                                        portalResults.map(portal => (
                                            <div
                                                key={portal._id}
                                                className="modern-portal-card"
                                                onClick={() => navigate(`/portal/${portal._id}`)}
                                            >
                                                {/* Banner */}
                                                <div
                                                    className="card-banner"
                                                    style={{
                                                        background: portal.banner ? `url(${getImageUrl(portal.banner)}) center/cover` : getDefaultBanner(portal)
                                                    }}
                                                >
                                                </div>

                                                {/* Icon (overlapping) */}
                                                <div className="card-icon-wrapper">
                                                    {portal.avatar ? (
                                                        <img src={getImageUrl(portal.avatar)} alt={portal.name} className="card-icon-img" />
                                                    ) : (
                                                        <div className="card-icon-placeholder">
                                                            {portal.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="card-body">
                                                    <h3 className="card-title">
                                                        {portal.name}
                                                        {portal.privacy === 'private' && (
                                                            <span className="private-badge">🔒</span>
                                                        )}
                                                    </h3>
                                                    <p className="card-desc">
                                                        {portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.'}
                                                    </p>

                                                    <div className="card-footer">
                                                        <div className="member-count">
                                                            <div className="status-dot"></div>
                                                            <span>{portal.members?.length || 0} Üye</span>
                                                        </div>
                                                        {/* 'View' button implicit by card click, maybe visually hint? */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* USERS TAB */}
                            {activeTab === 'users' && (
                                <div className="users-list">
                                    {userResults.length === 0 ? (
                                        <div className="empty-search"><p>Kullanıcı bulunamadı.</p></div>
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
                                                    />
                                                ) : (
                                                    <div className="result-avatar-placeholder">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                            <circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="result-info">
                                                    <span className="result-name">
                                                        {user.profile?.displayName || user.username}
                                                        <Badge type={user.verificationBadge} />
                                                    </span>
                                                    <span className="result-username">@{user.username}</span>
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
        </div>
    );
};

export default Search;
