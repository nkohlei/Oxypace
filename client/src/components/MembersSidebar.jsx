
import { getImageUrl } from '../utils/imageUtils';

const MembersSidebar = ({ members = [] }) => {
    // Mock data for visual matching if members prop is empty or simple
    // In real app, grouped by status
    const onlineMembers = [
        { id: 'me', username: 'nkohlei', avatar: null, status: 'online', role: 'owner' },
    ];

    // Fallback to prop members if available, otherwise mock
    const allMembers = members.length > 0 ? members : [
        { id: 1, username: 'eminipek00', avatar: null, status: 'offline' },
        { id: 2, username: 'sametkaraca0', avatar: null, status: 'offline' }
    ];

    const online = onlineMembers;
    const offline = allMembers.filter(m => m.id !== 'me');

    return (
        <div className="members-sidebar custom-scrollbar">
            {/* Online Category */}
            <div className="members-category">Çevrim içi — {online.length}</div>
            {online.map(user => (
                <div key={user.id} className="member-item">
                    <div className="member-avatar-wrapper">
                        {user.avatar ?
                            <img src={getImageUrl(user.avatar)} alt="" className="member-avatar" /> :
                            <div className="member-avatar-placeholder">{user.username[0].toUpperCase()}</div>
                        }
                        <div className="status-indicator online"></div>
                    </div>
                    <div className="member-info">
                        <span className="member-name active-role" style={{ color: '#2ecc71' }}>
                            {user.username}
                            {user.role === 'owner' && <span style={{ marginLeft: '4px' }}>👑</span>}
                        </span>
                        {/* Status Message if any */}
                        <div className="member-custom-status">
                            <span role="img" aria-label="activity">🎮</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Offline Category */}
            <div className="members-category">Çevrim dışı — {offline.length}</div>
            {offline.map(user => (
                <div key={user.id} className="member-item offline">
                    <div className="member-avatar-wrapper">
                        {user.avatar ?
                            <img src={getImageUrl(user.avatar)} alt="" className="member-avatar" /> :
                            <div className="member-avatar-placeholder" style={{ backgroundColor: '#1e1f22' }}>{user.username[0].toUpperCase()}</div>
                        }
                    </div>
                    <div className="member-info">
                        <span className="member-name" style={{ color: '#23a559' }}>{user.username}</span>
                    </div>
                </div>
            ))}

            <style>{`
                .members-sidebar {
                    width: 240px;
                    background-color: #2b2d31;
                    height: 100%;
                    overflow-y: auto;
                    flex-shrink: 0;
                    padding: 24px 8px 8px 16px;
                }
                .members-category {
                    font-size: 12px;
                    font-weight: 700;
                    color: #949ba4;
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
                }
                .member-item:hover {
                    background-color: #35373c;
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
                    background-color: #5865F2;
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
                    border: 3px solid #2b2d31;
                }
                .status-indicator.online { background-color: #23a559; }

                .member-info {
                    display: flex;
                    flex-direction: column;
                }
                .member-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #dbdee1;
                }
                .member-custom-status {
                    font-size: 12px;
                    margin-top: 2px;
                }
            `}</style>
        </div>
    );
};

export default MembersSidebar;
