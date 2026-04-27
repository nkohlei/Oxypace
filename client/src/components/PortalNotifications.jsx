import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { UserPlus, Users, AlertTriangle, Check, X, CheckCircle } from 'lucide-react';
import './PortalNotifications.css';

const PortalNotifications = ({ portalId, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'members', or 'alerts'
    const [joinRequests, setJoinRequests] = useState([]);
    const [recentMembers, setRecentMembers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [portalId]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/portals/${portalId}/notifications`);
            setJoinRequests(response.data.joinRequests || []);
            setRecentMembers(response.data.recentMembers || []);
            setAlerts(response.data.alerts || []);
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await axios.post(`/api/portals/${portalId}/approve-member`, { userId });
            // Remove from requests and optionally add to recent members
            setJoinRequests((prev) => prev.filter((r) => r._id !== userId));
            // Refresh to get updated list
            fetchNotifications();
            // Notify parent to update portal data (clears badge)
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Approve error:', error);
            alert(error.response?.data?.message || 'Onaylama başarısız');
        }
    };

    const handleReject = async (userId) => {
        try {
            await axios.post(`/api/portals/${portalId}/reject-member`, { userId });
            setJoinRequests((prev) => prev.filter((r) => r._id !== userId));
            // Notify parent to update portal data (clears badge)
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Reject error:', error);
            alert(error.response?.data?.message || 'Reddetme başarısız');
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return past.toLocaleDateString('tr-TR');
    };

    const getTimeRemaining = (expiresAt) => {
        const now = new Date();
        const end = new Date(expiresAt);
        const diff = end - now;
        if (diff <= 0) return 'Süresi doldu';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        if (days > 0) return `${days} gün ${hours} saat kaldı`;
        if (hours > 0) return `${hours} saat ${minutes} dk kaldı`;
        return `${minutes} dakika kaldı`;
    };

    if (loading) {
        return (
            <div className="portal-notifications-container">
                <div className="notifications-loading">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-notifications-container">
            {/* Header */}
            <div className="notifications-header">
                <h2>Portal Bildirimleri</h2>
            </div>

            {/* Tab Navigation */}
            <div className="notifications-tabs">
                <button
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    <UserPlus size={18} strokeWidth={2} />
                    Üyelik İstekleri
                    {joinRequests.length > 0 && (
                        <span className="tab-badge">{joinRequests.length}</span>
                    )}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    <Users size={18} strokeWidth={2} />
                    Yeni Üyeler
                </button>
                {alerts.length > 0 && (
                    <button
                        className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alerts')}
                    >
                        <AlertTriangle size={18} strokeWidth={2} />
                        Uyarılar
                        <span className="tab-badge alert-badge">{alerts.length}</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="notifications-content">
                {activeTab === 'requests' && (
                    <div className="requests-list">
                        {joinRequests.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📥</div>
                                <h3>Bekleyen İstek Yok</h3>
                                <p>Şu anda onaylanmayı bekleyen üyelik isteği bulunmuyor.</p>
                            </div>
                        ) : (
                            joinRequests.map((request) => (
                                <div key={request._id} className="notification-item">
                                    <div className="item-avatar">
                                        {request.profile?.avatar ? (
                                            <img
                                                src={getImageUrl(request.profile.avatar)}
                                                alt={request.username}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {request.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name">
                                            {request.profile?.displayName || request.username}
                                        </div>
                                        <div className="item-username">@{request.username}</div>
                                        <div className="item-time">
                                            {formatDate(request.createdAt)}
                                        </div>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            className="action-btn approve-btn"
                                            onClick={() => handleApprove(request._id)}
                                        >
                                            <Check size={16} strokeWidth={2} />
                                            Onayla
                                        </button>
                                        <button
                                            className="action-btn reject-btn"
                                            onClick={() => handleReject(request._id)}
                                        >
                                            <X size={16} strokeWidth={2} />
                                            Reddet
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="members-list">
                        {recentMembers.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👥</div>
                                <h3>Henüz Üye Yok</h3>
                                <p>Portal henüz yeni, ilk üyeleri bekliyor.</p>
                            </div>
                        ) : (
                            recentMembers.map((member) => (
                                <div key={member._id} className="notification-item member-item">
                                    <div className="item-avatar">
                                        {member.profile?.avatar ? (
                                            <img
                                                src={getImageUrl(member.profile.avatar)}
                                                alt={member.username}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {member.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name">
                                            {member.profile?.displayName || member.username}
                                        </div>
                                        <div className="item-username">@{member.username}</div>
                                        <div className="item-time">
                                            Katıldı: {formatDate(member.joinedAt)}
                                        </div>
                                    </div>
                                    <div className="member-badge">
                                        <CheckCircle size={16} strokeWidth={2} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="alerts-list">
                        {alerts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📢</div>
                                <h3>Aktif Uyarı Yok</h3>
                                <p>Şu anda aktif bir yönetici uyarısı bulunmuyor.</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert._id} className="notification-item alert-item">
                                    <div className="item-avatar alert-avatar">
                                        <AlertTriangle size={18} strokeWidth={2} />
                                    </div>
                                    <div className="item-info">
                                        <div className="item-name" style={{ color: '#ff9800' }}>Yönetici Uyarısı</div>
                                        <div className="alert-message-text">{alert.message}</div>
                                        <div className="item-time">
                                            <span>⏱ {getTimeRemaining(alert.expiresAt)}</span>
                                            <span style={{ margin: '0 6px' }}>·</span>
                                            <span>{formatDate(alert.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortalNotifications;
