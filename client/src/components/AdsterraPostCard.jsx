import React, { useEffect, useState, useRef } from 'react';
import './AdsterraPostCard.css';

const AdsterraPostCard = () => {
    const [loaded, setLoaded] = useState(false);
    const containerRef = useRef(null);
    const scriptRef = useRef(null);

    useEffect(() => {
        // Create the script element
        const script = document.createElement('script');
        script.src = 'https://pl30203450.effectivecpmnetwork.com/941148489c50396c6b0278adff4f7c0c/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');

        script.onload = () => {
            setLoaded(true);
        };
        script.onerror = () => {
            setLoaded(true); // Hide loader on error
        };

        scriptRef.current = script;
        document.body.appendChild(script);

        return () => {
            // Clean up: remove script from body
            if (scriptRef.current && document.body.contains(scriptRef.current)) {
                document.body.removeChild(scriptRef.current);
            }
            // Clear container element content
            const container = document.getElementById('container-941148489c50396c6b0278adff4f7c0c');
            if (container) {
                container.innerHTML = '';
            }
        };
    }, []);

    return (
        <div className="adsterra-post-card">
            <span className="adsterra-badge">Sponsorlu</span>
            <div className="adsterra-wrapper">
                <div id="container-941148489c50396c6b0278adff4f7c0c" ref={containerRef} style={{ width: '100%' }}>
                    {!loaded && (
                        <div className="adsterra-placeholder">
                            <div className="adsterra-shimmer-circle" />
                            <span>Sponsorlu İçerik Yükleniyor...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdsterraPostCard;
