import { useState, useRef, useEffect, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState, Track } from 'livekit-client';
import { useVoice } from '../context/VoiceContext';
import './VoiceChannel.css';

const ConferenceChannel = ({ portalId, channelId, channelName }) => {
    const { getToken, joinRoom, leaveRoom, grantSpeak, revokeSpeak, user, socket } = useVoice();
    const roomRef = useRef(null);
    const [phase, setPhase] = useState('lobby'); // lobby | connecting | connected | error
    const [errorMsg, setErrorMsg] = useState('');
    const [participants, setParticipants] = useState([]);
    const [localState, setLocalState] = useState({ isMuted: true, isCameraOn: false });
    const [raisedHands, setRaisedHands] = useState([]);
    const [canSpeak, setCanSpeak] = useState(false);
    const [userRole, setUserRole] = useState('member');
    const [handRaised, setHandRaised] = useState(false);
    const audioRefs = useRef({});
    const timeoutRef = useRef(null);

    const isAdmin = userRole === 'owner' || userRole === 'admin';

    useEffect(() => {
        return () => handleLeave();
    }, [channelId]);

    // Socket listeners for raise hand / permissions
    useEffect(() => {
        if (!socket) return;
        const onRaiseHand = (data) => {
            setRaisedHands(prev => {
                if (data.raised) {
                    if (prev.find(h => h.userId === data.userId)) return prev;
                    return [...prev, data];
                }
                return prev.filter(h => h.userId !== data.userId);
            });
        };
        const onPermissions = ({ userId, canPublish }) => {
            if (userId === user?._id) {
                setCanSpeak(canPublish);
            }
        };
        socket.on('voice:raise-hand', onRaiseHand);
        socket.on('voice:permissions-updated', onPermissions);
        return () => {
            socket.off('voice:raise-hand', onRaiseHand);
            socket.off('voice:permissions-updated', onPermissions);
        };
    }, [socket, user]);

    const updateParticipantList = useCallback((room) => {
        if (!room) return;
        const list = [];
        for (const p of room.remoteParticipants.values()) {
            let avatar = '', role = 'member';
            try {
                const meta = JSON.parse(p.metadata || '{}');
                avatar = meta.avatar || '';
                role = meta.role || 'member';
            } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar, role,
                isMuted: !p.isMicrophoneEnabled,
                isCameraOn: p.isCameraEnabled,
                isSpeaking: p.isSpeaking,
                videoTrack: videoPub?.track || null,
                audioTrack: audioPub?.track || null,
            });
        }
        setParticipants(list);
    }, []);

    const handleJoin = useCallback(async () => {
        setPhase('connecting');
        setErrorMsg('');

        timeoutRef.current = setTimeout(() => {
            if (roomRef.current?.state !== ConnectionState.Connected) {
                setErrorMsg('Bağlantı zaman aşımına uğradı.');
                setPhase('error');
                if (roomRef.current) { roomRef.current.disconnect().catch(() => { }); roomRef.current = null; }
            }
        }, 15000);

        try {
            const data = await getToken(portalId, channelId);
            const { token, serverUrl, roomName, roomMode, userRole: role } = data;

            setUserRole(role);
            const isAdminUser = role === 'owner' || role === 'admin';
            setCanSpeak(isAdminUser || roomMode !== 'stage');

            const room = new Room({
                adaptiveStream: true, dynacast: true,
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });

            room.on(RoomEvent.ConnectionStateChanged, (state) => {
                if (state === ConnectionState.Connected) {
                    clearTimeout(timeoutRef.current);
                    setPhase('connected');
                    updateParticipantList(room);
                    joinRoom(portalId, channelId, roomName);
                } else if (state === ConnectionState.Disconnected) {
                    setPhase('lobby');
                    setParticipants([]);
                    leaveRoom();
                }
            });

            room.on(RoomEvent.ParticipantConnected, () => updateParticipantList(room));
            room.on(RoomEvent.ParticipantDisconnected, () => updateParticipantList(room));
            room.on(RoomEvent.TrackSubscribed, () => updateParticipantList(room));
            room.on(RoomEvent.TrackUnsubscribed, () => updateParticipantList(room));
            room.on(RoomEvent.TrackMuted, () => updateParticipantList(room));
            room.on(RoomEvent.TrackUnmuted, () => updateParticipantList(room));
            room.on(RoomEvent.ActiveSpeakersChanged, () => updateParticipantList(room));
            room.on(RoomEvent.Disconnected, () => { setPhase('lobby'); setParticipants([]); roomRef.current = null; });

            roomRef.current = room;
            await room.connect(serverUrl, token);
        } catch (err) {
            clearTimeout(timeoutRef.current);
            console.error('Conference connection error:', err);
            setErrorMsg(err.response?.data?.message || err.message || 'Bağlantı hatası');
            setPhase('error');
            if (roomRef.current) { roomRef.current.disconnect().catch(() => { }); roomRef.current = null; }
        }
    }, [portalId, channelId, getToken, joinRoom, updateParticipantList, leaveRoom]);

    const handleLeave = useCallback(() => {
        clearTimeout(timeoutRef.current);
        if (roomRef.current) { roomRef.current.disconnect().catch(() => { }); roomRef.current = null; }
        setPhase('lobby');
        setParticipants([]);
        setLocalState({ isMuted: true, isCameraOn: false });
        setRaisedHands([]);
        setHandRaised(false);
        leaveRoom();
    }, [leaveRoom]);

    const toggleMic = useCallback(async () => {
        if (!roomRef.current?.localParticipant || !canSpeak) return;
        const newMuted = !localState.isMuted;
        setLocalState(s => ({ ...s, isMuted: newMuted }));
        try { await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted); } catch (e) { console.error(e); }
    }, [localState.isMuted, canSpeak]);

    const toggleCam = useCallback(async () => {
        if (!roomRef.current?.localParticipant || !canSpeak) return;
        const newCam = !localState.isCameraOn;
        setLocalState(s => ({ ...s, isCameraOn: newCam }));
        try { await roomRef.current.localParticipant.setCameraEnabled(newCam); } catch (e) { console.error(e); }
    }, [localState.isCameraOn, canSpeak]);

    const handleRaiseHand = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        if (socket) {
            socket.emit('voice:raise-hand', {
                roomName: `portal_${portalId}_channel_${channelId}`,
                userId: user?._id,
                username: user?.username,
                avatar: user?.profile?.avatar || '',
                raised: newState,
            });
        }
    };

    const handleGrant = async (userId) => {
        try { await grantSpeak(portalId, channelId, userId); } catch (e) { console.error(e); }
    };

    const handleRevoke = async (userId) => {
        try { await revokeSpeak(portalId, channelId, userId); } catch (e) { console.error(e); }
    };

    // Separate speakers / listeners
    const speakers = participants.filter(p => p.role === 'owner' || p.role === 'admin' || !p.isMuted || p.isCameraOn);
    const listeners = participants.filter(p => p.role !== 'owner' && p.role !== 'admin' && p.isMuted && !p.isCameraOn);

    // ═══ RENDER ═══

    // ─── LOBBY ───
    if (phase === 'lobby') {
        return (
            <div className="vc-container">
                <div className="vc-lobby">
                    <div className="vc-lobby-icon conf">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <h2 className="vc-lobby-title">{channelName || 'Konferans Odası'}</h2>
                    <p className="vc-lobby-subtitle">Konferansa katılmak için aşağıdaki butona tıklayın</p>
                    <button className="vc-join-btn conf" onClick={handleJoin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Konferansa Katıl
                    </button>
                    <p className="vc-lobby-hint">
                        {isAdmin ? '🎤 Moderatör olarak katılacaksınız' : '👁️ Dinleyici olarak katılacaksınız. Söz istemek için ✋ butonunu kullanın.'}
                    </p>
                </div>
            </div>
        );
    }

    // ─── CONNECTING ───
    if (phase === 'connecting') {
        return (
            <div className="vc-container">
                <div className="vc-lobby">
                    <div className="vc-connecting-spinner" />
                    <h2 className="vc-lobby-title">Bağlanılıyor...</h2>
                    <p className="vc-lobby-subtitle">Konferans odasına bağlantı kuruluyor</p>
                </div>
            </div>
        );
    }

    // ─── ERROR ───
    if (phase === 'error') {
        return (
            <div className="vc-container">
                <div className="vc-lobby">
                    <div className="vc-error-icon">⚠️</div>
                    <h2 className="vc-lobby-title" style={{ color: '#ef4444' }}>Bağlantı Hatası</h2>
                    <p className="vc-lobby-subtitle">{errorMsg}</p>
                    <button className="vc-join-btn conf" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    // ─── CONNECTED ───
    return (
        <div className="vc-container">
            {/* Header */}
            <div className="vc-header conf">
                <div className="vc-header-left">
                    <div className="vc-header-dot conf" />
                    <span className="vc-header-title">{channelName || 'Konferans'}</span>
                    <span className="vc-header-badge">{isAdmin ? '🎤 Moderatör' : canSpeak ? '🎙️ Konuşmacı' : '👁️ Dinleyici'}</span>
                </div>
                {isAdmin && raisedHands.length > 0 && (
                    <div className="vc-raised-hands-badge">
                        ✋ {raisedHands.length} söz isteği
                    </div>
                )}
            </div>

            {/* Raised Hands Panel (Admin) */}
            {isAdmin && raisedHands.length > 0 && (
                <div className="vc-raised-panel">
                    {raisedHands.map(h => (
                        <div key={h.userId} className="vc-raised-item">
                            <img className="vc-raised-avatar" src={h.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(h.username)}&background=6366f1&color=fff&size=28`} alt="" />
                            <span className="vc-raised-name">{h.displayName || h.username}</span>
                            <button className="vc-raised-btn approve" onClick={() => handleGrant(h.userId)} title="Söz Ver">✓</button>
                            <button className="vc-raised-btn deny" onClick={() => handleRevoke(h.userId)} title="Reddet">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Stage: Speakers */}
            <div className="vc-stage-section">
                <div className="vc-stage-label">🎤 Sahnede</div>
                <div className="vc-grid">
                    {/* Local as speaker */}
                    {(isAdmin || canSpeak) && (
                        <div className={`vc-card ${!localState.isMuted ? 'speaking' : ''}`}>
                            <div className="vc-card-video-area">
                                <div className="vc-card-avatar-area">
                                    <img className="vc-card-avatar" src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=a855f7&color=fff&size=80`} alt="" />
                                </div>
                            </div>
                            <div className="vc-card-info">
                                <span className="vc-card-name">{user?.profile?.displayName || user?.username} (Sen)</span>
                                <span className="vc-card-role">{isAdmin ? '🎤 Moderatör' : '🎙️ Konuşmacı'}</span>
                            </div>
                        </div>
                    )}
                    {speakers.map(p => (
                        <div key={p.identity} className={`vc-card ${p.isSpeaking ? 'speaking' : ''}`}>
                            <div className="vc-card-video-area">
                                <div className="vc-card-avatar-area">
                                    <img className="vc-card-avatar" src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=a855f7&color=fff&size=80`} alt="" />
                                </div>
                            </div>
                            <div className="vc-card-info">
                                <span className="vc-card-name">{p.name}</span>
                                {(p.role === 'owner' || p.role === 'admin') && <span className="vc-card-role">{p.role === 'owner' ? '👑' : '🛡️'}</span>}
                            </div>
                            {p.audioTrack && <audio ref={el => { if (el && p.audioTrack) p.audioTrack.attach(el); }} autoPlay style={{ display: 'none' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Listeners */}
            <div className="vc-stage-section listeners">
                <div className="vc-stage-label">👁️ Dinleyiciler ({listeners.length + (!isAdmin && !canSpeak ? 1 : 0)})</div>
                <div className="vc-listeners-grid">
                    {!isAdmin && !canSpeak && (
                        <div className="vc-listener-chip">
                            <img className="vc-listener-avatar" src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=6366f1&color=fff&size=28`} alt="" />
                            <span>{user?.profile?.displayName || user?.username} (Sen)</span>
                            {handRaised && <span>✋</span>}
                        </div>
                    )}
                    {listeners.map(p => (
                        <div key={p.identity} className="vc-listener-chip">
                            <img className="vc-listener-avatar" src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff&size=28`} alt="" />
                            <span>{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="vc-controls">
                {canSpeak && (
                    <>
                        <button className={`vc-ctrl-btn ${localState.isMuted ? 'off' : 'on'}`} onClick={toggleMic}>
                            {localState.isMuted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                            )}
                        </button>
                        <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'on' : 'off'}`} onClick={toggleCam}>
                            {localState.isCameraOn ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            )}
                        </button>
                    </>
                )}
                {!canSpeak && (
                    <button className={`vc-ctrl-btn raise-hand ${handRaised ? 'raised' : ''}`} onClick={handleRaiseHand}>
                        <span style={{ fontSize: '20px' }}>✋</span>
                    </button>
                )}
                <button className="vc-ctrl-btn leave" onClick={handleLeave}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        <line x1="23" y1="1" x2="17" y2="7" /><line x1="17" y1="1" x2="23" y2="7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ConferenceChannel;
