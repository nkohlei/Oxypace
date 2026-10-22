import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Check, Maximize, Play, Pause, RotateCcw, RotateCw, Film } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { useGlobalStore } from '../store/useGlobalStore';
import { getImageUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import { adsConfig } from '../config/ads';
import './VideoPlayer.css';

const mountedVideos = new Set();
let scrollTimeout = null;
const isElectron = typeof window !== 'undefined' && (
  !!window.desktopAPI?.isElectron || 
  (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') !== -1) ||
  !!window.process?.versions?.electron ||
  !!window.ipcRenderer
);


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

const isHls = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.m3u8') || lowerUrl.includes('/hls/') || lowerUrl.includes('/proxy-hls') || lowerUrl.includes('.txt') || lowerUrl.includes('manifest');
};

const findWorkingReferer = async (targetUrl) => {
  let origin = '';
  try {
    origin = new URL(targetUrl).origin;
  } catch(e) {}
  
  const tlds = ['cx', 'life', 'cool', 'live', 'com.tr', 'de', 'be', 'vip', 'website', 'lol', 'cc', 'pro', 'pw', 'today', 'org', 'net', 'co', 'biz', 'info', 'us', 'me', 'tv', 'ws', 'xyz', 'online', 'site', 'store', 'tech', 'link', 'click', 'space', 'club', 'best', 'top', 'icu', 'win', 'bid', 'gdn', 'trade', 'loan', 'download', 'stream', 'date', 'party'];
  const refererList = [];
  tlds.forEach(tld => {
      refererList.push(`https://www.hdfilmcehennemi.${tld}/`);
      refererList.push(`https://hdfilmcehennemi.${tld}/`);
  });

  refererList.push(
      'https://www.filmmodu.org/',
      'https://filmmodu.org/',
      'https://www.filmmodu.dev/',
      'https://fullhdfilmizlesene.pw/',
      'https://www.fullhdfilmizlesene.pw/',
      'https://fullhdfilmizlesene.com/',
      'https://www.fullhdfilmizlesene.com/',
      origin + '/',
      ''
  );

  for (const ref of refererList) {
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'X-Target-Referer': ref
        }
      });
      if (response.status === 200) {
        const text = await response.text();
        if (text.includes('#EXTM3U') || text.includes('master') || text.includes('playlist')) {
          console.log("🎉 Client found working Referer:", ref);
          return ref;
        }
      }
    } catch (err) {
      // Continue
    }
  }
  return '';
};


const pauseAllOtherVideos = (currentEl) => {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video').forEach((v) => {
    if (v !== currentEl && !v.paused) {
      // Don't pause a sibling video within the SAME player container during quality swaps
      const myContainer = currentEl?.closest?.('.native-player-container');
      const otherContainer = v?.closest?.('.native-player-container');
      if (myContainer && otherContainer && myContainer === otherContainer) {
        return;
      }
      v.dataset.userPaused = 'true';
      try {
        v.pause();
      } catch (e) {}
    }
  });
};

const isElementVisibleOnScreen = (el, minVisibleRatio = 0.35) => {
  if (!el || typeof window === 'undefined') return false;
  if (!el.isConnected) return false;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  const isFs = !!document.fullscreenElement;
  const TOP_NAVBAR_OFFSET = isFs ? 0 : 50;
  let clipTop = TOP_NAVBAR_OFFSET;
  let clipBottom = window.innerHeight || document.documentElement.clientHeight;
  let clipLeft = 0;
  let clipRight = window.innerWidth || document.documentElement.clientWidth;

  // Intersect with every scrollable / clipping ancestor container
  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const pStyle = window.getComputedStyle(parent);
    const overflowY = pStyle.overflowY;
    const overflowX = pStyle.overflowX;
    const isScrollableOrClipped = 
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden' ||
      overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden';

    if (isScrollableOrClipped) {
      const pRect = parent.getBoundingClientRect();
      clipTop = Math.max(clipTop, pRect.top);
      clipBottom = Math.min(clipBottom, pRect.bottom);
      clipLeft = Math.max(clipLeft, pRect.left);
      clipRight = Math.min(clipRight, pRect.right);
    }
    parent = parent.parentElement;
  }

  const visibleTop = Math.max(rect.top, clipTop);
  const visibleBottom = Math.min(rect.bottom, clipBottom);
  const visibleLeft = Math.max(rect.left, clipLeft);
  const visibleRight = Math.min(rect.right, clipRight);

  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const visibleWidth = Math.max(0, visibleRight - visibleLeft);

  if (visibleHeight <= 0 || visibleWidth <= 0) return false;

  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  const ratio = totalArea > 0 ? (visibleArea / totalArea) : 0;

  return ratio >= minVisibleRatio;
};

const checkCenterVideo = () => {
  if (typeof document === 'undefined') return;

  // 0. If document/tab is hidden in background, pause ALL playing videos
  if (document.hidden) {
    document.querySelectorAll('video').forEach(video => {
      if (!video.paused) video.pause();
    });
    return;
  }

  // If in fullscreen, only allow fullscreen video to play
  const isFs = !!document.fullscreenElement;
  if (isFs) {
    document.querySelectorAll('video').forEach(video => {
      const amIFs = document.fullscreenElement.contains(video);
      if (!amIFs && !video.paused) video.pause();
    });
    return;
  }

  // 1. CRITICAL: Pause ANY playing video in DOM that is not sufficiently visible on screen
  document.querySelectorAll('video').forEach(video => {
    if (!video.paused && !isElementVisibleOnScreen(video, 0.35)) {
      try {
        video.pause();
      } catch (e) {}
    }
  });

  if (mountedVideos.size === 0) return;

  // 2. If any video is actively playing and STILL visible on screen, KEEP it playing
  // and ensure all other videos are paused.
  let currentlyPlaying = null;
  mountedVideos.forEach(video => {
    if (video && !video.paused && isElementVisibleOnScreen(video, 0.35)) {
      currentlyPlaying = video;
    }
  });

  if (currentlyPlaying) {
    pauseAllOtherVideos(currentlyPlaying);
    return;
  }

  // 3. If no video is currently playing, pick the one closest to screen center (that is well-visible)
  const centerY = window.innerHeight / 2;
  let closestVideo = null;
  let minDistance = Infinity;

  mountedVideos.forEach(video => {
    if (!video || !isElementVisibleOnScreen(video, 0.4)) return;
    const rect = video.getBoundingClientRect();
    const vCenter = rect.top + rect.height / 2;
    const distance = Math.abs(vCenter - centerY);
    if (distance < minDistance) {
      minDistance = distance;
      closestVideo = video;
    }
  });

  // Autoplay preference check: If turned off in settings, do NOT auto-start center videos on scroll
  const isAutoplayOff = typeof window !== 'undefined' && localStorage.getItem('video_autoplay') === 'off';

  mountedVideos.forEach(video => {
    if (video === closestVideo) {
      // Feed videos must ONLY autoplay if autoplay setting is not off, user hasn't paused it, and video is MUTED.
      // Browsers reject unmuted autoplay with DOMException, causing black screen and state desync.
      if (!isAutoplayOff && video.dataset.userPaused !== 'true' && video.paused && video.muted) {
        pauseAllOtherVideos(video);
        const playPromise = video.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(() => {
            try { video.pause(); } catch (_) {}
          });
        }
      }
    } else {
      if (!video.paused) video.pause();
    }
  });
};

const handleGlobalScroll = () => {
  if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
  scrollTimeout = requestAnimationFrame(checkCenterVideo);
};

if (typeof window !== 'undefined') {
  // Capture-phase play listener across entire DOM to guarantee only 1 video can EVER play
  window.addEventListener('play', (e) => {
    const target = e.target;
    if (target && target.tagName === 'VIDEO') {
      pauseAllOtherVideos(target);
    }
  }, true);

  window.addEventListener('scroll', handleGlobalScroll, true);
  window.addEventListener('resize', handleGlobalScroll);
  const onFullscreenChange = (e) => {
    handleGlobalScroll(e);
    if (Capacitor.isNativePlatform()) {
      try {
        const isFs = !!document.fullscreenElement;
        if (isFs) {
          StatusBar.hide().catch(() => {});
        } else {
          StatusBar.show().catch(() => {});
        }
      } catch (err) {
        console.error('StatusBar action failed:', err);
      }
    }
  };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  // Instant response when user toggles video autoplay in Settings
  window.addEventListener('video-autoplay-changed', (e) => {
    if (e.detail === 'off') {
      mountedVideos.forEach(video => {
        if (!video.paused && !video.closest('.watch-party-container')) {
          video.pause();
        }
      });
    } else if (e.detail === 'on') {
      checkCenterVideo();
    }
  });
}

const VideoPlayer = ({ src, qualities, videoUrl, lowVideoUrl, video144, video360, video720, video1080, video2160, videoOriginal, poster, className, isProcessing = false, processingProgress = 0, estimatedTime = 'Hesaplanıyor...', watchParty, disableWatchSync = false, serverNow: serverNowProp, onReady, onPlay, onPause, onSeek, volume: propVolume, muted: propMuted, onVolumeChange, onMuteChange }) => {
  const { user } = useAuth();
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const initializedPrefRef = useRef(false);
  const hlsInstanceRef = useRef(null);

  // Which video is currently displayed to the user
  const activeVideoRef = useRef('A'); // 'A' | 'B' — ref not state to avoid re-render races
  const [activeVideo, setActiveVideo] = useState('A'); // only for styling

  // Pending swap guard & cleanup — prevents race conditions and lockups
  const swapPendingRef = useRef(false);
  const swapIdRef = useRef(0);
  const cleanupSwapRef = useRef(null);
  const lastManualQualityChangeRef = useRef(0);

  const globalMuted = useGlobalStore(state => state.isMuted);
  const setIsMuted = useGlobalStore(state => state.setIsMuted);
  const isMuted = propMuted !== undefined ? propMuted : globalMuted;
  const volume = propVolume !== undefined ? propVolume : 0.5;
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [isAutoplayOff, setIsAutoplayOff] = useState(() => {
    if (typeof window === 'undefined') return false;
    const local = localStorage.getItem('video_autoplay');
    if (local !== null) return local === 'off';
    return user?.settings?.video?.autoplay === 'off';
  });
  const [derivedPoster, setDerivedPoster] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState(null);

  // Sync autoplay preference reactively from settings and user profile
  useEffect(() => {
    const handleAutoplayChange = (e) => {
      setIsAutoplayOff(e.detail === 'off');
    };
    window.addEventListener('video-autoplay-changed', handleAutoplayChange);
    return () => window.removeEventListener('video-autoplay-changed', handleAutoplayChange);
  }, []);

  useEffect(() => {
    if (user?.settings?.video?.autoplay) {
      setIsAutoplayOff(user.settings.video.autoplay === 'off');
    }
  }, [user?.settings?.video?.autoplay]);

  // Reset playback status when source changes
  useEffect(() => {
    setHasStartedPlayback(false);
  }, [src, videoUrl]);

  // Dynamic fallback frame extraction if poster is not provided by backend/props
  const handleCaptureFrame = useCallback((videoEl) => {
    if (poster || derivedPoster || !videoEl) return;
    try {
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;
      if (!width || !height) return;
      const canvas = document.createElement('canvas');
      const maxDim = 854;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg', 0.85);
      if (url && url.length > 100) {
        setDerivedPoster(url);
      }
    } catch (_) {}
  }, [poster, derivedPoster]);

  const effectivePoster = poster || derivedPoster;

  const [volumeSliderOpen, setVolumeSliderOpen] = useState(false);
  const [qualityMode, setQualityMode] = useState('auto');
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const waitingTimerRef = useRef(null);
  const [isAdPlaying, setIsAdPlaying] = useState(adsConfig.enableAds && !watchParty);
  const [canSkipAd, setCanSkipAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showProcessingInfo, setShowProcessingInfo] = useState(false);
  const processingInfoTimeoutRef = useRef(null);

  // Only display processing indicator if it is genuinely in progress (< 100%) and has not finished
  const hasFinishedTranscode = !!(video720 || video1080 || video360);
  const showProcessingBadge = isProcessing && !hasFinishedTranscode && processingProgress < 100 && !watchParty;

  // Center play button: ONLY at the beginning, ONLY if autoplay is OFF, NEVER during pauses mid-video
  const showCenterPlayBtn = isAutoplayOff && !hasStartedPlayback && !watchParty && !isAdPlaying;

  // Close quality/speed menus when clicking outside
  useEffect(() => {
    if (!isQualityMenuOpen && !isSettingsOpen) return;
    const handleOutsideClick = (e) => {
      if (e.target.closest && (e.target.closest('.native-quality-menu') || e.target.closest('.native-speed-menu') || e.target.closest('.native-quality-btn') || e.target.closest('.native-speed-text-btn'))) {
        return;
      }
      setIsQualityMenuOpen(false);
      setIsSettingsOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isQualityMenuOpen, isSettingsOpen]);

  const toggleProcessingInfo = (e) => {
    e.stopPropagation();
    setShowProcessingInfo(prev => {
      const next = !prev;
      if (next) {
        if (processingInfoTimeoutRef.current) clearTimeout(processingInfoTimeoutRef.current);
        processingInfoTimeoutRef.current = setTimeout(() => {
          setShowProcessingInfo(false);
        }, 1500);
      }
      return next;
    });
  };

  const handleInfoMouseEnter = () => {
    if (processingInfoTimeoutRef.current) clearTimeout(processingInfoTimeoutRef.current);
    setShowProcessingInfo(true);
  };

  const handleInfoMouseLeave = () => {
    if (processingInfoTimeoutRef.current) clearTimeout(processingInfoTimeoutRef.current);
    setShowProcessingInfo(false);
  };

  const lastProgrammaticSeekTimeRef = useRef(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // disableWatchSync: WatchPartyPlayer kendi sync engine'ini yönetirken bu motoru devre dışı bırak.
    // Çifte senkronizasyon çatışmasını önler (seek loop, playbackRate çakışması).
    if (!watchParty || disableWatchSync) return;
    const activeEl = getActiveEl();
    if (!activeEl) return;

    // serverNowFn: clock-corrected zaman. WatchPartyPlayer'dan getServerNow() geçirilirse
    // NTP düzeltmesi uygulanır. Geçirilmezse Date.now() kullanılır.
    const serverNowFn = serverNowProp || (() => Date.now());

    let syncInterval = null;
    let playTransitionGuardActive = false;
    let playTransitionGuardTimer = null;

    const alignVideo = (forceImmediate = false) => {
      const el = getActiveEl();
      if (!el || !watchParty) return;

      const serverNow = serverNowFn();
      const reference = watchParty.serverTimestamp || watchParty.lastUpdated || serverNow;
      const elapsed = watchParty.isPlaying ? Math.max(0, (serverNow - reference) / 1000) : 0;
      const targetTime = (typeof watchParty.currentTime === 'number' ? watchParty.currentTime : 0) + elapsed;
      const localTime = el.currentTime;
      const drift = targetTime - localTime; // positive means local is behind
      const absDrift = Math.abs(drift);

      // 1. Play / Pause state synchronization
      if (watchParty.isPlaying && el.paused) {
        isSyncingRef.current = true;
        // Play geçişinde guard aç ve bu cycle'da drift check’i tamamen atla.
        // Video T'de duruyordu, T'den başlamalı. elapsed-based seek = atlama.
        playTransitionGuardActive = true;
        if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
        playTransitionGuardTimer = setTimeout(() => {
          playTransitionGuardActive = false;
        }, 2500);
        el.play().catch(() => {});
        setIsPaused(false);
        setTimeout(() => { isSyncingRef.current = false; }, 300);
        return;  // <- Bu cycle'da drift check yapma. Bir sonraki interval tick’i yapar.
      } else if (!watchParty.isPlaying && !el.paused) {
        isSyncingRef.current = true;
        playTransitionGuardActive = false;
        if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
        el.pause();
        setIsPaused(true);
        setTimeout(() => { isSyncingRef.current = false; }, 300);
      }

      // 2. When Paused: Keep exactly aligned
      if (!watchParty.isPlaying) {
        el.playbackRate = 1.0;
        if (absDrift > 0.25) {
          isSyncingRef.current = true;
          el.currentTime = targetTime;
          setTimeout(() => { isSyncingRef.current = false; }, 300);
        }
        return;
      }

      // 3. When Playing: Maintain solid 1.0x playback rate to avoid pitch warble/flutter
      if (!playTransitionGuardActive && (forceImmediate || absDrift > 3.0)) {
        isSyncingRef.current = true;
        lastProgrammaticSeekTimeRef.current = targetTime;
        el.currentTime = targetTime;
        el.playbackRate = 1.0;
        setTimeout(() => { isSyncingRef.current = false; }, 400);
      } else {
        if (el.playbackRate !== 1.0) {
          el.playbackRate = 1.0;
        }
      }
    };

    alignVideo(true);

    syncInterval = setInterval(() => {
      alignVideo(false);
    }, 1500);

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      if (playTransitionGuardTimer) clearTimeout(playTransitionGuardTimer);
      const el = getActiveEl();
      if (el) el.playbackRate = 1.0;
    };
  }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.serverTimestamp, watchParty?.lastUpdated, activeVideo, disableWatchSync, serverNowProp]);

  // --- URL resolution helper using imageUtils to enforce Edge CDN / r2-media / api/media correctly ---
  const resolveVideoUrl = (url) => {
    if (!url) return '';
    return getImageUrl(url);
  };

  // Safe parse for qualities if stringified
  const parsedQualities = typeof qualities === 'string'
    ? (() => { try { return JSON.parse(qualities); } catch(e) { return {}; } })()
    : (qualities || {});

  // --- URL resolution & natural dimension analysis ---
  const rawBase = resolveVideoUrl(videoOriginal || parsedQualities?.videoOriginal || parsedQualities?.high || videoUrl || src);

  const raw2160 = resolveVideoUrl(video2160 || parsedQualities?.video2160 || parsedQualities?.p2160 || parsedQualities?.['2160p']);
  const raw1080 = resolveVideoUrl(video1080 || parsedQualities?.video1080 || parsedQualities?.p1080 || parsedQualities?.['1080p']);
  const raw720  = resolveVideoUrl(video720  || parsedQualities?.video720  || parsedQualities?.p720  || parsedQualities?.['720p']);
  const raw360  = resolveVideoUrl(video360  || parsedQualities?.video360  || parsedQualities?.p360  || parsedQualities?.['360p']);
  const raw144  = resolveVideoUrl(video144  || parsedQualities?.video144  || parsedQualities?.p144  || parsedQualities?.['144p'] || parsedQualities?.low || lowVideoUrl);

  const natH = naturalDimensions?.height || 0;
  const natW = naturalDimensions?.width || 0;
  const isNatural4K = natH >= 2160 || natW >= 3840;
  const isNatural1080 = (natH >= 1080 || natW >= 1920) && !isNatural4K;
  const isNatural720  = (natH >= 720  || natW >= 1280) && !isNatural4K && !isNatural1080;
  const isNatural360  = (natH >= 360  || natW >= 640 ) && !isNatural4K && !isNatural1080 && !isNatural720;

  // 2160p (4K): explicitly present OR detected from video element metadata
  const has2160 = !!raw2160 || (isNatural4K && !!rawBase);
  const src2160 = raw2160 || (has2160 ? rawBase : '');

  // 1080p:
  const has1080 = !!raw1080 || (isNatural1080 && !!rawBase) || (!has2160 && !raw720 && !raw360 && !raw144 && !!rawBase);
  const src1080 = raw1080 || (has1080 ? rawBase : '');

  // 720p:
  const has720 = !!raw720 || (isNatural720 && !has1080 && !has2160 && !!rawBase);
  const src720 = raw720 || (has720 ? rawBase : '');

  // 360p:
  const has360 = !!raw360 || (isNatural360 && !has720 && !has1080 && !has2160 && !!rawBase);
  const src360 = raw360 || (has360 ? rawBase : '');

  // 144p:
  const has144 = !!raw144;
  const src144 = raw144 || '';

  let maxResolution = '1080p';
  if (has2160) maxResolution = '2160p';
  else if (has1080) maxResolution = '1080p';
  else if (has720) maxResolution = '720p';
  else if (has360) maxResolution = '360p';
  else if (has144) maxResolution = '144p';

  const isSlowConnection = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
      if (conn.downlink && conn.downlink < 2) return true;
    }
    return false;
  };

  const getBestSrc = useCallback(() => {
    if (isSlowConnection() && src144) return src144;
    if (src2160) return src2160;
    if (src1080) return src1080;
    if (src720) return src720;
    if (src360) return src360;
    if (src144) return src144;
    return rawBase;
  }, [src144, src360, src720, src1080, src2160, rawBase]);

  const getPreferredSrc = useCallback(() => {
    const pref = user?.settings?.video?.playbackQuality || localStorage.getItem('video_playback_quality') || 'auto';
    if (pref === 'performance') {
      if (src2160) return src2160;
      if (src1080) return src1080;
      if (src720) return src720;
      if (src360) return src360;
      if (src144) return src144;
      return rawBase;
    } else if (pref === 'saver') {
      if (src720) return src720;
      if (src360) return src360;
      if (src144) return src144;
      if (src1080) return src1080;
      return src2160 || rawBase;
    } else if (pref === 'lowest') {
      if (src144) return src144;
      if (src360) return src360;
      if (src720) return src720;
      if (src1080) return src1080;
      return src2160 || rawBase;
    }
    return getBestSrc();
  }, [user, src2160, src1080, src720, src360, src144, rawBase, getBestSrc]);

  const availableQualities = [{ value: 'auto', label: 'Oto' }];
  if (has2160 && src2160) availableQualities.push({ value: '2160', label: '2160p' });
  if (has1080 && src1080) availableQualities.push({ value: '1080', label: '1080p' });
  if (has720  && src720)  availableQualities.push({ value: '720',  label: '720p'  });
  if (has360  && src360)  availableQualities.push({ value: '360',  label: '360p'  });
  if (has144  && src144)  availableQualities.push({ value: '144',  label: '144p'  });

  // --- Helpers ---
  const getActiveEl  = () => (activeVideoRef.current === 'A' ? videoRefA : videoRefB).current;
  const getInactiveEl = () => (activeVideoRef.current === 'A' ? videoRefB : videoRefA).current;
  const getInactiveId = () => (activeVideoRef.current === 'A' ? 'B' : 'A');

  const getHlsProxyUrl = useCallback((url) => {
    if (!url) return '';
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
    const baseUrl = (isNative || import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || 'https://api.oxypace.com.tr') : '').replace(/\/$/, '');

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

    if (url.includes('/proxy-hls') || url.startsWith('/api/media/proxy-hls') || url.startsWith('http://localhost') || url.startsWith('https://oxypac3.vercel.app')) {
      return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `${baseUrl}/api/media/proxy-hls?url=${encodeURIComponent(url)}`;
    }
    return url;
  }, []);

  const initHls = useCallback((videoEl, url) => {
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    if (!videoEl || !url) return;

    const targetUrl = isElectron ? url : getHlsProxyUrl(url);

    const startPlayer = (workingReferer = '') => {
      loadHls().then((HlsLib) => {
        const canUseHlsJs = HlsLib && HlsLib.isSupported();

        if (!canUseHlsJs && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
          videoEl.src = targetUrl;
          videoEl.load();
          
          const handleNativeError = () => {
            if (videoEl.src !== url) {
              console.warn("Native HLS proxy failed, falling back to original url:", url);
              videoEl.removeEventListener('error', handleNativeError);
              videoEl.src = url;
              videoEl.load();
            }
          };
          videoEl.addEventListener('error', handleNativeError);
          return;
        }

        if (!canUseHlsJs) {
          videoEl.src = targetUrl;
          videoEl.load();
          return;
        }

        const hls = new HlsLib({
            enableWorker: true,
            lowLatencyMode: true,
            xhrSetup: (xhr, requestUrl) => {
              if (workingReferer) {
                xhr.setRequestHeader('X-Target-Referer', workingReferer);
              }
            }
          });
          hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
            const pref = user?.settings?.video?.playbackQuality || localStorage.getItem('video_playback_quality') || 'auto';
            if (pref === 'lowest') {
              let lowestIdx = 0;
              let lowestHeight = Infinity;
              hls.levels.forEach((level, idx) => {
                if (level.height && level.height < lowestHeight) {
                  lowestHeight = level.height;
                  lowestIdx = idx;
                }
              });
              hls.currentLevel = lowestIdx;
            } else if (pref === 'saver') {
              let targetIdx = -1;
              let bestHeight = 0;
              hls.levels.forEach((level, idx) => {
                if (level.height && level.height <= 720 && level.height > bestHeight) {
                  bestHeight = level.height;
                  targetIdx = idx;
                }
              });
              if (targetIdx !== -1) {
                hls.currentLevel = targetIdx;
              }
            } else if (pref === 'performance') {
              let highestIdx = 0;
              let highestHeight = 0;
              hls.levels.forEach((level, idx) => {
                if (level.height && level.height > highestHeight) {
                  highestHeight = level.height;
                  highestIdx = idx;
                }
              });
              hls.currentLevel = highestIdx;
            } else {
              hls.currentLevel = -1;
            }
          });
          
          // Robust Hls.js network error handling to fall back to the original URL
          hls.on(HlsLib.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case HlsLib.ErrorTypes.NETWORK_ERROR:
                  if (data.details === 'manifestLoadError' && hls.url !== url) {
                    console.warn("HLS Proxy manifest load failed, falling back to original URL:", url);
                    hls.loadSource(url);
                    hls.startLoad();
                  } else {
                    hls.destroy();
                  }
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });

          hls.loadSource(targetUrl);
          hls.attachMedia(videoEl);
          hlsInstanceRef.current = hls;
        }).catch(err => {
          console.error('Failed to load Hls.js, falling back to native src:', err);
          videoEl.src = targetUrl;
          videoEl.load();
        });
    };

    if (isElectron) {
      findWorkingReferer(targetUrl).then(ref => {
        startPlayer(ref);
      });
    } else {
      startPlayer();
    }
  }, [user, getHlsProxyUrl]);

  const setVideoSource = useCallback((el, url) => {
    if (!el) return;
    if (isHls(url)) {
      initHls(el, url);
    } else {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (el.src !== url) {
        el.src = url;
        el.load();
      }
    }
  }, [initHls]);

  // Clean up HLS instance and pending swap on unmount
  useEffect(() => {
    return () => {
      if (cleanupSwapRef.current) {
        cleanupSwapRef.current();
        cleanupSwapRef.current = null;
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, []);

  // Initialise video A with the preferred quality src immediately
  useEffect(() => {
    const el = videoRefA.current;
    if (!el) return;

    setIsAdPlaying(false);
    const preferredSrc = getPreferredSrc();
    if (preferredSrc) {
      setVideoSource(el, preferredSrc);
    }
  }, [src, videoUrl, getPreferredSrc, setVideoSource]);

  // Sync user quality preferences when settings change
  useEffect(() => {
    const pref = user?.settings?.video?.playbackQuality || localStorage.getItem('video_playback_quality') || 'auto';
    
    let mode = 'auto';
    if (pref === 'performance') {
      if (has2160) mode = '2160';
      else if (has1080) mode = '1080';
      else if (has720) mode = '720';
      else if (has360) mode = '360';
      else if (has144) mode = '144';
    } else if (pref === 'saver') {
      if (has720) mode = '720';
      else if (has360) mode = '360';
      else if (has1080) mode = '1080';
      else if (has144) mode = '144';
      else if (has2160) mode = '2160';
    } else if (pref === 'lowest') {
      if (has144) mode = '144';
      else if (has360) mode = '360';
      else if (has720) mode = '720';
      else if (has1080) mode = '1080';
      else if (has2160) mode = '2160';
    } else {
      mode = 'auto';
    }
    
    setQualityMode(mode);
    
    let targetSrc = '';
    if      (mode === '2160') targetSrc = src2160;
    else if (mode === '1080') targetSrc = src1080;
    else if (mode === '720')  targetSrc = src720;
    else if (mode === '360')  targetSrc = src360;
    else if (mode === '144')  targetSrc = src144;
    else                      targetSrc = getBestSrc();
    
    const activeEl = getActiveEl();
    if (activeEl && targetSrc) {
      let isSame = false;
      try {
        const activeUrl = new URL(activeEl.currentSrc || activeEl.src, window.location.href).href;
        const targetUrl = new URL(targetSrc, window.location.href).href;
        if (activeUrl === targetUrl) isSame = true;
      } catch (_) {
        if (activeEl.src === targetSrc || activeEl.currentSrc === targetSrc) isSame = true;
      }
      if (!isSame) {
        setVideoSource(activeEl, targetSrc);
      }
    }
  }, [user?.settings?.video?.playbackQuality, has2160, has1080, has720, has360, has144, src2160, src1080, src720, src360, src144, getBestSrc, setVideoSource]);

  // Sync mute & playbackRate to both elements imperatively
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.muted = isMuted;
    if (videoRefB.current) videoRefB.current.muted = isMuted;
  }, [isMuted]);

  // Sync volume to both elements
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.volume = volume;
    if (videoRefB.current) videoRefB.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (videoRefA.current) videoRefA.current.playbackRate = playbackRate;
    if (videoRefB.current) videoRefB.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // ─────────────────────────────────────────────────────────────────────────
  // THE CORE: Ultra-fast, zero time-drift quality swap using dual-buffer strategy
  // Active video keeps playing smoothly while inactive video prepares in background.
  // Kept strictly muted during prep to eliminate audio-pipeline contention.
  // Swapped instantly upon frame availability (seeked/canplay) with exact live timestamp
  // synchronization to completely eliminate backwards drift.
  // ─────────────────────────────────────────────────────────────────────────
  const initiateQualitySwap = useCallback((newSrc) => {
    const activeEl   = getActiveEl();
    const inactiveEl = getInactiveEl();
    if (!activeEl || !newSrc) return;

    // Already playing this src → nothing to do
    let isAlreadyPlaying = false;
    try {
      const activeUrl = new URL(activeEl.currentSrc || activeEl.src, window.location.href).href;
      const targetUrl = new URL(newSrc, window.location.href).href;
      if (activeUrl === targetUrl) isAlreadyPlaying = true;
    } catch (_) {
      if (activeEl.src === newSrc || activeEl.currentSrc === newSrc) isAlreadyPlaying = true;
    }
    if (isAlreadyPlaying) return;

    // Cancel any previous swap in flight so latest choice applies immediately
    if (cleanupSwapRef.current) {
      cleanupSwapRef.current();
      cleanupSwapRef.current = null;
    }

    const swapId = ++swapIdRef.current;
    swapPendingRef.current = true;

    const wasPlaying = !activeEl.paused;
    console.log(`[VideoPlayer] Fast swap to ${newSrc} (swap #${swapId}, wasPlaying=${wasPlaying})`);

    let isCleanedUp = false;
    let safetyTimeout = null;

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
      if (inactiveEl) {
        inactiveEl.removeEventListener('loadedmetadata', onMeta);
        inactiveEl.removeEventListener('seeked', onReady);
        inactiveEl.removeEventListener('canplay', onReady);
        inactiveEl.removeEventListener('loadeddata', onReady);
        inactiveEl.removeEventListener('error', onError);
      }
      if (cleanupSwapRef.current === cleanup) {
        cleanupSwapRef.current = null;
      }
      swapPendingRef.current = false;
    };
    cleanupSwapRef.current = cleanup;

    // Direct fallback if dual-buffer fails, stalls, or is unsupported
    const applyDirectFallback = () => {
      cleanup();
      const el = getActiveEl();
      if (!el || !newSrc) return;
      const liveTime = el.currentTime;
      const isPlay = !el.paused;
      setVideoSource(el, newSrc);
      const onDirectMeta = () => {
        try {
          el.currentTime = liveTime;
        } catch (_) {}
        if (isPlay) {
          el.play().catch(() => {});
        }
      };
      if (el.readyState >= 1) {
        onDirectMeta();
      } else {
        el.addEventListener('loadedmetadata', onDirectMeta, { once: true });
      }
      el.addEventListener('canplay', () => setIsWaiting(false), { once: true });
      el.addEventListener('playing', () => setIsWaiting(false), { once: true });
    };

    const executeSwap = () => {
      if (isCleanedUp || swapIdRef.current !== swapId) return;
      cleanup();

      const newId = getInactiveId();
      const liveNow = activeEl.currentTime;
      const drift = liveNow - inactiveEl.currentTime;

      // Ensure zero drift: synchronize inactiveEl to the exact live time of activeEl
      if (Math.abs(drift) > 0.03) {
        try {
          inactiveEl.currentTime = liveNow;
        } catch (e) {
          console.warn('[VideoPlayer] Error syncing currentTime on swap:', e);
        }
      }

      inactiveEl.muted = isMuted;
      inactiveEl.volume = volume;
      inactiveEl.playbackRate = activeEl.playbackRate || playbackRate;

      if (wasPlaying && !activeEl.paused) {
        inactiveEl.play().catch(() => {});
      }

      // Immediate swap of active element
      activeVideoRef.current = newId;
      setActiveVideo(newId);

      // Pause and mute old active element
      activeEl.pause();
      activeEl.muted = true;

      // Register new active element with scroll-center manager
      mountedVideos.delete(activeEl);
      mountedVideos.add(inactiveEl);

      setIsWaiting(false);
      console.log(`[VideoPlayer] Fast swap complete → ${newId} at ${liveNow.toFixed(3)}s (corrected drift: ${drift.toFixed(3)}s)`);
    };

    const onReady = () => {
      if (isCleanedUp || swapIdRef.current !== swapId) return;
      executeSwap();
    };

    const onMeta = () => {
      if (isCleanedUp || swapIdRef.current !== swapId) return;
      inactiveEl.removeEventListener('loadedmetadata', onMeta);

      const liveTime = activeEl.currentTime;

      if (liveTime < 0.05) {
        // At video beginning: no seek required
        if (inactiveEl.readyState >= 2) {
          executeSwap();
        } else {
          inactiveEl.addEventListener('canplay', onReady, { once: true });
          inactiveEl.addEventListener('loadeddata', onReady, { once: true });
          inactiveEl.addEventListener('playing', onReady, { once: true });
        }
      } else {
        inactiveEl.addEventListener('seeked', onReady, { once: true });
        inactiveEl.addEventListener('canplay', onReady, { once: true });
        inactiveEl.addEventListener('loadeddata', onReady, { once: true });
        try {
          inactiveEl.currentTime = liveTime;
        } catch (e) {
          console.warn('[VideoPlayer] Error seeking inactive to live time:', e);
          executeSwap();
        }
      }
    };

    const onError = (err) => {
      if (isCleanedUp || swapIdRef.current !== swapId) return;
      console.warn('[VideoPlayer] Quality swap inactive element error, falling back to direct swap:', err);
      applyDirectFallback();
    };

    if (!inactiveEl) {
      applyDirectFallback();
      return;
    }

    // Prepare inactive element: keep muted during background preparation
    inactiveEl.muted = true;
    inactiveEl.volume = volume;
    inactiveEl.playbackRate = activeEl.playbackRate || playbackRate;
    inactiveEl.loop = true;
    inactiveEl.preload = 'auto';
    inactiveEl.setAttribute('playsinline', '');

    // Attach listeners before loading source
    inactiveEl.addEventListener('error', onError, { once: true });

    if (inactiveEl.readyState >= 1 && (inactiveEl.src === newSrc || inactiveEl.currentSrc === newSrc)) {
      onMeta();
    } else {
      inactiveEl.addEventListener('loadedmetadata', onMeta, { once: true });
      setVideoSource(inactiveEl, newSrc);
    }

    // Fast safety timeout: if inactiveEl doesn't reach readyState >= 2 within 1200ms, fallback to direct swap
    safetyTimeout = setTimeout(() => {
      if (isCleanedUp || swapIdRef.current !== swapId) return;
      console.warn('[VideoPlayer] Swap safety timeout (1200ms) reached.');
      if (inactiveEl.readyState >= 2) {
        executeSwap();
      } else {
        applyDirectFallback();
      }
    }, 1200);
  }, [isMuted, volume, playbackRate, setVideoSource]);

  // ─── Auto-quality stall handling ────────────────────────────────────────
  const handleWaiting = useCallback(() => {
    if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);

    waitingTimerRef.current = setTimeout(() => {
      setIsWaiting(true);
      const activeEl = getActiveEl();
      if (!activeEl || activeEl.paused) return;

      // Don't auto-downgrade if user manually selected a quality recently
      if (Date.now() - lastManualQualityChangeRef.current < 8000) return;

      if (qualityMode === 'auto') {
        // Drop straight to lowest quality for instant continuous playback
        const lowestSrc = src144 || src360 || src;
        if (lowestSrc && activeEl.src !== lowestSrc && activeEl.currentSrc !== lowestSrc) {
          console.log('[VideoPlayer] Auto: stall → dropping to lowest quality immediately');
          initiateQualitySwap(lowestSrc);
        }
      }
    }, 600);
  }, [qualityMode, src144, src360, src, initiateQualitySwap]);

  const handlePlaying = useCallback(() => {
    if (waitingTimerRef.current) { 
      clearTimeout(waitingTimerRef.current); 
      waitingTimerRef.current = null; 
    }
    setIsWaiting(false);
    setHasStartedPlayback(true);
    setIsPaused(false);
  }, []);

  // ─── Manual quality selector ──────────────────────────────────────────
  const handleQualityChange = useCallback((mode) => {
    lastManualQualityChangeRef.current = Date.now();
    setQualityMode(mode);
    setIsQualityMenuOpen(false);

    let targetSrc = '';
    if      (mode === '2160') targetSrc = src2160;
    else if (mode === '1080') targetSrc = src1080;
    else if (mode === '720')  targetSrc = src720;
    else if (mode === '360')  targetSrc = src360;
    else if (mode === '144')  targetSrc = src144;
    else                      targetSrc = getBestSrc();

    if (targetSrc) initiateQualitySwap(targetSrc);
  }, [src144, src360, src720, src1080, src2160, getBestSrc, initiateQualitySwap]);

  // ─── Network change listeners ─────────────────────────────────────────
  useEffect(() => {
    if (qualityMode !== 'auto') return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return;
    const onChange = () => {
      if (Date.now() - lastManualQualityChangeRef.current < 8000) return;
      const next = getBestSrc();
      const activeEl = getActiveEl();
      if (activeEl && next !== activeEl.src && next !== activeEl.currentSrc) {
        initiateQualitySwap(next);
      }
    };
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener('change', onChange);
  }, [qualityMode, getBestSrc, initiateQualitySwap]);

  // ─── Periodic upgrade check ───────────────────────────────────────────
  useEffect(() => {
    if (qualityMode !== 'auto') return;
    const id = setInterval(() => {
      if (Date.now() - lastManualQualityChangeRef.current < 8000) return;
      if (isSlowConnection()) return;
      const next = getBestSrc();
      const activeEl = getActiveEl();
      if (activeEl && next !== activeEl.src && next !== activeEl.currentSrc) {
        console.log('[VideoPlayer] Auto: network recovered → upgrading quality');
        initiateQualitySwap(next);
      }
    }, 8000);
    return () => clearInterval(id);
  }, [qualityMode, getBestSrc, initiateQualitySwap]);

  // ─── Progress stall detector ──────────────────────────────────────────
  useEffect(() => {
    if (qualityMode !== 'auto') return;
    let lastTime = 0;
    let lastCheck = Date.now();
    const id = setInterval(() => {
      if (Date.now() - lastManualQualityChangeRef.current < 8000) return;
      const video = getActiveEl();
      if (!video || video.paused || video.ended) {
        lastCheck = Date.now(); lastTime = video?.currentTime ?? 0; return;
      }
      const now = Date.now();
      const elapsed = (now - lastCheck) / 1000;
      const diff = video.currentTime - lastTime;
      if (elapsed > 0.5 && diff < 0.1) {
        const lowestSrc = src144 || src360;
        if (lowestSrc && video.src !== lowestSrc && video.currentSrc !== lowestSrc) {
          console.log('[VideoPlayer] Auto: progress stall → emergency swap to lowest');
          initiateQualitySwap(lowestSrc);
        }
      }
      lastTime = video.currentTime; lastCheck = now;
    }, 500);
    return () => clearInterval(id);
  }, [qualityMode, src144, src360, initiateQualitySwap]);

  // ─── Register active video with scroll manager & Intersection Observer ───
  useEffect(() => {
    const el = getActiveEl();
    if (!el) return;
    mountedVideos.add(el);
    handleGlobalScroll();

    // Pause immediately if tab/window visibility changes to hidden
    const handleVisibilityChange = () => {
      if (document.hidden && !el.paused) {
        el.pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // IntersectionObserver to handle out-of-view pause immediately and check center
    const container = el.closest('.native-player-container');
    let observer = null;
    if (container && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            // Pauses immediately when it goes out of view or below 35% visible
            const containerVideos = container.querySelectorAll('video');
            containerVideos.forEach(v => {
              if (!v.paused) {
                try {
                  v.pause();
                } catch (e) {}
              }
            });
          } else {
            handleGlobalScroll();
          }
        });
      }, { threshold: [0.0, 0.1, 0.2, 0.35, 0.5, 0.75, 1.0] });
      observer.observe(container);
    }

    return () => {
      mountedVideos.delete(el);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [activeVideo]);

  // ─── Sync isPaused state with active element ──────────────────────────
  useEffect(() => {
    const el = getActiveEl();
    if (!el) return;
    const onPlay  = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    el.addEventListener('play',  onPlay);
    el.addEventListener('pause', onPause);
    setIsPaused(el.paused);
    return () => { el.removeEventListener('play', onPlay); el.removeEventListener('pause', onPause); };
  }, [activeVideo]);

  useEffect(() => () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (waitingTimerRef.current)    clearTimeout(waitingTimerRef.current);
  }, []);

  // ─── Controls auto-hide (Equal 2s timeout for both playing and paused states) ───────────────────
  const startControlsTimeout = useCallback((ms = 2000) => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isSettingsOpen || isQualityMenuOpen) return;
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), ms);
  }, [isSettingsOpen, isQualityMenuOpen]);

  useEffect(() => {
    setShowControls(true);
    startControlsTimeout(2000);
  }, [isPaused, startControlsTimeout]);

  // ─── Ad control functions ─────────────────────────────────────────────
  const skipAd = useCallback(() => {
    setIsAdPlaying(false);
    setCanSkipAd(false);
    const el = getActiveEl();
    if (el) {
      const bestSrc = getBestSrc();
      if (bestSrc) {
        setVideoSource(el, bestSrc);
        el.currentTime = 0;
        el.play().catch(() => {});
      }
    }
  }, [getBestSrc, setVideoSource, activeVideo]);

  const handleVideoEnded = useCallback(() => {
    if (isAdPlaying) {
      skipAd();
    }
  }, [isAdPlaying, skipAd]);

  const handleVideoError = useCallback(() => {
    if (isAdPlaying) {
      console.warn("Pre-roll ad video failed to load, bypassing ad.");
      skipAd();
    }
  }, [isAdPlaying, skipAd]);

  // ─── Event handlers ───────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const el = getActiveEl(); if (!el) return;
    const cur = el.currentTime; const tot = el.duration;
    setCurrentTime(cur);
    if (tot > 0) { setDuration(tot); setProgress((cur / tot) * 100); }

    if (isAdPlaying) {
      if (cur >= 5) {
        setCanSkipAd(true);
        setAdCountdown(0);
      } else {
        setAdCountdown(Math.ceil(5 - cur));
      }
    }
  }, [activeVideo, isAdPlaying]);

  const handleLoadedMetadataActive = useCallback(() => {
    const el = getActiveEl(); if (!el) return;
    setIsWaiting(false);
    if (el.videoWidth && el.videoHeight && !naturalDimensions) {
      setNaturalDimensions({ width: el.videoWidth, height: el.videoHeight });
    }
    handleCaptureFrame(el);
    handleTimeUpdate();
    if (watchParty && onReady) {
      onReady();
    }
  }, [activeVideo, naturalDimensions, handleTimeUpdate, watchParty, onReady, handleCaptureFrame]);

  const handleScrub = useCallback((e) => {
    e.stopPropagation();
    if (isAdPlaying) return; // Lock scrubbing during ad
    const el = getActiveEl(); if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const targetTime = frac * duration;
    if (watchParty) {
      if (onSeek) onSeek(targetTime);
      return;
    }
    el.currentTime = targetTime;
    setProgress(frac * 100);
  }, [duration, activeVideo, isAdPlaying, watchParty, onSeek]);

  const handleSeekOffset = useCallback((offset, e) => {
    if (e?.stopPropagation) e.stopPropagation();
    const el = getActiveEl();
    if (!el || !duration) return;
    const targetTime = Math.max(0, Math.min(duration, el.currentTime + offset));
    if (watchParty) {
      if (onSeek) onSeek(targetTime);
      return;
    }
    el.currentTime = targetTime;
    setProgress((targetTime / duration) * 100);
  }, [duration, activeVideo, watchParty, onSeek]);

  // ─── Prominent Center Play Button Click Handler ───────────────────────
  const handleCenterPlayClick = useCallback((e) => {
    e.stopPropagation();
    const el = getActiveEl();
    if (!el) return;
    pauseAllOtherVideos(el);
    el.dataset.userPaused = 'false';
    el.play().catch(() => {});
    setIsPaused(false);
    setHasStartedPlayback(true);
    setShowControls(true);
    startControlsTimeout(2000);
    if (onPlay) onPlay(el.currentTime);
  }, [activeVideo, onPlay, startControlsTimeout]);

  // ─── Video Area Click: 1st tap shows controls, 2nd tap pauses/plays ───
  const handleVideoAreaClick = useCallback((e) => {
    e.stopPropagation();
    if (isSettingsOpen || isQualityMenuOpen) {
      setIsSettingsOpen(false);
      setIsQualityMenuOpen(false);
      return;
    }

    // If center play button is showing on cover, clicking starts playback immediately
    if (showCenterPlayBtn) {
      handleCenterPlayClick(e);
      return;
    }

    // 1st click: If controls are currently hidden, first click ONLY reveals the controls!
    if (!showControls) {
      setShowControls(true);
      startControlsTimeout(2000);
      return;
    }

    // 2nd click: Controls are already visible -> toggles play / pause
    const el = getActiveEl();
    if (!el) return;

    if (watchParty) {
      if (el.paused) {
        pauseAllOtherVideos(el);
        el.play().catch(() => {});
        setIsPaused(false);
        setHasStartedPlayback(true);
        if (onPlay) onPlay(el.currentTime);
        startControlsTimeout(2000);
      } else {
        el.pause();
        setIsPaused(true);
        if (onPause) onPause(el.currentTime);
        setShowControls(true);
        startControlsTimeout(2000);
      }
      return;
    }

    if (el.paused) {
      pauseAllOtherVideos(el);
      el.dataset.userPaused = 'false';
      el.play().catch(() => {});
      setIsPaused(false);
      setHasStartedPlayback(true);
      startControlsTimeout(2000);
    } else {
      el.dataset.userPaused = 'true';
      el.pause();
      setIsPaused(true);
      setShowControls(true);
      startControlsTimeout(2000);
    }
  }, [showCenterPlayBtn, handleCenterPlayClick, showControls, isSettingsOpen, isQualityMenuOpen, activeVideo, startControlsTimeout, watchParty, onPlay, onPause]);

  // ─── Dedicated Play/Pause Button Click (Direct toggle) ─────────────────
  const handlePlayPauseBtnClick = useCallback((e) => {
    e.stopPropagation();
    if (isSettingsOpen || isQualityMenuOpen) {
      setIsSettingsOpen(false);
      setIsQualityMenuOpen(false);
    }

    const el = getActiveEl();
    if (!el) return;

    if (watchParty) {
      if (el.paused) {
        pauseAllOtherVideos(el);
        el.play().catch(() => {});
        setIsPaused(false);
        setHasStartedPlayback(true);
        if (onPlay) onPlay(el.currentTime);
        startControlsTimeout(2000);
      } else {
        el.pause();
        setIsPaused(true);
        if (onPause) onPause(el.currentTime);
        setShowControls(true);
        startControlsTimeout(2000);
      }
      return;
    }

    if (el.paused) {
      pauseAllOtherVideos(el);
      el.dataset.userPaused = 'false';
      el.play().catch(() => {});
      setIsPaused(false);
      setHasStartedPlayback(true);
      startControlsTimeout(2000);
    } else {
      el.dataset.userPaused = 'true';
      el.pause();
      setIsPaused(true);
      setShowControls(true);
      startControlsTimeout(2000);
    }
  }, [isSettingsOpen, isQualityMenuOpen, activeVideo, startControlsTimeout, watchParty, onPlay, onPause]);

  const handleVideoClick = handleVideoAreaClick;

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    if (onMuteChange) {
      onMuteChange(!isMuted);
    } else {
      setIsMuted(!isMuted);
    }
  }, [isMuted, onMuteChange, setIsMuted]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const changePlaybackRate = useCallback((rate) => { setPlaybackRate(rate); setIsSettingsOpen(false); }, []);

  const toggleFullscreen = useCallback((e) => {
    e.stopPropagation();
    const el = getActiveEl(); if (!el) return;
    const container = el.closest('.native-player-container'); if (!container) return;
    if (!document.fullscreenElement) {
      (container.requestFullscreen || container.webkitRequestFullscreen || (() => {})).call(container);
    } else {
      document.exitFullscreen?.();
    }
  }, [activeVideo]);

  const handleMouseMove = useCallback((e) => {
    if (isSettingsOpen || isQualityMenuOpen) {
      if (!showControls) setShowControls(true);
      return;
    }
    const isFs = !!document.fullscreenElement;
    if (isFs) {
      const t = 10;
      if (e.clientX <= t || e.clientX >= window.innerWidth - t || e.clientY <= t || e.clientY >= window.innerHeight - t) {
        if (showControls) setShowControls(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        return;
      }
    }
    if (!showControls) {
      setShowControls(true);
    }
    startControlsTimeout(2000);
  }, [isSettingsOpen, isQualityMenuOpen, showControls, startControlsTimeout]);

  const handleMouseEnter = useCallback(() => {
    if (!showControls) {
      setShowControls(true);
    }
    startControlsTimeout(2000);
  }, [showControls, startControlsTimeout]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  // Calculate aspect ratio and styles based on natural dimensions
  const hasDimensions = naturalDimensions && naturalDimensions.width && naturalDimensions.height;
  const isTweet = className && className.includes('quoted-player');

  const richVideoBg = 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.5) 0%, rgba(10, 15, 26, 0.95) 100%), #0a0e17';

  let containerStyle = {};
  if (watchParty) {
    containerStyle = {
      width: '100%',
      height: '100%',
      background: '#0a0e17',
    };
  } else if (isTweet) {
    containerStyle = {
      aspectRatio: '16/9',
      width: '100%',
      background: richVideoBg,
    };
  } else if (hasDimensions) {
    const { width, height } = naturalDimensions;
    const ratio = width / height;
    
    // Bounds: 9:16 (0.5625) and 16:9 (1.7778)
    const isAbsurd = ratio < 0.5625 || ratio > 1.7778;
    
    if (isAbsurd) {
      // Absurd ratio: clamp the container to the nearest boundary with rich modern gradient
      const clampedRatio = ratio < 0.5625 ? 0.5625 : 1.7778;
      containerStyle = {
        aspectRatio: `${clampedRatio}`,
        background: richVideoBg,
        width: '100%',
      };
    } else {
      // Normal ratio: use the exact original aspect ratio and rich gradient if it is taller than 16:9
      containerStyle = {
        aspectRatio: `${width}/${height}`,
        background: ratio < 1.7778 ? richVideoBg : 'transparent',
        boxShadow: ratio < 1.7778 ? '0 10px 40px -15px rgba(0, 0, 0, 0.7)' : 'none',
        width: '100%',
      };
    }
  } else {
    containerStyle = {
      background: richVideoBg,
      width: '100%',
    };
  }

  const videoStyle = (id) => {
    const isActive = activeVideo === id;
    const forceAbsolute = hasDimensions || isTweet || watchParty;
    return {
      display: 'block',
      width: '100%',
      height: forceAbsolute ? '100%' : 'auto',
      objectFit: 'contain',
      position: forceAbsolute ? 'absolute' : (isActive ? 'relative' : 'absolute'),
      top: 0, left: 0,
      opacity: isActive ? 1 : 0,
      pointerEvents: isActive ? 'auto' : 'none',
      zIndex: isActive ? 1 : 0,
      transition: 'opacity 0.08s linear',
      transform: 'translateZ(0)',
      willChange: 'transform',
      backfaceVisibility: 'hidden',
    };
  };

  return (
    <div
      className={`native-player-container left-aligned v16-scale ${className || ''} ${isQualityMenuOpen || isSettingsOpen ? 'has-open-menu' : ''}`}
      style={containerStyle}
      onClick={handleVideoAreaClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
    >
      {showProcessingBadge && (
        <div
          className="processing-badge-minimal"
          onClick={toggleProcessingInfo}
          onMouseEnter={handleInfoMouseEnter}
          onMouseLeave={handleInfoMouseLeave}
        >
          <span className="processing-info-icon" title="Bilgi">i</span>
          <span className="processing-info-values">%{processingProgress} • {estimatedTime}</span>

          {showProcessingInfo && (
            <div className="processing-info-tooltip">
              Arka planda kalite ayrıştırma işlemi
            </div>
          )}
        </div>
      )}

      {!watchParty && isWaiting && (
        <div className="native-loader-overlay">
          <div className="pro-spinner" />
        </div>
      )}

      {/* Ambient backdrop for zero-black letterboxing & deep atmospheric diffusion */}
      <div
        className="native-player-backdrop"
        style={effectivePoster ? { backgroundImage: `url(${effectivePoster})` } : undefined}
        aria-hidden="true"
      />

      {/* Mandatory Cover Poster: stays locked until user actively starts playback and video renders */}
      {(!hasStartedPlayback || isPaused || currentTime < 0.05) && (
        <div
          className={`native-cover-poster ${!effectivePoster ? 'native-fallback-cover' : ''}`}
          style={effectivePoster ? { backgroundImage: `url(${effectivePoster})` } : undefined}
          aria-hidden="true"
        >
          {!effectivePoster && (
            <div className="native-fallback-cover-content">
              <Film className="native-fallback-icon" />
              <span className="native-fallback-label">Oxypace Video</span>
            </div>
          )}
        </div>
      )}

      {/* Glassmorphic Center Play Button Overlay on Video Cover (Only before playback has started when autoplay is OFF) */}
      {showCenterPlayBtn && (
        <div
          className="native-center-play-overlay"
          onClick={handleCenterPlayClick}
          aria-label="Videoyu Oynat"
          role="button"
          tabIndex={0}
        >
          <div className="native-center-play-btn">
            <Play className="native-center-play-icon" />
          </div>
        </div>
      )}

      {/* VIDEO A */}
      <video
        ref={videoRefA}
        poster={effectivePoster || undefined}
        className="native-video-element"
        style={videoStyle('A')}
        playsInline loop={!isAdPlaying} preload="auto"
        muted={isMuted}
        crossOrigin={isHls(src) || (src && src.startsWith('http') && !src.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) ? undefined : "anonymous"}
        onClick={handleVideoAreaClick}
        onTimeUpdate={activeVideo === 'A' ? handleTimeUpdate : undefined}
        onLoadedMetadata={activeVideo === 'A' ? handleLoadedMetadataActive : undefined}
        onWaiting={activeVideo === 'A' ? handleWaiting : undefined}
        onStalled={activeVideo === 'A' ? handleWaiting : undefined}
        onPlaying={activeVideo === 'A' ? handlePlaying : undefined}
        onCanPlay={activeVideo === 'A' ? handlePlaying : undefined}
        onEnded={activeVideo === 'A' ? handleVideoEnded : undefined}
        onError={activeVideo === 'A' ? handleVideoError : undefined}
      />

      {/* VIDEO B */}
      <video
        ref={videoRefB}
        poster={effectivePoster || undefined}
        className="native-video-element"
        style={videoStyle('B')}
        playsInline loop={!isAdPlaying} preload="auto"
        muted={isMuted}
        crossOrigin={isHls(src) || (src && src.startsWith('http') && !src.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) ? undefined : "anonymous"}
        onClick={handleVideoAreaClick}
        onTimeUpdate={activeVideo === 'B' ? handleTimeUpdate : undefined}
        onLoadedMetadata={activeVideo === 'B' ? handleLoadedMetadataActive : undefined}
        onWaiting={activeVideo === 'B' ? handleWaiting : undefined}
        onStalled={activeVideo === 'B' ? handleWaiting : undefined}
        onPlaying={activeVideo === 'B' ? handlePlaying : undefined}
        onCanPlay={activeVideo === 'B' ? handlePlaying : undefined}
        onEnded={activeVideo === 'B' ? handleVideoEnded : undefined}
        onError={activeVideo === 'B' ? handleVideoError : undefined}
      />

      {isAdPlaying && (
        <div className="ad-overlay-container">
          <div className="ad-badge-top-left">Sponsorlu Reklam</div>
          {canSkipAd ? (
            <button className="ad-skip-btn" onClick={skipAd}>
              Reklamı Geç
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <div className="ad-skip-timer">
              Reklamı Geçmek İçin Son {adCountdown} saniye...
            </div>
          )}
        </div>
      )}

      {!showCenterPlayBtn && !watchParty && (
        <button className={`native-mute-toggle ${!showControls ? 'controls-hidden' : ''}`} onClick={toggleMute} aria-label="Sesi Kapat / Aç">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      {!showCenterPlayBtn && (
        <div className={`native-controls-ui is-always-visible ${!showControls ? 'controls-hidden' : ''}`}>
        <div className={`native-progress-area ${isAdPlaying ? 'ad-locked' : ''}`} style={isAdPlaying ? { pointerEvents: 'none' } : {}} onClick={handleScrub}>
          <div className="native-progress-track">
            <div className="native-progress-fill" style={{ width: `${progress}%` }}>
              {!isAdPlaying && <div className="native-progress-thumb" />}
            </div>
          </div>
        </div>

        <div className="native-bottom-row">
          <div className="native-left-controls">
            <button className="native-play-pause-btn" onClick={handlePlayPauseBtnClick} aria-label="Oynat / Duraklat">
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <div className="native-time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="native-time-sep">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {!isAdPlaying && (
              <>
                <button className="native-skip-btn" onClick={(e) => handleSeekOffset(-10, e)} title="10 Saniye Geri">
                  <RotateCcw size={16} />
                </button>
                <button className="native-skip-btn" onClick={(e) => handleSeekOffset(10, e)} title="10 Saniye İleri">
                  <RotateCw size={16} />
                </button>
              </>
            )}

            {watchParty && (
              <div className="native-volume-inline" onMouseLeave={() => setVolumeSliderOpen(false)}>
                <button 
                  className="native-volume-inline-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!volumeSliderOpen) {
                      setVolumeSliderOpen(true);
                    } else {
                      toggleMute(e);
                    }
                  }} 
                  title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (onVolumeChange) onVolumeChange(val);
                    if (val > 0) {
                      if (onMuteChange) onMuteChange(false);
                    } else {
                      if (onMuteChange) onMuteChange(true);
                    }
                  }}
                  className={`native-volume-inline-slider ${!volumeSliderOpen ? 'collapsed' : ''}`}
                />
              </div>
            )}
          </div>

          <div className="native-right-controls">
            {!isAdPlaying && (
              <>
                <button
                  className={`native-quality-btn ${isQualityMenuOpen ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); setIsQualityMenuOpen(v => !v); setIsSettingsOpen(false); }}
                  title="Video Kalitesi"
                >
                  {qualityMode === 'auto' ? 'Oto' : `${qualityMode}p`}
                </button>

                <button
                  className={`native-speed-text-btn ${isSettingsOpen ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); setIsSettingsOpen(v => !v); setIsQualityMenuOpen(false); }}
                  title="Oynatma Hızı"
                >
                  {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                </button>
              </>
            )}

            <button className="native-fullscreen-btn" onClick={toggleFullscreen} title="Tam Ekran" aria-label="Tam Ekran Yap / Çık">
              <Maximize size={18} />
            </button>

            {isQualityMenuOpen && (
              <div className="native-quality-menu" onClick={e => e.stopPropagation()}>
                {availableQualities.map(item => (
                  <div key={item.value} className={`quality-item ${qualityMode === item.value ? 'active' : ''}`} onClick={() => handleQualityChange(item.value)}>
                    <span>{item.label}</span>
                    {qualityMode === item.value && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}

            {isSettingsOpen && (
              <div className="native-speed-menu" onClick={e => e.stopPropagation()}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <div key={rate} className={`speed-item ${playbackRate === rate ? 'active' : ''}`} onClick={() => changePlaybackRate(rate)}>
                    <span>{rate === 1 ? 'Normal' : `${rate}x`}</span>
                    {playbackRate === rate && <Check size={14} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default VideoPlayer;
