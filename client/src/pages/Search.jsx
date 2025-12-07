import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { getImageUrl } from '../utils/imageUtils';
import './Search.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);

        try {
            const response = await axios.get(`/api/users/search?q=${searchQuery}`);
            setResults(response.data);
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

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
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
                                placeholder="Ara..."
                                value={query}
                                onChange={handleInputChange}
                            />
                            {query && (
                                <button
                                    className="clear-btn"
                                    onClick={() => {
                                        setQuery('');
                                        setResults([]);
                                        setSearched(false);
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

                    {/* Loading */}
                    {loading && (
                        <div className="spinner-container">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && searched && results.length === 0 && (
                        <div className="empty-search">
                            <p>Kullanıcı bulunamadı</p>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && results.length > 0 && (
                        <div className="search-results">
                            {results.map((user) => {
                                const sharePostId = new URLSearchParams(window.location.search).get('sharePostId');
                                const targetLink = sharePostId
                                    ? `/inbox?user=${user.username}&sharePostId=${sharePostId}`
                                    : `/profile/${user.username}`;

                                return (
                                    <Link
                                        key={user._id}
                                        to={targetLink}
                                        className="user-result"
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
                                            </span>
                                            <span className="result-username">@{user.username}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* Initial State */}
                    {!loading && !searched && (
                        <div className="search-suggestions">
                            <p className="suggestion-title">Popüler Aramalar</p>
                            <div className="suggestions-list">
                                <button onClick={() => { setQuery('photo'); handleSearch('photo'); }}>
                                    #photography
                                </button>
                                <button onClick={() => { setQuery('space'); handleSearch('space'); }}>
                                    #space
                                </button>
                                <button onClick={() => { setQuery('nature'); handleSearch('nature'); }}>
                                    #nature
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Search;
