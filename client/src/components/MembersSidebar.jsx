import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const MembersSidebar = ({ members = [], onClose }) => {
    const { onlineUsers } = useSocket();
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
                                <img src={getImageUrl(avatar)} alt="" className="member-avatar" />
                            ) : (
                                <div className="member-avatar-placeholder">
                                    {displayName[0]?.toUpperCase() || username[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            <div className="status-indicator online"></div>
                        </div>
                        <div className="member-info">
                            <span className="member-name active-role" style={{ color: isOwner ? '#f1c40f' : isAdmin ? '#3498db' : '#2ecc71' }}>
                                {displayName}
                                {isOwner && (
                                    <span style={{ marginLeft: '4px' }} title="Portal Sahibi">👑</span>
                                )}
                                {!isOwner && isAdmin && (
                                    <span style={{ marginLeft: '4px' }} title="Yönetici">🛡️</span>
                                )}
                            </span>
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
                                <img src={getImageUrl(avatar)} alt="" className="member-avatar" />
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
                                <span className="member-name">
                                    {displayName}
                                    {isOwner && (
                                        <span style={{ marginLeft: '4px' }} title="Portal Sahibi">👑</span>
                                    )}
                                    {!isOwner && isAdmin && (
                                        <span style={{ marginLeft: '4px' }} title="Yönetici">🛡️</span>
                                    )}
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

            <style>{`
                .members-sidebar {
                    width: 240px;
                    background-color: var(--bg-secondary);
                    height: 100%;
                    overflow-y: auto;
                    flex-shrink: 0;
                    padding: 0 8px 8px 16px; /* Adjusted padding top */
                }
                
                .members-header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0 8px 0;
                    margin-bottom: 8px;
                }

                .members-header-top h3 {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin: 0;
                }

                .close-members-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .close-members-btn:hover {
                    color: var(--text-primary);
                    background-color: var(--bg-hover);
                }

                .members-category {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin: 24px 0 8px 0;
                }
                .members-category:first-child { margin-top: 0; }
                
                .member-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 6px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-bottom: 2px;
                    color: var(--text-secondary);
                    text-decoration: none;
                }
                .member-link {
                    text-decoration: none;
                    color: inherit;
                }
                .member-item:hover {
                    background-color: var(--bg-hover);
                    color: var(--text-primary);
                }
                .member-item.offline {
                    opacity: 0.7;
                }
                .member-item.offline:hover {
                    opacity: 1;
                }
                .member-avatar-wrapper {
                    position: relative;
                    width: 32px;
                    height: 32px;
                }
                .member-avatar, .member-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .member-avatar-placeholder {
                    background-color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 500;
                    font-size: 12px;
                }
                .status-indicator {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 3px solid var(--bg-secondary);
                }
                .status-indicator.online { background-color: #23a559; }

                .member-info {
                    display: flex;
                    flex-direction: column;
                }
                .member-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: inherit;
                }
                .active-role {
                    color: #2ecc71 !important; /* Keep role color specific */
                }
                .member-custom-status {
                    font-size: 12px;
                    margin-top: 2px;
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
};

export default MembersSidebar;
