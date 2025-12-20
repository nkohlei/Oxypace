import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
import './ShareModal.css';

const ShareModal = ({ postId, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showCopyAlert, setShowCopyAlert] = useState(false);

    useEffect(() => {
        // Initial load of potential contacts (e.g., following or recent conversations)
        // For now, let's just search immediately if query is empty?? 
        // Or wait for input. Let's wait for input like search, or fetch recent conversations.
    }, []);

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
        setSending(true);
        try {
            await axios.post('/api/messages', {
                recipientId: userId,
                postId: postId
            });
            alert('Gönderildi!'); // Consider replacing with a nicer toast later
            onClose();
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

    const handleExternalShare = async () => {
        const url = getShareUrl();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Deepace Post',
                    text: 'Bu gönderiye göz at!',
                    url: url
                });
            } catch (err) {
                console.log('Share canceled:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-header">
                    <h3>Paylaş</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="share-options-grid">
                    <button className="share-option-btn" onClick={handleCopyLink}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        {showCopyAlert ? 'Kopyalandı!' : 'Link\'i Kopyala'}
                    </button>
                    <button className="share-option-btn" onClick={handleExternalShare}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Diğer Uygulamalar
                    </button>
                </div>

                <div className="share-divider">
                    <span>ya da gönder</span>
                </div>

                <div className="share-search">
                    <input
                        type="text"
                        placeholder="Kullanıcı ara..."
                        value={query}
                        onChange={handleInputChange}
                        autoFocus
                    />
                </div>

                <div className="share-results">
                    {loading ? (
                        <div className="spinner-small" style={{ margin: '20px auto', display: 'block' }}></div>
                    ) : results.length === 0 && query ? (
                        <p className="no-results">Kullanıcı bulunamadı</p>
                    ) : (
                        results.map(user => (
                            <div key={user._id} className="share-user-item" onClick={() => handleSend(user._id)}>
                                <div className="user-info">
                                    <img
                                        src={getImageUrl(user.profile?.avatar)}
                                        alt={user.username}
                                        className="user-avatar"
                                    />
                                    <div className="user-text">
                                        <span className="user-name">
                                            {user.profile?.displayName || user.username}
                                            <Badge type={user.verificationBadge} />
                                        </span>
                                        <span className="user-username">@{user.username}</span>
                                    </div>
                                </div>
                                <button
                                    className="send-share-btn"
                                    onClick={(e) => { e.stopPropagation(); handleSend(user._id); }}
                                    disabled={sending}
                                >
                                    {sending ? '...' : 'Gönder'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
