import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { X, RotateCcw } from 'lucide-react';
import './WatchPartyPlayer.css';

const WatchPartyPlayer = () => {
    const { 
        watchParty, 
        stopWatchParty, 
        sendWatchPlay, 
        sendWatchPause, 
        sendWatchSeek,
        activeRoom
    } = useVoice();

    const playerRef = useRef(null);
    const isSyncingRef = useRef(false);
    const [playing, setPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const userRole = activeRoom?.userRole || 'member';
    const isHost = userRole === 'owner' || userRole === 'admin';

    // Synchronize play/pause and time updates from the room state
    useEffect(() => {
        if (!watchParty || !playerRef.current || !isReady) return;

        // Calculate expected time based on when the state was last updated
        let expectedTime = watchParty.currentTime;
        if (watchParty.isPlaying && watchParty.lastUpdated) {
            const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
            expectedTime += elapsed;
        }

        const localTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(localTime - expectedTime);

        // Sync playback state
        if (watchParty.isPlaying !== playing) {
            isSyncingRef.current = true;
            setPlaying(watchParty.isPlaying);
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 100);
        }

        // Sync time if diff is greater than 3 seconds (buffering / catching up)
        if (timeDiff > 3) {
            isSyncingRef.current = true;
            playerRef.current.seekTo(expectedTime, 'seconds');
            console.log(`[Watch Party] Synced buffering offset. Difference: ${timeDiff}s. Seeking to: ${expectedTime}s`);
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 150);
        }
    }, [watchParty, isReady, playing]);

    const handlePlay = () => {
        if (isSyncingRef.current) return;
        if (!isHost) {
            // Revert non-host changes
            syncToWatchParty();
            return;
        }
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPlay(time);
    };

    const handlePause = () => {
        if (isSyncingRef.current) return;
        if (!isHost) {
            syncToWatchParty();
            return;
        }
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPause(time);
    };

    const handleSeek = (e) => {
        if (isSyncingRef.current) return;
        if (!isHost) {
            syncToWatchParty();
            return;
        }
        sendWatchSeek(e);
    };

    const syncToWatchParty = () => {
        if (!watchParty || !playerRef.current) return;
        let expectedTime = watchParty.currentTime;
        if (watchParty.isPlaying && watchParty.lastUpdated) {
            const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
            expectedTime += elapsed;
        }
        isSyncingRef.current = true;
        setPlaying(watchParty.isPlaying);
        playerRef.current.seekTo(expectedTime, 'seconds');
        setTimeout(() => {
            isSyncingRef.current = false;
        }, 150);
    };

    if (!watchParty || !watchParty.url) return null;

    return (
        <div className="watch-party-player-wrapper">
            <div className="watch-party-header">
                <span className="watch-party-title">Birlikte İzle (YouTube)</span>
                {isHost && (
                    <button className="watch-party-stop-btn glass-btn danger" onClick={stopWatchParty} title="Birlikte İzle Modunu Kapat">
                        <X size={16} /> <span>Bitir</span>
                    </button>
                )}
            </div>
            <div className="watch-party-player-container">
                <ReactPlayer
                    ref={playerRef}
                    url={watchParty.url}
                    playing={playing}
                    controls={isHost}
                    width="100%"
                    height="100%"
                    onReady={() => setIsReady(true)}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={handleSeek}
                    config={{
                        youtube: {
                            playerVars: { autoplay: 1, disablekb: isHost ? 0 : 1 }
                        }
                    }}
                />
                {!isHost && (
                    <div className="watch-party-overlay" onClick={syncToWatchParty}>
                        <div className="overlay-sync-info glass-panel">
                            <RotateCcw size={16} />
                            <span>Yayını Yöneticiyle Eşitle</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchPartyPlayer;
