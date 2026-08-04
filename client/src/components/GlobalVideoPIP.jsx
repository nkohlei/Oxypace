import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Volume2, VolumeX, Shield, Crown, UserPlus, MessageCircle, X, MonitorUp, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './GlobalVideoPIP.css';

// Standalone VideoRenderer outside main component scope to guarantee zero DOM re-creations / unmounts
const VideoRenderer = React.memo(({ participant, className }) => {
    const videoRef = useRef(null);
    const rawTrackObj = participant?.screenShareTrack || participant?.videoTrack;
    const rawTrack = rawTrackObj?.track || rawTrackObj;

    useEffect(() => {
        const el = videoRef.current;
        if (el && rawTrack && (participant?.isCameraOn || participant?.isScreenSharing)) {
            const currentStream = el.srcObject;
            if (currentStream && currentStream.getVideoTracks()[0]?.id === rawTrack.id) {
                return;
            }

            if (rawTrackObj?.attach) {
                rawTrackObj.attach(el);
            } else {
                el.srcObject = new MediaStream([rawTrack]);
                el.play().catch(e => console.warn("[PiP] Video play error:", e));
            }
        }
    }, [rawTrack?.id, participant?.isCameraOn, participant?.isScreenSharing]);

    if ((participant?.isCameraOn || participant?.isScreenSharing) && rawTrack) {
        return (
            <video 
                ref={videoRef} 
                className={className} 
                autoPlay 
                playsInline 
                muted={true} 
            />
        );
    }

    return (
        <div className={`${className} pip-avatar-placeholder`}>
            <img 
                src={getImageUrl(participant?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant?.name || '')}&background=1e293b&color=fff`} 
                alt="" 
            />
        </div>
    );
});

const GlobalVideoPIP = () => {
    const { user } = useAuth();
    const {
        activeRoom,
        connectionState,
        participants,
        localState,
        toggleMicrophone,
        toggleCamera,
        toggleScreenShare,
        disconnectFromChannel,
        toggleDeafen,
        chatMessages,
        sendChatMessage,
        userVolume,
        setUserVolume
    } = useVoice();

    const location = useLocation();
    const navigate = useNavigate();

    const [isMinimized, setIsMinimized] = useState(false);
    const [manualFocusId, setManualFocusId] = useState(null);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [showControls, setShowControls] = useState(true);
    const [isInNativePiP, setIsInNativePiP] = useState(false);
    const [pipContainer, setPipContainer] = useState(null);
    const [isDocumentPiPActive, setIsDocumentPiPActive] = useState(false);

    // Popover states for right-top buttons in PiP
    const [isPipInviteOpen, setIsPipInviteOpen] = useState(false);
    const [isPipChatOpen, setIsPipChatOpen] = useState(false);
    const [isPipVolumeOpen, setIsPipVolumeOpen] = useState(false);
    const [chatInputText, setChatInputText] = useState('');

    // Custom participant reordering state
    const [customOrder, setCustomOrder] = useState([]);

    const moveParticipant = (identity, direction) => {
        const currentIdentities = orderedParticipants.map(p => p.identity);
        const index = currentIdentities.indexOf(identity);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentIdentities.length) return;

        const newOrder = [...currentIdentities];
        const [movedItem] = newOrder.splice(index, 1);
        newOrder.splice(targetIndex, 0, movedItem);
        setCustomOrder(newOrder);
    };

    // Sort participants according to custom order preference if available
    const orderedParticipants = React.useMemo(() => {
        if (!customOrder || customOrder.length === 0) return participants;
        const copy = [...participants];
        return copy.sort((a, b) => {
            const indexA = customOrder.indexOf(a.identity);
            const indexB = customOrder.indexOf(b.identity);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
    }, [participants, customOrder]);

    // Member invite & search states
    const [portalMembers, setPortalMembers] = useState([]);
    const [inviteSearchQuery, setInviteSearchQuery] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [invitedUserIds, setInvitedUserIds] = useState([]);

    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const startPosition = useRef({ x: 0, y: 0 });
    const startTime = useRef(0);
    const controlsTimeout = useRef(null);
    const pipWindowRef = useRef(null);

    const isConnected = !!activeRoom;

    // Fetch portal members for direct invitation when invite popover opens
    useEffect(() => {
        if (isPipInviteOpen && activeRoom?.portalId) {
            setLoadingMembers(true);
            axios.get(`/api/portals/${activeRoom.portalId}`)
                .then(res => {
                    const rawMembers = res.data?.members || res.data?.portal?.members || [];
                    const currentUserId = user?._id?.toString();
                    // Handle both populated user objects and raw member objects
                    const extracted = rawMembers.map(m => m.user || m).filter(u => u && (u._id?.toString() !== currentUserId && u.id?.toString() !== currentUserId));
                    setPortalMembers(extracted);
                })
                .catch(err => console.error("[PiP Invite] Fetch members error:", err))
                .finally(() => setLoadingMembers(false));
        }
    }, [isPipInviteOpen, activeRoom?.portalId, user]);

    const handleSendDirectInvite = async (targetUserId) => {
        if (!activeRoom?.portalId || !activeRoom?.channelId) return;
        try {
            await axios.post('/api/voice/invite', {
                portalId: activeRoom.portalId,
                channelId: activeRoom.channelId,
                targetUserIds: [targetUserId]
            });
            setInvitedUserIds(prev => [...prev, targetUserId]);
        } catch (error) {
            console.error("[PiP Invite] Send invite error:", error);
        }
    };

    const copyStylesToDocument = (targetDoc) => {
        [...document.styleSheets].forEach((styleSheet) => {
            try {
                if (styleSheet.cssRules) {
                    const newStyle = targetDoc.createElement('style');
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    newStyle.textContent = cssRules;
                    targetDoc.head.appendChild(newStyle);
                }
            } catch (e) {
                if (styleSheet.href) {
                    const link = targetDoc.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    targetDoc.head.appendChild(link);
                }
            }
        });
    };

    const openDocumentPiPWindow = async () => {
        if (!('documentPictureInPicture' in window) || pipWindowRef.current || isDocumentPiPActive) return;

        try {
            const pipWin = await window.documentPictureInPicture.requestWindow({
                width: 280,
                height: 440
            });

            pipWindowRef.current = pipWin;
            copyStylesToDocument(pipWin.document);

            pipWin.addEventListener('pagehide', () => {
                pipWindowRef.current = null;
                setPipContainer(null);
                setIsDocumentPiPActive(false);
            });

            const container = pipWin.document.createElement('div');
            container.id = 'pip-portal-root';
            container.style.width = '100%';
            container.style.height = '100%';
            pipWin.document.body.appendChild(container);
            pipWin.document.body.style.margin = '0';
            pipWin.document.body.style.overflow = 'hidden';
            pipWin.document.body.style.backgroundColor = '#070a12';

            setPipContainer(container);
            setIsDocumentPiPActive(true);
        } catch (err) {
            console.error('[DocumentPiP] Failed to open window:', err);
        }
    };

    useEffect(() => {
        const handleManualPipTrigger = () => {
            openDocumentPiPWindow();
        };

        window.addEventListener('triggerDocumentPiP', handleManualPipTrigger);
        return () => {
            window.removeEventListener('triggerDocumentPiP', handleManualPipTrigger);
        };
    }, [isDocumentPiPActive]);

    useEffect(() => {
        if (!isConnected && pipWindowRef.current) {
            pipWindowRef.current.close();
            pipWindowRef.current = null;
            setPipContainer(null);
            setIsDocumentPiPActive(false);
        }
    }, [isConnected]);

    useEffect(() => {
        const handlePipChange = (e) => {
            if (e.detail && typeof e.detail.isInPiP !== 'undefined') {
                setIsInNativePiP(e.detail.isInPiP);
                if (e.detail.isInPiP) {
                    setIsMinimized(false);
                }
            }
        };
        window.addEventListener('pipModeChanged', handlePipChange);
        return () => window.removeEventListener('pipModeChanged', handlePipChange);
    }, []);

    const triggerControlsShow = () => {
        if (isInNativePiP) return;
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (!isPipInviteOpen && !isPipChatOpen && !isPipVolumeOpen) {
                setShowControls(false);
            }
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        };
    }, []);

    const shouldShow = isConnected && (
        (Capacitor.isNativePlatform() && isInNativePiP) || 
        isDocumentPiPActive
    );

    if (!shouldShow) return null;

    const mainUser = participants.find(p => p.isSpeaking && !p.isLocal) || participants[0];

    const constrainPosition = (x, y) => {
        const minX = 10;
        const maxX = window.innerWidth - (isMinimized ? 80 : 280);
        const minY = 10;
        const maxY = window.innerHeight - (isMinimized ? 80 : 440);
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    };

    const handleMouseDown = (e) => {
        if (isInNativePiP) return;
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-header-actions') || e.target.closest('.pip-popover')) return;
        isDragging.current = true;
        startTime.current = Date.now();
        startPosition.current = { x: e.clientX, y: e.clientY };
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        setPosition(constrainPosition(newX, newY));
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e) => {
        if (isInNativePiP) return;
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-header-actions') || e.target.closest('.pip-popover')) return;
        isDragging.current = true;
        startTime.current = Date.now();
        const touch = e.touches[0];
        startPosition.current = { x: touch.clientX, y: touch.clientY };
        dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.current.x;
        const newY = touch.clientY - dragStart.current.y;
        setPosition(constrainPosition(newX, newY));
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    const windowStyle = (isInNativePiP || isDocumentPiPActive) ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        border: 'none',
        background: '#070a12',
        zIndex: 99999
    } : { left: `${position.x}px`, top: `${position.y}px` };

    const showOverlayControls = showControls && !isInNativePiP;

    const handleDisconnectAction = (e) => {
        if (e) e.stopPropagation();
        disconnectFromChannel();
        if (pipWindowRef.current) {
            pipWindowRef.current.close();
        }
    };

    const handleSendChatSubmit = (e) => {
        e.preventDefault();
        if (chatInputText.trim()) {
            sendChatMessage(chatInputText.trim());
            setChatInputText('');
        }
    };

    const searchedMembers = portalMembers.filter(m => {
        const query = inviteSearchQuery.toLowerCase().trim();
        if (!query) return true;
        const name = (m.profile?.displayName || m.username || '').toLowerCase();
        return name.includes(query);
    });

    const content = (
        <div 
            className={`global-video-pip-window vertical-mode ${isMinimized ? 'minimized' : ''} ${showOverlayControls ? 'show-controls' : ''} ${isInNativePiP ? 'native-pip' : ''} ${isDocumentPiPActive ? 'document-pip' : ''}`}
            style={windowStyle}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onMouseMove={triggerControlsShow}
        >
            {isMinimized ? (
                <div className="pip-bubble">
                    <div className="pip-bubble-avatar-wrapper">
                        <img 
                            src={getImageUrl(mainUser?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(mainUser?.name || 'Group')}&background=1e293b&color=fff`} 
                            alt="" 
                            className={`pip-bubble-avatar ${mainUser?.isSpeaking ? 'speaking' : ''}`} 
                        />
                        {participants.length > 1 && (
                            <span className="pip-badge-count">{participants.length}</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="pip-full-content vertical-pip-content">
                    {!isInNativePiP && (
                        <div className="pip-header">
                            <div className="pip-header-info">
                                <span className="pip-title">{activeRoom?.channelName || 'Canlı Oda'}</span>
                                <span className="pip-subtitle">{participants.length} katılımcı</span>
                            </div>
                            
                            <div className="pip-header-actions">
                                <button 
                                    className={`pip-header-btn ${isPipInviteOpen ? 'active' : ''}`} 
                                    onClick={() => { setIsPipInviteOpen(!isPipInviteOpen); setIsPipChatOpen(false); setIsPipVolumeOpen(false); }} 
                                    title="Davet Et"
                                >
                                    <UserPlus size={14} />
                                </button>
                                <button 
                                    className={`pip-header-btn ${isPipChatOpen ? 'active' : ''}`} 
                                    onClick={() => { setIsPipChatOpen(!isPipChatOpen); setIsPipInviteOpen(false); setIsPipVolumeOpen(false); }} 
                                    title="Sohbet"
                                >
                                    <MessageCircle size={14} />
                                </button>
                                <button 
                                    className={`pip-header-btn ${isPipVolumeOpen ? 'active' : ''}`} 
                                    onClick={() => { setIsPipVolumeOpen(!isPipVolumeOpen); setIsPipChatOpen(false); setIsPipInviteOpen(false); }} 
                                    title="Ses Düzeyi"
                                >
                                    <Volume2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Davet Popover */}
                    {isPipInviteOpen && (
                        <div className="pip-popover invite-popover">
                            <div className="pip-popover-header">
                                <span>Kullanıcı Davet Et</span>
                                <button onClick={() => setIsPipInviteOpen(false)}><X size={12} /></button>
                            </div>
                            <div className="pip-search-box">
                                <Search size={12} color="#94a3b8" />
                                <input 
                                    type="text"
                                    placeholder="Kullanıcı ara..."
                                    value={inviteSearchQuery}
                                    onChange={(e) => setInviteSearchQuery(e.target.value)}
                                />
                                {inviteSearchQuery && (
                                    <button onClick={() => setInviteSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <div className="pip-member-list custom-scrollbar">
                                {loadingMembers ? (
                                    <div className="pip-popover-status">Yükleniyor...</div>
                                ) : searchedMembers.length === 0 ? (
                                    <div className="pip-popover-status">Üye bulunamadı.</div>
                                ) : (
                                    searchedMembers.map(m => {
                                        const isInvited = invitedUserIds.includes(m._id);
                                        const name = m.profile?.displayName || m.username;
                                        return (
                                            <div key={m._id} className="pip-member-item">
                                                <div className="pip-member-info">
                                                    <img src={getImageUrl(m.profile?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`} alt="" />
                                                    <span>{name}</span>
                                                </div>
                                                <button 
                                                    disabled={isInvited}
                                                    onClick={() => handleSendDirectInvite(m._id)}
                                                    className={`pip-invite-btn ${isInvited ? 'invited' : ''}`}
                                                >
                                                    {isInvited ? 'Davet Edildi' : 'Davet Et'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat Popover */}
                    {isPipChatOpen && (
                        <div className="pip-popover chat-popover">
                            <div className="pip-popover-header">
                                <span>Canlı Sohbet</span>
                                <button onClick={() => setIsPipChatOpen(false)}><X size={12} /></button>
                            </div>
                            <div className="pip-chat-messages custom-scrollbar">
                                {chatMessages && chatMessages.length > 0 ? (
                                    chatMessages.map((m, idx) => (
                                        <div key={m.id || idx} className="pip-chat-msg">
                                            <strong>{m.senderName}: </strong>
                                            <span>{m.text}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '10px' }}>Henüz mesaj yok</div>
                                )}
                            </div>
                            <form onSubmit={handleSendChatSubmit} className="pip-chat-input-row">
                                <input 
                                    type="text" 
                                    placeholder="Mesaj yazın..." 
                                    value={chatInputText} 
                                    onChange={(e) => setChatInputText(e.target.value)} 
                                />
                                <button type="submit">Gönder</button>
                            </form>
                        </div>
                    )}

                    {/* Ses Seviyesi Popover */}
                    {isPipVolumeOpen && (
                        <div className="pip-popover volume-popover">
                            <div className="pip-popover-header">
                                <span>Kullanıcı Ses Düzeyi</span>
                                <button onClick={() => setIsPipVolumeOpen(false)}><X size={12} /></button>
                            </div>
                            <div className="pip-popover-body" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Volume2 size={14} color="#94a3b8" />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={userVolume} 
                                    onChange={(e) => {
                                        const vol = parseFloat(e.target.value);
                                        setUserVolume(vol);
                                    }} 
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '10px', color: 'white', minWidth: '28px', textAlign: 'right' }}>{Math.round(userVolume * 100)}%</span>
                            </div>
                        </div>
                    )}

                    <div className="pip-vertical-participants-container custom-scrollbar">
                        {orderedParticipants.length > 0 ? (
                            orderedParticipants.map((p, idx) => (
                                <div 
                                    key={p.identity} 
                                    className={`pip-participant-card ${p.isSpeaking ? 'speaking' : ''} ${p.isLocal ? 'local' : ''}`}
                                >
                                    <VideoRenderer participant={p} className="pip-participant-video" />
                                    
                                    <div className="pip-order-controls">
                                        {idx > 0 && (
                                            <button className="pip-order-btn" onClick={() => moveParticipant(p.identity, 'up')} title="Yukarı Taşı">
                                                <ChevronUp size={10} />
                                            </button>
                                        )}
                                        {idx < orderedParticipants.length - 1 && (
                                            <button className="pip-order-btn" onClick={() => moveParticipant(p.identity, 'down')} title="Aşağı Taşı">
                                                <ChevronDown size={10} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="pip-participant-minimal-badge">
                                        <span className="pip-participant-name-text">
                                            {p.name} {p.isLocal && '(Sen)'}
                                        </span>
                                        {p.role === 'owner' && <Crown size={10} className="role-icon owner" />}
                                        {p.role === 'admin' && <Shield size={10} className="role-icon admin" />}
                                        {p.isMuted ? <MicOff size={10} className="status-icon muted" /> : <Mic size={10} className="status-icon active" />}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="pip-empty">Oda boş</div>
                        )}
                    </div>

                    {!isInNativePiP && (
                        <div className="pip-controls vertical-controls">
                            <button 
                                className={`pip-control-btn ${localState.isMuted ? 'danger' : ''}`} 
                                onClick={toggleMicrophone}
                                title={localState.isMuted ? "Sesi Aç" : "Sesi Kapat"}
                            >
                                {localState.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                            </button>
                            <button 
                                className={`pip-control-btn ${!localState.isCameraOn ? 'danger' : ''}`} 
                                onClick={toggleCamera}
                                title={localState.isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                            >
                                {localState.isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
                            </button>
                            <button 
                                className={`pip-control-btn ${localState.isDeafened ? 'danger' : ''}`} 
                                onClick={toggleDeafen}
                                title={localState.isDeafened ? "Kulaklık Sesini Aç" : "Kulaklığı Sustur"}
                            >
                                {localState.isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            
                            <button 
                                className={`pip-control-btn ${localState.isScreenSharing ? 'active-share' : ''}`} 
                                onClick={toggleScreenShare}
                                title={localState.isScreenSharing ? "Ekran Paylaşımını Durdur" : "Ekranı Paylaş"}
                            >
                                <MonitorUp size={14} />
                            </button>

                            <button 
                                className="pip-control-btn danger disconnect-btn" 
                                onClick={handleDisconnectAction}
                                title="Aramayı Sonlandır"
                            >
                                <PhoneOff size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    if (isDocumentPiPActive && pipContainer) {
        return createPortal(content, pipContainer);
    }

    if (isInNativePiP) {
        return content;
    }

    return null;
};

export default GlobalVideoPIP;
