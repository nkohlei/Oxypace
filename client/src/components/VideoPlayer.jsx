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

// Global session unblocking system (v12.0 - THE DEFINITION OF DONE)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V12';

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
  const { paused, muted, buffering, duration } = useMediaStore(playerRef);
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

  // SMART ACTION: Unmute first, then toggle play/pause
  const handleManualAction = (e) => {
    if (e) e.stopPropagation();

    // 1. Unblock session globally if needed
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    if (playerRef.current && remote) {
      if (muted) {
        // IF MUTED: Unmute and play (Don't toggle play status)
        remote.unmute();
        remote.setVolume(1);
        remote.play();
      } else {
        // IF ALREADY UNMUTED: Standard play/pause toggle
        if (paused) {
          remote.play();
        } else {
          remote.pause();
        }
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v12-final ${className || ''}`}>
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
        <div className="vid-click-surface" onClick={handleManualAction}>
          {/* Buffering Spinner (Prominent Loader) */}
          {buffering && (
            <div className="vid-loading-overlay">
              <Spinner.Root className="vid-spinner-pro">
                <Spinner.Track className="vid-spinner-track-pro" />
                <Spinner.TrackFill className="vid-spinner-fill-pro" />
              </Spinner.Root>
              <span className="vid-loading-label">YÜKLENİYOR</span>
            </div>
          )}

          {/* Special Tap-for-Sound Unblocker */}
          {!sessionUnmuted && !buffering && (
            <div className="vid-sound-unblock">
              <div className="vid-unmute-circle">
                <VolumeX size={36} strokeWidth={2.5} />
                <span>SESİ AÇ</span>
              </div>
            </div>
          )}

          {/* Action Icon on State Change */}
          <div className={`vid-state-hint ${paused && !buffering ? 'is-paused' : ''}`}>
            <Play size={44} fill="white" />
          </div>
        </div>

        {/* --- PROFESSIONAL REALISTIC INTERFACE (HOVER-ONLY) --- */}
        <div className="vid-pro-interface">
          {/* High-Accuracy Standard Progress Bar */}
          <div className="vid-progress-section">
            <TimeSlider.Root className="vid-standard-slider">
              <TimeSlider.Track className="vid-track-bg-pro">
                <TimeSlider.TrackFill className="vid-track-fill-pro" />
                <TimeSlider.Progress className="vid-track-buffer-pro" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-thumb-pro" />
            </TimeSlider.Root>
          </div>

          <div className="vid-controls-row">
            <div className="vid-controls-left">
              <PlayButton className="vid-play-btn">
                <Play size={18} fill="white" className="vds-play-icon" />
                <Pause size={18} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* "Saniye Saniye" - Accurate Timestamps */}
              <div className="vid-time-info">
                <Time type="current" />
                <span className="vid-sep">/</span>
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
