import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { X } from 'lucide-react';
import './WatchPartyPlayer.css';

const WatchPartyPlayer = () => {
    const { 
        watchParty, 
        stopWatchParty, 
        sendWatchPlay, 
        sendWatchPause, 
        sendWatchSeek
    } = useVoice();

    const playerRef = useRef(null);
    const isSyncingRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    // All participants in the watch party have permissions to play, pause, and seek
    const isHost = true;

    // Reset error state when the URL changes
    useEffect(() => {
        setHasError(false);
        setIsReady(false);
    }, [watchParty?.url]);

    // Synchronize time updates from the room state
    useEffect(() => {
        if (!watchParty || !playerRef.current || !isReady || hasError) return;

        // Calculate expected time based on when the state was last updated
        let expectedTime = watchParty.currentTime;
        if (watchParty.isPlaying && watchParty.lastUpdated) {
            const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
            expectedTime += elapsed;
        }

        const localTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(localTime - expectedTime);

        // Sync time if diff is greater than 3 seconds (buffering / catching up)
        if (timeDiff > 3) {
            isSyncingRef.current = true;
            playerRef.current.seekTo(expectedTime, 'seconds');
            console.log(`[Watch Party] Synced buffering offset. Difference: ${timeDiff}s. Seeking to: ${expectedTime}s`);
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 200);
        }
    }, [watchParty?.currentTime, watchParty?.isPlaying, isReady, hasError]);

    const handlePlay = () => {
        if (isSyncingRef.current) return;
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPlay(time);
    };

    const handlePause = () => {
        if (isSyncingRef.current) return;
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPause(time);
    };

    const handleSeek = (e) => {
        if (isSyncingRef.current) return;
        sendWatchSeek(e);
    };

    if (!watchParty || !watchParty.url) return null;

    if (hasError) {
        return (
            <div className="watch-party-player-wrapper" style={{ padding: '32px', color: '#ff4444', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                <span className="watch-party-title" style={{ color: '#ff4444', fontSize: '16px' }}>Oynatma Hatası</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '400px' }}>Video yüklenemedi. Lütfen geçerli bir YouTube URL'si girdiğinizden emin olun.</p>
                <button className="watch-party-stop-btn glass-btn danger" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={stopWatchParty}>Kapat</button>
            </div>
        );
    }

    return (
        <div className="watch-party-player-wrapper">
            <div className="watch-party-header">
                <span className="watch-party-title">Birlikte İzle (YouTube)</span>
                <button className="watch-party-stop-btn glass-btn danger" onClick={stopWatchParty} title="Birlikte İzle Modunu Kapat">
                    <X size={16} /> <span>Bitir</span>
                </button>
            </div>
            <div className="watch-party-player-container">
                <ReactPlayer
                    ref={playerRef}
                    url={watchParty.url}
                    playing={watchParty.isPlaying}
                    controls={isHost}
                    width="100%"
                    height="100%"
                    onError={(e) => console.warn("ReactPlayer non-fatal error logged:", e)}
                    onReady={() => setIsReady(true)}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={handleSeek}
                    config={{
                        youtube: {
                            playerVars: { autoplay: 1, disablekb: 0 }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default WatchPartyPlayer;
