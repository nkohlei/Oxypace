import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Film, Sparkles, FileVideo } from 'lucide-react';
import './VideoDownloadModal.css';

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

  const qualities = post.videoQualities || {};
  const url720 = post.video720 || qualities.video720 || qualities.p720 || qualities['720p'];
  const url360 = post.video360 || qualities.video360 || qualities.p360 || qualities['360p'];
  const url144 = post.video144 || qualities.video144 || qualities.p144 || qualities['144p'];
  const url1080 = post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'];
  const url2160 = post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p'];
  const rawMedia = Array.isArray(post.media) ? post.media[0] : (post.media || post.videoUrl);

  const options = [];

  if (activeFormat === 'mp4') {
    // Evrensel MP4 (H.264 / AAC) - Galeri Uyumlu
    if (url1080 && typeof url1080 === 'string' && url1080.trim()) {
      options.push({
        label: 'Full HD (1080p)',
        sublabel: 'Evrensel MP4 • H.264 + AAC',
        value: '1080',
        url: url1080,
        badge: 'Önerilen'
      });
    }

    if (url720 && typeof url720 === 'string' && url720.trim() && url720 !== url1080) {
      options.push({
        label: 'HD Kalite (720p)',
        sublabel: 'Evrensel MP4 • H.264 + AAC',
        value: '720',
        url: url720,
        badge: !url1080 ? 'Önerilen' : null
      });
    }

    if (url360 && typeof url360 === 'string' && url360.trim() && url360 !== url720) {
      options.push({
        label: 'Standart Kalite (360p)',
        sublabel: 'Evrensel MP4 • Hızlı İndirme',
        value: '360',
        url: url360
      });
    }

    if (url144 && typeof url144 === 'string' && url144.trim() && url144 !== url360) {
      options.push({
        label: 'Düşük Kalite (144p)',
        sublabel: 'Evrensel MP4 • Veri Tasarrufu',
        value: '144',
        url: url144
      });
    }

    // Fallback if transcoding not completed yet
    if (options.length === 0 && rawMedia) {
      options.push({
        label: 'Standart Kalite',
        sublabel: 'Evrensel MP4',
        value: 'default',
        url: rawMedia,
        badge: 'Hazır'
      });
    }
  } else {
    // Orijinal Ham Biçim (AV1 / Kaynak Kalite / VLC İçin)
    if (url2160 && typeof url2160 === 'string' && url2160.trim()) {
      options.push({
        label: '4K Ultra HD (2160p)',
        sublabel: 'Orijinal Kaynak • AV1 / Ham Kalite',
        value: '2160',
        url: url2160,
        badge: 'Ham Kalite'
      });
    }

    if (url1080 && typeof url1080 === 'string' && url1080.trim() && url1080 !== url2160) {
      options.push({
        label: 'Full HD (1080p)',
        sublabel: 'Orijinal Kaynak Kalitesi',
        value: '1080-orig',
        url: url1080,
        badge: !url2160 ? 'Ham Kalite' : null
      });
    }

    if (rawMedia && options.length === 0) {
      options.push({
        label: 'Orijinal Kaynak Dosya',
        sublabel: 'Yüklenen Ham Video',
        value: 'original-raw',
        url: rawMedia,
        badge: 'Kaynak'
      });
    }
  }

  const handleSelect = (url, label) => {
    onDownload(url, label, activeFormat);
    onClose();
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
            onClick={() => setActiveFormat('mp4')}
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
            onClick={() => setActiveFormat('original')}
          >
            <FileVideo size={14} className="format-tab-icon" />
            <div className="format-tab-text">
              <span className="format-tab-title">Orijinal Ham</span>
              <span className="format-tab-sub">Kaynak • AV1 / VLC</span>
            </div>
          </button>
        </div>

        <div className="download-modal-body">
          <p className="download-modal-subtitle">
            {activeFormat === 'mp4'
              ? 'Tüm cihazların varsayılan galerisinde sorunsuz açılır:'
              : 'Ham kaynak video; VLC veya gelişmiş oynatıcılar için uygundur:'}
          </p>

          <div className="quality-options-list">
            {options.map((opt) => (
              <button
                key={opt.value}
                className="quality-option-btn"
                onClick={() => handleSelect(opt.url, opt.label)}
              >
                <div className="opt-text-col">
                  <div className="opt-title-row">
                    <span className="opt-label">{opt.label}</span>
                    {opt.badge && <span className="opt-badge-pill">{opt.badge}</span>}
                  </div>
                  {opt.sublabel && <span className="opt-sublabel">{opt.sublabel}</span>}
                </div>
                <Download className="opt-download-icon" size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default VideoDownloadModal;
