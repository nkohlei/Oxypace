import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { Crown, Shield, X, Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Users, MessageCircle, Check, Hand, Volume2, RefreshCw, ChevronUp, ChevronDown, VolumeX, MonitorUp } from 'lucide-react';
import './VoiceChannel.css';

const RoomTimer = ({ startTime }) => {
    const [elapsed, setElapsed] = useState('00:00');
    useEffect(() => {
        if (!startTime) return;
        const interval = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            setElapsed(h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);
    return <span className="vc-timer">{elapsed}</span>;
};

const ConferenceChannel = ({ portalId, channelId, channelName }) => {
    const {
        activeRoom,
        connectionState,
        participants,
        roomStartTime,
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
        availableDevices,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        setVideoInput,
        toggleDeafen,
        selectedAudioInput,
        selectedAudioOutput,
        selectedVideoInput
    } = useVoice();

    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isListenersOpen, setIsListenersOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const { socket } = useSocket();
    const { user } = useAuth();
    const [raisedHands, setRaisedHands] = useState([]);
    const [handRaised, setHandRaised] = useState(false);
    const [canSpeak, setCanSpeak] = useState(false);
    const [isChatRestricted, setIsChatRestricted] = useState(false);

    const isActiveRoom = activeRoom?.channelId === channelId;
    const isConnected = isActiveRoom && connectionState === ConnectionState.Connected;
    const isConnecting = isActiveRoom && connectionState === ConnectionState.Connecting;
    const userRole = activeRoom?.userRole || 'member';
    const isAdmin = userRole === 'owner' || userRole === 'admin';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isActiveRoom && activeRoom) setCanSpeak(isAdmin || activeRoom.roomMode !== 'stage');
    }, [isActiveRoom, activeRoom, isAdmin]);

    useEffect(() => {
        if (!isActiveRoom) { setRaisedHands([]); setHandRaised(false); setCanSpeak(false); }
    }, [isActiveRoom]);

    useEffect(() => {
        if (isActiveRoom || !portalId || !channelId) return;
        let isMounted = true;
        const fetchCount = async () => {
            try {
                const res = await axios.get(`/api/voice/rooms/${portalId}/${channelId}/participants?t=${Date.now()}`);
                if (isMounted && res.data?.participants) setLobbyCount(res.data.participants.length);
            } catch (err) { if (isMounted) setLobbyCount(0); }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 10000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [isActiveRoom, portalId, channelId]);

    useEffect(() => {
        if (!socket || !isActiveRoom) return;
        const onRaiseHand = (data) => {
            setRaisedHands(prev => data.raised ? (prev.find(h => h.userId === data.userId) ? prev : [...prev, data]) : prev.filter(h => h.userId !== data.userId));
        };
        const onPermissions = ({ userId, canPublish }) => { if (String(userId) === String(user?._id)) setCanSpeak(canPublish); if (canPublish) setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(userId))); };
        const onChatMode = ({ restricted }) => setIsChatRestricted(restricted);
        socket.on('voice:raise-hand', onRaiseHand);
        socket.on('voice:permissions-updated', onPermissions);
        socket.on('voice:chat-mode', onChatMode);
        return () => { socket.off('voice:raise-hand', onRaiseHand); socket.off('voice:permissions-updated', onPermissions); socket.off('voice:chat-mode', onChatMode); };
    }, [socket, user, isActiveRoom]);

    const handleJoin = () => connectToChannel(portalId, channelId);
    const handleLeave = () => disconnectFromChannel();
    const handleSendMessage = (text) => { if (isChatRestricted && !isAdmin) return; sendChatMessage(text); };
    const handleRaiseHand = () => {
        const newState = !handRaised; setHandRaised(newState);
        if (socket && activeRoom) socket.emit('voice:raise-hand', { roomName: activeRoom.roomName, userId: user?._id, username: user?.username, avatar: user?.profile?.avatar || '', raised: newState });
    };
    const handleGrant = async (id) => { try { await grantSpeak(portalId, channelId, id); setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(id))); } catch (e) { console.error(e); } };
    const handleRevoke = async (id) => { try { await revokeSpeak(portalId, channelId, id); setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(id))); } catch (e) { console.error(e); } };

    const renderSpeakerCard = (p, isFocused = false) => {
        const trackToRender = (isFocused && p.screenShareTrack) ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);
        return (
            <div key={`${p.identity}-speaker`} className={`vc-card role-grid ${p.isSpeaking ? 'speaking' : ''} ${isFocused ? 'focused' : ''}`} onClick={() => setFocusedIdentity(isFocused ? null : p.identity)}>
                <div className="vc-card-video-area">
                    {trackToRender ? (
                        <video className="vc-card-video" ref={el => { if (el && trackToRender) trackToRender.attach(el); }} autoPlay muted={p.isLocal} playsInline />
                    ) : (
                        <div className="vc-card-avatar-area" style={getCardBackground(p.identity)}>
                            <img className="vc-card-avatar" src={getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=transparent&color=fff&size=120`} alt="" />
                        </div>
                    )}
                </div>
                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <span className="vc-card-role">
                        {p.role === 'owner' ? <Crown size={14} color="#fbbf24" /> : p.role === 'admin' ? <Shield size={14} color="#60a5fa" /> : ''}
                    </span>
                </div>
            </div>
        );
    };

    const getCardBackground = (id) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return { background: `linear-gradient(135deg, hsl(${hash % 360}, 50%, 20%), hsl((hash * 13) % 360, 40%, 15%))` };
    };

    if (!isActiveRoom) {
        return (
            <div className="vc-container glass-container lobby-bg">
                <div className="vc-lobby">
                    {lobbyCount !== null && (
                        <div className="glass-badge" style={{ marginBottom: '24px' }}>
                            Şu an içeride {lobbyCount} kişi var
                        </div>
                    )}
                    <div className="vc-lobby-icon conf"><Mic size={40} /></div>
                    <h2 className="vc-lobby-title">{channelName || 'Seminer Odası'}</h2>
                    <button className="vc-join-btn conf glass-join-btn action-btn-large" onClick={handleJoin} style={{ marginTop: '24px' }}>Salona Geçiş Yap</button>
                </div>
            </div>
        );
    }

    if (isConnecting) return <div className="vc-container glass-container"><div className="vc-lobby glass-panel"><div className="vc-connecting-spinner loader" /><h2 className="vc-lobby-title">Bağlanılıyor...</h2></div></div>;

    const localUserObject = { identity: user?._id, name: user?.profile?.displayName || user?.username, avatar: user?.profile?.avatar || '', isLocal: true, role: userRole, isMuted: localState.isMuted, isCameraOn: localState.isCameraOn, isSpeaking: participants.find(p => p.isLocal)?.isSpeaking, videoTrack: participants.find(p => p.isLocal)?.videoTrack };
    const adminSpeakers = participants.filter(p => !p.isLocal && (p.role === 'owner' || p.role === 'admin'));
    if (isAdmin) adminSpeakers.unshift(localUserObject);
    const guestSpeakers = participants.filter(p => !p.isLocal && p.role !== 'owner' && p.role !== 'admin' && (!p.isMuted || p.isCameraOn));
    if (!isAdmin && canSpeak) guestSpeakers.unshift(localUserObject);
    const listenerParticipants = participants.filter(p => !p.isLocal && p.role !== 'owner' && p.role !== 'admin' && p.isMuted && !p.isCameraOn);
    const screenSharer = participants.find(p => p.screenShareTrack);
    const activeFocusIdentity = screenSharer ? screenSharer.identity : focusedIdentity;

    return (
        <div className="vc-container glass-container">
            <div className="vc-header-info">
                <div className="vc-channel-name-row">
                    <Mic size={20} className="vc-channel-icon" />
                    <span className="vc-channel-name">{channelName}</span>
                    <RoomTimer startTime={roomStartTime} />
                </div>
            </div>

            <div className="vc-top-right-controls">
                {isAdmin && (
                    <button className={`vc-ctrl-btn ${isListenersOpen ? 'active' : ''}`} onClick={() => { setIsListenersOpen(!isListenersOpen); setIsChatOpen(false); setIsSettingsOpen(false); }}>
                        <Users size={18} />
                        {raisedHands.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{raisedHands.length}</span>}
                    </button>
                )}
                <button className={`vc-ctrl-btn ${isChatOpen ? 'active' : ''}`} onClick={() => { setIsChatOpen(!isChatOpen); setIsListenersOpen(false); setIsSettingsOpen(false); }} title="Sohbet">
                    <MessageCircle size={18} />
                    {participants.length > 0 && <span className="vc-participant-badge">{participants.length}</span>}
                </button>
                
                <div style={{ position: 'relative' }}>
                    <button className={`vc-ctrl-btn ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} title="Daha Fazla">
                        {isMobile ? <ChevronDown size={20} /> : <Settings size={18} />}
                    </button>
                    {isMoreMenuOpen && (
                        <div className="vc-more-dropdown glass-panel">
                            {isMobile && canSpeak && (
                                <>
                                    <button className={`vc-more-option ${localState.isScreenSharing ? 'active' : ''}`} onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                        <MonitorUp size={16} /> <span>Ekran Paylaş</span>
                                    </button>
                                    <button className={`vc-more-option ${!localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
                                        {localState.isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />} <span>{localState.isDeafened ? 'Sesi Aç' : 'Sağırlaştır'}</span>
                                    </button>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                                </>
                            )}
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px' }}>HOPARLÖR</div>
                            {Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.map(d => (
                                <button key={d.deviceId} className={`vc-more-option ${selectedAudioOutput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioOutput(d.deviceId); setIsMoreMenuOpen(false); }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label || 'Hoparlör'}</span>
                                    {selectedAudioOutput === d.deviceId && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="vc-viewport layout-spotlight" style={{ padding: '80px 24px 100px 24px' }}>
                {guestSpeakers.length > 0 && (
                    <div className="vc-carousel custom-scrollbar">
                        {guestSpeakers.map(p => (p.identity === activeFocusIdentity && !p.screenShareTrack) ? null : renderSpeakerCard(p))}
                    </div>
                )}
                <div className="vc-hero">
                    <div className="vc-grid" style={{ maxWidth: activeFocusIdentity ? '800px' : '600px' }}>
                        {activeFocusIdentity ? [...adminSpeakers, ...guestSpeakers].map(p => p.identity === activeFocusIdentity ? renderSpeakerCard(p, true) : null) : adminSpeakers.map(p => renderSpeakerCard(p))}
                    </div>
                </div>
            </div>

            <div style={{ position: 'absolute', right: '24px', top: '84px', bottom: '96px', display: 'flex', gap: '16px', zIndex: 100, pointerEvents: 'none' }}>
                {isListenersOpen && (
                    <div className="voice-chat-sidebar glass-panel" style={{ width: '280px', pointerEvents: 'auto' }}>
                        <div className="chat-header"><h3>Dinleyiciler ({listenerParticipants.length + (!isAdmin && !canSpeak ? 1 : 0)})</h3><button className="icon-btn" onClick={() => setIsListenersOpen(false)}><X size={20} /></button></div>
                        <div className="chat-messages custom-scrollbar">
                            {!isAdmin && !canSpeak && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><span>{localUserObject.name} (Sen)</span>{handRaised && <span>✋</span>}</div>}
                            {listenerParticipants.map(p => {
                                const hasRaised = raisedHands.some(h => h.userId === p.identity);
                                return (
                                    <div key={p.identity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: hasRaised ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        <span>{p.name}</span>
                                        {isAdmin && hasRaised && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleGrant(p.identity)} style={{ color: '#23a559' }}><Check size={14} /></button>
                                                <button onClick={() => handleRevoke(p.identity)} style={{ color: '#f23f43' }}><X size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {isChatOpen && <div style={{ width: '300px', pointerEvents: 'auto', height: '100%' }}><VoiceChatSidebar messages={chatMessages} onSendMessage={handleSendMessage} onClose={() => setIsChatOpen(false)} isRestricted={isChatRestricted} isAdmin={isAdmin} /></div>}
            </div>

            {isConnected && (
                <div className="vc-controls glass-controls">
                    {canSpeak ? (
                        <>
                            <div className="vc-ctrl-group">
                                <button className={`vc-ctrl-btn ${!localState.isMuted ? 'active' : ''}`} onClick={toggleMicrophone}>{localState.isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
                                <button className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`} onClick={() => setIsMicMenuOpen(!isMicMenuOpen)}><ChevronUp size={14} /></button>
                                {isMicMenuOpen && (
                                    <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                        {Array.isArray(availableDevices?.audioInputs) && availableDevices.audioInputs.map(d => (
                                            <div key={d.deviceId} className={`vc-device-option ${selectedAudioInput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioInput(d.deviceId); setIsMicMenuOpen(false); }}><span>{d.label || 'Mikrofon'}</span>{selectedAudioInput === d.deviceId && <Check size={12} />}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="vc-ctrl-group">
                                <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'active' : ''}`} onClick={toggleCamera}>{localState.isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}</button>
                                <button className={`vc-device-arrow ${isCameraMenuOpen ? 'active' : ''}`} onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}><ChevronUp size={14} /></button>
                                {isCameraMenuOpen && (
                                    <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                        {Array.isArray(availableDevices?.videoInputs) && availableDevices.videoInputs.map(d => (
                                            <div key={d.deviceId} className={`vc-device-option ${selectedVideoInput === d.deviceId ? 'active' : ''}`} onClick={() => { setVideoInput(d.deviceId); setIsCameraMenuOpen(false); }}><span>{d.label || 'Kamera'}</span>{selectedVideoInput === d.deviceId && <Check size={12} />}</div>
                                        ))}
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                        <button className="vc-more-option" onClick={() => { toggleFacingMode(); setIsCameraMenuOpen(false); }}><RefreshCw size={14} /> <span>Kamerayı Çevir</span></button>
                                    </div>
                                )}
                            </div>

                            {!isMobile && (
                                <>
                                    <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare} title="Ekran Paylaş"><MonitorUp size={22} /></button>
                                    <button className={`vc-ctrl-btn ${!localState.isDeafened ? 'active' : ''}`} onClick={toggleDeafen}>{localState.isDeafened ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
                                </>
                            )}
                        </>
                    ) : (
                        <button className={`vc-ctrl-btn ${handRaised ? 'active' : ''}`} onClick={handleRaiseHand} style={{ background: handRaised ? 'rgba(99, 102, 241, 0.5)' : undefined }}><Hand size={22} /></button>
                    )}
                    <button className="vc-ctrl-btn danger leave" onClick={handleLeave}><PhoneOff size={22} /></button>
                </div>
            )}
        </div>
    );
};

export default ConferenceChannel;
