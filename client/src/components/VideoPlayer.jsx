import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // --- Strict Unmuted Autoplay Engine ---
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        // ALWAYS Unmuted by strict user policy!
        video.muted = false;
        video.volume = 1;

        // Ensure we load the metadata for accurate progress bars
        video.load();
        
        // Try forcing play immediately on mount
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
            }).catch(error => {
                // Browser natively blocked unmuted autoplay (Chrome/Safari policy)
                // Video stays paused, we show a play button telling user to interact.
                console.warn('Autoplay natively blocked by browser:', error);
                setIsPlaying(false);
                setAutoplayBlocked(true);
            });
        }
    }
  }, [src]); // Re-run when video source changes

  // Playback Handlers
  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setAutoplayBlocked(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      className={`native-player-container left-aligned v16-scale ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="native-video-element"
        playsInline
        loop
        // Did not include `autoPlay` as a prop directly because React can conflict with 
        // our custom playPromise logic above.
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); setAutoplayBlocked(false); }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Loading Loader */}
      {isBuffering && (
        <div className="native-loader-overlay">
          <div className="native-spinner"></div>
        </div>
      )}

      {/* Tarayıcı Engeli Uyarısı (Click to Start) */}
      {autoplayBlocked && !isPlaying && !isBuffering && (
        <div className="native-autoplay-warning">
          <span>Başlat</span>
        </div>
      )}

      {/* Play Hint (on standard pause) */}
      {!isPlaying && !isBuffering && !autoplayBlocked && (
        <div className="native-play-hint">
          <Play size={48} fill="white" stroke="none" />
        </div>
      )}

      {/* Interface Row */}
      <div className={`native-controls-ui ${isHovered || !isPlaying ? 'is-visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="native-progress-area" onClick={handleScrub}>
          <div className="native-progress-track">
            <div className="native-progress-fill" style={{ width: `${progress}%` }}>
              <div className="native-progress-thumb" />
            </div>
          </div>
        </div>

        <div className="native-bottom-row">
          <div className="native-controls-left">
            <button className="native-control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>
            <div className="native-time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="native-time-sep">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="native-controls-right">
             {/* No volume buttons entirely as requested! */}
             <button className="native-control-btn" onClick={() => videoRef.current?.requestFullscreen()}>
                <Maximize2 size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
