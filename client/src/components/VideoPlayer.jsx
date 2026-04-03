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

// Global session unblocking system (v10.1 - THE PROFESSIONAL STANDARD)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V10';

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
      if (playerRef.current) {
        playerRef.current.muted = false;
        playerRef.current.volume = 1;
      }
    };
    window.addEventListener(UNMUTE_EVENT, onGlobalUnmute);
    if (window.__OX_SESSION_UNMUTED__) onGlobalUnmute();
    return () => window.removeEventListener(UNMUTE_EVENT, onGlobalUnmute);
  }, []);

  const handleManualAction = (e) => {
    if (e) e.stopPropagation();

    // 1. Unblock session globally if needed
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    // 2. Direct Unmute/Play
    if (playerRef.current) {
      playerRef.current.muted = false;
      playerRef.current.volume = 1;

      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v10-pro ${className || ''}`}>
      <MediaPlayer
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
          {/* Muted Indicator / Prompt */}
          {!sessionUnmuted && (
            <div className="vid-unmute-overlay">
              <div className="vid-unmute-btn">
                <VolumeX size={32} strokeWidth={2.5} />
                <span>SESİ AÇ</span>
              </div>
            </div>
          )}

          {/* Buffering Spinner */}
          {buffering && (
            <div className="vid-buffering">
              <Spinner.Root className="vid-spinner">
                <Spinner.Track className="vid-spinner-track" />
                <Spinner.TrackFill className="vid-spinner-fill" />
              </Spinner.Root>
            </div>
          )}

          {/* Big Play Icon on Pause */}
          <div className={`vid-action-overlay ${paused ? 'is-visible' : ''}`}>
            <Play size={50} fill="white" />
          </div>
        </div>

        {/* --- CLEAN PROFESSIONAL UI (HOVER-ONLY) --- */}
        <div className="vid-ui-container">
          {/* Functional, Realistic Progress Bar */}
          <div className="vid-progress-holder">
            <TimeSlider.Root className="vid-slider-main">
              <TimeSlider.Track className="vid-slider-track-bg">
                <TimeSlider.TrackFill className="vid-slider-fill-normal" />
                <TimeSlider.Progress className="vid-slider-buffered-normal" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-slider-thumb-normal" />
            </TimeSlider.Root>
          </div>

          <div className="vid-controls-footer">
            <div className="vid-left-tools">
              <PlayButton className="vid-btn-bare">
                <Play size={20} fill="white" className="vds-play-icon" />
                <Pause size={20} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Saniye Saniye Takip (Current / Duration) */}
              <div className="vid-timestamp-normal">
                <Time type="current" />
                <span className="vid-tm-sep">/</span>
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
