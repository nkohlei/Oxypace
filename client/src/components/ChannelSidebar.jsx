import { useRef, useState } from 'react';
import InviteUserModal from './InviteUserModal';

import { getImageUrl } from '../utils/imageUtils';

const ChannelSidebar = ({ portal, isMember, onEdit, currentChannel, onChangeChannel, className, canManage }) => {
    const [showInviteModal, setShowInviteModal] = useState(false);

    if (!portal) return null;

    // Combine default 'general' with dynamic channels
    const channels = [
        { id: 'general', name: 'genel', type: 'text' },
        ...(portal?.channels?.map(ch => ({
            id: ch._id || ch.name,
            name: ch.name,
            type: ch.type || 'text'
        })) || [])
    ];

    const isSelected = (id) => currentChannel === id;

    return (
        <div className={`channel-sidebar ${className || ''}`} style={{
            // Width is handled by CSS class
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
            borderRight: '1px solid var(--border-subtle)'
        }}>
            {/* 1. Header with Full Image Banner */}
            <div style={{
                height: '135px',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                background: 'var(--bg-card)' // Fallback color
            }} onClick={() => onEdit('overview')}>
                {/* Banner Image */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // Prefer portal cover, then banner, then default
                    backgroundImage: portal.coverImage ? `url(${getImageUrl(portal.coverImage)})` :
                        portal.banner ? `url(${getImageUrl(portal.banner)})` :
                            'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    {/* Gradient Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
                    }}></div>
                </div>

                {/* Header Content Overlay */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '12px 16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    {/* Top Row: Name + Icons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '85%' }}>
                            {/* Flower/Boost Icon (Pink) */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff73fa" style={{ flexShrink: 0 }}>
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <h2 style={{
                                fontSize: '16px',
                                fontWeight: '900',
                                color: 'white',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                margin: 0
                            }}>{portal.name}</h2>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
                                <path d="M7 10l5 5 5-5H7z" />
                            </svg>
                        </div>
                        {/* Invite/People Icon */}
                        <div
                            style={{ color: 'white', cursor: 'pointer', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInviteModal(true);
                            }}
                            title="Kullanıcı Davet Et"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="custom-scrollbar" style={{ flex: 1, padding: '0 8px 8px 8px', overflowY: 'auto' }}>

                {/* 2. Bildirimler (Portal Notifications - Admin Only) */}
                {canManage && (
                    <div
                        onClick={() => onEdit && onEdit('notifications')}
                        style={{
                            marginTop: '16px',
                            marginBottom: '16px',
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'linear-gradient(90deg, #48304c 0%, #38253a 100%)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #5a3c62 0%, #46304a 100%)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #48304c 0%, #38253a 100%)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#f59e0b' }}>
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span style={{ fontSize: '13px', color: '#dbdee1', fontWeight: '700' }}>
                                Bildirimler
                            </span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: '#dbdee1' }}>
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </div>
                )}

                {/* 3. Browse Channels (Kanallara Göz At) replaced/augmented with Header */}
                <div style={{
                    padding: '16px 8px 4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#949ba4',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-primary)'
                }}>
                    <span>Kanallar</span>
                    {/* Plus Button for Admins */}
                    {canManage && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onEdit && onEdit('channels'); }}
                            style={{ cursor: 'pointer', padding: '0 4px', fontSize: '18px', fontWeight: 'bold' }}
                            title="Kanal Oluştur"
                        >
                            +
                        </div>
                    )}
                </div>

                {/* Channel List */}
                {channels.map(channel => {
                    const isActive = isSelected(channel.id);
                    const isAnnouncement = channel.type === 'announcement' || channel.name.includes('announcements');
                    const isVoice = channel.type === 'voice';

                    return (
                        <div
                            key={channel.id}
                            className={`channel-item ${isActive ? 'active' : ''}`}
                            onClick={() => onChangeChannel(channel.id)}
                            style={{
                                padding: '6px 8px',
                                margin: '2px 0',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: isActive ? 'white' : '#949ba4',
                                backgroundColor: isActive ? '#3f4147' : 'transparent',
                                transition: 'all 0.1s'
                            }}
                        >
                            {/* Icon */}
                            <div style={{ color: isActive ? 'white' : '#72767d', display: 'flex', alignItems: 'center', minWidth: '20px', justifyContent: 'center' }}>
                                {isVoice ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                    </svg>
                                ) : isAnnouncement ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                ) : (
                                    <span style={{ fontSize: '24px', fontWeight: 300, lineHeight: 1 }}>#</span>
                                )}
                            </div>

                            {/* Name */}
                            <span style={{
                                fontWeight: isActive ? 600 : 500,
                                fontSize: '16px',
                                flex: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {channel.name}
                            </span>

                            {/* Active Icon (Person+) */}
                            {isActive && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                            )}

                            {/* Notification Badge (For announcements) */}
                            {isAnnouncement && !isActive && (
                                <div style={{
                                    backgroundColor: '#f23f43',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    padding: '0 6px',
                                    borderRadius: '8px',
                                    minWidth: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    1
                                </div>
                            )}

                        </div>
                    );
                })}

            </div>

            {/* User Control Bar Removed */}



            <style>{`
            .channel-sidebar {
                width: 350px;
                transition: width 0.3s ease, transform 0.3s ease;
                flex-shrink: 0;
            }
            
            @media (max-width: 768px) {
                .channel-sidebar {
                    width: 240px;
                    position: fixed;
                    top: 0;
                    left: 72px;
                    z-index: 2000;
                    height: 100vh;
                    transform: translateX(-100%);
                    box-shadow: 2px 0 10px rgba(0,0,0,0.5);
                }
                .channel-sidebar.mobile-open {
                    transform: translateX(0);
                }
            }

            .channel-item:hover {
                background-color: var(--bg-hover) !important;
                color: var(--text-primary) !important;
            }
            .channel-item.active {
                background-color: var(--bg-hover) !important;
                color: var(--primary-color) !important;
            }
            .channel-item.active svg {
                color: var(--primary-color);
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: var(--border-subtle);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background-color: transparent;
            }
            `}</style>
            {showInviteModal && (
                <InviteUserModal
                    portalId={portal._id}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div >
    );
};

export default ChannelSidebar;
