import { useEffect, useRef, useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useAuth } from '../context/AuthContext';
import './VoiceChannel.css';

/**
 * ConferenceChannel — 1-to-N stage/conference room component.
 * Only speakers (admins/granted users) can publish audio/video.
 * Listeners can request to speak via "Raise Hand".
 */
const ConferenceChannel = ({ portalId, channelId, channelName }) => {
    const { user } = useAuth();
    const {
        currentRoom,
        isMuted,
        isCameraOn,
        isScreenSharing,
        isConnecting: contextConnecting,
        isConnected,
        canSpeak,
        raisedHands,
        userRole,
        error,
        joinVoiceChannel,
        leaveVoiceChannel,
        setConnected,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        raiseHand,
        grantSpeak,
        revokeSpeak,
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
    } = useVoiceRoom({
        onConnected: () => {
            setConnected();
        },
    });

    const [showRaisedHands, setShowRaisedHands] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const audioRefs = useRef({});
    const hasConnectedRef = useRef(false);

    const isAdmin = userRole === 'owner' || userRole === 'admin';

    // ─── Join Room on Mount ───
    useEffect(() => {
        joinVoiceChannel(portalId, channelId);
        return () => {
            disconnect();
            leaveVoiceChannel();
            hasConnectedRef.current = false;
        };
    }, [portalId, channelId]);

    // ─── Connect to LiveKit ───
    useEffect(() => {
        if (currentRoom?.token && currentRoom?.serverUrl && !rtcConnected && !rtcConnecting && !hasConnectedRef.current) {
            hasConnectedRef.current = true;
            connect(currentRoom.token, currentRoom.serverUrl);
        }
    }, [currentRoom?.token, currentRoom?.serverUrl, rtcConnected, rtcConnecting, connect]);

    // ─── Register Socket Listeners ───
    useEffect(() => {
        const cleanup = registerSocketListeners();
        return cleanup;
    }, [registerSocketListeners]);

    // ─── Sync Media Controls ───
    useEffect(() => {
        if (rtcConnected && canSpeak) {
            toggleMicrophone(!isMuted);
        }
    }, [isMuted, rtcConnected, canSpeak, toggleMicrophone]);

    useEffect(() => {
        if (rtcConnected && canSpeak) {
            toggleCam(isCameraOn);
        }
    }, [isCameraOn, rtcConnected, canSpeak, toggleCam]);

    useEffect(() => {
        if (rtcConnected && canSpeak) {
            toggleScreen(isScreenSharing);
        }
    }, [isScreenSharing, rtcConnected, canSpeak, toggleScreen]);

    // ─── Attach Audio Tracks ───
    useEffect(() => {
        audioTracks.forEach(({ track, participant }) => {
            const id = participant.identity;
            if (audioRefs.current[id]) {
                track.attach(audioRefs.current[id]);
            }
        });
        return () => {
            audioTracks.forEach(({ track }) => track.detach());
        };
    }, [audioTracks]);

    // ─── Helpers ───
    const getAvatar = (p) => {
        try {
            const meta = p.metadata ? JSON.parse(p.metadata) : {};
            return meta.avatar || '';
        } catch { return ''; }
    };

    const getUsername = (p) => p.name || p.identity || 'Unknown';

    const getRole = (p) => {
        try {
            const meta = p.metadata ? JSON.parse(p.metadata) : {};
            return meta.role || 'member';
        } catch { return 'member'; }
    };

    const isSpeaking = (identity) => activeSpeakers.includes(identity);

    const isRaisedHand = (userId) => raisedHands.some((h) => h.userId === userId);

    // Separate speakers from listeners
    const speakers = remoteParticipants.filter((p) => {
        const role = getRole(p);
        return role === 'owner' || role === 'admin' || p.isMicrophoneEnabled || p.isCameraEnabled;
    });

    const listeners = remoteParticipants.filter((p) => {
        const role = getRole(p);
        return role !== 'owner' && role !== 'admin' && !p.isMicrophoneEnabled && !p.isCameraEnabled;
    });

    // ─── Handle Raise Hand ───
    const handleRaiseHand = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        raiseHand(newState);
    };

    const handleGrantSpeak = (userId) => grantSpeak(userId);
    const handleRevokeSpeak = (userId) => revokeSpeak(userId);

    // ─── Loading ───
    if (contextConnecting || rtcConnecting || (!rtcConnected && !error)) {
        return (
            <div className="voice-channel-container">
                <div className="voice-connecting">
                    <div className="voice-connecting-spinner" />
                    <span className="voice-connecting-text">Konferans odasına bağlanılıyor...</span>
                    {error && (
                        <span style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</span>
                    )}
                </div>
            </div>
        );
    }

    // ─── Error State ───
    if (error && !rtcConnected) {
        return (
            <div className="voice-channel-container">
                <div className="voice-connecting">
                    <span style={{ fontSize: '36px' }}>⚠️</span>
                    <span className="voice-connecting-text" style={{ color: '#ef4444' }}>Bağlantı Hatası</span>
                    <span style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>{error}</span>
                    <button
                        onClick={() => {
                            hasConnectedRef.current = false;
                            joinVoiceChannel(portalId, channelId);
                        }}
                        style={{
                            marginTop: '12px',
                            padding: '8px 20px',
                            background: '#a855f7',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                        }}
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="voice-channel-container">
            {/* Header */}
            <div className="voice-channel-header">
                <div className="voice-channel-header-info">
                    <div className="voice-channel-header-icon stage">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="voice-channel-title">{channelName || 'Konferans Odası'}</h3>
                        <p className="voice-channel-subtitle">
                            <span className="dot" style={{ background: '#a855f7' }} />
                            Sahne Modu · {isAdmin ? 'Moderatör' : (canSpeak ? 'Konuşmacı' : 'Dinleyici')}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Raised hands button for admins */}
                    {isAdmin && raisedHands.length > 0 && (
                        <button
                            onClick={() => setShowRaisedHands(!showRaisedHands)}
                            style={{
                                position: 'relative',
                                background: 'rgba(234, 179, 8, 0.15)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '6px 12px',
                                color: '#eab308',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                            }}
                        >
                            ✋ {raisedHands.length}
                        </button>
                    )}

                    <div className="voice-participant-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                        </svg>
                        {(speakers.length + listeners.length + 1)}
                    </div>
                </div>
            </div>

            {/* Raised Hands Panel */}
            {showRaisedHands && isAdmin && (
                <div className="raised-hands-panel">
                    <h4 className="raised-hands-title">
                        ✋ Söz İsteyenler ({raisedHands.length})
                    </h4>
                    {raisedHands.map((hand) => (
                        <div key={hand.userId} className="raised-hand-item">
                            <img
                                className="raised-hand-avatar"
                                src={hand.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(hand.username)}&background=6366f1&color=fff`}
                                alt={hand.username}
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hand.username)}&background=6366f1&color=fff`;
                                }}
                            />
                            <span className="raised-hand-name">{hand.displayName || hand.username}</span>
                            <div className="raised-hand-actions">
                                <button
                                    className="raised-hand-btn approve"
                                    onClick={() => handleGrantSpeak(hand.userId)}
                                    title="Söz Ver"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </button>
                                <button
                                    className="raised-hand-btn deny"
                                    onClick={() => handleRevokeSpeak(hand.userId)}
                                    title="Reddet"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stage Layout */}
            <div className="stage-layout">
                {/* Stage — Speakers Area */}
                <div className="stage-speakers-area">
                    {/* Local participant (if speaker) */}
                    {(isAdmin || canSpeak) && localParticipant && (
                        <div className={`voice-participant-card ${!isMuted ? 'speaking' : ''}`}>
                            <div className="voice-avatar-wrapper">
                                <div className="voice-speaking-ring" />
                                <img
                                    className="voice-avatar"
                                    src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=a855f7&color=fff&size=72`}
                                    alt={user?.username}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=a855f7&color=fff&size=72`;
                                    }}
                                />
                                {isMuted && (
                                    <div className="voice-muted-badge">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className="voice-participant-name">{user?.profile?.displayName || user?.username} (Sen)</span>
                            <span className={`voice-participant-role ${isAdmin ? 'owner' : ''}`}>
                                {isAdmin ? '🎤 Moderatör' : '🎙️ Konuşmacı'}
                            </span>
                        </div>
                    )}

                    {/* Remote speakers */}
                    {speakers.map((p) => {
                        const avatar = getAvatar(p);
                        const name = getUsername(p);
                        const role = getRole(p);
                        const speaking = isSpeaking(p.identity);

                        return (
                            <div
                                key={p.identity}
                                className={`voice-participant-card ${speaking ? 'speaking' : ''}`}
                            >
                                <div className="voice-avatar-wrapper">
                                    <div className="voice-speaking-ring" />
                                    <img
                                        className="voice-avatar"
                                        src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff&size=72`}
                                        alt={name}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff&size=72`;
                                        }}
                                    />
                                    {!p.isMicrophoneEnabled && (
                                        <div className="voice-muted-badge">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                                            </svg>
                                        </div>
                                    )}
                                    {isRaisedHand(p.identity) && (
                                        <div className="raised-hand-badge">✋</div>
                                    )}
                                </div>
                                <span className="voice-participant-name">{name}</span>
                                {(role === 'owner' || role === 'admin') && (
                                    <span className={`voice-participant-role ${role}`}>
                                        {role === 'owner' ? '👑 Sahip' : '🛡️ Admin'}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {speakers.length === 0 && !isAdmin && !canSpeak && (
                        <div className="voice-empty-state">
                            <div className="voice-empty-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                </svg>
                            </div>
                            <span className="voice-empty-title">Sahne Boş</span>
                            <span className="voice-empty-subtitle">
                                Henüz sahneye çıkan konuşmacı yok. Söz istemek için aşağıdaki ✋ butonunu kullanın.
                            </span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="stage-divider">
                    Dinleyiciler ({listeners.length + (!isAdmin && !canSpeak ? 1 : 0)})
                </div>

                {/* Listeners Area */}
                <div className="stage-listeners-area">
                    <div className="stage-listeners-grid">
                        {/* Self as listener */}
                        {!isAdmin && !canSpeak && (
                            <div className="stage-listener-chip">
                                <img
                                    className="stage-listener-avatar"
                                    src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=6366f1&color=fff&size=28`}
                                    alt={user?.username}
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=6366f1&color=fff&size=28`;
                                    }}
                                />
                                <span className="stage-listener-name">{user?.profile?.displayName || user?.username} (Sen)</span>
                                {handRaised && <span style={{ fontSize: '12px' }}>✋</span>}
                            </div>
                        )}

                        {/* Remote listeners */}
                        {listeners.map((p) => {
                            const avatar = getAvatar(p);
                            const name = getUsername(p);

                            return (
                                <div key={p.identity} className="stage-listener-chip">
                                    <img
                                        className="stage-listener-avatar"
                                        src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=28`}
                                        alt={name}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=28`;
                                        }}
                                    />
                                    <span className="stage-listener-name">{name}</span>
                                    {isRaisedHand(p.identity) && <span style={{ fontSize: '12px' }}>✋</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Hidden Audio Elements */}
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
                {/* Microphone (only if canSpeak) */}
                {canSpeak && (
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
                )}

                {/* Camera (only if canSpeak) */}
                {canSpeak && (
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
                                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Raise Hand (only for non-speakers in stage mode) */}
                {!canSpeak && (
                    <button
                        className={`voice-control-btn raise-hand ${handRaised ? 'raised' : ''}`}
                        onClick={handleRaiseHand}
                    >
                        <span className="voice-control-tooltip">
                            {handRaised ? 'Eli İndir' : 'Söz İste'}
                        </span>
                        <span style={{ fontSize: '20px' }}>✋</span>
                    </button>
                )}

                {/* Leave */}
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

export default ConferenceChannel;
