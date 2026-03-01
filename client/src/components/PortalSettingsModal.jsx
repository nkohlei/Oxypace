import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import ImageCropper from './ImageCropper';
import './PortalSettingsModal.css';

const PortalSettingsModal = ({
    portal,
    onClose,
    onUpdate,
    currentUser,
    initialTab = 'overview',
}) => {
    const [activeTab, setActiveTab] = useState(initialTab); // overview, channels, members, banned, access
    const [loading, setLoading] = useState(false);

    // Overview State
    const [formData, setFormData] = useState({
        name: portal.name,
        description: portal.description || '',
        privacy: portal.privacy || 'public',
    });
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);

    // Cropping State
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperMode, setCropperMode] = useState(null); // 'avatar' or 'cover'

    // Channel State
    const [newChannelName, setNewChannelName] = useState('');

    // Member State
    const [memberSearch, setMemberSearch] = useState('');

    // Access Control
    const ownerId = portal.owner?._id || portal.owner;
    const currentUserId = currentUser?._id;
    // Strict Owner check
    const isOwner = ownerId && currentUserId && String(ownerId) === String(currentUserId);
    // Admin check
    const isAdmin =
        isOwner ||
        (portal.admins &&
            currentUserId &&
            portal.admins.some((a) => String(a._id || a) === String(currentUserId)));

    // Blocked Users State
    const [blockedUsers, setBlockedUsers] = useState([]);

    // Channel Editing State
    const [editingChannel, setEditingChannel] = useState(null); // { id, name, isPrivate }

    // --- Location State ---
    const [locationData, setLocationData] = useState({
        lat: portal.location?.lat ?? null,
        lng: portal.location?.lng ?? null,
        label: portal.location?.label || '',
    });
    const [showOnMap, setShowOnMap] = useState(portal.showOnMap || false);
    const [locationSearch, setLocationSearch] = useState('');
    const [locationResults, setLocationResults] = useState([]);
    const [locationSearching, setLocationSearching] = useState(false);
    const [locationSaveStatus, setLocationSaveStatus] = useState(null); // 'success' | 'error' | null
    const [manualMode, setManualMode] = useState(false);

    // Sync location data when portal prop changes
    useEffect(() => {
        setLocationData({
            lat: portal.location?.lat ?? null,
            lng: portal.location?.lng ?? null,
            label: portal.location?.label || '',
        });
        setShowOnMap(portal.showOnMap || false);
    }, [portal._id]);

    const handleLocationSearch = async (query) => {
        setLocationSearch(query);
        if (!query.trim() || query.length < 2) {
            setLocationResults([]);
            return;
        }
        try {
            setLocationSearching(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                { headers: { 'Accept-Language': 'tr,en' } }
            );
            const data = await res.json();
            setLocationResults(data);
        } catch (err) {
            console.error('Location search failed', err);
        } finally {
            setLocationSearching(false);
        }
    };

    const handleSelectLocation = (result) => {
        setLocationData({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            label: result.display_name.split(',').slice(0, 2).join(', '),
        });
        setLocationSearch('');
        setLocationResults([]);
    };

    const handleSaveLocation = async () => {
        if (!isOwner) return;
        setLoading(true);
        setLocationSaveStatus(null);
        try {
            const payload = {
                location: locationData.lat !== null ? locationData : { lat: null, lng: null, label: '' },
                showOnMap,
            };
            const res = await axios.put(`/api/portals/${portal._id}`, payload);
            onUpdate(res.data);
            setLocationSaveStatus('success');
            setTimeout(() => setLocationSaveStatus(null), 3000);
        } catch (err) {
            setLocationSaveStatus('error');
            setTimeout(() => setLocationSaveStatus(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLocation = async () => {
        if (!isOwner) return;
        if (!window.confirm('Konum bilgisi silinecek. Emin misiniz?')) return;
        setLocationData({ lat: null, lng: null, label: '' });
        setShowOnMap(false);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, {
                location: { lat: null, lng: null, label: '' },
                showOnMap: false,
            });
            onUpdate(res.data);
        } catch (err) {
            console.error('Clear location failed', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'banned' && (isAdmin || isOwner)) {
            fetchBlockedUsers();
        }
    }, [activeTab, portal._id]);

    const fetchBlockedUsers = async () => {
        try {
            const res = await axios.get(`/api/portals/${portal._id}/blocked`);
            setBlockedUsers(res.data);
            setBlockedUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch blocked users', err);
        }
    };

    // --- Block Search State & Handlers ---
    const [blockSearchQuery, setBlockSearchQuery] = useState('');
    const [blockSearchResults, setBlockSearchResults] = useState([]);
    const [isSearchingBlock, setIsSearchingBlock] = useState(false);

    // --- Access Management State ---
    const [accessData, setAccessData] = useState({
        privacy: portal.privacy,
        allowedUsers: portal.allowedUsers || []
    });
    const [allowedUserSearch, setAllowedUserSearch] = useState('');
    const [allowedUserResults, setAllowedUserResults] = useState([]);

    // Sync with portal updates
    useEffect(() => {
        setAccessData({
            privacy: portal.privacy,
            allowedUsers: portal.allowedUsers || []
        });
    }, [portal]);

    const handleAllowedSearch = async (query) => {
        setAllowedUserSearch(query);
        if (!query.trim()) {
            setAllowedUserResults([]);
            return;
        }
        try {
            const res = await axios.get(`/api/users/search?q=${query}`);
            // Filter out already allowed, members, blocked, and self
            const filtered = res.data.filter(u =>
                !accessData.allowedUsers.some(au => (au._id || au) === u._id) &&
                !portal.members.some(m => (m._id || m) === u._id) &&
                !blockedUsers.some(b => (b._id || b) === u._id) &&
                u._id !== portal.owner?._id
            );
            setAllowedUserResults(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAllowedUser = (user) => {
        setAccessData(prev => ({
            ...prev,
            allowedUsers: [...prev.allowedUsers, user]
        }));
        setAllowedUserSearch('');
        setAllowedUserResults([]);
    };

    const handleRemoveAllowedUser = (userId) => {
        setAccessData(prev => ({
            ...prev,
            allowedUsers: prev.allowedUsers.filter(u => (u._id || u) !== userId)
        }));
    };

    const handleSaveAccess = async () => {
        if (!isOwner) return;
        setLoading(true);
        try {
            // Send only IDs for allowedUsers
            const payload = {
                privacy: accessData.privacy,
                allowedUsers: accessData.allowedUsers.map(u => u._id || u)
            };
            const res = await axios.put(`/api/portals/${portal._id}`, payload);
            onUpdate(res.data);
            alert('Erişim ayarları kaydedildi');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSearch = async (query) => {
        setBlockSearchQuery(query);
        if (!query.trim()) {
            setBlockSearchResults([]);
            return;
        }

        try {
            setIsSearchingBlock(true);
            const res = await axios.get(`/api/users/search?q=${query}`);
            // Filter out already blocked users and the portal owner
            const filtered = res.data.filter(
                (u) =>
                    !blockedUsers.some((b) => b._id === u._id) &&
                    u._id !== portal.owner &&
                    u._id !== portal.owner?._id
            );
            setBlockSearchResults(filtered);
        } catch (err) {
            console.error('Block search error', err);
        } finally {
            setIsSearchingBlock(false);
        }
    };


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

    const uploadImage = async (fileOrBlob, mode) => {
        const form = new FormData();
        // Use original name if File (GIF), otherwise default to .jpg for Blobs
        const fileName = fileOrBlob.name || `${mode}.jpg`;
        form.append(mode, fileOrBlob, fileName);

        try {
            setLoading(true);
            const res = await axios.post(`/api/portals/${portal._id}/${mode}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUpdate(res.data);
        } catch (err) {
            alert(`${mode} yüklenemedi`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e, target) => {
        if (!isOwner) return;
        const file = e.target.files[0];
        if (!file) return;

        // Bypass cropper for GIFs
        if (file.type === 'image/gif') {
            const mode = target === 'avatar' ? 'avatar' : 'banner';
            uploadImage(file, mode);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result);
            setCropperMode(target === 'avatar' ? 'avatar' : 'banner');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCropComplete = async (blob) => {
        const mode = cropperMode; // 'avatar' or 'banner' (mapped from 'cover' in render check if needed, but here it's set as string)
        setCropperImage(null);
        setCropperMode(null);

        if (!blob) return;
        await uploadImage(blob, mode);
    };

    const handleCropCancel = () => {
        setCropperImage(null);
        setCropperMode(null);
    };

    // --- Channel Handlers ---
    const handleAddChannel = async () => {
        if (!newChannelName.trim()) return;
        if (!isAdmin) return;
        try {
            const res = await axios.post(`/api/portals/${portal._id}/channels`, {
                name: newChannelName,
            });
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

    const handleUpdateChannel = async () => {
        if (!editingChannel || !editingChannel.name.trim()) return;
        try {
            await axios.put(`/api/portals/${portal._id}/channels/${editingChannel.id}`, {
                name: editingChannel.name,
                isPrivate: editingChannel.isPrivate,
            });
            // Optimistic update or refresh
            const updatedChannels = portal.channels.map((ch) =>
                ch._id === editingChannel.id
                    ? { ...ch, name: editingChannel.name, isPrivate: editingChannel.isPrivate }
                    : ch
            );
            onUpdate({ ...portal, channels: updatedChannels });
            setEditingChannel(null);
        } catch (err) {
            alert('Kanal güncellenemedi');
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
                members: portal.members.filter((m) => String(m._id || m) !== kickedUserId),
                admins: portal.admins.filter((a) => String(a._id || a) !== kickedUserId),
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

    const handleBlock = async (userId) => {
        if (!isAdmin) return;
        if (!window.confirm('Kullanıcıyı engellemek istediğinize emin misiniz?')) return;
        try {
            await axios.post(`/api/portals/${portal._id}/block`, { userId }); // Updated route
            const blockedUserId = String(userId);
            onUpdate({
                ...portal,
                members: portal.members.filter((m) => String(m._id || m) !== blockedUserId),
                admins: portal.admins.filter((a) => String(a._id || a) !== blockedUserId),
            });
            // Refresh blocked list if active
            if (activeTab === 'banned') fetchBlockedUsers();
        } catch (err) {
            alert('User could not be blocked: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUnblock = async (userId) => {
        if (!isAdmin) return;
        try {
            await axios.post(`/api/portals/${portal._id}/unblock`, { userId });
            setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
            alert('Engeli kaldırma başarısız');
        }
    };

    const filteredMembers = (portal.members || []).filter((m) => {
        const username = m.username || '';
        return username.toLowerCase().includes(memberSearch.toLowerCase());
    });

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-portal-name">{portal.name}</div>
                    </div>

                    <div
                        className="form-label desktop-only"
                        style={{ paddingLeft: '10px', marginBottom: '8px' }}
                    >
                        Genel
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        title="Genel Bakış"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ minWidth: '20px' }}
                        >
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span className="tab-label">Genel Bakış</span>
                    </div>

                    <div
                        className="form-label desktop-only"
                        style={{ paddingLeft: '10px', marginTop: '20px', marginBottom: '8px' }}
                    >
                        Yönetim
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'access' ? 'active' : ''}`}
                        onClick={() => setActiveTab('access')}
                        title="Erişim"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ minWidth: '20px' }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span className="tab-label">Erişim</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                        title="Kanallar"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ minWidth: '20px' }}
                        >
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        <span className="tab-label">Kanallar</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                        title="Üyeler"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ minWidth: '20px' }}
                        >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span className="tab-label">Üyeler</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'banned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('banned')}
                        title="Engellenenler"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ minWidth: '20px' }}
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                        <span className="tab-label">Engellenenler</span>
                    </div>

                    <div
                        className={`settings-tab ${activeTab === 'location' ? 'active' : ''}`}
                        onClick={() => setActiveTab('location')}
                        title="Konum"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ minWidth: '20px' }}
                        >
                            <circle cx="12" cy="10" r="3"></circle>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
                        </svg>
                        <span className="tab-label">Konum</span>
                    </div>
                </div>

                {/* Content */}
                <div className="settings-content">
                    <button className="close-settings-btn" onClick={onClose}>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Genel Bakış</h2>

                            <div className="images-grid">
                                <div
                                    className="image-preview-box banner-box"
                                    onClick={() => isOwner && bannerRef.current.click()}
                                >
                                    {portal.banner ? (
                                        <img
                                            src={getImageUrl(portal.banner)}
                                            alt=""
                                            className="banner-img"
                                        />
                                    ) : (
                                        <div style={{ color: '#72767d' }}>Banner Yok</div>
                                    )}
                                    {isOwner && (
                                        <div className="upload-overlay">Banner Değiştir</div>
                                    )}
                                </div>
                                <div
                                    className="image-preview-box avatar-box"
                                    onClick={() => isOwner && avatarRef.current.click()}
                                >
                                    {portal.avatar ? (
                                        <img
                                            src={getImageUrl(portal.avatar)}
                                            alt=""
                                            className="avatar-img"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                color: '#72767d',
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {portal.name[0]}
                                        </div>
                                    )}
                                    {isOwner && <div className="upload-overlay">Logo</div>}
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={bannerRef}
                                onChange={(e) => handleFileSelect(e, 'banner')}
                                hidden
                                accept="image/*"
                            />
                            <input
                                type="file"
                                ref={avatarRef}
                                onChange={(e) => handleFileSelect(e, 'avatar')}
                                hidden
                                accept="image/*"
                            />

                            <div className="form-group">
                                <label className="form-label">Portal Adı</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    disabled={!isOwner}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    disabled={!isOwner}
                                />
                            </div>

                            {isOwner && (
                                <button
                                    className="btn-save"
                                    onClick={handleSaveOverview}
                                    disabled={loading}
                                >
                                    {loading ? '...' : 'Değişiklikleri Kaydet'}
                                </button>
                            )}

                            <input
                                type="file"
                                ref={bannerRef}
                                onChange={(e) => handleFileSelect(e, 'banner')}
                                hidden
                                accept="image/*"
                            />
                            <input
                                type="file"
                                ref={avatarRef}
                                onChange={(e) => handleFileSelect(e, 'avatar')}
                                hidden
                                accept="image/*"
                            />
                        </div>
                    )}

                    {activeTab === 'access' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Erişim Yönetimi</h2>


                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '12px' }}>Portal Gizliliği</label>
                                <div className="privacy-options-container">
                                    {/* Public Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'public' ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData({ ...accessData, privacy: 'public' })}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <svg className="privacy-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                            </svg>
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Herkese Açık</div>
                                            <div className="privacy-row-desc">Portal tüm ziyaretçilere görünür ve herkes katılabilir.</div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>

                                    {/* Restricted Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'restricted' ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData({ ...accessData, privacy: 'restricted' })}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <svg className="privacy-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="9" cy="7" r="4"></circle>
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                            </svg>
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Belirli Kişiler</div>
                                            <div className="privacy-row-desc">Sadece üyeler ve izin verilen kullanıcılar erişebilir.</div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>

                                    {/* Private Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'private' ? 'selected' : ''} ${portal.members.length > portal.admins.length ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (isOwner && portal.members.length <= portal.admins.length) {
                                                setAccessData({ ...accessData, privacy: 'private' });
                                            }
                                        }}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <svg className="privacy-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Gizli (Yöneticiler)</div>
                                            <div className="privacy-row-desc">
                                                Sadece yöneticiler erişebilir.
                                                {portal.members.length > portal.admins.length && (
                                                    <span style={{ color: '#ed4245', display: 'block', marginTop: '2px', fontSize: '0.8rem' }}>
                                                        (İçeride üye varken seçilemez)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {accessData.privacy === 'restricted' && (
                                <div className="allowed-users-section">
                                    <div className="section-header">
                                        <div className="section-title">İzinli Kullanıcılar ({accessData.allowedUsers.length + portal.members.length})</div>
                                    </div>

                                    <div className="search-container">
                                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                        <input
                                            className="search-input-modern"
                                            placeholder="Kullanıcı adı ile ara ve ekle..."
                                            value={allowedUserSearch}
                                            onChange={(e) => handleAllowedSearch(e.target.value)}
                                            disabled={!isOwner}
                                        />

                                        {allowedUserResults.length > 0 && (
                                            <div className="search-results-dropdown" style={{ top: '45px' }}>
                                                {allowedUserResults.map(user => (
                                                    <div key={user._id} className="user-row" onClick={() => handleAddAllowedUser(user)} style={{ cursor: 'pointer', padding: '10px 12px' }}>
                                                        <img src={getImageUrl(user.profile?.avatar)} className="user-avatar-small" alt="" />
                                                        <span className="user-name">{user.username}</span>
                                                        <div style={{ marginLeft: 'auto', color: '#2ecc71', fontSize: '0.8rem', fontWeight: '600' }}>EKLE</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="allowed-list">
                                        {/* Existing Members */}
                                        {portal.members.map(member => (
                                            <div key={member._id} className="user-row">
                                                <img src={getImageUrl(member.profile?.avatar)} className="user-avatar-small" alt="" />
                                                <div className="user-info">
                                                    <span className="user-name">{member.username}</span>
                                                    <span className="user-role-badge role-member">Üye</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Allowed Users */}
                                        {accessData.allowedUsers.map(user => (
                                            <div key={user._id || user} className="user-row">
                                                <img src={getImageUrl(user.profile?.avatar)} className="user-avatar-small" alt="" />
                                                <div className="user-info">
                                                    <span className="user-name">{user.username}</span>
                                                    <span className="user-role-badge role-allowed">İzinli</span>
                                                </div>
                                                {isOwner && (
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveAllowedUser(user._id || user)}
                                                        title="İzni Kaldır"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {portal.members.length === 0 && accessData.allowedUsers.length === 0 && (
                                            <div className="empty-state-text">Henüz kimseye özel erişim verilmedi.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isOwner && (
                                <div className="modal-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                                    <button
                                        className="btn-save"
                                        onClick={handleSaveAccess}
                                        disabled={loading}
                                    >
                                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                    </button>
                                </div>
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
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                                    />
                                    <button
                                        className="btn-save"
                                        style={{ background: '#5865f2' }}
                                        onClick={handleAddChannel}
                                    >
                                        Oluştur
                                    </button>
                                </div>
                            )}

                            <div className="channel-list">
                                {portal.channels &&
                                    portal.channels.map((ch) => (
                                        <div key={ch._id} className="channel-row">
                                            {editingChannel && editingChannel.id === ch._id ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        flex: 1,
                                                    }}
                                                >
                                                    <input
                                                        className="form-input"
                                                        value={editingChannel.name}
                                                        onChange={(e) =>
                                                            setEditingChannel({
                                                                ...editingChannel,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        style={{
                                                            padding: '4px 8px',
                                                            height: '32px',
                                                        }}
                                                    />
                                                    <label
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '12px',
                                                            color: '#b9bbbe',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={editingChannel.isPrivate}
                                                            onChange={(e) =>
                                                                setEditingChannel({
                                                                    ...editingChannel,
                                                                    isPrivate: e.target.checked,
                                                                })
                                                            }
                                                        />
                                                        Gizli
                                                    </label>
                                                    <button
                                                        onClick={handleUpdateChannel}
                                                        style={{
                                                            color: '#2ecc71',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingChannel(null)}
                                                        style={{
                                                            color: '#ed4245',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <line
                                                                x1="18"
                                                                y1="6"
                                                                x2="6"
                                                                y2="18"
                                                            ></line>
                                                            <line
                                                                x1="6"
                                                                y1="6"
                                                                x2="18"
                                                                y2="18"
                                                            ></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        className="channel-name"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <span style={{ color: '#72767d' }}>#</span>
                                                        {ch.name}
                                                        {ch.isPrivate && (
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                style={{ color: '#faa61a' }}
                                                                title="Gizli Kanal"
                                                            >
                                                                <rect
                                                                    x="3"
                                                                    y="11"
                                                                    width="18"
                                                                    height="11"
                                                                    rx="2"
                                                                    ry="2"
                                                                ></rect>
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="channel-actions">
                                                            <button
                                                                onClick={() =>
                                                                    setEditingChannel({
                                                                        id: ch._id,
                                                                        name: ch.name,
                                                                        isPrivate:
                                                                            ch.isPrivate || false,
                                                                    })
                                                                }
                                                                title="Düzenle"
                                                                style={{ marginRight: '4px' }}
                                                            >
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteChannel(ch._id)
                                                                }
                                                                title="Kanalı Sil"
                                                            >
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                {(!portal.channels || portal.channels.length === 0) && (
                                    <div
                                        style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: '#72767d',
                                        }}
                                    >
                                        Hiç kanal yok.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">
                                Üyeler ({portal.members?.length || 0})
                            </h2>

                            <div className="form-group">
                                <input
                                    className="form-input"
                                    placeholder="Üye ara..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <div className="members-list">
                                {filteredMembers.map((member) => {
                                    const memberId = member._id || member;
                                    const isAdminMember = portal.admins.some(
                                        (a) => String(a._id || a) === String(memberId)
                                    );
                                    const isOwnerMember = String(ownerId) === String(memberId);

                                    return (
                                        <div key={memberId} className="member-card">
                                            <img
                                                src={getImageUrl(member.profile?.avatar)}
                                                alt=""
                                                className="member-avatar"
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            <div className="member-details">
                                                <div className="member-username">
                                                    {member.username || 'Kullanıcı'}
                                                    {isOwnerMember && (
                                                        <span className="role-badge owner">
                                                            👑 As Yönetici
                                                        </span>
                                                    )}
                                                    {isAdminMember && !isOwnerMember && (
                                                        <span className="role-badge admin">
                                                            🛡️ Er Yönetici
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Menu */}
                                            {isAdmin &&
                                                !isOwnerMember &&
                                                // Hide actions if I am Admin but target is also Admin (unless I am Owner)
                                                (isOwner || !isAdminMember) && (
                                                    <div
                                                        className="channel-actions"
                                                        style={{ display: 'flex', gap: '8px' }}
                                                    >
                                                        {isOwner &&
                                                            (!isAdminMember ? (
                                                                <button
                                                                    onClick={() =>
                                                                        handleRole(
                                                                            memberId,
                                                                            'promote'
                                                                        )
                                                                    }
                                                                    title="Er Yönetici Yap"
                                                                    style={{ color: '#5865f2' }}
                                                                >
                                                                    <svg
                                                                        width="18"
                                                                        height="18"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                    >
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                                                    </svg>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        handleRole(
                                                                            memberId,
                                                                            'demote'
                                                                        )
                                                                    }
                                                                    title="Yöneticiliği Al"
                                                                    style={{ color: '#faa61a' }}
                                                                >
                                                                    <svg
                                                                        width="18"
                                                                        height="18"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                    >
                                                                        <circle
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                        ></circle>
                                                                        <line
                                                                            x1="8"
                                                                            y1="12"
                                                                            x2="16"
                                                                            y2="12"
                                                                        ></line>
                                                                    </svg>
                                                                </button>
                                                            ))}

                                                        <button
                                                            onClick={() => handleKick(memberId)}
                                                            title="Portaldan At"
                                                            style={{ color: '#ed4245' }}
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
                                                                <circle
                                                                    cx="8.5"
                                                                    cy="7"
                                                                    r="4"
                                                                ></circle>
                                                                <line
                                                                    x1="23"
                                                                    y1="11"
                                                                    x2="17"
                                                                    y2="11"
                                                                ></line>
                                                            </svg>
                                                        </button>

                                                        <button
                                                            onClick={() => handleBlock(memberId)}
                                                            title="Engelle"
                                                            style={{ color: '#ed4245' }}
                                                        >
                                                            <svg
                                                                width="18"
                                                                height="18"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                ></circle>
                                                                <line
                                                                    x1="4.93"
                                                                    y1="4.93"
                                                                    x2="19.07"
                                                                    y2="19.07"
                                                                ></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'banned' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Engellenen Kullanıcılar</h2>

                            {/* Block User Search */}
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <input
                                    className="form-input"
                                    placeholder="Engellemek için kullanıcı ara..."
                                    value={blockSearchQuery}
                                    onChange={(e) => handleBlockSearch(e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                />
                                {blockSearchResults.length > 0 && (
                                    <div className="search-results-dropdown">
                                        {blockSearchResults.map((user) => (
                                            <div key={user._id} className="member-card full-width">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        flex: 1,
                                                    }}
                                                >
                                                    <img
                                                        src={getImageUrl(user.profile?.avatar)}
                                                        alt=""
                                                        className="member-avatar"
                                                        onError={(e) =>
                                                            (e.target.style.display = 'none')
                                                        }
                                                    />
                                                    <div className="member-username">
                                                        {user.username}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleBlock(user._id);
                                                        setBlockSearchQuery('');
                                                        setBlockSearchResults([]);
                                                    }}
                                                    className="btn-save danger-btn"
                                                    style={{
                                                        padding: '4px 12px',
                                                        fontSize: '12px',
                                                        background: '#ed4245',
                                                        color: 'white',
                                                        border: 'none',
                                                    }}
                                                >
                                                    Engelle
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="members-list">
                                {blockedUsers.length > 0 ? (
                                    blockedUsers.map((user) => (
                                        <div key={user._id} className="member-card">
                                            <img
                                                src={getImageUrl(user.profile?.avatar)}
                                                alt=""
                                                className="member-avatar"
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            <div className="member-details">
                                                <div className="member-username">
                                                    {user.username}
                                                </div>
                                            </div>
                                            <div className="channel-actions">
                                                <button
                                                    onClick={() => handleUnblock(user._id)}
                                                    title="Engeli Kaldır"
                                                    className="btn-save"
                                                    style={{
                                                        padding: '4px 12px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            color: '#72767d',
                                            padding: '20px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        Engellenen kullanıcı yok.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'location' && isAdmin && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">🌍 Dünya Haritası Konumu</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
                                Portalınızın dünya haritasında görünmesini sağlamak için bir konum seçin. Seçilen konumda portalınızın kapak fotoğrafı gösterilecek.
                            </p>

                            {/* Current Location Preview */}
                            {locationData.lat !== null && locationData.lat !== undefined && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(19,91,236,0.12), rgba(99,179,237,0.08))',
                                    border: '1px solid rgba(19,91,236,0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                }}>
                                    {portal.avatar ? (
                                        <img src={portal.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid rgba(19,91,236,0.5)', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                                            {portal.name[0]}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{portal.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{locationData.label || 'Konum seçildi'}</div>
                                        <div style={{ color: '#135bec', fontSize: '0.78rem', marginTop: '2px', fontFamily: 'monospace' }}>
                                            {locationData.lat?.toFixed(4)}°, {locationData.lng?.toFixed(4)}°
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span style={{ background: showOnMap ? 'rgba(46,204,113,0.15)' : 'rgba(114,118,125,0.15)', color: showOnMap ? '#2ecc71' : '#72767d', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', border: `1px solid ${showOnMap ? 'rgba(46,204,113,0.4)' : 'rgba(114,118,125,0.3)'}` }}>
                                            {showOnMap ? '🌍 Haritada' : 'Gizli'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Geocoding Search */}
                            {isOwner && (
                                <div className="form-group">
                                    <label className="form-label">Konum Ara</label>
                                    <div className="search-container" style={{ position: 'relative' }}>
                                        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                        <input
                                            className="search-input-modern"
                                            placeholder="Şehir, ülke veya adres ara... (örn: İstanbul, Türkiye)"
                                            value={locationSearch}
                                            onChange={(e) => handleLocationSearch(e.target.value)}
                                        />
                                        {locationSearching && (
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aranıyor...</div>
                                        )}
                                        {locationResults.length > 0 && (
                                            <div className="search-results-dropdown" style={{ top: '50px', zIndex: 10 }}>
                                                {locationResults.map((result, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleSelectLocation(result)}
                                                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                                                        className="user-row"
                                                    >
                                                        <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.88rem' }}>
                                                            {result.display_name.split(',').slice(0, 2).join(', ')}
                                                        </span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                            {parseFloat(result.lat).toFixed(4)}°N, {parseFloat(result.lon).toFixed(4)}°E
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Coordinate Entry */}
                            {isOwner && (
                                <div style={{ marginBottom: '20px' }}>
                                    <button
                                        onClick={() => setManualMode(!manualMode)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                    >
                                        {manualMode ? '▲ Manuel girişi kapat' : '▼ Manuel koordinat gir'}
                                    </button>
                                    {manualMode && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Enlem (Lat)</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="any"
                                                    placeholder="Örn: 41.0082"
                                                    value={locationData.lat ?? ''}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, lat: parseFloat(e.target.value) || null }))}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Boylam (Lng)</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="any"
                                                    placeholder="Örn: 28.9784"
                                                    value={locationData.lng ?? ''}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, lng: parseFloat(e.target.value) || null }))}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                                                <label className="form-label" style={{ fontSize: '0.78rem' }}>Konum Etiketi</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="Örn: İstanbul, Türkiye"
                                                    value={locationData.label}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, label: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Show on Map Toggle */}
                            {isOwner && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '10px',
                                    padding: '14px 18px',
                                    marginBottom: '24px',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Dünya Haritasında Göster</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Portalınız 3D dünya haritasında görünür olacak</div>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={showOnMap}
                                            onChange={(e) => setShowOnMap(e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                            disabled={locationData.lat === null}
                                        />
                                        <span style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            background: showOnMap && locationData.lat !== null ? 'var(--primary-color)' : 'var(--border-color)',
                                            borderRadius: '26px',
                                            transition: '0.3s',
                                            cursor: locationData.lat === null ? 'not-allowed' : 'pointer',
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                content: '',
                                                height: '20px', width: '20px',
                                                left: showOnMap && locationData.lat !== null ? '23px' : '3px',
                                                bottom: '3px',
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: '0.3s',
                                                display: 'block',
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            )}

                            {!isOwner && (
                                <div style={{ background: 'rgba(250,166,26,0.1)', border: '1px solid rgba(250,166,26,0.3)', borderRadius: '10px', padding: '14px', color: '#faa61a', fontSize: '0.88rem', marginBottom: '20px' }}>
                                    ⚠️ Konum ayarları yalnızca portal sahibi tarafından değiştirilebilir.
                                </div>
                            )}

                            {/* Save Status */}
                            {locationSaveStatus === 'success' && (
                                <div style={{ background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '10px', padding: '12px 16px', color: '#2ecc71', marginBottom: '16px', fontWeight: '600' }}>
                                    ✅ Konum başarıyla kaydedildi!
                                </div>
                            )}
                            {locationSaveStatus === 'error' && (
                                <div style={{ background: 'rgba(237,66,69,0.12)', border: '1px solid rgba(237,66,69,0.4)', borderRadius: '10px', padding: '12px 16px', color: '#ed4245', marginBottom: '16px', fontWeight: '600' }}>
                                    ❌ Kaydetme hatası. Lütfen tekrar deneyin.
                                </div>
                            )}

                            {isOwner && (
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn-save"
                                        onClick={handleSaveLocation}
                                        disabled={loading || locationData.lat === null}
                                    >
                                        {loading ? 'Kaydediliyor...' : '💾 Konumu Kaydet'}
                                    </button>
                                    {(portal.location?.lat !== null && portal.location?.lat !== undefined) && (
                                        <button
                                            onClick={handleClearLocation}
                                            disabled={loading}
                                            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(237,66,69,0.4)', background: 'rgba(237,66,69,0.1)', color: '#ed4245', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                                        >
                                            🗑️ Konumu Kaldır
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Cropper Modal */}
            {
                cropperImage && (
                    <ImageCropper
                        image={cropperImage}
                        mode={cropperMode}
                        onComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                        title={cropperMode === 'avatar' ? 'Portal Logosu' : 'Portal Bannerı'}
                    />
                )
            }
        </div >
    );
};

export default PortalSettingsModal;
