import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import { Youtube } from 'lucide-react';
import Badge from './Badge';
import { extractFirstUrl } from '../utils/linkify';

const QuotedPost = ({ quotedPost, viewer }) => {
    const navigate = useNavigate();

    if (!quotedPost) return null;

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
                {author.profile?.avatar ? (
                    <img src={getImageUrl(author.profile.avatar)} alt={author.username} className="quoted-author-avatar" />
                ) : (
                    <div className="quoted-author-placeholder">{author.username?.charAt(0)?.toUpperCase()}</div>
                )}
                <div className="quoted-author-info">
                    <span className="quoted-author-name">{author.profile?.displayName || author.username}</span>
                    <Badge type={author.verificationBadge} size={14} />
                    <span className="quoted-author-username">@{author.username}</span>
                </div>
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
                                    muted 
                                    loop 
                                    playsInline 
                                    onMouseOver={e => e.target.play()}
                                    onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                />
                                <div className="video-badge"><Youtube size={12} /> Video</div>
                            </div>
                        ) : quotedPost.mediaType === 'youtube' ? (
                            <div className="quoted-youtube-wrapper">
                                <img src={`https://img.youtube.com/vi/${extractFirstUrl(quotedPost.media)}/hqdefault.jpg`} alt="" />
                                <div className="video-badge"><Youtube size={12} /> YouTube</div>
                            </div>
                        ) : (
                            <img src={getImageUrl(quotedPost.media)} alt="Quoted media" />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotedPost;
