import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { getImageUrl } from '../../utils/imageUtils';
import { EARTH_TEXTURES, enhanceEarthScene } from '../../utils/earthAtmosphere';

const EARTH_RADIUS_KM = 6371;

const EarthCanvas = forwardRef(({ portals = [], onPortalClick, activePortalSearch, onGlobeClick, onTelemetry }, ref) => {
    const globeRef = useRef();
    const containerRef = useRef();
    const sceneFxRef = useRef(null);

    // Smooth camera & zoom state
    const targetAltitude = useRef(2.35);
    const zoomAnchor = useRef(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const isZoomAnimating = useRef(false);
    const isFlying = useRef(false);
    const flyTimeoutRef = useRef(null);
    const lastTelemetryAt = useRef(0);

    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' ? window.innerHeight : 720,
    });

    const cancelFlyLock = useCallback(() => {
        isFlying.current = false;
        if (flyTimeoutRef.current) {
            clearTimeout(flyTimeoutRef.current);
            flyTimeoutRef.current = null;
        }
    }, []);

    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            cancelFlyLock();
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            targetAltitude.current = Math.max(0.004, targetAltitude.current * 0.52);
            zoomAnchor.current = null;
            isZoomAnimating.current = true;
        },
        zoomOut: () => {
            cancelFlyLock();
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            targetAltitude.current = Math.min(4.0, targetAltitude.current * 1.85);
            zoomAnchor.current = null;
            isZoomAnimating.current = true;
        },
        resetView: () => {
            cancelFlyLock();
            targetAltitude.current = 2.35;
            isZoomAnimating.current = false;
            zoomAnchor.current = null;
            isFlying.current = true;
            if (globeRef.current) {
                globeRef.current.controls().autoRotate = true;
                globeRef.current.pointOfView({ lat: 24, lng: 22, altitude: 2.35 }, 1400);
            }
            flyTimeoutRef.current = setTimeout(() => {
                isFlying.current = false;
            }, 1450);
        },
        flyTo: (lat, lng, alt) => {
            cancelFlyLock();
            const flyAlt = alt || 0.015;
            targetAltitude.current = flyAlt;
            isZoomAnimating.current = false;
            zoomAnchor.current = null;
            isFlying.current = true;
            if (globeRef.current) {
                globeRef.current.controls().autoRotate = false;
                globeRef.current.pointOfView({ lat, lng, altitude: flyAlt }, 1900);
            }
            flyTimeoutRef.current = setTimeout(() => {
                isFlying.current = false;
            }, 1950);
        },
    }), [cancelFlyLock]);

    // Responsive container sizing via ResizeObserver + window resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                if (w > 0 && h > 0) {
                    setDimensions({ width: w, height: h });
                }
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

    // Unified 60fps animation loop: lighting, cloud drift, smooth damped zoom, altitude-adaptive rotation, telemetry
    useEffect(() => {
        let rafId = null;
        let lastTime = performance.now();

        const tick = (now) => {
            rafId = requestAnimationFrame(tick);
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            const globe = globeRef.current;
            if (!globe) return;

            const pov = globe.pointOfView();
            const currentAlt = pov?.altitude ?? 2.35;

            // 1. Update Google-Earth-grade atmosphere, sun position & 3K drifting clouds
            if (sceneFxRef.current) {
                sceneFxRef.current.update(dt, currentAlt);
            }

            // 2. Altitude-adaptive orbital rotation speed (surgical precision up close, effortless from space)
            const controls = globe.controls?.();
            if (controls) {
                controls.rotateSpeed = Math.max(0.025, Math.min(0.54, currentAlt * 0.24));
                controls.update();
            }

            // 3. Frame-rate-independent exponential zoom-to-cursor physics
            if (isZoomAnimating.current && !isFlying.current) {
                const diffAlt = targetAltitude.current - currentAlt;
                if (Math.abs(diffAlt) < 0.00025) {
                    isZoomAnimating.current = false;
                    zoomAnchor.current = null;
                } else {
                    const lerpFactor = 1 - Math.exp(-8.8 * dt);
                    const nextAlt = currentAlt + diffAlt * lerpFactor;
                    let nextLat = pov.lat;
                    let nextLng = pov.lng;

                    if (zoomAnchor.current && typeof globe.toGlobeCoords === 'function') {
                        const curUnderMouse = globe.toGlobeCoords(mousePos.current.x, mousePos.current.y);
                        if (curUnderMouse) {
                            const diffLat = zoomAnchor.current.lat - curUnderMouse.lat;
                            let diffLng = zoomAnchor.current.lng - curUnderMouse.lng;
                            diffLng = ((diffLng + 180) % 360 + 360) % 360 - 180;

                            const anchorLerp = 1 - Math.exp(-10.5 * dt);
                            nextLat += diffLat * anchorLerp;
                            nextLng += diffLng * anchorLerp;
                        }
                    }

                    nextLat = Math.max(-89.5, Math.min(89.5, nextLat));
                    nextLng = ((nextLng + 180) % 360 + 360) % 360 - 180;
                    globe.pointOfView({ lat: nextLat, lng: nextLng, altitude: nextAlt }, 0);
                }
            }

            // 4. Live camera telemetry (throttled ~8 Hz)
            if (onTelemetry && now - lastTelemetryAt.current > 125 && pov) {
                lastTelemetryAt.current = now;
                onTelemetry({
                    lat: pov.lat,
                    lng: pov.lng,
                    altitudeKm: Math.max(1, Math.round(currentAlt * EARTH_RADIUS_KM)),
                });
            }
        };

        rafId = requestAnimationFrame(tick);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            cancelFlyLock();
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
    }, [cancelFlyLock, onTelemetry]);

    // Smooth wheel zoom-to-cursor
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        if (!globeRef.current) return;

        cancelFlyLock();
        globeRef.current.controls().autoRotate = false;

        // Normalize trackpad vs mouse wheel delta smoothly
        const clampedDelta = Math.max(-120, Math.min(120, e.deltaY));
        const zoomScale = Math.pow(1.0018, clampedDelta);
        targetAltitude.current = Math.max(0.004, Math.min(4.0, targetAltitude.current * zoomScale));

        if (containerRef.current && typeof globeRef.current.toGlobeCoords === 'function') {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const distMoved = Math.hypot(x - mousePos.current.x, y - mousePos.current.y);

            if (distMoved > 2 || !isZoomAnimating.current || !zoomAnchor.current) {
                const targetCoords = globeRef.current.toGlobeCoords(x, y);
                if (targetCoords) {
                    zoomAnchor.current = targetCoords;
                    mousePos.current = { x, y };
                } else {
                    zoomAnchor.current = null;
                }
            }
        }

        isZoomAnimating.current = true;
    }, [cancelFlyLock]);

    // Mobile pinch-to-zoom & double-tap zoom
    const touchStartDist = useRef(null);
    const touchStartAltitude = useRef(null);
    const lastTapTime = useRef(0);

    const handleTouchStart = useCallback((e) => {
        if (!globeRef.current) return;
        cancelFlyLock();
        globeRef.current.controls().autoRotate = false;

        if (e.touches.length === 2) {
            globeRef.current.controls().enabled = false;
            zoomAnchor.current = null;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchStartDist.current = Math.hypot(dx, dy);
            touchStartAltitude.current = targetAltitude.current;
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTapTime.current < 280) {
                targetAltitude.current = Math.max(0.004, targetAltitude.current * 0.5);
                isZoomAnimating.current = true;
            }
            lastTapTime.current = now;
        }
    }, [cancelFlyLock]);

    const handleTouchMove = useCallback((e) => {
        if (e.touches.length === 2 && globeRef.current && touchStartDist.current !== null) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                const ratio = touchStartDist.current / dist;
                targetAltitude.current = Math.max(0.004, Math.min(4.0, touchStartAltitude.current * ratio));
                isZoomAnimating.current = true;
            }
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (e.touches.length < 2 && globeRef.current) {
            touchStartDist.current = null;
            globeRef.current.controls().enabled = true;
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

    const handleGlobeReady = useCallback(() => {
        const globe = globeRef.current;
        if (!globe) return;

        const controls = globe.controls();
        controls.enableDamping = true;
        controls.dampingFactor = 0.065;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.22;
        controls.rotateSpeed = 0.45;
        controls.minDistance = 100.3;
        controls.enableZoom = false;

        // Frame Africa/Europe/Middle East like Google Earth default view
        globe.pointOfView({ lat: 24, lng: 22, altitude: 2.35 }, 0);
        targetAltitude.current = 2.35;

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
            onPointerDown={() => {
                cancelFlyLock();
                if (globeRef.current) globeRef.current.controls().autoRotate = false;
                zoomAnchor.current = null;
            }}
        >
            <Globe
                ref={globeRef}
                onGlobeReady={handleGlobeReady}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="#000003"
                showAtmosphere={false}
                onGlobeClick={onGlobeClick}
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
