import { useState, useEffect, useRef, useCallback } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import Badge from '../components/Badge';
import ImageCropper from '../components/ImageCropper';
import ProfileImageModal from '../components/ProfileImageModal';
import SEO from '../components/SEO';
import { linkifyText, truncateAndLinkifyText } from '../utils/linkify';
import VideoPlayer from '../components/VideoPlayer';
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
        portalVisibility: 'public', // Default
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('posts'); // Default tab - Posts first
    const [showMenu, setShowMenu] = useState(false);

    // Posts State
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsError, setPostsError] = useState('');

    // Profile Compose State
    const [composeText, setComposeText] = useState('');
    const [composeMedia, setComposeMedia] = useState(null);
    const [composeMediaPreview, setComposeMediaPreview] = useState(null);
    const [composeLoading, setComposeLoading] = useState(false);
    const [composeFocused, setComposeFocused] = useState(false);
    const composeMediaInputRef = useRef(null);
    const composeBoxRef = useRef(null);

    // Cropping State
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperMode, setCropperMode] = useState(null); // 'avatar' or 'cover'

    // Image Modal State
    const [showImageModal, setShowImageModal] = useState(false);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        if (isOwnProfile) {
            fetchMyProfile();
            setActiveTab('posts'); // Reset to posts for own profile
        } else {
            fetchUserProfile(username);
            setActiveTab('posts'); // Reset for others
        }
    }, [username, isOwnProfile]);

    // Click outside compose box to close
    useEffect(() => {
        if (!composeFocused) return;
        const handleClickOutside = (e) => {
            if (composeBoxRef.current && !composeBoxRef.current.contains(e.target)) {
                // Only collapse if there's no text or media
                if (!composeText.trim() && !composeMedia) {
                    setComposeFocused(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [composeFocused, composeText, composeMedia]);

    const fetchMyProfile = async () => {
        try {
            const response = await axios.get('/api/users/me');
            setProfileUser(response.data);
            setFormData({
                displayName: response.data.profile?.displayName || '',
                bio: response.data.profile?.bio || '',
                portalVisibility: response.data.settings?.privacy?.portalVisibility || 'public',
            });
        } catch (err) {
            console.error('Failed to fetch my profile:', err);
        }
    };

    // Fetch user posts
    const fetchUserPosts = useCallback(async (userId) => {
        if (!userId) return;
        setPostsLoading(true);
        setPostsError('');
        try {
            const res = await axios.get(`/api/posts/user/${userId}`);
            // Handle both {posts: [...]} and direct array response formats
            const postsData = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
            setUserPosts(postsData);
        } catch (err) {
            console.error('Failed to fetch user posts:', err);
            if (err.response?.status === 404) {
                setPostsError('not_found');
            } else {
                setPostsError('error');
            }
            setUserPosts([]);
        } finally {
            setPostsLoading(false);
        }
    }, []);

    // Fetch posts when profile user is loaded or tab switches to posts
    useEffect(() => {
        if (profileUser?._id && activeTab === 'posts') {
            fetchUserPosts(profileUser._id);
        }
    }, [profileUser?._id, activeTab, fetchUserPosts]);

    // Handle profile compose post
    const handleProfilePost = async () => {
        if (!composeText.trim() && !composeMedia) return;
        setComposeLoading(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('content', composeText);
            if (composeMedia) {
                formDataObj.append('media', composeMedia);
            }
            
            // Standard relative path; Vite proxy will forward to koyeb in dev, 
            // and Vercel will rewrite to koyeb in prod
            const res = await axios.post('/api/posts', formDataObj);
            
            // Prepend optimistically
            setUserPosts(prev => [{
                ...res.data,
                author: {
                    _id: currentUser._id,
                    username: currentUser.username,
                    profile: currentUser.profile,
                    verificationBadge: currentUser.verificationBadge
                },
                isOptimistic: true
            }, ...prev]);
            setComposeText('');
            setComposeMedia(null);
            setComposeMediaPreview(null);
            setComposeFocused(false);
        } catch (err) {
            console.error('Profile post failed:', err);
            setError('Gönderi paylaşılamadı');
        } finally {
            setComposeLoading(false);
        }
    };

    const handleComposeMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 25 * 1024 * 1024) {
            setError("Dosya boyutu 25MB'dan büyük olamaz.");
            return;
        }
        setComposeMedia(file);
        setComposeMediaPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const removeComposeMedia = () => {
        setComposeMedia(null);
        setComposeMediaPreview(null);
        if (composeMediaInputRef.current) {
            composeMediaInputRef.current.value = '';
        }
    };

    // Close compose box on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (composeFocused && composeBoxRef.current && !composeBoxRef.current.contains(e.target)) {
                if (!composeText.trim() && !composeMedia) {
                    setComposeFocused(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [composeFocused, composeText, composeMedia]);

    // Format date helper for posts
    const formatPostDate = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diff = now - postDate;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'şimdi';
        if (minutes < 60) return `${minutes}d`;
        if (hours < 24) return `${hours}s`;
        if (days < 7) return `${days}g`;
        return postDate.toLocaleDateString('tr-TR');
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

    const uploadImage = async (fileOrBlob, mode) => {
        const formDataObj = new FormData();
        const endpoint = mode === 'avatar' ? '/api/users/me/avatar' : '/api/users/me/cover';
        const fieldName = mode === 'avatar' ? 'avatar' : 'cover';

        // Use original name if File (GIF), otherwise default to .jpg for Blobs
        const fileName = fileOrBlob.name || `${fieldName}.jpg`;
        formDataObj.append(fieldName, fileOrBlob, fileName);

        try {
            setLoading(true);
            const response = await axios.post(endpoint, formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Deep copy to ensure React detects the state change
            const updatedUser = {
                ...currentUser,
                profile: { ...currentUser.profile },
            };
            if (mode === 'avatar') {
                updatedUser.profile.avatar = response.data.avatar;
                setProfileUser((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, avatar: response.data.avatar },
                }));
                setSuccess('Profil fotoğrafı güncellendi!');
            } else {
                updatedUser.profile.coverImage = response.data.coverImage;
                setProfileUser((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, coverImage: response.data.coverImage },
                }));
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

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        // Bypass cropper for GIFs to preserve animation
        if (file.type === 'image/gif') {
            uploadImage(file, 'avatar');
            e.target.value = '';
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
            setError("Kapak resmi 15MB'dan küçük olmalıdır.");
            return;
        }

        // Bypass cropper for GIFs to preserve animation
        if (file.type === 'image/gif') {
            uploadImage(file, 'cover');
            e.target.value = '';
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
        const mode = cropperMode;
        setCropperImage(null);
        setCropperMode(null);

        if (!blob) return;
        await uploadImage(blob, mode);
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
                bio: formData.bio,
            });

            // Update settings (for privacy)
            const settingsResponse = await axios.put('/api/users/settings', {
                privacy: { portalVisibility: formData.portalVisibility },
            });

            // Deep copy to ensure React detects the state change
            const updatedUser = {
                ...currentUser,
                profile: { ...(currentUser.profile || {}) },
                settings: {
                    ...(currentUser.settings || {}),
                    privacy: { ...(currentUser.settings?.privacy || {}) },
                },
            };
            updatedUser.profile.displayName = formData.displayName;
            updatedUser.profile.bio = formData.bio;
            updatedUser.settings.privacy.portalVisibility = formData.portalVisibility;

            updateUser(updatedUser);

            // Update local state
            setProfileUser((prev) => ({
                ...prev,
                profile: { ...prev.profile, ...formData },
                settings: settingsResponse.data.settings,
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
            setProfileUser((prev) => ({
                ...prev,
                isFollowing: response.data.isFollowing,
                hasRequested: response.data.hasRequested,
                // If unfollowed, isFriend becomes false
                isFriend: response.data.isFollowing ? prev.isFriend : false,
            }));
        } catch (err) {
            console.error('Follow action failed:', err);
        }
    };

    const handleMessage = () => {
        if (!profileUser || isOwnProfile) return;
        navigate(`/inbox?user=${profileUser.username}`);
    };

    // Helper for button text
    const getFollowButton = () => {
        if (profileUser.isFriend) {
            return (
                <button
                    className="profile-action-btn success icon-only"
                    onClick={handleFollow}
                    title="Arkadaşsınız"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </button>
            );
        } else if (profileUser.hasRequested) {
            return (
                <button
                    className="profile-action-btn secondary icon-only"
                    onClick={handleFollow}
                    title="İstek Gönderildi"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                </button>
            );
        } else {
            return (
                <button
                    className="profile-action-btn primary"
                    onClick={handleFollow}
                    style={{ backgroundColor: '#248046', color: 'white', padding: '0 16px' }}
                >
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
                    <div
                        className="spinner-container"
                        style={{ display: 'flex', justifyContent: 'center', paddingTop: '50px' }}
                    >
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div
            className="app-wrapper full-height"
            style={{ backgroundColor: '#111214', color: '#dbdee1' }}
        >
            {profileUser && (
                <SEO
                    title={`${profileUser.profile?.displayName || profileUser.username} (@${profileUser.username})`}
                    description={profileUser.profile?.bio || `${profileUser.username} kullanıcısının profili.`}
                    image={getImageUrl(profileUser.profile?.avatar)}
                    type="profile"
                    schema={{
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": profileUser.profile?.displayName || profileUser.username,
                        "alternateName": profileUser.username,
                        "description": profileUser.profile?.bio,
                        "image": getImageUrl(profileUser.profile?.avatar),
                        "url": window.location.href
                    }}
                />
            )}
            <Navbar />
            <SubHeader title="Profil" variant="frosted" showBack={true} desktopHidden={true} />
            <main className="app-content profile-page-content">

                {/* Wide Profile Card */}
                <div className="profile-card profile-card-horizontal">
                    <div className="profile-horizontal-layout">
                        {/* LEFT SECTION: Banner + User Info */}
                        <aside className="profile-left-column">
                            {/* Banner INSIDE left column only */}
                            <div className="profile-banner">
                                {profileUser?.profile?.coverImage ? (
                                    <img src={getImageUrl(profileUser.profile.coverImage)} alt="Banner" />
                                ) : (
                                    <div
                                        className="banner-placeholder"
                                        style={{
                                            backgroundColor: profileUser?.profile?.bannerColor || '#1e1f22',
                                        }}
                                    ></div>
                                )}

                                {isOwnProfile && (
                                    <button
                                        className="edit-banner-btn"
                                        onClick={() => coverInputRef.current.click()}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            width="20"
                                            height="20"
                                        >
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    onChange={handleCoverSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                            </div>
                            <div className="profile-avatar-wrapper">
                                <div
                                    className="profile-avatar-container"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setShowImageModal(true)}
                                >
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
                                    {/* Edit button removed from here, now in modal */}
                                </div>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    onChange={handleAvatarSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />

                                <div className="profile-top-right-actions">
                                    {/* Action Buttons: Tanış/Mesaj for other profiles, Düzenle for own */}
                                    {!isOwnProfile && (
                                        <div className="profile-header-actions">
                                            <div className="action-row">
                                                {getFollowButton()}
                                                <button
                                                    className="profile-action-btn primary"
                                                    onClick={handleMessage}
                                                    style={{ minWidth: '80px' }}
                                                >
                                                    Mesaj
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {isOwnProfile && (
                                        <button
                                            className="profile-edit-trigger-btn"
                                            onClick={() => setEditing(true)}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                            >
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Düzenle
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="user-details-info">
                                <div className="user-main-title">
                                    <div className="title-row">
                                        <h1>
                                            {profileUser?.profile?.displayName ||
                                                profileUser?.username}
                                        </h1>
                                        <div className="badge-alignment-container">
                                            <Badge type={profileUser?.verificationBadge} />
                                        </div>
                                    </div>
                                    <span className="profile-username-tag">
                                        @{profileUser?.username}
                                    </span>
                                </div>

                                {profileUser?.profile?.bio && (
                                    <div className="profile-bio-text">
                                        {profileUser.profile.bio}
                                    </div>
                                )}

                                <div className="profile-date-text">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        style={{ marginRight: '6px' }}
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    <span>
                                        {new Date(
                                            profileUser.createdAt || Date.now()
                                        ).toLocaleDateString('tr-TR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}{' '}
                                        Katıldı
                                    </span>
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
                                <div
                                    className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('posts')}
                                >
                                    Gönderiler
                                </div>
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
                                </div>
                                {isOwnProfile ? (
                                    <div
                                        className={`profile-tab-item ${activeTab === 'wishlist' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('wishlist')}
                                    >
                                        İstek Listesi
                                    </div>
                                ) : (
                                    <div
                                        className={`profile-tab-item ${activeTab === 'mutual_portals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('mutual_portals')}
                                    >
                                        Ortak Sunucular
                                    </div>
                                )}
                            </div>

                            <div className="profile-tab-view">
                                {/* POSTS TAB */}
                                {activeTab === 'posts' && (
                                    <div className="tab-content fade-in">
                                        {/* Compose Box — own profile only */}
                                        {isOwnProfile && (
                                            <div
                                                ref={composeBoxRef}
                                                className={`profile-compose-box ${composeFocused ? 'focused' : ''}`}
                                                onClick={() => { if (!composeFocused) setComposeFocused(true); }}
                                            >
                                                <div className="compose-avatar">
                                                    {currentUser?.profile?.avatar ? (
                                                        <img src={getImageUrl(currentUser.profile.avatar)} alt="" />
                                                    ) : (
                                                        <div className="compose-avatar-placeholder">
                                                            {currentUser?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="compose-input-area">
                                                    {!composeFocused ? (
                                                        <div className="compose-placeholder-trigger">
                                                            Ne düşünüyorsun?
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <textarea
                                                                placeholder="Ne düşünüyorsun?"
                                                                value={composeText}
                                                                onChange={(e) => setComposeText(e.target.value)}
                                                                autoFocus
                                                                rows={3}
                                                                className="compose-textarea"
                                                            />
                                                            {composeMediaPreview && (
                                                                <div className="compose-media-preview">
                                                                    {composeMedia?.type?.startsWith('video') ? (
                                                                        <video src={composeMediaPreview} className="compose-preview-video" />
                                                                    ) : (
                                                                        <img src={composeMediaPreview} alt="Preview" />
                                                                    )}
                                                                    <button className="compose-remove-media" onClick={removeComposeMedia} type="button">
                                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="compose-actions">
                                                                <div className="compose-tools">
                                                                    <button type="button" className="compose-tool-btn" onClick={() => composeMediaInputRef.current?.click()} title="Fotoğraf / GIF">
                                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                                                            <polyline points="21 15 16 10 5 21" />
                                                                        </svg>
                                                                    </button>
                                                                    <button type="button" className="compose-tool-btn" onClick={() => {
                                                                        const ta = composeBoxRef.current?.querySelector('.compose-textarea');
                                                                        if (ta) {
                                                                            const start = ta.selectionStart;
                                                                            const end = ta.selectionEnd;
                                                                            const text = composeText;
                                                                            setComposeText(text.substring(0, start) + '😀' + text.substring(end));
                                                                        } else {
                                                                            setComposeText(prev => prev + '😀');
                                                                        }
                                                                    }} title="Emoji">
                                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                                                            <line x1="9" y1="9" x2="9.01" y2="9" />
                                                                            <line x1="15" y1="9" x2="15.01" y2="9" />
                                                                        </svg>
                                                                    </button>
                                                                    <input
                                                                        ref={composeMediaInputRef}
                                                                        type="file"
                                                                        accept="image/*,video/*,.gif"
                                                                        onChange={handleComposeMediaSelect}
                                                                        style={{ display: 'none' }}
                                                                    />
                                                                </div>
                                                                <div className="compose-right-actions">
                                                                    <span className="compose-char-count" style={{ opacity: composeText.length > 200 ? 1 : 0 }}>
                                                                        {composeText.length}/500
                                                                    </span>
                                                                    <button
                                                                        className="compose-submit-btn"
                                                                        onClick={handleProfilePost}
                                                                        disabled={composeLoading || (!composeText.trim() && !composeMedia)}
                                                                    >
                                                                        {composeLoading ? (
                                                                            <div className="compose-spinner" />
                                                                        ) : (
                                                                            <>
                                                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                                                                                    <line x1="22" y1="2" x2="11" y2="13" />
                                                                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                                                </svg>
                                                                                Paylaş
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Posts Feed */}
                                        {postsLoading ? (
                                            <div className="profile-posts-loading">
                                                <div className="spinner" />
                                            </div>
                                        ) : postsError === 'not_found' ? (
                                            <div className="empty-tab">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '12px', opacity: 0.3 }}>
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                                <p>Henüz gönderi yok.</p>
                                            </div>
                                        ) : postsError ? (
                                            <div className="empty-tab">
                                                Gönderiler yüklenemedi.
                                            </div>
                                        ) : userPosts.length === 0 ? (
                                            <div className="empty-tab">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '12px', opacity: 0.3 }}>
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                                <p>Henüz gönderi paylaşılmamış.</p>
                                            </div>
                                        ) : (
                                            <div className="profile-posts-feed">
                                                {userPosts.map((post) => (
                                                    <article key={post._id} className="profile-post-card">
                                                        {/* Portal/Channel Badge */}
                                                        {post.portal && (
                                                            <div
                                                                className="post-portal-badge"
                                                                onClick={() => navigate(`/portal/${post.portal._id || post.portal}`)}
                                                            >
                                                                <div className="badge-portal-avatar">
                                                                    {post.portal.avatar ? (
                                                                        <img src={getImageUrl(post.portal.avatar)} alt="" />
                                                                    ) : (
                                                                        <div className="badge-avatar-placeholder">
                                                                            {(post.portal.name || 'P')?.[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="badge-portal-name">{post.portal.name || 'Portal'}</span>
                                                                {post.channel && (
                                                                    <>
                                                                        <svg className="badge-separator" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <polyline points="9 18 15 12 9 6" />
                                                                        </svg>
                                                                        <span className="badge-channel-name">#{post.channel.name || 'kanal'}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                        {!post.portal && (
                                                            <div className="post-portal-badge personal-badge">
                                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                                    <circle cx="12" cy="7" r="4" />
                                                                </svg>
                                                                <span className="badge-portal-name">Kişisel Paylaşım</span>
                                                            </div>
                                                        )}

                                                        {/* Post Content */}
                                                        <div className="profile-post-body">
                                                            <div className="profile-post-header">
                                                                <Link to={`/profile/${post.author?.username || profileUser?.username}`} className="post-author-link">
                                                                    <span className="post-author-name">
                                                                        {post.author?.profile?.displayName || post.author?.username || profileUser?.profile?.displayName || profileUser?.username}
                                                                    </span>
                                                                    <Badge type={post.author?.verificationBadge || profileUser?.verificationBadge} size={14} />
                                                                    <span className="post-author-username">@{post.author?.username || profileUser?.username}</span>
                                                                </Link>
                                                                <span className="post-time-stamp">· {formatPostDate(post.createdAt)}</span>
                                                                {isOwnProfile && post.portal && (
                                                                    <button
                                                                        className="go-to-post-btn"
                                                                        onClick={() => navigate(`/post/${post._id}`)}
                                                                        title="Gönderiye Git"
                                                                    >
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                            <polyline points="15 3 21 3 21 9"></polyline>
                                                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {post.content && (
                                                                <div className="profile-post-text">
                                                                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                        {post.content.length > 280
                                                                            ? <>{linkifyText(post.content.slice(0, 280))}...
                                                                                <Link to={`/post/${post._id}`} className="read-more-link">devamını gör</Link>
                                                                              </>
                                                                            : linkifyText(post.content)
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Media */}
                                                            {post.media && (
                                                                <div className="profile-post-media">
                                                                    {post.mediaType === 'video' ? (
                                                                        <VideoPlayer src={getImageUrl(post.media)} className="post-video-player" />
                                                                    ) : post.mediaType === 'youtube' ? (
                                                                        <div className="profile-post-youtube">
                                                                            <img
                                                                                src={`https://img.youtube.com/vi/${(() => {
                                                                                    const match = post.media.match(/(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/);
                                                                                    return match ? match[1] : '';
                                                                                })()}/hqdefault.jpg`}
                                                                                alt="YouTube"
                                                                                loading="lazy"
                                                                            />
                                                                            <div className="youtube-play-overlay">
                                                                                <svg viewBox="0 0 68 48" width="48" height="34">
                                                                                    <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red" />
                                                                                    <path d="M45 24L27 14v20" fill="white" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <img
                                                                            src={getImageUrl(post.media)}
                                                                            alt="Post media"
                                                                            loading="lazy"
                                                                            decoding="async"
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Post Stats */}
                                                            <div className="profile-post-stats">
                                                                {post.likeCount > 0 && (
                                                                    <span className="stat-item">
                                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
                                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                                        </svg>
                                                                        {post.likeCount}
                                                                    </span>
                                                                )}
                                                                {post.commentCount > 0 && (
                                                                    <span className="stat-item">
                                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                                        </svg>
                                                                        {post.commentCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'memberships' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">ÜYE OLUNAN PORTALLAR</h4>
                                        {profileUser.portalsHidden ? (
                                            <div className="locked-portals">
                                                <svg
                                                    width="40"
                                                    height="40"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    style={{ marginBottom: '12px', opacity: 0.5 }}
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
                                                <p>Bu kullanıcının üyelikleri gizli.</p>
                                            </div>
                                        ) : (
                                            <div className="portals-grid">
                                                {profileUser.portals?.length > 0 ? (
                                                    profileUser.portals.map((p) => (
                                                        <div
                                                            key={p._id}
                                                            className="portal-item-card"
                                                            onClick={() =>
                                                                navigate(`/portal/${p._id}`)
                                                            }
                                                        >
                                                            <div className="p-avatar">
                                                                {p.avatar ? (
                                                                    <img
                                                                        src={getImageUrl(p.avatar)}
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <div className="p-avatar-placeholder">
                                                                        {p.name?.[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="p-name">
                                                                {p.name}
                                                                <Badge type={p.isVerified ? 'verified' : p.badges?.[0]} size={14} />
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="empty-tab">
                                                        Henüz bir portala üye olunmamış.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'friends' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">
                                            {isOwnProfile ? 'ARKADAŞLAR' : 'ORTAK ARKADAŞLAR'}
                                        </h4>
                                        <div className="friends-grid">
                                            {(isOwnProfile
                                                ? profileUser.following
                                                : profileUser.mutualFriends
                                            )?.length > 0 ? (
                                                (isOwnProfile
                                                    ? profileUser.following
                                                    : profileUser.mutualFriends
                                                ).map((friend) => (
                                                    <div
                                                        key={friend._id}
                                                        className="friend-item-card"
                                                        onClick={() =>
                                                            navigate(`/profile/${friend.username}`)
                                                        }
                                                    >
                                                        <img
                                                            src={getImageUrl(
                                                                friend.profile?.avatar
                                                            )}
                                                            alt=""
                                                        />
                                                        <span className="f-name">
                                                            {friend.username}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-tab">
                                                    Henüz ekli arkadaş yok.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'wishlist' && (
                                    <div className="tab-content fade-in wishlist-split-view">
                                        <div className="wishlist-column">
                                            <h4 className="section-header">
                                                PORTAL İSTEKLERİ (ONAY BEKLEYEN)
                                            </h4>
                                            <div className="portals-grid compact-grid">
                                                {currentUser?.outgoingPortalRequests?.length > 0 ? (
                                                    currentUser.outgoingPortalRequests.map((p) => (
                                                        <div
                                                            key={p._id}
                                                            className="portal-item-card pending compact"
                                                        >
                                                            <div className="p-avatar small">
                                                                {p.avatar ? (
                                                                    <img
                                                                        src={getImageUrl(p.avatar)}
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <div className="p-avatar-placeholder">
                                                                        {p.name?.[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="p-name">{p.name}</span>
                                                            <div
                                                                className="p-status-dot"
                                                                title="Beklemede"
                                                            ></div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="empty-tab">
                                                        Bekleyen portal isteği yok.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="wishlist-column">
                                            <h4 className="section-header">
                                                TANIŞMA İSTEKLERİ (GÖNDERİLEN)
                                            </h4>
                                            <div className="friends-grid compact-grid">
                                                {currentUser?.outgoingUserRequests?.length > 0 ? (
                                                    currentUser.outgoingUserRequests.map((u) => (
                                                        <div
                                                            key={u._id}
                                                            className="friend-item-card pending compact"
                                                        >
                                                            <img
                                                                src={getImageUrl(u.profile?.avatar)}
                                                                alt=""
                                                            />
                                                            <span className="f-name">
                                                                {u.username}
                                                            </span>
                                                            <div
                                                                className="f-status-dot"
                                                                title="İstek Gönderildi"
                                                            ></div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="empty-tab">
                                                        Bekleyen arkadaş isteği yok.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'mutual_portals' && (
                                    <div className="tab-content fade-in">
                                        <h4 className="section-header">ORTAK SUNUCULAR</h4>
                                        <div className="portals-grid">
                                            {profileUser.mutualPortals?.length > 0 ? (
                                                profileUser.mutualPortals.map((p) => (
                                                    <div
                                                        key={p._id}
                                                        className="portal-item-card"
                                                        onClick={() => navigate(`/portal/${p._id}`)}
                                                    >
                                                        <div className="p-avatar">
                                                            {p.avatar ? (
                                                                <img
                                                                    src={getImageUrl(p.avatar)}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div className="p-avatar-placeholder">
                                                                    {p.name?.[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="p-name">{p.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-tab">
                                                    Ortak sunucu bulunamadı.
                                                </div>
                                            )}
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
                            <div className="edit-modal-modern" onClick={(e) => e.stopPropagation()}>
                                <div className="edit-modal-header-modern">
                                    <div className="header-left">
                                        <button
                                            className="close-btn-modern"
                                            onClick={() => setEditing(false)}
                                        >
                                            ✕
                                        </button>
                                        <h2 className="header-title-modern">Profili düzenle</h2>
                                    </div>
                                    <button
                                        className="save-btn-modern"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? '...' : 'Kaydet'}
                                    </button>
                                </div>

                                <div
                                    className="edit-modal-content-modern"
                                    style={{ backgroundColor: '#1e1f22' }}
                                >
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
                                                style={{
                                                    backgroundColor: '#111214',
                                                    border: '1px solid #1e1f22',
                                                    color: 'white',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <label
                                                htmlFor="input-name"
                                                className="floating-label"
                                                style={{
                                                    top: '-10px',
                                                    left: '12px',
                                                    background: '#1e1f22',
                                                    padding: '0 4px',
                                                }}
                                            >
                                                İsim
                                            </label>
                                        </div>

                                        <div
                                            className="floating-label-group"
                                            style={{ marginTop: '20px' }}
                                        >
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                className="floating-input floating-textarea"
                                                placeholder=" "
                                                id="input-bio"
                                                style={{
                                                    backgroundColor: '#111214',
                                                    border: '1px solid #1e1f22',
                                                    color: 'white',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    minHeight: '100px',
                                                }}
                                            />
                                            <label
                                                htmlFor="input-bio"
                                                className="floating-label"
                                                style={{
                                                    top: '-10px',
                                                    left: '12px',
                                                    background: '#1e1f22',
                                                    padding: '0 4px',
                                                }}
                                            >
                                                Biyografi
                                            </label>
                                        </div>

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label
                                                style={{
                                                    display: 'block',
                                                    fontSize: '12px',
                                                    color: '#b5bac1',
                                                    marginBottom: '8px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                PORTAL GÖRÜNÜRLÜĞÜ
                                            </label>
                                            <select
                                                name="portalVisibility"
                                                value={formData.portalVisibility}
                                                onChange={handleChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: '#111214',
                                                    border: '1px solid #1e1f22',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    outline: 'none',
                                                }}
                                            >
                                                <option value="public">Herkese Açık</option>
                                                <option value="friends">Sadece Arkadaşlar</option>
                                                <option value="private">Gizli</option>
                                            </select>
                                        </div>

                                        {error && (
                                            <div
                                                className="error-message"
                                                style={{ color: '#ff4444', marginTop: '12px' }}
                                            >
                                                {error}
                                            </div>
                                        )}
                                        {success && (
                                            <div
                                                className="success-message"
                                                style={{ color: '#00c851', marginTop: '12px' }}
                                            >
                                                {success}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Profile Image View Modal */}
            <ProfileImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageSrc={
                    profileUser?.profile?.avatar ? getImageUrl(profileUser.profile.avatar) : null
                }
                isOwnProfile={isOwnProfile}
                onEdit={() => avatarInputRef.current?.click()}
                username={profileUser?.username}
            />

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
