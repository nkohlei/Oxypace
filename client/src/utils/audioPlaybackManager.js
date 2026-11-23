import { Capacitor, registerPlugin } from '@capacitor/core';

const MediaControls = registerPlugin('MediaControls');
const listeners = new Set();

class AudioPlaybackManager {
    constructor() {
        this.activeId = null;
        this.activeElement = null;
        this.activeControls = null;
        this.lastNativeSyncAt = 0;
        this.clearTimer = null;
        this._initNativeActionListener();
    }

    _initNativeActionListener() {
        if (typeof window === 'undefined' || this._nativeListenerAttached) return;
        this._nativeListenerAttached = true;
        window.addEventListener('oxypace:native_media_action', (e) => {
            const detail = e?.detail || {};
            const action = detail.action;
            if (!action) return;

            if (action === 'play') {
                if (typeof this.activeControls?.onPlay === 'function') {
                    this.activeControls.onPlay();
                } else if (this.activeElement) {
                    this.activeElement.play().catch(() => {});
                }
            } else if (action === 'pause') {
                if (typeof this.activeControls?.onPause === 'function') {
                    this.activeControls.onPause();
                } else if (this.activeElement) {
                    this.activeElement.pause();
                }
            } else if (action === 'toggle') {
                if (this.activeElement && !this.activeElement.paused) {
                    this.activeControls?.onPause?.() || this.activeElement.pause();
                } else {
                    this.activeControls?.onPlay?.() || this.activeElement?.play()?.catch(() => {});
                }
            } else if (action === 'next') {
                this.activeControls?.onNext?.();
            } else if (action === 'prev') {
                this.activeControls?.onPrev?.();
            } else if (action === 'seek') {
                const pos = Number(detail.position);
                if (this.activeElement && Number.isFinite(pos) && pos >= 0) {
                    this.activeElement.currentTime = pos;
                    this.updatePositionState(this.activeElement);
                }
            } else if (action === 'stop') {
                if (typeof this.activeControls?.onPause === 'function') {
                    this.activeControls.onPause();
                } else if (this.activeElement) {
                    this.activeElement.pause();
                }
            }
        });
    }

    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    _notifyListeners() {
        const snapshot = {
            activeId: this.activeId,
            isPlaying: Boolean(this.activeElement && !this.activeElement.paused && !this.activeElement.ended),
        };
        listeners.forEach((fn) => {
            try {
                fn(snapshot);
            } catch (_) {}
        });
    }

    _syncNativeControls(isPlayingNow, force = false) {
        if (!Capacitor.isNativePlatform()) return;
        const now = Date.now();
        if (!force && now - this.lastNativeSyncAt < 950) return;
        this.lastNativeSyncAt = now;

        const el = this.activeElement;
        const controls = this.activeControls || {};
        const metadata = controls.metadata || {};
        const durationSec = el && Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
        const posSec = el && Number.isFinite(el.currentTime) && el.currentTime >= 0 ? el.currentTime : 0;

        try {
            MediaControls.update({
                title: metadata.title || 'Ses Dosyası',
                artist: metadata.artist || 'Oxypace',
                album: metadata.album || 'Oxypace Ses',
                artworkUrl: metadata.artwork || '',
                isPlaying: Boolean(isPlayingNow),
                hasNext: typeof controls.onNext === 'function',
                hasPrev: typeof controls.onPrev === 'function',
                durationMs: Math.round(durationSec * 1000),
                positionMs: Math.round(posSec * 1000),
            }).catch(() => {});
        } catch (_) {}
    }

    _clearNativeControls() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            MediaControls.clear().catch(() => {});
        } catch (_) {}
    }

    pauseAllExcept(targetEl = null) {
        try {
            const allAudio = document.querySelectorAll('audio');
            allAudio.forEach((el) => {
                if (el && el !== targetEl && !el.srcObject && !el.paused) {
                    try {
                        el.pause();
                    } catch (_) {}
                }
            });
        } catch (_) {}

        if (this.activeElement && this.activeElement !== targetEl) {
            try {
                if (!this.activeElement.paused) {
                    this.activeElement.pause();
                }
            } catch (_) {}
            if (typeof this.activeControls?.onExternalPause === 'function') {
                this.activeControls.onExternalPause();
            }
        }
    }

    notifyPlay(id, el, controls = {}) {
        if (this.clearTimer) {
            clearTimeout(this.clearTimer);
            this.clearTimer = null;
        }
        this.pauseAllExcept(el);
        this.activeId = id;
        this.activeElement = el;
        this.activeControls = controls;
        this._syncMediaSession(controls.metadata || {}, 'playing');
        this.updatePositionState(el);
        this._syncNativeControls(true, true);
        this._notifyListeners();
    }

    notifyPause(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this._setMediaPlaybackState('paused');
            this._syncNativeControls(false, true);
            this._notifyListeners();
        }
    }

    notifyEnded(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this._setMediaPlaybackState('none');
            this._notifyListeners();
            if (this.clearTimer) clearTimeout(this.clearTimer);
            // Delay slightly so sequential multi-audio auto-next keeps the foreground service alive seamlessly
            this.clearTimer = setTimeout(() => {
                this.clearTimer = null;
                if (!this.activeElement || this.activeElement.paused || this.activeElement.ended) {
                    this._clearNativeControls();
                }
            }, 400);
        }
    }

    unregister(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this.activeId = null;
            this.activeElement = null;
            this.activeControls = null;
            this._setMediaPlaybackState('none');
            this._clearMediaSessionHandlers();
            this._clearNativeControls();
            this._notifyListeners();
        }
    }

    updatePositionState(el) {
        if (!el) return;
        if (this.activeElement !== el) return;
        if (!el.paused) {
            this._syncNativeControls(true, false);
        }
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        try {
            if (typeof navigator.mediaSession.setPositionState === 'function') {
                const duration = Number(el.duration);
                const position = Number(el.currentTime || 0);
                if (Number.isFinite(duration) && duration > 0 && Number.isFinite(position)) {
                    navigator.mediaSession.setPositionState({
                        duration,
                        playbackRate: el.playbackRate || 1,
                        position: Math.min(Math.max(0, position), duration),
                    });
                }
            }
        } catch (_) {}
    }

    _setMediaPlaybackState(state) {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.playbackState = state;
        } catch (_) {}
    }

    _syncMediaSession(metadata = {}, playbackState = 'playing') {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        try {
            if (typeof window !== 'undefined' && 'MediaMetadata' in window) {
                const artwork = metadata.artwork
                    ? [{ src: metadata.artwork, sizes: '512x512', type: 'image/png' }]
                    : [];
                navigator.mediaSession.metadata = new window.MediaMetadata({
                    title: metadata.title || 'Ses Dosyası',
                    artist: metadata.artist || 'Oxypace',
                    album: metadata.album || 'Oxypace Ses',
                    artwork,
                });
            }
        } catch (_) {}

        this._setMediaPlaybackState(playbackState);

        const setHandler = (action, handler) => {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch (_) {}
        };

        setHandler('play', () => {
            if (typeof this.activeControls?.onPlay === 'function') {
                this.activeControls.onPlay();
            } else if (this.activeElement) {
                this.activeElement.play().catch(() => {});
            }
        });

        setHandler('pause', () => {
            if (typeof this.activeControls?.onPause === 'function') {
                this.activeControls.onPause();
            } else if (this.activeElement) {
                this.activeElement.pause();
            }
        });

        setHandler('stop', () => {
            if (typeof this.activeControls?.onPause === 'function') {
                this.activeControls.onPause();
            } else if (this.activeElement) {
                this.activeElement.pause();
                this.activeElement.currentTime = 0;
            }
        });

        setHandler(
            'nexttrack',
            typeof this.activeControls?.onNext === 'function'
                ? () => this.activeControls.onNext()
                : null
        );

        setHandler(
            'previoustrack',
            typeof this.activeControls?.onPrev === 'function'
                ? () => this.activeControls.onPrev()
                : null
        );

        setHandler('seekbackward', (details) => {
            const el = this.activeElement;
            if (!el) return;
            const offset = details?.seekOffset || 10;
            el.currentTime = Math.max(0, (el.currentTime || 0) - offset);
            this.updatePositionState(el);
        });

        setHandler('seekforward', (details) => {
            const el = this.activeElement;
            if (!el) return;
            const offset = details?.seekOffset || 10;
            const max = Number.isFinite(el.duration) ? el.duration : (el.currentTime || 0) + offset;
            el.currentTime = Math.min(max, (el.currentTime || 0) + offset);
            this.updatePositionState(el);
        });

        setHandler('seekto', (details) => {
            const el = this.activeElement;
            if (!el || !Number.isFinite(details?.seekTime)) return;
            if (details.fastSeek && typeof el.fastSeek === 'function') {
                el.fastSeek(details.seekTime);
            } else {
                el.currentTime = details.seekTime;
            }
            this.updatePositionState(el);
        });
    }

    _clearMediaSessionHandlers() {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        ['play', 'pause', 'stop', 'nexttrack', 'previoustrack', 'seekbackward', 'seekforward', 'seekto'].forEach((action) => {
            try {
                navigator.mediaSession.setActionHandler(action, null);
            } catch (_) {}
        });
    }
}

export const audioPlaybackManager = new AudioPlaybackManager();
export default audioPlaybackManager;
