import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { Crown, Shield, X, Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Users, MessageCircle, Check, Hand, Volume2, RefreshCw, ChevronUp, ChevronDown, VolumeX, MonitorUp, Link, Clipboard, UserPlus, Radio, Globe, PictureInPicture } from 'lucide-react';
import WatchPartyPlayer from './WatchPartyPlayer';
import { HlsTesterModal } from './HlsTesterModal';
import './VoiceChannel.css';

const VideoRenderer = ({ track, isLocal, className }) => {
    const videoEl = React.useRef(null);

    React.useEffect(() => {
        const el = videoEl.current;
        if (el && track) {
            track.attach(el);
        }
        return () => {
            if (track) {
                track.detach();
            }
        };
    }, [track]);

    return (
        <video 
            ref={videoEl} 
            className={className} 
            autoPlay 
            muted={true} 
            playsInline 
        />
    );
};

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
        availableDevices,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        setVideoInput,
        toggleDeafen,
        selectedAudioInput,
        selectedAudioOutput,
        selectedVideoInput,
        watchParty,
        startWatchParty,
        stopWatchParty
    } = useVoice();

    const handleSendMessage = (text) => {
        if (text.startsWith('/watch ')) {
            const url = text.substring(7).trim();
            if (url === 'stop') {
                stopWatchParty();
            } else if (url) {
                startWatchParty(url);
            }
            return;
        }
        sendChatMessage(text);
    };

    const handleTriggerDocumentPiP = () => {
        window.dispatchEvent(new CustomEvent('triggerDocumentPiP'));
    };

    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isListenersOpen, setIsListenersOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isWatchInputOpen, setIsWatchInputOpen] = useState(false);
    const [isHlsModalOpen, setIsHlsModalOpen] = useState(false);
    const [watchUrl, setWatchUrl] = useState('');
    const [isLiveWatchInputOpen, setIsLiveWatchInputOpen] = useState(false);
    const [liveWatchUrl, setLiveWatchUrl] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Call duration timer
    useEffect(() => {
        let interval = null;
        if (isConnected) {
            setCallDuration(0);
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isConnected]);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [portalMembers, setPortalMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [invitedUserIds, setInvitedUserIds] = useState([]);

    const { socket } = useSocket();
    const { user } = useAuth();
    const [raisedHands, setRaisedHands] = useState([]);
    const [handRaised, setHandRaised] = useState(false);
    const [canSpeak, setCanSpeak] = useState(false);
    const [isChatRestricted, setIsChatRestricted] = useState(false);

    useEffect(() => {
        if (window.desktopAPI && window.desktopAPI.onVideoSniffed) {
            const handleVideoSniffed = (data) => {
                console.log("Captured sniffed HLS video stream:", data);
                if (data.url) {
                    startWatchParty(data.url, false);
                }
            };
            const cleanup = window.desktopAPI.onVideoSniffed(handleVideoSniffed);
            return () => {
                if (cleanup) cleanup();
            };
        }
    }, [startWatchParty]);

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
    const handleSendMessageChat = (text) => { if (isChatRestricted && !isAdmin) return; handleSendMessage(text); };
    const handleRaiseHand = () => {
        const newState = !handRaised; setHandRaised(newState);
        if (socket && activeRoom) socket.emit('voice:raise-hand', { roomName: activeRoom.roomName, userId: user?._id, username: user?.username, avatar: user?.profile?.avatar || '', raised: newState });
    };
    const handleGrant = async (id) => { try { await grantSpeak(portalId, channelId, id); setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(id))); } catch (e) { console.error(e); } };
    const handleRevoke = async (id) => { try { await revokeSpeak(portalId, channelId, id); setRaisedHands(prev => prev.filter(h => String(h.userId) !== String(id))); } catch (e) { console.error(e); } };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('joinVoice') === 'true' && portalId && channelId && !isConnected && !isConnecting) {
            connectToChannel(portalId, channelId);
            // Clean up the URL search params so it doesn't rejoin endlessly if page reloads
            const newUrl = window.location.pathname + window.location.search.replace(/&?joinVoice=true/g, '').replace(/\?$/, '');
            window.history.replaceState(null, '', newUrl);
        }
    }, [portalId, channelId, isConnected, isConnecting, connectToChannel]);

    useEffect(() => {
        if (isInviteOpen && portalId) {
            setLoadingMembers(true);
            axios.get(`/api/portals/${portalId}`)
                .then(res => {
                    if (res.data && res.data.members) {
                        setPortalMembers(res.data.members.filter(m => m._id.toString() !== user?._id?.toString()));
                    }
                })
                .catch(err => console.error("Error fetching portal members for invite:", err))
                .finally(() => setLoadingMembers(false));
        }
    }, [isInviteOpen, portalId, user]);

    const handleSendInvite = async (targetUserId) => {
        try {
            await axios.post('/api/voice/invite', {
                portalId,
                channelId,
                targetUserIds: [targetUserId]
            });
            setInvitedUserIds(prev => [...prev, targetUserId]);
        } catch (error) {
            console.error("Failed to send call invitation:", error);
        }
    };

    const renderSpeakerCard = (p, isFocused = false) => {
        const trackToRender = (isFocused && p.screenShareTrack) ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);
        return (
            <div key={`${p.identity}-speaker`} className={`vc-card role-grid ${p.isSpeaking ? 'speaking' : ''} ${isFocused ? 'focused' : ''}`} onClick={() => setFocusedIdentity(isFocused ? null : p.identity)}>
                <div className="vc-card-video-area">
                    {trackToRender ? (
                        <VideoRenderer className="vc-card-video" track={trackToRender} isLocal={p.isLocal} />
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
            <div className="vc-top-right-controls">
                {isAdmin && (
                    <button className={`vc-ctrl-btn ${isListenersOpen ? 'active' : ''}`} onClick={() => { setIsListenersOpen(!isListenersOpen); setIsChatOpen(false); setIsSettingsOpen(false); }}>
                        <Users size={18} />
                        {raisedHands.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{raisedHands.length}</span>}
                    </button>
                )}
                <button className={`vc-ctrl-btn ${isInviteOpen ? 'active' : ''}`} onClick={() => { setIsInviteOpen(!isInviteOpen); setIsChatOpen(false); setIsListenersOpen(false); setIsSettingsOpen(false); }} title="Davet Et"><UserPlus size={18} /></button>
                <button className={`vc-ctrl-btn ${isChatOpen ? 'active' : ''}`} onClick={() => { setIsChatOpen(!isChatOpen); setIsListenersOpen(false); setIsInviteOpen(false); setIsSettingsOpen(false); }} title="Sohbet"><MessageCircle size={18} /></button>
                
                {/* More Menu (Arrow on Mobile, Settings on Desktop) */}
                <div style={{ position: 'relative' }}>
                    <button className={`vc-ctrl-btn ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} title="Daha Fazla">
                        {isMobile ? <ChevronDown size={20} /> : <Settings size={18} />}
                    </button>
                    {isMoreMenuOpen && (
                        <div className="vc-more-dropdown glass-panel">
                            {/* In Conference, some controls might be in this menu even on desktop if requested, 
                                but I'll stick to the user's wish: Desktop gets bottom bar. */}
                            {isMobile && canSpeak && (
                                <>
                                    <button className="vc-more-option" onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                        <MonitorUp size={16} /> <span>Ekran Paylaş</span>
                                    </button>
                                    <button className={`vc-more-option ${localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
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

                {/* Picture-in-Picture Button */}
                <button 
                    className="vc-ctrl-btn" 
                    onClick={handleTriggerDocumentPiP} 
                    title="Yüzen Pencereye Geç (PiP)"
                    style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                    <PictureInPicture size={18} color="#818cf8" />
                </button>

                {/* HLS Video Oynatıcı & Çözücü Butonu */}
                <button 
                    className={`vc-ctrl-btn ${isHlsModalOpen ? 'active' : ''}`} 
                    onClick={() => setIsHlsModalOpen(true)} 
                    title="HLS Oynatıcı & Çözücü Modalını Aç"
                    style={{ background: 'rgba(168, 85, 247, 0.25)', borderColor: 'rgba(168, 85, 247, 0.6)' }}
                >
                    <Radio size={18} color="#c084fc" />
                </button>
            </div>

            <div className="vc-viewport layout-spotlight" style={{ padding: '80px 24px 100px 24px' }}>
                {watchParty && watchParty.url ? (
                    <>
                        <div className="vc-carousel custom-scrollbar">
                            {[...adminSpeakers, ...guestSpeakers].map(p => renderSpeakerCard(p))}
                        </div>
                        <div className="vc-hero" style={{ maxWidth: '800px' }}>
                            <div id="watch-party-portal-target" style={{ width: '100%', height: '100%' }}></div>
                        </div>
                    </>
                ) : (
                    <>
                        {guestSpeakers.length > 0 && (
                            <div className="vc-carousel custom-scrollbar">
                                {guestSpeakers.map(p => (p.identity === activeFocusIdentity && !p.screenShareTrack) ? null : renderSpeakerCard(p))}
                            </div>
                        )}
                        <div className="vc-hero">
                            <div className="vc-grid grid-1" style={{ maxWidth: activeFocusIdentity ? '800px' : '600px' }}>
                                {activeFocusIdentity ? [...adminSpeakers, ...guestSpeakers].map(p => p.identity === activeFocusIdentity ? renderSpeakerCard(p, true) : null) : adminSpeakers.map(p => renderSpeakerCard(p))}
                            </div>
                        </div>
                    </>
                )}
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
                {isInviteOpen && (
                    <div className="voice-chat-sidebar glass-panel" style={{ width: '280px', pointerEvents: 'auto' }}>
                        <div className="chat-header">
                            <h3>Davet Et</h3>
                            <button className="icon-btn" onClick={() => setIsInviteOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="chat-messages custom-scrollbar" style={{ padding: '12px' }}>
                            {loadingMembers ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>Yükleniyor...</div>
                            ) : portalMembers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Davet edilebilecek üye bulunamadı.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {portalMembers.map(m => {
                                        const isInvited = invitedUserIds.includes(m._id);
                                        return (
                                            <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <img src={getImageUrl(m.profile?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profile?.displayName || m.username)}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.profile?.displayName || m.username}</span>
                                                </div>
                                                <button 
                                                    disabled={isInvited}
                                                    onClick={() => handleSendInvite(m._id)}
                                                    className={`glass-btn ${isInvited ? '' : 'active'}`}
                                                    style={{ padding: '4px 10px', fontSize: '11px' }}
                                                >
                                                    {isInvited ? 'Davet Edildi' : 'Davet Et'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isChatOpen && <div style={{ width: '300px', pointerEvents: 'auto', height: '100%' }}><VoiceChatSidebar messages={chatMessages} onSendMessage={handleSendMessageChat} onClose={() => setIsChatOpen(false)} isRestricted={isChatRestricted} isAdmin={isAdmin} /></div>}
            </div>

            {isConnected && (
                <div className="vc-controls glass-controls">
                    {canSpeak ? (
                        <>
                            <div className="vc-ctrl-group">
                                <button className={`vc-ctrl-btn ${localState.isMuted ? 'danger' : 'active'}`} onClick={toggleMicrophone}>{localState.isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
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
                                <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'active' : 'danger'}`} onClick={toggleCamera}>{localState.isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}</button>
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

                            {/* Medya URL Watch Party Button */}
                            <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                                <button className={`vc-ctrl-btn ${watchParty?.url && !watchParty?.isLive ? 'active' : ''}`} onClick={() => { setIsWatchInputOpen(!isWatchInputOpen); setIsLiveWatchInputOpen(false); }} title="Birlikte Video İzle">
                                    <Link size={22} color={watchParty?.url && !watchParty?.isLive ? '#ffffff' : '#ef4444'} />
                                </button>
                                {isWatchInputOpen && (
                                    <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', padding: '12px', minWidth: '320px', display: 'flex', gap: '8px', zIndex: 999 }}>
                                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                placeholder="YouTube, MP4 linki veya Video ID yapıştırın..." 
                                                value={watchUrl} 
                                                onChange={(e) => setWatchUrl(e.target.value)} 
                                                className="chat-input glass-input"
                                                style={{ flex: 1, padding: '6px 64px 6px 12px', fontSize: '12px', width: '100%' }}
                                            />
                                            <div style={{ position: 'absolute', right: '4px', display: 'flex', gap: '4px', zIndex: 5 }}>
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            const text = await navigator.clipboard.readText();
                                                            setWatchUrl(text);
                                                        } catch (err) {
                                                            console.warn("Clipboard access denied", err);
                                                        }
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Yapıştır"
                                                >
                                                    <Clipboard size={12} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setWatchUrl('')}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Temizle"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (watchUrl.trim()) {
                                                    startWatchParty(watchUrl.trim(), false);
                                                    setIsWatchInputOpen(false);
                                                }
                                            }}
                                            className="chat-send-btn glass-btn active"
                                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                                        >
                                            Başlat
                                        </button>
                                        {!!window.desktopAPI && (
                                            <button 
                                                type="button"
                                            onClick={() => {
                                                const urlVal = watchUrl.trim();
                                                const isStream = urlVal.toLowerCase().includes('.txt') || urlVal.toLowerCase().includes('.m3u8') || urlVal.toLowerCase().includes('/hls/') || urlVal.toLowerCase().includes('manifest');
                                                window.desktopAPI.openFilmBrowser((!urlVal || isStream) ? 'https://www.hdfilmcehennemi.life/' : urlVal);
                                                setIsWatchInputOpen(false);
                                            }}
                                                className="chat-send-btn glass-btn"
                                                style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                                                title="Film sitesini açıp oynatılan videoyu yakalayın"
                                            >
                                                <Globe size={14} /> Film Aç
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Canlı Yayın Watch Party Button */}
                            <div className="vc-ctrl-group" style={{ position: 'relative' }}>
                                <button className={`vc-ctrl-btn ${watchParty?.url && watchParty?.isLive ? 'active' : ''}`} onClick={() => { setIsLiveWatchInputOpen(!isLiveWatchInputOpen); setIsWatchInputOpen(false); }} title="Birlikte Canlı Yayın İzle">
                                    <Radio size={22} color={watchParty?.url && watchParty?.isLive ? '#ffffff' : '#10b981'} />
                                </button>
                                {isLiveWatchInputOpen && (
                                    <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', padding: '12px', minWidth: '320px', display: 'flex', gap: '8px', zIndex: 999 }}>
                                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Canlı Yayın Linki (.m3u8 veya .mpd) yapıştırın..." 
                                                value={liveWatchUrl} 
                                                onChange={(e) => setLiveWatchUrl(e.target.value)} 
                                                className="chat-input glass-input"
                                                style={{ flex: 1, padding: '6px 64px 6px 12px', fontSize: '12px', width: '100%' }}
                                            />
                                            <div style={{ position: 'absolute', right: '4px', display: 'flex', gap: '4px', zIndex: 5 }}>
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            const text = await navigator.clipboard.readText();
                                                            setLiveWatchUrl(text);
                                                        } catch (err) {
                                                            console.warn("Clipboard access denied", err);
                                                        }
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Yapıştır"
                                                >
                                                    <Clipboard size={12} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setLiveWatchUrl('')}
                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Temizle"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (liveWatchUrl.trim()) {
                                                    startWatchParty(liveWatchUrl.trim(), true);
                                                    setIsLiveWatchInputOpen(false);
                                                }
                                            }}
                                            className="chat-send-btn glass-btn active"
                                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                                        >
                                            Başlat
                                        </button>
                                        <button 
                                            onClick={() => setIsHlsModalOpen(true)}
                                            className="chat-send-btn glass-btn active"
                                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Radio size={14} /> HLS Oynatıcı
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* HLS Oynatıcı & Test Modalı Direkt Butonu */}
                            <div className="vc-ctrl-group">
                                <button 
                                    className={`vc-ctrl-btn ${isHlsModalOpen ? 'active' : ''}`} 
                                    onClick={() => setIsHlsModalOpen(!isHlsModalOpen)} 
                                    title="HLS Oynatıcı & Yayın Testi"
                                    style={{ background: isHlsModalOpen ? 'rgba(168, 85, 247, 0.3)' : undefined }}
                                >
                                    <Radio size={22} color={isHlsModalOpen ? '#ffffff' : '#a855f7'} />
                                </button>
                            </div>

                            <HlsTesterModal
                                isOpen={isHlsModalOpen}
                                onClose={() => setIsHlsModalOpen(false)}
                                onStartWatchParty={(streamUrl) => {
                                    startWatchParty(streamUrl, false);
                                }}
                            />

                            {/* Desktop Specific for Conference */}
                            {!isMobile && (
                                <>
                                    <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'active' : 'danger'}`} onClick={toggleScreenShare} title="Ekran Paylaş"><MonitorUp size={22} /></button>
                                    <button className={`vc-ctrl-btn ${localState.isDeafened ? 'danger' : 'active'}`} onClick={toggleDeafen}>{localState.isDeafened ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
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
