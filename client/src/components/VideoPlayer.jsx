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
import { Play, Pause, VolumeX, Volume2 } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

// Global session unblocking system (re-used for v6)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V6';

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
  const { muted, paused, currentTime, duration } = useMediaStore(playerRef);

  // Sync with global unmute state
  useEffect(() => {
    const handleGlobalUnmute = () => {
      if (remote) {
        remote.unmute();
        remote.setVolume(1);
      }
    };

    window.addEventListener(UNMUTE_EVENT, handleGlobalUnmute);
    if (window.__OX_SESSION_UNMUTED__) handleGlobalUnmute();

    return () => window.removeEventListener(UNMUTE_EVENT, handleGlobalUnmute);
  }, [remote]);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    
    // Force unblock if not already done
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    if (remote) {
      if (muted) remote.unmute();
      remote.togglePaused();
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v6-evolution ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={!window.__OX_SESSION_UNMUTED__}
        volume={1}
        crossOrigin="anonymous"
      >
        <MediaProvider />

        {/* --- INTERACTIVE LAYER --- */}
        <div className="vid-overlay-surface" onClick={handleInteraction}>
          {/* Muted Warning Icon (disappears after unmuting) */}
          {muted && (
            <div className="vid-muted-badge">
              <VolumeX size={18} />
              <span>Sesi Açmak İçin Tıkla</span>
            </div>
          )}

          {/* Big Play/Pause Center Icon */}
          <div className={`vid-center-control ${paused ? 'is-paused' : 'is-playing'}`}>
            <Play size={44} fill="currentColor" />
          </div>
        </div>

        {/* --- HOVER-ONLY CONTROLS --- */}
        <div className="vid-controls-bar">
          {/* Enhanced Time Slider */}
          <div className="vid-slider-container">
            <TimeSlider.Root className="vid-time-slider">
              <TimeSlider.Track className="vid-slider-track">
                <TimeSlider.TrackFill className="vid-slider-fill" />
                <TimeSlider.Progress className="vid-slider-progress" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-slider-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-controls-row">
            <div className="vid-left-tools">
              <PlayButton className="vid-action-btn">
                <Play size={20} fill="currentColor" className="vds-play-icon" />
                <Pause size={20} fill="currentColor" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Time Display (Current / Duration) */}
              <div className="vid-time-display">
                <Time type="current" />
                <span className="vid-time-divider">/</span>
                <Time type="duration" />
              </div>
            </div>

            {/* Right side tools CAN be added here later if needed */}
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
