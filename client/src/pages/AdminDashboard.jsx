import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'users', 'portals'
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [portals, setPortals] = useState([]);
    const [searchTermPortal, setSearchTermPortal] = useState('');

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchRequests();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'portals') {
            fetchPortals();
        }
    }, [activeTab]);

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

    const handlePortalStatus = async (portalId, newStatus) => {
        const actionText = newStatus === 'suspended' ? 'askıya almak' : newStatus === 'closed' ? 'kapatmak' : 'aktifleştirmek';
        const reason = window.prompt(`Bu portalı "${actionText}" için bir sebep belirtin (İsteğe bağlı):`);

        if (reason === null) return; // User cancelled

        try {
            await axios.put(`/api/admin/portals/${portalId}`, {
                status: newStatus,
                statusReason: reason
            });
            setPortals(portals.map(p =>
                p._id === portalId ? {
                    ...p,
                    status: newStatus,
                    statusReason: reason
                } : p
            ));
        } catch (err) {
            alert('Durum güncellenemedi.');
        }
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
                                                else if (e.target.value === 'suspend') handlePortalStatus(portal._id, 'suspended');
                                                else if (e.target.value === 'close') handlePortalStatus(portal._id, 'closed');
                                                else if (e.target.value === 'activate') handlePortalStatus(portal._id, 'active');
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
            </div>
        </div>
    );
};

export default AdminDashboard;
