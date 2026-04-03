import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import './VideoPlayer.css';

/**
 * GLOBAL VIDEO REGISTRY (v15.1 - THE FINAL TRUTH)
 * Absolute Fix for Browser Audio Block & Progress Bar Logic.
 */
const activeVideos = new Set();
let sessionUnmuted = false;

if (typeof window !== 'undefined') {
  const globalUnmuteHandler = () => {
    if (sessionUnmuted) return;
    sessionUnmuted = true;
    
    // Direct DOM manipulation during the SAME user gesture event loop
    activeVideos.forEach(video => {
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
      }
    });

    window.dispatchEvent(new CustomEvent('OX_SOUND_ACTIVATED'));
    
    // Unblock site-wide
    window.removeEventListener('mousedown', globalUnmuteHandler, true);
    window.removeEventListener('touchstart', globalUnmuteHandler, true);
    window.removeEventListener('keydown', globalUnmuteHandler, true);
  };

  window.addEventListener('mousedown', globalUnmuteHandler, { capture: true, passive: true });
  window.addEventListener('touchstart', globalUnmuteHandler, { capture: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!sessionUnmuted);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSoundToast, setShowSoundToast] = useState(false);

  // 1. Lifecycle: Register/Unregister with global registry
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      activeVideos.add(video);
      // Ensure initial muted state (Mandatory for autoplay)
      video.muted = !sessionUnmuted;
      video.volume = 1;
    }

    const onSoundActivated = () => {
      setIsMuted(false);
      setShowSoundToast(true);
      setTimeout(() => setShowSoundToast(false), 3000);
    };

    window.addEventListener('OX_SOUND_ACTIVATED', onSoundActivated);
    if (sessionUnmuted) setIsMuted(false);

    return () => {
      if (video) activeVideos.delete(video);
      window.removeEventListener('OX_SOUND_ACTIVATED', onSoundActivated);
    };
  }, []);

  // 2. Playback Handlers: NO STOP PROPAGATION (Must bubble to trigger unblock)
  const togglePlay = (e) => {
    // CRITICAL: We DO NOT e.stopPropagation() here anymore.
    // This allows the click to bubble up to the global unblock handler.
    
    if (!videoRef.current) return;

    // Direct, Immediate Unblock on First Interaction
    if (videoRef.current.muted) {
       videoRef.current.muted = false;
       videoRef.current.volume = 1;
       setIsMuted(false);
    }

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
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
      // Precision math for the progress bar (Fixed 'sonda kalma' bug)
      const preciseProgress = (current / total) * 100;
      setProgress(preciseProgress);
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
      className={`native-player-container left-aligned v15-final ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={togglePlay}
    >
      {/* 
          CRITICAL: NO muted={isMuted} prop here. 
          React state can conflict with browser video properties.
          We control muted status DIRECTLY through the videoRef.
      */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="native-video-element"
        playsInline
        loop
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* 1. Universal "Sound Blocked" Toast (Subtle) */}
      {isMuted && !isBuffering && (
        <div className="native-unmute-hint">
          <VolumeX size={16} /> <span>SESİ AÇMAK İÇİN SİTEDE HERHANGİ BİR YERE TIKLAYIN</span>
        </div>
      )}

      {/* 2. Sound Activation Feedback */}
      {showSoundToast && (
        <div className="native-sound-toast">
          <Volume2 size={16} /> <span>SES ETKİN</span>
        </div>
      )}

      {/* 3. Loading Loader */}
      {isBuffering && (
        <div className="native-loader-overlay">
          <div className="native-spinner"></div>
          <span className="native-loader-text">YÜKLENİYOR...</span>
        </div>
      )}

      {/* 4. Play Hint (on pause) */}
      {!isPlaying && !isBuffering && (
        <div className="native-play-hint">
          <Play size={48} fill="white" stroke="none" />
        </div>
      )}

      {/* 5. Interface Row */}
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
