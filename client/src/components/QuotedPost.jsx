import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Youtube, ExternalLink } from 'lucide-react';
import Badge from './Badge';
import { extractFirstUrl } from '../utils/linkify';

const QuotedPost = ({ quotedPost, viewer }) => {
    const navigate = useNavigate();

    if (!quotedPost) return null;

    // Time Ago Helper
    const getTimeAgo = (date) => {
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
        // Only navigate if we didn't click the portal link
        if (e.target.closest('.quoted-portal-tag')) return;
        
        e.stopPropagation();
        if (quotedPost._id) {
            navigate(`/post/${quotedPost._id}`);
        }
    };

    const author = (quotedPost.author && typeof quotedPost.author === 'object') ? quotedPost.author : {
        username: 'Kullanıcı',
        profile: { displayName: typeof quotedPost === 'string' ? 'Görüntülenemiyor' : 'Yükleniyor...', avatar: null }
    };

    return (
        <div className="quoted-post-container" onClick={handleQuoteClick}>
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
                                <video 
                                    src={getImageUrl(quotedPost.media)} 
                                    controls
                                    playsInline 
                                    className="quoted-video-element"
                                />
                                <div className="video-badge"><Youtube size={12} /> Video</div>
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
            </div>
        </div>
    );
};


export default QuotedPost;
