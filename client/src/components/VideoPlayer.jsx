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
    const [isMuted, setIsMuted] = useState(true); // Default to muted for autoplay
    const [showControls, setShowControls] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tapAnimation, setTapAnimation] = useState(null); 
    const [hasInteractionRef, setHasInteraction] = useState(false); // Flag for manual pausing

    // Timer for hiding controls
    const controlsTimeoutRef = useRef(null);
    const lastTapRef = useRef(0);

    // --- State-to-DOM Synchronization (The "No Sound" Fix) ---
    useEffect(() => {
        if (!videoRef.current) return;
        // Directly sync React state with DOM properties
        videoRef.current.muted = isMuted;
        videoRef.current.playbackRate = playbackSpeed;
    }, [isMuted, playbackSpeed]);

    // --- Control Visibility Logic ---
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying, resetControlsTimer]);

    // --- Intersection Observer (Autoplay on Scroll) ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Autoplay if the user hasn't manually paused it yet
                        if (videoRef.current && videoRef.current.paused && !hasInteractionRef) {
                            videoRef.current.play().catch(e => console.log("Autoplay blocked by browser policy"));
                        }
                    } else {
                        // Pause when completely out of view
                        if (videoRef.current && !videoRef.current.paused) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }
                    }
                });
            },
            { threshold: 0.5 } // Standard: only start when half is visible
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => containerRef.current && observer.unobserve(containerRef.current);
    }, [hasInteractionRef]);

    // --- Core Action: Toggle Play/Pause ---
    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
            setHasInteraction(false); // Reset manual pause flag on manual play
        } else {
            videoRef.current.pause();
            setHasInteraction(true); // Flag that user manually paused
        }
        resetControlsTimer();
    };

    // --- Event Handlers ---
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
        const newTime = percentage * (videoRef.current.duration || 0);
        videoRef.current.currentTime = newTime;
        setProgress(percentage * 100);
    };

    const toggleMute = (e) => {
        if (e) e.stopPropagation();
        setIsMuted(!isMuted);
        resetControlsTimer();
    };

    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
        resetControlsTimer();
    };

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFS);
        return () => document.removeEventListener('fullscreenchange', handleFS);
    }, []);

    // --- Interaction Zones (Double Tap to Seek) ---
    const handleZoneClick = (direction, e) => {
        e.stopPropagation();
        const now = Date.now();
        const diff = now - lastTapRef.current;

        if (diff < 300) {
            setTapAnimation(direction);
            const seekAmount = 10;
            if (videoRef.current) {
                videoRef.current.currentTime += (direction === 'left' ? -seekAmount : seekAmount);
            }
            setTimeout(() => setTapAnimation(null), 500);
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
            togglePlay();
        }
        resetControlsTimer();
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    const Icons = {
        Play: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>,
        Pause: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
        VolumeUp: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>,
        VolumeMute: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z" /></svg>,
        Fullscreen: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zM17 7h-3V5h5v5h-2V7z" /></svg>,
        Forward: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>,
        Backward: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
    };

    return (
        <div 
            className={`modern-video-player adaptive-player ${className || ''}`} 
            ref={containerRef}
            onMouseMove={resetControlsTimer}
            onMouseEnter={resetControlsTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
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

            {/* Interaction Zones */}
            <div className={`seek-zone left ${tapAnimation === 'left' ? 'active' : ''}`} onClick={(e) => handleZoneClick('left', e)}>
                <div className="tap-badge"><Icons.Backward width="24" height="24" /><span>10s</span></div>
            </div>
            <div className={`seek-zone right ${tapAnimation === 'right' ? 'active' : ''}`} onClick={(e) => handleZoneClick('right', e)}>
                <div className="tap-badge"><Icons.Forward width="24" height="24" /><span>10s</span></div>
            </div>

            {/* Center Play Overlay */}
            {!isPlaying && !tapAnimation && (
                <button className="big-play-btn" onClick={togglePlay}>
                    <Icons.Play width="48" height="48" />
                </button>
            )}

            {/* Muted Hint Indicator (Sesi Aç) */}
            {isMuted && isPlaying && (
                <div className="muted-hint persistent-hint" onClick={toggleMute}>
                    <Icons.VolumeMute width="16" height="16" />
                    Sesi Aç
                </div>
            )}

            {/* Controls Overlay */}
            <div className={`player-controls ${showControls ? 'visible' : ''}`}>
                <div className="scrubber-box" onClick={handleSeek}>
                    <div className="buffer-bar" style={{ width: `${buffered}%` }} />
                    <div className="progress-bar" style={{ width: `${progress}%` }}>
                        <div className="handle" />
                    </div>
                </div>

                <div className="controls-main">
                    <div className="group">
                        <button className="icon-btn" onClick={togglePlay}>
                            {isPlaying ? <Icons.Pause width="24" height="24" /> : <Icons.Play width="24" height="24" />}
                        </button>

                        <button className="icon-btn" onClick={toggleMute}>
                            {isMuted ? <Icons.VolumeMute width="22" height="22" /> : <Icons.VolumeUp width="22" height="22" />}
                        </button>

                        <span className="time-text">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>

                    <div className="group">
                        <div className="speed-wrap">
                            <button className="text-btn" onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}>
                                {playbackSpeed}x
                            </button>
                            {showSpeedMenu && (
                                <div className="speed-picker">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                                        <button key={s} className={playbackSpeed === s ? 'active' : ''} onClick={() => handleSpeedChange(s)}>{s}x</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="icon-btn" onClick={toggleFullscreen}>
                            <Icons.Fullscreen width="22" height="22" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
