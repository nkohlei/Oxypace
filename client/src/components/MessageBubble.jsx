import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { linkifyText, extractFirstUrl } from '../utils/linkify';
import LinkPreview from './LinkPreview';
import UserAvatar from './UserAvatar';
import { Trash2, Play, Download, ArrowRight } from 'lucide-react';
import './MessageBubble.css';

import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';

const MessageBubble = ({ message, isOwn, onDelete, onReply, onReact }) => {
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownload = async (e, url) => {
        e.stopPropagation();
        const filename = url.split('/').pop() || `oxypace-file-${Date.now()}`;
        await nativeDownloadFile(getImageUrl(url), filename);
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

    const isVideo = message.media && (message.media.match(/\.(mp4|webm|ogg|mov)$/i) || (message.isOptimistic && message.media.startsWith('blob:') && message.mediaType?.startsWith('video')));
    const isImage = message.media && (message.media.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i) || (message.isOptimistic && message.media.startsWith('blob:') && message.mediaType?.startsWith('image')));
    const isDocument = message.media && !isVideo && !isImage;

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
                        <Trash2 size={24} strokeWidth={2} />
                    </button>
                </div>

                {!isOwn && (
                    <UserAvatar
                        src={message.sender?.profile?.lowResAvatar || message.sender?.profile?.avatar}
                        alt={message.sender?.username}
                        size={32}
                        className="message-bubble-avatar"
                        isDeleted={message.sender?.isDeleted}
                    />
                )}

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
                            isDocument ? (
                                <div className="post-pdf-container" onClick={(e) => e.stopPropagation()}>
                                    <div
                                        className="pdf-glass-card"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.open(getImageUrl(message.media), '_blank', 'noopener,noreferrer');
                                        }}
                                    >
                                        {message.mediaThumbnail ? (
                                            <div className="pdf-thumbnail-wrapper">
                                                <img
                                                    src={getImageUrl(message.mediaThumbnail)}
                                                    alt="PDF preview"
                                                    className="pdf-thumbnail"
                                                    loading="lazy"
                                                    decoding="async"
                                                    width="150"
                                                    height="200"
                                                />
                                                <div className="pdf-badge">
                                                    {message.mediaName?.split('.').pop()?.toUpperCase() || 'PDF'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pdf-icon-placeholder">
                                                <div className="pdf-icon-text">
                                                    {message.mediaName?.split('.').pop()?.substring(0, 4).toUpperCase() || 
                                                     message.media.split('.').pop()?.substring(0, 4).toUpperCase() || 
                                                     'FILE'}
                                                </div>
                                            </div>
                                        )}
                                        <div className="pdf-info">
                                            <span className="pdf-name" title={message.mediaName || message.media.split('/').pop() || 'Doküman'}>
                                                {message.mediaName || message.media.split('/').pop() || 'Doküman'}
                                            </span>
                                            <span className="pdf-size">
                                                {message.mediaSize ? (message.mediaSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Doküman'}
                                            </span>
                                        </div>
                                        <button
                                            className="pdf-download-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(e, message.media);
                                            }}
                                            title="İndir"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="message-media" onClick={toggleLightbox}>
                                    {isVideo ? (
                                        <div className="video-container">
                                            <video
                                                src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                                                className="bubble-video"
                                            />
                                            <div className="video-play-overlay">
                                                <Play size={32} fill="currentColor" />
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={
                                                message.isOptimistic
                                                    ? message.media
                                                    : getImageUrl(message.media)
                                            }
                                            alt="Attachment"
                                            loading="lazy"
                                            decoding="async"
                                            width="250"
                                            height="250"
                                        />
                                    )}
                                    {!message.isOptimistic && (
                                        <button
                                            className="msg-download-btn"
                                            onClick={(e) =>
                                                handleDownload(e, getImageUrl(message.media))
                                            }
                                        >
                                            <Download size={24} strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                            )
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
                                        loading="lazy"
                                        decoding="async"
                                        width="32"
                                        height="32"
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
                                        {displayPost.mediaType === 'video' || displayPost.mediaType === 'videoUrl' || displayPost.media.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                            <div className="shared-post-video-wrapper">
                                                <video
                                                    src={getImageUrl(displayPost.media)}
                                                    className="shared-post-video"
                                                    muted
                                                    playsInline
                                                />
                                                <div className="video-play-overlay">
                                                    <Play size={24} fill="currentColor" />
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={getImageUrl(
                                                    Array.isArray(displayPost.media)
                                                        ? displayPost.media[0]
                                                        : displayPost.media
                                                )}
                                                alt="Shared Post"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        )}
                                    </div>
                                )}
                                {!displayPost.media && displayPost.pdfUrl && (
                                    <div className="shared-post-media-preview">
                                        <div className="shared-post-pdf-wrapper">
                                            {displayPost.pdfThumbnailUrl ? (
                                                <img
                                                    src={getImageUrl(displayPost.pdfThumbnailUrl)}
                                                    alt="PDF Preview"
                                                    className="shared-post-pdf-thumbnail"
                                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="pdf-icon-placeholder" style={{ height: '140px', width: '100%', borderRadius: 0 }}>
                                                    <div className="pdf-icon-text">PDF</div>
                                                </div>
                                            )}
                                        </div>
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
                                            loading="lazy"
                                            decoding="async"
                                            width="40"
                                            height="40"
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
                                    <ArrowRight size={16} strokeWidth={2.5} />
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
                            <>
                                {(() => {
                                    const firstUrl = extractFirstUrl(message.content);
                                    return (
                                        <>
                                            <div className="message-content">{linkifyText(message.content, firstUrl)}</div>
                                            {firstUrl && <LinkPreview url={firstUrl} />}
                                        </>
                                    );
                                })()}
                            </>
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
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        {message.media.match(/\.(mp4|webm|ogg|mov)$/i) || (message.isOptimistic && message.media.startsWith('blob:')) && message.mediaType?.startsWith('video') ? (
                            <video 
                                src={message.isOptimistic ? message.media : getImageUrl(message.media)} 
                                controls 
                                autoPlay 
                                className="lightbox-video"
                            />
                        ) : (
                            <img
                                src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                                alt="Full Size"
                            />
                        )}
                        <button className="lightbox-close" onClick={toggleLightbox}>×</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessageBubble;
