import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import UserBadges from './UserBadges';
import { useAuth } from '../context/AuthContext';
import { X, Link2, Share2, MessageCircle, Twitter, Facebook, Mail } from 'lucide-react';
import './ShareModal.css';
import { Capacitor } from '@capacitor/core';

const ShareModal = ({ postId, onClose }) => {
    const { user: currentUser } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]); // Search results
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showCopyAlert, setShowCopyAlert] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const friends = currentUser?.friends || [];

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

    const toggleSelectUser = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSendMultiple = async () => {
        if (selectedUsers.length === 0) return;
        setSending(true);
        try {
            await Promise.all(
                selectedUsers.map((userId) =>
                    axios.post('/api/messages', {
                        recipientId: userId,
                        postId: postId,
                    })
                )
            );
            setSentSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Gönderilemedi.');
        } finally {
            setSending(false);
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

    // Open native app via custom URI scheme with web fallback
    const openAppOrWeb = (appUri, webUrl) => {
        if (Capacitor.isNativePlatform()) {
            // Force external system app or system browser launch using target='_system'
            window.open(appUri, '_system');
            
            // Fallback to web URL in system browser (Chrome) if app is not installed
            const fallbackTimer = setTimeout(() => {
                window.open(webUrl, '_system');
            }, 1200);
            
            const clearTimer = () => {
                clearTimeout(fallbackTimer);
                window.removeEventListener('blur', clearTimer);
            };
            window.addEventListener('blur', clearTimer);
        } else {
            window.open(webUrl, '_blank');
        }
    };

    // External Share Helpers
    const shareToWhatsapp = () => {
        const url = getShareUrl();
        openAppOrWeb(
            `whatsapp://send?text=${encodeURIComponent(url)}`,
            `https://wa.me/?text=${encodeURIComponent(url)}`
        );
    };

    const shareToTwitter = () => {
        const url = getShareUrl();
        openAppOrWeb(
            `twitter://post?message=${encodeURIComponent(url)}`,
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`
        );
    };

    const shareToFacebook = () => {
        const url = getShareUrl();
        openAppOrWeb(
            `fb://facewebmodal/f?href=${encodeURIComponent(url)}`,
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        );
    };

    const shareToEmail = () => {
        const url = getShareUrl();
        window.location.href = `mailto:?subject=Oxypace Post&body=${encodeURIComponent(url)}`;
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
    const listToRender = showSearchResults ? results : friends;

    if (sentSuccess) {
        return createPortal(
            <div className="share-modal-overlay" onClick={onClose}>
                <div className="share-modal success-state" onClick={(e) => e.stopPropagation()}>
                    <div className="success-content">
                        <div className="success-icon-circle">
                            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                        </div>
                        <h2>Gönderildi</h2>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

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
                            {showSearchResults ? 'Kullanıcı bulunamadı' : 'Arkadaş bulunamadı'}
                        </p>
                    ) : showSearchResults ? (
                        /* List Layout for Search */
                        <div className="share-list">
                            {results.map((user) => {
                                const isSelected = selectedUsers.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        className={`share-user-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelectUser(user._id)}
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
                                                    <UserBadges user={user} size={14} />
                                                </span>
                                                <span className="user-username">@{user.username}</span>
                                            </div>
                                        </div>
                                        <button
                                            className={`send-share-btn ${isSelected ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelectUser(user._id);
                                            }}
                                        >
                                            {isSelected ? 'Seçildi' : 'Seç'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Grid Layout for Friends */
                        <div className="share-grid">
                            {friends.map((user) => {
                                const isSelected = selectedUsers.includes(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        className={`share-user-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelectUser(user._id)}
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
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedUsers.length > 0 && (
                    <div className="share-action-container">
                        <button className="share-submit-btn" onClick={handleSendMultiple} disabled={sending}>
                            {sending ? 'Gönderiliyor...' : `Gönder (${selectedUsers.length})`}
                        </button>
                    </div>
                )}

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
