import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useUI } from '../context/UIContext';
import './Portal.css';

const Portal = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { isSidebarOpen } = useUI();

    const [portal, setPortal] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);

    // Channel State
    const [currentChannel, setCurrentChannel] = useState('general');
    const [messageText, setMessageText] = useState('');

    // UI Toggles
    const [showMembers, setShowMembers] = useState(false); // Default to closed as requested

    // Plus Menu State
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Dosya seçildi: ${file.name}\n(Bu özellik yakında aktif olacak!)`);
            setShowPlusMenu(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        try {
            const res = await axios.post('/api/posts', {
                title: 'Message', // Backend expects title
                content: messageText,
                portalId: id,
                type: 'text'
            });

            // Optimistic update or refresh
            setPosts([res.data, ...posts]);
            setMessageText('');
        } catch (err) {
            console.error('Send message failed', err);
            alert('Mesaj gönderilemedi');
        }
    };

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
        <div className="app-wrapper full-height">
            <div className="spinner-container"><div className="spinner"></div></div>
        </div>
    );

    if (error || !portal) return (
        <div className="app-wrapper full-height">
            <div className="error-message">{error || 'Portal bulunamadı'}</div>
        </div>
    );

    return (
        <div className="app-wrapper full-height discord-layout">
            {/* Channel Sidebar */}
            {/* Channel Sidebar */}
            <ChannelSidebar
                portal={portal}
                isMember={isMember}
                onEdit={() => isOwner && setEditing(true)}
                currentChannel={currentChannel}
                onChangeChannel={setCurrentChannel}
                className={isSidebarOpen ? 'mobile-open' : ''}
            />

            {/* Main Content Area */}
            <main className="discord-main-content">

                {/* Channel Header */}
                <header className="channel-top-bar">
                    <div className="channel-title-wrapper">
                        <span className="hashtag">#</span>
                        <h3 className="channel-name">{currentChannel === 'general' ? 'genel' : currentChannel}</h3>
                    </div>

                    {currentChannel === 'general' && (
                        <span className="channel-topic">
                            {portal.description ? `- ${portal.description}` : ''}
                        </span>
                    )}

                    <div className="channel-header-actions">
                        {/* Example Actions */}
                        {/* Header Actions - Discord Style */}
                        <div className="icon-btn" title="Konu Başlıkları">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <div className="icon-btn" title="Bildirimler">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </div>
                        <div className="icon-btn" title="Sabitlenmiş Mesajlar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(45deg)' }}>
                                <path d="M2 12h10" />
                                <path d="M9 4v16" />
                                <path d="m11 10 4-4" />
                                <path d="m11 14 4 4" />
                            </svg>
                        </div>
                        {/* Toggle Members Sidebar */}
                        <div
                            className={`icon-btn ${showMembers ? 'active' : ''}`}
                            title="Üye Listesi"
                            onClick={() => setShowMembers(!showMembers)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>

                        <div className="search-bar-mini">
                            <input type="text" placeholder="Ara" />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Channel Content (Feed) */}
                    <div className="channel-messages-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {currentChannel === 'general' ? (
                            <>
                                <div className="portal-feed-container discord-feed">
                                    {/* Only show create post if member */}
                                    {isMember && (
                                        <div className="create-post-trigger" onClick={() => navigate('/create', { state: { portalId: id } })}>
                                            {/* Create Post trigger (could be styled better, standardizing for now) */}
                                        </div>
                                    )}

                                    {posts.length === 0 ? (
                                        <div className="empty-portal">
                                            <div className="empty-portal-icon">👋</div>
                                            <h3>#genel kanalına hoş geldin!</h3>
                                            <p>Burası {portal.name} sunucusunun başlangıcı.</p>
                                        </div>
                                    ) : (
                                        posts.map((post) => (
                                            <PostCard key={post._id} post={post} />
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#72767d' }}>
                                <h3>#{currentChannel}</h3>
                                <p>Bu kanalda henüz mesaj yok.</p>
                            </div>
                        )}

                        {/* Message Input Area (Fixed at Bottom of middle col) */}
                        {(currentChannel === 'general' || currentChannel.includes('text')) && isMember && (
                            <div className="channel-input-area" style={{ position: 'relative' }}>
                                {/* Plus Menu Popover */}
                                {showPlusMenu && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                            onClick={() => setShowPlusMenu(false)}
                                        />
                                        <div className="plus-menu">
                                            <div className="plus-menu-item" onClick={() => fileInputRef.current.click()}>
                                                <div className="plus-menu-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                </div>
                                                Dosya Yükle
                                            </div>
                                            <div className="plus-menu-item" onClick={() => { alert('GIF seçici yakında!'); setShowPlusMenu(false); }}>
                                                <div className="plus-menu-icon" style={{ fontWeight: 800, fontSize: '12px' }}>GIF</div>
                                                GIF Ara
                                            </div>
                                            <div className="plus-menu-item" onClick={() => { alert('Anket oluşturma yakında!'); setShowPlusMenu(false); }}>
                                                <div className="plus-menu-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4" /></svg>
                                                </div>
                                                Anket Oluştur
                                            </div>
                                        </div>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    multiple
                                />

                                <div className="message-input-wrapper">
                                    <button
                                        className={`input-action-btn upload-btn ${showPlusMenu ? 'active' : ''}`}
                                        onClick={() => setShowPlusMenu(!showPlusMenu)}
                                        style={{
                                            backgroundColor: '#383a40',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            marginRight: '12px',
                                            color: showPlusMenu ? 'var(--primary-color)' : '#b9bbbe'
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder={`#${currentChannel === 'general' ? 'genel' : currentChannel} kanalına mesaj gönder`}
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <div className="input-right-actions">
                                        <button className="input-action-btn">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14.828 14.828a4 4 0 1 0-5.656-5.656 4 4 0 0 0 5.656 5.656zm-8.485 2.829l-2.828 2.828 5.657 5.657 2.828-2.829a8 8 0 1 1-5.657-5.657z"></path>
                                            </svg>
                                        </button>
                                        <button className="input-action-btn">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Members Sidebar (Right Column) */}
                    {showMembers && (
                        <MembersSidebar members={portal.members} />
                    )}
                </div>

                {/* Edit Modal (Preserved) */}
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
            </main>
        </div>
    );
};

export default Portal;
