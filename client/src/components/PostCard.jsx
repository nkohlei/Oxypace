import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import './PostCard.css';

const PostCard = ({ post, onDelete, onUnsave }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(post.likes?.includes(user?._id) || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [saved, setSaved] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnyway, setShowAnyway] = useState(false);

    // Safe check for author existence (Process orphaned posts)
    const author = post.author || {
        _id: 'deleted',
        username: 'Silinmiş Kullanıcı',
        profile: { displayName: 'Silinmiş Kullanıcı', avatar: null }
    };

    const isOwnPost = user?._id === author._id;

    useEffect(() => {
        const checkSaved = async () => {
            try {
                const response = await axios.get('/api/users/me');
                if (response.data.savedPosts?.includes(post._id)) {
                    setSaved(true);
                }
            } catch (error) {
                console.error('Check saved error:', error);
            }
        };
        checkSaved();
    }, [post._id]);

    const formatDate = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diff = now - postDate;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Şimdi';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return postDate.toLocaleDateString('tr-TR');
    };

    const handleLike = async () => {
        try {
            const response = await axios.post(`/api/likes/post/${post._id}`);
            setLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        try {
            const response = await axios.post(`/api/users/me/save/${post._id}`);
            setSaved(response.data.saved);
            if (!response.data.saved && onUnsave) {
                onUnsave();
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
        setShowMenu(false);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/posts/${post._id}`);
            setShowDeleteConfirm(false);
            if (onDelete) {
                onDelete(post._id);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/post/${post._id}`;
        if (navigator.share) {
            navigator.share({
                title: 'Deepace',
                text: post.content,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Link kopyalandı!');
        }
    };

    const formatLikeCount = (count) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toLocaleString('tr-TR');
    };

    const handleCardClick = (e) => {
        const selection = window.getSelection();
        if (selection.toString().length > 0) return;
        navigate(`/post/${post._id}`);
    };

    const handleProfileClick = (e) => {
        e.stopPropagation();
    };

    if (hidden && !showAnyway) {
        return (
            <div className="post-card foggy-hidden">
                <div className="foggy-content">
                    {/* Foggy Content */}
                    <p>Gizlendi</p>
                    <button onClick={() => setShowAnyway(true)}>Göster</button>
                </div>
            </div>
        );
    }

    return (
        <article className="post-card twitter-layout" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            {/* Left Column: Avatar */}
            <div className="post-left">
                <Link
                    to={`/profile/${post.author.username}`}
                    className="avatar-link"
                    onClick={handleProfileClick}
                >
                    {post.author.profile?.avatar ? (
                        <img
                            src={post.author.profile.avatar}
                            alt={post.author.username}
                            className="author-avatar"
                        />
                    ) : (
                        <div className="author-placeholder">
                            {post.author.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>
            </div>

            {/* Right Column: Content */}
            <div className="post-right">
                {/* Header: Name, Username, Time, Menu */}
                <div className="post-header-row">
                    <Link
                        to={`/profile/${post.author.username}`}
                        className="header-info-link"
                        onClick={handleProfileClick}
                    >
                        <span className="author-name">
                            {post.author.profile?.displayName || post.author.username}
                        </span>
                        <span className="author-username">@{post.author.username}</span>
                        <span className="post-time">· {formatDate(post.createdAt)}</span>
                    </Link>

                    <div className="post-menu-container">
                        <button
                            className="post-menu-btn"
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="post-dropdown-menu">
                                {isOwnPost && (
                                    <button
                                        className="menu-item delete"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Sil
                                    </button>
                                )}
                                <button className="menu-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                        <line x1="4" y1="22" x2="4" y2="15" />
                                    </svg>
                                    Bildir
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Text Content */}
                <div className="post-content-text">
                    <p>{post.content}</p>
                </div>

                {/* Media */}
                {post.media && (
                    <div className="post-media" onClick={(e) => e.stopPropagation()}>
                        {post.mediaType === 'video' ? (
                            <video controls><source src={post.media} /></video>
                        ) : (
                            <img src={post.media} alt="Post media" loading="lazy" />
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="post-actions">
                    <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span className="action-count">{post.commentCount || 0}</span>
                    </button>
                    <button
                        className={`action-btn ${liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    >
                        <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span className="action-count">{formatLikeCount(likeCount)}</span>
                    </button>
                    <div className="actions-right">
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                        <button className={`action-btn ${saved ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                            <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Comments */}
                {showComments && (
                    <div className="post-comments-wrapper" onClick={(e) => e.stopPropagation()}>
                        <CommentSection postId={post._id} />
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteConfirm && (
                <div className="delete-confirm-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="delete-confirm-modal">
                        <h3>Gönderin Silinecek!</h3>
                        <p>Emin misin?</p>
                        <div className="confirm-buttons">
                            <button className="confirm-btn btn-cancel" onClick={() => setShowDeleteConfirm(false)}>İptal</button>
                            <button className="confirm-btn btn-delete" onClick={handleDelete}>Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default PostCard;
