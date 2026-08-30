import React, { useState } from 'react';
import axios from 'axios';
import { X, Play, Film, Loader2, AlertCircle, Link as LinkIcon, ExternalLink, Sparkles } from 'lucide-react';
import './HlsStreamResolverModal.css';

const HlsStreamResolverModal = ({ isOpen, onClose, onStreamResolved }) => {
    const [targetUrl, setTargetUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resolvedData, setResolvedData] = useState(null);

    if (!isOpen) return null;

    const handleResolve = async (e) => {
        if (e) e.preventDefault();
        const trimmed = targetUrl.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setError(null);
        setResolvedData(null);

        try {
            // 1. Direct HLS or MP4 check
            const cleanUrl = trimmed.split('?')[0].split('#')[0].toLowerCase();
            const isDirectMedia = cleanUrl.endsWith('.m3u8') || cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mpd') || cleanUrl.includes('.m3u8') || cleanUrl.includes('/hls/');

            if (isDirectMedia) {
                // Direct stream link, no scraping needed
                if (onStreamResolved) {
                    onStreamResolved(trimmed, cleanUrl.endsWith('.m3u8') || cleanUrl.includes('.m3u8') || cleanUrl.includes('/hls/'));
                }
                onClose();
                return;
            }

            // 2. Call backend Stream Resolver proxy endpoint
            const response = await axios.post('/api/media/resolve-stream', {
                url: trimmed,
                timeout: 35000
            });

            if (response.data && response.data.success && response.data.streamUrl) {
                const { streamUrl, headers, type, pageTitle } = response.data;
                
                // Form proxy URL for CORS / Referer bypass if needed
                const refererHeader = headers?.referer || headers?.Referer || '';
                const originHeader = headers?.origin || headers?.Origin || '';
                
                // Construct stream proxy URL (stream resolver proxy running locally/hosted)
                const streamResolverBase = (import.meta.env.VITE_STREAM_RESOLVER_URL || 'http://localhost:3001').replace(/\/$/, '');
                const finalStreamUrl = `${streamResolverBase}/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(refererHeader)}&origin=${encodeURIComponent(originHeader)}`;

                setResolvedData({
                    streamUrl: finalStreamUrl,
                    rawUrl: streamUrl,
                    pageTitle: pageTitle || 'Video Akışı',
                    type: type || 'm3u8'
                });

                // Trigger Watch Party
                if (onStreamResolved) {
                    onStreamResolved(finalStreamUrl, true);
                }
                
                onClose();
            } else {
                setError(response.data?.error || 'Sayfada oynatılabilir bir video akışı bulunamadı.');
            }
        } catch (err) {
            console.error('[HlsStreamResolverModal] Error resolving stream:', err);
            const errMsg = err.response?.data?.error || err.message || 'Stream çözülürken bir hata oluştu. Lütfen bağlantıyı kontrol edin.';
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) setTargetUrl(text);
        } catch (err) {
            console.warn("Clipboard access denied", err);
        }
    };

    return (
        <div className="stream-resolver-modal-overlay" onClick={onClose}>
            <div className="stream-resolver-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="stream-resolver-modal-header">
                    <div className="stream-resolver-header-title">
                        <div className="stream-resolver-icon-badge">
                            <Film size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h3>HLS Akış & Film Çözücü</h3>
                            <p>Hdfilmcehennemi, Vidmoly, Filmmakinesi ve tüm video bağlantıları</p>
                        </div>
                    </div>
                    <button className="stream-resolver-close-btn" onClick={onClose} title="Kapat">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleResolve} className="stream-resolver-modal-body">
                    <div className="stream-resolver-input-group">
                        <label>Film, Dizi veya Video Sayfası URL'si</label>
                        <div className="stream-resolver-input-wrapper">
                            <LinkIcon size={16} className="stream-input-icon" />
                            <input 
                                type="url" 
                                placeholder="https://www.hdfilmcehennemi.life/... veya .m3u8 linki" 
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                autoFocus
                                disabled={isLoading}
                            />
                            {targetUrl ? (
                                <button 
                                    type="button" 
                                    className="stream-input-clear-btn"
                                    onClick={() => setTargetUrl('')}
                                    disabled={isLoading}
                                >
                                    <X size={14} />
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    className="stream-input-paste-btn"
                                    onClick={handlePaste}
                                    title="Panodan Yapıştır"
                                    disabled={isLoading}
                                >
                                    Yapıştır
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Features Note */}
                    <div className="stream-resolver-feature-pills">
                        <span className="feature-pill">
                            <Sparkles size={12} /> Otomatik HLS Ayıklama
                        </span>
                        <span className="feature-pill">
                            🛡️ CORS & Referer Koruması
                        </span>
                        <span className="feature-pill">
                            👥 Eşzamanlı İzleme
                        </span>
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="stream-resolver-error-box">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="stream-resolver-actions">
                        <button 
                            type="button" 
                            className="stream-resolver-btn-cancel"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            İptal
                        </button>
                        <button 
                            type="submit" 
                            className="stream-resolver-btn-submit"
                            disabled={!targetUrl.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    <span>Akış Çözümleniyor...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={16} fill="currentColor" />
                                    <span>Oynat & Odaya Başlat</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HlsStreamResolverModal;
