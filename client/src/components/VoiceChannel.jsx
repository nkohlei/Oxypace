import { useEffect, useRef, useCallback } from 'react';
import { useVoice } from '../context/VoiceContext';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useAuth } from '../context/AuthContext';
import './VoiceChannel.css';

/**
 * VoiceChannel — N-to-N free chat room component.
 * All participants can speak and share their camera freely.
 */
const VoiceChannel = ({ portalId, channelId, channelName }) => {
    const { user } = useAuth();
    const {
        currentRoom,
        participants,
        isMuted,
        isCameraOn,
        isScreenSharing,
        isConnecting: contextConnecting,
        isConnected,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        registerSocketListeners,
    } = useVoice();

    const {
        connect,
        disconnect,
        toggleMicrophone,
        toggleCamera: toggleCam,
        toggleScreenShare: toggleScreen,
        remoteParticipants,
        activeSpeakers,
        videoTracks,
        audioTracks,
        isConnected: rtcConnected,
        isConnecting: rtcConnecting,
        localParticipant,
    } = useVoiceRoom();

    const audioRefs = useRef({});
    const videoRefs = useRef({});

    // ─── Join Room on Mount ───
    useEffect(() => {
        if (!isConnected && !contextConnecting) {
            joinVoiceChannel(portalId, channelId);
        }
    }, [portalId, channelId]);

    // ─── Connect to LiveKit when token is available ───
    useEffect(() => {
        if (currentRoom?.token && currentRoom?.serverUrl && !rtcConnected && !rtcConnecting) {
            connect(currentRoom.token, currentRoom.serverUrl);
        }
    }, [currentRoom?.token, currentRoom?.serverUrl, rtcConnected, rtcConnecting, connect]);

    // ─── Register Socket Listeners ───
    useEffect(() => {
        const cleanup = registerSocketListeners();
        return cleanup;
    }, [registerSocketListeners]);

    // ─── Sync Media Controls with LiveKit ───
    useEffect(() => {
        if (rtcConnected) {
            toggleMicrophone(!isMuted);
        }
    }, [isMuted, rtcConnected, toggleMicrophone]);

    useEffect(() => {
        if (rtcConnected) {
            toggleCam(isCameraOn);
        }
    }, [isCameraOn, rtcConnected, toggleCam]);

    useEffect(() => {
        if (rtcConnected) {
            toggleScreen(isScreenSharing);
        }
    }, [isScreenSharing, rtcConnected, toggleScreen]);

    // ─── Attach Audio Tracks ───
    useEffect(() => {
        audioTracks.forEach(({ track, participant }) => {
            const id = participant.identity;
            if (audioRefs.current[id]) {
                track.attach(audioRefs.current[id]);
            }
        });

        return () => {
            audioTracks.forEach(({ track }) => {
                track.detach();
            });
        };
    }, [audioTracks]);

    // ─── Leave on Unmount ───
    useEffect(() => {
        return () => {
            disconnect();
            leaveVoiceChannel();
        };
    }, []);

    // ─── Render Helpers ───
    const getAvatar = (participant) => {
        try {
            const meta = participant.metadata ? JSON.parse(participant.metadata) : {};
            return meta.avatar || '';
        } catch {
            return '';
        }
    };

    const getUsername = (participant) => {
        return participant.name || participant.identity || 'Unknown';
    };

    const isSpeaking = (identity) => activeSpeakers.includes(identity);

    // Build participant list from both socket and RTC data
    const allParticipants = [
        // Local participant
        ...(localParticipant ? [{
            identity: localParticipant.identity,
            name: user?.displayName || user?.username || 'You',
            metadata: JSON.stringify({ avatar: user?.profileImage || '', username: user?.username }),
            isSelf: true,
            isMuted: isMuted,
            isCameraOn: isCameraOn,
        }] : []),
        // Remote participants
        ...remoteParticipants.map((p) => ({
            ...p,
            isSelf: false,
            isMuted: !p.isMicrophoneEnabled,
        })),
    ];

    // ─── Video Tiles ───
    const activeVideoParticipants = videoTracks.filter(
        ({ track }) => track && !track.isMuted
    );
    const hasVideos = activeVideoParticipants.length > 0 || isCameraOn;

    // ─── Loading State ───
    if (contextConnecting || rtcConnecting) {
        return (
            <div className="voice-channel-container">
                <div className="voice-connecting">
                    <div className="voice-connecting-spinner" />
                    <span className="voice-connecting-text">Ses kanalına bağlanılıyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="voice-channel-container">
            {/* Header */}
            <div className="voice-channel-header">
                <div className="voice-channel-header-info">
                    <div className="voice-channel-header-icon free">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="voice-channel-title">{channelName || 'Ses Kanalı'}</h3>
                        <p className="voice-channel-subtitle">
                            <span className="dot" />
                            Ses Bağlantısı Aktif
                        </p>
                    </div>
                </div>
                <div className="voice-participant-count">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <path d="M20 8v6M23 11h-6" />
                    </svg>
                    {allParticipants.length}
                </div>
            </div>

            {/* Main Area */}
            {hasVideos ? (
                /* Video Grid Mode */
                <div className={`voice-video-grid grid-${Math.min(activeVideoParticipants.length + (isCameraOn ? 1 : 0), 4) || 1}`}>
                    {/* Local video */}
                    {isCameraOn && localParticipant && (
                        <div className="voice-video-tile">
                            <video
                                ref={(el) => {
                                    if (el && localParticipant) {
                                        const camTrack = Array.from(
                                            localParticipant.videoTrackPublications?.values() || []
                                        ).find(p => p.track);
                                        if (camTrack?.track) {
                                            camTrack.track.attach(el);
                                        }
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                            />
                            <div className="video-name-overlay">Sen</div>
                        </div>
                    )}
                    {/* Remote videos */}
                    {activeVideoParticipants.map(({ track, participant }) => (
                        <div key={participant.identity} className="voice-video-tile">
                            <video
                                ref={(el) => {
                                    if (el && track) {
                                        track.attach(el);
                                    }
                                }}
                                autoPlay
                                playsInline
                            />
                            <div className="video-name-overlay">{getUsername(participant)}</div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Avatar Grid Mode (Audio Only) */
                <div className="voice-participants-area">
                    {allParticipants.length === 0 ? (
                        <div className="voice-empty-state">
                            <div className="voice-empty-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                </svg>
                            </div>
                            <span className="voice-empty-title">Ses Kanalı Boş</span>
                            <span className="voice-empty-subtitle">
                                İlk katılımcı siz olun! Ses kanalına bağlanmak için aşağıdaki kontrolleri kullanın.
                            </span>
                        </div>
                    ) : (
                        <div className="voice-participants-grid">
                            {allParticipants.map((p) => {
                                const avatar = p.isSelf
                                    ? user?.profileImage
                                    : getAvatar(p);
                                const name = p.isSelf
                                    ? (user?.displayName || user?.username || 'Sen')
                                    : getUsername(p);
                                const speaking = p.isSelf ? false : isSpeaking(p.identity);
                                const muted = p.isMuted;

                                return (
                                    <div
                                        key={p.identity}
                                        className={`voice-participant-card ${speaking ? 'speaking' : ''} ${muted ? 'muted' : ''}`}
                                    >
                                        <div className="voice-avatar-wrapper">
                                            <div className="voice-speaking-ring" />
                                            <img
                                                className="voice-avatar"
                                                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=72`}
                                                alt={name}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=72`;
                                                }}
                                            />
                                            {muted && (
                                                <div className="voice-muted-badge">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" />
                                                        <line x1="12" y1="19" x2="12" y2="23" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className="voice-participant-name">
                                            {p.isSelf ? `${name} (Sen)` : name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Hidden audio elements */}
            {audioTracks.map(({ track, participant }) => (
                <audio
                    key={participant.identity}
                    ref={(el) => {
                        audioRefs.current[participant.identity] = el;
                        if (el && track) track.attach(el);
                    }}
                    autoPlay
                />
            ))}

            {/* Control Bar */}
            <div className="voice-controls">
                <button
                    className={`voice-control-btn ${isMuted ? 'muted' : 'active'}`}
                    onClick={toggleMute}
                >
                    <span className="voice-control-tooltip">
                        {isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
                    </span>
                    {isMuted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    )}
                </button>

                <button
                    className={`voice-control-btn ${isCameraOn ? 'active' : 'muted'}`}
                    onClick={toggleCamera}
                >
                    <span className="voice-control-tooltip">
                        {isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                    </span>
                    {isCameraOn ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
                            <line x1="23" y1="7" x2="23" y2="17" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    )}
                </button>

                <button
                    className={`voice-control-btn screen-share ${isScreenSharing ? 'active' : ''}`}
                    onClick={toggleScreenShare}
                >
                    <span className="voice-control-tooltip">
                        {isScreenSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                </button>

                <button
                    className="voice-control-btn leave"
                    onClick={() => {
                        disconnect();
                        leaveVoiceChannel();
                    }}
                >
                    <span className="voice-control-tooltip">Kanaldan Ayrıl</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                        <line x1="23" y1="1" x2="17" y2="7" />
                        <line x1="17" y1="1" x2="23" y2="7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default VoiceChannel;
