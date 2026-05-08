import React, { useState, useEffect } from 'react';

const RoomTimer = ({ startedAt, style = {}, className = "" }) => {
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

    const defaultStyle = {
        display: 'flex',
        alignItems: 'center',
        fontSize: '15px',
        fontWeight: '800',
        color: '#39FF14', // Phosphorus green
        background: 'transparent',
        border: 'none',
        padding: '0 4px',
    };

    return (
        <div style={{ ...defaultStyle, ...style }} className={className}>
            {elapsed}
        </div>
    );
};

export default RoomTimer;
