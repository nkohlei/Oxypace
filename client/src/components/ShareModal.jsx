import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    X,
    Search,
    Check,
    Link2,
    Share2,
    Send,
    Mail,
    Users,
    MessageCircle,
    Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { getPostShareUrl, copyTextSafely, systemShare, openExternalShareUrl } from '../utils/shareUtils';
import UserBadges from './UserBadges';
import './ShareModal.css';

const EXTERNAL_PLATFORMS = [
    { id: 'whatsapp', label: 'WhatsApp', short: 'WA' },
    { id: 'telegram', label: 'Telegram', short: 'TG' },
    { id: 'x', label: 'X', short: 'X' },
    { id: 'facebook', label: 'Facebook', short: 'FB' },
    { id: 'email', label: 'E-posta', short: 'mail' },
];

const ShareModal = ({ postId, onClose }) => {
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [statusBanner, setStatusBanner] = useState('');

    const searchTimerRef = useRef(null);
    const feedbackTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

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
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
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
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

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
                setResults(list.filter((u) => u._id !== currentUser?._id));
            } catch (err) {
                console.error('ShareModal user search error:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 240);
    };

    const toggleUserSelection = (userObj) => {
        if (!userObj?._id) return;
        setSelectedUsers((prev) => {
            const exists = prev.some((u) => u._id === userObj._id);
            if (exists) return prev.filter((u) => u._id !== userObj._id);
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
            showFeedback('Gönderi seçilen kişilere iletildi.');
            closeTimerRef.current = setTimeout(() => {
                onClose?.();
            }, 850);
        } catch (err) {
            console.error('Failed to send post in DM:', err);
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
            setTimeout(() => setCopiedLink(false), 2200);
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
        } catch {
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

    const isSearching = searchQuery.trim().length > 0;
    const listToRender = isSearching ? results : friends;
    const displayUrl = shareUrl.replace(/^https?:\/\//i, '');

    const modalContent = (
        <div
            className="share-modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="share-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Gönderiyi Paylaş"
            >
                <div className="share-sheet-handle" aria-hidden="true" />

                <header className="share-modal-header">
                    <div className="share-header-title">
                        <Share2 size={17} strokeWidth={2} />
                        <h3>Gönderiyi Paylaş</h3>
                    </div>
                    <button
                        type="button"
                        className="share-close-btn"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                {statusBanner && (
                    <div className="share-feedback-banner" role="status">
                        <Check size={14} strokeWidth={2.5} />
                        <span>{statusBanner}</span>
                    </div>
                )}

                <div className="share-modal-body custom-scrollbar">
                    {/* 1. Hızlı Bağlantı ve Sistem Paylaşımı */}
                    <section className="share-section share-quick-card">
                        <div className="share-link-preview-row">
                            <Link2 size={14} strokeWidth={2} className="share-link-icon" />
                            <span className="share-link-url" title={shareUrl}>
                                {displayUrl}
                            </span>
                        </div>

                        <div className="share-primary-actions">
                            <button
                                type="button"
                                className={`share-action-pill primary ${copiedLink ? 'is-done' : ''}`}
                                onClick={handleCopyLink}
                            >
                                {copiedLink ? <Check size={15} strokeWidth={2.4} /> : <Link2 size={15} strokeWidth={2} />}
                                <span>{copiedLink ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}</span>
                            </button>

                            <button
                                type="button"
                                className="share-action-pill"
                                onClick={handleNativeShare}
                            >
                                <Share2 size={15} strokeWidth={2} />
                                <span>Uygulamalarda Paylaş</span>
                            </button>
                        </div>

                        <div className="share-external-grid">
                            {EXTERNAL_PLATFORMS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="share-external-tile"
                                    onClick={() => handleExternalShare(item.id)}
                                >
                                    <span className="share-external-glyph" aria-hidden="true">
                                        {item.id === 'email' ? (
                                            <Mail size={15} strokeWidth={1.9} />
                                        ) : item.id === 'whatsapp' ? (
                                            <MessageCircle size={15} strokeWidth={1.9} />
                                        ) : item.id === 'facebook' ? (
                                            <Globe size={15} strokeWidth={1.9} />
                                        ) : (
                                            item.short
                                        )}
                                    </span>
                                    <span className="share-external-label">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. Direkt Mesaj / Arkadaş Listesi */}
                    <section className="share-section share-friends-section">
                        <div className="share-section-row">
                            <span className="share-section-label">
                                <Users size={13} strokeWidth={2} />
                                <span>Arkadaşına Mesaj Olarak Gönder</span>
                            </span>
                            {selectedUsers.length > 0 && (
                                <span className="share-selected-counter">{selectedUsers.length} seçili</span>
                            )}
                        </div>

                        <div className="share-search-box">
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
                                    <X size={13} strokeWidth={2.2} />
                                </button>
                            )}
                        </div>

                        <div className="share-friends-scroll custom-scrollbar">
                            {loading ? (
                                <div className="share-empty-state">Kullanıcılar aranıyor...</div>
                            ) : listToRender.length === 0 ? (
                                <div className="share-empty-state">
                                    {isSearching
                                        ? 'Aramanla eşleşen kullanıcı bulunamadı.'
                                        : 'Henüz arkadaşın yok. Yukarıdan kullanıcı arayabilirsin.'}
                                </div>
                            ) : (
                                listToRender.map((u) => {
                                    const isSelected = selectedUsers.some((s) => s._id === u._id);
                                    const displayName =
                                        u.profile?.displayName || u.profile?.fullName || u.username;
                                    return (
                                        <button
                                            key={u._id}
                                            type="button"
                                            className={`share-friend-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleUserSelection(u)}
                                        >
                                            <div className="share-friend-left">
                                                <img
                                                    src={getImageUrl(u.profile?.avatar)}
                                                    alt={u.username || 'Kullanıcı'}
                                                    className="share-friend-avatar"
                                                />
                                                <div className="share-friend-meta">
                                                    <span className="share-friend-name-line">
                                                        <span className="share-friend-display">{displayName}</span>
                                                        <UserBadges user={u} size={13} />
                                                    </span>
                                                    <span className="share-friend-handle">@{u.username}</span>
                                                </div>
                                            </div>
                                            <span className={`share-check-box ${isSelected ? 'checked' : ''}`}>
                                                {isSelected && <Check size={13} strokeWidth={2.8} />}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                <footer className="share-modal-footer">
                    <button
                        type="button"
                        className={`share-send-btn ${sentSuccess ? 'is-done' : ''}`}
                        disabled={selectedUsers.length === 0 || sending || sentSuccess}
                        onClick={handleSendToFriends}
                    >
                        {sentSuccess ? (
                            <>
                                <Check size={16} strokeWidth={2.5} />
                                <span>Gönderildi</span>
                            </>
                        ) : (
                            <>
                                <Send size={15} strokeWidth={2} />
                                <span>
                                    {sending
                                        ? 'Gönderiliyor...'
                                        : selectedUsers.length > 0
                                            ? `Mesaj Olarak Gönder (${selectedUsers.length})`
                                            : 'Göndermek İçin Kişi Seç'}
                                </span>
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default ShareModal;
