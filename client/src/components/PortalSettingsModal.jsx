import { useState, useRef } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import './PortalSettingsModal.css';

const PortalSettingsModal = ({ portal, onClose, onUpdate, currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, channels, members
    const [loading, setLoading] = useState(false);

    // Overview State
    const [formData, setFormData] = useState({
        name: portal.name,
        description: portal.description || '',
        privacy: portal.privacy || 'public'
    });
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);

    // Channel State
    const [newChannelName, setNewChannelName] = useState('');

    const isOwner = portal.owner._id === currentUser._id || portal.owner === currentUser._id;
    // Admins IDs are simple strings if not populated deep, handled carefully
    const isAdmin = isOwner || (portal.admins && portal.admins.some(a => (a._id || a) === currentUser._id));

    // --- Overview Handlers ---
    const handleSaveOverview = async () => {
        setLoading(true);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, formData);
            onUpdate(res.data);
            alert('Ayarlar kaydedildi');
        } catch (err) {
            alert('Kaydetme hatası');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append(type, file);

        try {
            const res = await axios.post(`/api/portals/${portal._id}/${type}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate(res.data);
        } catch (err) {
            alert(`${type} yüklenemedi`);
        }
    };

    // --- Channel Handlers ---
    const handleAddChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            const res = await axios.post(`/api/portals/${portal._id}/channels`, { name: newChannelName });
            // res.data is channels array
            onUpdate({ ...portal, channels: res.data });
            setNewChannelName('');
        } catch (err) {
            alert('Kanal eklenemedi');
        }
    };

    const handleDeleteChannel = async (channelId) => {
        if (!window.confirm('Kanalı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await axios.delete(`/api/portals/${portal._id}/channels/${channelId}`);
            onUpdate({ ...portal, channels: res.data });
        } catch (err) {
            alert('Kanal silinemedi');
        }
    };

    // --- Member Handlers ---
    const handleKick = async (userId) => {
        if (!window.confirm('Üyeyi portaldan atmak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/portals/${portal._id}/kick`, { userId });
            onUpdate({
                ...portal,
                members: portal.members.filter(m => (m._id || m) !== userId),
                admins: portal.admins.filter(a => (a._id || a) !== userId)
            });
        } catch (err) {
            alert('Üye atılamadı');
        }
    };

    const handleRole = async (userId, action) => {
        // action: 'promote' | 'demote'
        try {
            const res = await axios.post(`/api/portals/${portal._id}/roles`, { userId, action });
            // Update local admins list essentially
            // For simplicity, we might need to refresh full portal or verify response
            // Currently assuming optimistic or response usage
            // The backend returns updated admins array
            // We need to fetch full portal usually to sync everything, but lets try to patch
            // Ideally we'd map the full objects. 
            // For now, let's just trigger a lightweight refresh request from parent or use returned IDs?
            // Route returns populated admins. 
            onUpdate({ ...portal, admins: res.data });
        } catch (err) {
            alert('Yetki değiştirilemedi');
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-sidebar">
                    <h3>Portal Ayarları</h3>
                    <div className={`settings-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Genel Bakış</div>
                    <div className={`settings-tab ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveTab('channels')}>Kanallar</div>
                    <div className={`settings-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Üyeler & Roller</div>
                </div>

                <div className="settings-content">
                    <button className="close-settings-btn" onClick={onClose}>✕</button>

                    {activeTab === 'overview' && (
                        <div className="tab-pane">
                            <h2>Genel Bakış</h2>
                            <div className="input-group">
                                <label>Portal Adı</label>
                                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Açıklama</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="action-buttons">
                                <button className="save-btn" onClick={handleSaveOverview} disabled={loading}>
                                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                </button>
                            </div>

                            <hr className="divider" />

                            <h3>Görseller</h3>
                            <div className="upload-section">
                                <div className="upload-item">
                                    <label>Banner</label>
                                    <div className="banner-preview" onClick={() => bannerRef.current.click()}>
                                        {portal.banner ? <img src={getImageUrl(portal.banner)} alt="" /> : <div className="placeholder">Banner Ekle</div>}
                                    </div>
                                    <input type="file" ref={bannerRef} onChange={e => handleFileUpload(e, 'banner')} hidden />
                                </div>
                                <div className="upload-item">
                                    <label>Logo</label>
                                    <div className="avatar-preview" onClick={() => avatarRef.current.click()}>
                                        {portal.avatar ? <img src={getImageUrl(portal.avatar)} alt="" /> : <div className="placeholder">Logo</div>}
                                    </div>
                                    <input type="file" ref={avatarRef} onChange={e => handleFileUpload(e, 'avatar')} hidden />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="tab-pane">
                            <h2>Kanallar</h2>
                            <div className="add-channel-row">
                                <input
                                    placeholder="Yeni kanal adı (örn: sohbet)"
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value)}
                                />
                                <button className="btn-primary-small" onClick={handleAddChannel}>Ekle +</button>
                            </div>
                            <div className="channels-list">
                                {portal.channels && portal.channels.map(ch => (
                                    <div key={ch._id} className="channel-item">
                                        <span># {ch.name}</span>
                                        <button className="btn-delete-icon" onClick={() => handleDeleteChannel(ch._id)}>🗑️</button>
                                    </div>
                                ))}
                                {(!portal.channels || portal.channels.length === 0) && <p className="empty-text">Henüz özel kanal yok.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="tab-pane">
                            <h2>Üyeler ({portal.members?.length})</h2>
                            <div className="members-list-scroll">
                                {portal.members && portal.members.map(member => {
                                    const memberId = member._id || member;
                                    const isAdminMember = portal.admins.some(a => (a._id || a) === memberId);
                                    const isOwnerMember = (portal.owner._id || portal.owner) === memberId;

                                    return (
                                        <div key={memberId} className="member-row">
                                            <div className="member-info">
                                                <img src={getImageUrl(member.profile?.avatar)} alt="" className="member-avatar-small" onError={(e) => e.target.style.display = 'none'} />
                                                <div>
                                                    <span className="member-name">{member.username || 'Kullanıcı'}</span>
                                                    {isOwnerMember && <span className="badge owner">As Yönetici</span>}
                                                    {isAdminMember && !isOwnerMember && <span className="badge admin">Er Yönetici</span>}
                                                </div>
                                            </div>

                                            {isOwner && !isOwnerMember && (
                                                <div className="member-actions">
                                                    {!isAdminMember ? (
                                                        <button className="btn-small promote" onClick={() => handleRole(memberId, 'promote')}>Yönetici Yap</button>
                                                    ) : (
                                                        <button className="btn-small demote" onClick={() => handleRole(memberId, 'demote')}>Yönetici Al</button>
                                                    )}
                                                    <button className="btn-small kick" onClick={() => handleKick(memberId)}>At</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortalSettingsModal;
