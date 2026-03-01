import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const isOxypace = currentUser && currentUser.username === 'oxypace';

    const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'users', 'portals', 'messages'
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [portals, setPortals] = useState([]);
    const [searchTermPortal, setSearchTermPortal] = useState('');

    // Messages State (Oxypace Only)
    const [contactMessages, setContactMessages] = useState([]);
    const [messageFilter, setMessageFilter] = useState('Tümü'); // Tümü, Genel, Destek, vb.

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPortalId, setSelectedPortalId] = useState(null);
    const [modalAction, setModalAction] = useState(''); // 'suspend' or 'close'

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'portals') {
            fetchPortals();
        } else if (activeTab === 'messages' && isOxypace) {
            fetchContactMessages();
        }
    }, [activeTab, isOxypace]);

    const fetchContactMessages = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/contact-messages');
            setContactMessages(data);
        } catch (err) {
            setError('Mesajlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleMessageStatus = async (id, status) => {
        try {
            await axios.put(`/api/admin/contact-messages/${id}/status`, { status });
            setContactMessages(contactMessages.map(msg =>
                msg._id === id ? { ...msg, status } : msg
            ));
        } catch (err) {
            alert('Mesaj durumu güncellenemedi.');
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
        } catch (err) {
            alert('Rozet güncellenemedi.');
        }
    };

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
        } catch (err) {
            alert('Rozet güncellenemedi.');
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

    return (
        <div className="admin-dashboard">
            <h1 className="admin-title">Yönetici Paneli</h1>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Bekleyen Başvurular
                    {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Tüm Kullanıcılar
                </button>
                <button
                    className={`admin-tab ${activeTab === 'portals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('portals')}
                >
                    Tüm Portallar
                </button>
                {isOxypace && (
                    <button
                        className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        Gelen İletiler
                        {/* Say out loud how many are unread */}
                        {contactMessages.filter(m => m.status === 'unread').length > 0 &&
                            <span className="tab-badge">{contactMessages.filter(m => m.status === 'unread').length}</span>
                        }
                    </button>
                )}
            </div>

            <div className="admin-content">
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

                        <div className="users-list">
                            {users.map((user) => (
                                <div key={user._id} className="user-list-item">
                                    <div className="user-item-left">
                                        <img
                                            src={
                                                user.profile.avatar ||
                                                'https://via.placeholder.com/150'
                                            }
                                            alt={user.username}
                                            className="user-list-avatar"
                                        />
                                        <div className="user-item-info">
                                            <h4>{user.profile.displayName || user.username}</h4>
                                            <span>@{user.username}</span>
                                        </div>
                                    </div>
                                    <div className="user-item-actions">
                                        <select
                                            className={`badge-select ${user.verificationBadge}`}
                                            value={user.verificationBadge}
                                            onChange={(e) =>
                                                handleBadgeChange(user._id, e.target.value)
                                            }
                                        >
                                            <option value="none">Rozet Yok</option>
                                            <option value="blue">Mavi Tik</option>
                                            <option value="gold">Altın Tik</option>
                                            <option value="platinum">Platin Tik</option>
                                            <option value="special">Özel Tik</option>
                                        </select>
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

                        <div className="users-list">
                            {portals.map((portal) => (
                                <div key={portal._id} className="user-list-item">
                                    <div className="user-item-left">
                                        <img
                                            src={portal.avatar || 'https://via.placeholder.com/150'}
                                            alt={portal.name}
                                            className="user-list-avatar"
                                            style={{ borderRadius: '12px' }}
                                        />
                                        <div className="user-item-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <h4>{portal.name}</h4>
                                                {portal.status === 'suspended' && <span style={{ color: 'orange', fontSize: '10px' }}>(ASKIDA)</span>}
                                                {portal.status === 'closed' && <span style={{ color: 'red', fontSize: '10px' }}>(KAPALI)</span>}
                                            </div>
                                            <span>Sahibi: @{portal.owner?.username || 'Bilinmiyor'}</span>
                                        </div>
                                    </div>

                                    <div className="user-item-actions" style={{ gap: '10px' }}>
                                        {/* Badge Selection */}
                                        <select
                                            className="badge-select"
                                            value={portal.badges && portal.badges.length > 0 ? portal.badges[0] : 'none'}
                                            onChange={(e) => handlePortalBadge(portal._id, e.target.value)}
                                        >
                                            <option value="none">Rozet Yok</option>
                                            <option value="official">Resmi Hesap</option>
                                            <option value="verified">Onaylı</option>
                                            <option value="partner">Partner</option>
                                        </select>

                                        {/* Action Dropdown */}
                                        <select
                                            className="action-select"
                                            onChange={(e) => {
                                                if (e.target.value === 'warning') handlePortalWarning(portal._id);
                                                else if (e.target.value === 'suspend') initiatePortalStatusChange(portal._id, 'suspend');
                                                else if (e.target.value === 'close') initiatePortalStatusChange(portal._id, 'close');
                                                else if (e.target.value === 'activate') initiatePortalStatusChange(portal._id, 'activate');
                                                e.target.value = ''; // Reset selection
                                            }}
                                            style={{
                                                backgroundColor: '#202225',
                                                color: '#b9bbbe',
                                                border: '1px solid #40444b',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">İşlemler...</option>
                                            <option value="warning">⚠️ Uyarı Gönder</option>
                                            {portal.status !== 'suspended' && <option value="suspend">⛔ Askıya Al</option>}
                                            {portal.status !== 'active' && <option value="activate">✅ Aktifleştir</option>}
                                            {portal.status !== 'closed' && <option value="close">❌ Kapat (Hukuki)</option>}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && isOxypace && (() => {
                    const getMessageBadgeStyle = (subject) => {
                        switch (subject) {
                            case 'Destek': return { bg: 'rgba(52, 152, 219, 0.15)', text: '#3498db' };
                            case 'Sikayet': return { bg: 'rgba(231, 76, 60, 0.15)', text: '#e74c3c' };
                            case 'Geribildirim': return { bg: 'rgba(46, 204, 113, 0.15)', text: '#2ecc71' };
                            case 'Isbirligi': return { bg: 'rgba(155, 89, 182, 0.15)', text: '#9b59b6' };
                            default: return { bg: 'rgba(149, 165, 166, 0.15)', text: '#95a5a6' }; // Genel
                        }
                    };

                    const filters = ['Tümü', 'Genel', 'Destek', 'Geribildirim', 'Sikayet', 'Isbirligi'];
                    const filteredMessages = messageFilter === 'Tümü'
                        ? contactMessages
                        : contactMessages.filter(m => m.subject === messageFilter);

                    return (
                        <div className="messages-section fade-in">
                            <div className="message-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                {filters.map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setMessageFilter(filter)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            background: messageFilter === filter ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                                            color: messageFilter === filter ? '#fff' : 'var(--text-muted)',
                                            transition: '0.2s ease',
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {loading && <div className="admin-loading">Yükleniyor...</div>}

                            {!loading && filteredMessages.length === 0 && (
                                <p className="no-data">Bu kategoride mesaj bulunamadı.</p>
                            )}

                            <div className="messages-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {filteredMessages.map((msg) => {
                                    const badgeStyle = getMessageBadgeStyle(msg.subject);
                                    return (
                                        <div key={msg._id} className="message-card" style={{
                                            background: msg.status === 'unread' ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-secondary)',
                                            border: `1px solid ${msg.status === 'unread' ? 'var(--primary-color)' : 'var(--border-subtle)'}`,
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '15px',
                                            boxShadow: msg.status === 'unread' ? '0 4px 12px rgba(255, 95, 31, 0.1)' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <img
                                                        src={msg.user?.profile?.avatar || 'https://via.placeholder.com/50'}
                                                        alt={msg.user?.username}
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                            {msg.user?.profile?.displayName || msg.user?.username}
                                                            <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>@{msg.user?.username}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                            {new Date(msg.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        background: badgeStyle.bg,
                                                        color: badgeStyle.text,
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {msg.subject.toUpperCase()}
                                                    </span>
                                                    {msg.status === 'unread' && (
                                                        <span style={{ background: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            YENİ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.6',
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '15px',
                                                borderRadius: '8px',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {msg.message}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                {msg.status !== 'read' && (
                                                    <button
                                                        onClick={() => handleMessageStatus(msg._id, 'read')}
                                                        style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        Okundu İşaretle
                                                    </button>
                                                )}
                                                {msg.status !== 'archived' && (
                                                    <button
                                                        onClick={() => handleMessageStatus(msg._id, 'archived')}
                                                        style={{ background: 'rgba(149, 165, 166, 0.1)', color: '#95a5a6', border: '1px solid #95a5a6', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                                    >
                                                        Arşivle
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Reason Modal */}
            <ReasonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                actionType={modalAction}
            />
        </div>
    );
};

export default AdminDashboard;
