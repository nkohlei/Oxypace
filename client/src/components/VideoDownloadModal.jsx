import React from 'react';
import { X, Download, Film } from 'lucide-react';
import './VideoDownloadModal.css';

const VideoDownloadModal = ({ isOpen, onClose, post, onDownload }) => {
  if (!isOpen || !post) return null;

  const qualities = post.videoQualities || {};
  const has2160 = !!(post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p']);
  const has1080 = !!(post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'] || post.videoOriginal || qualities.videoOriginal || qualities.high || post.videoUrl);
  const has720  = !!(post.video720  || qualities.video720  || qualities.p720  || qualities['720p']);
  const has360  = !!(post.video360  || qualities.video360  || qualities.p360  || qualities['360p']);
  const has144  = !!(post.video144  || qualities.video144  || qualities.p144  || qualities['144p']);

  const src144  = post.video144  || qualities.video144  || qualities.p144  || qualities['144p']  || qualities.low || post.lowVideoUrl || post.media;
  const src360  = post.video360  || qualities.video360  || qualities.p360  || qualities['360p']  || src144;
  const src720  = post.video720  || qualities.video720  || qualities.p720  || qualities['720p']  || src360;
  const src1080 = post.video1080 || qualities.video1080 || qualities.p1080 || qualities['1080p'] || post.videoOriginal || qualities.videoOriginal || qualities.high || post.videoUrl || post.media;
  const src2160 = post.video2160 || qualities.video2160 || qualities.p2160 || qualities['2160p'] || src1080;

  const options = [];
  if (has2160) options.push({ label: '4K (2160p)', value: '2160', url: src2160 });
  if (has1080) options.push({ label: 'Full HD (1080p)', value: '1080', url: src1080 });
  if (has720)  options.push({ label: 'HD (720p)', value: '720', url: src720 });
  if (has360)  options.push({ label: 'SD (360p)', value: '360', url: src360 });
  if (has144)  options.push({ label: 'Mobil (144p)', value: '144', url: src144 });

  // If no transcoded qualities are detected, offer original file
  if (options.length === 0 && post.media) {
    options.push({ label: 'Orijinal Kalite', value: 'original', url: post.media });
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
            <Film className="film-icon" size={20} />
            <h3>İndirme Kalitesi Seçin</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        
        <div className="download-modal-body">
          <p className="download-modal-subtitle">Bu video için mevcut olan kaliteler listelenmiştir:</p>
          <div className="quality-options-list">
            {options.map((opt) => (
              <button
                key={opt.value}
                className="quality-option-btn"
                onClick={() => handleSelect(opt.url, opt.label)}
              >
                <span className="opt-label">{opt.label}</span>
                <Download className="opt-download-icon" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDownloadModal;
