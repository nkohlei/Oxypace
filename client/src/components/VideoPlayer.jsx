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

// --- v5.0 GLOBAL AUDIO BRIDGE ---
const UNMUTE_EVENT = 'OX_FINAL_UNMUTE';

if (typeof window !== 'undefined' && window.__OX_AUDIO_UNLOCKED__ === undefined) {
  window.__OX_AUDIO_UNLOCKED__ = false;
  
  const unlockAudio = () => {
    if (!window.__OX_AUDIO_UNLOCKED__) {
      // 1. Create a dummy AudioContext to "bless" the Tab's audio engine
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume().then(() => {
          window.__OX_AUDIO_UNLOCKED__ = true;
          window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
          console.log("Audio Engine Unlocked for Session");
          
          // Cleanup listeners once unblocked
          window.removeEventListener('mousedown', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
        }).catch(() => {});
      }
    }
  };

  window.addEventListener('mousedown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const [isMuted, setIsMuted] = useState(!window.__OX_AUDIO_UNLOCKED__);

  // Robust sync with global unblocking event
  useEffect(() => {
    const syncAudio = () => {
      if (window.__OX_AUDIO_UNLOCKED__) {
        if (remote) {
          remote.unmute();
          remote.setVolume(1);
        }
        setIsMuted(false);
      }
    };

    window.addEventListener(UNMUTE_EVENT, syncAudio);
    if (window.__OX_AUDIO_UNLOCKED__) syncAudio();

    return () => window.removeEventListener(UNMUTE_EVENT, syncAudio);
  }, [remote]);

  const handleInteraction = (e) => {
    if (e) e.stopPropagation();
    
    // Fallback unmuting directly on the player ref for instant response
    if (playerRef.current) {
       playerRef.current.muted = false;
       playerRef.current.volume = 1;
       if (playerRef.current.paused) playerRef.current.play();
       else playerRef.current.pause();
    }
    
    // Re-trigger global unlock if not already set
    if (!window.__OX_AUDIO_UNLOCKED__) {
       window.__OX_AUDIO_UNLOCKED__ = true;
       window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }
    
    setIsMuted(false);
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
        muted={isMuted} // Initial state for autoplay reliability
        volume={1}
        crossOrigin="anonymous" // Helpful for some media servers
      >
        <MediaProvider />

        {/* Full Post Surface Interaction - Left Click unblocks and plays */}
        <div className="vid-interaction-surface" onClick={handleInteraction}>
           <div className="vid-interaction-icon-box">
              <PlayButton className="vid-hero-center-btn">
                <Play size={40} className="vds-play-icon" />
                <Pause size={40} className="vds-pause-icon" />
              </PlayButton>
           </div>
        </div>

        {/* Hover-Only Progress Controls bar */}
        <div className="vid-hover-minimal-overlay">
          <TimeSlider.Root className="vid-time-scrubber">
            <TimeSlider.Track className="vid-scrubber-track">
              <TimeSlider.TrackFill className="vid-scrubber-fill" />
              <TimeSlider.Progress className="vid-scrubber-progress" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="vid-scrubber-thumb" />
          </TimeSlider.Root>

          <div className="vid-bottom-row-actions">
            <PlayButton className="vid-sm-play-pause" onClick={handleInteraction}>
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
