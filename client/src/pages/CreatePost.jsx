import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Image, Camera, Mic, FolderOpen } from 'lucide-react';
import { uploadFile } from '../utils/uploadUtils';
import { useUploadStore } from '../store/useUploadStore';
import {
    MAX_POST_ATTACHMENTS,
    appendAttachmentDrafts,
    createFolderDraftFromPackage,
    extractYouTubeInfo,
    prepareAndUploadPostAttachments,
    revokeAttachmentDraft,
} from '../utils/mediaAttachments';

import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import CameraCaptureModal from '../components/CameraCaptureModal';
import AudioRecorderPopover from '../components/AudioRecorderPopover';
import FileFolderPickerModal from '../components/FileFolderPickerModal';
import ComposerAttachmentTray from '../components/ComposerAttachmentTray';
import './CreatePost.css';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [attachmentDrafts, setAttachmentDrafts] = useState([]);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showAudioPopover, setShowAudioPopover] = useState(false);
    const [showFilePickerModal, setShowFilePickerModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [error, setError] = useState('');
    const galleryInputRef = useRef(null);
    const audioTriggerRef = useRef(null);
    const attachmentDraftsRef = useRef([]);
    const handedOffRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const portalId = location.state?.portalId;
    const channelId = location.state?.channelId || location.state?.channel;
    const quotedPostId = location.state?.quotedPostId;
    const quotedPost = location.state?.quotedPost;

    useEffect(() => {
        attachmentDraftsRef.current = attachmentDrafts;
    }, [attachmentDrafts]);

    useEffect(() => {
        return () => {
            if (!handedOffRef.current) {
                attachmentDraftsRef.current.forEach(revokeAttachmentDraft);
            }
        };
    }, []);

    // Redirect legacy /create?shared=1 routes to the global QuotePortalModal selector in App.jsx
    useEffect(() => {
        if (location.search.includes('shared=1') || window.__oxypaceSharedData) {
            navigate('/', { replace: true });
        }
    }, [location.search, navigate]);

    const combinedTextForYouTube = useMemo(() => {
        const trimmedContent = content.trim();
        const trimmedUrl = externalUrl.trim();
        if (trimmedContent && trimmedUrl) return `${trimmedContent}\n\n${trimmedUrl}`;
        return trimmedContent || trimmedUrl;
    }, [content, externalUrl]);

    const detectedYouTube = useMemo(
        () => extractYouTubeInfo(combinedTextForYouTube),
        [combinedTextForYouTube]
    );

    const appendFilesToDrafts = useCallback((files, extra = {}) => {
        if (!files || files.length === 0) return;
        setAttachmentDrafts((prev) => {
            const { nextDrafts, warnings } = appendAttachmentDrafts(prev, files, { extra });
            if (warnings.length > 0) {
                setError(warnings[0]);
            } else {
                setError('');
            }
            return nextDrafts;
        });
    }, []);

    const handleGalleryFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length > 0) {
            appendFilesToDrafts(files);
        }
    };

    const handleCameraCapture = (file) => {
        if (file) appendFilesToDrafts([file]);
    };

    const handleAudioAttach = (file, meta = {}) => {
        if (file) appendFilesToDrafts([file], meta);
    };

    const handlePickerFiles = (files) => {
        if (files && files.length > 0) appendFilesToDrafts(files);
    };

    const handlePickerFolder = (packaged) => {
        try {
            const draft = createFolderDraftFromPackage(packaged);
            if (!draft) return;
            setAttachmentDrafts((prev) => {
                if (prev.length >= MAX_POST_ATTACHMENTS) {
                    revokeAttachmentDraft(draft);
                    setError(`Bir gönderiye en fazla ${MAX_POST_ATTACHMENTS} dosya veya içerik eklenebilir.`);
                    return prev;
                }
                setError('');
                return [...prev, draft];
            });
        } catch (err) {
            setError(err?.message || 'Klasör eklenemedi.');
        }
    };

    const handleRemoveAttachment = (draftId) => {
        setAttachmentDrafts((prev) => {
            const target = prev.find((d) => d.id === draftId);
            if (target) revokeAttachmentDraft(target);
            return prev.filter((d) => d.id !== draftId);
        });
    };

    const handleClearAttachments = () => {
        attachmentDrafts.forEach(revokeAttachmentDraft);
        setAttachmentDrafts([]);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const hasText = Boolean(content.trim());
        const hasAttachments = attachmentDrafts.length > 0;
        const hasExternal = Boolean(externalUrl.trim());

        if (!hasText && !hasAttachments && !hasExternal) {
            setError('Lütfen bir içerik, bağlantı veya dosya ekleyin');
            return;
        }

        setLoading(true);
        setUploadPercentage(0);
        const currentDrafts = [...attachmentDrafts];

        try {
            let finalContent = content.trim();
            const trimmedExternal = externalUrl.trim();
            if (trimmedExternal) {
                finalContent = finalContent ? `${finalContent}\n\n${trimmedExternal}` : trimmedExternal;
            }

            let detectedVideo = null;
            if (!hasAttachments && !detectedYouTube && finalContent) {
                const urlRegex = /(https?:\/\/[^\s]+)/gi;
                const matches = finalContent.match(urlRegex);
                if (matches) {
                    for (const url of matches) {
                        try {
                            const cleanUrl = url.split('?')[0].split('#')[0];
                            const ext = cleanUrl.split('.').pop().toLowerCase();
                            if (['mp4', 'webm', 'ogg', 'm3u8', 'mpd'].includes(ext)) {
                                detectedVideo = url;
                                break;
                            }
                        } catch {
                            // Ignore malformed URLs
                        }
                    }
                }
            }

            const prepared = await prepareAndUploadPostAttachments({
                drafts: currentDrafts,
                uploadFileFn: uploadFile,
                targetId: portalId || 'global',
                hasAutoYouTube: Boolean(detectedYouTube),
                onProgress: (p) => setUploadPercentage(p),
            });

            if (prepared.mode === 'video') {
                handedOffRef.current = true;
                useUploadStore.getState().startVideoUpload({
                    file: prepared.primaryVideoFile,
                    portalId,
                    channel: channelId,
                    content: finalContent,
                    quotedPostId,
                    extraAttachments: prepared.extraAttachments,
                    onFinish: () => {
                        currentDrafts.forEach(revokeAttachmentDraft);
                    },
                });

                if (portalId) {
                    navigate(`/portal/${portalId}`);
                } else {
                    navigate('/');
                }
                return;
            }

            const postData = {
                content: finalContent,
                portalId,
                quotedPostId,
                ...(channelId ? { channel: channelId } : {}),
                ...prepared.payloadFields,
            };

            if (!hasAttachments && detectedYouTube && !postData.media && (!postData.attachments || postData.attachments.length === 0)) {
                postData.media = detectedYouTube.url;
                postData.mediaType = 'youtube';
            } else if (!hasAttachments && detectedVideo && !postData.media && (!postData.attachments || postData.attachments.length === 0)) {
                postData.media = detectedVideo;
                postData.mediaType = 'videoUrl';
            }

            await axios.post('/api/posts', postData);
            currentDrafts.forEach(revokeAttachmentDraft);

            if (portalId) {
                navigate(`/portal/${portalId}`);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gönderi oluşturulamadı');
        } finally {
            setLoading(false);
            setUploadPercentage(0);
        }
    };

    const isSubmitting = loading;
    const canSubmit = Boolean(content.trim() || attachmentDrafts.length > 0 || externalUrl.trim());

    return (
        <div className="app-wrapper">
            <Navbar />
            <SubHeader
                title="Yeni Gönderi"
                showBack={true}
                onBack={() => navigate('/')}
                rightAction={
                    <button
                        className="share-btn"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="compose-spinner-wrapper" style={{ width: '18px', height: '18px', marginRight: '6px' }}>
                                    <div className="compose-spinner" style={{ width: '18px', height: '18px', borderTopColor: 'currentColor' }} />
                                    <span className="compose-progress-text" style={{ fontSize: '7px' }}>
                                        {uploadPercentage}%
                                    </span>
                                </div>
                                Paylaşılıyor...
                            </>
                        ) : 'Paylaş'}
                    </button>
                }
            />
            <main className="app-content">
                <div className="create-post-container">
                    <div className="create-header desktop-only">
                        <button className="close-btn" onClick={() => navigate('/')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h1>Yeni Gönderi</h1>
                        <button
                            className="share-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="compose-spinner-wrapper" style={{ width: '18px', height: '18px', marginRight: '6px' }}>
                                        <div className="compose-spinner" style={{ width: '18px', height: '18px', borderTopColor: 'currentColor' }} />
                                        <span className="compose-progress-text" style={{ fontSize: '7px' }}>
                                            {uploadPercentage}%
                                        </span>
                                    </div>
                                    Paylaşılıyor...
                                </>
                            ) : 'Paylaş'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-form">
                        <textarea
                            placeholder="Ne düşünüyorsun? (YouTube bağlantıları otomatik algılanır)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                        />
                        <div className="url-input-container">
                            <input
                                type="text"
                                placeholder="Bağlantı ekle (URL veya YouTube linki)"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="url-input"
                            />
                        </div>

                        {quotedPost && (
                            <div className="quoted-preview">
                                <div className="quoted-preview-header">
                                    <span className="quoted-author">{quotedPost.author?.profile?.displayName || quotedPost.author?.username}</span>
                                    <span className="quoted-username">@{quotedPost.author?.username}</span>
                                </div>
                                <p className="quoted-content-preview">{quotedPost.content?.substring(0, 100)}...</p>
                            </div>
                        )}

                        {(attachmentDrafts.length > 0 || detectedYouTube) && (
                            <ComposerAttachmentTray
                                attachments={attachmentDrafts}
                                detectedYouTube={detectedYouTube}
                                onRemoveAttachment={handleRemoveAttachment}
                                onClearAll={attachmentDrafts.length > 1 ? handleClearAttachments : undefined}
                            />
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="media-options">
                            <label className={`media-btn${isSubmitting ? ' disabled' : ''}`}>
                                <input
                                    type="file"
                                    ref={galleryInputRef}
                                    accept="image/*,video/*,.gif"
                                    onChange={handleGalleryFileChange}
                                    style={{ display: 'none' }}
                                    disabled={isSubmitting}
                                    multiple
                                />
                                <Image size={20} strokeWidth={1.8} />
                                <span>Galeri</span>
                            </label>
                            <button
                                type="button"
                                className="media-btn"
                                onClick={() => setShowCameraModal(true)}
                                disabled={isSubmitting}
                            >
                                <Camera size={20} strokeWidth={1.8} />
                                <span>Kamera</span>
                            </button>
                            <div style={{ position: 'relative' }}>
                                <button
                                    ref={audioTriggerRef}
                                    type="button"
                                    className="media-btn"
                                    onClick={() => setShowAudioPopover((prev) => !prev)}
                                    disabled={isSubmitting}
                                >
                                    <Mic size={20} strokeWidth={1.8} />
                                    <span>Ses</span>
                                </button>
                                <AudioRecorderPopover
                                    isOpen={showAudioPopover}
                                    onClose={() => setShowAudioPopover(false)}
                                    onAttach={handleAudioAttach}
                                />
                            </div>
                            <button
                                type="button"
                                className="media-btn"
                                onClick={() => setShowFilePickerModal(true)}
                                disabled={isSubmitting}
                            >
                                <FolderOpen size={20} strokeWidth={1.8} />
                                <span>Dosya</span>
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <CameraCaptureModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={handleCameraCapture}
            />
            <FileFolderPickerModal
                isOpen={showFilePickerModal}
                onClose={() => setShowFilePickerModal(false)}
                onFilesSelected={handlePickerFiles}
                onFolderPackaged={handlePickerFolder}
            />
        </div>
    );
};

export default CreatePost;
