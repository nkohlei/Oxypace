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

const VideoPlayer = ({ src, qualities, videoUrl, lowVideoUrl, video144, video360, video720, video1080, video2160, videoOriginal, poster, className, isProcessing = false, processingProgress = 0, estimatedTime = "Hesaplanıyor..." }) => {
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const [activeVideo, setActiveVideo] = useState('A'); // 'A' or 'B'
  
  const restoreTimeRef = useRef(0);
  const shouldPlayRef = useRef(false);
  const isMuted = useGlobalStore(state => state.isMuted);
  const setIsMuted = useGlobalStore(state => state.setIsMuted);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Resolve source options for 144p, 360p, 720p, 1080p, 2160p
  const src144 = getImageUrl(video144 || qualities?.video144 || qualities?.p144 || qualities?.['144p'] || qualities?.low || lowVideoUrl || src);
  const src360 = getImageUrl(video360 || qualities?.video360 || qualities?.p360 || qualities?.['360p'] || src144);
  const src720 = getImageUrl(video720 || qualities?.video720 || qualities?.p720 || qualities?.['720p'] || src360);
  const src1080 = getImageUrl(video1080 || qualities?.video1080 || qualities?.p1080 || qualities?.['1080p'] || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const src2160 = getImageUrl(video2160 || qualities?.video2160 || qualities?.p2160 || qualities?.['2160p'] || src1080);

  // Determine actual maximum resolution based on available URLs
  const has2160 = !!(video2160 || qualities?.video2160 || qualities?.p2160 || qualities?.['2160p']);
  const has1080 = !!(video1080 || qualities?.video1080 || qualities?.p1080 || qualities?.['1080p'] || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const has720 = !!(video720 || qualities?.video720 || qualities?.p720 || qualities?.['720p']);
  const has360 = !!(video360 || qualities?.video360 || qualities?.p360 || qualities?.['360p']);
  const has144 = !!(video144 || qualities?.video144 || qualities?.p144 || qualities?.['144p']);

  let maxResolution = '1080p';
  if (has2160) maxResolution = '2160p';
  else if (has1080) maxResolution = '1080p';
  else if (has720) maxResolution = '720p';
  else if (has360) maxResolution = '360p';
  else if (has144) maxResolution = '144p';

  const [qualityMode, setQualityMode] = useState('auto');
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState(null);

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

  // Video Source States
  const [srcStateA, setSrcStateA] = useState(() => determineAutoSrc());
  const [srcStateB, setSrcStateB] = useState('');

  const getActiveRef = () => activeVideo === 'A' ? videoRefA : videoRefB;
  const getInactiveRef = () => activeVideo === 'A' ? videoRefB : videoRefA;

  const availableQualities = [
    { value: 'auto', label: 'Oto' }
  ];

  if (has2160) availableQualities.push({ value: '2160', label: '2160p' });
  if (has1080) availableQualities.push({ value: '1080', label: '1080p' });
  if (has720) availableQualities.push({ value: '720', label: '720p' });
  if (has360) availableQualities.push({ value: '360', label: '360p' });
  if (has144) availableQualities.push({ value: '144', label: '144p' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-hide controls state & ref
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const isLowQuality = qualityMode === '144' || qualityMode === '360' || (qualityMode === 'auto' && isSlowConnection());

  // Sync playback rates
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.playbackRate = playbackRate;
    if (videoRefB.current) videoRefB.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync volume & mute state
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.muted = isMuted;
    if (videoRefB.current) videoRefB.current.muted = isMuted;
  }, [isMuted]);

  const waitingTimerRef = useRef(null);

  // Core quality swapper without pause or black screen (Instant swap)
  const initiateQualitySwap = (newSrc) => {
    const activeRef = getActiveRef();
    const inactiveRef = getInactiveRef();
    if (!activeRef.current || !inactiveRef.current) {
      // Fallback if elements not fully mounted
      if (activeVideo === 'A') setSrcStateA(newSrc);
      else setSrcStateB(newSrc);
      return;
    }

    const currentSrc = activeVideo === 'A' ? srcStateA : srcStateB;
    if (newSrc === currentSrc) return;

    const curTime = activeRef.current.currentTime;
    const isPlaying = !activeRef.current.paused;

    console.log(`[VideoPlayer] Quality Swap: Active = ${activeVideo}, New Src = ${newSrc}, Time = ${curTime}`);

    // Set src on inactive video element
    if (activeVideo === 'A') {
      setSrcStateB(newSrc);
    } else {
      setSrcStateA(newSrc);
    }

    // Capture target state for inactive player to restore
    restoreTimeRef.current = curTime;
    shouldPlayRef.current = isPlaying;
    setIsLoading(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
    
    // Auto Mode bandwidth degradation
    if (qualityMode === 'auto') {
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = setTimeout(() => {
        const activeVideoEl = getActiveRef().current;
        if (activeVideoEl && !activeVideoEl.paused) {
          const currentSrc = activeVideo === 'A' ? srcStateA : srcStateB;
          let nextSrc = null;
          let nextLabel = '';
          
          if (currentSrc === src2160 && has1080) { nextSrc = src1080; nextLabel = '1080p'; }
          else if (currentSrc === src1080 && has720) { nextSrc = src720; nextLabel = '720p'; }
          else if (currentSrc === src720 && has360) { nextSrc = src360; nextLabel = '360p'; }
          else if (currentSrc === src360 && has144) { nextSrc = src144; nextLabel = '144p'; }
          
          if (nextSrc && nextSrc !== currentSrc) {
            console.log(`[VideoPlayer] Auto Mode: Stall detected. Downgrading to ${nextLabel}...`);
            initiateQualitySwap(nextSrc);
          }
        }
      }, 1000);
    }
  };

  const handleActivePlaying = () => {
    setIsLoading(false);
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
  };

  const handleQualityChange = (mode) => {
    setQualityMode(mode);
    setIsQualityMenuOpen(false);
    
    let targetSrc = '';
    if (mode === '2160') targetSrc = src2160;
    else if (mode === '1080') targetSrc = src1080;
    else if (mode === '720') targetSrc = src720;
    else if (mode === '360') targetSrc = src360;
    else if (mode === '144') targetSrc = src144;
    else if (mode === 'auto') targetSrc = determineAutoSrc();
    
    initiateQualitySwap(targetSrc);
  };

  // Sync state and listen to connection variations (only active in auto mode)
  useEffect(() => {
    if (qualityMode !== 'auto') return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const handleConnectionChange = () => {
        const nextSrc = determineAutoSrc();
        const currentSrc = activeVideo === 'A' ? srcStateA : srcStateB;
        if (nextSrc !== currentSrc) {
          console.log(`[VideoPlayer] Auto Mode connection changed. Swapping to: ${nextSrc}`);
          initiateQualitySwap(nextSrc);
        }
      };
      connection.addEventListener('change', handleConnectionChange);
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [qualityMode, activeVideo, srcStateA, srcStateB, src144, src360, src720, src1080, src2160, maxResolution]);

  // Periodic network health check to upgrade back to high quality in Auto Mode
  useEffect(() => {
    if (qualityMode !== 'auto') return;

    const interval = setInterval(() => {
      const isSlow = isSlowConnection();
      if (!isSlow) {
        const nextSrc = determineAutoSrc();
        const currentSrc = activeVideo === 'A' ? srcStateA : srcStateB;
        if (nextSrc !== currentSrc) {
          console.log('[VideoPlayer] Auto Mode: Bandwidth recovered. Upgrading quality...');
          initiateQualitySwap(nextSrc);
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [qualityMode, activeVideo, srcStateA, srcStateB, src144, src360, src720, src1080, src2160, maxResolution]);

  // Seamless auto-quality network progress stall detector
  useEffect(() => {
    if (qualityMode !== 'auto') return;
    
    let lastTime = 0;
    let lastCheck = Date.now();

    const interval = setInterval(() => {
      const video = getActiveRef().current;
      if (!video || video.paused || video.ended) {
        lastCheck = Date.now();
        lastTime = video ? video.currentTime : 0;
        return;
      }

      const now = Date.now();
      const timeDiff = (now - lastCheck) / 1000;
      const progressDiff = video.currentTime - lastTime;

      if (timeDiff > 0.5 && progressDiff < 0.1) {
        console.log('[VideoPlayer] Seamless Auto-Quality: Progress check stall detected. Swapping to lower quality...');
        const currentSrc = activeVideo === 'A' ? srcStateA : srcStateB;
        let targetSrc = null;
        if (currentSrc === src2160 && has1080) targetSrc = src1080;
        else if (currentSrc === src1080 && has720) targetSrc = src720;
        else if (currentSrc === src720 && has360) targetSrc = src360;
        else if (currentSrc === src360 && has144) targetSrc = src144;

        if (targetSrc && targetSrc !== currentSrc) {
          initiateQualitySwap(targetSrc);
        }
      }

      lastTime = video.currentTime;
      lastCheck = now;
    }, 500);

    return () => clearInterval(interval);
  }, [qualityMode, activeVideo, srcStateA, srcStateB, src144, src360, src720, src1080, src2160, has144, has360, has720, has1080, has2160]);

  // Handle Event for element load (Seek to matching timestamp on inactive video)
  const handleElementLoadedMetadata = (elementId) => {
    const isInactive = elementId !== activeVideo;
    const targetRef = elementId === 'A' ? videoRefA : videoRefB;
    
    // Set Dimensions lock
    if (targetRef.current && targetRef.current.videoWidth && targetRef.current.videoHeight && !naturalDimensions) {
      setNaturalDimensions({ width: targetRef.current.videoWidth, height: targetRef.current.videoHeight });
    }

    if (isInactive && targetRef.current && restoreTimeRef.current > 0) {
      targetRef.current.currentTime = restoreTimeRef.current;
    }
  };

  // Handle playing callback on either element to complete the swap cleanly
  const handleElementPlaying = (elementId) => {
    const isInactive = elementId !== activeVideo;
    const targetRef = elementId === 'A' ? videoRefA : videoRefB;

    if (isInactive && targetRef.current) {
      // Perform Swap instantly!
      console.log(`[VideoPlayer] Swap SUCCESS: Switching active element to ${elementId}`);
      setActiveVideo(elementId);
      
      const previousRef = elementId === 'A' ? videoRefB : videoRefA;
      if (previousRef.current) {
        previousRef.current.pause();
      }
      setIsLoading(false);
      restoreTimeRef.current = 0;
    } else {
      handleActivePlaying();
    }
  };

  const startControlsTimeout = (duration = 1500) => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isSettingsOpen || isQualityMenuOpen) return;
    const activeVideoEl = getActiveRef().current;
    if (activeVideoEl && !activeVideoEl.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, duration);
    }
  };

  // Keep isPaused state synchronized with active video element
  useEffect(() => {
    const video = getActiveRef().current;
    if (!video) return;

    const onPlay = () => {
      setIsPaused(false);
      // Register active element to mountedVideos
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
  }, [activeVideo]);

  // Register active video element to mounted list
  useEffect(() => {
    const video = getActiveRef().current;
    if (!video) return;

    mountedVideos.add(video);
    handleGlobalScroll();

    return () => {
      mountedVideos.delete(video);
    };
  }, [activeVideo, srcStateA, srcStateB]);

  useEffect(() => {
    if (isPaused) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      startControlsTimeout(1500);
    }
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (isSettingsOpen || isQualityMenuOpen) {
      setShowControls(true);
      return;
    }
    const activeVideoEl = getActiveRef().current;
    if (activeVideoEl && activeVideoEl.paused) {
      setShowControls(true);
      return;
    }

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
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        return;
      }
    }

    setShowControls(true);
    startControlsTimeout(1500);
  };

  const handleMouseEnter = () => {
    const activeVideoEl = getActiveRef().current;
    if (activeVideoEl && activeVideoEl.paused) {
      setShowControls(true);
      return;
    }
    setShowControls(true);
    startControlsTimeout(1500);
  };

  const handleTimeUpdate = () => {
    const video = getActiveRef().current;
    if (!video) return;
    const current = video.currentTime;
    const total = video.duration;
    
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  const handleScrub = (e) => {
    if (e) e.stopPropagation();
    const video = getActiveRef().current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedProgress = x / rect.width;
    const newTime = clickedProgress * duration;
    video.currentTime = newTime;
    setProgress(clickedProgress * 100);
  };

  const handleVideoClick = (e) => {
    if (e) e.stopPropagation();
    if (isSettingsOpen || isQualityMenuOpen) {
      setIsSettingsOpen(false);
      setIsQualityMenuOpen(false);
      return;
    }
    const video = getActiveRef().current;
    if (!video) return;
    if (video.paused) {
        video.dataset.userPaused = "false";
        video.play().catch(()=>{});
    } else {
        video.dataset.userPaused = "true";
        video.pause();
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
    setIsSettingsOpen(false);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const video = getActiveRef().current;
    if (!video) return;
    
    const container = video.closest('.native-player-container');
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
      {isProcessing && (
        <div className="processing-overlay-orange">
          <span className="processing-dot-orange" />
          <span>⚡ Kaliteler Hazırlanıyor (%{processingProgress}) - Kalan: {estimatedTime}</span>
        </div>
      )}

      {/* Dual Video Swap Elements (Stacked absolutely inside the container) */}
      <video
        ref={videoRefA}
        src={srcStateA}
        poster={poster}
        className="native-video-element"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          position: activeVideo === 'A' ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          opacity: activeVideo === 'A' ? 1 : 0,
          pointerEvents: activeVideo === 'A' ? 'auto' : 'none',
          zIndex: activeVideo === 'A' ? 1 : 0,
          transition: 'opacity 0.15s ease-in-out'
        }}
        playsInline
        loop
        preload="metadata"
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => handleElementLoadedMetadata('A')}
        onWaiting={handleWaiting}
        onStalled={handleWaiting}
        onLoadStart={() => setIsLoading(false)}
        onPlaying={() => handleElementPlaying('A')}
        onCanPlay={() => handleElementPlaying('A')}
        onCanPlayThrough={() => handleElementPlaying('A')}
      />

      <video
        ref={videoRefB}
        src={srcStateB}
        poster={poster}
        className="native-video-element"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          position: activeVideo === 'B' ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          opacity: activeVideo === 'B' ? 1 : 0,
          pointerEvents: activeVideo === 'B' ? 'auto' : 'none',
          zIndex: activeVideo === 'B' ? 1 : 0,
          transition: 'opacity 0.15s ease-in-out'
        }}
        playsInline
        loop
        preload="metadata"
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => handleElementLoadedMetadata('B')}
        onWaiting={handleWaiting}
        onStalled={handleWaiting}
        onLoadStart={() => setIsLoading(false)}
        onPlaying={() => handleElementPlaying('B')}
        onCanPlay={() => handleElementPlaying('B')}
        onCanPlayThrough={() => handleElementPlaying('B')}
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
