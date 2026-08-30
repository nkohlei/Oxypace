import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { X, Volume2, VolumeX, Maximize, Play, Pause, RotateCw } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import VideoPlayer from './VideoPlayer';
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
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg')) {
    return false;
  }
  return cleanUrl.endsWith('.m3u8') || url.includes('.m3u8') || url.includes('/hls/');
};

const isDash = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg')) {
    return false;
  }
  return cleanUrl.endsWith('.mpd') || url.includes('.mpd') || url.includes('/dash/');
};

const isLiveStream = (url) => {
  return isHls(url) || isDash(url);
};

const isPlayableExternalUrl = (url) => {
  if (!url) return false;
  if (!url.startsWith('http')) return false;
  if (url.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev') || url.includes('/r2-media/')) {
    return false;
  }
  return true;
};

const isIframePlatform = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return [
    'ok.ru', 'vk.com', 'my.mail.ru', 'tiktok.com', 
    'vidmoly', 'fembed', 'feurl', 'vidoza', 'upstream', 
    'streamtape', 'dood.to', 'doodstream', 'mixdrop', 'voex', 'mega.nz'
  ].some(domain => lower.includes(domain));
};

const getEmbedUrl = (url) => {
  if (!url) return '';
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('drive.google.com/file/d/')) {
    const parts = url.split('/d/');
    if (parts[1]) {
      const fileId = parts[1].split('/')[0];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }
  if (lowerUrl.includes('mega.nz/file/')) {
    const parts = url.split('/file/');
    if (parts[1]) {
      return `https://mega.nz/embed/${parts[1]}`;
    }
  }
  if (lowerUrl.includes('ok.ru/video/')) {
    const parts = url.split('/video/');
    if (parts[1]) {
      const videoId = parts[1].split('?')[0].split('/')[0];
      return `https://ok.ru/videoembed/${videoId}`;
    }
  }
  if (lowerUrl.includes('vk.com/video')) {
    const match = url.match(/video(-?\d+_\d+)/);
    if (match && match[1]) {
      const parts = match[1].split('_');
      return `https://vk.com/video_ext.php?oid=${parts[0]}&id=${parts[1]}&hash=`;
    }
  }
  if (lowerUrl.includes('my.mail.ru/')) {
    const match = url.match(/my\.mail\.ru\/(.+)\.html/);
    if (match && match[1]) {
      return `https://my.mail.ru/video/embed/${match[1]}`;
    }
  }
  if (lowerUrl.includes('tiktok.com/')) {
    const videoId = url.split('/video/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
  }
  if (lowerUrl.includes('vidmoly.me/w/') || lowerUrl.includes('vidmoly.to/w/')) {
    const code = url.split('/w/')[1]?.split('.')[0];
    return `https://vidmoly.to/embed-${code}.html`;
  }
  if (lowerUrl.includes('fembed.com/v/') || lowerUrl.includes('feurl.com/v/')) {
    const code = url.split('/v/')[1];
    return `https://www.fembed.com/v/${code}`;
  }
  if (lowerUrl.includes('vidoza.net/')) {
    const code = url.split('vidoza.net/')[1]?.replace('embed-', '').replace('.html', '');
    return `https://vidoza.net/embed-${code}.html`;
  }
  if (lowerUrl.includes('upstream.to/')) {
    const code = url.split('upstream.to/')[1]?.replace('embed-', '').replace('.html', '');
    return `https://upstream.to/embed-${code}.html`;
  }
  if (lowerUrl.includes('streamtape.com/v/')) {
    const code = url.split('/v/')[1]?.split('/')[0];
    return `https://streamtape.com/e/${code}`;
  }
  if (lowerUrl.includes('dood.to/d/') || lowerUrl.includes('doodstream.com/d/')) {
    const code = url.split('/d/')[1]?.split('/')[0];
    return `https://dood.to/e/${code}`;
  }
  if (lowerUrl.includes('mixdrop.co/f/') || lowerUrl.includes('mixdrop.to/f/')) {
    const code = url.split('/f/')[1]?.split('/')[0];
    return `https://mixdrop.co/e/${code}`;
  }
  if (lowerUrl.includes('voex.sx/v/') || lowerUrl.includes('voex.sx/e/')) {
    const code = url.split('/v/')[1] || url.split('/e/')[1];
    return `https://voex.sx/e/${code}`;
  }
  return url;
};

const isPlatformUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return [
    'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv',
    'soundcloud.com', 'facebook.com', 'dailymotion.com',
    'wistia.com', 'ok.ru', 'vk.com', 'my.mail.ru', 'tiktok.com',
    'vidmoly', 'fembed', 'feurl', 'vidoza', 'upstream',
    'streamtape', 'dood.to', 'doodstream', 'mixdrop', 'voex', 'mega.nz'
  ].some(domain => lowerUrl.includes(domain));
};

const getProxiedUrl = (url) => {
  if (!url) return '';
  if (!url.startsWith('http')) return url;
  
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const isElectron = typeof window !== 'undefined' && (
    !!window.desktopAPI?.isElectron || 
    (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') !== -1) ||
    !!window.process?.versions?.electron ||
    !!window.ipcRenderer
  );
  
  // If running inside Electron, bypass backend proxy entirely for HLS since local main process spoofing handles it
  if (isElectron && (url.includes('.m3u8') || url.includes('/hls/') || url.includes('.txt') || url.includes('manifest'))) {
    return url;
  }
  
  const useAbsoluteUrl = isNative || isElectron;
  const baseUrl = ((!useAbsoluteUrl && !import.meta.env.DEV) ? '' : (import.meta.env.VITE_API_BASE_URL || (!import.meta.env.DEV ? 'https://api.oxypace.com.tr' : ''))).replace(/\/$/, '');
  
  const isHlsStream = url.includes('.m3u8') || url.includes('/hls/') || url.includes('.txt') || url.includes('manifest');
  if (isHlsStream) {
    if (url.startsWith('/api/proxy')) return url;
    return `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}`;
  }
  
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
    const containerRef = useRef(null);
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
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isNativePlaying, setIsNativePlaying] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef(null);

    const toggleControls = (e) => {
        if (e && e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('.watch-party-header') || e.target.closest('.watch-party-volume-container-modern') || e.target.closest('.watch-party-fullscreen-container-modern'))) {
            return;
        }
        setControlsVisible(prev => !prev);
    };

    const triggerControlsTemporary = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 4000);
    };

    const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth <= 768 || !!window.Capacitor?.isNativePlatform?.());
    const [localMuted, setLocalMuted] = useState(() => {
        const saved = localStorage.getItem('watchPartyMuted');
        if (saved !== null) return saved === 'true';
        return isMobileDevice; // On mobile, start muted by default to respect browser autoplay policies
    });
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('watchPartyVolume');
        return saved !== null ? parseFloat(saved) : 0.5; // Default to 50% (0.5)
    });
    const [volumeOpen, setVolumeOpen] = useState(false);
    const [dimensions, setDimensions] = useState({ width: null, height: null });
    const isResizingRef = useRef(false);

    const startResize = (e, direction) => {
        e.preventDefault();
        isResizingRef.current = true;
        
        const startWidth = containerRef.current.offsetWidth;
        const startHeight = containerRef.current.offsetHeight;
        const startX = e.clientX;
        const startY = e.clientY;

        const doResize = (moveEvent) => {
            if (!isResizingRef.current) return;
            
            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction === 'right') {
                newWidth = startWidth + (moveEvent.clientX - startX);
            } else if (direction === 'left') {
                newWidth = startWidth - (moveEvent.clientX - startX);
            } else if (direction === 'bottom') {
                newHeight = startHeight + (moveEvent.clientY - startY);
            } else if (direction === 'both') {
                newWidth = startWidth + (moveEvent.clientX - startX);
                newHeight = startHeight + (moveEvent.clientY - startY);
            }

            newWidth = Math.max(300, Math.min(newWidth, window.innerWidth - 100));
            newHeight = Math.max(200, Math.min(newHeight, window.innerHeight - 100));

            setDimensions({ width: newWidth, height: newHeight });
        };

        const stopResize = () => {
            isResizingRef.current = false;
            window.removeEventListener('mousemove', doResize);
            window.removeEventListener('mouseup', stopResize);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
    };

    const isHost = true;
    const isStream = isLiveStream(watchParty?.url) && !isPlatformUrl(watchParty?.url);
    const isLive = !!watchParty?.isLive;

    const triggerReconnect = () => {
        if (reconnectTimerRef.current) return;
        console.log("[WatchPartyPlayer] Scheduling auto-reconnect...");
        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            setReconnectCount(prev => prev + 1);
        }, 3000);
    };

    // Apply volume and muted changes to native video element and save to localStorage
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = localMuted;
        }
        localStorage.setItem('watchPartyVolume', volume.toString());
        localStorage.setItem('watchPartyMuted', localMuted.toString());
    }, [volume, localMuted]);

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
        if (!isLive && !isStream && videoRef.current) {
            videoRef.current.src = "";
            videoRef.current.load();
        }
    }, [watchParty?.url, isLive, isStream]);

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
        if (!watchParty?.url || (!isLive && !isStream) || !videoRef.current) return;

        const video = videoRef.current;
        const streamUrl = useProxy ? getProxiedUrl(watchParty.url) : watchParty.url;
        const urlIsHls = isHls(watchParty.url) || watchParty.isLive;
        const urlIsDash = isDash(watchParty.url);

        console.log(`[WatchPartyPlayer] Initializing live stream. URL: ${streamUrl} (useProxy: ${useProxy})`);

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
                if (urlIsHls || !urlIsDash) {
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        // Native HLS (iOS Safari / Safari)
                        video.src = streamUrl;
                        video.addEventListener('loadedmetadata', () => {
                            setIsReady(true);
                            video.play().catch(err => console.warn("Native HLS autoplay blocked", err));
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
                            video.play().catch(err => console.warn("Hls.js autoplay blocked", err));
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
                    player.initialize(video, streamUrl, true); // Autoplay true
                    
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
    }, [watchParty?.url, reconnectCount, useProxy, isStream]);

    // Standard Video Polling (only for non-live files)
    useEffect(() => {
        if (!isReady || hasError || !playerRef.current || isStream) return;

        const interval = setInterval(() => {
            const player = playerRef.current;
            if (!player) return;

            try {
                const currentTime = player.getCurrentTime();
                if (typeof currentTime !== 'number') return;

                if (lastPolledTimeRef.current !== null && !isSyncingRef.current) {
                    const expectedProgress = watchParty?.isPlaying ? 1.0 : 0;
                    const diff = Math.abs(currentTime - lastPolledTimeRef.current - expectedProgress);

                    // Only trigger manual seek if difference exceeds 3.0s (avoids false-positive buffer stalls)
                    if (diff > 3.0) {
                        console.log(`[Watch Party] User manual seek detected: ${lastPolledTimeRef.current}s -> ${currentTime}s`);
                        sendWatchSeek(currentTime);
                    }
                }
                lastPolledTimeRef.current = currentTime;
            } catch (err) {
                console.error("Error polling player time:", err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isReady, hasError, watchParty?.isPlaying, watchParty?.url, sendWatchSeek, isStream]);

    // Standard Video Synchronization (only for non-live files)
    useEffect(() => {
        if (!watchParty || !playerRef.current || !isReady || hasError || isStream) return;

        let expectedTime = watchParty.currentTime;
        if (watchParty.isPlaying && watchParty.lastUpdated) {
            const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
            expectedTime += elapsed;
        }

        const localTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(localTime - expectedTime);

        const isPlayTransition = watchParty.isPlaying && !prevIsPlayingRef.current;
        const threshold = isPlayTransition ? 0.2 : (watchParty.isPlaying ? 1.2 : 0.5);

        if (timeDiff > threshold) {
            isSyncingRef.current = true;
            lastProgrammaticSeekTimeRef.current = expectedTime;
            lastPolledTimeRef.current = expectedTime;
            playerRef.current.seekTo(expectedTime, 'seconds');
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 1000);
        }

        prevIsPlayingRef.current = watchParty.isPlaying;
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.url, isReady, hasError, isStream]);

    const handlePlay = (time) => {
        if (isSyncingRef.current) return;
        if (watchParty && watchParty.isPlaying) return;
        const seekTime = typeof time === 'number' ? time : (playerRef.current ? playerRef.current.getCurrentTime() : 0);
        sendWatchPlay(seekTime);
    };

    const handlePause = (time) => {
        if (isSyncingRef.current) return;
        if (watchParty && !watchParty.isPlaying) return;
        const seekTime = typeof time === 'number' ? time : (playerRef.current ? playerRef.current.getCurrentTime() : 0);
        sendWatchPause(seekTime);
    };

    const handleSeek = (e) => {
        if (isSyncingRef.current) return;

        if (lastProgrammaticSeekTimeRef.current !== null) {
            const diff = Math.abs(e - lastProgrammaticSeekTimeRef.current);
            if (diff < 2.0) {
                lastProgrammaticSeekTimeRef.current = null;
                return;
            }
        }
        sendWatchSeek(e);
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error("Error attempting to enable fullscreen:", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Native Video Controls Helpers
    const isNativeVOD = isStream && !isLive;

    const formatTime = (secs) => {
        if (isNaN(secs) || secs === Infinity) return '00:00';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleMouseMove = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const onTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const onDurationChange = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
    };

    const onPlaying = () => {
        setIsNativePlaying(true);
        if (isSyncingRef.current) return;
        if (videoRef.current && isNativeVOD && !watchParty?.isPlaying) {
            sendWatchPlay(videoRef.current.currentTime);
        }
    };

    const onPaused = () => {
        setIsNativePlaying(false);
        if (isSyncingRef.current) return;
        if (videoRef.current && isNativeVOD && watchParty?.isPlaying) {
            sendWatchPause(videoRef.current.currentTime);
        }
    };

    const onSeeked = () => {
        if (isSyncingRef.current) return;
        if (lastProgrammaticSeekTimeRef.current !== null && videoRef.current) {
            const diff = Math.abs(videoRef.current.currentTime - lastProgrammaticSeekTimeRef.current);
            if (diff < 2.0) {
                lastProgrammaticSeekTimeRef.current = null;
                return;
            }
        }
        if (videoRef.current && isNativeVOD) {
            sendWatchSeek(videoRef.current.currentTime);
        }
    };

    // Native Video Synchronization Engine (Master Clock Smart Pacer)
    useEffect(() => {
        const video = videoRef.current;
        if (!watchParty || !video || !isReady || hasError || !isNativeVOD) return;

        let syncInterval = null;

        const alignNativeVideo = (forceImmediate = false) => {
            if (!video || !watchParty) return;

            const serverNow = Date.now();
            const reference = watchParty.serverTimestamp || watchParty.lastUpdated || serverNow;
            const elapsed = watchParty.isPlaying ? Math.max(0, (serverNow - reference) / 1000) : 0;
            const targetTime = (typeof watchParty.currentTime === 'number' ? watchParty.currentTime : 0) + elapsed;
            const localTime = video.currentTime;
            const drift = targetTime - localTime;
            const absDrift = Math.abs(drift);

            // 1. Play / Pause State Synchronization
            if (watchParty.isPlaying && video.paused) {
                isSyncingRef.current = true;
                video.play().catch(err => console.warn("[WatchParty] Auto-play resume catch:", err));
                setTimeout(() => { isSyncingRef.current = false; }, 300);
            } else if (!watchParty.isPlaying && !video.paused) {
                isSyncingRef.current = true;
                video.pause();
                setTimeout(() => { isSyncingRef.current = false; }, 300);
            }

            // 2. When Paused: Keep exactly aligned
            if (!watchParty.isPlaying) {
                video.playbackRate = 1.0;
                if (absDrift > 0.25) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = targetTime;
                    video.currentTime = targetTime;
                    setTimeout(() => { isSyncingRef.current = false; }, 300);
                }
                return;
            }

            // 3. When Playing: Continuous Smart Pacer (Discord / Teleparty Engine)
            if (forceImmediate || absDrift > 2.0) {
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = targetTime;
                video.currentTime = targetTime;
                video.playbackRate = 1.0;
                setTimeout(() => { isSyncingRef.current = false; }, 400);
            } else if (drift > 0.25) {
                // Behind: gently speed up to 1.05x to catch up seamlessly with 0 lag
                video.playbackRate = 1.05;
            } else if (drift < -0.25) {
                // Ahead: gently slow down to 0.95x until room catches up
                video.playbackRate = 0.95;
            } else if (absDrift <= 0.12) {
                if (video.playbackRate !== 1.0) {
                    video.playbackRate = 1.0;
                }
            }
        };

        // Align immediately on state change
        alignNativeVideo(true);

        // Continuous smart pacer every 1.5 seconds
        syncInterval = setInterval(() => {
            alignNativeVideo(false);
        }, 1500);

        return () => {
            if (syncInterval) clearInterval(syncInterval);
            if (video) video.playbackRate = 1.0;
        };
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.serverTimestamp, watchParty?.lastUpdated, isReady, hasError, isNativeVOD]);

    // Native Video Polling for manual seek detection (distinguish user seeks from sync seeks)
    useEffect(() => {
        const video = videoRef.current;
        if (!isReady || hasError || !video || !isNativeVOD) return;

        const interval = setInterval(() => {
            try {
                const cur = video.currentTime;
                if (lastPolledTimeRef.current !== null && !isSyncingRef.current) {
                    const expectedProgress = watchParty?.isPlaying ? 1.0 : 0;
                    const diff = Math.abs(cur - lastPolledTimeRef.current - expectedProgress);

                    if (diff > 3.0) {
                        console.log(`[Watch Party] Native manual seek detected: ${lastPolledTimeRef.current}s -> ${cur}s`);
                        sendWatchSeek(cur);
                    }
                }
                lastPolledTimeRef.current = cur;
            } catch (err) {
                console.error("Error polling native video time:", err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isReady, hasError, watchParty?.isPlaying, sendWatchSeek, isNativeVOD]);

    // Keep live stream playing constantly (never pause)
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isLive || !isReady || hasError) return;

        const handlePauseAttempt = () => {
            if (isLive) {
                video.play().catch(err => console.warn("[WatchParty] Live stream play force failed:", err));
            }
        };

        video.addEventListener('pause', handlePauseAttempt);
        if (video.paused) {
            video.play().catch(err => console.warn("[WatchParty] Live stream initial force play failed:", err));
        }

        return () => {
            video.removeEventListener('pause', handlePauseAttempt);
        };
    }, [isLive, isReady, hasError, watchParty?.url]);

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

    return (
        <div className="watch-party-player-wrapper" ref={containerRef}>
            <div 
                className="watch-party-header"
                style={{
                    opacity: controlsVisible ? 1 : 0,
                    pointerEvents: controlsVisible ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="watch-party-title">{(isLive || isStream) ? (isNativeVOD ? 'Birlikte Video İzle (HLS)' : 'Birlikte Canlı Yayın İzle') : 'Birlikte İzle (URL)'}</span>
                    {(isLive || isStream) && !isNativeVOD && <span className="watch-party-live-badge-inline">Canlı</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="watch-party-stop-btn glass-btn danger" onClick={stopWatchParty} title="Birlikte İzle Modunu Kapat">
                        <X size={16} /> <span>Bitir</span>
                    </button>
                </div>
            </div>
            <div 
                className="watch-party-player-container"
                onClick={toggleControls}
                onMouseMove={triggerControlsTemporary}
                onTouchStart={triggerControlsTemporary}
            >
                
                <video
                    ref={videoRef}
                    className={`watch-party-native-video ${isLive ? '' : 'hidden'}`}
                    controls={false}
                    playsInline
                    autoPlay
                    muted={localMuted}
                    onTimeUpdate={onTimeUpdate}
                    onDurationChange={onDurationChange}
                    onPlaying={onPlaying}
                    onPause={onPaused}
                    onSeeked={onSeeked}
                />

                {isLive && !isReady && !hasError && (
                    <div className="native-loader-overlay" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
                        <div className="pro-spinner" />
                    </div>
                )}

                 {isLive && (
                    <>
                        {/* Collapsible Vertical Volume Control */}
                        <div 
                            className="watch-party-volume-container-modern"
                            style={{
                                opacity: controlsVisible ? 1 : 0,
                                pointerEvents: controlsVisible ? 'auto' : 'none',
                                transition: 'opacity 0.25s ease'
                            }}
                            onMouseEnter={() => window.innerWidth > 768 && setVolumeOpen(true)}
                            onMouseLeave={() => window.innerWidth > 768 && setVolumeOpen(false)}
                        >
                            {volumeOpen && (
                                <div className="watch-party-volume-slider-wrapper">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05" 
                                        value={localMuted ? 0 : volume} 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setVolume(val);
                                            if (val > 0) setLocalMuted(false);
                                            else setLocalMuted(true);
                                        }}
                                        className="watch-party-volume-slider-vertical"
                                    />
                                </div>
                            )}
                            <button 
                                className="watch-party-volume-btn-modern"
                                onClick={() => {
                                    if (window.innerWidth <= 768) {
                                        setLocalMuted(!localMuted);
                                    } else {
                                        setLocalMuted(!localMuted);
                                    }
                                }}
                                onDoubleClick={() => {
                                    setLocalMuted(!localMuted);
                                }}
                                title={localMuted ? "Sesi Aç" : "Sesi Kapat"}
                            >
                                {localMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        </div>

                        {/* Repositioned Fullscreen Button */}
                        <div 
                            className="watch-party-fullscreen-container-modern" 
                            style={{ 
                                display: 'flex', 
                                gap: '8px',
                                opacity: controlsVisible ? 1 : 0,
                                pointerEvents: controlsVisible ? 'auto' : 'none',
                                transition: 'opacity 0.25s ease'
                            }}
                        >
                            <button 
                                className="watch-party-fullscreen-btn-modern"
                                onClick={() => {
                                    const video = videoRef.current;
                                    if (video && video.duration) {
                                        const liveEdge = video.duration - 2;
                                        const targetTime = Math.max(0, liveEdge);
                                        video.currentTime = targetTime;
                                        sendWatchSeek(targetTime);
                                    }
                                }}
                                title="Yayını canlı sona getir / Odadaki herkesi eşitle"
                            >
                                <RotateCw size={18} />
                            </button>
                            <button 
                                className="watch-party-fullscreen-btn-modern"
                                onClick={toggleFullscreen}
                                title="Tam Ekran"
                            >
                                <Maximize size={18} />
                            </button>
                        </div>
                    </>
                 )}

                  {!isLive && (
                      isIframePlatform(watchParty?.url) ? (
                         <iframe
                             src={getEmbedUrl(watchParty.url)}
                             width="100%"
                             height="100%"
                             frameBorder="0"
                             allowFullScreen
                             allow="autoplay; encrypted-media; picture-in-picture"
                             style={{ border: 'none', background: '#000', borderRadius: '12px', width: '100%', height: '100%' }}
                             onLoad={() => setIsReady(true)}
                             referrerPolicy="strict-origin-when-cross-origin"
                         />
                      ) : isPlatformUrl(watchParty?.url) ? (
                        <ReactPlayer
                            ref={playerRef}
                            url={watchParty.url}
                            playing={watchParty.isPlaying}
                            controls={isHost}
                            width="100%"
                            height="100%"
                            onError={(e) => {
                                console.warn("ReactPlayer error logged:", e);
                            }}
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
                    ) : (
                        <VideoPlayer
                            src={isPlayableExternalUrl(watchParty?.url) ? (isStream ? getProxiedUrl(watchParty.url) : watchParty.url) : getImageUrl(watchParty?.url)}
                            watchParty={watchParty}
                            volume={volume}
                            muted={localMuted}
                            onVolumeChange={setVolume}
                            onMuteChange={setLocalMuted}
                            onReady={() => setIsReady(true)}
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onSeek={handleSeek}
                            className="watch-party-custom-videoplayer"
                        />
                    )
                )}
            </div>
        </div>
    );
};

export const GlobalWatchPartyWrapper = () => {
    const { watchParty } = useVoice();
    const [coords, setCoords] = useState(null);

    useEffect(() => {
        if (!watchParty || !watchParty.url) {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const placeholder = document.getElementById('watch-party-portal-placeholder') || document.getElementById('watch-party-portal-target');
            if (placeholder) {
                const rect = placeholder.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    display: 'block'
                });
            } else {
                setCoords({ display: 'none' });
            }
        };

        updateCoords();

        // Observe DOM mutations to catch target container mounts/unmounts instantly
        const observer = new MutationObserver(updateCoords);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        
        const interval = setInterval(updateCoords, 500);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
            clearInterval(interval);
        };
    }, [watchParty?.url]);

    if (!watchParty || !watchParty.url) return null;

    const style = coords ? {
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        height: `${coords.height}px`,
        display: coords.display,
        zIndex: 1,
        pointerEvents: 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    } : { display: 'none' };

    return (
        <div style={style}>
            <WatchPartyPlayer />
        </div>
    );
};

export default WatchPartyPlayer;
