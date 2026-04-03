import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
  useMediaRemote,
} from '@vidstack/react';
import { Play, Pause } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

// Global session unblocking system
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE';

if (typeof window !== 'undefined' && window.__OX_SESSION_UNMUTED__ === undefined) {
  window.__OX_SESSION_UNMUTED__ = false;
  
  // Create a master unblocker that listens for ANY user interaction on the page
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

  window.addEventListener('mousedown', unblockAll);
  window.addEventListener('touchstart', unblockAll);
  window.addEventListener('keydown', unblockAll);
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const [isMuted, setIsMuted] = useState(!window.__OX_SESSION_UNMUTED__);

  // Listen for the global unblock signal
  useEffect(() => {
    const handleGlobalUnmute = () => {
      // Direct remote control for 100% reliability
      if (remote) {
        remote.unmute();
        remote.setVolume(1);
      }
      setIsMuted(false);
    };

    window.addEventListener(UNMUTE_EVENT, handleGlobalUnmute);
    
    // If mounted after unblocking, sync immediately
    if (window.__OX_SESSION_UNMUTED__) {
       handleGlobalUnmute();
    }

    return () => window.removeEventListener(UNMUTE_EVENT, handleGlobalUnmute);
  }, [remote]);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    
    // Manually trigger the unblocking if not already done
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    // Toggle play/pause
    if (playerRef.current) {
        if (playerRef.current.paused) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={isMuted}
        onPlay={() => {}}
        onPause={() => {}}
      >
        <MediaProvider />

        {/* 100% Interaction Surface - Clicking here unblocks sound and toggles play */}
        <div className="vid-click-surface" onClick={handleInteraction}>
           <div className="vid-icon-wrapper">
              <PlayButton className="vid-hero-btn">
                <Play size={40} className="vds-play-icon" />
                <Pause size={40} className="vds-pause-icon" />
              </PlayButton>
           </div>
        </div>

        {/* Hover-Only Minimal Bottom Controls bar */}
        <div className="vid-hover-controls">
          <TimeSlider.Root className="vid-time-slider">
            <TimeSlider.Track className="vid-slider-track">
              <TimeSlider.TrackFill className="vid-slider-fill" />
              <TimeSlider.Progress className="vid-slider-progress" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="vid-slider-thumb" />
          </TimeSlider.Root>

          <div className="vid-bottom-actions">
            <PlayButton className="vid-mini-play-btn" onClick={handleInteraction}>
              <Play size={18} className="vds-play-icon" fill="currentColor" />
              <Pause size={18} className="vds-pause-icon" fill="currentColor" />
            </PlayButton>
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
