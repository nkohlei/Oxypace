import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Check, Maximize, Play, Pause } from 'lucide-react';
import { useGlobalStore } from '../store/useGlobalStore';
import './VideoPlayer.css';

const mountedVideos = new Set();
let scrollTimeout = null;

const checkCenterVideo = () => {
  if (mountedVideos.size === 0) return;
  
  const isFs = !!document.fullscreenElement;
  if (isFs) {
    mountedVideos.forEach(video => {
      const amIFs = document.fullscreenElement.contains(video);
      if (!amIFs && !video.paused) {
        video.pause();
      }
    });
    return;
  }

  const centerY = window.innerHeight / 2;
  let closestVideo = null;
  let minDistance = Infinity;

  mountedVideos.forEach(video => {
    if (!video) return;
    const rect = video.getBoundingClientRect();
    
    // Check if reasonably visible
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = visibleHeight / (rect.height || 1);
      
      // Consider if at least 20% visible
      if (ratio > 0.2) {
          const vCenter = rect.top + rect.height / 2;
          const distance = Math.abs(vCenter - centerY);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestVideo = video;
          }
      }
    }
  });

  mountedVideos.forEach(video => {
    if (video === closestVideo) {
      if (video.dataset.userPaused !== "true" && video.paused) {
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  });
};

const handleGlobalScroll = () => {
  if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
  scrollTimeout = requestAnimationFrame(() => {
    checkCenterVideo();
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', handleGlobalScroll, true);
  window.addEventListener('resize', handleGlobalScroll);

  const onFullscreenChange = (e) => {
      handleGlobalScroll(e);
      if (!document.fullscreenElement) {
          // Force reset window scroll to prevent the layout shift bug
          // that occurs when browsers exit fullscreen mode.
          setTimeout(() => {
              window.scrollTo(0, 0);
              document.body.scrollTop = 0;
              document.documentElement.scrollTop = 0;
          }, 10);
      }
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}

const VideoPlayer = ({ src, poster, className }) => {
  const videoRef = useRef(null);
  const { isMuted, setIsMuted } = useGlobalStore();
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Gerçek zamanlı donma/yüklenme sensörü
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync isPaused state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsPaused(false);
      // Ensure other videos pause when this one plays
      mountedVideos.forEach(v => {
        if (v !== video && !v.paused) v.pause();
      });
    };
    const onPause = () => setIsPaused(true);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    setIsPaused(video.paused);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  // Sync video properties
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.playbackRate = playbackRate;
    }
  }, [isMuted, playbackRate]);

  // Register to global manager
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    mountedVideos.add(video);
    handleGlobalScroll(); // Initial check

    return () => {
      mountedVideos.delete(video);
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

  // Videoya Direk Tıklayıp Durdurma/Oynatma
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

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    const container = videoRef.current.closest('.native-player-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) container.requestFullscreen();
      else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
      else if (container.msRequestFullscreen) container.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
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
          <div className="native-left-controls">
            <button className="native-play-pause-btn" onClick={handleVideoClick}>
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            
            <div className="native-time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="native-time-sep">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="native-right-controls">
             <button 
              className={`native-speed-text-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              title="Oynatma Hızı"
            >
              {playbackRate === 1 ? '1x' : `${playbackRate}x`}
            </button>

            <button 
              className="native-fullscreen-btn"
              onClick={toggleFullscreen}
              title="Tam Ekran"
            >
              <Maximize size={18} />
            </button>

            {isSettingsOpen && (
              <div className="native-speed-menu" onClick={(e) => e.stopPropagation()}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <div 
                    key={rate} 
                    className={`speed-item ${playbackRate === rate ? 'active' : ''}`}
                    onClick={() => changePlaybackRate(rate)}
                  >
                    <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                    {playbackRate === rate && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
