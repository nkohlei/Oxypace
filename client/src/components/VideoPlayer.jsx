import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
  Time,
  useMediaStore,
  useMediaRemote
} from '@vidstack/react';
import { Play, Pause, VolumeX } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

// Global session unblocking system (re-used for v7)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V7';

if (typeof window !== 'undefined' && window.__OX_SESSION_UNMUTED__ === undefined) {
  window.__OX_SESSION_UNMUTED__ = false;
  
  const unblockAll = () => {
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
      // Cleanup global listeners once unblocked
      window.removeEventListener('mousedown', unblockAll);
      window.removeEventListener('touchstart', unblockAll);
      window.removeEventListener('keydown', unblockAll);
    }
  };

  window.addEventListener('mousedown', unblockAll, { passive: true });
  window.addEventListener('touchstart', unblockAll, { passive: true });
  window.addEventListener('keydown', unblockAll, { passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const { muted, paused } = useMediaStore(playerRef);
  const [localMuted, setLocalMuted] = useState(!window.__OX_SESSION_UNMUTED__);

  // Sync with global unmute state
  useEffect(() => {
    const handleGlobalUnmute = () => {
      if (playerRef.current) {
        playerRef.current.muted = false;
        playerRef.current.volume = 1;
      }
      setLocalMuted(false);
    };

    window.addEventListener(UNMUTE_EVENT, handleGlobalUnmute);
    if (window.__OX_SESSION_UNMUTED__) handleGlobalUnmute();

    return () => window.removeEventListener(UNMUTE_EVENT, handleGlobalUnmute);
  }, []);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    
    // SYNCHRONOUS UNMUTE (Forced for all browsers)
    if (playerRef.current) {
      playerRef.current.muted = false;
      playerRef.current.volume = 1;
      setLocalMuted(false);
      
      // Signal others
      if (!window.__OX_SESSION_UNMUTED__) {
        window.__OX_SESSION_UNMUTED__ = true;
        window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
      }
      
      // Control Playback
      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v7-pro ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={localMuted} // Start muted for autoplay
        volume={1}
        crossOrigin="anonymous"
      >
        <MediaProvider />

        {/* --- INTERACTIVE LAYER --- */}
        <div className="vid-overlay-surface" onClick={handleInteraction}>
          {/* Muted Warning Icon (disappears after unmuting) */}
          {localMuted && (
            <div className="vid-muted-alert">
              <VolumeX size={20} />
              <span>SESİ ETKİNLEŞTİRMEK İÇİN DOKUNUN</span>
            </div>
          )}

          {/* Big Play/Pause Center Icon */}
          <div className={`vid-center-play ${paused ? 'is-paused' : 'is-playing'}`}>
            {paused ? <Play size={44} fill="white" /> : <Pause size={44} fill="white" />}
          </div>
        </div>

        {/* --- HOVER-ONLY CONTROLS (THE BAR) --- */}
        <div className="vid-controls-bar">
          {/* Robust Progress Slider */}
          <div className="vid-slider-area">
            <TimeSlider.Root className="vid-timeslider">
              <TimeSlider.Track className="vid-ts-track">
                <TimeSlider.TrackFill className="vid-ts-fill" />
                <TimeSlider.Progress className="vid-ts-progress" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-ts-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-meta-row">
            <div className="vid-left-side">
              {/* Simple Play Button */}
              <PlayButton className="vid-ctrl-btn">
                <Play size={20} fill="white" className="vds-play-icon" />
                <Pause size={20} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Time Info (00:00 / 00:00) */}
              <div className="vid-time-info">
                <Time type="current" />
                <span className="divider">/</span>
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
