import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import './CommentDetail.css';

const CommentDetail = () => {
    const { commentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [comment, setComment] = useState(null);
    const [replies, setReplies] = useState([]);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComment();
        fetchReplies();
    }, [commentId]);

    const fetchComment = async () => {
        try {
            const response = await axios.get(`/api/comments/${commentId}`);
            setComment({
                ...response.data,
                isLiked: response.data.likes?.includes(user?._id) || false,
            });
        } catch (error) {
            console.error('Failed to fetch comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReplies = async () => {
        try {
            const response = await axios.get(`/api/comments/${commentId}/replies`);
            const repliesData = response.data.replies || response.data || [];
            setReplies(
                repliesData.map((r) => ({
                    ...r,
                    isLiked: r.likes?.includes(user?._id) || false,
                }))
            );
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!newReply.trim()) return;

        try {
            const response = await axios.post(`/api/comments/comment/${commentId}`, {
                content: newReply,
            });
            setReplies([...replies, { ...response.data, isLiked: false }]);
            setNewReply('');
            if (comment) {
                setComment({
                    ...comment,
                    replyCount: (comment.replyCount || 0) + 1,
                });
            }
        } catch (error) {
            console.error('Failed to post reply:', error);
        }
    };

    const handleLikeComment = async (targetId, isReply = false) => {
        try {
            const response = await axios.post(`/api/comments/${targetId}/like`);
            if (isReply) {
                setReplies(
                    replies.map((r) => {
                        if (r._id === targetId) {
                            return {
                                ...r,
                                isLiked: response.data.liked,
                                likeCount: response.data.likeCount,
                            };
                        }
                        return r;
                    })
                );
            } else {
                setComment({
                    ...comment,
                    isLiked: response.data.liked,
                    likeCount: response.data.likeCount,
                });
            }
        } catch (error) {
            console.error('Failed to like:', error);
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const commentDate = new Date(date);
        const diff = now - commentDate;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (seconds < 60) return `${seconds}s`;
        if (minutes < 60) return `${minutes}dk`;
        if (hours < 24) return `${hours}sa`;
        if (days < 7) return `${days}g`;
        return commentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const formatFullDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!comment) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <main className="app-content">
                    <div className="empty-state">
                        <p>Yorum bulunamadı</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="comment-detail-container">
                    {/* Back Button */}
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Yorum
                    </button>

                    {/* Original Post Link */}
                    {comment.post && (
                        <Link
                            to={`/post/${comment.post._id || comment.post}`}
                            className="original-post-link"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            Orijinal gönderiyi görüntüle
                        </Link>
                    )}

                    {/* Main Comment */}
                    <article className="comment-detail">
                        <header className="comment-detail-header">
                            <Link
                                to={`/profile/${comment.author?.username}`}
                                className="author-link"
                            >
                                {comment.author?.profile?.avatar ? (
                                    <img
                                        src={comment.author.profile.avatar}
                                        alt=""
                                        className="author-avatar"
                                    />
                                ) : (
                                    <div className="author-avatar-placeholder">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        >
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="author-info">
                                    <span className="author-name">
                                        {comment.author?.profile?.displayName ||
                                            comment.author?.username}
                                        <Badge type={comment.author?.verificationBadge} />
                                    </span>
                                    <span className="author-username">
                                        @{comment.author?.username}
                                    </span>
                                </div>
                            </Link>
                        </header>

                        <div className="comment-detail-text">
                            <p>{comment.content}</p>
                        </div>

                        <div className="comment-detail-meta">
                            <span className="comment-date">
                                {formatFullDate(comment.createdAt)}
                            </span>
                        </div>

                        <div className="comment-detail-stats">
                            <span>
                                <strong>{comment.replyCount || 0}</strong> yanıt
                            </span>
                            <span>
                                <strong>{comment.likeCount || 0}</strong> beğeni
                            </span>
                        </div>

                        <div className="comment-detail-actions">
                            <button className="action-btn">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </button>
                            <button
                                className={`action-btn ${comment.isLiked ? 'liked' : ''}`}
                                onClick={() => handleLikeComment(comment._id)}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill={comment.isLiked ? 'currentColor' : 'none'}
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </button>
                            <button className="action-btn">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    </article>

                    {/* Reply Form */}
                    <form onSubmit={handleReplySubmit} className="reply-form-container">
                        <div className="replying-to">
                            <span>Yanıtlanıyor:</span>
                            <span className="replying-username">@{comment.author?.username}</span>
                        </div>
                        <div className="reply-input-row">
                            {user?.profile?.avatar ? (
                                <img src={user.profile.avatar} alt="" className="reply-avatar" />
                            ) : (
                                <div className="reply-avatar-placeholder">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            )}
                            <input
                                type="text"
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                placeholder="Yanıtını yaz..."
                                className="reply-input"
                            />
                            <button
                                type="submit"
                                className="reply-submit-btn"
                                disabled={!newReply.trim()}
                            >
                                Gönder
                            </button>
                        </div>
                    </form>

                    {/* Replies */}
                    <div className="replies-section">
                        <h3>Yanıtlar</h3>
                        {replies.length > 0 ? (
                            <div className="replies-list">
                                {replies.map((reply) => (
                                    <div key={reply._id} className="reply-item">
                                        <Link
                                            to={`/profile/${reply.author?.username}`}
                                            className="reply-avatar-link"
                                        >
                                            {reply.author?.profile?.avatar ? (
                                                <img
                                                    src={reply.author.profile.avatar}
                                                    alt=""
                                                    className="reply-item-avatar"
                                                />
                                            ) : (
                                                <div className="reply-item-avatar-placeholder">
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                    >
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                            )}
                                        </Link>
                                        <div className="reply-body">
                                            <div className="reply-header">
                                                <Link
                                                    to={`/profile/${reply.author?.username}`}
                                                    className="reply-author-name"
                                                >
                                                    {reply.author?.profile?.displayName ||
                                                        reply.author?.username}
                                                    <Badge type={reply.author?.verificationBadge} />
                                                </Link>
                                                <span className="reply-author-username">
                                                    @{reply.author?.username}
                                                </span>
                                                <span className="reply-time">
                                                    · {formatDate(reply.createdAt)}
                                                </span>
                                            </div>
                                            <div className="reply-text">
                                                <p>{reply.content}</p>
                                            </div>
                                            <div className="reply-actions">
                                                <button
                                                    className={`reply-action-btn ${reply.isLiked ? 'liked' : ''}`}
                                                    onClick={() =>
                                                        handleLikeComment(reply._id, true)
                                                    }
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill={
                                                            reply.isLiked ? 'currentColor' : 'none'
                                                        }
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                    >
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                    </svg>
                                                    <span>{reply.likeCount || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-replies">Henüz yanıt yok</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CommentDetail;
