import React, { useState, useEffect, useRef } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff, Mic, MessageCircle, Video, VideoOff, MonitorUp, PhoneOff, Volume2, RefreshCw, Check, ChevronDown, ChevronUp, VolumeX, Link, Clipboard, X, UserPlus, Radio, Minimize2, Globe, PictureInPicture } from 'lucide-react';
import WatchPartyPlayer from './WatchPartyPlayer';
import { HlsTesterModal } from './HlsTesterModal';
import { useUI } from '../context/UIContext';
import './VoiceChannel.css';

const VideoRenderer = ({ track, isLocal, className, identity }) => {
    const videoEl = React.useRef(null);

    React.useEffect(() => {
        const el = videoEl.current;
        if (el && track) {
            track.attach(el);
        }
        return () => {
            if (track) {
                track.detach();
            }
        };
    }, [track]);

    // Live frame capture for the transparent overlay window (Electron only)
    React.useEffect(() => {
        if (!window.desktopAPI || !track) return; // Allow both local and remote feeds

        let active = true;
        let timer = null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const captureFrame = () => {
            if (!active || !videoEl.current) return;
            const video = videoEl.current;

            // Only capture if document is visible and video has valid dimensions
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
            // Capture frame at optimized 150ms interval (~6.6 fps for lightweight overlay thumbnails)
            timer = setTimeout(captureFrame, 150);
        };

        captureFrame();

        return () => {
            active = false;
            if (timer) clearTimeout(timer);
            window.desktopAPI.sendVideoFrame({ identity, frame: null });
        };
    }, [track, identity]);



    return (
        <video 
            ref={videoEl} 
            className={className} 
            autoPlay 
            muted={true} 
            playsInline 
        />
    );
};



const VoiceChannel = ({ portalId, channelId, channelName }) => {
    const handleTriggerDocumentPiP = () => {
        window.dispatchEvent(new CustomEvent('triggerDocumentPiP'));
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

    const { setMobileChannelOpen } = useUI();

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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

    const handleJoin = () => connectToChannel(portalId, channelId);
    const handleLeave = () => { disconnectFromChannel(); setFocusedIdentity(null); };
    const handleFocus = (identity) => setFocusedIdentity(focusedIdentity === identity ? null : identity);

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
        const isShowingScreen = p.isScreenSharing;
        const trackToRender = isShowingScreen ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);
        const avatarUrl = getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=333&color=fff&size=120`;
        const shouldAttachVideo = !isShowingScreen || p.isLocal || watchStreamAccepted;

        return (
            <div key={`${p.identity}-${role}`} className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`} onClick={handleCardClick}>
                <div className="vc-card-video-area">
                    <div className="vc-avatar-blur-bg" style={{ backgroundImage: `url(${avatarUrl})` }} />
                    {trackToRender && shouldAttachVideo ? (
                        <VideoRenderer 
                            className={`vc-card-video ${isShowingScreen ? 'vc-screenshare-video-contained' : ''}`} 
                            track={trackToRender} 
                            isLocal={p.isLocal} 
                            identity={p.identity}
                        />

                    ) : (
                        isShowingScreen ? (
                            <div className="vc-screenshare-placeholder-bg-mobile">
                                <div className="vc-card-avatar-area">
                                    <img className="vc-card-avatar" src={avatarUrl} alt="" />
                                </div>
                            </div>
                        ) : (
                            <div className="vc-card-avatar-area">
                                <img className="vc-card-avatar" src={avatarUrl} alt="" />
                            </div>
                        )
                    )}

                    {isShowingScreen && !p.isLocal && (
                        <div className={`vc-screenshare-overlay-mobile ${watchStreamAccepted ? 'hidden' : ''}`}>
                            <div className="vc-screenshare-overlay-content">
                                <MonitorUp size={32} style={{ marginBottom: '8px', color: '#00d2ff' }} />
                                <span className="vc-screenshare-overlay-text">
                                    {p.name} ekran paylaşıyor
                                </span>
                                <button 
                                    className="vc-watch-stream-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setWatchStreamAccepted(true);
                                    }}
                                >
                                    Yayını İzle
                                </button>
                            </div>
                        </div>
                    )}
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

                    {/* Minimalist Silver Dark Join CTA */}
                    <button className="vc-lobby-join-btn" onClick={handleJoin}>
                        <span>Aramaya Katıl</span>
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
    const focusedParticipant = (activeFocusIdentity && participants.length > 1) ? participants.find(p => p.identity === activeFocusIdentity) : null;

    const carouselItemsCount = (watchParty && watchParty.url) 
        ? participants.length 
        : (focusedParticipant ? participants.length - 1 : 0);
    const carouselClass = carouselItemsCount >= 4 ? 'grid-multi' : 'grid-single';
    const gridClass = (focusedParticipant || (watchParty && watchParty.url)) ? 'layout-spotlight' : `layout-dynamic grid-${Math.min(participants.length, 4)}`;

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
                    onClick={() => setIsHlsModalOpen(true)} 
                    title="HLS Oynatıcı & Çözücü Modalını Aç"
                    style={{ background: 'rgba(168, 85, 247, 0.25)', borderColor: 'rgba(168, 85, 247, 0.6)' }}
                >
                    <Radio size={18} color="#c084fc" />
                </button>

                {/* Mobile More Menu Trigger (Arrow) */}
                {isMobile && (
                    <div style={{ position: 'relative' }}>
                        <button className={`vc-ctrl-btn ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} title="Daha Fazla">
                            <ChevronDown size={20} />
                        </button>
                        {isMoreMenuOpen && (
                            <div className="vc-more-dropdown glass-panel">
                                <button className="vc-more-option" onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                    <MonitorUp size={16} /> <span>Ekran Paylaş</span>
                                </button>
                                <button className={`vc-more-option ${localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
                                    {localState.isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />} <span>{localState.isDeafened ? 'Sesi Aç' : 'Sağırlaştır'}</span>
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px' }}>HOPARLÖR</div>
                                {Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.map(d => (
                                    <button key={d.deviceId} className={`vc-more-option ${selectedAudioOutput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioOutput(d.deviceId); setIsMoreMenuOpen(false); }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label || 'Hoparlör'}</span>
                                        {selectedAudioOutput === d.deviceId && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`vc-viewport ${gridClass}`} style={{ marginTop: '0px', position: 'relative' }}>
                {watchParty && watchParty.url && (
                    <div 
                        id="watch-party-portal-placeholder" 
                        className={focusedParticipant ? 'watch-party-target-carousel' : 'watch-party-target-hero'}
                        onClick={focusedParticipant ? () => setFocusedIdentity(null) : undefined}
                        title={focusedParticipant ? "Videoyu Ana Ekrana Al" : undefined}
                        style={{
                            cursor: focusedParticipant ? 'pointer' : 'default',
                            pointerEvents: focusedParticipant ? 'auto' : 'none'
                        }}
                    >
                        {focusedParticipant && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'transparent' }} />
                        )}
                    </div>
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
                                    className="watch-party-placeholder-card" 
                                    style={{ height: '160px', marginBottom: '8px', opacity: 0, pointerEvents: 'none', width: '100%', flexShrink: 0 }} 
                                />
                            )}
                            {participants.filter(p => !focusedParticipant || p.identity !== focusedParticipant.identity).map(p => 
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
                                {participants.filter(p => p.identity !== activeFocusIdentity).map(p => 
                                    renderParticipantCard(p, 'carousel', () => handleFocus(p.identity))
                                )}
                            </div>
                        )}
                        <div className="vc-hero">
                            {focusedParticipant ? (
                                renderParticipantCard(focusedParticipant, 'hero', () => handleFocus(focusedParticipant.identity))
                            ) : (
                                <div className={`vc-grid grid-${Math.min(participants.length, 4)}`}>
                                    {participants.map(p => 
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
                            <button className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`} onClick={() => setIsMicMenuOpen(!isMicMenuOpen)}><ChevronUp size={16} /></button>
                            {isMicMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>MİKROFON</div>
                                    {Array.isArray(availableDevices?.audioInputs) && availableDevices.audioInputs.map(d => (
                                        <div key={d.deviceId} className={`vc-device-option ${selectedAudioInput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioInput(d.deviceId); setIsMicMenuOpen(false); }}>
                                            <span>{d.label || 'Mikrofon'}</span>
                                            {selectedAudioInput === d.deviceId && <Check size={12} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Camera */}
                        <div className="vc-ctrl-group">
                            <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'active' : 'danger'}`} onClick={toggleCamera}>
                                {localState.isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                            </button>
                            <button className={`vc-device-arrow ${isCameraMenuOpen ? 'active' : ''}`} onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}><ChevronUp size={16} /></button>
                            {isCameraMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>KAMERA</div>
                                    {Array.isArray(availableDevices?.videoInputs) && availableDevices.videoInputs.map(d => (
                                        <div key={d.deviceId} className={`vc-device-option ${selectedVideoInput === d.deviceId ? 'active' : ''}`} onClick={() => { setVideoInput(d.deviceId); setIsCameraMenuOpen(false); }}>
                                            <span>{d.label || 'Kamera'}</span>
                                            {selectedVideoInput === d.deviceId && <Check size={12} />}
                                        </div>
                                    ))}
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
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
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', padding: '12px', minWidth: '320px', display: 'flex', gap: '8px' }}>
                                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            placeholder="YouTube, MP4 linki veya Video ID yapıştırın..." 
                                            value={watchUrl} 
                                            onChange={(e) => setWatchUrl(e.target.value)}
                                            style={{ width: '100%', padding: '6px 28px 6px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '12px' }}
                                        />
                                        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                                            <button 
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const text = await navigator.clipboard.readText();
                                                        setWatchUrl(text);
                                                    } catch (err) {
                                                        console.warn("Could not paste from clipboard", err);
                                                    }
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Yapıştır"
                                            >
                                                <Clipboard size={12} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setWatchUrl('')}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Temizle"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (watchUrl.trim()) {
                                                startWatchParty(watchUrl.trim(), false);
                                                setIsWatchInputOpen(false);
                                            }
                                        }}
                                        className="chat-send-btn glass-btn active"
                                        style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                                    >
                                        Başlat
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
                                            className="chat-send-btn glass-btn"
                                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                                            title="Film sitesini açıp oynatılan videoyu yakalayın"
                                        >
                                            <Globe size={14} /> Film Aç
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Canlı Yayın Watch Party Button */}
                        <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                            <button className={`vc-ctrl-btn ${watchParty?.url && watchParty?.isLive ? 'active' : ''}`} onClick={() => { setIsLiveWatchInputOpen(!isLiveWatchInputOpen); setIsWatchInputOpen(false); }} title="Birlikte Canlı Yayın İzle">
                                <Radio size={22} color={watchParty?.url && watchParty?.isLive ? '#ffffff' : '#10b981'} />
                            </button>
                            {isLiveWatchInputOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', padding: '12px', minWidth: '320px', display: 'flex', gap: '8px' }}>
                                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Canlı Yayın Linki (.m3u8 veya .mpd) yapıştırın..." 
                                            value={liveWatchUrl} 
                                            onChange={(e) => setLiveWatchUrl(e.target.value)}
                                            style={{ width: '100%', padding: '6px 28px 6px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '12px' }}
                                        />
                                        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                                            <button 
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const text = await navigator.clipboard.readText();
                                                        setLiveWatchUrl(text);
                                                    } catch (err) {
                                                        console.warn("Could not paste from clipboard", err);
                                                    }
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Yapıştır"
                                            >
                                                <Clipboard size={12} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setLiveWatchUrl('')}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Temizle"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (liveWatchUrl.trim()) {
                                                startWatchParty(liveWatchUrl.trim(), true);
                                                setIsLiveWatchInputOpen(false);
                                            }
                                        }}
                                        className="chat-send-btn glass-btn active"
                                        style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                                    >
                                        Başlat
                                    </button>
                                    <button 
                                        onClick={() => setIsHlsModalOpen(true)}
                                        className="chat-send-btn glass-btn active"
                                        style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Radio size={14} /> HLS Oynatıcı
                                    </button>
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

                        {/* Desktop Specific Controls (Screen Share & Deafen) */}
                        {!isMobile && (
                            <>
                                <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'active' : 'danger'}`} onClick={toggleScreenShare} title="Ekran Paylaş">
                                    <MonitorUp size={22} />
                                </button>
                                <div className="vc-ctrl-group">
                                    <button className={`vc-ctrl-btn ${localState.isDeafened ? 'danger' : 'active'}`} onClick={toggleDeafen}>
                                        {localState.isDeafened ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                    </button>
                                    <button className={`vc-device-arrow ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}><ChevronUp size={16} /></button>
                                    {isMoreMenuOpen && (
                                        <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', right: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>HOPARLÖR</div>
                                            {Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.map(d => (
                                                <div key={d.deviceId} className={`vc-device-option ${selectedAudioOutput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioOutput(d.deviceId); setIsMoreMenuOpen(false); }}>
                                                    <span>{d.label || 'Hoparlör'}</span>
                                                    {selectedAudioOutput === d.deviceId && <Check size={12} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
        </div>
    );
};

export default VoiceChannel;
