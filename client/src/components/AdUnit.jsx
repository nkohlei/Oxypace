import React, { useEffect, useRef } from 'react';

const AdUnit = ({ slot, style, format = 'auto', responsive = 'true' }) => {
    const adRef = useRef(null);

    useEffect(() => {
        const pushAd = () => {
            try {
                if (adRef.current && adRef.current.offsetWidth > 0) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                } else {
                    // If width is 0, it might be hidden or not rendered layout yet.
                    // We can try a small timeout or just skip. 
                    // Common fix is to ensure the parent has width.
                    // For now, let's try a small delay if it's 0, or just not push if hidden.
                    console.warn('Ad unit width is 0, skipping push for slot:', slot);
                }
            } catch (e) {
                console.error('AdSense error:', e);
            }
        };

        // Small delay to ensure layout is painted
        const timer = setTimeout(() => {
            pushAd();
        }, 100);

        return () => clearTimeout(timer);
    }, [slot]);

    if (import.meta.env.NODE_ENV === 'development') {
        return (
            <div
                style={{
                    ...style,
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '10px',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span style={{ color: '#666', fontSize: '12px' }}>Ad Space (Slot: {slot})</span>
            </div>
        );
    }

    return (
        <div style={{ margin: '20px 0', textAlign: 'center', minHeight: '90px', ...style }}>
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
