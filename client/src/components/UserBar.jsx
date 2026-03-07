import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectionState } from 'livekit-client';
import './UserBar.css';

const UserBar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Global Voice State
    const { activeRoom, connectionState, localState, toggleMicrophone, disconnectFromChannel, participants } = useVoice();
    const location = useLocation();
    const isConnected = connectionState === ConnectionState.Connected;

    const [showPopover, setShowPopover] = React.useState(false);

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
            {isConnected && activeRoom && location.pathname !== `/portal/${activeRoom.portalId}` && (
                <div
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'var(--primary-green)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        borderBottom: '1px solid rgba(0,0,0,0.1)'
                    }}
                    onClick={() => navigate(`/portal/${activeRoom.portalId}`)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                            width: '10px', height: '10px', backgroundColor: '#fff',
                            borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                            animation: 'pulse 1.5s infinite'
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Sese Bağlı
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={toggleMicrophone}
                            style={{
                                background: 'transparent', border: 'none', color: '#fff',
                                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px', opacity: localState.isMuted ? 0.7 : 1
                            }}
                            title={localState.isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
                        >
                            {localState.isMuted ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                            )}
                        </button>
                        <button
                            onClick={disconnectFromChannel}
                            title="Ayrıl"
                            style={{
                                background: 'transparent', border: 'none', color: '#fff',
                                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                                <line x1="23" y1="1" x2="1" y2="23" />
                            </svg>
                        </button>
                    </div>
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
                                height: '80px',
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
                                    top: '-40px',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    border: '6px solid var(--bg-card)',
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
                        <div style={{ padding: '50px 16px 16px 16px' }}>
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
                                        fontSize: '20px',
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
                                    marginTop: '16px',
                                    fontSize: '14px',
                                    color: 'var(--text-tertiary)',
                                }}
                            >
                                {user.profile?.bio ||
                                    'Evcil hayvanı olması için efsanevi bir yaratık seç'}
                            </div>

                            {/* Edit Button */}
                            <button
                                style={{
                                    width: '100%',
                                    marginTop: '16px',
                                    padding: '10px',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onClick={() => navigate('/settings')}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Profili Düzenle
                            </button>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="1" y1="1" x2="23" y2="23" />
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .34-.03.67-.08 1" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        )}
                    </button>

                    {isConnected ? (
                        <button
                            className="neumorphic-icon-btn danger"
                            title="Bağlantıyı Kes"
                            onClick={disconnectFromChannel}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                                <line x1="23" y1="1" x2="1" y2="23" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            className="neumorphic-icon-btn"
                            title="Kulaklık"
                            style={{ opacity: 0.5, cursor: 'default' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                            </svg>
                        </button>
                    )}

                    <button
                        className="neumorphic-icon-btn"
                        title="Ayarlar"
                        onClick={() => navigate('/settings')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
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

export default UserBar;
