import { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Strict IntersectionObserver Autoplay (Ekran Gözüktüğü An!) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Kesinlikle ses açık ve özellikleri sabit
    video.muted = false;
    video.volume = 1;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            // %50 ekrana girdiğinde patlat (Otomatik Oynat)
            video.play().catch(() => {
                // Tarayıcı sessizce engellerse bile ekranda çirkin butonlar GÖSTERME.
                // Sadece arkada bekler, kullanıcı her an sayfa kaydırdığında tekrar dener.
            });
        } else {
            // Ekrandan çıkınca durdur ("Kendi kendine duruyor" sorununun tek kontrollü yeri)
            video.pause();
        }
      });
    }, { threshold: 0.5 }); // %50 görünürlük sınırı

    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  // Zaman İlerleyişini Yakalama (Bar için)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  // Bara Tıklayıp İleri Sarma
  const handleScrub = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedProgress = x / rect.width;
    const newTime = clickedProgress * duration;
    videoRef.current.currentTime = newTime;
    setProgress(clickedProgress * 100);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`native-player-container left-aligned v16-scale ${className || ''}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="native-video-element"
        playsInline
        loop // Otomatik tekrar!
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* SADECE Alttaki Süre ve Bar Arayüzü (Tertemiz) */}
      <div className="native-controls-ui is-always-visible">
        <div className="native-progress-area" onClick={handleScrub}>
          <div className="native-progress-track">
            <div className="native-progress-fill" style={{ width: `${progress}%` }}>
              <div className="native-progress-thumb" />
            </div>
          </div>
        </div>

        <div className="native-bottom-row">
          <div className="native-time-display">
            <span>{formatTime(currentTime)}</span>
            <span className="native-time-sep">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
