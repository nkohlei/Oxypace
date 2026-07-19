import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Check, Maximize, Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
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


const checkCenterVideo = () => {
  if (mountedVideos.size === 0) return;
  if (typeof document !== 'undefined' && document.hidden) {
    mountedVideos.forEach(video => {
      if (!video.paused) video.pause();
    });
    return;
  }
  const isFs = !!document.fullscreenElement;
  if (isFs) {
    mountedVideos.forEach(video => {
      const amIFs = document.fullscreenElement.contains(video);
      if (!amIFs && !video.paused) video.pause();
    });
    return;
  }
  const centerY = window.innerHeight / 2;
  let closestVideo = null;
  let minDistance = Infinity;
  mountedVideos.forEach(video => {
    if (!video) return;
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // Skip hidden elements (e.g. background cached pages)
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = visibleHeight / (rect.height || 1);
      if (ratio > 0.2) {
        const vCenter = rect.top + rect.height / 2;
        const distance = Math.abs(vCenter - centerY);
        if (distance < minDistance) { minDistance = distance; closestVideo = video; }
      }
    }
  });
  mountedVideos.forEach(video => {
    if (video === closestVideo) {
      if (video.dataset.userPaused !== 'true' && video.paused) video.play().catch(() => {});
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
  window.addEventListener('scroll', handleGlobalScroll, true);
  window.addEventListener('resize', handleGlobalScroll);
  const onFullscreenChange = (e) => {
    handleGlobalScroll(e);
    if (!document.fullscreenElement && !Capacitor.isNativePlatform()) {
      setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; document.documentElement.scrollTop = 0; }, 10);
    }
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
}

const VideoPlayer = ({ src, qualities, videoUrl, lowVideoUrl, video144, video360, video720, video1080, video2160, videoOriginal, poster, className, isProcessing = false, processingProgress = 0, estimatedTime = 'Hesaplanıyor...', watchParty, onReady, onPlay, onPause, onSeek, volume: propVolume, muted: propMuted, onVolumeChange, onMuteChange }) => {
  const { user } = useAuth();
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const initializedPrefRef = useRef(false);
  const hlsInstanceRef = useRef(null);

  // Which video is currently displayed to the user
  const activeVideoRef = useRef('A'); // 'A' | 'B' — ref not state to avoid re-render races
  const [activeVideo, setActiveVideo] = useState('A'); // only for styling

  // Pending swap guard — prevents double swaps
  const swapPendingRef = useRef(false);

  const globalMuted = useGlobalStore(state => state.isMuted);
  const setIsMuted = useGlobalStore(state => state.setIsMuted);
  const isMuted = propMuted !== undefined ? propMuted : globalMuted;
  const volume = propVolume !== undefined ? propVolume : 0.5;
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState(null);
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

  const lastProgrammaticSeekTimeRef = useRef(null);
  const isSyncingRef = useRef(false);
  const prevIsPlayingRef = useRef(false);

  useEffect(() => {
    if (!watchParty) return;
    const el = getActiveEl();
    if (!el) return;

    if (watchParty.isPlaying && el.paused) {
      el.play().catch(() => {});
      setIsPaused(false);
    } else if (!watchParty.isPlaying && !el.paused) {
      el.pause();
      setIsPaused(true);
    }

    let expectedTime = watchParty.currentTime;
    if (watchParty.isPlaying && watchParty.lastUpdated) {
        const elapsed = (Date.now() - watchParty.lastUpdated) / 1000;
        expectedTime += elapsed;
    }

    const timeDiff = Math.abs(el.currentTime - expectedTime);
    const isPlayTransition = watchParty.isPlaying && !prevIsPlayingRef.current;
    const threshold = isPlayTransition ? 0.1 : (watchParty.isPlaying ? 0.8 : 0.3);

    if (timeDiff > threshold) {
        isSyncingRef.current = true;
        lastProgrammaticSeekTimeRef.current = expectedTime;
        el.currentTime = expectedTime;
        setTimeout(() => {
            isSyncingRef.current = false;
        }, 500);
    }

    prevIsPlayingRef.current = watchParty.isPlaying;
  }, [watchParty?.currentTime, watchParty?.isPlaying, watchParty?.lastUpdated, activeVideo]);

  // --- URL resolution helper to prevent double resolution/proxying ---
  const resolveVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/api/media/') || url.startsWith('/r2-media/')) {
      return url;
    }
    return getImageUrl(url);
  };

  // --- URL resolution ---
  const src144  = resolveVideoUrl(video144  || qualities?.video144  || qualities?.p144  || qualities?.['144p']  || qualities?.low || lowVideoUrl || src);
  const src360  = resolveVideoUrl(video360  || qualities?.video360  || qualities?.p360  || qualities?.['360p']  || src144);
  const src720  = resolveVideoUrl(video720  || qualities?.video720  || qualities?.p720  || qualities?.['720p']  || src360);
  const src1080 = resolveVideoUrl(video1080 || qualities?.video1080 || qualities?.p1080 || qualities?.['1080p'] || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const src2160 = resolveVideoUrl(video2160 || qualities?.video2160 || qualities?.p2160 || qualities?.['2160p'] || src1080);

  const has2160 = !!(video2160 || qualities?.video2160 || qualities?.p2160 || qualities?.['2160p']);
  const has1080 = !!(video1080 || qualities?.video1080 || qualities?.p1080 || qualities?.['1080p'] || videoOriginal || qualities?.videoOriginal || qualities?.high || videoUrl || src);
  const has720  = !!(video720  || qualities?.video720  || qualities?.p720  || qualities?.['720p']);
  const has360  = !!(video360  || qualities?.video360  || qualities?.p360  || qualities?.['360p']);
  const has144  = !!(video144  || qualities?.video144  || qualities?.p144  || qualities?.['144p']);

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
    if (isSlowConnection()) return src144;
    if (maxResolution === '2160p') return src2160;
    if (maxResolution === '1080p') return src1080;
    if (maxResolution === '720p') return src720;
    if (maxResolution === '360p') return src360;
    return src144;
  }, [src144, src360, src720, src1080, src2160, maxResolution]);

  const getPreferredSrc = useCallback(() => {
    const pref = user?.settings?.video?.playbackQuality || 'auto';
    if (pref === 'performance') {
      if (has2160) return src2160;
      if (has1080) return src1080;
      if (has720) return src720;
      if (has360) return src360;
      return src144;
    } else if (pref === 'saver') {
      if (has720) return src720;
      if (has360) return src360;
      if (has144) return src144;
      if (has1080) return src1080;
      return src2160;
    } else if (pref === 'lowest') {
      if (has144) return src144;
      if (has360) return src360;
      if (has720) return src720;
      if (has1080) return src1080;
      return src2160;
    }
    return getBestSrc();
  }, [user, has2160, has1080, has720, has360, has144, src2160, src1080, src720, src360, src144, getBestSrc]);

  const availableQualities = [{ value: 'auto', label: 'Oto' }];
  if (has2160) availableQualities.push({ value: '2160', label: '2160p' });
  if (has1080) availableQualities.push({ value: '1080', label: '1080p' });
  if (has720)  availableQualities.push({ value: '720',  label: '720p'  });
  if (has360)  availableQualities.push({ value: '360',  label: '360p'  });
  if (has144)  availableQualities.push({ value: '144',  label: '144p'  });

  // --- Helpers ---
  const getActiveEl  = () => (activeVideoRef.current === 'A' ? videoRefA : videoRefB).current;
  const getInactiveEl = () => (activeVideoRef.current === 'A' ? videoRefB : videoRefA).current;
  const getInactiveId = () => (activeVideoRef.current === 'A' ? 'B' : 'A');

  const getHlsProxyUrl = useCallback((url) => {
    if (!url) return '';
    if (url.includes('/proxy-hls') || url.startsWith('/api/media/proxy-hls') || url.startsWith('http://localhost') || url.startsWith('https://oxypac3.vercel.app')) {
      return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `/api/media/proxy-hls?url=${encodeURIComponent(url)}`;
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
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
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
      } else {
        loadHls().then((HlsLib) => {
          if (!HlsLib.isSupported()) {
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
            const pref = user?.settings?.video?.playbackQuality || 'auto';
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
      }
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

  // Clean up HLS instance on unmount
  useEffect(() => {
    return () => {
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
    if (!user) return;
    const pref = user?.settings?.video?.playbackQuality || 'auto';
    
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
    if (activeEl && targetSrc && activeEl.src !== targetSrc && activeEl.currentSrc !== targetSrc) {
      setVideoSource(activeEl, targetSrc);
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
  // THE CORE: Instant quality swap using the dual-buffer strategy
  // Active video keeps playing. We prepare inactive video in the background.
  // Correct sequence:
  //   1. Set src on inactive
  //   2. On loadedmetadata → seek to LIVE active position (not snapshot)
  //   3. On seeked → call play() so browser starts buffering from correct frame
  //   4. On playing (real decoded frame) → swap with zero extra seeks
  // ─────────────────────────────────────────────────────────────────────────
  const initiateQualitySwap = useCallback((newSrc) => {
    const activeEl   = getActiveEl();
    const inactiveEl = getInactiveEl();
    if (!activeEl || !inactiveEl) return;

    // Already playing this src → nothing to do
    if (activeEl.src === newSrc || activeEl.currentSrc === newSrc) return;

    // A swap is already in progress → ignore (prevents cascade)
    if (swapPendingRef.current) {
      console.log('[VideoPlayer] Swap already in progress, skipping.');
      return;
    }

    swapPendingRef.current = true;

    const wasPlaying = !activeEl.paused;

    console.log(`[VideoPlayer] Initiating swap to ${newSrc}, wasPlaying=${wasPlaying}`);

    // ── Prepare inactive element ──────────────────────────────────────────
    setVideoSource(inactiveEl, newSrc);
    inactiveEl.muted = isMuted;
    inactiveEl.volume = volume;
    inactiveEl.playbackRate = playbackRate;
    inactiveEl.loop  = true;
    inactiveEl.preload = 'auto';
    inactiveEl.setAttribute('playsinline', '');

    // Step 1: metadata loaded → seek to where active video IS RIGHT NOW
    const onMeta = () => {
      inactiveEl.removeEventListener('loadedmetadata', onMeta);
      const liveTime = activeEl.currentTime;
      console.log(`[VideoPlayer] onMeta: seeking inactive to live time ${liveTime.toFixed(3)}s`);
      inactiveEl.currentTime = liveTime;
    };

    // Step 2: seek completed → now start playing so browser renders frames
    const onSeeked = () => {
      inactiveEl.removeEventListener('seeked', onSeeked);
      if (wasPlaying) {
        inactiveEl.play().catch(() => {});
      } else {
        onPlaying();
      }
    };

    // Step 3: real decoded frame is rendering → swap instantly, no extra seek
    const onPlaying = () => {
      inactiveEl.removeEventListener('playing', onPlaying);
      inactiveEl.removeEventListener('error', onError);

      const newId = getInactiveId();
      console.log(`[VideoPlayer] Swap complete → now showing ${newId} at ${inactiveEl.currentTime.toFixed(3)}s`);

      // Update ref immediately (no async state lag)
      activeVideoRef.current = newId;
      setActiveVideo(newId);

      // Pause the old active element
      activeEl.pause();
      // Register new one for scroll-center detection
      mountedVideos.delete(activeEl);
      mountedVideos.add(inactiveEl);

      swapPendingRef.current = false;
    };

    // On error → abort swap, release guard
    const onError = () => {
      inactiveEl.removeEventListener('playing', onPlaying);
      inactiveEl.removeEventListener('error', onError);
      inactiveEl.removeEventListener('loadedmetadata', onMeta);
      inactiveEl.removeEventListener('seeked', onSeeked);
      swapPendingRef.current = false;
      console.warn('[VideoPlayer] Swap aborted due to load error on inactive element.');
    };

    inactiveEl.addEventListener('loadedmetadata', onMeta);
    inactiveEl.addEventListener('seeked', onSeeked);
    inactiveEl.addEventListener('playing', onPlaying, { once: true });
    inactiveEl.addEventListener('error', onError, { once: true });

    // Trigger load (only for non-HLS since initHls handles HLS loading)
    if (!isHls(newSrc)) {
      inactiveEl.load();
    }
  }, [isMuted, playbackRate, setVideoSource]);

  // ─── Auto-quality stall handling ────────────────────────────────────────
  const handleWaiting = useCallback(() => {
    setIsWaiting(true);
    if (qualityMode !== 'auto') return;
    if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);

    waitingTimerRef.current = setTimeout(() => {
      const activeEl = getActiveEl();
      if (!activeEl || activeEl.paused) return;

      // Drop straight to lowest quality for instant continuous playback
      const lowestSrc = src144 || src360 || src;
      if (lowestSrc && activeEl.src !== lowestSrc && activeEl.currentSrc !== lowestSrc) {
        console.log('[VideoPlayer] Auto: stall → dropping to lowest quality immediately');
        initiateQualitySwap(lowestSrc);
      }
    }, 600);
  }, [qualityMode, src144, src360, src, initiateQualitySwap]);

  const handlePlaying = useCallback(() => {
    setIsWaiting(false);
    if (waitingTimerRef.current) { clearTimeout(waitingTimerRef.current); waitingTimerRef.current = null; }
  }, []);

  // ─── Manual quality selector ──────────────────────────────────────────
  const handleQualityChange = useCallback((mode) => {
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
          if (entry.isIntersecting) {
            handleGlobalScroll();
          } else {
            // Pauses immediately when it goes out of view
            if (!el.paused) {
              el.pause();
            }
          }
        });
      }, { threshold: [0.0, 0.2] });
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

  // ─── Controls auto-hide ───────────────────────────────────────────────
  const startControlsTimeout = useCallback((ms = 1500) => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isSettingsOpen || isQualityMenuOpen) return;
    const el = getActiveEl();
    if (el && !el.paused) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), ms);
    }
  }, [isSettingsOpen, isQualityMenuOpen]);

  useEffect(() => {
    if (isPaused) { setShowControls(true); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); }
    else          { startControlsTimeout(1500); }
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
    handleTimeUpdate();
    if (watchParty && onReady) {
      onReady();
    }
  }, [activeVideo, naturalDimensions, handleTimeUpdate, watchParty, onReady]);

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

  const handleSeekOffset = useCallback((offset) => {
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

  const handleVideoClick = useCallback((e) => {
    e.stopPropagation();
    if (isSettingsOpen || isQualityMenuOpen) { setIsSettingsOpen(false); setIsQualityMenuOpen(false); return; }
    
    // If controls are hidden, the first click should only show them and reset auto-hide timeout
    if (!showControls) {
      setShowControls(true);
      startControlsTimeout(2000);
      return;
    }
    
    const el = getActiveEl(); if (!el) return;
    if (watchParty) {
      if (el.paused) {
        el.play().catch(() => {});
        setIsPaused(false);
        if (onPlay) onPlay(el.currentTime);
      } else {
        el.pause();
        setIsPaused(true);
        if (onPause) onPause(el.currentTime);
      }
      return;
    }
    if (el.paused) { el.dataset.userPaused = 'false'; el.play().catch(() => {}); }
    else           { el.dataset.userPaused = 'true';  el.pause(); }
  }, [isSettingsOpen, isQualityMenuOpen, activeVideo, showControls, startControlsTimeout, watchParty, onPlay, onPause]);

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
    if (isSettingsOpen || isQualityMenuOpen) { setShowControls(true); return; }
    const el = getActiveEl();
    if (el?.paused) { setShowControls(true); return; }
    const isFs = !!document.fullscreenElement;
    if (isFs) {
      const t = 10;
      if (e.clientX <= t || e.clientX >= window.innerWidth - t || e.clientY <= t || e.clientY >= window.innerHeight - t) {
        setShowControls(false); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); return;
      }
    }
    setShowControls(true); startControlsTimeout(1500);
  }, [isSettingsOpen, isQualityMenuOpen, startControlsTimeout, activeVideo]);

  const handleMouseEnter = useCallback(() => {
    const el = getActiveEl();
    if (el?.paused) { setShowControls(true); return; }
    setShowControls(true); startControlsTimeout(1500);
  }, [startControlsTimeout, activeVideo]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  // Calculate aspect ratio and styles based on natural dimensions
  const hasDimensions = naturalDimensions && naturalDimensions.width && naturalDimensions.height;
  const isTweet = className && className.includes('quoted-player');

  let containerStyle = {};
  if (watchParty) {
    containerStyle = {
      width: '100%',
      height: '100%',
      background: '#000000',
    };
  } else if (isTweet) {
    containerStyle = {
      aspectRatio: '16/9',
      width: '100%',
    };
  } else if (hasDimensions) {
    const { width, height } = naturalDimensions;
    const ratio = width / height;
    
    // Bounds: 9:16 (0.5625) and 16:9 (1.7778)
    const isAbsurd = ratio < 0.5625 || ratio > 1.7778;
    
    if (isAbsurd) {
      // Absurd ratio: clamp the container to the nearest boundary and show black background
      const clampedRatio = ratio < 0.5625 ? 0.5625 : 1.7778;
      containerStyle = {
        aspectRatio: `${clampedRatio}`,
        background: '#000000',
        width: '100%',
      };
    } else {
      // Normal ratio: use the exact original aspect ratio and black background if it is taller than 16:9
      containerStyle = {
        aspectRatio: `${width}/${height}`,
        background: ratio < 1.7778 ? '#000000' : 'transparent',
        boxShadow: ratio < 1.7778 ? '0 10px 40px -15px rgba(0, 0, 0, 0.7)' : 'none',
        width: '100%',
      };
    }
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
      transition: 'opacity 0.08s linear'   // near-instant: just prevents 1-frame black flash
    };
  };

  return (
    <div
      className={`native-player-container left-aligned v16-scale ${className || ''} ${isQualityMenuOpen || isSettingsOpen ? 'has-open-menu' : ''}`}
      style={containerStyle}
      onClick={e => e.stopPropagation()}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
    >
      {isProcessing && (
        <div className="processing-overlay-orange">
          <span className="processing-dot-orange" />
          <span>⚡ Kaliteler Hazırlanıyor (%{processingProgress}) - Kalan: {estimatedTime}</span>
        </div>
      )}

      {isWaiting && (
        <div className="native-loader-overlay">
          <div className="pro-spinner" />
        </div>
      )}

      {/* VIDEO A */}
      <video
        ref={videoRefA}
        poster={poster}
        className="native-video-element"
        style={videoStyle('A')}
        playsInline loop={!isAdPlaying} preload="auto"
        crossOrigin={isHls(src) || (src && src.startsWith('http') && !src.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) ? undefined : "anonymous"}
        onClick={handleVideoClick}
        onTimeUpdate={activeVideo === 'A' ? handleTimeUpdate : undefined}
        onLoadedMetadata={activeVideo === 'A' ? handleLoadedMetadataActive : undefined}
        onWaiting={activeVideo === 'A' ? handleWaiting : undefined}
        onStalled={activeVideo === 'A' ? handleWaiting : undefined}
        onPlaying={activeVideo === 'A' ? handlePlaying : undefined}
        onCanPlay={activeVideo === 'A' ? handlePlaying : undefined}
        onEnded={activeVideo === 'A' ? handleVideoEnded : undefined}
        onError={activeVideo === 'A' ? handleVideoError : undefined}
        onSeeking={activeVideo === 'A' ? () => setIsWaiting(true) : undefined}
        onSeeked={activeVideo === 'A' ? () => setIsWaiting(false) : undefined}
        onLoadStart={activeVideo === 'A' ? () => setIsWaiting(true) : undefined}
      />

      {/* VIDEO B */}
      <video
        ref={videoRefB}
        poster={poster}
        className="native-video-element"
        style={videoStyle('B')}
        playsInline loop={!isAdPlaying} preload="auto"
        crossOrigin={isHls(src) || (src && src.startsWith('http') && !src.includes('pub-094a78010abf4ebf9726834268946cb8.r2.dev')) ? undefined : "anonymous"}
        onClick={handleVideoClick}
        onTimeUpdate={activeVideo === 'B' ? handleTimeUpdate : undefined}
        onLoadedMetadata={activeVideo === 'B' ? handleLoadedMetadataActive : undefined}
        onWaiting={activeVideo === 'B' ? handleWaiting : undefined}
        onStalled={activeVideo === 'B' ? handleWaiting : undefined}
        onPlaying={activeVideo === 'B' ? handlePlaying : undefined}
        onCanPlay={activeVideo === 'B' ? handlePlaying : undefined}
        onEnded={activeVideo === 'B' ? handleVideoEnded : undefined}
        onError={activeVideo === 'B' ? handleVideoError : undefined}
        onSeeking={activeVideo === 'B' ? () => setIsWaiting(true) : undefined}
        onSeeked={activeVideo === 'B' ? () => setIsWaiting(false) : undefined}
        onLoadStart={activeVideo === 'B' ? () => setIsWaiting(true) : undefined}
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

      {!watchParty && (
        <button className={`native-mute-toggle ${!showControls ? 'controls-hidden' : ''}`} onClick={toggleMute} aria-label="Sesi Kapat / Aç">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

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
            <button className="native-play-pause-btn" onClick={handleVideoClick} aria-label="Oynat / Duraklat">
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>
            <div className="native-time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="native-time-sep">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {!isAdPlaying && (
              <>
                <button className="native-skip-btn" onClick={() => handleSeekOffset(-10)} title="10 Saniye Geri">
                  <RotateCcw size={16} />
                </button>
                <button className="native-skip-btn" onClick={() => handleSeekOffset(10)} title="10 Saniye İleri">
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
    </div>
  );
};

export default VideoPlayer;
