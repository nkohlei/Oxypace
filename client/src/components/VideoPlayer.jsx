import { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ src, poster, className }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsVisible(entry.isIntersecting);

                if (entry.isIntersecting) {
                    // Preload metadata when visible
                    if (videoRef.current && !isLoaded) {
                        videoRef.current.preload = 'metadata';
                    }
                } else {
                    // Pause if scrolled out of view
                    if (videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                    }
                }
            },
            {
                threshold: 0.5, // 50% visible to count as "in view"
                rootMargin: '100px 0px' // Start loading slightly before entering viewport
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [isLoaded]);

    const togglePlay = (e) => {
        e.stopPropagation(); // Prevent post click
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleVideoClick = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    return (
        <div ref={containerRef} className={`video-player-container ${className || ''}`} onClick={e => e.stopPropagation()}>
            <video
                ref={videoRef}
                src={isVisible || isLoaded ? src : undefined} // Only set src if visible or already loaded to save initial requests
                poster={poster}
                preload="none"
                playsInline
                controls={isLoaded && isPlaying} // Show native controls only when playing
                className="post-video"
                onLoadedMetadata={() => setIsLoaded(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={handleVideoClick}
            />

            {/* Custom Play Overlay - Visible when paused */}
            {!isPlaying && (
                <div className="video-overlay" onClick={togglePlay}>
                    <div className="play-button">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
