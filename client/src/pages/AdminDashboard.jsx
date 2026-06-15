import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';
import { useSocket } from '../context/SocketContext';
import { getImageUrl } from '../utils/imageUtils';
import { Home, Pencil, Trash2 } from 'lucide-react';
import Badge from '../components/Badge';
import UserBadges from '../components/UserBadges';
import UserAvatar from '../components/UserAvatar';
import ImageCropper from '../components/ImageCropper';
import { uploadFile } from '../utils/uploadUtils';
import './AdminDashboard.css';

// Modern Modal Component for Reason Entry + Duration Picker
const ReasonModal = ({ isOpen, onClose, onSubmit, actionType }) => {
    const [reason, setReason] = useState('');
    const [durationType, setDurationType] = useState('preset'); // 'preset' or 'custom'
    const [selectedPreset, setSelectedPreset] = useState(null); // hours
    const [customDate, setCustomDate] = useState('');

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '6 Saat', hours: 6 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateSuspendedUntil = () => {
        if (actionType !== 'suspend') return null;
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (actionType === 'suspend' && !calculateSuspendedUntil()) {
            alert('Lütfen askıya alma süresi belirleyin.');
            return;
        }
        onSubmit(reason, calculateSuspendedUntil());
        setReason('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    let title = 'İşlem Sebebi';
    let description = 'Bu işlem için bir sebep belirtin.';
    let actionBtnText = 'ONAYLA';

    if (actionType === 'suspend') {
        title = 'Askıya Alma Sebebi';
        description = 'Bu portal askıya alınacak. Lütfen bir sebep ve süre belirleyin. Bu bilgiler portal sayfasında görüntülenecektir.';
        actionBtnText = 'ASKIYA ALMAYI ONAYLA';
    } else if (actionType === 'close') {
        title = 'Kapatma Sebebi';
        description = 'Bu portal kapatılacak. Lütfen bir sebep belirtin. Bu sebep portal sayfasında görüntülenecektir.';
        actionBtnText = 'KAPATMAYI ONAYLA';
    }

    // Min date for custom picker (now)
    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>{title}</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">{description}</p>
                        <textarea
                            className="reason-input-modern"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Örn: Topluluk kuralları ihlali..."
                            rows="4"
                            required
                        />

                        {/* Duration Picker — Only for Suspend */}
                        {actionType === 'suspend' && (
                            <div className="duration-picker-section">
                                <h4 className="duration-title">⏱ Askıya Alma Süresi</h4>
                                <div className="duration-type-toggle">
                                    <button
                                        type="button"
                                        className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                        onClick={() => setDurationType('preset')}
                                    >
                                        Hazır Süre
                                    </button>
                                    <button
                                        type="button"
                                        className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                        onClick={() => setDurationType('custom')}
                                    >
                                        Özel Tarih
                                    </button>
                                </div>

                                {durationType === 'preset' ? (
                                    <div className="preset-grid">
                                        {presets.map((p) => (
                                            <button
                                                key={p.hours}
                                                type="button"
                                                className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                                onClick={() => setSelectedPreset(p.hours)}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="datetime-local"
                                        className="custom-date-input"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        min={minDate}
                                        required={durationType === 'custom'}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary">
                            {actionBtnText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Modern Ban Modal Component for User and IP Banning
const BanModal = ({ isOpen, onClose, onSubmit, type }) => {
    const [reason, setReason] = useState('');
    const [durationType, setDurationType] = useState('preset'); // 'preset' or 'custom' or 'permanent'
    const [selectedPreset, setSelectedPreset] = useState(null); // hours
    const [customDate, setCustomDate] = useState('');

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateExpiresAt = () => {
        if (durationType === 'permanent') return null;
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(reason, calculateExpiresAt());
        setReason('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>{type === 'ip' ? '🚫 IP Adresini Engelle' : '🚫 Kullanıcıyı Engelle'}</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">
                            Bu {type === 'ip' ? 'IP adresini' : 'kullanıcıyı'} engellemek için bir sebep ve süre belirleyin.
                        </p>
                        <textarea
                            className="reason-input-modern"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Örn: Topluluk kuralları ihlali, spam faaliyeti..."
                            rows="4"
                            required
                        />

                        <div className="duration-picker-section">
                            <h4 className="duration-title">⏱ Engel Süresi</h4>
                            <div className="duration-type-toggle">
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                    onClick={() => setDurationType('preset')}
                                >
                                    Süre Seç
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                    onClick={() => setDurationType('custom')}
                                >
                                    Özel Tarih
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'permanent' ? 'active' : ''}`}
                                    onClick={() => setDurationType('permanent')}
                                >
                                    Kalıcı
                                </button>
                            </div>

                            {durationType === 'preset' ? (
                                <div className="preset-grid">
                                    {presets.map((p) => (
                                        <button
                                            key={p.hours}
                                            type="button"
                                            className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                            onClick={() => setSelectedPreset(p.hours)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            ) : durationType === 'custom' ? (
                                <input
                                    type="datetime-local"
                                    className="custom-date-input"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={minDate}
                                    required={durationType === 'custom'}
                                />
                            ) : (
                                <div className="permanent-ban-warning" style={{ color: '#ff4b4b', fontSize: '12px', fontWeight: '600', marginTop: '10px' }}>
                                    ⚠️ Bu engel elle kaldırılana kadar süresiz olarak geçerli olacaktır.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary" style={{ background: '#ff4b4b' }}>
                            ENGELE
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Alert Modal Component — Similar to ReasonModal but for portal alerts
const AlertModal = ({ isOpen, onClose, onSubmit, portalName }) => {
    const [message, setMessage] = useState('');
    const [durationType, setDurationType] = useState('preset');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [customDate, setCustomDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const presets = [
        { label: '1 Saat', hours: 1 },
        { label: '6 Saat', hours: 6 },
        { label: '12 Saat', hours: 12 },
        { label: '1 Gün', hours: 24 },
        { label: '3 Gün', hours: 72 },
        { label: '7 Gün', hours: 168 },
        { label: '30 Gün', hours: 720 },
    ];

    const calculateExpiresAt = () => {
        if (durationType === 'preset' && selectedPreset) {
            return new Date(Date.now() + selectedPreset * 60 * 60 * 1000).toISOString();
        }
        if (durationType === 'custom' && customDate) {
            return new Date(customDate).toISOString();
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const expiresAt = calculateExpiresAt();
        if (!expiresAt) {
            alert('Lütfen uyarı süresi belirleyin.');
            return;
        }
        if (!message.trim()) {
            alert('Lütfen uyarı mesajı yazın.');
            return;
        }
        setSubmitting(true);
        await onSubmit(message.trim(), expiresAt);
        setSubmitting(false);
        setMessage('');
        setSelectedPreset(null);
        setCustomDate('');
    };

    const minDate = new Date().toISOString().slice(0, 16);

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern">
                <div className="modal-header-modern">
                    <h2>📢 Uyarı Yayınla</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-modern">
                        <p className="modal-description-modern">
                            <strong>{portalName}</strong> portalına bir yönetici uyarısı yayınlayın. Bu uyarı portal anasayfasında tüm kullanıcılara banner olarak gösterilecektir.
                        </p>
                        <textarea
                            className="reason-input-modern"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Uyarı mesajınızı yazın... (maks. 500 karakter)"
                            rows="4"
                            maxLength={500}
                            required
                        />
                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', marginTop: '-8px' }}>
                            {message.length}/500
                        </div>

                        <div className="duration-picker-section">
                            <h4 className="duration-title">⏱ Uyarı Süresi</h4>
                            <div className="duration-type-toggle">
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'preset' ? 'active' : ''}`}
                                    onClick={() => setDurationType('preset')}
                                >
                                    Hazır Süre
                                </button>
                                <button
                                    type="button"
                                    className={`duration-type-btn ${durationType === 'custom' ? 'active' : ''}`}
                                    onClick={() => setDurationType('custom')}
                                >
                                    Özel Tarih
                                </button>
                            </div>

                            {durationType === 'preset' ? (
                                <div className="preset-grid">
                                    {presets.map((p) => (
                                        <button
                                            key={p.hours}
                                            type="button"
                                            className={`preset-btn ${selectedPreset === p.hours ? 'active' : ''}`}
                                            onClick={() => setSelectedPreset(p.hours)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <input
                                    type="datetime-local"
                                    className="custom-date-input"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    min={minDate}
                                    required={durationType === 'custom'}
                                />
                            )}
                        </div>
                    </div>
                    <div className="modal-footer-modern">
                        <button type="button" className="btn-modern-ghost" onClick={onClose}>
                            İptal
                        </button>
                        <button type="submit" className="btn-modern-primary" disabled={submitting} style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)' }}>
                            {submitting ? 'GÖNDERİLİYOR...' : '📢 UYARIYI YAYINLA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Professional Feedback Response Modal v2
const FeedbackResponseModal = ({ isOpen, onClose, feedback, onSubmit }) => {
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    if (!isOpen || !feedback) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(feedback._id, response);
        setSubmitting(false);
        setResponse('');
    };

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern feedback-ticket-modal">
                <div className="modal-header-modern">
                    <div className="ticket-header-info">
                        <h2>#{feedback._id?.substring(feedback._id.length - 6) || '000000'} Talep Detayı</h2>
                        <span className={`status-badge-neon ${feedback.status}`}>{feedback.status === 'new' ? 'Bekliyor' : 'Yanıtlandı'}</span>
                    </div>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>

                <div className="ticket-split-body">
                    {/* Left Side: Request Info & Gallery */}
                    <div className="ticket-request-side">
                        <div className="sender-meta-box">
                            <img 
                                src={feedback.user?.profile?.avatar || '/system/deleted-user.png'} 
                                alt="" 
                                className="sender-avatar-large" 
                            />
                            <div className="sender-details">
                                <strong>{feedback.user ? `@${feedback.user.username}` : 'Silinmiş Kullanıcı'}</strong>
                                <span>{new Date(feedback.createdAt).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>

                        <div className="request-content-scroller">
                            <div className={`category-chip ${(feedback.category?.toLowerCase() || 'genel').replace(/\s+/g, '-')}`}>{feedback.category || 'Genel'}</div>
                            <h3 className="ticket-subject">{feedback.subject}</h3>
                            <div className="ticket-message-block">
                                {feedback.message}
                            </div>

                            {feedback.files && feedback.files.length > 0 && (
                                <div className="ticket-gallery-section">
                                    <label>Ekli Görseller ({feedback.files.length})</label>
                                    <div className="ticket-gallery-grid">
                                        {feedback.files.map((file, i) => (
                                            <div 
                                                key={i} 
                                                className="gallery-thumb-wrap"
                                                onClick={() => setActiveImage(file)}
                                            >
                                                <img src={getImageUrl(file)} alt="" className="gallery-thumb" />
                                                <div className="thumb-overlay">
                                                    <span>BÜYÜT</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Admin Response */}
                    <div className="ticket-reply-side">
                        <form onSubmit={handleSubmit} className="reply-form-full">
                            <div className="reply-header-mini">
                                <h3>Hızlı Yanıt</h3>
                                <p>Kullanıcının Inbox'ına anlık bildirim gider.</p>
                            </div>
                            
                            <textarea
                                className="ticket-reply-area"
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Kullanıcıya iletilecek profesyonel yanıtı buraya yazın..."
                                required
                                disabled={feedback.status === 'replied'}
                            />

                            {feedback.status === 'replied' && feedback.adminResponse && (
                                <div className="sent-response-preview">
                                    <label>Gönderilen Yanıt:</label>
                                    <p>{feedback.adminResponse}</p>
                                </div>
                            )}

                            <div className="reply-actions">
                                <button type="button" className="btn-modern-ghost" onClick={onClose}>İPTAL</button>
                                <button 
                                    type="submit" 
                                    className="btn-modern-primary btn-glow-cyan" 
                                    disabled={submitting || !response.trim() || feedback.status === 'replied'}
                                >
                                    {submitting ? 'İLETİLİYOR...' : 'YANITI GÖNDER'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Lightbox for Images */}
            {activeImage && (
                <div className="lightbox-overlay" onClick={() => setActiveImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <img src={getImageUrl(activeImage)} alt="" className="lightbox-img" />
                        <button className="lightbox-close" onClick={() => setActiveImage(null)}>&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};


// Portal Detail / Management Modal
const PortalDetailModal = ({
    isOpen,
    onClose,
    portal,
    contextBadges,
    handlePortalBadge,
    handleNSFWToggle,
    handleReadOnlyToggle,
    initiatePortalStatusChange,
    openAlertModal,
    handleRemoveAlert,
    ownershipTarget,
    setOwnershipTarget,
    handleTransferOwnership,
    transferring
}) => {
    if (!isOpen || !portal) return null;

    const activeAlerts = portal.alerts ? portal.alerts.filter(a => new Date(a.expiresAt) > new Date() && a.isActive !== false) : [];
    const defaultBanner = 'linear-gradient(45deg, #4f46e5, #9333ea)';

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern portal-detail-modal">
                <div className="portal-detail-header-banner" style={{ background: portal.banner ? `url(${getImageUrl(portal.banner)}) center/cover` : defaultBanner }}>
                    <button className="close-btn-modern" onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', border: 'none' }}>&times;</button>
                </div>

                <div className="portal-detail-avatar-container">
                    {portal.avatar ? (
                        <img src={getImageUrl(portal.avatar)} alt="" className="portal-detail-avatar" />
                    ) : (
                        <div className="portal-detail-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '2rem' }}>
                            {portal.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="portal-detail-title-info">
                        <h2>
                            {portal.name}
                            <Badge type={portal.isVerified ? 'verified' : portal.badges?.[0]} size={20} />
                            {portal.isNSFW && <span className="nsfw-badge-admin">+18</span>}
                        </h2>
                        <p>Sahibi: <strong>@{portal.owner?.username || 'Bilinmiyor'}</strong></p>
                    </div>
                </div>

                <div className="detail-modal-body-scroller">
                    {/* Description */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Açıklama</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#ccc', lineHeight: '1.5' }}>
                            {portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.'}
                        </p>
                    </div>

                    {/* Read-Only mode */}
                    <div className="read-only-toggle-container">
                        <div className="read-only-info">
                            <strong>Karantina / Salt Okunur Mod</strong>
                            <span>Aktif edildiğinde bu portala yeni gönderi gönderilmesi tamamen engellenir.</span>
                        </div>
                        <div 
                            className={`read-only-toggle-switch ${portal.isReadOnly ? 'active' : ''}`}
                            onClick={() => handleReadOnlyToggle(portal._id, portal.isReadOnly)}
                        />
                    </div>

                    {/* Management Controls */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Portal Ayarları</h4>
                        <div className="flex-control-row" style={{ gap: '15px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Rozet Ata</span>
                                <select
                                    className="badge-select"
                                    value={portal.badges && portal.badges.length > 0 ? portal.badges[0] : 'none'}
                                    onChange={(e) => handlePortalBadge(portal._id, e.target.value)}
                                    style={{ width: '150px' }}
                                >
                                    <option value="none">Rozet Yok</option>
                                    {(() => {
                                        const portalBadges = contextBadges.filter(b => b.category === 'portal' || b.category === 'both');
                                        const slugs = new Set(portalBadges.map(b => b.slug));
                                        const LEGACY = [
                                            { slug: 'blue', name: 'Mavi Onay' },
                                            { slug: 'gold', name: 'Altın Onay' },
                                            { slug: 'verified', name: 'Onaylı Portal' },
                                            { slug: 'partner', name: 'Partner' },
                                            { slug: 'official', name: 'Resmi Hesap' },
                                        ];
                                        const merged = [...portalBadges];
                                        LEGACY.forEach(l => { if (!slugs.has(l.slug)) merged.push(l); });
                                        const currentBadge = portal.badges?.[0];
                                        if (currentBadge && currentBadge !== 'none' && !slugs.has(currentBadge) && !LEGACY.find(l => l.slug === currentBadge)) {
                                            merged.push({ slug: currentBadge, name: currentBadge });
                                        }
                                        return merged.map(b => (<option key={b.slug} value={b.slug}>{b.name}</option>));
                                    })()}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>+18 NSFW Durumu</span>
                                <label className="nsfw-toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={portal.isNSFW || false}
                                        onChange={() => handleNSFWToggle(portal._id, portal.isNSFW)}
                                        className="nsfw-toggle-input"
                                    />
                                    <span className="nsfw-toggle-slider"></span>
                                    <span className="nsfw-toggle-text">+18 NSFW</span>
                                </label>
                            </div>

                            <div>
                                <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Portal Durumu</span>
                                <span className={`badge-pill-status ${portal.status}`} style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px' }}>
                                    {portal.status === 'active' ? 'Aktif' : portal.status === 'suspended' ? 'Askıya Alındı' : 'Kapatıldı'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sahiplik Devri (Transfer Ownership) */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Sahiplik Devri (Transfer Ownership)</h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#888' }}>
                            Portal sahipliğini başka bir kullanıcının ID'si veya kullanıcı adı (@username) ile devredebilirsiniz.
                        </p>
                        <div className="transfer-ownership-box">
                            <input
                                type="text"
                                className="transfer-ownership-input"
                                placeholder="Kullanıcı adı veya ID girin..."
                                value={ownershipTarget}
                                onChange={(e) => setOwnershipTarget(e.target.value)}
                            />
                            <button
                                className="btn-transfer-action"
                                onClick={() => handleTransferOwnership(portal._id)}
                                disabled={transferring || !ownershipTarget.trim()}
                            >
                                {transferring ? 'Devrediliyor...' : 'Devret'}
                            </button>
                        </div>
                    </div>

                    {/* Actions and Status Operations */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Yönetim Eylemleri</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                className="btn-modern-primary"
                                onClick={() => openAlertModal(portal._id, portal.name)}
                                style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)', textTransform: 'none', padding: '10px 16px' }}
                            >
                                📢 Uyarı Yayınla
                            </button>

                            {portal.status !== 'suspended' && (
                                <button
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        onClose();
                                        initiatePortalStatusChange(portal._id, 'suspend');
                                    }}
                                    style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid #fbbf24', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    ⛔ Askıya Al
                                </button>
                            )}

                            {portal.status !== 'active' && (
                                <button
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        onClose();
                                        initiatePortalStatusChange(portal._id, 'activate');
                                    }}
                                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid #4ade80', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    ✅ Aktifleştir
                                </button>
                            )}

                            {portal.status !== 'closed' && (
                                <button
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        onClose();
                                        initiatePortalStatusChange(portal._id, 'close');
                                    }}
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #f87171', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    ❌ Kapat (Hukuki)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Timed alerts / announcements list */}
                    {activeAlerts.length > 0 && (
                        <div className="detail-section-card" style={{ border: '1px solid rgba(255, 87, 34, 0.2)', background: 'rgba(255, 87, 34, 0.02)' }}>
                            <h4 className="detail-section-title" style={{ color: '#ff5722' }}>📢 Aktif Portal Uyarıları</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeAlerts.map(alert => (
                                    <div key={alert._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: '1.4' }}>{alert.message}</span>
                                            <span style={{ fontSize: '11px', color: '#888' }}>Bitiş: {new Date(alert.expiresAt).toLocaleString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveAlert(portal._id, alert._id)}
                                            style={{ background: 'transparent', color: '#ff4b4b', border: '1px solid #ff4b4b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            Kaldır
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer-modern" style={{ padding: '10px 28px 24px' }}>
                    <button type="button" className="btn-modern-ghost" onClick={onClose}>
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};


// User Detail / Management Modal
const UserDetailModal = ({
    isOpen,
    onClose,
    user,
    contextBadges,
    handleBadgeChange,
    handleUnbanUser,
    setBanModalTarget,
    setBanModalOpen,
    handleImpersonate,
    handleUserShadowbanToggle,
    isOxypace,
    handleApproveRecovery,
    handleRejectRecovery,
    customBadges = [],
    handleCustomBadgeAssign
}) => {
    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay-modern">
            <div className="modal-content-modern user-detail-modal">
                <div className="modal-header-modern" style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2>👤 Kullanıcı Yönetimi</h2>
                    <button className="close-btn-modern" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body-modern" style={{ gap: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
                    {/* Profile Summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <img 
                            src={user.profile?.avatar || 'https://via.placeholder.com/150'} 
                            alt="" 
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)' }} 
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {user.profile?.displayName || user.username}
                                <UserBadges user={user} size={18} />
                            </strong>
                            <span style={{ fontSize: '13px', color: '#888' }}>@{user.username}</span>
                            <span style={{ fontSize: '12px', color: '#666' }}>{user.email}</span>
                        </div>
                    </div>

                    {/* Shadowban (Hayalet Mod) */}
                    <div className="read-only-toggle-container" style={{ margin: 0 }}>
                        <div className="read-only-info">
                            <strong>Hayalet Modu (Shadowban)</strong>
                            <span>Aktif edildiğinde kullanıcının gönderi ve yorumları sadece kendisine gösterilir.</span>
                        </div>
                        <div 
                            className={`read-only-toggle-switch ${user.isShadowbanned ? 'active' : ''}`}
                            onClick={() => handleUserShadowbanToggle(user._id, user.isShadowbanned)}
                        />
                    </div>

                    {/* Badge Selection */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Doğrulama Rozeti</h4>
                        <select
                            className={`badge-select ${user.verificationBadge}`}
                            value={user.verificationBadge}
                            onChange={(e) => handleBadgeChange(user._id, e.target.value)}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                        >
                            <option value="none">Rozet Yok</option>
                            {(() => {
                                const userBadges = contextBadges.filter(b => b.category === 'user' || b.category === 'both');
                                const slugs = new Set(userBadges.map(b => b.slug));
                                const LEGACY = [
                                    { slug: 'blue', name: 'Mavi Onay' },
                                    { slug: 'gold', name: 'Altın Onay' },
                                    { slug: 'platinum', name: 'Platin Onay' },
                                    { slug: 'special', name: 'Özel Rozet' },
                                    { slug: 'staff', name: 'Platform Yöneticisi' },
                                    { slug: 'partner', name: 'Partner' },
                                    { slug: 'official', name: 'Resmi Hesap' },
                                ];
                                const merged = [...userBadges];
                                LEGACY.forEach(l => { if (!slugs.has(l.slug)) merged.push(l); });
                                if (user.verificationBadge && user.verificationBadge !== 'none' && !slugs.has(user.verificationBadge) && !LEGACY.find(l => l.slug === user.verificationBadge)) {
                                    merged.push({ slug: user.verificationBadge, name: user.verificationBadge });
                                }
                                return merged.map(b => (<option key={b.slug} value={b.slug}>{b.name}</option>));
                            })()}
                        </select>
                    </div>

                    {/* Custom Badge Assignment */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Özel İkon Rozeti (Yönetici Rozeti)</h4>
                        <select
                            className="badge-select"
                            value={user.customBadge?.url || ''}
                            onChange={(e) => {
                                const selectedUrl = e.target.value;
                                const selectedBadge = customBadges.find(b => b.url === selectedUrl);
                                handleCustomBadgeAssign(user._id, selectedBadge ? selectedBadge.url : '', selectedBadge ? selectedBadge.name : '');
                            }}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                        >
                            <option value="">Rozet Yok</option>
                            {customBadges.map((badge) => (
                                <option key={badge._id} value={badge.url}>
                                    {badge.name}
                                </option>
                            ))}
                        </select>
                        {user.customBadge?.url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#888' }}>Mevcut:</span>
                                <img src={user.customBadge.url} alt={user.customBadge.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                                <span style={{ fontSize: '13px', color: '#fff' }}>{user.customBadge.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Security Info (IP & Device info) */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Güvenlik Bilgisi</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#ccc' }}>
                            <div>
                                <span style={{ color: '#666' }}>Son IP Adresi: </span>
                                <strong style={{ fontFamily: 'monospace' }}>{user.lastIP || 'Kayıtlı Değil'}</strong>
                            </div>
                            {user.isBanned && (
                                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginTop: '4px' }}>
                                    <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '4px' }}>⚠️ Hesap Engellendi (Ban)</div>
                                    <div style={{ fontSize: '12px' }}><span style={{ color: '#888' }}>Sebep:</span> {user.banReason || 'Belirtilmedi'}</div>
                                    <div style={{ fontSize: '12px' }}><span style={{ color: '#888' }}>Bitiş:</span> {user.banExpiresAt ? new Date(user.banExpiresAt).toLocaleString() : 'Kalıcı / Süresiz'}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hesap Kurtarma Talebi */}
                    {user.recoveryStatus === 'pending' && (
                        <div className="detail-section-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)' }}>
                            <h4 className="detail-section-title" style={{ color: '#ef4444' }}>⏳ Hesap Kurtarma Talebi</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#ccc' }}>
                                <div>
                                    <span style={{ color: '#888', display: 'block', marginBottom: '2px' }}>Kurtarma Gerekçesi:</span>
                                    <strong style={{ fontSize: '14px', color: '#fff' }}>{user.recoveryReason || 'Gerekçe belirtilmemiş.'}</strong>
                                </div>
                                {user.securityAnswers && user.securityAnswers.length > 0 && (
                                    <div>
                                        <span style={{ color: '#888', display: 'block', marginBottom: '6px' }}>Güvenlik Soruları & Cevapları:</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            {user.securityAnswers.map((item, idx) => (
                                                <div key={idx} style={{ borderBottom: idx < user.securityAnswers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < user.securityAnswers.length - 1 ? '6px' : 0 }}>
                                                    <div style={{ color: '#aaa', fontSize: '12px' }}>Soru: {item.question}</div>
                                                    <div style={{ color: '#4ade80', fontWeight: '600', marginTop: '2px' }}>Cevap: {item.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => handleApproveRecovery(user._id)}
                                        style={{
                                            flex: 1,
                                            background: '#22c55e',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Talebi Onayla (Hesabı Aç)
                                    </button>
                                    <button
                                        onClick={() => handleRejectRecovery(user._id)}
                                        style={{
                                            flex: 1,
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Talebi Reddet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Operations */}
                    <div className="detail-section-card">
                        <h4 className="detail-section-title">Yönetim Eylemleri</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {user.isBanned ? (
                                <button 
                                    className="btn-modern-primary"
                                    onClick={() => handleUnbanUser(user._id)}
                                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid #4ade80', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    Engeli Kaldır
                                </button>
                            ) : (
                                <button 
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        setBanModalTarget({ type: 'user', id: user._id });
                                        setBanModalOpen(true);
                                    }}
                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #f87171', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    Kullanıcıyı Engelle
                                </button>
                            )}

                            {isOxypace && user.username !== 'oxypace' && (
                                <button
                                    className="btn-modern-primary"
                                    onClick={() => handleImpersonate(user._id)}
                                    style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid #6366f1', textTransform: 'none', padding: '10px 16px' }}
                                >
                                    👤 Taklit Et (Ghost Mode)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer-modern" style={{ padding: '10px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button type="button" className="btn-modern-ghost" onClick={onClose}>
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};


const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const isOxypace = currentUser && currentUser.username === 'oxypace';
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.isTouristAdmin || currentUser.username === 'oxypace');

    // Forbidden UI for non-admins
    if (!isAdmin) {
        return (
            <div className="forbidden-container fade-in">
                <div className="forbidden-content">
                    <div className="forbidden-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                        </svg>
                    </div>
                    <h1 className="forbidden-title">403</h1>
                    <h2 className="forbidden-subtitle">Yetkisiz Erişim</h2>
                    <p className="forbidden-text">
                        Bu sayfayı görüntülemek için sistem yöneticisi yetkisine sahip olmalısınız. Yanlış bir bağlantıya tıklamış olabilirsiniz.
                    </p>
                    <button className="forbidden-back-btn" onClick={() => navigate(-1)}>
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'users', 'portals', 'reports', 'badges'
    const [maintenanceActive, setMaintenanceActive] = useState(false);
    const [requests, setRequests] = useState([]);
    const [recoveryRequests, setRecoveryRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [portals, setPortals] = useState([]);
    const [searchTermPortal, setSearchTermPortal] = useState('');

    // Custom badges state
    const [customBadges, setCustomBadges] = useState([]);
    const [customBadgeName, setCustomBadgeName] = useState('');
    const [customBadgeUploadedKey, setCustomBadgeUploadedKey] = useState('');
    const [customBadgeUploadedUrl, setCustomBadgeUploadedUrl] = useState('');
    const [uploadingCustomBadge, setUploadingCustomBadge] = useState(false);

    // Cropper State for Custom Badges
    const [customBadgeCropperImage, setCustomBadgeCropperImage] = useState(null);
    const [customBadgeCropperFile, setCustomBadgeCropperFile] = useState(null);
    const [customBadgeCropperAspectRatio, setCustomBadgeCropperAspectRatio] = useState(1.0);

    // Reports State (Oxypace Only)
    const [reports, setReports] = useState([]);
    const [reportFilter, setReportFilter] = useState('pending');

    // Active Sessions & Banned IPs State
    const { socket, connected } = useSocket();
    const [activeSessions, setActiveSessions] = useState([]);
    const [bannedIps, setBannedIps] = useState([]);
    const [banModalOpen, setBanModalOpen] = useState(false);
    const [banModalTarget, setBanModalTarget] = useState({ type: 'user', id: '', extraData: '' }); // type can be 'user' or 'ip'

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPortalId, setSelectedPortalId] = useState(null);
    const [modalAction, setModalAction] = useState('');

    // Alert Modal State
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertPortalId, setAlertPortalId] = useState(null);
    const [alertPortalName, setAlertPortalName] = useState('');

    // Badge Creator State
    const { badges: contextBadges, refreshBadges } = useBadges();
    const [allBadges, setAllBadges] = useState([]);
    const [badgeModalOpen, setBadgeModalOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [badgeForm, setBadgeForm] = useState({
        name: '',
        slug: '',
        icon: 'checkmark',
        category: 'both',
        style: {
            type: 'solid',
            primaryColor: '#1d9bf0',
            secondaryColor: '#ff8c00',
            animationType: 'none',
            glowColor: '',
            borderStyle: 'none',
        },
    });

    // Feedback Modal State
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [feedbackFilter, setFeedbackFilter] = useState('new'); // 'new', 'replied', 'all'

    // Portal Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailPortal, setDetailPortal] = useState(null);
    const [ownershipTarget, setOwnershipTarget] = useState('');
    const [transferring, setTransferring] = useState(false);

    // User Detail Modal State
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);


    // Feedbacks State
    const [feedbacks, setFeedbacks] = useState([]);
    const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

    // Tourist Admin State
    const [touristAdmins, setTouristAdmins] = useState([]);
    const [touristSearchTerm, setTouristSearchTerm] = useState('');
    const [touristSearchResult, setTouristSearchResult] = useState([]);
    const [selectedTouristUser, setSelectedTouristUser] = useState(null);
    const [touristDurationType, setTouristDurationType] = useState('preset'); // 'preset' or 'custom'
    const [selectedTouristPreset, setSelectedTouristPreset] = useState(2); // hours
    const [customTouristDate, setCustomTouristDate] = useState('');
    const [assigningTourist, setAssigningTourist] = useState(false);
    const [loadingTourist, setLoadingTourist] = useState(false);

    // Mass Notification State
    const [massNotifTitle, setMassNotifTitle] = useState('');
    const [massNotifMessage, setMassNotifMessage] = useState('');
    const [massNotifInApp, setMassNotifInApp] = useState(true);
    const [massNotifPush, setMassNotifPush] = useState(false);
    const [massNotifSending, setMassNotifSending] = useState(false);
    const [massNotifStatus, setMassNotifStatus] = useState({ type: '', text: '' });
    const [massNotifImage, setMassNotifImage] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleMassNotifFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const mediaKey = await uploadFile(file, 'post');
            setMassNotifImage(mediaKey);
        } catch (err) {
            console.error('Failed to upload image:', err);
            alert('Görsel yüklenirken bir hata oluştu.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSendMassNotification = async (e) => {
        e.preventDefault();
        if (!massNotifTitle.trim() || !massNotifMessage.trim()) {
            setMassNotifStatus({ type: 'error', text: 'Lütfen başlık ve mesaj alanlarını doldurun.' });
            return;
        }
        if (!massNotifInApp && !massNotifPush) {
            setMassNotifStatus({ type: 'error', text: 'Lütfen en az bir gönderim yöntemi seçin.' });
            return;
        }

        setMassNotifSending(true);
        setMassNotifStatus({ type: '', text: '' });

        try {
            const response = await axios.post('/api/admin/mass-notification', {
                title: massNotifTitle.trim(),
                message: massNotifMessage.trim(),
                inApp: massNotifInApp,
                push: massNotifPush,
                imageUrl: massNotifImage.trim() || undefined,
            });

            setMassNotifStatus({
                type: 'success',
                text: response.data.message || 'Toplu bildirim başarıyla gönderildi.'
            });
            setMassNotifTitle('');
            setMassNotifMessage('');
            setMassNotifImage('');
        } catch (err) {
            console.error('Send mass notification error:', err);
            setMassNotifStatus({
                type: 'error',
                text: err.response?.data?.message || 'Bildirim gönderilirken bir hata oluştu.'
            });
        } finally {
            setMassNotifSending(false);
        }
    };

    const analyzeImageFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve({ isTransparent: false, aspectRatio: 1 });
                        return;
                    }
                    ctx.drawImage(img, 0, 0);
                    try {
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                        let isTransparent = false;
                        for (let i = 3; i < imgData.length; i += 4) {
                            if (imgData[i] < 255) {
                                isTransparent = true;
                                break;
                            }
                        }
                        resolve({ isTransparent, aspectRatio: img.width / img.height });
                    } catch (err) {
                        resolve({ isTransparent: false, aspectRatio: img.width / img.height });
                    }
                };
                img.onerror = () => resolve({ isTransparent: false, aspectRatio: 1 });
                img.src = e.target.result;
            };
            reader.onerror = () => resolve({ isTransparent: false, aspectRatio: 1 });
            reader.readAsDataURL(file);
        });
    };

    const fetchCustomBadges = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/custom-badges');
            setCustomBadges(data);
        } catch (err) {
            setError('Özel rozetler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomBadgeFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingCustomBadge(true);
        try {
            const { isTransparent, aspectRatio } = await analyzeImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setCustomBadgeCropperImage(reader.result);
                setCustomBadgeCropperFile(file);
                setCustomBadgeCropperAspectRatio(isTransparent ? aspectRatio : 1.0);
                setUploadingCustomBadge(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Image analysis error:', err);
            setUploadingCustomBadge(false);
        }
    };

    const handleCustomBadgeCropComplete = async (croppedResult) => {
        setCustomBadgeCropperImage(null);
        setUploadingCustomBadge(true);
        try {
            let mediaKey;
            if (typeof croppedResult === 'string') {
                mediaKey = croppedResult;
            } else {
                mediaKey = await uploadFile(croppedResult, 'avatar');
            }

            setCustomBadgeUploadedKey(mediaKey);
            setCustomBadgeUploadedUrl(getImageUrl(mediaKey));
            alert('Görsel başarıyla yüklendi.');
        } catch (err) {
            alert('Görsel yüklenirken hata oluştu.');
        } finally {
            setUploadingCustomBadge(false);
        }
    };

    const handleSaveCustomBadge = async (e) => {
        e.preventDefault();
        if (!customBadgeName.trim()) {
            alert('Lütfen rozet ismi girin.');
            return;
        }
        if (!customBadgeUploadedUrl) {
            alert('Lütfen rozet görseli yükleyin.');
            return;
        }

        try {
            await axios.post('/api/admin/custom-badges', {
                name: customBadgeName.trim(),
                url: customBadgeUploadedUrl,
                key: customBadgeUploadedKey
            });
            setCustomBadgeName('');
            setCustomBadgeUploadedUrl('');
            setCustomBadgeUploadedKey('');
            fetchCustomBadges();
            alert('Özel rozet başarıyla eklendi.');
        } catch (err) {
            alert(err.response?.data?.message || 'Rozet kaydedilemedi.');
        }
    };

    const handleDeleteCustomBadge = async (badgeId) => {
        if (!window.confirm('Bu özel rozeti silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/custom-badges/${badgeId}`);
            fetchCustomBadges();
            alert('Rozet silindi.');
        } catch (err) {
            alert('Rozet silinemedi.');
        }
    };

    const handleCustomBadgeAssign = async (userId, badgeUrl, badgeName) => {
        try {
            const { data } = await axios.post(`/api/admin/users/${userId}/custom-badge`, {
                url: badgeUrl,
                name: badgeName
            });
            setUsers(
                users.map((u) =>
                    u._id === userId
                        ? { ...u, customBadge: { url: badgeUrl, name: badgeName } }
                        : u
                )
            );
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, customBadge: { url: badgeUrl, name: badgeName } } : prev);
            alert('Özel rozet kullanıcıya atandı.');
        } catch (err) {
            alert('Rozet atanamadı.');
        }
    };

    const fetchTouristAdmins = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/users');
            setTouristAdmins(data.filter(u => u.isTouristAdmin));
        } catch (err) {
            console.error('Failed to load tourist admins:', err);
            setError('Turist admin listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchTouristUser = async (e) => {
        if (e) e.preventDefault();
        if (!touristSearchTerm.trim()) return;
        setLoadingTourist(true);
        try {
            const { data } = await axios.get(`/api/admin/users?q=${touristSearchTerm.trim()}`);
            setTouristSearchResult(data.filter(u => u.username !== 'oxypace'));
        } catch (err) {
            alert('Kullanıcı arama başarısız.');
        } finally {
            setLoadingTourist(false);
        }
    };

    const handleAssignTouristAdmin = async () => {
        if (!selectedTouristUser) {
            alert('Lütfen bir kullanıcı seçin.');
            return;
        }

        let body = {};
        if (touristDurationType === 'preset') {
            body.duration = `${selectedTouristPreset}h`;
        } else {
            if (!customTouristDate) {
                alert('Lütfen geçerli bir tarih seçin.');
                return;
            }
            body.expiresAt = new Date(customTouristDate).toISOString();
        }

        setAssigningTourist(true);
        try {
            const { data } = await axios.post(`/api/admin/users/${selectedTouristUser._id}/tourist-admin`, body);
            alert(data.message || 'Turist admin başarıyla atandı.');
            setSelectedTouristUser(null);
            setTouristSearchTerm('');
            setTouristSearchResult([]);
            fetchTouristAdmins();
        } catch (err) {
            alert(err.response?.data?.message || 'Turist admin atanamadı.');
        } finally {
            setAssigningTourist(false);
        }
    };

    const handleRevokeTouristAdmin = async (userId) => {
        if (!window.confirm('Bu kullanıcının turist admin yetkilerini iptal etmek istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.post(`/api/admin/users/${userId}/tourist-admin`, { revoke: true });
            alert(data.message || 'Yetkiler başarıyla geri alındı.');
            fetchTouristAdmins();
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    useEffect(() => {
        const loadCustomBadges = async () => {
            try {
                const { data } = await axios.get('/api/admin/custom-badges');
                setCustomBadges(data);
            } catch (err) {
                console.error('Failed to load custom badges on mount:', err);
            }
        };
        if (isAdmin) {
            loadCustomBadges();
        }
    }, [isAdmin]);

    const fetchRecoveryRequests = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/recovery-requests');
            setRecoveryRequests(data);
        } catch (err) {
            setError('Kurtarma talepleri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'recovery') {
            fetchRecoveryRequests();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'portals') {
            fetchPortals();
        } else if (activeTab === 'reports' && isOxypace) {
            fetchReports();
        } else if (activeTab === 'badges') {
            fetchAllBadges();
        } else if (activeTab === 'custom-badges') {
            fetchCustomBadges();
        } else if (activeTab === 'feedback') {
            fetchFeedbacks();
        } else if (activeTab === 'ipbans') {
            fetchBannedIps();
        } else if (activeTab === 'system' && isOxypace) {
            fetchMaintenanceStatus();
        } else if (activeTab === 'tourist-admin' && isOxypace) {
            fetchTouristAdmins();
        }
    }, [activeTab, isOxypace]);

    // Aktif oturum izleme WebSocket dinleyicisi
    useEffect(() => {
        if (activeTab === 'activity' && socket && connected) {
            socket.emit('join_admin_presence');

            socket.on('admin_presence_update', (data) => {
                setActiveSessions(data);
            });

            return () => {
                socket.emit('leave_admin_presence');
                socket.off('admin_presence_update');
            };
        }
    }, [activeTab, socket, connected]);

    const fetchBannedIps = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/ip-bans');
            setBannedIps(data);
        } catch (err) {
            setError('Engelli IP listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleBanSubmit = async (reason, expiresAt) => {
        try {
            if (banModalTarget.type === 'user') {
                const userId = banModalTarget.id;
                await axios.put(`/api/admin/users/${userId}/ban`, { reason, expiresAt });
                alert('Kullanıcı başarıyla engellendi.');
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: true, banReason: reason, banExpiresAt: expiresAt } : u));
                setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isBanned: true, banReason: reason, banExpiresAt: expiresAt } : prev);
                if (activeTab === 'users') fetchUsers(searchTerm);
            } else if (banModalTarget.type === 'ip') {
                const ip = banModalTarget.id;
                await axios.post('/api/admin/ip-bans', { ip, reason, expiresAt });
                alert('IP adresi başarıyla engellendi.');
                if (activeTab === 'ipbans') fetchBannedIps();
            }
            setBanModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Engelleme işlemi başarısız.');
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Bu kullanıcının engelini kaldırmak istediğinize emin misiniz?')) return;
        try {
            await axios.put(`/api/admin/users/${userId}/unban`);
            alert('Kullanıcının engeli kaldırıldı.');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false, banReason: '', banExpiresAt: null } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isBanned: false, banReason: '', banExpiresAt: null } : prev);
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleUnbanIp = async (ip) => {
        if (!window.confirm(`Bu IP adresinin (${ip}) engelini kaldırmak istediğinize emin misiniz?`)) return;
        try {
            await axios.delete(`/api/admin/ip-bans/${ip}`);
            alert('IP adresinin engeli kaldırıldı.');
            if (activeTab === 'ipbans') fetchBannedIps();
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleImpersonate = async (userId) => {
        if (!window.confirm('Bu kullanıcının kimliğine bürünmek (Taklit Et) istediğinize emin misiniz?')) return;
        try {
            const { data } = await axios.post(`/api/admin/impersonate/${userId}`);
            const adminToken = localStorage.getItem('token');
            localStorage.setItem('admin_backup_token', adminToken);
            localStorage.setItem('token', data.token);
            alert(`Taklit modu başlatıldı: @${data.user.username}`);
            window.location.href = '/';
        } catch (err) {
            alert(err.response?.data?.message || 'Taklit modu başlatılamadı.');
        }
    };

    const fetchMaintenanceStatus = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/system-settings/maintenance');
            setMaintenanceActive(data.active);
        } catch (err) {
            setError('Bakım modu durumu yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        const confirmMsg = maintenanceActive
            ? 'Bakım modunu kapatmak ve platformu genel kullanıma açmak istediğinize emin misiniz?'
            : 'Bakım modunu açmak ve platformu genel kullanıma kapatmak istediğinize emin misiniz? Sitedeki tüm aktif kullanıcılar anında 404 sayfasına yönlendirilecektir.';
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const { data } = await axios.put('/api/admin/system-settings/maintenance', {
                active: !maintenanceActive
            });
            setMaintenanceActive(data.active);
            alert(data.message);
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    // Fetch Feedbacks for the dedicated tab
    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/feedback/admin/list');
            setFeedbacks(data);
            setUnreadFeedbackCount(data.filter(f => f.status === 'new').length);
        } catch (err) {
            setError('Geri bildirimler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-update unread count on mount
    useEffect(() => {
        const checkUnread = async () => {
            try {
                const { data } = await axios.get('/api/feedback/admin/list');
                setUnreadFeedbackCount(data.filter(f => f.status === 'new').length);
            } catch (err) {}
        };
        checkUnread();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/reports');
            setReports(data);
        } catch (err) {
            setError('Bildirilenler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveReport = async (reportId) => {
        try {
            await axios.put(`/api/reports/${reportId}/status`, { status: 'resolved' });
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
            alert('Bildirim çözüldü olarak işaretlendi.');
        } catch (err) {
            console.error('Resolve report error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Bu bildiriyi silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/reports/${reportId}`);
            setReports(prev => prev.filter(r => r._id !== reportId));
            alert('Bildirim silindi.');
        } catch (err) {
            console.error('Delete report error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleAdminDeletePost = async (postId, reportId) => {
        if (!window.confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/posts/${postId}`);
            alert('Gönderi başarıyla silindi.');
            // Auto mark the report resolved
            await axios.put(`/api/reports/${reportId}/status`, { status: 'resolved' });
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'resolved' } : r));
        } catch (err) {
            console.error('Admin delete post error:', err);
            alert('İşlem başarısız.');
        }
    };

    const handleFeedbackReply = async (feedbackId, response) => {
        try {
            await axios.post(`/api/feedback/admin/reply/${feedbackId}`, { response });
            setFeedbackModalOpen(false);
            fetchFeedbacks();
            alert('Yanıt iletildi!');
        } catch (err) {
            alert('Yanıt gönderilemedi.');
        }
    };

    const handleFeedbackMigration = async () => {
        if (!window.confirm('Eski iletişim verilerini yeni sisteme taşımak istiyor musunuz?')) return;
        setLoading(true);
        try {
            const { data } = await axios.post('/api/feedback/admin/migrate');
            alert(`${data.results.migrated} mesaj taşındı.`);
            fetchFeedbacks();
        } catch (err) {
            alert('Taşıma hatası.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/verification-requests');
            setRequests(data);
        } catch (err) {
            setError('Veriler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (query = '') => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/admin/users?q=${query}`);
            setUsers(data);
        } catch (err) {
            setError('Kullanıcılar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Bu kullanıcıyı onaylamak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/verify-user/${id}`);
            setRequests(requests.filter((req) => req._id !== id));
            alert('Kullanıcı doğrulandı!');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Bu başvuruyu reddetmek istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/reject-verification/${id}`);
            setRequests(requests.filter((req) => req._id !== id));
            alert('Başvuru reddedildi.');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleBadgeChange = async (userId, newBadge) => {
        try {
            await axios.put(`/api/admin/users/${userId}/badge`, { badge: newBadge });
            setUsers(
                users.map((user) =>
                    user._id === userId
                        ? { ...user, verificationBadge: newBadge, isVerified: newBadge !== 'none' }
                        : user
                )
            );
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, verificationBadge: newBadge, isVerified: newBadge !== 'none' } : prev);
        } catch (err) {
            alert('Rozet güncellenemedi.');
        }
    };

    const handleApproveRecovery = async (userId) => {
        if (!window.confirm('Bu kullanıcının hesap kurtarma talebini onaylamak istiyor musunuz? Hesabı tekrar aktif edilecektir.')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/recover-approve`);
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: false, recoveryStatus: 'approved' } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isDeleted: false, recoveryStatus: 'approved' } : prev);
            setRecoveryRequests(prev => prev.filter(r => r._id !== userId));
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert(err.response?.data?.message || 'Onaylama işlemi başarısız.');
        }
    };

    const handleRejectRecovery = async (userId) => {
        if (!window.confirm('Bu kullanıcının hesap kurtarma talebini reddetmek istiyor musunuz?')) return;
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/recover-reject`);
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, recoveryStatus: 'rejected' } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, recoveryStatus: 'rejected' } : prev);
            setRecoveryRequests(prev => prev.filter(r => r._id !== userId));
            if (activeTab === 'users') fetchUsers(searchTerm);
        } catch (err) {
            alert(err.response?.data?.message || 'Reddetme işlemi başarısız.');
        }
    };

    const openUserDetail = (user) => {
        setSelectedUserDetail(user);
        setUserDetailModalOpen(true);
    };

    const handleUserShadowbanToggle = async (userId, currentShadowbanned) => {
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/shadowban`, {
                isShadowbanned: !currentShadowbanned
            });
            alert(data.message);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isShadowbanned: data.user.isShadowbanned } : u));
            setSelectedUserDetail(prev => prev && prev._id === userId ? { ...prev, isShadowbanned: data.user.isShadowbanned } : prev);
        } catch (err) {
            alert('Hayalet mod durumu güncellenemedi.');
        }
    };

    // Search effect for users
    useEffect(() => {
        if (activeTab === 'users') {
            const delayDebounceFn = setTimeout(() => {
                fetchUsers(searchTerm);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm]);

    // Search effect for portals
    useEffect(() => {
        if (activeTab === 'portals') {
            const delayDebounceFn = setTimeout(() => {
                fetchPortals(searchTermPortal);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTermPortal]);

    const fetchPortals = async (query = '') => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/admin/portals?q=${query}`);
            setPortals(data);
        } catch (err) {
            setError('Portallar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handlePortalBadge = async (portalId, newBadge) => {
        try {
            // If selecting multiple badges is desired, logic would differ.
            // For now, assuming single badge selection like users for simplicity, or toggle.
            // To match user experience, let's treat it as a single primary badge or toggle verified.
            // But the backend expects an array. Let's send it as a single-item array for now.

            const badges = newBadge === 'none' ? [] : [newBadge];

            await axios.put(`/api/admin/portals/${portalId}`, { badges });
            setPortals(portals.map(p =>
                p._id === portalId ? { ...p, badges } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, badges } : prev);
        } catch (err) {
            alert('Rozet güncellenemedi.');
        }
    };

    const handleNSFWToggle = async (portalId, currentValue) => {
        try {
            await axios.put(`/api/admin/portals/${portalId}`, { isNSFW: !currentValue });
            setPortals(portals.map(p =>
                p._id === portalId ? { ...p, isNSFW: !currentValue } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, isNSFW: !currentValue } : prev);
        } catch (err) {
            alert('+18 durumu güncellenemedi.');
        }
    };

    const openPortalDetail = (portal) => {
        setDetailPortal(portal);
        setOwnershipTarget('');
        setDetailModalOpen(true);
    };

    const handleReadOnlyToggle = async (portalId, currentReadOnly) => {
        try {
            const { data } = await axios.put(`/api/admin/portals/${portalId}`, {
                isReadOnly: !currentReadOnly
            });
            const updated = data.portal;
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, isReadOnly: updated.isReadOnly } : p));
            setDetailPortal(prev => prev && prev._id === portalId ? { ...prev, isReadOnly: updated.isReadOnly } : prev);
        } catch (err) {
            alert('Salt okunur durumu güncellenemedi.');
        }
    };

    const handleTransferOwnership = async (portalId) => {
        if (!ownershipTarget.trim()) {
            alert('Lütfen hedef kullanıcının ID veya kullanıcı adını girin.');
            return;
        }

        const confirmMsg = `Portal sahipliğini @${ownershipTarget} kullanıcısına devretmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
        if (!window.confirm(confirmMsg)) return;

        setTransferring(true);
        try {
            const { data } = await axios.post(`/api/admin/portals/${portalId}/transfer-ownership`, {
                targetUserIdentifier: ownershipTarget.trim()
            });
            alert(data.message);
            setPortals(prev => prev.map(p => p._id === portalId ? { ...p, owner: data.portal.owner, members: data.portal.members } : p));
            setDetailPortal(data.portal);
            setOwnershipTarget('');
        } catch (err) {
            alert(err.response?.data?.message || 'Sahiplik devredilemedi.');
        } finally {
            setTransferring(false);
        }
    };

    // Open Modal for Status Change
    const initiatePortalStatusChange = (portalId, action) => {
        if (action === 'activate') {
            // Direct activation, no reason needed usually, or simple confirm
            if (window.confirm('Bu portalı tekrar aktifleştirmek istediğinize emin misiniz?')) {
                executePortalStatusChange(portalId, 'active', '');
            }
        } else {
            // Suspend or Close - Open Modal
            setSelectedPortalId(portalId);
            setModalAction(action);
            setModalOpen(true);
        }
    };

    const executePortalStatusChange = async (portalId, newStatus, reason, suspendedUntil = null) => {
        try {
            await axios.put(`/api/admin/portals/${portalId}`, {
                status: newStatus,
                statusReason: reason,
                suspendedUntil: suspendedUntil
            });
            setPortals(portals.map(p =>
                p._id === portalId ? {
                    ...p,
                    status: newStatus,
                    statusReason: reason,
                    suspendedUntil: suspendedUntil
                } : p
            ));
            setDetailPortal(prev => prev && prev._id === portalId ? {
                ...prev,
                status: newStatus,
                statusReason: reason,
                suspendedUntil: suspendedUntil
            } : prev);
            setModalOpen(false);
        } catch (err) {
            alert('Durum güncellenemedi.');
        }
    };

    const handleModalSubmit = (reason, suspendedUntil) => {
        const newStatus = modalAction === 'suspend' ? 'suspended' : 'closed';
        executePortalStatusChange(selectedPortalId, newStatus, reason, suspendedUntil);
    };

    const handlePortalWarning = async (portalId) => {
        const message = window.prompt('Uyarı mesajınızı yazın:');
        if (!message) return;

        try {
            await axios.post(`/api/admin/portals/${portalId}/warning`, { message });
            alert('Uyarı gönderildi.');
        } catch (err) {
            alert('Uyarı gönderilemedi.');
        }
    };

    // --- Portal Alert System ---
    const openAlertModal = (portalId, portalName) => {
        setAlertPortalId(portalId);
        setAlertPortalName(portalName);
        setAlertModalOpen(true);
    };

    const handleAlertSubmit = async (message, expiresAt) => {
        try {
            const { data } = await axios.post(`/api/admin/portals/${alertPortalId}/alert`, { message, expiresAt });
            setAlertModalOpen(false);
            alert('Uyarı başarıyla yayınlandı!');
            fetchPortals(searchTermPortal);
            setDetailPortal(prev => {
                if (prev && prev._id === alertPortalId) {
                    const updatedAlerts = [...(prev.alerts || []), data.alert];
                    return { ...prev, alerts: updatedAlerts };
                }
                return prev;
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Uyarı gönderilemedi.');
        }
    };

    const handleRemoveAlert = async (portalId, alertId) => {
        if (!window.confirm('Bu uyarıyı kaldırmak istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/admin/portals/${portalId}/alert/${alertId}`);
            alert('Uyarı kaldırıldı.');
            fetchPortals(searchTermPortal);
            setDetailPortal(prev => {
                if (prev && prev._id === portalId) {
                    const updatedAlerts = (prev.alerts || []).map(a => a._id === alertId ? { ...a, isActive: false } : a);
                    return { ...prev, alerts: updatedAlerts };
                }
                return prev;
            });
        } catch (err) {
            alert('Uyarı kaldırılamadı.');
        }
    };

    // ===== BADGE CRUD =====
    const fetchAllBadges = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/badges');
            setAllBadges(data);
        } catch (err) {
            setError('Rozetler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSeedBadges = async () => {
        try {
            const { data } = await axios.post('/api/badges/seed');
            alert(data.message);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert('Seed işlemi başarısız.');
        }
    };

    const openBadgeCreator = (badge = null) => {
        if (badge) {
            setEditingBadge(badge);
            setBadgeForm({
                name: badge.name,
                slug: badge.slug,
                icon: badge.icon,
                category: badge.category,
                style: { ...badge.style },
            });
        } else {
            setEditingBadge(null);
            setBadgeForm({
                name: '',
                slug: '',
                icon: 'checkmark',
                category: 'both',
                style: {
                    type: 'solid',
                    primaryColor: '#1d9bf0',
                    secondaryColor: '#ff8c00',
                    animationType: 'none',
                    glowColor: '',
                    borderStyle: 'none',
                },
            });
        }
        setBadgeModalOpen(true);
    };

    const handleBadgeSave = async () => {
        if (!badgeForm.name || !badgeForm.slug) {
            alert('İsim ve slug zorunludur.');
            return;
        }
        try {
            if (editingBadge) {
                await axios.put(`/api/badges/${editingBadge._id}`, badgeForm);
            } else {
                await axios.post('/api/badges', badgeForm);
            }
            setBadgeModalOpen(false);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'İşlem başarısız.');
        }
    };

    const handleBadgeDelete = async (badgeId) => {
        if (!window.confirm('Bu rozeti silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/badges/${badgeId}`);
            fetchAllBadges();
            refreshBadges();
        } catch (err) {
            alert(err.response?.data?.message || 'Silme başarısız.');
        }
    };

    const ICONS = [
        { value: 'checkmark', label: 'Onay' },
        { value: 'star', label: 'Yıldız' },
        { value: 'shield', label: 'Kalkan' },
        { value: 'lightning', label: 'Şimşek' },
        { value: 'diamond', label: 'Elmas' },
        { value: 'crown', label: 'Taç' },
        { value: 'fire', label: 'Ateş' },
        { value: 'heart', label: 'Kalp' },
        { value: 'rocket', label: 'Roket' },
        { value: 'globe', label: 'Dünya' },
        { value: 'sparkle', label: 'Parıltı' },
        { value: 'music', label: 'Müzik' },
        { value: 'award', label: 'Ödül' },
        { value: 'gem', label: 'Mücevher' },
        { value: 'verified', label: 'Doğrulanmış' },
        { value: 'eye', label: 'Göz' },
        { value: 'swords', label: 'Kılıç' },
        { value: 'hexagon', label: 'Altıgen' },
        { value: 'triangle', label: 'Üçgen' },
        { value: 'atom', label: 'Atom' },
    ];
    const STYLE_TYPES = [
        { value: 'solid', label: 'Düz Renk', desc: 'Tekli renk dolgu' },
        { value: 'gradient', label: 'Gradient', desc: 'İki renkli geçişli' },
        { value: 'iridescent', label: 'İridesans', desc: 'Gökkuşağı hue döngüsü' },
        { value: 'animated', label: 'Animasyonlu', desc: 'Hareket efektli' },
    ];
    const ANIM_TYPES = [
        { value: 'none', label: 'Yok' },
        { value: 'pulse', label: 'Nabız' },
        { value: 'glow', label: 'Parıltı' },
        { value: 'spin', label: 'Dönme' },
        { value: 'shimmer', label: 'Işıltı' },
        { value: 'bounce', label: 'Zıplama' },
    ];

    // Auto-generate slug from name (Turkish chars → ASCII)
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleNameChange = (name) => {
        const newForm = { ...badgeForm, name };
        // Auto-generate slug only for new badges (not editing defaults)
        if (!editingBadge || !editingBadge.isDefault) {
            newForm.slug = generateSlug(name);
        }
        setBadgeForm(newForm);
    };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-title">
                <button
                    className="admin-home-btn"
                    onClick={() => navigate('/')}
                    title="Anasayfa"
                >
                    <Home size={20} />
                </button>
                Yönetici Paneli
            </h1>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Başvurular
                    {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'recovery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recovery')}
                >
                    Kurtarma Talepleri
                    {recoveryRequests.length > 0 && <span className="tab-badge">{recoveryRequests.length}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Kullanıcılar
                </button>
                <button
                    className={`admin-tab ${activeTab === 'portals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('portals')}
                >
                    Portallar
                </button>
                <button
                    className={`admin-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    Talepler
                    {unreadFeedbackCount > 0 && <span className="tab-badge">{unreadFeedbackCount}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    Aktif Oturumlar
                </button>
                <button
                    className={`admin-tab ${activeTab === 'ipbans' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ipbans')}
                >
                    IP Engelleri
                </button>
                <button
                    className={`admin-tab ${activeTab === 'badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                >
                    Rozetler
                </button>
                <button
                    className={`admin-tab ${activeTab === 'custom-badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('custom-badges')}
                >
                    Özel İkon Rozetler
                </button>
                <button
                    className={`admin-tab ${activeTab === 'mass-notification' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mass-notification')}
                >
                    Toplu Bildirim Gönder
                </button>
                {(isOxypace || currentUser?.isAdmin || currentUser?.isTouristAdmin) && (
                    <button
                        className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        Bildirilenler
                        {reports.filter(r => r.status === 'pending').length > 0 &&
                            <span className="tab-badge">{reports.filter(r => r.status === 'pending').length}</span>
                        }
                    </button>
                )}
                {(isOxypace || currentUser?.isAdmin || currentUser?.isTouristAdmin) && (
                    <button
                        className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        Sistem Ayarları
                    </button>
                )}
                {isOxypace && (
                    <button
                        className={`admin-tab ${activeTab === 'tourist-admin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tourist-admin')}
                    >
                        Turist Admin Ata
                    </button>
                )}
            </div>

            <div className="admin-content">
                {activeTab === 'tourist-admin' && isOxypace && (
                    <div className="tourist-admin-container fade-in">
                        <div className="tourist-admin-card">
                            <div className="tourist-admin-header">
                                <h2>💼 Turist Admin Atama Paneli</h2>
                                <p>Sadece @oxypace tarafından yönetilen bu modülle kullanıcılara geçici admin yetkileri atayabilirsiniz.</p>
                            </div>

                            <div className="tourist-assign-section">
                                <h3 className="section-subtitle">➕ Yeni Turist Admin Yetkilendir</h3>
                                <form onSubmit={handleSearchTouristUser} className="tourist-search-form">
                                    <div className="form-group-modern search-with-btn">
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            placeholder="Kullanıcı adı veya email ile ara..."
                                            value={touristSearchTerm}
                                            onChange={(e) => setTouristSearchTerm(e.target.value)}
                                        />
                                        <button type="submit" className="btn-modern-primary" disabled={loadingTourist}>
                                            {loadingTourist ? 'Aranıyor...' : 'Ara'}
                                        </button>
                                    </div>
                                </form>

                                {touristSearchResult.length > 0 && (
                                    <div className="search-results-list">
                                        <h4>Arama Sonuçları:</h4>
                                        <div className="results-grid">
                                            {touristSearchResult.map(u => (
                                                <div 
                                                    key={u._id} 
                                                    className={`result-user-card ${selectedTouristUser?._id === u._id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedTouristUser(u)}
                                                >
                                                    <UserAvatar src={u.profile?.avatar} alt={u.username} className="avatar-mini" />
                                                    <div className="user-info-mini">
                                                        <strong>{u.profile?.displayName || u.username}</strong>
                                                        <span>@{u.username}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTouristUser && (
                                    <div className="assignment-details-form fade-in">
                                        <div className="selected-user-banner">
                                            <span>Seçilen Kullanıcı:</span>
                                            <strong>@{selectedTouristUser.username}</strong>
                                        </div>

                                        <div className="form-group-modern">
                                            <label className="badge-label">Süre Tipi</label>
                                            <div className="duration-type-toggle">
                                                <button
                                                    type="button"
                                                    className={`duration-type-btn ${touristDurationType === 'preset' ? 'active' : ''}`}
                                                    onClick={() => setTouristDurationType('preset')}
                                                >
                                                    Hazır Süre
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`duration-type-btn ${touristDurationType === 'custom' ? 'active' : ''}`}
                                                    onClick={() => setTouristDurationType('custom')}
                                                >
                                                    Özel Bitiş Tarihi
                                                </button>
                                            </div>
                                        </div>

                                        {touristDurationType === 'preset' ? (
                                            <div className="form-group-modern">
                                                <label className="badge-label">Hazır Süre Seçin</label>
                                                <div className="preset-grid">
                                                    {[
                                                        { label: '2 Saat', val: 2 },
                                                        { label: '6 Saat', val: 6 },
                                                        { label: '12 Saat', val: 12 },
                                                        { label: '1 Gün (24 Saat)', val: 24 },
                                                        { label: '3 Gün', val: 72 },
                                                        { label: '7 Gün', val: 168 }
                                                    ].map(p => (
                                                        <button
                                                            key={p.val}
                                                            type="button"
                                                            className={`preset-btn ${selectedTouristPreset === p.val ? 'active' : ''}`}
                                                            onClick={() => setSelectedTouristPreset(p.val)}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="form-group-modern">
                                                <label className="badge-label">Bitiş Tarihi ve Saati</label>
                                                <input
                                                    type="datetime-local"
                                                    className="custom-date-input"
                                                    value={customTouristDate}
                                                    onChange={(e) => setCustomTouristDate(e.target.value)}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                />
                                            </div>
                                        )}

                                        <div className="form-actions-modern">
                                            <button
                                                type="button"
                                                className="btn-modern-primary btn-glow-cyan"
                                                onClick={handleAssignTouristAdmin}
                                                disabled={assigningTourist}
                                                style={{ width: '100%', padding: '12px' }}
                                            >
                                                {assigningTourist ? 'ATANIYOR...' : '💼 TURİST ADMIN OLARAK ATA'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="tourist-list-section">
                                <h3 className="section-subtitle">👥 Aktif Turist Adminler</h3>
                                {loading ? (
                                    <div className="admin-loading">Yükleniyor...</div>
                                ) : touristAdmins.length === 0 ? (
                                    <p className="no-data">Şu an aktif hiçbir Turist Admin bulunmamaktadır.</p>
                                ) : (
                                    <div className="tourist-admins-table-wrapper">
                                        <table className="tourist-table">
                                            <thead>
                                                <tr>
                                                    <th>Kullanıcı</th>
                                                    <th>Atayan</th>
                                                    <th>Bitiş Tarihi</th>
                                                    <th>Kalan Süre</th>
                                                    <th>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {touristAdmins.map(admin => {
                                                    const expiresAt = new Date(admin.touristAdminExpiresAt);
                                                    const timeLeftMs = expiresAt - new Date();
                                                    let timeLeftStr = 'Süresi doldu';
                                                    if (timeLeftMs > 0) {
                                                        const diffHours = Math.floor(timeLeftMs / (1000 * 60 * 60));
                                                        const diffMins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                                                        timeLeftStr = diffHours > 0 ? `${diffHours} sa ${diffMins} dk` : `${diffMins} dk`;
                                                    }
                                                    return (
                                                        <tr key={admin._id}>
                                                            <td>
                                                                <div className="table-user-cell">
                                                                    <UserAvatar src={admin.profile?.avatar} alt={admin.username} className="avatar-table" />
                                                                    <div className="user-info-table">
                                                                        <strong>{admin.profile?.displayName || admin.username}</strong>
                                                                        <span>@{admin.username}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>@{admin.assignedBy || 'oxypace'}</td>
                                                            <td>{expiresAt.toLocaleString('tr-TR')}</td>
                                                            <td>
                                                                <span className="time-left-badge">{timeLeftStr}</span>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    onClick={() => handleRevokeTouristAdmin(admin._id)}
                                                                    className="btn-revoke-tourist"
                                                                >
                                                                    Yetkiyi Kaldır
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mass-notification' && (
                    <div className="mass-notification-container fade-in">
                        <div className="mass-notification-card">
                            <div className="mass-notif-header">
                                <h2>📢 Toplu Bildirim ve Android Push Paneli</h2>
                                <p>Sistemdeki aktif kullanıcılara in-app bildirim veya Android push bildirimi gönderin.</p>
                            </div>

                            {massNotifStatus.text && (
                                <div className={`status-banner ${massNotifStatus.type}`}>
                                    {massNotifStatus.type === 'success' ? '✅' : '❌'} {massNotifStatus.text}
                                </div>
                            )}

                            <form onSubmit={handleSendMassNotification} className="mass-notif-form">
                                <div className="form-group-modern">
                                    <label className="badge-label">Bildirim Başlığı</label>
                                    <input
                                        type="text"
                                        className="reason-input-modern"
                                        placeholder="Örn: Önemli Sistem Güncellemesi"
                                        value={massNotifTitle}
                                        onChange={(e) => setMassNotifTitle(e.target.value)}
                                        required
                                        disabled={massNotifSending}
                                    />
                                </div>

                                <div className="form-group-modern">
                                    <label className="badge-label">Mesaj Metni</label>
                                    <textarea
                                        className="reason-input-modern"
                                        placeholder="Kullanıcılara iletilecek mesaj içeriğini yazın..."
                                        rows="5"
                                        value={massNotifMessage}
                                        onChange={(e) => setMassNotifMessage(e.target.value)}
                                        required
                                        disabled={massNotifSending}
                                    />
                                </div>

                                <div className="form-group-modern">
                                    <label className="badge-label">Görsel (Opsiyonel)</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            placeholder="Görsel URL girin veya dosya seçin..."
                                            value={massNotifImage}
                                            onChange={(e) => setMassNotifImage(e.target.value)}
                                            disabled={massNotifSending}
                                            style={{ flex: 1 }}
                                        />
                                        <label className="btn-modern-ghost" style={{ cursor: 'pointer', margin: 0, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px', whiteSpace: 'nowrap' }}>
                                            {uploadingImage ? 'Yükleniyor...' : 'Dosya Seç'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleMassNotifFileSelect}
                                                disabled={massNotifSending || uploadingImage}
                                            />
                                        </label>
                                    </div>
                                    {massNotifImage && (
                                        <div style={{ position: 'relative', width: 'fit-content', marginTop: '10px' }}>
                                            <img 
                                                src={getImageUrl(massNotifImage)} 
                                                alt="Önizleme" 
                                                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setMassNotifImage('')}
                                                style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4b4b', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group-modern checkboxes-group">
                                    <label className="badge-label">Gönderim Kanalları</label>
                                    <div className="checkbox-options-grid">
                                        <label className={`checkbox-card-label ${massNotifInApp ? 'checked' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={massNotifInApp}
                                                onChange={(e) => setMassNotifInApp(e.target.checked)}
                                                disabled={massNotifSending}
                                            />
                                            <div className="checkbox-custom"></div>
                                            <div className="checkbox-text-content">
                                                <strong>Web Toplu Bildirim (In-App)</strong>
                                                <span>Aktif kullanıcıların bildirim sayfasına eklenir, sayaç anlık güncellenir.</span>
                                            </div>
                                        </label>

                                        <label className={`checkbox-card-label ${massNotifPush ? 'checked' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={massNotifPush}
                                                onChange={(e) => setMassNotifPush(e.target.checked)}
                                                disabled={massNotifSending}
                                            />
                                            <div className="checkbox-custom"></div>
                                            <div className="checkbox-text-content">
                                                <strong>Android Mobil Bildirimi (Push)</strong>
                                                <span>Android APK'ya sahip tüm cihazlara yerel push bildirimi gönderilir.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions-modern">
                                    <button
                                        type="submit"
                                        className="btn-modern-primary btn-glow-cyan"
                                        disabled={massNotifSending}
                                        style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                                    >
                                        {massNotifSending ? 'GÖNDERİLİYOR...' : '📢 BİLDİRİMİ GÖNDER'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    // --- REQUESTS TAB ---
                    <div className="requests-section">
                        {loading && <div className="admin-loading">Yükleniyor...</div>}
                        {!loading && requests.length === 0 && (
                            <p className="no-data">Bekleyen başvuru bulunmamaktadır.</p>
                        )}
                        <div className="requests-grid">
                            {requests.map((user) => (
                                <div key={user._id} className="request-card">
                                    <div className="request-header">
                                        <img
                                            src={
                                                user.profile.avatar ||
                                                'https://via.placeholder.com/150'
                                            }
                                            alt={user.username}
                                            className="request-avatar"
                                        />
                                        <div className="request-user-info">
                                            <h3>{user.profile.displayName}</h3>
                                            <span>@{user.username}</span>
                                        </div>
                                    </div>
                                    <div className="request-details">
                                        <div className="detail-item">
                                            <span>Kategori:</span>
                                            <strong>
                                                {user.verificationRequest.category?.toUpperCase()}
                                            </strong>
                                        </div>
                                        <div className="detail-item">
                                            <span>Talep:</span>
                                            <span className="badge-pill">
                                                {user.verificationRequest.badgeType?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleReject(user._id)}
                                        >
                                            Reddet
                                        </button>
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApprove(user._id)}
                                        >
                                            Onayla
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'recovery' && (
                    // --- RECOVERY REQUESTS TAB ---
                    <div className="requests-section">
                        {loading && <div className="admin-loading">Yükleniyor...</div>}
                        {!loading && recoveryRequests.length === 0 && (
                            <p className="no-data">Bekleyen hesap kurtarma başvurusu bulunmamaktadır.</p>
                        )}
                        <div className="requests-grid">
                            {recoveryRequests.map((user) => (
                                <div key={user._id} className="request-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div className="request-header" style={{ cursor: 'pointer' }} onClick={() => openUserDetail(user)}>
                                        <img
                                            src={
                                                user.profile?.avatar ||
                                                'https://via.placeholder.com/150'
                                            }
                                            alt={user.username}
                                            className="request-avatar"
                                        />
                                        <div className="request-user-info">
                                            <h3>{user.profile?.displayName || user.username}</h3>
                                            <span>@{user.username}</span>
                                        </div>
                                    </div>
                                    <div className="request-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                                        <div style={{ fontSize: '13px', color: '#ccc' }}>
                                            <span style={{ color: '#888' }}>Gerekçe: </span>
                                            <strong>{user.recoveryReason || 'Gerekçe belirtilmemiş.'}</strong>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleRejectRecovery(user._id)}
                                        >
                                            Reddet
                                        </button>
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApproveRecovery(user._id)}
                                        >
                                            Onayla
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    // --- USERS TAB ---
                    <div className="users-section">
                        <div className="users-search">
                            <input
                                type="text"
                                placeholder="Kullanıcı ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading && <div className="admin-loading">Yükleniyor...</div>}

                        <div className="admin-users-avatar-grid">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    className={`admin-user-avatar-card ${user.isBanned ? 'banned' : ''} ${user.isShadowbanned ? 'shadowbanned' : ''}`}
                                    onClick={() => openUserDetail(user)}
                                >
                                    <div className="avatar-wrapper-modern">
                                        <UserAvatar
                                            src={user.profile?.avatar}
                                            alt={user.username}
                                            className="admin-user-avatar-img"
                                        />
                                        {user.isBanned && <span className="banned-indicator-dot">🚫</span>}
                                        {user.isShadowbanned && <span className="shadowbanned-indicator-dot">👻</span>}
                                    </div>
                                    <div className="admin-user-avatar-name">
                                        {user.profile?.displayName || user.username}
                                    </div>
                                    <div className="admin-user-avatar-username">
                                        @{user.username}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'portals' && (
                    <div className="portals-section">
                        <div className="users-search">
                            <input
                                type="text"
                                placeholder="Portal ara..."
                                value={searchTermPortal}
                                onChange={(e) => setSearchTermPortal(e.target.value)}
                            />
                        </div>

                        {loading && <div className="admin-loading">Yükleniyor...</div>}

                        <div className="admin-portals-grid">
                            {portals.map((portal) => {
                                const defaultBanner = 'linear-gradient(45deg, #4f46e5, #9333ea)';
                                return (
                                    <div
                                        key={portal._id}
                                        className="admin-portal-card"
                                        onClick={() => openPortalDetail(portal)}
                                    >
                                        <div
                                            className="card-banner"
                                            style={{
                                                background: portal.banner
                                                    ? `url(${getImageUrl(portal.banner)}) center/cover`
                                                    : defaultBanner,
                                            }}
                                        >
                                            {portal.isNSFW && (
                                                <span className="nsfw-badge-admin">+18</span>
                                            )}
                                        </div>

                                        <div className="card-icon-wrapper">
                                            {portal.avatar ? (
                                                <img
                                                    src={getImageUrl(portal.avatar)}
                                                    alt={portal.name}
                                                    className="user-list-avatar"
                                                    style={{ borderRadius: '12px', width: '100%', height: '100%' }}
                                                />
                                            ) : (
                                                <div className="card-icon-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: 'white', fontWeight: 'bold', borderRadius: '12px', width: '100%', height: '100%' }}>
                                                    {portal.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            <h3 className="card-title">
                                                {portal.name}
                                                <Badge type={portal.isVerified ? 'verified' : portal.badges?.[0]} size={18} />
                                                {portal.isReadOnly && <span className="read-only-badge" style={{ marginLeft: 'auto' }}>SALT OKUNUR</span>}
                                            </h3>
                                            <p className="card-desc">
                                                {portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.'}
                                            </p>

                                            <div className="card-footer">
                                                <span className="member-count">
                                                    <span className="status-dot"></span>
                                                    {portal.members ? portal.members.length : 0} Üye
                                                </span>
                                                <span className={`badge-pill-status ${portal.status}`}>
                                                    {portal.status === 'active' ? 'Aktif' : portal.status === 'suspended' ? 'Askıda' : 'Kapalı'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ===== BADGES TAB ===== */}
                {activeTab === 'badges' && (
                    <div className="badges-section fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                            <button className="btn-modern-primary" onClick={() => openBadgeCreator()} style={{ padding: '10px 20px', fontSize: '14px' }}>
                                + Yeni Rozet
                            </button>
                            <button className="btn-modern-ghost" onClick={handleSeedBadges} style={{ padding: '8px 16px', fontSize: '12px' }}>
                                🌱 Varsayılan Rozetleri Yükle
                            </button>
                        </div>

                        {loading && <div className="admin-loading">Yükleniyor...</div>}

                        <div className="badge-grid">
                            {allBadges.map((badge) => (
                                <div key={badge._id || badge.slug} className="badge-card">
                                    <div className="badge-card-preview">
                                        <Badge type={badge.slug} size={40} />
                                    </div>
                                    <div className="badge-card-info">
                                        <div className="badge-card-name">{badge.name}</div>
                                        <div className="badge-card-slug">{badge.slug}</div>
                                        <div className="badge-card-meta">
                                            <span className="badge-card-tag">{badge.style?.type}</span>
                                            <span className="badge-card-tag">{badge.icon}</span>
                                            {badge.style?.animationType !== 'none' && <span className="badge-card-tag anim">{badge.style.animationType}</span>}
                                            {badge.isDefault && <span className="badge-card-tag default">varsayılan</span>}
                                        </div>
                                    </div>
                                    <div className="badge-card-actions">
                                        <button className="badge-edit-btn" onClick={() => openBadgeCreator(badge)} title="Düzenle">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="m16 3 5 5-11 11H5v-5L16 3z" />
                                            </svg>
                                        </button>
                                        {!badge.isDefault && (
                                            <button className="badge-delete-btn" onClick={() => handleBadgeDelete(badge._id)} title="Sil">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (isOxypace || currentUser?.isAdmin || currentUser?.isTouristAdmin) && (() => {
                    const getReportReasonLabel = (reason) => {
                        switch (reason) {
                            case 'spam': return { label: 'İstenmeyen İçerik (Spam)', bg: 'rgba(52, 152, 219, 0.15)', text: '#3498db' };
                            case 'harassment': return { label: 'Taciz veya Zorbalık', bg: 'rgba(230, 126, 34, 0.15)', text: '#e67e22' };
                            case 'hate_speech': return { label: 'Nefret Söylemi', bg: 'rgba(231, 76, 60, 0.15)', text: '#e74c3c' };
                            case 'violence': return { label: 'Şiddet veya Tehdit', bg: 'rgba(155, 89, 182, 0.15)', text: '#9b59b6' };
                            case 'sexual_content': return { label: 'Müstehcenlik veya Cinsel İçerik', bg: 'rgba(241, 196, 15, 0.15)', text: '#f1c40f' };
                            default: return { label: 'Diğer Nedenler', bg: 'rgba(149, 165, 166, 0.15)', text: '#95a5a6' };
                        }
                    };

                    const filters = ['pending', 'resolved', 'all'];
                    const filterLabels = {
                        pending: 'Bekleyenler',
                        resolved: 'Çözülenler',
                        all: 'Tümü'
                    };

                    const filteredReports = reports.filter(r => {
                        if (reportFilter === 'all') return true;
                        return r.status === reportFilter;
                    });

                    return (
                        <div className="reports-section fade-in">
                            <div className="report-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {filters.map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setReportFilter(filter)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            background: reportFilter === filter ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                                            color: reportFilter === filter ? '#fff' : 'var(--text-muted)',
                                            transition: '0.2s ease',
                                        }}
                                    >
                                        {filterLabels[filter]}
                                    </button>
                                ))}
                            </div>

                            {loading && <div className="admin-loading">Yükleniyor...</div>}

                            {!loading && filteredReports.length === 0 && (
                                <p className="no-data">Bildirim bulunamadı.</p>
                            )}

                            <div className="reports-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {filteredReports.map((report) => {
                                    const reasonStyle = getReportReasonLabel(report.reason);
                                    const reportedPost = report.targetPost;
                                    const reportedUser = report.targetUser;

                                    return (
                                        <div key={report._id} className="report-card-dashboard" style={{
                                            background: 'var(--bg-secondary)',
                                            border: `1px solid ${report.status === 'pending' ? 'rgba(231, 76, 60, 0.3)' : 'var(--border-subtle)'}`,
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '15px',
                                            boxShadow: report.status === 'pending' ? '0 4px 12px rgba(231, 76, 60, 0.05)' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Bildiren</span>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {report.reporter?.profile?.displayName || report.reporter?.username || 'Silinmiş Kullanıcı'}
                                                            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>@{report.reporter?.username}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        background: reasonStyle.bg,
                                                        color: reasonStyle.text,
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {reasonStyle.label}
                                                    </span>
                                                    <span style={{
                                                        background: report.targetType === 'post' ? 'rgba(0, 200, 81, 0.15)' : 'rgba(17, 168, 255, 0.15)',
                                                        color: report.targetType === 'post' ? '#00c851' : '#11a8ff',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {report.targetType === 'post' ? 'GÖNDERİ' : 'KULLANICI'}
                                                    </span>
                                                    {report.status === 'pending' && (
                                                        <span style={{ background: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            BEKLEMEDE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Report Details */}
                                            {report.details && (
                                                <div style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                    background: 'rgba(0,0,0,0.15)',
                                                    padding: '12px 15px',
                                                    borderRadius: '8px',
                                                    borderLeft: '3px solid #ff4b4b'
                                                }}>
                                                    <strong>Açıklama:</strong> {report.details}
                                                </div>
                                            )}

                                            {/* Target Post View */}
                                            {report.targetType === 'post' && reportedPost && (
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={reportedPost.author?.profile?.avatar || 'https://via.placeholder.com/40'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                                {reportedPost.author?.profile?.displayName || reportedPost.author?.username}
                                                                <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>@{reportedPost.author?.username}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(reportedPost.createdAt).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', paddingLeft: '42px' }}>
                                                        {reportedPost.content}
                                                    </div>
                                                    {reportedPost.media && (
                                                        <div style={{ paddingLeft: '42px', marginTop: '6px' }}>
                                                            {reportedPost.mediaType === 'video' ? (
                                                                <video src={getImageUrl(reportedPost.media)} style={{ maxWidth: '200px', borderRadius: '8px' }} controls />
                                                            ) : (
                                                                <img src={getImageUrl(reportedPost.media)} alt="" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Target User View */}
                                            {report.targetType === 'user' && reportedUser && (
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <img src={reportedUser.profile?.avatar || 'https://via.placeholder.com/50'} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                            {reportedUser.profile?.displayName || reportedUser.username}
                                                            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>@{reportedUser.username}</span>
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            Hesap Türü: {reportedUser.settings?.privacy?.isPrivate ? 'Gizli Hesap' : 'Açık Hesap'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '5px' }}>
                                                {report.targetType === 'post' && reportedPost && (
                                                    <button
                                                        onClick={() => navigate(`/post/${reportedPost._id}`)}
                                                        style={{ background: 'rgba(17, 168, 255, 0.1)', color: '#11a8ff', border: '1px solid #11a8ff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Gönderiye Git
                                                    </button>
                                                )}
                                                {report.targetType === 'user' && reportedUser && (
                                                    <button
                                                        onClick={() => navigate(`/profile/${reportedUser.username}`)}
                                                        style={{ background: 'rgba(17, 168, 255, 0.1)', color: '#11a8ff', border: '1px solid #11a8ff', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Profile Git
                                                    </button>
                                                )}
                                                {report.targetType === 'user' && reportedUser && (
                                                    <button
                                                        onClick={() => {
                                                            setBanModalTarget({ type: 'user', id: reportedUser._id });
                                                            setBanModalOpen(true);
                                                        }}
                                                        style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Kullanıcıyı Engelle
                                                    </button>
                                                )}
                                                {report.targetType === 'post' && reportedPost && (
                                                    <button
                                                        onClick={() => handleAdminDeletePost(reportedPost._id, report._id)}
                                                        style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Gönderiyi Sil
                                                    </button>
                                                )}
                                                {report.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => handleResolveReport(report._id)}
                                                        style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                    >
                                                        Çözüldü İşaretle
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteReport(report._id)}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                                                >
                                                    Bildirimi Sil
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'feedback' && (
                    <div className="feedback-section fade-in">
                        <div className="section-header-modern">
                            <div className="header-left">
                                <h2>Community Feedback / Talepler</h2>
                                <p>Kullanıcılardan gelen öneri, şikayet ve hata bildirimlerini yönetin.</p>
                            </div>
                            <div className="header-right">
                                <button onClick={handleFeedbackMigration} className="btn-modern-ghost migration-btn">
                                    Eski Verileri Taşı
                                </button>
                                <select 
                                    className="filter-select-modern"
                                    value={feedbackFilter}
                                    onChange={(e) => setFeedbackFilter(e.target.value)}
                                >
                                    <option value="all">Tüm Talepler</option>
                                    <option value="new">Sadece Yeniler</option>
                                    <option value="replied">Yanıtlananlar</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-loading">Veriler Çekiliyor...</div>
                        ) : (
                            <div className="feedback-list-grid">
                                {feedbacks
                                    .filter(f => feedbackFilter === 'all' || f.status === feedbackFilter)
                                    .map(fb => (
                                    <div 
                                        key={fb._id} 
                                        className={`feedback-dashboard-card-v2 ${fb.status}`}
                                        onClick={() => { setSelectedFeedback(fb); setFeedbackModalOpen(true); }}
                                    >
                                        <div className="card-v2-header">
                                            <div className={`status-dot ${fb.status || 'new'}`}></div>
                                            <span className={`category-tag-v2 ${(fb.category?.toLowerCase() || 'genel').replace(/\s+/g, '-')}`}>{fb.category || 'Genel'}</span>
                                            <span className="date-text-v2">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                                        </div>

                                        <div className="card-v2-content">
                                            <div className="card-v2-text">
                                                <h3 className="fb-v2-subject">{fb.subject}</h3>
                                                <div className="fb-v2-sender">
                                                    <img 
                                                        src={fb.user?.profile?.avatar || '/system/deleted-user.png'} 
                                                        alt="" 
                                                        className="v2-avatar-tiny" 
                                                    />
                                                    <span>{fb.user ? `@${fb.user.username}` : 'Silinmiş Kullanıcı'}</span>
                                                </div>
                                                <p className="fb-v2-message-snippet">{fb.message ? fb.message.substring(0, 70) : 'Mesaj içeriği yok'}...</p>
                                            </div>

                                            {fb.files && fb.files.length > 0 && (
                                                <div className="card-v2-visual">
                                                    <div className="thumb-stack">
                                                        <img src={fb.files[0]} alt="" className="fb-v2-thumb" />
                                                        {fb.files.length > 1 && (
                                                            <div className="thumb-count-overlay">+{fb.files.length - 1}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-v2-footer">
                                            <div className="action-hint">DETAYLARI GÖR</div>
                                            {fb.status === 'replied' && (
                                                <div className="replied-marker">✓ Yanıtlandı</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {feedbacks.filter(f => feedbackFilter === 'all' || f.status === feedbackFilter).length === 0 && (
                                    <div className="no-feedback-state-v2">
                                        <div className="empty-icon-box">📬</div>
                                        <p>Gösterilecek talep bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'activity' && (
                    <div className="activity-section fade-in">
                        <div className="section-header-modern">
                            <div className="header-left">
                                <h2>⚡ Canlı Aktif Oturum İzleyici</h2>
                                <p>Platformda o an aktif olan kullanıcıları ve bulundukları sayfaları izleyin.</p>
                            </div>
                            <div className="header-right">
                                <div className="connection-status-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#2ecc71' : '#e74c3c' }}></span>
                                    {connected ? 'Canlı Sunucu Bağlantısı Aktif' : 'Bağlantı Kesildi'}
                                </div>
                            </div>
                        </div>

                        {/* Summary Metrics Cards */}
                        <div className="system-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                            <div className="metric-card-modern" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>🟢 Toplam Aktif</span>
                                <strong style={{ fontSize: '28px', color: '#fff' }}>{activeSessions.length}</strong>
                            </div>
                            <div className="metric-card-modern" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>🏠 Akış / Mesajlar</span>
                                <strong style={{ fontSize: '28px', color: '#6366f1' }}>{activeSessions.filter(s => s.path === '/').length}</strong>
                            </div>
                            <div className="metric-card-modern" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>🌐 Portallarda</span>
                                <strong style={{ fontSize: '28px', color: '#10b981' }}>{activeSessions.filter(s => s.path.startsWith('/portal')).length}</strong>
                            </div>
                            <div className="metric-card-modern" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>🗺️ Haritada</span>
                                <strong style={{ fontSize: '28px', color: '#f59e0b' }}>{activeSessions.filter(s => s.path === '/map').length}</strong>
                            </div>
                        </div>

                        {loading && activeSessions.length === 0 && <div className="admin-loading">Aktif oturumlar çekiliyor...</div>}
                        
                        {!loading && activeSessions.length === 0 && (
                            <p className="no-data">Şu an aktif çevrimiçi kullanıcı bulunmuyor.</p>
                        )}

                        <div className="users-list">
                            {activeSessions.map((session) => (
                                <div key={session.userId} className="user-list-item" style={{ padding: '15px 20px' }}>
                                    <div className="user-item-left">
                                        <img
                                            src={session.avatar || 'https://via.placeholder.com/150'}
                                            alt=""
                                            className="user-list-avatar"
                                        />
                                        <div className="user-item-info">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {session.displayName || session.username}
                                            </h4>
                                            <span>@{session.username}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        {/* Current Location Badge */}
                                        <div className="location-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mevcut Konum</span>
                                            <span 
                                                onClick={() => navigate(session.path)}
                                                style={{ 
                                                    background: 'rgba(99, 102, 241, 0.15)', 
                                                    color: '#818cf8', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '12px', 
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                                }}
                                            >
                                                {session.path === '/' ? 'Genel Akış / Mesajlar' : session.path.startsWith('/portal') ? `Portal: ${session.path.split('/')[2] || ''}` : session.path}
                                            </span>
                                        </div>

                                        <button
                                            className="ban-btn-admin"
                                            onClick={() => {
                                                setBanModalTarget({ type: 'user', id: session.userId });
                                                setBanModalOpen(true);
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'rgba(231, 76, 60, 0.15)',
                                                color: '#e74c3c',
                                                border: '1px solid #e74c3c',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                minWidth: '100px'
                                            }}
                                        >
                                            Engelle (Kick)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'ipbans' && (
                    <div className="ipbans-section fade-in">
                        <div className="section-header-modern">
                            <div className="header-left">
                                <h2>🚫 IP Adresi Engelleme Paneli</h2>
                                <p>Sistem genelinde şüpheli IP adreslerini, ağ saldırısı veya spam kaynaklarını engelleyin.</p>
                            </div>
                            <div className="header-right">
                                <button 
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        const ip = window.prompt('Engellenecek IP adresini yazın:');
                                        if (ip && ip.trim()) {
                                            setBanModalTarget({ type: 'ip', id: ip.trim() });
                                            setBanModalOpen(true);
                                        }
                                    }}
                                    style={{ padding: '10px 20px', fontSize: '14px', background: '#e74c3c' }}
                                >
                                    + IP Engelle
                                </button>
                            </div>
                        </div>

                        {loading && bannedIps.length === 0 && <div className="admin-loading">IP engelleri çekiliyor...</div>}
                        
                        {!loading && bannedIps.length === 0 && (
                            <p className="no-data">Kayıtlı engelli IP bulunmamaktadır.</p>
                        )}

                        <div className="users-list">
                            {bannedIps.map((ban) => (
                                <div key={ban._id} className="user-list-item" style={{ padding: '15px 20px' }}>
                                    <div className="user-item-left" style={{ gap: '15px' }}>
                                        <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </div>
                                        <div className="user-item-info">
                                            <h4 style={{ fontSize: '16px', fontFamily: 'monospace' }}>{ban.ip}</h4>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Gerekçe: <strong>{ban.reason}</strong> • Ekleyen: @{ban.bannedBy?.username || 'Sistem'}
                                            </span>
                                            {ban.expiresAt && (
                                                <span style={{ fontSize: '11px', color: 'orange', marginTop: '4px', display: 'block' }}>
                                                    Süre Sonu: {new Date(ban.expiresAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        className="unban-btn-admin"
                                        onClick={() => handleUnbanIp(ban.ip)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(46, 204, 113, 0.15)',
                                            color: '#2ecc71',
                                            border: '1px solid #2ecc71',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '12px',
                                            minWidth: '100px'
                                        }}
                                    >
                                        Engeli Kaldır
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'system' && (isOxypace || currentUser?.isAdmin || currentUser?.isTouristAdmin) && (
                    <div className="system-settings-section">
                        <div className="system-card">
                            <div className="system-card-header">
                                <h3>🔧 Sistem Genel Ayarları</h3>
                                <p>Platform erişimi ve global bakım ayarları</p>
                            </div>
                            <div className="system-card-body">
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <h4>Vercel 404 Kısıtlaması (Bakım Modu)</h4>
                                        <p>
                                            Bu ayar aktifleştirildiğinde, geliştirici yetkisi (?access=oxypace çerezi) 
                                            olmayan tüm kullanıcılar sahte Vercel 404 (DEPLOYMENT_NOT_FOUND) sayfasına yönlendirilir. 
                                            Sitede o an açık olan kullanıcıların sayfası otomatik olarak yenilenerek engellenir.
                                        </p>
                                    </div>
                                    <div className="setting-control">
                                        <button 
                                            className={`maintenance-toggle-btn ${maintenanceActive ? 'active' : ''}`}
                                            onClick={handleToggleMaintenance}
                                        >
                                            {maintenanceActive ? '🔴 Bakım Modu Aktif (Kapat)' : '🟢 Bakım Modu Pasif (Aç)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'custom-badges' && (
                    <div className="custom-badges-section fade-in">
                        <div className="section-header-modern">
                            <div className="header-left">
                                <h2>🛡️ Özel İkon Rozetler (Yönetici Rozetleri)</h2>
                                <p>Sistem genelinde kullanıcılara atanabilecek özel ikon/resim rozetler yükleyin ve yönetin.</p>
                            </div>
                        </div>

                        <div className="custom-badges-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', marginTop: '20px' }}>
                            {/* Left Side: Create / Upload form */}
                            <div className="custom-badge-form-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Yeni Rozet Ekle</h3>
                                <form onSubmit={handleSaveCustomBadge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Rozet Adı</label>
                                        <input
                                            type="text"
                                            className="reason-input-modern"
                                            style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', width: '100%' }}
                                            placeholder="Örn: Top Donör, Moderatör"
                                            value={customBadgeName}
                                            onChange={(e) => setCustomBadgeName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>Rozet Görseli (Görsel veya GIF)</label>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/gif"
                                            onChange={handleCustomBadgeFileSelect}
                                            style={{ display: 'none' }}
                                            id="custom-badge-file-input"
                                            disabled={uploadingCustomBadge}
                                        />
                                        <label
                                            htmlFor="custom-badge-file-input"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '120px',
                                                border: '2px dashed rgba(255, 255, 255, 0.15)',
                                                borderRadius: '12px',
                                                cursor: uploadingCustomBadge ? 'not-allowed' : 'pointer',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                transition: '0.2s ease',
                                                gap: '8px',
                                                color: '#bbb',
                                                fontSize: '13px'
                                            }}
                                            className="custom-badge-upload-label"
                                        >
                                            {uploadingCustomBadge ? (
                                                <span>Yükleniyor / Analiz Ediliyor...</span>
                                            ) : customBadgeUploadedUrl ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <img src={customBadgeUploadedUrl} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                    <span style={{ fontSize: '11px', color: '#4ade80' }}>Değiştirmek için tıklayın</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '24px' }}>📁</span>
                                                    <span>Dosya Seç (PNG/GIF)</span>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-modern-primary"
                                        style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }}
                                        disabled={uploadingCustomBadge || !customBadgeUploadedUrl}
                                    >
                                        Kaydet
                                    </button>
                                </form>
                            </div>

                            {/* Right Side: List of custom badges */}
                            <div className="custom-badges-list-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)' }}>
                                <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Aktif Özel Rozetler</h3>
                                {loading ? (
                                    <div className="admin-loading">Yükleniyor...</div>
                                ) : customBadges.length === 0 ? (
                                    <p className="no-data">Yüklenmiş özel rozet bulunmamaktadır.</p>
                                ) : (
                                    <div className="custom-badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                        {customBadges.map((badge) => (
                                            <div key={badge._id} className="custom-badge-item-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', position: 'relative', gap: '12px' }}>
                                                <button
                                                    onClick={() => handleDeleteCustomBadge(badge._id)}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ff4b4b', cursor: 'pointer' }}
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <img src={badge.url} alt={badge.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>{badge.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Reason Modal */}
            <ReasonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                actionType={modalAction}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModalOpen}
                onClose={() => setAlertModalOpen(false)}
                onSubmit={handleAlertSubmit}
                portalName={alertPortalName}
            />

            {/* Feedback Response Modal */}
            <FeedbackResponseModal 
                isOpen={feedbackModalOpen} 
                onClose={() => setFeedbackModalOpen(false)}
                feedback={selectedFeedback}
                onSubmit={handleFeedbackReply}
            />

            {/* Custom Ban Modal for User / IP Banning */}
            <BanModal
                isOpen={banModalOpen}
                onClose={() => setBanModalOpen(false)}
                onSubmit={handleBanSubmit}
                type={banModalTarget.type}
            />

            {/* Portal Detail / Management Modal */}
            <PortalDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                portal={detailPortal}
                contextBadges={contextBadges}
                handlePortalBadge={handlePortalBadge}
                handleNSFWToggle={handleNSFWToggle}
                handleReadOnlyToggle={handleReadOnlyToggle}
                initiatePortalStatusChange={initiatePortalStatusChange}
                openAlertModal={openAlertModal}
                handleRemoveAlert={handleRemoveAlert}
                ownershipTarget={ownershipTarget}
                setOwnershipTarget={setOwnershipTarget}
                handleTransferOwnership={handleTransferOwnership}
                transferring={transferring}
            />

            {/* User Detail / Management Modal */}
            <UserDetailModal
                isOpen={userDetailModalOpen}
                onClose={() => setUserDetailModalOpen(false)}
                user={selectedUserDetail}
                contextBadges={contextBadges}
                handleBadgeChange={handleBadgeChange}
                handleUnbanUser={handleUnbanUser}
                setBanModalTarget={setBanModalTarget}
                setBanModalOpen={setBanModalOpen}
                handleImpersonate={handleImpersonate}
                handleUserShadowbanToggle={handleUserShadowbanToggle}
                isOxypace={isOxypace}
                handleApproveRecovery={handleApproveRecovery}
                handleRejectRecovery={handleRejectRecovery}
                customBadges={customBadges}
                handleCustomBadgeAssign={handleCustomBadgeAssign}
            />

            {/* Image Cropper Modal for Custom Badges */}
            {customBadgeCropperImage && (
                <ImageCropper
                    image={customBadgeCropperImage}
                    file={customBadgeCropperFile}
                    mode="badge"
                    aspectRatio={customBadgeCropperAspectRatio}
                    onComplete={handleCustomBadgeCropComplete}
                    onCancel={() => setCustomBadgeCropperImage(null)}
                    title="Özel Rozet Görseli Kırpıcı"
                />
            )}


            {/* Badge Creator/Editor Modal */}
            {badgeModalOpen && (
                <div className="modal-overlay-modern">
                    <div className="modal-content-modern" style={{ maxWidth: '620px' }}>
                        <div className="modal-header-modern">
                            <h2>{editingBadge ? 'Rozet Düzenle' : 'Yeni Rozet Oluştur'}</h2>
                            <button className="close-btn-modern" onClick={() => setBadgeModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body-modern" style={{ gap: '18px' }}>

                            {/* Live Preview */}
                            <div className="badge-creator-preview">
                                <span style={{ color: '#888', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Önizleme</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#0a0a0a', padding: '16px 20px', borderRadius: '12px', border: '1px solid #222' }}>
                                    <Badge type={badgeForm.slug || '_preview'} size={36} />
                                    <Badge type={badgeForm.slug || '_preview'} size={24} />
                                    <Badge type={badgeForm.slug || '_preview'} size={16} />
                                    <span style={{ color: '#ccc', marginLeft: '12px', fontSize: '14px' }}>{badgeForm.name || 'Rozet Adı'}</span>
                                </div>
                            </div>

                            {/* Rozet Adı */}
                            <div>
                                <label className="badge-label">Rozet Adı</label>
                                <input
                                    className="reason-input-modern"
                                    style={{ padding: '10px' }}
                                    value={badgeForm.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Örn: Altın Onay, VIP Üye"
                                />
                            </div>

                            {/* Slug — auto-generated, collapsible */}
                            <div>
                                <label className="badge-label">Rozet Kodu (Slug)</label>
                                <p className="badge-help-text">Sistem tarafından kullanılan benzersiz tanımlayıcı. İsim girdiğinizde otomatik oluşturulur.</p>
                                <input
                                    className="reason-input-modern"
                                    style={{ padding: '10px', fontFamily: 'monospace', fontSize: '13px', color: '#888' }}
                                    value={badgeForm.slug}
                                    onChange={(e) => setBadgeForm({ ...badgeForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="otomatik-olusturulur"
                                    disabled={editingBadge?.isDefault}
                                />
                            </div>

                            {/* İkon Seçici */}
                            <div>
                                <label className="badge-label">İkon Şekli</label>
                                <div className="badge-icon-grid">
                                    {ICONS.map(ic => (
                                        <button
                                            key={ic.value}
                                            type="button"
                                            className={`badge-icon-btn ${badgeForm.icon === ic.value ? 'active' : ''}`}
                                            onClick={() => setBadgeForm({ ...badgeForm, icon: ic.value })}
                                        >
                                            <Badge type={`_icon_${ic.value}`} size={22} />
                                            <span>{ic.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Kategori */}
                            <div>
                                <label className="badge-label">Kullanım Alanı</label>
                                <p className="badge-help-text">Bu rozet kimlere atanabilir?</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[{ v: 'user', l: '👤 Kullanıcı' }, { v: 'portal', l: '🌐 Portal' }, { v: 'both', l: '✨ Her İkisi' }].map(c => (
                                        <button
                                            key={c.v}
                                            type="button"
                                            className={`preset-btn ${badgeForm.category === c.v ? 'active' : ''}`}
                                            onClick={() => setBadgeForm({ ...badgeForm, category: c.v })}
                                        >
                                            {c.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stil */}
                            <div>
                                <label className="badge-label">Görünüm Stili</label>
                                <p className="badge-help-text">Rozetin renk efekt tipi</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {STYLE_TYPES.map(s => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            className={`preset-btn ${badgeForm.style.type === s.value ? 'active' : ''}`}
                                            onClick={() => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, type: s.value } })}
                                            title={s.desc}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Renkler */}
                            <div>
                                <label className="badge-label">Renkler</label>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p className="badge-help-text" style={{ marginBottom: '4px' }}>Ana Renk</p>
                                        <div className="badge-color-wrap">
                                            <input
                                                type="color"
                                                value={badgeForm.style.primaryColor}
                                                onChange={(e) => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, primaryColor: e.target.value } })}
                                                className="badge-color-input"
                                            />
                                            <span>{badgeForm.style.primaryColor}</span>
                                        </div>
                                    </div>
                                    {(badgeForm.style.type === 'gradient' || badgeForm.style.type === 'iridescent') && (
                                        <div>
                                            <p className="badge-help-text" style={{ marginBottom: '4px' }}>İkinci Renk</p>
                                            <div className="badge-color-wrap">
                                                <input
                                                    type="color"
                                                    value={badgeForm.style.secondaryColor || '#ff8c00'}
                                                    onChange={(e) => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, secondaryColor: e.target.value } })}
                                                    className="badge-color-input"
                                                />
                                                <span>{badgeForm.style.secondaryColor || '#ff8c00'}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="badge-help-text" style={{ marginBottom: '4px' }}>Parıltı Rengi</p>
                                        <div className="badge-color-wrap">
                                            <input
                                                type="color"
                                                value={badgeForm.style.glowColor || badgeForm.style.primaryColor}
                                                onChange={(e) => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, glowColor: e.target.value } })}
                                                className="badge-color-input"
                                            />
                                            <span>{badgeForm.style.glowColor || 'otomatik'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Animasyon */}
                            <div>
                                <label className="badge-label">Animasyon Efekti</label>
                                <p className="badge-help-text">Rozetin hareket efekti — profilde ve paylaşımlarda görünür</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ANIM_TYPES.map(a => (
                                        <button
                                            key={a.value}
                                            type="button"
                                            className={`preset-btn ${badgeForm.style.animationType === a.value ? 'active' : ''}`}
                                            onClick={() => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, animationType: a.value } })}
                                        >
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer-modern">
                            <button type="button" className="btn-modern-ghost" onClick={() => setBadgeModalOpen(false)}>İptal</button>
                            <button type="button" className="btn-modern-primary" onClick={handleBadgeSave}>
                                {editingBadge ? 'GÜNCELLE' : 'OLUŞTUR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
