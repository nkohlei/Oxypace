import { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

// --- HAYALET OYNATICI (STEALTH) GLOBAL MOTORU ---
// Chrome'un tekerlek kaydırmasına uyguladığı yasağı delme merkezi.
const activeVideos = new Set();
let hasInteractedGlobally = false;

if (typeof window !== 'undefined') {
  const stealthUnmuteHandler = () => {
    if (hasInteractedGlobally) return;
    hasInteractedGlobally = true;
    
    // Kullanıcı tesadüfen de olsa bir yere tıkladığı AN tüm videoların sesini aç!
    activeVideos.forEach(video => {
      if (video) {
        video.muted = false;
        video.volume = 1;
        // Eğer sessizde çalıyorsa tık diye sesi gelir.
      }
    });

    window.removeEventListener('mousedown', stealthUnmuteHandler, true);
    window.removeEventListener('touchstart', stealthUnmuteHandler, true);
    window.removeEventListener('keydown', stealthUnmuteHandler, true);
  };

  window.addEventListener('mousedown', stealthUnmuteHandler, { capture: true, passive: true });
  window.addEventListener('touchstart', stealthUnmuteHandler, { capture: true, passive: true });
  window.addEventListener('keydown', stealthUnmuteHandler, { capture: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Strict IntersectionObserver Autoplay & Fallback ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    activeVideos.add(video);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            
            // Eğer daha siteye tıklanmadıysa (Masaüstünde mouse tekerleğiyle gelindiğinde)
            if (!hasInteractedGlobally) {
                 // Önce şansımızı deneriz: Belki mobildedir ve touch scroll yapmıştır, sesli oynamaya izin verilir.
                 video.muted = false;
                 video.volume = 1;
                 
                 // Sesli başlat!
                 video.play().catch((e) => {
                     // Chrome dedi ki: "HAYIR Tıklamadı, sesli oynatamazsın!"
                     if (e.name === 'NotAllowedError') {
                          // HAYALET ÇÖZÜM: Videoyu donuk bırakmak yerine anında sesi kısıp oynat!
                          // Böylece video ekranda akar. İlk tıklandığında ses açılır.
                          video.muted = true;
                          video.play().catch(()=>{}); 
                     }
                 });
            } else {
                 // Zaten tıklanmış, tüm kilitler açık, direkt sesli başlat.
                 video.muted = false;
                 video.volume = 1;
                 video.play().catch(()=>{});
            }

        } else {
            // Videodan çıkıldığında otomatik durdur (Kendi kendine durma sorununun ilacı)
            video.pause();
        }
      });
    }, { threshold: 0.5 }); // %50 görünüm oranı

    observer.observe(video);
    
    return () => {
      observer.disconnect();
      activeVideos.delete(video);
    };
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
        loop
        crossOrigin="anonymous"
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
