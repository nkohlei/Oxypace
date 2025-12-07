import React from 'react';
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

    const handleDownload = async (e, url) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `deepace-msg-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const [showLightbox, setShowLightbox] = React.useState(false);

    const toggleLightbox = (e) => {
        if (e) e.stopPropagation();
        setShowLightbox(!showLightbox);
    };

    return (
        <>
            <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.isOptimistic ? 'optimistic' : ''}`}>
                {message.media && (
                    <div className="message-media" onClick={toggleLightbox}>
                        <img
                            src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                            alt="Attachment"
                        />
                        {!message.isOptimistic && (
                            <button className="msg-download-btn" onClick={(e) => handleDownload(e, getImageUrl(message.media))}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {message.sharedPost && typeof message.sharedPost === 'object' && (
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

            {/* Lightbox Modal */}
            {showLightbox && (
                <div className="lightbox-overlay" onClick={toggleLightbox}>
                    <div className="lightbox-content">
                        <img
                            src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                            alt="Full Size"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default MessageBubble;
