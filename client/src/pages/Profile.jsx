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

                        {/* Right Side Actions */}
                        <div className="profile-actions-top-right">
                            {isOwnProfile ? (
                                <button className="action-btn-pill" onClick={() => setEditing(true)}>
                                    Profili düzenle
                                </button>
                            ) : (
                                <>
                                    <button className="icon-btn-circle" onClick={handleMessageClick} title="Mesaj Gönder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </button>
                                    <FollowButton userId={profileUser._id} initialIsFollowing={profileUser.isFollowing} onFollowChange={(isFollowing) => {
                                        setProfileUser(prev => ({ ...prev, isFollowing, followerCount: prev.followerCount + (isFollowing ? 1 : -1) }));
                                    }} />
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

                        {profileUser?.profile?.bio && (
                            <div className="profile-bio-text">
                                {profileUser.profile.bio}
                            </div>
                        )}

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

                        <div className="profile-stats-text-row">
                            <button className="stat-text-btn" onClick={() => openFollowModal('following')}>
                                <span className="stat-bold">{formatCount(profileUser?.followingCount || 0)}</span> Takip edilen
                            </button>
                            <button className="stat-text-btn" onClick={() => openFollowModal('followers')}>
                                <span className="stat-bold">{formatCount(profileUser?.followerCount)}</span> Takipçi
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
                                <div className="comments-feed">
                                    {userComments.map(comment => (
                                        <Link
                                            to={`/post/${comment.post?._id}`}
                                            key={comment._id}
                                            className="user-comment-item"
                                        >
                                            <div className="comment-post-preview">
                                                <span className="comment-on-text">Yorum yaptı:</span>
                                                <p className="original-post-text">
                                                    {comment.post?.content?.substring(0, 50) || 'Gönderi'}
                                                </p>
                                            </div>
                                            <div className="comment-content-preview">
                                                <p>{comment.content}</p>
                                            </div>
                                            <span className="comment-date">
                                                {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
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
                                <div className="media-grid">
                                    {mediaPosts.map(post => (
                                        <Link to={`/post/${post._id}`} key={post._id} className="media-item">
                                            <img src={getImageUrl(post.media)} alt="" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-tab">
                                    <p>Henüz medya yok</p>
                                </div>
                            )
                        ) : null}
                    </div>

                    {/* Follow/Followers Modal */}
                    {showFollowModal && (
                        <div className="edit-modal-overlay" onClick={() => setShowFollowModal(null)}>
                            <div className="edit-modal follow-modal" onClick={e => e.stopPropagation()}>
                                <h3 className="edit-modal-title">{showFollowModal === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3>
                                <div className="follow-list-content">
                                    {loadingFollow ? (
                                        <div className="spinner-container text-center">
                                            <div className="spinner"></div>
                                        </div>
                                    ) : followList.length > 0 ? (
                                        <div className="follow-list">
                                            {followList.map(item => {
                                                const user = showFollowModal === 'followers' ? item : item;
                                                return (
                                                    <Link
                                                        to={`/profile/${user.username}`}
                                                        key={user._id}
                                                        className="follow-item"
                                                        onClick={() => setShowFollowModal(null)}
                                                    >
                                                        <div className="follow-avatar">
                                                            {user.profile?.avatar ? (
                                                                <img src={getImageUrl(user.profile.avatar)} alt={user.username} />
                                                            ) : (
                                                                <div className="follow-avatar-placeholder">
                                                                    {user.username[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="follow-info">
                                                            <span className="follow-name">
                                                                {user.profile?.displayName || user.username}
                                                                <Badge type={user.verificationBadge} />
                                                            </span>
                                                            <span className="follow-username">@{user.username}</span>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="empty-text">Henüz kimse yok.</p>
                                    )}
                                </div>
                                <div className="form-actions">
                                    <button className="btn-cancel" onClick={() => setShowFollowModal(null)}>Kapat</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Form Modal */}
                    {editing && (
                        <div className="edit-modal-overlay" onClick={() => setEditing(false)}>
                            <div className="edit-modal" onClick={e => e.stopPropagation()}>
                                <h2 className="edit-modal-title">Profili Düzenle</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="edit-media-section">
                                        <div className="edit-media-item">
                                            <div className="edit-media-preview">
                                                {profileUser?.profile?.avatar ? (
                                                    <img src={getImageUrl(profileUser.profile.avatar)} alt="Avatar" className="edit-avatar-preview" />
                                                ) : (
                                                    <div className="edit-avatar-placeholder">PP</div>
                                                )}
                                            </div>
                                            <button type="button" className="btn-secondary btn-sm" onClick={() => avatarInputRef.current.click()}>
                                                Değiştir
                                            </button>
                                            <input
                                                type="file"
                                                ref={avatarInputRef}
                                                onChange={handleAvatarChange}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                            />
                                        </div>
                                        <div className="edit-media-item">
                                            <div className="edit-banner-preview">
                                                {profileUser?.profile?.coverImage && (
                                                    <img src={getImageUrl(profileUser.profile.coverImage)} alt="Cover" />
                                                )}
                                            </div>
                                            <button type="button" className="btn-secondary btn-sm" onClick={() => coverInputRef.current.click()}>
                                                Kapak Fotoğrafı
                                            </button>
                                            <input
                                                type="file"
                                                ref={coverInputRef}
                                                onChange={handleCoverChange}
                                                style={{ display: 'none' }}
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Görünen İsim</label>
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            placeholder="İsim Soyisim"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Biyografi</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Kendinizden bahsedin"
                                            className="form-input"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>İptal</button>
                                        <button type="submit" className="btn-save" disabled={loading}>
                                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Profile;
