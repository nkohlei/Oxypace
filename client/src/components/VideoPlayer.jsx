import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
  Time,
  useMediaStore,
  useMediaRemote,
  Spinner
} from '@vidstack/react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

// Global session unblocking system (v11.0 - THE RELIABILITY KING)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V11';

if (typeof window !== 'undefined' && window.__OX_SESSION_UNMUTED__ === undefined) {
  window.__OX_SESSION_UNMUTED__ = false;
  
  const activateAudioEngine = () => {
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }
  };

  window.addEventListener('mousedown', activateAudioEngine, { capture: true, once: true, passive: true });
  window.addEventListener('touchstart', activateAudioEngine, { capture: true, once: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const { paused, muted, buffering } = useMediaStore(playerRef);
  const [sessionUnmuted, setSessionUnmuted] = useState(typeof window !== 'undefined' ? window.__OX_SESSION_UNMUTED__ : false);

  // Sync with global unblock
  useEffect(() => {
    const onGlobalUnmute = () => {
      setSessionUnmuted(true);
      if (playerRef.current && remote) {
        remote.unmute();
        remote.setVolume(1);
      }
    };
    window.addEventListener(UNMUTE_EVENT, onGlobalUnmute);
    if (window.__OX_SESSION_UNMUTED__) onGlobalUnmute();
    return () => window.removeEventListener(UNMUTE_EVENT, onGlobalUnmute);
  }, [remote]);

  const handleManualAction = (e) => {
    if (e) e.stopPropagation();

    // 1. Unblock session globally if needed
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    // 2. Control Playback
    if (playerRef.current && remote) {
      remote.unmute();
      remote.setVolume(1);
      
      if (paused) {
        remote.play();
      } else {
        remote.pause();
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v11-pro ${className || ''}`}>
      {/* 
          CRITICAL: key={src} ensures the MediaPlayer is completely 
          re-mounted when the video changes, which fixes the "stuck at end" 
          progress bar bug and resets all internal states.
      */}
      <MediaPlayer
        key={src}
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={!sessionUnmuted}
        volume={1}
        preload="auto"
        crossOrigin="anonymous"
      >
        <MediaProvider />

        {/* --- CENTERAL INTERACTION / UNMUTE OVERLAY --- */}
        <div className="vid-interaction-layer" onClick={handleManualAction}>
          {/* Buffering Spinner (Explicit Loader) */}
          {buffering && (
            <div className="vid-loading-container">
              <Spinner.Root className="vid-spinner">
                <Spinner.Track className="vid-spinner-track" />
                <Spinner.TrackFill className="vid-spinner-fill" />
              </Spinner.Root>
              <span className="vid-loading-text">YÜKLENİYOR...</span>
            </div>
          )}

          {/* Muted Indicator / Prompt */}
          {!sessionUnmuted && !buffering && (
            <div className="vid-unmute-overlay">
              <div className="vid-unmute-btn">
                <VolumeX size={32} strokeWidth={2.5} />
                <span>SESİ ETKİNLEŞTİR</span>
              </div>
            </div>
          )}

          {/* Large Action Visual on Pause */}
          <div className={`vid-action-overlay ${paused && !buffering ? 'is-visible' : ''}`}>
            <Play size={44} fill="white" />
          </div>
        </div>

        {/* --- PROFESSIONAL UI (REALISTIC & FUNCTIONAL) --- */}
        <div className="vid-interface">
          {/* Functional, Standard Progress Bar (White on Grey) */}
          <div className="vid-scrub-area">
            <TimeSlider.Root className="vid-time-slider">
              <TimeSlider.Track className="vid-time-track">
                <TimeSlider.TrackFill className="vid-time-fill" />
                <TimeSlider.Progress className="vid-time-buffered" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-time-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-bottom-bar">
            <div className="vid-left-cluster">
              <PlayButton className="vid-play-toggle">
                <Play size={18} fill="white" className="vds-play-icon" />
                <Pause size={18} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Saniye Saniye Takip (Current / Duration) */}
              <div className="vid-time-display">
                <Time type="current" />
                <span className="vid-dash">/</span>
                <Time type="duration" />
              </div>
            </div>
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
