import { useState, useEffect, useRef, useCallback } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, className }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [buffered, setBuffered] = useState(0);

    // Controls Visibility State
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

    // Lazy Load State
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Double Tap State
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [tapAnimation, setTapAnimation] = useState(null); // 'left' or 'right'

    // Format time helper
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    // --- Auto-Hide Controls Logic ---
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        // setShowSpeedMenu(false); // FIXED: Don't close menu on mouse move!

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false); // Close menu when controls hide
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
            // If playing, start timer immediately if mouse isn't moving
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying]);

    // --- Cleanup on unmount: stop downloads, release network resources ---
    useEffect(() => {
        const video = videoRef.current;
        return () => {
            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load(); // Abort any in-progress network download
            }
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);


    // --- Intersection Observer (Lazy Load) ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsVisible(entry.isIntersecting);

                if (entry.isIntersecting) {
                    if (videoRef.current && !isLoaded) {
                        videoRef.current.preload = 'metadata';
                    }
                } else {
                    if (videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                    }
                }
            },
            { threshold: 0.5, rootMargin: '100px 0px' }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => containerRef.current && observer.unobserve(containerRef.current);
    }, [isLoaded]);

    // --- Event Handlers ---

    const togglePlay = (e) => {
        e?.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(current);
        setDuration(dur);
        setProgress((current / dur) * 100);

        // Update buffer
        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            setBuffered((bufferedEnd / dur) * 100);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation(); // prevent drag bubbling
        if (!videoRef.current) return;

        // Click position calculation
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));

        const newTime = percentage * videoRef.current.duration;

        // Update immediately
        videoRef.current.currentTime = newTime;
        setProgress(percentage * 100);
        setCurrentTime(newTime);
    };

    // Double Tap Logic
    const lastTapRef = useRef(0);
    const handleZoneClick = (direction, e) => {
        e.stopPropagation();
        const now = Date.now();
        const diff = now - lastTapRef.current;

        if (diff < 300) {
            // Double Tap Detected
            setTapAnimation(direction);
            const seekAmount = 10;
            if (videoRef.current) {
                videoRef.current.currentTime += (direction === 'left' ? -seekAmount : seekAmount);
            }
            setTimeout(() => setTapAnimation(null), 500);
        } else {
            // Single Tap - toggle play/pause
            togglePlay();
        }
        lastTapRef.current = now;

        // Ensure controls show on tap
        handleMouseMove();
    };

    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
        handleMouseMove();
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isMuted) {
            videoRef.current.volume = volume || 1;
            setIsMuted(false);
        } else {
            videoRef.current.volume = 0;
            setIsMuted(true);
        }
        handleMouseMove();
    };

    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) videoRef.current.playbackRate = speed;
        setShowSpeedMenu(false);
        handleMouseMove();
    };

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        handleMouseMove();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen(); // Safari
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Listen for fullscreen change
    useEffect(() => {
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    // Icons (SVGs)
    const Icons = {
        Play: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>,
        Pause: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
        VolumeUp: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>,
        VolumeMute: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>,
        Fullscreen: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>,
        ExitFullscreen: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>,
        Forward10: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>,
        Rewind10: (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
    };


    return (
        <div
            className={`video-player-wrapper ${className || ''}`}
            ref={containerRef}
            onMouseEnter={handleMouseMove}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={() => setShowSpeedMenu(false)}
        >
            <div className="video-container" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={isVisible || isLoaded ? src : undefined}
                    loop
                    poster={poster}
                    className="main-video"
                    preload="none"
                    playsInline
                    onLoadedMetadata={() => {
                        setIsLoaded(true);
                        setDuration(videoRef.current.duration);
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />
            </div>

            {/* Double Tap Zones */}
            <div
                className={`double-tap-zone zone-left ${tapAnimation === 'left' ? 'active' : ''}`}
                onClick={(e) => handleZoneClick('left', e)}
                aria-hidden="true"
            >
                <div className="tap-icon"><Icons.Rewind10 width="32" height="32" /></div>
            </div>

            <div
                className={`double-tap-zone zone-right ${tapAnimation === 'right' ? 'active' : ''}`}
                onClick={(e) => handleZoneClick('right', e)}
                aria-hidden="true"
            >
                <div className="tap-icon"><Icons.Forward10 width="32" height="32" /></div>
            </div>

            {/* Big Center Play Button (overlay) */}
            {!isPlaying && !tapAnimation && (
                <div className="center-play-overlay">
                    <div className="play-button" style={{ transform: 'scale(1.2)' }}>
                        <Icons.Play width="36" height="36" />
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <div className={`video-controls-overlay ${showControls ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="progress-container" onClick={handleSeek}>
                    <div className="buffered-fill" style={{ width: `${buffered}%` }}></div>
                    <div className="progress-fill" style={{ width: `${progress}%` }}>
                        <div className="progress-thumb"></div>
                    </div>
                </div>

                <div className="controls-row">
                    <div className="controls-left">
                        <button className="control-btn" onClick={togglePlay} aria-label={isPlaying ? 'Duraklat' : 'Oynat'}>
                            {isPlaying ? <Icons.Pause width="24" height="24" /> : <Icons.Play width="24" height="24" />}
                        </button>

                        <div className="volume-container">
                            <button className="control-btn" onClick={toggleMute} aria-label={isMuted || volume === 0 ? 'Sesi aç' : 'Sessiz'}>
                                {isMuted || volume === 0 ? <Icons.VolumeMute width="20" height="20" /> : <Icons.VolumeUp width="20" height="20" />}
                            </button>
                            <div className="volume-slider-wrapper">
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="volume-slider"
                                    aria-label="Ses seviyesi"
                                />
                            </div>
                        </div>

                        <div className="time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="controls-right">
                        <div className="speed-selector" role="button" tabIndex="0" aria-label={`Oynatma hızı: ${playbackSpeed}x`} onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}>
                            {playbackSpeed}x
                            {showSpeedMenu && (
                                <div className="speed-menu">
                                    {[0.5, 1, 1.5, 2].map(s => (
                                        <div
                                            key={s}
                                            className={`speed-item ${playbackSpeed === s ? 'active' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleSpeedChange(s); }}
                                        >
                                            {s}x
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="control-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}>
                            {isFullscreen ? <Icons.ExitFullscreen width="20" height="20" /> : <Icons.Fullscreen width="20" height="20" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
