import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { linkifyText } from '../utils/linkify';
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
            a.download = `oxypace-msg-${Date.now()}.png`;
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
    const [dynamicPortal, setDynamicPortal] = React.useState(null);
    const [loadingError, setLoadingError] = React.useState(false);
    const [portalLoadingError, setPortalLoadingError] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [showEmojiMenu, setShowEmojiMenu] = React.useState(false);
    const [showActionsMobile, setShowActionsMobile] = React.useState(false);
    const longPressTimer = React.useRef(null);

    React.useEffect(() => {
        if (message.sharedPost && typeof message.sharedPost === 'string') {
            const fetchSharedPost = async () => {
                try {
                    const response = await axios.get(`/api/posts/${message.sharedPost}`);
                    setDynamicPost(response.data);
                } catch (error) {
                    console.error('Failed to fetch shared post details:', error);
                    setLoadingError(true);
                }
            };
            fetchSharedPost();
        }

        if (message.sharedPortal && typeof message.sharedPortal === 'string') {
            const fetchSharedPortal = async () => {
                try {
                    const response = await axios.get(`/api/portals/${message.sharedPortal}`);
                    setDynamicPortal(response.data);
                } catch (error) {
                    console.error('Failed to fetch shared portal details:', error);
                    setPortalLoadingError(true);
                }
            };
            fetchSharedPortal();
        }
    }, [message.sharedPost, message.sharedPortal]);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showEmojiMenu &&
                !event.target.closest('.emoji-menu') &&
                !event.target.closest('.react-btn')
            ) {
                setShowEmojiMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiMenu]);

    const displayPost = typeof message.sharedPost === 'object' ? message.sharedPost : dynamicPost;
    const displayPortal =
        typeof message.sharedPortal === 'object' ? message.sharedPortal : dynamicPortal;

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
                {/* Actions Bar (Right for other, Left for own - handled by CSS order) */}
                <div className="message-actions">
                    {/* Delete Button (Trash Icon) */}
                    <button
                        className="action-btn delete-btn"
                        title="Sil"
                        onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(true);
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>

                <div
                    className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.isOptimistic ? 'optimistic' : ''}`}
                >
                    {/* Full Screen Foggy Overlay for Delete Confirmation */}
                    {/* Full Screen Foggy Overlay for Delete Confirmation */}
                    {confirmDelete &&
                        createPortal(
                            <div className="delete-confirm-overlay">
                                <div className="delete-confirm-modal">
                                    <p>Sil?</p>
                                    <div className="delete-confirm-actions">
                                        <button
                                            className="confirm-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(message._id); // This calls handleDeleteMessage in Inbox.jsx
                                                setConfirmDelete(false);
                                            }}
                                        >
                                            Evet
                                        </button>
                                        <button
                                            className="cancel-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDelete(false);
                                            }}
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                    <div className="message-bubble-content">
                        {message.media && (
                            <div className="message-media" onClick={toggleLightbox}>
                                <img
                                    src={
                                        message.isOptimistic
                                            ? message.media
                                            : getImageUrl(message.media)
                                    }
                                    alt="Attachment"
                                />
                                {!message.isOptimistic && (
                                    <button
                                        className="msg-download-btn"
                                        onClick={(e) =>
                                            handleDownload(e, getImageUrl(message.media))
                                        }
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
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
                                        {message.replyTo.sender?.profile?.displayName ||
                                            message.replyTo.sender?.username ||
                                            'Kullanıcı'}
                                    </p>
                                    <p className="reply-text">
                                        {message.replyTo.content ||
                                            (message.replyTo.media ? '📷 Medya' : 'Mesaj')}
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
                                    <span className="shared-post-username">
                                        @{displayPost.author?.username}
                                    </span>
                                </div>
                                {displayPost.content && (
                                    <p className="shared-post-content">
                                        {displayPost.content.substring(0, 100)}...
                                    </p>
                                )}
                                {displayPost.media && (
                                    <div className="shared-post-media-preview">
                                        <img
                                            src={getImageUrl(
                                                Array.isArray(displayPost.media)
                                                    ? displayPost.media[0]
                                                    : displayPost.media
                                            )}
                                            alt="Shared Post"
                                        />
                                    </div>
                                )}
                            </Link>
                        ) : message.sharedPost ? (
                            <Link
                                to={`/post/${message.sharedPost}`}
                                className="shared-post-card fallback"
                            >
                                <div
                                    className="shared-post-content"
                                    style={{
                                        color: loadingError
                                            ? 'var(--error-color, #ff4d4d)'
                                            : 'inherit',
                                    }}
                                >
                                    {loadingError
                                        ? 'Gönderi yüklenemedi (Silinmiş olabilir)'
                                        : 'Gönderi yükleniyor...'}
                                </div>
                            </Link>
                        ) : null}

                        {displayPortal ? (
                            <Link
                                to={`/portal/${displayPortal._id}`}
                                className="shared-portal-card"
                            >
                                <div className="shared-portal-header">
                                    <div className="shared-portal-avatar-container">
                                        <img
                                            src={getImageUrl(displayPortal.avatar)}
                                            alt={displayPortal.name}
                                            className="shared-portal-avatar"
                                        />
                                        <div className="portal-badge">P</div>
                                    </div>
                                    <div className="shared-portal-info">
                                        <h4>{displayPortal.name}</h4>
                                        <p>
                                            {displayPortal.description?.substring(0, 80) ||
                                                'Dinamik bir topluluk portalı...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="view-portal-footer">
                                    <span>Portalı Görüntüle</span>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ) : message.sharedPortal ? (
                            <div className="shared-portal-card fallback">
                                <div
                                    className="shared-portal-content"
                                    style={{
                                        color: portalLoadingError
                                            ? 'var(--error-color)'
                                            : 'inherit',
                                    }}
                                >
                                    {portalLoadingError
                                        ? 'Portal yüklenemedi'
                                        : 'Portal yükleniyor...'}
                                </div>
                            </div>
                        ) : null}

                        {message.content && (
                            <div className="message-content">{linkifyText(message.content)}</div>
                        )}
                        <div className="message-time">
                            {formatTime(message.createdAt)}
                            {message.isOptimistic && <span className="sending-indicator">...</span>}
                        </div>

                        {/* Reactions Display */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className="message-reactions">
                                {message.reactions.map((reaction, index) => (
                                    <span key={index} className="reaction-emoji">
                                        {reaction.emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
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
