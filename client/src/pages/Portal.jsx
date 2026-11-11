import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, lazy, Suspense, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Lenis from 'lenis';
import { uploadFile } from '../utils/uploadUtils';
import { useVideoTranscoder } from '../hooks/useVideoTranscoder';
import { useUploadStore } from '../store/useUploadStore';

import PostCard from '../components/PostCard';
import AdPostCard from '../components/AdPostCard';
import ExternalAdHolder from '../components/ExternalAdHolder';
import AdsterraPostCard from '../components/AdsterraPostCard';
import { adsConfig } from '../config/ads';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import TanitimShowcase from '../components/TanitimShowcase';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { preloadImage, preloadUsers } from '../utils/preloadUtils';
import { useUI } from '../context/UIContext';
const PortalSettingsModal = lazy(() => import('../components/PortalSettingsModal'));
const PortalNotifications = lazy(() => import('../components/PortalNotifications'));
import AdUnit from '../components/AdUnit';
import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import SEO from '../components/SEO';
import PortalInfoModal from '../components/PortalInfoModal';
const VoiceChannel = lazy(() => import('../components/VoiceChannel'));
const ConferenceChannel = lazy(() => import('../components/ConferenceChannel'));
import { useGlobalStore } from '../store/useGlobalStore';
import { setActivePortalChannel, dismissPortalChannelNotifications } from '../utils/notificationUtils';
import { useSocket } from '../context/SocketContext';
import { X, Youtube, Search, Users, SendHorizontal, MessageSquare, Image, Camera, Mic, FolderOpen } from 'lucide-react';
import PortalAlertBanner from '../components/PortalAlertBanner';
import CameraCaptureModal from '../components/CameraCaptureModal';
import AudioRecorderPopover from '../components/AudioRecorderPopover';
import FileFolderPickerModal from '../components/FileFolderPickerModal';
import ComposerAttachmentTray from '../components/ComposerAttachmentTray';
import {
    extractYouTubeInfo,
    revokeAttachmentDraft,
    appendAttachmentDrafts,
    createFolderDraftFromPackage,
    buildOptimisticPostMedia,
    prepareAndUploadPostAttachments,
} from '../utils/mediaAttachments';
import './Portal.css';


const Portal = () => {
    const { id } = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const urlChannel = searchParams.get('channel');
    const urlPost = searchParams.get('post');
    const { user, token, updateUser, loading: authLoading } = useAuth();
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const uiContext = useUI();
    const { isSidebarOpen, closeSidebar, isMobileView, mobileChannelOpen, setMobileChannelOpen } = uiContext || {};
    const isDesktopSidebarCollapsed = uiContext?.isDesktopSidebarCollapsed || false;
    const isGhost = typeof window !== 'undefined' && !!localStorage.getItem('admin_backup_token');

    const [portal, setPortal] = useState(() => {
        // 1. Check sessionStorage cache first for complete portal with channels
        try {
            const cached = sessionStorage.getItem(`oxypace_portal_cache_${id}`) || localStorage.getItem(`oxypace_portal_cache_${id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed?.channels) && parsed.channels.length > 0) {
                    return parsed;
                }
            }
        } catch (_) {}

        // 2. Only use location.state.portal if it has channels
        if (location?.state?.portal && (String(location.state.portal._id) === String(id) || String(location.state.portal.id) === String(id))) {
            if (Array.isArray(location.state.portal.channels) && location.state.portal.channels.length > 0) {
                return location.state.portal;
            }
        }
        return null;
    });

    useEffect(() => {
        if (location?.state?.portal && (String(location.state.portal._id) === String(id) || String(location.state.portal.id) === String(id))) {
            setPortal((prev) => {
                // If incoming has channels, safely use it
                if (Array.isArray(location.state.portal.channels) && location.state.portal.channels.length > 0) {
                    return location.state.portal;
                }
                // Never wipe out existing channels if incoming state has no channels
                if (prev && Array.isArray(prev.channels) && prev.channels.length > 0) {
                    return {
                        ...location.state.portal,
                        channels: prev.channels,
                        roles: prev.roles || location.state.portal.roles,
                        members: prev.members || location.state.portal.members,
                    };
                }
                return prev || null;
            });
        }
    }, [id, location.state]);
    const posts = useGlobalStore((state) => state.posts);
    const setPosts = useGlobalStore((state) => state.setPosts);
    const [loading, setLoading] = useState(() => {
        try {
            const cached = sessionStorage.getItem(`oxypace_portal_cache_${id}`) || localStorage.getItem(`oxypace_portal_cache_${id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed?.channels) && parsed.channels.length > 0) {
                    return false;
                }
            }
        } catch (_) {}
        if (location?.state?.portal && (String(location.state.portal._id) === String(id) || String(location.state.portal.id) === String(id))) {
            if (Array.isArray(location.state.portal.channels) && location.state.portal.channels.length > 0) {
                return false;
            }
        }
        return true;
    });

    const [contentLoading, setContentLoading] = useState(false); // New state for channel content loading
    const [error, setError] = useState('');
    const [suspensionInfo, setSuspensionInfo] = useState(null);
    const [countdown, setCountdown] = useState(null); // { days, hours, minutes, seconds }
    const [isMember, setIsMember] = useState(false);

    // Channel State
    const [currentChannel, setCurrentChannel] = useState(null);
    const [channelPostCounts, setChannelPostCounts] = useState({});
    const [hasScrolledToPost, setHasScrolledToPost] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [portalTypingUsers, setPortalTypingUsers] = useState([]); // Array of { userId, username, displayName, avatar }
    const typingTimeoutRef = useRef(null);
    const [isTypingSent, setIsTypingSent] = useState(false);

    // UI Toggles
    const [showMembers, setShowMembers] = useState(false); // Default to closed as requested
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' }); // { show, message, type }
    const [nsfwConfirmed, setNsfwConfirmed] = useState(false); // +18 age gate state

    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const galleryInputRef = useRef(null);
    const [attachmentDrafts, setAttachmentDrafts] = useState([]);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showAudioPopover, setShowAudioPopover] = useState(false);
    const [showFilePickerModal, setShowFilePickerModal] = useState(false);
    const [quotedPost, setQuotedPost] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [uploadLoading, setUploadLoading] = useState(false);
    const detectedYouTube = useMemo(() => extractYouTubeInfo(messageText), [messageText]);

    // Video transcoder hook (WASM, lazy-loaded)
    const { transcodeAndUpload } = useVideoTranscoder();
    const activeUploads = useUploadStore((state) => state.activeUploads);
    const activeUpload = activeUploads[`portal-${id}`];

    useEffect(() => {
        if (activeUpload && activeUpload.status === 'uploading') {
            setPosts((current) =>
                current.map((p) => (p.isOptimistic && (p.mediaType === 'video' || p.mediaType === 'mixed')) ? { ...p, uploadProgress: activeUpload.progress } : p)
            );
        }
    }, [activeUpload?.progress, activeUpload?.status]);

    const [showPortalInfo, setShowPortalInfo] = useState(false);
    const isTanitimPortal = Boolean(portal?.name && /Oxypace Tan[ıi]t[ıi]m/i.test(portal.name));
    const isOxypaceAdmin = Boolean(user && (user.username?.toLowerCase() === 'oxypace' || user.isAdmin));
    const canCreatePostInPortal = isTanitimPortal ? isOxypaceAdmin : (user && isMember);
    const plusMenuRef = useRef(null);
    const plusButtonRef = useRef(null);

    // Toggle handler for the plus button (opens downward)
    const handlePlusToggle = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPlusMenu(prev => {
            if (!prev) {
                if (plusButtonRef.current) {
                    const rect = plusButtonRef.current.getBoundingClientRect();
                    setMenuPosition({
                        top: rect.bottom + 8, // Opens downward
                        left: rect.left,
                    });
                }
            }
            return !prev;
        });
    }, []);

    useEffect(() => {
        if (!showPlusMenu) return;
        let active = true;

        const updatePosition = () => {
            if (plusButtonRef.current) {
                const rect = plusButtonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                });
            }
        };

        const handleClickOutside = (event) => {
            if (!active) return;
            const clickedMenu = event.target.closest('.plus-menu') || event.target.closest('.portal-plus-menu-portal');
            const clickedButton = event.target.closest('.upload-btn');
            if (!clickedMenu && !clickedButton) {
                setShowPlusMenu(false);
            }
        };

        const timer = setTimeout(() => {
            if (active) {
                document.addEventListener('click', handleClickOutside);
                document.addEventListener('touchstart', handleClickOutside);
            }
        }, 0);

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            active = false;
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [showPlusMenu]);

    useEffect(() => {
        return () => {
            setShowPlusMenu(false);
        };
    }, []);

    useEffect(() => {
        setShowPlusMenu(false);
    }, [currentChannel, id]);

    useEffect(() => {
        if (location.state?.quotedPost) {
            setQuotedPost(location.state.quotedPost);
            if (location.state.selectedChannelId) {
                setCurrentChannel(location.state.selectedChannelId);
            }
            if (closeSidebar) closeSidebar();
            if (setMobileChannelOpen) setMobileChannelOpen(true);
            // Clean up state to prevent re-triggering on manual refresh
            navigate(location.pathname + location.search, { replace: true, state: {} });
        }
    }, [location.state, id]);

    // External Share Target ("Farklı uygulamada paylaş") -> Auto-populate selected Portal & Channel composer
    useEffect(() => {
        let isSubscribed = true;

        const applyPendingChannelShare = async () => {
            const pending = window.__oxypacePendingChannelShare;
            if (!pending || !pending.payload) return;
            if (pending.portalId && String(pending.portalId) !== String(id)) return;

            // Consume immediately so it only runs once
            window.__oxypacePendingChannelShare = null;
            const payload = pending.payload;

            if (pending.channelId) {
                setCurrentChannel(pending.channelId);
            }
            if (closeSidebar) closeSidebar();
            if (setMobileChannelOpen) setMobileChannelOpen(true);

            // 1. Shared Text / Link / Subject
            const incomingText = (payload.text || payload.subject || '').trim();
            if (incomingText && isSubscribed) {
                setMessageText((prev) => (prev ? `${prev}\n${incomingText}` : incomingText));
            }

            // 2. Shared Files (Images, Videos, GIFs, PDFs)
            if (Array.isArray(payload.files) && payload.files.length > 0) {
                const convertedFiles = [];
                for (const f of payload.files) {
                    try {
                        let fileBlob = null;
                        if (f.base64) {
                            const byteChars = atob(f.base64);
                            const byteNums = new Array(byteChars.length);
                            for (let i = 0; i < byteChars.length; i++) {
                                byteNums[i] = byteChars.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNums);
                            fileBlob = new Blob([byteArray], { type: f.mimeType || 'application/octet-stream' });
                        } else if (f.path && window.Capacitor) {
                            const fileSrc = window.Capacitor.convertFileSrc(f.path);
                            const res = await fetch(fileSrc);
                            fileBlob = await res.blob();
                        }
                        if (fileBlob) {
                            const newFile = new File([fileBlob], f.name || 'shared_file', {
                                type: f.mimeType || fileBlob.type || 'application/octet-stream'
                            });
                            convertedFiles.push(newFile);
                        }
                    } catch (err) {
                        console.error('Error loading shared file into portal composer:', f?.name, err);
                    }
                }

                if (convertedFiles.length > 0 && isSubscribed) {
                    setAttachmentDrafts((prev) => {
                        const { nextDrafts, warnings } = appendAttachmentDrafts(prev, convertedFiles);
                        if (warnings.length > 0) {
                            triggerToast(warnings[0], 'warning');
                        }
                        return nextDrafts;
                    });
                    setShowPlusMenu(false);
                }
            } else if (incomingText && isSubscribed) {
                // Auto-detected YouTube links in messageText will automatically show in ComposerAttachmentTray
                setShowPlusMenu(false);
            }

            if (location.state?.sharedTrigger) {
                navigate(location.pathname + location.search, { replace: true, state: {} });
            }
        };

        applyPendingChannelShare();

        const handleShareEvent = () => {
            applyPendingChannelShare();
        };
        window.addEventListener('oxypace:apply_shared_to_channel', handleShareEvent);
        return () => {
            isSubscribed = false;
            window.removeEventListener('oxypace:apply_shared_to_channel', handleShareEvent);
        };
    }, [id, location.state?.sharedTrigger]);

    const activeChannelObj = portal?.channels?.find((c) => String(c._id) === String(currentChannel));
    const isImageChannel = activeChannelObj?.type === 'image';
    const isVoiceChannel = activeChannelObj?.type === 'voice' || activeChannelObj?.type === 'conference';
    const isVoiceChannelActive = isVoiceChannel && (!isMobileView || mobileChannelOpen);

    useEffect(() => {
        if (portal?.channels && Array.isArray(portal.channels)) {
            setChannelPostCounts((prev) => {
                const next = { ...prev };
                portal.channels.forEach((ch) => {
                    const idStr = String(ch._id);
                    if (ch.postCount !== undefined) {
                        next[idStr] = ch.postCount;
                    }
                });
                return next;
            });
        }
    }, [portal?.channels]);

    // --- SOCKET ROOM MANAGEMENT ---
    useEffect(() => {
        if (!socket || !connected || !id) return;

        // Join Portal Room
        socket.emit('join_portal', id);
        console.log(`🔌 Joining portal room: ${id}`);

        // Portal odasına katılınca online listesini de tazele — bu sayede portal
        // sayfası açılır açılmaz doğru çevrimiçi sayısı görüntülenir.
        socket.emit('get_online_users');

        // Join Channel Room if present
        if (currentChannel) {
            socket.emit('join_channel', currentChannel);
            console.log(`🔌 Joining channel room: ${currentChannel}`);
        }

        // --- STRICT CONTEXT FILTERING ---
        // We listen here (within the component lifecycle) instead of globally
        // to ensure we only process events meant for THIS specific portal/channel.
        
        const handleNewPost = (newPost) => {
            // BEGİNSE: The "Doorman" check
            const newPostPortalId = newPost.portal?._id || newPost.portal;
            const newPostChannelId = newPost.channel?._id || newPost.channel;
            const isTargetPortal = String(newPostPortalId) === String(id);
            const isOnlyChannel = portal?.channels?.length === 1;
            const isTargetChannel = String(newPostChannelId) === String(currentChannel) || 
                                    (String(newPostChannelId || 'general') === String(currentChannel || 'general')) ||
                                    isOnlyChannel ||
                                    (activeChannelObj && (String(newPostChannelId) === String(activeChannelObj.name) || String(newPostChannelId) === String(activeChannelObj._id)));

            if (isTargetPortal && isTargetChannel) {
                console.log('✅ Realtime Post Accepted for this view');
                const postAuthorId = newPost.author?._id || newPost.author?.id || newPost.author;
                if (String(postAuthorId) !== String(user?._id)) {
                    const chKey = String(currentChannel);
                    setChannelPostCounts((prev) => ({
                        ...prev,
                        [chKey]: (prev[chKey] !== undefined ? prev[chKey] : (activeChannelObj?.postCount || 0)) + 1
                    }));
                }
                setPosts((prev) => {
                    if (prev.some(p => p._id === newPost._id)) return prev;
                    
                    // Stitch deeply populated quotedPost from existing feed or state to avoid 'Yükleniyor...'
                    const qId = newPost.quotedPost && (typeof newPost.quotedPost === 'string' ? newPost.quotedPost : newPost.quotedPost._id);
                    if (qId) {
                        const existingQuoted = prev.find(p => p._id === qId);
                        if (existingQuoted && typeof existingQuoted === 'object' && existingQuoted.author) {
                            newPost.quotedPost = existingQuoted;
                        } else if (quotedPost && qId === quotedPost._id) {
                            newPost.quotedPost = quotedPost;
                        }
                    }
                    
                    return [newPost, ...prev];
                });
            } else {
                console.log('🚫 Realtime Post Rejected: Wrong context', {
                    postPortal: newPostPortalId,
                    currentPortal: id,
                    postChannel: newPostChannelId,
                    currentChannel: currentChannel
                });
            }
        };

        const handleUpdatePost = (updatedPost) => {
            const updatedPortalId = updatedPost.portal?._id || updatedPost.portal;
            const isTargetPortal = !updatedPortalId || String(updatedPortalId) === String(id);
            if (isTargetPortal) {
                setPosts((prev) => prev.map(p => String(p._id) === String(updatedPost._id) ? updatedPost : p));
            }
        };

        const handleRealtimePostDeleted = ({ postId, portalId }) => {
            if (!portalId || String(portalId) === String(id)) {
                if (postId) {
                    setPosts((prev) => prev.filter(p => String(p._id) !== String(postId)));
                }
            }
        };

        const handleUserStatusChange = ({ userId, status, lastActive }) => {
            if (status === 'offline') {
                setPortalTypingUsers((prev) => prev.filter((u) => String(u.userId) !== String(userId)));
            }
            setPortal((prev) => {
                if (!prev) return prev;
                const activeTime = lastActive || new Date();

                // Update owner lastActive if matched
                let updatedOwner = prev.owner;
                if (prev.owner) {
                    const ownerId = prev.owner._id || prev.owner.id || prev.owner;
                    if (String(ownerId) === String(userId) && typeof prev.owner === 'object') {
                        updatedOwner = { ...prev.owner, lastActive: activeTime };
                    }
                }

                // Update admins lastActive if matched
                let updatedAdmins = prev.admins;
                if (Array.isArray(prev.admins)) {
                    updatedAdmins = prev.admins.map(admin => {
                        const adminId = admin._id || admin.id || admin;
                        if (String(adminId) === String(userId) && typeof admin === 'object' && admin !== null) {
                            return { ...admin, lastActive: activeTime };
                        }
                        return admin;
                    });
                }

                // Update members lastActive if matched
                let updatedMembers = prev.members;
                if (Array.isArray(prev.members)) {
                    updatedMembers = prev.members.map((member) => {
                        const memberId = member._id || member.id || member;
                        if (String(memberId) === String(userId) && typeof member === 'object' && member !== null) {
                            return { ...member, lastActive: activeTime };
                        }
                        return member;
                    });
                }

                return { ...prev, owner: updatedOwner, admins: updatedAdmins, members: updatedMembers };
            });
        };

        const handlePortalTypingUpdate = ({ userId, username, displayName, avatar, isTyping }) => {
            if (String(userId) === String(user?._id)) return;
            setPortalTypingUsers((prev) => {
                if (isTyping) {
                    if (prev.some((u) => String(u.userId) === String(userId))) return prev;
                    return [...prev, { userId, username, displayName, avatar }];
                } else {
                    return prev.filter((u) => String(u.userId) !== String(userId));
                }
            });
        };

        socket.on('post:created', handleNewPost);
        socket.on('post:updated', handleUpdatePost);
        socket.on('post:deleted', handleRealtimePostDeleted);
        socket.on('user_status_change', handleUserStatusChange);
        socket.on('portal_typing_update', handlePortalTypingUpdate);

        return () => {
            socket.off('post:created', handleNewPost);
            socket.off('post:updated', handleUpdatePost);
            socket.off('post:deleted', handleRealtimePostDeleted);
            socket.off('user_status_change', handleUserStatusChange);
            socket.off('portal_typing_update', handlePortalTypingUpdate);
        };
    }, [socket, connected, id, currentChannel, user?._id]);




    // Scroll To Top Logic - 100% High FPS Smooth Animation
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const feedRef = useRef(null);
    const scrollRafRef = useRef(null);
    const animationFrameRef = useRef(null);

    const handleScroll = useCallback((e) => {
        const el = e.target;
        if (scrollRafRef.current) return;

        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            const scrollTop = el.scrollTop;
            const shouldShow = scrollTop > 300;
            setShowScrollTop(prev => prev !== shouldShow ? shouldShow : prev);

            const scrollHeight = el.scrollHeight - el.clientHeight;
            if (scrollHeight > 0) {
                const progress = Math.round((scrollTop / scrollHeight) * 100);
                setScrollProgress(prev => Math.abs(prev - progress) >= 2 ? progress : prev);
            }
        });
    }, []);

    // 100% Guaranteed High-Performance 60-120 FPS Eased Scroll To Top
    const scrollToTop = useCallback((e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Cancel any previous running animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const el = feedRef.current || document.querySelector('.discord-feed') || document.querySelector('.portal-feed-container');
        if (!el) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const startTop = el.scrollTop;
        if (startTop <= 0) return;

        const duration = 800; // 800ms ultra smooth
        const startTime = performance.now();

        // Quintic Out Easing Curve - extremely smooth deceleration
        const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutQuint(progress);

            el.scrollTop = Math.round(startTop * (1 - ease));

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animateScroll);
            } else {
                el.scrollTop = 0;
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animateScroll);
    }, []);

    // Listen to sidebar/header scroll top event & heal channel data if missing
    useEffect(() => {
        const handleScrollTopEvent = () => {
            scrollToTop();
            if (!portal || !Array.isArray(portal.channels) || portal.channels.length === 0) {
                fetchPortalData();
            }
        };
        window.addEventListener('oxypace:scroll_portal_top', handleScrollTopEvent);
        return () => window.removeEventListener('oxypace:scroll_portal_top', handleScrollTopEvent);
    }, [scrollToTop, portal?._id, portal?.channels?.length]);

    const handleChannelSelect = (channelId) => {
        setCurrentChannel(channelId);
        setShowScrollTop(false); // Reset scroll button when changing channels
        if (isMobileView) {
            closeSidebar();
            setMobileChannelOpen(true); // Go to fullscreen feed mode
        }
    };

    const triggerToast = useCallback((message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }, []);

    // Composer helpers for gallery, camera studio, audio recorder, files & folders (YouTube links are auto-detected)
    const appendComposerFiles = useCallback((files, extra = {}) => {
        if (!files || files.length === 0) return;
        setAttachmentDrafts((prev) => {
            const { nextDrafts, warnings } = appendAttachmentDrafts(prev, files, {
                extra,
                imagesOnly: isImageChannel,
            });
            if (warnings.length > 0) {
                triggerToast(warnings[0], 'warning');
            }
            return nextDrafts;
        });
    }, [isImageChannel, triggerToast]);

    const handleGallerySelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;
        appendComposerFiles(files);
        setShowPlusMenu(false);
    };

    const handleCameraCapture = (file) => {
        if (!file) return;
        appendComposerFiles([file]);
    };

    const handleAudioAttach = (file, meta = {}) => {
        if (!file) return;
        appendComposerFiles([file], meta);
    };

    const handlePickerFilesSelected = (files) => {
        if (!files || files.length === 0) return;
        appendComposerFiles(files);
    };

    const handleFolderPackaged = (packaged) => {
        try {
            const draft = createFolderDraftFromPackage(packaged);
            if (!draft) return;
            setAttachmentDrafts((prev) => {
                if (prev.length >= 15) {
                    revokeAttachmentDraft(draft);
                    triggerToast('Bir gönderiye en fazla 15 dosya veya içerik eklenebilir.', 'warning');
                    return prev;
                }
                return [...prev, draft];
            });
        } catch (err) {
            triggerToast(err?.message || 'Klasör eklenemedi.', 'error');
        }
    };

    const handleRemoveAttachmentDraft = (draftId) => {
        setAttachmentDrafts((prev) => {
            const target = prev.find((d) => d.id === draftId);
            if (target) revokeAttachmentDraft(target);
            return prev.filter((d) => d.id !== draftId);
        });
    };

    const handleClearAttachmentDrafts = () => {
        setAttachmentDrafts((prev) => {
            prev.forEach(revokeAttachmentDraft);
            return [];
        });
    };

    // Typing Indicator Persistence logic
    useEffect(() => {
        if (isGhost) return;
        if (!socket || !id) return;

        if (messageText.trim().length > 0 || attachmentDrafts.length > 0) {
            if (!isTypingSent) {
                setIsTypingSent(true);
                socket.emit('portal_typing', { portalId: id, isTyping: true });
            }
        } else {
            if (isTypingSent) {
                socket.emit('portal_typing', { portalId: id, isTyping: false });
                setIsTypingSent(false);
            }
        }
    }, [messageText, attachmentDrafts, id, socket, isTypingSent, isGhost]);

    useEffect(() => {
        return () => {
            if (!isGhost && socket && id && isTypingSent) {
                socket.emit('portal_typing', { portalId: id, isTyping: false });
            }
        };
    }, [id, socket, isTypingSent, isGhost]);

    const handleSendMessage = async () => {
        if (isGhost) {
            triggerToast('Hayalet Modu: Salt okunur izleme modundasınız. Gönderi paylaşılamaz.', 'error');
            return;
        }
        const hasText = messageText.trim().length > 0;
        const hasAttachments = attachmentDrafts.length > 0;

        if (!hasText && !hasAttachments) return;

        // Clear typing indicator instantly on send
        if (socket && id) {
            socket.emit('portal_typing', { portalId: id, isTyping: false });
        }
        setIsTypingSent(false);

        const currentData = {
            content: messageText,
            drafts: [...attachmentDrafts],
            detectedYouTube,
            quotedPost,
        };

        // 1. Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticVisual = buildOptimisticPostMedia(currentData.drafts, currentData.detectedYouTube);
        const optimisticPost = {
            _id: tempId,
            content: currentData.content,
            media: optimisticVisual.media,
            mediaType: optimisticVisual.mediaType || 'none',
            attachments: optimisticVisual.attachments || [],
            author: user,
            createdAt: new Date().toISOString(),
            likes: [],
            likeCount: 0,
            isOptimistic: true,
            quotedPost: currentData.quotedPost,
            isProcessing: optimisticVisual.isVideoUpload,
            processingProgress: 0,
            estimatedTime: optimisticVisual.isVideoUpload ? 'Hesaplanıyor...' : '',
        };

        setPosts((current) => [optimisticPost, ...current]);
        if (currentChannel) {
            const chKey = String(currentChannel);
            setChannelPostCounts((prev) => ({
                ...prev,
                [chKey]: (prev[chKey] !== undefined ? prev[chKey] : (activeChannelObj?.postCount || 0)) + 1,
            }));
        }

        // Clear composer immediately without revoking preview blobs needed by optimistic card
        setMessageText('');
        setAttachmentDrafts([]);
        setShowPlusMenu(false);
        setUploadLoading(true);
        setUploadPercentage(0);

        try {
            const prepared = await prepareAndUploadPostAttachments({
                drafts: currentData.drafts,
                uploadFileFn: uploadFile,
                targetId: id,
                hasAutoYouTube: Boolean(currentData.detectedYouTube),
                onProgress: (progress) => {
                    setUploadPercentage(progress);
                    setPosts((current) =>
                        current.map((p) => (String(p._id) === String(tempId) ? { ...p, uploadProgress: progress } : p))
                    );
                },
            });

            if (prepared.mode === 'video') {
                useUploadStore.getState().startVideoUpload({
                    file: prepared.primaryVideoFile,
                    portalId: id,
                    channel: currentChannel,
                    content: currentData.content,
                    quotedPostId: currentData.quotedPost?._id,
                    extraAttachments: prepared.extraAttachments,
                    onFinish: (err, createdPost) => {
                        currentData.drafts.forEach(revokeAttachmentDraft);
                        if (err) {
                            setPosts((currentPosts) => currentPosts.filter((p) => String(p._id) !== String(tempId)));
                            if (currentChannel) {
                                const chKey = String(currentChannel);
                                setChannelPostCounts((prev) => ({
                                    ...prev,
                                    [chKey]: Math.max(0, (prev[chKey] || 1) - 1),
                                }));
                            }
                            triggerToast('Video yükleme başarısız oldu.', 'error');
                        } else if (createdPost) {
                            const tempStrId = String(tempId);
                            setPosts((currentPosts) => {
                                const responseId = String(createdPost._id);
                                const alreadyExists = currentPosts.some((p) => String(p._id) === responseId);
                                if (alreadyExists) {
                                    return currentPosts.filter((p) => String(p._id) !== tempStrId);
                                }
                                return currentPosts.map((p) => {
                                    if (String(p._id) === tempStrId) {
                                        const backendPost = createdPost;
                                        const bqId = backendPost.quotedPost && (typeof backendPost.quotedPost === 'string' ? backendPost.quotedPost : backendPost.quotedPost._id);
                                        if (bqId && p.quotedPost && bqId === p.quotedPost._id) {
                                            backendPost.quotedPost = p.quotedPost;
                                        }
                                        return backendPost;
                                    }
                                    return p;
                                });
                            });
                        }
                    },
                });

                setUploadLoading(false);
                setQuotedPost(null);
                return;
            }

            const postData = {
                content: currentData.content,
                portalId: id,
                channel: currentChannel,
                quotedPostId: currentData.quotedPost?._id,
                ...prepared.payloadFields,
            };

            const res = await axios.post('/api/posts', postData);
            setQuotedPost(null);
            currentData.drafts.forEach(revokeAttachmentDraft);

            const tempStrId = String(tempId);
            setPosts((currentPosts) => {
                const responseId = String(res.data._id);
                const alreadyExists = currentPosts.some((p) => String(p._id) === responseId);
                if (alreadyExists) {
                    return currentPosts.filter((p) => String(p._id) !== tempStrId);
                }
                return currentPosts.map((p) => {
                    if (String(p._id) === tempStrId) {
                        const backendPost = res.data;
                        const bqId = backendPost.quotedPost && (typeof backendPost.quotedPost === 'string' ? backendPost.quotedPost : backendPost.quotedPost._id);
                        if (bqId && p.quotedPost && bqId === p.quotedPost._id) {
                            backendPost.quotedPost = p.quotedPost;
                        }
                        return backendPost;
                    }
                    return p;
                });
            });
        } catch (err) {
            console.error('Send message failed', err);
            const errorMsg = err.response?.data?.message || err.message;
            triggerToast(errorMsg, 'error');

            setPosts((currentPosts) => currentPosts.filter((p) => String(p._id) !== String(tempId)));
            if (currentChannel) {
                const chKey = String(currentChannel);
                setChannelPostCounts((prev) => ({
                    ...prev,
                    [chKey]: Math.max(0, (prev[chKey] || 1) - 1),
                }));
            }
            setMessageText(currentData.content);
            setAttachmentDrafts(currentData.drafts);
            setQuotedPost(currentData.quotedPost || null);
        } finally {
            setUploadLoading(false);
            setUploadPercentage(0);
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

    const isFetchingPortalRef = useRef(false);

    useEffect(() => {
        if (id && !authLoading) {
            fetchPortalData();
        }
    }, [id, authLoading]);

    // Self-healing guard: If id is active but portal data is missing channels, fetch immediately!
    useEffect(() => {
        if (id && !authLoading && !isFetchingPortalRef.current) {
            if (!portal || !Array.isArray(portal.channels) || portal.channels.length === 0 || String(portal._id) !== String(id)) {
                fetchPortalData();
            }
        }
    }, [id, authLoading, portal?._id, portal?.channels?.length]);

    useEffect(() => {
        if (searchParams.get('openSettings') === 'true') {
            setSettingsTab('overview');
            setEditing(true);
        }
    }, [searchParams]);

    // Track portal visit frequency and update most visited portal in localStorage
    useEffect(() => {
        if (portal && portal._id && portal.name) {
            try {
                const rawVisits = localStorage.getItem('oxypace_portal_visits');
                const visits = rawVisits ? JSON.parse(rawVisits) : {};
                const portalIdStr = String(portal._id);
                const cur = visits[portalIdStr] || { count: 0 };
                visits[portalIdStr] = {
                    id: portalIdStr,
                    name: portal.name,
                    avatar: portal.avatar,
                    count: (cur.count || 0) + 1,
                    lastVisited: Date.now()
                };
                localStorage.setItem('oxypace_portal_visits', JSON.stringify(visits));

                let maxCount = 0;
                let topPortal = null;
                Object.values(visits).forEach(v => {
                    if (v.count > maxCount) {
                        maxCount = v.count;
                        topPortal = v;
                    }
                });
                if (topPortal) {
                    localStorage.setItem('oxypace_top_portal', JSON.stringify({ id: topPortal.id, name: topPortal.name }));
                }
            } catch (_) {}
        }
    }, [portal?._id, portal?.name]);

    useEffect(() => {
        if (!authLoading && portal && String(portal._id) === String(id) && portal.channels && portal.channels.length > 0) {
            // Check if we need to set a default channel (only if currentChannel is null)
            if (!currentChannel) {
                if (urlChannel) {
                    const matchedChannel = portal.channels.find(c => String(c._id) === String(urlChannel));
                    if (matchedChannel) {
                        setCurrentChannel(matchedChannel._id);
                        return;
                    }
                }
                const defaultChannel = portal.channels[0];
                if (defaultChannel) {
                    setCurrentChannel(defaultChannel._id);
                }
            } else {
                // If urlChannel was passed and differs from current channel, switch to it immediately!
                if (urlChannel) {
                    const matchedChannel = portal.channels.find(c => String(c._id) === String(urlChannel));
                    if (matchedChannel && String(matchedChannel._id) !== String(currentChannel)) {
                        setCurrentChannel(matchedChannel._id);
                        return;
                    }
                }

                // Validate existing currentChannel
                const isValid = portal.channels.some(c => String(c._id) === String(currentChannel));
                if (!isValid) {
                    const defaultChannel = portal.channels[0];
                    if (defaultChannel) {
                        setCurrentChannel(defaultChannel._id);
                    }
                }
            }
        }
    }, [portal, authLoading, urlChannel]);

    // Direct channel switch event listener (used by UserBar / Navbar live room quick-nav)
    useEffect(() => {
        const handleChannelSwitch = (e) => {
            const { portalId, channelId } = e.detail || {};
            if ((!portalId || String(portalId) === String(id)) && channelId) {
                setCurrentChannel(channelId);
                setShowScrollTop(false);
                if (setMobileChannelOpen) {
                    setMobileChannelOpen(true);
                }
            }
        };
        window.addEventListener('oxypace:switch_channel', handleChannelSwitch);
        return () => window.removeEventListener('oxypace:switch_channel', handleChannelSwitch);
    }, [id, setMobileChannelOpen]);

    // Handle mobileChannelOpen when navigating into Portal:
    // If URL contains channel or joinVoice, automatically open mobile channel view so the live room / channel displays immediately!
    useLayoutEffect(() => {
        const hasChannelParam = !!urlChannel || searchParams.get('joinVoice') === 'true';
        if (setMobileChannelOpen && hasChannelParam) {
            setMobileChannelOpen(true);
        }
    }, [id, urlChannel, searchParams, setMobileChannelOpen]);

    useEffect(() => {
        // Guard: Don't fetch if we are navigating (portal data mismatches URL id)
        // or if channel is not set yet.
        if (id && currentChannel && portal && isSameId(portal._id, id)) {
            fetchChannelPosts();
        }
    }, [id, currentChannel, portal?._id]);

    // Mark channel posts as read & notify native Android layer when user is actively viewing this channel
    useEffect(() => {
        const isViewingChannelPosts = !isMobileView || mobileChannelOpen || !!urlChannel;
        if (id && currentChannel && isViewingChannelPosts) {
            setActivePortalChannel(id, currentChannel);
            dismissPortalChannelNotifications(id, currentChannel);
            useGlobalStore.getState().clearUnreadForChannel(currentChannel, id);
        } else {
            setActivePortalChannel(null, null);
        }
        return () => {
            setActivePortalChannel(null, null);
        };
    }, [id, currentChannel, isMobileView, mobileChannelOpen, urlChannel]);

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
        if (isFetchingPortalRef.current) return;
        isFetchingPortalRef.current = true;
        setError('');

        // Hydrate immediately from cache when switching between portals
        let cachedPortalForId = null;
        try {
            const rawCache = sessionStorage.getItem(`oxypace_portal_cache_${id}`) || localStorage.getItem(`oxypace_portal_cache_${id}`);
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed && String(parsed._id) === String(id) && Array.isArray(parsed.channels) && parsed.channels.length > 0) {
                    cachedPortalForId = parsed;
                }
            }
        } catch (_) {}

        if (!portal || String(portal._id) !== String(id) || !Array.isArray(portal.channels) || portal.channels.length === 0) {
            if (cachedPortalForId) {
                setPortal(cachedPortalForId);
                setLoading(false);
            } else {
                setLoading(true);
            }
            setShowScrollTop(false);
        }

        let lastErr = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await axios.get(`/api/portals/${id}`);
                setPortal(res.data);
                try {
                    const serialized = JSON.stringify(res.data);
                    sessionStorage.setItem(`oxypace_portal_cache_${id}`, serialized);
                    localStorage.setItem(`oxypace_portal_cache_${id}`, serialized);
                } catch (_) {}
                if (res.data?.avatar) preloadImage(res.data.avatar, 'original');
                const b = res.data?.coverImage || res.data?.banner;
                if (b) preloadImage(b, 'original');
                const allMembers = [
                    res.data.owner,
                    ...(res.data.admins || []),
                    ...(res.data.members || [])
                ].filter(Boolean);
                preloadUsers(allMembers);
                setEditFormData({
                    name: res.data.name,
                    description: res.data.description || '',
                    privacy: res.data.privacy || 'public',
                });
                setError('');
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
                const status = err.response?.status;
                if (status === 403 || status === 404) break;
                if (attempt < 2) {
                    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
                }
            }
        }

        if (lastErr) {
            if (lastErr.response && lastErr.response.status === 403) {
                const data = lastErr.response.data || {};
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
            } else if (lastErr.response && lastErr.response.status === 404) {
                setError('blocked');
            } else if (!cachedPortalForId && (!portal || String(portal._id) !== String(id))) {
                setError('Portal yüklenemedi');
            }
            console.error(lastErr);
        }

        isFetchingPortalRef.current = false;
        setLoading(false);
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
        const currentChannelId = channelRef.current;
        const cacheKey = `portal_posts_${id}_${currentChannelId}`;

        if (!isLoadMore) {
            // Cancel previous request if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            // Create new controller
            abortControllerRef.current = new AbortController();

            let hasCachedPosts = false;
            try {
                const cached = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPosts(parsed);
                        setContentLoading(false);
                        hasCachedPosts = true;
                    }
                }
            } catch (_) {}

            if (!hasCachedPosts) {
                setContentLoading(true);
                setPosts([]); // Clear posts only if no cache exists
            }
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

            if (res.headers && res.headers['x-total-count'] !== undefined) {
                const totalCount = parseInt(res.headers['x-total-count'], 10);
                if (!isNaN(totalCount)) {
                    setChannelPostCounts((prev) => ({
                        ...prev,
                        [String(currentChannelId)]: totalCount
                    }));
                }
            }

            if (newPosts.length < 10) {
                setHasMore(false);
            }

            if (isLoadMore) {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p._id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id));
                    return [...prev, ...uniqueNewPosts];
                });
            } else {
                setPosts(newPosts);
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(newPosts.slice(0, 20)));
                } catch (_) {
                    try { sessionStorage.setItem(cacheKey, JSON.stringify(newPosts.slice(0, 15))); } catch (__) {}
                }
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
        }, {
            root: feedRef.current,
            rootMargin: '200px',
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

    const handleDeletePost = useCallback((postId) => {
        setPosts((prevPosts) => prevPosts.filter((p) => String(p._id) !== String(postId)));
        const chId = channelRef.current;
        if (chId) {
            setChannelPostCounts((prev) => ({
                ...prev,
                [String(chId)]: Math.max(0, (prev[String(chId)] || 1) - 1)
            }));
        }
    }, [setPosts]);

    const handleArchivePost = useCallback((postId, isArchived) => {
        if (isArchived) {
            setPosts((prevPosts) => prevPosts.filter((p) => String(p._id) !== String(postId)));
            const chId = channelRef.current;
            if (chId) {
                setChannelPostCounts((prev) => ({
                    ...prev,
                    [String(chId)]: Math.max(0, (prev[String(chId)] || 1) - 1)
                }));
            }
        }
    }, [setPosts]);

    const handlePin = useCallback(async (postId) => {
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
            triggerToast('Sabitleme işlemi başarısız', 'error');
        }
    }, [setPosts, triggerToast]);

    const handleJoin = async () => {
        if (!user) {
            // navigate('/login'); // Removed redirect
            triggerToast('Lütfen giriş yapın veya kaydolun!', 'warning');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const res = await axios.post(`/api/portals/${id}/join`, {}, config);
            if (res.data.status === 'joined') {
                setIsMember(true);
                const currentJoined = Array.isArray(user?.joinedPortals) ? user.joinedPortals : [];
                const currentPortals = Array.isArray(user?.portals) ? user.portals : [];
                const updatedJoined = [...currentJoined.filter(p => (p?._id || p)?.toString() !== id.toString()), portal];
                const updatedPortals = [...currentPortals.filter(p => (p?._id || p)?.toString() !== id.toString()), portal];
                const updatedUser = {
                    ...user,
                    joinedPortals: updatedJoined,
                    portals: updatedPortals,
                };
                updateUser(updatedUser);
                setPortal((prev) => ({ ...prev, members: [...(prev.members || []), user._id] }));
                // Fetch posts now that we are a member
                fetchChannelPosts();
                triggerToast('Portala başarıyla katıldınız!', 'success');
            } else {
                triggerToast('Üyelik isteğiniz gönderildi!', 'info');
                setPortal((prev) => ({ ...prev, isRequested: true }));
            }
        } catch (err) {
            console.error('Join failed', err);
            triggerToast(err.response?.data?.message || 'Katılma başarısız', 'error');
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Bu portaldan ayrılmak istediğine emin misin?')) return;
        try {
            await axios.post(`/api/portals/${id}/leave`);
            setIsMember(false);
            const currentJoined = Array.isArray(user?.joinedPortals) ? user.joinedPortals : [];
            const currentPortals = Array.isArray(user?.portals) ? user.portals : [];
            const updatedUser = {
                ...user,
                joinedPortals: currentJoined.filter((p) => (p?._id || p)?.toString() !== id.toString()),
                portals: currentPortals.filter((p) => (p?._id || p)?.toString() !== id.toString()),
            };
            updateUser(updatedUser);
            navigate('/');
        } catch (err) {
            console.error('Leave failed', err);
            triggerToast(err.response?.data?.message || 'Ayrılma başarısız', 'error');
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

    // Guest protection: If no token/session, redirect directly to Home (no flash, no lock screen)
    if (!token && !authLoading) {
        return <Navigate to="/" replace />;
    }

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

    // Error State (Blocked/Not Found/Generic Error)
    if (error && error !== 'suspended') {
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
                    <h2>{error === 'blocked' ? 'Sonuç Bulunamadı' : 'Bir Hata Oluştu'}</h2>
                    <p>{error === 'blocked' ? 'Aradığınız portala ulaşılamıyor.' : (error || 'Portal yüklenirken bir sorun oluştu.')}</p>
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
    if (loading || authLoading || !portal || !Array.isArray(portal.channels) || portal.channels.length === 0) {
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

    // +18 Age Gate
    if (portal.isNSFW && !nsfwConfirmed && !sessionStorage.getItem(`nsfw_confirmed_${id}`)) {
        return (
            <div className="app-wrapper full-height">
                <Navbar />
                <div className="nsfw-gate-overlay">
                    <div className="nsfw-gate-card">
                        <div className="nsfw-gate-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <div className="nsfw-gate-badge">+18</div>
                        <h1 className="nsfw-gate-title">Yaş Kısıtlaması</h1>
                        <p className="nsfw-gate-desc">
                            <strong>{portal.name}</strong> portalı yetişkin içerik barındırabilir.
                            Bu portala erişmek için 18 yaşından büyük olmanız gerekmektedir.
                        </p>
                        <div className="nsfw-gate-actions">
                            <button
                                className="nsfw-gate-confirm"
                                onClick={() => {
                                    sessionStorage.setItem(`nsfw_confirmed_${id}`, 'true');
                                    setNsfwConfirmed(true);
                                }}
                            >
                                18 yaşından büyüğüm, devam et
                            </button>
                            <button
                                className="nsfw-gate-cancel"
                                onClick={() => navigate(-1)}
                            >
                                Geri Dön
                            </button>
                        </div>
                        <p className="nsfw-gate-legal">
                            Devam ederek, yaşınızın 18'den büyük olduğunu ve yetişkin içerikle
                            ilgili yasal sorumluluğu kabul ettiğinizi onaylarsınız.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`app-wrapper full-height discord-layout ${isVoiceChannelActive ? 'voice-channel-active' : ''}`}>
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
            {/* App Toast System */}
            {toast.show && (
                <div className={`app-toast ${toast.type}`}>
                    <span className="app-toast-icon">
                        {toast.type === 'error' ? '🚫' : toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    {toast.message}
                </div>
            )}


            <div className={`discord-split-view ${isMobileView && mobileChannelOpen ? 'mobile-feed-active' : ''} ${isVoiceChannelActive ? 'voice-room-active' : ''} ${isDesktopSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                        onShowPortalInfo={() => setShowPortalInfo(true)}
                    />
                )}

                <main className={`discord-main-content ${isMobileView && !mobileChannelOpen ? 'mobile-content-hidden' : ''} ${isVoiceChannel ? 'voice-channel-active' : ''}`}>
                    {/* Dual Header: Sub-Header System */}
                    {isMobileView && !mobileChannelOpen && (
                        <SubHeader 
                            title={portal?.name || 'Portal'} 
                            showBack={false}
                        />
                    )}

                    {/* Determine current channel type */}
                    {(() => {
                        const currentChannelObj = activeChannelObj;
                        const channelType = currentChannelObj?.type || 'text';
                        const channelName = currentChannelObj?.name || '...';
                        const isVoiceChannel = channelType === 'voice' || channelType === 'conference';

                        return (
                            <>
                                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                    {/* Channel Content — Voice/Conference or Text Feed */}
                                    {isVoiceChannel ? (
                                        /* Voice or Conference Channel - Live rooms provide their own fullscreen controls and back button */
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                            <Suspense fallback={
                                                <div className="skeleton-loader">
                                                    <p>Canlı bağlantı odası hazırlanıyor...</p>
                                                </div>
                                            }>
                                                {channelType === 'conference' ? (
                                                    <ConferenceChannel
                                                        portalId={id}
                                                        channelId={currentChannel}
                                                        channelName={channelName}
                                                        onBack={() => setMobileChannelOpen(false)}
                                                    />
                                                ) : (
                                                    <VoiceChannel
                                                        portalId={id}
                                                        channelId={currentChannel}
                                                        channelName={channelName}
                                                        onBack={() => setMobileChannelOpen(false)}
                                                    />
                                                )}
                                            </Suspense>
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
                                                    {!isVoiceChannel && (
                                                        <header className={`channel-top-bar ${!isMobileView ? 'desktop-only' : ''}`}>
                                                            <div className="channel-title-wrapper">
                                                                {isMobileView && (
                                                                    <button 
                                                                        className="mobile-back-btn-inline" 
                                                                        onClick={() => setMobileChannelOpen(false)}
                                                                    >
                                                                        <svg
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="1.5"
                                                                            width="24"
                                                                            height="24"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <polyline points="15 18 9 12 15 6" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                <span className="hashtag">
                                                                    {channelType === 'image' ? '🖼️' : '#'}
                                                                </span>
                                                                <h3 className="channel-name">
                                                                    {channelName}
                                                                </h3>
                                                                {(() => {
                                                                    const currentChannelKey = String(currentChannelObj?._id || currentChannel || '');
                                                                    const count = channelPostCounts[currentChannelKey] !== undefined
                                                                        ? channelPostCounts[currentChannelKey]
                                                                        : (currentChannelObj?.postCount ?? 0);
                                                                    return (
                                                                        <div
                                                                            className="channel-post-count-badge"
                                                                            title={`${count} Gönderi`}
                                                                        >
                                                                            <MessageSquare size={13} />
                                                                            <span>{count}</span>
                                                                        </div>
                                                                    );
                                                                })()}
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
                                                                        <Users size={20} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </header>
                                                    )}
                                                    {error === 'private' ? (
                                                        <PortalInfoModal
                                                            portal={portal}
                                                            onClose={() => {
                                                                if (window.history.length > 2) {
                                                                    navigate(-1);
                                                                } else {
                                                                    navigate('/search');
                                                                }
                                                            }}
                                                            isMobile={isMobileView}
                                                            onOpenSettings={() => {
                                                                setSettingsTab('overview');
                                                                setEditing(true);
                                                            }}
                                                            onJoinStatusChange={(status) => {
                                                                if (status === 'requested') {
                                                                    setPortal((prev) => (prev ? { ...prev, isRequested: true } : prev));
                                                                } else if (status === 'joined') {
                                                                    setIsMember(true);
                                                                    setError('');
                                                                    fetchPortalData();
                                                                    fetchChannelPosts();
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <>
                                                            {/* Admin Alert Banner */}
                                                            {portal?.alerts && portal.alerts.length > 0 && (
                                                                <PortalAlertBanner alerts={portal.alerts} />
                                                            )}

                                                            {/* Message Area */}
                                                            <div
                                                                        className={`portal-feed-container discord-feed ${isTanitimPortal ? 'tanitim-feed-mode' : ''}`}
                                                                        onScroll={handleScroll}
                                                                        ref={feedRef}
                                                                    >
                                                                        {isTanitimPortal ? (
                                                                            <TanitimShowcase />
                                                                        ) : (
                                                                            <>
                                                                                {/* Feed Header / Welcome */}
                                                                                {posts.length === 0 && !loading && (
                                                                                    <div className="empty-portal">
                                                                                        <div className="empty-portal-icon">👋</div>
                                                                                        <h3>
                                                                                            {portal?.channels?.find((c) => c._id === currentChannel)?.type === 'voice' ? '🎙️' :
                                                                                            portal?.channels?.find((c) => c._id === currentChannel)?.type === 'conference' ? '🎤' : 
                                                                                            portal?.channels?.find((c) => c._id === currentChannel)?.type === 'image' ? '🖼️' : '#'}
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
                                                                                {(() => {
                                                                                    let organicCount = 0;
                                                                                    return Array.isArray(posts) && posts.map((post, index) => {
                                                                                        const isBotPost = post.isBot === true || post.author?.isBot === true;
                                                                                        if (!isBotPost) {
                                                                                            organicCount++;
                                                                                        }
                                                                                        const showAdAfter = adsConfig.enableAds && !isBotPost && organicCount > 0 && organicCount % 8 === 0;
                                                                                        return (
                                                                                            <Fragment key={post._id}>
                                                                                                <PostCard
                                                                                                    key={post._id}
                                                                                                    post={post}
                                                                                                    onDelete={handleDeletePost}
                                                                                                    onPin={handlePin}
                                                                                                    onArchive={handleArchivePost}
                                                                                                    isAdmin={isAdmin}
                                                                                                />
                                                                                                {index < posts.length - 1 && <div className="post-separator" />}
                                                                                                {showAdAfter && (
                                                                                                    <Fragment key={`ad-${post._id}-${index}`}>
                                                                                                        {adsConfig.enableAdsterraAds ? (
                                                                                                            <AdsterraPostCard />
                                                                                                        ) : adsConfig.enableProgrammaticAds ? (
                                                                                                            <ExternalAdHolder />
                                                                                                        ) : (
                                                                                                            <AdPostCard index={Math.floor(organicCount / 8) - 1} />
                                                                                                        )}
                                                                                                        {index < posts.length - 1 && <div className="post-separator" />}
                                                                                                    </Fragment>
                                                                                                )}
                                                                                            </Fragment>
                                                                                        );
                                                                                    });
                                                                                })()}

                                                                                {/* Infinite Scroll Sentinel */}
                                                                                <div ref={lastPostElementRef} style={{ height: '40px', margin: '10px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    {loadingMore && <div className="spinner-small"></div>}
                                                                                </div>
                                                                            </>
                                                                        )}
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

                                                                    {isTanitimPortal ? null : canCreatePostInPortal ? (
                                                                        <div className="channel-input-area">
                                                                        {showPlusMenu && createPortal(
                                                                            <div
                                                                                className="plus-menu portal-plus-menu-portal"
                                                                                ref={plusMenuRef}
                                                                                style={{
                                                                                    position: 'fixed',
                                                                                    top: menuPosition.top,
                                                                                    left: menuPosition.left,
                                                                                    zIndex: 99999,
                                                                                }}
                                                                            >
                                                                                    <div
                                                                                        className="plus-menu-item"
                                                                                        onClick={() => {
                                                                                            galleryInputRef.current?.click();
                                                                                            setShowPlusMenu(false);
                                                                                        }}
                                                                                    >
                                                                                        <div className="plus-menu-icon">
                                                                                            <Image size={18} strokeWidth={1.9} />
                                                                                        </div>
                                                                                        Galeri
                                                                                    </div>
                                                                                    <div
                                                                                        className="plus-menu-item"
                                                                                        onClick={() => {
                                                                                            setShowCameraModal(true);
                                                                                            setShowPlusMenu(false);
                                                                                        }}
                                                                                    >
                                                                                        <div className="plus-menu-icon">
                                                                                            <Camera size={18} strokeWidth={1.9} />
                                                                                        </div>
                                                                                        Kamera
                                                                                    </div>
                                                                                    {!isImageChannel && (
                                                                                        <>
                                                                                            <div
                                                                                                className="plus-menu-item"
                                                                                                onClick={() => {
                                                                                                    setShowAudioPopover(true);
                                                                                                    setShowPlusMenu(false);
                                                                                                }}
                                                                                            >
                                                                                                <div className="plus-menu-icon">
                                                                                                    <Mic size={18} strokeWidth={1.9} />
                                                                                                </div>
                                                                                                Ses
                                                                                            </div>
                                                                                            <div
                                                                                                className="plus-menu-item"
                                                                                                onClick={() => {
                                                                                                    setShowFilePickerModal(true);
                                                                                                    setShowPlusMenu(false);
                                                                                                }}
                                                                                            >
                                                                                                <div className="plus-menu-icon">
                                                                                                    <FolderOpen size={18} strokeWidth={1.9} />
                                                                                                </div>
                                                                                                Dosya
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>,
                                                                                document.body
                                                                            )}
                                                                        <input
                                                                            type="file"
                                                                            ref={galleryInputRef}
                                                                            onChange={handleGallerySelect}
                                                                            style={{ display: 'none' }}
                                                                            accept={isImageChannel ? 'image/*,.gif' : 'image/*,video/*,.gif'}
                                                                            multiple
                                                                        />

                                                                        {quotedPost && (
                                                                            <div className="input-quoted-preview">
                                                                                <div className="input-quoted-preview-header">
                                                                                    {quotedPost.author?.profile?.avatar ? (
                                                                                        <img
                                                                                            src={getImageUrl(quotedPost.author.profile.avatar)}
                                                                                            alt=""
                                                                                            className="quoted-preview-avatar"
                                                                                            loading="lazy"
                                                                                            decoding="async"
                                                                                            width="32"
                                                                                            height="32"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="quoted-preview-avatar-placeholder">
                                                                                            {quotedPost.author?.username?.charAt(0).toUpperCase()}
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="quoted-preview-meta">
                                                                                        <span className="quoted-preview-author">{quotedPost.author?.profile?.displayName || quotedPost.author?.username}</span>
                                                                                        <span className="quoted-preview-username">@{quotedPost.author?.username}</span>
                                                                                    </div>
                                                                                    <button
                                                                                        className="remove-quote-btn"
                                                                                        onClick={() => setQuotedPost(null)}
                                                                                    >
                                                                                        <X size={16} />
                                                                                    </button>
                                                                                </div>
                                                                                <div className="input-quoted-preview-body">
                                                                                    <p className="input-quoted-preview-text">
                                                                                        {quotedPost.content}
                                                                                    </p>
                                                                                    {quotedPost.media && (
                                                                                        <div className="input-quoted-preview-media">
                                                                                            {quotedPost.mediaType === 'video' ? (
                                                                                                <div className="media-placeholder">
                                                                                                    <Youtube size={20} />
                                                                                                    <span>Video Alıntısı</span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <img
                                                                    src={getImageUrl(quotedPost.media)}
                                                                    alt=""
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    width="120"
                                                                    height="80"
                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {isImageChannel && messageText.trim() && attachmentDrafts.length === 0 && (
                                                                            <div className="image-channel-warning" style={{
                                                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                                                                color: '#f87171',
                                                                                padding: '8px 12px',
                                                                                borderRadius: '8px',
                                                                                fontSize: '13px',
                                                                                marginBottom: '8px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '8px'
                                                                            }}>
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                                                </svg>
                                                                                <span>Görsel kanallarında paylaşım yapabilmek için mutlaka bir görsel eklemelisiniz.</span>
                                                                            </div>
                                                                        )}

                                                                        {!isGhost && (
                                                                            <ComposerAttachmentTray
                                                                                attachments={attachmentDrafts}
                                                                                detectedYouTube={detectedYouTube}
                                                                                onRemoveAttachment={handleRemoveAttachmentDraft}
                                                                                onClearAll={handleClearAttachmentDrafts}
                                                                            />
                                                                        )}

                                                                        {isGhost ? (
                                                                            <div className="ghost-channel-notice" style={{
                                                                                backgroundColor: '#0c0c0c',
                                                                                borderTop: '1px solid #222',
                                                                                color: '#888',
                                                                                padding: '14px 20px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: '10px',
                                                                                fontSize: '13px'
                                                                            }}>
                                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}>
                                                                                    <path d="M12 2a5 5 0 0 0-5 5v14l3-2 2 2 2-2 3 2V7a5 5 0 0 0-5-5z" />
                                                                                    <circle cx="10" cy="8" r="1" fill="currentColor" />
                                                                                    <circle cx="14" cy="8" r="1" fill="currentColor" />
                                                                                </svg>
                                                                                <span>Hayalet Modu: Salt okunur izleme modundasınız. Kanalda mesaj ve gönderi paylaşılamaz.</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="message-input-wrapper">
                                                                            <button
                                                                                ref={plusButtonRef}
                                                                                className={`input-action-btn upload-btn ${showPlusMenu ? 'active' : ''}`}
                                                                                onClick={handlePlusToggle}
                                                                                style={{
                                                                                    backgroundColor: '#383a40',
                                                                                    borderRadius: '50%',
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    marginRight: '12px',
                                                                                    color: showPlusMenu
                                                                                        ? '#ffffff'
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

                                                                            <input
                                                                                type="text"
                                                                                placeholder={
                                                                                    isImageChannel
                                                                                        ? 'Gönderi paylaşmak için bir görsel ekleyin...'
                                                                                        : `#${activeChannelObj?.name || '...'} kanalına mesaj gönder`
                                                                                }
                                                                                value={messageText}
                                                                                onChange={(e) => {
                                                                                    setMessageText(e.target.value);
                                                                                }}
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
                                                                                        uploadLoading || (isImageChannel
                                                                                            ? attachmentDrafts.length === 0
                                                                                            : (!messageText.trim() && attachmentDrafts.length === 0))
                                                                                    }
                                                                                    title="Gönder"
                                                                                    style={{
                                                                                        color:
                                                                                            messageText.trim() || attachmentDrafts.length > 0
                                                                                                ? 'var(--primary-color)'
                                                                                                : 'var(--text-tertiary)',
                                                                                    }}
                                                                                >
                                                                                    {uploadLoading ? (
                                                                                        <div className="compose-spinner-wrapper" style={{ width: '20px', height: '20px' }}>
                                                                                            <div className="compose-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--primary-color)' }} />
                                                                                            <span className="compose-progress-text" style={{ fontSize: '7px', color: 'var(--text-primary)' }}>
                                                                                                {uploadPercentage}%
                                                                                            </span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <SendHorizontal size={20} />
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                        {/* Portal Typing Indicator */}
                                                                        {portalTypingUsers && portalTypingUsers.length > 0 && (
                                                                            <div className="portal-typing-indicator" style={{ marginTop: '8px' }}>
                                                                                <div className="typing-avatars-group">
                                                                                    {portalTypingUsers.map((typer) => (
                                                                                        <img
                                                                                            key={typer.userId}
                                                                                            src={getImageUrl(typer.avatar)}
                                                                                            alt={typer.displayName}
                                                                                            className="typing-avatar"
                                                                                            title={typer.displayName}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                                <span className="typing-text">
                                                                                    {portalTypingUsers.length === 1 ? (
                                                                                        <><strong>{portalTypingUsers[0].displayName}</strong> yazıyor...</>
                                                                                    ) : portalTypingUsers.length === 2 ? (
                                                                                        <><strong>{portalTypingUsers[0].displayName}</strong> ve <strong>{portalTypingUsers[1].displayName}</strong> yazıyor...</>
                                                                                    ) : (
                                                                                        <><strong>{portalTypingUsers[0].displayName}</strong> ve {portalTypingUsers.length - 1} kişi daha yazıyor...</>
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="channel-input-area" style={{ padding: '0 20px 24px 20px', backgroundColor: 'transparent', borderTop: 'none' }}>
                                                                        <div style={{
                                                                            display: 'flex', 
                                                                            justifyContent: 'space-between', 
                                                                            alignItems: 'center', 
                                                                            background: 'var(--glass-bg)', 
                                                                            padding: '12px 20px', 
                                                                            borderRadius: '8px',
                                                                            border: '1px solid var(--glass-border)',
                                                                            backdropFilter: 'blur(20px) saturate(160%)',
                                                                            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                                                                            boxShadow: 'var(--glass-shadow)'
                                                                        }}>
                                                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                                                                                Bu kanalda mesaj göndermek için {user ? 'portala katılmalısın.' : 'giriş yapmalısın.'}
                                                                            </span>
                                                                            {user ? (
                                                                                <button 
                                                                                    className="privacy-join-btn" 
                                                                                    onClick={handleJoin} 
                                                                                    disabled={portal.isRequested}
                                                                                    style={{ margin: 0, padding: '8px 16px', borderRadius: '4px', fontSize: '13px', minWidth: 'auto', width: 'auto' }}
                                                                                >
                                                                                    {portal.isRequested ? 'İstek Gönderildi' : 'Portala Katıl'}
                                                                                </button>
                                                                            ) : (
                                                                                <button 
                                                                                    className="privacy-join-btn" 
                                                                                    onClick={() => navigate('/login')}
                                                                                    style={{ margin: 0, padding: '8px 16px', borderRadius: '4px', fontSize: '13px', minWidth: 'auto', width: 'auto' }}
                                                                                >
                                                                                    Giriş Yap
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Members Sidebar (Right Column) */}
                                {showMembers && (
                                    <MembersSidebar
                                        members={[
                                            ...(portal.owner ? [{ ...portal.owner, role: 'owner' }] : []),
                                            ...(portal.admins || []).map(a => ({ ...a, role: 'admin' })),
                                            ...(portal.members || [])
                                        ].filter((m, index, self) => {
                                            const mId = String(m._id || m.id || m);
                                            return m && self.findIndex(s => String(s._id || s.id || s) === mId) === index;
                                        })}
                                        onClose={() => setShowMembers(false)}
                                    />
                                )}
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
                                portalChannels={portal.channels || []}
                                onUpdate={fetchPortalData}
                            />
                        </Suspense>
                    </div>
                </div>
            )}

            {showPortalInfo && portal && (
                <PortalInfoModal
                    portal={portal}
                    onClose={() => setShowPortalInfo(false)}
                    isMobile={isMobileView}
                    onOpenSettings={() => {
                        setShowPortalInfo(false);
                        setSettingsTab('overview');
                        setEditing(true);
                    }}
                    onLeave={() => {
                        setShowPortalInfo(false);
                        setIsMember(false);
                        navigate('/');
                    }}
                />
            )}
            {showCameraModal && createPortal(
                <CameraCaptureModal
                    isOpen={showCameraModal}
                    onClose={() => setShowCameraModal(false)}
                    onCapture={handleCameraCapture}
                />,
                document.body
            )}
            {showAudioPopover && createPortal(
                <AudioRecorderPopover
                    isOpen={showAudioPopover}
                    onClose={() => setShowAudioPopover(false)}
                    onAttach={handleAudioAttach}
                />,
                document.body
            )}
            {showFilePickerModal && createPortal(
                <FileFolderPickerModal
                    isOpen={showFilePickerModal}
                    onClose={() => setShowFilePickerModal(false)}
                    onFilesSelected={handlePickerFilesSelected}
                    onFolderPackaged={handleFolderPackaged}
                />,
                document.body
            )}
        </div>
    );
};

export default Portal;
