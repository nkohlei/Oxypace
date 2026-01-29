import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import './Notifications.css';

const Notifications = () => {
    const { user: currentUser, updateUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { socket } = useSocket();


    const handleAccept = async (e, senderId, notifId) => {
        e.preventDefault();
        try {
            await axios.post(`/api/users/follow/accept/${senderId}`);

            // Immediately transform this notification to "Friend Connected"
            setNotifications(prev => prev.map(n => {
                if (n._id === notifId) {
                    return { ...n, type: 'friend_connected' };
                }
                return n;
            }));
            // ... rest of logic ...
            const updatedRequests = currentUser.followRequests.filter(id => id !== senderId);
            updateUser({
                ...currentUser,
                followRequests: updatedRequests,
                followerCount: (currentUser.followerCount || 0) + 1
            });

        } catch (error) {
            console.error('Accept error:', error);
        }
    };

    const handleDecline = async (e, senderId, notifId) => {
        e.preventDefault();
        try {
            await axios.post(`/api/users/follow/decline/${senderId}`);

            setNotifications(prev => prev.map(n => {
                if (n._id === notifId) {
                    return { ...n, type: 'follow_request_handled' };
                }
                return n;
            }));

            const updatedRequests = currentUser.followRequests.filter(id => id !== senderId);
            updateUser({ ...currentUser, followRequests: updatedRequests });
        } catch (error) {
            console.error('Decline error:', error);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation(); // Stop propagation
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('newNotification', (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
        });

        return () => {
            socket.off('newNotification');
        };
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data.notifications);

            // Auto mark as read when page loads (User is viewing)
            if (response.data.notifications.some(n => !n.read)) {
                // We call the API to mark read, and client state updates via handleMarkAllRead or we can just do it silently here?
                // handleMarkAllRead updates state too.
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
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="notifications-container">
                    <div className="notifications-header">
                        <h1>Bildirimler</h1>
                        {notifications.some(n => !n.read) && (
                            <button className="mark-read-btn" onClick={handleMarkAllRead}>
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(notif => {
                                // Guard clause: if no sender, skip rendering to prevent crash
                                if (!notif.sender) return null;

                                return (
                                    <Link
                                        to={notif.type === 'message' ? `/inbox?user=${notif.sender.username}` : (notif.post ? `/post/${notif.post._id}` : `/profile/${notif.sender.username}`)}
                                        key={notif._id}
                                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                    >
                                        <div className="notif-avatar">
                                            {notif.sender.profile?.avatar ? (
                                                <img src={getImageUrl(notif.sender.profile.avatar)} alt={notif.sender.username} />
                                            ) : (
                                                <div className="notif-avatar-placeholder">
                                                    {notif.sender.username ? notif.sender.username[0].toUpperCase() : '?'}
                                                </div>
                                            )}
                                            <div className={`notif-icon-badge ${notif.type}`}>
                                                {notif.type === 'like' && '❤️'}
                                                {notif.type === 'comment' && '💬'}
                                                {notif.type === 'reply' && '↩️'}
                                                {notif.type === 'follow' && '👤'}
                                                {notif.type === 'follow_request' && '👤'}
                                                {notif.type === 'message' && '✉️'}
                                                {notif.type === 'portal_invite' && '🏰'}
                                            </div>
                                        </div>

                                        <div className="notif-content">
                                            <p>
                                                <span className="notif-user">{notif.sender.username}</span>
                                                {notif.type === 'like' && ' gönderini beğendi.'}
                                                {notif.type === 'comment' && ' gönderine yorum yaptı: '}
                                                {notif.type === 'reply' && ' yorumuna yanıt verdi: '}
                                                {notif.type === 'follow' && ' seni takip etmeye başladı.'}
                                                {notif.type === 'follow_request' && ' seninle tanışmak istiyor.'}
                                                {notif.type === 'friend_connected' && ' ile artık arkadaşsınız! 🤝'}
                                                {notif.type === 'message' && ' sana bir mesaj gönderdi.'}
                                                {notif.type === 'portal_invite' && ' seni bir portala davet etti.'}
                                            </p>
                                            {(notif.type === 'comment' || notif.type === 'reply') && notif.comment && (
                                                <p className="notif-text-preview">"{notif.comment.content}"</p>
                                            )}

                                            {/* Follow Request Actions - Trust the notification type, but hide if we know it's handled */}
                                            {notif.type === 'follow_request' && (
                                                <div className="notif-actions">
                                                    <button className="notif-btn-primary" onClick={(e) => handleAccept(e, notif.sender._id, notif._id)}>Onayla</button>
                                                    <button className="notif-btn-secondary" onClick={(e) => handleDecline(e, notif.sender._id, notif._id)}>Reddet</button>
                                                </div>
                                            )}

                                            <span className="notif-time">{formatDate(notif.createdAt)}</span>
                                        </div>

                                        {notif.post && notif.post.media && (
                                            <div className="notif-post-preview">
                                                {notif.post.mediaType === 'video' ? (
                                                    <video src={getImageUrl(notif.post.media)} />
                                                ) : (
                                                    <img src={getImageUrl(notif.post.media)} alt="Post" />
                                                )}
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            className="delete-notif-btn"
                                            onClick={(e) => handleDelete(e, notif._id)}
                                            title="Bildirimi sil"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </Link>
                                )
                            })
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🔔</div>
                                <h3>Bildirim yok</h3>
                                <p>Henüz yeni bir etkileşimin yok.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Notifications;
