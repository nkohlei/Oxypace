import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import './PortalNotifications.css';

const PortalNotifications = ({ portalId, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'members'
    const [joinRequests, setJoinRequests] = useState([]);
    const [recentMembers, setRecentMembers] = useState([]);
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
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Üyelik İstekleri
                    {joinRequests.length > 0 && (
                        <span className="tab-badge">{joinRequests.length}</span>
                    )}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Yeni Üyeler
                </button>
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
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            Onayla
                                        </button>
                                        <button
                                            className="action-btn reject-btn"
                                            onClick={() => handleReject(request._id)}
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
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
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
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
