import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import './Profile.css';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        portalVisibility: 'public' // Default
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('memberships'); // Default tab

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        if (isOwnProfile) {
            fetchMyProfile();
            setActiveTab('memberships'); // Reset to default for own profile
        } else {
            fetchUserProfile(username);
            setActiveTab('memberships'); // Reset for others
        }
    }, [username, isOwnProfile]);

    const fetchMyProfile = async () => {
        try {
            const response = await axios.get('/api/users/me');
            setProfileUser(response.data);
            setFormData({
                displayName: response.data.profile?.displayName || '',
                bio: response.data.profile?.bio || '',
                portalVisibility: response.data.settings?.privacy?.portalVisibility || 'public'
            });
        } catch (err) {
            console.error('Failed to fetch my profile:', err);
        }
    };

    const fetchUserProfile = async (username) => {
        try {
            const response = await axios.get(`/api/users/${username}`);
            setProfileUser(response.data);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError('Kullanıcı bulunamadı');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const response = await axios.post('/api/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedUser = { ...currentUser };
            updatedUser.profile.avatar = response.data.avatar;
            updateUser(updatedUser);
            setProfileUser(prev => ({ ...prev, profile: { ...prev.profile, avatar: response.data.avatar } }));
            setSuccess('Profil fotoğrafı güncellendi!');
        } catch (err) {
            console.error('Upload error:', err);
            setError('Resim yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('cover', file);
        try {
            setLoading(true);
            const response = await axios.post('/api/users/me/cover', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedUser = { ...currentUser };
            updatedUser.profile.coverImage = response.data.coverImage;
            updateUser(updatedUser);
            setProfileUser(prev => ({ ...prev, profile: { ...prev.profile, coverImage: response.data.coverImage } }));
            setSuccess('Kapak fotoğrafı güncellendi!');
        } catch (err) {
            console.error('Upload cover error:', err);
            setError('Kapak resmi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            // Update profile info
            const profileResponse = await axios.put('/api/users/me', {
                displayName: formData.displayName,
                bio: formData.bio
            });

            // Update settings (for privacy)
            const settingsResponse = await axios.put('/api/users/settings', {
                privacy: { portalVisibility: formData.portalVisibility }
            });

            const updatedUser = { ...currentUser };
            // Deep merge might be needed for real app, but simplified:
            if (updatedUser.profile) {
                updatedUser.profile.displayName = formData.displayName;
                updatedUser.profile.bio = formData.bio;
            }
            if (!updatedUser.settings) updatedUser.settings = {};
            if (!updatedUser.settings.privacy) updatedUser.settings.privacy = {};
            updatedUser.settings.privacy.portalVisibility = formData.portalVisibility;

            updateUser(updatedUser);

            // Update local state
            setProfileUser(prev => ({
                ...prev,
                profile: { ...prev.profile, ...formData },
                settings: settingsResponse.data.settings
            }));

            setSuccess('Profil güncellendi!');
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Profil güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!profileUser || isOwnProfile) return;
        try {
            const response = await axios.post(`/api/users/follow/${profileUser._id}`);
            // Optimistic update or refetch
            // For simplicity, update local state similar to response
            setProfileUser(prev => ({
                ...prev,
                isFollowing: response.data.isFollowing,
                hasRequested: response.data.hasRequested,
                // If unfollowed, isFriend becomes false
                isFriend: response.data.isFollowing ? prev.isFriend : false
            }));
        } catch (err) {
            console.error('Follow action failed:', err);
        }
    };

    const handleMessage = async () => {
        if (!profileUser || isOwnProfile) return;
        try {
            // Create DM or get existing
            const response = await axios.post('/api/channels', {
                type: 'dm',
                recipientId: profileUser._id
            });
            navigate(`/channels/me/${response.data._id}`);
        } catch (err) {
            console.error('Message action failed:', err);
            // Fallback: If 400 (already exists), maybe we need to find it differently?
            // Assuming API handles "get or create" logic. 
            // If API not implemented for strict "get or create", we might error.
            // Let's assume standard behavior for now.
        }
    };

    // Helper for button text
    const getFollowButton = () => {
        if (profileUser.isFriend) {
            return (
                <button className="profile-action-btn success" onClick={handleFollow}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    Arkadaşsın
                </button>
            );
        } else if (profileUser.hasRequested) {
            return (
                <button className="profile-action-btn secondary" onClick={handleFollow}>
                    İstek Gönderildi
                </button>
            );
        } else if (profileUser.isFollowing) {
            return (
                <button className="profile-action-btn secondary" onClick={handleFollow}>
                    Takip Ediliyor
                </button>
            );
        } else {
            return (
                <button className="profile-action-btn primary" onClick={handleFollow} style={{ backgroundColor: '#248046', color: 'white' }}>
                    Arkadaş Ekle
                </button>
            );
        }
    };

    if (!profileUser) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="spinner-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}>
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-wrapper full-height" style={{ backgroundColor: '#111214', color: '#dbdee1' }}>
            <Navbar />
            <main className="app-content profile-page-content">

                {/* Wide Profile Card */}
                <div className="profile-card">

                    {/* Banner */}
                    <div className="profile-banner" style={{ backgroundColor: profileUser?.profile?.bannerColor || '#1e1f22' }}>
                        {profileUser?.profile?.coverImage && (
                            <img
                                src={getImageUrl(profileUser.profile.coverImage)}
                                alt="Banner"
                            />
                        )}
                        {/* Status Bubble REMOVED */}
                    </div>

                    {/* Profile Header (Avatar & Actions) */}
                    <div className="profile-header">
                        {/* Avatar */}
                        <div className="profile-avatar-container">
                            {profileUser?.profile?.avatar ? (
                                <img
                                    src={getImageUrl(profileUser.profile.avatar)}
                                    alt={profileUser.username}
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {profileUser.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="profile-status-indicator" />
                        </div>

                        {/* Actions */}
                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <>
                                    <button className="profile-action-btn" onClick={() => setEditing(true)}>
                                        Profili Düzenle
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="profile-action-btn primary"
                                        onClick={handleMessage}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                                        Mesaj
                                    </button>
                                    {getFollowButton()}
                                    <button className="profile-action-btn icon-only">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="profile-body">

                        {/* User Info */}
                        <div className="profile-user-title">
                            <h1>
                                {profileUser?.profile?.displayName || profileUser?.username}
                                <Badge type={profileUser?.verificationBadge} />
                            </h1>
                            <span className="profile-username-tag">{profileUser?.username}</span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: '#3f4147', margin: '16px 0' }}></div>

                        {/* Info Tabs */}
                        <div className="profile-tabs">
                            <div
                                className={`profile-tab-item ${activeTab === 'memberships' ? 'active' : ''}`}
                                onClick={() => setActiveTab('memberships')}
                            >
                                Üyelikler
                            </div>
                            <div
                                className={`profile-tab-item ${activeTab === 'friends' ? 'active' : ''}`}
                                onClick={() => setActiveTab('friends')}
                            >
                                Arkadaşlar
                                {profileUser.mutualFriendsCount > 0 && !isOwnProfile && <span className="tab-badge">{profileUser.mutualFriendsCount}</span>}
                            </div>

                            {!isOwnProfile ? (
                                <div
                                    className={`profile-tab-item ${activeTab === 'mutual_portals' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('mutual_portals')}
                                >
                                    {profileUser.mutualPortalsCount || 0} Ortak Sunucu
                                </div>
                            ) : (
                                <div
                                    className={`profile-tab-item ${activeTab === 'wishlist' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('wishlist')}
                                >
                                    İstek Listesi
                                </div>
                            )}
                        </div>

                        {/* Profile Body Content */}
                        <div style={{ flex: 1 }}>

                            {/* MEMBERSHIPS TAB */}
                            {activeTab === 'memberships' && (
                                <div className="tab-content fade-in">
                                    <h4 className="section-header">ÜYE OLUNAN PORTALLAR</h4>

                                    {profileUser.portalsHidden ? (
                                        <div style={{ color: '#949ba4', fontSize: '14px', textAlign: 'center', padding: '20px', background: '#1e1f22', borderRadius: '8px' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            <p>Bu kullanıcının üyelikleri gizli.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                            {profileUser.portals && profileUser.portals.length > 0 ? (
                                                profileUser.portals.map(portal => (
                                                    <div key={portal._id} style={{
                                                        backgroundColor: '#1e1f22',
                                                        borderRadius: '8px',
                                                        padding: '16px',
                                                        border: '1px solid #2b2d31',
                                                        textAlign: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                        // Optional: Navigate to portal on click
                                                        onClick={() => navigate(`/portal/${portal._id}`)}
                                                    >
                                                        <div style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', borderRadius: '50%', backgroundColor: '#5865F2', overflow: 'hidden' }}>
                                                            {portal.avatar ? <img src={getImageUrl(portal.avatar)} alt={portal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                                        </div>
                                                        <div style={{ color: '#dbdee1', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{portal.name}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ color: '#949ba4', fontSize: '14px', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>
                                                    Henüz üye olunan portal yok.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {profileUser?.profile?.bio && (
                                        <div style={{ marginTop: '32px' }}>
                                            <h4 className="section-header">HAKKIMDA</h4>
                                            <div className="modern-bio-box compact">
                                                {/* Added 'compact' class for further styling */}
                                                {profileUser.profile.bio}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '24px' }}>
                                        <h4 className="section-header">ÜYELİK TARİHİ</h4>
                                        <div style={{ fontSize: '14px', color: '#dbdee1', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                <span>{new Date(profileUser.createdAt || Date.now()).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FRIENDS TAB */}
                            {activeTab === 'friends' && (
                                <div className="tab-content fade-in">
                                    <h4 className="section-header">{isOwnProfile ? 'ARKADAŞLAR' : 'ORTAK ARKADAŞLAR'}</h4>

                                    {!isOwnProfile && profileUser.mutualFriends && profileUser.mutualFriends.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                                            {profileUser.mutualFriends.map(friend => (
                                                <div key={friend._id} className="friend-card-compact" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#1e1f22', borderRadius: '8px' }}>
                                                    <img src={getImageUrl(friend.profile?.avatar)} alt={friend.username} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{friend.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#949ba4', fontSize: '14px', textAlign: 'center', padding: '40px', background: '#1e1f22', borderRadius: '8px', marginTop: '16px' }}>
                                            {isOwnProfile ? (
                                                <><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4e5058" strokeWidth="1" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                                                    <p>Henüz ekli arkadaş yok.</p></>
                                            ) : (
                                                <p>Ortak arkadaş bulunamadı.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MUTUAL PORTALS TAB */}
                            {activeTab === 'mutual_portals' && !isOwnProfile && (
                                <div className="tab-content fade-in">
                                    <h4 className="section-header">ORTAK SUNUCULAR</h4>
                                    {profileUser.mutualPortals && profileUser.mutualPortals.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                            {profileUser.mutualPortals.map(portal => (
                                                <div key={portal._id} style={{
                                                    backgroundColor: '#1e1f22',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    border: '1px solid #2b2d31',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', borderRadius: '50%', backgroundColor: '#5865F2', overflow: 'hidden' }}>
                                                        {portal.avatar ? <img src={getImageUrl(portal.avatar)} alt={portal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                                    </div>
                                                    <div style={{ color: '#dbdee1', fontWeight: 'bold', fontSize: '14px' }}>{portal.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#949ba4', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                            Ortak sunucu bulunamadı.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* WISHLIST TAB (Placeholder) */}
                            {activeTab === 'wishlist' && (
                                <div className="tab-content fade-in">
                                    <h4 className="section-header">İSTEK LİSTESİ</h4>
                                    <div style={{ color: '#949ba4', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                        Liste boş.
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Edit Profile Modal */}
                {editing && (
                    <div className="edit-modal-overlay" onClick={() => setEditing(false)}>
                        <div className="edit-modal-modern" onClick={e => e.stopPropagation()}>
                            <div className="edit-modal-header-modern">
                                <div className="header-left">
                                    <button className="close-btn-modern" onClick={() => setEditing(false)}>✕</button>
                                    <h2 className="header-title-modern">Profili düzenle</h2>
                                </div>
                                <button className="save-btn-modern" onClick={handleSubmit} disabled={loading}>
                                    {loading ? '...' : 'Kaydet'}
                                </button>
                            </div>

                            <div className="edit-modal-content-modern" style={{ backgroundColor: '#313338' }}>
                                {/* ... content ... */}
                                <div className="edit-cover-container">
                                    {profileUser?.profile?.coverImage ? (
                                        <img src={getImageUrl(profileUser.profile.coverImage)} alt="Cover" className="edit-cover-image" />
                                    ) : (
                                        <div className="edit-cover-placeholder"></div>
                                    )}
                                    <div className="image-overlay-actions">
                                        <button className="image-overlay-btn" onClick={() => coverInputRef.current.click()} title="Fotoğraf ekle">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                <circle cx="12" cy="13" r="4"></circle>
                                            </svg>
                                        </button>
                                        <input type="file" ref={coverInputRef} onChange={handleCoverChange} style={{ display: 'none' }} accept="image/*" />
                                    </div>
                                </div>

                                <div className="edit-avatar-container">
                                    <div className="edit-avatar-wrapper">
                                        {profileUser?.profile?.avatar ? (
                                            <img src={getImageUrl(profileUser.profile.avatar)} alt="Avatar" className="edit-avatar-image" />
                                        ) : (
                                            <div className="edit-avatar-placeholder">
                                                {profileUser.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="avatar-overlay-actions">
                                            <button className="image-overlay-btn" onClick={() => avatarInputRef.current.click()} title="Fotoğraf ekle">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                    <circle cx="12" cy="13" r="4"></circle>
                                                </svg>
                                            </button>
                                            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                                        </div>
                                    </div>
                                </div>

                                <div className="edit-form-fields">
                                    <div className="floating-label-group">
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            className="floating-input"
                                            placeholder=" "
                                            id="input-name"
                                            style={{ backgroundColor: '#1e1f22', borderColor: '#1e1f22', color: 'white' }}
                                        />
                                        <label htmlFor="input-name" className="floating-label">İsim</label>
                                    </div>

                                    <div className="floating-label-group">
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            className="floating-input floating-textarea"
                                            placeholder=" "
                                            id="input-bio"
                                            style={{ backgroundColor: '#1e1f22', borderColor: '#1e1f22', color: 'white' }}
                                        />
                                        <label htmlFor="input-bio" className="floating-label">Bio (Kendinden bahset)</label>
                                    </div>

                                    {/* Privacy Settings */}
                                    <div className="floating-label-group" style={{ marginTop: '16px' }}>
                                        <label style={{ fontSize: '12px', color: '#b5bac1', marginBottom: '6px', display: 'block' }}>Üyeliklerin Görünürlüğü</label>
                                        <select
                                            name="portalVisibility"
                                            value={formData.portalVisibility}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#1e1f22',
                                                border: '1px solid #2b2d31',
                                                borderRadius: '4px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="public">Herkese Açık</option>
                                            <option value="friends">Sadece Arkadaşlara</option>
                                            <option value="private">Gizli</option>
                                        </select>
                                    </div>

                                    {error && <div className="error-message">{error}</div>}
                                    {success && <div className="success-message">{success}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
