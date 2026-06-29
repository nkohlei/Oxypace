import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { getImageUrl } from '../utils/imageUtils';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2, Volume2, VolumeX, Shield, Crown } from 'lucide-react';
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
    const dragRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const isConnected = activeRoom && connectionState === 'connected';
    
    // Check if user is currently inside the active channel view
    const queryParams = new URLSearchParams(location.search);
    const isViewingActiveChannel = location.pathname.includes(`/portal/${activeRoom?.portalId}`) && 
        queryParams.get('channel') === activeRoom?.channelId;

    // We only show PIP when connected and NOT actively viewing the channel view
    const shouldShow = isConnected && !isViewingActiveChannel;

    // Track active speaker to automatically shift focus
    useEffect(() => {
        if (!shouldShow) return;
        const activeSpeaker = participants.find(p => !p.isLocal && p.isSpeaking);
        if (activeSpeaker) {
            setManualFocusId(activeSpeaker.identity);
        }
    }, [participants, shouldShow]);

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
    };

    const handleNavigateToChannel = () => {
        navigate(`/portal/${activeRoom.portalId}?channel=${activeRoom.channelId}`);
    };

    // Drag-to-move handling for the floating window
    const handleMouseDown = (e) => {
        if (e.target.closest('.pip-controls') || e.target.closest('.pip-member-strip')) return;
        isDragging.current = true;
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        
        // Boundaries checks (constrain within viewport)
        const minX = 10;
        const maxX = window.innerWidth - (isMinimized ? 80 : 340);
        const minY = 10;
        const maxY = window.innerHeight - (isMinimized ? 80 : 260);

        setPosition({
            x: Math.max(minX, Math.min(maxX, newX)),
            y: Math.max(minY, Math.min(maxY, newY))
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
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

    return (
        <div 
            className={`global-video-pip-window ${isMinimized ? 'minimized' : ''}`}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onMouseDown={handleMouseDown}
        >
            {isMinimized ? (
                // Minimized circular bubble
                <div className="pip-bubble" onClick={handleMinimizeToggle}>
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
                // Full PiP view
                <div className="pip-full-content">
                    {/* Header */}
                    <div className="pip-header">
                        <span className="pip-title" onClick={handleNavigateToChannel}>
                            {activeRoom?.channelName || 'Sohbet'}
                        </span>
                        <div className="pip-header-actions">
                            <button className="pip-header-btn" onClick={handleMinimizeToggle} title="Küçült">
                                <Minimize2 size={16} />
                            </button>
                            <button className="pip-header-btn danger" onClick={disconnectFromChannel} title="Ayrıl">
                                <PhoneOff size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Main video area */}
                    <div className="pip-main-video-container" onClick={handleNavigateToChannel}>
                        {mainUser ? (
                            <VideoRenderer participant={mainUser} className="pip-main-video" />
                        ) : (
                            <div className="pip-empty">Oda boş</div>
                        )}

                        {/* Local thumbnail overlay */}
                        {localUser && localUser.isCameraOn && (
                            <div className="pip-local-thumbnail">
                                <VideoRenderer participant={localUser} className="pip-local-video" />
                            </div>
                        )}

                        {/* Speaking / Mute Indicators */}
                        {mainUser && (
                            <div className="pip-overlay-info">
                                <span className="pip-speaker-name">
                                    {mainUser.name}
                                    {mainUser.role === 'owner' && <Crown size={12} className="role-icon owner" />}
                                    {mainUser.role === 'admin' && <Shield size={12} className="role-icon admin" />}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Control Strip */}
                    <div className="pip-controls">
                        <button 
                            className={`pip-control-btn ${localState.isMuted ? 'danger' : ''}`} 
                            onClick={toggleMicrophone}
                        >
                            {localState.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <button 
                            className={`pip-control-btn ${!localState.isCameraOn ? 'danger' : ''}`} 
                            onClick={toggleCamera}
                        >
                            {localState.isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                        </button>
                        <button 
                            className={`pip-control-btn ${localState.isDeafened ? 'danger' : ''}`} 
                            onClick={toggleDeafen}
                        >
                            {localState.isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>

                    {/* Member Strip for manual pinning */}
                    {remoteParticipants.length > 1 && (
                        <div className="pip-member-strip custom-scrollbar">
                            {remoteParticipants.map(p => (
                                <div 
                                    key={p.identity} 
                                    className={`pip-member-avatar-wrapper ${manualFocusId === p.identity ? 'active' : ''} ${p.isSpeaking ? 'speaking' : ''}`}
                                    onClick={() => setManualFocusId(p.identity)}
                                >
                                    <img 
                                        src={getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} 
                                        alt={p.name} 
                                        title={p.name}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalVideoPIP;
