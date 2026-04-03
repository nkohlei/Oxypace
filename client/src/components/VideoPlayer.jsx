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

// Global session unblocking system (v9.0 - THE FINAL WORD)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V9';

if (typeof window !== 'undefined' && window.__OX_SESSION_UNMUTED__ === undefined) {
  window.__OX_SESSION_UNMUTED__ = false;
  
  const activateAudioEngine = (event) => {
    // Only trigger on real user gestures (clicks, taps, keys)
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
      
      // Cleanup
      window.removeEventListener('mousedown', activateAudioEngine, true);
      window.removeEventListener('touchstart', activateAudioEngine, true);
      window.removeEventListener('keydown', activateAudioEngine, true);
    }
  };

  window.addEventListener('mousedown', activateAudioEngine, { capture: true, passive: true });
  window.addEventListener('touchstart', activateAudioEngine, { capture: true, passive: true });
  window.addEventListener('keydown', activateAudioEngine, { capture: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const { paused, muted, duration } = useMediaStore(playerRef);
  const [isUnmutedSession, setIsUnmutedSession] = useState(typeof window !== 'undefined' ? window.__OX_SESSION_UNMUTED__ : false);

  // --- AUDIO SYNCHRONIZER (THE HEART OF V9) ---
  useEffect(() => {
    const applyAudioSettings = () => {
      setIsUnmutedSession(true);
      if (playerRef.current) {
        // Direct DOM Force - This is the most reliable way
        const videoElement = playerRef.current.querySelector('video');
        if (videoElement) {
          videoElement.muted = false;
          videoElement.volume = 1;
        }
        
        // Remote Sync
        if (remote) {
          remote.unmute();
          remote.setVolume(1);
        }
      }
    };

    window.addEventListener(UNMUTE_EVENT, applyAudioSettings);
    // If the session is already unmuted, apply immediately
    if (window.__OX_SESSION_UNMUTED__) applyAudioSettings();

    return () => window.removeEventListener(UNMUTE_EVENT, applyAudioSettings);
  }, [remote]);

  const handleManualAction = (e) => {
    if (e) e.stopPropagation();
    
    // Ensure global unblock on any manual interaction
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    if (playerRef.current) {
      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v9-final ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={!isUnmutedSession}
        volume={1}
        preload="auto"
        crossOrigin="anonymous"
      >
        <MediaProvider />

        {/* --- SUPER INTERACTIVE OVERLAY --- */}
        <div className="vid-click-target" onClick={handleManualAction}>
          {/* Mute Visual Reminder - Prompting the first click */}
          {!isUnmutedSession && (
            <div className="vid-unblock-badge">
              <VolumeX size={22} color="white" />
              <span>SESİ ETKİNLEŞTİR</span>
            </div>
          )}

          {/* Big Center State Icon (Fade in on hover or pause) */}
          <div className={`vid-central-play ${paused ? 'show-paused' : ''}`}>
            <Play size={44} fill="white" />
          </div>
        </div>

        {/* --- THE STABILIZED PRO BAR (HOVER-ONLY) --- */}
        <div className="vid-pro-ui">
          <div className="vid-bar-container">
            <TimeSlider.Root className="v9-time-slider">
              <TimeSlider.Track className="v9-track">
                <TimeSlider.TrackFill className="v9-track-fill" />
                <TimeSlider.Progress className="v9-track-progress" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="v9-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-control-row">
            <div className="vid-left-cluster">
              <PlayButton className="vid-simple-play">
                <Play size={20} fill="white" className="vds-play-icon" />
                <Pause size={20} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* "Süre Bilgisi" - Precision Timestamps */}
              <div className="vid-time-group">
                <Time type="current" className="v9-time" />
                <span className="v9-sep">/</span>
                <Time type="duration" className="v9-time" />
              </div>
            </div>
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
