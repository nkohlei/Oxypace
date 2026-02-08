import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';
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

    // New States
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null); // ID of comment with open menu
    const [commentToDelete, setCommentToDelete] = useState(null);

    const fileInputRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchComments();

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [postId]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/comments/post/${postId}`);
            const commentsData = response.data.comments || response.data || [];
            // Only show top-level comments (no parentComment)
            const topLevelComments = commentsData.filter((c) => !c.parentComment);
            setComments(
                topLevelComments.map((c) => ({
                    ...c,
                    isLiked: c.likes?.includes(user?._id) || false,
                }))
            );
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                // 5MB limit
                alert("Dosya boyutu 5MB'dan küçük olmalı.");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete) return;
        try {
            await axios.delete(`/api/comments/${commentToDelete}`);

            // Remove from top-level comments
            setComments((prev) => prev.filter((c) => c._id !== commentToDelete));

            // Remove from replies
            setExpandedComments((prev) => {
                const newState = { ...prev };
                for (const key in newState) {
                    newState[key] = newState[key].filter((r) => r._id !== commentToDelete);
                }
                return newState;
            });

            setCommentToDelete(null);
            setActiveMenuId(null);
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('Yorum silinemedi');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && !selectedFile) return;

        try {
            const formData = new FormData();
            formData.append('content', newComment);
            if (selectedFile) {
                formData.append('media', selectedFile);
            }

            let response;
            if (replyingTo) {
                // Reply
                response = await axios.post(`/api/comments/comment/${replyingTo.id}`, formData);

                const parentId = replyingTo.id;
                setExpandedComments((prev) => ({
                    ...prev,
                    [parentId]: [...(prev[parentId] || []), { ...response.data, isLiked: false }],
                }));

                setComments(
                    comments.map((c) =>
                        c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
                    )
                );

                setReplyingTo(null);
            } else {
                // Top-level comment
                response = await axios.post(`/api/comments/post/${postId}`, formData);
                setComments([{ ...response.data, isLiked: false }, ...comments]);
            }

            setNewComment('');
            clearFile();
        } catch (error) {
            console.error('Failed to post comment:', error);
            const errorMsg = error.response?.data?.message || 'Yorum gönderilemedi.';
            alert(errorMsg);
        }
    };

    const handleReplyClick = (comment) => {
        if (!user) {
            navigate('/login');
            return;
        }
        const authorName = comment.author?.username || 'silinmis-kullanici';
        setReplyingTo({ id: comment._id, username: authorName });
        setNewComment(`@${authorName} `);
        setActiveMenuId(null);
    };

    const handleDownload = async (mediaUrl, filename) => {
        try {
            const response = await fetch(getImageUrl(mediaUrl));
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setActiveMenuId(null);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const fetchReplies = async (commentId) => {
        if (expandedComments[commentId]) return;

        setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
        try {
            const response = await axios.get(`/api/comments/comment/${commentId}/replies`);
            setExpandedComments((prev) => ({
                ...prev,
                [commentId]: response.data.replies.map((r) => ({
                    ...r,
                    isLiked: r.likes?.includes(user?._id),
                })),
            }));
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        } finally {
            setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
        }
    };

    const toggleReplies = (commentId) => {
        if (expandedComments[commentId]) {
            const newExpanded = { ...expandedComments };
            delete newExpanded[commentId];
            setExpandedComments(newExpanded);
        } else {
            fetchReplies(commentId);
        }
    };

    const handleLikeComment = async (commentId, e) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.post(`/api/comments/${commentId}/like`);
            const updateComment = (list) =>
                list.map((c) =>
                    c._id === commentId
                        ? { ...c, isLiked: response.data.liked, likeCount: response.data.likeCount }
                        : c
                );

            setComments(updateComment(comments));
            setExpandedComments((prev) => {
                const newState = { ...prev };
                for (const key in newState) {
                    newState[key] = updateComment(newState[key]);
                }
                return newState;
            });
        } catch (error) {
            console.error('Failed to like comment:', error);
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

    const renderComment = (comment, isReply = false) => {
        const safeAuthor = comment.author || {
            _id: 'deleted',
            username: 'Silinmiş Kullanıcı',
            profile: { displayName: 'Silinmiş Kullanıcı', avatar: null },
        };

        return (
            <div key={comment._id} className={isReply ? 'reply-item' : 'comment-item'}>
                <Link
                    to={safeAuthor._id !== 'deleted' ? `/profile/${safeAuthor.username}` : '#'}
                    className={isReply ? 'reply-avatar-link' : 'comment-avatar-link'}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (safeAuthor._id === 'deleted') e.preventDefault();
                    }}
                    style={safeAuthor._id === 'deleted' ? { cursor: 'default' } : {}}
                >
                    {safeAuthor.profile?.avatar ? (
                        <img
                            src={getImageUrl(safeAuthor.profile.avatar)}
                            alt={safeAuthor.username}
                            className={isReply ? 'reply-avatar' : 'comment-avatar'}
                        />
                    ) : (
                        <div
                            className={
                                isReply ? 'reply-avatar-placeholder' : 'comment-avatar-placeholder'
                            }
                        >
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

                <div className={isReply ? 'reply-content' : 'comment-body'}>
                    <div className="comment-header">
                        <Link
                            to={
                                safeAuthor._id !== 'deleted'
                                    ? `/profile/${safeAuthor.username}`
                                    : '#'
                            }
                            className="comment-author-name"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (safeAuthor._id === 'deleted') e.preventDefault();
                            }}
                            style={safeAuthor._id === 'deleted' ? { cursor: 'default' } : {}}
                        >
                            {safeAuthor.profile?.displayName || safeAuthor.username}
                            <Badge type={safeAuthor.verificationBadge} />
                        </Link>
                        <span className="comment-author-username">@{safeAuthor.username}</span>
                        <span className="comment-time">· {formatDate(comment.createdAt)}</span>

                        {/* Three-Dot Menu - Only shown on hover via CSS + State */}
                        <div
                            className="comment-menu-container"
                            ref={activeMenuId === comment._id ? menuRef : null}
                        >
                            <button
                                className="comment-menu-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(
                                        activeMenuId === comment._id ? null : comment._id
                                    );
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    width="16"
                                    height="16"
                                >
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                </svg>
                            </button>
                            {activeMenuId === comment._id && (
                                <div className="comment-dropdown">
                                    {user?._id === (comment.author?._id || comment.author) && (
                                        <button
                                            className="comment-dropdown-item delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCommentToDelete(comment._id);
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                            Sil
                                        </button>
                                    )}
                                    {comment.media && (
                                        <button
                                            className="comment-dropdown-item"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(
                                                    comment.media,
                                                    `media-${comment._id}`
                                                );
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            İndir
                                        </button>
                                    )}
                                    <button
                                        className="comment-dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null);
                                        }}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                        Kapat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="comment-text">
                        <p>{comment.content}</p>
                    </div>

                    {comment.media && (
                        <div className="comment-media-display">
                            {comment.mediaType === 'video' ? (
                                <video
                                    src={getImageUrl(comment.media)}
                                    className="comment-media-img"
                                    controls
                                />
                            ) : (
                                <img
                                    src={getImageUrl(comment.media)}
                                    alt="Comment media"
                                    className="comment-media-img"
                                />
                            )}
                        </div>
                    )}

                    <div className="comment-actions">
                        {!isReply && (
                            <button
                                className="comment-action-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReplies(comment._id);
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                                <span>{comment.replyCount || 0} Yanıt</span>
                            </button>
                        )}
                        <button
                            className={`comment-action-btn ${comment.isLiked ? 'liked' : ''}`}
                            onClick={(e) => handleLikeComment(comment._id, e)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill={comment.isLiked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{comment.likeCount || 0}</span>
                        </button>
                        <button
                            className="comment-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReplyClick(comment);
                            }}
                        >
                            Yanıtla
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="comment-section">
            {user ? (
                <form onSubmit={handleSubmit} className="comment-form">
                    {user.profile?.avatar ? (
                        <img
                            src={getImageUrl(user.profile.avatar)}
                            alt={user.username}
                            className="comment-avatar-small"
                        />
                    ) : (
                        <div className="comment-avatar-placeholder-small">
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

                    <div className="comment-input-wrapper">
                        {replyingTo && (
                            <div className="replying-badge">
                                <span>Yanıtlanıyor: @{replyingTo.username}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setNewComment('');
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {previewUrl && (
                                <div className="comment-media-preview-container">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="comment-media-preview"
                                    />
                                    <button
                                        type="button"
                                        className="remove-media-btn"
                                        onClick={clearFile}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <div className="comment-input-container">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyingTo ? `Yanıt yaz...` : 'Yorum ekle...'}
                                    className="comment-input"
                                />
                                {/* Image Upload Button (Inside Input Box) */}
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                                <button
                                    type="button"
                                    className="file-input-btn"
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        color: 'var(--primary-cyan)',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        width="20"
                                        height="20"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="comment-submit-btn"
                            disabled={!newComment.trim() && !selectedFile}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </div>
                </form>
            ) : (
                <div
                    className="login-prompt-banner"
                    onClick={() => navigate('/login')}
                    style={{
                        cursor: 'pointer',
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        marginBottom: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Yorum yapmak için{' '}
                        <span style={{ color: 'var(--primary-cyan)', fontWeight: '600' }}>
                            giriş yap
                        </span>
                    </p>
                </div>
            )}

            <div className="comments-list">
                {loading ? (
                    <div className="comments-loading">Yükleniyor...</div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment._id} style={{ display: 'flex', flexDirection: 'column' }}>
                            {renderComment(comment)}
                            {/* Replies */}
                            {expandedComments[comment._id] && (
                                <div className="nested-replies">
                                    {expandedComments[comment._id].map((reply) =>
                                        renderComment(reply, true)
                                    )}
                                </div>
                            )}
                            {loadingReplies[comment._id] && (
                                <div className="replies-loading">Yanıtlar yükleniyor...</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="comments-empty">Henüz yorum yok. İlk yorumu sen yap!</div>
                )}
            </div>

            {/* Delete Confirmation Overlay */}
            {commentToDelete && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-modal">
                        <p>Bu yorumu silmek istiyor musunuz?</p>
                        <div className="delete-confirm-actions">
                            <button className="confirm-btn" onClick={handleDeleteComment}>
                                Evet
                            </button>
                            <button className="cancel-btn" onClick={() => setCommentToDelete(null)}>
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
