import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import ImageCropperModal from './ImageCropperModal';
import './PortalSettingsModal.css';

const PortalSettingsModal = ({ portal, onClose, onUpdate, currentUser, initialTab = 'overview' }) => {
    const [activeTab, setActiveTab] = useState(initialTab); // overview, channels, members
    const [loading, setLoading] = useState(false);

    // Overview State
    const [formData, setFormData] = useState({
        name: portal.name,
        description: portal.description || '',
        privacy: portal.privacy || 'public'
    });
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);

    // Cropping State
    const [tempImage, setTempImage] = useState(null);
    const [cropperTarget, setCropperTarget] = useState(null);

    // Channel State
    const [newChannelName, setNewChannelName] = useState('');

    // Member State
    const [memberSearch, setMemberSearch] = useState('');

    // Access Control
    const ownerId = portal.owner?._id || portal.owner;
    const currentUserId = currentUser?._id;
    // Strict Owner check
    const isOwner = ownerId && currentUserId && (String(ownerId) === String(currentUserId));
    // Admin check
    const isAdmin = isOwner || (portal.admins && currentUserId && portal.admins.some(a => (String(a._id || a) === String(currentUserId))));

    // --- Overview Handlers ---
    const handleSaveOverview = async () => {
        if (!isOwner) return; // double check
        setLoading(true);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, formData);
            onUpdate(res.data);
            alert('Ayarlar kaydedildi');
        } catch (err) {
            alert('Kaydetme hatası: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e, target) => {
        if (!isOwner) return;
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
            setCropperTarget(target);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedBlob) => {
        if (!croppedBlob || !cropperTarget) return;

        const type = cropperTarget; // 'avatar' or 'banner'
        setTempImage(null);
        setCropperTarget(null);

        const form = new FormData();
        form.append(type, croppedBlob, `${type}.jpg`);

        try {
            setLoading(true);
            const res = await axios.post(`/api/portals/${portal._id}/${type}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUpdate(res.data);
        } catch (err) {
            alert(`${type} yüklenemedi`);
        } finally {
            setLoading(false);
        }
    };

    // --- Channel Handlers ---
    const handleAddChannel = async () => {
        if (!newChannelName.trim()) return;
        if (!isAdmin) return;
        try {
            const res = await axios.post(`/api/portals/${portal._id}/channels`, { name: newChannelName });
            onUpdate({ ...portal, channels: res.data });
            setNewChannelName('');
        } catch (err) {
            alert('Kanal eklenemedi');
        }
    };

    const handleDeleteChannel = async (channelId) => {
        if (!isAdmin) return;
        if (!window.confirm('Bu kanalı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await axios.delete(`/api/portals/${portal._id}/channels/${channelId}`);
            onUpdate({ ...portal, channels: res.data });
        } catch (err) {
            alert('Kanal silinemedi');
        }
    };

    // --- Member Handlers ---
    const handleKick = async (userId) => {
        if (!isAdmin) return;
        if (!window.confirm('Üyeyi portaldan atmak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/portals/${portal._id}/kick`, { userId });
            const kickedUserId = String(userId);
            onUpdate({
                ...portal,
                members: portal.members.filter(m => String(m._id || m) !== kickedUserId),
                admins: portal.admins.filter(a => String(a._id || a) !== kickedUserId)
            });
        } catch (err) {
            alert('Üye atılamadı: ' + (err.response?.data?.message || 'Yetkisiz işlem'));
        }
    };

    const handleRole = async (userId, action) => {
        if (!isOwner) return; // Only Owner can promote/demote admins
        try {
            const res = await axios.post(`/api/portals/${portal._id}/roles`, { userId, action });
            onUpdate({ ...portal, admins: res.data });
        } catch (err) {
            alert('Yetki değiştirilemedi');
        }
    };

    const filteredMembers = (portal.members || []).filter(m => {
        const username = m.username || '';
        return username.toLowerCase().includes(memberSearch.toLowerCase());
    });

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-portal-name">{portal.name}</div>
                    </div>

                    <div className="form-label desktop-only" style={{ paddingLeft: '10px', marginBottom: '8px' }}>Genel</div>
                    <div
                        className={`settings-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        title="Genel Bakış"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ minWidth: '20px' }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        <span className="tab-label">Genel Bakış</span>
                    </div>

                    <div className="form-label desktop-only" style={{ paddingLeft: '10px', marginTop: '20px', marginBottom: '8px' }}>Yönetim</div>
                    <div
                        className={`settings-tab ${activeTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                        title="Kanallar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ minWidth: '20px' }}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        <span className="tab-label">Kanallar</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                        title="Üyeler"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ minWidth: '20px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span className="tab-label">Üyeler</span>
                    </div>
                </div>

                {/* Content */}
                <div className="settings-content">
                    <button className="close-settings-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Genel Bakış</h2>

                            <div className="images-grid">
                                <div className="image-preview-box banner-box" onClick={() => isOwner && bannerRef.current.click()}>
                                    {portal.banner ?
                                        <img src={getImageUrl(portal.banner)} alt="" className="banner-img" /> :
                                        <div style={{ color: '#72767d' }}>Banner Yok</div>
                                    }
                                    {isOwner && <div className="upload-overlay">Banner Değiştir</div>}
                                </div>
                                <div className="image-preview-box avatar-box" onClick={() => isOwner && avatarRef.current.click()}>
                                    {portal.avatar ?
                                        <img src={getImageUrl(portal.avatar)} alt="" className="avatar-img" /> :
                                        <div style={{ color: '#72767d', fontSize: '2rem', fontWeight: 'bold' }}>{portal.name[0]}</div>
                                    }
                                    {isOwner && <div className="upload-overlay">Logo</div>}
                                </div>
                            </div>

                            <input type="file" ref={bannerRef} onChange={e => handleFileSelect(e, 'banner')} hidden accept="image/*" />
                            <input type="file" ref={avatarRef} onChange={e => handleFileSelect(e, 'avatar')} hidden accept="image/*" />

                            <div className="form-group">
                                <label className="form-label">Portal Adı</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isOwner}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    disabled={!isOwner}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gizlilik</label>
                                <select
                                    className="form-input"
                                    value={formData.privacy}
                                    onChange={e => setFormData({ ...formData, privacy: e.target.value })}
                                    disabled={!isOwner}
                                >
                                    <option value="public">Herkese Açık</option>
                                    <option value="private">Gizli (Sadece Davet)</option>
                                </select>
                            </div>

                            {isOwner && (
                                <button className="btn-save" onClick={handleSaveOverview} disabled={loading}>
                                    {loading ? '...' : 'Değişiklikleri Kaydet'}
                                </button>
                            )}

                            {/* Image Cropper Integration */}
                            {tempImage && (
                                <ImageCropperModal
                                    image={tempImage}
                                    aspect={cropperTarget === 'avatar' ? 1 : null} // Square for avatar, free for banner
                                    onCropComplete={handleCropComplete}
                                    onCancel={() => { setTempImage(null); setCropperTarget(null); }}
                                    title={cropperTarget === 'avatar' ? "Portal Logosu Düzenle" : "Portal Bannerı Düzenle"}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Kanallar</h2>

                            {isAdmin && (
                                <div className="add-channel-bar">
                                    <input
                                        className="form-input"
                                        placeholder="Yeni kanal adı (örn: oyun, müzik)"
                                        value={newChannelName}
                                        onChange={e => setNewChannelName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddChannel()}
                                    />
                                    <button className="btn-save" style={{ background: '#5865f2' }} onClick={handleAddChannel}>Oluştur</button>
                                </div>
                            )}

                            <div className="channel-list">
                                {portal.channels && portal.channels.map(ch => (
                                    <div key={ch._id} className="channel-row">
                                        <div className="channel-name">
                                            <span style={{ color: '#72767d', marginRight: '4px' }}>#</span>
                                            {ch.name}
                                        </div>
                                        {isAdmin && (
                                            <div className="channel-actions">
                                                <button onClick={() => handleDeleteChannel(ch._id)} title="Kanalı Sil">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!portal.channels || portal.channels.length === 0) && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#72767d' }}>Hiç kanal yok.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Üyeler ({portal.members?.length || 0})</h2>

                            <div className="form-group">
                                <input
                                    className="form-input"
                                    placeholder="Üye ara..."
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <div className="members-list">
                                {filteredMembers.map(member => {
                                    const memberId = member._id || member;
                                    const isAdminMember = portal.admins.some(a => String(a._id || a) === String(memberId));
                                    const isOwnerMember = String(ownerId) === String(memberId);

                                    return (
                                        <div key={memberId} className="member-card">
                                            <img src={getImageUrl(member.profile?.avatar)} alt="" className="member-avatar" onError={(e) => e.target.style.display = 'none'} />
                                            <div className="member-details">
                                                <div className="member-username">
                                                    {member.username || 'Kullanıcı'}
                                                    {isOwnerMember && <span className="role-badge owner">👑 As Yönetici</span>}
                                                    {isAdminMember && !isOwnerMember && <span className="role-badge admin">🛡️ Er Yönetici</span>}
                                                </div>
                                            </div>

                                            {/* Action Menu */}
                                            {isAdmin && !isOwnerMember && (
                                                // Hide actions if I am Admin but target is also Admin (unless I am Owner)
                                                (isOwner || !isAdminMember) && (
                                                    <div className="channel-actions" style={{ display: 'flex', gap: '8px' }}>

                                                        {isOwner && (
                                                            !isAdminMember ? (
                                                                <button onClick={() => handleRole(memberId, 'promote')} title="Er Yönetici Yap" style={{ color: '#5865f2' }}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => handleRole(memberId, 'demote')} title="Yöneticiliği Al" style={{ color: '#faa61a' }}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                                                </button>
                                                            )
                                                        )}

                                                        <button onClick={() => handleKick(memberId)} title="Portaldan At" style={{ color: '#ed4245' }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                                                        </button>
                                                    </div>
                                                )
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
