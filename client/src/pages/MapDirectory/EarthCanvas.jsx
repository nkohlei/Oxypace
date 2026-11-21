import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { getImageUrl } from '../../utils/imageUtils';
import { EARTH_TEXTURES, enhanceEarthScene } from '../../utils/earthAtmosphere';

const EARTH_RADIUS_KM = 6371;
const MIN_ALTITUDE = 0.004;
const MAX_ALTITUDE = 4.2;
const DEFAULT_POV = { lat: 24, lng: 22, altitude: 2.35 };

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const normalizeLng = (lng) => ((lng + 180) % 360 + 360) % 360 - 180;

const shortestLngDiff = (targetLng, currentLng) => {
    let diff = targetLng - currentLng;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
};

// Smooth quintic ease-in-out for cinematic Google-Earth flyTo arcs
const easeInOutQuint = (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

const EarthCanvas = forwardRef(({ portals = [], onPortalClick, activePortalSearch, onGlobeClick, onTelemetry }, ref) => {
    const globeRef = useRef();
    const containerRef = useRef();
    const sceneFxRef = useRef(null);

    // Camera physics state (all in refs so 60fps loop never triggers React re-renders)
    const targetLogAlt = useRef(Math.log(DEFAULT_POV.altitude));
    const zoomAnchor = useRef(null); // { lat, lng } locked under cursor/pinch center
    const cursorPos = useRef({ x: 0, y: 0 });
    const isZooming = useRef(false);
    const isDragging = useRef(false);
    const pointerDownPos = useRef({ x: 0, y: 0 });
    const pointerMoved = useRef(false);

    // Custom cinematic parabolic flyTo animation (Google Earth style arc: rises smoothly on long flights)
    const flyAnimRef = useRef(null);

    // Touch gesture state machine (prevents 2->1 finger teleport bug!)
    const touchState = useRef({
        mode: 'idle', // 'idle' | 'drag' | 'pinch' | 'pinch-cooldown'
        startDist: 0,
        startLogAlt: Math.log(DEFAULT_POV.altitude),
        lastTapTime: 0,
        lastTapX: 0,
        lastTapY: 0,
        tapMoved: false,
    });

    const lastTelemetryAt = useRef(0);

    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' ? window.innerHeight : 720,
    });

    const cancelFlyAnim = useCallback(() => {
        flyAnimRef.current = null;
    }, []);

    const syncTargetAltFromGlobe = useCallback(() => {
        const pov = globeRef.current?.pointOfView?.();
        if (pov && Number.isFinite(pov.altitude) && pov.altitude > 0) {
            targetLogAlt.current = Math.log(clamp(pov.altitude, MIN_ALTITUDE, MAX_ALTITUDE));
        }
    }, []);

    // Start a Google-Earth-style smooth parabolic flight (auto-arcs altitude over long distances)
    const startFlight = useCallback((destLat, destLng, destAlt, durationMs = 1500) => {
        const globe = globeRef.current;
        if (!globe) return;

        const controls = globe.controls?.();
        if (controls) {
            controls.autoRotate = false;
            controls.target.set(0, 0, 0);
        }

        const startPov = globe.pointOfView();
        const safeStartAlt = clamp(startPov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);
        const safeDestAlt = clamp(destAlt, MIN_ALTITUDE, MAX_ALTITUDE);

        const dLat = destLat - (startPov?.lat || 0);
        const dLng = shortestLngDiff(destLng, startPov?.lng || 0);
        const angularDist = Math.hypot(dLat, dLng);

        // Parabolic apex: when flying far while zoomed in, arc gracefully upward like Google Earth
        const maxEndpointAlt = Math.max(safeStartAlt, safeDestAlt);
        const arcLift = angularDist > 8 ? clamp((angularDist / 90) * 1.45, 0, 2.1) : 0;
        const apexAlt = Math.min(MAX_ALTITUDE, Math.max(maxEndpointAlt, maxEndpointAlt + arcLift * 0.55));

        isZooming.current = false;
        zoomAnchor.current = null;
        targetLogAlt.current = Math.log(safeDestAlt);

        flyAnimRef.current = {
            startTime: performance.now(),
            duration: durationMs,
            startLat: startPov?.lat || 0,
            startLng: startPov?.lng || 0,
            dLat,
            dLng,
            startLogAlt: Math.log(safeStartAlt),
            destLogAlt: Math.log(safeDestAlt),
            apexLogAlt: Math.log(apexAlt),
        };
    }, []);

    // Zoom smoothly toward a specific screen point (used by double-click & mobile double-tap)
    const zoomToScreenPoint = useCallback((clientX, clientY, factor = 0.45) => {
        const globe = globeRef.current;
        const container = containerRef.current;
        if (!globe || !container) return;

        cancelFlyAnim();
        const controls = globe.controls?.();
        if (controls) controls.autoRotate = false;

        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const pov = globe.pointOfView();
        const curAlt = clamp(pov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);
        const nextAlt = clamp(curAlt * factor, MIN_ALTITUDE, MAX_ALTITUDE);

        const coords = typeof globe.toGlobeCoords === 'function' ? globe.toGlobeCoords(x, y) : null;
        if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
            // Smoothly fly toward clicked spot while zooming in (exact Google Earth double-click feel)
            startFlight(coords.lat, coords.lng, nextAlt, 620);
        } else {
            targetLogAlt.current = Math.log(nextAlt);
            zoomAnchor.current = null;
            isZooming.current = true;
        }
    }, [cancelFlyAnim, startFlight]);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            cancelFlyAnim();
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            if (!isZooming.current) syncTargetAltFromGlobe();
            const nextAlt = clamp(Math.exp(targetLogAlt.current) * 0.52, MIN_ALTITUDE, MAX_ALTITUDE);
            targetLogAlt.current = Math.log(nextAlt);
            zoomAnchor.current = null;
            isZooming.current = true;
        },
        zoomOut: () => {
            cancelFlyAnim();
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            if (!isZooming.current) syncTargetAltFromGlobe();
            const nextAlt = clamp(Math.exp(targetLogAlt.current) * 1.9, MIN_ALTITUDE, MAX_ALTITUDE);
            targetLogAlt.current = Math.log(nextAlt);
            zoomAnchor.current = null;
            isZooming.current = true;
        },
        resetView: () => {
            startFlight(DEFAULT_POV.lat, DEFAULT_POV.lng, DEFAULT_POV.altitude, 1150);
            setTimeout(() => {
                if (!flyAnimRef.current && globeRef.current) {
                    globeRef.current.controls().autoRotate = true;
                }
            }, 1250);
        },
        flyTo: (lat, lng, alt) => {
            startFlight(lat, lng, alt || 0.02, 1600);
        },
    }), [cancelFlyAnim, startFlight, syncTargetAltFromGlobe]);

    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                if (w > 0 && h > 0) setDimensions({ width: w, height: h });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        let ro = null;
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            ro = new ResizeObserver(updateSize);
            ro.observe(containerRef.current);
        }
        return () => {
            window.removeEventListener('resize', updateSize);
            if (ro) ro.disconnect();
        };
    }, []);

    // Keyboard shortcuts (Google Earth feel: +/- zoom, Arrow keys smooth nudge, R reset)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            const globe = globeRef.current;
            if (!globe) return;

            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                cancelFlyAnim();
                globe.controls().autoRotate = false;
                if (!isZooming.current) syncTargetAltFromGlobe();
                targetLogAlt.current = Math.log(clamp(Math.exp(targetLogAlt.current) * 0.65, MIN_ALTITUDE, MAX_ALTITUDE));
                zoomAnchor.current = null;
                isZooming.current = true;
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                cancelFlyAnim();
                globe.controls().autoRotate = false;
                if (!isZooming.current) syncTargetAltFromGlobe();
                targetLogAlt.current = Math.log(clamp(Math.exp(targetLogAlt.current) * 1.5, MIN_ALTITUDE, MAX_ALTITUDE));
                zoomAnchor.current = null;
                isZooming.current = true;
            } else if (e.key === 'r' || e.key === 'R') {
                startFlight(DEFAULT_POV.lat, DEFAULT_POV.lng, DEFAULT_POV.altitude, 1000);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cancelFlyAnim, startFlight, syncTargetAltFromGlobe]);

    // Unified 60fps physics + rendering loop
    useEffect(() => {
        let rafId = null;
        let lastTime = performance.now();

        const tick = (now) => {
            rafId = requestAnimationFrame(tick);
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            const globe = globeRef.current;
            if (!globe) return;

            const controls = globe.controls?.();
            // Guarantee planet stays dead-center (never drifts off-origin)
            if (controls && (controls.target.x !== 0 || controls.target.y !== 0 || controls.target.z !== 0)) {
                controls.target.set(0, 0, 0);
            }

            // 1. Parabolic flyTo animation (takes priority while active)
            if (flyAnimRef.current) {
                const anim = flyAnimRef.current;
                const rawT = clamp((now - anim.startTime) / anim.duration, 0, 1);
                const easeT = easeInOutQuint(rawT);

                const curLat = clamp(anim.startLat + anim.dLat * easeT, -89.5, 89.5);
                const curLng = normalizeLng(anim.startLng + anim.dLng * easeT);

                // Quadratic Bezier in log-altitude space for natural Google Earth arc
                const inv = 1 - easeT;
                const curLogAlt =
                    inv * inv * anim.startLogAlt +
                    2 * inv * easeT * anim.apexLogAlt +
                    easeT * easeT * anim.destLogAlt;

                globe.pointOfView({ lat: curLat, lng: curLng, altitude: Math.exp(curLogAlt) }, 0);

                if (rawT >= 1) {
                    flyAnimRef.current = null;
                    targetLogAlt.current = anim.destLogAlt;
                }
            } else if (isZooming.current) {
                // 2. Logarithmic zoom-to-cursor physics (equal perceptual speed at EVERY altitude!)
                const pov = globe.pointOfView();
                const currentAlt = clamp(pov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);
                const currentLogAlt = Math.log(currentAlt);
                const diffLog = targetLogAlt.current - currentLogAlt;

                if (Math.abs(diffLog) < 0.0008) {
                    isZooming.current = false;
                    zoomAnchor.current = null;
                } else {
                    // Exponential critically-damped smoothing in log space
                    const smoothAlpha = 1 - Math.exp(-11.5 * dt);
                    const nextAlt = clamp(Math.exp(currentLogAlt + diffLog * smoothAlpha), MIN_ALTITUDE, MAX_ALTITUDE);

                    // Step 1: apply new altitude first
                    globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: nextAlt }, 0);

                    // Step 2: lock cursor/pinch anchor smoothly (pixel-tight on zoom-in, gentle on zoom-out)
                    if (
                        zoomAnchor.current &&
                        !isDragging.current &&
                        typeof globe.toGlobeCoords === 'function'
                    ) {
                        const afterCoords = globe.toGlobeCoords(cursorPos.current.x, cursorPos.current.y);
                        if (afterCoords && Number.isFinite(afterCoords.lat) && Number.isFinite(afterCoords.lng)) {
                            const lockWeight = diffLog < 0 ? 0.92 : 0.42;
                            const corrLat = clamp((zoomAnchor.current.lat - afterCoords.lat) * lockWeight, -10, 10);
                            const corrLng = clamp(shortestLngDiff(zoomAnchor.current.lng, afterCoords.lng) * lockWeight, -16, 16);
                            const lockedLat = clamp(pov.lat + corrLat, -85, 85);
                            const lockedLng = normalizeLng(pov.lng + corrLng);
                            globe.pointOfView({ lat: lockedLat, lng: lockedLng, altitude: nextAlt }, 0);
                        }
                    }

                    // Keep OrbitControls internal spherical state synced so no jump occurs on next drag
                    if (controls) {
                        const prevDamping = controls.enableDamping;
                        controls.enableDamping = false;
                        controls.update();
                        controls.enableDamping = prevDamping;
                    }
                }
            } else if (controls) {
                // 3. Normal inertial orbital rotation with smooth altitude-adaptive sensitivity
                const pov = globe.pointOfView();
                const curAlt = clamp(pov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);

                // Smooth non-linear rotation curve: crisp & weighted in space, surgical at street level
                const adaptiveSpeed = clamp(Math.pow(curAlt, 0.82) * 0.29, 0.018, 0.56);
                controls.rotateSpeed = adaptiveSpeed;
                controls.update();
            }

            // 4. Update atmospheric shaders, sun lighting & drifting 3K clouds
            const finalPov = globe.pointOfView();
            const finalAlt = clamp(finalPov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);
            if (sceneFxRef.current) {
                sceneFxRef.current.update(dt, finalAlt);
            }

            // 5. Live telemetry readout (~8 Hz)
            if (onTelemetry && now - lastTelemetryAt.current > 125 && finalPov) {
                lastTelemetryAt.current = now;
                onTelemetry({
                    lat: finalPov.lat,
                    lng: finalPov.lng,
                    altitudeKm: Math.max(1, Math.round(finalAlt * EARTH_RADIUS_KM)),
                });
            }
        };

        rafId = requestAnimationFrame(tick);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            cancelFlyAnim();
            if (sceneFxRef.current) {
                sceneFxRef.current.dispose();
                sceneFxRef.current = null;
            }
            if (globeRef.current) {
                try {
                    const scene = globeRef.current.scene();
                    scene.traverse((object) => {
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach((mat) => mat.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    });
                } catch (_) {}
            }
        };
    }, [cancelFlyAnim, onTelemetry]);

    // Smooth Google-Earth mouse wheel & trackpad pinch zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const globe = globeRef.current;
        const container = containerRef.current;
        if (!globe || !container) return;

        cancelFlyAnim();
        const controls = globe.controls?.();
        if (controls) controls.autoRotate = false;

        if (!isZooming.current) {
            syncTargetAltFromGlobe();
        }

        // Normalize pixel / line / page wheel modes cleanly across mice and laptop trackpads
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 32; // Firefox line mode
        else if (e.deltaMode === 2) delta *= 240; // Page mode

        // Trackpad pinch sets ctrlKey = true with small deltas; boost sensitivity slightly
        const sensitivity = e.ctrlKey ? 0.0085 : 0.00185;
        const clampedStep = clamp(delta * sensitivity, -0.42, 0.42);
        const nextLogAlt = clamp(
            targetLogAlt.current + clampedStep,
            Math.log(MIN_ALTITUDE),
            Math.log(MAX_ALTITUDE)
        );
        targetLogAlt.current = nextLogAlt;

        // Lock cursor anchor cleanly on the globe surface
        if (typeof globe.toGlobeCoords === 'function') {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const moved = Math.hypot(x - cursorPos.current.x, y - cursorPos.current.y);

            if (moved > 3 || !isZooming.current || !zoomAnchor.current) {
                const coords = globe.toGlobeCoords(x, y);
                if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
                    zoomAnchor.current = coords;
                    cursorPos.current = { x, y };
                } else {
                    zoomAnchor.current = null;
                }
            }
        }

        isZooming.current = true;
    }, [cancelFlyAnim, syncTargetAltFromGlobe]);

    // Rock-solid Mobile Touch State Machine (zero 2->1 finger jump, pinch-to-midpoint, double-tap zoom)
    const handleTouchStart = useCallback((e) => {
        const globe = globeRef.current;
        const container = containerRef.current;
        if (!globe || !container) return;

        cancelFlyAnim();
        const controls = globe.controls?.();
        if (controls) controls.autoRotate = false;

        const ts = touchState.current;

        if (e.touches.length >= 2) {
            // Enter pinch mode: lock OrbitControls so single-finger rotation never fights pinch!
            e.preventDefault();
            ts.mode = 'pinch';
            ts.tapMoved = true;
            isDragging.current = false;
            if (controls) controls.enabled = false;

            const t0 = e.touches[0];
            const t1 = e.touches[1];
            ts.startDist = Math.max(10, Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY));

            const pov = globe.pointOfView();
            const curAlt = clamp(pov?.altitude || DEFAULT_POV.altitude, MIN_ALTITUDE, MAX_ALTITUDE);
            ts.startLogAlt = Math.log(curAlt);
            targetLogAlt.current = ts.startLogAlt;

            // Anchor pinch zoom directly at the midpoint between both fingers!
            const rect = container.getBoundingClientRect();
            const midX = (t0.clientX + t1.clientX) * 0.5 - rect.left;
            const midY = (t0.clientY + t1.clientY) * 0.5 - rect.top;
            cursorPos.current = { x: midX, y: midY };
            if (typeof globe.toGlobeCoords === 'function') {
                const midCoords = globe.toGlobeCoords(midX, midY);
                zoomAnchor.current = midCoords && Number.isFinite(midCoords.lat) ? midCoords : null;
            }
        } else if (e.touches.length === 1 && ts.mode === 'idle') {
            const t = e.touches[0];
            ts.mode = 'drag';
            ts.tapMoved = false;
            isDragging.current = true;
            isZooming.current = false;
            zoomAnchor.current = null;
            if (controls) controls.enabled = true;

            // Check double-tap (within 280ms and 36px of previous tap)
            const now = Date.now();
            const distFromPrevTap = Math.hypot(t.clientX - ts.lastTapX, t.clientY - ts.lastTapY);
            if (now - ts.lastTapTime < 280 && distFromPrevTap < 36) {
                ts.lastTapTime = 0;
                ts.tapMoved = true;
                zoomToScreenPoint(t.clientX, t.clientY, 0.45);
                return;
            }
            ts.lastTapX = t.clientX;
            ts.lastTapY = t.clientY;
            ts.lastTapTime = now;
        }
    }, [cancelFlyAnim, zoomToScreenPoint]);

    const handleTouchMove = useCallback((e) => {
        const globe = globeRef.current;
        const container = containerRef.current;
        if (!globe || !container) return;

        const ts = touchState.current;

        if (ts.mode === 'pinch' && e.touches.length >= 2) {
            e.preventDefault();
            const t0 = e.touches[0];
            const t1 = e.touches[1];
            const dist = Math.max(10, Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY));

            // Logarithmic pinch ratio: feels 1:1 natural with finger spread
            const logDelta = Math.log(ts.startDist / dist) * 1.05;
            targetLogAlt.current = clamp(
                ts.startLogAlt + logDelta,
                Math.log(MIN_ALTITUDE),
                Math.log(MAX_ALTITUDE)
            );

            // Track moving finger midpoint so two-finger pinch-and-pan feels effortless
            const rect = container.getBoundingClientRect();
            cursorPos.current = {
                x: (t0.clientX + t1.clientX) * 0.5 - rect.left,
                y: (t0.clientY + t1.clientY) * 0.5 - rect.top,
            };

            isZooming.current = true;
        } else if (ts.mode === 'drag' && e.touches.length === 1) {
            const t = e.touches[0];
            if (Math.hypot(t.clientX - ts.lastTapX, t.clientY - ts.lastTapY) > 10) {
                ts.tapMoved = true;
            }
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const globe = globeRef.current;
        const controls = globe?.controls?.();
        const ts = touchState.current;

        if (ts.mode === 'pinch' && e.touches.length === 1) {
            // CRITICAL STABILITY FIX: Keep controls disabled during 2->1 finger release
            // so the remaining finger NEVER violently flicks/teleports the globe!
            ts.mode = 'pinch-cooldown';
            if (controls) controls.enabled = false;
            return;
        }

        if (e.touches.length === 0) {
            ts.mode = 'idle';
            isDragging.current = false;
            zoomAnchor.current = null;
            if (controls) controls.enabled = true;
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

    const handleGlobeReady = useCallback(() => {
        const globe = globeRef.current;
        if (!globe) return;

        const controls = globe.controls();
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false; // Prevent right-click/2-finger drag from knocking Earth off center!
        controls.minPolarAngle = 0.08;
        controls.maxPolarAngle = Math.PI - 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2;
        controls.rotateSpeed = 0.45;
        controls.minDistance = 100.3;
        controls.enableZoom = false; // Handled by our custom Google-Earth logarithmic zoom engine
        controls.target.set(0, 0, 0);

        globe.pointOfView(DEFAULT_POV, 0);
        targetLogAlt.current = Math.log(DEFAULT_POV.altitude);

        if (sceneFxRef.current) {
            sceneFxRef.current.dispose();
        }
        sceneFxRef.current = enhanceEarthScene(globe, {
            starCount: 4000,
            enableClouds: true,
            enableStars: true,
            cloudDriftSpeed: 0.0022,
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full earth-canvas-stage"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
                cancelFlyAnim();
                isDragging.current = true;
                isZooming.current = false;
                zoomAnchor.current = null;
                pointerDownPos.current = { x: e.clientX, y: e.clientY };
                pointerMoved.current = false;
                if (globeRef.current) globeRef.current.controls().autoRotate = false;
            }}
            onPointerMove={(e) => {
                if (!isDragging.current) return;
                if (
                    Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y) > 6
                ) {
                    pointerMoved.current = true;
                }
            }}
            onPointerUp={() => {
                isDragging.current = false;
            }}
            onPointerCancel={() => {
                isDragging.current = false;
            }}
            onDoubleClick={(e) => {
                if (e.target.closest('.portal-marker-container')) return;
                zoomToScreenPoint(e.clientX, e.clientY, 0.45);
            }}
        >
            <Globe
                ref={globeRef}
                onGlobeReady={handleGlobeReady}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#000003"
                showAtmosphere={false}
                onGlobeClick={(coords, event) => {
                    if (pointerMoved.current) return;
                    if (onGlobeClick) onGlobeClick(coords, event);
                }}
                globeImageUrl={EARTH_TEXTURES.day}
                bumpImageUrl={EARTH_TEXTURES.bump}
                globeTileEngineUrl={EARTH_TEXTURES.satelliteTileUrl}
                tileLayer={{
                    maxZoom: 22,
                    attribution: 'Google Satellite-DPI',
                }}
                htmlElementsData={portals}
                htmlElement={(d) => {
                    const el = document.createElement('div');
                    el.className = 'portal-marker-container';

                    let circleClass = 'portal-circle';

                    if (activePortalSearch && activePortalSearch.length > 0) {
                        const q = activePortalSearch.toLowerCase();
                        const isMatch =
                            d.name.toLowerCase().includes(q) ||
                            (d.label || '').toLowerCase().includes(q);
                        circleClass = isMatch
                            ? 'portal-circle portal-circle-match'
                            : 'portal-circle portal-circle-dimmed';
                    }

                    let cleanUrl = '';
                    if (d.avatar) {
                        let finalUrl = d.avatar;
                        if (finalUrl.includes('%3A') || finalUrl.includes('%2F')) {
                            try {
                                finalUrl = decodeURIComponent(finalUrl);
                                if (finalUrl.includes('%3A') || finalUrl.includes('%2F')) {
                                    finalUrl = decodeURIComponent(finalUrl);
                                }
                            } catch (_) {}
                        }
                        cleanUrl = getImageUrl(finalUrl);
                    }

                    el.innerHTML = `
                        <div class="${circleClass}" data-name="${d.name[0].toUpperCase()}">
                            ${cleanUrl
                                ? `<img src="${cleanUrl}" alt="${d.name}" onerror="this.onerror=null;this.src='/assets/default-avatar.png';" />`
                                : `<span class="portal-letter">${d.name[0].toUpperCase()}</span>`
                            }
                        </div>
                        <div class="portal-hover-label">${d.name}</div>
                    `;
                    el.style.position = 'relative';
                    el.style.cursor = 'pointer';
                    el.onclick = (e) => {
                        e.stopPropagation();
                        onPortalClick(d);
                    };
                    el.onpointerdown = (e) => {
                        e.stopPropagation();
                    };
                    return el;
                }}
                htmlLat={(d) => d.lat}
                htmlLng={(d) => d.lng}
                htmlAltitude={0}
            />

            <style>{`
                .earth-canvas-stage {
                    cursor: grab;
                    background: #000003;
                    touch-action: none;
                    overscroll-behavior: none;
                    user-select: none;
                    -webkit-user-select: none;
                    -webkit-touch-callout: none;
                }
                .earth-canvas-stage:active {
                    cursor: grabbing;
                }
                .portal-marker-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    pointer-events: auto !important;
                    user-select: none;
                    transform: translate(-50%, -50%);
                }
                .portal-marker-container:hover {
                    z-index: 100 !important;
                }
                .portal-circle {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(10, 14, 22, 0.55);
                    backdrop-filter: blur(8px);
                    border: 1.5px solid rgba(255, 255, 255, 0.55);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.65);
                    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .portal-marker-container:hover .portal-circle {
                    transform: scale(1.18);
                    border-color: #ffffff;
                    box-shadow: 0 0 24px rgba(170, 212, 255, 0.5);
                }
                .portal-circle img {
                    width: 90%;
                    height: 90%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                .portal-letter {
                    color: white;
                    font-size: 17px;
                    font-weight: 800;
                    font-family: 'Inter', sans-serif;
                    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
                }
                @keyframes matchPulse {
                    0%, 100% { border-color: #ffffff; box-shadow: 0 0 18px rgba(180, 220, 255, 0.75); }
                    50% { border-color: #93c5fd; box-shadow: 0 0 28px rgba(147, 197, 253, 0.95); }
                }
                .portal-circle-match {
                    animation: matchPulse 2.4s ease-in-out infinite !important;
                    transform: scale(1.2) !important;
                }
                .portal-circle-dimmed {
                    opacity: 0.32;
                    filter: grayscale(80%);
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .portal-hover-label {
                    position: absolute;
                    top: 50px;
                    background: rgba(8, 10, 14, 0.9);
                    backdrop-filter: blur(10px);
                    color: #f8fafc;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                }
                .portal-marker-container:hover .portal-hover-label {
                    opacity: 1;
                    transform: translateY(4px);
                }
            `}</style>
        </div>
    );
});

export default EarthCanvas;
