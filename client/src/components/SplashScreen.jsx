import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Start fading out after 3 seconds
        const timer = setTimeout(() => {
            setFading(true);
        }, 1500);

        // Notify parent to unmount after animation (4s total)
        const cleanup = setTimeout(() => {
            if (onFinish) onFinish();
        }, 2500);

        return () => {
            clearTimeout(timer);
            clearTimeout(cleanup);
        };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${fading ? 'fade-out' : ''}`} role="status" aria-label="Yükleniyor">
            <div className="splash-content">
                <img src="/logo.png" alt="Oxypace logo yükleniyor" className="splash-logo" />
            </div>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: #000000;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 1s ease-in-out, visibility 1s ease-in-out;
                }

                .splash-screen.fade-out {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }

                .splash-logo {
                    width: 250px;
                    height: auto;
                    filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.6)) brightness(1.2);
                    animation: sway 2s ease-in-out infinite alternate, glowPulse 2s infinite alternate;
                }

                @keyframes sway {
                    0% { transform: rotate(-10deg) scale(1); }
                    100% { transform: rotate(10deg) scale(1.1); }
                }

                @keyframes glowPulse {
                    0% { filter: drop-shadow(0 0 15px rgba(255, 69, 0, 0.5)) brightness(1); }
                    100% { filter: drop-shadow(0 0 40px rgba(255, 215, 0, 0.8)) brightness(1.3); }
                }

                /* Mobile Adjustment */
                @media (max-width: 768px) {
                    .splash-logo {
                        width: 180px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
