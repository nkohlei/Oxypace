import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { shouldShowTranslation } from '../utils/languageUtils';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import UserAvatar from './UserAvatar';
import UserBadges from './UserBadges';
import { linkifyText, truncateAndLinkifyText, extractFirstUrl } from '../utils/linkify';
import VideoPlayer from './VideoPlayer';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useGlobalStore } from '../store/useGlobalStore';
import './PostCard.css';
import './MessageBubble.css';
import LinkPreview from './LinkPreview';
import { Youtube, Pin, MoreHorizontal, Bookmark, Download, Send, PinOff, Trash2, Flag, Quote, Heart, MessageCircle, Share2, Eye, Reply, Link as LinkIcon, Globe, Maximize2 } from 'lucide-react';
import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';
import QuotePortalModal from './QuotePortalModal';
import QuotedPost from './QuotedPost';
import ReportModal from './ReportModal';

// Lightweight YouTube facade — loads iframe only on click
const YouTubeFacade = ({ media }) => {
    const [showIframe, setShowIframe] = useState(false);
    const containerRef = useRef(null);
    const iframeRef = useRef(null);

    const getVideoId = (url) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        } catch { return null; }
    };

    const videoId = getVideoId(media);

    useEffect(() => {
        if (!showIframe) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.intersectionRatio < 0.20) {
                    if (iframeRef.current) {
                        // Pause Video
                        iframeRef.current.contentWindow?.postMessage(
                            JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
                            '*'
                        );
                        // Mute Video
                        iframeRef.current.contentWindow?.postMessage(
                            JSON.stringify({ event: 'command', func: 'mute', args: '' }),
                            '*'
                        );
                    }
                }
            },
            { threshold: [0, 0.20, 1.0] }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [showIframe]);

    if (!videoId) return null;

    return (
        <div ref={containerRef} className="youtube-embed-container" style={{
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
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`}
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
                        <svg height="64" width="64" viewBox="0 0 68 48">
                            <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path>
                            <path d="M 45,24 27,14 27,34" fill="#FFFFFF"></path>
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};


const PostCard = ({ post, onDelete, onUnsave, onPin, isAdmin }) => {
    const { user, updateUser, token: authContextToken } = useAuth(); // Destructure updateUser and token

    const navigate = useNavigate();


    const [saved, setSaved] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
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
        isDeleted: post.author.isDeleted || cachedUser?.isDeleted,
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
            const activeToken = authContextToken || localStorage.getItem('token');
            const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
            await axios.delete(`/api/posts/${post._id}`, config);
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
        const filename = url.split('/').pop() || `oxypace-post-${Date.now()}`;
        await nativeDownloadFile(url, filename);
        setShowMenu(false);
    };



    // Placeholder handlers for new menu items

    // Placeholder handlers for new menu items
    const handleMenuAction = (action) => {
        setShowMenu(false);
        if (action === 'report') {
            setShowReportModal(true);
        }
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
            onMouseLeave={handleMouseLeave}
            style={{
                zIndex: showMenu ? 100 : 1,
                contentVisibility: showMenu ? 'visible' : 'auto'
            }}
        >
            {post.isOptimistic && (
                <div className="post-card-upload-overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(6, 9, 19, 0.45)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 10,
                    borderRadius: 'inherit'
                }}>
                    <div className="compose-spinner-wrapper" style={{ width: '40px', height: '40px' }}>
                        <div className="compose-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary-cyan)' }} />
                        <span className="compose-progress-text" style={{ fontSize: '11px', color: '#fff' }}>
                            {post.uploadProgress !== undefined ? `${post.uploadProgress}%` : '0%'}
                        </span>
                    </div>
                </div>
            )}
            {/* Left Column: Avatar */}
            <div className="post-left">
                <Link
                    to={`/profile/${author.username}`}
                    className="avatar-link"
                    onClick={(e) => e.stopPropagation()}
                >
                    <UserAvatar
                        src={author.profile?.avatar}
                        alt={author.username}
                        className="author-avatar"
                        size={40}
                        isDeleted={author.isDeleted}
                    />
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
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="author-name">
                                {author.profile?.displayName || author.username}
                            </span>
                            {author.isDeleted && (
                                <span className="deleted-user-badge" style={{
                                    marginLeft: '6px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    borderRadius: '4px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    verticalAlign: 'middle'
                                }}>
                                    Silinmiş Kullanıcı
                                </span>
                            )}
                            <UserBadges user={author} size={16} />
                            <span className="author-username">@{author.username}</span>
                        </Link>
                        <span className="post-time">· {formatDate(post.createdAt)}</span>
                    </div>

                    {/* Post action buttons - top right */}
                    <div className="post-action-buttons">
                        {/* Go to post page button */}
                        <button
                            className="post-action-btn"
                            aria-label="Gnderiyi gster"
                            title="Gnderiyi Gster"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/post/${post._id}`);
                            }}
                        >
                            <Maximize2 size={16} />
                        </button>

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

                {/* PDF Document Card */}
                {post.pdfUrl && (
                    <div className="post-pdf-container" onClick={(e) => e.stopPropagation()}>
                        <a
                            href={getImageUrl(post.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pdf-glass-card"
                            onClick={(e) => {
                                if (Capacitor.isNativePlatform()) {
                                    e.preventDefault();
                                    window.open(getImageUrl(post.pdfUrl), '_system');
                                }
                            }}
                        >
                            {post.pdfThumbnailUrl ? (
                                <div className="pdf-thumbnail-wrapper">
                                    <img
                                        src={getImageUrl(post.pdfThumbnailUrl)}
                                        alt="PDF preview"
                                        className="pdf-thumbnail"
                                        loading="lazy"
                                    />
                                    <div className="pdf-badge">PDF</div>
                                </div>
                            ) : (
                                <div className="pdf-icon-placeholder">
                                    <div className="pdf-icon-text">PDF</div>
                                </div>
                            )}
                            <div className="pdf-info">
                                <span className="pdf-name" title={post.pdfName || 'Doküman.pdf'}>
                                    {post.pdfName || 'Doküman.pdf'}
                                </span>
                                <span className="pdf-size">
                                    {post.pdfSize ? (post.pdfSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                                </span>
                            </div>
                        </a>
                    </div>
                )}

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

            {showReportModal && (
                <ReportModal
                    targetType="post"
                    targetId={post._id}
                    targetName={post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : 'Görsel / Video Paylaşımı'}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </article>
    );
};

export default memo(PostCard);
