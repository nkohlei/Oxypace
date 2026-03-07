import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { ConnectionState, VideoTrack, AudioTrack } from 'livekit-client';
import './GlobalVoiceOverlay.css'; // We'll create this next

const GlobalVoiceOverlay = () => {
    const { activeRoom, connectionState, participants, disconnectFromChannel, toggleMicrophone, localState } = useVoice();
    const location = useLocation();
    const navigate = useNavigate();

    // UI states
    const [isMinimized, setIsMinimized] = useState(false);

    // Only show if we are connected AND NOT on the active room's specific page
    const isConnected = connectionState === ConnectionState.Connected;
    const isCurrentlyInRoomView = location.pathname === `/portal/${activeRoom?.portalId}`;

    if (!isConnected || isCurrentlyInRoomView || !activeRoom) {
        return null;
    }

    // Handlers
    const handleReturnToRoom = () => {
        navigate(`/portal/${activeRoom.portalId}`);
    };

    const handleDisconnect = (e) => {
        e.stopPropagation();
        disconnectFromChannel();
    };

    const handleToggleMute = (e) => {
        e.stopPropagation();
        toggleMicrophone();
    };

    // Calculate speaking status for border pulse
    const activeSpeakers = participants.filter(p => p.isSpeaking);

    return (
        <div className={`global-voice-overlay ${isMinimized ? 'minimized' : ''}`}>

            {/* Header / Grab Area */}
            <div className="overlay-header" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="overlay-title">
                    <div className="live-indicator"></div>
                    <span>{activeRoom.channelName || 'Ses Kanalı'}</span>
                </div>
                <div className="overlay-actions">
                    <button className="icon-btn" title={isMinimized ? 'Büyüt' : 'Küçült'}>
                        {isMinimized ? (
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        )}
                    </button>
                    <button className="icon-btn leave-btn" onClick={handleDisconnect} title="Ayrıl">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            {/* Content Body (Hidden if minimized) */}
            {!isMinimized && (
                <div className="overlay-body" onClick={handleReturnToRoom}>
                    <div className="avatars-container">
                        {participants.slice(0, 4).map((p, idx) => (
                            <div
                                key={p.identity}
                                className={`avatar-bubble ${p.isSpeaking ? 'speaking' : ''}`}
                                style={{ zIndex: 10 - idx }}
                            >
                                {p.avatar ? (
                                    <img src={p.avatar.startsWith('http') ? p.avatar : `http://localhost:5000${p.avatar}`} alt={p.name} />
                                ) : (
                                    <div className="avatar-fallback">{p.name?.[0]?.toUpperCase()}</div>
                                )}
                                {p.isMuted && (
                                    <div className="mute-indicator">
                                        <svg viewBox="0 0 24 24" width="10" height="10" stroke="white" strokeWidth="3" fill="none"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                    </div>
                                )}
                            </div>
                        ))}
                        {participants.length > 4 && (
                            <div className="avatar-bubble more-count">
                                +{participants.length - 4}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            {!isMinimized && (
                <div className="overlay-footer">
                    <button
                        className={`neumorphic-btn ${localState.isMuted ? 'inset muted' : 'active'}`}
                        onClick={handleToggleMute}
                        title={localState.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
                    >
                        {localState.isMuted ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        )}
                    </button>

                    <button className="neumorphic-btn action-btn" onClick={handleReturnToRoom}>
                        Odaya Dön
                    </button>
                </div>
            )}

            {/* Render audio tracks so we can actually hear people when not in the room DOM */}
            {participants.map(p => {
                if (p.isLocal) return null; // Don't play own audio
                return p.audioTrack ? <AudioTrackPlayer key={p.identity} track={p.audioTrack} /> : null;
            })}
        </div>
    );
};

// Helper component to render and play the LiveKit AudioTrack natively
const AudioTrackPlayer = ({ track }) => {
    const audioEl = React.useRef(null);
    React.useEffect(() => {
        if (audioEl.current && track) {
            track.attach(audioEl.current);
        }
        return () => {
            if (track) track.detach();
        };
    }, [track]);
    return <audio ref={audioEl} autoPlay />;
};

export default GlobalVoiceOverlay;
