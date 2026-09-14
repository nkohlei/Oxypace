import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Film, Sparkles, FileVideo, AlertCircle, Clock } from 'lucide-react';
import './VideoDownloadModal.css';

// Kalite seviyelerine karşılık gelen gerçek çözünürlük bilgileri
const RESOLUTION_MAP = {
  '2160': '3840×2160',
  '1080': '1920×1080',
  '720':  '1280×720',
  '360':  '640×360',
  '144':  '256×144',
};

const VideoDownloadModal = ({ isOpen, onClose, post, onDownload }) => {
  if (!isOpen || !post) return null;

  // Initialize format from localStorage or default to 'mp4' (Evrensel MP4)
  const defaultFormatPref = (() => {
    try {
      const saved = localStorage.getItem('video_download_format');
      return saved === 'original' ? 'original' : 'mp4';
    } catch {
      return 'mp4';
    }
  })();

  const [activeFormat, setActiveFormat] = useState(defaultFormatPref);

  const isProcessing = !!post.isProcessing;
  const processingProgress = post.processingProgress || 0;

  const qualities = post.videoQualities || {};

  // URL çözümleyici — boş string veya sadece boşluk içerenleri geçersiz sayıyoruz
  const validUrl = (u) => u && typeof u === 'string' && u.trim().length > 0;

  const url720  = validUrl(post.video720)  ? post.video720  : (validUrl(qualities.video720)  ? qualities.video720  : (validUrl(qualities.p720)  ? qualities.p720  : null));
  const url360  = validUrl(post.video360)  ? post.video360  : (validUrl(qualities.video360)  ? qualities.video360  : (validUrl(qualities.p360)  ? qualities.p360  : null));
  const url144  = validUrl(post.video144)  ? post.video144  : (validUrl(qualities.video144)  ? qualities.video144  : (validUrl(qualities.p144)  ? qualities.p144  : null));
  const url1080 = validUrl(post.video1080) ? post.video1080 : (validUrl(qualities.video1080) ? qualities.video1080 : (validUrl(qualities.p1080) ? qualities.p1080 : null));
  const url2160 = validUrl(post.video2160) ? post.video2160 : (validUrl(qualities.video2160) ? qualities.video2160 : (validUrl(qualities.p2160) ? qualities.p2160 : null));
  const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || post.videoUrl);

  // Gerçekten transcode edilmiş kalite seçeneklerini oluştur
  const options = [];

  if (activeFormat === 'mp4') {
    // Evrensel MP4 (H.264 / AAC) - Galeri Uyumlu
    // SADECE transcode tamamlanmış URL'leri göster — boş alanlar = transcode henüz bitmedi
    if (url1080) {
      options.push({
        label: 'Full HD (1080p)',
        sublabel: 'Evrensel MP4 • H.264 + AAC',
        resolution: RESOLUTION_MAP['1080'],
        value: '1080',
        url: url1080,
        badge: 'Önerilen'
      });
    }

    if (url720 && url720 !== url1080) {
      options.push({
        label: 'HD Kalite (720p)',
        sublabel: 'Evrensel MP4 • H.264 + AAC',
        resolution: RESOLUTION_MAP['720'],
        value: '720',
        url: url720,
        badge: !url1080 ? 'Önerilen' : null
      });
    }

    if (url360 && url360 !== url720) {
      options.push({
        label: 'Standart Kalite (360p)',
        sublabel: 'Evrensel MP4 • Hızlı İndirme',
        resolution: RESOLUTION_MAP['360'],
        value: '360',
        url: url360
      });
    }

    if (url144 && url144 !== url360) {
      options.push({
        label: 'Düşük Kalite (144p)',
        sublabel: 'Evrensel MP4 • Veri Tasarrufu',
        resolution: RESOLUTION_MAP['144'],
        value: '144',
        url: url144
      });
    }

    // MP4 sekmesinde ham (transcode edilmemiş) dosyayı asla fallback olarak sunmuyoruz.
    // Transcode sürüyorsa işlenme uyarısı gösterilecek (aşağıda).

  } else {
    // Orijinal Ham Biçim (AV1 / Kaynak Kalite / VLC İçin)
    if (url2160) {
      options.push({
        label: '4K Ultra HD (2160p)',
        sublabel: 'Orijinal Kaynak • H.264 (Transcode Edilmiş)',
        resolution: RESOLUTION_MAP['2160'],
        value: '2160',
        url: url2160,
        badge: 'Ham Kalite'
      });
    }

    if (url1080 && url1080 !== url2160) {
      options.push({
        label: 'Full HD (1080p)',
        sublabel: 'Orijinal Kaynak Kalitesi',
        resolution: RESOLUTION_MAP['1080'],
        value: '1080-orig',
        url: url1080,
        badge: !url2160 ? 'Ham Kalite' : null
      });
    }

    // Orijinal sekmesinde ham kaynak dosyayı göster (VLC için)
    // Ama işlenme sürüyorsa açık uyarı ile
    if (rawMedia && options.length === 0) {
      options.push({
        label: 'Orijinal Kaynak Dosya',
        sublabel: isProcessing
          ? '⚠️ Henüz işlenmemiş ham video — galeri açamayabilir'
          : 'Yüklenen Ham Video',
        value: 'original-raw',
        url: rawMedia,
        badge: isProcessing ? 'İşleniyor' : 'Kaynak',
        isRaw: true
      });
    }
  }

  const handleSelect = (url, label) => {
    onDownload(url, label, activeFormat);
    onClose();
  };

  const handleFormatChange = (fmt) => {
    setActiveFormat(fmt);
    try { localStorage.setItem('video_download_format', fmt); } catch (_) {}
  };

  const modalContent = (
    <div className="download-modal-overlay" onClick={onClose}>
      <div className="download-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="download-modal-header">
          <div className="header-title-box">
            <Film className="film-icon" size={18} />
            <h3>Video İndir</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>

        {/* Format Switcher */}
        <div className="download-format-switcher">
          <button
            type="button"
            className={`format-tab-btn ${activeFormat === 'mp4' ? 'active' : ''}`}
            onClick={() => handleFormatChange('mp4')}
          >
            <Sparkles size={14} className="format-tab-icon" />
            <div className="format-tab-text">
              <span className="format-tab-title">Evrensel MP4</span>
              <span className="format-tab-sub">Önerilen • Galeri Uyumlu</span>
            </div>
          </button>
          <button
            type="button"
            className={`format-tab-btn ${activeFormat === 'original' ? 'active' : ''}`}
            onClick={() => handleFormatChange('original')}
          >
            <FileVideo size={14} className="format-tab-icon" />
            <div className="format-tab-text">
              <span className="format-tab-title">Orijinal Ham</span>
              <span className="format-tab-sub">Kaynak • VLC İçin</span>
            </div>
          </button>
        </div>

        <div className="download-modal-body">
          {/* İşlenme sürüyor uyarısı — MP4 sekmesinde kalite alanları henüz boşsa */}
          {isProcessing && activeFormat === 'mp4' && options.length === 0 && (
            <div className="download-processing-warning">
              <Clock size={16} className="processing-warn-icon" />
              <div className="processing-warn-text">
                <span className="processing-warn-title">Video işleniyor...</span>
                <span className="processing-warn-sub">
                  Kalite seçenekleri hazırlanıyor — %{processingProgress} tamamlandı.
                  İşlem bittiğinde indirme seçenekleri burada görünecek.
                </span>
              </div>
            </div>
          )}

          {/* İşlenme bitti ama hala seçenek yoksa (beklenmedik durum) */}
          {!isProcessing && activeFormat === 'mp4' && options.length === 0 && (
            <div className="download-processing-warning download-processing-warning--error">
              <AlertCircle size={16} className="processing-warn-icon" />
              <div className="processing-warn-text">
                <span className="processing-warn-title">Kalite seçenekleri bulunamadı</span>
                <span className="processing-warn-sub">
                  Ham biçim sekmesinden orijinal dosyayı indirebilirsiniz.
                </span>
              </div>
            </div>
          )}

          {options.length > 0 && (
            <>
              <p className="download-modal-subtitle">
                {activeFormat === 'mp4'
                  ? 'Tüm cihazların varsayılan galerisinde sorunsuz açılır (H.264 + AAC):'
                  : 'Ham kaynak video; VLC veya gelişmiş oynatıcılar için uygundur:'}
              </p>

              <div className="quality-options-list">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`quality-option-btn${opt.isRaw && isProcessing ? ' quality-option-btn--raw-warning' : ''}`}
                    onClick={() => handleSelect(opt.url, opt.label)}
                  >
                    <div className="opt-text-col">
                      <div className="opt-title-row">
                        <span className="opt-label">{opt.label}</span>
                        {opt.badge && <span className={`opt-badge-pill${opt.isRaw && isProcessing ? ' opt-badge-pill--warn' : ''}`}>{opt.badge}</span>}
                      </div>
                      {opt.resolution && (
                        <span className="opt-resolution">{opt.resolution}</span>
                      )}
                      {opt.sublabel && <span className="opt-sublabel">{opt.sublabel}</span>}
                    </div>
                    <Download className="opt-download-icon" size={15} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default VideoDownloadModal;
