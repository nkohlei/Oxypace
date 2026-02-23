import React, { useEffect, useState } from 'react';

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
                    {/* Base Solid White Mask */}
                    <div className="logo-layer logo-white"></div>
                    {/* Vibrant Animated Gradient Mask */}
                    <div className="logo-layer logo-gradient"></div>
                </div>
            </div>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    /* Deep Navy to Turquoise/Cyan Gradient - Darkened */
                    background: linear-gradient(135deg, #02040f 0%, #050b1a 40%, #0a1f33 70%, #178a80 100%);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out;
                    overflow: hidden;
                    will-change: opacity, visibility;
                }

                .splash-screen.fade-out {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }

                /* Noise Grain Texture (Simplified for Performance) */
                .noise-overlay {
                    position: absolute;
                    inset: 0;
                    opacity: 0.15;
                    background-image: repeating-radial-gradient(circle at 17% 32%, rgb(255,255,255, 0.05) 0vw, rgb(0,0,0, 0.05) 1vw);
                    pointer-events: none;
                    z-index: 1;
                }

                /* Volumetric Lighting (Simplified blur) */
                .light-beam {
                    position: absolute;
                    bottom: -30%;
                    right: -20%;
                    width: 70vw;
                    height: 70vw;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(64, 224, 208, 0.25) 0%, transparent 70%);
                    z-index: 2;
                    transform: rotate(-35deg) scaleY(1.3);
                    pointer-events: none;
                    animation: pulseBeam 4s ease-in-out infinite alternate;
                    will-change: transform, opacity;
                }

                @keyframes pulseBeam {
                    0% { opacity: 0.5; transform: rotate(-35deg) scaleY(1.5) scaleX(1); }
                    100% { opacity: 0.9; transform: rotate(-35deg) scaleY(1.6) scaleX(1.1); }
                }

                .splash-content {
                    position: relative;
                    z-index: 10;
                    /* Removed heavy drop-shadow filter, replaced with simple structural shadow on pseudo element */
                }

                .splash-logo-container {
                    position: relative;
                    width: 320px;
                    height: 100px;
                }

                .logo-layer {
                    position: absolute;
                    inset: 0;
                    -webkit-mask-image: url('/oxypace-text-logo.png');
                    -webkit-mask-size: contain;
                    -webkit-mask-repeat: no-repeat;
                    -webkit-mask-position: center;
                    mask-image: url('/oxypace-text-logo.png');
                    mask-size: contain;
                    mask-repeat: no-repeat;
                    mask-position: center;
                }

                .logo-white {
                    background-color: #ffffff;
                    opacity: 0.85;
                }

                .logo-gradient {
                    background: linear-gradient(90deg, #1A2980, #26D0CE, #1A2980);
                    background-size: 200% 100%;
                    clip-path: inset(0 100% 0 0);
                    animation: fillWipe 1.8s cubic-bezier(0.86, 0, 0.07, 1) infinite;
                    will-change: clip-path, background-position;
                }

                @keyframes fillWipe {
                    0%, 10% {
                        clip-path: inset(0 100% 0 0);
                        background-position: 100% 0;
                    }
                    40%, 60% {
                        clip-path: inset(0 0% 0 0);
                        background-position: 0% 0;
                    }
                    90%, 100% {
                        clip-path: inset(0 0 0 100%);
                        background-position: 100% 0;
                    }
                }

                /* Mobile Adjustment */
                @media (max-width: 768px) {
                    .splash-logo-container {
                        width: 220px;
                        height: 70px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
