import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useUI } from '../context/UIContext';
import PortalSettingsModal from '../components/PortalSettingsModal';
import Navbar from '../components/Navbar';
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
                channel: currentChannel,
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
    const [settingsTab, setSettingsTab] = useState('overview');
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
        if (id) {
            fetchChannelPosts();
        }
    }, [id, currentChannel]);

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
            const res = await axios.get(`/api/portals/${id}`);
            setPortal(res.data);
            setEditFormData({
                name: res.data.name,
                description: res.data.description || '',
                privacy: res.data.privacy || 'public'
            });
            // Initial post fetch will trigger by useEffect depending on default channel
        } catch (err) {
            setError('Portal yüklenemedi');
            console.error(err);
            setLoading(false);
        }
    };

    const fetchChannelPosts = async () => {
        try {
            // If currentChannel is a name (like 'general') or ID. 
            // Our backend handles 'general' or ID.
            // But wait, sidebar uses names for display? 
            // Sidebar uses: { id: ch._id || ch.name, ... }
            // If it uses ID, we send ID. If it uses 'general', we send 'general'.
            const res = await axios.get(`/api/portals/${id}/posts?channel=${currentChannel}`);
            setPosts(res.data);
        } catch (err) {
            console.error('Fetch posts failed', err);
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


    // Owner Check

    const isOwner = user && portal && portal.owner && (
        portal.owner._id === user._id || portal.owner === user._id
    );

    const isAdmin = isOwner || (user && portal && portal.admins && portal.admins.some(a => (a._id || a) === user._id));

    // ... (Edit handlers can be removed/simplified as they move to modal, but keep key state like setPortal)

    // ...

    // ...

    // Loading State
    if (loading || !portal) {
        return (
            <div className="app-wrapper full-height">
                <Navbar />
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-wrapper full-height discord-layout">
            {/* Global Navbar */}
            <Navbar />

            <div className="discord-split-view">
                <ChannelSidebar
                    portal={portal}
                    isMember={isMember}
                    canManage={isOwner || isAdmin}
                    onEdit={(tab) => {
                        const targetTab = typeof tab === 'string' ? tab : 'overview';
                        setSettingsTab(targetTab);
                        setEditing(true);
                    }}
                    currentChannel={currentChannel}
                    onChangeChannel={setCurrentChannel}
                    className={isSidebarOpen ? 'mobile-open' : ''}
                />

                <main className="discord-main-content">
                    {/* ... Header and Feed as before ... */}
                    <header className="channel-top-bar">
                        <div className="channel-title-wrapper">
                            <span className="hashtag">#</span>
                            <h3 className="channel-name">{currentChannel === 'general' ? 'genel' : currentChannel}</h3>
                        </div>
                        {/* ... */}
                    </header>
                    {/* ... */}

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Channel Content (Feed) */}
                        <div className="channel-messages-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="portal-feed-container discord-feed">
                                {/* Feed Header / Welcome */}
                                {posts.length === 0 && !loading && (
                                    <div className="empty-portal">
                                        <div className="empty-portal-icon">👋</div>
                                        <h3>#{currentChannel === 'general' ? 'genel' : currentChannel} kanalına hoş geldin!</h3>
                                        <p>
                                            {currentChannel === 'general'
                                                ? `Burası ${portal.name} sunucusunun başlangıcı.`
                                                : 'Bu kanalda henüz mesaj yok. İlk mesajı sen at!'}
                                        </p>
                                    </div>
                                )}

                                {/* Posts List */}
                                {posts.map((post) => (
                                    <PostCard key={post._id} post={post} />
                                ))}
                            </div>

                            {/* Message Input Area */}
                            {isMember && (
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
                                                    <div className="plus-menu-icon" style={{ fontWeight: 800, fontSize: '12px' }}>GIF</div>
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

                    {/* New Settings Modal Integration */}
                    {editing && (
                        <PortalSettingsModal
                            portal={portal}
                            currentUser={user}
                            initialTab={settingsTab}
                            onClose={() => setEditing(false)}
                            onUpdate={(updatedPortal) => {
                                setPortal(updatedPortal);
                            }}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default Portal;
