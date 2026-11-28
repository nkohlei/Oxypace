import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Start fading out after 2 seconds for a better animation viewing
        const timer = setTimeout(() => {
            setFading(true);
        }, 2000);

        // Notify parent to unmount after animation
        const cleanup = setTimeout(() => {
            if (onFinish) onFinish();
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(cleanup);
        };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${fading ? 'fade-out' : ''}`} role="status" aria-label="Yükleniyor">

            {/* Optimized CSS Noise Overlay (Using pure CSS gradient for texture) */}
            <div className="noise-overlay"></div>

            {/* Volumetric Light Beam */}
            <div className="light-beam"></div>

            <div className="splash-content">
                <div className="splash-logo-container">
                    {/* Solid static white logo mask */}
                    <div className="logo-layer logo-white"></div>
                </div>
                {/* 4-Dot Horizontal Loader */}
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
