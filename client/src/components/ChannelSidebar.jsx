import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import InviteUserModal from './InviteUserModal';
import Badge from './Badge';
import UserBar from './UserBar';
import { useGlobalStore } from '../store/useGlobalStore';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import RoomTimer from './RoomTimer';
import { useEffect } from 'react';

import { getImageUrl } from '../utils/imageUtils';
import { UserPlus, Bell, ChevronRight, Volume2, Megaphone, Hash, Info, UserCheck, Image } from 'lucide-react';
import PortalInfoModal from './PortalInfoModal';

const ChannelSidebar = ({
    portal,
    isMember,
    onEdit,
    currentChannel,
    onChangeChannel,
    className,
    canManage,
    onShowPortalInfo,
}) => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const navigate = useNavigate();
    const { isMobileView } = useUI();
    const unreadPostsByChannel = useGlobalStore(state => state.unreadPostsByChannel);
    const clearUnreadForChannel = useGlobalStore(state => state.clearUnreadForChannel);
    const { roomStartTime, activeRoom } = useVoice();
    const { socket } = useSocket();
    const [onlineCount, setOnlineCount] = useState(() => {
        const total = portal?.membersCount || portal?.members?.length || 0;
        return total > 0 ? Math.max(1, Math.floor(total * 0.12)) : 1;
    });

    useEffect(() => {
        if (!socket || !portal?._id) return;

        // Initialize state to fallback / estimate when portal changes
        const total = portal.membersCount || portal.members?.length || 0;
        setOnlineCount(total > 0 ? Math.max(1, Math.floor(total * 0.12)) : 1);

        const handlePresenceUpdate = (data) => {
            if (String(data.portalId) === String(portal._id)) {
                setOnlineCount(data.onlineCount);
            }
        };

        socket.on('portal_presence_update', handlePresenceUpdate);
        
        // Ask for the current room size immediately
        socket.emit('get_portal_presence', portal._id);

        return () => {
            socket.off('portal_presence_update', handlePresenceUpdate);
        };
    }, [socket, portal?._id]);

    // Clear unread count for the active channel
    useEffect(() => {
        if (currentChannel) {
            clearUnreadForChannel(currentChannel);
        }
    }, [currentChannel, clearUnreadForChannel]);

    if (!portal) return null;

    const channels = portal?.channels ? [...portal.channels].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ch) => ({
        id: ch._id,
        name: ch.name,
        type: ch.type || 'text',
    })) : [];

    const isSelected = (id) => currentChannel === id;

    return (
        <div
            className={`channel-sidebar ${className || ''}`}
            style={{
                // Width is handled by CSS class
                // Width is handled by CSS class
                minHeight: '100%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden',
                borderRight: '1px solid var(--border-subtle)',
            }}
        >
            <div
                className="channel-banner-container"
                onClick={() => onShowPortalInfo && onShowPortalInfo()}
            >
                <div
                    className="channel-banner-image"
                    style={{
                        backgroundImage: portal.coverImage
                            ? `url(${getImageUrl(portal.coverImage)})`
                            : portal.banner
                                ? `url(${getImageUrl(portal.banner)})`
                                : 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
                    }}
                />
                <div className="channel-banner-overlay" />
            </div>

            {/* 2. Portal Quick Info (Title, Stats, Invite) */}
            <div className="portal-quick-info">
                <div className="portal-info-main" onClick={() => onShowPortalInfo && onShowPortalInfo()}>
                    <h2 className="portal-title-text">
                        {portal.name}
                        <Badge type={portal.isVerified ? 'verified' : portal.badges?.[0]} size={16} />
                    </h2>
                    <div className="portal-stats-row">
                        <div className="stat-item">
                            <UserCheck size={12} />
                            <span>{(portal.membersCount || portal.members?.length || 0)} Üye</span>
                        </div>
                        <div className="stat-dot" />
                        <div className="stat-item">
                            <div className="online-indicator-dot" />
                            <span>{onlineCount} Çevrimiçi</span>
                        </div>
                    </div>
                </div>

                <div className="portal-header-actions">
                    {(isMember || canManage) && (
                        <button 
                            className="portal-action-btn-circle"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit && onEdit('notifications');
                            }}
                            title="Bildirimler"
                        >
                            <Bell size={18} />
                        </button>
                    )}
                    {isMember && (
                        <button 
                            className="portal-action-btn-circle"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInviteModal(true);
                            }}
                            title="Davet Et"
                        >
                            <UserPlus size={18} />
                        </button>
                    )}
                </div>
            </div>            {/* Scrollable Area */}
            <div
                className="custom-scrollbar"
                style={{ flex: 1, padding: '0 8px 8px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >


                {/* 3. Browse Channels (Kanallara Göz At) replaced/augmented with Header */}
                <div
                    style={{
                        padding: '16px 8px 4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-primary)',
                    }}
                >
                    <span>Kanallar</span>
                    {/* Plus Button for Admins */}
                    {canManage && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit && onEdit('channels');
                            }}
                            style={{
                                cursor: 'pointer',
                                padding: '0 4px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                            }}
                            title="Kanal Oluştur"
                        >
                            +
                        </div>
                    )}
                </div>

                {/* Channel List */}
                {channels.map((channel) => {
                    const isActive = isSelected(channel.id);
                    const isAnnouncement =
                        channel.type === 'announcement' || channel.name.includes('announcements');
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
                                transition: 'all 0.1s',
                            }}
                        >
                            {/* Icon */}
                            <div
                                style={{
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: '20px',
                                    justifyContent: 'center',
                                }}
                            >
                                {isVoice ? (
                                    <Volume2 size={20} strokeWidth={2} />
                                ) : isAnnouncement ? (
                                    <Megaphone size={20} strokeWidth={2.5} />
                                ) : channel.type === 'image' ? (
                                    <Image size={20} strokeWidth={2.5} style={{ color: '#f59e0b' }} />
                                ) : (
                                    <Hash size={20} strokeWidth={2.5} />
                                )}
                            </div>

                            {/* Name */}
                            <span
                                style={{
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '16px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: isActive ? 'white' : 'var(--text-primary)',
                                    maxWidth: 'fit-content'
                                }}
                            >
                                {channel.name}
                            </span>


                            {/* Notification Badge - Positioned strictly next to the title */}
                            {!isActive && unreadPostsByChannel[channel.id]?.length > 0 && (
                                <div
                                    style={{
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
                                        justifyContent: 'center',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        marginLeft: '-4px', // Bring it even closer if needed
                                        flexShrink: 0
                                    }}
                                >
                                    {unreadPostsByChannel[channel.id].length > 9 ? '9+' : unreadPostsByChannel[channel.id].length}
                                </div>
                            )}

                            {/* Padding element to maintain hover background filling the width if needed */}
                            <div style={{ flex: 1 }} />

                            {/* Timer (if active voice channel) */}
                            {isActive && isVoice && activeRoom && String(activeRoom.channelId) === String(channel.id) && roomStartTime && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <RoomTimer startedAt={roomStartTime} className="vc-sidebar-timer" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* User Control Bar - Bottom of Sidebar */}
            <UserBar currentChannelId={currentChannel} />

            {/* Footer Copyright */}
            <div style={{
                paddingTop: '4px',
                paddingBottom: '8px',
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                opacity: 0.6,
                userSelect: 'none',
                backgroundColor: 'var(--bg-secondary)', /* match sidebar background */
                borderTop: '1px solid var(--border-subtle)', /* separator from user bar */
            }}>
                © 2026 Oxypace. Tüm hakları saklıdır.
            </div>

            <style>{`
            .channel-sidebar {
                width: 350px;
                transition: width 0.3s ease, transform 0.3s ease;
                flex-shrink: 0;
                max-width: 100vw;
                overflow-x: hidden;
            }
            
            .channel-banner-container {
                height: 160px;
                position: relative;
                cursor: pointer;
                overflow: hidden;
                flex-shrink: 0;
                transition: height 0.3s ease;
            }

            .channel-banner-image {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                transition: transform 0.5s ease;
            }

            .channel-banner-container:hover .channel-banner-image {
                transform: scale(1.05);
            }

            .channel-banner-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%);
            }

            .portal-quick-info {
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid var(--border-subtle);
                background: var(--bg-secondary);
            }

            .portal-info-main {
                flex: 1;
                cursor: pointer;
                min-width: 0;
            }

            .portal-title-text {
                font-size: 18px;
                font-weight: 800;
                color: var(--text-primary);
                margin: 0 0 4px 0;
                display: flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .portal-stats-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
            }

            .online-indicator-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #23a559;
            }

            .stat-dot {
                width: 3px;
                height: 3px;
                border-radius: 50%;
                background: var(--text-tertiary);
                opacity: 0.5;
            }

            .portal-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 12px;
            }

            .portal-action-btn-circle {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                border: 1px solid var(--border-subtle);
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .portal-action-btn-circle:hover {
                background: var(--primary-color);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
            }

            @media (max-width: 768px) {
                .channel-banner-container {
                    height: 120px;
                }
                .portal-title-text {
                    font-size: 16px;
                }
            }

            .channel-item:hover {
                background-color: var(--bg-hover) !important;
                color: var(--text-primary) !important;
            }
            .channel-item.active {
                background-color: var(--bg-hover) !important;
                color: var(--text-primary) !important;
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
                <InviteUserModal portalId={portal._id} onClose={() => setShowInviteModal(false)} />
            )}
        </div>
    );
};

export default ChannelSidebar;
