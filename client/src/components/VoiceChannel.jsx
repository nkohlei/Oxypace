import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff, Mic, MessageCircle, Video, VideoOff, MonitorUp, PhoneOff, Volume2, RefreshCw, Check, ChevronDown, ChevronUp, VolumeX, Link, Clipboard, X, UserPlus, Radio, Minimize2, Globe, PictureInPicture, Film, Settings, Eye, EyeOff, Headphones, Zap, Sparkles } from 'lucide-react';
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

        const resumePlay = () => {
            if (el && el.srcObject && el.paused) {
                el.play().catch(() => {});
            }
        };

        if (rawTrack && isVideoActive && rawTrack.readyState !== 'ended') {
            el.muted = true;
            el.playsInline = true;
            el.autoplay = true;
            const currentStream = el.srcObject;
            if (currentStream && currentStream.getVideoTracks?.()[0]?.id === rawTrack.id && currentStream.active) {
                resumePlay();
            } else if (typeof rawTrackObj?.attach === 'function') {
                rawTrackObj.attach(el);
            } else {
                el.srcObject = new MediaStream([rawTrack]);
                el.play().catch(e => console.warn("[VoiceChannel] Video play error:", e));
            }
            el.addEventListener('loadedmetadata', resumePlay);
            el.addEventListener('canplay', resumePlay);
            rawTrack.addEventListener?.('unmute', resumePlay);
        } else {
            if (typeof rawTrackObj?.detach === 'function') {
                rawTrackObj.detach(el);
            } else {
                el.srcObject = null;
            }
        }

        return () => {
            el.removeEventListener('loadedmetadata', resumePlay);
            el.removeEventListener('canplay', resumePlay);
            rawTrack?.removeEventListener?.('unmute', resumePlay);
            if (typeof rawTrackObj?.detach === 'function') {
                rawTrackObj.detach(el);
            } else if (el) {
                el.srcObject = null;
            }
        };
    }, [rawTrack?.id, rawTrack?.readyState, participant?.isCameraOn, participant?.isScreenSharing, isShowingScreen, isVideoActive]);

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

const ScreenShareVolumeControl = React.memo(({ identity, volume, onVolumeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const prevVolRef = useRef(1.0);
    const closeTimerRef = useRef(null);

    const scheduleAutoClose = (delay = 3000) => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, delay);
    };

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const currentVol = typeof volume === 'number' ? volume : 1.0;
    const isMuted = currentVol <= 0;

    const handleBtnClick = (e) => {
        e.stopPropagation();
        if (!isOpen) {
            setIsOpen(true);
            scheduleAutoClose(3000);
        } else {
            if (isMuted) {
                const restore = prevVolRef.current > 0 ? prevVolRef.current : 1.0;
                onVolumeChange(identity, restore);
            } else {
                prevVolRef.current = currentVol;
                onVolumeChange(identity, 0);
            }
            scheduleAutoClose(3000);
        }
    };

    const handleSliderChange = (e) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        if (val > 0) prevVolRef.current = val;
        onVolumeChange(identity, val);
        scheduleAutoClose(3000);
    };

    const stopProp = (e) => {
        e.stopPropagation();
        if (isOpen) scheduleAutoClose(3000);
    };

    return (
        <div
            className={`vc-screen-vol-control ${isOpen ? 'open' : ''}`}
            onClick={stopProp}
            onMouseDown={stopProp}
            onTouchStart={stopProp}
            onTouchMove={stopProp}
            onMouseEnter={() => { if (isOpen) scheduleAutoClose(3500); }}
            onMouseLeave={() => { if (isOpen) scheduleAutoClose(1200); }}
        >
            <button
                type="button"
                className={`vc-screen-vol-btn ${isMuted ? 'muted' : ''}`}
                onClick={handleBtnClick}
                title={isOpen ? (isMuted ? 'Ekran Sesini Aç' : 'Ekran Sesini Kapat') : 'Ekran Paylaşımı Sesi'}
                aria-label="Ekran Paylaşımı Sesi"
            >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            {isOpen && (
                <div className="vc-screen-vol-slider-wrap">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={currentVol}
                        onChange={handleSliderChange}
                        className="vc-screen-vol-slider"
                    />
                    <span className="vc-screen-vol-pct">{Math.round(currentVol * 100)}%</span>
                </div>
            )}
        </div>
    );
});

const detectMobileLayout = () => {
    if (typeof window === 'undefined') return false;
    const isCoarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
    return isCoarse ? Math.min(window.innerWidth, window.innerHeight) <= 768 : window.innerWidth <= 768;
};

const VoiceChannel = ({ portalId, channelId, channelName, onBack }) => {
    const { setMobileChannelOpen } = useUI();
    const [isMobile, setIsMobile] = useState(detectMobileLayout);

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
        setUserVolume,
        screenVolumes,
        setScreenVolume,
        callQualityMode,
        setCallQualityMode
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
        // Portal menu toggle button (.sidebar-toggle-btn) must ALWAYS stay visible
        const btn = document.querySelector('.sidebar-toggle-btn');
        if (btn) btn.classList.remove('user-idle-btn');
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

    const hasOpenOverlay = Boolean(
        isChatOpen ||
        isInviteOpen ||
        isVolumeOpen ||
        isMoreMenuOpen ||
        isWatchInputOpen ||
        isMicMenuOpen ||
        isCameraMenuOpen ||
        isHlsModalOpen ||
        isHlsVol2ModalOpen
    );

    // Auto-hide room buttons (desktop & mobile) after 4s of inactivity — portal menu toggle (.sidebar-toggle-btn) stays visible
    useEffect(() => {
        if (!isConnected) {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        if (hasOpenOverlay) {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const scheduleHide = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, 4000);
        };

        const handleActivity = () => {
            setIsIdle(false);
            scheduleHide();
        };

        scheduleHide();
        window.addEventListener('mousemove', handleActivity, { passive: true });
        window.addEventListener('mousedown', handleActivity, { passive: true });
        window.addEventListener('pointerdown', handleActivity, { passive: true });
        window.addEventListener('touchstart', handleActivity, { passive: true });
        window.addEventListener('keydown', handleActivity, { passive: true });

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('pointerdown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('keydown', handleActivity);
        };
    }, [isConnected, hasOpenOverlay]);

    const handleContainerClick = () => {
        if (isVolumeOpen) setIsVolumeOpen(false);
        if (isMoreMenuOpen) setIsMoreMenuOpen(false);
        if (isWatchInputOpen) setIsWatchInputOpen(false);
        if (isMicMenuOpen) setIsMicMenuOpen(false);
        if (isCameraMenuOpen) setIsCameraMenuOpen(false);
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(detectMobileLayout());
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
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
        const baseId = String(p.identity).replace(/-screen$/, '');
        const screenVol = screenVolumes?.[p.identity] ?? screenVolumes?.[baseId] ?? 1.0;
        const avatarUrl = getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=333&color=fff&size=120`;

        return (
            <div key={p.identity} className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`} onClick={handleCardClick}>
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
                {isShowingScreen && (
                    <ScreenShareVolumeControl
                        identity={p.identity}
                        volume={screenVol}
                        onVolumeChange={setScreenVolume}
                    />
                )}
                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <div className="vc-card-indicators">
                        {!isShowingScreen && (
                            p.isMuted
                                ? <div className="vc-indicator muted" title="Mikrofon Kapalı"><MicOff size={13} /></div>
                                : <div className="vc-indicator unmuted" title="Mikrofon Açık"><Mic size={13} /></div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!isActiveRoom) {
        return (
            <div className="vc-container glass-container lobby-bg">
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
        <div className={`vc-container glass-container ${watchParty?.url ? 'vc-has-watchparty' : ''}`} onClick={handleContainerClick}>
            <div className={`vc-top-right-controls ${isIdle && !hasOpenOverlay ? 'vc-controls-idle' : ''}`}>
                <button
                    type="button"
                    className={`vc-ctrl-btn ${isInviteOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsInviteOpen(!isInviteOpen);
                        setIsChatOpen(false);
                        setIsVolumeOpen(false);
                    }}
                    title="Davet Et"
                >
                    <UserPlus size={18} />
                </button>
                <button
                    type="button"
                    className={`vc-ctrl-btn ${isChatOpen ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsChatOpen(!isChatOpen);
                        setIsInviteOpen(false);
                        setIsVolumeOpen(false);
                    }}
                    title="Sohbet"
                >
                    <MessageCircle size={18} />
                    {unreadCount > 0 && (
                        <span className="vc-unread-dot">{unreadCount}</span>
                    )}
                </button>

                {/* Volume & Audio Output Minimal Dropdown */}
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        className={`vc-ctrl-btn ${isVolumeOpen ? 'active' : ''}`}
                        onClick={() => {
                            setIsVolumeOpen((prev) => !prev);
                            setIsChatOpen(false);
                            setIsInviteOpen(false);
                        }}
                        title="Ses ve Çıkış"
                    >
                        {userVolume <= 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {isVolumeOpen && (
                        <div className="vc-volume-dropdown-container">
                            <div className="vc-vol-section">
                                <div className="vc-vol-header">
                                    <span>Ses Düzeyi</span>
                                    <span className="vc-vol-pct">{Math.round((userVolume ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={userVolume}
                                    onChange={(e) => setUserVolume(parseFloat(e.target.value))}
                                    className="vc-volume-slider-input"
                                    aria-label="Ses Düzeyi"
                                />
                            </div>

                            {Capacitor.isNativePlatform() ? (
                                <div className="vc-audio-out-section">
                                    <div className="vc-menu-label">SES ÇIKIŞI</div>
                                    <button
                                        type="button"
                                        className={`vc-more-option ${nativeAudioRoute?.currentRoute === 'speaker' ? 'active' : ''}`}
                                        onClick={() => { setAudioOutput('speaker'); setIsVolumeOpen(false); }}
                                    >
                                        <Volume2 size={14} />
                                        <span className="vc-opt-text">Hoparlör</span>
                                        {nativeAudioRoute?.currentRoute === 'speaker' && <Check size={13} />}
                                    </button>
                                    {nativeAudioRoute?.hasHeadset && (
                                        <button
                                            type="button"
                                            className={`vc-more-option ${nativeAudioRoute?.currentRoute === 'headset' ? 'active' : ''}`}
                                            onClick={() => { setAudioOutput('headset'); setIsVolumeOpen(false); }}
                                        >
                                            <Headphones size={14} />
                                            <span className="vc-opt-text">{nativeAudioRoute.headsetName || 'Kulaklık'}</span>
                                            {nativeAudioRoute?.currentRoute === 'headset' && <Check size={13} />}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.length > 0 && (
                                    <div className="vc-audio-out-section">
                                        <div className="vc-menu-label">SES ÇIKIŞI</div>
                                        {availableDevices.audioOutputs.map((d) => {
                                            const lowerLabel = (d.label || '').toLowerCase();
                                            const isHeadset = lowerLabel.includes('headphone') || lowerLabel.includes('kulaklık') || lowerLabel.includes('headset') || lowerLabel.includes('airpods');
                                            const isSelected = selectedAudioOutput === d.deviceId || (!selectedAudioOutput && d.deviceId === 'default');
                                            return (
                                                <button
                                                    key={d.deviceId}
                                                    type="button"
                                                    className={`vc-more-option ${isSelected ? 'active' : ''}`}
                                                    onClick={() => { setAudioOutput(d.deviceId); setIsVolumeOpen(false); }}
                                                >
                                                    {isHeadset ? <Headphones size={14} /> : <Volume2 size={14} />}
                                                    <span className="vc-opt-text">{d.label || 'Hoparlör'}</span>
                                                    {isSelected && <Check size={13} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Picture-in-Picture Button (4th top-right button; HLS & Vol2 buttons temporarily shelved) */}
                <button
                    type="button"
                    className="vc-ctrl-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerDocumentPiP();
                    }}
                    title="Yüzen Pencere (PiP)"
                >
                    <PictureInPicture size={18} />
                </button>
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
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, background: 'transparent' }} />
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
                <div className={`vc-controls ${isIdle && !hasOpenOverlay ? 'vc-controls-idle' : ''}`}>
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

                        {/* Unified Media & Live Stream Watch Party Button */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={`vc-ctrl-btn ${watchParty?.url ? 'active' : ''}`}
                                onClick={() => {
                                    setIsWatchInputOpen(!isWatchInputOpen);
                                    setIsMoreMenuOpen(false);
                                    setIsVolumeOpen(false);
                                }}
                                title="Birlikte İzle (Video / Canlı Yayın)"
                            >
                                <Link size={20} />
                            </button>
                        </div>

                        {/* Compact Settings Menu (Audio Output moved to Top-Right Volume Menu; zero emojis) */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={`vc-ctrl-btn ${isMoreMenuOpen ? 'menu-open' : ''}`}
                                onClick={() => {
                                    setIsMoreMenuOpen(!isMoreMenuOpen);
                                    setIsWatchInputOpen(false);
                                    setIsVolumeOpen(false);
                                }}
                                title="Oda Ayarları"
                            >
                                <Settings size={20} />
                            </button>
                            {isMoreMenuOpen && (
                                <div className="vc-settings-dropdown vc-compact-settings-menu">
                                    <button type="button" className={`vc-more-option ${localState.isScreenSharing ? 'active' : ''}`} onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                        <MonitorUp size={14} />
                                        <span className="vc-opt-text">{localState.isScreenSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}</span>
                                    </button>
                                    <button type="button" className={`vc-more-option ${localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
                                        {localState.isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                        <span className="vc-opt-text">{localState.isDeafened ? 'Sesi Aç' : 'Sağırlaştır'}</span>
                                    </button>
                                    <button type="button" className={`vc-more-option ${hideSelfView ? 'active' : ''}`} onClick={() => { toggleHideSelfView(); setIsMoreMenuOpen(false); }}>
                                        {hideSelfView ? <Eye size={14} /> : <EyeOff size={14} />}
                                        <span className="vc-opt-text">{hideSelfView ? 'Kendimi Göster' : 'Kendimi Gizle'}</span>
                                    </button>
                                    <div className="vc-menu-divider" />
                                    <div className="vc-menu-label">KALİTE</div>
                                    <button
                                        type="button"
                                        className={`vc-more-option ${callQualityMode === 'saver' ? 'active' : ''}`}
                                        onClick={() => { setCallQualityMode('saver'); setIsMoreMenuOpen(false); }}
                                    >
                                        <Zap size={14} />
                                        <span className="vc-opt-text">Veri Tasarrufu</span>
                                        {callQualityMode === 'saver' && <Check size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        className={`vc-more-option ${callQualityMode === 'high' ? 'active' : ''}`}
                                        onClick={() => { setCallQualityMode('high'); setIsMoreMenuOpen(false); }}
                                    >
                                        <Sparkles size={14} />
                                        <span className="vc-opt-text">Yüksek (HD)</span>
                                        {callQualityMode === 'high' && <Check size={13} />}
                                    </button>
                                </div>
                            )}
                        </div>

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

            {/* Centered Unified Watch Party URL Popover (never overflows viewport) */}
            {isConnected && isWatchInputOpen && (
                <div className="vc-watch-popover" onClick={(e) => e.stopPropagation()}>
                    <div className="vc-watch-popover-header">
                        <div className="vc-watch-popover-title">
                            <Link size={14} />
                            <span>Birlikte İzle</span>
                        </div>
                        <button
                            type="button"
                            className="vc-watch-close-btn"
                            onClick={() => setIsWatchInputOpen(false)}
                            title="Kapat"
                            aria-label="Kapat"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="vc-watch-input-row">
                        <input
                            type="text"
                            className="vc-watch-url-input"
                            placeholder="Video veya canlı yayın URL..."
                            value={watchUrl}
                            onChange={(e) => setWatchUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && watchUrl.trim()) {
                                    startWatchParty(watchUrl.trim());
                                    setIsWatchInputOpen(false);
                                }
                            }}
                        />
                        {watchUrl && (
                            <button
                                type="button"
                                className="vc-watch-clear-btn"
                                onClick={() => setWatchUrl('')}
                                title="Temizle"
                                aria-label="Temizle"
                            >
                                <X size={13} />
                            </button>
                        )}
                        <button
                            type="button"
                            className="vc-watch-paste-btn"
                            onClick={() => handlePasteToInput(setWatchUrl)}
                            title="Panodan Yapıştır"
                        >
                            <Clipboard size={12} />
                            <span>Yapıştır</span>
                        </button>
                    </div>

                    <div className="vc-watch-actions">
                        <button
                            type="button"
                            className="vc-watch-start-btn"
                            onClick={() => {
                                if (watchUrl.trim()) {
                                    startWatchParty(watchUrl.trim());
                                    setIsWatchInputOpen(false);
                                }
                            }}
                            disabled={!watchUrl.trim()}
                        >
                            Başlat
                        </button>
                        <button
                            type="button"
                            className="vc-watch-film-btn"
                            onClick={() => {
                                setIsHlsVol2ModalOpen(true);
                                setIsWatchInputOpen(false);
                            }}
                            title="Film Oynatıcı"
                        >
                            <Film size={13} />
                            <span>Film</span>
                        </button>
                        {!!window.desktopAPI && (
                            <button
                                type="button"
                                className="vc-watch-film-btn"
                                onClick={() => {
                                    const urlVal = watchUrl.trim();
                                    const isStream = urlVal.toLowerCase().includes('.txt') || urlVal.toLowerCase().includes('.m3u8') || urlVal.toLowerCase().includes('/hls/') || urlVal.toLowerCase().includes('manifest');
                                    window.desktopAPI.openFilmBrowser((!urlVal || isStream) ? 'https://www.hdfilmcehennemi.life/' : urlVal);
                                    setIsWatchInputOpen(false);
                                }}
                                title="Tarayıcıda Aç"
                            >
                                <Globe size={13} />
                                <span>Aç</span>
                            </button>
                        )}
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
                onStartWatchParty={(streamUrl, isLive = false, subtitles = [], title = '') => {
                    startWatchParty(streamUrl, !!isLive, subtitles || [], title || '');
                }}
            />
        </div>
    );
};

export default VoiceChannel;
