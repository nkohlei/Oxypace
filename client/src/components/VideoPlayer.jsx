import { useState, useEffect, useRef, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isMuted, setIsMuted] = useState(true); // Must be true for autoplay
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasInteraction, setHasInteraction] = useState(false);

    const controlsTimeoutRef = useRef(null);

    // --- State-to-DOM Synchronization ---
    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = isMuted;
        // Explicitly set volume when unmuted to ensure sound
        if (!isMuted) {
            videoRef.current.volume = 1;
        }
    }, [isMuted]);

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying, resetControlsTimer]);

    // --- Autoplay on Scroll ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (videoRef.current && videoRef.current.paused && !hasInteraction) {
                            videoRef.current.play().catch(() => {});
                        }
                    } else {
                        if (videoRef.current && !videoRef.current.paused) {
                            videoRef.current.pause();
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => containerRef.current && observer.unobserve(containerRef.current);
    }, [hasInteraction]);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
            setHasInteraction(false); 
        } else {
            videoRef.current.pause();
            setHasInteraction(true); 
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(current);
        setDuration(dur);
        setProgress((current / dur) * 100);

        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered((bufferedEnd / dur) * 100);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        videoRef.current.currentTime = percentage * videoRef.current.duration;
    };

    const toggleMute = (e) => {
        if (e) e.stopPropagation();
        // FORCE sound on click
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            videoRef.current.volume = 1;
        }
    };

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen?.() || containerRef.current.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    const Icons = {
        Play: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z" /></svg>,
        Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
        VolumeMute: () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" /></svg>,
        VolumeUp: () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>,
        Fullscreen: () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zM17 7h-3V5h5v5h-2V7z" /></svg>
    };

    return (
        <div 
            className={`minimal-video-player ${className || ''}`} 
            ref={containerRef}
            onMouseMove={resetControlsTimer}
        >
            <div className="video-surface" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    className="video-element"
                    preload="metadata"
                    playsInline
                    loop
                    onLoadedMetadata={() => setIsLoaded(true)}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            </div>

            {/* Big Play Button Overlay */}
            {!isPlaying && (
                <button className="minimal-play-overlay" onClick={togglePlay}>
                    <Icons.Play />
                </button>
            )}

            {/* Unmute Prompt */}
            {isMuted && isPlaying && (
                <button className="minimal-unmute-btn" onClick={toggleMute}>
                    <Icons.VolumeMute />
                    <span>SESİ AÇ</span>
                </button>
            )}

            {/* Simple Controls */}
            <div className={`minimal-controls ${showControls ? 'visible' : ''}`}>
                <div className="minimal-scrubber" onClick={handleSeek}>
                    <div className="minimal-buffer" style={{ width: `${buffered}%` }} />
                    <div className="minimal-progress" style={{ width: `${progress}%` }} />
                </div>

                <div className="minimal-actions">
                    <button className="minimal-btn" onClick={togglePlay}>
                        {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                    </button>
                    
                    <span className="minimal-time">{formatTime(currentTime)} / {formatTime(duration)}</span>

                    <button className="minimal-btn fs-btn" onClick={toggleFullscreen}>
                        <Icons.Fullscreen />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
