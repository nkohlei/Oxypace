import React, { useEffect, useState, useRef } from 'react';
import './AdsterraPostCard.css';

const AdsterraPostCard = () => {
    const [loaded, setLoaded] = useState(false);
    const [adFailed, setAdFailed] = useState(false);
    const containerRef = useRef(null);
    const scriptRef = useRef(null);

    useEffect(() => {
        // Create the script element
        const script = document.createElement('script');
        script.src = 'https://pl30203450.effectivecpmnetwork.com/941148489c50396c6b0278adff4f7c0c/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');

        script.onload = () => {
            // Trigger a quick check, but let the watchdog run for elements rendering
            const container = document.getElementById('container-941148489c50396c6b0278adff4f7c0c');
            if (container && container.children.length > 0) {
                setLoaded(true);
            }
        };
        script.onerror = () => {
            setAdFailed(true);
        };

        scriptRef.current = script;
        document.body.appendChild(script);

        // 4-Second Watchdog Timer to check fill rate / ad blockers
        const watchdog = setTimeout(() => {
            const container = document.getElementById('container-941148489c50396c6b0278adff4f7c0c');
            if (!container || container.children.length === 0) {
                console.warn("Adsterra ad empty or blocked after 4 seconds. Activating premium fallback.");
                setAdFailed(true);
            } else {
                setLoaded(true);
            }
        }, 4000);

        return () => {
            clearTimeout(watchdog);
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
            
            {/* Always show skeleton shimmer layout behind the loading area to prevent CLS */}
            {!loaded && !adFailed && <div className="adsterra-skeleton-bg" />}

            <div className="adsterra-wrapper">
                {adFailed ? (
                    // Premium fallback container preserving feed layout aesthetics
                    <div className="adsterra-fallback-card">
                        <div className="adsterra-fallback-icon">✨</div>
                        <h5 className="adsterra-fallback-title">Sponsorlu İçerik</h5>
                        <p className="adsterra-fallback-desc">
                            Oxypace topluluklarını özgürce kullanabilmeniz için sponsorlu içerikler sunuyoruz.
                        </p>
                    </div>
                ) : (
                    <div id="container-941148489c50396c6b0278adff4f7c0c" ref={containerRef} style={{ width: '100%' }}>
                        {!loaded && (
                            <div className="adsterra-placeholder">
                                <div className="adsterra-shimmer-circle" />
                                <span>İçerik Yükleniyor...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdsterraPostCard;
