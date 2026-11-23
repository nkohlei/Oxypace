const listeners = new Set();

class AudioPlaybackManager {
    constructor() {
        this.activeId = null;
        this.activeElement = null;
        this.activeControls = null;
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
        this.pauseAllExcept(el);
        this.activeId = id;
        this.activeElement = el;
        this.activeControls = controls;
        this._syncMediaSession(controls.metadata || {}, 'playing');
        this.updatePositionState(el);
        this._notifyListeners();
    }

    notifyPause(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this._setMediaPlaybackState('paused');
            this._notifyListeners();
        }
    }

    notifyEnded(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this._setMediaPlaybackState('none');
            this._notifyListeners();
        }
    }

    unregister(id, el) {
        if (this.activeElement === el || this.activeId === id) {
            this.activeId = null;
            this.activeElement = null;
            this.activeControls = null;
            this._setMediaPlaybackState('none');
            this._clearMediaSessionHandlers();
            this._notifyListeners();
        }
    }

    updatePositionState(el) {
        if (!el || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        if (this.activeElement !== el) return;
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
