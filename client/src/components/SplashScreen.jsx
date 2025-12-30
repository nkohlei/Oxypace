import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Start fading out after 2.5 seconds
        const timer = setTimeout(() => {
            setFading(true);
        }, 2500);

        // Notify parent to unmount after animation (e.g. 3.5s total)
        const cleanup = setTimeout(() => {
            if (onFinish) onFinish();
        }, 3500);

        return () => {
            clearTimeout(timer);
            clearTimeout(cleanup);
        };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
            <div className="splash-content">
                <h1 className="deepace-text">DEEPACE</h1>
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

                .deepace-text {
                    font-size: 8rem;
                    font-weight: 900;
                    letter-spacing: 12px;
                    text-transform: uppercase;
                    margin: 0;
                    
                    /* Gradient Text */
                    background: linear-gradient(
                        135deg, 
                        #00C6FF 0%, 
                        #0072FF 25%, 
                        #FF7300 75%, 
                        #FF0055 100%
                    );
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    
                    /* Glow Effect */
                    filter: drop-shadow(0 0 15px rgba(0, 114, 255, 0.6))
                            drop-shadow(0 0 30px rgba(255, 115, 0, 0.4));
                    
                    /* Animation */
                    animation: gradientMove 3s ease infinite, pulseGlow 2s ease-in-out infinite alternate;
                }

                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes pulseGlow {
                    0% {
                        filter: drop-shadow(0 0 10px rgba(0, 114, 255, 0.5))
                                drop-shadow(0 0 20px rgba(255, 115, 0, 0.3));
                        transform: scale(1);
                    }
                    100% {
                        filter: drop-shadow(0 0 25px rgba(0, 198, 255, 0.8))
                                drop-shadow(0 0 50px rgba(255, 115, 0, 0.6));
                        transform: scale(1.05); /* Slight breathe */
                    }
                }

                /* Mobile Adjustment */
                @media (max-width: 768px) {
                    .deepace-text {
                        font-size: 4rem;
                        letter-spacing: 6px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
