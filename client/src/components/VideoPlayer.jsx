import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
} from '@vidstack/react';
import { Play, Pause } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

// Global flag to track if sound has been unblocked for this session
if (typeof window !== 'undefined' && window.__OX_VIDEO_UNMUTED__ === undefined) {
  window.__OX_VIDEO_UNMUTED__ = false;
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const [isMuted, setIsMuted] = useState(!window.__OX_VIDEO_UNMUTED__);
  const [hasInteraction, setHasInteraction] = useState(false);

  // Sync with global unmute state
  useEffect(() => {
    const checkGlobalUnmute = () => {
      if (window.__OX_VIDEO_UNMUTED__ && isMuted) {
        setIsMuted(false);
        if (playerRef.current) playerRef.current.muted = false;
      }
    };

    const interval = setInterval(checkGlobalUnmute, 500); // Polling for global unmute
    return () => clearInterval(interval);
  }, [isMuted]);

  // Global listener for first interaction to unblock sound (Chrome Engine)
  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (!window.__OX_VIDEO_UNMUTED__) {
        window.__OX_VIDEO_UNMUTED__ = true;
        setIsMuted(false);
        if (playerRef.current) {
          playerRef.current.muted = false;
          playerRef.current.volume = 1;
        }
      }
    };

    window.addEventListener('mousedown', handleGlobalInteraction, { once: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { once: true });
    
    return () => {
      window.removeEventListener('mousedown', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, []);

  const handlePlayToggle = (e) => {
    if (e) e.stopPropagation();
    
    // Any click on the player unblocks sound for everyone
    if (!window.__OX_VIDEO_UNMUTED__) {
      window.__OX_VIDEO_UNMUTED__ = true;
      setIsMuted(false);
    }

    if (playerRef.current) {
        if (playerRef.current.paused) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
            setHasInteraction(true); // Manually stopped
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
        muted={isMuted} // Controlled by global session interaction
        onPlay={() => {}}
        onPause={() => {}}
      >
        <MediaProvider />

        {/* Big Play Overlay (Durdur/Oynat) */}
        <div className="vid-interaction-layer" onClick={handlePlayToggle}>
           <div className="vid-center-icon">
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
            <PlayButton className="vid-mini-play-btn" onClick={handlePlayToggle}>
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
