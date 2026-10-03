import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { X, Volume2, VolumeX, Maximize, Play, Pause, RotateCw, RotateCcw, Search, Film, Headphones, Languages, Check, Upload } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import VideoPlayer from './VideoPlayer';
import { HlsStreamResolverModalVol2 } from './HlsStreamResolverModalVol2';
import { registerPlugin, Capacitor } from '@capacitor/core';
import './WatchPartyPlayer.css';

const CallManager = registerPlugin('CallManager');

const loadHls = async () => {
  if (window.Hls) return window.Hls;
  try {
    const mod = await import('hls.js');
    const HlsLib = mod.default || mod;
    if (HlsLib) {
      window.Hls = HlsLib;
      return HlsLib;
    }
  } catch (e) {
    console.warn('Bundled hls.js dynamic import failed, attempting CDN fallback:', e);
  }
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
  let target = url;
  if (url.includes('/api/proxy') && url.includes('url=')) {
    try {
      const parsed = new URL(url, 'https://dummy.com');
      target = parsed.searchParams.get('url') || url;
    } catch {}
  }
  const cleanUrl = target.split('?')[0].split('#')[0].toLowerCase();
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg')) {
    return false;
  }
  return cleanUrl.endsWith('.m3u8') || target.includes('.m3u8') || target.includes('/hls/') || target.includes('.txt') || target.includes('master.txt') || url.includes('/api/proxy');
};

const isDash = (url) => {
  if (!url) return false;
  let target = url;
  if (url.includes('/api/proxy') && url.includes('url=')) {
    try {
      const parsed = new URL(url, 'https://dummy.com');
      target = parsed.searchParams.get('url') || url;
    } catch {}
  }
  const cleanUrl = target.split('?')[0].split('#')[0].toLowerCase();
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg')) {
    return false;
  }
  return cleanUrl.endsWith('.mpd') || target.includes('.mpd') || target.includes('/dash/');
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
  
  if (url.includes('/api/proxy') || url.includes('/api/media/proxy-hls')) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  }

  if (url.startsWith('/api/proxy') || url.startsWith('api/proxy')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  }

  if (!url.startsWith('http')) return url;

  const isHlsStream = url.includes('.m3u8') || url.includes('/hls/') || url.includes('.txt') || url.includes('manifest') || url.includes('.vtt') || url.includes('.srt');
  if (isHlsStream) {
    return `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}`;
  }
  
  return `${baseUrl}/api/media/${encodeURIComponent(url)}`;
};

const WatchPartyPlayer = () => {
    const { 
        watchParty, 
        startWatchParty,
        stopWatchParty, 
        sendWatchPlay, 
        sendWatchPause, 
        sendWatchSeek,
        getServerNow
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
    const [isFilmSearchModalOpen, setIsFilmSearchModalOpen] = useState(false);
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
    const isUserActionCooldownRef = useRef(0);

    // Audio & Subtitle Track States
    const [audioTracks, setAudioTracks] = useState([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
    const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
    const [hlsSubtitleTracks, setHlsSubtitleTracks] = useState([]);
    const [activeSubtitleId, setActiveSubtitleId] = useState('off'); // 'off' | 'hls-0' | 'ext-0' | 'custom-0'
    const [customSubtitles, setCustomSubtitles] = useState([]);
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const audioMenuRef = useRef(null);
    const subMenuRef = useRef(null);
    const customFileInputRef = useRef(null);

    // Close audio and subtitle menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (audioMenuRef.current && !audioMenuRef.current.contains(e.target)) {
                setIsAudioMenuOpen(false);
            }
            if (subMenuRef.current && !subMenuRef.current.contains(e.target)) {
                setIsSubMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    // Switch Android audio routing to media mode for rich, full-fidelity stereo sound while video plays
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            CallManager.setAudioMode({ mode: 'media' }).catch(() => {});
            return () => {
                CallManager.setAudioMode({ mode: 'communication' }).catch(() => {});
            };
        }
    }, []);

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
    const isNativeVOD = isStream && !isLive;

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
            videoRef.current.preservesPitch = true;
            if ('webkitPreservesPitch' in videoRef.current) videoRef.current.webkitPreservesPitch = true;
            if ('mozPreservesPitch' in videoRef.current) videoRef.current.mozPreservesPitch = true;
        }
        localStorage.setItem('watchPartyVolume', volume.toString());
        localStorage.setItem('watchPartyMuted', localMuted.toString());
    }, [volume, localMuted]);

    // Reset states when the URL changes
    useEffect(() => {
        setHasError(false);
        setIsReady(false);
        setUseProxy(false);
        setAudioTracks([]);
        setCurrentAudioTrack(0);
        setIsAudioMenuOpen(false);
        setHlsSubtitleTracks([]);
        setActiveSubtitleId('off');
        setIsSubMenuOpen(false);
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

    // Live Stream / Custom HLS Engine
    useEffect(() => {
        if (!watchParty?.url || (!isLive && !isStream) || !videoRef.current) return;

        const video = videoRef.current;
        const streamUrl = useProxy ? getProxiedUrl(watchParty.url) : watchParty.url;
        const urlIsHls = isHls(watchParty.url) || watchParty.isLive;
        const urlIsDash = isDash(watchParty.url);

        console.log(`[WatchPartyPlayer] Initializing stream. URL: ${streamUrl} (useProxy: ${useProxy}, isLive: ${isLive})`);

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
                    const isNativeAndroid = typeof window !== 'undefined' && (
                        (window.navigator?.userAgent && /Android/i.test(window.navigator.userAgent)) ||
                        !!window.Capacitor?.isNativePlatform?.()
                    );
                    const Hls = await loadHls();
                    const canUseHlsJs = Hls && Hls.isSupported();

                    // On Android WebView, native canPlayType('application/vnd.apple.mpegurl') is unstable with proxies and CORS.
                    // Prefer Hls.js whenever supported, falling back to native only on iOS/Safari.
                    if (!canUseHlsJs && video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamUrl;
                        video.addEventListener('loadedmetadata', () => {
                            setIsReady(true);
                            if (watchParty?.isPlaying) video.play().catch(err => console.warn("Native HLS autoplay blocked", err));
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
                    } else if (canUseHlsJs) {
                        const initialStartTime = typeof watchParty?.currentTime === 'number' ? watchParty.currentTime : 0;
                        const hls = new Hls({
                            maxMaxBufferLength: 60,
                            maxBufferLength: 30,
                            maxBufferSize: 60 * 1000 * 1000,
                            enableWorker: true,
                            lowLatencyMode: isLive,
                            backBufferLength: 30,
                            startPosition: isLive ? -1 : (initialStartTime > 0 ? initialStartTime : 0),
                            liveSyncDurationCount: isLive ? 3 : undefined,
                            liveMaxLatencyDurationCount: isLive ? 10 : undefined,
                            xhrSetup: (xhr, url) => {
                                xhr.withCredentials = false;
                            }
                        });
                        hlsInstanceRef.current = hls;
                        hls.loadSource(streamUrl);
                        hls.attachMedia(video);
                        
                        const updateAudio = () => {
                            if (hls && hls.audioTracks && hls.audioTracks.length > 0) {
                                setAudioTracks([...hls.audioTracks]);
                                if (typeof hls.audioTrack === 'number' && hls.audioTrack >= 0) {
                                    setCurrentAudioTrack(hls.audioTrack);
                                }
                            }
                        };
                        const updateSubs = () => {
                            if (hls && hls.subtitleTracks) {
                                setHlsSubtitleTracks([...hls.subtitleTracks]);
                            }
                        };

                        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
                            if (data.audioTracks && data.audioTracks.length > 0) {
                                setAudioTracks([...data.audioTracks]);
                                if (typeof hls.audioTrack === 'number' && hls.audioTrack >= 0) {
                                    setCurrentAudioTrack(hls.audioTrack);
                                }
                            }
                        });

                        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
                            if (typeof data.id === 'number') {
                                setCurrentAudioTrack(data.id);
                            }
                        });

                        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
                            if (data.subtitleTracks) {
                                setHlsSubtitleTracks([...data.subtitleTracks]);
                            }
                        });

                        hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (event, data) => {
                            if (typeof data.id === 'number' && data.id >= 0) {
                                setActiveSubtitleId(`hls-${data.id}`);
                            }
                        });

                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            setIsReady(true);
                            updateAudio();
                            updateSubs();
                            if (isNativeVOD && initialStartTime > 0) {
                                video.currentTime = initialStartTime;
                            }
                            if (watchParty?.isPlaying) {
                                video.play().catch(err => console.warn("Hls.js autoplay blocked", err));
                            }
                        });

                        hls.on(Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                console.warn("Fatal Hls.js error encountered:", data);
                                if (!useProxy && !watchParty.url.includes('/api/proxy')) {
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
                    player.initialize(video, streamUrl, true);
                    
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
    }, [watchParty?.url, reconnectCount, useProxy, isStream, isLive]);

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

        const isPlayTransition = watchParty.isPlaying && !prevIsPlayingRef.current;
        prevIsPlayingRef.current = watchParty.isPlaying;

        // Play geçişinde hiç seek yapma.
        // Video pause esnasında T'de duruyordu. Play'e basıldığında T'den devam etmeli.
        // handleWatchPlay artık serverTimestamp=now kullandığından elapsed=0 zaten.
        // Bu erken return’la o garantiyi kod seviyesinde de pekiştiriyoruz.
        if (isPlayTransition) {
            return;
        }

        const referenceTime = watchParty.serverTimestamp || watchParty.lastUpdated;
        let expectedTime = watchParty.currentTime || 0;
        if (watchParty.isPlaying && referenceTime) {
            const elapsed = Math.max(0, (getServerNow() - referenceTime) / 1000);
            expectedTime += elapsed;
        }

        const localTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(localTime - expectedTime);
        // Threshold: oynuyor iken 2.0s, durakken 0.5s
        const threshold = watchParty.isPlaying ? 2.0 : 0.5;

        if (timeDiff > threshold) {
            isSyncingRef.current = true;
            lastProgrammaticSeekTimeRef.current = expectedTime;
            lastPolledTimeRef.current = expectedTime;
            playerRef.current.seekTo(expectedTime, 'seconds');
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 1000);
        }
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.url, watchParty?.serverTimestamp, watchParty?.lastUpdated, isReady, hasError, isStream, getServerNow]);

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
    };

    const onPaused = () => {
        setIsNativePlaying(false);
    };

    // Label formatters for Audio and Subtitles
    const formatAudioLabel = (track, idx, isShort = false) => {
        if (!track) return isShort ? 'Ses' : `Ses ${idx + 1}`;
        const name = (track.name || '').toLowerCase();
        const lang = (track.lang || '').toLowerCase();
        if (name.includes('turk') || lang === 'tr' || lang === 'tur' || name === 'tr') {
            return isShort ? 'Dublaj' : 'Türkçe Dublaj';
        }
        if (name.includes('orig') || name.includes('eng') || lang === 'en' || lang === 'eng' || name === 'en') {
            return isShort ? 'Orijinal' : 'Orijinal Ses (İngilizce)';
        }
        if (name.includes('ger') || lang === 'de') return isShort ? 'Almanca' : 'Almanca Ses';
        if (name.includes('fra') || lang === 'fr') return isShort ? 'Fransızca' : 'Fransızca Ses';
        if (name.includes('esp') || lang === 'es') return isShort ? 'İspanyolca' : 'İspanyolca Ses';
        return isShort ? (track.name ? track.name.slice(0, 10) : 'Ses') : (track.name || `Ses ${idx + 1}`);
    };

    const formatSubtitleLabel = (track, idx, isShort = false) => {
        if (!track) return isShort ? 'Altyazı' : `Altyazı ${idx + 1}`;
        const name = (track.name || track.label || '').toLowerCase();
        const lang = (track.lang || track.srcLang || '').toLowerCase();
        if (name.includes('turk') || lang === 'tr' || lang === 'tur' || name === 'tr') {
            return isShort ? 'Türkçe' : 'Türkçe Altyazı';
        }
        if (name.includes('eng') || lang === 'en' || lang === 'eng' || name === 'en') {
            return isShort ? 'İngilizce' : 'İngilizce Altyazı';
        }
        if (name.includes('ger') || lang === 'de') return isShort ? 'Almanca' : 'Almanca Altyazı';
        if (name.includes('fra') || lang === 'fr') return isShort ? 'Fransızca' : 'Fransızca Altyazı';
        if (name.includes('esp') || lang === 'es') return isShort ? 'İspanyolca' : 'İspanyolca Altyazı';
        if (name.includes('forced')) return isShort ? 'Zorunlu' : 'Türkçe (Zorunlu / Forced)';
        return isShort ? (track.label || track.name || 'Altyazı').slice(0, 10) : (track.label || track.name || `Altyazı ${idx + 1}`);
    };

    const getActiveSubtitleButtonLabel = () => {
        if (activeSubtitleId === 'off') return 'Altyazı';
        if (activeSubtitleId.startsWith('hls-')) {
            const idx = parseInt(activeSubtitleId.replace('hls-', ''), 10);
            return formatSubtitleLabel(hlsSubtitleTracks[idx], idx, true);
        }
        if (activeSubtitleId.startsWith('ext-')) {
            const idx = parseInt(activeSubtitleId.replace('ext-', ''), 10);
            return formatSubtitleLabel((watchParty?.subtitles || [])[idx], idx, true);
        }
        if (activeSubtitleId.startsWith('custom-')) {
            const idx = parseInt(activeSubtitleId.replace('custom-', ''), 10);
            return customSubtitles[idx]?.label ? customSubtitles[idx].label.slice(0, 8) : 'Özel';
        }
        return 'Altyazı';
    };

    const handleCustomSubtitleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            let content = event.target.result;
            if (file.name.toLowerCase().endsWith('.srt')) {
                content = 'WEBVTT\n\n' + content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
            }
            const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const newIndex = customSubtitles.length;
            const newSub = {
                file: blobUrl,
                playableUrl: blobUrl,
                label: file.name.replace(/\.(srt|vtt)$/i, '').slice(0, 24),
                lang: 'tr',
                isBlob: true
            };
            setCustomSubtitles(prev => [...prev, newSub]);

            setTimeout(() => {
                handleSelectSubtitleTrack({ type: 'custom', index: newIndex });
            }, 100);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSelectAudioTrack = (trackId) => {
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.audioTrack = trackId;
            setCurrentAudioTrack(trackId);
        }
        setIsAudioMenuOpen(false);
    };

    const handleSelectSubtitleTrack = (option) => {
        if (option.type === 'off') {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            setActiveSubtitleId('off');
        } else if (option.type === 'hls') {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = option.id;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            setActiveSubtitleId(`hls-${option.id}`);
        } else if (option.type === 'ext') {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = (i === option.index) ? 'showing' : 'disabled';
                }
            }
            setActiveSubtitleId(`ext-${option.index}`);
        } else if (option.type === 'custom') {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                const extOffset = (watchParty?.subtitles || []).length;
                const targetIdx = extOffset + option.index;
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = (i === targetIdx) ? 'showing' : 'disabled';
                }
            }
            setActiveSubtitleId(`custom-${option.index}`);
        }
        setIsSubMenuOpen(false);
    };

    const handleTogglePlayPause = (e) => {
        if (e) e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        
        // 1.5s cooldown lock to prevent sync loop from overriding user click
        isUserActionCooldownRef.current = Date.now() + 1500;
        
        if (watchParty?.isPlaying) {
            video.pause();
            sendWatchPause(video.currentTime);
        } else {
            video.play().catch(err => console.warn('[WatchParty] Play click error:', err));
            sendWatchPlay(video.currentTime);
        }
    };

    const handleNativeScrub = (e) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            isSyncingRef.current = true;
            lastProgrammaticSeekTimeRef.current = val;
            if (videoRef.current) {
                videoRef.current.currentTime = val;
            }
            sendWatchSeek(val);
            setTimeout(() => { isSyncingRef.current = false; }, 400);
        }
    };

    const handleSeekOffset = (offset) => {
        const video = videoRef.current;
        if (!video || !duration) return;
        const target = Math.max(0, Math.min(duration, (video.currentTime || 0) + offset));
        isSyncingRef.current = true;
        lastProgrammaticSeekTimeRef.current = target;
        video.currentTime = target;
        setCurrentTime(target);
        sendWatchSeek(target);
        setTimeout(() => { isSyncingRef.current = false; }, 400);
    };

    const handleScrubClick = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const targetTime = frac * duration;
        isSyncingRef.current = true;
        lastProgrammaticSeekTimeRef.current = targetTime;
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
        sendWatchSeek(targetTime);
        setTimeout(() => { isSyncingRef.current = false; }, 400);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Native Video Synchronization Engine (Master Clock Smart Pacer)
    useEffect(() => {
        const video = videoRef.current;
        if (!watchParty || !video || !isReady || hasError || !isNativeVOD) return;

        let syncInterval = null;
        // Play geçişinde ilk 2.5s boyunca hard seek yapma.
        // Video buffer'ın dolması ve ağ gecikmesinin dengelenmesi için zaman tanı.
        // Bu süre içinde sadece playbackRate ile yumuşak düzeltme yapılır.
        let playTransitionGuardActive = false;
        let playTransitionGuardTimer = null;

        const alignNativeVideo = (isStateTrigger = false) => {
            if (!video || !watchParty) return;

            // If user recently interacted with Play/Pause button, respect their action and do not override
            if (Date.now() < isUserActionCooldownRef.current) return;

            const serverNow = getServerNow();
            const reference = watchParty.serverTimestamp || watchParty.lastUpdated || serverNow;
            const elapsed = watchParty.isPlaying ? Math.max(0, (serverNow - reference) / 1000) : 0;
            const targetTime = (typeof watchParty.currentTime === 'number' ? watchParty.currentTime : 0) + elapsed;
            const localTime = video.currentTime;
            const drift = targetTime - localTime;
            const absDrift = Math.abs(drift);

            // 1. Play / Pause State Synchronization
            if (watchParty.isPlaying && video.paused) {
                isSyncingRef.current = true;
                playTransitionGuardActive = true;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                playTransitionGuardTimer = setTimeout(() => {
                    playTransitionGuardActive = false;
                }, 2500);
                video.play().catch(err => console.warn('[WatchParty] Auto-play resume catch:', err));
                setTimeout(() => { isSyncingRef.current = false; }, 400);
            } else if (!watchParty.isPlaying && !video.paused) {
                isSyncingRef.current = true;
                playTransitionGuardActive = false;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                video.pause();
                setTimeout(() => { isSyncingRef.current = false; }, 400);
            }

            // 2. When Paused: Keep exactly aligned
            if (!watchParty.isPlaying) {
                video.playbackRate = 1.0;
                if (absDrift > 0.5) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = targetTime;
                    video.currentTime = targetTime;
                    setTimeout(() => { isSyncingRef.current = false; }, 400);
                }
                return;
            }

            // 3. When Playing: Strictly lock playbackRate to 1.0 to eliminate any audio pitch drift/warping.
            // Only perform a clean seek if drift is severe (> 3.5s).
            if (absDrift > 3.5 && !playTransitionGuardActive) {
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = targetTime;
                video.currentTime = targetTime;
                video.playbackRate = 1.0;
                setTimeout(() => { isSyncingRef.current = false; }, 400);
            } else {
                if (video.playbackRate !== 1.0) {
                    video.playbackRate = 1.0;
                }
            }
        };

        alignNativeVideo(true);

        syncInterval = setInterval(() => {
            alignNativeVideo(false);
        }, 1500);

        return () => {
            if (syncInterval) clearInterval(syncInterval);
            if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
            if (video) video.playbackRate = 1.0;
        };
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.serverTimestamp, watchParty?.lastUpdated, isReady, hasError, isNativeVOD, getServerNow]);

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
                    <span className="watch-party-title">{(isLive || isStream) ? (isNativeVOD ? 'Birlikte Video İzle' : 'Birlikte Canlı Yayın İzle') : 'Birlikte İzle (URL)'}</span>
                    {(isLive || isStream) && !isNativeVOD && <span className="watch-party-live-badge-inline">Canlı</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        className="watch-party-stop-btn glass-btn" 
                        onClick={() => setIsFilmSearchModalOpen(true)} 
                        title="Yeni Film Ara ve Oynat"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#f4f4f5' }}
                    >
                        <Search size={14} /> <span>Film Ara</span>
                    </button>
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
                    className={`watch-party-native-video ${(isLive || isStream) ? '' : 'hidden'}`}
                    controls={false}
                    playsInline
                    webkit-playsinline="true"
                    autoPlay={false}
                    crossOrigin="anonymous"
                    muted={localMuted}
                    onTimeUpdate={onTimeUpdate}
                    onDurationChange={onDurationChange}
                    onPlaying={onPlaying}
                    onPause={onPaused}
                >
                    {(watchParty?.subtitles || []).map((sub, idx) => (
                        <track
                            key={`sub-track-${idx}-${sub.file || sub.playableUrl}`}
                            src={getProxiedUrl(sub.playableUrl || sub.file)}
                            kind="subtitles"
                            label={sub.label || `Altyazı ${idx + 1}`}
                            srcLang={sub.lang || 'tr'}
                            default={false}
                        />
                    ))}
                    {customSubtitles.map((sub, idx) => (
                        <track
                            key={`sub-custom-${idx}`}
                            src={sub.file}
                            kind="subtitles"
                            label={sub.label}
                            srcLang={sub.lang || 'tr'}
                            default={false}
                        />
                    ))}
                </video>

                {(isLive || isStream) && !isReady && !hasError && (
                    <div className="native-loader-overlay" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
                        <div className="pro-spinner" />
                    </div>
                )}

                 {(isLive || isStream) && (
                    <>
                        {/* Modern Unified Oxypace Player Controls for VOD Movies */}
                        {isNativeVOD && (
                            <div 
                                className="native-controls-ui is-always-visible"
                                style={{
                                    opacity: controlsVisible ? 1 : 0,
                                    pointerEvents: controlsVisible ? 'auto' : 'none',
                                    transition: 'opacity 0.25s ease'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="native-progress-area" onClick={handleScrubClick}>
                                    <div className="native-progress-track">
                                        <div className="native-progress-fill" style={{ width: `${progress}%` }}>
                                            <div className="native-progress-thumb" />
                                        </div>
                                    </div>
                                </div>

                                <div className="native-bottom-row">
                                    <div className="native-left-controls">
                                        <button 
                                            className="native-play-pause-btn" 
                                            onClick={handleTogglePlayPause}
                                            title={watchParty?.isPlaying ? "Duraklat" : "Oynat"}
                                            aria-label="Oynat / Duraklat"
                                        >
                                            {watchParty?.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                        </button>

                                        <div className="native-time-display">
                                            <span>{formatTime(currentTime)}</span>
                                            <span className="native-time-sep">/</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>

                                        <button className="native-skip-btn" onClick={() => handleSeekOffset(-10)} title="10 Saniye Geri">
                                            <RotateCcw size={16} />
                                        </button>
                                        <button className="native-skip-btn" onClick={() => handleSeekOffset(10)} title="10 Saniye İleri">
                                            <RotateCw size={16} />
                                        </button>

                                        <div className="native-volume-inline" onMouseLeave={() => setVolumeOpen(false)}>
                                            <button 
                                                className="native-volume-inline-btn" 
                                                onClick={() => {
                                                    setLocalMuted(!localMuted);
                                                    setVolumeOpen(true);
                                                }}
                                                onMouseEnter={() => setVolumeOpen(true)}
                                                title={localMuted ? "Sesi Aç" : "Sesi Kapat"}
                                            >
                                                {localMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                            </button>
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
                                                className={`native-volume-inline-slider ${!volumeOpen ? 'collapsed' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="native-right-controls">
                                        {/* Ses Seçeneği (Dublaj / Orijinal) */}
                                        {audioTracks.length > 0 && (
                                            <div className="native-track-container" ref={audioMenuRef}>
                                                <button
                                                    className={`native-track-btn ${isAudioMenuOpen ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsAudioMenuOpen(prev => !prev);
                                                        setIsSubMenuOpen(false);
                                                    }}
                                                    title="Ses / Dublaj Seçeneği"
                                                    aria-label="Ses / Dublaj Seçeneği"
                                                >
                                                    <Headphones size={15} />
                                                    <span className="native-track-text-label">
                                                        {formatAudioLabel(audioTracks[currentAudioTrack] || audioTracks[0], currentAudioTrack, true)}
                                                    </span>
                                                </button>
                                                {isAudioMenuOpen && (
                                                    <div className="native-track-dropdown" onClick={(e) => e.stopPropagation()}>
                                                        <div className="native-track-dropdown-header">
                                                            <Headphones size={13} />
                                                            <span>Ses Parçası</span>
                                                        </div>
                                                        <div className="native-track-dropdown-list">
                                                            {audioTracks.map((track, i) => {
                                                                const isSelected = currentAudioTrack === track.id || currentAudioTrack === i;
                                                                return (
                                                                    <button
                                                                        key={`aud-${track.id}-${i}`}
                                                                        className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                                        onClick={() => handleSelectAudioTrack(track.id !== undefined ? track.id : i)}
                                                                    >
                                                                        <span className="native-track-item-check">
                                                                            {isSelected ? <Check size={14} /> : null}
                                                                        </span>
                                                                        <span className="native-track-item-name">{formatAudioLabel(track, i)}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Altyazı Seçeneği (Her Zaman Görünür) */}
                                        <div className="native-track-container" ref={subMenuRef}>
                                            <button
                                                className={`native-track-btn ${isSubMenuOpen ? 'active' : ''} ${activeSubtitleId !== 'off' ? 'has-active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsSubMenuOpen(prev => !prev);
                                                    setIsAudioMenuOpen(false);
                                                }}
                                                title="Altyazı Seçenekleri"
                                                aria-label="Altyazı Seçenekleri"
                                            >
                                                <Languages size={15} />
                                                <span className="native-track-text-label">
                                                    {getActiveSubtitleButtonLabel()}
                                                </span>
                                            </button>
                                            {isSubMenuOpen && (
                                                <div className="native-track-dropdown" onClick={(e) => e.stopPropagation()}>
                                                    <div className="native-track-dropdown-header">
                                                        <Languages size={13} />
                                                        <span>Altyazı Seçenekleri</span>
                                                    </div>
                                                    <div className="native-track-dropdown-list">
                                                        <button
                                                            className={`native-track-dropdown-item ${activeSubtitleId === 'off' ? 'active' : ''}`}
                                                            onClick={() => handleSelectSubtitleTrack({ type: 'off' })}
                                                        >
                                                            <span className="native-track-item-check">
                                                                {activeSubtitleId === 'off' ? <Check size={14} /> : null}
                                                            </span>
                                                            <span className="native-track-item-name">Kapalı</span>
                                                        </button>

                                                        {/* Hls.js İçerisindeki Altyazı Parçaları */}
                                                        {hlsSubtitleTracks.map((track, i) => {
                                                            const isSelected = activeSubtitleId === `hls-${track.id}`;
                                                            return (
                                                                <button
                                                                    key={`hls-sub-${track.id}-${i}`}
                                                                    className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                                    onClick={() => handleSelectSubtitleTrack({ type: 'hls', id: track.id })}
                                                                >
                                                                    <span className="native-track-item-check">
                                                                        {isSelected ? <Check size={14} /> : null}
                                                                    </span>
                                                                    <span className="native-track-item-name">{formatSubtitleLabel(track, i)}</span>
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Yayın Sağlayıcısından Gelen WebVTT Altyazılar */}
                                                        {(watchParty?.subtitles || []).map((sub, i) => {
                                                            const isSelected = activeSubtitleId === `ext-${i}`;
                                                            return (
                                                                <button
                                                                    key={`ext-sub-${i}`}
                                                                    className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                                    onClick={() => handleSelectSubtitleTrack({ type: 'ext', index: i })}
                                                                >
                                                                    <span className="native-track-item-check">
                                                                        {isSelected ? <Check size={14} /> : null}
                                                                    </span>
                                                                    <span className="native-track-item-name">{formatSubtitleLabel(sub, i)}</span>
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Kullanıcının Yüklediği Özel Altyazılar */}
                                                        {customSubtitles.map((sub, i) => {
                                                            const isSelected = activeSubtitleId === `custom-${i}`;
                                                            return (
                                                                <button
                                                                    key={`custom-sub-${i}`}
                                                                    className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                                    onClick={() => handleSelectSubtitleTrack({ type: 'custom', index: i })}
                                                                >
                                                                    <span className="native-track-item-check">
                                                                        {isSelected ? <Check size={14} /> : null}
                                                                    </span>
                                                                    <span className="native-track-item-name">{sub.label}</span>
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Otomatik Altyazı Yoksa Bilgilendirme */}
                                                        {hlsSubtitleTracks.length === 0 && (!watchParty?.subtitles || watchParty.subtitles.length === 0) && customSubtitles.length === 0 && (
                                                            <div className="native-track-empty-note">
                                                                Bu kaynakta otomatik altyazı yok
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="native-track-divider" />
                                                    <label 
                                                        className="native-track-upload-btn" 
                                                        title="Cihazınızdan .srt veya .vtt altyazı dosyası seçin"
                                                    >
                                                        <Upload size={13} />
                                                        <span>Altyazı Dosyası Ekle (.srt/.vtt)</span>
                                                        <input
                                                            ref={customFileInputRef}
                                                            type="file"
                                                            accept=".srt,.vtt"
                                                            style={{ display: 'none' }}
                                                            onChange={handleCustomSubtitleUpload}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            className="native-fullscreen-btn" 
                                            onClick={toggleFullscreen}
                                            title="Tam Ekran"
                                            aria-label="Tam Ekran Yap / Çık"
                                        >
                                            <Maximize size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Broadcast Floating Controls (Only shown for real live streams) */}
                        {!isNativeVOD && (
                            <>
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
                                        onClick={() => setLocalMuted(!localMuted)}
                                        title={localMuted ? "Sesi Aç" : "Sesi Kapat"}
                                    >
                                        {localMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                </div>

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
                    </>
                 )}

                  {(!isLive && !isStream) && (
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
                            serverNow={getServerNow}
                            disableWatchSync={false}
                            className="watch-party-custom-videoplayer"
                        />
                    )
                )}
            </div>

            <HlsStreamResolverModalVol2
                isOpen={isFilmSearchModalOpen}
                onClose={() => setIsFilmSearchModalOpen(false)}
                onStartWatchParty={(streamUrl, isLive, subtitles, title) => {
                    startWatchParty(streamUrl, isLive, subtitles, title);
                }}
            />
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
