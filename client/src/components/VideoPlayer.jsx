import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Settings, Check, ChevronRight, Gauge, Activity } from 'lucide-react';
import { useGlobalStore } from '../store/useGlobalStore';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className, qualities = null }) => {
  const videoRef = useRef(null);
  const { isMuted, setIsMuted } = useGlobalStore();
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Controls State
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [menuView, setMenuView] = useState('main'); // 'main', 'speed', 'quality'
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [networkSpeed, setNetworkSpeed] = useState(null); // 'slow', 'medium', 'fast'

  // --- Network Speed Estimation ---
  useEffect(() => {
    if ('connection' in navigator) {
      const updateConnection = () => {
        const speed = navigator.connection.downlink; // Mbps
        if (speed < 1.5) setNetworkSpeed('slow');
        else if (speed < 5) setNetworkSpeed('medium');
        else setNetworkSpeed('fast');
      };
      navigator.connection.addEventListener('change', updateConnection);
      updateConnection();
      return () => navigator.connection.removeEventListener('change', updateConnection);
    }
  }, []);

  // --- Strict IntersectionObserver Autoplay ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = 1;
    video.playbackRate = playbackRate;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (video.dataset.userPaused !== "true") {
                video.muted = isMuted;
                video.play().catch(() => {});
            }
        } else {
            if (video.dataset.userPaused !== "true") {
                video.pause();
            }
        }
      });
    }, { threshold: 0.5 });

    observer.observe(video);
    return () => observer.disconnect();
  }, [src, isMuted, playbackRate]);

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

  const handleVideoClick = () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }
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

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setIsSettingsOpen(false);
  };

  const changeQuality = (q) => {
    setCurrentQuality(q);
    setIsSettingsOpen(false);
    // Note: To implement real switching, we would store currentTime, 
    // change src, and seek back to currentTime after load.
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
        onWaiting={() => setIsLoading(true)}
        onLoadStart={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
      />

      <button className="native-mute-toggle" onClick={toggleMute}>
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {isLoading && (
        <div className="native-loader-overlay">
            <div className="pro-spinner"></div>
        </div>
      )}

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

          <div className="native-right-controls">
            <button 
              className={`native-settings-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(!isSettingsOpen);
                setMenuView('main');
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Settings Menu Popup */}
        {isSettingsOpen && (
          <div className="native-settings-menu" onClick={(e) => e.stopPropagation()}>
            {menuView === 'main' && (
              <div className="menu-list">
                <div className="menu-item" onClick={() => setMenuView('quality')}>
                  <div className="menu-item-left">
                    <Activity size={16} />
                    <span>Kalite</span>
                  </div>
                  <div className="menu-item-right">
                    <span>{currentQuality === 'Auto' ? `Otomatik (${networkSpeed === 'fast' ? '1080p' : networkSpeed === 'medium' ? '720p' : '480p'})` : currentQuality}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className="menu-item" onClick={() => setMenuView('speed')}>
                  <div className="menu-item-left">
                    <Gauge size={16} />
                    <span>Hız</span>
                  </div>
                  <div className="menu-item-right">
                    <span>{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            )}

            {menuView === 'speed' && (
              <div className="menu-list sub-menu">
                <div className="menu-header" onClick={() => setMenuView('main')}>
                   <ChevronRight size={16} className="rotate-180" />
                   <span>Oynatma Hızı</span>
                </div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <div key={rate} className="menu-item" onClick={() => changePlaybackRate(rate)}>
                    <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                    {playbackRate === rate && <Check size={16} />}
                  </div>
                ))}
              </div>
            )}

            {menuView === 'quality' && (
              <div className="menu-list sub-menu">
                <div className="menu-header" onClick={() => setMenuView('main')}>
                   <ChevronRight size={16} className="rotate-180" />
                   <span>Video Kalitesi</span>
                </div>
                {['Auto', '1080p', '720p', '480p', '360p'].map(q => (
                  <div key={q} className="menu-item" onClick={() => changeQuality(q)}>
                    <span>{q === 'Auto' ? 'Otomatik' : q}</span>
                    {currentQuality === q && <Check size={16} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
