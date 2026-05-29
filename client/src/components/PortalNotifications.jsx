import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { UserPlus, Users, AlertTriangle, Check, X, CheckCircle, Volume2, Megaphone, Hash, Image, Bell, BellOff } from 'lucide-react';
import './PortalNotifications.css';

const PortalNotifications = ({ portalId, portalChannels = [], onUpdate }) => {
    // Member preferences state
    const [isAllMuted, setIsAllMuted] = useState(false);
    const [mutedChannels, setMutedChannels] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Admin state
    const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'requests', 'members', 'alerts'
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
            setIsAllMuted(response.data.isAllMuted || false);
            setMutedChannels(response.data.mutedChannels || []);
            setIsAdmin(response.data.isAdmin || false);
            
            // Set tab to settings by default, but if admin, they also have other tabs
            setJoinRequests(response.data.joinRequests || []);
            setRecentMembers(response.data.recentMembers || []);
            setAlerts(response.data.alerts || []);
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (updatedAllMuted, updatedMutedChannels) => {
        try {
            await axios.put(`/api/portals/${portalId}/notifications`, {
                isAllMuted: updatedAllMuted,
                mutedChannels: updatedMutedChannels,
            });
        } catch (error) {
            console.error('Update settings failed:', error);
        }
    };

    const toggleAllMuted = async () => {
        const newVal = !isAllMuted;
        setIsAllMuted(newVal);
        await handleSaveSettings(newVal, mutedChannels);
    };

    const toggleChannelMute = async (channelId) => {
        let updated;
        if (mutedChannels.includes(channelId)) {
            updated = mutedChannels.filter(id => id !== channelId);
        } else {
            updated = [...mutedChannels, channelId];
        }
        setMutedChannels(updated);
        await handleSaveSettings(isAllMuted, updated);
    };

    const handleApprove = async (userId) => {
        try {
            await axios.post(`/api/portals/${portalId}/approve-member`, { userId });
            setJoinRequests((prev) => prev.filter((r) => r._id !== userId));
            fetchNotifications();
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

    const getChannelIcon = (type) => {
        switch (type) {
            case 'voice':
            case 'conference':
                return <Volume2 size={16} className="channel-mute-icon" />;
            case 'image':
                return <Image size={16} className="channel-mute-icon" />;
            case 'announcement':
                return <Megaphone size={16} className="channel-mute-icon" />;
            default:
                return <Hash size={16} className="channel-mute-icon" />;
        }
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
                <h2>Portal Bildirim Ayarları</h2>
            </div>

            {/* Tab Navigation (Visible if Admin/Owner) */}
            {isAdmin && (
                <div className="notifications-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Bell size={18} strokeWidth={2} />
                        Bildirim Seçenekleri
                    </button>
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
            )}

            {/* Content */}
            <div className="notifications-content">
                {activeTab === 'settings' && (
                    <div className="mute-settings-section">
                        {/* Toggle All */}
                        <div className="settings-group">
                            <div className="settings-info">
                                <div className="settings-title">Tüm Bildirimleri Kapat</div>
                                <div className="settings-desc">Bu portal altındaki tüm kanalların bildirimlerini susturur.</div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isAllMuted}
                                    onChange={toggleAllMuted}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        {/* Channel List */}
                        <h3 className="channels-mute-title">Kanal Bildirim Tercihleri</h3>
                        <div className="channels-mute-list">
                            {portalChannels.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Kanal bulunamadı.</p>
                            ) : (
                                portalChannels.map((channel) => {
                                    const isMuted = isAllMuted || mutedChannels.includes(channel._id);
                                    return (
                                        <div key={channel._id} className="channel-mute-item">
                                            <div className="channel-mute-name-wrapper">
                                                {getChannelIcon(channel.type)}
                                                <span>{channel.name}</span>
                                            </div>
                                            <label className={`switch ${isAllMuted ? 'disabled' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isMuted}
                                                    onChange={() => !isAllMuted && toggleChannelMute(channel._id)}
                                                    disabled={isAllMuted}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && isAdmin && (
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

                {activeTab === 'members' && isAdmin && (
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

                {activeTab === 'alerts' && isAdmin && (
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
