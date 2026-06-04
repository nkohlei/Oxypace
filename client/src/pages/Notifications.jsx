import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [handlingRequests, setHandlingRequests] = useState({}); // { [notifId]: 'accept' | 'decline' }
    const { socket } = useSocket();

    const handleAccept = async (e, senderId, notifId) => {
        e.preventDefault();
        e.stopPropagation();
        if (handlingRequests[notifId]) return;
        setHandlingRequests((prev) => ({ ...prev, [notifId]: 'accept' }));
        try {
            await axios.post(`/api/users/follow/accept/${senderId}`);

            // Immediately transform this notification to "friend_connected"
            setNotifications((prev) =>
                prev.map((n) => {
                    if (n._id === notifId) {
                        return { ...n, type: 'friend_connected' };
                    }
                    return n;
                })
            );
            const updatedRequests = currentUser.followRequests.filter((id) => id !== senderId);
            updateUser({
                ...currentUser,
                followRequests: updatedRequests,
            });
        } catch (error) {
            console.error('Accept error:', error);
        } finally {
            setHandlingRequests((prev) => {
                const copy = { ...prev };
                delete copy[notifId];
                return copy;
            });
        }
    };

    const handleDecline = async (e, senderId, notifId) => {
        e.preventDefault();
        e.stopPropagation();
        if (handlingRequests[notifId]) return;
        setHandlingRequests((prev) => ({ ...prev, [notifId]: 'decline' }));
        try {
            await axios.post(`/api/users/follow/decline/${senderId}`);

            setNotifications((prev) =>
                prev.map((n) => {
                    if (n._id === notifId) {
                        return { ...n, type: 'follow_request_handled' };
                    }
                    return n;
                })
            );

            const updatedRequests = currentUser.followRequests.filter((id) => id !== senderId);
            updateUser({ ...currentUser, followRequests: updatedRequests });
        } catch (error) {
            console.error('Decline error:', error);
        } finally {
            setHandlingRequests((prev) => {
                const copy = { ...prev };
                delete copy[notifId];
                return copy;
            });
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    };

    const handleDeleteAllNotifications = async () => {
        const confirmDelete = window.confirm("Tüm bildirimlerinizi kalıcı olarak silmek istediğinizden emin misiniz?");
        if (!confirmDelete) return;
        try {
            await axios.delete('/api/notifications');
            setNotifications([]);
        } catch (err) {
            console.error('Tüm bildirimleri silme hatası:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newNotification', (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });

        return () => {
            socket.off('newNotification');
        };
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data.notifications);

            if (response.data.notifications.some((n) => !n.read)) {
                handleMarkAllRead();
            }
        } catch (err) {
            console.error('Fetch notifications error:', err);
            setError('Bildirimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put('/api/notifications/read');
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (err) {
            console.error('Mark all read error:', err);
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now - notifDate;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes}d`;
        if (hours < 24) return `${hours}s`;
        if (days < 7) return `${days}g`;
        return notifDate.toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    const filteredNotifications = notifications.filter((notif) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'quotes') {
            return notif.type === 'comment' || notif.type === 'reply' || notif.type === 'quote';
        }
        if (activeFilter === 'friends') {
            return notif.type === 'follow' || notif.type === 'follow_request' || notif.type === 'friend_request' || notif.type === 'friend_connected' || notif.type === 'follow_request_handled';
        }
        if (activeFilter === 'system') {
            return notif.type === 'system' || notif.type === 'security';
        }
        return true;
    });

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="notifications-container">
                    <div className="notifications-header">
                        <div className="title-with-back">
                            <button 
                                className="back-btn-minimalist" 
                                onClick={() => navigate(-1)}
                                aria-label="Geri"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    width="20"
                                    height="20"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <h1>Bildirimler</h1>
                        </div>
                        <div className="notifications-header-actions">
                            {notifications.some((n) => !n.read) && (
                                <button className="mark-read-btn" onClick={handleMarkAllRead}>
                                    Tümünü Okundu İşaretle
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button className="clear-all-btn" onClick={handleDeleteAllNotifications}>
                                    Tümünü Temizle
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="notifications-filter-bar">
                        <button 
                            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            Hepsi
                        </button>
                        <button 
                            className={`filter-tab-btn ${activeFilter === 'quotes' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('quotes')}
                        >
                            Alıntılar
                        </button>
                        <button 
                            className={`filter-tab-btn ${activeFilter === 'friends' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('friends')}
                        >
                            Arkadaşlık
                        </button>
                        <button 
                            className={`filter-tab-btn ${activeFilter === 'system' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('system')}
                        >
                            Sistem
                        </button>
                    </div>

                    <div className="notifications-list">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notif) => {
                                // Guard clause: if no sender and not security/system type, skip rendering to prevent crash
                                if (!notif.sender && notif.type !== 'security' && notif.type !== 'system') return null;

                                return (
                                    <Link
                                        to={
                                            notif.type === 'security'
                                                ? '/settings'
                                                : notif.type === 'message'
                                                    ? `/inbox?user=${notif.sender?.username}`
                                                    : notif.post
                                                        ? `/post/${notif.post._id || notif.post}`
                                                        : notif.sender
                                                            ? `/profile/${notif.sender.username}`
                                                            : '#'
                                        }
                                        key={notif._id}
                                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                    >
                                        <div className="notif-avatar">
                                            {notif.sender?.profile?.avatar ? (
                                                <img
                                                    src={getImageUrl(notif.sender.profile.avatar)}
                                                    alt={notif.sender.username}
                                                />
                                            ) : (
                                                <div className="notif-avatar-placeholder">
                                                    {notif.sender?.username
                                                        ? notif.sender.username[0].toUpperCase()
                                                        : '?'}
                                                </div>
                                            )}
                                            <div className={`notif-icon-badge ${notif.type}`}>
                                                {notif.type === 'like' && '❤️'}
                                                {notif.type === 'comment' && '💬'}
                                                {notif.type === 'reply' && '↩️'}
                                                {notif.type === 'quote' && '💬'}
                                                {notif.type === 'follow' && '👤'}
                                                {(notif.type === 'follow_request' || notif.type === 'friend_request') && '👤'}
                                                {notif.type === 'message' && '✉️'}
                                                {notif.type === 'portal_invite' && '🏰'}
                                                {notif.type === 'system' && '📢'}
                                                {notif.type === 'security' && '🛡️'}
                                            </div>
                                        </div>

                                        <div className="notif-content">
                                            <div className="notif-text-row">
                                                <div className="notif-text-left">
                                                    <p className="notif-message-text">
                                                        {notif.type !== 'security' && notif.type !== 'system' && notif.sender && (
                                                            <span className="notif-user">
                                                                {notif.sender.username}
                                                            </span>
                                                        )}
                                                        {notif.type === 'like' && ' gönderini beğendi.'}
                                                        {notif.type === 'comment' && ' gönderine yorum yaptı: '}
                                                        {notif.type === 'reply' && ' yorumuna yanıt verdi: '}
                                                        {notif.type === 'quote' && ' gönderini alıntıladı.'}
                                                        {notif.type === 'follow' && ' seni takip etmeye başladı.'}
                                                        {(notif.type === 'follow_request' || notif.type === 'friend_request') && ' seninle tanışmak istiyor.'}
                                                        {notif.type === 'friend_connected' && ' ile artık arkadaşsınız! 🤝'}
                                                        {notif.type === 'follow_request_handled' && ' tanışma isteği reddedildi.'}
                                                        {notif.type === 'message' && ' sana bir mesaj gönderdi.'}
                                                        {notif.type === 'portal_invite' && ' seni bir portala davet etti.'}
                                                        {(notif.type === 'system' || notif.type === 'security') && (
                                                            <span>{notif.content}</span>
                                                        )}
                                                    </p>

                                                    {/* Follow Request Actions inline & compact */}
                                                    {(notif.type === 'follow_request' || notif.type === 'friend_request') && (
                                                        <div className="notif-actions">
                                                            <button
                                                                className="notif-btn-primary compact"
                                                                disabled={handlingRequests[notif._id]}
                                                                onClick={(e) =>
                                                                    handleAccept(
                                                                        e,
                                                                        notif.sender._id,
                                                                        notif._id
                                                                    )
                                                                }
                                                            >
                                                                {handlingRequests[notif._id] === 'accept' ? '...' : 'Onayla'}
                                                            </button>
                                                            <button
                                                                className="notif-btn-secondary compact"
                                                                disabled={handlingRequests[notif._id]}
                                                                onClick={(e) =>
                                                                    handleDecline(
                                                                        e,
                                                                        notif.sender._id,
                                                                        notif._id
                                                                    )
                                                                }
                                                            >
                                                                {handlingRequests[notif._id] === 'decline' ? '...' : 'Reddet'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="notif-time-new">
                                                    {formatDate(notif.createdAt)}
                                                </span>
                                            </div>

                                            {(notif.type === 'comment' || notif.type === 'reply') &&
                                                notif.comment && (
                                                    <p className="notif-text-preview">
                                                        "{notif.comment.content}"
                                                    </p>
                                                )}
                                            {notif.type === 'quote' && notif.post && (
                                                <p className="notif-text-preview">
                                                    "{notif.post.content}"
                                                </p>
                                            )}
                                        </div>

                                        {notif.post && notif.post.media && (
                                            <div className="notif-post-preview">
                                                {notif.post.mediaType === 'video' ? (
                                                    <video src={getImageUrl(notif.post.media)} loop muted autoPlay playsInline />
                                                ) : (
                                                    <img
                                                        src={getImageUrl(notif.post.media)}
                                                        alt="Post"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            className="delete-notif-btn"
                                            onClick={(e) => handleDelete(e, notif._id)}
                                            title="Bildirimi sil"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    {activeFilter === 'all' && '🔔'}
                                    {activeFilter === 'quotes' && '💬'}
                                    {activeFilter === 'friends' && '🤝'}
                                    {activeFilter === 'system' && '📢'}
                                </div>
                                <h3>
                                    {activeFilter === 'all' && 'Bildirim yok'}
                                    {activeFilter === 'quotes' && 'Alıntı yok'}
                                    {activeFilter === 'friends' && 'Arkadaşlık bildirimi yok'}
                                    {activeFilter === 'system' && 'Sistem bildirimi yok'}
                                </h3>
                                <p>
                                    {activeFilter === 'all' && 'Henüz yeni bir etkileşimin yok.'}
                                    {activeFilter === 'quotes' && 'Henüz bir alıntı bildiriminiz yok.'}
                                    {activeFilter === 'friends' && 'Henüz bir arkadaşlık bildiriminiz yok.'}
                                    {activeFilter === 'system' && 'Henüz bir sistem bildiriminiz yok.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Notifications;
