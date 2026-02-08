import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import './ShareModal.css';

const ShareModal = ({ postId, onClose }) => {
    const { user: currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]); // Search results
    const [followers, setFollowers] = useState([]); // Followers list
    const [loading, setLoading] = useState(false);
    const [sendingMap, setSendingMap] = useState({}); // Track sending state per user
    const [showCopyAlert, setShowCopyAlert] = useState(false);

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        // Fetch following/followers to suggest (Using 'following' mostly makes sense for share, but user said followers)
        // Actually, you usually share to people you follow or who follow you (Mutuals).
        // Let's fetch followers as requested by the user prompt "mevcut takipçilerden oluşacak"
        if (currentUser) {
            fetchFollowers();
        }
    }, [currentUser]);

    const fetchFollowers = async () => {
        try {
            // Using logic: Get users that follow me? Or users I follow?
            // "Takipçilerden" usually means followers, but for sharing, you usually share to friends (following).
            // Let's stick to "Followers" as explicitly requested.
            // But wait, the API I checked was `/:id/followers`.
            const response = await axios.get(`/api/users/${currentUser._id}/followers`);
            setFollowers(response.data);
        } catch (error) {
            console.error('Failed to fetch followers', error);
        }
    };

    const handleSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
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
        const timeoutId = setTimeout(() => handleSearch(value), 300);
        return () => clearTimeout(timeoutId);
    };

    const handleSend = async (userId) => {
        setSendingMap((prev) => ({ ...prev, [userId]: true }));
        try {
            await axios.post('/api/messages', {
                recipientId: userId,
                postId: postId,
            });
            // Show a mini success indicator or toast? For now, button change is enough or global toast.
            // Let's toggle state back after a delay to show "Sent"
            setTimeout(() => {
                setSendingMap((prev) => ({ ...prev, [userId]: false }));
                alert('Gönderildi'); // Keep explicit alert or remove for smoother UX? User didn't specify. Keeping alert for feedback.
                onClose();
            }, 500);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Gönderilemedi.');
            setSendingMap((prev) => ({ ...prev, [userId]: false }));
        }
    };

    const getShareUrl = () => {
        return `${window.location.origin}/post/${postId}`;
    };

    const handleCopyLink = () => {
        const url = getShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            setShowCopyAlert(true);
            setTimeout(() => setShowCopyAlert(false), 2000);
        });
    };

    // External Share Helpers
    const shareToWhatsapp = () => {
        const url = getShareUrl();
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
    };

    const shareToTwitter = () => {
        const url = getShareUrl();
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareToFacebook = () => {
        const url = getShareUrl();
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank'
        );
    };

    const shareToEmail = () => {
        const url = getShareUrl();
        window.location.href = `mailto:?subject=Deepace Post&body=${encodeURIComponent(url)}`;
    };

    const handleSystemShare = async () => {
        const url = getShareUrl();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Deepace Post',
                    text: 'Check this out!',
                    url: url,
                });
            } catch (err) {
                console.log('Share canceled:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    const showSearchResults = query.length > 0;
    const listToRender = showSearchResults ? results : followers;

    return createPortal(
        <div
            className="share-modal-overlay"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-header">
                    <button onClick={onClose} className="close-btn">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <h3>Paylaş</h3>
                    <div style={{ width: 32 }}></div> {/* Spacer for centering */}
                </div>

                <div className="share-search">
                    <input
                        type="text"
                        placeholder="Ara"
                        value={query}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="share-results">
                    {loading ? (
                        <div
                            className="spinner-small"
                            style={{ margin: '20px auto', display: 'block' }}
                        ></div>
                    ) : listToRender.length === 0 ? (
                        <p className="no-results">
                            {showSearchResults ? 'Kullanıcı bulunamadı' : 'Takipçi bulunamadı'}
                        </p>
                    ) : showSearchResults ? (
                        /* List Layout for Search */
                        <div className="share-list">
                            {results.map((user) => (
                                <div
                                    key={user._id}
                                    className="share-user-item"
                                    onClick={() => handleSend(user._id)}
                                >
                                    <div className="user-info">
                                        <img
                                            src={getImageUrl(user.profile?.avatar)}
                                            alt={user.username}
                                            className="user-avatar"
                                        />
                                        <div className="user-text">
                                            <span className="user-name">
                                                {user.profile?.displayName || user.username}{' '}
                                                <Badge type={user.verificationBadge} />
                                            </span>
                                            <span className="user-username">@{user.username}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="send-share-btn"
                                        disabled={sendingMap[user._id]}
                                    >
                                        {sendingMap[user._id] ? '...' : 'Gönder'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Grid Layout for Followers */
                        <div className="share-grid">
                            {followers.map((user) => (
                                <div
                                    key={user._id}
                                    className="share-user-card"
                                    onClick={() => handleSend(user._id)}
                                >
                                    <div className="avatar-wrapper">
                                        <img
                                            src={getImageUrl(user.profile?.avatar)}
                                            alt={user.username}
                                            className="user-avatar"
                                        />
                                    </div>
                                    <span className="user-name">
                                        {user.profile?.displayName || user.username}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Apps */}
                <div className="share-footer">
                    <div className="share-apps-row">
                        <button className="share-app-item" onClick={handleCopyLink}>
                            <div className="app-icon-circle">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                            </div>
                            <span>{showCopyAlert ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>

                        <button className="share-app-item" onClick={handleSystemShare}>
                            <div className="app-icon-circle">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                            </div>
                            <span>Diğer</span>
                        </button>

                        <button className="share-app-item" onClick={shareToWhatsapp}>
                            <div className="app-icon-circle">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </div>
                            <span>WhatsApp</span>
                        </button>

                        <button className="share-app-item" onClick={shareToTwitter}>
                            <div className="app-icon-circle">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                </svg>
                            </div>
                            <span>X</span>
                        </button>

                        <button className="share-app-item" onClick={shareToFacebook}>
                            <div className="app-icon-circle">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </div>
                            <span>Facebook</span>
                        </button>

                        <button className="share-app-item" onClick={shareToEmail}>
                            <div className="app-icon-circle">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <span>Email</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShareModal;
