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
    Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { getPostShareUrl, copyTextSafely, systemShare, openExternalShareUrl } from '../utils/shareUtils';
import './ShareModal.css';

const WhatsAppLogo = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5.016L2 22l5.156-1.344a9.926 9.926 0 0 0 4.875 1.281h.004c5.512 0 9.965-4.453 9.965-9.969 0-2.66-1.035-5.16-2.918-7.043A9.898 9.898 0 0 0 12.031 2zm5.828 14.172c-.246.695-1.434 1.328-1.984 1.406-.512.074-1.16.105-1.871-.121-.434-.137-.992-.324-1.707-.633-3.004-1.297-4.965-4.324-5.113-4.523-.148-.199-1.219-1.621-1.219-3.094 0-1.473.773-2.195 1.047-2.496.273-.301.598-.375.797-.375.199 0 .398.004.574.012.184.008.43-.07.672.512.246.598.844 2.066.918 2.215.074.148.125.324.023.523-.098.199-.148.324-.297.496-.148.176-.312.391-.445.523-.148.148-.305.312-.133.609.176.301.777 1.281 1.668 2.074 1.145 1.02 2.109 1.336 2.41 1.484.301.148.477.125.652-.074.176-.199.746-.871.945-1.172.199-.301.398-.25.672-.148.273.098 1.742.82 2.043.969.301.148.5.223.574.348.074.125.074.723-.172 1.418z" />
    </svg>
);

const TelegramLogo = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#26A5E4" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const XLogo = () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const FacebookLogo = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
);

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
        }, 2200);
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
        if (userObj.canMessage === false || userObj.isSystemAccount) return;
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
            showFeedback('Gönderildi.');
            closeTimerRef.current = setTimeout(() => {
                onClose?.();
            }, 750);
        } catch (err) {
            console.error('Failed to send post in DM:', err);
            showFeedback(err.response?.data?.message || 'Gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const handleCopyLink = async () => {
        const ok = await copyTextSafely(shareUrl);
        if (ok) {
            setCopiedLink(true);
            showFeedback('Bağlantı kopyalandı.');
            setTimeout(() => setCopiedLink(false), 2000);
        } else {
            showFeedback('Kopyalanamadı.');
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
                    showFeedback('Bağlantı kopyalandı.');
                }
            }
        } catch {
            const copied = await copyTextSafely(shareUrl);
            if (copied) {
                setCopiedLink(true);
                showFeedback('Bağlantı kopyalandı.');
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
                aria-label="Paylaş"
            >
                <div className="share-sheet-handle" aria-hidden="true" />

                <header className="share-modal-header">
                    <h3>Paylaş</h3>
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
                        <Check size={13} strokeWidth={2.5} />
                        <span>{statusBanner}</span>
                    </div>
                )}

                <div className="share-modal-body">
                    {/* Compact Search */}
                    <div className="share-search-box">
                        <Search size={14} strokeWidth={2} className="share-search-icon" />
                        <input
                            type="text"
                            className="share-search-input"
                            placeholder="Kişi ara..."
                            value={searchQuery}
                            onChange={(e) => handleSearchInput(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="share-search-clear"
                                onClick={() => handleSearchInput('')}
                                aria-label="Temizle"
                            >
                                <X size={13} strokeWidth={2.2} />
                            </button>
                        )}
                    </div>

                    {/* Horizontal Side-by-Side Users (No checkboxes — avatar ring on select) */}
                    <div className="share-users-strip">
                        {loading ? (
                            <div className="share-empty-state">Aranıyor...</div>
                        ) : listToRender.length === 0 ? (
                            <div className="share-empty-state">
                                {isSearching ? 'Kullanıcı bulunamadı.' : 'Kişi ara veya aşağıdan paylaş.'}
                            </div>
                        ) : (
                            listToRender.map((u) => {
                                const isSelected = selectedUsers.some((s) => s._id === u._id);
                                const isRestricted = u.canMessage === false || u.isSystemAccount;
                                const displayName =
                                    u.profile?.displayName || u.profile?.fullName || u.username;
                                return (
                                    <button
                                        key={u._id}
                                        type="button"
                                        disabled={isRestricted}
                                        className={`share-user-chip ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleUserSelection(u)}
                                        title={isRestricted ? (u.dmBlockReason || 'Mesaj gönderilemiyor') : displayName}
                                        style={isRestricted ? { opacity: 0.48, cursor: 'not-allowed' } : undefined}
                                    >
                                        <span className="share-user-avatar-ring" style={{ position: 'relative' }}>
                                            <img
                                                src={getImageUrl(u.profile?.avatar)}
                                                alt={u.username || 'Kullanıcı'}
                                                className="share-user-avatar"
                                            />
                                            {isRestricted && (
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        right: -2,
                                                        bottom: -2,
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#18181b',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#a1a1aa',
                                                    }}
                                                >
                                                    <Lock size={10} />
                                                </span>
                                            )}
                                        </span>
                                        <span className="share-user-name">{displayName}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Send Button (only visible when at least 1 user is selected or just sent) */}
                    {(selectedUsers.length > 0 || sentSuccess) && (
                        <button
                            type="button"
                            className={`share-send-btn ${sentSuccess ? 'is-done' : ''}`}
                            disabled={sending || sentSuccess}
                            onClick={handleSendToFriends}
                        >
                            {sentSuccess ? (
                                <>
                                    <Check size={15} strokeWidth={2.5} />
                                    <span>Gönderildi</span>
                                </>
                            ) : (
                                <>
                                    <Send size={14} strokeWidth={2} />
                                    <span>
                                        {sending ? 'Gönderiliyor...' : `Gönder (${selectedUsers.length})`}
                                    </span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Single Minimal Icon-Only Row: Copy, Native Share + Real App Logos (No text, no frames) */}
                    <div className="share-icon-row">
                        <button
                            type="button"
                            className={`share-icon-btn ${copiedLink ? 'is-done' : ''}`}
                            onClick={handleCopyLink}
                            title="Bağlantıyı Kopyala"
                            aria-label="Bağlantıyı Kopyala"
                        >
                            {copiedLink ? <Check size={20} strokeWidth={2.4} /> : <Link2 size={20} strokeWidth={2} />}
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={handleNativeShare}
                            title="Uygulamalarda Paylaş"
                            aria-label="Uygulamalarda Paylaş"
                        >
                            <Share2 size={20} strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={() => handleExternalShare('whatsapp')}
                            title="WhatsApp"
                            aria-label="WhatsApp"
                        >
                            <WhatsAppLogo />
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={() => handleExternalShare('telegram')}
                            title="Telegram"
                            aria-label="Telegram"
                        >
                            <TelegramLogo />
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={() => handleExternalShare('x')}
                            title="X"
                            aria-label="X"
                        >
                            <XLogo />
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={() => handleExternalShare('facebook')}
                            title="Facebook"
                            aria-label="Facebook"
                        >
                            <FacebookLogo />
                        </button>

                        <button
                            type="button"
                            className="share-icon-btn"
                            onClick={() => handleExternalShare('email')}
                            title="E-posta"
                            aria-label="E-posta"
                        >
                            <Mail size={20} strokeWidth={1.9} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default ShareModal;
