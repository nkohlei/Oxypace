import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Search, Check, Link2, Share2, Send, Mail, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { getPostShareUrl, copyTextSafely, systemShare, openExternalShareUrl } from '../utils/shareUtils';
import UserBadges from './UserBadges';
import './ShareModal.css';

const ShareModal = ({ postId, onClose }) => {
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]); // Store full user objects for easy lookup
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [statusBanner, setStatusBanner] = useState('');

    const searchTimerRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    const friends = currentUser?.friends || [];
    const shareUrl = getPostShareUrl(postId);
    const shareLeadText = 'Oxypace üzerinde bu gönderiye göz at:';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        };
    }, [onClose]);

    const showFeedback = (msg) => {
        setStatusBanner(msg);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
            setStatusBanner('');
        }, 2600);
    };

    const handleSearchInput = (value) => {
        setSearchQuery(value);
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        const trimmed = value.trim();
        if (!trimmed) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const response = await axios.get(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
                const list = Array.isArray(response.data) ? response.data : [];
                setResults(list.filter((u) => u && u._id !== currentUser?._id));
            } catch (err) {
                console.error('[ShareModal] Search failed:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 320);
    };

    const toggleSelectUser = (userObj) => {
        if (!userObj?._id) return;
        setSelectedUsers((prev) => {
            const exists = prev.some((u) => u._id === userObj._id);
            if (exists) {
                return prev.filter((u) => u._id !== userObj._id);
            }
            return [...prev, userObj];
        });
    };

    const handleSendToFriends = async () => {
        if (selectedUsers.length === 0 || sending) return;
        setSending(true);
        try {
            await Promise.all(
                selectedUsers.map((recipient) =>
                    axios.post('/api/messages', {
                        recipientId: recipient._id,
                        postId,
                    })
                )
            );
            setSentSuccess(true);
            feedbackTimerRef.current = setTimeout(() => {
                onClose?.();
            }, 1300);
        } catch (err) {
            console.error('[ShareModal] DM share failed:', err);
            showFeedback(err.response?.data?.message || 'Gönderilemedi. Lütfen tekrar dene.');
        } finally {
            setSending(false);
        }
    };

    const handleCopyLink = async () => {
        const ok = await copyTextSafely(shareUrl);
        if (ok) {
            setCopiedLink(true);
            showFeedback('Bağlantı panoya kopyalandı.');
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = setTimeout(() => {
                setCopiedLink(false);
                setStatusBanner('');
            }, 2200);
        } else {
            showFeedback('Bağlantı kopyalanamadı.');
        }
    };

    const handleNativeShare = async () => {
        try {
            const res = await systemShare({
                title: 'Oxypace',
                text: shareLeadText,
                url: shareUrl,
                dialogTitle: 'Oxypace Gönderisini Paylaş',
            });
            if (!res.shared && !res.cancelled) {
                const copied = await copyTextSafely(shareUrl);
                if (copied) {
                    setCopiedLink(true);
                    showFeedback('Sistem paylaşımı desteklenmiyor, bağlantı kopyalandı.');
                }
            }
        } catch (err) {
            console.error('[ShareModal] System share failed:', err);
            const copied = await copyTextSafely(shareUrl);
            if (copied) {
                setCopiedLink(true);
                showFeedback('Bağlantı panoya kopyalandı.');
            }
        }
    };

    const handleExternalShare = (platform) => {
        const fullMessage = `${shareLeadText} ${shareUrl}`;
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedMsg = encodeURIComponent(fullMessage);
        const encodedLead = encodeURIComponent(shareLeadText);

        switch (platform) {
            case 'whatsapp':
                openExternalShareUrl(`https://wa.me/?text=${encodedMsg}`);
                break;
            case 'telegram':
                openExternalShareUrl(`https://t.me/share/url?url=${encodedUrl}&text=${encodedLead}`);
                break;
            case 'x':
                openExternalShareUrl(`https://twitter.com/intent/tweet?text=${encodedLead}&url=${encodedUrl}`);
                break;
            case 'facebook':
                openExternalShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
                break;
            case 'email':
                openExternalShareUrl(`mailto:?subject=${encodeURIComponent('Oxypace Gönderisi')}&body=${encodedMsg}`);
                break;
            default:
                break;
        }
    };

    const trimmedQuery = searchQuery.trim();
    const isSearching = trimmedQuery.length > 0;
    const listToRender = isSearching ? results : friends;

    return (
        <div className="share-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Gönderiyi Paylaş">
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <header className="share-modal-header">
                    <div className="share-modal-title-group">
                        <span className="share-modal-eyebrow">OXYPACE PAYLAŞIM</span>
                        <h3 className="share-modal-heading">Gönderiyi Paylaş</h3>
                    </div>
                    <button
                        type="button"
                        className="share-modal-close-btn"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className="share-modal-body">
                    {statusBanner && (
                        <div className="share-status-banner" role="status">
                            {statusBanner}
                        </div>
                    )}

                    {/* Direct Link Box */}
                    <section className="share-section">
                        <div className="share-link-box">
                            <div className="share-link-icon-wrap">
                                <Link2 size={16} strokeWidth={2} />
                            </div>
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="share-link-readonly"
                                onClick={(e) => e.target.select()}
                                aria-label="Gönderi bağlantısı"
                            />
                            <button
                                type="button"
                                className={`share-link-copy-btn ${copiedLink ? 'is-copied' : ''}`}
                                onClick={handleCopyLink}
                            >
                                {copiedLink ? (
                                    <>
                                        <Check size={14} strokeWidth={2.5} />
                                        <span>Kopyalandı</span>
                                    </>
                                ) : (
                                    <span>Kopyala</span>
                                )}
                            </button>
                        </div>
                    </section>

                    {/* External Share Targets */}
                    <section className="share-section">
                        <div className="share-section-label">Harici Paylaşım</div>
                        <div className="share-targets-grid">
                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={handleNativeShare}
                            >
                                <span className="share-target-icon">
                                    <Share2 size={18} strokeWidth={1.9} />
                                </span>
                                <span className="share-target-name">Sistem</span>
                            </button>

                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={() => handleExternalShare('whatsapp')}
                            >
                                <span className="share-target-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                </span>
                                <span className="share-target-name">WhatsApp</span>
                            </button>

                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={() => handleExternalShare('telegram')}
                            >
                                <span className="share-target-icon">
                                    <Send size={17} strokeWidth={1.9} />
                                </span>
                                <span className="share-target-name">Telegram</span>
                            </button>

                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={() => handleExternalShare('x')}
                            >
                                <span className="share-target-icon">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </span>
                                <span className="share-target-name">X</span>
                            </button>

                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={() => handleExternalShare('facebook')}
                            >
                                <span className="share-target-icon">
                                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                                        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                                    </svg>
                                </span>
                                <span className="share-target-name">Facebook</span>
                            </button>

                            <button
                                type="button"
                                className="share-target-tile"
                                onClick={() => handleExternalShare('email')}
                            >
                                <span className="share-target-icon">
                                    <Mail size={17} strokeWidth={1.9} />
                                </span>
                                <span className="share-target-name">E-posta</span>
                            </button>
                        </div>
                    </section>

                    {/* Direct Message / Friends */}
                    <section className="share-section share-friends-section">
                        <div className="share-section-row">
                            <span className="share-section-label">
                                <Users size={13} strokeWidth={2} />
                                <span>Arkadaşa Mesaj Olarak Gönder</span>
                            </span>
                            {selectedUsers.length > 0 && (
                                <span className="share-selected-count">
                                    {selectedUsers.length} seçili
                                </span>
                            )}
                        </div>

                        <div className="share-search-field">
                            <Search size={15} strokeWidth={2} className="share-search-icon" />
                            <input
                                type="text"
                                className="share-search-input"
                                placeholder="Kullanıcı adı veya isim ara..."
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="share-search-clear"
                                    onClick={() => handleSearchInput('')}
                                    aria-label="Aramayı temizle"
                                >
                                    <X size={14} strokeWidth={2} />
                                </button>
                            )}
                        </div>

                        <div className="share-friends-scroll custom-scrollbar">
                            {loading ? (
                                <div className="share-empty-state">Kullanıcılar aranıyor...</div>
                            ) : listToRender.length === 0 ? (
                                <div className="share-empty-state">
                                    {isSearching
                                        ? 'Aramanızla eşleşen kullanıcı bulunamadı.'
                                        : 'Henüz arkadaş listenizde kişi yok. Yukarıdan kullanıcı arayabilirsiniz.'}
                                </div>
                            ) : (
                                <div className="share-user-list">
                                    {listToRender.map((u) => {
                                        const isSelected = selectedUsers.some((s) => s._id === u._id);
                                        return (
                                            <button
                                                key={u._id}
                                                type="button"
                                                className={`share-user-row ${isSelected ? 'is-selected' : ''}`}
                                                onClick={() => toggleSelectUser(u)}
                                            >
                                                <div className="share-user-avatar-wrap">
                                                    {u.profileImage ? (
                                                        <img
                                                            src={getImageUrl(u.profileImage)}
                                                            alt={u.username || 'Kullanıcı'}
                                                            className="share-user-avatar-img"
                                                        />
                                                    ) : (
                                                        <span className="share-user-avatar-fallback">
                                                            {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="share-user-meta">
                                                    <span className="share-user-name">
                                                        {u.displayName || u.username}
                                                        <UserBadges
                                                            badgeType={u.badgeType}
                                                            verificationBadge={u.verificationBadge}
                                                            size={13}
                                                        />
                                                    </span>
                                                    <span className="share-user-handle">@{u.username}</span>
                                                </div>
                                                <span className={`share-user-check ${isSelected ? 'is-selected' : ''}`}>
                                                    {isSelected && <Check size={13} strokeWidth={2.8} />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <footer className="share-modal-footer">
                    <button
                        type="button"
                        className="share-cancel-btn"
                        onClick={onClose}
                    >
                        İptal
                    </button>
                    <button
                        type="button"
                        className={`share-send-btn ${sentSuccess ? 'is-sent' : ''}`}
                        disabled={selectedUsers.length === 0 || sending || sentSuccess}
                        onClick={handleSendToFriends}
                    >
                        {sentSuccess ? (
                            <>
                                <Check size={16} strokeWidth={2.4} />
                                <span>Gönderildi</span>
                            </>
                        ) : sending ? (
                            <span>Gönderiliyor...</span>
                        ) : (
                            <>
                                <Send size={15} strokeWidth={2} />
                                <span>
                                    {selectedUsers.length > 0
                                        ? `Gönder (${selectedUsers.length})`
                                        : 'Kişi Seç'}
                                </span>
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ShareModal;
