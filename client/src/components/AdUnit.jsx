import React, { useEffect } from 'react';

const AdUnit = ({ slot, style, format = 'auto', responsive = 'true' }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    if (process.env.NODE_ENV === 'development') {
        return (
            <div style={{ ...style, background: '#f0f0f0', border: '1px solid #ccc', padding: '10px', textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#666', fontSize: '12px' }}>Ad Space (Slot: {slot})</span>
            </div>
        );
    }

    return (
        <div style={{ margin: '20px 0', textAlign: 'center', ...style }}>
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-4028999820111107"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}></ins>
        </div>
    );
};

export default AdUnit;
