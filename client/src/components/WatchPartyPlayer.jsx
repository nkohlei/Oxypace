import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { X, Volume2, VolumeX, Maximize, Play, Pause, RotateCw, RotateCcw, Headphones, Languages, Check, Upload, AlertCircle, Film } from 'lucide-react';
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
        getServerNow,
        participants,
        watchStopVoteStatus,
        sendWatchStopVote,
        sendWatchStopCancel
    } = useVoice();
    const { user } = useAuth();

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
    const controlsVisibleRef = useRef(true);
    useEffect(() => {
        controlsVisibleRef.current = controlsVisible;
    }, [controlsVisible]);

    const controlsTimeoutRef = useRef(null);

    // Stop confirmation and 2-user consensus states
    const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
    const handleRequestStop = () => {
        setIsStopConfirmOpen(true);
    };
    const handleConfirmStop = () => {
        setIsStopConfirmOpen(false);
        const activeHumanCount = (participants || []).filter(p => !p.identity?.endsWith('-screen')).length;
        if (activeHumanCount <= 1) {
            stopWatchParty();
        } else {
            sendWatchStopVote();
        }
    };

    // Double-tap Seek & Single-tap Controls Toggle System (YouTube Mobile Standard)
    const [doubleTapFeedback, setDoubleTapFeedback] = useState({ visible: false, side: null, key: 0 });
    const lastTapTimeRef = useRef(0);
    const lastTapXRef = useRef(0);
    const singleTapTimerRef = useRef(null);
    const doubleTapFeedbackTimerRef = useRef(null);
    const targetSeekTimeRef = useRef(null);
    const seekDebounceTimerRef = useRef(null);

    const triggerDoubleTapFeedback = (side) => {
        if (doubleTapFeedbackTimerRef.current) clearTimeout(doubleTapFeedbackTimerRef.current);
        setDoubleTapFeedback({ visible: true, side, key: Date.now() });
        doubleTapFeedbackTimerRef.current = setTimeout(() => {
            setDoubleTapFeedback({ visible: false, side: null, key: 0 });
        }, 650);
    };

    const triggerControlsTemporary = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (!isUnifiedMenuOpenRef.current) {
                setControlsVisible(false);
            }
        }, 3400); // %25 reduced auto-hide duration
    };

    const handleContainerMouseMove = (e) => {
        if (e && (e.pointerType === 'touch' || (window.matchMedia && !window.matchMedia('(pointer: fine)').matches))) {
            return;
        }
        triggerControlsTemporary();
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
    const volumeContainerRef = useRef(null);
    const volumeTimeoutRef = useRef(null);

    const scheduleVolumeAutoClose = () => {
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => {
            setVolumeOpen(false);
        }, 3200);
    };

    const toggleVolume = (e) => {
        if (e) e.stopPropagation();
        setVolumeOpen(prev => {
            const next = !prev;
            if (next) scheduleVolumeAutoClose();
            return next;
        });
    };

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
    const customSubtitlesRef = useRef([]);
    const [discoveredSubtitles, setDiscoveredSubtitles] = useState([]);
    const [activeCueText, setActiveCueText] = useState('');
    const parsedCuesRef = useRef([]);
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const audioMenuRef = useRef(null);
    const subMenuRef = useRef(null);
    const customFileInputRef = useRef(null);

    // Mobile Unified Audio & Subtitle Modal
    const [isUnifiedMenuOpen, setIsUnifiedMenuOpen] = useState(false);
    const [unifiedTab, setUnifiedTab] = useState('subs'); // 'audio' | 'subs'
    const unifiedMenuRef = useRef(null);
    const isUnifiedMenuOpenRef = useRef(false);
    useEffect(() => {
        isUnifiedMenuOpenRef.current = isUnifiedMenuOpen;
    }, [isUnifiedMenuOpen]);

    useEffect(() => {
        if (audioTracks.length > 0 && unifiedTab !== 'subs') {
            setUnifiedTab('audio');
        } else if (audioTracks.length === 0) {
            setUnifiedTab('subs');
        }
    }, [audioTracks.length]);

    const allProviderSubtitles = (watchParty?.subtitles && watchParty.subtitles.length > 0)
        ? watchParty.subtitles
        : discoveredSubtitles;

    // Auto-detect subtitles from stream or page if not originally attached
    useEffect(() => {
        if (!watchParty?.url) {
            setDiscoveredSubtitles([]);
            return;
        }
        if (watchParty.subtitles && watchParty.subtitles.length > 0) return;

        let isCancelled = false;
        fetch('/api/detect-subtitles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streamUrl: watchParty.url, title: watchParty.title })
        })
        .then(r => r.json())
        .then(data => {
            if (!isCancelled && data.success && data.subtitles && data.subtitles.length > 0) {
                console.log(`[WatchPartyPlayer] 🎯 Yayından otomatik altyazılar yakalandı (${data.subtitles.length}):`, data.subtitles);
                setDiscoveredSubtitles(data.subtitles);
            }
        })
        .catch(() => {});

        return () => { isCancelled = true; };
    }, [watchParty?.url]);

    // Close audio, subtitle, unified menus and volume when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (audioMenuRef.current && !audioMenuRef.current.contains(e.target)) {
                setIsAudioMenuOpen(false);
            }
            if (subMenuRef.current && !subMenuRef.current.contains(e.target)) {
                setIsSubMenuOpen(false);
            }
            if (unifiedMenuRef.current && !unifiedMenuRef.current.contains(e.target)) {
                setIsUnifiedMenuOpen(false);
            }
            if (volumeContainerRef.current && !volumeContainerRef.current.contains(e.target)) {
                setVolumeOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
            if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
            if (doubleTapFeedbackTimerRef.current) clearTimeout(doubleTapFeedbackTimerRef.current);
            if (seekDebounceTimerRef.current) clearTimeout(seekDebounceTimerRef.current);
        };
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
                            maxMaxBufferLength: 120,
                            maxBufferLength: 60,
                            maxBufferSize: 60 * 1000 * 1000,
                            enableWorker: true,
                            lowLatencyMode: isLive,
                            backBufferLength: 30,
                            startFragPrefetch: true,
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
        const cur = videoRef.current.currentTime;
        setCurrentTime(cur);

        // Update custom subtitle overlay cue
        if (parsedCuesRef.current && parsedCuesRef.current.length > 0) {
            const active = parsedCuesRef.current.find(c => cur >= c.start && cur <= c.end);
            setActiveCueText(active ? active.text : '');
        } else if (activeSubtitleId === 'off') {
            if (activeCueText) setActiveCueText('');
        }
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

    const parseSubtitleCues = (rawText) => {
        const cues = [];
        if (!rawText) return cues;
        const blocks = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n\n+/);
        const timeRegex = /(?:(\d{1,3}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{1,3}):)?(\d{2}):(\d{2})[,.](\d{3})/;

        for (const block of blocks) {
            const lines = block.trim().split('\n');
            let timeLineIndex = -1;
            let match = null;

            for (let i = 0; i < lines.length; i++) {
                match = lines[i].match(timeRegex);
                if (match) {
                    timeLineIndex = i;
                    break;
                }
            }

            if (timeLineIndex !== -1 && match) {
                const parseSeconds = (h, m, s, ms) => {
                    const hours = h ? parseInt(h, 10) : 0;
                    const mins = parseInt(m, 10);
                    const secs = parseInt(s, 10);
                    const millis = parseInt(ms, 10);
                    return hours * 3600 + mins * 60 + secs + millis / 1000;
                };

                const start = parseSeconds(match[1], match[2], match[3], match[4]);
                const end = parseSeconds(match[5], match[6], match[7], match[8]);
                const rawLines = lines.slice(timeLineIndex + 1).join('\n');
                const text = rawLines.replace(/<\/?[^>]+(>|$)/g, '').trim();

                if (text && end > start) {
                    cues.push({ start, end, text });
                }
            }
        }
        return cues;
    };

    const loadSubtitleTrackText = async (option) => {
        if (option.type === 'off') {
            parsedCuesRef.current = [];
            setActiveCueText('');
            return;
        }
        try {
            let vttContent = '';
            if (option.type === 'custom') {
                const customSub = customSubtitlesRef.current[option.index] || customSubtitles[option.index];
                if (customSub && customSub.rawContent) {
                    vttContent = customSub.rawContent;
                } else if (customSub && customSub.file) {
                    const res = await fetch(customSub.file);
                    vttContent = await res.text();
                }
            } else if (option.type === 'ext') {
                const sub = allProviderSubtitles[option.index];
                if (sub) {
                    const targetUrl = sub.playableUrl
                        ? sub.playableUrl
                        : (sub.file && sub.file.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(sub.file)}` : sub.file);
                    const res = await fetch(targetUrl);
                    vttContent = await res.text();
                }
            }
            if (vttContent) {
                parsedCuesRef.current = parseSubtitleCues(vttContent);
            }
        } catch (err) {
            console.warn("[WatchPartyPlayer] Altyazı ayrıştırma hatası:", err);
        }
    };

    const getActiveSubtitleButtonLabel = () => {
        if (activeSubtitleId === 'off') return 'Altyazı';
        if (activeSubtitleId.startsWith('hls-')) {
            const idx = parseInt(activeSubtitleId.replace('hls-', ''), 10);
            return formatSubtitleLabel(hlsSubtitleTracks[idx], idx, true);
        }
        if (activeSubtitleId.startsWith('ext-')) {
            const idx = parseInt(activeSubtitleId.replace('ext-', ''), 10);
            return formatSubtitleLabel(allProviderSubtitles[idx], idx, true);
        }
        if (activeSubtitleId.startsWith('custom-')) {
            const idx = parseInt(activeSubtitleId.replace('custom-', ''), 10);
            const sub = customSubtitlesRef.current[idx] || customSubtitles[idx];
            return sub?.label ? sub.label.slice(0, 8) : 'Özel';
        }
        return 'Altyazı';
    };

    const handleCustomSubtitleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            let content = '';
            const buffer = event.target.result;
            try {
                const decoderUtf8 = new TextDecoder('utf-8', { fatal: true });
                content = decoderUtf8.decode(buffer);
            } catch (err) {
                try {
                    // Fallback to Turkish Windows-1254 ANSI encoding for Turkish .srt files
                    const decoderTr = new TextDecoder('windows-1254');
                    content = decoderTr.decode(buffer);
                } catch {
                    content = new TextDecoder().decode(buffer);
                }
            }

            if (file.name.toLowerCase().endsWith('.srt')) {
                content = 'WEBVTT\n\n' + content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
            }
            const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const newIndex = customSubtitlesRef.current.length;
            const newSub = {
                file: blobUrl,
                playableUrl: blobUrl,
                rawContent: content,
                label: file.name.replace(/\.(srt|vtt)$/i, '').slice(0, 24),
                lang: 'tr',
                isBlob: true
            };

            const updatedList = [...customSubtitlesRef.current, newSub];
            customSubtitlesRef.current = updatedList;
            setCustomSubtitles(updatedList);

            // Instantly activate cues and overlay!
            parsedCuesRef.current = parseSubtitleCues(content);
            setActiveSubtitleId(`custom-${newIndex}`);
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
        };
        reader.readAsArrayBuffer(file);
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
        loadSubtitleTrackText(option);
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
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            setActiveSubtitleId(`ext-${option.index}`);
        } else if (option.type === 'custom') {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
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

        const baseTime = targetSeekTimeRef.current !== null ? targetSeekTimeRef.current : (video.currentTime || 0);
        const target = Math.max(0, Math.min(duration, baseTime + offset));
        targetSeekTimeRef.current = target;

        isSyncingRef.current = true;
        lastProgrammaticSeekTimeRef.current = target;
        
        // Fast responsive seek: if fastSeek is supported, use it for instant response without buffering stall
        if (typeof video.fastSeek === 'function') {
            try {
                video.fastSeek(target);
            } catch (e) {
                video.currentTime = target;
            }
        } else {
            video.currentTime = target;
        }
        setCurrentTime(target);

        // Lock user action cooldown for 1200ms so alignNativeVideo doesn't fight the user's seek
        isUserActionCooldownRef.current = Date.now() + 1200;

        if (seekDebounceTimerRef.current) {
            clearTimeout(seekDebounceTimerRef.current);
        }

        seekDebounceTimerRef.current = setTimeout(() => {
            const finalTarget = targetSeekTimeRef.current;
            targetSeekTimeRef.current = null;
            if (typeof finalTarget === 'number') {
                sendWatchSeek(finalTarget);
            }
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 300);
        }, 120);
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

    const handlePlayerSurfaceClick = (e) => {
        if (
            e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('.native-controls-ui') || 
            e.target.closest('.watch-party-header') || 
            e.target.closest('.watch-party-volume-container-modern') || 
            e.target.closest('.watch-party-fullscreen-container-modern') ||
            e.target.closest('.native-track-dropdown') ||
            e.target.closest('.native-unified-track-modal') ||
            e.target.closest('.native-unified-track-backdrop')
        ) {
            return;
        }

        const now = Date.now();
        const rect = containerRef.current?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const width = rect.width;
        const timeDiff = now - lastTapTimeRef.current;
        const isDoubleTap = timeDiff < 320 && Math.abs(tapX - lastTapXRef.current) < 120;

        if (isDoubleTap) {
            // Cancel single tap toggle so controls DO NOT flicker
            if (singleTapTimerRef.current) {
                clearTimeout(singleTapTimerRef.current);
                singleTapTimerRef.current = null;
            }
            lastTapTimeRef.current = 0;

            // Double Tap Action: Seek 10 seconds (YouTube Style)
            if (tapX < width * 0.45) {
                handleSeekOffset(-10);
                triggerDoubleTapFeedback('left');
            } else if (tapX > width * 0.55) {
                handleSeekOffset(10);
                triggerDoubleTapFeedback('right');
            } else {
                if (tapX < width * 0.5) {
                    handleSeekOffset(-10);
                    triggerDoubleTapFeedback('left');
                } else {
                    handleSeekOffset(10);
                    triggerDoubleTapFeedback('right');
                }
            }

            if (controlsVisibleRef.current) {
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                controlsTimeoutRef.current = setTimeout(() => {
                    if (!isUnifiedMenuOpenRef.current) {
                        setControlsVisible(false);
                    }
                }, 3400);
            }
        } else {
            lastTapTimeRef.current = now;
            lastTapXRef.current = tapX;

            if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
            singleTapTimerRef.current = setTimeout(() => {
                const currentlyShown = controlsVisibleRef.current;
                if (currentlyShown) {
                    // Tap hides controls immediately
                    setControlsVisible(false);
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                } else {
                    // Tap shows controls and keeps them visible for 3.4 seconds (%25 reduced)
                    setControlsVisible(true);
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                    controlsTimeoutRef.current = setTimeout(() => {
                        if (!isUnifiedMenuOpenRef.current) {
                            setControlsVisible(false);
                        }
                    }, 3400);
                }
                singleTapTimerRef.current = null;
            }, 260);
        }
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

            // 3. When Playing: Adaptive Smart Rate Pacing for Perfect Millisecond Sync Across Devices!
            // If drift is severe (> 3.0s), do an instantaneous clean seek
            if (absDrift > 3.0 && !playTransitionGuardActive) {
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = targetTime;
                video.currentTime = targetTime;
                video.playbackRate = 1.0;
                playTransitionGuardActive = true;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                playTransitionGuardTimer = setTimeout(() => {
                    playTransitionGuardActive = false;
                }, 1500);
                setTimeout(() => { isSyncingRef.current = false; }, 400);
            } else if (!playTransitionGuardActive) {
                // Adaptive micro-rate pacing:
                // If local client is behind (drift > 0.25s), speed up slightly (1.05x - 1.08x) so mobile catches up smoothly without pitch distortion!
                // If local client is ahead (drift < -0.25s), slow down slightly (0.95x - 0.92x) until aligned.
                // When aligned (absDrift <= 0.15s), lock rate back to 1.0.
                if (drift > 0.8) {
                    video.playbackRate = 1.08;
                } else if (drift > 0.25) {
                    video.playbackRate = 1.05;
                } else if (drift < -0.8) {
                    video.playbackRate = 0.92;
                } else if (drift < -0.25) {
                    video.playbackRate = 0.95;
                } else {
                    if (video.playbackRate !== 1.0) {
                        video.playbackRate = 1.0;
                    }
                }
            }
        };

        alignNativeVideo(true);

        syncInterval = setInterval(() => {
            alignNativeVideo(false);
        }, 1000);

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
                    {/* Ses ve Altyazı Butonu & Minimal Floating Popover (Üst Bara Yerleştirildi) */}
                    {isNativeVOD && (
                        <div className="watch-party-header-track-container" ref={unifiedMenuRef}>
                            <button 
                                className={`watch-party-header-track-btn glass-btn ${isUnifiedMenuOpen ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsUnifiedMenuOpen(prev => !prev);
                                    triggerControlsTemporary();
                                }}
                                title="Ses ve Altyazı Seçenekleri"
                                aria-label="Ses ve Altyazı Seçenekleri"
                            >
                                {audioTracks.length > 0 ? (
                                    <div className="native-unified-btn-icons">
                                        <Headphones size={13} />
                                        <span className="native-unified-icon-slash">/</span>
                                        <Languages size={13} />
                                    </div>
                                ) : (
                                    <div className="native-unified-btn-icons">
                                        <Languages size={14} />
                                        <span>Altyazı</span>
                                    </div>
                                )}
                            </button>

                            {/* Minimalist Floating Dropdown Popover */}
                            {isUnifiedMenuOpen && (
                                <div className="native-unified-dropdown-popover" onClick={(e) => e.stopPropagation()}>
                                    <div className="native-unified-popover-header">
                                        {audioTracks.length > 0 ? (
                                            <div className="native-unified-tabs">
                                                <button
                                                    type="button"
                                                    className={`native-unified-tab-btn ${unifiedTab === 'audio' ? 'active' : ''}`}
                                                    onClick={() => setUnifiedTab('audio')}
                                                >
                                                    <Headphones size={12} />
                                                    <span>Ses</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`native-unified-tab-btn ${unifiedTab === 'subs' ? 'active' : ''}`}
                                                    onClick={() => setUnifiedTab('subs')}
                                                >
                                                    <Languages size={12} />
                                                    <span>Altyazı</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="native-unified-single-title">
                                                <Languages size={13} />
                                                <span>Altyazı</span>
                                            </div>
                                        )}
                                        <button 
                                            type="button" 
                                            className="native-unified-popover-close-btn"
                                            onClick={() => setIsUnifiedMenuOpen(false)}
                                            aria-label="Kapat"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>

                                    <div className="native-unified-popover-body">
                                        {unifiedTab === 'audio' && audioTracks.length > 0 && (
                                            <div className="native-track-dropdown-list">
                                                {audioTracks.map((track, i) => {
                                                    const isSelected = currentAudioTrack === track.id || currentAudioTrack === i;
                                                    return (
                                                        <button
                                                            key={`pop-aud-${track.id}-${i}`}
                                                            className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                            onClick={() => {
                                                                handleSelectAudioTrack(track.id !== undefined ? track.id : i);
                                                                setIsUnifiedMenuOpen(false);
                                                            }}
                                                        >
                                                            <span className="native-track-item-check">
                                                                {isSelected ? <Check size={13} /> : null}
                                                            </span>
                                                            <span className="native-track-item-name">{formatAudioLabel(track, i)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {(unifiedTab === 'subs' || audioTracks.length === 0) && (
                                            <div className="native-track-dropdown-list">
                                                <button
                                                    className={`native-track-dropdown-item ${activeSubtitleId === 'off' ? 'active' : ''}`}
                                                    onClick={() => {
                                                        handleSelectSubtitleTrack({ type: 'off' });
                                                        setIsUnifiedMenuOpen(false);
                                                    }}
                                                >
                                                    <span className="native-track-item-check">
                                                        {activeSubtitleId === 'off' ? <Check size={13} /> : null}
                                                    </span>
                                                    <span className="native-track-item-name">Kapalı</span>
                                                </button>

                                                {hlsSubtitleTracks.map((track, i) => {
                                                    const isSelected = activeSubtitleId === `hls-${track.id}`;
                                                    return (
                                                        <button
                                                            key={`pop-hls-sub-${track.id}-${i}`}
                                                            className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                            onClick={() => {
                                                                handleSelectSubtitleTrack({ type: 'hls', id: track.id });
                                                                setIsUnifiedMenuOpen(false);
                                                            }}
                                                        >
                                                            <span className="native-track-item-check">
                                                                {isSelected ? <Check size={13} /> : null}
                                                            </span>
                                                            <span className="native-track-item-name">{formatSubtitleLabel(track, i)}</span>
                                                        </button>
                                                    );
                                                })}

                                                {allProviderSubtitles.map((sub, i) => {
                                                    const isSelected = activeSubtitleId === `ext-${i}`;
                                                    return (
                                                        <button
                                                            key={`pop-ext-sub-${i}`}
                                                            className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                            onClick={() => {
                                                                handleSelectSubtitleTrack({ type: 'ext', index: i });
                                                                setIsUnifiedMenuOpen(false);
                                                            }}
                                                        >
                                                            <span className="native-track-item-check">
                                                                {isSelected ? <Check size={13} /> : null}
                                                            </span>
                                                            <span className="native-track-item-name">{formatSubtitleLabel(sub, i)}</span>
                                                        </button>
                                                    );
                                                })}

                                                {customSubtitles.map((sub, i) => {
                                                    const isSelected = activeSubtitleId === `custom-${i}`;
                                                    return (
                                                        <button
                                                            key={`pop-custom-sub-${i}`}
                                                            className={`native-track-dropdown-item ${isSelected ? 'active' : ''}`}
                                                            onClick={() => {
                                                                handleSelectSubtitleTrack({ type: 'custom', index: i });
                                                                setIsUnifiedMenuOpen(false);
                                                            }}
                                                        >
                                                            <span className="native-track-item-check">
                                                                {isSelected ? <Check size={13} /> : null}
                                                            </span>
                                                            <span className="native-track-item-name">{sub.label}</span>
                                                        </button>
                                                    );
                                                })}

                                                {hlsSubtitleTracks.length === 0 && allProviderSubtitles.length === 0 && customSubtitles.length === 0 && (
                                                    <div className="native-track-empty-note">
                                                        Otomatik altyazı yok
                                                    </div>
                                                )}

                                                <div className="native-track-divider" />
                                                <label 
                                                    className="native-track-upload-btn" 
                                                    title="Cihazınızdan .srt veya .vtt altyazı dosyası seçin"
                                                >
                                                    <Upload size={12} />
                                                    <span>Altyazı Dosyası Ekle (.srt/.vtt)</span>
                                                    <input
                                                        ref={customFileInputRef}
                                                        type="file"
                                                        accept=".srt,.vtt"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            handleCustomSubtitleUpload(e);
                                                            setIsUnifiedMenuOpen(false);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bitir Butonu: Yazısız sadece çarpı, kapatılmak için tıklandığında onay ister */}
                    <button 
                        className="watch-party-stop-btn glass-btn danger icon-only" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRequestStop();
                        }} 
                        title="Birlikte İzle Modunu Kapat"
                        aria-label="Kapat"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div 
                className="watch-party-player-container"
                onClick={handlePlayerSurfaceClick}
                onMouseMove={handleContainerMouseMove}
            >
                {/* YouTube Style Double Tap Seek Overlay */}
                {doubleTapFeedback.visible && (
                    <div 
                        key={doubleTapFeedback.key}
                        className={`yt-double-tap-feedback ${doubleTapFeedback.side}`}
                    >
                        <div className="yt-double-tap-ripple">
                            <div className="yt-double-tap-arrows">
                                {doubleTapFeedback.side === 'left' ? (
                                    <>
                                        <RotateCcw size={28} />
                                        <span>-10 sn</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCw size={28} />
                                        <span>+10 sn</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
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
                    {allProviderSubtitles.map((sub, idx) => (
                        <track
                            key={`sub-track-${idx}-${sub.file || sub.playableUrl}`}
                            src={sub.file && sub.file.startsWith('http') ? sub.file : getProxiedUrl(sub.playableUrl || sub.file)}
                            kind="subtitles"
                            label={sub.label || `Altyazı ${idx + 1}`}
                            srcLang={sub.lang || 'tr'}
                            default={false}
                            crossOrigin="anonymous"
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

                {/* Netflix-Grade Pro Subtitle Overlay */}
                {activeCueText && (
                    <div className={`watch-party-subtitle-overlay ${controlsVisible ? 'controls-shown' : 'controls-hidden'}`}>
                        <div className="watch-party-subtitle-box">
                            {activeCueText.split('\n').map((line, i) => (
                                <span key={i} className="watch-party-sub-line">{line}</span>
                            ))}
                        </div>
                    </div>
                )}

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

                                        <button className="native-skip-btn desktop-only" onClick={() => handleSeekOffset(-10)} title="10 Saniye Geri">
                                            <RotateCcw size={16} />
                                        </button>
                                        <button className="native-skip-btn desktop-only" onClick={() => handleSeekOffset(10)} title="10 Saniye İleri">
                                            <RotateCw size={16} />
                                        </button>

                                        <div 
                                            className="native-volume-inline" 
                                            ref={volumeContainerRef}
                                            onMouseLeave={() => setVolumeOpen(false)}
                                        >
                                            <button 
                                                className="native-volume-inline-btn" 
                                                onClick={toggleVolume}
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
                                                    scheduleVolumeAutoClose();
                                                }}
                                                onTouchStart={() => scheduleVolumeAutoClose()}
                                                className={`native-volume-inline-slider ${!volumeOpen ? 'collapsed' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="native-right-controls">
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

            {/* Kullanıcı Kapatma Onayı Modalı */}
            {isStopConfirmOpen && (
                <div className="watch-party-consensus-backdrop" onClick={() => setIsStopConfirmOpen(false)}>
                    <div className="watch-party-consensus-card" onClick={(e) => e.stopPropagation()}>
                        <div className="watch-party-consensus-header">
                            <div className="watch-party-consensus-title-wrap">
                                <AlertCircle size={18} className="watch-party-consensus-warning-icon" />
                                <h4>Birlikte İzlemeyi Bitir</h4>
                            </div>
                            <button 
                                type="button" 
                                className="watch-party-consensus-close-btn" 
                                onClick={() => setIsStopConfirmOpen(false)}
                                aria-label="Kapat"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <div className="watch-party-consensus-body">
                            {(participants || []).filter(p => !p.identity?.endsWith('-screen')).length <= 1 ? (
                                <p>Birlikte izlemeyi sonlandırmak istediğinize emin misiniz?</p>
                            ) : (
                                <p>
                                    Birlikte izlemeyi sonlandırmak istiyor musunuz?
                                    <br />
                                    <span className="watch-party-consensus-hint">
                                        Odadaki diğer kullanıcıların izlemesini kesintiye uğratmamak için en az <strong>2 kullanıcının onayı</strong> gereklidir.
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="watch-party-consensus-actions">
                            <button 
                                type="button" 
                                className="glass-btn secondary" 
                                onClick={() => setIsStopConfirmOpen(false)}
                            >
                                Vazgeç
                            </button>
                            <button 
                                type="button" 
                                className="glass-btn danger-confirm" 
                                onClick={handleConfirmStop}
                            >
                                {(participants || []).filter(p => !p.identity?.endsWith('-screen')).length <= 1 ? 'Evet, Bitir' : 'Onay İsteği Başlat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimum 2 Kullanıcı Konsensüs Oylama Modalı */}
            {watchStopVoteStatus && (
                <div className="watch-party-consensus-backdrop">
                    <div className="watch-party-consensus-card" onClick={(e) => e.stopPropagation()}>
                        <div className="watch-party-consensus-header">
                            <div className="watch-party-consensus-title-wrap">
                                <Film size={18} className="watch-party-consensus-info-icon" />
                                <h4>Birlikte İzleme Kapatma Onayı</h4>
                            </div>
                            <span className="watch-party-consensus-badge">
                                {watchStopVoteStatus.voters?.length || 0} / {watchStopVoteStatus.required} Onay
                            </span>
                        </div>
                        <div className="watch-party-consensus-body">
                            {watchStopVoteStatus.voters?.includes(user?._id?.toString()) ? (
                                <p>
                                    Kapatma onayınız alındı ({watchStopVoteStatus.voters?.length}/{watchStopVoteStatus.required}).
                                    <br />
                                    <span className="watch-party-consensus-hint">
                                        Birlikte izlemenin sonlandırılması için başka bir kullanıcının onayı bekleniyor...
                                    </span>
                                </p>
                            ) : (
                                <p>
                                    <strong>{watchStopVoteStatus.requesterName}</strong> birlikte izlemeyi sonlandırmak istiyor.
                                    <br />
                                    <span className="watch-party-consensus-hint">
                                        Sonlandırma için en az {watchStopVoteStatus.required} kullanıcı onayı gereklidir. Onaylıyor musunuz?
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="watch-party-consensus-actions">
                            {watchStopVoteStatus.voters?.includes(user?._id?.toString()) ? (
                                <button 
                                    type="button" 
                                    className="glass-btn secondary" 
                                    onClick={() => sendWatchStopCancel()}
                                >
                                    İsteği İptal Et
                                </button>
                            ) : (
                                <>
                                    <button 
                                        type="button" 
                                        className="glass-btn secondary" 
                                        onClick={() => sendWatchStopCancel()}
                                    >
                                        Reddet
                                    </button>
                                    <button 
                                        type="button" 
                                        className="glass-btn danger-confirm" 
                                        onClick={() => sendWatchStopVote()}
                                    >
                                        Onayla ve Bitir
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
