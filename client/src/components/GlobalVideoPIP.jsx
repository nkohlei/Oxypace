import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { getImageUrl } from '../utils/imageUtils';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Volume2, VolumeX, Shield, Crown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './GlobalVideoPIP.css';

const GlobalVideoPIP = () => {
    const {
        activeRoom,
        connectionState,
        participants,
        localState,
        toggleMicrophone,
        toggleCamera,
        disconnectFromChannel,
        toggleDeafen
    } = useVoice();

    const location = useLocation();
    const navigate = useNavigate();

    const [isMinimized, setIsMinimized] = useState(false);
    const [manualFocusId, setManualFocusId] = useState(null);
    const [position, setPosition] = useState({ x: 20, y: 80 }); // Floating position offsets from bottom-right
    const [showControls, setShowControls] = useState(false);
    const [isInNativePiP, setIsInNativePiP] = useState(false);
    const [pipContainer, setPipContainer] = useState(null);
    const [isDocumentPiPActive, setIsDocumentPiPActive] = useState(false);
    
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const startPosition = useRef({ x: 0, y: 0 });
    const startTime = useRef(0);
    const controlsTimeout = useRef(null);
    const pipWindowRef = useRef(null);

    const isConnected = !!activeRoom;
    
    // Check if user is currently inside the active channel view
    const queryParams = new URLSearchParams(location.search);
    const isViewingActiveChannel = location.pathname.includes(`/portal/${activeRoom?.portalId}`) && 
        queryParams.get('channel') === activeRoom?.channelId;

    // Show overlay on native Android PiP or Desktop Document PiP
    const shouldShow = isConnected && (
        (Capacitor.isNativePlatform() && isInNativePiP) || 
        isDocumentPiPActive
    );

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
                width: 270,
                height: 420
            });

            pipWindowRef.current = pipWin;
            copyStylesToDocument(pipWin.document);

            // Watch for user closing the PiP window manually
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

    // Listen for custom trigger event (e.g. from right-side Picture-in-Picture button click)
    useEffect(() => {
        const handleManualPipTrigger = () => {
            openDocumentPiPWindow();
        };

        window.addEventListener('triggerDocumentPiP', handleManualPipTrigger);
        return () => {
            window.removeEventListener('triggerDocumentPiP', handleManualPipTrigger);
        };
    }, [isDocumentPiPActive]);

    // Automatically close PiP window if disconnected from room
    useEffect(() => {
        if (!isConnected && pipWindowRef.current) {
            pipWindowRef.current.close();
            pipWindowRef.current = null;
            setPipContainer(null);
            setIsDocumentPiPActive(false);
        }
    }, [isConnected]);

    // Listen to native Android PiP state changes from MainActivity
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

    // Track active speaker to automatically shift focus
    useEffect(() => {
        if (!shouldShow) return;
        const activeSpeaker = participants.find(p => !p.isLocal && p.isSpeaking);
        if (activeSpeaker) {
            setManualFocusId(activeSpeaker.identity);
        }
    }, [participants, shouldShow]);

    // Handle auto-hide timer for controls
    const triggerControlsShow = () => {
        if (isInNativePiP) return; // Disable controls in native PiP
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        };
    }, []);

    if (!shouldShow) return null;

    // Find local and remote participants
    const localUser = participants.find(p => p.isLocal);
    const remoteParticipants = participants.filter(p => !p.isLocal);

    // Determine who to show in the main window of PIP
    let mainUser = null;
    if (manualFocusId) {
        mainUser = participants.find(p => p.identity === manualFocusId);
    }
    if (!mainUser || mainUser.isLocal) {
        // Fallback: first speaking user, or first camera user, or first participant
        mainUser = remoteParticipants.find(p => p.isSpeaking) || 
                   remoteParticipants.find(p => p.isCameraOn) || 
                   remoteParticipants[0];
    }

    const handleMinimizeToggle = (e) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
        setShowControls(false);
    };

    const handleNavigateToChannel = (e) => {
        if (isInNativePiP) return;
        if (e) e.stopPropagation();
        navigate(`/portal/${activeRoom.portalId}?channel=${activeRoom.channelId}`);
    };

    // Drag constraints
    const constrainPosition = (x, y) => {
        const minX = 10;
        const maxX = window.innerWidth - (isMinimized ? 80 : 260); // Constrained to mobile sizes
        const minY = 10;
        const maxY = window.innerHeight - (isMinimized ? 80 : 220);
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    };

    // Mouse events
    const handleMouseDown = (e) => {
        if (isInNativePiP) return;
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-member-strip') || e.target.closest('.pip-header-actions')) return;
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

    const handleMouseUp = (e) => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Click detection
        const elapsed = Date.now() - startTime.current;
        const dist = Math.hypot(e.clientX - startPosition.current.x, e.clientY - startPosition.current.y);
        if (elapsed < 200 && dist < 8) {
            if (isMinimized) {
                setIsMinimized(false);
            } else {
                triggerControlsShow();
            }
        }
    };

    // Touch events (Mobile support)
    const handleTouchStart = (e) => {
        if (isInNativePiP) return;
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-member-strip') || e.target.closest('.pip-header-actions')) return;
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
        e.preventDefault(); // Prevents scroll bouncing
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.current.x;
        const newY = touch.clientY - dragStart.current.y;
        setPosition(constrainPosition(newX, newY));
    };

    const handleTouchEnd = (e) => {
        isDragging.current = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        const elapsed = Date.now() - startTime.current;
        const touch = e.changedTouches[0];
        const dist = Math.hypot(touch.clientX - startPosition.current.x, touch.clientY - startPosition.current.y);
        
        if (elapsed < 250 && dist < 12) {
            if (isMinimized) {
                setIsMinimized(false);
            } else {
                triggerControlsShow();
            }
        }
    };

    const VideoRenderer = ({ participant, className }) => {
        const videoEl = useRef(null);
        const track = participant?.videoTrack;

        useEffect(() => {
            if (videoEl.current && track && participant?.isCameraOn) {
                track.attach(videoEl.current);
            }
            return () => {
                if (track) track.detach();
            };
        }, [track, participant?.isCameraOn]);

        if (participant?.isCameraOn && track) {
            return (
                <video 
                    ref={videoEl} 
                    className={className} 
                    autoPlay 
                    playsInline 
                    muted={participant.isLocal} 
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
    };

    const windowStyle = (isInNativePiP || isDocumentPiPActive) ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        border: 'none',
        background: '#0b0f19',
        zIndex: 99999
    } : { left: `${position.x}px`, top: `${position.y}px` };

    const showOverlayControls = showControls && !isInNativePiP;

    const handleMouseMoveWindow = () => {
        triggerControlsShow();
    };

    const handleMinimizeAction = (e) => {
        e.stopPropagation();
        if (isDocumentPiPActive && pipWindowRef.current) {
            pipWindowRef.current.close();
            return;
        }
        setIsMinimized(!isMinimized);
        setShowControls(false);
    };

    const handleDisconnectAction = (e) => {
        if (e) e.stopPropagation();
        disconnectFromChannel();
        if (pipWindowRef.current) {
            pipWindowRef.current.close();
        }
    };

    const content = (
        <div 
            className={`global-video-pip-window vertical-mode ${isMinimized ? 'minimized' : ''} ${showOverlayControls ? 'show-controls' : ''} ${isInNativePiP ? 'native-pip' : ''} ${isDocumentPiPActive ? 'document-pip' : ''}`}
            style={windowStyle}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onMouseMove={handleMouseMoveWindow}
            onMouseLeave={() => setShowControls(false)}
        >
            {isMinimized ? (
                // Minimized circular bubble
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
                // Vertical PiP View
                <div className="pip-full-content vertical-pip-content">
                    {/* Floating Header */}
                    {!isInNativePiP && (
                        <div className="pip-header">
                            <div className="pip-header-info" onClick={handleNavigateToChannel}>
                                <span className="pip-title">{activeRoom?.channelName || 'Canlı Oda'}</span>
                                <span className="pip-subtitle">{participants.length} katılımcı</span>
                            </div>
                            <div className="pip-header-actions">
                                <button className="pip-header-btn" onClick={handleMinimizeAction} title={isDocumentPiPActive ? "Geri Dön" : "Küçült"}>
                                    <Minimize2 size={15} />
                                </button>
                                <button className="pip-header-btn danger" onClick={handleDisconnectAction} title="Ayrıl">
                                    <PhoneOff size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Vertical Scrollable Participant Stack */}
                    <div className="pip-vertical-participants-container custom-scrollbar">
                        {participants.length > 0 ? (
                            participants.map((p) => (
                                <div 
                                    key={p.identity} 
                                    className={`pip-participant-card ${p.isSpeaking ? 'speaking' : ''} ${p.isLocal ? 'local' : ''}`}
                                >
                                    <VideoRenderer participant={p} className="pip-participant-video" />
                                    <div className="pip-participant-overlay">
                                        <span className="pip-participant-name">
                                            {p.name} {p.isLocal && '(Sen)'}
                                            {p.role === 'owner' && <Crown size={12} className="role-icon owner" />}
                                            {p.role === 'admin' && <Shield size={12} className="role-icon admin" />}
                                        </span>
                                        <div className="pip-participant-status">
                                            {p.isMuted ? <MicOff size={12} className="status-icon muted" /> : <Mic size={12} className="status-icon active" />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="pip-empty">Oda boş</div>
                        )}
                    </div>

                    {/* Bottom Action Controls */}
                    {!isInNativePiP && (
                        <div className="pip-controls vertical-controls">
                            <button 
                                className={`pip-control-btn ${localState.isMuted ? 'danger' : ''}`} 
                                onClick={toggleMicrophone}
                                title={localState.isMuted ? "Sesi Aç" : "Sesi Kapat"}
                            >
                                {localState.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button 
                                className={`pip-control-btn ${!localState.isCameraOn ? 'danger' : ''}`} 
                                onClick={toggleCamera}
                                title={localState.isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                            >
                                {localState.isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                            </button>
                            <button 
                                className={`pip-control-btn ${localState.isDeafened ? 'danger' : ''}`} 
                                onClick={toggleDeafen}
                                title={localState.isDeafened ? "Kulaklık Sesini Aç" : "Kulaklığı Sustur"}
                            >
                                {localState.isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <button 
                                className="pip-control-btn danger disconnect-btn" 
                                onClick={handleDisconnectAction}
                                title="Aramayı Sonlandır"
                            >
                                <PhoneOff size={16} />
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
