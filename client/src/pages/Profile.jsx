import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import ImageCropper from '../components/ImageCropper';
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
    const [showMenu, setShowMenu] = useState(false);

    // Cropping State
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperMode, setCropperMode] = useState(null); // 'avatar' or 'cover'

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

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('Dosya boyutu 10MB\'dan küçük olmalıdır.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result);
            setCropperMode('avatar');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCoverSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            setError('Kapak resmi 15MB\'dan küçük olmalıdır.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result);
            setCropperMode('cover');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCropComplete = async (blob) => {
        setCropperImage(null);
        const mode = cropperMode;
        setCropperMode(null);

        if (!blob) return;

        const formDataObj = new FormData();
        const endpoint = mode === 'avatar' ? '/api/users/me/avatar' : '/api/users/me/cover';
        const fieldName = mode === 'avatar' ? 'avatar' : 'cover';

        formDataObj.append(fieldName, blob, `${fieldName}.jpg`);

        try {
            setLoading(true);
            const response = await axios.post(endpoint, formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedUser = { ...currentUser };
            if (mode === 'avatar') {
                updatedUser.profile.avatar = response.data.avatar;
                setProfileUser(prev => ({ ...prev, profile: { ...prev.profile, avatar: response.data.avatar } }));
                setSuccess('Profil fotoğrafı güncellendi!');
            } else {
                updatedUser.profile.coverImage = response.data.coverImage;
                setProfileUser(prev => ({ ...prev, profile: { ...prev.profile, coverImage: response.data.coverImage } }));
                setSuccess('Kapak resmi güncellendi!');
            }
            updateUser(updatedUser);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Resim yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleCropCancel = () => {
        setCropperImage(null);
        setCropperMode(null);
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
        }
    };

    // Helper for button text
    const getFollowButton = () => {
        if (profileUser.isFriend) {
            return (
                <button className="profile-action-btn success icon-only" onClick={handleFollow} title="Arkadaşsınız">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                </button>
            );
        } else if (profileUser.hasRequested) {
            return (
                <button className="profile-action-btn secondary icon-only" onClick={handleFollow} title="İstek Gönderildi">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                </button>
            );
        } else {
            return (
                <button className="profile-action-btn primary" onClick={handleFollow} style={{ backgroundColor: '#248046', color: 'white', padding: '0 16px' }}>
                    Tanış
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
                <div className="profile-card profile-card-horizontal">

                    {/* Banner section */}
                    <div className="profile-banner">
                        {profileUser?.profile?.coverImage ? (
                            <img
                                src={getImageUrl(profileUser.profile.coverImage)}
                                alt="Banner"
                            />
                        ) : (
                            <div className="banner-placeholder" style={{ backgroundColor: profileUser?.profile?.bannerColor || '#1e1f22' }}></div>
                        )}

                        {isOwnProfile && (
                            <button className="edit-banner-btn" onClick={() => coverInputRef.current.click()}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </button>
                        )}
                        <input type="file" ref={coverInputRef} onChange={handleCoverSelect} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    <div className="profile-horizontal-layout">
                        {/* LEFT SECTION: User Info Sidebar */}
                        <aside className="profile-left-column">
                            <div className="profile-avatar-wrapper">
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
                                    {isOwnProfile && (
                                        <button className="edit-avatar-btn" onClick={() => avatarInputRef.current.click()}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} style={{ display: 'none' }} accept="image/*" />
                            </div>

                            {!isOwnProfile && (
                                <div className="profile-header-actions">
                                    <div className="action-row">
                                        {getFollowButton()}
                                        <button className="profile-action-btn primary" onClick={handleMessage} style={{ minWidth: '80px' }}>
                                            Mesaj
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="user-details-info">
                                <div className="user-main-title">
                                    <div className="title-row">
                                        <h1>{profileUser?.profile?.displayName || profileUser?.username}</h1>
                                        <Badge type={profileUser?.verificationBadge} />
                                        {isOwnProfile && (
                                            <button className="profile-edit-trigger-btn" onClick={() => setEditing(true)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                Düzenle
                                            </button>
                                        )}
                                    </div>
                                    <span className="profile-username-tag">@{profileUser?.username}</span>
                                </div>

                                {profileUser?.profile?.bio && (
                                    <div className="profile-bio-text">
                                        {profileUser.profile.bio}
                                    </div>
                                )}

                                <div className="profile-date-text">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    <span>{new Date(profileUser.createdAt || Date.now()).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })} Katıldı</span>
                                </div>

                                {activeTab === 'profile_actions_legacy_removed' && (
                                    /* Legancy Actions were here */
                                    <div />
                                )}
                            </div>
                        </aside>

                        {/* RIGHT SECTION: Content Area */}
                        <section className="profile-right-column">
                            <div className="profile-tabs">
                                <div className={`profile-tab-item ${activeTab === 'memberships' ? 'active' : ''}`} onClick={() => setActiveTab('memberships')}>
                                    Üyelikler
                                </div>
                                <div className={`profile-tab-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                                    Arkadaşlar
                                </div>
                                {isOwnProfile ? (
                                    <div className={`profile-tab-item ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
                                        İstek Listesi
                                    </div>
                                ) : (
                                    <div className={`profile-tab-item ${activeTab === 'mutual_portals' ? 'active' : ''}`} onClick={() => setActiveTab('mutual_portals')}>
                                        Ortak Sunucular
                                    </div>
                                )}
                            </div>

                            <div className="profile-tab-view">
                                {activeTab === 'memberships' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">ÜYE OLUNAN PORTALLAR</h4>
                                        {profileUser.portalsHidden ? (
                                            <div className="locked-portals">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                <p>Bu kullanıcının üyelikleri gizli.</p>
                                            </div>
                                        ) : (
                                            <div className="portals-grid">
                                                {profileUser.portals?.length > 0 ? (
                                                    profileUser.portals.map(p => (
                                                        <div key={p._id} className="portal-item-card" onClick={() => navigate(`/portal/${p._id}`)}>
                                                            <div className="p-avatar">
                                                                {p.avatar ? (
                                                                    <img src={getImageUrl(p.avatar)} alt="" />
                                                                ) : (
                                                                    <div className="p-avatar-placeholder">{p.name?.[0]}</div>
                                                                )}
                                                            </div>
                                                            <span className="p-name">{p.name}</span>
                                                        </div>
                                                    ))
                                                ) : <div className="empty-tab">Henüz bir portala üye olunmamış.</div>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'friends' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">{isOwnProfile ? 'ARKADAŞLAR' : 'ORTAK ARKADAŞLAR'}</h4>
                                        <div className="friends-grid">
                                            {(isOwnProfile ? profileUser.following : profileUser.mutualFriends)?.length > 0 ? (
                                                (isOwnProfile ? profileUser.following : profileUser.mutualFriends).map(friend => (
                                                    <div key={friend._id} className="friend-item-card" onClick={() => navigate(`/profile/${friend.username}`)}>
                                                        <img src={getImageUrl(friend.profile?.avatar)} alt="" />
                                                        <span className="f-name">{friend.username}</span>
                                                    </div>
                                                ))
                                            ) : <div className="empty-tab">Henüz ekli arkadaş yok.</div>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'wishlist' && (
                                    <div className="tab-content fade-in wishlist-split-view">
                                        <div className="wishlist-column">
                                            <h4 className="section-header">PORTAL İSTEKLERİ (ONAY BEKLEYEN)</h4>
                                            <div className="portals-grid compact-grid">
                                                {currentUser?.outgoingPortalRequests?.length > 0 ? (
                                                    currentUser.outgoingPortalRequests.map(p => (
                                                        <div key={p._id} className="portal-item-card pending compact">
                                                            <div className="p-avatar small">
                                                                {p.avatar ? <img src={getImageUrl(p.avatar)} alt="" /> : <div className="p-avatar-placeholder">{p.name?.[0]}</div>}
                                                            </div>
                                                            <span className="p-name">{p.name}</span>
                                                            <div className="p-status-dot" title="Beklemede"></div>
                                                        </div>
                                                    ))
                                                ) : <div className="empty-tab">Bekleyen portal isteği yok.</div>}
                                            </div>
                                        </div>

                                        <div className="wishlist-column">
                                            <h4 className="section-header">TANIŞMA İSTEKLERİ (GÖNDERİLEN)</h4>
                                            <div className="friends-grid compact-grid">
                                                {currentUser?.outgoingUserRequests?.length > 0 ? (
                                                    currentUser.outgoingUserRequests.map(u => (
                                                        <div key={u._id} className="friend-item-card pending compact">
                                                            <img src={getImageUrl(u.profile?.avatar)} alt="" />
                                                            <span className="f-name">{u.username}</span>
                                                            <div className="f-status-dot" title="İstek Gönderildi"></div>
                                                        </div>
                                                    ))
                                                ) : <div className="empty-tab">Bekleyen arkadaş isteği yok.</div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'mutual_portals' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">ORTAK SUNUCULAR</h4>
                                        <div className="portals-grid">
                                            {profileUser.mutualPortals?.length > 0 ? (
                                                profileUser.mutualPortals.map(p => (
                                                    <div key={p._id} className="portal-item-card" onClick={() => navigate(`/portal/${p._id}`)}>
                                                        <div className="p-avatar">
                                                            {p.avatar ? <img src={getImageUrl(p.avatar)} alt="" /> : <div className="p-avatar-placeholder">{p.name?.[0]}</div>}
                                                        </div>
                                                        <span className="p-name">{p.name}</span>
                                                    </div>
                                                ))
                                            ) : <div className="empty-tab">Ortak sunucu bulunamadı.</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {showMenu && (
                        <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
                            {userCard(profileUser)}
                        </div>
                    )}

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

                                <div className="edit-modal-content-modern" style={{ backgroundColor: '#1e1f22' }}>
                                    <div className="edit-form-fields" style={{ padding: '24px' }}>
                                        <div className="floating-label-group">
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                className="floating-input"
                                                placeholder=" "
                                                id="input-name"
                                                style={{ backgroundColor: '#111214', border: '1px solid #1e1f22', color: 'white', padding: '12px', borderRadius: '8px' }}
                                            />
                                            <label htmlFor="input-name" className="floating-label" style={{ top: '-10px', left: '12px', background: '#1e1f22', padding: '0 4px' }}>İsim</label>
                                        </div>

                                        <div className="floating-label-group" style={{ marginTop: '20px' }}>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                className="floating-input floating-textarea"
                                                placeholder=" "
                                                id="input-bio"
                                                style={{ backgroundColor: '#111214', border: '1px solid #1e1f22', color: 'white', padding: '12px', borderRadius: '8px', minHeight: '100px' }}
                                            />
                                            <label htmlFor="input-bio" className="floating-label" style={{ top: '-10px', left: '12px', background: '#1e1f22', padding: '0 4px' }}>Biyografi</label>
                                        </div>

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#b5bac1', marginBottom: '8px', fontWeight: 'bold' }}>PORTAL GÖRÜNÜRLÜĞÜ</label>
                                            <select
                                                name="portalVisibility"
                                                value={formData.portalVisibility}
                                                onChange={handleChange}
                                                style={{ width: '100%', padding: '12px', backgroundColor: '#111214', border: '1px solid #1e1f22', color: 'white', borderRadius: '8px', outline: 'none' }}
                                            >
                                                <option value="public">Herkese Açık</option>
                                                <option value="friends">Sadece Arkadaşlar</option>
                                                <option value="private">Gizli</option>
                                            </select>
                                        </div>

                                        {error && <div className="error-message" style={{ color: '#ff4444', marginTop: '12px' }}>{error}</div>}
                                        {success && <div className="success-message" style={{ color: '#00c851', marginTop: '12px' }}>{success}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Image Cropper Modal */}
            {cropperImage && (
                <ImageCropper
                    image={cropperImage}
                    mode={cropperMode}
                    onComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    title={cropperMode === 'avatar' ? 'Profil Fotoğrafı' : 'Kapak Resmi'}
                />
            )}
        </div>
    );
};

export default Profile;
