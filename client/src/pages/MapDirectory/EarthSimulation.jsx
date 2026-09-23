import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EarthCanvas from './EarthCanvas';
import Navbar from '../../components/Navbar';
import SubHeader from '../../components/SubHeader';
import SEO from '../../components/SEO';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { getImageUrl } from '../../utils/imageUtils';

export default function EarthSimulation() {
    const earthCanvasRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePanel, setActivePanel] = useState(null); // 'search' | 'speed' | null
    const [showMobileControls, setShowMobileControls] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPortal, setSelectedPortal] = useState(null);
    const [portalSearchQuery, setPortalSearchQuery] = useState('');
    const [showPortalResults, setShowPortalResults] = useState(false);
    const [activePortalSearch, setActivePortalSearch] = useState('');
    const [portals, setPortals] = useState([]);
    const [portalsLoading, setPortalsLoading] = useState(true);
    const [portalDetail, setPortalDetail] = useState(null); // full portal from /api/portals/:id
    const [cardLoading, setCardLoading] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [joining, setJoining] = useState(false);
    const [isNativeApp, setIsNativeApp] = useState(false);

    const resolvePortalImage = (url) => {
        if (!url) return '';
        let clean = url;
        if (url.includes('%3A') || url.includes('%2F')) {
            try {
                clean = decodeURIComponent(url);
                if (clean.includes('%3A') || clean.includes('%2F')) {
                    clean = decodeURIComponent(clean);
                }
            } catch (e) {
                console.error('Error decoding portal image URL:', e);
            }
        }
        const resolved = getImageUrl(clean);
        console.log('[Portal Image Resolution]:', resolved);
        return resolved;
    };

    useEffect(() => {
        setIsNativeApp(Capacitor.isNativePlatform());
    }, []);

    // Fetch real portals with map location from API
    useEffect(() => {
        const fetchMapPortals = async () => {
            try {
                setPortalsLoading(true);
                const res = await axios.get('/api/portals/map');
                setPortals(res.data);
            } catch (err) {
                console.error('Failed to fetch map portals', err);
                setPortals([]);
            } finally {
                setPortalsLoading(false);
            }
        };
        fetchMapPortals();
    }, []);

    const handleZoomIn = () => earthCanvasRef.current?.zoomIn();
    const handleZoomOut = () => earthCanvasRef.current?.zoomOut();
    const handleReset = () => earthCanvasRef.current?.resetView();

    const triggerPortalSearch = () => {
        const query = portalSearchQuery.trim();
        setShowPortalResults(false);
        setActivePortalSearch(query);
        if (query.length > 0) {
            // Fly the globe to face the first matching portal
            const firstMatch = portals.find(p =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                (p.label || '').toLowerCase().includes(query.toLowerCase())
            );
            if (firstMatch) {
                earthCanvasRef.current?.flyTo(firstMatch.lat, firstMatch.lng, 1.2);
            } else {
                handleReset();
            }
        } else {
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

    const handlePortalClick = useCallback(async (portal) => {
        setSidebarOpen(true);
        setSelectedPortal(portal);
        setPortalDetail(null);
        setCardLoading(true);
        earthCanvasRef.current?.flyTo(portal.lat, portal.lng, 0.05);
        try {
            const res = await axios.get(`/api/portals/${portal._id}`);
            setPortalDetail(res.data);
            setIsMember(res.data.isMember || false);
        } catch (err) {
            console.error('Failed to load portal detail', err);
        } finally {
            setCardLoading(false);
        }
    }, []);

    const handleJoinPortal = async () => {
        if (!portalDetail) return;
        setJoining(true);
        try {
            const res = await axios.post(`/api/portals/${portalDetail._id}/join`);
            if (res.data.status === 'joined') setIsMember(true);
            else if (res.data.status === 'requested') setIsMember('requested');
        } catch (err) {
            console.error('Join failed', err);
        } finally {
            setJoining(false);
        }
    };

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
            earthCanvasRef.current.flyTo(lat, lng, 1.2);
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
                earthCanvasRef.current.flyTo(lat, lng, 1.2);
            } else {
                console.warn("Location not found.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        }
    };

    // Portal search box — injected into the Navbar center slot
    const portalSearchBox = (
        <div className="map-navbar-search">
            <div className="map-navbar-search-inner">
                <span
                    onClick={triggerPortalSearch}
                    className="material-symbols-outlined map-search-icon"
                    title="Ara"
                >
                    travel_explore
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
                    className="map-navbar-search-input"
                    placeholder="Portal veya konum ara..."
                    type="text"
                />
                {portalSearchQuery.length > 0 && (
                    <span
                        onClick={clearPortalSearch}
                        className="material-symbols-outlined map-search-clear"
                        title="Temizle"
                    >
                        close
                    </span>
                )}
                {/* Dropdown results */}
                {showPortalResults && portalSearchQuery.length > 0 && (
                    <div className="map-navbar-search-dropdown">
                        {portals.filter(p =>
                            p.name.toLowerCase().includes(portalSearchQuery.toLowerCase()) ||
                            (p.label || '').toLowerCase().includes(portalSearchQuery.toLowerCase())
                        ).length > 0 ? (
                            portals
                                .filter(p =>
                                    p.name.toLowerCase().includes(portalSearchQuery.toLowerCase()) ||
                                    (p.label || '').toLowerCase().includes(portalSearchQuery.toLowerCase())
                                )
                                .map(p => (
                                    <div
                                        key={p._id}
                                        onMouseDown={() => {
                                            setPortalSearchQuery('');
                                            setShowPortalResults(false);
                                            handlePortalClick(p);
                                        }}
                                        className="map-navbar-search-result"
                                    >
                                        <span className="material-symbols-outlined map-result-icon">location_on</span>
                                        <div>
                                            <span className="map-result-name">{p.name}</span>
                                            <span className="map-result-loc">{p.label || ''}</span>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="map-navbar-no-results">Portal bulunamadı</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="map-simulation-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0d', overflow: 'hidden' }}>
            <SEO title="Portal Haritası | Oxypace" description="Tüm Oxypace portallarını interaktif 3D dünya üzerinde keşfedin." />

            {/* Unified Navbar with portal search in center */}
            <Navbar centerContent={portalSearchBox} hideThemeToggle={true} mapMode={true} />
            <div className="map-back-button-container">
                <SubHeader variant="frosted" showBack={true} />
            </div>

            <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
                {/* Globe canvas — full area */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <EarthCanvas
                        ref={earthCanvasRef}
                        portals={portals}
                        onPortalClick={handlePortalClick}
                        activePortalSearch={activePortalSearch}
                        onGlobeClick={() => setSidebarOpen(false)}
                    />
                </div>



                {/* Left controls panel */}
                <div className={`map-left-panel ${showMobileControls ? 'mobile-visible' : 'mobile-hidden'}`}>
                    <div className="map-controls-bar glass-panel borderless">
                        <div className="map-ctrl-separator desktop-only" />

                        <button
                            onClick={() => togglePanel('search')}
                            className={`map-ctrl-btn ${activePanel === 'search' ? 'active' : ''}`}
                            title="Koordinat / Şehir Ara"
                        >
                            <span className="material-symbols-outlined">my_location</span>
                        </button>

                        <div className="map-ctrl-separator" />

                        <button onClick={handleZoomIn} className="map-ctrl-btn" title="Yakınlaştır">
                            <span className="material-symbols-outlined">add</span>
                        </button>
                        <button onClick={handleZoomOut} className="map-ctrl-btn" title="Uzaklaştır">
                            <span className="material-symbols-outlined">remove</span>
                        </button>

                        <div className="map-ctrl-separator" />

                        <button onClick={handleReset} className="map-ctrl-btn" title="Görünümü Sıfırla">
                            <span className="material-symbols-outlined">explore</span>
                        </button>
                    </div>

                    {/* Expanded panel next to the controls */}
                    {activePanel && (
                        <div className="map-expanded-panel glass-panel">
                            {activePanel === 'search' && (
                                <form onSubmit={handleSearch} style={{ padding: '12px', width: '220px' }}>
                                    <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.8)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Koordinat / Şehir Ara
                                    </p>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(148,163,184,0.7)' }}>search</span>
                                        <input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={handleSearchInput}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 10px 8px 30px',
                                                fontSize: '13px',
                                                color: 'white',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                            }}
                                            placeholder="London, 41.01,28.98..."
                                            type="text"
                                        />
                                    </div>
                                    <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.5)', marginTop: '6px' }}>
                                        Enter'a bas veya 🔍'e tıkla
                                    </p>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Left controls panel Toggle Button (Mobile Only) - Attached as a Tab */}
                    <button
                        className={`map-mobile-controls-toggle glass-panel borderless ${showMobileControls ? 'active' : ''}`}
                        onClick={() => setShowMobileControls(!showMobileControls)}
                        title="Kontrolleri Göster/Gizle"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {showMobileControls ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}
                        </span>
                    </button>
                </div>

                {/* Portal detail card — slides in from right on portal click */}
                {/* Minimal Portal detail card */}
                {selectedPortal && sidebarOpen && (
                    <aside className="map-portal-card glass-panel">
                        {/* Close button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="map-portal-card-close"
                            title="Kapat"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {cardLoading ? (
                            /* Loading skeleton */
                            <div style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', width: '70%', animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ height: '11px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '45%', animation: 'pulse 1.5s infinite' }} />
                                </div>
                            </div>
                        ) : portalDetail ? (
                            <div className="map-portal-card-minimal-body">
                                {/* Top: Avatar + Identity + Tags */}
                                <div className="map-portal-card-header-compact">
                                    <div className="map-portal-avatar-wrap">
                                        {portalDetail.avatar ? (
                                            <img 
                                                src={resolvePortalImage(portalDetail.avatar)} 
                                                alt={portalDetail.name} 
                                                className="map-portal-avatar-compact" 
                                                onError={(e) => { 
                                                    e.target.onerror = null;
                                                    e.target.src = '/assets/default-avatar.png'; 
                                                }}
                                            />
                                        ) : (
                                            <div className="map-portal-avatar-compact map-portal-avatar-letter">
                                                {portalDetail.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="map-portal-info-compact">
                                        <h3 className="map-portal-name-compact">{portalDetail.name}</h3>
                                        <div className="map-portal-badges-row">
                                            <span className="map-portal-badge-pill members">
                                                <span className="dot" />
                                                {portalDetail.members?.length ?? selectedPortal.memberCount ?? 0} üye
                                            </span>
                                            <span className="map-portal-badge-pill privacy">
                                                {portalDetail.privacy === 'public' ? 'Açık' : 'Gizli'}
                                            </span>
                                            {(selectedPortal.label || portalDetail.name) && (
                                                <span className="map-portal-badge-pill location">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>location_on</span>
                                                    {selectedPortal.label || portalDetail.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bio (optional, 1 line max) */}
                                {portalDetail.description && (
                                    <p className="map-portal-bio-compact">{portalDetail.description}</p>
                                )}

                                {/* Action Buttons */}
                                <div className="map-portal-actions-compact">
                                    <Link to={`/portal/${portalDetail._id}`} className="map-portal-btn-primary">
                                        <span>Portala Git</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
                                    </Link>

                                    {isMember === true ? (
                                        <div className="map-portal-member-badge">
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                            <span>Üyesiniz</span>
                                        </div>
                                    ) : isMember === 'requested' ? (
                                        <div className="map-portal-member-badge" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                                            <span>İstendi</span>
                                        </div>
                                    ) : (
                                        <button
                                            className="map-portal-btn-secondary"
                                            onClick={handleJoinPortal}
                                            disabled={joining}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                                            <span>{joining ? '...' : 'Katıl'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(148,163,184,0.7)', fontSize: '12px' }}>
                                Portal bilgileri yüklenemedi.
                            </div>
                        )}
                    </aside>
                )}

            </main>

            <style>{`
                /* ── Map Page Scoped Styles ─────────────────────────────── */

                /* Map Mode Navbar Overrides */
                .navbar-map-mode {
                    background: rgba(13, 17, 28, 0.45) !important;
                    backdrop-filter: blur(16px) !important;
                    border-bottom: none !important;
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
                }

                .borderless {
                    border: none !important;
                    box-shadow: none !important;
                    background: rgba(13, 17, 28, 0.45) !important;
                    backdrop-filter: blur(16px) !important;
                }

                /* Navbar portal search bar */
                .map-navbar-search {
                    width: 100%;
                    max-width: 420px;
                    position: relative;
                }
                .map-navbar-search-inner {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .map-search-icon {
                    position: absolute;
                    left: 10px;
                    font-size: 18px;
                    color: rgba(148,163,184,0.7);
                    cursor: pointer;
                    transition: color 0.2s;
                    z-index: 1;
                    user-select: none;
                }
                .map-search-icon:hover { color: white; }
                .map-navbar-search-input {
                    width: 100%;
                    background: rgba(255,255,255,0.06);
                    border: none;
                    border-radius: 10px;
                    padding: 7px 36px 7px 36px;
                    font-size: 13px;
                    color: white;
                    outline: none;
                    transition: background 0.2s;
                }
                .map-navbar-search-input::placeholder { color: rgba(148,163,184,0.6); }
                .map-navbar-search-input:focus {
                    background: rgba(255,255,255,0.12);
                }
                .map-search-clear {
                    position: absolute;
                    right: 10px;
                    font-size: 16px;
                    color: rgba(148,163,184,0.6);
                    cursor: pointer;
                    transition: color 0.2s;
                    user-select: none;
                }
                .map-search-clear:hover { color: white; }
                .map-navbar-search-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: rgba(13,17,28,0.97);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    z-index: 2000;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    animation: mapDropdown 0.18s ease-out;
                }
                @keyframes mapDropdown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .map-navbar-search-result {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    cursor: pointer;
                    transition: background 0.15s;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .map-navbar-search-result:last-child { border-bottom: none; }
                .map-navbar-search-result:hover { background: rgba(255,255,255,0.07); }
                .map-result-icon {
                    font-size: 18px;
                    color: #6366f1;
                    flex-shrink: 0;
                }
                .map-result-name {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: white;
                }
                .map-result-loc {
                    display: block;
                    font-size: 11px;
                    color: rgba(148,163,184,0.7);
                }
                .map-navbar-no-results {
                    padding: 14px;
                    text-align: center;
                    font-size: 12px;
                    color: rgba(148,163,184,0.6);
                }

                /* ── Left Controls Panel ── */
                .map-mobile-controls-toggle {
                    display: none;
                    position: absolute;
                    left: 100%;
                    top: 16px; 
                    margin-left: 0px;
                    z-index: -1;
                    width: 38px;
                    height: 48px;
                    border-radius: 0 14px 14px 0 !important;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    box-shadow: 4px 4px 16px rgba(0,0,0,0.3);
                    pointer-events: auto;
                }
                .map-mobile-controls-toggle:active {
                    background: rgba(255,255,255,0.1) !important;
                }
                .map-left-panel {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    pointer-events: none;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .map-controls-bar {
                    pointer-events: auto;
                    border-radius: 14px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    width: 44px;
                    align-items: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                .map-ctrl-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: rgba(148,163,184,0.8);
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }
                .map-ctrl-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .map-ctrl-btn.active {
                    background: rgba(99,102,241,0.3);
                    color: #818cf8;
                }
                .map-ctrl-btn .material-symbols-outlined { font-size: 18px; }
                .map-ctrl-separator {
                    width: 100%;
                    height: 1px;
                    background: rgba(255,255,255,0.08);
                    margin: 2px 0;
                }
                .map-expanded-panel {
                    pointer-events: auto;
                    border-radius: 14px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    overflow: hidden;
                    animation: mapPanelIn 0.2s ease-out;
                }
                @keyframes mapPanelIn {
                    from { opacity: 0; transform: translateX(-8px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* ── Minimal Portal Detail Card ── */
                .map-portal-card {
                    position: absolute;
                    top: 76px;
                    right: 20px;
                    width: 290px;
                    border-radius: 16px;
                    overflow: hidden;
                    z-index: 50;
                    border: 1px solid rgba(255,255,255,0.12);
                    background: rgba(14, 16, 22, 0.92) !important;
                    box-shadow: 0 16px 40px rgba(0,0,0,0.65);
                    display: flex;
                    flex-direction: column;
                    animation: cardSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .map-portal-card-minimal-body {
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .map-portal-card-header-compact {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-right: 24px;
                }
                .map-portal-avatar-compact {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    flex-shrink: 0;
                }
                .map-portal-avatar-letter {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    font-size: 18px;
                    font-weight: 800;
                    color: white;
                }
                .map-portal-info-compact {
                    flex: 1;
                    min-width: 0;
                }
                .map-portal-name-compact {
                    font-size: 14px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    letter-spacing: -0.2px;
                }
                .map-portal-badges-row {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .map-portal-badge-pill {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 6px;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
                .map-portal-badge-pill.members {
                    background: rgba(34, 197, 94, 0.12);
                    color: #4ade80;
                    border: 1px solid rgba(34, 197, 94, 0.25);
                }
                .map-portal-badge-pill.members .dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #22c55e;
                }
                .map-portal-badge-pill.privacy {
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(203, 213, 225, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .map-portal-badge-pill.location {
                    background: rgba(99, 102, 241, 0.12);
                    color: #a5b4fc;
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    max-width: 90px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-bio-compact {
                    font-size: 11px;
                    color: rgba(203, 213, 225, 0.7);
                    line-height: 1.4;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-actions-compact {
                    display: flex;
                    gap: 8px;
                    margin-top: 2px;
                }
                .map-portal-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 7px 12px;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
                }
                .map-portal-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
                .map-portal-btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 7px 12px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(203,213,225,0.9);
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .map-portal-btn-secondary:hover { background: rgba(255,255,255,0.12); }
                .map-portal-member-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 7px 10px;
                    background: rgba(46,204,113,0.08);
                    border: 1px solid rgba(46,204,113,0.25);
                    border-radius: 8px;
                    color: #2ecc71;
                    font-size: 11.5px;
                    font-weight: 600;
                }
                .map-portal-card-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s;
                    z-index: 10;
                }
                .map-portal-card-close:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                }
                .map-portal-card-close .material-symbols-outlined { font-size: 15px; }

                /* Skeleton pulse */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* ── Glass panel shared ── */
                .glass-panel {
                    background: rgba(13,17,28,0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Slider thumb */
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #6366f1;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 0 6px rgba(99,102,241,0.6);
                }

                /* ── Responsive Overrides ── */
                @media (max-width: 768px) {
                    .map-mobile-controls-toggle {
                        display: flex; /* Sadece mobilde göster */
                    }
                    
                    .map-left-panel.mobile-hidden {
                        transform: translateY(-50%) translateX(calc(-100% - 16px));
                    }
                    .map-left-panel.mobile-visible {
                        transform: translateY(-50%) translateX(0);
                    }

                    .map-portal-card {
                        top: auto !important;
                        bottom: calc(16px + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))) !important;
                        left: 12px !important;
                        right: 12px !important;
                        width: calc(100% - 24px) !important;
                        max-width: 380px !important;
                        margin: 0 auto !important;
                        animation: cardSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    }
                    @keyframes cardSlideUpMobile {
                        from { opacity: 0; transform: translateY(14px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                }
            `}</style>
        </div>
    );
}
