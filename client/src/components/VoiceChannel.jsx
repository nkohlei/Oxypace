import React, { useState, useEffect } from 'react';
import { ConnectionState } from 'livekit-client';
import { useVoice } from '../context/VoiceContext';
import VoiceChatSidebar from './VoiceChatSidebar';
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
        sendChatMessage
    } = useVoice();

    const [focusedIdentity, setFocusedIdentity] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
        return (
            <div
                key={p.identity}
                className={`vc-card ${p.isSpeaking ? 'speaking' : ''} role-${role}`}
                onClick={() => handleFocus(p.identity)}
                title="Odaklanmak için tıkla"
            >
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

                    {/* IMPORTANT FIX: Render remote audio tracks so sound actually plays when in the room */}
                    {!p.isLocal && p.audioTrack && (
                        <AudioTrackPlayer track={p.audioTrack} />
                    )}
                </div>

                {/* Overlay Info */}
                <div className="vc-card-info">
                    <span className="vc-card-name">{p.name} {p.isLocal && '(Sen)'}</span>
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

                {/* Focus Overlay Icon */}
                {isFocused && (
                    <div className="vc-focus-badge">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="2" fill="none"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                    </div>
                )}
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
            <div className="vc-container glass-container">
                <div className="vc-lobby glass-panel">
                    <div className="vc-lobby-icon glass-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    </div>
                    <h2 className="vc-lobby-title">{channelName || 'Ses Kanalı'}</h2>
                    <p className="vc-lobby-subtitle">Sesli sohbete katılmak için aşağıdaki butona tıklayın</p>
                    <button className="vc-join-btn glass-join-btn action-btn-large" onClick={handleJoin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
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
                    <button className="vc-join-btn neumorphic-btn action-btn-large" onClick={handleJoin}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    // ─── CONNECTED (Main Layout) ───

    // Derived layout state
    const focusedParticipant = focusedIdentity
        ? participants.find(p => p.identity === focusedIdentity)
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
            {/* Header */}
            <div className="vc-header">
                <div className="vc-header-left">
                    <div className="vc-header-dot" />
                    <span className="vc-header-title">{channelName || 'Ses Kanalı'}</span>
                    <span className="vc-header-badge glass-badge">{participants.length} katılımcı</span>
                </div>
                <div className="vc-header-right">
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

            {/* Viewport Area */}
            <div className={`vc-viewport ${gridClass}`}>

                {/* 1. If no focus, standard grid */}
                {!focusedParticipant && (
                    <div className="vc-grid">
                        {participants.map(p => renderParticipantCard(p, 'grid'))}
                    </div>
                )}

                {/* 2. If focused, Spotlight layout (Hero + Carousel) */}
                {focusedParticipant && (
                    <>
                        <div className="vc-hero">
                            {renderParticipantCard(focusedParticipant, 'hero')}
                        </div>
                        <div className="vc-carousel custom-scrollbar">
                            {participants
                                .filter(p => p.identity !== focusedIdentity)
                                .map(p => renderParticipantCard(p, 'carousel'))}
                        </div>
                    </>
                )}
            </div>

            {/* Glassmorphic Control Bar */}
            <div className="vc-controls glass-controls">
                <button
                    className={`vc-ctrl-btn neumorphic-btn circular ${localState.isMuted ? 'inset muted danger' : 'active'}`}
                    onClick={toggleMicrophone}
                    title={localState.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
                >
                    {localState.isMuted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                        </svg>
                    )}
                </button>
                <button
                    className={`vc-ctrl-btn neumorphic-btn circular ${localState.isCameraOn ? 'active' : 'inset'}`}
                    onClick={toggleCamera}
                    title={localState.isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
                >
                    {localState.isCameraOn ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    )}
                </button>

                <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>

                <button className="vc-ctrl-btn neumorphic-btn circular leave action-btn-red danger" onClick={handleLeave} title="Aramadan Ayrıl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        <line x1="23" y1="1" x2="17" y2="7" />
                        <line x1="17" y1="1" x2="23" y2="7" />
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

export default VoiceChannel;
