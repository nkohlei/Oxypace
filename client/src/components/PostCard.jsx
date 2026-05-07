import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { shouldShowTranslation } from '../utils/languageUtils';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import Badge from './Badge';
import { linkifyText, truncateAndLinkifyText, extractFirstUrl } from '../utils/linkify';
import VideoPlayer from './VideoPlayer';
import { useGlobalStore } from '../store/useGlobalStore';
import './PostCard.css';
import './MessageBubble.css';
import LinkPreview from './LinkPreview';
import { Youtube, Pin, MoreHorizontal, Bookmark, Download, Send, PinOff, Trash2, Flag, Quote } from 'lucide-react';
import QuotePortalModal from './QuotePortalModal';

// Lightweight YouTube facade — loads iframe only on click
const YouTubeFacade = ({ media }) => {
    const [showIframe, setShowIframe] = useState(false);

    const getVideoId = (url) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        } catch { return null; }
    };

    const videoId = getVideoId(media);
    if (!videoId) return null;

    return (
        <div className="youtube-embed-container" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '622px',
            aspectRatio: '16/9',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#000',
            cursor: showIframe ? 'default' : 'pointer',
            zIndex: 1
        }}>
            {showIframe ? (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube Video"
                />
            ) : (
                <div onClick={() => setShowIframe(true)} style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                        alt="YouTube Video"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.3)'
                    }}>
                        <Youtube color="white" fill="red" size={64} />
                    </div>
                </div>
            )}
        </div>
    );
};

const QuotedPost = ({ quotedPost, viewer }) => {
    const navigate = useNavigate();
    if (!quotedPost) return null;

    // Privacy Check for Quoted Post
    const isAuthor = viewer?._id === (quotedPost.author?._id || quotedPost.author);
    let isVisible = true;

    if (!isAuthor) {
        // Portal Privacy
        if (quotedPost.portal) {
            const portal = quotedPost.portal;
            const isBlocked = viewer?._id && portal.blockedUsers?.some(id => String(id) === String(viewer._id));
            if (isBlocked) isVisible = false;

            if (portal.privacy === 'private' || portal.privacy === 'restricted') {
                const isMember = viewer?._id && portal.members?.some(id => String(id) === String(viewer._id));
                const isAllowed = viewer?._id && portal.allowedUsers?.some(id => String(id) === String(viewer._id));
                if (!isMember && !isAllowed) isVisible = false;
            }
        }

        // User Privacy
        if (quotedPost.author?.settings?.privacy?.isPrivate) {
            if (!viewer) {
                isVisible = false;
            } else {
                const isFollowing = viewer.following?.some(id => String(id) === String(quotedPost.author._id));
                if (!isAuthor && !isFollowing) isVisible = false;
            }
        }
    }

    if (!isVisible) {
        return (
            <div className="quoted-post-container private">
                <div className="quoted-post-content">
                    <p className="private-message">Bu gönderi gizli veya erişilemez.</p>
                </div>
            </div>
        );
    }

    const handleQuoteClick = (e) => {
        e.stopPropagation();
        navigate(`/post/${quotedPost._id}`);
    };

    const author = quotedPost.author && typeof quotedPost.author === 'object' ? quotedPost.author : {
        username: 'Kullanıcı',
        profile: { displayName: 'Yükleniyor...', avatar: null }
    };

    return (
        <div className="quoted-post-container" onClick={handleQuoteClick}>
            <div className="quoted-post-header">
                {author.profile?.avatar ? (
                    <img src={getImageUrl(author.profile.avatar)} alt={author.username} className="quoted-author-avatar" />
                ) : (
                    <div className="quoted-author-placeholder">{author.username?.charAt(0)?.toUpperCase()}</div>
                )}
                <span className="quoted-author-name">{author.profile?.displayName || author.username}</span>
                <Badge type={author.verificationBadge} size={14} />
                <span className="quoted-author-username">@{author.username}</span>
            </div>
            <div className="quoted-post-content">
                {quotedPost.content && (
                    <p className="quoted-text">{quotedPost.content.substring(0, 200)}{quotedPost.content.length > 200 ? '...' : ''}</p>
                )}
                {quotedPost.media && (
                    <div className="quoted-media-preview">
                        {quotedPost.mediaType === 'video' ? (
                            <div className="quoted-video-icon"><Youtube size={20} /> Video</div>
                        ) : (
                            <img src={getImageUrl(quotedPost.media)} alt="Quoted media" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const PostCard = ({ post, onDelete, onUnsave, onPin, isAdmin }) => {
    const { user, updateUser } = useAuth(); // Destructure updateUser

    const navigate = useNavigate();

    const [saved, setSaved] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 150;


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
            // Call our new high-accuracy backend translation service
            const response = await axios.post('/api/translate', { 
                text: post.content,
                target: 'tr'
            });

            if (response.data && response.data.translated) {
                setTranslatedText(response.data.translated);
                setIsTranslated(true);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Çeviri şu an yapılamıyor, lütfen daha sonra tekrar dene.');
        } finally {
            setIsTranslating(false);
        }
    };

    const cachedUser = useGlobalStore(state => state.usersCache[post.author?._id]);

    const authorBase = post.author ? {
        ...post.author,
        ...cachedUser,
        profile: {
            ...post.author.profile,
            ...(cachedUser?.profile || {})
        }
    } : null;

    // Safe check for author existence (Process orphaned posts)
    const author = authorBase || {
        _id: 'deleted',
        username: 'Silinmiş Kullanıcı',
        profile: { displayName: 'Silinmiş Kullanıcı', avatar: null },
    };

    const isOwnPost = user?._id === author._id;

    // Optimized: Check saved status from AuthContext
    useEffect(() => {
        if (user && user.savedPosts) {
            // Robust comparison
            const isSaved = user.savedPosts.some((id) => String(id) === String(post._id));
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

        if (minutes < 1) return 'şimdi';
        if (minutes < 60) return `${minutes}d`;
        if (hours < 24) return `${hours}s`;
        if (days < 7) return `${days}g`;
        return postDate.toLocaleDateString('tr-TR');
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
                    newSavedPosts = currentSavedPosts.filter(
                        (id) => String(id) !== String(post._id)
                    );
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

    const handleQuote = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!user) {
            navigate('/login');
            return;
        }

        setShowMenu(false);
        setShowQuoteModal(true);
    };

    const handlePortalSelect = (portalId) => {
        setShowQuoteModal(false);
        navigate(`/portal/${portalId}`, { state: { quotedPostId: post._id, quotedPost: post } });
    };

    const handleDownload = async (e) => {
        if (e) e.stopPropagation();
        if (!post.media) return;

        const url = getImageUrl(post.media);
        try {
            const filename = url.split('/').pop() || `oxypace-post-${Date.now()}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            setShowMenu(false);
        } catch (error) {
            console.error('Download error:', error);
            alert('İndirme başarısız oldu.');
        }
    };



    const handleCardClick = (e) => {
        // Prevent navigation if clicking on a button, link, or menu
        if (
            e.target.closest('button') ||
            e.target.closest('a') ||
            e.target.closest('.post-menu-dropdown') ||
            e.target.closest('.post-header-menu') ||
            e.target.closest('.video-container') ||
            e.target.closest('.double-tap-zone') ||
            e.target.closest('.video-controls-overlay')
        ) {
            return;
        }
        navigate(`/post/${post._id}`);
    };

    const handleProfileClick = (e) => {
        e.stopPropagation();
    };

    // Placeholder handlers for new menu items
    const handleMenuAction = (action) => {
        setShowMenu(false);
    };

    // Auto-close menu on outside click (Mobile/General)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMenu) {
                // If click is not inside the menu or on the toggle button, close it.
                // Note: We rely on event bubbling and specific class names or refs if needed.
                // But a simple document click that isn't stopped by the menu itself acts as "outside".
                // However, we stopped propagation on the menu itself.
                // So any click that reaches document is "outside".
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showMenu]);

    const handleMouseLeave = () => {
        // Desktop: Close menu when cursor leaves the post card
        if (window.innerWidth > 768) {
            setShowMenu(false);
        }
    };


    return (
        <article
            id={`post-${post._id}`}
            className={`post-card twitter-layout ${post.isOptimistic ? 'optimistic' : ''}`}
            onClick={handleCardClick}
            onMouseLeave={handleMouseLeave}
            style={{
                zIndex: showMenu ? 100 : 1,
                contentVisibility: showMenu ? 'visible' : 'auto'
            }}
        >
            {/* Left Column: Avatar */}
            <div className="post-left">
                <Link
                    to={`/profile/${author.username}`}
                    className="avatar-link"
                    onClick={handleProfileClick}
                >
                    {author.profile?.avatar ? (
                        <img
                            src={getImageUrl(author.profile.avatar)}
                            alt={author.username}
                            className="author-avatar"
                            loading="lazy"
                            decoding="async"
                            width="40"
                            height="40"
                        />
                    ) : (
                        <div className="author-placeholder">
                            {author.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                </Link>
            </div>

            {/* Right Column: Content */}
            <div className="post-right">
                {post.isPinned && (
                    <div
                        className="pinned-indicator"
                        style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            fontWeight: '700',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <Pin size={12} fill="currentColor" />
                        Sabitlendi
                    </div>
                )}
                <div className="post-header-row">
                    <div className="header-left">
                        <Link
                            to={`/profile/${author.username}`}
                            className="header-info-link"
                            onClick={handleProfileClick}
                        >
                            <span className="author-name">
                                {author.profile?.displayName || author.username}
                            </span>
                            <Badge type={author.verificationBadge} size={16} />
                            <span className="author-username">@{author.username}</span>
                        </Link>
                        <span className="post-time">· {formatDate(post.createdAt)}</span>
                    </div>

                    {/* Post action buttons - top right */}
                    <div className="post-action-buttons">
                        {/* Three-dot menu button (horizontal) */}
                        <button
                            className="post-action-btn"
                            aria-label="Gönderi seçenekleri"
                            aria-haspopup="true"
                            aria-expanded={showMenu}
                            title="Daha Fazla"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {/* Floating Context Menu */}
                        {showMenu && (
                            <div
                                className="post-floating-menu"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    className="menu-item"
                                    onClick={handleQuote}
                                >
                                    Alıntıla
                                    <Quote size={18} className="menu-icon-right" />
                                </button>

                                <button
                                    className="menu-item"
                                    onClick={() => {
                                        handleSave();
                                        setShowMenu(false);
                                    }}
                                >
                                    {saved ? 'Kaydı Kaldır' : 'Kaydet'}
                                    <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} className="menu-icon-right" />
                                </button>
                                
                                {post.media && (
                                    <button className="menu-item" onClick={handleDownload}>
                                        İndir
                                        <Download size={18} className="menu-icon-right" />
                                    </button>
                                )}

                                <button className="menu-item" onClick={handleShare}>
                                    Gönder
                                    <Send size={18} className="menu-icon-right" />
                                </button>

                                {isAdmin && (
                                    <>
                                        <div className="menu-divider"></div>
                                        <button
                                            className="menu-item"
                                            onClick={() => {
                                                onPin(post._id);
                                                setShowMenu(false);
                                            }}
                                        >
                                            {post.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                                            {post.isPinned ? (
                                                <PinOff size={18} className="menu-icon-right" />
                                            ) : (
                                                <Pin size={18} className="menu-icon-right" />
                                            )}
                                        </button>
                                    </>
                                )}

                                <div className="menu-divider"></div>

                                {isOwnPost && (
                                    <button
                                        className="menu-item delete-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                            setShowDeleteConfirm(true);
                                        }}
                                    >
                                        Sil
                                        <Trash2 size={18} className="menu-icon-right" />
                                    </button>
                                )}
                                <button
                                    className="menu-item delete-item"
                                    onClick={() => handleMenuAction('report')}
                                >
                                    Bildir
                                    <Flag size={18} className="menu-icon-right" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="post-content-text">
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {(() => {
                            const contentStr = isTranslated && translatedText ? translatedText : post.content;
                            if (!contentStr) return null;
                            const firstUrl = extractFirstUrl(post.content);

                            if (contentStr.length <= MAX_LENGTH) {
                                return linkifyText(contentStr, firstUrl);
                            }

                            if (isExpanded) {
                                return (
                                    <>
                                        {linkifyText(contentStr, firstUrl)}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                            className="read-more-btn"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary-cyan)',
                                                cursor: 'pointer',
                                                padding: 0,
                                                marginLeft: '4px',
                                                fontWeight: 600,
                                                fontSize: '0.95em'
                                            }}
                                        >
                                            daha az gör
                                        </button>
                                    </>
                                );
                            }

                            const { elements, isTruncated } = truncateAndLinkifyText(contentStr, MAX_LENGTH, firstUrl);

                            return (
                                <>
                                    {elements}
                                    {isTruncated && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                                            className="read-more-btn"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary-cyan)',
                                                cursor: 'pointer',
                                                padding: 0,
                                                marginLeft: '4px',
                                                fontWeight: 600,
                                                fontSize: '0.95em'
                                            }}
                                        >
                                            devamını gör
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </p>
                    {post.content && shouldShowTranslation(post.content) && (
                        <button
                            className="translation-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTranslate();
                            }}
                        >
                            {isTranslating
                                ? 'Çevriliyor...'
                                : isTranslated
                                    ? 'Orijinalini gör'
                                    : 'Çevirisini gör'}
                        </button>
                    )}
                </div>

                {/* Link Preview (Isolated from media) */}
                {(() => {
                    const firstUrl = extractFirstUrl(post.content);
                    if (firstUrl) {
                        return <LinkPreview url={firstUrl} />;
                    }
                    return null;
                })()}

                {/* Media */}
                {post.media && (
                    <div className="post-media" onClick={(e) => e.stopPropagation()}>
                        {post.mediaType === 'video' ? (
                            <VideoPlayer
                                src={getImageUrl(post.media)}
                                className="post-video-player"
                            />
                        ) : post.mediaType === 'youtube' ? (
                            <YouTubeFacade media={post.media} />
                        ) : (
                            <img
                                src={getImageUrl(post.media)}
                                alt="Post media"
                                loading="lazy"
                                decoding="async"
                            />
                        )}
                    </div>
                )}

                {/* Quoted Post */}
                {post.quotedPost && (
                    <QuotedPost quotedPost={post.quotedPost} viewer={user} />
                )}

                {/* No Actions displayed below content */}
            </div>

            {/* Delete Modal */}
            {showDeleteConfirm && createPortal(
                <div className="delete-confirm-overlay" onClick={(e) => e.stopPropagation()}
                    role="dialog" aria-label="Gönderi silme onayı" aria-modal="true">
                    <div className="delete-confirm-modal">
                        <h3>Gönderin Silinecek!</h3>
                        <p>Emin misin?</p>
                        <div className="confirm-buttons">
                            <button
                                className="confirm-btn btn-cancel"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                İptal
                            </button>
                            <button className="confirm-btn btn-delete" onClick={handleDelete}>
                                Sil
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showQuoteModal && (
                <QuotePortalModal
                    portals={user?.portals || user?.joinedPortals || []}
                    onSelect={handlePortalSelect}
                    onClose={() => setShowQuoteModal(false)}
                />
            )}

            {showShareModal && (
                <ShareModal postId={post._id} onClose={() => setShowShareModal(false)} />
            )}
        </article>
    );
};

export default PostCard;
