import { useState } from 'react';
import { getImageUrl } from '../utils/imageUtils';

const InviteModal = ({ portal, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    // Mock Friends Data (replace with real data later)
    const friends = [
        { id: 1, username: 'eminipek00', avatar: null },
        { id: 2, username: 'sametkaraca0', avatar: null },
    ];

    const inviteLink = `gg/${portal?.name?.toLowerCase().replace(/\s+/g, '-')}-${portal?._id || '1090791189013336076'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="invite-modal-overlay">
            <div className="invite-modal-container">
                <div className="invite-header">
                    <h3>Arkadaşlarını {portal?.name || 'Sunucu'} sunucusuna davet et</h3>
                    <div className="invite-subtitle">
                        <span style={{ color: '#b9bbbe' }}>
                            Alıcılar:{' '}
                            <span style={{ color: '#5865F2' }}>
                                # 📢 motivasyon konumuna gelecek
                            </span>
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="invite-search">
                    <input
                        type="text"
                        placeholder="Arkadaşlarını ara"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                        className="search-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                <div className="invite-warning">
                    <span role="img" aria-label="warning">
                        ⚠️
                    </span>
                    Bu kanal özeldir. Sadece seçilen üyeler ve roller bu kanalı görüntüleyebilir.
                </div>

                <div className="invite-list custom-scrollbar">
                    {friends.map((friend) => (
                        <div key={friend.id} className="invite-item">
                            <div className="friend-info">
                                <div className="friend-avatar">
                                    {friend.avatar ? (
                                        <img src={getImageUrl(friend.avatar)} alt="" />
                                    ) : (
                                        friend.username[0].toUpperCase()
                                    )}
                                </div>
                                <span className="friend-name">{friend.username}</span>
                            </div>
                            <button className="invite-action-btn">Davet et</button>
                        </div>
                    ))}
                </div>

                <div className="invite-footer">
                    <h4>Veya bir arkadaşına sunucu daveti bağlantısı yolla</h4>
                    <div className="copy-link-box">
                        <input type="text" value={inviteLink} readOnly />
                        <button
                            onClick={handleCopy}
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                        >
                            {copied ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .invite-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .invite-modal-container {
                    width: 440px;
                    background-color: #313338;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 0 0 1px #202225, 0 8px 15px rgba(0,0,0,0.4);
                }
                .invite-header {
                    padding: 16px;
                    position: relative;
                }
                .invite-header h3 {
                    margin: 0 0 8px 0;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                }
                .invite-subtitle {
                    font-size: 12px;
                }
                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: transparent;
                    border: none;
                    color: #b9bbbe;
                    cursor: pointer;
                    font-size: 20px;
                }
                .invite-search {
                    padding: 0 16px;
                    margin-bottom: 12px;
                    position: relative;
                }
                .invite-search input {
                    width: 100%;
                    background-color: #1e1f22;
                    border: 1px solid #1e1f22;
                    padding: 8px 30px 8px 10px;
                    border-radius: 4px;
                    color: #dbdee1;
                    font-size: 14px;
                    outline: none;
                }
                .search-icon {
                    position: absolute;
                    right: 24px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #b9bbbe;
                }
                .invite-warning {
                    margin: 0 16px 12px;
                    padding: 8px;
                    background-color: transparent; /* Assuming image logic, visually checked */
                    color: #b9bbbe;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .invite-list {
                    flex: 1;
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 0 8px 8px 16px;
                }
                .invite-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 0;
                    border-top: 1px solid #3f4147;
                }
                .invite-item:first-child { border-top: none; }
                .friend-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .friend-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: #5865F2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                }
                .friend-name {
                    color: #dbdee1;
                    font-weight: 500;
                    font-size: 14px;
                }
                .invite-action-btn {
                    border: 1px solid #23a559;
                    color: #dbdee1;
                    background: transparent;
                    padding: 4px 16px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .invite-action-btn:hover {
                    background-color: #23a559;
                }
                .invite-footer {
                    background-color: #2b2d31;
                    padding: 16px;
                    margin-top: auto;
                }
                .invite-footer h4 {
                    color: #b9bbbe;
                    font-size: 12px;
                    margin: 0 0 8px 0;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .copy-link-box {
                    display: flex;
                    gap: 8px;
                    background-color: #1e1f22;
                    padding: 4px;
                    border-radius: 4px;
                }
                .copy-link-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #dbdee1;
                    padding: 6px;
                    font-size: 13px;
                    outline: none;
                }
                .copy-btn {
                    background-color: #5865F2;
                    color: white;
                    border: none;
                    padding: 6px 20px;
                    border-radius: 3px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .copy-btn.copied {
                    background-color: #23a559;
                }
            `}</style>
        </div>
    );
};

export default InviteModal;
