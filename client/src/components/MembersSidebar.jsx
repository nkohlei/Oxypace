import { useState, useEffect, useMemo, memo } from 'react';
import { useOnlineUsers } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import './MembersSidebar.css';

const formatTimeAgo = (date) => {
    if (!date) return '';
    const pastTime = new Date(date).getTime();
    if (Number.isNaN(pastTime)) return '';
    const diffMs = Math.max(0, Date.now() - pastTime);

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

const getLastActiveMs = (m) => {
    if (!m?.lastActive) return 0;
    const t = new Date(m.lastActive).getTime();
    return Number.isNaN(t) ? 0 : t;
};

const MembersSidebar = ({ members = [], onClose }) => {
    const onlineUsers = useOnlineUsers();
    const { user: currentUser } = useAuth();
    const [, setTick] = useState(0);

    // 60 saniyelik periyodik tetikleyici ile son aktiflik sürelerini canlı tut
    useEffect(() => {
        const timer = setInterval(() => {
            setTick((t) => t + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const sortedMembers = useMemo(() => {
        const onlineSet = new Set((onlineUsers || []).map((id) => String(id)));
        const currentUserId = currentUser?._id ? String(currentUser._id) : null;
        const showMyOnline = currentUser?.settings?.privacy?.showOnlineStatus !== false;
        if (currentUserId && showMyOnline) {
            onlineSet.add(currentUserId);
        } else if (currentUserId && !showMyOnline) {
            onlineSet.delete(currentUserId);
        }

        const valid = (members || []).filter((m) => m && typeof m === 'object' && extractId(m));

        return valid
            .map((m) => {
                const id = extractId(m);
                const isOnline = Boolean(id && onlineSet.has(id));
                return { member: m, id, isOnline, lastActiveMs: getLastActiveMs(m) };
            })
            .sort((a, b) => {
                // 1. Active (online) users always on top
                if (a.isOnline !== b.isOnline) {
                    return a.isOnline ? -1 : 1;
                }
                // 2. Sort by most recent activity descending
                if (b.lastActiveMs !== a.lastActiveMs) {
                    return b.lastActiveMs - a.lastActiveMs;
                }
                // 3. Fallback alphabetical
                const nameA = a.member.profile?.displayName || a.member.username || '';
                const nameB = b.member.profile?.displayName || b.member.username || '';
                return nameA.localeCompare(nameB, 'tr');
            });
    }, [members, onlineUsers, currentUser?._id, currentUser?.settings?.privacy?.showOnlineStatus]);

    return (
        <aside className="members-sidebar custom-scrollbar" aria-label="Üyeler">
            <div className="members-header-top">
                <div className="members-header-title">
                    <h3>Üyeler</h3>
                    <span className="members-total-count">{sortedMembers.length}</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="close-members-btn" aria-label="Kapat" type="button">
                        <X size={18} strokeWidth={2} />
                    </button>
                )}
            </div>

            <div className="members-list">
                {sortedMembers.map(({ member, id, isOnline }, index) => {
                    const username = member.username || 'Unknown';
                    const avatar = member.profile?.lowResAvatar || member.profile?.avatar || member.avatar;
                    const displayName = member.profile?.displayName || username;
                    const lastActiveLabel = !isOnline && member.lastActive ? formatTimeAgo(member.lastActive) : '';

                    return (
                        <Link
                            to={`/profile/${username}`}
                            key={id || index}
                            className={`member-item member-link ${isOnline ? 'is-online' : 'is-offline'}`}
                        >
                            <div className={`member-avatar-wrapper ${isOnline ? 'is-online' : ''}`}>
                                {avatar ? (
                                    <img
                                        src={getImageUrl(avatar, 'thumbnail')}
                                        alt=""
                                        className="member-avatar"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            const orig = getImageUrl(member.profile?.avatar || member.avatar, 'original');
                                            if (orig && e.target.src !== orig) e.target.src = orig;
                                        }}
                                    />
                                ) : (
                                    <div className="member-avatar-placeholder">
                                        {displayName[0]?.toUpperCase() || username[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>

                            <div className="member-info">
                                <span className={`member-name ${isOnline ? 'is-online' : ''}`}>
                                    {displayName}
                                </span>
                                {lastActiveLabel && (
                                    <span className="member-last-active">{lastActiveLabel}</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
};

export default memo(MembersSidebar);
