import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
import Badge from '../components/Badge';
import './Profile.css';

const Profile = () => {
    const { username } = useParams();
    // Force rebuild 3 - Clean File
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
    });
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Follow Modal State
    const [showFollowModal, setShowFollowModal] = useState(null); // 'followers' or 'following'
    const [followList, setFollowList] = useState([]);
    const [loadingFollow, setLoadingFollow] = useState(false);

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

    const fetchMyProfile = async () => {
        try {
            const response = await axios.get('/api/users/me');
            setProfileUser(response.data);
            setFormData({
                displayName: response.data.profile?.displayName || '',
                bio: response.data.profile?.bio || '',
            });
            fetchUserPosts(response.data._id);
        } catch (err) {
            console.error('Failed to fetch my profile:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'comments' && profileUser?._id && userComments.length === 0) {
            fetchUserComments(profileUser._id);
        }
    }, [activeTab, profileUser?._id]);

    const fetchUserProfile = async (username) => {
        try {
            const response = await axios.get(`/api/users/${username}`);
            setProfileUser(response.data);
            fetchUserPosts(response.data._id);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError('Kullanıcı bulunamadı');
        }
    };

    const fetchUserPosts = async (userId) => {
        try {
            const response = await axios.get(`/api/posts/user/${userId}`);
            setUserPosts(response.data.posts);
        } catch (err) {
            console.error('Failed to fetch user posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchUserComments = async (userId) => {
        setLoadingComments(true);
        try {
            const response = await axios.get(`/api/comments/user/${userId}`);
            setUserComments(response.data.comments || []);
        } catch (err) {
            console.error('Failed to fetch user comments:', err);
        } finally {
            setLoadingComments(false);
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
            setProfileUser(updatedUser);
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
            setProfileUser(updatedUser);
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
            setSuccess('Profil güncellendi!');
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Profil güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = (postId) => {
        setUserPosts(userPosts.filter(p => p._id !== postId));
        setProfileUser(prev => ({ ...prev, postCount: prev.postCount - 1 }));
    };

    const handleMessageClick = () => {
        navigate(`/inbox?user=${profileUser.username}`);
    };

    const formatCount = (count) => {
        if (!count) return '0';
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    const mediaPosts = userPosts.filter(post => post.media && post.media.length > 0);

    // Media Viewer State
    const [selectedMedia, setSelectedMedia] = useState(null);

    // Follow Modal Search
    const [searchFollowTerm, setSearchFollowTerm] = useState('');

    const filteredFollowList = followList.filter(user =>
        user.username.toLowerCase().includes(searchFollowTerm.toLowerCase()) ||
        (user.profile?.displayName && user.profile.displayName.toLowerCase().includes(searchFollowTerm.toLowerCase()))
    );

    const handleDownloadMedia = async (mediaUrl, filename) => {
        try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('İndirme başarısız.');
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

    if (!profileUser && !loadingPosts) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="profile-error">
                        <p>Kullanıcı bulunamadı</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="profile-container">

                    {/* Cover Section */}
                    <div className="cover-section">
                        {profileUser?.profile?.coverImage ? (
                            <img
                                src={getImageUrl(profileUser.profile.coverImage)}
                                alt="Cover"
                                className="cover-image"
                            />
                        ) : (
                            <div className="cover-placeholder"></div>
                        )}
                    </div>

                    {/* Profile Header Actions Row (Avatar overlaps) */}
                    <div className="profile-action-bar">
                        <div className="profile-avatar-container">
                            <div className="avatar-wrapper">
                                {profileUser?.profile?.avatar ? (
                                    <img
                                        src={getImageUrl(profileUser.profile.avatar)}
                                        alt={profileUser.username}
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <div className="profile-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        {isOwnProfile ? (
                            <button className="action-btn-pill" onClick={() => setEditing(true)}>
                                Profili düzenle
                            </button>
                        ) : (
                            <>
                                <div className="profile-action-buttons">
                                    <button className="icon-btn-circle" onClick={handleMessageClick} title="Mesaj Gönder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </button>
                                    <FollowButton
                                        userId={profileUser._id}
                                        initialIsFollowing={profileUser.isFollowing}
                                        initialHasRequested={profileUser.hasRequested}
                                        onFollowChange={(isFollowing) => {
                                            setProfileUser(prev => {
                                                const countDiff = isFollowing === prev.isFollowing ? 0 : (isFollowing ? 1 : -1);
                                                return { ...prev, isFollowing, followerCount: prev.followerCount + countDiff };
                                            });
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Profile Details (Name, Bio, Stats) */}
                <div className="profile-details-section">
                    <div className="profile-names">
                        <h1 className="profile-display-name">
                            {profileUser?.profile?.displayName || profileUser?.username}
                            <Badge type={profileUser?.verificationBadge} />
                            {/* Custom "Get Verified" Badge/Button visual */}
                            {isOwnProfile && (!profileUser?.verificationBadge || profileUser?.verificationBadge === 'none') && (
                                <div className="get-verified-badge">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="verified-icon">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    <span>Onaylanmış hesap sahibi ol</span>
                                </div>
                            )}
                        </h1>
                        <p className="profile-username-handle">@{profileUser?.username}</p>
                    </div>

                    {
                        profileUser?.profile?.bio && (
                            <div className="profile-bio-text">
                                {profileUser.profile.bio}
                            </div>
                        )
                    }

                    <div className="profile-meta-row">
                        <span className="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {profileUser?.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : 'Ocak 2021'} tarihinde katıldı
                        </span>
                    </div>

                    {/* Profile Stats Row */}
                    <div className="profile-stats-text-row">
                        <button className="stat-text-btn" onClick={() => !isLocked && openFollowModal('following')} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
                            <span className="stat-bold">{isLocked ? 'Gizli' : formatCount(profileUser?.followingCount || 0)}</span> Takip edilen
                        </button>
                        <button className="stat-text-btn" onClick={() => !isLocked && openFollowModal('followers')} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
                            <span className="stat-bold">{isLocked ? 'Gizli' : formatCount(profileUser?.followerCount)}</span> Takipçi
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        Gönderiler
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Yorumlar
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                        onClick={() => setActiveTab('media')}
                    >
                        Medya
                    </button>
                </div>

                {/* Tab Content */}
                <div className="profile-content">
                    {/* Private Account Locked View */}
                    {isLocked ? (
                        <div className="private-locked-feed-container">
                            <div className="watermark-lock-overlay">
                                <div className="lock-icon-glow">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                                        <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" />
                                    </svg>
                                </div>
                                <h3>Bu Hesap Gizli</h3>
                                <p>Fotoğrafları ve içerikleri görmek için takip et</p>
                            </div>

                            {/* Scrollable Mock Content based on Active Tab */}
                            <div className="blurred-scroll-feed">
                                {activeTab === 'posts' && [1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="mock-post-card">
                                        <div className="post-left">
                                            <div className="avatar-wrapper-small">
                                                {profileUser.profile?.avatar ? (
                                                    <img src={getImageUrl(profileUser.profile.avatar)} alt="avatar" className="mock-avatar" />
                                                ) : (
                                                    <div className="mock-avatar-placeholder">{profileUser.username ? profileUser.username[0].toUpperCase() : '?'}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="post-right">
                                            <div className="post-header-row">
                                                <div className="header-left">
                                                    <span className="author-name">{profileUser.profile?.displayName || profileUser.username}</span>
                                                    <span className="author-username">@{profileUser.username}</span>
                                                    <span className="post-time">· {i}g</span>
                                                </div>
                                            </div>
                                            <div className="mock-content-area">
                                                <div className="blurred-content">
                                                    <p className="mock-text-line" style={{ width: '90%' }}></p>
                                                    <p className="mock-text-line" style={{ width: '60%' }}></p>
                                                    {i % 2 !== 0 && <div className="mock-media-box"></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'comments' && [1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="mock-post-card comment-variant">
                                        <div className="post-left">
                                            <div className="avatar-wrapper-small" style={{ width: '32px', height: '32px' }}>
                                                <div className="mock-avatar-placeholder"></div>
                                            </div>
                                        </div>
                                        <div className="post-right">
                                            <div className="post-header-row">
                                                <div className="header-left">
                                                    <span className="author-name" style={{ width: '100px', height: '14px', background: 'var(--text-tertiary)', borderRadius: '4px', opacity: 0.3 }}></span>
                                                </div>
                                            </div>
                                            <div className="mock-content-area">
                                                <div className="blurred-content">
                                                    <p className="mock-text-line" style={{ width: '100%', marginBottom: 0 }}></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeTab === 'media' && (
                                    <div className="media-grid-container" style={{ padding: '4px' }}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                            <div key={i} className="media-grid-item" style={{ background: 'var(--bg-darker)', borderRadius: '4px' }}>
                                                <div className="mock-media-box" style={{ height: '100%', marginTop: 0, borderRadius: 0 }}></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Normal Content */
                        <>
                            {loadingPosts ? (
                                <div className="spinner-container">
                                    <div className="spinner"></div>
                                </div>
                            ) : activeTab === 'posts' ? (
                                userPosts.length > 0 ? (
                                    <div className="posts-feed">
                                        {userPosts.map(post => (
                                            <PostCard
                                                key={post._id}
                                                post={post}
                                                onDelete={handleDeletePost}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-tab">
                                        <p>Henüz gönderi yok</p>
                                    </div>
                                )
                            ) : activeTab === 'comments' ? (
                                loadingComments ? (
                                    <div className="spinner-container">
                                        <div className="spinner"></div>
                                    </div>
                                ) : userComments.length > 0 ? (
                                    <div className="comments-feed-modern">
                                        {userComments.map(comment => (
                                            <Link
                                                to={`/post/${comment.post?._id}`}
                                                key={comment._id}
                                                className="comment-card"
                                            >
                                                <div className="comment-header">
                                                    <div className="comment-user-info">
                                                        {profileUser.profile?.avatar ? (
                                                            <img src={getImageUrl(profileUser.profile.avatar)} alt="" className="comment-avatar-small" />
                                                        ) : (
                                                            <div className="comment-avatar-placeholder-small">{profileUser.username[0].toUpperCase()}</div>
                                                        )}
                                                        <span className="comment-wroted-text">
                                                            <span className="comment-author-name">{profileUser.profile?.displayName || profileUser.username}</span>
                                                            <span className="comment-action-verb"> yanıtladı</span>
                                                        </span>
                                                        <span className="comment-dot">·</span>
                                                        <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                </div>

                                                <div className="comment-body">
                                                    <p className="comment-text">{comment.content}</p>
                                                </div>

                                                <div className="comment-replying-to">
                                                    <span className="replying-label">Şuna yanıt olarak:</span>
                                                    <p className="original-post-snippet">
                                                        {comment.post?.content?.substring(0, 60) || 'bir gönderi'}...
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-tab">
                                        <p>Henüz yorum yok</p>
                                    </div>
                                )
                            ) : activeTab === 'media' ? (
                                mediaPosts.length > 0 ? (
                                    <div className="media-grid-container">
                                        {mediaPosts.map(post => (
                                            <div key={post._id} className="media-grid-item" onClick={() => setSelectedMedia(post)}>
                                                {post.mediaType === 'video' ? (
                                                    <div className="video-thumbnail-wrapper">
                                                        <video src={getImageUrl(post.media)} className="media-thumbnail" />
                                                        <div className="video-icon-overlay">▶</div>
                                                    </div>
                                                ) : (
                                                    <img src={getImageUrl(post.media)} alt="" className="media-thumbnail" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-tab">
                                        <p>Henüz medya yok</p>
                                    </div>
                                )
                            ) : null}
                        </>
                    )}
                </div>

                {/* Follow/Followers Modal */}
                {
                    showFollowModal && (
                        <div className="edit-modal-overlay" onClick={() => setShowFollowModal(null)}>
                            <div className="edit-modal follow-modal-modern" onClick={e => e.stopPropagation()}>
                                <div className="follow-modal-header">
                                    <h3 className="follow-modal-title">{showFollowModal === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3>
                                    <button className="close-modal-btn" onClick={() => setShowFollowModal(null)}>✕</button>
                                </div>

                                <div className="follow-search-container">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı ara..."
                                        value={searchFollowTerm}
                                        onChange={(e) => setSearchFollowTerm(e.target.value)}
                                        className="follow-search-input"
                                    />
                                </div>

                                <div className="follow-list-content">
                                    {loadingFollow ? (
                                        <div className="spinner-container text-center">
                                            <div className="spinner"></div>
                                        </div>
                                    ) : filteredFollowList.length > 0 ? (
                                        <div className="follow-list-modern">
                                            {filteredFollowList.map(user => (
                                                <Link
                                                    to={`/profile/${user.username}`}
                                                    key={user._id}
                                                    className="follow-item-modern"
                                                    onClick={() => setShowFollowModal(null)}
                                                >
                                                    <div className="follow-avatar-modern">
                                                        {user.profile?.avatar ? (
                                                            <img src={getImageUrl(user.profile.avatar)} alt={user.username} />
                                                        ) : (
                                                            <div className="follow-avatar-placeholder-modern">
                                                                {user.username[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="follow-info-modern">
                                                        <div className="follow-names">
                                                            <span className="follow-display-name">
                                                                {user.profile?.displayName || user.username}
                                                                <Badge type={user.verificationBadge} size={16} />
                                                            </span>
                                                            <span className="follow-username-handle">@{user.username}</span>
                                                        </div>
                                                        {user.profile?.bio && (
                                                            <p className="follow-bio-snippet">{user.profile.bio.substring(0, 50)}{user.profile.bio.length > 50 && '...'}</p>
                                                        )}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-search-state">
                                            <p>Kullanıcı bulunamadı.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Media Viewer Modal */}
                {
                    selectedMedia && (
                        <div className="media-viewer-overlay" onClick={() => setSelectedMedia(null)}>
                            <button className="close-viewer-btn" onClick={() => setSelectedMedia(null)}>✕</button>

                            <div className="media-viewer-content" onClick={e => e.stopPropagation()}>
                                {selectedMedia.mediaType === 'video' ? (
                                    <video controls autoPlay src={getImageUrl(selectedMedia.media)} className="media-viewer-element" />
                                ) : (
                                    <img src={getImageUrl(selectedMedia.media)} alt="" className="media-viewer-element" />
                                )}
                            </div>

                            <div className="media-viewer-actions" onClick={e => e.stopPropagation()}>
                                <button className="viewer-action-btn" onClick={() => {
                                    navigate(`/post/${selectedMedia._id}`);
                                    setSelectedMedia(null);
                                }}>
                                    Gönderiye Git
                                </button>
                                <button className="viewer-action-btn primary" onClick={() => handleDownloadMedia(getImageUrl(selectedMedia.media), `deepace-${selectedMedia._id}.${selectedMedia.mediaType === 'video' ? 'mp4' : 'png'}`)}>
                                    İndir
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Edit Form Modal (Modern Redesign) */}
                {
                    editing && (
                        <div className="edit-modal-overlay" onClick={() => setEditing(false)}>
                            <div className="edit-modal-modern" onClick={e => e.stopPropagation()}>
                                {/* Header */}
                                <div className="edit-modal-header-modern">
                                    <div className="header-left">
                                        <button className="close-btn-modern" onClick={() => setEditing(false)}>✕</button>
                                        <h2 className="header-title-modern">Profili düzenle</h2>
                                    </div>
                                    <button className="save-btn-modern" onClick={handleSubmit} disabled={loading}>
                                        {loading ? '...' : 'Kaydet'}
                                    </button>
                                </div>

                                {/* Content Scrollable Area */}
                                <div className="edit-modal-content-modern">
                                    {/* Cover Image Area */}
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
                                            {profileUser?.profile?.coverImage && (
                                                <button className="image-overlay-btn" onClick={() => {/* Handle remove cover logic if needed */ }} title="Kaldır">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={coverInputRef}
                                            onChange={handleCoverChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </div>

                                    {/* Avatar Area */}
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
                                            </div>
                                            <input
                                                type="file"
                                                ref={avatarInputRef}
                                                onChange={handleAvatarChange}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    {/* Form Fields */}
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
                                                rows="3"
                                            />
                                            <label htmlFor="input-bio" className="floating-label">Kişisel bilgiler</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main>
        </div>
    );
};

export default Profile;
