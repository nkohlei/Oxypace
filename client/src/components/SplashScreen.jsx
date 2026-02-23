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
                    {/* Dark, partially transparent frosted logo mask */}
                    <div className="logo-layer logo-frosted"></div>
                </div>
                {/* 4-Dot Horizontal Loader */}
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    /* Very dark gradient structure */
                    background: linear-gradient(180deg, #010206 0%, #030612 50%, #050a1c 100%);
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
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }

                .splash-logo-container {
                    position: relative;
                    width: 200px; /* Reduced Size */
                    height: 60px; /* Reduced Size */
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

                .logo-frosted {
                    background-color: rgba(255, 255, 255, 0.15); /* Transparent, icy look */
                    backdrop-filter: blur(10px); /* Frosted glass effect */
                    -webkit-backdrop-filter: blur(10px);
                }

                /* 4-Dot Loader Styling */
                .loading-dots {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    align-items: center;
                }

                .loading-dots span {
                    display: block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.4);
                    animation: bounceDots 1.2s infinite ease-in-out both;
                }

                .loading-dots span:nth-child(1) { animation-delay: -0.45s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.30s; }
                .loading-dots span:nth-child(3) { animation-delay: -0.15s; }
                .loading-dots span:nth-child(4) { animation-delay: 0s; }

                @keyframes bounceDots {
                    0%, 80%, 100% {
                        transform: scale(0);
                        background-color: rgba(255, 255, 255, 0.4);
                    }
                    40% {
                        transform: scale(1);
                        background-color: #26D0CE; /* Brand cyan highlight */
                    }
                }

                /* Mobile Adjustment */
                @media (max-width: 768px) {
                    .splash-logo-container {
                        width: 150px;
                        height: 45px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
