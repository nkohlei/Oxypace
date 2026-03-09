import React, { useState, useEffect } from 'react';

const RoomTimer = ({ startedAt }) => {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        if (!startedAt) {
            setElapsed('00:00');
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.floor((now - startedAt) / 1000); // in seconds
            if (diff < 0) {
                setElapsed('00:00');
                return;
            }

            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;

            if (h > 0) {
                setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setElapsed(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [startedAt]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
            {elapsed}
        </div>
    );
};

export default RoomTimer;
