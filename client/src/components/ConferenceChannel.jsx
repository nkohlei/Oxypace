import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import RoomTimer from './RoomTimer';
import { getImageUrl } from '../utils/imageUtils';
import { Crown, Shield, X, Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Settings, Users, Maximize, MessageCircle, Check, Hand, Volume2, RefreshCw, ChevronUp, VolumeX } from 'lucide-react';
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
        roomStartTime,
        availableDevices,
        facingMode,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        toggleDeafen,
        enumerateDevices
    } = useVoice();

    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isSpeakerMenuOpen, setIsSpeakerMenuOpen] = useState(false);

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

    const screenSharer = participants.find(p => p.screenShareTrack);
    const activeFocusIdentity = screenSharer ? screenSharer.identity : focusedIdentity;

    // ─── PARTIAL COMPONENTS ───
    const renderSpeakerCard = (p, isFocused = false) => {
        const isClickable = adminSpeakers.length + guestSpeakers.length > 1;

        // Prevent muted/locally detached tracks from rendering a solid black square
        const trackToRender = (isFocused && p.screenShareTrack) ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);

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
                                src={getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=transparent&color=fff&size=120`}
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
                            <Crown size={14} color="#fbbf24" strokeWidth={2} title="Kurucu" />
                        ) : p.role === 'admin' ? (
                            <Shield size={14} color="#60a5fa" strokeWidth={2} title="Yönetici" />
                        ) : ''}
                    </span>
                    <div className="vc-card-indicators">
                        {p.isMuted && (
                            <div className="vc-indicator muted" title="Mikrofon kapalı">
                                <Settings size={20} strokeWidth={2.5} />
                            </div>
                        )}
                        {!p.isLocal && p.connectionQuality !== undefined && (
                            <div className="vc-indicator ping" style={{ background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px', display: 'flex' }} title={`Bağlantı: ${p.connectionQuality === 1 ? 'Zayıf' : p.connectionQuality === 2 ? 'İyi' : p.connectionQuality === 3 ? 'Mükemmel' : 'Zayıf/Koptu'}`}>
                                <Settings size={14} strokeWidth={2} />
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
                        <Mic size={40} strokeWidth={1.5} />
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
                {/* RoomTimer removed from here, now in sidebar */}

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
                        <Users size={20} strokeWidth={2} />
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
                    <MessageCircle size={20} strokeWidth={2} />
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
                            <Settings size={20} strokeWidth={2} />
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
                            if (p.identity === activeFocusIdentity && !p.screenShareTrack) return null; // rendered in center instead
                            return renderSpeakerCard(p);
                        })}
                    </div>
                )}

                {/* Main Hero Area for Admins & Focused */}
                <div className="vc-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div className={`vc-grid layout-dynamic grid-1`} style={{ width: '100%', maxWidth: activeFocusIdentity ? '800px' : '600px', height: 'auto', maxHeight: '100%' }}>
                        {activeFocusIdentity ? (
                            // Render uniquely focused card
                            [...adminSpeakers, ...guestSpeakers].map(p => p.identity === activeFocusIdentity ? renderSpeakerCard(p, true) : null)
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
                                <X size={20} strokeWidth={2} />
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
                                            <img src={getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff&size=32`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                            {hasRaisedHand && (
                                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                                                    <MicOff size={12} strokeWidth={2} />
                                                </div>
                                            )}
                                            <span style={{ fontSize: '14px', fontWeight: hasRaisedHand ? 'bold' : 'normal' }}>{p.name}</span>
                                        </div>
                                        {isAdmin && hasRaisedHand && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="neumorphic-btn" style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#23a559', borderRadius: '6px' }} onClick={() => handleGrant(p.identity)} title="Söz Ver">
                                                    <Check size={14} strokeWidth={3} />
                                                </button>
                                                <button className="neumorphic-btn" style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f23f43', borderRadius: '6px' }} onClick={() => handleRevoke(p.identity)} title="Reddet">
                                                    <X size={14} strokeWidth={3} />
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
                        <div className="vc-ctrl-group">
                            <button
                                className={`vc-ctrl-btn neumorphic-btn ${localState.isMuted ? 'danger' : ''}`}
                                onClick={toggleMicrophone}
                                title={localState.isMuted ? "Sesi Aç" : "Sesi Kapat"}
                            >
                                {localState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                            <div 
                                className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    enumerateDevices();
                                    setIsMicMenuOpen(!isMicMenuOpen);
                                    setIsSpeakerMenuOpen(false);
                                }}
                            >
                                <ChevronUp size={16} />
                            </div>
                            {isMicMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '16px', padding: '12px', minWidth: '240px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '8px', padding: '0 4px', textTransform: 'uppercase' }}>Mikrofon Seçimi</div>
                                    {availableDevices.audioInputs.map(d => (
                                        <div 
                                            key={d.deviceId} 
                                            className={`vc-device-option ${room?.getActiveDevice('audioinput') === d.deviceId ? 'active' : ''}`}
                                            onClick={() => {
                                                setAudioInput(d.deviceId);
                                                setIsMicMenuOpen(false);
                                            }}
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Varsayılan Mikrofon'}</span>
                                            {room?.getActiveDevice('audioinput') === d.deviceId && <Check size={14} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className={`vc-ctrl-btn neumorphic-btn ${!localState.isCameraOn ? 'danger' : ''}`}
                            onClick={toggleCamera}
                            title={localState.isCameraOn ? "Kamerayı Kapat" : "Kamerayı Aç"}
                        >
                            {localState.isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>

                        <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                        <button
                            className={`vc-ctrl-btn neumorphic-btn ${localState.isScreenSharing ? 'active' : 'inset'}`}
                            onClick={toggleScreenShare}
                            title={localState.isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaş'}
                            style={localState.isScreenSharing ? { background: '#22c55e', color: 'white', borderColor: '#22c55e' } : {}}
                        >
                            {localState.isScreenSharing ? (
                                <ScreenShare size={22} strokeWidth={2} />
                            ) : (
                                <ScreenShare size={22} strokeWidth={2} />
                            )}
                        </button>

                        <div className="vc-ctrl-group">
                            <button
                                className={`vc-ctrl-btn neumorphic-btn ${localState.isDeafened ? 'danger action-btn-red' : 'action-btn-green'}`}
                                onClick={toggleDeafen}
                                title={localState.isDeafened ? "Sesi Duy" : "Sesi Kapat (Sağırlaştır)"}
                            >
                                {localState.isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                            <div 
                                className={`vc-device-arrow ${isSpeakerMenuOpen ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    enumerateDevices();
                                    setIsSpeakerMenuOpen(!isSpeakerMenuOpen);
                                    setIsMicMenuOpen(false);
                                }}
                            >
                                <ChevronUp size={16} />
                            </div>
                            {isSpeakerMenuOpen && (
                                <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', right: '0', marginBottom: '16px', padding: '12px', minWidth: '240px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '8px', padding: '0 4px', textTransform: 'uppercase' }}>Hoparlör Seçimi</div>
                                    {availableDevices.audioOutputs.map(d => (
                                        <div 
                                            key={d.deviceId} 
                                            className={`vc-device-option ${room?.getActiveDevice('audiooutput') === d.deviceId ? 'active' : ''}`}
                                            onClick={() => {
                                                setAudioOutput(d.deviceId);
                                                setIsSpeakerMenuOpen(false);
                                            }}
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Varsayılan Hoparlör'}</span>
                                            {room?.getActiveDevice('audiooutput') === d.deviceId && <Check size={14} />}
                                        </div>
                                    ))}

                                    {localState.isCameraOn && (
                                        <button 
                                            onClick={toggleFacingMode}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', marginTop: '8px', width: '100%', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                        >
                                            <RefreshCw size={14} />
                                            Kamerayı Çevir
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button
                        className={`vc-ctrl-btn neumorphic-btn ${handRaised ? 'active' : ''}`}
                        onClick={handleRaiseHand}
                        style={{ background: handRaised ? 'rgba(99, 102, 241, 0.5)' : undefined }}
                        title="Söz İste"
                    >
                        {/* Modern Hand SVG instead of Emoji */}
                        <Hand size={24} strokeWidth={2} />
                    </button>
                )}

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button className="vc-ctrl-btn neumorphic-btn leave action-btn-red danger" onClick={handleLeave} title="Aramadan Ayrıl">
                    <PhoneOff size={24} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
};

export default ConferenceChannel;
