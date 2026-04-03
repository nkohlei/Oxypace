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

// Global session unblocking system (v13.0 - THE ULTIMATE OVERRIDE)
const UNMUTE_EVENT = 'OX_GLOBAL_UNMUTE_V13';

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
        // Direct DOM Force
        const video = playerRef.current.querySelector('video');
        if (video) {
          video.muted = false;
          video.volume = 1;
        }
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
        const video = playerRef.current.querySelector('video');
        if (video) {
          video.muted = false;
          video.volume = 1;
        }
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
    <div className={`vidstack-wrapper left-aligned v13-ultimate ${className || ''}`}>
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
        onLoadedMetadata={() => {
          // Jumpstart the engine to ensure progress bar is synced
          if (playerRef.current) playerRef.current.currentTime = 0;
        }}
      >
        <MediaProvider />

        {/* --- ULTIMATE INTERACTION LAYER --- */}
        <div className="vid-ultimate-overlay" onClick={handleManualAction}>
          {/* Buffering Indicator (Clearer "Yükleniyor") */}
          {buffering && (
            <div className="vid-buffering-hint">
              <Spinner.Root className="vid-loader-spinner">
                <Spinner.Track className="vid-loader-track" />
                <Spinner.TrackFill className="vid-loader-fill" />
              </Spinner.Root>
              <span className="vid-loader-text">YÜKLENİYOR...</span>
            </div>
          )}

          {/* Sound Unblock Prompter */}
          {!sessionUnmuted && !buffering && (
            <div className="vid-unmute-prompter">
              <div className="vid-unmute-button">
                <VolumeX size={32} strokeWidth={2.5} />
                <span>SESİ AÇ</span>
              </div>
            </div>
          )}

          {/* Pause Visual */}
          <div className={`vid-pause-icon-overlay ${paused && !buffering ? 'is-visible' : ''}`}>
            <Play size={44} fill="white" />
          </div>
        </div>

        {/* --- REALISTIC MINIMAL INTERFACE (HOVER-ONLY) --- */}
        <div className="vid-minimal-ui">
          {/* Functional Progress Bar (Classic White) */}
          <div className="vid-scrub-section">
            <TimeSlider.Root className="vid-pro-slider">
              <TimeSlider.Track className="vid-pro-track">
                <TimeSlider.TrackFill className="vid-pro-fill" />
                <TimeSlider.Progress className="vid-pro-buffered" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="vid-pro-thumb" />
            </TimeSlider.Root>
          </div>

          <div className="vid-tools-row">
            <div className="vid-tools-left">
              <PlayButton className="vid-play-button">
                <Play size={18} fill="white" className="vds-play-icon" />
                <Pause size={18} fill="white" className="vds-pause-icon" />
              </PlayButton>
              
              {/* Saniye Saniye Takip */}
              <div className="vid-timestamp-info">
                <Time type="current" />
                <span className="vid-slash">/</span>
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
