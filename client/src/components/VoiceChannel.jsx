import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import axios from 'axios';
import { useVoice } from '../context/VoiceContext';
import VoiceChatSidebar from './VoiceChatSidebar';
import RoomTimer from './RoomTimer';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff, Maximize, Mic, MessageCircle, Video, VideoOff, MonitorUp, PhoneOff, Volume2, RefreshCw, Check, Settings, ChevronUp, VolumeX, Headphones } from 'lucide-react';
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
        roomStartTime,
        availableDevices,
        facingMode,
        toggleFacingMode,
        setAudioOutput,
        setAudioInput,
        setVideoInput,
        toggleDeafen,
        enumerateDevices
    } = useVoice();

    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMicMenuOpen, setIsMicMenuOpen] = useState(false);
    const [isSpeakerMenuOpen, setIsSpeakerMenuOpen] = useState(false);

    // Pre-join stats
    const [lobbyCount, setLobbyCount] = useState(null);

    // Is this channel the active global room?
    const isActiveRoom = activeRoom?.channelId === channelId;
    const isConnected = isActiveRoom && connectionState === ConnectionState.Connected;
    const isConnecting = isActiveRoom && connectionState === ConnectionState.Connecting;

    // Optional: Clear focus if the focused user leaves
    useEffect(() => {
        if (focusedIdentity && !participants.find(p => p.identity === focusedIdentity)) {
            setFocusedIdentity(null);
        }
    }, [participants, focusedIdentity]);

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
                if (isMounted) setLobbyCount(0); // Default to 0 instead of staying null and hiding the UI
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 2000); // refresh every 2s for real-time feel
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isActiveRoom, portalId, channelId]);

    const handleJoin = () => {
        connectToChannel(portalId, channelId);
    };

    const handleLeave = () => {
        disconnectFromChannel();
        setFocusedIdentity(null);
    };

    const handleFocus = (identity) => {
        if (focusedIdentity === identity) {
            setFocusedIdentity(null); // Toggle off
        } else {
            setFocusedIdentity(identity);
        }
    };

    // Helper component to render a participant card inside the grid
    const renderParticipantCard = (p, role = 'grid') => {
        const isFocused = focusedIdentity === p.identity;

        // If they are screen sharing and are in the 'hero' role, render the screen share track
        const isShowingScreen = role === 'hero' && p.screenShareTrack;

        // Only use the camera video track if the camera is explicitly known to be ON
        // This prevents black screen lingering when the track is locally muted but hasn't fully detached
        const trackToRender = isShowingScreen ? p.screenShareTrack : (p.isCameraOn ? p.videoTrack : null);

        return (
            <div
                key={`${p.identity}-${role}`}
                className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`}
                onClick={() => handleFocus(p.identity)}
                title="Odaklanmak için tıkla"
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

                {/* Overlay Info */}
                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
                    <div className="vc-card-indicators">
                        {p.isMuted && (
                            <div className="vc-indicator muted" title="Mikrofon kapalı">
                                <MicOff size={16} strokeWidth={2.5} />
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

                {/* Removed Focus Overlay Icon as requested */}
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

    // ─── LOBBY (Not Active in This Room) ───
    if (!isActiveRoom) {
        return (
            <div className="vc-container glass-container lobby-bg">
                <div className="vc-lobby glass-panel" style={{ position: 'relative' }}>

                    {/* Top Right Live Participant Badge */}
                    {lobbyCount !== null && (
                        <div style={{
                            position: 'absolute', top: '16px', right: '16px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(0,0,0,0.2)', padding: '6px 12px',
                            borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                            color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: lobbyCount > 0 ? 'var(--primary-green)' : 'var(--text-muted)',
                                boxShadow: lobbyCount > 0 ? '0 0 8px var(--primary-green)' : 'none'
                            }} />
                            <span>İçeride: {lobbyCount} Kişi</span>
                        </div>
                    )}

                    <div className="vc-lobby-icon glass-icon">
                        <Mic size={48} strokeWidth={1.5} />
                    </div>
                    <h2 className="vc-lobby-title">{channelName || 'Ses Kanalı'}</h2>
                    <p className="vc-lobby-subtitle">Sesli sohbete katılmak için aşağıdaki butona tıklayın</p>



                    <button className="vc-join-btn glass-join-btn action-btn-large" onClick={handleJoin}>
                        Aramaya Katıl
                    </button>

                    {activeRoom && (
                        <p className="vc-lobby-warning">
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
                    <p className="vc-lobby-subtitle">Sunucuyla güvenlik anahtarları oluşturuluyor</p>
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
                    <button className="vc-join-btn glass-btn action-btn-large" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    // ─── CONNECTED (Main Layout) ───

    // Screen Share Spotlight Logic Override
    const screenSharer = participants.find(p => p.screenShareTrack);
    const activeFocusIdentity = screenSharer ? screenSharer.identity : focusedIdentity;

    const focusedParticipant = activeFocusIdentity
        ? participants.find(p => p.identity === activeFocusIdentity)
        : null;

    const othersCount = participants.length;
    let gridClass = 'layout-dynamic';
    if (!focusedParticipant) {
        if (othersCount === 1) gridClass += ' grid-1';
        else if (othersCount === 2) gridClass += ' grid-2';
        else if (othersCount === 3) gridClass += ' grid-3';
        else if (othersCount >= 4) gridClass += ' grid-4';
    } else {
        gridClass = 'layout-spotlight';
    }

    return (
        <div className="vc-container glass-container">
            {/* Isolated Top Right Controls */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50, display: 'flex', gap: '12px' }}>
                <button
                    className={`vc-ctrl-btn neumorphic-btn ${isChatOpen ? 'active' : ''}`}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    title="Sohbeti Aç/Kapat"
                >
                    <MessageCircle size={20} strokeWidth={2} />
                </button>
            </div>

            {/* Viewport Area */}
            <div className={`vc-viewport ${gridClass}`} style={{ marginTop: '20px' }}>

                {/* 1. If no focus, standard grid */}
                {!focusedParticipant && (
                    <div className="vc-grid">
                        {participants.map(p => renderParticipantCard(p, 'grid'))}
                    </div>
                )}

                {/* 2. If focused or screen sharing, Spotlight layout (Carousel + Hero) */}
                {focusedParticipant && (
                    <>
                        <div className="vc-carousel custom-scrollbar">
                            {participants
                                .filter(p => p.identity !== activeFocusIdentity)
                                .map(p => renderParticipantCard(p, 'carousel'))}

                            {/* Bring screen sharer's face into carousel if they also have camera on */}
                            {screenSharer && screenSharer.videoTrack && renderParticipantCard(screenSharer, 'carousel')}
                        </div>
                        <div className="vc-hero">
                            {renderParticipantCard(focusedParticipant, 'hero')}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Controls (Centered Symmetrically) */}
            {isConnected && (
                <div className="vc-controls glass-controls" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', zIndex: 9999 }}>
                <div className="vc-ctrl-group">
                    <button
                        className="vc-ctrl-btn glass-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMicrophone();
                        }}
                        title={localState.isMuted ? "Sesi Aç" : "Sesi Kapat"}
                    >
                        {localState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button 
                        className={`vc-device-arrow ${isMicMenuOpen ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            enumerateDevices();
                            setIsMicMenuOpen(!isMicMenuOpen);
                            setIsSpeakerMenuOpen(false);
                        }}
                    >
                        <ChevronUp size={16} />
                    </button>
                    {isMicMenuOpen && (
                        <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '16px', padding: '12px', minWidth: '240px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '8px', padding: '0 4px', textTransform: 'uppercase' }}>Mikrofon Seçimi</div>
                            {availableDevices.audioInputs.map(d => (
                                <div 
                                    key={d.deviceId} 
                                    className={`vc-device-option ${selectedAudioInput === d.deviceId ? 'active' : ''}`}
                                    onClick={() => {
                                        setAudioInput(d.deviceId);
                                        setIsMicMenuOpen(false);
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Varsayılan Mikrofon'}</span>
                                    {selectedAudioInput === d.deviceId && <Check size={14} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    className={`vc-ctrl-btn glass-btn ${localState.isCameraOn ? 'active' : 'inset'}`}
                    onClick={toggleCamera}
                    title={localState.isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                >
                    {localState.isCameraOn ? (
                        <Video size={24} strokeWidth={2} />
                    ) : (
                        <VideoOff size={24} strokeWidth={2} />
                    )}
                </button>

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button
                    className={`vc-ctrl-btn glass-btn ${localState.isScreenSharing ? 'active' : 'inset'}`}
                    onClick={toggleScreenShare}
                    title={localState.isScreenSharing ? "Paylaşımı Durdur" : "Ekran Paylaş"}
                >
                    <MonitorUp size={24} strokeWidth={2} />
                </button>

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <div className="vc-ctrl-group">
                    <button
                        className={`vc-ctrl-btn glass-btn ${localState.isDeafened ? 'danger action-btn-red' : 'action-btn-green'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDeafen();
                        }}
                        title={localState.isDeafened ? "Sesi Duy" : "Sesi Kapat (Sağırlaştır)"}
                    >
                        {localState.isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <button 
                        className={`vc-device-arrow ${isSpeakerMenuOpen ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            enumerateDevices();
                            setIsSpeakerMenuOpen(!isSpeakerMenuOpen);
                            setIsMicMenuOpen(false);
                        }}
                    >
                        <ChevronUp size={16} />
                    </button>
                    {isSpeakerMenuOpen && (
                        <div className="vc-settings-dropdown glass-panel" style={{ position: 'absolute', bottom: '100%', right: '0', marginBottom: '16px', padding: '12px', minWidth: '240px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', marginBottom: '8px', padding: '0 4px', textTransform: 'uppercase' }}>Hoparlör Seçimi</div>
                            {availableDevices.audioOutputs.map(d => (
                                <div 
                                    key={d.deviceId} 
                                    className={`vc-device-option ${selectedAudioOutput === d.deviceId ? 'active' : ''}`}
                                    onClick={() => {
                                        setAudioOutput(d.deviceId);
                                        setIsSpeakerMenuOpen(false);
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label || 'Varsayılan Hoparlör'}</span>
                                    {selectedAudioOutput === d.deviceId && <Check size={14} />}
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

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button className="vc-ctrl-btn glass-btn leave action-btn-red danger" onClick={handleLeave} title="Aramadan Ayrıl">
                    <PhoneOff size={24} strokeWidth={2} />
                </button>
            </div>
            )}

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

export default VoiceChannel;
