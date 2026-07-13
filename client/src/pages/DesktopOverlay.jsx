import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { MicOff } from 'lucide-react';
import './DesktopOverlay.css';

const DesktopOverlay = () => {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        if (!window.desktopAPI) return;

        // Subscribing to participant updates sent from the main window via IPC
        const unsubscribe = window.desktopAPI.onOverlayParticipantsUpdate((data) => {
            setParticipants(data || []);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Filter to only active speaking or non-muted participants to keep it clean (or show everyone in channel)
    // We will show everyone in the channel, sorting active speakers to the top
    const sortedParticipants = [...participants].sort((a, b) => {
        if (a.isSpeaking && !b.isSpeaking) return -1;
        if (!a.isSpeaking && b.isSpeaking) return 1;
        return 0;
    });

    if (sortedParticipants.length === 0) {
        return null;
    }

    return (
        <div className="desktop-overlay-container">
            <div className="desktop-overlay-list">
                {sortedParticipants.map((p) => {
                    const avatarUrl = getImageUrl(p.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=333&color=fff&size=80`;
                    
                    return (
                        <div 
                            key={p.identity} 
                            className={`desktop-overlay-user ${p.isSpeaking ? 'speaking' : ''}`}
                        >
                            <div className="overlay-avatar-wrapper">
                                <img 
                                    className={`overlay-avatar ${p.isSpeaking ? 'speaking-glow' : ''}`} 
                                    src={avatarUrl} 
                                    alt="" 
                                />
                                {p.isMuted && (
                                    <div className="overlay-mute-badge">
                                        <MicOff size={10} />
                                    </div>
                                )}
                            </div>
                            <span className="overlay-username">{p.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DesktopOverlay;
