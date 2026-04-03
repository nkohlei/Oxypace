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

// Global session unblocking system (v8 - THE NUCLEAR OPTION)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V8';

if (typeof window !== 'undefined' && window.__OX_SESSION_UNMUTED__ === undefined) {
  window.__OX_SESSION_UNMUTED__ = false;
  
  const activateAudioEngine = () => {
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
      
      // Cleanup
      window.removeEventListener('mousedown', activateAudioEngine);
      window.removeEventListener('touchstart', activateAudioEngine);
      window.removeEventListener('keydown', activateAudioEngine);
    }
  };

  window.addEventListener('mousedown', activateAudioEngine, { capture: true, passive: true });
  window.addEventListener('touchstart', activateAudioEngine, { capture: true, passive: true });
  window.addEventListener('keydown', activateAudioEngine, { capture: true, passive: true });
}

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const remote = useMediaRemote(playerRef);
  const { paused, muted } = useMediaStore(playerRef);
  const [isUnmutedSession, setIsUnmutedSession] = useState(typeof window !== 'undefined' ? window.__OX_SESSION_UNMUTED__ : false);

  // Synchronize ALL players when one is unmuted
  useEffect(() => {
    const syncUnmute = () => {
      setIsUnmutedSession(true);
      if (playerRef.current) {
        // Direct DOM access for absolute reliability
        playerRef.current.muted = false;
        playerRef.current.volume = 1;
        // Also use remote just in case
        if (remote) {
          remote.unmute();
          remote.setVolume(1);
        }
      }
    };

    window.addEventListener(UNMUTE_EVENT, syncUnmute);
    if (window.__OX_SESSION_UNMUTED__) syncUnmute();

    return () => window.removeEventListener(UNMUTE_EVENT, syncUnmute);
  }, [remote]);

  const handleManualInteraction = (e) => {
    if (e) e.stopPropagation();
    
    // 1. Force Global Unblock
    if (!window.__OX_SESSION_UNMUTED__) {
      window.__OX_SESSION_UNMUTED__ = true;
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT));
    }

    // 2. Direct Hardware-Level Unmute
    if (playerRef.current) {
      playerRef.current.muted = false;
      playerRef.current.volume = 1;
      
      // 3. Playback Control
      if (playerRef.current.paused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  };

  return (
    <div className={`vidstack-wrapper left-aligned v8-nuclear ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop
        autoplay="visible"
        muted={!isUnmutedSession} // Reactive muted prop
        volume={1}
        crossOrigin="anonymous"
      >
        <MediaProvider />

        {/* --- THE INTERACTIVE STABILIZER LAYER --- */}
        <div className="vid-control-surface" onClick={handleManualInteraction}>
          {/* Muted Warning (Only shows if session is still muted) */}
          {!isUnmutedSession && (
            <div className="vid-unmute-prompt">
              <VolumeX size={24} />
              <span>SESİ ETKİNLEŞTİR</span>
            </div>
          )}

          {/* Large Center Play/Pause State */}
          <div className={`vid-state-icon ${paused ? 'is-paused' : 'is-playing'}`}>
            {paused ? <Play size={48} fill="white" /> : <Pause size={48} fill="white" />}
          </div>
        </div>

        {/* --- STABLE PROGRESS BAR & TIME INFO (HOVER-ONLY) --- */}
        <div className="vid-minimal-ui">
          {/* Higher-Precision Progress Bar */}
          <div className="vid-progress-wrapper">
            <TimeSlider.Root className="vid-slider-root">
              <TimeSlider.Track className="vid-slider-track">
                <TimeSlider.TrackFill className="vid-slider-fill" />
                <TimeSlider.Progress className="vid-slider-buffered" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-slider-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-bottom-meta">
            <div className="vid-playback-group">
              <PlayButton className="vid-btn-small">
                <Play size={22} fill="white" className="vds-play-icon" />
                <Pause size={22} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Precision Time Information */}
              <div className="vid-timestamp">
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
