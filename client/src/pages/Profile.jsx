import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
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
            setProfileUser(currentUser);
            if (currentUser) {
                setFormData({
                    displayName: currentUser.profile?.displayName || '',
                    bio: currentUser.profile?.bio || '',
                });
                fetchUserPosts(currentUser._id);
            }
        } else {
            fetchUserProfile(username);
        }
    }, [username, currentUser, isOwnProfile]);

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
        // Update post count locally
        setProfileUser(prev => ({
            ...prev,
            postCount: prev.postCount - 1
        }));
    };

    const handleMessageClick = () => {
        navigate(`/inbox?user=${profileUser.username}`);
    };

    const formatCount = (count) => {
        if (!count) return '0';
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    };

    const mediaPosts = userPosts.filter(post => post.media && post.media.length > 0);

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
                                src={profileUser.profile.coverImage}
                                alt="Cover"
                                className="cover-image"
                            />
                        ) : (
                            <div className="cover-placeholder"></div>
                        )}

                        {/* Avatar - Positioned absolute on cover border */}
                        <div className="profile-avatar-container">
                            <div className="avatar-wrapper">
                                {profileUser?.profile?.avatar ? (
                                    <img
                                        src={profileUser.profile.avatar}
                                        alt={profileUser.username}
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <div className="profile-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Card Info */}
                    <div className="profile-card-info">
                        <div className="profile-header-content">
                            {/* Left Side: Text Info */}
                            <div className="profile-text-info">
                                <h1 className="profile-name">
                                    {profileUser?.profile?.displayName || profileUser?.username}
                                </h1>
                                <p className="profile-username">@{profileUser?.username}</p>
                                {profileUser?.profile?.bio && (
                                    <p className="profile-bio">{profileUser.profile.bio}</p>
                                )}
                            </div>

                            {/* Right Side: Stats & Actions */}
                            <div className="profile-right-side">
                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">{formatCount(profileUser?.postCount)}</span>
                                        <span className="stat-label">Gönderi</span>
                                    </div>
                                    <button className="stat-item clickable" onClick={() => openFollowModal('followers')}>
                                        <span className="stat-value">{formatCount(profileUser?.followerCount)}</span>
                                        <span className="stat-label">Takipçi</span>
                                    </button>
                                    <button className="stat-item clickable" onClick={() => openFollowModal('following')}>
                                        <span className="stat-value">{formatCount(profileUser?.followingCount)}</span>
                                        <span className="stat-label">Takip</span>
                                    </button>
                                </div>

                                <div className="profile-actions-top">
                                    {isOwnProfile ? (
                                        <button
                                            className="action-btn-outline"
                                            onClick={() => setEditing(true)}
                                        >
                                            Profili Düzenle
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="action-btn-outline"
                                                onClick={handleMessageClick}
                                            >
                                                Mesaj
                                            </button>
                                            <FollowButton userId={profileUser?._id} />
                                        </>
                                    )}
                                </div>
                            </div>
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
                                            <img src={post.media} alt="" />
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
                                <div className="modal-header">
                                    <h3>{showFollowModal === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3>
                                    <button className="close-modal-btn" onClick={() => setShowFollowModal(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
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
                                                                <img src={user.profile.avatar} alt={user.username} />
                                                            ) : (
                                                                <div className="follow-avatar-placeholder">
                                                                    {user.username[0].toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="follow-info">
                                                            <span className="follow-name">{user.profile?.displayName || user.username}</span>
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
                                                    <img src={profileUser.profile.avatar} alt="Avatar" className="edit-avatar-preview" />
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
                                                    <img src={profileUser.profile.coverImage} alt="Cover" />
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
                                        <label>Hakkında</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            placeholder="Kendinden bahset..."
                                            rows="3"
                                            className="form-input"
                                        />
                                    </div>
                                    {error && <div className="error-message">{error}</div>}
                                    {success && <div className="success-message">{success}</div>}

                                    <div className="edit-actions">
                                        <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
                                            İptal
                                        </button>
                                        <button type="submit" className="btn-save">
                                            Kaydet
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
