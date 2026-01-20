import { useState, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import './InviteUserModal.css';

const InviteUserModal = ({ portalId, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState(new Set());

    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.trim().length === 0) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await axios.get(`/api/users/search?q=${searchQuery}`);
                setResults(res.data);
            } catch (err) {
                console.error('Search error', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleInvite = async (userId) => {
        try {
            // Send both notification and message for best visibility
            await Promise.all([
                axios.post(`/api/portals/${portalId}/invite`, { userId }),
                axios.post('/api/messages', {
                    recipientId: userId,
                    portalId: portalId,
                    content: 'Seni bir portala davet ettim!'
                })
            ]);
            setInvitedUsers(prev => new Set(prev).add(userId));
        } catch (err) {
            console.error('Invite failed:', err.response?.data);
            alert(err.response?.data?.message || 'İşlem sırasında bir hata oluştu.');
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/portal/${portalId}`;
        navigator.clipboard.writeText(url);
        alert('Davet bağlantısı kopyalandı!');
    };

    return (
        <div className="invite-modal-overlay" onClick={onClose}>
            <div className="invite-modal" onClick={e => e.stopPropagation()}>
                <div className="invite-header">
                    <h2>Kullanıcı Davet Et</h2>
                    <div className="header-actions">
                        <button className="copy-link-btn" title="Bağlantıyı Kopyala" onClick={handleCopyLink}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Bağlantı</span>
                        </button>
                        <button className="close-btn" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <div className="invite-search-container">
                    <input
                        type="text"
                        className="invite-search-input"
                        placeholder="Kullanıcı adı ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="invite-results custom-scrollbar">
                    {loading && <div className="loading-text">Aranıyor...</div>}
                    {!loading && results.length === 0 && searchQuery && (
                        <div className="no-play-text">Sonuç bulunamadı.</div>
                    )}

                    {results.map(user => {
                        const userId = user._id || user;
                        const isInvited = invitedUsers.has(userId);

                        return (
                            <div key={userId} className="invite-user-row">
                                <div className="user-info">
                                    <img src={getImageUrl(user.profile?.avatar)} alt="" className="user-avatar" />
                                    <span className="user-name">{user.username}</span>
                                </div>
                                <button
                                    className={`invite-btn ${isInvited ? 'invited' : ''}`}
                                    onClick={() => !isInvited && handleInvite(userId)}
                                    disabled={isInvited}
                                >
                                    {isInvited ? 'Gönderildi' : 'Davet Et'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default InviteUserModal;
