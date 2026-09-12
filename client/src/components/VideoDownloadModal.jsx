import React from 'react';
import { X, Download, Film } from 'lucide-react';
import './VideoDownloadModal.css';

const VideoDownloadModal = ({ isOpen, onClose, post, onDownload }) => {
  if (!isOpen || !post) return null;

  const qualities = post.videoQualities || {};
  const options = [];

  // 1. 4K (2160p)
  const url2160 = post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p'];
  if (url2160 && typeof url2160 === 'string' && url2160.trim()) {
    options.push({ label: '4K (2160p)', value: '2160', url: url2160 });
  }

  // 2. Full HD (1080p)
  const url1080 = post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'];
  if (url1080 && typeof url1080 === 'string' && url1080.trim()) {
    options.push({ label: 'Full HD (1080p)', value: '1080', url: url1080 });
  }

  // 3. HD (720p)
  const url720 = post.video720 || qualities.video720 || qualities.p720 || qualities['720p'];
  if (url720 && typeof url720 === 'string' && url720.trim()) {
    options.push({ label: 'HD (720p)', value: '720', url: url720 });
  }

  // 4. SD (360p)
  const url360 = post.video360 || qualities.video360 || qualities.p360 || qualities['360p'];
  if (url360 && typeof url360 === 'string' && url360.trim()) {
    options.push({ label: 'SD (360p)', value: '360', url: url360 });
  }

  // 5. Düşük (144p)
  const url144 = post.video144 || qualities.video144 || qualities.p144 || qualities['144p'];
  if (url144 && typeof url144 === 'string' && url144.trim()) {
    options.push({ label: 'Düşük (144p)', value: '144', url: url144 });
  }

  // Fallback: If no transcoded qualities are listed yet, use post media / videoUrl directly
  if (options.length === 0) {
    const rawUrl = post.videoUrl || (Array.isArray(post.media) ? post.media[0] : post.media);
    if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
      options.push({ label: 'Standart Kalite', value: 'original', url: rawUrl });
    }
  }

  const handleSelect = (url, label) => {
    onDownload(url, label);
    onClose();
  };

  return (
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
};

export default VideoDownloadModal;
