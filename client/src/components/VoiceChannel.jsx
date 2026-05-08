import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff, Mic, MessageCircle, Video, VideoOff, MonitorUp, PhoneOff, Volume2, RefreshCw, Check, ChevronDown, ChevronUp, VolumeX } from 'lucide-react';
import './VoiceChannel.css';

const VoiceChannel = ({ portalId, channelId, channelName }) => {
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

    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const isActiveRoom = activeRoom?.channelId === channelId;
    const isConnected = isActiveRoom && connectionState === ConnectionState.Connected;
    const isConnecting = isActiveRoom && connectionState === ConnectionState.Connecting;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (focusedIdentity && !participants.find(p => p.identity === focusedIdentity)) {
            setFocusedIdentity(null);
        }
    }, [participants, focusedIdentity]);

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

    const handleJoin = () => connectToChannel(portalId, channelId);
    const handleLeave = () => { disconnectFromChannel(); setFocusedIdentity(null); };
    const handleFocus = (identity) => setFocusedIdentity(focusedIdentity === identity ? null : identity);

    const renderParticipantCard = (p, role = 'grid') => {
        const isShowingScreen = role === 'hero' && p.screenShareTrack;
        const trackToRender = isShowingScreen ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);

        return (
            <div key={`${p.identity}-${role}`} className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`} onClick={() => handleFocus(p.identity)}>
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
                    <div className="vc-card-indicators">
                        {p.isMuted && <div className="vc-indicator muted"><MicOff size={14} /></div>}
                    </div>
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
                    <div className="vc-lobby-icon"><Mic size={40} /></div>
                    <h2 className="vc-lobby-title">{channelName || 'Ses Kanalı'}</h2>
                    <button className="vc-join-btn glass-join-btn action-btn-large" onClick={handleJoin} style={{ marginTop: '24px' }}>Aramaya Katıl</button>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-connecting-spinner loader" />
                    <h2 className="vc-lobby-title">Bağlanılıyor...</h2>
                </div>
            </div>
        );
    }

    if (connectionState === ConnectionState.Disconnected && errorMsg) {
        return (
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <h2 className="vc-lobby-title" style={{ color: '#ef4444' }}>Hata</h2>
                    <p>{errorMsg}</p>
                    <button className="vc-join-btn action-btn-large" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    const screenSharer = participants.find(p => p.screenShareTrack);
    const activeFocusIdentity = screenSharer ? screenSharer.identity : focusedIdentity;
    const focusedParticipant = activeFocusIdentity ? participants.find(p => p.identity === activeFocusIdentity) : null;

    let gridClass = focusedParticipant ? 'layout-spotlight' : `layout-dynamic grid-${Math.min(participants.length, 4)}`;

    return (
        <div className="vc-container glass-container">
            <div className="vc-top-right-controls">
                <button className={`vc-ctrl-btn ${isChatOpen ? 'active' : ''}`} onClick={() => setIsChatOpen(!isChatOpen)} title="Sohbet">
                    <MessageCircle size={18} />
                </button>
                
                {/* Mobile More Menu Trigger (Arrow) */}
                {isMobile && (
                    <div style={{ position: 'relative' }}>
                        <button className={`vc-ctrl-btn ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} title="Daha Fazla">
                            <ChevronDown size={20} />
                        </button>
                        {isMoreMenuOpen && (
                            <div className="vc-more-dropdown glass-panel">
                                <button className="vc-more-option" onClick={() => { toggleScreenShare(); setIsMoreMenuOpen(false); }}>
                                    <MonitorUp size={16} /> <span>Ekran Paylaş</span>
                                </button>
                                <button className={`vc-more-option ${localState.isDeafened ? 'active' : ''}`} onClick={() => { toggleDeafen(); setIsMoreMenuOpen(false); }}>
                                    {localState.isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />} <span>{localState.isDeafened ? 'Sesi Aç' : 'Sağırlaştır'}</span>
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
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
                )}
            </div>

            <div className={`vc-viewport ${gridClass}`} style={{ marginTop: '20px' }}>
                {!focusedParticipant ? (
                    <div className="vc-grid">{participants.map(p => renderParticipantCard(p, 'grid'))}</div>
                ) : (
                    <>
                        <div className="vc-carousel custom-scrollbar">
                            {participants.filter(p => p.identity !== activeFocusIdentity).map(p => renderParticipantCard(p, 'carousel'))}
                        </div>
                        <div className="vc-hero">{renderParticipantCard(focusedParticipant, 'hero')}</div>
                    </>
                )}
            </div>

            {isConnected && (
                <div className="vc-controls glass-controls">
                    {/* Microphone */}
                    <div className="vc-ctrl-group">
                        <button className={`vc-ctrl-btn ${localState.isMuted ? 'danger' : 'active'}`} onClick={toggleMicrophone}>
                            {localState.isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </button>
                        <button className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`} onClick={() => setIsMicMenuOpen(!isMicMenuOpen)}><ChevronUp size={16} /></button>
                        {isMicMenuOpen && (
                            <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>MİKROFON</div>
                                {Array.isArray(availableDevices?.audioInputs) && availableDevices.audioInputs.map(d => (
                                    <div key={d.deviceId} className={`vc-device-option ${selectedAudioInput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioInput(d.deviceId); setIsMicMenuOpen(false); }}>
                                        <span>{d.label || 'Mikrofon'}</span>
                                        {selectedAudioInput === d.deviceId && <Check size={12} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Camera */}
                    <div className="vc-ctrl-group">
                        <button className={`vc-ctrl-btn ${localState.isCameraOn ? 'active' : 'danger'}`} onClick={toggleCamera}>
                            {localState.isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
                        </button>
                        <button className={`vc-device-arrow ${isCameraMenuOpen ? 'active' : ''}`} onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}><ChevronUp size={16} /></button>
                        {isCameraMenuOpen && (
                            <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>KAMERA</div>
                                {Array.isArray(availableDevices?.videoInputs) && availableDevices.videoInputs.map(d => (
                                    <div key={d.deviceId} className={`vc-device-option ${selectedVideoInput === d.deviceId ? 'active' : ''}`} onClick={() => { setVideoInput(d.deviceId); setIsCameraMenuOpen(false); }}>
                                        <span>{d.label || 'Kamera'}</span>
                                        {selectedVideoInput === d.deviceId && <Check size={12} />}
                                    </div>
                                ))}
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                <button className="vc-more-option" onClick={() => { toggleFacingMode(); setIsCameraMenuOpen(false); }}>
                                    <RefreshCw size={14} /> <span>Kamerayı Çevir</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Desktop Specific Controls (Screen Share & Deafen) */}
                    {!isMobile && (
                        <>
                            <button className={`vc-ctrl-btn ${localState.isScreenSharing ? 'active' : 'danger'}`} onClick={toggleScreenShare} title="Ekran Paylaş">
                                <MonitorUp size={22} />
                            </button>
                            <div className="vc-ctrl-group">
                                <button className={`vc-ctrl-btn ${localState.isDeafened ? 'danger' : 'active'}`} onClick={toggleDeafen}>
                                    {localState.isDeafened ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                </button>
                                <button className={`vc-device-arrow ${isMoreMenuOpen ? 'active' : ''}`} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}><ChevronUp size={16} /></button>
                                {isMoreMenuOpen && (
                                    <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', right: '0', marginBottom: '12px', padding: '8px', minWidth: '200px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>HOPARLÖR</div>
                                        {Array.isArray(availableDevices?.audioOutputs) && availableDevices.audioOutputs.map(d => (
                                            <div key={d.deviceId} className={`vc-device-option ${selectedAudioOutput === d.deviceId ? 'active' : ''}`} onClick={() => { setAudioOutput(d.deviceId); setIsMoreMenuOpen(false); }}>
                                                <span>{d.label || 'Hoparlör'}</span>
                                                {selectedAudioOutput === d.deviceId && <Check size={12} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <button className="vc-ctrl-btn danger leave" onClick={handleLeave} title="Ayrıl">
                        <PhoneOff size={22} />
                    </button>
                </div>
            )}

            {isChatOpen && <VoiceChatSidebar messages={chatMessages} onSendMessage={sendChatMessage} onClose={() => setIsChatOpen(false)} />}
        </div>
    );
};

export default VoiceChannel;
