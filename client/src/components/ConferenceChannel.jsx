import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import RoomTimer from './RoomTimer';
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
        toggleScreenShare,
        grantSpeak,
        revokeSpeak,
        sendChatMessage,
        roomStartTime
    } = useVoice();

    const { socket } = useSocket();
    const { user } = useAuth();

    // Conference specific state
    const [raisedHands, setRaisedHands] = useState([]);
    const [handRaised, setHandRaised] = useState(false);
    const [canSpeak, setCanSpeak] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatRestricted, setIsChatRestricted] = useState(false);
    const [isListenersOpen, setIsListenersOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [focusedIdentity, setFocusedIdentity] = useState(null);

    // Pre-join stats
    const [lobbyCount, setLobbyCount] = useState(null);

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

    // Fetch lobby count on mount
    useEffect(() => {
        if (isActiveRoom || !portalId || !channelId) return;

        let isMounted = true;
        const fetchCount = async () => {
            try {
                const res = await axios.get(`/api/voice/rooms/${portalId}/${channelId}/participants?t=${Date.now()}`);
                if (isMounted && res.data && res.data.participants) {
                    setLobbyCount(res.data.participants.length);
                }
            } catch (err) {
                console.error("Failed to fetch lobby count", err);
                if (isMounted) setLobbyCount(0);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 2000); // refresh every 2s for real-time feel
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isActiveRoom, portalId, channelId]);

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
            if (String(userId) === String(user?._id)) {
                setCanSpeak(canPublish);
            }
            if (canPublish) {
                setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(userId)));
            }
        };

        const onChatMode = ({ restricted }) => {
            setIsChatRestricted(restricted);
        };

        socket.on('voice:raise-hand', onRaiseHand);
        socket.on('voice:permissions-updated', onPermissions);
        socket.on('voice:chat-mode', onChatMode);

        return () => {
            socket.off('voice:raise-hand', onRaiseHand);
            socket.off('voice:permissions-updated', onPermissions);
            socket.off('voice:chat-mode', onChatMode);
        };
    }, [socket, user, isActiveRoom]);

    const toggleChatMode = () => {
        if (!isAdmin || !socket || !activeRoom) return;
        socket.emit('voice:chat-mode-toggle', { roomName: activeRoom.roomName, restricted: !isChatRestricted });
    };

    const handleJoin = () => {
        connectToChannel(portalId, channelId);
    };

    const handleLeave = () => {
        disconnectFromChannel();
    };

    const handleSendMessage = (text) => {
        // Prevent backend/API spam by enforcing state explicitly before context trigger
        if (isChatRestricted && !isAdmin) {
            console.warn("Chat is restricted. Message blocked.");
            return;
        }
        sendChatMessage(text);
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
        try {
            await grantSpeak(portalId, channelId, userId);
            setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(userId)));
        } catch (e) { console.error(e); }
    };

    const handleRevoke = async (userId) => {
        try {
            await revokeSpeak(portalId, channelId, userId);
            setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(userId)));
        } catch (e) { console.error(e); }
    };

    // ─── CONNECTED STATE BASE ───
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

    // Derived states
    // Admins are always speakers. Guests become speakers if they can publish (unmuted or camera on)
    const adminSpeakers = participants.filter(p => !p.isLocal && (p.role === 'owner' || p.role === 'admin'));
    if (isAdmin) adminSpeakers.unshift(localUserObject);

    const guestSpeakers = participants.filter(p => !p.isLocal && p.role !== 'owner' && p.role !== 'admin' && (!p.isMuted || p.isCameraOn));
    if (!isAdmin && canSpeak) guestSpeakers.unshift(localUserObject);

    const listenerParticipants = participants.filter(p => !p.isLocal && p.role !== 'owner' && p.role !== 'admin' && p.isMuted && !p.isCameraOn);

    // ─── PARTIAL COMPONENTS ───
    const renderSpeakerCard = (p, isFocused = false) => {
        const isClickable = adminSpeakers.length + guestSpeakers.length > 1;
        const trackToRender = (isFocused && p.screenShareTrack) ? p.screenShareTrack : p.videoTrack;

        return (
            <div
                key={`${p.identity}-speaker`}
                className={`vc-card role-grid ${p.isSpeaking ? 'speaking' : ''} ${isFocused ? 'focused' : ''}`}
                onClick={() => {
                    if (isClickable) {
                        setFocusedIdentity(isFocused ? null : p.identity);
                    }
                }}
                style={{ cursor: isClickable ? 'pointer' : 'default', transition: 'all 0.3s ease' }}
            >
                <div className="vc-card-video-area">
                    {trackToRender ? (
                        <video
                            className="vc-card-video"
                            ref={el => { if (el && trackToRender) trackToRender.attach(el); }}
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

                    {/* Audio track rendering is now handled globally in VoiceContext.jsx to prevent cutoffs */}
                </div>

                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <span className="vc-card-role" style={{ fontSize: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                        {p.role === 'owner' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" width="14" height="14" title="Kurucu">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        ) : p.role === 'admin' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" width="14" height="14" title="Yönetici">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        ) : ''}
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
                        {!p.isLocal && p.connectionQuality !== undefined && (
                            <div className="vc-indicator ping" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px', display: 'flex' }} title={`Bağlantı: ${p.connectionQuality === 1 ? 'Zayıf' : p.connectionQuality === 2 ? 'İyi' : p.connectionQuality === 3 ? 'Mükemmel' : 'Zayıf/Koptu'}`}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                    <rect x="2" y="16" width="4" height="6" rx="1" fill={p.connectionQuality >= 1 ? (p.connectionQuality === 1 ? '#ef4444' : '#22c55e') : '#4b5563'} />
                                    <rect x="10" y="10" width="4" height="12" rx="1" fill={p.connectionQuality >= 2 ? '#22c55e' : '#4b5563'} />
                                    <rect x="18" y="4" width="4" height="18" rx="1" fill={p.connectionQuality === 3 ? '#22c55e' : '#4b5563'} />
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
            <div className="vc-container glass-container lobby-bg" style={{ background: 'linear-gradient(135deg, rgba(8,10,15,0.95), rgba(18,20,30,0.95))' }}>
                <div className="vc-lobby glass-panel" style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.08)', padding: '40px', maxWidth: '460px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>

                    {/* Top Right Live Participant Badge */}
                    {lobbyCount !== null && (
                        <div style={{
                            position: 'absolute', top: '20px', right: '20px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(0,0,0,0.4)', padding: '8px 14px',
                            borderRadius: '20px', fontSize: '13px', fontWeight: '500',
                            color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: lobbyCount > 0 ? '#23a559' : 'var(--text-muted)',
                                boxShadow: lobbyCount > 0 ? '0 0 10px #23a559' : 'none',
                                animation: lobbyCount > 0 ? 'pulse 2s infinite' : 'none'
                            }} />
                            <span>İçeride: {lobbyCount} Kişi</span>
                        </div>
                    )}

                    <div className="vc-lobby-icon conf glass-icon" style={{ width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', marginBottom: '24px' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>
                    <h2 className="vc-lobby-title" style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {channelName || 'Seminer Odası'}
                    </h2>
                    <p className="vc-lobby-subtitle" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px', lineHeight: '1.5' }}>
                        Şu an dinleyici bekleme salonundasınız. Ses ve görüntü kapalı olarak katılacaksınız. İçeriden söz hakkı isteyebilirsiniz.
                    </p>

                    <button
                        className="vc-join-btn conf glass-join-btn action-btn-large"
                        onClick={handleJoin}
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', padding: '16px', fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}
                    >
                        Salona Geçiş Yap
                    </button>
                    {activeRoom && (
                        <p className="vc-lobby-warning" style={{ marginTop: '20px', fontSize: '13px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
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
                    <p className="vc-lobby-subtitle">Seminer odasına bağlantı kuruluyor</p>
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
    return (
        <div className="vc-container glass-container">
            {/* Isolated Top Right Controls */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 110, display: 'flex', gap: '12px', alignItems: 'center' }}>
                {roomStartTime && <RoomTimer startedAt={roomStartTime} />}

                {/* Removed floating Chat Mode Toggle, now inside Settings menu */}

                {isAdmin && (
                    <button
                        className={`vc-ctrl-btn neumorphic-btn ${isListenersOpen ? 'active' : ''}`}
                        onClick={() => {
                            setIsListenersOpen(!isListenersOpen);
                            setIsChatOpen(false);
                            setIsSettingsOpen(false);
                        }}
                        title="Dinleyiciler"
                        style={{ position: 'relative' }}
                    >
                        {raisedHands.length > 0 && isAdmin && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {raisedHands.length}
                            </span>
                        )}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </button>
                )}

                <button
                    className={`vc-ctrl-btn neumorphic-btn ${isChatOpen ? 'active' : ''}`}
                    onClick={() => {
                        setIsChatOpen(!isChatOpen);
                        setIsListenersOpen(false);
                        setIsSettingsOpen(false);
                    }}
                    title="Sohbet"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                </button>

                {/* Settings Icon with Dropdown */}
                {isAdmin && (
                    <div style={{ position: 'relative' }}>
                        <button
                            className={`vc-ctrl-btn neumorphic-btn ${isSettingsOpen ? 'active' : ''}`}
                            title="Seminer Ayarları"
                            onClick={() => {
                                setIsSettingsOpen(!isSettingsOpen);
                                setIsChatOpen(false);
                                setIsListenersOpen(false);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                        {isSettingsOpen && isAdmin && (
                            <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', top: '100%', right: '0', marginTop: '12px', padding: '12px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 120 }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Yönetici Konfor Araçları
                                </div>
                                <div style={{ padding: '4px 0', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px', cursor: 'pointer', background: 'transparent' }} onClick={toggleChatMode}>
                                        <span style={{ fontSize: '14px', color: 'white' }}>Herkese Açık Sohbet</span>
                                        <div className={`switch-toggle ${!isChatRestricted ? 'on' : 'off'}`} style={{ width: '40px', height: '22px', background: !isChatRestricted ? '#23a559' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', transition: 'background 0.3s' }}>
                                            <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: !isChatRestricted ? '20px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Viewport Area (Spotlight / Left Strip layout) */}
            <div className="vc-viewport layout-spotlight" style={{ padding: '80px 24px 100px 24px' }}>

                {/* Left Strip for Guests (If any exist) */}
                {guestSpeakers.length > 0 && (
                    <div className="vc-carousel custom-scrollbar" style={{ width: '200px', flexShrink: 0 }}>
                        {guestSpeakers.map(p => {
                            if (p.identity === focusedIdentity && !p.screenShareTrack) return null; // rendered in center instead
                            return renderSpeakerCard(p);
                        })}
                    </div>
                )}

                {/* Main Hero Area for Admins & Focused */}
                <div className="vc-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div className={`vc-grid layout-dynamic grid-1`} style={{ width: '100%', maxWidth: focusedIdentity ? '800px' : '600px', height: 'auto', maxHeight: '100%' }}>
                        {focusedIdentity ? (
                            // Render uniquely focused card
                            [...adminSpeakers, ...guestSpeakers].map(p => p.identity === focusedIdentity ? renderSpeakerCard(p, true) : null)
                        ) : (
                            // Default: Render all admins
                            adminSpeakers.map(p => renderSpeakerCard(p))
                        )}
                    </div>
                </div>

            </div>

            {/* Sliding Sidebars (Listeners & Chat) */}
            <div style={{ position: 'absolute', right: '24px', top: '84px', bottom: '96px', display: 'flex', gap: '16px', zIndex: 100, pointerEvents: 'none' }}>
                {/* Listeners Sidebar */}
                {isListenersOpen && (
                    <div className="voice-chat-sidebar glass-panel" style={{ position: 'relative', right: 'auto', top: 'auto', bottom: 'auto', width: '280px', pointerEvents: 'auto', animation: 'sidebarPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <div className="chat-header">
                            <h3>Dinleyiciler ({listenerParticipants.length + (!isAdmin && !canSpeak ? 1 : 0)})</h3>
                            <button className="chat-close-btn icon-btn" onClick={() => setIsListenersOpen(false)}>
                                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="chat-messages custom-scrollbar" style={{ gap: '8px' }}>
                            {!isAdmin && !canSpeak && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={localUserObject.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(localUserObject.name)}&background=6366f1&color=fff&size=28`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{localUserObject.name} (Sen)</span>
                                    </div>
                                    {handRaised && <span style={{ fontSize: '18px' }}>✋</span>}
                                </div>
                            )}
                            {listenerParticipants.map(p => {
                                const hasRaisedHand = raisedHands.some(h => h.userId === p.identity);
                                return (
                                    <div key={p.identity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: hasRaisedHand ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                                            <img src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff&size=32`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                            {hasRaisedHand && (
                                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                                        <path d="M18 11V6a2 2 0 0 0-4 0v4 M14 11V4a2 2 0 0 0-4 0v6 M10 11V5a2 2 0 0 0-4 0v8.5 M6 13.5V9a2 2 0 0 0-4 0v7.5A6.5 6.5 0 0 0 8.5 23H14a7 7 0 0 0 7-7v-3a2 2 0 0 0-4 0v2" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span style={{ fontSize: '14px', fontWeight: hasRaisedHand ? 'bold' : 'normal' }}>{p.name}</span>
                                        </div>
                                        {isAdmin && hasRaisedHand && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="neumorphic-btn" style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#23a559', borderRadius: '6px' }} onClick={() => handleGrant(p.identity)} title="Söz Ver">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </button>
                                                <button className="neumorphic-btn" style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f23f43', borderRadius: '6px' }} onClick={() => handleRevoke(p.identity)} title="Reddet">
                                                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* Chat Sidebar */}
                {isChatOpen && (
                    <div style={{ position: 'relative', pointerEvents: 'auto', width: '300px', height: '100%', animation: 'sidebarPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <VoiceChatSidebar
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            onClose={() => setIsChatOpen(false)}
                            isRestricted={isChatRestricted}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls (Centered Symmetrically) */}
            <div className="vc-controls glass-controls" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', zIndex: 120 }}>
                {canSpeak ? (
                    <>
                        <button
                            className={`vc-ctrl-btn neumorphic-btn ${localState.isMuted ? 'inset muted danger' : 'active'}`}
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
                            className={`vc-ctrl-btn neumorphic-btn ${localState.isCameraOn ? 'active' : 'inset'}`}
                            onClick={toggleCamera}
                            title={localState.isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                        >
                            {localState.isCameraOn ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            )}
                        </button>

                        <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                        <button
                            className={`vc-ctrl-btn neumorphic-btn ${localState.isScreenSharing ? 'active' : 'inset'}`}
                            onClick={toggleScreenShare}
                            title={localState.isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaş'}
                            style={localState.isScreenSharing ? { background: '#22c55e', color: 'white', borderColor: '#22c55e' } : {}}
                        >
                            {localState.isScreenSharing ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                    <line x1="8" y1="21" x2="16" y2="21" />
                                    <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                            )}
                        </button>
                    </>
                ) : (
                    <button
                        className={`vc-ctrl-btn neumorphic-btn ${handRaised ? 'active' : ''}`}
                        onClick={handleRaiseHand}
                        style={{ background: handRaised ? 'rgba(99, 102, 241, 0.5)' : undefined }}
                        title="Söz İste"
                    >
                        {/* Modern Hand SVG instead of Emoji */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M18 11V6a2 2 0 0 0-4 0v4" />
                            <path d="M14 11V4a2 2 0 0 0-4 0v6" />
                            <path d="M10 11V5a2 2 0 0 0-4 0v8.5" />
                            <path d="M6 13.5V9a2 2 0 0 0-4 0v7.5A6.5 6.5 0 0 0 8.5 23H14a7 7 0 0 0 7-7v-3a2 2 0 0 0-4 0v2" />
                        </svg>
                    </button>
                )}

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button className="vc-ctrl-btn neumorphic-btn leave action-btn-red danger" onClick={handleLeave} title="Aramadan Ayrıl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        <line x1="23" y1="1" x2="17" y2="7" /><line x1="17" y1="1" x2="23" y2="7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ConferenceChannel;
