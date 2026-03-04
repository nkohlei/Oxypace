import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';
import Badge from '../components/Badge';
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
    const navigate = useNavigate();
    const isOxypace = currentUser && currentUser.username === 'oxypace';
    const isAdmin = currentUser && (currentUser.isAdmin || currentUser.username === 'oxypace');

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

    const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'users', 'portals', 'messages', 'badges'
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [portals, setPortals] = useState([]);
    const [searchTermPortal, setSearchTermPortal] = useState('');

    // Messages State (Oxypace Only)
    const [contactMessages, setContactMessages] = useState([]);
    const [messageFilter, setMessageFilter] = useState('Tümü');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPortalId, setSelectedPortalId] = useState(null);
    const [modalAction, setModalAction] = useState('');

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

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'portals') {
            fetchPortals();
        } else if (activeTab === 'messages' && isOxypace) {
            fetchContactMessages();
        } else if (activeTab === 'badges') {
            fetchAllBadges();
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
            <h1 className="admin-title">Yönetici Paneli</h1>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Başvurular
                    {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
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
                    className={`admin-tab ${activeTab === 'badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                >
                    Rozetler
                </button>
                {isOxypace && (
                    <button
                        className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        İletiler
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
                                            {contextBadges.filter(b => b.category === 'user' || b.category === 'both').map(b => (
                                                <option key={b.slug} value={b.slug}>{b.name}</option>
                                            ))}
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
                                            {contextBadges.filter(b => b.category === 'portal' || b.category === 'both').map(b => (
                                                <option key={b.slug} value={b.slug}>{b.name}</option>
                                            ))}
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
