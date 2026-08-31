import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Play, Film, Loader2, AlertCircle, Link as LinkIcon, Wifi, WifiOff, Sparkles, Monitor } from 'lucide-react';
import './HlsStreamResolverModal.css';

const LOCAL_RESOLVER = 'http://localhost:3001';
const BLOCKED_DOMAINS = ['hdfilmcehennemi', 'fullhdfilmizlesene', 'filmmakinesi', 'turkanime', 'dizipal', 'izlemax', 'yabancidizi', 'dizibox'];

const HlsStreamResolverModal = ({ isOpen, onClose, onStreamResolved }) => {
    const [targetUrl, setTargetUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState(null);
    const [localOnline, setLocalOnline] = useState(null); // null=checking, true=online, false=offline

    useEffect(() => {
        if (!isOpen) return;
        // Yerel resolver çalışıyor mu kontrol et
        fetch(`${LOCAL_RESOLVER}/health`, { signal: AbortSignal.timeout(2500) })
            .then(r => setLocalOnline(r.ok))
            .catch(() => setLocalOnline(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const isBlockedDomain = (url) => BLOCKED_DOMAINS.some(d => url.toLowerCase().includes(d));

    /**
     * Resolver'dan (local veya server) stream URL çöz
     */
    const resolveFromEndpoint = async (baseUrl, url, timeout) => {
        const endpoint = `${baseUrl}/api/resolve-stream`;
        const response = await axios.post(endpoint, { url, timeout }, { timeout: timeout + 5000 });
        return response.data;
    };

    const handleResolve = async (e) => {
        if (e) e.preventDefault();
        const trimmed = targetUrl.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setError(null);

        try {
            // 1. Direct HLS / MP4 link — doğrudan oynat
            const cleanUrl = trimmed.split('?')[0].split('#')[0].toLowerCase();
            const isDirectMedia =
                cleanUrl.endsWith('.m3u8') || cleanUrl.endsWith('.mp4') ||
                cleanUrl.endsWith('.mpd') || cleanUrl.includes('.m3u8') || cleanUrl.includes('/hls/');

            if (isDirectMedia) {
                if (onStreamResolved) onStreamResolved(trimmed, cleanUrl.includes('.m3u8') || cleanUrl.includes('/hls/'));
                onClose();
                return;
            }

            const needsLocalResolver = isBlockedDomain(trimmed);
            let data = null;

            // 2a. Cloudflare korumalı domain → önce YEREL resolver dene
            if (needsLocalResolver && localOnline) {
                setLoadingStep('🖥️ Yerel çözücü kullanılıyor (ev IP\'si ile)...');
                try {
                    data = await resolveFromEndpoint(LOCAL_RESOLVER, trimmed, 40000);
                } catch (localErr) {
                    console.warn('[Resolver] Yerel resolver başarısız:', localErr.message);
                    data = null;
                }
            }

            // 2b. Yerel resolver yoksa veya başarısız olduysa → sunucu resolver
            if (!data || !data.success || !data.streamUrl) {
                if (needsLocalResolver && !localOnline) {
                    setLoadingStep('⚠️ Yerel çözücü çevrimdışı, sunucu deneniyor...');
                } else {
                    setLoadingStep('☁️ Sunucu ile stream çözümleniyor...');
                }
                try {
                    const res = await axios.post('/api/media/resolve-stream', { url: trimmed, timeout: 35000 });
                    data = res.data;
                } catch (serverErr) {
                    data = null;
                }
            }

            // 3. Sonucu değerlendir
            if (data && data.success && data.streamUrl) {
                const { streamUrl, headers } = data;
                const refererHeader = headers?.referer || headers?.Referer || '';
                const originHeader = headers?.origin || headers?.Origin || '';
                const finalStreamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(refererHeader)}&origin=${encodeURIComponent(originHeader)}`;
                if (onStreamResolved) onStreamResolved(finalStreamUrl, true);
                onClose();
                return;
            }

            // 4. Her iki yöntem de başarısız
            if (needsLocalResolver && !localOnline) {
                setError('❌ Bu site Cloudflare ile korunmakta (sunucu IP\'si engellenmiş). Yerel çözücüyü başlatın:\n\n1. oxypace-stream-resolver klasörünü açın\n2. "start.bat" veya "npm start" çalıştırın\n3. Tekrar deneyin');
            } else {
                setError('Bu sayfadaki video akışı korumalı veya çözülemedi. Doğrudan .m3u8 veya .mp4 bağlantısı deneyin.');
            }

        } catch (err) {
            console.error('[HlsStreamResolverModal] Error:', err);
            setError(err.response?.data?.error || err.message || 'Stream çözülürken hata oluştu.');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
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

                    {/* Yerel Resolver Durumu */}
                    <div className="stream-resolver-local-status">
                        {localOnline === null && (
                            <span className="local-status-checking">
                                <Loader2 size={12} className="spinner" /> Yerel çözücü kontrol ediliyor...
                            </span>
                        )}
                        {localOnline === true && (
                            <span className="local-status-online">
                                <Monitor size={12} /> Yerel Çözücü Aktif — Cloudflare korumalı siteler açılabilir ✓
                            </span>
                        )}
                        {localOnline === false && (
                            <span className="local-status-offline">
                                <WifiOff size={12} /> Yerel çözücü çevrimdışı — Sadece engellenmeyen siteler çalışır
                            </span>
                        )}
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
                                    <span>{loadingStep || 'Akış Çözümleniyor...'}</span>
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
