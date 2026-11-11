import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { getPortalShareUrl, copyTextSafely } from '../utils/shareUtils';
import { Check, Copy, Link2, Search, UserPlus, X } from 'lucide-react';
import './InviteUserModal.css';

const InviteUserModal = ({ portalId, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState(new Set());
    const [copiedLink, setCopiedLink] = useState(false);
    const [statusBanner, setStatusBanner] = useState(null);
    const feedbackTimerRef = useRef(null);

    const inviteUrl = getPortalShareUrl(portalId);

    const showFeedback = (text, type = 'success') => {
        setStatusBanner({ text, type });
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
            setStatusBanner(null);
        }, 2600);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        };
    }, [onClose]);

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timeoutId = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
                setResults(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Search error', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 320);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleInvite = async (userId) => {
        try {
            await Promise.all([
                axios.post(`/api/portals/${portalId}/invite`, { userId }),
                axios.post('/api/messages', {
                    recipientId: userId,
                    portalId,
                    content: 'Seni bir portala davet ettim!',
                }),
            ]);
            setInvitedUsers((prev) => new Set(prev).add(userId));
            showFeedback('Portal daveti gönderildi.');
        } catch (err) {
            console.error('Invite failed:', err.response?.data || err);
            showFeedback(err.response?.data?.message || 'Davet gönderilemedi.', 'error');
        }
    };

    const handleCopyLink = async () => {
        const copied = await copyTextSafely(inviteUrl);
        if (copied) {
            setCopiedLink(true);
            showFeedback('Davet bağlantısı panoya kopyalandı.');
            setTimeout(() => setCopiedLink(false), 2200);
        } else {
            showFeedback('Bağlantı kopyalanamadı.', 'error');
        }
    };

    const modalContent = (
        <div
            className="invite-modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="invite-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Kullanıcı Davet Et"
            >
                <header className="invite-header">
                    <div className="invite-header-title">
                        <UserPlus size={17} strokeWidth={2} />
                        <h2>Kullanıcı Davet Et</h2>
                    </div>
                    <button
                        type="button"
                        className="invite-close-btn"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                {statusBanner && (
                    <div
                        className={`invite-feedback-banner ${statusBanner.type === 'error' ? 'is-error' : ''}`}
                        role="status"
                    >
                        <span>{statusBanner.text}</span>
                    </div>
                )}

                <div className="invite-link-card">
                    <div className="invite-link-meta">
                        <span className="invite-link-title">
                            <Link2 size={13} strokeWidth={2} />
                            <span>Portal Davet Bağlantısı</span>
                        </span>
                        <span className="invite-link-url" title={inviteUrl}>
                            {inviteUrl.replace(/^https?:\/\//i, '')}
                        </span>
                    </div>
                    <button
                        type="button"
                        className={`invite-copy-link-btn ${copiedLink ? 'is-done' : ''}`}
                        onClick={handleCopyLink}
                    >
                        {copiedLink ? <Check size={14} strokeWidth={2.4} /> : <Copy size={14} strokeWidth={2} />}
                        <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                </div>

                <div className="invite-search-container">
                    <Search size={15} strokeWidth={2} className="invite-search-icon" />
                    <input
                        type="text"
                        placeholder="Kullanıcı adı ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="invite-search-clear"
                            onClick={() => setSearchQuery('')}
                            aria-label="Temizle"
                        >
                            <X size={13} strokeWidth={2.2} />
                        </button>
                    )}
                </div>

                <div className="invite-results custom-scrollbar">
                    {loading && <div className="invite-state-text">Aranıyor...</div>}
                    {!loading && results.length === 0 && searchQuery.trim().length > 0 && (
                        <div className="invite-state-text">Kullanıcı bulunamadı.</div>
                    )}
                    {!loading && searchQuery.trim().length === 0 && (
                        <div className="invite-state-text">
                            Davet etmek istediğin kişinin kullanıcı adını yaz.
                        </div>
                    )}

                    {results.map((user) => {
                        const userId = user._id || user;
                        const isInvited = invitedUsers.has(userId);
                        const fullName = user.profile?.fullName || user.profile?.displayName;

                        return (
                            <div key={userId} className="invite-user-row">
                                <div className="invite-user-info">
                                    <img
                                        src={getImageUrl(user.profile?.avatar)}
                                        alt={user.username || 'Kullanıcı'}
                                        className="invite-avatar"
                                    />
                                    <div className="invite-user-meta">
                                        <span className="invite-user-name">
                                            {fullName || user.username}
                                        </span>
                                        {fullName && (
                                            <span className="invite-user-handle">@{user.username}</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`invite-action-btn ${isInvited ? 'invited' : ''}`}
                                    onClick={() => !isInvited && handleInvite(userId)}
                                    disabled={isInvited}
                                >
                                    {isInvited ? (
                                        <>
                                            <Check size={14} strokeWidth={2.4} />
                                            <span>Gönderildi</span>
                                        </>
                                    ) : (
                                        <span>Davet Et</span>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default InviteUserModal;
