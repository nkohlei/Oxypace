import { useEffect, useRef, useState } from 'react';
import { 
  MediaPlayer, 
  MediaProvider, 
  PlayButton, 
  TimeSlider,
} from '@vidstack/react';
import { Play, Pause, VolumeX, Volume2 } from 'lucide-react';
import '@vidstack/react/player/styles/base.css';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
  const playerRef = useRef(null);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Intersection Observer for Autoplay on Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (playerRef.current && playerRef.current.paused && !hasInteraction) {
              playerRef.current.play().catch(() => {});
            }
          } else {
            if (playerRef.current && !playerRef.current.paused) {
              playerRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (playerRef.current?.el) {
      observer.observe(playerRef.current.el);
    }
    
    return () => {
      if (playerRef.current?.el) observer.unobserve(playerRef.current.el);
    };
  }, [hasInteraction]);

  const handleUnmute = (e) => {
    e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.muted = false;
      playerRef.current.volume = 1;
      setIsMuted(false);
    }
  };

  return (
    <div className={`vidstack-wrapper ${className || ''}`}>
      <MediaPlayer
        src={src}
        poster={poster}
        ref={playerRef}
        className="vidstack-player"
        playsInline
        muted={isMuted}
        onPlay={() => setHasInteraction(false)}
        onPause={() => setHasInteraction(true)}
      >
        <MediaProvider />

        {/* --- Minimalist UI --- */}

        {/* Big Play Overlay */}
        <div className="vid-big-play-container">
          <PlayButton className="vid-big-play-btn">
            <Play size={32} className="vds-play-icon" />
            <Pause size={32} className="vds-pause-icon" />
          </PlayButton>
        </div>

        {/* Unmute Prompt */}
        {isMuted && (
           <button className="vid-unmute-overlay" onClick={handleUnmute}>
              <VolumeX size={16} />
              <span>SESİ AÇ</span>
           </button>
        )}

        {/* Bottom Bar: Scrubber + Minimal Play/Pause */}
        <div className="vid-minimal-controls">
          <TimeSlider.Root className="vid-time-slider">
            <TimeSlider.Track className="vid-slider-track">
              <TimeSlider.TrackFill className="vid-slider-fill" />
              <TimeSlider.Progress className="vid-slider-progress" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="vid-slider-thumb" />
          </TimeSlider.Root>

          <div className="vid-bottom-row">
            <PlayButton className="vid-action-btn">
              <Play size={20} className="vds-play-icon" fill="currentColor" />
              <Pause size={20} className="vds-pause-icon" fill="currentColor" />
            </PlayButton>
          </div>
        </div>
      </MediaPlayer>
    </div>
  );
};

export default VideoPlayer;
