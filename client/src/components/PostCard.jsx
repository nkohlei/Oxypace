import { useState, useEffect } from 'react';
import { shouldShowTranslation } from '../utils/languageUtils';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import Badge from './Badge';
import { linkifyText } from '../utils/linkify';
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

    // Translation State
    const [isTranslated, setIsTranslated] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (isTranslated) {
            setIsTranslated(false);
            return;
        }

        if (translatedText) {
            setIsTranslated(true);
            return;
        }

        setIsTranslating(true);
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(post.content)}&langpair=AUTODETECT|tr`);
            const data = await response.json();

            if (data.responseData) {
                setTranslatedText(data.responseData.translatedText);
                setIsTranslated(true);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Çeviri yapılamadı.');
        } finally {
            setIsTranslating(false);
        }
    };

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

    const handleAuthRequired = (action) => {
        if (!user) {
            navigate('/login');
            return;
        }
        action();
    };

    const handleLike = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.post(`/api/likes/post/${post._id}`);
            setLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
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
        // Static message - no navigation
        e.preventDefault();
    };

    const handleProfileClick = (e) => {
        e.stopPropagation();
    };

    // Placeholder handlers for new menu items
    const handleMenuAction = (action) => {
        console.log(`Action triggered: ${action}`);
        setShowMenu(false);
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
        <article className="post-card twitter-layout" onClick={handleCardClick}>
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

                    {/* Discord Style Hover Actions (Top Right) */}
                    <div className="message-hover-actions">
                        <button className="hover-action-btn" title="Tepki Ekle" onClick={() => handleMenuAction('reaction')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                        </button>
                        <button className="hover-action-btn" title="Yanıtla" onClick={() => handleMenuAction('reply')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                        </button>
                        <button className="hover-action-btn" title="Daha Fazla" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </button>

                        {/* Context Menu (Three Dots) - Expanded */}
                        {showMenu && (
                            <div className="post-dropdown-menu expanded-menu" onClick={(e) => e.stopPropagation()}>
                                <div className="menu-group">
                                    <button className="menu-item" onClick={() => handleMenuAction('add_reaction')}>
                                        Tepki Ekle
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="menu-group">
                                    <button className="menu-item" onClick={() => handleMenuAction('reply')}>
                                        Yanıtla
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => handleMenuAction('forward')}>
                                        İlet
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => handleMenuAction('create_thread')}>
                                        Alt Başlık Oluştur
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                                    </button>
                                </div>
                                <div className="menu-divider"></div>
                                <div className="menu-group">
                                    <button className="menu-item" onClick={() => { navigator.clipboard.writeText(post.content); handleMenuAction('copy_text'); }}>
                                        Metni Kopyala
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => handleMenuAction('pin')}>
                                        Twiti Sabitle
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => handleMenuAction('apps')}>
                                        Uygulamalar
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                                <div className="menu-divider"></div>

                                <div className="menu-group">
                                    <button className="menu-item" onClick={() => handleMenuAction('mark_unread')}>
                                        Okunmadı Olarak İşaretle
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" /></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => { navigator.clipboard.writeText(window.location.origin + '/post/' + post._id); handleMenuAction('copy_link'); }}>
                                        Mesaj Bağlantısını Kopyala
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    </button>
                                    <button className="menu-item" onClick={() => handleMenuAction('speak')}>
                                        Mesajı Söylet
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                    </button>
                                </div>

                                <div className="menu-divider"></div>

                                <div className="menu-group">
                                    {isOwnPost && (
                                        <button className="menu-item delete-item" onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}>
                                            Mesajı Sil
                                            <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    )}
                                    <button className="menu-item delete-item" onClick={() => handleMenuAction('report')}>
                                        Mesaj Bildir
                                        <svg className="menu-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="post-content-text">
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {linkifyText(post.content)}
                    </p>
                    {post.content && (
                        <button
                            className="translation-toggle"
                            onClick={(e) => { e.stopPropagation(); handleTranslate(); }}
                        >
                            {isTranslating ? 'Çevriliyor...' : (isTranslated ? 'Orijinalini gör' : 'Çevirisini gör')}
                        </button>
                    )}
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

                {/* No Actions displayed below content */}

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
