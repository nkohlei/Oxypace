import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { linkifyText, extractFirstUrl } from '../utils/linkify';
import { extractYouTubeInfo, formatDuration, formatFileSize } from '../utils/mediaAttachments';
import LinkPreview from './LinkPreview';
import VideoPlayer from './VideoPlayer';
import UserAvatar from './UserAvatar';
import PortalBadges from './PortalBadges';
import {
    Play,
    Download,
    ArrowUpRight,
    ChevronDown,
    Info,
    Reply,
    Copy,
    Smile,
    Forward,
    Pin,
    PinOff,
    Star,
    CheckSquare,
    Trash2,
    Check,
    CheckCheck,
    Music,
    Mic,
    FileText,
    FolderOpen,
} from 'lucide-react';
import './MessageBubble.css';

import { downloadFile as nativeDownloadFile } from '../utils/downloadHelper';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageBubble = ({
    message,
    isOwn,
    isConsecutive,
    currentUserId,
    isGhost = false,
    selectMode = false,
    isSelected = false,
    isHighlighted = false,
    isSearchMatch = false,
    onToggleSelect,
    onEnterSelect,
    onRequestDelete,
    onReply,
    onReact,
    onCopy,
    onForward,
    onPin,
    onStar,
    onShowInfo,
    onJumpToMessage,
}) => {
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
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0, isMobileSheet: false });
    const [highlightReactions, setHighlightReactions] = React.useState(false);

    const bubbleRef = React.useRef(null);
    const menuRef = React.useRef(null);
    const longPressTimer = React.useRef(null);
    const touchStartPos = React.useRef({ x: 0, y: 0 });
    const longPressTriggered = React.useRef(false);

    const isStarred = React.useMemo(
        () => (message.starredBy || []).some((id) => String(id) === String(currentUserId)),
        [message.starredBy, currentUserId]
    );

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

    // Close context menu on outside click, escape, or scroll
    React.useEffect(() => {
        if (!menuOpen) return;

        const handleOutside = (event) => {
            if (menuRef.current && menuRef.current.contains(event.target)) return;
            if (event.target.closest?.('.msg-chevron-trigger')) return;
            setMenuOpen(false);
            setHighlightReactions(false);
        };

        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                setHighlightReactions(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleOutside);
            document.addEventListener('touchstart', handleOutside, { passive: true });
            document.addEventListener('keydown', handleKey);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [menuOpen]);

    React.useEffect(() => {
        if (!showLightbox) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowLightbox(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [showLightbox]);

    React.useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    const openContextMenu = (anchorEl) => {
        if (selectMode || message.isOptimistic) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobileSheet = vw <= 640;

        if (isMobileSheet) {
            setMenuPos({ top: 0, left: 0, isMobileSheet: true });
            setMenuOpen(true);
            return;
        }

        const rect = (anchorEl || bubbleRef.current)?.getBoundingClientRect();
        const menuW = 176;
        const menuH = 275;
        let left = isOwn ? (rect ? rect.right - menuW : vw - menuW - 16) : (rect ? rect.left : 16);
        let top = rect ? rect.bottom + 4 : 120;

        if (left + menuW > vw - 12) left = vw - menuW - 12;
        if (left < 12) left = 12;
        if (top + menuH > vh - 12) {
            top = Math.max(12, (rect ? rect.top : vh) - menuH - 6);
        }

        setMenuPos({ top, left, isMobileSheet: false });
        setMenuOpen(true);
    };

    const handleChevronClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (menuOpen) {
            setMenuOpen(false);
            setHighlightReactions(false);
        } else {
            openContextMenu(e.currentTarget);
        }
    };

    const handleTouchStart = (e) => {
        if (selectMode || message.isOptimistic) return;
        const touch = e.touches?.[0];
        if (!touch) return;
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        longPressTriggered.current = false;

        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            if (navigator.vibrate) {
                try { navigator.vibrate(18); } catch (_) {}
            }
            openContextMenu(bubbleRef.current);
        }, 420);
    };

    const handleTouchMove = (e) => {
        if (!longPressTimer.current) return;
        const touch = e.touches?.[0];
        if (!touch) return;
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleRowClick = (e) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (selectMode && onToggleSelect) {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(message._id);
        }
    };

    const displayPost = typeof message.sharedPost === 'object' ? message.sharedPost : dynamicPost;
    const displayPortal =
        typeof message.sharedPortal === 'object' ? message.sharedPortal : dynamicPortal;

    const toggleLightbox = (e) => {
        if (selectMode) return;
        if (e) e.stopPropagation();
        setShowLightbox((prev) => !prev);
    };

    const handleReactionClick = (emoji) => {
        if (onReact) onReact(message._id, emoji);
        setMenuOpen(false);
        setHighlightReactions(false);
    };

    const isVideo =
        message.media &&
        (message.media.match(/\.(mp4|webm|ogg|mov)$/i) ||
            (message.isOptimistic &&
                message.media.startsWith('blob:') &&
                message.mediaType?.startsWith('video')));
    const isImage =
        message.media &&
        (message.media.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i) ||
            (message.isOptimistic &&
                message.media.startsWith('blob:') &&
                message.mediaType?.startsWith('image')));
    const isDocument = message.media && !isVideo && !isImage;

    const renderStatusMeta = (inline = true) => (
        <span className={`message-meta-inline ${inline ? '' : 'standalone'}`}>
            {message.pinned && <Pin size={10} className="msg-inline-pin" title="Sabitlendi" />}
            {isStarred && <Star size={10} fill="currentColor" className="msg-inline-star" title="Yıldızlı" />}
            <span>{formatTime(message.createdAt)}</span>
            {message.isOptimistic ? (
                <span className="sending-indicator">...</span>
            ) : isOwn ? (
                message.read ? (
                    <CheckCheck size={13} className="msg-read-tick read" />
                ) : (
                    <Check size={13} className="msg-read-tick" />
                )
            ) : null}
        </span>
    );

    const hasMediaOnly = Boolean(message.media && !message.content);
    const hasCardWithCaption = Boolean(
        message.content && (message.media || message.sharedPost || message.sharedPortal)
    );

    return (
        <>
            <div
                data-message-id={message._id}
                className={`message-row ${isOwn ? 'own' : 'other'} ${isConsecutive ? 'consecutive' : ''} ${
                    selectMode ? 'select-mode' : ''
                } ${isSelected ? 'selected' : ''} ${isHighlighted ? 'jump-highlight' : ''} ${
                    isSearchMatch ? 'search-match' : ''
                } ${menuOpen ? 'menu-open' : ''}`}
                onClick={handleRowClick}
                onContextMenu={(e) => {
                    if (window.matchMedia('(pointer: coarse)').matches) {
                        e.preventDefault();
                    }
                }}
            >
                {selectMode && (
                    <button
                        type="button"
                        className={`msg-select-checkbox ${isSelected ? 'checked' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(message._id);
                        }}
                        aria-label={isSelected ? 'Seçimi kaldır' : 'Mesajı seç'}
                    >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>
                )}

                <div
                    ref={bubbleRef}
                    className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.isOptimistic ? 'optimistic' : ''} ${
                        hasMediaOnly ? 'media-only' : ''
                    }`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    {/* Minimal WhatsApp-style hover chevron trigger (desktop) */}
                    {!selectMode && !message.isOptimistic && (
                        <button
                            type="button"
                            className={`msg-chevron-trigger ${menuOpen ? 'active' : ''}`}
                            onClick={handleChevronClick}
                            title="Mesaj seçenekleri"
                            aria-label="Mesaj seçenekleri"
                        >
                            <ChevronDown size={15} strokeWidth={2.2} />
                        </button>
                    )}

                    <div className={`message-bubble-content ${hasCardWithCaption ? 'unified-card' : ''}`}>
                        {message.forwarded && (
                            <div className={`msg-forwarded-label ${isOwn ? 'own' : 'other'}`}>
                                <Forward size={11} />
                                <span>İletildi</span>
                            </div>
                        )}

                        {message.media &&
                            (isDocument ? (
                                <div className="post-pdf-container" onClick={(e) => e.stopPropagation()}>
                                    <div
                                        className="pdf-glass-card"
                                        onClick={(e) => {
                                            if (selectMode) return;
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
                                            <span
                                                className="pdf-name"
                                                title={message.mediaName || message.media.split('/').pop() || 'Doküman'}
                                            >
                                                {message.mediaName || message.media.split('/').pop() || 'Doküman'}
                                            </span>
                                            <span className="pdf-size">
                                                {message.mediaSize
                                                    ? (message.mediaSize / (1024 * 1024)).toFixed(2) + ' MB'
                                                    : 'Doküman'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="pdf-download-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(e, message.media);
                                            }}
                                            title="İndir"
                                        >
                                            <Download size={16} />
                                        </button>
                                        {!message.content && (
                                            <div className="pdf-time-in-card">{renderStatusMeta(true)}</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="message-media" onClick={toggleLightbox}>
                                    {isVideo ? (
                                        <div className="video-container">
                                            <video
                                                src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                                                className="bubble-video"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                            <div className="native-center-play-overlay msg-video-play-cover">
                                                <div className="native-center-play-btn">
                                                    <Play className="native-center-play-icon" />
                                                </div>
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
                                            width="240"
                                            height="240"
                                        />
                                    )}
                                    {!message.isOptimistic && (
                                        <button
                                            type="button"
                                            className="msg-download-btn"
                                            onClick={(e) => handleDownload(e, getImageUrl(message.media))}
                                            title="İndir"
                                        >
                                            <Download size={16} strokeWidth={2} />
                                        </button>
                                    )}
                                    {!message.content && (
                                        <div className="media-time-badge">{renderStatusMeta(true)}</div>
                                    )}
                                </div>
                            ))}

                        {message.replyTo && (
                            <div
                                className="message-reply-preview"
                                onClick={(e) => {
                                    if (selectMode) return;
                                    e.stopPropagation();
                                    const targetId = message.replyTo?._id || message.replyTo;
                                    if (targetId && onJumpToMessage) onJumpToMessage(targetId);
                                }}
                            >
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

                        {displayPost ? (() => {
                            const attachments = Array.isArray(displayPost.attachments) ? displayPost.attachments : [];
                            const mediaArr = Array.isArray(displayPost.media)
                                ? displayPost.media.filter(Boolean)
                                : displayPost.media
                                    ? [displayPost.media]
                                    : [];

                            // Resolve primary preview across ALL post types (image, gif, video, youtube, audio, pdf, file, folder, mixed, text)
                            const firstImgAtt = attachments.find((a) => a.kind === 'image' || a.kind === 'gif');
                            const firstVidAtt = attachments.find((a) => a.kind === 'video' || a.kind === 'videoUrl');
                            const firstYtAtt = attachments.find((a) => a.kind === 'youtube');
                            const firstAudioAtt = attachments.find((a) => a.kind === 'audio');
                            const firstPdfAtt = attachments.find((a) => a.kind === 'pdf');
                            const firstFolderAtt = attachments.find((a) => a.kind === 'folder');
                            const firstFileAtt = attachments.find((a) => a.kind === 'file');

                            const ytFromMedia = displayPost.mediaType === 'youtube' ? extractYouTubeInfo(mediaArr[0] || displayPost.content || '') : null;
                            const ytFromText = !ytFromMedia && !firstImgAtt && !firstVidAtt && mediaArr.length === 0
                                ? extractYouTubeInfo(displayPost.content || '')
                                : null;
                            const ytId = firstYtAtt?.youtubeId || ytFromMedia?.id || ytFromText?.id || null;

                            const isLegacyVideo =
                                displayPost.mediaType === 'video' ||
                                displayPost.mediaType === 'videoUrl' ||
                                (mediaArr[0] && /\.(mp4|webm|ogg|mov)$/i.test(mediaArr[0]));
                            const isLegacyImage =
                                !isLegacyVideo &&
                                displayPost.mediaType !== 'youtube' &&
                                displayPost.mediaType !== 'pdf' &&
                                displayPost.mediaType !== 'audio' &&
                                displayPost.mediaType !== 'file' &&
                                displayPost.mediaType !== 'folder' &&
                                mediaArr.length > 0;

                            const totalVisualCount = Math.max(
                                mediaArr.length,
                                attachments.length
                            );

                            let previewEl = null;

                            if (ytId) {
                                previewEl = (
                                    <div className="shared-post-media-preview">
                                        <img
                                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                            alt="YouTube"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="native-center-play-overlay msg-video-play-cover">
                                            <div className="native-center-play-btn">
                                                <Play className="native-center-play-icon" />
                                            </div>
                                        </div>
                                        <span className="shared-post-media-badge">YouTube</span>
                                    </div>
                                );
                            } else if (firstVidAtt || isLegacyVideo) {
                                const vidSrc = firstVidAtt ? getImageUrl(firstVidAtt.url) : getImageUrl(mediaArr[0]);
                                const vidPoster = firstVidAtt?.thumbnailUrl ? getImageUrl(firstVidAtt.thumbnailUrl) : undefined;
                                previewEl = (
                                    <div className="shared-post-media-preview">
                                        <div className="shared-post-video-wrapper">
                                            {vidPoster ? (
                                                <img src={vidPoster} alt="Video" className="shared-post-video" loading="lazy" decoding="async" />
                                            ) : (
                                                <video
                                                    src={vidSrc}
                                                    className="shared-post-video"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            )}
                                            <div className="native-center-play-overlay msg-video-play-cover">
                                                <div className="native-center-play-btn">
                                                    <Play className="native-center-play-icon" />
                                                </div>
                                            </div>
                                        </div>
                                        {totalVisualCount > 1 && (
                                            <span className="shared-post-media-badge">+{totalVisualCount - 1}</span>
                                        )}
                                    </div>
                                );
                            } else if (firstImgAtt || isLegacyImage) {
                                const imgSrc = firstImgAtt ? getImageUrl(firstImgAtt.url) : getImageUrl(mediaArr[0]);
                                const isGifPost = firstImgAtt?.kind === 'gif' || displayPost.mediaType === 'gif' || /\.gif(\?|$)/i.test(imgSrc);
                                previewEl = (
                                    <div className="shared-post-media-preview">
                                        <img
                                            src={imgSrc}
                                            alt="Shared Post"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {isGifPost && <span className="shared-post-media-badge left">GIF</span>}
                                        {totalVisualCount > 1 && (
                                            <span className="shared-post-media-badge">+{totalVisualCount - 1}</span>
                                        )}
                                    </div>
                                );
                            } else if (firstAudioAtt || displayPost.mediaType === 'audio') {
                                const audioTitle = firstAudioAtt?.name || (firstAudioAtt?.isVoiceRecording ? 'Ses Kaydı' : 'Ses Dosyası');
                                const audioDur = firstAudioAtt?.duration ? formatDuration(firstAudioAtt.duration) : '';
                                previewEl = (
                                    <div className="shared-post-file-chip">
                                        <div className="shared-post-file-icon">
                                            {firstAudioAtt?.coverUrl ? (
                                                <img src={getImageUrl(firstAudioAtt.coverUrl)} alt="" className="shared-post-audio-cover" />
                                            ) : firstAudioAtt?.isVoiceRecording ? (
                                                <Mic size={16} />
                                            ) : (
                                                <Music size={16} />
                                            )}
                                        </div>
                                        <div className="shared-post-file-meta">
                                            <span className="shared-post-file-name">{audioTitle}</span>
                                            <span className="shared-post-file-sub">
                                                {firstAudioAtt?.isVoiceRecording ? 'Ses Kaydı' : 'Ses Dosyası'}
                                                {audioDur ? ` • ${audioDur}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else if (firstPdfAtt || displayPost.pdfUrl || displayPost.mediaType === 'pdf') {
                                const pdfThumb = firstPdfAtt?.thumbnailUrl || displayPost.pdfThumbnailUrl;
                                const pdfTitle = firstPdfAtt?.name || displayPost.pdfName || 'PDF Dokümanı';
                                const pdfSz = firstPdfAtt?.size || displayPost.pdfSize || 0;
                                previewEl = pdfThumb ? (
                                    <div className="shared-post-media-preview">
                                        <img
                                            src={getImageUrl(pdfThumb)}
                                            alt="PDF Preview"
                                            className="shared-post-pdf-thumbnail"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <span className="shared-post-media-badge">PDF</span>
                                    </div>
                                ) : (
                                    <div className="shared-post-file-chip">
                                        <div className="shared-post-file-icon">
                                            <FileText size={16} />
                                        </div>
                                        <div className="shared-post-file-meta">
                                            <span className="shared-post-file-name">{pdfTitle}</span>
                                            <span className="shared-post-file-sub">
                                                PDF{pdfSz ? ` • ${formatFileSize(pdfSz)}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else if (firstFolderAtt || displayPost.mediaType === 'folder') {
                                const folderTitle = firstFolderAtt?.folderName || firstFolderAtt?.name || 'Klasör';
                                const fCount = firstFolderAtt?.fileCount || firstFolderAtt?.folderFiles?.length || 0;
                                previewEl = (
                                    <div className="shared-post-file-chip">
                                        <div className="shared-post-file-icon">
                                            <FolderOpen size={16} />
                                        </div>
                                        <div className="shared-post-file-meta">
                                            <span className="shared-post-file-name">{folderTitle}</span>
                                            <span className="shared-post-file-sub">
                                                Klasör{fCount ? ` • ${fCount} dosya` : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else if (firstFileAtt || displayPost.mediaType === 'file') {
                                const fName = firstFileAtt?.name || 'Dosya Eki';
                                const fSz = firstFileAtt?.size || 0;
                                previewEl = (
                                    <div className="shared-post-file-chip">
                                        <div className="shared-post-file-icon">
                                            <FileText size={16} />
                                        </div>
                                        <div className="shared-post-file-meta">
                                            <span className="shared-post-file-name">{fName}</span>
                                            <span className="shared-post-file-sub">
                                                Dosya{fSz ? ` • ${formatFileSize(fSz)}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            const authorDisplay =
                                displayPost.author?.profile?.displayName ||
                                displayPost.author?.username ||
                                'Kullanıcı';

                            return (
                                <Link
                                    to={`/post/${displayPost._id}`}
                                    className="shared-post-card"
                                    onClick={(e) => {
                                        if (selectMode) e.preventDefault();
                                        else e.stopPropagation();
                                    }}
                                >
                                    <div className="shared-post-header">
                                        <UserAvatar
                                            src={displayPost.author?.profile?.lowResAvatar || displayPost.author?.profile?.avatar}
                                            alt={authorDisplay}
                                            size={24}
                                            className="shared-post-avatar"
                                            isDeleted={displayPost.author?.isDeleted}
                                        />
                                        <div className="shared-post-author-meta">
                                            <span className="shared-post-displayname">{authorDisplay}</span>
                                            {displayPost.author?.username && (
                                                <span className="shared-post-username">@{displayPost.author.username}</span>
                                            )}
                                        </div>
                                        {displayPost.portal?.name && (
                                            <span className="shared-post-portal-pill">{displayPost.portal.name}</span>
                                        )}
                                    </div>
                                    {previewEl}
                                    {displayPost.content && (
                                        <p className={`shared-post-content ${!previewEl ? 'text-only' : ''}`}>
                                            {displayPost.content}
                                        </p>
                                    )}
                                    <div className="shared-post-footer">
                                        <span>Gönderiyi görüntüle</span>
                                        <ArrowUpRight size={13} />
                                    </div>
                                </Link>
                            );
                        })() : message.sharedPost ? (
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
                                className="internal-preview-card msg-portal-card"
                                onClick={(e) => {
                                    if (selectMode) e.preventDefault();
                                    else e.stopPropagation();
                                }}
                            >
                                <div className="internal-card-banner">
                                    {displayPortal.banner ? (
                                        <img
                                            src={getImageUrl(displayPortal.banner)}
                                            alt={displayPortal.name}
                                            className="internal-banner-img"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="internal-banner-placeholder" />
                                    )}
                                    {displayPortal.privacy === 'private' && (
                                        <span className="internal-banner-privacy-pill" title="Gizli Portal">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            <span>Gizli</span>
                                        </span>
                                    )}
                                </div>
                                <div className="internal-card-content">
                                    <div className="internal-card-head-row">
                                        <div className="internal-avatar-wrapper">
                                            {displayPortal.avatar ? (
                                                <img
                                                    src={getImageUrl(displayPortal.avatar)}
                                                    alt={displayPortal.name}
                                                    className="internal-avatar-img"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="internal-avatar-placeholder">
                                                    {(displayPortal.name || 'P').substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="internal-card-header">
                                            <h4 className="internal-card-title">
                                                <span className="internal-card-title-text">{displayPortal.name}</span>
                                                <PortalBadges portal={displayPortal} size={16} />
                                            </h4>
                                        </div>
                                    </div>
                                    <p className="internal-card-description">
                                        {displayPortal.description || 'Bu topluluk hakkında henüz bir açıklama yok.'}
                                    </p>
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
                            <div className="message-content">
                                {(() => {
                                    const firstUrl = extractFirstUrl(message.content);
                                    return (
                                        <>
                                            <span className="message-text-span">
                                                {linkifyText(message.content, firstUrl)}
                                            </span>
                                            {firstUrl && <LinkPreview url={firstUrl} />}
                                        </>
                                    );
                                })()}
                                <span className="message-time-in-bubble">{renderStatusMeta(true)}</span>
                            </div>
                        )}

                        {/* Reactions Display */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className="message-reactions">
                                {message.reactions.map((reaction, index) => (
                                    <span
                                        key={index}
                                        className="reaction-emoji"
                                        onClick={(e) => {
                                            if (isGhost) return;
                                            e.stopPropagation();
                                            onReact?.(message._id, reaction.emoji);
                                        }}
                                        title="İfadeyi değiştir / kaldır"
                                    >
                                        {reaction.emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* WhatsApp-style Per-Message Context Menu (Desktop Popover / Mobile Bottom Sheet) */}
            {menuOpen &&
                createPortal(
                    <div
                        className={`msg-context-backdrop ${menuPos.isMobileSheet ? 'mobile-sheet' : ''}`}
                        onClick={() => {
                            setMenuOpen(false);
                            setHighlightReactions(false);
                        }}
                    >
                        <div
                            ref={menuRef}
                            className={`msg-context-menu ${menuPos.isMobileSheet ? 'mobile-sheet' : ''}`}
                            style={
                                menuPos.isMobileSheet
                                    ? undefined
                                    : { top: menuPos.top, left: menuPos.left }
                            }
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!isGhost && (
                                <div className={`msg-reaction-bar ${highlightReactions ? 'pulse' : ''}`}>
                                    {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className="msg-reaction-btn"
                                            onClick={() => handleReactionClick(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                className="msg-context-item"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onShowInfo?.(message, isOwn);
                                }}
                            >
                                <Info size={13} />
                                <span>Mesaj bilgisi</span>
                            </button>

                            {!isGhost && (
                                <button
                                    type="button"
                                    className="msg-context-item"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onReply?.(message);
                                    }}
                                >
                                    <Reply size={13} />
                                    <span>Cevapla</span>
                                </button>
                            )}

                            {message.content && (
                                <button
                                    type="button"
                                    className="msg-context-item"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onCopy?.(message);
                                    }}
                                >
                                    <Copy size={13} />
                                    <span>Kopyala</span>
                                </button>
                            )}

                            {!isGhost && (
                                <button
                                    type="button"
                                    className="msg-context-item"
                                    onClick={() => setHighlightReactions(true)}
                                >
                                    <Smile size={13} />
                                    <span>İfade bırak</span>
                                </button>
                            )}

                            {!isGhost && (
                                <button
                                    type="button"
                                    className="msg-context-item"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onForward?.(message);
                                    }}
                                >
                                    <Forward size={13} />
                                    <span>İlet</span>
                                </button>
                            )}

                            {!isGhost && (
                                <button
                                    type="button"
                                    className="msg-context-item"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onPin?.(message._id);
                                    }}
                                >
                                    {message.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                                    <span>{message.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                className="msg-context-item"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onStar?.(message._id);
                                }}
                            >
                                <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
                                <span>{isStarred ? 'Yıldızı kaldır' : 'Yıldız ekle'}</span>
                            </button>

                            <button
                                type="button"
                                className="msg-context-item"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEnterSelect?.(message._id);
                                }}
                            >
                                <CheckSquare size={13} />
                                <span>Seç</span>
                            </button>

                            {!isGhost && (
                                <>
                                    <div className="msg-context-divider" />
                                    <button
                                        type="button"
                                        className="msg-context-item danger"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onRequestDelete?.(message, isOwn);
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        <span>Sil</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

            {/* Centered Lightbox Modal (No Top-Right × Button; Click Outside or Press Esc to Close) */}
            {showLightbox &&
                createPortal(
                    <div className="lightbox-overlay" onClick={toggleLightbox}>
                        <div
                            className={`lightbox-content ${isVideo ? 'video-lightbox' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isVideo ? (
                                <VideoPlayer
                                    src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                                    className="msg-lightbox-video-player"
                                />
                            ) : (
                                <img
                                    src={message.isOptimistic ? message.media : getImageUrl(message.media)}
                                    alt="Full Size"
                                />
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default React.memo(MessageBubble);
