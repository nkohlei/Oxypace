import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ReactPlayer from 'react-player';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import { X, Volume2, VolumeX, Maximize, Minimize, Play, Pause, RotateCw, RotateCcw, Headphones, Languages, Check, Upload, AlertCircle, Film, Sliders, Type, MoveVertical } from 'lucide-react';
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
  
  const isElectron = typeof window !== 'undefined' && (
    !!window.desktopAPI?.isElectron || 
    (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') !== -1) ||
    !!window.process?.versions?.electron ||
    !!window.ipcRenderer
  );
  
  // If running inside Electron, bypass backend proxy entirely for HLS since local main process spoofing handles it
  if (isElectron && !url.includes('/api/proxy') && (url.includes('.m3u8') || url.includes('/hls/') || url.includes('.txt') || url.includes('manifest'))) {
    return url;
  }
  
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
  
  if (url.includes('/api/proxy') || url.includes('/api/media/proxy-hls')) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.startsWith('https://oxypace.com.tr/api/') || url.startsWith('https://www.oxypace.com.tr/api/') || url.startsWith('https://localhost/api/') || url.startsWith('http://localhost/api/')) {
        const apiIdx = url.indexOf('/api/');
        return `${baseUrl}${url.slice(apiIdx)}`;
      }
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  }

  if (url.startsWith('/api/') || url.startsWith('api/')) {
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
        requestWatchSync,
        sendWatchSubtitle,
        getServerNow,
        participants,
        watchStopVoteStatus,
        sendWatchStopVote,
        sendWatchStopCancel,
        socket,
        consensusRule,
        activeRoom
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

    // Stop confirmation and consensus states
    const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
    const handleRequestStop = () => {
        setIsStopConfirmOpen(true);
    };
    const handleConfirmStop = () => {
        setIsStopConfirmOpen(false);
        setIsApprovingStop(true);
        sendWatchStopVote();
    };

    // Unmute & Mobile Autoplay Helper System
    const [needsUnmutePrompt, setNeedsUnmutePrompt] = useState(false);
    const [needsInteractionPrompt, setNeedsInteractionPrompt] = useState(false);

    const safePlay = async (targetVideo = videoRef.current) => {
        if (!targetVideo) return;
        try {
            if (hlsInstanceRef.current && typeof hlsInstanceRef.current.startLoad === 'function') {
                try { hlsInstanceRef.current.startLoad(); } catch (_) {}
            }
            await targetVideo.play();
            setNeedsInteractionPrompt(false);
            if (!targetVideo.muted && !localMuted) {
                setNeedsUnmutePrompt(false);
            }
        } catch (err) {
            if (err?.name === 'AbortError') {
                // play() was interrupted by a concurrent seek or load; retry cleanly without muting
                setTimeout(() => {
                    if (targetVideo && targetVideo.paused && watchParty?.isPlaying !== false) {
                        targetVideo.play().catch(() => {});
                    }
                }, 60);
                return;
            }
            console.warn('[WatchPartyPlayer] Direct play blocked (likely mobile autoplay policy):', err);
            // Mobilde sesli otomatik oynatma engellendiyse hemen muted olarak oynatmayı dene (mobil tarayıcılar muted'a izin verir)
            try {
                targetVideo.muted = true;
                setLocalMuted(true);
                await targetVideo.play();
                // Video oynamaya başladı, kullanıcıya sesi açması için şık bir dokunma bannerı göster
                setNeedsUnmutePrompt(true);
                setNeedsInteractionPrompt(false);
                console.log('[WatchPartyPlayer] Successfully recovered with muted autoplay on mobile.');
            } catch (mutedErr) {
                if (mutedErr?.name === 'AbortError') return;
                console.warn('[WatchPartyPlayer] Muted play also blocked by device, requiring tap:', mutedErr);
                setNeedsInteractionPrompt(true);
            }
        }
    };

    const handleUserUnmuteAction = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play().catch(() => {});
        }
        setLocalMuted(false);
        setNeedsUnmutePrompt(false);
        setNeedsInteractionPrompt(false);
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
    const activeSubtitleIdRef = useRef('off');
    useEffect(() => {
        activeSubtitleIdRef.current = activeSubtitleId;
    }, [activeSubtitleId]);
    const userDisabledSubtitlesRef = useRef(false);
    const [customSubtitles, setCustomSubtitles] = useState([]);
    const customSubtitlesRef = useRef([]);
    const [discoveredSubtitles, setDiscoveredSubtitles] = useState([]);
    const [activeCueText, setActiveCueText] = useState('');
    const activeCueTextRef = useRef('');
    const parsedCuesRef = useRef([]);
    const [subSyncNotice, setSubSyncNotice] = useState(null);
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const audioMenuRef = useRef(null);
    const subMenuRef = useRef(null);
    const customFileInputRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isApprovingStop, setIsApprovingStop] = useState(false);

    useEffect(() => {
        if (!watchStopVoteStatus) {
            setIsApprovingStop(false);
        }
    }, [watchStopVoteStatus]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fsEl = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;
            setIsFullscreen(!!fsEl && (fsEl === containerRef.current || containerRef.current?.contains(fsEl)));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Film Frame Bounds Tracking (Siyah Barları Altyazı Konumlandırmasından Tamamen Dışlar)
    const [filmBounds, setFilmBounds] = useState({ bottomOffset: 0, filmHeight: 0, filmWidth: 0 });
    const updateFilmBounds = useCallback(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!container) return;

        const cW = container.clientWidth;
        const cH = container.clientHeight;
        if (!cW || !cH) return;

        const vW = (video && video.videoWidth > 0) ? video.videoWidth : 16;
        const vH = (video && video.videoHeight > 0) ? video.videoHeight : 9;
        const videoAspect = vW / vH;
        const containerAspect = cW / cH;

        let filmWidth = cW;
        let filmHeight = cH;
        let bottomOffset = 0;

        if (containerAspect < videoAspect) {
            // Letterbox: Üstte ve altta siyah barlar var. Film görüntüsü ortalanır.
            filmHeight = cW / videoAspect;
            bottomOffset = (cH - filmHeight) / 2;
        } else {
            // Pillarbox: Solda ve sağda siyah barlar var.
            filmWidth = cH * videoAspect;
            bottomOffset = 0;
        }

        setFilmBounds({
            bottomOffset: Math.max(0, Math.round(bottomOffset)),
            filmHeight: Math.max(1, Math.round(filmHeight)),
            filmWidth: Math.max(1, Math.round(filmWidth))
        });
    }, []);

    useEffect(() => {
        updateFilmBounds();
        const container = containerRef.current;
        let ro = null;
        if (container && window.ResizeObserver) {
            ro = new ResizeObserver(() => {
                updateFilmBounds();
            });
            ro.observe(container);
        }
        window.addEventListener('resize', updateFilmBounds);
        document.addEventListener('fullscreenchange', updateFilmBounds);
        return () => {
            if (ro) ro.disconnect();
            window.removeEventListener('resize', updateFilmBounds);
            document.removeEventListener('fullscreenchange', updateFilmBounds);
        };
    }, [updateFilmBounds]);

    // Customizable Subtitle Appearance States (Size, Position, Color, Background, Shadow, Font)
    const [subSizeScale, setSubSizeScale] = useState(() => {
        const saved = localStorage.getItem('watchPartySubScale');
        return saved !== null ? parseFloat(saved) : 1.0;
    });
    const [subBottomPercent, setSubBottomPercent] = useState(() => {
        const saved = localStorage.getItem('watchPartySubBottomPercent');
        return saved !== null ? parseFloat(saved) : 6;
    });
    const [subColor, setSubColor] = useState(() => {
        return localStorage.getItem('watchPartySubColor') || '#ffffff';
    });
    const [subBg, setSubBg] = useState(() => {
        return localStorage.getItem('watchPartySubBg') || 'none';
    });
    const [subShadow, setSubShadow] = useState(() => {
        return localStorage.getItem('watchPartySubShadow') || 'deep';
    });
    const [subFont, setSubFont] = useState(() => {
        return localStorage.getItem('watchPartySubFont') || 'sans';
    });
    const [isDraggingSub, setIsDraggingSub] = useState(false);
    const isDraggingSubRef = useRef(false);
    const dragStartYRef = useRef(0);
    const dragStartBottomPercentRef = useRef(6);

    // Real-time synchronization with Settings & other tabs
    useEffect(() => {
        const handleSyncSubSettings = () => {
            const s = localStorage.getItem('watchPartySubScale');
            const b = localStorage.getItem('watchPartySubBottomPercent');
            const c = localStorage.getItem('watchPartySubColor');
            const bg = localStorage.getItem('watchPartySubBg');
            const sh = localStorage.getItem('watchPartySubShadow');
            const f = localStorage.getItem('watchPartySubFont');
            if (s !== null) {
                const parsed = parseFloat(s);
                if (!isNaN(parsed)) setSubSizeScale(parsed);
            }
            if (b !== null) {
                const parsed = parseFloat(b);
                if (!isNaN(parsed)) setSubBottomPercent(parsed);
            }
            if (c) setSubColor(c);
            if (bg) setSubBg(bg);
            if (sh) setSubShadow(sh);
            if (f) setSubFont(f);
        };
        handleSyncSubSettings();
        window.addEventListener('watchparty:subtitles-updated', handleSyncSubSettings);
        window.addEventListener('storage', handleSyncSubSettings);
        return () => {
            window.removeEventListener('watchparty:subtitles-updated', handleSyncSubSettings);
            window.removeEventListener('storage', handleSyncSubSettings);
        };
    }, []);

    const handleUpdateSubBottom = (percent) => {
        const clamped = Math.max(2, Math.min(88, Math.round(percent)));
        setSubBottomPercent(clamped);
        localStorage.setItem('watchPartySubBottomPercent', clamped.toString());
        window.dispatchEvent(new CustomEvent('watchparty:subtitles-updated'));
    };

    const handleSubDragStart = (e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        e.stopPropagation();
        isDraggingSubRef.current = true;
        setIsDraggingSub(true);
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartYRef.current = clientY;
        dragStartBottomPercentRef.current = subBottomPercent;

        const onDragMove = (moveEvt) => {
            if (!isDraggingSubRef.current) return;
            const curY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
            const deltaY = dragStartYRef.current - curY; // Dragging upwards increases bottom offset
            const activeFilmHeight = (filmBounds.filmHeight > 0) ? filmBounds.filmHeight : (containerRef.current ? containerRef.current.offsetHeight : 400);
            const deltaPercent = (deltaY / activeFilmHeight) * 100;
            const nextPercent = Math.max(2, Math.min(88, Math.round(dragStartBottomPercentRef.current + deltaPercent)));
            setSubBottomPercent(nextPercent);
        };

        const onDragEnd = () => {
            if (!isDraggingSubRef.current) return;
            isDraggingSubRef.current = false;
            setIsDraggingSub(false);
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
            setSubBottomPercent(prev => {
                localStorage.setItem('watchPartySubBottomPercent', prev.toString());
                window.dispatchEvent(new CustomEvent('watchparty:subtitles-updated'));
                return prev;
            });
        };

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    };

    const getShadowStyle = (shadowType) => {
        switch (shadowType) {
            case 'strong':
                return '0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.95)';
            case 'glow':
                return '0 0 12px rgba(255, 255, 255, 0.8), 0 0 4px #000, 1px 1px 2px #000, -1px -1px 2px #000';
            case 'clean':
                return '0 1px 2px rgba(0,0,0,0.85)';
            case 'deep':
            default:
                return '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 0 2px 5px rgba(0,0,0,0.95)';
        }
    };

    const getBgStyle = (bgType) => {
        switch (bgType) {
            case 'semi':
                return 'rgba(0, 0, 0, 0.65)';
            case 'box':
                return 'rgba(0, 0, 0, 0.92)';
            case 'blur':
                return 'rgba(10, 10, 15, 0.75)';
            case 'none':
            default:
                return 'transparent';
        }
    };

    const getFontFamily = (fontType) => {
        switch (fontType) {
            case 'matrix':
            case 'mono':
                return 'Consolas, "SF Mono", monospace';
            case 'serif':
                return 'Georgia, "Times New Roman", serif';
            case 'sans':
            default:
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        }
    };

    // Mobile Unified Audio & Subtitle Modal
    const [isUnifiedMenuOpen, setIsUnifiedMenuOpen] = useState(false);
    const [unifiedTab, setUnifiedTab] = useState('subs'); // 'audio' | 'subs'
    const unifiedMenuRef = useRef(null);
    const popoverContentRef = useRef(null);
    const [popoverPos, setPopoverPos] = useState({ isMobile: true });
    const isUnifiedMenuOpenRef = useRef(false);
    useEffect(() => {
        isUnifiedMenuOpenRef.current = isUnifiedMenuOpen;
    }, [isUnifiedMenuOpen]);

    const updatePopoverPos = useCallback(() => {
        if (!isUnifiedMenuOpenRef.current || !unifiedMenuRef.current) return;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            setPopoverPos({ isMobile: true });
        } else {
            const rect = unifiedMenuRef.current.getBoundingClientRect();
            setPopoverPos({
                isMobile: false,
                top: Math.round(rect.bottom + 8),
                right: Math.max(12, Math.round(window.innerWidth - rect.right))
            });
        }
    }, []);

    useEffect(() => {
        if (isUnifiedMenuOpen) {
            updatePopoverPos();
            window.addEventListener('resize', updatePopoverPos);
            window.addEventListener('scroll', updatePopoverPos, true);
            return () => {
                window.removeEventListener('resize', updatePopoverPos);
                window.removeEventListener('scroll', updatePopoverPos, true);
            };
        }
    }, [isUnifiedMenuOpen, updatePopoverPos]);

    useEffect(() => {
        if (audioTracks.length > 0 && unifiedTab !== 'subs') {
            setUnifiedTab('audio');
        } else if (audioTracks.length === 0 && unifiedTab === 'audio') {
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
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');
        fetch(`${apiBase}/api/detect-subtitles`, {
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
            if (
                unifiedMenuRef.current && 
                !unifiedMenuRef.current.contains(e.target) &&
                (!popoverContentRef.current || !popoverContentRef.current.contains(e.target))
            ) {
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
                CallManager.setAudioMode({ mode: 'media' }).catch(() => {});
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
        activeSubtitleIdRef.current = 'off';
        userDisabledSubtitlesRef.current = false;
        parsedCuesRef.current = [];
        activeCueTextRef.current = '';
        setActiveCueText('');
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
        const rawUrl = watchParty.url.trim();
        const needsNormalizedProxy = useProxy || rawUrl.startsWith('/') || rawUrl.startsWith('api/') || rawUrl.includes('/api/proxy') || rawUrl.includes('/api/media/');
        const streamUrl = needsNormalizedProxy ? getProxiedUrl(rawUrl) : rawUrl;
        const urlIsHls = isHls(rawUrl) || watchParty.isLive;
        const urlIsDash = isDash(rawUrl);

        const getLiveExpectedTime = () => {
            const base = typeof watchParty?.currentTime === 'number' ? watchParty.currentTime : 0;
            if (watchParty?.isPlaying && !watchParty?.isLive) {
                const ref = watchParty.serverTimestamp || watchParty.lastUpdated;
                if (ref) {
                    return base + Math.max(0, (getServerNow() - ref) / 1000);
                }
            }
            return base;
        };

        console.log(`[WatchPartyPlayer] Initializing stream. URL: ${streamUrl} (useProxy: ${useProxy}, isLive: ${isLive})`);

        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }
        if (dashPlayerRef.current) {
            dashPlayerRef.current.destroy();
            dashPlayerRef.current = null;
        }

        const markReadyAndAlign = () => {
            setIsReady(true);
            if (isNativeVOD) {
                const liveTarget = getLiveExpectedTime();
                if (liveTarget > 0.3 && Math.abs((video.currentTime || 0) - liveTarget) > 0.4) {
                    try {
                        lastProgrammaticSeekTimeRef.current = liveTarget;
                        video.currentTime = liveTarget;
                    } catch (_) {}
                }
            }
            if (watchParty?.isPlaying) {
                safePlay(video);
            }
            if (requestWatchSync) {
                requestWatchSync();
            }
        };

        video.addEventListener('loadedmetadata', markReadyAndAlign, { once: true });
        video.addEventListener('canplay', markReadyAndAlign, { once: true });

        const initPlayer = async () => {
            try {
                if (urlIsHls || !urlIsDash) {
                    const Hls = await loadHls();
                    const canUseHlsJs = Hls && Hls.isSupported();

                    // On Android WebView, native canPlayType('application/vnd.apple.mpegurl') is unstable with proxies and CORS.
                    // Prefer Hls.js whenever supported, falling back to native only on iOS/Safari.
                    if (!canUseHlsJs && video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamUrl;
                        video.addEventListener('loadedmetadata', () => {
                            markReadyAndAlign();
                        }, { once: true });
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
                        const isMobile = typeof window !== 'undefined' && (
                            window.innerWidth <= 768 ||
                            (window.navigator?.userAgent && /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)) ||
                            !!window.Capacitor?.isNativePlatform?.()
                        );
                        const initialStartTime = getLiveExpectedTime();
                        const hls = new Hls({
                            // Mobile jet-speed startup & RAM optimization
                            startLevel: isMobile ? 0 : -1,
                            maxBufferLength: isMobile ? 25 : 60,
                            maxMaxBufferLength: isMobile ? 45 : 120,
                            maxBufferSize: isMobile ? (30 * 1024 * 1024) : (60 * 1024 * 1024),
                            backBufferLength: isMobile ? 10 : 30,
                            maxBufferHole: 0.3,
                            highBufferWatchdogPeriod: 1,
                            enableWorker: true,
                            lowLatencyMode: isLive,
                            startFragPrefetch: true,
                            startPosition: isLive ? -1 : (initialStartTime > 0 ? initialStartTime : 0),
                            liveSyncDurationCount: isLive ? 3 : undefined,
                            liveMaxLatencyDurationCount: isLive ? 10 : undefined,
                            capLevelToPlayerSize: isMobile,
                            nudgeMaxRetry: 8,
                            nudgeOffset: 0.15,
                            fragLoadingTimeOut: 15000,
                            fragLoadingMaxRetry: 6,
                            fragLoadingRetryDelay: 500,
                            fragLoadingMaxRetryTimeout: 32000,
                            manifestLoadingTimeOut: 12000,
                            manifestLoadingMaxRetry: 5,
                            manifestLoadingRetryDelay: 500,
                            levelLoadingTimeOut: 12000,
                            levelLoadingMaxRetry: 5,
                            xhrSetup: (xhr) => {
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
                            updateAudio();
                            updateSubs();
                            markReadyAndAlign();
                        });

                        hls.on(Hls.Events.FRAG_BUFFERED, () => {
                            setIsReady(true);
                        });

                        hls.on(Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                console.warn("Fatal Hls.js error encountered:", data);
                                if (!useProxy && streamUrl !== getProxiedUrl(rawUrl)) {
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
                            } else if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                try {
                                    hls.startLoad();
                                    if (video && !video.paused) {
                                        video.play().catch(() => {});
                                    }
                                } catch (_) {}
                            }
                        });
                    }
                } else if (urlIsDash) {
                    const dashjs = await loadDash();
                    const player = dashjs.MediaPlayer().create();
                    dashPlayerRef.current = player;
                    player.initialize(video, streamUrl, true);
                    
                    player.on(dashjs.MediaPlayer.events.PLAYBACK_METADATA_LOADED, () => {
                        markReadyAndAlign();
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
            video.removeEventListener('loadedmetadata', markReadyAndAlign);
            video.removeEventListener('canplay', markReadyAndAlign);
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

        const syncStandardPlayer = () => {
            if (!playerRef.current || !watchParty) return;
            const referenceTime = watchParty.serverTimestamp || watchParty.lastUpdated;
            let expectedTime = watchParty.currentTime || 0;
            if (watchParty.isPlaying && referenceTime) {
                const elapsed = Math.max(0, (getServerNow() - referenceTime) / 1000);
                expectedTime += elapsed;
            }

            const localTime = playerRef.current.getCurrentTime?.() || 0;
            const timeDiff = Math.abs(localTime - expectedTime);
            const threshold = watchParty.isPlaying ? 1.3 : 0.35;

            if (timeDiff > threshold) {
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = expectedTime;
                lastPolledTimeRef.current = expectedTime;
                playerRef.current.seekTo?.(expectedTime, 'seconds');
                setTimeout(() => {
                    isSyncingRef.current = false;
                }, 600);
            }
        };

        syncStandardPlayer();
        const interval = setInterval(syncStandardPlayer, 1000);
        return () => clearInterval(interval);
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
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!fsEl) {
            const req = container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen;
            if (req) {
                req.call(container).then(() => {
                    if (window.screen?.orientation?.lock) {
                        window.screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch(err => {
                    console.error("Error attempting to enable fullscreen:", err);
                });
            }
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) {
                exit.call(document).then(() => {
                    if (window.screen?.orientation?.unlock) {
                        window.screen.orientation.unlock();
                    }
                }).catch(() => {});
            }
        }
    };

    const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);

    const handleRotateScreen = useCallback(async (e) => {
        if (e?.stopPropagation) e.stopPropagation();

        // 1. Native Android (Capacitor ScreenOrientationManager plugin)
        if (Capacitor.isNativePlatform() && Capacitor.Plugins?.ScreenOrientationManager) {
            try {
                await Capacitor.Plugins.ScreenOrientationManager.toggleOrientation();
                setIsLandscapeLocked(prev => !prev);
                return;
            } catch (err) {
                console.warn('Native orientation toggle error:', err);
            }
        }

        // 2. Standard Web Screen Orientation API (Mobile browsers)
        if (typeof window !== 'undefined' && window.screen?.orientation) {
            try {
                const isCurrentlyLandscape = window.screen.orientation.type?.includes('landscape') || isLandscapeLocked;
                if (isCurrentlyLandscape) {
                    if (window.screen.orientation.lock) {
                        await window.screen.orientation.lock('portrait').catch(() => {});
                    } else if (window.screen.orientation.unlock) {
                        window.screen.orientation.unlock();
                    }
                    setIsLandscapeLocked(false);
                } else {
                    if (window.screen.orientation.lock) {
                        await window.screen.orientation.lock('landscape').catch(() => {});
                    }
                    setIsLandscapeLocked(true);
                }
                return;
            } catch (err) {
                console.warn('Web screen.orientation error:', err);
            }
        }

        setIsLandscapeLocked(prev => !prev);
    }, [isLandscapeLocked]);

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

    const syncCurrentSubtitleCue = useCallback(() => {
        if (!videoRef.current) return;
        const cur = videoRef.current.currentTime || 0;

        if (activeSubtitleIdRef.current === 'off') {
            if (activeCueTextRef.current) {
                activeCueTextRef.current = '';
                setActiveCueText('');
            }
            return;
        }

        // 1. Check parsed cues first (custom uploaded or external vtt)
        if (parsedCuesRef.current && parsedCuesRef.current.length > 0) {
            const active = parsedCuesRef.current.find(c => cur >= c.start && cur <= c.end);
            const text = active ? active.text : '';
            if (text !== activeCueTextRef.current) {
                activeCueTextRef.current = text;
                setActiveCueText(text);
            }
            return;
        }

        // 2. Fallback to native textTracks activeCues (HLS or browser track)
        if (videoRef.current.textTracks && videoRef.current.textTracks.length > 0) {
            let foundText = '';
            for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                const tt = videoRef.current.textTracks[i];
                if (tt.mode === 'showing') {
                    tt.mode = 'hidden';
                }
                if (tt.mode === 'hidden' && tt.activeCues && tt.activeCues.length > 0) {
                    foundText = Array.from(tt.activeCues).map(c => c.text).join('\n');
                    break;
                }
            }
            if (foundText !== activeCueTextRef.current) {
                activeCueTextRef.current = foundText;
                setActiveCueText(foundText);
            }
        }
    }, []);

    const onTimeUpdate = () => {
        if (!videoRef.current) return;
        const cur = videoRef.current.currentTime;
        setCurrentTime(cur);
        syncCurrentSubtitleCue();
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

    // High-precision subtitle ticker: Ensures cues sync smoothly at 100ms intervals
    // even during seek, pauses, micro-rate pacing, or low-frequency browser onTimeUpdate events!
    useEffect(() => {
        const subTicker = setInterval(() => {
            syncCurrentSubtitleCue();
        }, 100);
        return () => clearInterval(subTicker);
    }, [syncCurrentSubtitleCue]);

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
        if (!rawText || typeof rawText !== 'string') return cues;

        // Remove UTF-8 BOM and normalize all line endings to Unix style
        const cleanText = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = cleanText.split('\n');

        // Comprehensive timestamp regex matching both SRT and WebVTT:
        // Matches: HH:MM:SS,mmm or HH:MM:SS.mmm or H:MM:SS,mmm or MM:SS,mmm or MM:SS.mmm
        const timeRegex = /(?:(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{2,3}))\s*-->\s*(?:(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{2,3}))/;

        const parseTimestampSeconds = (h, m, s, ms) => {
            const hours = h ? parseInt(h, 10) : 0;
            const mins = m ? parseInt(m, 10) : 0;
            const secs = s ? parseInt(s, 10) : 0;
            let millis = 0;
            if (ms) {
                const msStr = ms.length === 2 ? `${ms}0` : ms.slice(0, 3);
                millis = parseInt(msStr, 10);
            }
            return hours * 3600 + mins * 60 + secs + millis / 1000;
        };

        const parseSingleTimestamp = (ts) => {
            if (!ts) return null;
            const m = ts.trim().match(/(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{2,3})/);
            if (!m) return null;
            return parseTimestampSeconds(m[1], m[2], m[3], m[4]);
        };

        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            if (timeRegex.test(line)) {
                const parts = line.split(/\s*-->\s*/);
                if (parts.length >= 2) {
                    const start = parseSingleTimestamp(parts[0]);
                    // Strip optional WebVTT settings like "line:80% position:50%"
                    const endToken = parts[1].trim().split(/\s+/)[0];
                    const end = parseSingleTimestamp(endToken);

                    i++;
                    const textLines = [];
                    while (i < lines.length) {
                        const nextLine = lines[i];
                        const trimmedNext = nextLine.trim();
                        if (trimmedNext === '' || timeRegex.test(trimmedNext)) {
                            if (trimmedNext === '') i++;
                            break;
                        }
                        // Skip isolated numeric SRT index lines before the next cue
                        if (/^\d+$/.test(trimmedNext) && i + 1 < lines.length && timeRegex.test(lines[i + 1])) {
                            break;
                        }
                        textLines.push(nextLine);
                        i++;
                    }

                    const rawContentText = textLines.join('\n').replace(/<\/?[^>]+(>|$)/g, '').trim();
                    if (rawContentText && start !== null && end !== null && end > start) {
                        cues.push({ start, end, text: rawContentText });
                    }
                    continue;
                }
            }
            i++;
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
                    const rawSubUrl = sub.playableUrl || sub.file || '';
                    const targetUrl = (rawSubUrl.startsWith('http') || rawSubUrl.startsWith('/') || rawSubUrl.startsWith('api/'))
                        ? getProxiedUrl(rawSubUrl)
                        : rawSubUrl;
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

    // ─── Otomatik Oda Altyazı Eşitlemesi (Tüm Odada Altyazıyı Senkronize Eder) ───
    useEffect(() => {
        if (!watchParty?.activeSubtitle) return;
        const incomingSub = watchParty.activeSubtitle;

        // Bireysel kapatma kuralı: Odaya gelen 'off' sinyalleri kullanıcıların altyazısını asla kapatamaz!
        if (incomingSub.type === 'off') {
            return;
        }

        if (!incomingSub.rawContent) return;

        let existingIdx = customSubtitlesRef.current.findIndex(
            s => s.label === incomingSub.label && (s.rawContent === incomingSub.rawContent || (!s.rawContent && s.file === incomingSub.file))
        );

        if (existingIdx === -1) {
            const blob = new Blob([incomingSub.rawContent], { type: 'text/vtt;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const addedSub = {
                type: 'custom',
                ...incomingSub,
                file: blobUrl,
                playableUrl: blobUrl,
                isBlob: true
            };
            existingIdx = customSubtitlesRef.current.length;
            const updatedList = [...customSubtitlesRef.current, addedSub];
            customSubtitlesRef.current = updatedList;
            setCustomSubtitles(updatedList);
        } else {
            customSubtitlesRef.current[existingIdx] = {
                ...customSubtitlesRef.current[existingIdx],
                ...incomingSub
            };
        }

        // Bireysel tercih: Kullanıcı kendisi için 'Kapalı' seçtiyse, altyazı listeye eklenir ama ekranda zorla açılmaz
        if (userDisabledSubtitlesRef.current) {
            console.log('[WatchPartyPlayer] Oda altyazısı listeye eklendi, ancak kullanıcı altyazıyı kapalı tuttuğu için ekranda açılmadı.');
            return;
        }

        parsedCuesRef.current = parseSubtitleCues(incomingSub.rawContent);
        activeSubtitleIdRef.current = `custom-${existingIdx}`;
        setActiveSubtitleId(`custom-${existingIdx}`);

        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.subtitleTrack = -1;
        }
        if (videoRef.current && videoRef.current.textTracks) {
            for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                videoRef.current.textTracks[i].mode = 'disabled';
            }
        }

        // Anlık geçerli cue'yu ekrana yansıt
        syncCurrentSubtitleCue();
        setTimeout(syncCurrentSubtitleCue, 50);
        setTimeout(syncCurrentSubtitleCue, 150);

        if (watchParty.lastSubActionName) {
            setSubSyncNotice(`${watchParty.lastSubActionName} yeni altyazı paylaştı: ${incomingSub.label}`);
            setTimeout(() => setSubSyncNotice(null), 4000);
        }
    }, [watchParty?.activeSubtitle, syncCurrentSubtitleCue]);

    // Paylaşılan tüm oda altyazılarını listeye ekle
    useEffect(() => {
        if (!Array.isArray(watchParty?.sharedSubtitles) || watchParty.sharedSubtitles.length === 0) return;
        const currentList = [...customSubtitlesRef.current];
        let hasNew = false;
        watchParty.sharedSubtitles.forEach(sharedSub => {
            if (!sharedSub.rawContent) return;
            const exists = currentList.some(s => s.label === sharedSub.label && s.rawContent === sharedSub.rawContent);
            if (!exists) {
                const blob = new Blob([sharedSub.rawContent], { type: 'text/vtt;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                currentList.push({
                    ...sharedSub,
                    file: blobUrl,
                    playableUrl: blobUrl,
                    isBlob: true
                });
                hasNew = true;
            }
        });
        if (hasNew) {
            customSubtitlesRef.current = currentList;
            setCustomSubtitles(currentList);
        }
    }, [watchParty?.sharedSubtitles]);

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

            // Clean UTF-8 BOM and normalize line endings
            content = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            if (file.name.toLowerCase().endsWith('.srt')) {
                // Universal SRT to WebVTT timestamp converter (handles 1 or 2-digit hour, comma to dot)
                const converted = content.replace(/(^|\n)(\d+)\n((?:(?:\d{1,3}:)?\d{1,2}:\d{2})[,.]\d{2,3}\s*-->\s*(?:(?:\d{1,3}:)?\d{1,2}:\d{2})[,.]\d{2,3})/g, '$1$3');
                content = 'WEBVTT\n\n' + converted.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{2,3})/g, '$1.$2');
            }
            const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const newIndex = customSubtitlesRef.current.length;
            const newSub = {
                type: 'custom',
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

            // Yükleyen kullanıcı için anında aç ve tercihi aktif yap
            userDisabledSubtitlesRef.current = false;
            parsedCuesRef.current = parseSubtitleCues(content);
            activeSubtitleIdRef.current = `custom-${newIndex}`;
            setActiveSubtitleId(`custom-${newIndex}`);
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            syncCurrentSubtitleCue();
            setTimeout(syncCurrentSubtitleCue, 50);

            // ODA EŞİTLEMESİ: Herhangi bir kullanıcı yüklediğinde tüm odada yeni dosyayı paylaş
            if (sendWatchSubtitle) {
                sendWatchSubtitle(newSub);
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
            userDisabledSubtitlesRef.current = true;
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            parsedCuesRef.current = [];
            activeCueTextRef.current = '';
            setActiveCueText('');
            activeSubtitleIdRef.current = 'off';
            setActiveSubtitleId('off');
            // Bireysel kapatma: Kesinlikle odaya kapatma sinyali gönderme!
        } else if (option.type === 'hls') {
            userDisabledSubtitlesRef.current = false;
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = option.id;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = (i === option.id) ? 'hidden' : 'disabled';
                }
            }
            activeSubtitleIdRef.current = `hls-${option.id}`;
            setActiveSubtitleId(`hls-${option.id}`);
            setTimeout(syncCurrentSubtitleCue, 100);
        } else if (option.type === 'ext') {
            userDisabledSubtitlesRef.current = false;
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            activeSubtitleIdRef.current = `ext-${option.index}`;
            setActiveSubtitleId(`ext-${option.index}`);
            setTimeout(syncCurrentSubtitleCue, 100);
        } else if (option.type === 'custom') {
            userDisabledSubtitlesRef.current = false;
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.subtitleTrack = -1;
            }
            if (videoRef.current && videoRef.current.textTracks) {
                for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                    videoRef.current.textTracks[i].mode = 'disabled';
                }
            }
            activeSubtitleIdRef.current = `custom-${option.index}`;
            setActiveSubtitleId(`custom-${option.index}`);
            setTimeout(syncCurrentSubtitleCue, 100);
        }
        setIsSubMenuOpen(false);
    };

    const handleTogglePlayPause = (e) => {
        if (e) e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        
        isUserActionCooldownRef.current = Date.now() + 500;
        const exactTime = Number((video.currentTime || 0).toFixed(4));
        
        if (watchParty?.isPlaying) {
            video.pause();
            video.playbackRate = 1.0;
            lastProgrammaticSeekTimeRef.current = exactTime;
            setCurrentTime(exactTime);
            setIsNativePlaying(false);
            sendWatchPause(exactTime);
        } else {
            video.playbackRate = 1.0;
            lastProgrammaticSeekTimeRef.current = exactTime;
            setCurrentTime(exactTime);
            setIsNativePlaying(true);
            safePlay(video);
            sendWatchPlay(exactTime);
        }
    };

    const handleNativeScrub = (e) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            const exactTime = Number(val.toFixed(4));
            isSyncingRef.current = true;
            isUserActionCooldownRef.current = Date.now() + 800;
            lastProgrammaticSeekTimeRef.current = exactTime;
            if (videoRef.current) {
                videoRef.current.currentTime = exactTime;
            }
            setCurrentTime(exactTime);
            sendWatchSeek(exactTime);
            setTimeout(() => { isSyncingRef.current = false; }, 250);
        }
    };

    const handleSeekOffset = (offset) => {
        const video = videoRef.current;
        if (!video || !duration) return;

        const baseTime = targetSeekTimeRef.current !== null ? targetSeekTimeRef.current : (video.currentTime || 0);
        const target = Math.max(0, Math.min(duration, baseTime + offset));
        targetSeekTimeRef.current = target;

        isSyncingRef.current = true;
        isUserActionCooldownRef.current = Date.now() + 2500;
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
        isUserActionCooldownRef.current = Date.now() + 2500;
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
                if (needsUnmutePrompt || needsInteractionPrompt) {
                    handleUserUnmuteAction();
                }
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

    // ─── ZERO-LATENCY IMPERATIVE SYNC ENGINE (0ms Pause / Play / Seek Execution) ───
    // Executes in the exact microsecond a P2P WebRTC DataChannel or Socket.IO command arrives,
    // bypassing React's render scheduling delay completely.
    useEffect(() => {
        const localUid = String(user?._id || user?.id || '');
        const handleImperativeSync = (evt) => {
            const detail = evt?.detail;
            if (!detail || !detail.type) return;
            const isFromSelf = detail.senderId && localUid && String(detail.senderId) === localUid;
            if (isFromSelf) return;

            // Give the hardware decoder 900ms of protection from background alignNativeVideo interval re-seeks
            isUserActionCooldownRef.current = Date.now() + 900;

            const video = videoRef.current;
            const stdPlayer = playerRef.current;
            const baseTime = Number(Number(detail.time || 0).toFixed(4));
            const refTs = typeof detail.serverTimestamp === 'number' && detail.serverTimestamp > 0
                ? detail.serverTimestamp
                : getServerNow();

            if (detail.type === 'watch-pause') {
                if (video && isNativeVOD) {
                    isSyncingRef.current = true;
                    video.pause();
                    video.playbackRate = 1.0;
                    setIsNativePlaying(false);
                    lastProgrammaticSeekTimeRef.current = baseTime;
                    if (Math.abs((video.currentTime || 0) - baseTime) > 0.03) {
                        video.currentTime = baseTime;
                    }
                    setCurrentTime(baseTime);
                    setTimeout(() => {
                        isSyncingRef.current = false;
                    }, 150);
                } else if (stdPlayer && !isStream) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = baseTime;
                    stdPlayer.seekTo?.(baseTime, 'seconds');
                    setTimeout(() => { isSyncingRef.current = false; }, 250);
                }
            } else if (detail.type === 'watch-play') {
                const transitSec = Math.max(0, Math.min(2.0, (getServerNow() - refTs) / 1000));
                const liveTarget = Number((baseTime + transitSec).toFixed(4));
                if (video && isNativeVOD) {
                    isSyncingRef.current = true;
                    video.playbackRate = 1.0;
                    setIsNativePlaying(true);
                    if (hlsInstanceRef.current && typeof hlsInstanceRef.current.startLoad === 'function') {
                        try { hlsInstanceRef.current.startLoad(); } catch (_) {}
                    }
                    const currentDiff = Math.abs((video.currentTime || 0) - liveTarget);
                    // Only seek before play() if drift > 0.35s; otherwise start playback directly from existing MSE buffer
                    // (identical to local play button) so Android MediaCodec never flushes or freezes on resume!
                    if (currentDiff > 0.35) {
                        lastProgrammaticSeekTimeRef.current = liveTarget;
                        video.currentTime = liveTarget;
                        setCurrentTime(liveTarget);
                        let playTriggered = false;
                        const triggerPlayAfterSeek = () => {
                            if (playTriggered) return;
                            playTriggered = true;
                            video.removeEventListener('seeked', triggerPlayAfterSeek);
                            safePlay(video);
                            isSyncingRef.current = false;
                        };
                        video.addEventListener('seeked', triggerPlayAfterSeek, { once: true });
                        setTimeout(triggerPlayAfterSeek, 160);
                    } else {
                        safePlay(video);
                        setTimeout(() => {
                            isSyncingRef.current = false;
                        }, 150);
                    }
                } else if (stdPlayer && !isStream) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = liveTarget;
                    stdPlayer.seekTo?.(liveTarget, 'seconds');
                    setTimeout(() => { isSyncingRef.current = false; }, 250);
                }
            } else if (detail.type === 'watch-seek') {
                const transitSec = watchParty?.isPlaying
                    ? Math.max(0, Math.min(2.0, (getServerNow() - refTs) / 1000))
                    : 0;
                const liveTarget = Number((baseTime + transitSec).toFixed(4));
                if (video && isNativeVOD) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = liveTarget;
                    video.currentTime = liveTarget;
                    setCurrentTime(liveTarget);
                    setTimeout(() => { isSyncingRef.current = false; }, 250);
                } else if (stdPlayer && !isStream) {
                    isSyncingRef.current = true;
                    lastProgrammaticSeekTimeRef.current = liveTarget;
                    stdPlayer.seekTo?.(liveTarget, 'seconds');
                    setTimeout(() => { isSyncingRef.current = false; }, 250);
                }
            }
        };

        window.addEventListener('watchparty:imperative-sync', handleImperativeSync);
        return () => {
            window.removeEventListener('watchparty:imperative-sync', handleImperativeSync);
        };
    }, [user, isNativeVOD, isStream, watchParty?.isPlaying, getServerNow]);

    // Native Video Synchronization Engine (Master Clock Smart Pacer + Lost Loading Time Compensator)
    useEffect(() => {
        const video = videoRef.current;
        if (!watchParty || !video || !isReady || hasError || !isNativeVOD) return;

        let syncInterval = null;
        let masterSyncRequestInterval = null;
        let playTransitionGuardActive = false;
        let playTransitionGuardTimer = null;
        let isBufferingStall = false;
        let lastHardSeekAt = 0;
        let lastPausedLockedTarget = null;

        const computeTargetTime = () => {
            const serverNow = getServerNow();
            const reference = watchParty.serverTimestamp || watchParty.lastUpdated || serverNow;
            const elapsed = watchParty.isPlaying ? Math.max(0, (serverNow - reference) / 1000) : 0;
            return (typeof watchParty.currentTime === 'number' ? watchParty.currentTime : 0) + elapsed;
        };

        const onWaiting = () => {
            isBufferingStall = true;
        };

        // Immediately compensate for lost loading/buffering time the instant playback resumes!
        const onBufferingRecovered = () => {
            const wasStalled = isBufferingStall;
            isBufferingStall = false;
            if (!video || !watchParty || !watchParty.isPlaying) return;
            if (Date.now() < isUserActionCooldownRef.current) return;

            const targetTime = computeTargetTime();
            const drift = targetTime - (video.currentTime || 0);
            if (Math.abs(drift) > 0.08 && !video.seeking && (wasStalled || playTransitionGuardActive)) {
                playTransitionGuardActive = false;
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = targetTime;
                lastHardSeekAt = Date.now();
                video.currentTime = targetTime;
                setCurrentTime(targetTime);
                video.playbackRate = 1.0;
                setTimeout(() => { isSyncingRef.current = false; }, 200);
            }
        };

        video.addEventListener('waiting', onWaiting);
        video.addEventListener('stalled', onWaiting);
        video.addEventListener('playing', onBufferingRecovered);
        video.addEventListener('canplay', onBufferingRecovered);

        const alignNativeVideo = () => {
            if (!video || !watchParty) return;

            // 1. If user recently interacted with Play/Pause button or scrubbed/seeked, respect their action
            if (Date.now() < isUserActionCooldownRef.current) return;

            const targetTime = Number(computeTargetTime().toFixed(4));
            const localTime = video.currentTime || 0;
            const drift = targetTime - localTime;
            const absDrift = Math.abs(drift);

            // 2. Play / Pause State Synchronization (Instant, never blocked by buffering check)
            if (!watchParty.isPlaying && !video.paused) {
                isSyncingRef.current = true;
                playTransitionGuardActive = false;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                video.pause();
                video.playbackRate = 1.0;
                setIsNativePlaying(false);
                lastPausedLockedTarget = targetTime;
                lastProgrammaticSeekTimeRef.current = targetTime;
                if (absDrift > 0.03) {
                    video.currentTime = targetTime;
                }
                setCurrentTime(targetTime);
                setTimeout(() => { isSyncingRef.current = false; }, 200);
                return;
            } else if (watchParty.isPlaying && video.paused) {
                isSyncingRef.current = true;
                lastPausedLockedTarget = null;
                playTransitionGuardActive = true;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                playTransitionGuardTimer = setTimeout(() => {
                    playTransitionGuardActive = false;
                }, 400);
                if (absDrift > 0.35 && !video.seeking) {
                    lastProgrammaticSeekTimeRef.current = targetTime;
                    video.currentTime = targetTime;
                    setCurrentTime(targetTime);
                }
                setIsNativePlaying(true);
                safePlay(video);
                setTimeout(() => { isSyncingRef.current = false; }, 200);
                return;
            }

            // 3. When Paused: Single-shot Lock (prevents 4Hz frame-PTS quantization seek loops on Android MediaCodec)
            if (!watchParty.isPlaying) {
                if (video.playbackRate !== 1.0) video.playbackRate = 1.0;
                if (absDrift > 0.08 && !video.seeking && Math.abs((lastPausedLockedTarget ?? -999) - targetTime) > 0.01) {
                    isSyncingRef.current = true;
                    lastPausedLockedTarget = targetTime;
                    lastProgrammaticSeekTimeRef.current = targetTime;
                    video.currentTime = targetTime;
                    setCurrentTime(targetTime);
                    setTimeout(() => { isSyncingRef.current = false; }, 150);
                }
                return;
            }

            // 4. If video is currently seeking or waiting for network buffer during playback, wait for recovery
            if (video.seeking || (video.readyState < 2 && isBufferingStall)) return;

            // 5. When Playing: Zero-Drift Lockstep Sync (Hard seek > 0.85s, fast proportional micro-rate pacing for 0.02s..0.85s)
            const hardSeekThreshold = 0.85;
            const canHardSeek = (Date.now() - lastHardSeekAt > 1000) && !playTransitionGuardActive && !video.seeking && video.readyState >= 2;

            if (absDrift > hardSeekThreshold && canHardSeek) {
                isSyncingRef.current = true;
                lastProgrammaticSeekTimeRef.current = targetTime;
                lastHardSeekAt = Date.now();
                video.currentTime = targetTime;
                setCurrentTime(targetTime);
                video.playbackRate = 1.0;
                playTransitionGuardActive = true;
                if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
                playTransitionGuardTimer = setTimeout(() => {
                    playTransitionGuardActive = false;
                }, 500);
                setTimeout(() => { isSyncingRef.current = false; }, 200);
            } else if (!playTransitionGuardActive) {
                if (absDrift > 0.02) {
                    // Fast proportional micro-rate pacing (0.91x .. 1.09x) converges drift to < 20ms
                    const rateDelta = Math.max(-0.09, Math.min(0.09, drift * 0.12));
                    const nextRate = Number((1.0 + rateDelta).toFixed(3));
                    if (Math.abs((video.playbackRate || 1.0) - nextRate) >= 0.004) {
                        video.playbackRate = nextRate;
                    }
                } else if (video.playbackRate !== 1.0) {
                    video.playbackRate = 1.0;
                }
            }
        };

        alignNativeVideo();

        syncInterval = setInterval(alignNativeVideo, 250);

        if (watchParty.isPlaying && requestWatchSync) {
            masterSyncRequestInterval = setInterval(() => {
                if (!video.seeking && Date.now() >= isUserActionCooldownRef.current) {
                    requestWatchSync();
                }
            }, 4000);
        }

        return () => {
            if (syncInterval) clearInterval(syncInterval);
            if (masterSyncRequestInterval) clearInterval(masterSyncRequestInterval);
            if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('stalled', onWaiting);
            video.removeEventListener('playing', onBufferingRecovered);
            video.removeEventListener('canplay', onBufferingRecovered);
            if (video) video.playbackRate = 1.0;
        };
    }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.serverTimestamp, watchParty?.lastUpdated, isReady, hasError, isNativeVOD, getServerNow, requestWatchSync]);

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
        <div className={`watch-party-player-wrapper ${isFullscreen ? 'is-fullscreen' : ''}`} ref={containerRef}>
            {!isFullscreen && (
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
                                    setIsUnifiedMenuOpen(prev => {
                                        const next = !prev;
                                        if (next) setTimeout(updatePopoverPos, 0);
                                        return next;
                                    });
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
                        </div>
                    )}

                    {/* Minimalist Floating Track & Subtitle Popover (Rendered via React Portal outside video overflow bounds) */}
                    {isNativeVOD && isUnifiedMenuOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
                        <>
                            <div 
                                className="native-unified-popover-backdrop" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsUnifiedMenuOpen(false);
                                }} 
                            />
                            <div 
                                ref={popoverContentRef}
                                className={`native-unified-dropdown-popover ${popoverPos.isMobile ? 'is-mobile-sheet' : ''}`} 
                                style={!popoverPos.isMobile && popoverPos.top !== undefined ? {
                                    top: `${popoverPos.top}px`,
                                    right: `${popoverPos.right}px`
                                } : undefined}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="native-unified-popover-header">
                                    <div className="native-unified-tabs">
                                        {audioTracks.length > 0 && (
                                            <button
                                                type="button"
                                                className={`native-unified-tab-btn ${unifiedTab === 'audio' ? 'active' : ''}`}
                                                onClick={() => setUnifiedTab('audio')}
                                            >
                                                <Headphones size={12} />
                                                <span>Ses</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={`native-unified-tab-btn ${unifiedTab === 'subs' ? 'active' : ''}`}
                                            onClick={() => setUnifiedTab('subs')}
                                        >
                                            <Languages size={12} />
                                            <span>Altyazı</span>
                                        </button>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="native-unified-popover-close-btn"
                                        onClick={() => setIsUnifiedMenuOpen(false)}
                                        aria-label="Kapat"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>

                                <div className="native-unified-popover-body custom-scrollbar">
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

                                    {unifiedTab === 'subs' && (
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
                        </>,
                        document.fullscreenElement || document.body
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
            )}
            <div 
                ref={containerRef}
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
                    x5-playsinline="true"
                    x5-video-player-type="h5"
                    preload="auto"
                    autoPlay={false}
                    crossOrigin="anonymous"
                    muted={localMuted}
                    onLoadedMetadata={updateFilmBounds}
                    onResize={updateFilmBounds}
                    onTimeUpdate={onTimeUpdate}
                    onDurationChange={onDurationChange}
                    onPlaying={onPlaying}
                    onPause={onPaused}
                />

                {/* Mobile Autoplay & Unmute Quick Prompts */}
                {needsUnmutePrompt && (
                    <div 
                        className="watch-party-unmute-badge"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUserUnmuteAction();
                        }}
                    >
                        <Volume2 size={16} className="unmute-badge-icon" />
                        <span>Sesi Açmak İçin Dokunun</span>
                    </div>
                )}

                {needsInteractionPrompt && (
                    <div 
                        className="watch-party-play-trigger-overlay"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUserUnmuteAction();
                        }}
                    >
                        <button type="button" className="watch-party-play-trigger-btn">
                            <Play size={24} fill="currentColor" />
                            <span>Yayını Başlat</span>
                        </button>
                    </div>
                )}

                {/* Oda İçi Altyazı Eşitleme Bildirim Rozeti */}
                {subSyncNotice && (
                    <div className="watch-party-sub-sync-toast">
                        <span>💬 {subSyncNotice}</span>
                    </div>
                )}

                {/* Netflix-Grade Pro Subtitle Overlay (Film Görüntüsüne Göre Kusursuz Konumlandırma) */}
                {activeCueText && (
                    <div 
                        className={`watch-party-subtitle-overlay ${isDraggingSub ? 'is-dragging' : ''}`}
                        style={{
                            bottom: filmBounds.filmHeight > 0 
                                ? `${filmBounds.bottomOffset + Math.round(filmBounds.filmHeight * (subBottomPercent / 100))}px`
                                : `${subBottomPercent}%`,
                            maxWidth: filmBounds.filmWidth > 0 ? `${Math.min(filmBounds.filmWidth * 0.94, 860)}px` : '90%'
                        }}
                        onMouseDown={handleSubDragStart}
                        onTouchStart={handleSubDragStart}
                        title="Altyazıyı yukarı/aşağı sürükleyebilirsiniz"
                    >
                        <div className="watch-party-subtitle-box">
                            {isDraggingSub && (
                                <div className="watch-party-sub-drag-indicator">
                                    <span>↕ %{subBottomPercent}</span>
                                </div>
                            )}
                            {activeCueText.split('\n').map((line, i) => (
                                <span 
                                    key={i} 
                                    className="watch-party-sub-line"
                                    style={{
                                        fontSize: `calc(clamp(13px, 2.4cqw, 22px) * ${subSizeScale})`,
                                        color: subColor,
                                        textShadow: getShadowStyle(subShadow),
                                        backgroundColor: getBgStyle(subBg),
                                        fontFamily: getFontFamily(subFont),
                                        padding: subBg !== 'none' ? '3px 10px' : '0',
                                        borderRadius: '0px',
                                        backdropFilter: subBg === 'blur' ? 'blur(6px)' : 'none',
                                        WebkitBackdropFilter: subBg === 'blur' ? 'blur(6px)' : 'none',
                                        lineHeight: 1.35
                                    }}
                                >
                                    {line}
                                </span>
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
                                        {isFullscreen && (
                                            <button 
                                                type="button"
                                                className="native-rotate-btn" 
                                                onClick={handleRotateScreen} 
                                                title="Ekranı Döndür" 
                                                aria-label="Ekranı Döndür"
                                            >
                                                <RotateCw size={18} />
                                            </button>
                                        )}
                                        <button 
                                            className="native-fullscreen-btn" 
                                            onClick={toggleFullscreen}
                                            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
                                            aria-label="Tam Ekran Yap / Çık"
                                        >
                                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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
                                    {isFullscreen && (
                                        <button 
                                            type="button"
                                            className="watch-party-fullscreen-btn-modern" 
                                            onClick={handleRotateScreen} 
                                            title="Ekranı Döndür" 
                                            aria-label="Ekranı Döndür"
                                        >
                                            <RotateCw size={18} />
                                        </button>
                                    )}
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
                                        title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
                                    >
                                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
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
                        {(() => {
                            const effectiveRule = consensusRule || activeRoom?.consensusRule || 'all';
                            const activeCount = (participants || []).filter(p => !p.identity?.endsWith('-screen')).length;
                            const isDirectClose = activeCount <= 1 || effectiveRule === '1';

                            let ruleHint = 'Odadaki diğer kullanıcıların izlemesini kesintiye uğratmamak için odadaki tüm kullanıcıların onayı gereklidir.';
                            if (effectiveRule === 'majority') {
                                ruleHint = 'Odadaki diğer kullanıcıların izlemesini kesintiye uğratmamak için kullanıcıların çoğunluğunun onayı gereklidir.';
                            } else if (effectiveRule === '2') {
                                ruleHint = 'Odadaki diğer kullanıcıların izlemesini kesintiye uğratmamak için en az 2 kullanıcının onayı gereklidir.';
                            } else if (effectiveRule === '3' || effectiveRule === '4') {
                                ruleHint = `Odadaki diğer kullanıcıların izlemesini kesintiye uğratmamak için en az ${effectiveRule} kullanıcının onayı gereklidir.`;
                            }

                            return (
                                <>
                                    <div className="watch-party-consensus-body">
                                        {isDirectClose ? (
                                            <p>Birlikte izlemeyi sonlandırmak istediğinize emin misiniz?</p>
                                        ) : (
                                            <p>
                                                Birlikte izlemeyi sonlandırmak istiyor musunuz?
                                                <br />
                                                <span className="watch-party-consensus-hint">
                                                    {ruleHint}
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
                                            {isDirectClose ? 'Evet, Bitir' : 'Onay İsteği Başlat'}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Minimum Konsensüs Oylama Modalı */}
            {watchStopVoteStatus && (() => {
                const currentUserId = user?._id?.toString() || user?.id?.toString();
                const currentSocketId = socket?.id;
                const votersList = Array.isArray(watchStopVoteStatus.voters) ? watchStopVoteStatus.voters.map(v => String(v).trim()) : [];
                const reqId = watchStopVoteStatus.requesterId ? String(watchStopVoteStatus.requesterId).trim() : null;

                const isRequester = !!(
                    (reqId && (reqId === currentUserId || (currentSocketId && reqId === currentSocketId))) ||
                    (watchStopVoteStatus.requesterName && (
                        watchStopVoteStatus.requesterName === user?.profile?.displayName || 
                        watchStopVoteStatus.requesterName === user?.username
                    ))
                );

                const hasCurrentVoted = !!(
                    isApprovingStop || 
                    isRequester || 
                    votersList.some(v => v === currentUserId || (currentSocketId && v === currentSocketId))
                );

                const currentApprovals = Math.max(votersList.length, reqId ? 1 : 0);
                const requiredApprovals = Math.max(watchStopVoteStatus.required || 1, 1);
                const isConsensusReached = currentApprovals >= requiredApprovals || isApprovingStop;

                const handleVoteClick = () => {
                    setIsApprovingStop(true);
                    sendWatchStopVote();
                };

                const handleCancelClick = () => {
                    setIsApprovingStop(false);
                    sendWatchStopCancel();
                };

                return (
                    <div className="watch-party-consensus-backdrop">
                        <div className="watch-party-consensus-card" onClick={(e) => e.stopPropagation()}>
                            <div className="watch-party-consensus-header">
                                <div className="watch-party-consensus-title-wrap">
                                    <Film size={18} className="watch-party-consensus-info-icon" />
                                    <h4>Birlikte İzleme Kapatma Onayı</h4>
                                </div>
                                <span className="watch-party-consensus-badge">
                                    {Math.min(requiredApprovals, isApprovingStop ? Math.max(currentApprovals, requiredApprovals) : currentApprovals)} / {requiredApprovals} Onay
                                </span>
                            </div>
                            <div className="watch-party-consensus-body">
                                {isRequester ? (
                                    <p>
                                        Kapatma onayınız alındı ({currentApprovals}/{requiredApprovals}).
                                        <br />
                                        <span className="watch-party-consensus-hint">
                                            {requiredApprovals > currentApprovals 
                                                ? `Birlikte izlemenin sonlandırılması için odadan ${requiredApprovals - currentApprovals} kullanıcının daha onayı bekleniyor...`
                                                : 'Kapatma işlemi tamamlanıyor, birlikte izleme sonlandırılıyor...'}
                                        </span>
                                    </p>
                                ) : isApprovingStop || (hasCurrentVoted && isConsensusReached) ? (
                                    <p>
                                        Kapatma onayınız başarıyla iletildi.
                                        <br />
                                        <span className="watch-party-consensus-hint">
                                            Konsensüs sağlandı, birlikte izleme tüm kullanıcılar için kapatılıyor...
                                        </span>
                                    </p>
                                ) : hasCurrentVoted ? (
                                    <p>
                                        Kapatma onayınız alındı ({currentApprovals}/{requiredApprovals}).
                                        <br />
                                        <span className="watch-party-consensus-hint">
                                            Odadaki diğer kullanıcıların onayı bekleniyor...
                                        </span>
                                    </p>
                                ) : (
                                    <p>
                                        <strong>{watchStopVoteStatus.requesterName || 'Bir kullanıcı'}</strong> birlikte izlemeyi sonlandırmak istiyor.
                                        <br />
                                        <span className="watch-party-consensus-hint">
                                            Kapatma işleminin gerçekleşmesi için sizin onayınız gerekiyor ({currentApprovals}/{requiredApprovals} onay mevcut).
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div className="watch-party-consensus-actions">
                                {isRequester ? (
                                    <button 
                                        type="button" 
                                        className="glass-btn secondary" 
                                        onClick={handleCancelClick}
                                    >
                                        İsteği İptal Et
                                    </button>
                                ) : hasCurrentVoted ? (
                                    <button
                                        type="button"
                                        className="glass-btn secondary"
                                        onClick={handleCancelClick}
                                        disabled={isApprovingStop}
                                    >
                                        {isApprovingStop ? 'Sonlandırılıyor...' : 'İsteği İptal Et'}
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            type="button" 
                                            className="glass-btn secondary" 
                                            onClick={handleCancelClick}
                                            disabled={isApprovingStop}
                                        >
                                            İzlemeye Devam Et (Reddet)
                                        </button>
                                        <button 
                                            type="button" 
                                            className="glass-btn danger-confirm" 
                                            onClick={handleVoteClick}
                                            disabled={isApprovingStop}
                                        >
                                            {isApprovingStop ? 'Kapatılıyor...' : `Kapatmayı Onayla (${Math.min(requiredApprovals, currentApprovals + 1)}/${requiredApprovals})`}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
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

        const isElementVisible = (el) => {
            if (!el) return false;
            // Check if element or any ancestor is hidden by mobile class or display: none
            if (el.closest('.mobile-content-hidden') || el.closest('.mobile-hidden')) {
                return false;
            }
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return false;
            }
            if (el.offsetParent === null && style.position !== 'fixed') {
                return false;
            }
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) {
                return false;
            }
            return true;
        };

        const updateCoords = () => {
            const placeholder = document.getElementById('watch-party-portal-placeholder') || document.getElementById('watch-party-portal-target');
            if (placeholder && isElementVisible(placeholder)) {
                const rect = placeholder.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setCoords({
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        visible: true
                    });
                    return;
                }
            }
            setCoords({ visible: false });
        };

        updateCoords();

        // Observe DOM mutations to catch target container mounts/unmounts instantly
        const observer = new MutationObserver(updateCoords);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        
        const interval = setInterval(updateCoords, 400);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
            clearInterval(interval);
        };
    }, [watchParty?.url]);

    if (!watchParty || !watchParty.url) return null;

    const isVisible = coords?.visible;
    const isCarouselDocked = isVisible && coords.height <= 220;

    const style = isVisible ? {
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        height: `${coords.height}px`,
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        zIndex: 1,
        overflow: 'hidden',
        borderRadius: isCarouselDocked ? '12px' : '16px',
        pointerEvents: 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    } : {
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden',
        zIndex: -1,
        transition: 'none'
    };

    return (
        <div className={isCarouselDocked ? 'is-carousel-docked' : ''} style={style}>
            <WatchPartyPlayer />
        </div>
    );
};

export default WatchPartyPlayer;
