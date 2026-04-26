import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGlobalStore } from '../store/useGlobalStore';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const { isMuted, setIsMuted } = useGlobalStore();
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Gerçek zamanlı donma/yüklenme sensörü
  const [isLoading, setIsLoading] = useState(true);

  // --- Strict IntersectionObserver Autoplay ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Kesinlikle ses ayarlarını global store'a göre yap
    video.muted = isMuted;
    video.volume = 1;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Ekrana girdiğinde direkt oynamasını emret! (Sadece kullanıcı KENDİ DURDURMADIYSA)
            if (video.dataset.userPaused !== "true") {
                video.muted = isMuted;
                video.play().catch(() => {});
            }
        } else {
            // Videodan çıkıldığında otomatik durdur. Ama kullanıcının özel kararını sıfırlama,
            // böylece durdurup giden adam geldiğinde tekrar başlamaması sağlanır.
            if (video.dataset.userPaused !== "true") {
                video.pause();
            }
        }
      });
    }, { threshold: 0.5 }); // %50 görünüm oranı

    observer.observe(video);
    
    return () => {
      observer.disconnect();
    };
  }, [src, isMuted]);

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

  // Videoya Direk Tıklayıp Durdurma/Oynatma
  const handleVideoClick = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
        videoRef.current.dataset.userPaused = "false";
        videoRef.current.play().catch(()=>{});
    } else {
        videoRef.current.dataset.userPaused = "true";
        videoRef.current.pause();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
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
        loop
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        // Gerçek Ağ & Yükleme Sensörleri
        onWaiting={() => setIsLoading(true)}
        onLoadStart={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
      />

      {/* Global Mute/Unmute Toggle Button */}
      <button 
        className="native-mute-toggle" 
        onClick={toggleMute}
        title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* GERÇEK YÜKLENİYOR ANİMASYONU */}
      {isLoading && (
        <div className="native-loader-overlay">
            <div className="pro-spinner"></div>
        </div>
      )}

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
