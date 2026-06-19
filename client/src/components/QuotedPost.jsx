import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Youtube, ExternalLink } from 'lucide-react';
import UserBadges from './UserBadges';
import { extractFirstUrl } from '../utils/linkify';
import VideoPlayer from './VideoPlayer';
import UserAvatar from './UserAvatar';

const QuotedPost = ({ quotedPost, viewer, depth = 0 }) => {
    const navigate = useNavigate();

    // Prevent infinite recursion (stop at level 2 like Twitter/X)
    if (!quotedPost || depth > 2) return null;

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
    const portal = quotedPost.portal;
    if (portal && (portal.privacy === 'private' || portal.privacy === 'restricted')) {
        const isMember = viewer?._id && portal.members?.some(id => String(id) === String(viewer._id));
        const isAllowed = viewer?._id && portal.allowedUsers?.some(id => String(id) === String(viewer._id));
        const isAuthor = viewer?._id === (quotedPost.author?._id || quotedPost.author);

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
        if (quotedPost._id) {
            navigate(`/post/${quotedPost._id}`);
        }
    };

    // Improved author handling: check for both object structure and ID fallback
    const isPopulated = quotedPost.author && typeof quotedPost.author === 'object';
    const author = isPopulated ? quotedPost.author : {
        username: 'Kullanıcı',
        profile: { 
            displayName: typeof quotedPost === 'string' ? 'Yükleniyor...' : (quotedPost.author ? 'Görüntülenemiyor' : 'Yükleniyor...'), 
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
                        <span className="quoted-time">{getTimeAgo(quotedPost.createdAt)}</span>
                    </div>
                </div>

                {quotedPost.portal && (
                    <Link 
                        to={`/portal/${quotedPost.portal._id}`} 
                        className="quoted-portal-tag"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {quotedPost.portal.avatar && (
                            <img 
                                src={getImageUrl(quotedPost.portal.lowResAvatar || quotedPost.portal.avatar, 'thumbnail')} 
                                alt="" 
                                className="quoted-portal-icon" 
                                style={{ imageRendering: '-webkit-optimize-contrast', contentVisibility: 'auto' }}
                                onError={(e) => {
                                    const originalUrl = getImageUrl(quotedPost.portal.avatar, 'original');
                                    if (e.target.src !== originalUrl) {
                                        e.target.src = originalUrl;
                                    }
                                }}
                            />
                        )}
                        <span>{quotedPost.portal.name}</span>
                        <ExternalLink size={10} />
                    </Link>
                )}
            </div>
            <div className="quoted-post-content">
                {quotedPost.content && (
                    <p className="quoted-text">{quotedPost.content.substring(0, 500)}{quotedPost.content.length > 500 ? '...' : ''}</p>
                )}
                {quotedPost.media && (
                    <div className="quoted-media-preview">
                        {quotedPost.mediaType === 'video' ? (
                            <div className="quoted-video-wrapper">
                                <VideoPlayer 
                                    src={getImageUrl(quotedPost.media)} 
                                    qualities={quotedPost.videoQualities}
                                    videoUrl={getImageUrl(quotedPost.videoUrl)}
                                    lowVideoUrl={getImageUrl(quotedPost.lowVideoUrl)}
                                    className="quoted-player"
                                />
                            </div>
                        ) : quotedPost.mediaType === 'youtube' ? (
                            <div className="quoted-youtube-wrapper">
                                <img src={`https://img.youtube.com/vi/${extractFirstUrl(quotedPost.media)}/hqdefault.jpg`} alt="" />
                                <div className="video-badge"><Youtube size={12} /> YouTube</div>
                            </div>
                        ) : (
                            <img src={getImageUrl(quotedPost.media)} alt="Quoted media" className="quoted-image-element" />
                        )}
                    </div>
                )}

                {quotedPost.pdfUrl && (
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
                        {quotedPost.pdfThumbnailUrl ? (
                            <img 
                                src={getImageUrl(quotedPost.pdfThumbnailUrl)} 
                                alt="" 
                                style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
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
                                {quotedPost.pdfName || 'Doküman.pdf'}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {quotedPost.pdfSize ? (quotedPost.pdfSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Recursive QuotedPost - Only if depth is low and data exists */}
                {quotedPost.quotedPost && (
                    <div className="nested-quote-wrapper">
                        <QuotedPost quotedPost={quotedPost.quotedPost} viewer={viewer} depth={depth + 1} />
                    </div>
                )}
            </div>
        </div>
    );
};




export default QuotedPost;
