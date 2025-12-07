import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn }) => {
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.isOptimistic ? 'optimistic' : ''}`}>
            {message.media && (
                <div className="message-media">
                    <img src={message.isOptimistic ? message.media : getImageUrl(message.media)} alt="Attachment" />
                </div>
            )}

            {message.sharedPost && (
                <Link to={`/post/${message.sharedPost._id}`} className="shared-post-card">
                    <div className="shared-post-header">
                        <img
                            src={getImageUrl(message.sharedPost.author?.profile?.avatar)}
                            alt={message.sharedPost.author?.username}
                            className="shared-post-avatar"
                        />
                        <span className="shared-post-username">@{message.sharedPost.author?.username}</span>
                    </div>
                    {message.sharedPost.content && <p className="shared-post-content">{message.sharedPost.content.substring(0, 100)}...</p>}
                    {message.sharedPost.media && (
                        <div className="shared-post-media-preview">
                            <img src={getImageUrl(Array.isArray(message.sharedPost.media) ? message.sharedPost.media[0] : message.sharedPost.media)} alt="Shared Post" />
                        </div>
                    )}
                </Link>
            )}

            {message.content && <div className="message-content">{message.content}</div>}
            <div className="message-time">
                {formatTime(message.createdAt)}
                {message.isOptimistic && <span className="sending-indicator">...</span>}
            </div>
        </div>
    );
};

export default MessageBubble;
