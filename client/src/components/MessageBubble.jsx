import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
    const [dynamicPost, setDynamicPost] = React.useState(null);
    const [loadingError, setLoadingError] = React.useState(false);

    React.useEffect(() => {
        if (message.sharedPost && typeof message.sharedPost === 'string') {
            const fetchSharedPost = async () => {
                try {
                    // Use axios to leverage global config (base URL + auth headers)
                    const response = await axios.get(`/api/posts/${message.sharedPost}`);
                    setDynamicPost(response.data);
                } catch (error) {
                    console.error('Failed to fetch shared post details:', error);
                    setLoadingError(true);
                }
            };
            fetchSharedPost();
        }
    }, [message.sharedPost]);

    const displayPost = (typeof message.sharedPost === 'object') ? message.sharedPost : dynamicPost;

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

                {displayPost ? (
                    <Link to={`/post/${displayPost._id}`} className="shared-post-card">
                        <div className="shared-post-header">
                            <img
                                src={getImageUrl(displayPost.author?.profile?.avatar)}
                                alt={displayPost.author?.username}
                                className="shared-post-avatar"
                            />
                            <span className="shared-post-username">@{displayPost.author?.username}</span>
                        </div>
                        {displayPost.content && <p className="shared-post-content">{displayPost.content.substring(0, 100)}...</p>}
                        {displayPost.media && (
                            <div className="shared-post-media-preview">
                                <img src={getImageUrl(Array.isArray(displayPost.media) ? displayPost.media[0] : displayPost.media)} alt="Shared Post" />
                            </div>
                        )}
                    </Link>
                ) : message.sharedPost ? (
                    <Link to={`/post/${message.sharedPost}`} className="shared-post-card fallback">
                        <div className="shared-post-content" style={{ color: loadingError ? 'var(--error-color, #ff4d4d)' : 'inherit' }}>
                            {loadingError ? 'Gönderi yüklenemedi (Silinmiş olabilir)' : 'Gönderi yükleniyor...'}
                        </div>
                    </Link>
                ) : null}

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
