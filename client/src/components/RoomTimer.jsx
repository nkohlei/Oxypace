import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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
        gap: '6px',
        background: 'rgba(0,0,0,0.5)',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)'
    };

    return (
        <div style={{ ...defaultStyle, ...style }} className={className}>
            <Clock size={16} strokeWidth={2} />
            {elapsed}
        </div>
    );
};

export default RoomTimer;
