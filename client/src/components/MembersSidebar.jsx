import { useState, useEffect, memo } from 'react';
import { useOnlineUsers } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import UserBadges from './UserBadges';
import './MembersSidebar.css';

const MembersSidebar = ({ members = [], onClose }) => {
    const onlineUsers = useOnlineUsers();
    const { user: currentUser } = useAuth();
    const [, setTick] = useState(0);

    // 60 saniyelik periyodik tetikleyici ile "şimdi / 5m / 1h" sürelerini canlı tut
    useEffect(() => {
        const timer = setInterval(() => {
            setTick(t => t + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper to format last active time
    const formatTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const past = new Date(date);
        const diffMs = Math.max(0, now - past); // Ensure no negative time
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'şimdi';
        if (diffMins < 60) return `${diffMins}dk`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}sa`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) return `${diffDays}g`;
        
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths}ay`;
        
        return `${Math.floor(diffMonths / 12)}y`;
    };

    const extractId = (v) => {
        if (!v) return null;
        if (typeof v === 'string') return v;
        const id = v._id || v.id;
        return id ? String(id) : null;
    };

    // Normalize online user IDs into a Set for fast and accurate lookups
    const onlineSet = new Set((onlineUsers || []).map(id => String(id)));
    const currentUserId = currentUser?._id ? String(currentUser._id) : null;
    const showMyOnline = currentUser?.settings?.privacy?.showOnlineStatus !== false;
    if (currentUserId && showMyOnline) {
        onlineSet.add(currentUserId);
    } else if (currentUserId && !showMyOnline) {
        onlineSet.delete(currentUserId);
    }

    // Role priority order: owner (3) > admin (2) > member (1)
    const getRolePriority = (m) => {
        if (m?.role === 'owner') return 3;
        if (m?.role === 'admin' || m?.isAdmin) return 2;
        return 1;
    };

    // Filter and sort members based on role and online status
    const online = members
        .filter((m) => {
            if (!m) return false;
            const id = extractId(m);
            return id && onlineSet.has(id);
        })
        .sort((a, b) => {
            const roleDiff = getRolePriority(b) - getRolePriority(a);
            if (roleDiff !== 0) return roleDiff;
            const nameA = a.profile?.displayName || a.username || '';
            const nameB = b.profile?.displayName || b.username || '';
            return nameA.localeCompare(nameB);
        });

    const offline = members
        .filter((m) => {
            if (!m) return false;
            const id = extractId(m);
            return id && !onlineSet.has(id);
        })
        .sort((a, b) => {
            const roleDiff = getRolePriority(b) - getRolePriority(a);
            if (roleDiff !== 0) return roleDiff;
            const nameA = a.profile?.displayName || a.username || '';
            const nameB = b.profile?.displayName || b.username || '';
            return nameA.localeCompare(nameB);
        });

    return (
        <div className="members-sidebar custom-scrollbar">
            {/* Header with Close Button */}
            <div className="members-header-top">
                <h3>ÜYELER</h3>
                {onClose && (
                    <button onClick={onClose} className="close-members-btn" aria-label="Kapat">
                        <X size={20} strokeWidth={2} />
                    </button>
                )}
            </div>

            {/* Online Category */}
            <div className="members-category">Çevrim içi — {online.length}</div>
            {online.map((user, index) => {
                // Safeguard against malformed data
                if (!user || typeof user === 'string') return null;
                const username = user.username || 'Unknown';
                const avatar = user.profile?.avatar || user.avatar;
                const displayName = user.profile?.displayName || username;
                const isOwner = user.role === 'owner';
                const isAdmin = user.role === 'admin' || user.isAdmin;

                return (
                    <Link to={`/profile/${username}`} key={user._id || user.id || index} className="member-item member-link">
                        <div className="member-avatar-wrapper">
                            {avatar ? (
                                <img
                                    src={getImageUrl(avatar, 'thumbnail')}
                                    alt=""
                                    className="member-avatar"
                                    loading="eager"
                                    decoding="async"
                                />
                            ) : (
                                <div className="member-avatar-placeholder">
                                    {displayName[0]?.toUpperCase() || username[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            <div className="status-indicator online"></div>
                        </div>
                        <div className="member-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="member-name active-role" style={{ color: isOwner ? '#f1c40f' : isAdmin ? '#3498db' : '#2ecc71' }}>
                                {displayName}
                                {isOwner && (
                                    <span style={{ marginLeft: '4px' }} title="Portal Sahibi">👑</span>
                                )}
                                {!isOwner && isAdmin && (
                                    <span style={{ marginLeft: '4px' }} title="Yönetici">🛡️</span>
                                )}
                            </span>
                            <UserBadges user={user} size={13} />
                        </div>
                    </Link>
                );
            })}

            {/* Offline Category */}
            <div className="members-category">Çevrim dışı — {offline.length}</div>
            {offline.map((user, index) => {
                if (!user) return null;
                // Handle if user is just an ID (fallback if populate failed)
                if (typeof user === 'string') return null;

                const username = user.username || 'Unknown';
                const avatar = user.profile?.avatar || user.avatar;
                const displayName = user.profile?.displayName || username;
                const isOwner = user.role === 'owner';
                const isAdmin = user.role === 'admin' || user.isAdmin;

                return (
                    <Link to={`/profile/${username}`} key={user._id || user.id || `offline-${index}`} className="member-item offline member-link">
                        <div className="member-avatar-wrapper">
                            {avatar ? (
                                <img
                                    src={getImageUrl(avatar, 'thumbnail')}
                                    alt=""
                                    className="member-avatar"
                                    loading="eager"
                                    decoding="async"
                                />
                            ) : (
                                <div
                                    className="member-avatar-placeholder"
                                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                                >
                                    {displayName[0]?.toUpperCase() || username[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="member-info" style={{ flex: 1 }}>
                            <div className="member-name-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="member-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {displayName}
                                    {isOwner && (
                                        <span style={{ marginLeft: '4px' }} title="Portal Sahibi">👑</span>
                                    )}
                                    {!isOwner && isAdmin && (
                                        <span style={{ marginLeft: '4px' }} title="Yönetici">🛡️</span>
                                    )}
                                    <UserBadges user={user} size={13} />
                                </span>
                                {user.lastActive && (
                                    <span className="last-active-time" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {formatTimeAgo(user.lastActive)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default memo(MembersSidebar);
