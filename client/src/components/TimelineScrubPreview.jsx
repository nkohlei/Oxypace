import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './TimelineScrubPreview.css';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const defaultFormatTime = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const TimelineScrubPreview = ({
    currentTime = 0,
    duration = 0,
    bufferedPct = 0,
    previewSrc = '',
    containerRef = null,
    isLive = false,
    disabled = false,
    formatTime = defaultFormatTime,
    onScrubStart,
    onScrubMove,
    onCommitSeek,
    onScrubEnd,
    className = '',
}) => {
    const trackRef = useRef(null);
    const canvasRef = useRef(null);
    const probeVideoRef = useRef(null);
    const hlsRef = useRef(null);
    const probeReadyRef = useRef(false);
    const pendingSeekRef = useRef(null);
    const isSeekingRef = useRef(false);
    const loadedSrcRef = useRef('');
    const dragActiveRef = useRef(false);

    const [playerBox, setPlayerBox] = useState({ width: 380, height: 220 });
    const [trackWidth, setTrackWidth] = useState(320);
    const [videoAspect, setVideoAspect] = useState(16 / 9);
    const [previewState, setPreviewState] = useState({
        visible: false,
        dragging: false,
        ratio: 0,
        time: 0,
    });
    const [hasActivatedProbe, setHasActivatedProbe] = useState(false);
    const [frameReady, setFrameReady] = useState(false);
    const [frameBlocked, setFrameBlocked] = useState(false);

    // Track displayed player dimensions so preview box scales identically from feed -> fullscreen
    useEffect(() => {
        const measureEl = containerRef?.current || trackRef.current?.parentElement;
        if (!measureEl || typeof ResizeObserver === 'undefined') return;

        const updateSize = () => {
            const rect = measureEl.getBoundingClientRect();
            const tRect = trackRef.current?.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setPlayerBox({ width: rect.width, height: rect.height });
            }
            if (tRect && tRect.width > 0) {
                setTrackWidth(tRect.width);
            }
        };

        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(measureEl);
        if (trackRef.current) ro.observe(trackRef.current);
        return () => ro.disconnect();
    }, [containerRef]);

    // Reset probe state when media source changes
    useEffect(() => {
        probeReadyRef.current = false;
        pendingSeekRef.current = null;
        isSeekingRef.current = false;
        setFrameReady(false);
        setFrameBlocked(false);

        if (hlsRef.current) {
            try {
                hlsRef.current.destroy();
            } catch (_) {}
            hlsRef.current = null;
        }
        loadedSrcRef.current = '';
        if (probeVideoRef.current) {
            try {
                probeVideoRef.current.removeAttribute('src');
                probeVideoRef.current.load();
            } catch (_) {}
        }
    }, [previewSrc]);

    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                try {
                    hlsRef.current.destroy();
                } catch (_) {}
                hlsRef.current = null;
            }
        };
    }, []);

    // Lazily attach hidden muted probe video for timeline frame previews
    useEffect(() => {
        if (!hasActivatedProbe || !previewSrc || isLive || frameBlocked) return;
        const vid = probeVideoRef.current;
        if (!vid || loadedSrcRef.current === previewSrc) return;

        loadedSrcRef.current = previewSrc;
        probeReadyRef.current = false;
        const lower = previewSrc.toLowerCase();
        const isHls = lower.includes('.m3u8');

        const handleLoadedMetadata = () => {
            probeReadyRef.current = true;
            if (vid.videoWidth > 0 && vid.videoHeight > 0) {
                setVideoAspect(clamp(vid.videoWidth / vid.videoHeight, 9 / 16, 21 / 9));
            }
            if (pendingSeekRef.current !== null) {
                const target = pendingSeekRef.current;
                pendingSeekRef.current = null;
                triggerSeek(target);
            }
        };

        const handleSeeked = () => {
            isSeekingRef.current = false;
            drawCurrentFrame();
            if (pendingSeekRef.current !== null) {
                const next = pendingSeekRef.current;
                pendingSeekRef.current = null;
                triggerSeek(next);
            }
        };

        const handleError = () => {
            setFrameBlocked(true);
            setFrameReady(false);
        };

        vid.addEventListener('loadedmetadata', handleLoadedMetadata);
        vid.addEventListener('seeked', handleSeeked);
        vid.addEventListener('error', handleError);

        if (isHls && Hls.isSupported()) {
            const hls = new Hls({
                autoStartLoad: true,
                maxBufferLength: 6,
                maxMaxBufferLength: 10,
                startLevel: 0,
                capLevelToPlayerSize: true,
                enableWorker: false,
            });
            hlsRef.current = hls;
            hls.loadSource(previewSrc);
            hls.attachMedia(vid);
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data?.fatal) {
                    setFrameBlocked(true);
                }
            });
        } else {
            vid.src = previewSrc;
            try {
                vid.load();
            } catch (_) {}
        }

        return () => {
            vid.removeEventListener('loadedmetadata', handleLoadedMetadata);
            vid.removeEventListener('seeked', handleSeeked);
            vid.removeEventListener('error', handleError);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasActivatedProbe, previewSrc, isLive, frameBlocked]);

    const drawCurrentFrame = () => {
        const vid = probeVideoRef.current;
        const canvas = canvasRef.current;
        if (!vid || !canvas || vid.readyState < 2 || !vid.videoWidth || !vid.videoHeight) return;
        try {
            const targetW = 320;
            const targetH = Math.max(90, Math.round(targetW / (vid.videoWidth / vid.videoHeight)));
            if (canvas.width !== targetW) canvas.width = targetW;
            if (canvas.height !== targetH) canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(vid, 0, 0, targetW, targetH);
            setFrameReady(true);
        } catch {
            setFrameBlocked(true);
            setFrameReady(false);
        }
    };

    const triggerSeek = (targetSeconds) => {
        const vid = probeVideoRef.current;
        if (!vid || !probeReadyRef.current || frameBlocked) {
            pendingSeekRef.current = targetSeconds;
            return;
        }
        if (isSeekingRef.current) {
            pendingSeekRef.current = targetSeconds;
            return;
        }
        const safeDur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : duration;
        const clamped = clamp(targetSeconds, 0, Math.max(0.05, safeDur - 0.05));
        if (Math.abs((vid.currentTime || 0) - clamped) < 0.08) {
            drawCurrentFrame();
            return;
        }
        isSeekingRef.current = true;
        try {
            vid.currentTime = clamped;
        } catch {
            isSeekingRef.current = false;
        }
    };

    const getPointFromClientX = (clientX) => {
        const el = trackRef.current;
        if (!el || duration <= 0) return { ratio: 0, time: 0 };
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.width !== trackWidth) {
            setTrackWidth(rect.width);
        }
        const ratio = rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
        return { ratio, time: ratio * duration };
    };

    const updatePreviewPoint = (clientX, dragging) => {
        if (isLive || duration <= 0 || disabled) return;
        if (!hasActivatedProbe && previewSrc) setHasActivatedProbe(true);
        const { ratio, time } = getPointFromClientX(clientX);
        setPreviewState({ visible: true, dragging, ratio, time });
        if (previewSrc && !frameBlocked) {
            triggerSeek(time);
        }
        if (dragging) {
            onScrubMove?.(time, ratio);
        }
        return time;
    };

    const handlePointerDown = (e) => {
        if (disabled || isLive || duration <= 0) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        dragActiveRef.current = true;
        onScrubStart?.();
        let lastTime = updatePreviewPoint(e.clientX, true);

        const handleMove = (ev) => {
            if (!dragActiveRef.current) return;
            lastTime = updatePreviewPoint(ev.clientX, true);
        };

        const finishDrag = (ev, commit) => {
            if (!dragActiveRef.current) return;
            dragActiveRef.current = false;
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleCancel);

            const finalTime =
                ev && typeof ev.clientX === 'number'
                    ? getPointFromClientX(ev.clientX).time
                    : lastTime || 0;

            if (commit) {
                onCommitSeek?.(finalTime);
            }
            onScrubEnd?.();
            setPreviewState((prev) => ({
                ...prev,
                dragging: false,
                visible: false,
            }));
        };

        const handleUp = (ev) => finishDrag(ev, true);
        const handleCancel = (ev) => finishDrag(ev, false);

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleCancel);
    };

    const handlePointerMoveHover = (e) => {
        if (dragActiveRef.current || e.pointerType !== 'mouse' || isLive || duration <= 0 || disabled) return;
        updatePreviewPoint(e.clientX, false);
    };

    const handlePointerLeaveHover = () => {
        if (dragActiveRef.current) return;
        setPreviewState((prev) => ({ ...prev, visible: false }));
    };

    // Proportional size relative to displayed video player box
    const rawCardW = playerBox.width * 0.23;
    const unclampedW = clamp(rawCardW, 80, 250);
    const maxCardH = Math.max(46, playerBox.height * 0.34);
    let cardWidth = unclampedW;
    let cardHeight = Math.round(cardWidth / videoAspect);
    if (cardHeight > maxCardH) {
        cardHeight = Math.round(maxCardH);
        cardWidth = Math.round(clamp(cardHeight * videoAspect, 72, 250));
    }

    const timeFontSize = clamp(Math.round(cardWidth * 0.092), 10, 14);
    const halfCard = cardWidth / 2;
    const minLeft = halfCard + 4;
    const maxLeft = Math.max(minLeft, trackWidth - halfCard - 4);
    const cardCenterPx = clamp(previewState.ratio * trackWidth, minLeft, maxLeft);

    const activeRatio = previewState.dragging
        ? previewState.ratio
        : duration > 0
            ? clamp(currentTime / duration, 0, 1)
            : 0;
    const activePct = activeRatio * 100;

    return (
        <div
            ref={trackRef}
            className={`native-progress-area tsp-progress-area ${previewState.dragging ? 'is-scrubbing' : ''} ${className}`.trim()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMoveHover}
            onPointerLeave={handlePointerLeaveHover}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Hidden lightweight frame extractor */}
            {hasActivatedProbe && previewSrc && !isLive && !frameBlocked && (
                <video
                    ref={probeVideoRef}
                    className="tsp-probe-video"
                    muted
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                />
            )}

            {/* Minimal floating frame preview & timestamp scaled proportionally to player box */}
            {previewState.visible && !isLive && duration > 0 && (
                <div
                    className="tsp-preview-popover"
                    style={{ left: `${cardCenterPx}px` }}
                >
                    {previewSrc && !frameBlocked && (
                        <div
                            className={`tsp-preview-frame ${frameReady ? 'is-ready' : 'is-loading'}`}
                            style={{
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                            }}
                        >
                            <canvas ref={canvasRef} className="tsp-preview-canvas" />
                        </div>
                    )}
                    <div
                        className="tsp-preview-time"
                        style={{ fontSize: `${timeFontSize}px` }}
                    >
                        {formatTime(previewState.time)}
                    </div>
                </div>
            )}

            <div className="native-progress-track tsp-track">
                {bufferedPct > 0 && (
                    <div
                        className="native-buffered-fill"
                        style={{ width: `${clamp(bufferedPct, 0, 100)}%` }}
                    />
                )}
                <div
                    className="native-progress-fill"
                    style={{ width: `${activePct}%` }}
                />
                <div
                    className="native-progress-thumb"
                    style={{ left: `clamp(5px, ${activePct}%, calc(100% - 5px))` }}
                />
            </div>
        </div>
    );
};

export default TimelineScrubPreview;

