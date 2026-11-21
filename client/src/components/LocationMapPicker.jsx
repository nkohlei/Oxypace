import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';
import { EARTH_TEXTURES, enhanceEarthScene } from '../utils/earthAtmosphere';

const Globe = lazy(() => import('react-globe.gl'));

const MIN_ALT = 0.025;
const MAX_ALT = 3.6;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const LocationMapPicker = ({ lat, lng, disabled = false, onPick }) => {
    const hasPin =
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lng);

    const containerRef = useRef(null);
    const globeRef = useRef(null);
    const sceneFxRef = useRef(null);
    const initializedRef = useRef(false);

    // Drag vs tap guard so orbiting never accidentally moves the pin
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const draggedRef = useRef(false);

    // Smooth logarithmic zoom & mobile touch state
    const targetLogAlt = useRef(Math.log(2.15));
    const isZoomingRef = useRef(false);
    const touchRef = useRef({ mode: 'idle', startDist: 0, startLogAlt: Math.log(2.15) });

    const [size, setSize] = useState({ width: 520, height: 250 });
    const [globeReady, setGlobeReady] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const updateSize = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setSize({
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                });
            }
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Fly smoothly to pin whenever lat/lng updates externally
    useEffect(() => {
        if (!globeReady || !globeRef.current) return;
        if (hasPin) {
            const currentPov = globeRef.current.pointOfView();
            const targetAlt = initializedRef.current
                ? Math.min(currentPov?.altitude || 1.25, 0.95)
                : 1.15;
            targetLogAlt.current = Math.log(clamp(targetAlt, MIN_ALT, MAX_ALT));
            isZoomingRef.current = false;
            globeRef.current.pointOfView(
                { lat, lng, altitude: targetAlt },
                initializedRef.current ? 650 : 0
            );
            initializedRef.current = true;
        } else if (!initializedRef.current) {
            targetLogAlt.current = Math.log(2.15);
            globeRef.current.pointOfView({ lat: 39.0, lng: 35.0, altitude: 2.15 }, 0);
            initializedRef.current = true;
        }
    }, [lat, lng, hasPin, globeReady]);

    // Unified 60fps loop: atmosphere, clouds, log zoom, damping & altitude-adaptive rotation
    useEffect(() => {
        if (!globeReady) return;
        let rafId = null;
        let lastTime = performance.now();

        const tick = (now) => {
            rafId = requestAnimationFrame(tick);
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            const globe = globeRef.current;
            if (!globe) return;

            const controls = globe.controls?.();
            if (controls && (controls.target.x !== 0 || controls.target.y !== 0 || controls.target.z !== 0)) {
                controls.target.set(0, 0, 0);
            }

            const pov = globe.pointOfView();
            const curAlt = clamp(pov?.altitude || 2.0, MIN_ALT, MAX_ALT);

            if (isZoomingRef.current) {
                const curLog = Math.log(curAlt);
                const diff = targetLogAlt.current - curLog;
                if (Math.abs(diff) < 0.001) {
                    isZoomingRef.current = false;
                } else {
                    const nextAlt = clamp(Math.exp(curLog + diff * (1 - Math.exp(-11 * dt))), MIN_ALT, MAX_ALT);
                    globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: nextAlt }, 0);
                    if (controls) {
                        const prevDamp = controls.enableDamping;
                        controls.enableDamping = false;
                        controls.update();
                        controls.enableDamping = prevDamp;
                    }
                }
            } else if (controls) {
                controls.rotateSpeed = clamp(Math.pow(curAlt, 0.82) * 0.30, 0.025, 0.55);
                controls.update();
            }

            if (sceneFxRef.current) {
                sceneFxRef.current.update(dt, curAlt);
            }
        };

        rafId = requestAnimationFrame(tick);
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [globeReady]);

    // Smooth wheel + pinch zoom handlers with 2->1 finger stability
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const globe = globeRef.current;
        if (!globe) return;

        if (!isZoomingRef.current) {
            const pov = globe.pointOfView();
            targetLogAlt.current = Math.log(clamp(pov?.altitude || 2.0, MIN_ALT, MAX_ALT));
        }

        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 32;
        else if (e.deltaMode === 2) delta *= 240;

        targetLogAlt.current = clamp(
            targetLogAlt.current + clamp(delta * 0.0018, -0.4, 0.4),
            Math.log(MIN_ALT),
            Math.log(MAX_ALT)
        );
        isZoomingRef.current = true;
    }, []);

    const handleTouchStart = useCallback((e) => {
        const globe = globeRef.current;
        if (!globe) return;
        const controls = globe.controls?.();
        const ts = touchRef.current;

        if (e.touches.length >= 2) {
            e.preventDefault();
            ts.mode = 'pinch';
            draggedRef.current = true;
            if (controls) controls.enabled = false;
            ts.startDist = Math.max(
                10,
                Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            );
            const pov = globe.pointOfView();
            ts.startLogAlt = Math.log(clamp(pov?.altitude || 2.0, MIN_ALT, MAX_ALT));
            targetLogAlt.current = ts.startLogAlt;
        } else if (e.touches.length === 1 && ts.mode === 'idle') {
            ts.mode = 'drag';
            isZoomingRef.current = false;
            if (controls) controls.enabled = true;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        const ts = touchRef.current;
        if (ts.mode === 'pinch' && e.touches.length >= 2) {
            e.preventDefault();
            const dist = Math.max(
                10,
                Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
            );
            targetLogAlt.current = clamp(
                ts.startLogAlt + Math.log(ts.startDist / dist),
                Math.log(MIN_ALT),
                Math.log(MAX_ALT)
            );
            isZoomingRef.current = true;
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const controls = globeRef.current?.controls?.();
        const ts = touchRef.current;
        if (ts.mode === 'pinch' && e.touches.length === 1) {
            ts.mode = 'pinch-cooldown';
            if (controls) controls.enabled = false;
            return;
        }
        if (e.touches.length === 0) {
            ts.mode = 'idle';
            if (controls) controls.enabled = true;
        }
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('touchstart', handleTouchStart, { passive: false });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        el.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Dispose Three.js resources on unmount
    useEffect(() => {
        return () => {
            if (sceneFxRef.current) {
                sceneFxRef.current.dispose();
                sceneFxRef.current = null;
            }
            if (globeRef.current) {
                try {
                    const scene = globeRef.current.scene();
                    scene.traverse((obj) => {
                        if (obj.geometry) obj.geometry.dispose();
                        if (obj.material) {
                            if (Array.isArray(obj.material)) {
                                obj.material.forEach((m) => m.dispose());
                            } else {
                                obj.material.dispose();
                            }
                        }
                    });
                } catch (_) {}
            }
        };
    }, []);

    const pinData = useMemo(() => {
        if (!hasPin) return [];
        return [{ lat, lng }];
    }, [hasPin, lat, lng]);

    const handleZoom = (factor) => {
        if (!globeRef.current) return;
        if (!isZoomingRef.current) {
            const pov = globeRef.current.pointOfView();
            targetLogAlt.current = Math.log(clamp(pov?.altitude || 1.5, MIN_ALT, MAX_ALT));
        }
        targetLogAlt.current = clamp(
            targetLogAlt.current + Math.log(factor),
            Math.log(MIN_ALT),
            Math.log(MAX_ALT)
        );
        isZoomingRef.current = true;
    };

    const handleFocusPin = () => {
        if (!globeRef.current || !hasPin) return;
        isZoomingRef.current = false;
        targetLogAlt.current = Math.log(0.45);
        globeRef.current.pointOfView({ lat, lng, altitude: 0.45 }, 650);
    };

    return (
        <div
            ref={containerRef}
            className={`psm-map-picker psm-globe-picker ${disabled ? 'is-disabled' : ''}`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
                pointerStartRef.current = { x: e.clientX, y: e.clientY };
                draggedRef.current = false;
                isZoomingRef.current = false;
            }}
            onPointerMove={(e) => {
                if (
                    Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y) > 6
                ) {
                    draggedRef.current = true;
                }
            }}
        >
            <Suspense
                fallback={
                    <div className="psm-globe-loading">
                        3D Dünya Haritası yükleniyor...
                    </div>
                }
            >
                <Globe
                    ref={globeRef}
                    width={size.width}
                    height={size.height}
                    backgroundColor="#000003"
                    globeImageUrl={EARTH_TEXTURES.day}
                    bumpImageUrl={EARTH_TEXTURES.bump}
                    globeTileEngineUrl={EARTH_TEXTURES.satelliteTileUrl}
                    showAtmosphere={false}
                    onGlobeReady={() => {
                        if (globeRef.current) {
                            const controls = globeRef.current.controls();
                            controls.enableDamping = true;
                            controls.dampingFactor = 0.08;
                            controls.enablePan = false;
                            controls.minPolarAngle = 0.08;
                            controls.maxPolarAngle = Math.PI - 0.08;
                            controls.autoRotate = false;
                            controls.rotateSpeed = 0.48;
                            controls.enableZoom = false;
                            controls.minDistance = 101.5;
                            controls.target.set(0, 0, 0);

                            if (sceneFxRef.current) sceneFxRef.current.dispose();
                            sceneFxRef.current = enhanceEarthScene(globeRef.current, {
                                starCount: 1600,
                                enableClouds: true,
                                enableStars: true,
                                cloudDriftSpeed: 0.0018,
                            });
                        }
                        setGlobeReady(true);
                    }}
                    onGlobeClick={({ lat: pickedLat, lng: pickedLng }) => {
                        if (disabled || !onPick || draggedRef.current) return;
                        onPick(Number(pickedLat.toFixed(5)), Number(pickedLng.toFixed(5)));
                    }}
                    ringsData={pinData}
                    ringLat={(d) => d.lat}
                    ringLng={(d) => d.lng}
                    ringColor={() => (t) => `rgba(255, 255, 255, ${1 - t})`}
                    ringMaxRadius={3.2}
                    ringPropagationSpeed={2.2}
                    ringRepeatPeriod={1200}
                    htmlElementsData={pinData}
                    htmlLat={(d) => d.lat}
                    htmlLng={(d) => d.lng}
                    htmlAltitude={0.01}
                    htmlElement={() => {
                        const el = document.createElement('div');
                        el.className = 'psm-globe-pin';
                        el.innerHTML = `<span class="psm-globe-pin-dot"></span>`;
                        return el;
                    }}
                />
            </Suspense>

            <div className="psm-map-hint">
                {disabled
                    ? '3D Dünya Haritası önizlemesi'
                    : 'Konum seçmek için 3D dünyaya tıklayın · Döndürmek için sürükleyin'}
            </div>

            <div className="psm-map-controls">
                <button
                    type="button"
                    className="psm-map-ctrl-btn"
                    onClick={() => handleZoom(0.58)}
                    title="Yakınlaştır"
                    aria-label="Yakınlaştır"
                >
                    <Plus size={14} />
                </button>
                <button
                    type="button"
                    className="psm-map-ctrl-btn"
                    onClick={() => handleZoom(1.72)}
                    title="Uzaklaştır"
                    aria-label="Uzaklaştır"
                >
                    <Minus size={14} />
                </button>
                {hasPin && (
                    <button
                        type="button"
                        className="psm-map-ctrl-btn"
                        onClick={handleFocusPin}
                        title="Seçili Konuma Odaklan"
                        aria-label="Seçili Konuma Odaklan"
                    >
                        <Crosshair size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LocationMapPicker;
