import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useUI } from '../context/UIContext';
const PortalSettingsModal = lazy(() => import('../components/PortalSettingsModal'));
const PortalNotifications = lazy(() => import('../components/PortalNotifications'));
import AdUnit from '../components/AdUnit';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import SEO from '../components/SEO';
import VoiceChannel from '../components/VoiceChannel';
import ConferenceChannel from '../components/ConferenceChannel';
import { useGlobalStore } from '../store/useGlobalStore';
import { useSocket } from '../context/SocketContext';
import './Portal.css';


const Portal = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const urlChannel = searchParams.get('channel');
    const urlPost = searchParams.get('post');
    const { user, updateUser, loading: authLoading } = useAuth();
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const { isSidebarOpen, closeSidebar, isMobileView, mobileChannelOpen, setMobileChannelOpen } = useUI();

    const [portal, setPortal] = useState(null);
    const posts = useGlobalStore((state) => state.posts);
    const setPosts = useGlobalStore((state) => state.setPosts);
    const [loading, setLoading] = useState(true);

    // --- SOCKET ROOM MANAGEMENT ---
    useEffect(() => {
        if (!socket || !connected || !id) return;

        // Join Portal Room
        socket.emit('join_portal', id);
        console.log(`🔌 Joining portal room: ${id}`);

        // Join Channel Room if present
        if (currentChannel) {
            socket.emit('join_channel', currentChannel);
            console.log(`🔌 Joining channel room: ${currentChannel}`);
        }

        return () => {
            // Leave Portal Room
            socket.emit('leave_portal', id);
            
            // Leave Channel Room if was joined
            if (currentChannel) {
                socket.emit('leave_channel', currentChannel);
            }
        };
    }, [socket, connected, id, currentChannel]);
    const [contentLoading, setContentLoading] = useState(false); // New state for channel content loading
    const [error, setError] = useState('');
    const [suspensionInfo, setSuspensionInfo] = useState(null);
    const [countdown, setCountdown] = useState(null); // { days, hours, minutes, seconds }
    const [isMember, setIsMember] = useState(false);

    // Channel State
    const [currentChannel, setCurrentChannel] = useState(null);
    const [hasScrolledToPost, setHasScrolledToPost] = useState(false);
    const [messageText, setMessageText] = useState('');

    // UI Toggles
    const [showMembers, setShowMembers] = useState(false); // Default to closed as requested
    const [showLoginWarning, setShowLoginWarning] = useState(false); // Guest warning state

    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const gifInputRef = useRef(null);
    const [mediaFile, setMediaFile] = useState(null);

    // Helper to extract YouTube ID
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleYoutubeChange = (e) => {
        const url = e.target.value;
        setYoutubeUrl(url);
    };

    const handleAddYoutube = () => {
        const videoId = getYoutubeId(youtubeUrl);
        if (!videoId) {
            alert("Geçersiz YouTube URL'si");
            return;
        }
        // We'll treat it as attached media but string
        setMediaFile({
            name: 'YouTube Video',
            type: 'youtube', // Custom type
            preview: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            url: youtubeUrl
        });
        setShowYoutubeInput(false);
        setYoutubeUrl('');
    };

    // Scroll To Top Logic
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const feedRef = useRef(null);

    const handleScroll = (e) => {
        const el = e.target;
        if (el.scrollTop > 300) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
        // Calculate scroll progress
        const scrollHeight = el.scrollHeight - el.clientHeight;
        const progress = scrollHeight > 0 ? (el.scrollTop / scrollHeight) * 100 : 0;
        setScrollProgress(progress);
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
        setShowScrollTop(false); // Reset scroll button when changing channels
        if (isMobileView) {
            closeSidebar();
            setMobileChannelOpen(true); // Go to fullscreen feed mode
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

        // Check if it's a YouTube "file"
        const isYoutube = mediaFile && mediaFile.type === 'youtube';

        // 1. Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticPost = {
            _id: tempId,
            content: messageText,
            media: isYoutube ? mediaFile.url : (mediaFile ? URL.createObjectURL(mediaFile) : null),
            mediaType: isYoutube ? 'youtube' : (mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : null),
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

            if (isYoutube) {
                // For YouTube, we send URL string and type manually
                formData.append('media', currentData.media.url);
                formData.append('mediaType', 'youtube');
                // We don't send 'file' because it's not a real file
            } else if (currentData.media) {
                formData.append('media', currentData.media);
                formData.append('type', 'text'); // Default type logic might need override or let backend handle
                // Backend logic: if file present, it infers type.
            }

            // Note: The backend logic I saw earlier uses `req.file` to detect file. 
            // If `media` is sent as string, it uses that.

            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    // Content-Type for FormData is automatic, but we might need JSON if no file?
                    // actually axios handles it.
                    'Content-Type': 'multipart/form-data',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            };

            // If sending JSON (YouTube only), we might want to switch to JSON? 
            // The backend accepts FormData fields. 
            // `media` and `mediaType` fields in FormData should work.

            const res = await axios.post('/api/posts', formData, config);

            // 2. Success: Replace temp post with real data
            setPosts((currentPosts) => currentPosts.map((p) => (p._id === tempId ? res.data : p)));
        } catch (err) {
            console.error('Send message failed', err);
            alert(`Mesaj gönderilemedi: ${err.response?.data?.message || err.message}`);
            // console.error(err);

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
                if (urlChannel) {
                    const matchedChannel = portal.channels.find(c => String(c._id) === String(urlChannel));
                    if (matchedChannel) {
                        setCurrentChannel(matchedChannel._id);
                        return;
                    }
                }
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
        // Guard: Don't fetch if we are navigating (portal data mismatches URL id)
        // or if channel is not set yet.
        if (id && currentChannel && portal && isSameId(portal._id, id)) {
            fetchChannelPosts();
        }
    }, [id, currentChannel, portal]);

    // Scroll to specific post when loaded
    useEffect(() => {
        if (urlPost && !hasScrolledToPost && !contentLoading && Array.isArray(posts) && posts.length > 0) {
            const postElement = document.getElementById(`post-${urlPost}`);
            if (postElement) {
                setTimeout(() => {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postElement.classList.add('highlight-post');
                    setTimeout(() => postElement.classList.remove('highlight-post'), 2000);
                    setHasScrolledToPost(true);
                }, 100);
            }
        }
    }, [urlPost, posts, contentLoading, hasScrolledToPost]);

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
            setShowScrollTop(false); // Reset scroll button when changing portals
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
            if (err.response && err.response.status === 403) {
                const data = err.response.data;
                if (data.portalStatus === 'suspended' || data.portalStatus === 'closed') {
                    setSuspensionInfo({
                        portalStatus: data.portalStatus,
                        statusReason: data.statusReason,
                        suspendedUntil: data.suspendedUntil,
                        portalName: data.portalName,
                        portalAvatar: data.portalAvatar
                    });
                    setError('suspended');
                } else {
                    setError('blocked');
                }
            } else if (err.response && err.response.status === 404) {
                setError('blocked');
            } else {
                setError('Portal yüklenemedi');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // AbortController ref to cancel pending requests
    const abortControllerRef = useRef(null);



    // State management for infinite scroll to avoid stale closures
    // Update refs synchronously during render to ensure they are always fresh
    const postsRef = useRef(posts);
    postsRef.current = posts;

    const channelRef = useRef(currentChannel);
    channelRef.current = currentChannel;

    const fetchChannelPosts = useCallback(async (isLoadMore = false) => {
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
            // We MUST use channelRef.current because currentChannel might be stale 
            // (fetchChannelPosts depends only on [id], so it captures the initial currentChannel of the route)
            const currentChannelId = channelRef.current;

            // Safety check: if we are loading more but channel changed, abort silently
            if (isLoadMore && currentChannelId !== channelRef.current) return;

            let url = `/api/portals/${id}/posts?channel=${currentChannelId}&limit=10`;

            const currentPosts = postsRef.current;
            if (isLoadMore && currentPosts.length > 0) {
                const lastPost = currentPosts[currentPosts.length - 1];
                url += `&before=${lastPost.createdAt}`;
            }

            const res = await axios.get(url, config);
            const newPosts = res.data;

            if (newPosts.length < 10) {
                setHasMore(false);
            }

            if (isLoadMore) {
                setPosts(prev => {
                    // Deduplication Logic
                    const existingIds = new Set(prev.map(p => p._id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                    return [...prev, ...uniqueNewPosts];
                });
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
    }, [id]); // Only depend on ID, use refs for others to prevent loops

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
    }, [loadingMore, hasMore, fetchChannelPosts]);

    // Reset state when ID changes
    useEffect(() => {
        setPosts([]);
        setHasMore(true);
        setCurrentChannel(null); // Reset channel to avoid using old portal's channel
        setPortal(null); // Clear portal data to prevent showing old content
        setError('');
        setMobileChannelOpen(false); // Reset mobile feed state
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

    // Countdown Timer for Suspension
    useEffect(() => {
        if (!suspensionInfo?.suspendedUntil) {
            setCountdown(null);
            return;
        }
        const updateCountdown = () => {
            const now = new Date();
            const end = new Date(suspensionInfo.suspendedUntil);
            const diff = end - now;
            if (diff <= 0) {
                setCountdown(null);
                // Auto-refresh when suspension expires
                window.location.reload();
                return;
            }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [suspensionInfo]);

    // Error State — Suspended/Closed Portal
    if (error === 'suspended' && suspensionInfo) {
        const isSuspended = suspensionInfo.portalStatus === 'suspended';
        const unlockDate = suspensionInfo.suspendedUntil
            ? new Date(suspensionInfo.suspendedUntil).toLocaleString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : null;

        return (
            <div className="app-wrapper full-height">
                <Navbar />
                <div className="suspension-screen">
                    <div className="suspension-card">
                        <div className="suspension-icon">
                            {isSuspended ? '⏸️' : '🔒'}
                        </div>
                        <h1 className="suspension-title">
                            {suspensionInfo.portalName || 'Portal'}
                        </h1>
                        <h2 className="suspension-subtitle">
                            {isSuspended
                                ? 'Bu portal geçici olarak askıya alındı'
                                : 'Bu portal kapatılmıştır'}
                        </h2>

                        {suspensionInfo.statusReason && (
                            <div className="suspension-reason">
                                <div className="suspension-reason-label">Sebep</div>
                                <p>{suspensionInfo.statusReason}</p>
                            </div>
                        )}

                        {isSuspended && unlockDate && (
                            <div className="suspension-unlock">
                                <div className="suspension-unlock-label">🔓 Erişim Açılma Tarihi</div>
                                <div className="suspension-unlock-date">{unlockDate}</div>

                                {countdown && (
                                    <div className="suspension-countdown">
                                        <div className="countdown-item">
                                            <span className="countdown-value">{String(countdown.days).padStart(2, '0')}</span>
                                            <span className="countdown-label">Gün</span>
                                        </div>
                                        <div className="countdown-separator">:</div>
                                        <div className="countdown-item">
                                            <span className="countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
                                            <span className="countdown-label">Saat</span>
                                        </div>
                                        <div className="countdown-separator">:</div>
                                        <div className="countdown-item">
                                            <span className="countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
                                            <span className="countdown-label">Dakika</span>
                                        </div>
                                        <div className="countdown-separator">:</div>
                                        <div className="countdown-item">
                                            <span className="countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
                                            <span className="countdown-label">Saniye</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="suspension-policy">
                            <span>📋</span>
                            <p>Askıya alma nedenleri, platformun <strong>Politika ve Koşullar</strong>'ı kapsamında değerlendirilmektedir. Detaylı bilgi için kurallarımızı inceleyebilirsiniz.</p>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="suspension-home-btn"
                        >
                            Anasayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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


            <div className={`discord-split-view ${isMobileView && mobileChannelOpen ? 'mobile-feed-active' : ''}`}>
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
                        className={`${isSidebarOpen ? 'mobile-open' : ''} ${isMobileView && mobileChannelOpen ? 'mobile-hidden' : ''}`}
                    />
                )}

                <main className={`discord-main-content ${isMobileView && !mobileChannelOpen ? 'mobile-content-hidden' : ''}`}>
                    {/* Dual Header: Sub-Header System */}
                    {isMobileView && !mobileChannelOpen && (
                        <SubHeader 
                            title={portal?.name || 'Portal'} 
                            showBack={false}
                        />
                    )}

                    {/* Determine current channel type */}
                    {(() => {
                        const currentChannelObj = portal?.channels?.find((c) => c._id === currentChannel);
                        const channelType = currentChannelObj?.type || 'text';
                        const channelName = currentChannelObj?.name || '...';
                        const isVoiceChannel = channelType === 'voice' || channelType === 'conference';

                        return (
                            <>
                                {/* ... Header and Feed as before ... */}
                                {!isVoiceChannel && (
                                    <header className={`channel-top-bar ${!isMobileView ? 'desktop-only' : ''}`}>
                                        <div className="channel-title-wrapper">
                                            {isMobileView && (
                                                <button 
                                                    className="mobile-back-btn-inline" 
                                                    onClick={() => setMobileChannelOpen(false)}
                                                    style={{ display: 'flex', marginRight: '8px' }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <span className="hashtag" style={{ color: 'var(--primary-color)' }}>
                                                {channelType === 'voice' || channelType === 'conference' ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-color)' }}>
                                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                        <line x1="12" y1="19" x2="12" y2="23" />
                                                    </svg>
                                                ) : '#'}
                                            </span>
                                            <h3 className="channel-name" style={{ color: 'var(--primary-color)' }}>
                                                {channelName}
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
                                )}
                                {/* ... */}

                                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                    {/* Channel Content — Voice/Conference or Text Feed */}
                                    {isVoiceChannel ? (
                                        /* Voice or Conference Channel */
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {isMobileView && (
                                                <header className="channel-top-bar" style={{ flexShrink: 0 }}>
                                                    <div className="channel-title-wrapper">
                                                        <button 
                                                            className="mobile-back-btn-inline" 
                                                            onClick={() => setMobileChannelOpen(false)}
                                                            style={{ display: 'flex', marginRight: '8px' }}
                                                        >
                                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <span className="hashtag" style={{ color: 'var(--primary-color)' }}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-color)' }}>
                                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                                <line x1="12" y1="19" x2="12" y2="23" />
                                                            </svg>
                                                        </span>
                                                        <h3 className="channel-name" style={{ color: 'var(--primary-color)' }}>
                                                            {channelName}
                                                        </h3>
                                                    </div>
                                                </header>
                                            )}
                                            {channelType === 'conference' ? (
                                                <ConferenceChannel
                                                    portalId={id}
                                                    channelId={currentChannel}
                                                    channelName={channelName}
                                                />
                                            ) : (
                                                <VoiceChannel
                                                    portalId={id}
                                                    channelId={currentChannel}
                                                    channelName={channelName}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        /* Text Channel — Original Feed */
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
                                                            {/* Message Area */}
                                                            {user && isMember ? (
                                                                <>
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

                                                                    {/* Scroll To Top Button - Round with progress ring */}
                                                                    {(() => {
                                                                        const radius = 20;
                                                                        const circumference = 2 * Math.PI * radius;
                                                                        const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;
                                                                        return (
                                                                            <button
                                                                                className={`floating-scroll-top portal-scroll-top ${showScrollTop ? 'visible' : ''}`}
                                                                                onClick={scrollToTop}
                                                                                aria-label="Yukarı Çık"
                                                                            >
                                                                                <svg className="progress-ring" width="50" height="50" viewBox="0 0 50 50">
                                                                                    <circle className="progress-ring-track" strokeWidth="3" fill="transparent" r={radius} cx="25" cy="25" />
                                                                                    <circle className="progress-ring-fill" strokeWidth="3" fill="transparent" r={radius} cx="25" cy="25" style={{ strokeDasharray: circumference, strokeDashoffset }} />
                                                                                </svg>
                                                                                <div className="scroll-icon">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <path d="m18 15-6-6-6 6" />
                                                                                    </svg>
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })()}

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
                                                                                    <div
                                                                                        className="plus-menu-item"
                                                                                        onClick={() => {
                                                                                            setShowYoutubeInput(!showYoutubeInput);
                                                                                            setShowPlusMenu(false);
                                                                                        }}
                                                                                    >
                                                                                        <div className="plus-menu-icon">
                                                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                                                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                                                                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        YouTube
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

                                                                        {showYoutubeInput && (
                                                                            <div className="edit-modal-overlay" style={{ zIndex: 9999 }}>
                                                                                <div className="edit-modal-modern" style={{ maxWidth: '400px', height: 'auto', maxHeight: 'none' }}>
                                                                                    <div className="edit-modal-header-modern">
                                                                                        <div className="header-left">
                                                                                            <h3 className="header-title-modern">YouTube Videosu Ekle</h3>
                                                                                        </div>
                                                                                        <button onClick={() => setShowYoutubeInput(false)} className="close-btn-modern">
                                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                            </svg>
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="edit-modal-content-modern" style={{ padding: '20px' }}>
                                                                                        <div className="floating-label-group">
                                                                                            <label className="floating-label">Video Bağlantısı</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                className="floating-input"
                                                                                                placeholder="https://www.youtube.com/watch?v=..."
                                                                                                value={youtubeUrl}
                                                                                                onChange={handleYoutubeChange}
                                                                                                autoFocus
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter') {
                                                                                                        e.preventDefault();
                                                                                                        handleAddYoutube();
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                                                            <button onClick={() => setShowYoutubeInput(false)} className="join-btn outline" style={{ padding: '8px 16px' }}>
                                                                                                İptal
                                                                                            </button>
                                                                                            <button onClick={handleAddYoutube} className="join-btn primary" style={{ padding: '8px 20px' }}>
                                                                                                Ekle
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

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
                                                                                        marginRight: '12px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        backgroundColor: 'var(--bg-secondary)',
                                                                                        borderRadius: '8px',
                                                                                        padding: '4px',
                                                                                        gap: '8px',
                                                                                        border: '1px solid var(--border-subtle)'
                                                                                    }}
                                                                                >
                                                                                    {mediaFile.type === 'youtube' && mediaFile.preview ? (
                                                                                        <img
                                                                                            src={mediaFile.preview}
                                                                                            alt="Video Preview"
                                                                                            style={{
                                                                                                width: '40px',
                                                                                                height: '30px',
                                                                                                objectFit: 'cover',
                                                                                                borderRadius: '4px'
                                                                                            }}
                                                                                        />
                                                                                    ) : (
                                                                                        <span
                                                                                            style={{
                                                                                                fontSize: '20px',
                                                                                                lineHeight: 1,
                                                                                                padding: '4px'
                                                                                            }}
                                                                                        >
                                                                                            {mediaFile.type.startsWith('video')
                                                                                                ? '🎥'
                                                                                                : mediaFile.type.includes('gif')
                                                                                                    ? '👾'
                                                                                                    : '🖼️'}
                                                                                        </span>
                                                                                    )}

                                                                                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100px' }}>
                                                                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                            {mediaFile.name || 'Medya'}
                                                                                        </span>
                                                                                    </div>

                                                                                    <button
                                                                                        onClick={() => setMediaFile(null)}
                                                                                        style={{
                                                                                            background: 'transparent',
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
                                                                </>
                                                            ) : user ? (
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
                                                            ) : null}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Members Sidebar (Right Column) */}
                                {showMembers && <MembersSidebar members={portal.members} onClose={() => setShowMembers(false)} />}
                            </>
                        );
                    })()}
                </main >
            </div>

            {/* New Settings Modal Integration */}
            {editing && settingsTab !== 'notifications' && (
                <Suspense fallback={null}>
                    <PortalSettingsModal
                        portal={portal}
                        currentUser={user}
                        initialTab={settingsTab}
                        onClose={() => setEditing(false)}
                        onUpdate={(updatedPortal) => {
                            setPortal(updatedPortal);
                        }}
                    />
                </Suspense>
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
                        <Suspense fallback={null}>
                            <PortalNotifications
                                portalId={portal._id}
                                onUpdate={fetchPortalData}
                            />
                        </Suspense>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portal;
