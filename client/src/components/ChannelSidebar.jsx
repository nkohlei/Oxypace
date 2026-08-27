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
import { UserPlus, Bell, ChevronRight, ChevronLeft, Volume2, Megaphone, Hash, Info, UserCheck, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
    const { user } = useAuth();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const navigate = useNavigate();
    const uiContext = useUI();
    const { isMobileView } = uiContext || {};
    const isDesktopSidebarCollapsed = uiContext?.isDesktopSidebarCollapsed || false;
    const setIsDesktopSidebarCollapsed = uiContext?.setIsDesktopSidebarCollapsed || (() => {});
    const unreadPostsByChannel = useGlobalStore(state => state.unreadPostsByChannel);
    const clearUnreadForChannel = useGlobalStore(state => state.clearUnreadForChannel);
    const { roomStartTime, activeRoom } = useVoice();
    const { socket, onlineUsers, connected } = useSocket();

    // Calculate real online count from portal.members, portal.admins, portal.owner and onlineUsers list
    const allMemberIdSet = new Set([
        portal?.owner?._id || portal?.owner?.id || portal?.owner,
        ...(portal?.admins || []).map(a => a?._id || a?.id || a),
        ...(portal?.members || []).map(m => m?._id || m?.id || m)
    ].filter(Boolean).map(id => String(id)));

    const onlineCountList = Array.from(allMemberIdSet).filter(id => onlineUsers.map(String).includes(String(id)));
    // If current logged-in user is connected and belongs to this portal (or is viewing), ensure at least 1 online is shown
    const isCurrentUserInPortal = user?._id && (allMemberIdSet.has(String(user._id)) || isMember || canManage || !portal?.privacy || portal?.privacy === 'public');
    const onlineCount = Math.max(onlineCountList.length, (connected && isCurrentUserInPortal) ? 1 : 0);

    // Clear unread count for the active channel
    useEffect(() => {
        if (currentChannel && portal?._id) {
            clearUnreadForChannel(currentChannel, portal._id);
        }
    }, [currentChannel, portal?._id, clearUnreadForChannel]);

    if (!portal) return null;

    const channels = portal?.channels ? [...portal.channels].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ch) => ({
        id: ch._id,
        name: ch.name,
        type: ch.type || 'text',
    })) : [];

    const activeChannelObj = channels.find(ch => ch.id === currentChannel);
    const isLiveRoom = activeChannelObj?.type === 'voice' || activeChannelObj?.type === 'conference';

    useEffect(() => {
        if (!isLiveRoom && isDesktopSidebarCollapsed) {
            setIsDesktopSidebarCollapsed(false);
        }
    }, [isLiveRoom, isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed]);

    const isSelected = (id) => currentChannel === id;

    return (
        <div
            className={`channel-sidebar ${isDesktopSidebarCollapsed ? 'collapsed' : ''} ${className || ''}`}
            style={{
                height: 'calc(100% - 24px)',
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'visible',
                position: 'relative',
                borderRight: 'none',
            }}
        >
            {!isMobileView && isLiveRoom && (
                <button
                    className="sidebar-toggle-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
                    }}
                    title={isDesktopSidebarCollapsed ? "Menüyü Göster" : "Menüyü Gizle"}
                >
                    {isDesktopSidebarCollapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <ChevronLeft size={16} />
                    )}
                </button>
            )}

            <div className="sidebar-content-wrapper" style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                transition: 'opacity 0.2s ease, visibility 0.2s ease',
                opacity: isDesktopSidebarCollapsed ? 0 : 1,
                visibility: isDesktopSidebarCollapsed ? 'hidden' : 'visible',
                gap: '8px',
                padding: '0px',
                boxSizing: 'border-box',
            }}>

                {/* ── SECTION 1: Banner + Portal Info ── */}
                <div className="cs-panel cs-panel--banner">
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

                    {/* Portal Quick Info */}
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
                                    title="Bildirim Ayarları"
                                >
                                    <Bell size={16} />
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
                    </div>
                </div>

                {/* ── SECTION 2: Channels ── */}
                <div className="cs-panel cs-panel--channels custom-scrollbar">
                    {/* Header */}
                    <div className="cs-channels-header">
                        <span>Kanallar</span>
                        {canManage && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit('channels');
                                }}
                                className="cs-add-channel-btn"
                                title="Kanal Oluştur"
                            >
                                +
                            </div>
                        )}
                    </div>

                    {/* Channel List */}
                    <div className="cs-channel-list">
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
                                                marginLeft: '-4px',
                                                flexShrink: 0
                                            }}
                                        >
                                            {unreadPostsByChannel[channel.id].length > 9 ? '9+' : unreadPostsByChannel[channel.id].length}
                                        </div>
                                    )}

                                    <div style={{ flex: 1 }} />

                                    {isActive && isVoice && activeRoom && String(activeRoom.channelId) === String(channel.id) && roomStartTime && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <RoomTimer startedAt={roomStartTime} className="vc-sidebar-timer" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── SECTION 3: User Bar + Footer ── */}
                <div className="cs-panel cs-panel--userbar">
                    <UserBar currentChannelId={currentChannel} />
                    <div className="cs-footer-copyright">
                        © 2026 Oxypace. Tüm hakları saklıdır.
                    </div>
                </div>

            </div>

            <style>{`
            /* ── Channel Sidebar Shell ── */
            .channel-sidebar {
                width: 350px;
                transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                flex-shrink: 0;
                max-width: 100vw;
                /* Transparent shell — panels carry their own glass */
                background: transparent !important;
                border: none !important;
                border-radius: 0 !important;
                margin: 12px 12px 12px 0 !important;
                height: calc(100% - 24px) !important;
                overflow: visible !important;
                box-shadow: none !important;
                position: relative;
            }

            .channel-sidebar.collapsed {
                width: 0px !important;
                min-width: 0px !important;
                margin-right: 0px !important;
            }

            /* ── Three-Panel Layout ── */
            .sidebar-content-wrapper {
                scrollbar-width: none;
            }

            /* Shared panel base */
            .cs-panel {
                width: 100%;
                background: var(--glass-bg);
                backdrop-filter: blur(20px) saturate(160%);
                -webkit-backdrop-filter: blur(20px) saturate(160%);
                border: 1px solid var(--glass-border);
                border-radius: 14px;
                overflow: hidden;
                flex-shrink: 0;
                box-shadow: var(--glass-shadow);
            }

            /* Panel 1 – Banner + portal info (fixed height) */
            .cs-panel--banner {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
            }

            /* Panel 2 – Channels (takes remaining space, scrollable) */
            .cs-panel--channels {
                flex: 1 1 0;
                min-height: 0;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                padding: 0 8px 8px 8px;
            }

            /* Panel 3 – UserBar + footer (fixed height) */
            .cs-panel--userbar {
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
            }

            /* Channels header inside panel 2 */
            .cs-channels-header {
                padding: 12px 8px 4px 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: var(--text-tertiary);
                text-transform: uppercase;
                font-size: 12px;
                font-weight: 700;
                font-family: var(--font-primary);
                letter-spacing: 0.04em;
                flex-shrink: 0;
            }

            .cs-add-channel-btn {
                cursor: pointer;
                padding: 0 4px;
                font-size: 18px;
                font-weight: bold;
                color: var(--text-tertiary);
                transition: color 0.15s;
            }
            .cs-add-channel-btn:hover { color: var(--text-primary); }

            .cs-channel-list {
                display: flex;
                flex-direction: column;
                flex: 1;
            }

            /* Footer copyright inside panel 3 */
            .cs-footer-copyright {
                padding: 4px 0 8px 0;
                font-size: 11px;
                color: var(--text-tertiary);
                text-align: center;
                opacity: 0.6;
                user-select: none;
                border-top: 1px solid var(--border-subtle);
            }

            /* ── Toggle button (Glass vertical pill attached to top panel) ── */
            .sidebar-toggle-btn {
                position: absolute;
                right: -24px;
                top: 8px;
                width: 24px;
                height: 140px;
                background: rgba(18, 18, 24, 0.75) !important;
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.14) !important;
                border-left: 1px solid rgba(255, 255, 255, 0.06) !important;
                border-radius: 0 10px 10px 0 !important;
                color: #94a3b8;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 4px 0 16px rgba(0, 0, 0, 0.35);
                transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.3s ease, visibility 0.3s ease;
                transform: none !important;
                padding: 0;
            }
            [data-theme='light'] .sidebar-toggle-btn {
                background: rgba(255, 255, 255, 0.85) !important;
                border: 1px solid rgba(0, 0, 0, 0.12) !important;
                border-left: 1px solid rgba(0, 0, 0, 0.05) !important;
                color: #334155;
                box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
            }
            .sidebar-toggle-btn:hover {
                color: #ffffff;
                background: rgba(35, 38, 50, 0.9) !important;
                border-color: rgba(255, 255, 255, 0.25) !important;
            }
            [data-theme='light'] .sidebar-toggle-btn:hover {
                color: #0f172a;
                background: rgba(241, 245, 249, 0.95) !important;
                border-color: rgba(0, 0, 0, 0.2) !important;
            }
            .sidebar-toggle-btn svg {
                transition: transform 0.2s ease;
            }
            .sidebar-toggle-btn:hover svg {
                transform: scale(1.2);
            }

            /* ── Banner ── */
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
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%);
            }

            /* ── Portal quick info ── */
            .portal-quick-info {
                padding: 14px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: transparent;
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

            /* ── Channel items ── */
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

            /* ── Scrollbar ── */
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: var(--border-subtle);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }

            /* ── Responsive ── */
            @media (max-width: 768px) {
                .channel-banner-container { height: 120px; }
                .portal-title-text { font-size: 16px; }
            }
            `}</style>
            {showInviteModal && (
                <InviteUserModal portalId={portal._id} onClose={() => setShowInviteModal(false)} />
            )}
        </div>
    );
};

export default ChannelSidebar;
