import { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUI } from '../context/UIContext';
import InviteUserModal from './InviteUserModal';
import Badge from './Badge';
import PortalBadges from './PortalBadges';
import UserBar from './UserBar';
import { useGlobalStore } from '../store/useGlobalStore';
import { useVoice } from '../context/VoiceContext';
import { useSocket, useOnlineUsers } from '../context/SocketContext';
import RoomTimer from './RoomTimer';

import { getImageUrl } from '../utils/imageUtils';
import { UserPlus, Bell, ChevronRight, ChevronLeft, Volume2, Megaphone, Hash, Info, UserCheck, Image, Mic, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PortalInfoModal from './PortalInfoModal';
import './ChannelSidebar.css';

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
    const { roomStartTime, activeRoom, participants } = useVoice();
    const { socket } = useSocket();
    const onlineUsers = useOnlineUsers();
    const [voiceCounts, setVoiceCounts] = useState({});
    const [activeStatTooltip, setActiveStatTooltip] = useState(null);
    const statTooltipTimeoutRef = useRef(null);

    const handleStatClick = (statKey, e) => {
        e.stopPropagation();
        if (statTooltipTimeoutRef.current) {
            clearTimeout(statTooltipTimeoutRef.current);
        }
        setActiveStatTooltip(statKey);
        statTooltipTimeoutRef.current = setTimeout(() => {
            setActiveStatTooltip(null);
        }, 1800);
    };

    useEffect(() => {
        return () => {
            if (statTooltipTimeoutRef.current) {
                clearTimeout(statTooltipTimeoutRef.current);
            }
        };
    }, []);

    // Savunmacı ID çıkarma — populate edilmiş obje ya da raw string ID her ikisini de doğru işler.
    // portal.owner obje olduğunda String(portal.owner) → "[object Object]" olur, bu hatayı önler.
    const extractId = (v) => {
        if (!v) return null;
        if (typeof v === 'string') return v;
        const id = v._id || v.id;
        return id ? String(id) : null;
    };

    const isHiddenOnMobile = Boolean(className && className.includes('mobile-hidden'));

    const { onlineCount, totalMemberCount } = useMemo(() => {
        if (isHiddenOnMobile) {
            return {
                onlineCount: 0,
                totalMemberCount: portal?.memberCount || portal?.membersCount || (portal?.members || []).length || 0,
            };
        }

        const portalMemberIds = new Set();
        const ownerId = extractId(portal?.owner);
        if (ownerId) portalMemberIds.add(ownerId);

        (portal?.admins || []).forEach((a) => {
            const aId = extractId(a);
            if (aId) portalMemberIds.add(aId);
        });
        (portal?.members || []).forEach((m) => {
            const mId = extractId(m);
            if (mId) portalMemberIds.add(mId);
        });

        const onlineSet = new Set((onlineUsers || []).map((id) => String(id)));
        const currentUserId = user?._id ? String(user._id) : null;
        const showMyOnline = user?.settings?.privacy?.showOnlineStatus !== false;
        if (currentUserId && portalMemberIds.has(currentUserId) && showMyOnline) {
            onlineSet.add(currentUserId);
        } else if (currentUserId && !showMyOnline) {
            onlineSet.delete(currentUserId);
        }

        let count = 0;
        portalMemberIds.forEach((id) => {
            if (onlineSet.has(id)) count++;
        });

        return {
            onlineCount: count,
            totalMemberCount: portalMemberIds.size || portal?.memberCount || portal?.membersCount || (portal?.members || []).length || 0,
        };
    }, [isHiddenOnMobile, portal?.owner, portal?.admins, portal?.members, portal?.memberCount, portal?.membersCount, onlineUsers, user?._id, user?.settings?.privacy?.showOnlineStatus]);

    // Clear unread count for the active channel
    useEffect(() => {
        if (currentChannel && portal?._id) {
            clearUnreadForChannel(currentChannel, portal._id);
        }
    }, [currentChannel, portal?._id, clearUnreadForChannel]);

    // Canlı sesli / görüntülü odaların aktif katılımcı sayılarını çek ve güncelle
    useEffect(() => {
        if (isHiddenOnMobile || !portal?._id || !portal?.channels?.length) return;

        const voiceChannels = portal.channels.filter(ch => ch.type === 'voice' || ch.type === 'conference');
        if (voiceChannels.length === 0) return;

        let isMounted = true;
        const fetchCounts = async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            try {
                const results = await Promise.all(
                    voiceChannels.map(async (ch) => {
                        const chId = ch._id || ch.id;
                        try {
                            const res = await axios.get(`/api/voice/rooms/${portal._id}/${chId}/participants?t=${Date.now()}`);
                            return { channelId: String(chId), count: res.data?.participants?.length || 0 };
                        } catch {
                            return { channelId: String(chId), count: 0 };
                        }
                    })
                );
                if (isMounted) {
                    setVoiceCounts(prev => {
                        const updated = { ...prev };
                        results.forEach(r => {
                            updated[r.channelId] = r.count;
                        });
                        return updated;
                    });
                }
            } catch {
                // Sessizce geç
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isHiddenOnMobile, portal?._id, portal?.channels]);

    // Socket üzerinden anlık kanal katılımcı sayısı güncellemelerini dinle
    useEffect(() => {
        if (!socket) return;

        const handleCountUpdate = (data) => {
            if (!data || !data.channelId) return;
            if (data.portalId && String(data.portalId) !== String(portal?._id)) return;
            setVoiceCounts(prev => ({
                ...prev,
                [String(data.channelId)]: Number(data.count) || 0
            }));
        };

        socket.on('voice:channel-count-update', handleCountUpdate);
        return () => {
            socket.off('voice:channel-count-update', handleCountUpdate);
        };
    }, [socket, portal?._id]);

    const channels = portal?.channels ? [...portal.channels].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ch) => ({
        id: ch._id,
        name: ch.name,
        type: ch.type || 'text',
        postCount: ch.postCount,
    })) : [];

    const activeChannelObj = channels.find(ch => String(ch.id) === String(currentChannel));
    const isLiveRoom = activeChannelObj?.type === 'voice' || activeChannelObj?.type === 'conference';

    useEffect(() => {
        if (!isLiveRoom && isDesktopSidebarCollapsed) {
            setIsDesktopSidebarCollapsed(false);
        }
    }, [isLiveRoom, isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed]);

    const isSelected = (id) => String(currentChannel) === String(id);

    const rawBanner = portal?.coverImage || portal?.banner;
    const resolvedBannerUrl = rawBanner ? getImageUrl(rawBanner) : null;
    const defaultFallbackBanner = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

    // Only set fallback if portal is loaded and explicitly has no custom banner.
    // If a custom banner is present, use ONLY that URL to avoid displaying any other image underneath.
    const bannerBgStyle = resolvedBannerUrl
        ? `url("${resolvedBannerUrl}")`
        : (portal && !rawBanner)
            ? `url("${defaultFallbackBanner}")`
            : 'none';

    const [bannerLoaded, setBannerLoaded] = useState(false);
    const lastBannerUrlRef = useRef(null);

    useEffect(() => {
        if (!resolvedBannerUrl) {
            setBannerLoaded(true);
            lastBannerUrlRef.current = null;
            return;
        }

        if (lastBannerUrlRef.current === resolvedBannerUrl) {
            setBannerLoaded(true);
            return;
        }

        lastBannerUrlRef.current = resolvedBannerUrl;
        const img = new window.Image();
        img.src = resolvedBannerUrl;
        if (img.complete) {
            setBannerLoaded(true);
        } else {
            setBannerLoaded(false);
            img.onload = () => setBannerLoaded(true);
            img.onerror = () => setBannerLoaded(true);
        }
    }, [resolvedBannerUrl]);

    if (!portal) return null;

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
                    type="button"
                    className="sidebar-toggle-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
                    }}
                    title={isDesktopSidebarCollapsed ? "Menüyü Göster" : "Menüyü Gizle"}
                    aria-label={isDesktopSidebarCollapsed ? "Menüyü Göster" : "Menüyü Gizle"}
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
                                backgroundImage: bannerBgStyle,
                                opacity: bannerLoaded ? 1 : 0,
                            }}
                        />
                        <div className="channel-banner-overlay" />
                        {canManage && (
                            <button
                                type="button"
                                className="channel-banner-settings-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit('overview');
                                }}
                                title="Portal Ayarları"
                                aria-label="Portal Ayarları"
                            >
                                <Settings size={15} strokeWidth={2} />
                            </button>
                        )}
                    </div>

                    {/* Portal Quick Info */}
                    <div className="portal-quick-info">
                        <div className="portal-info-main" onClick={() => onShowPortalInfo && onShowPortalInfo()}>
                            <h2 className="portal-title-text">
                                <span className="portal-title-name">{portal.name}</span>
                                <PortalBadges portal={portal} size={18} />
                            </h2>
                            <div className="portal-stats-row">
                                <div
                                    className={`stat-item ${activeStatTooltip === 'members' ? 'stat-tooltip-active' : ''}`}
                                    onClick={(e) => handleStatClick('members', e)}
                                    title="Üye"
                                >
                                    <UserCheck size={12} />
                                    <span>{totalMemberCount}</span>
                                    <div className="stat-floating-tag">Üye</div>
                                </div>
                                <div className="stat-dot" />
                                <div
                                    className={`stat-item ${activeStatTooltip === 'posts' ? 'stat-tooltip-active' : ''}`}
                                    onClick={(e) => handleStatClick('posts', e)}
                                    title="Gönderi"
                                >
                                    <MessageSquare size={12} />
                                    <span>{portal.postCount || 0}</span>
                                    <div className="stat-floating-tag">Gönderi</div>
                                </div>
                                <div className="stat-dot" />
                                <div
                                    className={`stat-item ${activeStatTooltip === 'online' ? 'stat-tooltip-active' : ''}`}
                                    onClick={(e) => handleStatClick('online', e)}
                                    title="Çevrimiçi"
                                >
                                    <div className="online-indicator-dot" />
                                    <span>{onlineCount}</span>
                                    <div className="stat-floating-tag">Çevrimiçi</div>
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
                            const isVoice = channel.type === 'voice' || channel.type === 'conference';

                            // Aktif odada isek doğrudan yerel katılımcı sayısını al (ekran paylaşımı kartlarını hariç tut), değilse sunucu/socket sayısını kullan
                            let activeCount = voiceCounts[String(channel.id)] ?? 0;
                            if (activeRoom && String(activeRoom.channelId) === String(channel.id) && Array.isArray(participants)) {
                                activeCount = participants.filter(p => !p.isScreenSharing && !String(p.identity).endsWith('-screen')).length;
                            }

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
                                        transition: 'background-color 0.15s ease, color 0.15s ease',
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
                                        {channel.type === 'conference' ? (
                                            <Mic size={20} strokeWidth={2} />
                                        ) : channel.type === 'voice' ? (
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

                                    {isVoice && (
                                        <span className={`vc-channel-active-badge ${activeCount > 0 ? 'online' : 'idle'}`}>
                                            {activeCount > 0 ? `${activeCount} aktif` : 'aktif yok'}
                                        </span>
                                    )}

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

            {showInviteModal && (
                <InviteUserModal portalId={portal._id} onClose={() => setShowInviteModal(false)} />
            )}
        </div>
    );
};

export default memo(ChannelSidebar);
