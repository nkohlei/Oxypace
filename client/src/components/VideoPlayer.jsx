import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import './VideoPlayer.css';

// Invisible Session Unblocker (v14.0)
const GLOBAL_UNMUTE_EVENT = 'OX_NATIVE_UNMUTE';

if (typeof window !== 'undefined' && window.__OX_NATIVE_UNMUTED__ === undefined) {
  window.__OX_NATIVE_UNMUTED__ = false;
  
  const triggerUnmute = () => {
    if (!window.__OX_NATIVE_UNMUTED__) {
      window.__OX_NATIVE_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(GLOBAL_UNMUTE_EVENT));
    }
  };

  // The moment the user clicks ANYWHERE on the site, we unblock audio for everyone
  window.addEventListener('mousedown', triggerUnmute, { capture: true, once: true, passive: true });
  window.addEventListener('touchstart', triggerUnmute, { capture: true, once: true, passive: true });
  window.addEventListener('keydown', triggerUnmute, { capture: true, once: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Audio Synchronization
  useEffect(() => {
    const handleGlobalUnmute = () => {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
      }
    };

    window.addEventListener(GLOBAL_UNMUTE_EVENT, handleGlobalUnmute);
    if (window.__OX_NATIVE_UNMUTED__) handleGlobalUnmute();
    return () => window.removeEventListener(GLOBAL_UNMUTE_EVENT, handleGlobalUnmute);
  }, []);

  // 2. Playback Handlers
  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Also trigger global unblock if this was the first interaction
    if (!window.__OX_NATIVE_UNMUTED__) {
      window.__OX_NATIVE_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(GLOBAL_UNMUTE_EVENT));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    if (total) {
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  const handleScrub = (e) => {
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
      ref={containerRef}
      className={`native-player-container left-aligned v14-restoration ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={togglePlay}
    >
      {/* THE CORE ENGINE: Native HTML5 Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="native-video-element"
        playsInline
        loop
        autoPlay
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* 1. Loading Spinner (Native CSS) */}
      {isBuffering && (
        <div className="native-loader-overlay">
          <div className="native-spinner"></div>
          <span className="native-loader-text">YÜKLENİYOR...</span>
        </div>
      )}

      {/* 2. Interaction Layer Hint (Only on Pause) */}
      {!isPlaying && !isBuffering && (
        <div className="native-play-hint">
          <Play size={48} fill="white" stroke="none" />
        </div>
      )}

      {/* 3. Professional Realistic Interface (Hover Only) */}
      <div className={`native-controls-ui ${isHovered || !isPlaying ? 'is-visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* THE REAL PROGRESS BAR (High-Accuracy) */}
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
