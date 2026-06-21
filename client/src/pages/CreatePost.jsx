import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { uploadFile } from '../utils/uploadUtils';
import { useVideoTranscoder } from '../hooks/useVideoTranscoder';

import Navbar from '../components/Navbar';
import SubHeader from '../components/SubHeader';
import ProgressRing from '../components/ProgressRing';
import './CreatePost.css';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const portalId = location.state?.portalId;
    const quotedPostId = location.state?.quotedPostId;
    const quotedPost = location.state?.quotedPost;

    // Video transcoder hook (lazy — WASM loads only when video selected)
    const { transcodeAndUpload, isTranscoding, progress: transcodeProgress, stage, error: transcodeError } = useVideoTranscoder();
    const isVideoRef = useRef(false);

    // Helper to extract YouTube ID
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleYoutubeChange = (e) => {
        const url = e.target.value;
        setYoutubeUrl(url);

        const videoId = getYoutubeId(url);
        if (videoId) {
            setMediaPreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
            setMediaFile(null);
        } else if (!url) {
            setMediaPreview(null);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024 * 1024) {
                setError("Dosya boyutu 1 GB'dan büyük olamaz.");
                return;
            }
            setMediaFile(file);
            isVideoRef.current = file.type.startsWith('video/') ||
                ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(file.name.split('.').pop().toLowerCase());

            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                setMediaPreview({ isPdf: true, name: file.name, size: file.size });
            } else {
                setMediaPreview(URL.createObjectURL(file));
            }
            setYoutubeUrl('');
            setShowYoutubeInput(false);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setYoutubeUrl('');
        isVideoRef.current = false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!content && !mediaFile && !youtubeUrl) {
            setError('Lütfen bir içerik veya medya ekleyin');
            return;
        }

        setLoading(true);
        setUploadPercentage(0);

        try {
            let finalContent = content;
            if (externalUrl) {
                finalContent = content ? content + '\n\n' + externalUrl : externalUrl;
            }

            let mediaKey = null;
            let videoQualitiesPayload = null;
            let youtubeMedia = null;
            let youtubeMediaType = null;

            if (mediaFile) {
                if (isVideoRef.current) {
                    // ── VIDEO: browser-side WASM transcode + multi-quality R2 upload ──
                    const result = await transcodeAndUpload(mediaFile, portalId);
                    mediaKey = result.mediaKey;
                    videoQualitiesPayload = result.videoQualities;
                    setUploadPercentage(100);
                } else {
                    // ── IMAGE / PDF / GIF: existing presigned upload flow ──
                    mediaKey = await uploadFile(mediaFile, 'post', portalId, (p) => {
                        setUploadPercentage(p);
                    });
                }
            } else {
                setUploadPercentage(100);
            }

            if (!mediaFile && youtubeUrl) {
                const videoId = getYoutubeId(youtubeUrl);
                if (videoId) {
                    youtubeMedia = `https://www.youtube.com/watch?v=${videoId}`;
                    youtubeMediaType = 'youtube';
                } else {
                    setError('Geçersiz YouTube bağlantısı');
                    setLoading(false);
                    return;
                }
            }

            const postData = {
                content: finalContent,
                portalId: portalId,
                quotedPostId: quotedPostId,
            };

            if (mediaKey) {
                postData.mediaKey = mediaKey;
                if (isVideoRef.current) {
                    postData.mediaType = 'video';
                    if (videoQualitiesPayload) {
                        postData.videoQualities = JSON.stringify(videoQualitiesPayload);
                    }
                } else if (mediaFile && (mediaFile.type === 'application/pdf' || mediaFile.name.toLowerCase().endsWith('.pdf'))) {
                    postData.pdfName = mediaFile.name;
                    postData.pdfSize = mediaFile.size;
                }
            } else if (youtubeMedia) {
                postData.media = youtubeMedia;
                postData.mediaType = youtubeMediaType;
            }

            await axios.post('/api/posts', postData);

            if (portalId) {
                navigate(`/portal/${portalId}`);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || transcodeError || 'Gönderi oluşturulamadı');
        } finally {
            setLoading(false);
            setUploadPercentage(0);
        }
    };

    // ── Unified loading indicator for both upload and transcode phases ────────
    const isSubmitting  = loading || isTranscoding;
    const displayPct    = isTranscoding ? transcodeProgress : uploadPercentage;
    const displayStage  = isTranscoding ? stage : (loading ? 'Yükleniyor...' : '');

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
                        disabled={isSubmitting || (!content.trim() && !mediaFile && !externalUrl.trim() && !youtubeUrl.trim())}
                    >
                        {isSubmitting ? (
                            <>
                                <div style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>
                                    <ProgressRing 
                                        progress={displayPct} 
                                        size={18} 
                                        strokeWidth={2} 
                                        color="#fff" 
                                        fontSize="7px" 
                                        textColor="#fff" 
                                    />
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
                            disabled={isSubmitting || (!content.trim() && !mediaFile && !externalUrl.trim() && !youtubeUrl.trim())}
                        >
                            {isSubmitting ? (
                                <>
                                    <div style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>
                                        <ProgressRing 
                                            progress={displayPct} 
                                            size={18} 
                                            strokeWidth={2} 
                                            color="#fff" 
                                            fontSize="7px" 
                                            textColor="#fff" 
                                        />
                                    </div>
                                    Paylaşılıyor...
                                </>
                            ) : 'Paylaş'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-form">
                        <textarea
                            placeholder="Ne düşünüyorsun?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                        />
                        <div className="url-input-container">
                            <input
                                type="text"
                                placeholder="Bağlantı ekle (URL)"
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

                        {/* Video transcoding progress indicator */}
                        {isTranscoding && (
                            <div className="video-transcode-progress" style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                margin: '10px 0',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div className="compose-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#60a5fa', flexShrink: 0 }} />
                                    <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>
                                        {stage || 'Video işleniyor...'}
                                    </span>
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                                        {transcodeProgress}%
                                    </span>
                                </div>
                                <div style={{
                                    height: '4px',
                                    background: 'rgba(255,255,255,0.08)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${transcodeProgress}%`,
                                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>
                                    Video cihazınızda farklı kalitelere dönüştürülüyor. Sayfayı kapatmayın.
                                </p>
                            </div>
                        )}

                        {mediaPreview && (
                            <div className="media-preview">
                                {mediaPreview.isPdf ? (
                                    <div className="pdf-upload-preview" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)',
                                        color: '#fff',
                                        position: 'relative',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div className="pdf-icon" style={{
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#f87171',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>PDF</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600 }}>{mediaPreview.name}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{(mediaPreview.size / (1024 * 1024)).toFixed(2)} MB</div>
                                        </div>
                                        <button type="button" onClick={removeMedia} className="remove-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <img src={mediaPreview} alt="Preview" />
                                        <button type="button" onClick={removeMedia} className="remove-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="media-options">
                            <label className="media-btn">
                                <input
                                    type="file"
                                    accept="image/*,video/*,.gif,.pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    disabled={isTranscoding}
                                />
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>Fotoğraf / Video</span>
                            </label>
                            <label className="media-btn">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    disabled={isTranscoding}
                                />
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                <span>PDF Belgesi</span>
                            </label>
                            <label className="media-btn">
                                <input
                                    type="file"
                                    accept="image/gif"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    disabled={isTranscoding}
                                />
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>GIF</span>
                            </label>
                            <button
                                type="button"
                                className="media-btn"
                                onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                                disabled={isTranscoding}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
                                </svg>
                                <span>YouTube</span>
                            </button>
                        </div>

                        {showYoutubeInput && (
                            <div className="youtube-input-container">
                                <input
                                    type="text"
                                    placeholder="YouTube video bağlantısını yapıştırın..."
                                    value={youtubeUrl}
                                    onChange={handleYoutubeChange}
                                    className="url-input"
                                    autoFocus
                                />
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreatePost;
