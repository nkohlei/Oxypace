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
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        if (isOwnProfile) {
            fetchMyProfile();
        } else {
            fetchUserProfile(username);
        }
    }, [username, isOwnProfile]);

    const fetchMyProfile = async () => {
        try {
            const response = await axios.get('/api/users/me');
            setProfileUser(response.data);
            setFormData({
                displayName: response.data.profile?.displayName || '',
                bio: response.data.profile?.bio || '',
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
            const response = await axios.put('/api/users/me', formData);
            updateUser(response.data.user);
            setProfileUser(prev => ({ ...prev, profile: { ...prev.profile, ...formData } }));
            setSuccess('Profil güncellendi!');
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Profil güncellenemedi');
        } finally {
            setLoading(false);
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
                        {/* Status Bubble (Top Right) */}
                        {profileUser?.profile?.bio && (
                            <div className="status-bubble">
                                <span role="img" aria-label="thought">💭</span>
                                {profileUser.profile.bio}
                            </div>
                        )}
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
                                    <button className="profile-action-btn icon-only">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="profile-action-btn primary"
                                        onClick={() => {
                                            alert('Mesajlaşma özelliği yakında!');
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                                        Mesaj
                                    </button>
                                    <button className="profile-action-btn icon-only">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                                    </button>
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
                            {isOwnProfile ? (
                                <>
                                    <div className="profile-tab-item active">Pano</div>
                                    <div className="profile-tab-item">Etkinlik</div>
                                    <div className="profile-tab-item">İstek Listesi</div>
                                </>
                            ) : (
                                <>
                                    <div className="profile-tab-item active">Etkinlik</div>
                                    <div className="profile-tab-item">1 Ortak Arkadaş</div>
                                    <div className="profile-tab-item">1 Ortak Sunucu</div>
                                </>
                            )}
                        </div>

                        {/* Profile Body Content */}
                        <div style={{ flex: 1 }}>
                            {/* Bio / About */}
                            {profileUser?.profile?.bio && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 className="section-header">HAKKIMDA</h4>
                                    <div className="section-content">
                                        {profileUser.profile.bio}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <h4 className="section-header">ÜYELİK TARİHİ</h4>
                                <div style={{ fontSize: '14px', color: '#dbdee1', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        <span>24 Mar 2023</span>
                                    </div>
                                </div>
                            </div>

                            {/* Not (Only visible to you) */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 className="section-header">Not (sadece sana görünür)</h4>
                                <div style={{ fontSize: '13px', color: '#dbdee1', cursor: 'pointer' }}>
                                    Not eklemek için tıkla
                                </div>
                            </div>

                            {/* My Profile Widgets */}
                            {isOwnProfile && (
                                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f2f3f5', margin: '0 0 4px 0' }}>Profilini Widget'larla özelleştir</h3>
                                        <p style={{ fontSize: '13px', color: '#b5bac1', margin: 0 }}>Kendin ve ilgi alanların hakkında daha fazla paylaşım yapmak için Widget kitaplığımızdan seçim yap</p>
                                    </div>
                                    <div className="widgets-grid">
                                        {/* Widget 1: Marvel Rivals */}
                                        <div className="profile-widget-card" style={{ background: 'linear-gradient(135deg, #2b2d31 0%, #1e1f22 100%)' }}>
                                            <div className="widget-add-btn">+</div>
                                            <span className="widget-text">Marvel Rivals <span style={{ fontSize: '10px', verticalAlign: 'top' }}>Beta</span></span>
                                        </div>
                                        {/* Widget 2: Favori Oyun */}
                                        <div className="profile-widget-card">
                                            <div className="widget-add-btn">+</div>
                                            <span className="widget-text">Favori oyun</span>
                                        </div>
                                        {/* Widget 3: Sevdiğim oyunlar */}
                                        <div className="profile-widget-card">
                                            <div className="widget-add-btn">+</div>
                                            <span className="widget-text">Sevdiğim oyunlar</span>
                                        </div>
                                        {/* Widget 4: Dönüşümlü oyunlar */}
                                        <div className="profile-widget-card">
                                            <div className="widget-add-btn">+</div>
                                            <span className="widget-text">Dönüşümlü oyunlar</span>
                                        </div>
                                        {/* Widget 5 (Span 2 col?) - Oynamak istiyorum */}
                                        <div className="profile-widget-card" style={{ gridColumn: 'span 2' }}>
                                            <div className="widget-add-btn">+</div>
                                            <span className="widget-text">Oynamak istiyorum</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other Profile Empty State */}
                            {!isOwnProfile && (
                                <div style={{
                                    marginTop: '40px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    padding: '20px'
                                }}>
                                    <h3 style={{ color: '#dbdee1', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                                        {profileUser?.username} adlı kişinin burada paylaşılacak bir etkinliği yok
                                    </h3>
                                    <p style={{ color: '#b5bac1', fontSize: '14px', maxWidth: '300px', margin: '0 0 24px 0' }}>
                                        Bu profil hâlâ geliştirme aşamasında. Selam vermek için bir mesaj gönder!
                                    </p>
                                    <button style={{
                                        backgroundColor: '#3f4147',
                                        color: '#dbdee1',
                                        border: 'none',
                                        padding: '10px 24px',
                                        borderRadius: '4px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                                        Mesaj Gönder
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Edit Profile Modal (Existing Logic) */}
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
                                {/* ... Reusing existing edit modal content structure ... */}
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
