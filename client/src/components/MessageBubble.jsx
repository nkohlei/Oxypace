import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn, onDelete, onReply, onReact }) => {
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
    const [showMenu, setShowMenu] = React.useState(false);
    const [showEmojiMenu, setShowEmojiMenu] = React.useState(false);
    const [showActionsMobile, setShowActionsMobile] = React.useState(false);
    const longPressTimer = React.useRef(null);

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

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMenu && !event.target.closest('.message-actions-menu')) {
                setShowMenu(false);
            }
            if (showEmojiMenu && !event.target.closest('.emoji-menu') && !event.target.closest('.react-btn')) {
                setShowEmojiMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const displayPost = (typeof message.sharedPost === 'object') ? message.sharedPost : dynamicPost;

    const toggleLightbox = (e) => {
        if (e) e.stopPropagation();
        setShowLightbox(!showLightbox);
    };

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowActionsMobile(true);
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        if (onDelete) onDelete(message._id);
    };

    const handleReaction = (emoji) => {
        if (onReact) onReact(message._id, emoji);
        setShowEmojiMenu(false);
    };

    const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];

    return (
        <>
            <div
                className={`message-row ${isOwn ? 'own' : 'other'} ${showActionsMobile ? 'mobile-actions-visible' : ''}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Actions Bar (Left of bubble for own messages, Right for others - configured via CSS order) */}
                <div className="message-actions">
                    <button className="action-btn dots-btn" onClick={handleMenuClick}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="message-actions-menu">
                            <button onClick={handleDeleteClick} className="menu-item delete">
                                Sil
                            </button>
                            <button onClick={() => setShowMenu(false)} className="menu-item">
                                İptal
                            </button>
                        </div>
                    )}

                    <button className="action-btn reply-btn" title="Yanıtla" onClick={() => onReply && onReply(message)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 10 4 15 9 20"></polyline>
                            <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                        </svg>
                    </button>

                    <div className="reaction-wrapper" style={{ position: 'relative' }}>
                        <button
                            className="action-btn react-btn"
                            title="İfade Bırak"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiMenu(!showEmojiMenu);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                        </button>
                        {showEmojiMenu && (
                            <div className="emoji-menu">
                                {emojis.map(emoji => (
                                    <button key={emoji} onClick={() => handleReaction(emoji)} className="emoji-option">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

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

                    {message.replyTo && (
                        <div className="message-reply-preview">
                            <div className="reply-bar-line"></div>
                            <div className="reply-content-box">
                                <p className="reply-sender">
                                    {message.replyTo.sender?.username || 'Kullanıcı'}
                                </p>
                                <p className="reply-text">
                                    {message.replyTo.content || (message.replyTo.media ? '📷 Medya' : 'Mesaj')}
                                </p>
                            </div>
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

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className="message-reactions">
                            {message.reactions.map((reaction, index) => (
                                <span key={index} className="reaction-emoji">{reaction.emoji}</span>
                            ))}
                        </div>
                    )}
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
