import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

const UserBar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

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
        <div className="user-bar-container" style={{ position: 'relative' }}>
            {/* User Popover (Mini Profile) */}
            {showPopover && (
                <div className="user-popover slide-up-animation" style={{
                    position: 'absolute',
                    bottom: '60px', /* Above the UserBar */
                    left: '8px',
                    width: '340px',
                    backgroundColor: '#111214',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #1e1f22'
                }}>
                    {/* Banner */}
                    <div style={{ height: '60px', backgroundColor: user.profile?.bannerColor || '#000' }}>
                        {user.profile?.coverImage && (
                            <img src={getImageUrl(user.profile.coverImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
                        )}
                    </div>

                    {/* Avatar & Badges */}
                    <div style={{ padding: '0 16px', position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            top: '-40px',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '6px solid #111214',
                            backgroundColor: '#111214',
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }} onClick={() => navigate(`/profile`)}>
                            {user.profile?.avatar ? (
                                <img src={getImageUrl(user.profile.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', backgroundColor: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white' }}>
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#23a559',
                                borderRadius: '50%',
                                border: '3px solid #111214'
                            }} />
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '50px 16px 16px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }} onClick={() => navigate(`/profile`)}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#dbdee1', margin: 0 }}>{user.profile?.displayName || user.username}</h3>
                            <span style={{ fontSize: '14px', color: '#dbdee1' }}>{user.username}</span>
                        </div>

                        {/* Status Message */}
                        <div style={{ marginTop: '16px', fontSize: '14px', color: '#dbdee1' }}>
                            {user.profile?.bio || 'Evcil hayvanı olması için efsanevi bir yaratık seç'}
                        </div>

                        {/* Edit Button */}
                        <button style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '8px',
                            backgroundColor: '#4e5058',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }} onClick={() => navigate('/settings')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Profili Düzenle
                        </button>
                    </div>
                </div>
            )}

            <div style={{
                height: '52px',
                backgroundColor: '#232428', // Slightly lighter than darkest
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
                {/* User Info */}
                <div
                    className="user-bar-info"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        marginRight: 'auto'
                    }}
                    onClick={() => setShowPopover(!showPopover)}
                >
                    <div style={{ position: 'relative' }}>
                        {user.profile?.avatar ? (
                            <img
                                src={getImageUrl(user.profile.avatar)}
                                alt="User"
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#5865F2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                {user.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#23a559', // Online green
                            borderRadius: '50%',
                            border: '2px solid #0b0f19'
                        }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>
                            {user.username}
                        </span>
                        <span style={{ fontSize: '11px', color: '#b9bbbe' }}>
                            #{user._id.substring(0, 4)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex' }}>
                    <button
                        className="user-control-btn"
                        title="Mikrofon (Temsili)"
                        style={{ background: 'transparent', border: 'none', color: '#b9bbbe', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button
                        className="user-control-btn"
                        title="Kulaklık (Temsili)"
                        style={{ background: 'transparent', border: 'none', color: '#b9bbbe', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="currentColor" />
                        </svg>
                    </button>
                    <button
                        className="user-control-btn"
                        title="Ayarlar"
                        onClick={() => navigate('/settings')}
                        style={{ background: 'transparent', border: 'none', color: '#b9bbbe', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </button>
                </div>
                <style>
                    {`
                .user-bar-info:hover, .user-control-btn:hover {
                    background-color: rgba(255,255,255,0.06) !important;
                }
                `}
                </style>
            </div>
        </div>
    );
};

export default UserBar;
