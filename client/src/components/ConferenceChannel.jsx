import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import './VoiceChannel.css';

const ConferenceChannel = ({ portalId, channelId, channelName }) => {
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
        grantSpeak,
        revokeSpeak,
        sendChatMessage
    } = useVoice();

    const { socket } = useSocket();
    const { user } = useAuth();

    // Conference specific state
    const [raisedHands, setRaisedHands] = useState([]);
    const [handRaised, setHandRaised] = useState(false);
    const [canSpeak, setCanSpeak] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Is this channel the active global room?
    const isActiveRoom = activeRoom?.channelId === channelId;
    const isConnected = isActiveRoom && connectionState === ConnectionState.Connected;
    const isConnecting = isActiveRoom && connectionState === ConnectionState.Connecting;

    const userRole = activeRoom?.userRole || 'member';
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    // Initialize canSpeak based on role & mode
    useEffect(() => {
        if (isActiveRoom && activeRoom) {
            setCanSpeak(isAdmin || activeRoom.roomMode !== 'stage');
        }
    }, [isActiveRoom, activeRoom, isAdmin]);

    // Cleanup purely UI local state if we disconnect
    useEffect(() => {
        if (!isActiveRoom) {
            setRaisedHands([]);
            setHandRaised(false);
            setCanSpeak(false);
        }
    }, [isActiveRoom]);

    // Socket listeners for raise hand / permissions
    useEffect(() => {
        if (!socket || !isActiveRoom) return;

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
    }, [socket, user, isActiveRoom]);

    const handleJoin = () => {
        connectToChannel(portalId, channelId);
    };

    const handleLeave = () => {
        disconnectFromChannel();
    };

    const handleRaiseHand = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        if (socket && activeRoom) {
            socket.emit('voice:raise-hand', {
                roomName: activeRoom.roomName,
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

    // Derived states
    // A participant is a speaker if they are an admin OR if they are unmuted/have camera on (and are on stage)
    const speakerParticipants = participants.filter(p => !p.isLocal && (p.role === 'owner' || p.role === 'admin' || !p.isMuted || p.isCameraOn));
    const listenerParticipants = participants.filter(p => !p.isLocal && p.role !== 'owner' && p.role !== 'admin' && p.isMuted && !p.isCameraOn);

    // ─── PARTIAL COMPONENTS ───
    const renderSpeakerCard = (p) => {
        return (
            <div key={p.identity} className={`vc-card ${p.isSpeaking ? 'speaking' : ''}`}>
                <div className="vc-card-video-area">
                    {p.isCameraOn && p.videoTrack ? (
                        <video
                            className="vc-card-video"
                            ref={el => { if (el && p.videoTrack) p.videoTrack.attach(el); }}
                            autoPlay
                            muted={p.isLocal} // Native mute for local
                            playsInline
                        />
                    ) : (
                        <div className="vc-card-avatar-area" style={getCardBackground(p.identity)}>
                            <img
                                className="vc-card-avatar"
                                src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=transparent&color=fff&size=120`}
                                alt=""
                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=transparent&color=fff&size=120`; }}
                            />
                        </div>
                    )}

                    {/* IMPORTANT FIX: Render remote audio tracks */}
                    {!p.isLocal && p.audioTrack && (
                        <AudioTrackPlayer track={p.audioTrack} />
                    )}
                </div>

                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <span className="vc-card-role" style={{ fontSize: '12px', marginLeft: '4px' }}>
                        {p.role === 'owner' ? '👑' : p.role === 'admin' ? '🛡️' : ''}
                    </span>
                    <div className="vc-card-indicators">
                        {p.isMuted && (
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
        );
    };

    // Helper to generate dynamic subtle gradients based on identity
    const getCardBackground = (identity) => {
        if (!identity) return { background: '#2b2d31' };

        let hash = 0;
        for (let i = 0; i < identity.length; i++) {
            hash = identity.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue1 = hash % 360;
        const hue2 = (hash * 13) % 360;

        return {
            background: `linear-gradient(135deg, hsl(${hue1}, 50%, 20%), hsl(${hue2}, 40%, 15%))`
        };
    };

    // ─── LOBBY ───
    if (!isActiveRoom) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-lobby-icon conf glass-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <h2 className="vc-lobby-title">{channelName || 'Konferans Odası'}</h2>
                    <p className="vc-lobby-subtitle">Konferansa katılmak için aşağıdaki butona tıklayın</p>
                    <button className="vc-join-btn conf glass-join-btn action-btn-large" onClick={handleJoin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Konferansa Katıl
                    </button>
                    {activeRoom && (
                        <p className="vc-lobby-warning" style={{ marginTop: '16px' }}>
                            Katıldığınızda diğer kanaldan otomatik ayrılırsınız.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ─── CONNECTING ───
    if (isConnecting) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-connecting-spinner loader" />
                    <h2 className="vc-lobby-title">Bağlanılıyor...</h2>
                    <p className="vc-lobby-subtitle">Konferans odasına bağlantı kuruluyor</p>
                </div>
            </div>
        );
    }

    // ─── ERROR ───
    if (connectionState === ConnectionState.Disconnected && errorMsg) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-error-icon glass-icon error">⚠️</div>
                    <h2 className="vc-lobby-title" style={{ color: '#ef4444' }}>Bağlantı Hatası</h2>
                    <p className="vc-lobby-subtitle">{errorMsg}</p>
                    <button className="vc-join-btn conf neumorphic-btn action-btn-large" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    // ─── CONNECTED ───
    const localUserObject = {
        identity: user?._id,
        name: user?.profile?.displayName || user?.username,
        avatar: user?.profile?.avatar || '',
        isLocal: true,
        role: userRole,
        isMuted: localState.isMuted,
        isCameraOn: localState.isCameraOn,
        isSpeaking: participants.find(p => p.isLocal)?.isSpeaking,
        videoTrack: participants.find(p => p.isLocal)?.videoTrack
    };

    return (
        <div className="vc-container glass-container">
            {/* Header */}
            <div className="vc-header conf">
                <div className="vc-header-left">
                    <div className="vc-header-dot conf" />
                    <span className="vc-header-title">{channelName || 'Konferans'}</span>
                    <span className="vc-header-badge glass-badge">{isAdmin ? '🎤 Moderatör' : canSpeak ? '🎙️ Konuşmacı' : '👁️ Dinleyici'}</span>
                </div>
                <div className="vc-header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isAdmin && raisedHands.length > 0 && (
                        <div className="glass-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                            ✋ {raisedHands.length} söz isteği
                        </div>
                    )}
                    <button
                        className={`vc-ctrl-btn neumorphic-btn circular ${isChatOpen ? 'active' : ''}`}
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        title="Sohbeti Aç/Kapat"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Raised Hands Panel (Admin) */}
            {isAdmin && raisedHands.length > 0 && (
                <div className="vc-raised-panel glass-panel" style={{ padding: '8px 16px', marginBottom: '16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {raisedHands.map(h => (
                        <div key={h.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '16px' }}>
                            <img src={h.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(h.username)}&background=6366f1&color=fff&size=28`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{h.displayName || h.username}</span>
                            <button className="icon-btn" style={{ color: '#23a559' }} onClick={() => handleGrant(h.userId)} title="Söz Ver">✓</button>
                            <button className="icon-btn" style={{ color: '#f23f43' }} onClick={() => handleRevoke(h.userId)} title="Reddet">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Viewport Area */}
            <div className="vc-viewport custom-scrollbar" style={{ gap: '24px', display: 'block' }}>

                {/* Stage: Speakers */}
                <div className="vc-stage-section">
                    <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'rgba(255,255,255,0.8)' }}>🎤 Sahnede</div>

                    {/* Always ensure speakers are arranged flexibly in the grid architecture */}
                    <div className="vc-grid layout-dynamic grid-3" style={{ height: 'auto', minHeight: '300px', paddingBottom: '16px' }}>

                        {/* Local speaker (if they have mic privileges) */}
                        {(isAdmin || canSpeak) && renderSpeakerCard(localUserObject)}

                        {/* Remote Speakers */}
                        {speakerParticipants.map(p => renderSpeakerCard(p))}
                    </div>
                </div>

                {/* Listeners */}
                <div className="vc-stage-section listeners" style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        👁️ Dinleyiciler ({listenerParticipants.length + (!isAdmin && !canSpeak ? 1 : 0)})
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {!isAdmin && !canSpeak && (
                            <div className="glass-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <img src={localUserObject.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(localUserObject.name)}&background=6366f1&color=fff&size=28`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                <span>{localUserObject.name} (Sen)</span>
                                {handRaised && <span>✋</span>}
                            </div>
                        )}
                        {listenerParticipants.map(p => (
                            <div key={p.identity} className="glass-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <img src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff&size=28`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="vc-controls glass-controls">
                {canSpeak ? (
                    <>
                        <button
                            className={`vc-ctrl-btn neumorphic-btn circular ${localState.isMuted ? 'inset muted danger' : 'active'}`}
                            onClick={toggleMicrophone}
                            title={localState.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
                        >
                            {localState.isMuted ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                            )}
                        </button>
                        <button
                            className={`vc-ctrl-btn neumorphic-btn circular ${localState.isCameraOn ? 'active' : 'inset'}`}
                            onClick={toggleCamera}
                            title={localState.isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                        >
                            {localState.isCameraOn ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            )}
                        </button>
                    </>
                ) : (
                    <button
                        className={`vc-ctrl-btn neumorphic-btn circular ${handRaised ? 'active' : ''}`}
                        onClick={handleRaiseHand}
                        style={{ background: handRaised ? 'rgba(99, 102, 241, 0.5)' : undefined }}
                        title="Söz İste"
                    >
                        <span style={{ fontSize: '20px' }}>✋</span>
                    </button>
                )}

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button className="vc-ctrl-btn neumorphic-btn circular leave action-btn-red danger" onClick={handleLeave} title="Aramadan Ayrıl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        <line x1="23" y1="1" x2="17" y2="7" /><line x1="17" y1="1" x2="23" y2="7" />
                    </svg>
                </button>
            </div>

            {/* Sliding Text Chat Sidebar */}
            {isChatOpen && (
                <VoiceChatSidebar
                    messages={chatMessages}
                    onSendMessage={sendChatMessage}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
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

export default ConferenceChannel;
