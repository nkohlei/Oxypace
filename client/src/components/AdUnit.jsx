import React, { useEffect, useRef, useState } from 'react';

const AdUnit = ({ slot, style, format = 'auto', responsive = 'true' }) => {
    const adRef = useRef(null);
    const [isBlocked, setIsBlocked] = useState(false);

    // Bot URL/path isolation check for Google AdSense compliance
    const pathLower = typeof window !== 'undefined' ? (window.location.pathname + window.location.hash).toLowerCase() : '';
    const isBotPage = pathLower.includes('bot') || pathLower.includes('news') || pathLower.includes('gelismeler');

    if (isBotPage) {
        return null;
    }

    useEffect(() => {
        // Watchdog: check if Google ads script loaded within 3 seconds
        const watchdog = setTimeout(() => {
            const adsBlocked = !window.adsbygoogle || !window.adsbygoogle.loaded;
            if (adsBlocked) {
                setIsBlocked(true);
            }
        }, 3000);

        const pushAd = () => {
            try {
                if (adRef.current && adRef.current.offsetWidth > 0) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                } else {
                    // Parent layout not fully painted or 0 width
                    console.warn('Ad unit width is 0, skipping push for slot:', slot);
                }
            } catch (e) {
                // Mute errors caused by blocked client scripts
                console.warn('AdSense blocked or failed to push:', e);
                setIsBlocked(true);
            }
        };

        // Small delay to ensure layout is painted
        const timer = setTimeout(() => {
            pushAd();
        }, 1500); // 1.5 seconds delay gives other critical room components (socket, WebRTC) high priority load

        return () => {
            clearTimeout(timer);
            clearTimeout(watchdog);
        };
    }, [slot]);

    if (import.meta.env.NODE_ENV === 'development') {
        return (
            <div
                style={{
                    ...style,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    padding: '12px',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    margin: '20px auto',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                }}
            >
                <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>[DEV] Reklam Sponsor Alanı</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>Slot ID: {slot}</span>
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div
                style={{
                    margin: '20px auto',
                    padding: '24px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    ...style
                }}
            >
                <div style={{ color: '#3b82f6', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    📢 SPONSORLU ALAN
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', lineHeight: '1.4' }}>
                    Oxypace'in tamamen ücretsiz ve bağımsız kalabilmesi için reklam engelleme kurallarınızı esnetebilirsiniz.
                </div>
            </div>
        );
    }

    return (
        <div style={{ margin: '20px auto', textAlign: 'center', minHeight: '90px', maxWidth: '100%', boxSizing: 'border-box', ...style }}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4028999820111107"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            ></ins>
        </div>
    );
};

export default AdUnit;
