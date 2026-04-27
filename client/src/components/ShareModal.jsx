import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';
import { X, Link2, Share2, MessageCircle, Twitter, Facebook, Mail } from 'lucide-react';
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
                        <X size={24} strokeWidth={2} />
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
                                <Link2 size={24} strokeWidth={2} />
                            </div>
                            <span>{showCopyAlert ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>

                        <button className="share-app-item" onClick={handleSystemShare}>
                            <div className="app-icon-circle">
                                <Share2 size={24} strokeWidth={2} />
                            </div>
                            <span>Diğer</span>
                        </button>

                        <button className="share-app-item" onClick={shareToWhatsapp}>
                            <div className="app-icon-circle">
                                <MessageCircle size={24} strokeWidth={2} />
                            </div>
                            <span>WhatsApp</span>
                        </button>

                        <button className="share-app-item" onClick={shareToTwitter}>
                            <div className="app-icon-circle">
                                <Twitter size={24} strokeWidth={2} />
                            </div>
                            <span>X</span>
                        </button>

                        <button className="share-app-item" onClick={shareToFacebook}>
                            <div className="app-icon-circle">
                                <Facebook size={24} strokeWidth={2} />
                            </div>
                            <span>Facebook</span>
                        </button>

                        <button className="share-app-item" onClick={shareToEmail}>
                            <div className="app-icon-circle">
                                <Mail size={24} strokeWidth={2} />
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
