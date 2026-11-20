import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    X,
    Check,
    CheckCheck,
    Star,
    Pin,
    Bell,
    BellOff,
    Timer,
    Palette,
    Heart,
    Download,
    Flag,
    Ban,
    ExternalLink,
    Search,
    Forward,
    Image as ImageIcon,
    FileText,
    Play,
    Trash2,
    Info,
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import UserBadges from './UserBadges';
import { getImageUrl } from '../utils/imageUtils';
import './ChatModals.css';

export const CHAT_THEMES = [
    {
        id: 'default',
        label: 'Varsayılan',
        darkBg: '#08080a',
        lightBg: '#ffffff',
        ownDark: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
        ownLight: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
        swatch: '#0072FF',
    },
    {
        id: 'graphite',
        label: 'Grafit',
        darkBg: '#0b0b0d',
        lightBg: '#f6f6f7',
        ownDark: 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
        ownLight: 'linear-gradient(135deg, #27272a 0%, #18181b 100%)',
        swatch: '#52525b',
    },
    {
        id: 'midnight',
        label: 'Gece Mavisi',
        darkBg: '#070b14',
        lightBg: '#f2f6fc',
        ownDark: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
        ownLight: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        swatch: '#2563eb',
    },
    {
        id: 'emerald',
        label: 'Zümrüt',
        darkBg: '#06100c',
        lightBg: '#f2faf6',
        ownDark: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
        ownLight: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        swatch: '#10b981',
    },
    {
        id: 'violet',
        label: 'Mor',
        darkBg: '#0c0814',
        lightBg: '#f7f4fc',
        ownDark: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        ownLight: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        swatch: '#8b5cf6',
    },
    {
        id: 'rose',
        label: 'Gül',
        darkBg: '#12070b',
        lightBg: '#fdf3f6',
        ownDark: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
        ownLight: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
        swatch: '#e11d48',
    },
    {
        id: 'amber',
        label: 'Kehribar',
        darkBg: '#110d06',
        lightBg: '#fcf8f0',
        ownDark: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
        ownLight: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
        swatch: '#d97706',
    },
];

export const DISAPPEARING_OPTIONS = [
    { seconds: 0, label: 'Kapalı', desc: 'Mesajlar otomatik olarak silinmez.' },
    { seconds: 86400, label: '24 Saat', desc: 'Yeni mesajlar 24 saat sonra silinir.' },
    { seconds: 604800, label: '7 Gün', desc: 'Yeni mesajlar 7 gün sonra silinir.' },
    { seconds: 7776000, label: '90 Gün', desc: 'Yeni mesajlar 90 gün sonra silinir.' },
];

export const formatFullDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDisappearingLabel = (seconds) => {
    const num = Number(seconds) || 0;
    if (num === 86400) return '24 saat';
    if (num === 604800) return '7 gün';
    if (num === 7776000) return '90 gün';
    return 'Kapalı';
};

/* ============================================================
   1. CONTACT / CHAT INFO DRAWER
   ============================================================ */
export const ContactInfoDrawer = ({
    partner,
    messages,
    currentUserId,
    preferences,
    onClose,
    onNavigateProfile,
    onOpenMute,
    onToggleFavorite,
    onOpenDisappearing,
    onOpenTheme,
    onExportChat,
    onOpenReport,
    onToggleBlock,
    onJumpToMessage,
}) => {
    const [activeTab, setActiveTab] = useState('media');

    const isMuted = Boolean(preferences?.mutedUntil && new Date(preferences.mutedUntil) > new Date());
    const mediaMessages = useMemo(
        () => (messages || []).filter((m) => Boolean(m.media)),
        [messages]
    );
    const starredMessages = useMemo(
        () =>
            (messages || []).filter((m) =>
                (m.starredBy || []).some((id) => String(id) === String(currentUserId))
            ),
        [messages, currentUserId]
    );
    const pinnedMessages = useMemo(
        () => (messages || []).filter((m) => Boolean(m.pinned)),
        [messages]
    );

    return createPortal(
        <div className="chat-modal-overlay drawer-mode" onClick={onClose}>
            <div className="chat-info-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="chat-drawer-header">
                    <h3>Kişi bilgisi</h3>
                    <button type="button" className="chat-modal-close" onClick={onClose} aria-label="Kapat">
                        <X size={18} />
                    </button>
                </div>

                <div className="chat-drawer-body">
                    {/* Profile Card */}
                    <div className="chat-drawer-profile">
                        <UserAvatar
                            src={partner?.profile?.avatar || partner?.profile?.lowResAvatar}
                            alt={partner?.username}
                            size={76}
                            isDeleted={partner?.isDeleted}
                        />
                        <div className="chat-drawer-name">
                            <span>{partner?.profile?.displayName || partner?.username}</span>
                            <UserBadges user={partner} size={18} />
                        </div>
                        <span className="chat-drawer-username">@{partner?.username}</span>
                        {partner?.profile?.bio && (
                            <p className="chat-drawer-bio">{partner.profile.bio}</p>
                        )}
                        <button
                            type="button"
                            className="chat-drawer-profile-btn"
                            onClick={() => {
                                onClose();
                                onNavigateProfile();
                            }}
                        >
                            <ExternalLink size={14} />
                            <span>Profili Görüntüle</span>
                        </button>
                    </div>

                    {/* Quick Settings List */}
                    <div className="chat-drawer-section">
                        <button type="button" className="chat-drawer-row" onClick={onOpenMute}>
                            <span className="chat-drawer-row-icon">
                                {isMuted ? <BellOff size={17} /> : <Bell size={17} />}
                            </span>
                            <span className="chat-drawer-row-label">Bildirimleri sessize al</span>
                            <span className="chat-drawer-row-value">{isMuted ? 'Sessiz' : 'Açık'}</span>
                        </button>

                        <button type="button" className="chat-drawer-row" onClick={onToggleFavorite}>
                            <span className="chat-drawer-row-icon">
                                <Heart size={17} fill={preferences?.isFavorite ? 'currentColor' : 'none'} />
                            </span>
                            <span className="chat-drawer-row-label">Favoriler</span>
                            <span className="chat-drawer-row-value">{preferences?.isFavorite ? 'Eklendi' : 'Kapalı'}</span>
                        </button>

                        <button type="button" className="chat-drawer-row" onClick={onOpenDisappearing}>
                            <span className="chat-drawer-row-icon">
                                <Timer size={17} />
                            </span>
                            <span className="chat-drawer-row-label">Süreli mesajlar</span>
                            <span className="chat-drawer-row-value">
                                {formatDisappearingLabel(preferences?.disappearingSeconds)}
                            </span>
                        </button>

                        <button type="button" className="chat-drawer-row" onClick={onOpenTheme}>
                            <span className="chat-drawer-row-icon">
                                <Palette size={17} />
                            </span>
                            <span className="chat-drawer-row-label">Sohbet teması</span>
                            <span className="chat-drawer-row-value">
                                {CHAT_THEMES.find((t) => t.id === (preferences?.theme || 'default'))?.label || 'Varsayılan'}
                            </span>
                        </button>

                        <button type="button" className="chat-drawer-row" onClick={onExportChat}>
                            <span className="chat-drawer-row-icon">
                                <Download size={17} />
                            </span>
                            <span className="chat-drawer-row-label">Sohbeti dışa aktar</span>
                            <span className="chat-drawer-row-value">.txt</span>
                        </button>
                    </div>

                    {/* Media / Starred / Pinned Tabs */}
                    <div className="chat-drawer-tabs">
                        <button
                            type="button"
                            className={`chat-drawer-tab ${activeTab === 'media' ? 'active' : ''}`}
                            onClick={() => setActiveTab('media')}
                        >
                            Medya ({mediaMessages.length})
                        </button>
                        <button
                            type="button"
                            className={`chat-drawer-tab ${activeTab === 'starred' ? 'active' : ''}`}
                            onClick={() => setActiveTab('starred')}
                        >
                            Yıldızlı ({starredMessages.length})
                        </button>
                        <button
                            type="button"
                            className={`chat-drawer-tab ${activeTab === 'pinned' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pinned')}
                        >
                            Sabit ({pinnedMessages.length})
                        </button>
                    </div>

                    <div className="chat-drawer-tab-panel">
                        {activeTab === 'media' && (
                            mediaMessages.length === 0 ? (
                                <p className="chat-drawer-empty">Paylaşılan medya bulunmuyor.</p>
                            ) : (
                                <div className="chat-drawer-media-grid">
                                    {mediaMessages.map((m) => {
                                        const isVid = /\.(mp4|webm|ogg|mov)$/i.test(m.media || '') || m.mediaType?.startsWith('video');
                                        const isImg = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(m.media || '') || m.mediaType?.startsWith('image');
                                        return (
                                            <button
                                                key={m._id}
                                                type="button"
                                                className="chat-drawer-media-item"
                                                onClick={() => {
                                                    onClose();
                                                    onJumpToMessage(m._id);
                                                }}
                                                title={m.mediaName || 'Medyaya git'}
                                            >
                                                {isImg ? (
                                                    <img src={getImageUrl(m.media)} alt="" loading="lazy" />
                                                ) : isVid ? (
                                                    <div className="chat-drawer-media-placeholder">
                                                        <Play size={20} />
                                                    </div>
                                                ) : (
                                                    <div className="chat-drawer-media-placeholder">
                                                        <FileText size={20} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {activeTab === 'starred' && (
                            starredMessages.length === 0 ? (
                                <p className="chat-drawer-empty">Yıldızlı mesaj bulunmuyor.</p>
                            ) : (
                                <div className="chat-drawer-msg-list">
                                    {starredMessages.map((m) => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            className="chat-drawer-msg-item"
                                            onClick={() => {
                                                onClose();
                                                onJumpToMessage(m._id);
                                            }}
                                        >
                                            <div className="chat-drawer-msg-top">
                                                <Star size={12} fill="currentColor" />
                                                <span>{m.sender?.profile?.displayName || m.sender?.username}</span>
                                                <small>{new Date(m.createdAt).toLocaleDateString('tr-TR')}</small>
                                            </div>
                                            <p>{m.content || (m.media ? 'Medya eki' : 'Mesaj')}</p>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === 'pinned' && (
                            pinnedMessages.length === 0 ? (
                                <p className="chat-drawer-empty">Sabitlenen mesaj bulunmuyor.</p>
                            ) : (
                                <div className="chat-drawer-msg-list">
                                    {pinnedMessages.map((m) => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            className="chat-drawer-msg-item"
                                            onClick={() => {
                                                onClose();
                                                onJumpToMessage(m._id);
                                            }}
                                        >
                                            <div className="chat-drawer-msg-top">
                                                <Pin size={12} />
                                                <span>{m.sender?.profile?.displayName || m.sender?.username}</span>
                                                <small>{new Date(m.createdAt).toLocaleDateString('tr-TR')}</small>
                                            </div>
                                            <p>{m.content || (m.media ? 'Medya eki' : 'Mesaj')}</p>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Danger Actions */}
                    <div className="chat-drawer-section danger-section">
                        <button type="button" className="chat-drawer-row danger" onClick={onToggleBlock}>
                            <span className="chat-drawer-row-icon"><Ban size={17} /></span>
                            <span className="chat-drawer-row-label">
                                {preferences?.isBlocked ? 'Engeli kaldır' : 'Kullanıcıyı engelle'}
                            </span>
                        </button>
                        <button type="button" className="chat-drawer-row danger" onClick={onOpenReport}>
                            <span className="chat-drawer-row-icon"><Flag size={17} /></span>
                            <span className="chat-drawer-row-label">Şikayet et</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   2. MESSAGE INFO MODAL
   ============================================================ */
export const MessageInfoModal = ({ message, isOwn, currentUserId, onClose }) => {
    if (!message) return null;
    const isStarred = (message.starredBy || []).some((id) => String(id) === String(currentUserId));

    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <Info size={18} />
                        <h3>Mesaj bilgisi</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="chat-modal-body">
                    <div className="msg-info-preview">
                        {message.media && (
                            <div className="msg-info-media-tag">
                                <ImageIcon size={14} />
                                <span>{message.mediaName || 'Medya eki'}</span>
                            </div>
                        )}
                        <p>{message.content || (message.media ? 'Medya mesajı' : 'Mesaj')}</p>
                    </div>

                    <div className="msg-info-rows">
                        <div className="msg-info-row">
                            <span className="msg-info-label">Gönderen</span>
                            <span className="msg-info-val">
                                {message.sender?.profile?.displayName || message.sender?.username || 'Kullanıcı'}
                            </span>
                        </div>
                        <div className="msg-info-row">
                            <span className="msg-info-label">Gönderilme</span>
                            <span className="msg-info-val">{formatFullDateTime(message.createdAt)}</span>
                        </div>
                        {isOwn && (
                            <div className="msg-info-row">
                                <span className="msg-info-label">Durum</span>
                                <span className="msg-info-val status-val">
                                    {message.read ? (
                                        <>
                                            <CheckCheck size={15} className="read-icon" />
                                            <span>
                                                Okundu{message.readAt ? ` • ${formatFullDateTime(message.readAt)}` : ''}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={15} />
                                            <span>İletildi</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        )}
                        {message.pinned && (
                            <div className="msg-info-row">
                                <span className="msg-info-label">Sabitleme</span>
                                <span className="msg-info-val">Sabitlendi</span>
                            </div>
                        )}
                        {isStarred && (
                            <div className="msg-info-row">
                                <span className="msg-info-label">Yıldız</span>
                                <span className="msg-info-val">Yıldızlı mesajlarda</span>
                            </div>
                        )}
                        {message.expiresAt && (
                            <div className="msg-info-row">
                                <span className="msg-info-label">Otomatik silinme</span>
                                <span className="msg-info-val">{formatFullDateTime(message.expiresAt)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   3. FORWARD MESSAGE MODAL
   ============================================================ */
export const ForwardMessageModal = ({ messagesToForward, conversations, currentUserId, onClose, onForwarded }) => {
    const [query, setQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`);
                const list = Array.isArray(res.data) ? res.data : (res.data?.users || []);
                setSearchResults(list.filter((u) => String(u._id) !== String(currentUserId)));
            } catch (_) {
                setSearchResults([]);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [query, currentUserId]);

    const candidates = useMemo(() => {
        const map = new Map();
        (conversations || []).forEach((c) => {
            if (c.user?._id && !c.user.isSystemAccount && !c.user.isDeleted) {
                map.set(String(c.user._id), c.user);
            }
        });
        searchResults.forEach((u) => {
            if (u?._id && !u.isSystemAccount && !u.isDeleted && !map.has(String(u._id))) {
                map.set(String(u._id), u);
            }
        });
        const q = query.trim().toLowerCase();
        return Array.from(map.values()).filter((u) => {
            if (!q) return true;
            const name = (u.profile?.displayName || '').toLowerCase();
            const uname = (u.username || '').toLowerCase();
            return name.includes(q) || uname.includes(q);
        });
    }, [conversations, searchResults, query]);

    const toggleSelect = (uid) => {
        setSelectedIds((prev) =>
            prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
        );
    };

    const handleSendForward = async () => {
        if (selectedIds.length === 0 || sending) return;
        setSending(true);
        try {
            const list = Array.isArray(messagesToForward) ? messagesToForward : [messagesToForward];
            for (const msg of list) {
                if (!msg?._id) continue;
                await axios.post(`/api/messages/${msg._id}/forward`, {
                    recipientIds: selectedIds,
                });
            }
            onForwarded(selectedIds.length, list.length);
            onClose();
        } catch (err) {
            console.error('Forward failed:', err);
            alert(err?.response?.data?.message || 'Mesaj iletilemedi.');
        } finally {
            setSending(false);
        }
    };

    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <Forward size={18} />
                        <h3>Mesajı ilet</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="chat-modal-body">
                    <div className="forward-search-box">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Kişi ara..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="forward-users-list">
                        {candidates.length === 0 ? (
                            <p className="chat-drawer-empty">Kullanıcı bulunamadı.</p>
                        ) : (
                            candidates.map((u) => {
                                const uid = String(u._id);
                                const checked = selectedIds.includes(uid);
                                return (
                                    <button
                                        key={uid}
                                        type="button"
                                        className={`forward-user-row ${checked ? 'selected' : ''}`}
                                        onClick={() => toggleSelect(uid)}
                                    >
                                        <UserAvatar
                                            src={u.profile?.lowResAvatar || u.profile?.avatar}
                                            alt={u.username}
                                            size={36}
                                        />
                                        <div className="forward-user-meta">
                                            <span className="forward-user-name">
                                                {u.profile?.displayName || u.username}
                                            </span>
                                            <span className="forward-user-handle">@{u.username}</span>
                                        </div>
                                        <span className={`forward-check ${checked ? 'checked' : ''}`}>
                                            {checked && <Check size={13} strokeWidth={3} />}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="chat-modal-footer">
                    <button type="button" className="chat-btn-ghost" onClick={onClose}>
                        İptal
                    </button>
                    <button
                        type="button"
                        className="chat-btn-primary"
                        disabled={selectedIds.length === 0 || sending}
                        onClick={handleSendForward}
                    >
                        {sending ? 'İletiliyor...' : `Gönder (${selectedIds.length})`}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   4. CHAT THEME PICKER MODAL
   ============================================================ */
export const ChatThemeModal = ({ currentTheme, onSelect, onClose }) => {
    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <Palette size={18} />
                        <h3>Sohbet teması</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="chat-modal-body">
                    <p className="chat-modal-desc">
                        Bu sohbet için arka plan ve mesaj balonu rengini seçin.
                    </p>
                    <div className="chat-theme-grid">
                        {CHAT_THEMES.map((t) => {
                            const active = (currentTheme || 'default') === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={`chat-theme-card ${active ? 'active' : ''}`}
                                    onClick={() => onSelect(t.id)}
                                >
                                    <span
                                        className="chat-theme-swatch"
                                        style={{ background: t.ownDark }}
                                    >
                                        {active && <Check size={15} color="#fff" strokeWidth={3} />}
                                    </span>
                                    <span className="chat-theme-name">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   5. DISAPPEARING MESSAGES MODAL
   ============================================================ */
export const DisappearingMessagesModal = ({ currentSeconds, onSelect, onClose }) => {
    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <Timer size={18} />
                        <h3>Süreli mesajlar</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="chat-modal-body">
                    <p className="chat-modal-desc">
                        Açıldığında bu sohbette gönderilen yeni mesajlar seçilen süre sonunda otomatik olarak kaldırılır.
                    </p>
                    <div className="chat-radio-list">
                        {DISAPPEARING_OPTIONS.map((opt) => {
                            const active = (Number(currentSeconds) || 0) === opt.seconds;
                            return (
                                <button
                                    key={opt.seconds}
                                    type="button"
                                    className={`chat-radio-item ${active ? 'active' : ''}`}
                                    onClick={() => onSelect(opt.seconds)}
                                >
                                    <div className="chat-radio-text">
                                        <strong>{opt.label}</strong>
                                        <span>{opt.desc}</span>
                                    </div>
                                    <span className={`chat-radio-dot ${active ? 'checked' : ''}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   6. MUTE NOTIFICATIONS MODAL
   ============================================================ */
export const MuteChatModal = ({ mutedUntil, onSelect, onClose }) => {
    const isMuted = Boolean(mutedUntil && new Date(mutedUntil) > new Date());
    const options = [
        { label: '8 Saat', getDate: () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() },
        { label: '1 Hafta', getDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { label: 'Her zaman', getDate: () => new Date('2099-12-31T23:59:59.000Z').toISOString() },
    ];

    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <BellOff size={18} />
                        <h3>Bildirimleri sessize al</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="chat-modal-body">
                    <p className="chat-modal-desc">
                        Sessize alınan sohbetlerden anlık bildirim gönderilmez.
                    </p>
                    <div className="chat-radio-list">
                        {options.map((opt) => (
                            <button
                                key={opt.label}
                                type="button"
                                className="chat-radio-item"
                                onClick={() => onSelect(opt.getDate())}
                            >
                                <div className="chat-radio-text">
                                    <strong>{opt.label}</strong>
                                </div>
                            </button>
                        ))}
                        {isMuted && (
                            <button
                                type="button"
                                className="chat-radio-item active"
                                onClick={() => onSelect(null)}
                            >
                                <div className="chat-radio-text">
                                    <strong>Bildirimlerin sesini aç</strong>
                                </div>
                                <Bell size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   7. DELETE MESSAGE MODAL (Scope: Me vs Everyone)
   ============================================================ */
export const DeleteMessageModal = ({ count = 1, canDeleteForEveryone = false, onDeleteForMe, onDeleteForEveryone, onClose }) => {
    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card compact" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <div className="chat-modal-title-wrap">
                        <Trash2 size={18} />
                        <h3>{count > 1 ? `${count} mesajı sil?` : 'Mesajı sil?'}</h3>
                    </div>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="chat-modal-body">
                    <p className="chat-modal-desc">
                        {canDeleteForEveryone
                            ? 'Bu mesajı yalnızca kendinizden veya herkesten silebilirsiniz.'
                            : 'Bu mesaj yalnızca sizin sohbet görünümünüzden kaldırılacaktır.'}
                    </p>
                    <div className="chat-delete-actions-stack">
                        {canDeleteForEveryone && (
                            <button type="button" className="chat-btn-danger" onClick={onDeleteForEveryone}>
                                Herkesten sil
                            </button>
                        )}
                        <button type="button" className="chat-btn-secondary" onClick={onDeleteForMe}>
                            Benden sil
                        </button>
                        <button type="button" className="chat-btn-ghost" onClick={onClose}>
                            İptal
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ============================================================
   8. GENERIC CONFIRMATION MODAL (Clear Chat / Delete Chat)
   ============================================================ */
export const ConfirmChatActionModal = ({ title, description, confirmLabel, danger = true, onConfirm, onClose }) => {
    return createPortal(
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-card compact" onClick={(e) => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <h3>{title}</h3>
                    <button type="button" className="chat-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="chat-modal-body">
                    <p className="chat-modal-desc">{description}</p>
                </div>
                <div className="chat-modal-footer">
                    <button type="button" className="chat-btn-ghost" onClick={onClose}>
                        İptal
                    </button>
                    <button
                        type="button"
                        className={danger ? 'chat-btn-danger' : 'chat-btn-primary'}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
