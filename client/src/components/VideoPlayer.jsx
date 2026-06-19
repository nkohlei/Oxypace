import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Check, Maximize, Play, Pause } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useGlobalStore } from '../store/useGlobalStore';
import { getImageUrl } from '../utils/imageUtils';
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
          // On mobile native, this setTimeout causes a visual jump. 
          // We only run it on the web version to prevent browser exit layout shifts.
          if (!Capacitor.isNativePlatform()) {
              setTimeout(() => {
                  window.scrollTo(0, 0);
                  document.body.scrollTop = 0;
                  document.documentElement.scrollTop = 0;
              }, 10);
          }
      }
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}

const VideoPlayer = ({ src, qualities, videoUrl, lowVideoUrl, video144, video360, video720, video1080, video2160, videoOriginal, poster, className }) => {
  const videoRef = useRef(null);
  const isMuted = useGlobalStore(state => state.isMuted);
  const setIsMuted = useGlobalStore(state => state.setIsMuted);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  

  // Resolve source options for 144p, 360p, 720p, 1080p, 2160p
  const src144 = getImageUrl(video144 || qualities?.video144 || qualities?.p144 || qualities?.low || lowVideoUrl || src);
  const src360 = getImageUrl(video360 || qualities?.video360 || qualities?.p360 || src144);
  const src720 = getImageUrl(video720 || qualities?.video720 || qualities?.p720 || src360);
  const src1080 = getImageUrl(video1080 || qualities?.video1080 || qualities?.p1080 || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const src2160 = getImageUrl(video2160 || qualities?.video2160 || qualities?.p2160 || src1080);

  // Determine actual maximum resolution based on available URLs
  const has2160 = !!(video2160 || qualities?.video2160 || qualities?.p2160);
  const has1080 = !!(video1080 || qualities?.video1080 || qualities?.p1080 || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const has720 = !!(video720 || qualities?.video720 || qualities?.p720);
  const has360 = !!(video360 || qualities?.video360 || qualities?.p360);
  const has144 = !!(video144 || qualities?.video144 || qualities?.p144 || lowVideoUrl || qualities?.low);

  let maxResolution = '1080p';
  if (has2160) maxResolution = '2160p';
  else if (has1080) maxResolution = '1080p';
  else if (has720) maxResolution = '720p';
  else if (has360) maxResolution = '360p';
  else if (has144) maxResolution = '144p';

  // Quality selection mode: 'auto' | '2160' | '1080' | '720' | '360' | '144'
  const [qualityMode, setQualityMode] = useState('auto');
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const isSlowConnection = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      if (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
        return true;
      }
      if (connection.downlink && connection.downlink < 2) {
        return true;
      }
    }
    return false;
  };

  const determineAutoSrc = () => {
    if (isSlowConnection()) return src144;
    if (maxResolution === '2160p') return src2160;
    if (maxResolution === '1080p') return src1080;
    if (maxResolution === '720p') return src720;
    if (maxResolution === '360p') return src360;
    return src144;
  };

  // Quality stream selection
  const [videoSrc, setVideoSrc] = useState(() => {
    return determineAutoSrc();
  });

  const availableQualities = [
    { value: 'auto', label: 'Oto' }
  ];

  if (maxResolution === '2160p') {
    availableQualities.push({ value: '2160', label: '2160p' });
    availableQualities.push({ value: '1080', label: '1080p' });
    availableQualities.push({ value: '720', label: '720p' });
    availableQualities.push({ value: '360', label: '360p' });
    availableQualities.push({ value: '144', label: '144p' });
  } else if (maxResolution === '1080p') {
    availableQualities.push({ value: '1080', label: '1080p' });
    availableQualities.push({ value: '720', label: '720p' });
    availableQualities.push({ value: '360', label: '360p' });
    availableQualities.push({ value: '144', label: '144p' });
  } else if (maxResolution === '720p') {
    availableQualities.push({ value: '720', label: '720p' });
    availableQualities.push({ value: '360', label: '360p' });
    availableQualities.push({ value: '144', label: '144p' });
  } else if (maxResolution === '360p') {
    availableQualities.push({ value: '360', label: '360p' });
    availableQualities.push({ value: '144', label: '144p' });
  } else if (maxResolution === '144p') {
    availableQualities.push({ value: '144', label: '144p' });
  }
  
  // Gerçek zamanlı donma/yüklenme sensörü
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-hide controls state & ref
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const isLowQuality = qualityMode === '144' || qualityMode === '360' || (qualityMode === 'auto' && isSlowConnection());

  useEffect(() => {
    console.log('[VideoPlayer Debug] Resolved URLs:', {
      src144,
      src360,
      src720,
      src1080,
      src2160,
      videoSrc,
      qualityMode,
      maxResolution,
      rawQualities: qualities,
      rawProps: { video144, video360, video720, video1080, video2160, videoOriginal }
    });
  }, [src144, src360, src720, src1080, src2160, videoSrc, qualityMode, maxResolution]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Real-time network speed and buffering metrics
  const waitingCountRef = useRef(0);
  const waitingTimerRef = useRef(null);
  const activeStreamRef = useRef(null);

  const handleWaiting = () => {
    setIsLoading(false); // Force hide loading spinner
    
    // If connection stalls and we are in auto mode, immediately swap to 144p
    if (qualityMode === 'auto' && src144 && videoSrc !== src144) {
      console.log('[VideoPlayer] Auto Mode stall detected: Switching source to low 144p video:', src144);
      if (videoRef.current) {
        restoreTimeRef.current = videoRef.current.currentTime;
        shouldPlayRef.current = !videoRef.current.paused;
      }
      setVideoSrc(src144);
      return;
    }

    if (videoRef.current) {
      console.log('[VideoPlayer] Buffering/Stall detected. Bypassing stall by skipping ahead...');
      // Skip ahead slightly to keep decoding continuous without freezing
      videoRef.current.currentTime += 0.25;
      videoRef.current.playbackRate = playbackRate;
    }
  };

  const handlePlaying = () => {
    setIsLoading(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  };

  // Quality switching trigger
  const handleQualityChange = (mode) => {
    setQualityMode(mode);
    setIsQualityMenuOpen(false);
    
    let targetSrc = videoSrc;
    if (mode === '2160') targetSrc = src2160;
    else if (mode === '1080') targetSrc = src1080;
    else if (mode === '720') targetSrc = src720;
    else if (mode === '360') targetSrc = src360;
    else if (mode === '144') targetSrc = src144;
    else if (mode === 'auto') targetSrc = determineAutoSrc();
    
    if (videoRef.current && targetSrc !== videoSrc) {
      restoreTimeRef.current = videoRef.current.currentTime;
      shouldPlayRef.current = !videoRef.current.paused;
      setVideoSrc(targetSrc);
      console.log(`[VideoPlayer] Quality mode changed to: ${mode}, source: ${targetSrc}`);
    }
  };

  // Sync state and listen to connection variations (only active in auto mode)
  useEffect(() => {
    if (qualityMode !== 'auto') return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const handleConnectionChange = () => {
        const nextSrc = determineAutoSrc();
        setVideoSrc((currentSrc) => {
          if (currentSrc !== nextSrc) {
            console.log(`[VideoPlayer] Auto Mode connection changed. Quality switch requested: ${nextSrc}`);
            restoreTimeRef.current = videoRef.current ? videoRef.current.currentTime : 0;
            shouldPlayRef.current = videoRef.current ? !videoRef.current.paused : false;
            return nextSrc;
          }
          return currentSrc;
        });
      };
      connection.addEventListener('change', handleConnectionChange);
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [qualityMode, src360, src1080, src2160, maxResolution]);

  // Periodic network health check to upgrade back to high quality when bandwidth recovers in Auto Mode
  useEffect(() => {
    if (qualityMode !== 'auto') return;

    const interval = setInterval(() => {
      const isSlow = isSlowConnection();
      if (!isSlow) {
        setVideoSrc((currentSrc) => {
          const nextSrc = determineAutoSrc();
          if (currentSrc !== nextSrc) {
            console.log('[VideoPlayer] Auto Mode: Network recovered, upgrading to high quality...');
            restoreTimeRef.current = videoRef.current ? videoRef.current.currentTime : 0;
            shouldPlayRef.current = videoRef.current ? !videoRef.current.paused : false;
            return nextSrc;
          }
          return currentSrc;
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [qualityMode, src1080, src2160, maxResolution]);

  const restoreTimeRef = useRef(0);
  const shouldPlayRef = useRef(false);

  // Capture current playhead before source swap and force reload the stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > 0) {
      restoreTimeRef.current = video.currentTime;
      shouldPlayRef.current = !video.paused;
    }
    video.load();
  }, [videoSrc]);



  const startControlsTimeout = (duration = 1500) => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isSettingsOpen || isQualityMenuOpen) return;
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, duration);
    }
  };

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

  useEffect(() => {
    if (isPaused) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      startControlsTimeout(1500);
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e) => {
    if (isSettingsOpen || isQualityMenuOpen) {
      setShowControls(true);
      return;
    }
    if (videoRef.current && videoRef.current.paused) {
      setShowControls(true);
      return;
    }

    // Fullscreen edge detection
    const isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
      const edgeThreshold = 10;
      const isAtEdge = 
        e.clientX <= edgeThreshold || 
        e.clientX >= window.innerWidth - edgeThreshold || 
        e.clientY <= edgeThreshold || 
        e.clientY >= window.innerHeight - edgeThreshold;

      if (isAtEdge) {
        setShowControls(false);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        return;
      }
    }

    setShowControls(true);
    startControlsTimeout(1500);
  };

  const handleMouseEnter = () => {
    if (videoRef.current && videoRef.current.paused) {
      setShowControls(true);
      return;
    }
    setShowControls(true);
    startControlsTimeout(1500);
  };

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

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      if (restoreTimeRef.current > 0) {
        videoRef.current.currentTime = restoreTimeRef.current;
        restoreTimeRef.current = 0;
        if (shouldPlayRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
    handleTimeUpdate();
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
  const handleVideoClick = (e) => {
    if (e) e.stopPropagation();
    if (isSettingsOpen || isQualityMenuOpen) {
      setIsSettingsOpen(false);
      setIsQualityMenuOpen(false);
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
    <div 
      className={`native-player-container left-aligned v16-scale ${className || ''}`} 
      onClick={(e) => e.stopPropagation()}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        className={`native-video-element ${isLowQuality ? 'native-video-360p-simulation' : ''}`}
        playsInline
        loop
        preload="metadata"
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onStalled={handleWaiting}
        onLoadStart={() => setIsLoading(false)}
        onPlaying={handlePlaying}
        onCanPlay={handlePlaying}
        onCanPlayThrough={handlePlaying}
      />

      <button className={`native-mute-toggle ${!showControls ? 'controls-hidden' : ''}`} onClick={toggleMute} aria-label="Sesi Kapat / Aç">
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className={`native-controls-ui is-always-visible ${!showControls ? 'controls-hidden' : ''}`}>
        <div className="native-progress-area" onClick={handleScrub}>
          <div className="native-progress-track">
            <div className="native-progress-fill" style={{ width: `${progress}%` }}>
              <div className="native-progress-thumb" />
            </div>
          </div>
        </div>

        <div className="native-bottom-row">
          <div className="native-left-controls">
            <button className="native-play-pause-btn" onClick={handleVideoClick} aria-label="Oynat / Duraklat">
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
              className={`native-quality-btn ${isQualityMenuOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsQualityMenuOpen(!isQualityMenuOpen);
                setIsSettingsOpen(false);
              }}
              title="Video Kalitesi"
            >
              {qualityMode === 'auto' ? 'Oto' : `${qualityMode}p`}
            </button>

             <button 
              className={`native-speed-text-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(!isSettingsOpen);
                setIsQualityMenuOpen(false);
              }}
              title="Oynatma Hızı"
            >
              {playbackRate === 1 ? '1x' : `${playbackRate}x`}
            </button>

            <button 
              className="native-fullscreen-btn"
              onClick={toggleFullscreen}
              title="Tam Ekran"
              aria-label="Tam Ekran Yap / Çık"
            >
              <Maximize size={18} />
            </button>

            {isQualityMenuOpen && (
              <div className="native-quality-menu" onClick={(e) => e.stopPropagation()}>
                {availableQualities.map(item => (
                  <div 
                    key={item.value} 
                    className={`quality-item ${qualityMode === item.value ? 'active' : ''}`}
                    onClick={() => handleQualityChange(item.value)}
                  >
                    <span>{item.label}</span>
                    {qualityMode === item.value && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}

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
