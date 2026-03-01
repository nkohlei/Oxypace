import React, { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import EarthCanvas from './EarthCanvas';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';

const PORTALS = [
    {
        id: 'london',
        name: 'London Portal',
        location: 'United Kingdom',
        lat: 51.5074,
        lng: -0.1278,
        image: '/portals/london.png',
        bio: 'The London Portal serves as the primary gateway for Western Europe, connecting Oxypace users to the heart of the British capital. It facilitates high-speed data transmission and provides a central hub for regional operations.',
        stats: {
            uptime: '99.99%',
            latency: '12ms',
            users: '2.4M'
        }
    }
];

export default function EarthSimulation() {
    const earthCanvasRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePanel, setActivePanel] = useState(null); // 'search' | 'speed' | null
    const [searchQuery, setSearchQuery] = useState('');
    const [rotationSpeed, setRotationSpeed] = useState(0.3);
    const [selectedPortal, setSelectedPortal] = useState(null);
    const [portalSearchQuery, setPortalSearchQuery] = useState('');
    const [showPortalResults, setShowPortalResults] = useState(false);
    const [activePortalSearch, setActivePortalSearch] = useState('');

    const handleZoomIn = () => earthCanvasRef.current?.zoomIn();
    const handleZoomOut = () => earthCanvasRef.current?.zoomOut();
    const handleReset = () => earthCanvasRef.current?.resetView();

    const triggerPortalSearch = () => {
        const query = portalSearchQuery.trim();
        setShowPortalResults(false);
        setActivePortalSearch(query);
        if (query.length > 0) {
            handleReset();
        }
    };

    const clearPortalSearch = () => {
        setPortalSearchQuery('');
        setActivePortalSearch('');
        setShowPortalResults(false);
    };

    const togglePanel = (panel) => {
        setActivePanel(prev => prev === panel ? null : panel);
    };

    const handlePortalClick = useCallback((portal) => {
        setSelectedPortal(portal);
        setSidebarOpen(true);
        earthCanvasRef.current?.flyTo(portal.lat, portal.lng, 0.05);
    }, []);

    // Search handler — supports "lat, lng" format and city names
    const searchRef = useRef('');
    const handleSearchInput = (e) => {
        setSearchQuery(e.target.value);
        searchRef.current = e.target.value;
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchRef.current.trim();
        if (!query || !earthCanvasRef.current) return;

        // Check for coordinate format: "lat, lng"
        const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            earthCanvasRef.current.flyTo(lat, lng, 0.05);
            return;
        }

        // City name lookup
        const cities = {
            'istanbul': { lat: 41.01, lng: 28.98 },
            'ankara': { lat: 39.93, lng: 32.86 },
            'london': { lat: 51.50, lng: -0.12 },
            'new york': { lat: 40.71, lng: -74.01 },
            'tokyo': { lat: 35.68, lng: 139.69 },
            'paris': { lat: 48.85, lng: 2.35 },
            'dubai': { lat: 25.20, lng: 55.27 },
            'rome': { lat: 41.90, lng: 12.49 },
            'berlin': { lat: 52.52, lng: 13.40 },
            'moscow': { lat: 55.75, lng: 37.61 },
            'beijing': { lat: 39.90, lng: 116.39 },
            'sydney': { lat: -33.87, lng: 151.21 },
            'cairo': { lat: 30.04, lng: 31.23 },
            'mumbai': { lat: 19.07, lng: 72.87 },
            'los angeles': { lat: 34.05, lng: -118.24 },
            'rio de janeiro': { lat: -22.91, lng: -43.17 },
            'singapore': { lat: 1.35, lng: 103.82 },
            'seoul': { lat: 37.57, lng: 126.97 },
            'toronto': { lat: 43.65, lng: -79.38 },
            'mexico city': { lat: 19.43, lng: -99.13 },
            'buenos aires': { lat: -34.60, lng: -58.38 },
            'amsterdam': { lat: 52.37, lng: 4.90 },
            'barcelona': { lat: 41.39, lng: 2.17 },
            'san francisco': { lat: 37.77, lng: -122.42 },
            'washington': { lat: 38.90, lng: -77.03 },
            'chicago': { lat: 41.88, lng: -87.63 },
            'miami': { lat: 25.76, lng: -80.19 },
            'izmir': { lat: 38.42, lng: 27.13 },
            'antalya': { lat: 36.88, lng: 30.69 },
            'bursa': { lat: 40.18, lng: 29.06 },
        };

        const city = cities[query.toLowerCase()];
        if (city) {
            earthCanvasRef.current.flyTo(city.lat, city.lng, 0.05);
            return;
        }

        // Kapsamlı Dünya Araması (Nominatim API - OpenStreetMap)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                earthCanvasRef.current.flyTo(lat, lng, 0.05);
            } else {
                console.warn("Location not found.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    };

    const handleSpeedChange = (e) => {
        const speed = parseFloat(e.target.value);
        setRotationSpeed(speed);
        earthCanvasRef.current?.setRotationSpeed(speed);
    };

    return (
        <div className="app-wrapper map-simulation-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0d', overflow: 'hidden' }}>
            <SEO title="Portal Haritası | Oxypace" description="Tüm Oxypace portallarını interaktif 3D dünya üzerinde keşfedin." />

            <Navbar />

            <main className="flex-1 relative flex overflow-hidden">
                {/* Floating Search Overlay (Specialized for Portals) */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                    <div className="relative group flex items-center">
                        <span
                            onClick={triggerPortalSearch}
                            className="absolute left-3 text-slate-400 hover:text-white material-symbols-outlined text-[18px] cursor-pointer z-10 transition-colors"
                        >
                            search
                        </span>
                        <input
                            value={portalSearchQuery}
                            onChange={(e) => {
                                setPortalSearchQuery(e.target.value);
                                setShowPortalResults(true);
                                if (e.target.value === '') setActivePortalSearch('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    triggerPortalSearch();
                                }
                            }}
                            onFocus={() => setShowPortalResults(true)}
                            onBlur={() => setTimeout(() => setShowPortalResults(false), 200)}
                            className="w-72 md:w-96 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-2xl"
                            placeholder="Portal İsmi veya Konum Ara..."
                            type="text"
                        />
                        {portalSearchQuery.length > 0 && (
                            <span
                                onClick={clearPortalSearch}
                                className="absolute right-3 text-slate-400 hover:text-white material-symbols-outlined text-[16px] cursor-pointer z-10 transition-colors"
                            >
                                close
                            </span>
                        )}
                        {showPortalResults && portalSearchQuery.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {PORTALS.filter(p => p.name.toLowerCase().includes(portalSearchQuery.toLowerCase()) || p.location.toLowerCase().includes(portalSearchQuery.toLowerCase())).length > 0 ? (
                                    PORTALS.filter(p => p.name.toLowerCase().includes(portalSearchQuery.toLowerCase()) || p.location.toLowerCase().includes(portalSearchQuery.toLowerCase())).map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setPortalSearchQuery('');
                                                setShowPortalResults(false);
                                                handlePortalClick(p);
                                            }}
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex flex-col transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <span className="text-white text-sm font-medium">{p.name}</span>
                                            <span className="text-slate-400 text-xs">{p.location}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-4 text-slate-500 text-sm text-center">Portal bulunamadı</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute inset-0 z-0 bg-background-dark">
                    <EarthCanvas
                        ref={earthCanvasRef}
                        portals={PORTALS}
                        onPortalClick={handlePortalClick}
                        activePortalSearch={activePortalSearch}
                        onGlobeClick={() => setSidebarOpen(false)}
                    />
                </div>

                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-start gap-2 pointer-events-none">
                    <div className="pointer-events-auto glass-panel rounded-xl p-2 flex flex-col gap-1 w-11 items-center shadow-xl border border-white/10">
                        <button
                            onClick={() => togglePanel('search')}
                            className={`size-8 flex items-center justify-center rounded-lg transition-colors ${activePanel === 'search' ? 'bg-primary text-white' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`}
                            title="Search"
                        >
                            <span className="material-symbols-outlined text-[18px]">search</span>
                        </button>

                        <div className="w-full h-px bg-white/10 my-0.5"></div>

                        <button onClick={handleZoomIn} className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Zoom In">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                        <button onClick={handleZoomOut} className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Zoom Out">
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>

                        <div className="w-full h-px bg-white/10 my-0.5"></div>

                        <button onClick={handleReset} className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Reset View">
                            <span className="material-symbols-outlined text-[18px]">my_location</span>
                        </button>

                        <button
                            onClick={() => togglePanel('speed')}
                            className={`size-8 flex items-center justify-center rounded-lg transition-colors ${activePanel === 'speed' ? 'bg-primary text-white' : 'hover:bg-white/10 text-slate-300 hover:text-white'}`}
                            title="Rotation Speed"
                        >
                            <span className="material-symbols-outlined text-[18px]">speed</span>
                        </button>
                    </div>

                    {activePanel && (
                        <div className="pointer-events-auto glass-panel rounded-xl shadow-xl border border-white/10 overflow-hidden animate-fadeIn" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                            {activePanel === 'search' && (
                                <form onSubmit={handleSearch} className="p-3 w-64">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <span className="material-symbols-outlined text-[18px]">search</span>
                                        </span>
                                        <input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={handleSearchInput}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                            placeholder="City or lat, lng"
                                            type="text"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1.5 px-1">Try: London, Istanbul, Tokyo</p>
                                </form>
                            )}

                            {activePanel === 'speed' && (
                                <div className="p-3 w-56">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-slate-400">Rotation Speed</span>
                                        <span className="text-xs font-mono text-primary">{rotationSpeed.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="3"
                                        step="0.1"
                                        value={rotationSpeed}
                                        onChange={handleSpeedChange}
                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-slate-500">Stop</span>
                                        <span className="text-[10px] text-slate-500">Fast</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Minimal Floating Sidebar */}
                {selectedPortal && sidebarOpen && (
                    <aside
                        className="absolute top-24 right-6 w-80 glass-panel border border-white/20 z-50 rounded-2xl overflow-hidden shadow-2xl animate-fadeSlideLeft"
                        style={{
                            animation: 'fadeSlideLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-0.5">
                                    <h1 className="text-xl font-bold text-white tracking-tight">{selectedPortal.name}</h1>
                                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {selectedPortal.location}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/10 shadow-lg relative group">
                                <img src={selectedPortal.image} alt={selectedPortal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                    Online
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-semibold text-white uppercase tracking-wider opacity-60">Portal Biography</h3>
                                <p className="text-[12px] text-slate-300 leading-relaxed font-light italic">
                                    "{selectedPortal.bio}"
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[8px] text-slate-500 uppercase mb-0.5">Uptime</div>
                                    <div className="text-[11px] font-bold text-white">{selectedPortal.stats.uptime}</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[8px] text-slate-500 uppercase mb-0.5">Latency</div>
                                    <div className="text-[11px] font-bold text-blue-400">{selectedPortal.stats.latency}</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                                    <div className="text-[8px] text-slate-500 uppercase mb-0.5">Users</div>
                                    <div className="text-[11px] font-bold text-white">{selectedPortal.stats.users}</div>
                                </div>
                            </div>

                            <button className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-[11px] transition-all shadow-lg shadow-primary/20">
                                Connect Portal
                            </button>
                        </div>
                    </aside>
                )}
            </main>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeSlideLeft {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .glass-panel {
                    background: rgba(13, 17, 28, 0.7);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #135bec;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 6px rgba(19,91,236,0.5);
                }
            `}</style>
        </div>
    );
}
