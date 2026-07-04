import React, { useEffect, useState } from 'react';
import './ExternalAdHolder.css';

const ExternalAdHolder = () => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Simulate external script fetching / ad loading delay
        const timer = setTimeout(() => {
            setLoaded(true);
        }, 1200);

        // Real programmatic scripts example:
        // try {
        //     (window.adsbygoogle = window.adsbygoogle || []).push({});
        // } catch (err) {
        //     console.warn("External ad scripts not ready yet", err);
        // }

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="external-ad-holder-container">
            <span className="external-ad-badge">Sponsorlu</span>
            <div id="external-ad-holder" className="external-ad-wrapper">
                {!loaded ? (
                    <div className="external-ad-placeholder">
                        <div className="ad-placeholder-shimmer" />
                        <span>Reklam Yükleniyor...</span>
                    </div>
                ) : (
                    <div 
                        style={{ 
                            width: '100%', 
                            height: '220px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.04)'
                        }}
                    >
                        <div style={{ color: '#60a5fa', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                            Programatik Reklam Ağı
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                            Google Ad Manager / AdSense Display Unit
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExternalAdHolder;
