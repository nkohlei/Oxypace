import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Youtube, ExternalLink } from 'lucide-react';
import UserBadges from './UserBadges';
import { extractFirstUrl } from '../utils/linkify';
import VideoPlayer from './VideoPlayer';
import UserAvatar from './UserAvatar';

const QuotedPost = ({ quotedPost, viewer, depth = 0 }) => {
    const navigate = useNavigate();
    const [localPost, setLocalPost] = useState(typeof quotedPost === 'object' ? quotedPost : null);
    const [loading, setLoading] = useState(false);

    const isString = typeof quotedPost === 'string';
    const isObjectButUnpopulated = quotedPost && typeof quotedPost === 'object' && !quotedPost.author;
    const needsFetch = isString || isObjectButUnpopulated;

    useEffect(() => {
        if (!needsFetch) {
            setLocalPost(quotedPost);
            return;
        }

        const fetchQuotedPost = async () => {
            const targetId = isString ? quotedPost : quotedPost?._id;
            if (!targetId) return;

            setLoading(true);
            try {
                const activeToken = localStorage.getItem('token');
                const config = activeToken ? { headers: { Authorization: `Bearer ${activeToken}` } } : {};
                const res = await axios.get(`/api/posts/${targetId}`, config);
                setLocalPost(res.data);
            } catch (err) {
                console.error("Failed to fetch quoted post details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotedPost();
    }, [quotedPost, needsFetch, isString]);

    const activePost = localPost || (typeof quotedPost === 'object' ? quotedPost : null);

    // Prevent infinite recursion (stop at level 2 like Twitter/X)
    if (!activePost || depth > 2) {
        if (loading) {
            return (
                <div className={`quoted-post-container depth-${depth} loading-quote`} style={{ padding: '16px', textComponent: 'center' }}>
                    <p className="loading-message" style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Yükleniyor...</p>
                </div>
            );
        }
        return null;
    }

    // Time Ago Helper
    const getTimeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + 'y';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + 'ay';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'g';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 's';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + 'dk';
        return 'şimdi';
    };

    // Privacy Check
    const portal = activePost.portal;
    if (portal && (portal.privacy === 'private' || portal.privacy === 'restricted')) {
        const isMember = viewer?._id && portal.members?.some(id => String(id) === String(viewer._id));
        const isAllowed = viewer?._id && portal.allowedUsers?.some(id => String(id) === String(viewer._id));
        const isAuthor = viewer?._id === (activePost.author?._id || activePost.author);

        if (!isMember && !isAllowed && !isAuthor) {
            return (
                <div className="quoted-post-container private">
                    <p className="private-message">Bu gönderi gizli bir portala ait.</p>
                </div>
            );
        }
    }

    const handleQuoteClick = (e) => {
        // Only navigate if we didn't click the portal link or player controls
        if (e.target.closest('.quoted-portal-tag')) return;
        if (e.target.closest('.native-controls-ui')) return;
        if (e.target.closest('.native-mute-toggle')) return;

        e.stopPropagation();
        const targetId = activePost?._id || (typeof quotedPost === 'string' ? quotedPost : quotedPost?._id);
        if (targetId) {
            navigate(`/post/${targetId}`);
        }
    };

    // Improved author handling: check for both object structure and ID fallback
    const isPopulated = activePost.author && typeof activePost.author === 'object';
    const author = isPopulated ? activePost.author : {
        username: 'Kullanıcı',
        profile: {
            displayName: typeof activePost === 'string' ? 'Yükleniyor...' : (activePost.author ? 'Görüntülenemiyor' : 'Yükleniyor...'),
            avatar: null
        }
    };

    return (
        <div className={`quoted-post-container depth-${depth}`} onClick={handleQuoteClick}>
            <div className="quoted-post-header">
                <div className="quoted-header-left">
                    {author.profile?.avatar ? (
                        <UserAvatar
                            src={author.profile.lowResAvatar || author.profile.avatar}
                            alt={author.username}
                            className="quoted-author-avatar"
                            size={20}
                            sizeType="thumbnail"
                        />
                    ) : (
                        <div className="quoted-author-placeholder">{author.username?.charAt(0)?.toUpperCase()}</div>
                    )}
                    <div className="quoted-author-info">
                        <span className="quoted-author-name">{author.profile?.displayName || author.username}</span>
                        <UserBadges user={author} size={14} />
                        <span className="quoted-author-username">@{author.username}</span>
                        <span className="quoted-dot">·</span>
                        <span className="quoted-time">{getTimeAgo(activePost.createdAt)}</span>
                    </div>
                </div>

                {activePost.portal && (
                    <Link
                        to={`/portal/${activePost.portal._id}`}
                        className="quoted-portal-tag"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {activePost.portal.avatar && (
                            <img
                                src={getImageUrl(activePost.portal.lowResAvatar || activePost.portal.avatar, 'thumbnail')}
                                alt=""
                                className="quoted-portal-icon"
                                style={{ imageRendering: '-webkit-optimize-contrast', contentVisibility: 'auto' }}
                                loading="lazy"
                                decoding="async"
                                width="16"
                                height="16"
                                onError={(e) => {
                                    const originalUrl = getImageUrl(activePost.portal.avatar, 'original');
                                    if (e.target.src !== originalUrl) {
                                        e.target.src = originalUrl;
                                    }
                                }}
                            />
                        )}
                        <span>{activePost.portal.name}</span>
                        <ExternalLink size={10} />
                    </Link>
                )}
            </div>
            <div className="quoted-post-content">
                {activePost.content && (
                    <p className="quoted-text">{activePost.content.substring(0, 500)}{activePost.content.length > 500 ? '...' : ''}</p>
                )}
                {activePost.media && (
                    <div className="quoted-media-preview">
                        {activePost.mediaType === 'video' ? (
                            <div className="quoted-video-wrapper">
                                <VideoPlayer
                                    src={getImageUrl(activePost.media)}
                                    qualities={activePost.videoQualities}
                                    videoUrl={getImageUrl(activePost.videoUrl)}
                                    lowVideoUrl={getImageUrl(activePost.lowVideoUrl)}
                                    video144={getImageUrl(activePost.video144)}
                                    video360={getImageUrl(activePost.video360)}
                                    video720={getImageUrl(activePost.video720)}
                                    video1080={getImageUrl(activePost.video1080)}
                                    video2160={getImageUrl(activePost.video2160)}
                                    className="quoted-player"
                                    isProcessing={activePost.isProcessing}
                                    processingProgress={activePost.processingProgress}
                                    estimatedTime={activePost.estimatedTime}
                                />
                            </div>
                        ) : activePost.mediaType === 'youtube' ? (
                            <div className="quoted-youtube-wrapper">
                                <img
                                    src={`https://img.youtube.com/vi/${extractFirstUrl(activePost.media)}/hqdefault.jpg`}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    width="480"
                                    height="270"
                                />
                                <div className="video-badge"><Youtube size={12} /> YouTube</div>
                            </div>
                        ) : (
                            <img
                                src={getImageUrl(activePost.media)}
                                alt="Quoted media"
                                className="quoted-image-element"
                                loading="lazy"
                                decoding="async"
                                width="600"
                                height="400"
                            />
                        )}
                    </div>
                )}

                {activePost.pdfUrl && (
                    <div className="quoted-pdf-preview" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        marginTop: '8px',
                        cursor: 'pointer'
                    }}>
                        {activePost.pdfThumbnailUrl ? (
                            <img
                                src={getImageUrl(activePost.pdfThumbnailUrl)}
                                alt=""
                                style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                loading="lazy"
                                decoding="async"
                                width="40"
                                height="50"
                            />
                        ) : (
                            <div style={{
                                width: '40px',
                                height: '50px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                borderRadius: '4px'
                            }}>PDF</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {activePost.pdfName || 'Doküman.pdf'}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {activePost.pdfSize ? (activePost.pdfSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Recursive QuotedPost - Only if depth is low and data exists */}
                {activePost.quotedPost && (
                    <div className="nested-quote-wrapper">
                        <QuotedPost quotedPost={activePost.quotedPost} viewer={viewer} depth={depth + 1} />
                    </div>
                )}
            </div>
        </div>
    );
};




export default QuotedPost;
