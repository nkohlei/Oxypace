import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { X } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import './WatchPartyPlayer.css';

const loadHls = () => {
  return new Promise((resolve, reject) => {
    if (window.Hls) {
      resolve(window.Hls);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    script.onload = () => {
      if (window.Hls) resolve(window.Hls);
      else reject(new Error('Hls.js failed to load'));
    };
    script.onerror = () => reject(new Error('Hls.js script error'));
    document.head.appendChild(script);
  });
};

const loadDash = () => {
  return new Promise((resolve, reject) => {
    if (window.dashjs) {
      resolve(window.dashjs);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/dashjs@4.7.4/dist/dash.all.min.js';
    script.onload = () => {
      if (window.dashjs) resolve(window.dashjs);
      else reject(new Error('Dash.js failed to load'));
    };
    script.onerror = () => reject(new Error('Dash.js script error'));
    document.head.appendChild(script);
  });
};

const isHls = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return cleanUrl.endsWith('.m3u8') || url.includes('.m3u8') || url.includes('/hls/');
};

const isDash = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return cleanUrl.endsWith('.mpd') || url.includes('.mpd') || url.includes('/dash/');
};

const isLiveStream = (url) => {
  return isHls(url) || isDash(url);
};

const getProxiedUrl = (url) => {
  if (!url) return '';
  if (!url.startsWith('http')) return url;
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const baseUrl = ((!isNative && !import.meta.env.DEV) ? '' : (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://api.oxypace.com.tr' : ''))).replace(/\/$/, '');
  return `${baseUrl}/api/media/${encodeURIComponent(url)}`;
};

const WatchPartyPlayer = () => {
    const { 
        watchParty, 
        stopWatchParty, 
        sendWatchPlay, 
        sendWatchPause, 
        sendWatchSeek
    } = useVoice();

    const playerRef = useRef(null);
    const videoRef = useRef(null);
    const hlsInstanceRef = useRef(null);
    const dashPlayerRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    const isSyncingRef = useRef(false);
    const lastProgrammaticSeekTimeRef = useRef(null);
    const lastPolledTimeRef = useRef(null);
    const prevIsPlayingRef = useRef(false);

    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [reconnectCount, setReconnectCount] = useState(0);
    const [useProxy, setUseProxy] = useState(false);

    const isHost = true;

    const triggerReconnect = () => {
        if (reconnectTimerRef.current) return;
        console.log("[WatchPartyPlayer] Scheduling auto-reconnect...");
        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            setReconnectCount(prev => prev + 1);
        }, 3000);
    };

    // Reset states when the URL changes
    useEffect(() => {
        setHasError(false);
        setIsReady(false);
        setUseProxy(false);
        lastProgrammaticSeekTimeRef.current = null;
        lastPolledTimeRef.current = null;
        prevIsPlayingRef.current = false;
        
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        // Clean up native video src if switching to a non-live stream
        if (!isLiveStream(watchParty?.url) && videoRef.current) {
            videoRef.current.src = "";
            videoRef.current.load();
        }
    }, [watchParty?.url]);

    // Cleanup timers and player instances on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
            }
            if (dashPlayerRef.current) {
                dashPlayerRef.current.destroy();
            }
        };
    }, []);

    // Load and initialize HLS/DASH dynamic libraries on stream changes
    useEffect(() => {
        if (!watchParty?.url || !isLiveStream(watchParty.url) || !videoRef.current) return;

        const video = videoRef.current;
        const streamUrl = useProxy ? getProxiedUrl(watchParty.url) : watchParty.url;
        const urlIsHls = isHls(watchParty.url);
        const urlIsDash = isDash(watchParty.url);

        console.log(`[WatchPartyPlayer] Initializing stream. URL: ${streamUrl} (useProxy: ${useProxy})`);

        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }
        if (dashPlayerRef.current) {
            dashPlayerRef.current.destroy();
            dashPlayerRef.current = null;
        }

        const initPlayer = async () => {
            try {
                if (urlIsHls) {
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        // Native HLS (iOS Safari / Safari)
                        video.src = streamUrl;
                        video.addEventListener('loadedmetadata', () => {
                            setIsReady(true);
                            if (watchParty.isPlaying) {
                                video.play().catch(err => console.warn("Native HLS autoplay blocked", err));
                            }
                        });
                        video.onerror = (e) => {
                            console.error("Native HLS playback error:", e);
                            if (!useProxy) {
                                console.log("[WatchPartyPlayer] Direct native HLS failed. Falling back to CORS proxy...");
                                setUseProxy(true);
                            } else {
                                triggerReconnect();
                            }
                        };
                    } else {
                        // Use Hls.js
                        const Hls = await loadHls();
                        const hls = new Hls({
                            maxMaxBufferLength: 10,
                            enableWorker: true,
                            lowLatencyMode: true,
                            backBufferLength: 30
                        });
                        hlsInstanceRef.current = hls;
                        hls.loadSource(streamUrl);
                        hls.attachMedia(video);
                        
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            setIsReady(true);
                            if (watchParty.isPlaying) {
                                video.play().catch(err => console.warn("Hls.js autoplay blocked", err));
                            }
                        });

                        hls.on(Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                console.warn("Fatal Hls.js error encountered:", data);
                                if (!useProxy) {
                                    console.log("[WatchPartyPlayer] Direct Hls.js failed. Falling back to CORS proxy...");
                                    setUseProxy(true);
                                } else {
                                    switch (data.type) {
                                        case Hls.ErrorTypes.NETWORK_ERROR:
                                            hls.startLoad();
                                            break;
                                        case Hls.ErrorTypes.MEDIA_ERROR:
                                            hls.recoverMediaError();
                                            break;
                                        default:
                                            triggerReconnect();
                                            break;
                                    }
                                }
                            }
                        });
                    }
                } else if (urlIsDash) {
                    const dashjs = await loadDash();
                    const player = dashjs.MediaPlayer().create();
                    dashPlayerRef.current = player;
                    player.initialize(video, streamUrl, watchParty.isPlaying);
                    
                    player.on(dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, () => {
                        setIsReady(true);
                    });

                    player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
                        console.error("Dash.js error encountered:", e);
                        if (!useProxy) {
                            console.log("[WatchPartyPlayer] Direct DASH failed. Falling back to CORS proxy...");
                            setUseProxy(true);
                        } else {
                            triggerReconnect();
                        }
                    });
                }
            } catch (err) {
                console.error("Streaming setup error:", err);
                if (!useProxy) {
                    setUseProxy(true);
                } else {
                    triggerReconnect();
                }
            }
        };

        initPlayer();

        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
            if (dashPlayerRef.current) {
                dashPlayerRef.current.destroy();
                dashPlayerRef.current = null;
            }
        };
    }, [watchParty?.url, reconnectCount, useProxy]);

    // Live sync enforcement (keeps all users in the live edge in real time)
    useEffect(() => {
        if (!watchParty || !isLiveStream(watchParty.url) || !videoRef.current) return;
        const video = videoRef.current;

        if (watchParty.isPlaying) {
            if (video.paused) {
                video.play().catch(err => console.warn("Playback failed", err));
            }
            let liveEdge = null;
            if (hlsInstanceRef.current && hlsInstanceRef.current.liveSyncPosition) {
                liveEdge = hlsInstanceRef.current.liveSyncPosition;
            } else if (video.seekable && video.seekable.length > 0) {
                liveEdge = video.seekable.end(video.seekable.length - 1);
            }
            if (liveEdge && Math.abs(video.currentTime - liveEdge) > 3) {
                video.currentTime = liveEdge;
            }
        } else {
            if (!video.paused) {
                video.pause();
            }
        }
    }, [watchParty?.isPlaying, watchParty?.lastUpdated, watchParty?.url]);

    // Periodic synchronization check for live streams (keeps stream from drifting)
    useEffect(() => {
        if (!watchParty || !isLiveStream(watchParty.url) || !videoRef.current) return;
        
        const interval = setInterval(() => {
            const video = videoRef.current;
            if (!video || video.paused || !watchParty.isPlaying) return;

            let liveEdge = null;
            if (hlsInstanceRef.current && hlsInstanceRef.current.liveSyncPosition) {
                liveEdge = hlsInstanceRef.current.liveSyncPosition;
            } else if (dashPlayerRef.current) {
                liveEdge = dashPlayerRef.current.duration();
            } else if (video.seekable && video.seekable.length > 0) {
                liveEdge = video.seekable.end(video.seekable.length - 1);
            }

            if (liveEdge && Math.abs(video.currentTime - liveEdge) > 3) {
                console.log(`[WatchPartyPlayer] Syncing client to live edge. Drift: ${Math.abs(video.currentTime - liveEdge).toFixed(1)}s`);
                video.currentTime = liveEdge;
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [watchParty?.isPlaying, watchParty?.url]);

    // Standard Video Polling (only for non-live files)
    useEffect(() => {
        if (!isReady || hasError || !playerRef.current || isLiveStream(watchParty?.url)) return;

        const interval = setInterval(() => {
            const player = playerRef.current;
            if (!player) return;

            try {
                const currentTime = player.getCurrentTime();
                if (typeof currentTime !== 'number') return;

                if (lastPolledTimeRef.current !== null && !isSyncingRef.current) {
                    const expectedProgress = watchParty?.isPlaying ? 0.4 : 0;
                    const diff = Math.abs(currentTime - lastPolledTimeRef.current - expectedProgress);

                    if (diff > 1.5) {
                        console.log(`[Watch Party] Manual seek detected: ${lastPolledTimeRef.current}s -> ${currentTime}s`);
                        sendWatchSeek(currentTime);
                    }
                }
                lastPolledTimeRef.current = currentTime;
            } catch (err) {
                console.error("Error polling player time:", err);
            }
        }, 400);

        return () => clearInterval(interval);
    }, [isReady, hasError, watchParty?.isPlaying, watchParty?.url, sendWatchSeek]);

    // Standard Video Synchronization (only for non-live files)
    useEffect(() => {
        if (!watchParty || !playerRef.current || !isReady || hasError || isLiveStream(watchParty?.url)) return;

        let expectedTime = watchParty.currentTime;
        if (watchParty.isPlaying && watchParty.lastUpdated) {
            const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
            expectedTime += elapsed;
        }

        const localTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(localTime - expectedTime);

        const isPlayTransition = watchParty.isPlaying && !prevIsPlayingRef.current;
        const threshold = isPlayTransition ? 0.1 : (watchParty.isPlaying ? 0.8 : 0.3);

        if (timeDiff > threshold) {
            isSyncingRef.current = true;
            lastProgrammaticSeekTimeRef.current = expectedTime;
            lastPolledTimeRef.current = expectedTime;
            playerRef.current.seekTo(expectedTime, 'seconds');
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 500);
        }

        prevIsPlayingRef.current = watchParty.isPlaying;
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.url, isReady, hasError]);

    const handlePlay = () => {
        if (isSyncingRef.current) return;
        if (watchParty && watchParty.isPlaying) return;
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPlay(time);
    };

    const handlePause = () => {
        if (isSyncingRef.current) return;
        if (watchParty && !watchParty.isPlaying) return;
        const time = playerRef.current ? playerRef.current.getCurrentTime() : 0;
        sendWatchPause(time);
    };

    const handleSeek = (e) => {
        if (isSyncingRef.current) return;

        if (lastProgrammaticSeekTimeRef.current !== null) {
            const diff = Math.abs(e - lastProgrammaticSeekTimeRef.current);
            if (diff < 1.5) {
                lastProgrammaticSeekTimeRef.current = null;
                return;
            }
        }
        sendWatchSeek(e);
    };

    // Native Live player controls wrapper
    const handleNativePlay = () => {
        if (watchParty && watchParty.isPlaying) return;
        sendWatchPlay(0);
    };

    const handleNativePause = () => {
        if (watchParty && !watchParty.isPlaying) return;
        sendWatchPause(0);
    };

    if (!watchParty || !watchParty.url) return null;

    if (hasError) {
        return (
            <div className="watch-party-player-wrapper" style={{ padding: '32px', color: '#ff4444', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                <span className="watch-party-title" style={{ color: '#ff4444', fontSize: '16px' }}>Oynatma Hatası</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '400px' }}>Canlı yayın veya video yüklenemedi. Lütfen bağlantıyı kontrol edin.</p>
                <button className="watch-party-stop-btn glass-btn danger" style={{ padding: '8px 20px', borderRadius: '8px' }} onClick={stopWatchParty}>Kapat</button>
            </div>
        );
    }

    const isLive = isLiveStream(watchParty.url);

    return (
        <div className="watch-party-player-wrapper">
            <div className="watch-party-header">
                <span className="watch-party-title">{isLive ? 'Birlikte Canlı Yayın İzle' : 'Birlikte İzle (URL)'}</span>
                <button className="watch-party-stop-btn glass-btn danger" onClick={stopWatchParty} title="Birlikte İzle Modunu Kapat">
                    <X size={16} /> <span>Bitir</span>
                </button>
            </div>
            <div className="watch-party-player-container">
                {isLive && <div className="watch-party-live-badge">Canlı</div>}
                
                <video
                    ref={videoRef}
                    className={`watch-party-native-video ${isLive ? '' : 'hidden'}`}
                    controls={isHost}
                    onPlay={handleNativePlay}
                    onPause={handleNativePause}
                    playsInline
                    crossOrigin="anonymous"
                />

                {!isLive && (
                    <ReactPlayer
                        ref={playerRef}
                        url={getImageUrl(watchParty.url)}
                        playing={watchParty.isPlaying}
                        controls={isHost}
                        width="100%"
                        height="100%"
                        onError={(e) => console.warn("ReactPlayer error logged:", e)}
                        onReady={() => setIsReady(true)}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeek={handleSeek}
                        config={{
                            youtube: {
                                playerVars: { autoplay: 1, disablekb: 0 }
                            },
                            file: {
                                attributes: {
                                    crossOrigin: isHls(watchParty?.url) || (watchParty?.url && watchParty.url.startsWith('http') && !watchParty.url.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) ? undefined : "anonymous"
                                }
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default WatchPartyPlayer;
