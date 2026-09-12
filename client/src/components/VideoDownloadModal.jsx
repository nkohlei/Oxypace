import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Film } from 'lucide-react';
import './VideoDownloadModal.css';

const VideoDownloadModal = ({ isOpen, onClose, post, onDownload }) => {
  if (!isOpen || !post) return null;

  const qualities = post.videoQualities || {};
  const options = [];

  const url720 = post.video720 || qualities.video720 || qualities.p720 || qualities['720p'];
  const url360 = post.video360 || qualities.video360 || qualities.p360 || qualities['360p'];
  const url144 = post.video144 || qualities.video144 || qualities.p144 || qualities['144p'];
  const url1080 = post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'];
  const url2160 = post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p'];

  // 2160p (4K), 1080p (Full HD), 720p (HD), 360p (SD), 144p (Low)
  if (url2160 && typeof url2160 === 'string' && url2160.trim()) {
    options.push({ label: '4K Ultra HD (2160p)', value: '2160', url: url2160 });
  }

  if (url1080 && typeof url1080 === 'string' && url1080.trim() && url1080 !== url2160) {
    options.push({ label: 'Full HD (1080p)', value: '1080', url: url1080 });
  }

  if (url720 && typeof url720 === 'string' && url720.trim() && url720 !== url1080 && url720 !== url2160) {
    options.push({ label: 'HD Kalite (720p)', value: '720', url: url720 });
  }

  if (url360 && typeof url360 === 'string' && url360.trim() && url360 !== url720) {
    options.push({ label: 'Standart Kalite (360p)', value: '360', url: url360 });
  }

  if (url144 && typeof url144 === 'string' && url144.trim() && url144 !== url360) {
    options.push({ label: 'Düşük Kalite (144p)', value: '144', url: url144 });
  }

  // Fallback if no specific quality URL was matched
  if (options.length === 0) {
    const rawUrl = url1080 || url2160 || post.videoUrl || (Array.isArray(post.media) ? post.media[0] : post.media);
    if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
      options.push({ label: 'Orijinal Kalite', value: 'original', url: rawUrl });
    }
  }

  const handleSelect = (url, label) => {
    onDownload(url, label);
    onClose();
  };

  const modalContent = (
    <div className="download-modal-overlay" onClick={onClose}>
      <div className="download-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="download-modal-header">
          <div className="header-title-box">
            <Film className="film-icon" size={18} />
            <h3>Video Kalitesi</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
        
        <div className="download-modal-body">
          <p className="download-modal-subtitle">İndirmek istediğiniz kaliteyi seçin:</p>
          <div className="quality-options-list">
            {options.map((opt) => (
              <button
                key={opt.value}
                className="quality-option-btn"
                onClick={() => handleSelect(opt.url, opt.label)}
              >
                <span className="opt-label">{opt.label}</span>
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
