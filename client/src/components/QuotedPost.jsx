import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Youtube, ExternalLink } from 'lucide-react';
import Badge from './Badge';
import { extractFirstUrl } from '../utils/linkify';
import VideoPlayer from './VideoPlayer';

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
                        <img src={getImageUrl(author.profile.avatar)} alt={author.username} className="quoted-author-avatar" />
                    ) : (
                        <div className="quoted-author-placeholder">{author.username?.charAt(0)?.toUpperCase()}</div>
                    )}
                    <div className="quoted-author-info">
                        <span className="quoted-author-name">{author.profile?.displayName || author.username}</span>
                        <Badge type={author.verificationBadge} size={14} />
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
                        {quotedPost.portal.icon && (
                            <img src={getImageUrl(quotedPost.portal.icon)} alt="" className="quoted-portal-icon" />
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
