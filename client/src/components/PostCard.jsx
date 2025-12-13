import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import Badge from './Badge';
import './PostCard.css';

const PostCard = ({ post, onDelete, onUnsave }) => {
    const { user, updateUser } = useAuth(); // Destructure updateUser

    const navigate = useNavigate();

    const [liked, setLiked] = useState(post.likes?.includes(user?._id) || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [saved, setSaved] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAnyway, setShowAnyway] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Safe check for author existence (Process orphaned posts)
    const author = post.author || {
        _id: 'deleted',
        username: 'Silinmiş Kullanıcı',
        profile: { displayName: 'Silinmiş Kullanıcı', avatar: null }
    };

    const isOwnPost = user?._id === author._id;

    // Optimized: Check saved status from AuthContext
    useEffect(() => {
        if (user && user.savedPosts) {
            // Robust comparison
            const isSaved = user.savedPosts.some(id => String(id) === String(post._id));
            setSaved(isSaved);
        }
    }, [user, post._id]);

    const formatDate = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diff = now - postDate;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return postDate.toLocaleDateString('en-US');
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
            // Optimistic update
            const startSavedState = saved;
            setSaved(!startSavedState);

            const response = await axios.post(`/api/users/me/save/${post._id}`);

            // Sync with global context to prevent reversion
            if (response.data.saved !== startSavedState) {
                const currentSavedPosts = user.savedPosts || [];
                let newSavedPosts;

                if (response.data.saved) {
                    // Add to saved
                    newSavedPosts = [...currentSavedPosts, post._id];
                } else {
                    // Remove from saved
                    newSavedPosts = currentSavedPosts.filter(id => String(id) !== String(post._id));
                }

                updateUser({ ...user, savedPosts: newSavedPosts });
            }

            setSaved(response.data.saved);
            if (!response.data.saved && onUnsave) {
                onUnsave();
            }
        } catch (error) {
            console.error('Save error:', error);
            // Revert on error
            setSaved(saved);
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

    const [showShareModal, setShowShareModal] = useState(false);

    const handleShare = () => {
        setShowShareModal(true);
    };

    const handleDownload = async () => {
        if (!post.media) return;
        try {
            const response = await fetch(getImageUrl(post.media));
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deepace-post-${post._id}.${post.mediaType === 'video' ? 'mp4' : 'png'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setShowMenu(false);
        } catch (error) {
            console.error('Download failed:', error);
            alert('İndirme başarısız.');
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
                            src={getImageUrl(post.author.profile.avatar)}
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
                <div className="post-header-row">
                    <div className="header-left">
                        <Link
                            to={`/profile/${post.author.username}`}
                            className="header-info-link"
                            onClick={handleProfileClick}
                        >
                            <span className="author-name">{post.author.profile?.displayName || post.author.username}</span>
                            <Badge type={post.author.verificationBadge} />
                            <span className="author-username">@{post.author.username}</span>
                        </Link>
                        <span className="post-time">· {formatDate(post.createdAt)}</span>
                    </div>

                    <div className="header-right" style={{ position: 'relative' }}>
                        <button
                            className="more-options-btn"
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
                                {post.media && (
                                    <button className="menu-item" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        İndir
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

                <div className="post-content-text">
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {(() => {
                            const content = post.content || '';
                            const shouldTruncate = content.length > 280 && !isExpanded;
                            const displayContent = shouldTruncate ? content.substring(0, 280) + '...' : content;

                            // Simple URL regex
                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                            const parts = displayContent.split(urlRegex);

                            return (
                                <>
                                    {parts.map((part, i) => (
                                        part.match(urlRegex) ? (
                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="post-link">{part}</a>
                                        ) : part
                                    ))}
                                    {shouldTruncate && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                                            className="show-more-btn"
                                        >
                                            Devamını göster
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </p>
                </div>

                {/* Media */}
                {
                    post.media && (
                        <div className="post-media" onClick={(e) => e.stopPropagation()}>
                            {post.mediaType === 'video' ? (
                                <video controls><source src={getImageUrl(post.media)} /></video>
                            ) : (
                                <img src={getImageUrl(post.media)} alt="Post media" loading="lazy" />
                            )}
                        </div>
                    )
                }

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
                {
                    showComments && (
                        <div className="post-comments-wrapper" onClick={(e) => e.stopPropagation()}>
                            <CommentSection postId={post._id} />
                        </div>
                    )
                }
            </div>

            {/* Delete Modal */}
            {
                showDeleteConfirm && (
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
                )
            }

            {
                showShareModal && (
                    <ShareModal postId={post._id} onClose={() => setShowShareModal(false)} />
                )
            }
        </article>
    );
};

export default PostCard;
