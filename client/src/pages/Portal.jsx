import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useUI } from '../context/UIContext';
import PortalSettingsModal from '../components/PortalSettingsModal';
import PortalNotifications from '../components/PortalNotifications';
import AdUnit from '../components/AdUnit';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import './Portal.css';


const Portal = () => {
    const { id } = useParams();
    const { user, updateUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { isSidebarOpen, closeSidebar } = useUI();

    const [portal, setPortal] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false); // New state for channel content loading
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);

    // Channel State
    const [currentChannel, setCurrentChannel] = useState(null);
    const [messageText, setMessageText] = useState('');

    // UI Toggles
    const [showMembers, setShowMembers] = useState(false); // Default to closed as requested
    const [showLoginWarning, setShowLoginWarning] = useState(false); // Guest warning state

    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const gifInputRef = useRef(null);
    const [mediaFile, setMediaFile] = useState(null);

    // Scroll To Top Logic
    const [showScrollTop, setShowScrollTop] = useState(false);
    const feedRef = useRef(null);

    const handleScroll = (e) => {
        if (e.target.scrollTop > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    const scrollToTop = () => {
        if (feedRef.current) {
            feedRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    const handleChannelSelect = (channelId) => {
        setCurrentChannel(channelId);
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) {
                alert("Dosya boyutu 25MB'dan büyük olamaz.");
                return;
            }
            setMediaFile(file);
            setShowPlusMenu(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !mediaFile) return;

        // Store current data for rollback if needed
        const currentData = { content: messageText, media: mediaFile };

        // 1. Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticPost = {
            _id: tempId,
            content: messageText,
            media: mediaFile ? URL.createObjectURL(mediaFile) : null,
            mediaType: mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : null,
            author: user,
            createdAt: new Date().toISOString(),
            likes: [],
            likeCount: 0,
            isOptimistic: true, // Flag for styling
        };

        // Add to feed immediately
        setPosts([optimisticPost, ...posts]);

        // Clear input immediately
        setMessageText('');
        setMediaFile(null);
        setShowPlusMenu(false);

        try {
            const formData = new FormData();
            formData.append('title', 'Message');
            if (currentData.content) formData.append('content', currentData.content);
            formData.append('portalId', id);
            formData.append('channel', currentChannel);
            formData.append('type', 'text');
            if (currentData.media) formData.append('media', currentData.media);

            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            };

            const res = await axios.post('/api/posts', formData, config);

            // 2. Success: Replace temp post with real data
            setPosts((currentPosts) => currentPosts.map((p) => (p._id === tempId ? res.data : p)));
        } catch (err) {
            console.error('Send message failed', err);
            alert(`Mesaj gönderilemedi: ${err.response?.data?.message || err.message}`);

            // 3. Failure: Remove optimistic post and restore input (optional)
            setPosts((currentPosts) => currentPosts.filter((p) => p._id !== tempId));
            setMessageText(currentData.content);
            setMediaFile(currentData.media);
        }
    };

    // Edit State
    const [editing, setEditing] = useState(false);
    const [settingsTab, setSettingsTab] = useState('overview');
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        privacy: 'public',
    });
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        if (id && !authLoading) {
            fetchPortalData();
        }
    }, [id, authLoading]);

    useEffect(() => {
        if (!authLoading && portal && portal.channels && portal.channels.length > 0) {
            // Check if we need to set a default channel (only if currentChannel is null)
            if (!currentChannel) {
                const defaultChannel = portal.channels.find(c => c.name === 'genel' || c.name === 'general') || portal.channels[0];
                if (defaultChannel) {
                    setCurrentChannel(defaultChannel._id);
                }
            } else {
                // Validate existing currentChannel
                const isValid = portal.channels.some(c => String(c._id) === String(currentChannel));
                if (!isValid) {
                    const defaultChannel = portal.channels.find(c => c.name === 'genel' || c.name === 'general') || portal.channels[0];
                    if (defaultChannel) {
                        setCurrentChannel(defaultChannel._id);
                    }
                }
            }
        }
    }, [portal, authLoading]);

    useEffect(() => {
        if (id && currentChannel) {
            fetchChannelPosts();
        }
    }, [id, currentChannel]);

    useEffect(() => {
        if (portal && user) {
            const memberCheck =
                portal.members?.includes(user._id) ||
                user.joinedPortals?.some((p) => p._id === portal._id || p === portal._id);
            setIsMember(!!memberCheck);
        }
    }, [portal, user]);

    const fetchPortalData = async () => {
        // Only show full page spinner on initial portal load, not channel switches
        if (!portal || portal._id !== id) {
            setLoading(true);
        }

        try {
            const res = await axios.get(`/api/portals/${id}`);
            setPortal(res.data);
            setEditFormData({
                name: res.data.name,
                description: res.data.description || '',
                privacy: res.data.privacy || 'public',
            });
        } catch (err) {
            if (err.response && (err.response.status === 403 || err.response.status === 404)) {
                setError('blocked'); // Treat blocked/not found same for blocked users as per request ("sonuç bulunamadı")
            } else {
                setError('Portal yüklenemedi');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef();

    const lastPostElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchChannelPosts(true);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    // AbortController ref to cancel pending requests
    const abortControllerRef = useRef(null);

    // State management for infinite scroll to avoid stale closures
    const postsRef = useRef(posts);
    const channelRef = useRef(currentChannel);

    useEffect(() => {
        postsRef.current = posts;
    }, [posts]);

    useEffect(() => {
        channelRef.current = currentChannel;
    }, [currentChannel]);

    const fetchChannelPosts = async (isLoadMore = false) => {
        if (!isLoadMore) {
            // Cancel previous request if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            // Create new controller
            abortControllerRef.current = new AbortController();

            setContentLoading(true);
            setPosts([]); // Clear posts immediately
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                signal: abortControllerRef.current?.signal, // Attach signal
                ...(token && { headers: { Authorization: `Bearer ${token}` } })
            };

            // Use refs to get current values inside async function/callbacks
            const currentChannelId = isLoadMore ? channelRef.current : currentChannel;

            // If checking "load more" but channel has changed in mean time, abort
            // (Though we reset on channel change, this is extra safety)
            if (isLoadMore && currentChannelId !== currentChannel) return;

            let url = `/api/portals/${id}/posts?channel=${currentChannelId}&limit=10`;

            if (isLoadMore && postsRef.current.length > 0) {
                const lastPost = postsRef.current[postsRef.current.length - 1];
                url += `&before=${lastPost.createdAt}`;
            }

            const res = await axios.get(url, config);
            const newPosts = res.data;

            if (newPosts.length < 10) {
                setHasMore(false);
            }

            if (isLoadMore) {
                setPosts(prev => [...prev, ...newPosts]);
            } else {
                setPosts(newPosts);
            }

            setError('');
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Request canceled', err.message);
                return;
            }
            console.error('Fetch posts failed', err);
            if (err.response?.status === 403) {
                setError('private');
            } else {
                setError('Gönderiler yüklenemedi');
            }
        } finally {
            if (!isLoadMore) setContentLoading(false);
            setLoadingMore(false);
            setLoading(false);
        }
    };

    // Reset state when ID changes
    useEffect(() => {
        setPosts([]);
        setHasMore(true);
        setCurrentChannel(null); // Reset channel to avoid using old portal's channel
        setPortal(null); // Clear portal data to prevent showing old content
        setError('');
    }, [id]);

    const handleDeletePost = (postId) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
    };

    const handlePin = async (postId) => {
        try {
            const res = await axios.put(`/api/posts/${postId}/pin`);
            const updatedPost = res.data;

            setPosts((prevPosts) => {
                const newPosts = prevPosts.map((p) => (p._id === postId ? updatedPost : p));
                // Re-sort: Pinned first, then Newest
                return newPosts.sort((a, b) => {
                    if (a.isPinned === b.isPinned) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return a.isPinned ? -1 : 1;
                });
            });
        } catch (err) {
            console.error('Pin failed', err);
            alert('Sabitleme işlemi başarısız');
        }
    };

    const handleJoin = async () => {
        if (!user) {
            // navigate('/login'); // Removed redirect
            setShowLoginWarning(true);
            setTimeout(() => setShowLoginWarning(false), 4000); // Wait for full animation (4s)
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const res = await axios.post(`/api/portals/${id}/join`, {}, config);
            if (res.data.status === 'joined') {
                setIsMember(true);
                const updatedUser = {
                    ...user,
                    joinedPortals: [...(user.joinedPortals || []), portal],
                };
                updateUser(updatedUser);
                setPortal((prev) => ({ ...prev, members: [...(prev.members || []), user._id] }));
                // Fetch posts now that we are a member
                fetchChannelPosts();
            } else {
                alert('Üyelik isteğiniz gönderildi!');
                setPortal((prev) => ({ ...prev, isRequested: true }));
            }
        } catch (err) {
            console.error('Join failed', err);
            alert(err.response?.data?.message || 'Katılma başarısız');
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Bu portaldan ayrılmak istediğine emin misin?')) return;
        try {
            await axios.post(`/api/portals/${id}/leave`);
            setIsMember(false);
            const updatedUser = {
                ...user,
                joinedPortals: user.joinedPortals.filter((p) => p._id !== id && p !== id),
            };
            updateUser(updatedUser);
            navigate('/');
        } catch (err) {
            console.error('Leave failed', err);
            alert(err.response?.data?.message || 'Ayrılma başarısız');
        }
    };

    // Safe ID comparison helper
    const isSameId = (id1, id2) => {
        if (!id1 || !id2) return false;
        const s1 = typeof id1 === 'object' ? id1.toString() : id1;
        const s2 = typeof id2 === 'object' ? id2.toString() : id2;
        return s1 === s2;
    };

    const isOwner =
        user && portal && portal.owner && isSameId(portal.owner._id || portal.owner, user._id);
    const isAdmin =
        isOwner ||
        (user &&
            portal &&
            portal.admins &&
            portal.admins.some((a) => isSameId(a._id || a, user._id)));

    // Error State (Blocked/Not Found)
    if (error === 'blocked') {
        return (
            <div className="app-wrapper full-height">
                <Navbar />
                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: 'var(--text-muted)',
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                    <h2>Sonuç Bulunamadı</h2>
                    <p>Aradığınız portala ulaşılamıyor.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-save"
                        style={{ marginTop: '20px', float: 'none' }}
                    >
                        Anasayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    // Loading State
    if (loading || authLoading || !portal) {
        return (
            <div className="app-wrapper full-height">
                <Navbar />
                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-wrapper full-height discord-layout">
            <SEO
                title={portal.name}
                description={portal.description || `${portal.name} topluluğuna katılın.`}
                image={getImageUrl(portal.avatar)}
                type="website"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "Community",
                    "name": portal.name,
                    "description": portal.description,
                    "url": window.location.href,
                    "memberCount": portal.members?.length || 0
                }}
            />
            {/* Global Navbar - Hide when editing settings */}
            {!editing && <Navbar />}
            {/* Guest Login Warning Toast */}
            {showLoginWarning && (
                <div className="guest-warning-toast">Lütfen giriş yapın veya kaydolun!</div>
            )}


            <div className="discord-split-view">
                {user && (
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
                        onChangeChannel={handleChannelSelect}
                        className={isSidebarOpen ? 'mobile-open' : ''}
                    />
                )}

                <main className="discord-main-content">
                    {/* ... Header and Feed as before ... */}
                    <header className="channel-top-bar">
                        <div className="channel-title-wrapper">
                            <span className="hashtag" style={{ color: 'var(--primary-color)' }}>
                                #
                            </span>
                            <h3 className="channel-name" style={{ color: 'var(--primary-color)' }}>
                                {portal?.channels?.find((c) => c._id === currentChannel)?.name || '...'}
                            </h3>
                        </div>

                        <div className="channel-header-actions">
                            {/* Toggle Members Button - Visible only to Members */}
                            {isMember && (
                                <button
                                    className={`icon-btn ${showMembers ? 'active' : ''}`}
                                    onClick={() => setShowMembers(!showMembers)}
                                    title={showMembers ? 'Üyeleri Gizle' : 'Üyeleri Göster'}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: showMembers
                                            ? 'var(--primary-color)'
                                            : 'var(--text-muted)',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="24"
                                        height="24"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </header>
                    {/* ... */}

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Channel Content (Feed) */}
                        <div
                            className="channel-messages-area"
                            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                        >
                            {contentLoading ? (
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: '16px'
                                    }}
                                >
                                    <div className="spinner"></div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>İçerik yükleniyor...</span>
                                </div>
                            ) : (
                                <>
                                    {error === 'private' ? (
                                        <div className="portal-privacy-screen">
                                            <div className="privacy-card">
                                                <div className="privacy-icon">🔒</div>
                                                <img
                                                    src={getImageUrl(portal.avatar)}
                                                    alt=""
                                                    className="privacy-avatar"
                                                />
                                                <h2>{portal.name}</h2>
                                                <p className="privacy-desc">
                                                    {portal.description || 'Bu portal gizlidir.'}
                                                </p>
                                                <p className="privacy-hint">
                                                    İçeriği görmek ve mesajlaşmak için üye olmalısın.
                                                </p>

                                                {portal.isRequested ? (
                                                    <button className="privacy-join-btn requested" disabled>
                                                        İstek Gönderildi
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="privacy-join-btn"
                                                        onClick={handleJoin}
                                                    >
                                                        {portal.privacy === 'private'
                                                            ? 'Üyelik İsteği Gönder'
                                                            : 'Portala Katıl'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Message Input Area */}
                                            {user ? (
                                                isMember ? (
                                                    <div className="channel-input-area">
                                                        {/* Plus Menu Popover */}
                                                        {showPlusMenu && (
                                                            <>
                                                                <div
                                                                    style={{
                                                                        position: 'fixed',
                                                                        inset: 0,
                                                                        zIndex: 90,
                                                                    }}
                                                                    onClick={() => setShowPlusMenu(false)}
                                                                />
                                                                <div className="plus-menu">
                                                                    <div
                                                                        className="plus-menu-item"
                                                                        onClick={() => {
                                                                            fileInputRef.current.click();
                                                                            setShowPlusMenu(false);
                                                                        }}
                                                                    >
                                                                        <div className="plus-menu-icon">
                                                                            <svg
                                                                                width="20"
                                                                                height="20"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                            >
                                                                                <rect
                                                                                    x="3"
                                                                                    y="3"
                                                                                    width="18"
                                                                                    height="18"
                                                                                    rx="2"
                                                                                    ry="2"
                                                                                ></rect>
                                                                                <circle
                                                                                    cx="8.5"
                                                                                    cy="8.5"
                                                                                    r="1.5"
                                                                                ></circle>
                                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                                            </svg>
                                                                        </div>
                                                                        Görsel Yükle
                                                                    </div>
                                                                    <div
                                                                        className="plus-menu-item"
                                                                        onClick={() => {
                                                                            videoInputRef.current.click();
                                                                            setShowPlusMenu(false);
                                                                        }}
                                                                    >
                                                                        <div className="plus-menu-icon">
                                                                            <svg
                                                                                width="20"
                                                                                height="20"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                            >
                                                                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                                                <rect
                                                                                    x="1"
                                                                                    y="5"
                                                                                    width="15"
                                                                                    height="14"
                                                                                    rx="2"
                                                                                    ry="2"
                                                                                ></rect>
                                                                            </svg>
                                                                        </div>
                                                                        Video Yükle
                                                                    </div>
                                                                    <div
                                                                        className="plus-menu-item"
                                                                        onClick={() => {
                                                                            gifInputRef.current.click();
                                                                            setShowPlusMenu(false);
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="plus-menu-icon"
                                                                            style={{
                                                                                fontWeight: 800,
                                                                                fontSize: '10px',
                                                                            }}
                                                                        >
                                                                            GIF
                                                                        </div>
                                                                        GIF Yükle
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileSelect}
                                                            style={{ display: 'none' }}
                                                            accept="image/png, image/jpeg, image/jpg"
                                                        />
                                                        <input
                                                            type="file"
                                                            ref={videoInputRef}
                                                            onChange={handleFileSelect}
                                                            style={{ display: 'none' }}
                                                            accept="video/mp4, video/webm, video/quicktime"
                                                        />
                                                        <input
                                                            type="file"
                                                            ref={gifInputRef}
                                                            onChange={handleFileSelect}
                                                            style={{ display: 'none' }}
                                                            accept="image/gif"
                                                        />

                                                        <div className="message-input-wrapper">
                                                            <button
                                                                className={`input-action-btn upload-btn ${showPlusMenu ? 'active' : ''}`}
                                                                onClick={() =>
                                                                    setShowPlusMenu(!showPlusMenu)
                                                                }
                                                                style={{
                                                                    backgroundColor: '#383a40',
                                                                    borderRadius: '50%',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    marginRight: '12px',
                                                                    color: showPlusMenu
                                                                        ? 'var(--primary-color)'
                                                                        : '#b9bbbe',
                                                                }}
                                                            >
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 24 24"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" />
                                                                </svg>
                                                            </button>

                                                            {mediaFile && (
                                                                <div
                                                                    className="input-media-preview"
                                                                    style={{
                                                                        marginRight: '10px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontSize: '12px',
                                                                            color: 'var(--text-primary)',
                                                                            marginRight: '6px',
                                                                        }}
                                                                    >
                                                                        {mediaFile.type.startsWith('video')
                                                                            ? '🎥'
                                                                            : mediaFile.type.includes('gif')
                                                                                ? '👾'
                                                                                : '🖼️'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setMediaFile(null)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            )}

                                                            <input
                                                                type="text"
                                                                placeholder={`#${portal?.channels?.find(
                                                                    (c) =>
                                                                        c._id === currentChannel
                                                                )?.name || '...'
                                                                    } kanalına mesaj gönder`}
                                                                value={messageText}
                                                                onChange={(e) =>
                                                                    setMessageText(e.target.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleSendMessage();
                                                                    }
                                                                }}
                                                            />
                                                            <div className="input-right-actions">
                                                                <button
                                                                    className="input-action-btn send-btn"
                                                                    onClick={handleSendMessage}
                                                                    disabled={
                                                                        !messageText.trim() && !mediaFile
                                                                    }
                                                                    title="Gönder"
                                                                    style={{
                                                                        color:
                                                                            messageText.trim() || mediaFile
                                                                                ? 'var(--primary-color)'
                                                                                : 'var(--text-tertiary)',
                                                                    }}
                                                                >
                                                                    <svg
                                                                        width="24"
                                                                        height="24"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                    >
                                                                        <line
                                                                            x1="22"
                                                                            y1="2"
                                                                            x2="11"
                                                                            y2="13"
                                                                        ></line>
                                                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            padding: '20px',
                                                            textAlign: 'center',
                                                            color: '#b9bbbe',
                                                            backgroundColor: 'var(--bg-card)',
                                                            borderTop: '1px solid var(--border-subtle)',
                                                        }}
                                                    >
                                                        Bu kanala mesaj göndermek için üye olmalısın.
                                                    </div>
                                                )
                                            ) : null}

                                            <div
                                                className="portal-feed-container discord-feed"
                                                onScroll={handleScroll}
                                                ref={feedRef}
                                            >
                                                {/* Feed Header / Welcome */}
                                                {posts.length === 0 && !loading && (
                                                    <div className="empty-portal">
                                                        <div className="empty-portal-icon">👋</div>
                                                        <h3>
                                                            #
                                                            {portal?.channels?.find(
                                                                (c) => String(c._id) === String(currentChannel)
                                                            )?.name || '...'}{' '}
                                                            kanalına hoş geldin!
                                                        </h3>
                                                        <p>
                                                            Bu kanalda henüz mesaj yok. İlk mesajı sen at!
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Posts List */}
                                                {Array.isArray(posts) && posts.map((post) => (
                                                    <PostCard
                                                        key={post._id}
                                                        post={post}
                                                        onDelete={handleDeletePost}
                                                        onPin={handlePin}
                                                        isAdmin={isAdmin}
                                                    />
                                                ))}

                                                {/* Infinite Scroll Sentinel */}
                                                <div ref={lastPostElementRef} style={{ height: '40px', margin: '10px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {loadingMore && <div className="spinner-small"></div>}
                                                </div>
                                            </div>

                                            {/* Scroll To Top Button - Wide Pill */}
                                            <button
                                                className={`scroll-to-top-btn ${showScrollTop ? 'visible' : ''}`}
                                                onClick={scrollToTop}
                                            >
                                                Başa Dön
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Members Sidebar (Right Column) */}
                        {showMembers && <MembersSidebar members={portal.members} />}
                    </div>

                    {/* New Settings Modal Integration */}
                    {editing && settingsTab !== 'notifications' && (
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

                    {/* Portal Notifications Section */}
                    {editing && settingsTab === 'notifications' && (
                        <div
                            className="portal-notifications-modal"
                            onClick={() => setEditing(false)}
                        >
                            <div
                                className="notifications-modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="close-notifications-btn"
                                    onClick={() => setEditing(false)}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                                <PortalNotifications
                                    portalId={portal._id}
                                    onUpdate={fetchPortalData}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Portal;
