import React, { useState, useEffect } from 'react';
import { useVoice } from '../context/VoiceContext';

const RoomTimer = ({ startedAt, style = {}, className = "" }) => {
    // roomDuration removed from VoiceContext (was causing 1s re-renders of entire context tree).
    // We now compute elapsed locally — RoomTimer only re-renders itself.
    const { roomStartTime } = useVoice() || {};
    const [elapsed, setElapsed] = useState('00:00');

    useEffect(() => {
        // Determine the effective start time: prefer the voice room's start if it matches
        const effectiveStart = (roomStartTime && startedAt === roomStartTime)
            ? roomStartTime
            : startedAt;

        if (!effectiveStart) {
            setElapsed('00:00');
            return;
        }

        const updateTimer = () => {
            const diff = Math.floor((Date.now() - effectiveStart) / 1000);
            if (diff < 0) { setElapsed('00:00'); return; }
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setElapsed(
                h > 0
                    ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [startedAt, roomStartTime]);

    const defaultStyle = {
        display: 'flex',
        alignItems: 'center',
        fontSize: '15px',
        fontWeight: '800',
        color: '#39FF14',
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

