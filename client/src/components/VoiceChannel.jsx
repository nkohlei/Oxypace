import { useState, useRef, useEffect, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState, Track } from 'livekit-client';
import { useVoice } from '../context/VoiceContext';
import './VoiceChannel.css';

const VoiceChannel = ({ portalId, channelId, channelName }) => {
    const { getToken, joinRoom, leaveRoom, user } = useVoice();
    const roomRef = useRef(null);
    const [phase, setPhase] = useState('lobby'); // lobby | connecting | connected | error
    const [errorMsg, setErrorMsg] = useState('');
    const [participants, setParticipants] = useState([]); // [{ identity, name, avatar, isMuted, isCameraOn, isSpeaking, videoTrack, audioTrack }]
    const [localState, setLocalState] = useState({ isMuted: true, isCameraOn: false, isScreenSharing: false });
    const audioRefs = useRef({});
    const timeoutRef = useRef(null);

    // Cleanup on unmount or channel change
    useEffect(() => {
        return () => {
            handleLeave();
        };
    }, [channelId]);

    const updateParticipantList = useCallback((room) => {
        if (!room) return;
        const list = [];
        for (const p of room.remoteParticipants.values()) {
            let avatar = '';
            try { avatar = JSON.parse(p.metadata || '{}').avatar || ''; } catch { }
            const videoPub = Array.from(p.videoTrackPublications.values()).find(pub => pub.track && pub.source === Track.Source.Camera);
            const audioPub = Array.from(p.audioTrackPublications.values()).find(pub => pub.track);
            list.push({
                identity: p.identity,
                name: p.name || p.identity,
                avatar,
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

        // 15-second timeout
        timeoutRef.current = setTimeout(() => {
            if (roomRef.current?.state !== ConnectionState.Connected) {
                setErrorMsg('Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.');
                setPhase('error');
                if (roomRef.current) {
                    roomRef.current.disconnect().catch(() => { });
                    roomRef.current = null;
                }
            }
        }, 15000);

        try {
            const data = await getToken(portalId, channelId);
            const { token, serverUrl, roomName } = data;

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 24 } },
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
            room.on(RoomEvent.Disconnected, () => {
                setPhase('lobby');
                setParticipants([]);
                roomRef.current = null;
            });

            roomRef.current = room;
            await room.connect(serverUrl, token);
        } catch (err) {
            clearTimeout(timeoutRef.current);
            console.error('Voice connection error:', err);
            setErrorMsg(err.response?.data?.message || err.message || 'Bağlantı hatası');
            setPhase('error');
            if (roomRef.current) {
                roomRef.current.disconnect().catch(() => { });
                roomRef.current = null;
            }
        }
    }, [portalId, channelId, getToken, joinRoom, updateParticipantList, leaveRoom]);

    const handleLeave = useCallback(() => {
        clearTimeout(timeoutRef.current);
        if (roomRef.current) {
            roomRef.current.disconnect().catch(() => { });
            roomRef.current = null;
        }
        setPhase('lobby');
        setParticipants([]);
        setLocalState({ isMuted: true, isCameraOn: false, isScreenSharing: false });
        leaveRoom();
    }, [leaveRoom]);

    const toggleMic = useCallback(async () => {
        if (!roomRef.current?.localParticipant) return;
        const newMuted = !localState.isMuted;
        setLocalState(s => ({ ...s, isMuted: newMuted }));
        try {
            await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
        } catch (err) {
            console.error('Mic toggle error:', err);
        }
    }, [localState.isMuted]);

    const toggleCam = useCallback(async () => {
        if (!roomRef.current?.localParticipant) return;
        const newCam = !localState.isCameraOn;
        setLocalState(s => ({ ...s, isCameraOn: newCam }));
        try {
            await roomRef.current.localParticipant.setCameraEnabled(newCam);
        } catch (err) {
            console.error('Camera toggle error:', err);
        }
    }, [localState.isCameraOn]);

    const toggleScreen = useCallback(async () => {
        if (!roomRef.current?.localParticipant) return;
        const newScreen = !localState.isScreenSharing;
        setLocalState(s => ({ ...s, isScreenSharing: newScreen }));
        try {
            await roomRef.current.localParticipant.setScreenShareEnabled(newScreen);
        } catch (err) {
            console.error('Screen share error:', err);
            setLocalState(s => ({ ...s, isScreenSharing: false }));
        }
    }, [localState.isScreenSharing]);

    // Build local participant info
    const localParticipant = roomRef.current?.localParticipant;
    const localVideoTrack = localParticipant
        ? Array.from(localParticipant.videoTrackPublications?.values() || []).find(p => p.track && p.source === Track.Source.Camera)?.track
        : null;

    // ═════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════

    // ─── LOBBY ───
    if (phase === 'lobby') {
        return (
            <div className="vc-container">
                <div className="vc-lobby">
                    <div className="vc-lobby-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    </div>
                    <h2 className="vc-lobby-title">{channelName || 'Ses Kanalı'}</h2>
                    <p className="vc-lobby-subtitle">Sesli sohbete katılmak için aşağıdaki butona tıklayın</p>
                    <button className="vc-join-btn" onClick={handleJoin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Aramaya Katıl
                    </button>
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
                    <p className="vc-lobby-subtitle">Ses kanalına bağlantı kuruluyor</p>
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
                    <button className="vc-join-btn" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    // ─── CONNECTED ───
    return (
        <div className="vc-container">
            {/* Header */}
            <div className="vc-header">
                <div className="vc-header-left">
                    <div className="vc-header-dot" />
                    <span className="vc-header-title">{channelName || 'Ses Kanalı'}</span>
                    <span className="vc-header-badge">{participants.length + 1} katılımcı</span>
                </div>
            </div>

            {/* Participant Grid */}
            <div className="vc-grid">
                {/* Local user card */}
                <div className={`vc-card ${!localState.isMuted ? 'speaking' : ''}`}>
                    <div className="vc-card-video-area">
                        {localState.isCameraOn && localVideoTrack ? (
                            <video
                                className="vc-card-video"
                                ref={el => { if (el && localVideoTrack) localVideoTrack.attach(el); }}
                                autoPlay muted playsInline
                            />
                        ) : (
                            <div className="vc-card-avatar-area">
                                <img
                                    className="vc-card-avatar"
                                    src={user?.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=5865f2&color=fff&size=80`}
                                    alt=""
                                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=5865f2&color=fff&size=80`; }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="vc-card-info">
                        <span className="vc-card-name">{user?.profile?.displayName || user?.username || 'Sen'}</span>
                        <div className="vc-card-indicators">
                            {localState.isMuted && (
                                <div className="vc-indicator muted" title="Mikrofon kapalı">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Remote participant cards */}
                {participants.map(p => (
                    <div key={p.identity} className={`vc-card ${p.isSpeaking ? 'speaking' : ''}`}>
                        <div className="vc-card-video-area">
                            {p.isCameraOn && p.videoTrack ? (
                                <video
                                    className="vc-card-video"
                                    ref={el => { if (el && p.videoTrack) p.videoTrack.attach(el); }}
                                    autoPlay playsInline
                                />
                            ) : (
                                <div className="vc-card-avatar-area">
                                    <img
                                        className="vc-card-avatar"
                                        src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=5865f2&color=fff&size=80`}
                                        alt=""
                                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=5865f2&color=fff&size=80`; }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="vc-card-info">
                            <span className="vc-card-name">{p.name}</span>
                            <div className="vc-card-indicators">
                                {p.isMuted && (
                                    <div className="vc-indicator muted">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Hidden audio element */}
                        {p.audioTrack && (
                            <audio ref={el => { if (el && p.audioTrack) p.audioTrack.attach(el); }} autoPlay style={{ display: 'none' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Control Bar */}
            <div className="vc-controls">
                <button className={`vc-ctrl-btn ${localState.isMuted ? 'off' : 'on'}`} onClick={toggleMic} title={localState.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}>
                    {localState.isMuted ? (
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
                <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'on' : 'off'}`} onClick={toggleCam} title={localState.isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}>
                    {localState.isCameraOn ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    )}
                </button>
                <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'on' : 'off'}`} onClick={toggleScreen} title={localState.isScreenSharing ? 'Paylaşımı Durdur' : 'Ekran Paylaş'}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                </button>
                <button className="vc-ctrl-btn leave" onClick={handleLeave} title="Aramadan Ayrıl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        <line x1="23" y1="1" x2="17" y2="7" />
                        <line x1="17" y1="1" x2="23" y2="7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default VoiceChannel;
