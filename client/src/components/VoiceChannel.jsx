import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff, Mic, MessageCircle, Video, VideoOff, MonitorUp, PhoneOff, Volume2, RefreshCw, Check, ChevronDown, ChevronUp, VolumeX, Link, Clipboard, X, UserPlus, Radio, Minimize2, Globe, PictureInPicture, Film, Settings, Eye, EyeOff, Headphones } from 'lucide-react';
import WatchPartyPlayer from './WatchPartyPlayer';
import { HlsTesterModal } from './HlsTesterModal';
import { HlsStreamResolverModalVol2 } from './HlsStreamResolverModalVol2';
import { useUI } from '../context/UIContext';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Clipboard as CapClipboard } from '@capacitor/clipboard';
import './VoiceChannel.css';

const CallManager = registerPlugin('CallManager');

// Standalone VideoRenderer outside main component scope matching GlobalVideoPIP architecture
// to guarantee zero DOM re-creations / unmounts and simultaneous multi-camera rendering
const VideoRenderer = React.memo(({ participant, isShowingScreen, className, identity, avatarUrl }) => {
    const videoRef = useRef(null);
    const [isPortraitStream, setIsPortraitStream] = useState(false);
    const rawTrackObj = isShowingScreen ? participant?.screenShareTrack : (participant?.videoTrack || participant?.screenShareTrack);
    const rawTrack = rawTrackObj?.mediaStreamTrack || rawTrackObj?.track || (rawTrackObj instanceof MediaStreamTrack ? rawTrackObj : (rawTrackObj instanceof MediaStream ? rawTrackObj.getVideoTracks()[0] : null));

    const isVideoActive = isShowingScreen ? !!participant?.isScreenSharing : !!participant?.isCameraOn;

    const checkVideoDimensions = () => {
        const el = videoRef.current;
        if (el && el.videoWidth > 0 && el.videoHeight > 0) {
            setIsPortraitStream(el.videoHeight > el.videoWidth * 1.05);
        }
    };

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;

        if (rawTrack && isVideoActive) {
            const currentStream = el.srcObject;
            if (currentStream && currentStream.getVideoTracks?.()[0]?.id === rawTrack.id && currentStream.active) {
                if (el.paused) el.play().catch(() => {});
                return;
            }

            if (typeof rawTrackObj?.attach === 'function') {
                rawTrackObj.attach(el);
            } else {
                el.srcObject = new MediaStream([rawTrack]);
                el.play().catch(e => console.warn("[VoiceChannel] Video play error:", e));
            }
        } else {
            if (typeof rawTrackObj?.detach === 'function') {
                rawTrackObj.detach(el);
            } else {
                el.srcObject = null;
            }
        }

        return () => {
            if (typeof rawTrackObj?.detach === 'function') {
                rawTrackObj.detach(el);
            } else if (el) {
                el.srcObject = null;
            }
        };
    }, [rawTrack?.id, participant?.isCameraOn, participant?.isScreenSharing, isShowingScreen, isVideoActive]);

    // Continuous watch: guarantee element resumes playing if browser pauses it during renegotiation or local camera start
    useEffect(() => {
        const el = videoRef.current;
        if (el && el.paused && isVideoActive && rawTrack) {
            el.play().catch(() => {});
        }
    });

    // Live frame capture for the transparent overlay window (Electron only)
    useEffect(() => {
        if (!window.desktopAPI || !rawTrackObj) return;

        let active = true;
        let timer = null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const captureFrame = () => {
            if (!active || !videoRef.current) return;
            const video = videoRef.current;

            if (!document.hidden && video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = 160;
                canvas.height = 90;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
                    window.desktopAPI.sendVideoFrame({ identity, frame: dataUrl });
                } catch (e) {
                    console.error("Frame capture error:", e);
                }
            }
            timer = setTimeout(captureFrame, 150);
        };

        captureFrame();

        return () => {
            active = false;
            if (timer) clearTimeout(timer);
            window.desktopAPI.sendVideoFrame({ identity, frame: null });
        };
    }, [rawTrack?.id, identity]);

    if (isVideoActive && rawTrack) {
        const shouldContain = isShowingScreen || participant?.isScreenSharing || isPortraitStream;
        const effectiveClassName = shouldContain && !String(className || '').includes('vc-screenshare-video-contained')
            ? `${className || ''} vc-screenshare-video-contained`.trim()
            : className;
        return (
            <video 
                ref={videoRef} 
                className={effectiveClassName} 
                autoPlay 
                playsInline 
                muted={true}
                onLoadedMetadata={checkVideoDimensions}
                onResize={checkVideoDimensions}
            />
        );
    }

    if (isShowingScreen) {
        return (
            <div className="vc-screenshare-placeholder-bg-mobile">
                <div className="vc-card-avatar-area">
                    <img className="vc-card-avatar" src={avatarUrl} alt="" />
                </div>
            </div>
        );
    }

    return (
        <div className="vc-card-avatar-area">
            <img className="vc-card-avatar" src={avatarUrl} alt="" />
        </div>
    );
});



const VoiceChannel = ({ portalId, channelId, channelName, onBack }) => {
    const { setMobileChannelOpen } = useUI();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        window.scrollTo(0, 0);
        const scrollContainer = document.querySelector('.horizontal-layout-container') || document.querySelector('.discord-main-content');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }, []);

    const handleTriggerDocumentPiP = () => {
        if (Capacitor.isNativePlatform()) {
            CallManager.enterPiP().catch(err => console.warn('[CallManager] enterPiP error:', err));
        } else {
            window.dispatchEvent(new CustomEvent('triggerDocumentPiP'));
            if (isMobile) {
                setMobileChannelOpen(false);
            }
        }
    };
    const { user } = useAuth();
    const {
        activeRoom,
        connectionState,
        participants,
        errorMsg,
        localState,
        chatMessages,
        connectToChannel,
        disconnectFromChannel,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        sendChatMessage,
        availableDevices,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        setVideoInput,
        toggleDeafen,
        selectedAudioInput,
        selectedAudioOutput,
        selectedVideoInput,
        nativeAudioRoute,
        watchParty,
        startWatchParty,
        stopWatchParty,
        isChatOpen,
        setIsChatOpen,
        unreadCount,
        setUnreadCount,
        userVolume,
        setUserVolume
    } = useVoice();

    const handleSendMessage = (text) => {
        if (text.startsWith('/watch ')) {
            const url = text.substring(7).trim();
            if (url === 'stop') {
                stopWatchParty();
            } else if (url) {
                startWatchParty(url);
            }
            return;
        }
        sendChatMessage(text);
    };

    const isActiveRoom = activeRoom?.channelId === channelId;
    const isConnected = isActiveRoom && connectionState === ConnectionState.Connected;
    const isConnecting = isActiveRoom && connectionState === ConnectionState.Connecting;

    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isWatchInputOpen, setIsWatchInputOpen] = useState(false);
    const [watchUrl, setWatchUrl] = useState('');
    const [isLiveWatchInputOpen, setIsLiveWatchInputOpen] = useState(false);
    const [liveWatchUrl, setLiveWatchUrl] = useState('');
    const [isHlsModalOpen, setIsHlsModalOpen] = useState(false);
    const [isHlsVol2ModalOpen, setIsHlsVol2ModalOpen] = useState(false);
    const [isExtraControlsOpen, setIsExtraControlsOpen] = useState(false);
    const [hideSelfView, setHideSelfView] = useState(() => {
        try {
            return localStorage.getItem('vc_hide_self_view') === 'true';
        } catch (e) {
            return false;
        }
    });

    const toggleHideSelfView = () => {
        setHideSelfView(prev => {
            const next = !prev;
            try {
                localStorage.setItem('vc_hide_self_view', String(next));
            } catch (e) {}
            return next;
        });
    };

    const displayParticipants = useMemo(() => {
        if (!hideSelfView) return participants || [];
        return (participants || []).filter(p => !p.isLocal);
    }, [participants, hideSelfView]);
    const drawerTimerRef = useRef(null);

    const resetDrawerTimer = () => {
        if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
        drawerTimerRef.current = setTimeout(() => {
            setIsExtraControlsOpen(false);
        }, 5000);
    };

    useEffect(() => {
        if (isExtraControlsOpen) {
            resetDrawerTimer();
        } else {
            if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
        }
        return () => {
            if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
        };
    }, [isExtraControlsOpen]);
    const autoJoinedRef = useRef(false);
    const [watchStreamAccepted, setWatchStreamAccepted] = useState(false);
    const [lastScreenShareId, setLastScreenShareId] = useState(null);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef(null);

    // Call duration timer
    useEffect(() => {
        let interval = null;
        if (isConnected) {
            setCallDuration(0);
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isConnected]);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePasteToInput = async (setter) => {
        try {
            if (Capacitor.isNativePlatform()) {
                const res = await CapClipboard.read();
                if (res && res.value && typeof res.value === 'string') {
                    setter(res.value.trim());
                    return;
                }
            }
            if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                const text = await navigator.clipboard.readText();
                if (text && typeof text === 'string') {
                    setter(text.trim());
                    return;
                }
            }
        } catch (err) {
            console.warn("[VoiceChannel] Clipboard paste error:", err);
        }
    };
    useEffect(() => {
        if (window.desktopAPI && window.desktopAPI.onVideoSniffed) {
            const handleVideoSniffed = (data) => {
                console.log("Captured sniffed HLS video stream:", data);
                if (data.url) {
                    startWatchParty(data.url, false);
                }
            };
            const cleanup = window.desktopAPI.onVideoSniffed(handleVideoSniffed);
            return () => {
                if (cleanup) cleanup();
            };
        }
    }, [startWatchParty]);

    useEffect(() => {
        if (!isConnected) {
            setIsIdle(false);
            const btn = document.querySelector('.sidebar-toggle-btn');
            if (btn) btn.classList.remove('user-idle-btn');
            return;
        }

        const handleMouseMove = () => {
            setIsIdle(false);
            const btn = document.querySelector('.sidebar-toggle-btn');
            if (btn) btn.classList.remove('user-idle-btn');

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }

            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
                const btn2 = document.querySelector('.sidebar-toggle-btn');
                if (btn2) btn2.classList.add('user-idle-btn');
            }, 3000);
        };

        handleMouseMove();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleMouseMove);
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
            const btn = document.querySelector('.sidebar-toggle-btn');
            if (btn) btn.classList.remove('user-idle-btn');
        };
    }, [isConnected]);

    // Invitation states
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const [portalMembers, setPortalMembers] = useState([]);
    const [inviteCooldowns, setInviteCooldowns] = useState({});
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Cooldown decrement timer for invitations
    useEffect(() => {
        const hasActiveCooldown = Object.values(inviteCooldowns).some(cd => cd > 0);
        if (!hasActiveCooldown) return;

        const interval = setInterval(() => {
            setInviteCooldowns(prev => {
                let changed = false;
                const next = { ...prev };
                Object.keys(next).forEach(id => {
                    if (next[id] > 1) {
                        next[id] -= 1;
                        changed = true;
                    } else if (next[id] === 1) {
                        delete next[id];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [inviteCooldowns]);

    const volumeCloseTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (volumeCloseTimerRef.current) clearTimeout(volumeCloseTimerRef.current);
        };
    }, []);

    const handleVolumeMouseEnter = () => {
        if (volumeCloseTimerRef.current) {
            clearTimeout(volumeCloseTimerRef.current);
            volumeCloseTimerRef.current = null;
        }
    };

    const handleVolumeMouseLeave = () => {
        if (volumeCloseTimerRef.current) clearTimeout(volumeCloseTimerRef.current);
        volumeCloseTimerRef.current = setTimeout(() => {
            setIsVolumeOpen(false);
        }, 1000);
    };

    const screenShareIdentity = participants.find(p => p.screenShareTrack)?.identity || null;

    useEffect(() => {
        if (screenShareIdentity !== lastScreenShareId) {
            setLastScreenShareId(screenShareIdentity);
            setWatchStreamAccepted(false);
        }
    }, [screenShareIdentity, lastScreenShareId]);

    const showControls = true; // Permanent controls, no auto-hide

    const handleContainerClick = (e) => {
        // No-op, controls are permanently active
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (focusedIdentity && !participants.find(p => p.identity === focusedIdentity)) {
            setFocusedIdentity(null);
        }
    }, [participants, focusedIdentity]);

    useEffect(() => {
        if (isActiveRoom || !portalId || !channelId) return;
        let isMounted = true;
        const fetchCount = async () => {
            try {
                const res = await axios.get(`/api/voice/rooms/${portalId}/${channelId}/participants?t=${Date.now()}`);
                if (isMounted && res.data?.participants) setLobbyCount(res.data.participants.length);
            } catch (err) { if (isMounted) setLobbyCount(0); }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 10000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [isActiveRoom, portalId, channelId]);

    // Fetch portal members when invite panel is opened
    useEffect(() => {
        if (isInviteOpen && portalId) {
            setLoadingMembers(true);
            axios.get(`/api/portals/${portalId}`)
                .then(res => {
                    if (res.data && res.data.members) {
                        setPortalMembers(res.data.members.filter(m => m._id.toString() !== user?._id?.toString()));
                    }
                })
                .catch(err => console.error("Error fetching portal members for invite:", err))
                .finally(() => setLoadingMembers(false));
        }
    }, [isInviteOpen, portalId, user]);

    const handleSendInvite = async (targetUserId) => {
        if (inviteCooldowns[targetUserId]) return;
        setInviteCooldowns(prev => ({ ...prev, [targetUserId]: 30 }));
        try {
            await axios.post('/api/voice/invite', {
                portalId,
                channelId,
                targetUserIds: [targetUserId]
            });
        } catch (error) {
            console.error("Failed to send call invitation:", error);
        }
    };

    const handleJoin = () => {
        autoJoinedRef.current = false;
        connectToChannel(portalId, channelId);
    };
    const handleLeave = () => {
        autoJoinedRef.current = false;
        sessionStorage.removeItem('pending_auto_join_voice');
        try {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.has('joinVoice')) {
                currentUrl.searchParams.delete('joinVoice');
                window.history.replaceState(null, '', currentUrl.pathname + (currentUrl.search ? currentUrl.search : ''));
            }
        } catch (e) {}
        disconnectFromChannel();
        setFocusedIdentity(null);
    };
    const handleFocus = (identity) => setFocusedIdentity(focusedIdentity === identity ? null : identity);

    // Auto-join if user arrived via incoming call notification or "Katıl" action (runs strictly once!)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shouldJoinFromUrl = params.get('joinVoice') === 'true';
        const pendingAutoJoin = sessionStorage.getItem('pending_auto_join_voice');

        if ((shouldJoinFromUrl || pendingAutoJoin) && !isConnected && !isConnecting && portalId && channelId && !autoJoinedRef.current) {
            autoJoinedRef.current = true;
            sessionStorage.removeItem('pending_auto_join_voice');
            try {
                const currentUrl = new URL(window.location.href);
                if (currentUrl.searchParams.has('joinVoice')) {
                    currentUrl.searchParams.delete('joinVoice');
                    window.history.replaceState(null, '', currentUrl.pathname + (currentUrl.search ? currentUrl.search : ''));
                }
            } catch (e) {}
            console.log("📞 Auto-connecting to voice channel from invitation action:", channelId);
            connectToChannel(portalId, channelId);
        }
    }, [portalId, channelId, isConnected, isConnecting, connectToChannel]);

    // Listen for direct native oxypace:join_voice intent while already in portal
    useEffect(() => {
        const handleNativeJoin = (e) => {
            console.log("📞 Native join voice event received:", e?.detail);
            if (portalId && channelId && !isConnected && !isConnecting) {
                connectToChannel(portalId, channelId);
            }
        };
        window.addEventListener('oxypace:join_voice', handleNativeJoin);
        return () => {
            window.removeEventListener('oxypace:join_voice', handleNativeJoin);
        };
    }, [portalId, channelId, isConnected, isConnecting, connectToChannel]);

    useEffect(() => {
        if (watchParty?.url) {
            setFocusedIdentity(null);
        }
    }, [watchParty?.url]);

    // Mobile Touch Drag & Pinch-to-Scale for floating camera cards in spotlight / watchparty mode
    const [carouselOffset, setCarouselOffset] = useState({ x: 0, y: 0 });
    const [carouselScale, setCarouselScale] = useState(1);
    const touchStartRef = useRef(null);
    const isDraggingRef = useRef(false);

    const handleCarouselTouchStart = (e) => {
        if (!isMobile) return;
        isDraggingRef.current = false;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            touchStartRef.current = {
                type: 'drag',
                startX: touch.clientX - carouselOffset.x,
                startY: touch.clientY - carouselOffset.y,
                originX: touch.clientX,
                originY: touch.clientY
            };
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartRef.current = {
                type: 'pinch',
                startDist: dist,
                initialScale: carouselScale
            };
        }
    };

    const handleCarouselTouchMove = (e) => {
        if (!touchStartRef.current || !isMobile) return;
        if (touchStartRef.current.type === 'drag' && e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartRef.current.originX;
            const dy = touch.clientY - touchStartRef.current.originY;
            if (Math.hypot(dx, dy) > 4) {
                isDraggingRef.current = true;
            }
            const newX = touch.clientX - touchStartRef.current.startX;
            const newY = touch.clientY - touchStartRef.current.startY;
            setCarouselOffset({ x: newX, y: newY });
        } else if (touchStartRef.current.type === 'pinch' && e.touches.length === 2) {
            isDraggingRef.current = true;
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scaleChange = currentDist / touchStartRef.current.startDist;
            const newScale = Math.min(Math.max(touchStartRef.current.initialScale * scaleChange, 0.45), 1.5);
            setCarouselScale(newScale);
        }
    };

    const handleCarouselTouchEnd = () => {
        touchStartRef.current = null;
    };

    const renderParticipantCard = (p, role = 'grid', onClickOverride = null) => {
        const handleCardClick = () => {
            if (isDraggingRef.current) return;
            if (onClickOverride) onClickOverride();
            else handleFocus(p.identity);
        };
        const isShowingScreen = !!(p.isScreenSharing || p.screenShareTrack || String(p.identity).endsWith('-screen'));
        const avatarUrl = getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=333&color=fff&size=120`;

        return (
            <div key={`${p.identity}-${role}`} className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`} onClick={handleCardClick}>
                <div className="vc-card-video-area">
                    <div className="vc-avatar-blur-bg" style={{ backgroundImage: `url(${avatarUrl})` }} />
                    <VideoRenderer 
                        participant={p}
                        isShowingScreen={isShowingScreen}
                        className={`vc-card-video ${isShowingScreen ? 'vc-screenshare-video-contained' : ''}`}
                        avatarUrl={avatarUrl}
                        identity={p.identity}
                    />
                </div>
                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <div className="vc-card-indicators">
                        {p.isMuted && <div className="vc-indicator muted"><MicOff size={14} /></div>}
                    </div>
                </div>
            </div>
        );
    };

    if (!isActiveRoom) {
        const handleBack = () => {
            if (onBack) {
                onBack();
            } else {
                window.history.back();
            }
        };

        return (
            <div className="vc-container glass-container lobby-bg">
                <button
                    className="vc-lobby-back-btn"
                    onClick={handleBack}
                    aria-label="Geri"
                    title="Geri"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="vc-lobby-card">
                    {/* Live Status Badge */}
                    <div className="vc-lobby-status-pill">
                        <span className={`vc-status-dot ${lobbyCount > 0 ? 'online' : 'idle'}`} />
                        <span className="vc-status-text">
                            {lobbyCount > 0 ? `${lobbyCount} Çevrimiçi` : 'Oda Boş'}
                        </span>
                    </div>

                    {/* Minimalist Silver Mic Icon */}
                    <div className="vc-lobby-icon">
                        <Mic size={28} />
                    </div>

                    {/* Room Title */}
                    <h2 className="vc-lobby-title">{channelName || 'Ses Kanalı'}</h2>

                    {errorMsg && (
                        <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0', textAlign: 'center' }}>
                            {errorMsg}
                        </p>
                    )}

                    {/* Minimalist Silver Dark Join CTA */}
                    <button 
                        className="vc-lobby-join-btn" 
                        onClick={handleJoin}
                        disabled={isConnecting}
                    >
                        <span>{isConnecting ? 'Bağlanılıyor...' : 'Aramaya Katıl'}</span>
                    </button>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-connecting-spinner loader" />
                    <h2 className="vc-lobby-title">Bağlanılıyor...</h2>
                </div>
            </div>
        );
    }

    if (connectionState === ConnectionState.Disconnected && errorMsg) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <h2 className="vc-lobby-title" style={{ color: '#ef4444' }}>Hata</h2>
                    <p>{errorMsg}</p>
                    <button className="vc-join-btn action-btn-large" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    const activeFocusIdentity = focusedIdentity;
    const focusedParticipant = (activeFocusIdentity && displayParticipants.length > 1) 
        ? displayParticipants.find(p => p.identity === activeFocusIdentity) 
        : null;

    const carouselItemsCount = (watchParty && watchParty.url) 
        ? displayParticipants.length 
        : (focusedParticipant ? displayParticipants.length - 1 : 0);
    const carouselClass = carouselItemsCount >= 4 ? 'grid-multi' : 'grid-single';
    const gridClass = (focusedParticipant || (watchParty && watchParty.url)) 
        ? 'layout-spotlight' 
        : `layout-dynamic grid-${Math.min(displayParticipants.length, 4)}`;

    return (
        <div className={`vc-container glass-container ${isIdle ? 'user-idle' : ''}`} onClick={handleContainerClick}>
            {isMobile && (
                <button className="vc-mobile-back-btn" onClick={() => setMobileChannelOpen(false)} title="Geri">
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
            <div className="vc-top-right-controls">
                <button 
                    className={`vc-ctrl-btn ${isInviteOpen ? 'active' : ''}`} 
                    onClick={() => { setIsInviteOpen(!isInviteOpen); setIsChatOpen(false); setIsVolumeOpen(false); }} 
                    title="Davet Et"
                >
                    <UserPlus size={18} />
                </button>
                <button className={`vc-ctrl-btn ${isChatOpen ? 'active' : ''}`} style={{ position: 'relative' }} onClick={() => { setIsChatOpen(!isChatOpen); setIsInviteOpen(false); setIsVolumeOpen(false); }} title="Sohbet">
                    <MessageCircle size={18} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '700',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #090a0d',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </button>
                
                {/* Volume Slider Group */}
                <div 
                    style={{ position: 'relative' }}
                    onMouseEnter={handleVolumeMouseEnter}
                    onMouseLeave={handleVolumeMouseLeave}
                >
                    <button 
                        className={`vc-ctrl-btn ${isVolumeOpen ? 'active' : ''}`} 
                        onClick={() => { setIsVolumeOpen(!isVolumeOpen); setIsChatOpen(false); setIsInviteOpen(false); }} 
                        title="Kullanıcı Ses Düzeyi"
                    >
                        <Volume2 size={18} />
                    </button>
                    {isVolumeOpen && (
                        <div className="vc-volume-dropdown-container">
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={userVolume} 
                                onChange={(e) => setUserVolume(parseFloat(e.target.value))} 
                                className="vc-volume-slider-input"
                            />
                        </div>
                    )}
                </div>
                
                {/* When closed: Arrow is right below the top 3 buttons */}
                {!isExtraControlsOpen && (
                    <button 
                        className="vc-ctrl-btn vc-drawer-toggle-btn"
                        onClick={() => setIsExtraControlsOpen(true)}
                        title="Daha Fazla Göster"
                        aria-label="Diğer Kontrolleri Göster"
                    >
                        <ChevronDown size={18} className="vc-drawer-chevron" />
                    </button>
                )}

                {/* Collapsible Drawer with remaining buttons */}
                <div 
                    className={`vc-extra-controls-drawer ${isExtraControlsOpen ? 'open' : ''}`}
                    onMouseMove={resetDrawerTimer}
                    onTouchStart={resetDrawerTimer}
                >
                    {/* Picture-in-Picture Button */}
                    <button 
                        className="vc-ctrl-btn" 
                        onClick={handleTriggerDocumentPiP} 
                        title="Yüzen Pencereye Geç (PiP)"
                        style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                    >
                        <PictureInPicture size={18} color="#818cf8" />
                    </button>

                    {/* HLS Video Oynatıcı & Çözücü Butonu */}
                    <button 
                        className={`vc-ctrl-btn ${isHlsModalOpen ? 'active' : ''}`} 
                        onClick={() => { setIsHlsModalOpen(true); resetDrawerTimer(); }} 
                        title="HLS Oynatıcı & Çözücü Modalını Aç"
                        style={{ background: 'rgba(168, 85, 247, 0.25)', borderColor: 'rgba(168, 85, 247, 0.6)' }}
                    >
                        <Radio size={18} color="#c084fc" />
                    </button>

                    {/* HLS Video Oynatıcı Vol 2 (Microservice Stream Resolver) */}
                    <button 
                        className={`vc-ctrl-btn ${isHlsVol2ModalOpen ? 'active' : ''}`} 
                        onClick={() => { setIsHlsVol2ModalOpen(!isHlsVol2ModalOpen); setIsChatOpen(false); setIsInviteOpen(false); setIsVolumeOpen(false); resetDrawerTimer(); }} 
                        title="HLS Video Oynatıcı Vol 2 (Stream Resolver)"
                        style={{ background: isHlsVol2ModalOpen ? 'rgba(56, 139, 253, 0.25)' : 'rgba(255, 255, 255, 0.05)', borderColor: isHlsVol2ModalOpen ? '#58a6ff' : 'rgba(255, 255, 255, 0.12)' }}
                    >
                        <Film size={18} color={isHlsVol2ModalOpen ? '#58a6ff' : '#c9d1d9'} />
                    </button>

                    {/* When open: Arrow moves to the very bottom of the drawer */}
                    {isExtraControlsOpen && (
                        <button 
                            className="vc-ctrl-btn vc-drawer-toggle-btn active"
                            onClick={() => setIsExtraControlsOpen(false)}
                            title="Daha Az Göster"
                            aria-label="Diğer Kontrolleri Gizle"
                        >
                            <ChevronUp size={18} className="vc-drawer-chevron" />
                        </button>
                    )}
                </div>
            </div>

            <div className={`vc-viewport ${gridClass}`} style={{ marginTop: '0px', position: 'relative' }}>
                {watchParty && watchParty.url && !focusedParticipant && (
                    <div 
                        id="watch-party-portal-placeholder" 
                        className="watch-party-target-hero"
                        style={{
                            cursor: 'default',
                            pointerEvents: 'none'
                        }}
                    />
                )}

                {watchParty && watchParty.url ? (
                    <>
                        <div 
                            className={`vc-carousel custom-scrollbar ${carouselClass}`}
                            onTouchStart={handleCarouselTouchStart}
                            onTouchMove={handleCarouselTouchMove}
                            onTouchEnd={handleCarouselTouchEnd}
                            style={isMobile ? {
                                '--drag-x': `${carouselOffset.x}px`,
                                '--drag-y': `${carouselOffset.y}px`,
                                '--drag-scale': `${carouselScale}`,
                                touchAction: 'none'
                            } : undefined}
                        >
                            {focusedParticipant && (
                                <div 
                                    id="watch-party-portal-placeholder"
                                    className="vc-card role-carousel watch-party-target-carousel"
                                    onClick={() => setFocusedIdentity(null)}
                                    title="Videoyu Ana Ekrana Al"
                                    style={{
                                        cursor: 'pointer',
                                        pointerEvents: 'auto',
                                        position: 'relative',
                                        flexShrink: 0
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'transparent' }} />
                                </div>
                            )}
                            {displayParticipants.filter(p => !focusedParticipant || p.identity !== focusedParticipant.identity).map(p => 
                                renderParticipantCard(p, 'carousel', () => handleFocus(p.identity))
                            )}
                        </div>
                        <div className="vc-hero">
                            {focusedParticipant && (
                                renderParticipantCard(focusedParticipant, 'hero', () => handleFocus(focusedParticipant.identity))
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {focusedParticipant && (
                            <div 
                                className={`vc-carousel custom-scrollbar ${carouselClass}`}
                                onTouchStart={handleCarouselTouchStart}
                                onTouchMove={handleCarouselTouchMove}
                                onTouchEnd={handleCarouselTouchEnd}
                                style={isMobile ? {
                                    '--drag-x': `${carouselOffset.x}px`,
                                    '--drag-y': `${carouselOffset.y}px`,
                                    '--drag-scale': `${carouselScale}`,
                                    touchAction: 'none'
                                } : undefined}
                            >
                                {displayParticipants.filter(p => p.identity !== activeFocusIdentity).map(p => 
                                    renderParticipantCard(p, 'carousel', () => handleFocus(p.identity))
                                )}
                            </div>
                        )}
                        <div className="vc-hero">
                            {focusedParticipant ? (
                                renderParticipantCard(focusedParticipant, 'hero', () => handleFocus(focusedParticipant.identity))
                            ) : (
                                <div className={`vc-grid grid-${Math.min(displayParticipants.length, 4)}`}>
                                    {displayParticipants.map(p => 
                                        renderParticipantCard(p, 'grid', () => handleFocus(p.identity))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {isConnected && (
                <div className={`vc-controls ${(!showControls && isMobile) ? 'controls-hidden' : ''}`}>
                    <div className="vc-ctrl-section glass-controls">
                        {/* Microphone */}
                        <div className="vc-ctrl-group">
                            <button className={`vc-ctrl-btn ${localState.isMuted ? 'danger' : 'active'}`} onClick={toggleMicrophone}>
                                {localState.isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                            </button>
                            {Array.isArray(availableDevices?.audioInputs) && availableDevices.audioInputs.length > 1 && (
                                <button className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`} onClick={() => setIsMicMenuOpen(!isMicMenuOpen)}><ChevronUp size={16} /></button>
                            )}
                            {isMicMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '8px', padding: '6px', width: 'min(220px, 75vw)', boxSizing: 'border-box' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', padding: '0 4px', textTransform: 'uppercase' }}>MİKROFON</div>
                                    {Array.isArray(availableDevices?.audioInputs) && availableDevices.audioInputs.map((d, idx) => {
                                        const isSelected = selectedAudioInput === d.deviceId || (!selectedAudioInput && (d.deviceId === 'default' || idx === 0));
                                        return (
                                            <div key={d.deviceId} className={`vc-device-option ${isSelected ? 'active' : ''}`} onClick={() => { setAudioInput(d.deviceId); setIsMicMenuOpen(false); }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Mikrofon'}</span>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Camera */}
                        <div className="vc-ctrl-group">
                            <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'active' : 'danger'}`} onClick={toggleCamera}>
                                {localState.isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                            </button>
                            {localState.isCameraOn && (
                                <button 
                                    className="vc-ctrl-btn vc-quick-flip-btn" 
                                    onClick={toggleFacingMode} 
                                    title="Kamerayı Çevir"
                                    aria-label="Kamerayı Çevir"
                                    style={{ marginLeft: '4px' }}
                                >
                                    <RefreshCw size={18} />
                                </button>
                            )}
                            {Array.isArray(availableDevices?.videoInputs) && availableDevices.videoInputs.length > 1 && (
                                <button className={`vc-device-arrow ${isCameraMenuOpen ? 'active' : ''}`} onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}><ChevronUp size={16} /></button>
                            )}
                            {isCameraMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '8px', padding: '6px', width: 'min(200px, 75vw)', boxSizing: 'border-box' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', padding: '0 4px' }}>KAMERA</div>
                                    {Array.isArray(availableDevices?.videoInputs) && availableDevices.videoInputs.map(d => (
                                        <div key={d.deviceId} className={`vc-device-option ${selectedVideoInput === d.deviceId ? 'active' : ''}`} onClick={() => { setVideoInput(d.deviceId); setIsCameraMenuOpen(false); }}>
                                            <span>{d.label || 'Kamera'}</span>
                                            {selectedVideoInput === d.deviceId && <Check size={12} />}
                                        </div>
                                    ))}
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                                    <button className="vc-more-option" onClick={() => { toggleFacingMode(); setIsCameraMenuOpen(false); }}>
                                        <RefreshCw size={14} /> <span>Kamerayı Çevir</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Medya URL Watch Party Button */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                            <button className={`vc-ctrl-btn ${watchParty?.url && !watchParty?.isLive ? 'active' : ''}`} onClick={() => { setIsWatchInputOpen(!isWatchInputOpen); setIsLiveWatchInputOpen(false); }} title="Birlikte Video İzle">
                                <Link size={22} color={watchParty?.url && !watchParty?.isLive ? '#ffffff' : '#ef4444'} />
                            </button>
                            {isWatchInputOpen && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '10px',
                                    padding: '12px',
                                    width: 'min(330px, 92vw)',
                                    background: '#121418',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: '8px',
                                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
                                    zIndex: 1005,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Link size={14} color="#58a6ff" />
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#e6edf3', letterSpacing: '0.2px' }}>
                                                Video Bağlantısı
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsWatchInputOpen(false)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#8b949e',
                                                cursor: 'pointer',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Kapat"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: '#0d1117',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '6px',
                                        padding: '0 8px',
                                        height: '36px',
                                        gap: '6px'
                                    }}>
                                        <input 
                                            type="text" 
                                            placeholder="YouTube, MP4 veya video URL..." 
                                            value={watchUrl} 
                                            onChange={(e) => setWatchUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && watchUrl.trim()) {
                                                    startWatchParty(watchUrl.trim(), false);
                                                    setIsWatchInputOpen(false);
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                minWidth: 0
                                            }}
                                        />
                                        {watchUrl && (
                                            <button 
                                                type="button"
                                                onClick={() => setWatchUrl('')}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#8b949e',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Temizle"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => handlePasteToInput(setWatchUrl)}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '4px',
                                                color: '#c9d1d9',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexShrink: 0
                                            }}
                                            title="Panodan Yapıştır"
                                        >
                                            <Clipboard size={12} />
                                            <span>Yapıştır</span>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (watchUrl.trim()) {
                                                    startWatchParty(watchUrl.trim(), false);
                                                    setIsWatchInputOpen(false);
                                                }
                                            }}
                                            disabled={!watchUrl.trim()}
                                            style={{
                                                flex: 1,
                                                height: '32px',
                                                background: '#238636',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '6px',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: watchUrl.trim() ? 'pointer' : 'not-allowed',
                                                opacity: watchUrl.trim() ? 1 : 0.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Başlat
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsHlsVol2ModalOpen(true);
                                                setIsWatchInputOpen(false);
                                            }}
                                            style={{
                                                height: '32px',
                                                padding: '0 10px',
                                                background: '#21262d',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                color: '#58a6ff',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            title="Film Arama ve Çözümleyici"
                                        >
                                            <Film size={13} color="#58a6ff" />
                                            <span>Film Ara</span>
                                        </button>
                                        {!!window.desktopAPI && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const urlVal = watchUrl.trim();
                                                    const isStream = urlVal.toLowerCase().includes('.txt') || urlVal.toLowerCase().includes('.m3u8') || urlVal.toLowerCase().includes('/hls/') || urlVal.toLowerCase().includes('manifest');
                                                    window.desktopAPI.openFilmBrowser((!urlVal || isStream) ? 'https://www.hdfilmcehennemi.life/' : urlVal);
                                                    setIsWatchInputOpen(false);
                                                }}
                                                style={{
                                                    height: '32px',
                                                    padding: '0 10px',
                                                    background: '#21262d',
                                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                                    borderRadius: '6px',
                                                    color: '#f85149',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                                title="Film Sitesini Aç"
                                            >
                                                <Globe size={13} color="#f85149" />
                                                <span>Film Aç</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Canlı Yayın Watch Party Button */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                            <button className={`vc-ctrl-btn ${watchParty?.url && watchParty?.isLive ? 'active' : ''}`} onClick={() => { setIsLiveWatchInputOpen(!isLiveWatchInputOpen); setIsWatchInputOpen(false); }} title="Birlikte Canlı Yayın İzle">
                                <Radio size={22} color={watchParty?.url && watchParty?.isLive ? '#ffffff' : '#10b981'} />
                            </button>
                            {isLiveWatchInputOpen && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '10px',
                                    padding: '12px',
                                    width: 'min(330px, 92vw)',
                                    background: '#121418',
                                    border: '1px solid rgba(255, 255, 255, 0.14)',
                                    borderRadius: '8px',
                                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
                                    zIndex: 1005,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Radio size={14} color="#3fb950" />
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#e6edf3', letterSpacing: '0.2px' }}>
                                                Canlı Yayın Bağlantısı
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsLiveWatchInputOpen(false)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#8b949e',
                                                cursor: 'pointer',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Kapat"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: '#0d1117',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '6px',
                                        padding: '0 8px',
                                        height: '36px',
                                        gap: '6px'
                                    }}>
                                        <input 
                                            type="text" 
                                            placeholder="Canlı akış linki (.m3u8, .mpd)..." 
                                            value={liveWatchUrl} 
                                            onChange={(e) => setLiveWatchUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && liveWatchUrl.trim()) {
                                                    startWatchParty(liveWatchUrl.trim(), true);
                                                    setIsLiveWatchInputOpen(false);
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                minWidth: 0
                                            }}
                                        />
                                        {liveWatchUrl && (
                                            <button 
                                                type="button"
                                                onClick={() => setLiveWatchUrl('')}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#8b949e',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Temizle"
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => handlePasteToInput(setLiveWatchUrl)}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '4px',
                                                color: '#c9d1d9',
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexShrink: 0
                                            }}
                                            title="Panodan Yapıştır"
                                        >
                                            <Clipboard size={12} />
                                            <span>Yapıştır</span>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (liveWatchUrl.trim()) {
                                                    startWatchParty(liveWatchUrl.trim(), true);
                                                    setIsLiveWatchInputOpen(false);
                                                }
                                            }}
                                            disabled={!liveWatchUrl.trim()}
                                            style={{
                                                flex: 1,
                                                height: '32px',
                                                background: '#238636',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '6px',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: liveWatchUrl.trim() ? 'pointer' : 'not-allowed',
                                                opacity: liveWatchUrl.trim() ? 1 : 0.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Başlat
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsHlsModalOpen(true)}
                                            style={{
                                                height: '32px',
                                                padding: '0 10px',
                                                background: '#21262d',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                color: '#c9d1d9',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            title="HLS Akış Çözücü"
                                        >
                                            <Radio size={13} color="#c9d1d9" />
                                            <span>HLS</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsHlsVol2ModalOpen(true);
                                                setIsLiveWatchInputOpen(false);
                                            }}
                                            style={{
                                                height: '32px',
                                                padding: '0 10px',
                                                background: '#21262d',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                color: '#58a6ff',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            title="Entegre Film Arama ve Oynatıcı"
                                        >
                                            <Film size={13} color="#58a6ff" />
                                            <span>Film Ara</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ek Ayar Butonu (Çark Simgesi - Canlı video izle butonunun hemen sağında) */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                            <button 
                                className={`vc-ctrl-btn ${isMoreMenuOpen ? 'active' : ''}`} 
                                onClick={() => { setIsMoreMenuOpen(!isMoreMenuOpen); setIsWatchInputOpen(false); setIsLiveWatchInputOpen(false); }} 
                                title="Oda Ayarları"
                            >
                                <Settings size={22} />
                            </button>
                            {isMoreMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ 
                                    position: 'absolute', 
                                    bottom: '100%', 
                                    right: '0', 
                                    marginBottom: '8px', 
                                    padding: '6px', 
                                    width: 'min(220px, 80vw)',
                                    background: 'rgba(18, 18, 18, 0.98)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
                                    zIndex: 1000,
                                    boxSizing: 'border-box'
                                }}>
                                    <button className={`vc-more-option ${localState.isScreenSharing ? 'active' : ''}`} onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                        <MonitorUp size={15} /> <span>{localState.isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaş'}</span>
                                    </button>
                                    <button className={`vc-more-option ${localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
                                        {localState.isDeafened ? <VolumeX size={15} /> : <Volume2 size={15} />} <span>{localState.isDeafened ? 'Sesi Aç' : 'Sağırlaştır'}</span>
                                    </button>
                                    <button className={`vc-more-option ${hideSelfView ? 'active' : ''}`} onClick={() => { toggleHideSelfView(); setIsMoreMenuOpen(false); }}>
                                        {hideSelfView ? <Eye size={15} /> : <EyeOff size={15} />} <span>{hideSelfView ? 'Kendi Görüntümü Göster' : 'Kamera görüntü penceremi benden gizle'}</span>
                                    </button>
                                    {Capacitor.isNativePlatform() ? (
                                        <>
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SES ÇIKIŞI</div>
                                            <button 
                                                className={`vc-more-option ${nativeAudioRoute?.currentRoute === 'speaker' ? 'active' : ''}`} 
                                                onClick={() => { setAudioOutput('speaker'); setIsMoreMenuOpen(false); }}
                                            >
                                                <Volume2 size={15} /> 
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hoparlör</span>
                                                {nativeAudioRoute?.currentRoute === 'speaker' && <Check size={13} />}
                                            </button>
                                            {nativeAudioRoute?.hasHeadset && (
                                                <button 
                                                    className={`vc-more-option ${nativeAudioRoute?.currentRoute === 'headset' ? 'active' : ''}`} 
                                                    onClick={() => { setAudioOutput('headset'); setIsMoreMenuOpen(false); }}
                                                >
                                                    <Headphones size={15} /> 
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nativeAudioRoute.headsetName || 'Kulaklık'}</span>
                                                    {nativeAudioRoute?.currentRoute === 'headset' && <Check size={13} />}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.length > 0 && (
                                            <>
                                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SES ÇIKIŞI</div>
                                                {availableDevices.audioOutputs.map(d => {
                                                    const isHeadset = d.label?.toLowerCase().includes('headphone') || d.label?.toLowerCase().includes('kulaklık') || d.label?.toLowerCase().includes('headset') || d.label?.toLowerCase().includes('airpods');
                                                    const isSelected = selectedAudioOutput === d.deviceId || (!selectedAudioOutput && d.deviceId === 'default');
                                                    return (
                                                        <button key={d.deviceId} className={`vc-more-option ${isSelected ? 'active' : ''}`} onClick={() => { setAudioOutput(d.deviceId); setIsMoreMenuOpen(false); }}>
                                                            {isHeadset ? <Headphones size={15} /> : <Volume2 size={15} />}
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Hoparlör'}</span>
                                                            {isSelected && <Check size={13} />}
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        <HlsTesterModal
                            isOpen={isHlsModalOpen}
                            onClose={() => setIsHlsModalOpen(false)}
                            onStartWatchParty={(streamUrl) => {
                                startWatchParty(streamUrl, false);
                            }}
                        />

                        {/* Desktop Direct Quick Shortcuts (Screen Share & Deafen) */}
                        {!isMobile && (
                            <>
                                <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'active' : 'danger'}`} onClick={toggleScreenShare} title="Ekran Paylaş">
                                    <MonitorUp size={22} />
                                </button>
                                <button className={`vc-ctrl-btn ${localState.isDeafened ? 'danger' : 'active'}`} onClick={toggleDeafen} title={localState.isDeafened ? "Sesi Aç" : "Sağırlaştır"}>
                                    {localState.isDeafened ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                </button>
                            </>
                        )}
                    </div>


                    <div className="vc-ctrl-section glass-controls leave-section">
                        <button className="vc-ctrl-btn danger leave" onClick={handleLeave} title="Ayrıl">
                            <PhoneOff size={22} />
                        </button>
                    </div>
                </div>
            )}

            {/* Invite Sidebar Modal (Directly in container layout for proper CSS animations) */}
            <div className={`voice-chat-sidebar glass-panel ${isInviteOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <h3>Davet Et</h3>
                    <button className="chat-close-btn icon-btn" onClick={() => setIsInviteOpen(false)} title="Kapat">
                        <X size={20} />
                    </button>
                </div>
                <div className="chat-messages custom-scrollbar" style={{ padding: '14px 12px' }}>
                    <div className="vc-invite-hint">
                        Kullanıcılara dokunarak davet gönderebilirsiniz.
                    </div>
                    {loadingMembers ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Yükleniyor...</div>
                    ) : portalMembers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Davet edilebilecek üye bulunamadı.</div>
                    ) : (
                        <div className="vc-invite-grid">
                            {portalMembers.map(m => {
                                const cooldown = inviteCooldowns[m._id] || 0;
                                const isInvited = cooldown > 0;
                                const displayName = m.profile?.displayName || m.username;
                                const avatarSrc = getImageUrl(m.profile?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

                                return (
                                    <button 
                                        key={m._id}
                                        type="button"
                                        disabled={isInvited}
                                        onClick={() => handleSendInvite(m._id)}
                                        className={`vc-invite-user-card ${isInvited ? 'invited' : ''}`}
                                        title={isInvited ? `${cooldown}s sonra tekrar davet edilebilir` : `${displayName} davet et`}
                                    >
                                        <div className="vc-invite-avatar-wrapper">
                                            <img 
                                                src={avatarSrc} 
                                                alt={displayName} 
                                                className="vc-invite-avatar" 
                                            />
                                            {isInvited && (
                                                <div className="vc-invite-badge">
                                                    <Check size={14} strokeWidth={3} />
                                                    <span className="vc-invite-timer">{cooldown}s</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="vc-invite-username">
                                            {displayName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <VoiceChatSidebar 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                onClose={() => setIsChatOpen(false)} 
                isAdmin={true}
                isOpen={isChatOpen}
            />

            <HlsTesterModal
                isOpen={isHlsModalOpen}
                onClose={() => setIsHlsModalOpen(false)}
                onStartWatchParty={(streamUrl) => {
                    startWatchParty(streamUrl, false);
                }}
            />

            <HlsStreamResolverModalVol2
                isOpen={isHlsVol2ModalOpen}
                onClose={() => setIsHlsVol2ModalOpen(false)}
                onStartWatchParty={(streamUrl) => {
                    startWatchParty(streamUrl, false);
                }}
            />
        </div>
    );
};

export default VoiceChannel;
