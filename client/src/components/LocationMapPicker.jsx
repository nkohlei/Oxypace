import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';
import { EARTH_TEXTURES, enhanceEarthScene } from '../utils/earthAtmosphere';

const Globe = lazy(() => import('react-globe.gl'));

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

    // Fly to pin whenever lat/lng updates
    useEffect(() => {
        if (!globeReady || !globeRef.current) return;
        if (hasPin) {
            const currentPov = globeRef.current.pointOfView();
            const targetAlt = initializedRef.current
                ? Math.min(currentPov?.altitude || 1.25, 0.95)
                : 1.15;
            globeRef.current.pointOfView(
                { lat, lng, altitude: targetAlt },
                initializedRef.current ? 650 : 0
            );
            initializedRef.current = true;
        } else if (!initializedRef.current) {
            globeRef.current.pointOfView({ lat: 39.0, lng: 35.0, altitude: 2.15 }, 0);
            initializedRef.current = true;
        }
    }, [lat, lng, hasPin, globeReady]);

    // Unified 60fps loop for atmosphere, clouds, damping & altitude-adaptive rotation
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

            const pov = globe.pointOfView();
            const alt = pov?.altitude ?? 2.0;

            if (sceneFxRef.current) {
                sceneFxRef.current.update(dt, alt);
            }

            const controls = globe.controls?.();
            if (controls) {
                controls.rotateSpeed = Math.max(0.04, Math.min(0.55, alt * 0.28));
                controls.update();
            }
        };

        rafId = requestAnimationFrame(tick);
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [globeReady]);

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
        const pov = globeRef.current.pointOfView();
        const nextAlt = Math.max(0.03, Math.min(3.5, (pov.altitude || 1.5) * factor));
        globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: nextAlt }, 320);
    };

    const handleFocusPin = () => {
        if (!globeRef.current || !hasPin) return;
        globeRef.current.pointOfView({ lat, lng, altitude: 0.45 }, 650);
    };

    return (
        <div
            ref={containerRef}
            className={`psm-map-picker psm-globe-picker ${disabled ? 'is-disabled' : ''}`}
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
                            controls.dampingFactor = 0.07;
                            controls.autoRotate = false;
                            controls.rotateSpeed = 0.5;
                            controls.zoomSpeed = 0.75;
                            controls.minDistance = 101.5;

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
                        if (disabled || !onPick) return;
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
                    onClick={() => handleZoom(0.6)}
                    title="Yakınlaştır"
                    aria-label="Yakınlaştır"
                >
                    <Plus size={14} />
                </button>
                <button
                    type="button"
                    className="psm-map-ctrl-btn"
                    onClick={() => handleZoom(1.6)}
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
