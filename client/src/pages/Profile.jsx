import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import FollowButton from '../components/FollowButton';
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

    // Follow Modal State
    const [showFollowModal, setShowFollowModal] = useState(null); // 'followers' or 'following'
    const [followList, setFollowList] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);
    // Follow Search
    const [searchFollowTerm, setSearchFollowTerm] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);
    const isLocked = !isOwnProfile && profileUser?.settings?.privacy?.isPrivate && !profileUser.isFollowing;

    useEffect(() => {
        if (isOwnProfile) {
            fetchMyProfile();
        } else {
            fetchUserProfile(username);
        }
    }, [username, isOwnProfile]);

    const handleMessageClick = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        navigate(`/inbox?user=${profileUser.username}`);
    };

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

    const fetchFollowList = async (type) => {
        if (!profileUser?._id) return;
        setLoadingFollow(true);
        try {
            const response = await axios.get(`/api/users/${profileUser._id}/${type}`);
            setFollowList(response.data);
        } catch (err) {
            console.error(`Failed to fetch ${type}:`, err);
        } finally {
            setLoadingFollow(false);
        }
    };

    const openFollowModal = (type) => {
        setShowFollowModal(type);
        setFollowList([]);
        setSearchFollowTerm('');
        fetchFollowList(type);
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

    const formatCount = (count) => {
        if (!count) return '0';
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    const filteredFollowList = followList.filter(user =>
        user && (
            user.username?.toLowerCase().includes(searchFollowTerm.toLowerCase()) ||
            (user.profile?.displayName && user.profile.displayName.toLowerCase().includes(searchFollowTerm.toLowerCase()))
        )
    );

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
            <main className="app-content profile-page-content" style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>

                {/* Wide Profile Card */}
                <div style={{
                    width: '100%',
                    maxWidth: '680px',
                    backgroundColor: '#111214', /* Main dark bg */
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 0 0 1px #1e1f22, 0 8px 32px rgba(0,0,0,0.45)'
                }}>

                    {/* Banner */}
                    <div style={{ height: '210px', backgroundColor: profileUser?.profile?.bannerColor || '#1e1f22', position: 'relative' }}>
                        {profileUser?.profile?.coverImage && (
                            <img
                                src={getImageUrl(profileUser.profile.coverImage)}
                                alt="Banner"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        {/* Status Bubble (Top Right) */}
                        {profileUser?.profile?.bio && (
                            <div style={{
                                position: 'absolute',
                                right: '20px',
                                bottom: '-40px', /* Hang below banner slightly */
                                top: 'auto',
                                maxWidth: '300px',
                                backgroundColor: '#111214',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #1e1f22',
                                color: '#dbdee1',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                zIndex: 10
                            }}>
                                <span role="img" aria-label="thought">💭</span>
                                {profileUser.profile.bio}
                            </div>
                        )}
                    </div>

                    {/* Profile Header (Avatar & Actions) */}
                    <div style={{ padding: '0 24px', position: 'relative', top: '-60px', marginBottom: '-50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '136px',
                            height: '136px',
                            borderRadius: '50%',
                            backgroundColor: '#111214',
                            border: '8px solid #111214',
                            position: 'relative',
                            zIndex: 5
                        }}>
                            {profileUser?.profile?.avatar ? (
                                <img
                                    src={getImageUrl(profileUser.profile.avatar)}
                                    alt={profileUser.username}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', color: 'white' }}>
                                    {profileUser.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                width: '28px',
                                height: '28px',
                                backgroundColor: '#23a559',
                                borderRadius: '50%',
                                border: '4px solid #111214'
                            }} />
                        </div>

                        {/* Actions */}
                        <div style={{ paddingBottom: '16px', display: 'flex', gap: '8px' }}>
                            {isOwnProfile ? (
                                <button className="btn" style={{
                                    backgroundColor: '#4e5058',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }} onClick={() => setEditing(true)}>
                                    Profili Düzenle
                                </button>
                            ) : (
                                <>
                                    <button className="btn" style={{ backgroundColor: '#23a559', color: 'white', padding: '8px 16px', borderRadius: '4px' }}>
                                        Mesaj Gönder
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ padding: '70px 24px 24px 24px', backgroundColor: '#111214' }}>

                        {/* User Info */}
                        <div style={{ marginBottom: '24px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {profileUser?.profile?.displayName || profileUser?.username}
                                <Badge type={profileUser?.verificationBadge} />
                            </h1>
                            <span style={{ fontSize: '16px', color: '#dbdee1' }}>{profileUser?.username}</span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: '#3f4147', margin: '16px 0' }}></div>

                        {/* Info Tabs */}
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '20px' }}>
                            <div style={{ padding: '8px 16px', borderBottom: '2px solid #dbdee1', color: '#dbdee1', fontWeight: '600', cursor: 'pointer' }}>Kullanıcı Bilgisi</div>
                            <div style={{ padding: '8px 16px', color: '#949ba4', cursor: 'pointer' }}>Ortak Sunucular</div>
                            <div style={{ padding: '8px 16px', color: '#949ba4', cursor: 'pointer' }}>Ortak Arkadaşlar</div>
                        </div>

                        {/* About / Note */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#949ba4', textTransform: 'uppercase', marginBottom: '8px' }}>HAKKIMDA</h4>
                            <div style={{ fontSize: '14px', color: '#dbdee1', whiteSpace: 'pre-wrap' }}>
                                {profileUser?.profile?.bio || 'Hakkımda bilgisi yok.'}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#949ba4', textTransform: 'uppercase', marginBottom: '8px' }}>ÜYELİK TARİHİ</h4>
                            <div style={{ fontSize: '14px', color: '#dbdee1' }}>
                                {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : 'Bilinmiyor'}
                            </div>
                        </div>

                        {/* Widgets Area (Placeholder for @img4 widgets) */}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#949ba4', textTransform: 'uppercase', marginBottom: '12px' }}>Profilini Widget'larla Özelleştir</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ backgroundColor: '#1e1f22', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', cursor: 'pointer', border: '1px dashed #4e5058' }}>
                                    <div style={{ width: '32px', height: '32px', backgroundColor: '#4e5058', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>+</div>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#dbdee1' }}>Favori Oyun</span>
                                </div>
                                <div style={{ backgroundColor: '#1e1f22', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', cursor: 'pointer', border: '1px dashed #4e5058' }}>
                                    <div style={{ width: '32px', height: '32px', backgroundColor: '#4e5058', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>+</div>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#dbdee1' }}>Sevdiğim Oyunlar</span>
                                </div>
                            </div>
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
