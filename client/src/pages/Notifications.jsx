import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useSocket } from '../context/SocketContext';
import { getImageUrl } from '../utils/imageUtils';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { socket } = useSocket();

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
                            notifications.map(notif => (
                                <Link
                                    to={notif.post ? `/post/${notif.post._id}` : `/profile/${notif.sender.username}`}
                                    key={notif._id}
                                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                >
                                    <div className="notif-avatar">
                                        {notif.sender.profile?.avatar ? (
                                            <img src={getImageUrl(notif.sender.profile.avatar)} alt={notif.sender.username} />
                                        ) : (
                                            <div className="notif-avatar-placeholder">
                                                {notif.sender.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`notif-icon-badge ${notif.type}`}>
                                            {notif.type === 'like' && '❤️'}
                                            {notif.type === 'comment' && '💬'}
                                            {notif.type === 'reply' && '↩️'}
                                            {notif.type === 'follow' && '👤'}
                                        </div>
                                    </div>

                                    <div className="notif-content">
                                        <p>
                                            <span className="notif-user">{notif.sender.username}</span>
                                            {notif.type === 'like' && ' gönderini beğendi.'}
                                            {notif.type === 'comment' && ' gönderine yorum yaptı: '}
                                            {notif.type === 'reply' && ' yorumuna yanıt verdi: '}
                                            {notif.type === 'follow' && ' seni takip etmeye başladı.'}
                                        </p>
                                        {(notif.type === 'comment' || notif.type === 'reply') && notif.comment && (
                                            <p className="notif-text-preview">"{notif.comment.content}"</p>
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
                                </Link>
                            ))
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
