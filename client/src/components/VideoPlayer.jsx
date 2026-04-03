import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
} from '@vidstack/react';
import { Play, Pause, VolumeX } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Sync unmute logic for "Sesi Aç" button
  const handleUnmute = (e) => {
    e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.muted = false;
      playerRef.current.volume = 1;
      setIsMuted(false);
      setHasInteraction(true); // Ensure sound stays unblocked
    }
  };

  const handlePlayToggle = (e) => {
    if (e) e.stopPropagation();
    if (playerRef.current) {
        if (playerRef.current.paused) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
            setHasInteraction(true); // Don't auto-resume if manually paused
        }
    }
  };

  return (
    <div className={`vidstack-wrapper refined-player ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        loop // Always loop
        autoplay="visible" // Play when visible
        muted={isMuted}
        onPlay={() => {}}
        onPause={() => {}}
      >
        <MediaProvider />

        {/* --- Minimalist UI ("O Kadar" + Hover) --- */}

        {/* Big Play Overlay (Durdur/Oynat) */}
        <div className="vid-center-overlay">
          <PlayButton className="vid-hero-play" onClick={handlePlayToggle}>
            <Play size={40} className="vds-play-icon" />
            <Pause size={40} className="vds-pause-icon" />
          </PlayButton>
        </div>

        {/* Suitable Unmute Prompt (Chrome Engelini Aşan Şık Buton) */}
        {isMuted && (
           <div className="vid-unblocker-container">
               <button className="vid-suitable-unmute" onClick={handleUnmute}>
                  <VolumeX size={18} />
                  <span>SESİ AÇ</span>
               </button>
           </div>
        )}

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
            <PlayButton className="vid-play-pause-btn" onClick={handlePlayToggle}>
              <Play size={22} className="vds-play-icon" fill="currentColor" />
              <Pause size={22} className="vds-pause-icon" fill="currentColor" />
            </PlayButton>
            
            {/* Removed Mute/Unmute toggle from bottom bar as requested */}
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
