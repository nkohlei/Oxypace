import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Minus, Crosshair, MapPin } from 'lucide-react';

const TILE_SIZE = 256;

function latLngToWorld(lat, lng, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const x = ((lng + 180) / 360) * scale;
    const sinLat = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
    return { x, y };
}

function worldToLatLng(x, y, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const lng = (x / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return {
        lat: Math.max(-85, Math.min(85, lat)),
        lng: ((lng + 540) % 360) - 180,
    };
}

const LocationMapPicker = ({ lat, lng, disabled = false, onPick }) => {
    const hasPin = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
    const [center, setCenter] = useState({
        lat: hasPin ? lat : 39.0,
        lng: hasPin ? lng : 35.0,
    });
    const [zoom, setZoom] = useState(hasPin ? 10 : 5);
    const [size, setSize] = useState({ width: 520, height: 220 });
    const containerRef = useRef(null);
    const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, startCenterWorld: null });

    useEffect(() => {
        if (hasPin) {
            setCenter({ lat, lng });
            setZoom((z) => (z < 7 ? 10 : z));
        }
    }, [lat, lng, hasPin]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const updateSize = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const centerWorld = latLngToWorld(center.lat, center.lng, zoom);
    const topLeftX = centerWorld.x - size.width / 2;
    const topLeftY = centerWorld.y - size.height / 2;

    const maxTile = Math.pow(2, zoom);
    const startTileX = Math.floor(topLeftX / TILE_SIZE);
    const endTileX = Math.floor((topLeftX + size.width) / TILE_SIZE);
    const startTileY = Math.max(0, Math.floor(topLeftY / TILE_SIZE));
    const endTileY = Math.min(maxTile - 1, Math.floor((topLeftY + size.height) / TILE_SIZE));

    const isLight =
        typeof document !== 'undefined' &&
        (document.documentElement.getAttribute('data-theme') === 'light' ||
            document.body.classList.contains('light-mode'));
    const tileStyle = isLight ? 'light_all' : 'dark_all';

    const tiles = [];
    for (let tx = startTileX; tx <= endTileX; tx++) {
        const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
        for (let ty = startTileY; ty <= endTileY; ty++) {
            const sub = ['a', 'b', 'c'][(wrappedX + ty) % 3];
            tiles.push({
                key: `${zoom}-${tx}-${ty}`,
                url: `https://${sub}.basemaps.cartocdn.com/${tileStyle}/${zoom}/${wrappedX}/${ty}.png`,
                left: tx * TILE_SIZE - topLeftX,
                top: ty * TILE_SIZE - topLeftY,
            });
        }
    }

    let pinPos = null;
    if (hasPin) {
        const pw = latLngToWorld(lat, lng, zoom);
        const px = pw.x - topLeftX;
        const py = pw.y - topLeftY;
        if (px >= -24 && px <= size.width + 24 && py >= -24 && py <= size.height + 24) {
            pinPos = { x: px, y: py };
        }
    }

    const handlePointerDown = (e) => {
        if (e.target.closest('.psm-map-controls')) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragRef.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startY: e.clientY,
            startCenterWorld: centerWorld,
        };
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            dragRef.current.moved = true;
        }
        if (dragRef.current.moved && dragRef.current.startCenterWorld) {
            const next = worldToLatLng(
                dragRef.current.startCenterWorld.x - dx,
                dragRef.current.startCenterWorld.y - dy,
                zoom
            );
            setCenter(next);
        }
    };

    const handlePointerUp = useCallback(
        (e) => {
            if (!dragRef.current.active) return;
            const wasMoved = dragRef.current.moved;
            dragRef.current.active = false;
            if (!wasMoved && !disabled && containerRef.current && onPick) {
                const rect = containerRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                const picked = worldToLatLng(topLeftX + clickX, topLeftY + clickY, zoom);
                onPick(Number(picked.lat.toFixed(5)), Number(picked.lng.toFixed(5)));
            }
        },
        [disabled, onPick, topLeftX, topLeftY, zoom]
    );

    return (
        <div
            ref={containerRef}
            className={`psm-map-picker ${disabled ? 'is-disabled' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                dragRef.current.active = false;
            }}
        >
            <div className="psm-map-tiles">
                {tiles.map((t) => (
                    <img
                        key={t.key}
                        src={t.url}
                        alt=""
                        draggable={false}
                        className="psm-map-tile"
                        style={{ left: `${t.left}px`, top: `${t.top}px` }}
                    />
                ))}
            </div>

            {pinPos && (
                <div
                    className="psm-map-pin"
                    style={{ left: `${pinPos.x}px`, top: `${pinPos.y}px` }}
                >
                    <MapPin size={24} strokeWidth={2.2} />
                </div>
            )}

            <div className="psm-map-hint">
                {disabled ? 'Konum önizlemesi' : 'Konum seçmek için haritaya dokunun veya sürükleyin'}
            </div>

            <div className="psm-map-controls">
                <button
                    type="button"
                    className="psm-map-ctrl-btn"
                    onClick={() => setZoom((z) => Math.min(16, z + 1))}
                    title="Yakınlaştır"
                    aria-label="Yakınlaştır"
                >
                    <Plus size={14} />
                </button>
                <button
                    type="button"
                    className="psm-map-ctrl-btn"
                    onClick={() => setZoom((z) => Math.max(2, z - 1))}
                    title="Uzaklaştır"
                    aria-label="Uzaklaştır"
                >
                    <Minus size={14} />
                </button>
                {hasPin && (
                    <button
                        type="button"
                        className="psm-map-ctrl-btn"
                        onClick={() => {
                            setCenter({ lat, lng });
                            setZoom(11);
                        }}
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
