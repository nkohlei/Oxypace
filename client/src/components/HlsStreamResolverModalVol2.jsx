import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Film, Play, Link2, AlertCircle, CheckCircle2, Clipboard, ArrowRight } from 'lucide-react';
import './HlsStreamResolverModalVol2.css';

export const HlsStreamResolverModalVol2 = ({ isOpen, onClose, onStartWatchParty }) => {
  const [url, setUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resolvedData, setResolvedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setIsResolving(false);
      setResolvedData(null);
      setErrorMsg(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateUrl = (rawUrl) => {
    if (!rawUrl) return false;
    return /^https?:\/\/.+/i.test(rawUrl.trim());
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setErrorMsg(null);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleResolve = async (e) => {
    if (e) e.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setErrorMsg('Lütfen bir film, dizi veya video sayfa bağlantısı girin.');
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      setErrorMsg('Lütfen geçerli bir web bağlantısı (http:// veya https://) girin.');
      return;
    }

    setIsResolving(true);
    setErrorMsg(null);
    setResolvedData(null);
    setElapsedMs(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    try {
      // 1. Direct stream URL bypass (.m3u8, .mp4, master.txt)
      const lower = trimmedUrl.toLowerCase();
      if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
        clearInterval(timerRef.current);
        const playableUrl = `/api/proxy?url=${encodeURIComponent(trimmedUrl)}`;
        const result = {
          streamUrl: trimmedUrl,
          playableStreamUrl: playableUrl,
          type: lower.endsWith('.mp4') ? 'mp4' : 'm3u8',
          pageTitle: 'Doğrudan Akış Bağlantısı',
          resolvedIn: Date.now() - startTime,
        };
        setResolvedData(result);
        setIsResolving(false);
        return;
      }

      // 2. Call backend Stream Resolver Microservice bridge
      const response = await axios.post('/api/resolve-stream', {
        url: trimmedUrl,
        timeout: 45000,
      });

      clearInterval(timerRef.current);

      if (response.data && response.data.success) {
        setResolvedData(response.data);
      } else {
        setErrorMsg(
          response.data?.error ||
            'Bu kaynaktan oynatılabilir video akışı alınamadı. Lütfen alternatif bir kaynak bağlantısı deneyin.'
        );
      }
    } catch (err) {
      clearInterval(timerRef.current);
      const serverErr = err.response?.data?.error || err.message;
      if (err.response?.status === 404) {
        setErrorMsg('Bu film sayfasında otomatik video ayrıştırılamadı. Sitedeki oynatıcının üzerine sağ tıklayıp "Çerçeve Bağlantısını Kopyala" (Embed URL) yaparak doğrudan oynatıcı linkini yapıştırabilirsiniz.');
      } else if (err.code === 'ECONNABORTED' || err.response?.status === 408) {
        setErrorMsg('Sayfa yanıt vermedi (zaman aşımı). Lütfen bağlantıyı kontrol edin.');
      } else {
        setErrorMsg(serverErr || 'Çözümleme sırasında bir hata oluştu. Lütfen bağlantıyı kontrol edin.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleStartInRoom = () => {
    if (!resolvedData?.playableStreamUrl) return;
    if (onStartWatchParty) {
      onStartWatchParty(resolvedData.playableStreamUrl);
      onClose();
    }
  };

  const modalContent = (
    <div className="vol2-resolver-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vol2-resolver-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vol2-resolver-header">
          <div className="vol2-header-title-wrap">
            <div className="vol2-header-icon-box">
              <Film size={18} />
            </div>
            <h3 className="vol2-header-title">HLS Video Oynatıcı Vol 2</h3>
            <span className="vol2-header-badge">Resolver Engine</span>
          </div>
          <button className="vol2-close-btn" onClick={onClose} title="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="vol2-resolver-body">
          <p className="vol2-description">
            Üçüncü taraf film veya dizi sitesi sayfa bağlantısını yapıştırın. Sistem akış URL'sini (`.m3u8` / `.mp4`) otomatik çözecek ve odada senkronize başlatacaktır.
          </p>

          {/* Input Box */}
          <form className="vol2-input-group" onSubmit={handleResolve}>
            <label className="vol2-input-label">Hedef Sayfa veya Akış Bağlantısı</label>
            <div className={`vol2-input-box ${errorMsg ? 'error' : ''}`}>
              <div className="vol2-input-icon">
                <Link2 size={16} />
              </div>
              <input
                type="text"
                className="vol2-input-field"
                placeholder="https://hdfilmcehennemi... veya https://.../master.m3u8"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isResolving}
                autoFocus
              />
              <button
                type="button"
                className="vol2-paste-btn"
                onClick={handlePaste}
                title="Panodan Yapıştır"
                disabled={isResolving}
              >
                <Clipboard size={12} />
                Yapıştır
              </button>
            </div>
          </form>

          {/* Loading Indicator */}
          {isResolving && (
            <div className="vol2-loading-box">
              <div className="vol2-loading-header">
                <span className="vol2-loading-text">
                  <div className="vol2-spinner" />
                  Film kaynağı çözümleniyor, lütfen bekleyin...
                </span>
                <span className="vol2-loading-timer">{(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="vol2-progress-bar-bg">
                <div className="vol2-progress-bar-fill" />
              </div>
            </div>
          )}

          {/* Success Card */}
          {!isResolving && resolvedData && (
            <div className="vol2-result-box">
              <div className="vol2-result-header">
                <div className="vol2-result-title-group">
                  <h4 className="vol2-result-title">
                    {resolvedData.pageTitle || 'Video Akışı Başarıyla Çözümlendi'}
                  </h4>
                  <p className="vol2-result-url-sub">{resolvedData.streamUrl}</p>
                </div>
                <CheckCircle2 size={20} color="#3fb950" style={{ flexShrink: 0 }} />
              </div>

              <div className="vol2-result-meta">
                <span className="vol2-meta-tag success">Hazır</span>
                <span className="vol2-meta-tag">Format: {resolvedData.type?.toUpperCase() || 'HLS'}</span>
                {resolvedData.resolvedIn > 0 && (
                  <span className="vol2-meta-tag">{resolvedData.resolvedIn} ms</span>
                )}
                {resolvedData.cached && <span className="vol2-meta-tag">Önbellekten</span>}
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isResolving && errorMsg && (
            <div className="vol2-error-box">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="vol2-resolver-footer">
          <button type="button" className="vol2-btn vol2-btn-secondary" onClick={onClose}>
            İptal
          </button>

          {!resolvedData ? (
            <button
              type="button"
              className="vol2-btn vol2-btn-action"
              onClick={handleResolve}
              disabled={isResolving || !url.trim()}
            >
              {isResolving ? (
                <>
                  <div className="vol2-spinner" />
                  Çözümleniyor...
                </>
              ) : (
                <>
                  Kaynağı Çözümle
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="vol2-btn vol2-btn-primary"
              onClick={handleStartInRoom}
            >
              <Play size={15} fill="currentColor" />
              Odadaki Herkes İçin Başlat
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default HlsStreamResolverModalVol2;
