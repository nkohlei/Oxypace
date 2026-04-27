import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectionState } from 'livekit-client';
import { PhoneOff, MicOff, Mic, Pencil, Headphones, Settings } from 'lucide-react';
import './UserBar.css';

const UserBar = ({ currentChannelId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Global Voice State
    const { activeRoom, connectionState, localState, toggleMicrophone, disconnectFromChannel, participants, pinnedParticipant, setPinnedParticipant } = useVoice();
    const location = useLocation();
    const isConnected = connectionState === ConnectionState.Connected;

    const [showPopover, setShowPopover] = React.useState(false);

    // Visibility logic for the rich voice bar
    const isPortalRoute = location.pathname.includes(`/portal/${activeRoom?.portalId}`);
    const isViewingActiveVoiceChannel = isPortalRoute && currentChannelId === activeRoom?.channelId;
    const showVoiceBar = isConnected && activeRoom && !isViewingActiveVoiceChannel;

    // Close popover when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPopover && !event.target.closest('.user-bar-container')) {
                setShowPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopover]);

    if (!user) return null;

    return (
        <div className="user-bar-container" style={{ position: 'relative', flexDirection: 'column', height: 'auto', padding: 0 }}>
            {/* Voice Connection Panel (Visible when connected) */}
            {showVoiceBar && (
                <div
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'var(--bg-darker)',
                        borderTop: '1px solid var(--border-subtle)',
                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Header Row */}
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => navigate(`/portal/${activeRoom.portalId}`)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <div style={{
                                width: '8px', height: '8px', backgroundColor: 'var(--primary-green)',
                                borderRadius: '50%', boxShadow: '0 0 6px rgba(35,165,89,0.8)',
                                animation: 'pulse 2s infinite'
                            }} />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-green)', whiteSpace: 'nowrap' }}>
                                Sese Bağlı
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={disconnectFromChannel}
                                title="Ayrıl"
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '2px', borderRadius: '4px'
                                }}
                            >
                                <PhoneOff size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Participant Avatars */}
                    {participants.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                            {participants.map(p => (
                                <div
                                    key={p.identity}
                                    onClick={() => setPinnedParticipant(prev => prev === p.identity ? null : p.identity)}
                                    style={{
                                        position: 'relative',
                                        cursor: 'pointer',
                                        borderRadius: '50%',
                                        padding: '2px',
                                        border: pinnedParticipant === p.identity ? '2px solid #fff' : '2px solid transparent',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title={p.name}
                                >
                                    <img
                                        src={getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=2b2d31&color=fff`}
                                        alt={p.name}
                                        style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            border: p.isSpeaking ? '2px solid var(--primary-green)' : '2px solid transparent',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                    {p.isMuted && (
                                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--bg-darker)', borderRadius: '50%', padding: '1px' }}>
                                            <MicOff size={10} color="#ef4444" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pinned Video Area */}
                    {pinnedParticipant && participants.find(p => p.identity === pinnedParticipant) && (
                        <MiniVideo participant={participants.find(p => p.identity === pinnedParticipant)} />
                    )}
                </div>
            )}

            {/* Main User Area */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', height: '52px', boxSizing: 'border-box' }}>
                {/* User Popover (Mini Profile) */}
                {showPopover && (
                    <div className="user-popover">
                        {/* Banner */}
                        <div
                            style={{
                                height: '55px',
                                backgroundColor: user.profile?.bannerColor || 'var(--bg-darker)',
                            }}
                        >
                            {user.profile?.coverImage && (
                                <img
                                    src={getImageUrl(user.profile.coverImage)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt="Cover"
                                />
                            )}
                        </div>

                        {/* Avatar & Badges */}
                        <div style={{ padding: '0 16px', position: 'relative' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-32px',
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    border: '4px solid var(--bg-card)',
                                    backgroundColor: 'var(--bg-card)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate(`/profile`)}
                            >
                                {user.profile?.avatar ? (
                                    <img
                                        src={getImageUrl(user.profile.avatar)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt="Avatar"
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: 'var(--primary-cyan)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '32px',
                                            color: '#000',
                                        }}
                                    >
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        right: '4px',
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: 'var(--primary-green)',
                                        borderRadius: '50%',
                                        border: '3px solid var(--bg-card)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '40px 12px 12px 12px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate(`/profile`)}
                            >
                                <h3
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                    }}
                                >
                                    {user.profile?.displayName || user.username}
                                </h3>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    {user.username}
                                </span>
                            </div>

                            {/* Status Message */}
                            <div
                                style={{
                                    marginTop: '12px',
                                    fontSize: '13px',
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                {user.profile?.bio ||
                                    'Evcil hayvanı olması için efsanevi bir yaratık seç'}
                            </div>

                        </div>
                    </div>
                )}

                {/* User Info */}
                <div
                    className="user-bar-info"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginRight: 'auto',
                        transition: 'background-color 0.2s',
                        flex: 1,
                        minWidth: 0,
                    }}
                    onClick={() => setShowPopover(!showPopover)}
                >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        {user.profile?.avatar ? (
                            <img
                                src={getImageUrl(user.profile.avatar)}
                                alt="User"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary-cyan)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                }}
                            >
                                {user.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'var(--primary-green)',
                                borderRadius: '50%',
                                border: '2px solid var(--bg-darker)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {user.username}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            #{user._id?.substring(0, 4)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        className={`neumorphic-icon-btn ${isConnected && !localState.isMuted ? 'active' : ''} ${isConnected && localState.isMuted ? 'danger' : ''}`}
                        title={isConnected ? (localState.isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat") : "Bağlı Değil"}
                        onClick={() => isConnected && toggleMicrophone()}
                        style={{ opacity: isConnected ? 1 : 0.5, cursor: isConnected ? 'pointer' : 'default' }}
                    >
                        {isConnected && localState.isMuted ? (
                            <MicOff size={18} strokeWidth={2.5} />
                        ) : (
                            <Mic size={18} strokeWidth={2.5} />
                        )}
                    </button>

                    {isConnected ? (
                        <button
                            className="neumorphic-icon-btn danger"
                            title="Bağlantıyı Kes"
                            onClick={disconnectFromChannel}
                        >
                            <PhoneOff size={18} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button
                            className="neumorphic-icon-btn"
                            title="Kulaklık"
                            style={{ opacity: 0.5, cursor: 'default' }}
                        >
                            <Headphones size={18} strokeWidth={2.5} />
                        </button>
                    )}

                    <button
                        className="neumorphic-icon-btn"
                        title="Ayarlar"
                        onClick={() => navigate('/settings')}
                    >
                        <Settings size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
            <style>
                {`
                .user-bar-info:hover {
                    background-color: var(--bg-hover) !important;
                    color: var(--text-primary) !important;
                }
                `}
            </style>
        </div>
    );
};

// Sub-component to render pinned participant video
const MiniVideo = ({ participant }) => {
    const videoEl = React.useRef(null);

    React.useEffect(() => {
        if (videoEl.current && participant?.videoTrack) {
            participant.videoTrack.attach(videoEl.current);
        }
        return () => {
            if (participant?.videoTrack) {
                participant.videoTrack.detach();
            }
        };
    }, [participant?.videoTrack]);

    return (
        <div style={{ width: '100%', height: '140px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginTop: '4px' }}>
            {participant.isCameraOn && participant.videoTrack ? (
                <video
                    ref={videoEl}
                    autoPlay
                    muted={participant.isLocal}
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)' }}>
                    <img src={getImageUrl(participant.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=2b2d31&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '50%' }} alt="Avatar" />
                </div>
            )}
            <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: participant.isSpeaking ? 'var(--primary-green)' : 'transparent', transition: 'background 0.2s' }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{participant.name}</span>
            </div>
        </div>
    );
};

export default UserBar;
