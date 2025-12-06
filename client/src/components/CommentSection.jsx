import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import './CommentSection.css';

const CommentSection = ({ postId }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // { id: commentId, username: string }
    const [expandedComments, setExpandedComments] = useState({}); // { commentId: [replies] }
    const [loadingReplies, setLoadingReplies] = useState({}); // { commentId: boolean }

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/comments/post/${postId}`);
            const commentsData = response.data.comments || response.data || [];
            // Only show top-level comments (no parentComment)
            const topLevelComments = commentsData.filter(c => !c.parentComment);
            setComments(topLevelComments.map(c => ({
                ...c,
                isLiked: c.likes?.includes(user?._id) || false
            })));
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            if (replyingTo) {
                // Handle Reply
                const response = await axios.post(`/api/comments/comment/${replyingTo.id}`, {
                    content: newComment
                });

                // Update local state to show new reply immediately
                const parentId = replyingTo.id;
                setExpandedComments(prev => ({
                    ...prev,
                    [parentId]: [...(prev[parentId] || []), { ...response.data, isLiked: false }]
                }));

                // Update parent comment reply count
                setComments(comments.map(c =>
                    c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
                ));

                setReplyingTo(null);
            } else {
                // Top-level comment
                const response = await axios.post(`/api/comments/post/${postId}`, {
                    content: newComment
                });
                setComments([{ ...response.data, isLiked: false }, ...comments]);
            }
            setNewComment('');
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };

    const handleReplyClick = (comment) => {
        setReplyingTo({ id: comment._id, username: comment.author.username });
        setNewComment(`@${comment.author.username} `);
        // Focus input (optional, requires ref)
    };

    const fetchReplies = async (commentId) => {
        if (expandedComments[commentId]) {
            // Already loaded, just toggle visibility? (Logic could be added here)
            return;
        }

        setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
        try {
            const response = await axios.get(`/api/comments/comment/${commentId}/replies`);
            setExpandedComments(prev => ({
                ...prev,
                [commentId]: response.data.replies.map(r => ({ ...r, isLiked: r.likes?.includes(user?._id) }))
            }));
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        } finally {
            setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const toggleReplies = (commentId) => {
        if (expandedComments[commentId]) {
            // Collapse
            const newExpanded = { ...expandedComments };
            delete newExpanded[commentId];
            setExpandedComments(newExpanded);
        } else {
            // Expand (Fetch)
            fetchReplies(commentId);
        }
    };

    const handleLikeComment = async (commentId, e) => {
        e.stopPropagation();
        try {
            const response = await axios.post(`/api/comments/${commentId}/like`);
            setComments(comments.map(c => {
                if (c._id === commentId) {
                    return {
                        ...c,
                        isLiked: response.data.liked,
                        likeCount: response.data.likeCount
                    };
                }
                return c;
            }));
        } catch (error) {
            console.error('Failed to like comment:', error);
        }
    };

    const handleShareComment = (commentId, e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/comment/${commentId}`;
        if (navigator.share) {
            navigator.share({ title: 'Yorum', url });
        } else {
            navigator.clipboard.writeText(url);
            alert('Link kopyalandı!');
        }
    };

    const navigateToComment = (commentId) => {
        navigate(`/comment/${commentId}`);
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

    return (
        <div className="comment-section">
            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="comment-form">
                {user?.profile?.avatar ? (
                    <img src={getImageUrl(user.profile.avatar)} alt={user.username} className="comment-avatar-small" />
                ) : (
                    <div className="comment-avatar-placeholder-small">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                )}

                <div className="comment-input-wrapper">
                    {replyingTo && (
                        <div className="replying-badge">
                            <span>Yanıtlanıyor: @{replyingTo.username}</span>
                            <button type="button" onClick={() => { setReplyingTo(null); setNewComment(''); }}>×</button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyingTo ? `Yanıt yaz...` : "Yorum ekle..."}
                        className="comment-input"
                    />
                    <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="comments-list">
                {loading ? (
                    <div className="comments-loading">Yükleniyor...</div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div
                            key={comment._id}
                            className="comment-item"
                            onClick={() => navigateToComment(comment._id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <Link
                                to={`/profile/${comment.author?.username}`}
                                className="comment-avatar-link"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {comment.author?.profile?.avatar ? (
                                    <img src={getImageUrl(comment.author.profile.avatar)} alt={comment.author.username} className="comment-avatar" />
                                ) : (
                                    <div className="comment-avatar-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                            </Link>

                            <div className="comment-body">
                                {/* Header: Name, Username, Time */}
                                <div className="comment-header">
                                    <Link
                                        to={`/profile/${comment.author?.username}`}
                                        className="comment-author-name"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {comment.author?.profile?.displayName || comment.author?.username}
                                    </Link>
                                    <span className="comment-author-username">@{comment.author?.username}</span>
                                    <span className="comment-time">· {formatDate(comment.createdAt)}</span>
                                </div>

                                {/* Comment Text */}
                                <div className="comment-text">
                                    <p>{comment.content}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="comment-actions">
                                    <button
                                        className="comment-action-btn"
                                        onClick={(e) => { e.stopPropagation(); toggleReplies(comment._id); }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                        </svg>
                                        <span>{comment.replyCount || 0} Yanıt</span>
                                    </button>
                                    <button
                                        className={`comment-action-btn ${comment.isLiked ? 'liked' : ''}`}
                                        onClick={(e) => handleLikeComment(comment._id, e)}
                                    >
                                        <svg viewBox="0 0 24 24" fill={comment.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        <span>{comment.likeCount || 0}</span>
                                    </button>
                                    <button
                                        className="comment-action-btn"
                                        onClick={(e) => { e.stopPropagation(); handleReplyClick(comment); }}
                                    >
                                        Yanıtla
                                    </button>
                                </div>

                                {/* Nested Replies */}
                                {expandedComments[comment._id] && (
                                    <div className="nested-replies">
                                        {expandedComments[comment._id].map(reply => (
                                            <div key={reply._id} className="reply-item">
                                                <Link to={`/profile/${reply.author?.username}`} className="reply-avatar-link">
                                                    {reply.author?.profile?.avatar ? (
                                                        <img src={getImageUrl(reply.author.profile.avatar)} alt={reply.author.username} className="reply-avatar" />
                                                    ) : (
                                                        <div className="reply-avatar-placeholder">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                                <circle cx="12" cy="7" r="4" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </Link>
                                                <div className="reply-content">
                                                    <div className="comment-header">
                                                        <span className="comment-author-name">
                                                            {reply.author?.profile?.displayName || reply.author?.username}
                                                        </span>
                                                        <span className="comment-author-username">@{reply.author?.username}</span>
                                                        <span className="comment-time">· {formatDate(reply.createdAt)}</span>
                                                    </div>
                                                    <p className="reply-text">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {loadingReplies[comment._id] && <div className="replies-loading">Yanıtlar yükleniyor...</div>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="comments-empty">Henüz yorum yok. İlk yorumu sen yap!</div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
