import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import './Portal.css';

const Portal = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [portal, setPortal] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);

    // Edit State
    const [editing, setEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        privacy: 'public'
    });
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        fetchPortalData();
    }, [id]);

    useEffect(() => {
        if (portal && user) {
            const memberCheck = portal.members?.includes(user._id) ||
                user.joinedPortals?.some(p => p._id === portal._id || p === portal._id);
            setIsMember(!!memberCheck);
        }
    }, [portal, user]);

    const fetchPortalData = async () => {
        setLoading(true);
        try {
            const [portalRes, postsRes] = await Promise.all([
                axios.get(`/api/portals/${id}`),
                axios.get(`/api/portals/${id}/posts`)
            ]);

            setPortal(portalRes.data);
            setPosts(postsRes.data);
            setEditFormData({
                name: portalRes.data.name,
                description: portalRes.data.description || '',
                privacy: portalRes.data.privacy || 'public'
            });
        } catch (err) {
            setError('Portal yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            await axios.post(`/api/portals/${id}/join`);
            setIsMember(true);
            const updatedUser = {
                ...user,
                joinedPortals: [...(user.joinedPortals || []), portal]
            };
            updateUser(updatedUser);
            // Refresh portal members count
            setPortal(prev => ({ ...prev, members: [...(prev.members || []), user._id] }));
        } catch (err) {
            console.error('Join failed', err);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Bu portaldan ayrılmak istediğine emin misin?')) return;
        try {
            await axios.post(`/api/portals/${id}/leave`);
            setIsMember(false);
            const updatedUser = {
                ...user,
                joinedPortals: user.joinedPortals.filter(p => p._id !== id && p !== id)
            };
            updateUser(updatedUser);
            navigate('/');
        } catch (err) {
            console.error('Leave failed', err);
            alert(err.response?.data?.message || 'Ayrılma başarısız');
        }
    };

    const isOwner = user && portal && portal.owner && (
        portal.owner._id === user._id || portal.owner === user._id
    );

    // Edit Handlers
    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setEditLoading(true);
            const res = await axios.post(`/api/portals/${id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPortal(res.data);
        } catch (err) {
            console.error('Avatar upload failed', err);
            alert('Avatar yüklenemedi');
        } finally {
            setEditLoading(false);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('banner', file);

        try {
            setEditLoading(true);
            const res = await axios.post(`/api/portals/${id}/banner`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPortal(res.data);
        } catch (err) {
            console.error('Banner upload failed', err);
            alert('Banner yüklenemedi');
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSubmit = async () => {
        try {
            setEditLoading(true);
            const res = await axios.put(`/api/portals/${id}`, editFormData);
            setPortal(res.data);
            setEditing(false);
        } catch (err) {
            console.error('Update failed', err);
            alert(err.response?.data?.message || 'Güncelleme başarısız');
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return (
        <div className="app-wrapper">
            <Navbar />
            <div className="spinner-container"><div className="spinner"></div></div>
        </div>
    );

    if (error || !portal) return (
        <div className="app-wrapper">
            <Navbar />
            <div className="error-message">{error || 'Portal bulunamadı'}</div>
        </div>
    );

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">

                {/* Portal Header Container */}
                <div className="portal-header-container">
                    {/* Banner Section */}
                    <div className="portal-banner-section">
                        {portal.banner ? (
                            <img src={getImageUrl(portal.banner)} alt="Banner" className="portal-banner-image" />
                        ) : (
                            <div className="portal-banner-placeholder"></div>
                        )}
                    </div>

                    <div className="portal-header-content">
                        <div className="portal-avatar-large">
                            {portal.avatar ? (
                                <img src={getImageUrl(portal.avatar)} alt={portal.name} />
                            ) : (
                                <span>{portal.name.substring(0, 2).toUpperCase()}</span>
                            )}
                        </div>

                        <div className="portal-info">
                            <h1>{portal.name}</h1>
                            <p className="portal-description">{portal.description}</p>
                            <div className="portal-meta">
                                <span>{portal.members?.length || 0} Üye</span>
                                <span>•</span>
                                <span>{portal.privacy === 'public' ? 'Herkese Açık' : 'Gizli'}</span>
                            </div>
                        </div>

                        <div className="portal-actions">
                            {isOwner && (
                                <button className="portal-edit-btn" onClick={() => setEditing(true)}>
                                    Ayarlar
                                </button>
                            )}

                            {isMember ? (
                                <button className="join-btn outline" onClick={handleLeave}>Ayrıl</button>
                            ) : (
                                <button className="join-btn primary" onClick={handleJoin}>Katıl</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="portal-feed-container">
                    {/* Only show create post if member */}
                    {isMember && (
                        <div className="create-post-trigger" onClick={() => navigate('/create', { state: { portalId: id } })}>
                            {/* Create Post trigger (could be styled better, standardizing for now) */}
                        </div>
                    )}

                    {posts.length === 0 ? (
                        <div className="empty-portal">
                            <div className="empty-portal-icon">📝</div>
                            <h3>Henüz gönderi yok</h3>
                            <p>Bu portalda ilk paylaşımı sen yap!</p>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard key={post._id} post={post} />
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                {editing && (
                    <div className="edit-modal-overlay" onClick={() => setEditing(false)}>
                        <div className="edit-modal-modern" onClick={e => e.stopPropagation()}>
                            <div className="edit-modal-header-modern">
                                <div className="header-left">
                                    <button className="close-btn-modern" onClick={() => setEditing(false)}>✕</button>
                                    <h2 className="header-title-modern">Portalı Düzenle</h2>
                                </div>
                                <button className="save-btn-modern" onClick={handleEditSubmit} disabled={editLoading}>
                                    {editLoading ? '...' : 'Kaydet'}
                                </button>
                            </div>

                            <div className="edit-modal-content-modern">
                                {/* Banner Edit */}
                                <div className="edit-cover-container">
                                    {portal.banner ? (
                                        <img src={getImageUrl(portal.banner)} alt="Banner" className="edit-cover-image" />
                                    ) : (
                                        <div className="edit-cover-placeholder"></div>
                                    )}
                                    <div className="image-overlay-actions">
                                        <button className="image-overlay-btn" onClick={() => bannerInputRef.current.click()} title="Banner Ekle">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                <circle cx="12" cy="13" r="4"></circle>
                                            </svg>
                                        </button>
                                        <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} style={{ display: 'none' }} accept="image/*" />
                                    </div>
                                </div>

                                {/* Avatar Edit */}
                                <div className="edit-avatar-container">
                                    <div className="edit-avatar-wrapper">
                                        {portal.avatar ? (
                                            <img src={getImageUrl(portal.avatar)} alt="Avatar" className="edit-avatar-image" />
                                        ) : (
                                            <div className="edit-avatar-placeholder">
                                                {portal.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="avatar-overlay-actions">
                                            <button className="image-overlay-btn" onClick={() => avatarInputRef.current.click()} title="Logo Ekle">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                    <circle cx="12" cy="13" r="4"></circle>
                                                </svg>
                                            </button>
                                            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} accept="image/*" />
                                        </div>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="edit-form-fields">
                                    <div className="floating-label-group">
                                        <label htmlFor="portal-name" className="floating-label">Portal Adı</label>
                                        <input
                                            type="text"
                                            id="portal-name"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditChange}
                                            className="floating-input"
                                        />
                                    </div>

                                    <div className="floating-label-group">
                                        <label htmlFor="portal-desc" className="floating-label">Açıklama</label>
                                        <textarea
                                            id="portal-desc"
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditChange}
                                            className="floating-input floating-textarea"
                                        />
                                    </div>

                                    <div className="floating-label-group">
                                        <label className="floating-label">Gizlilik</label>
                                        <select
                                            name="privacy"
                                            value={editFormData.privacy}
                                            onChange={handleEditChange}
                                            className="floating-input"
                                        >
                                            <option value="public">Herkese Açık</option>
                                            <option value="private">Gizli</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </main>
        </div>
    );
};

export default Portal;
