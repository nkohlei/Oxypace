import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EarthCanvas from './EarthCanvas';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import axios from 'axios';

export default function EarthSimulation() {
    const earthCanvasRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePanel, setActivePanel] = useState(null); // 'search' | 'speed' | null
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
                <div className="map-left-panel">
                    <div className="map-controls-bar glass-panel borderless">
                        <Link to="/search" className="map-ctrl-btn" title="Arama Sayfasına Dön" style={{ color: '#fb923c' }}>
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>

                        <div className="map-ctrl-separator" />

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
                </div>

                {/* Portal detail card — slides in from right on portal click */}
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
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', width: '60%', animation: 'pulse 1.5s infinite' }} />
                                        <div style={{ height: '11px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '40%', animation: 'pulse 1.5s infinite' }} />
                                    </div>
                                </div>
                                <div style={{ height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                            </div>
                        ) : portalDetail ? (
                            <>
                                {/* Banner */}
                                <div className="map-portal-card-banner">
                                    {portalDetail.banner ? (
                                        <img src={portalDetail.banner} alt="" className="map-portal-banner-img" />
                                    ) : (
                                        <div className="map-portal-banner-fallback" />
                                    )}
                                    <div className="map-portal-banner-gradient" />
                                </div>

                                {/* Avatar + Name row */}
                                <div className="map-portal-card-identity">
                                    <div className="map-portal-card-avatar-wrap">
                                        {portalDetail.avatar ? (
                                            <img src={portalDetail.avatar} alt={portalDetail.name} className="map-portal-card-avatar" />
                                        ) : (
                                            <div className="map-portal-card-avatar-letter">{portalDetail.name[0]}</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 className="map-portal-card-title">{portalDetail.name}</h2>
                                        <p className="map-portal-card-loc">
                                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                                            {selectedPortal.label || portalDetail.name}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className="map-portal-card-stats">
                                    <div className="map-portal-stat">
                                        <span className="map-portal-stat-label">Üyeler</span>
                                        <span className="map-portal-stat-value" style={{ color: '#4ade80' }}>
                                            {portalDetail.members?.length ?? selectedPortal.memberCount ?? 0}
                                        </span>
                                    </div>
                                    <div className="map-portal-stat">
                                        <span className="map-portal-stat-label">Gizlilik</span>
                                        <span className="map-portal-stat-value" style={{ color: '#60a5fa', textTransform: 'capitalize' }}>
                                            {portalDetail.privacy === 'public' ? 'Herkese Açık' : portalDetail.privacy === 'private' ? 'Gizli' : 'Kısıtlı'}
                                        </span>
                                    </div>
                                    <div className="map-portal-stat">
                                        <span className="map-portal-stat-label">Kuruluş</span>
                                        <span className="map-portal-stat-value" style={{ fontSize: '10px' }}>
                                            {portalDetail.createdAt ? new Date(portalDetail.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                {portalDetail.description && (
                                    <div className="map-portal-card-bio">
                                        <p className="map-portal-bio-text">{portalDetail.description}</p>
                                    </div>
                                )}

                                {/* Owner info */}
                                {portalDetail.owner && (
                                    <div className="map-portal-owner-row">
                                        {portalDetail.owner.profile?.avatar ? (
                                            <img src={portalDetail.owner.profile.avatar} alt="" className="map-portal-owner-avatar" />
                                        ) : (
                                            <div className="map-portal-owner-avatar map-portal-owner-letter">
                                                {(portalDetail.owner.profile?.displayName || portalDetail.owner.username || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <span className="map-portal-owner-label">Kurucu</span>
                                            <span className="map-portal-owner-name">{portalDetail.owner.profile?.displayName || portalDetail.owner.username}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="map-portal-card-actions">
                                    <Link to={`/portal/${portalDetail._id}`} className="map-portal-btn-primary">
                                        Git
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                                    </Link>

                                    {isMember === true ? (
                                        <div className="map-portal-member-badge">
                                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                                            Üyesiniz
                                        </div>
                                    ) : isMember === 'requested' ? (
                                        <div className="map-portal-member-badge" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                                            İstek Gönderildi
                                        </div>
                                    ) : (
                                        <button
                                            className="map-portal-btn-secondary"
                                            onClick={handleJoinPortal}
                                            disabled={joining}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
                                            {joining ? 'Katılınıyor...' : 'Üye Ol'}
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(148,163,184,0.7)', fontSize: '13px' }}>
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

                /* ── Portal Detail Card ── */
                .map-portal-card {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 300px;
                    border-radius: 20px;
                    overflow: hidden;
                    z-index: 50;
                    border: 1px solid rgba(255,255,255,0.15);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    animation: cardSlideIn 0.35s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateX(24px) scale(0.97); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                .map-portal-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 16px 16px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .map-portal-card-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 3px;
                    letter-spacing: -0.3px;
                }
                .map-portal-card-loc {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 11px;
                    color: rgba(148,163,184,0.8);
                    margin: 0;
                }
                .map-portal-card-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.5);
                    border: none;
                    border-radius: 8px;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: rgba(255,255,255,0.8);
                    transition: background 0.2s;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .map-portal-card-close:hover { background: rgba(0,0,0,0.75); color: white; }
                .map-portal-card-close .material-symbols-outlined { font-size: 16px; }

                /* Banner */
                .map-portal-card-banner {
                    position: relative;
                    height: 110px;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .map-portal-banner-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .map-portal-banner-fallback {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1f3c 0%, #0d1117 100%);
                }
                .map-portal-banner-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(13,17,28,0.9) 0%, rgba(13,17,28,0.2) 60%, transparent 100%);
                }

                /* Identity row */
                .map-portal-card-identity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 14px 12px;
                    margin-top: -24px;
                    position: relative;
                    z-index: 2;
                }
                .map-portal-card-avatar-wrap {
                    flex-shrink: 0;
                }
                .map-portal-card-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: 3px solid rgba(13,17,28,1);
                    object-fit: cover;
                }
                .map-portal-card-avatar-letter {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: 3px solid rgba(13,17,28,1);
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    font-weight: 800;
                    color: white;
                }
                .map-portal-card-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 3px;
                    letter-spacing: -0.3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .map-portal-card-loc {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 11px;
                    color: rgba(148,163,184,0.8);
                    margin: 0;
                }

                /* Owner row */
                .map-portal-owner-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .map-portal-owner-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                }
                .map-portal-owner-letter {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                }
                .map-portal-owner-label {
                    display: block;
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(148,163,184,0.5);
                    font-weight: 700;
                }
                .map-portal-owner-name {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(203,213,225,0.9);
                }

                /* Member badge */
                .map-portal-member-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 8px 12px;
                    background: rgba(46,204,113,0.08);
                    border: 1px solid rgba(46,204,113,0.25);
                    border-radius: 10px;
                    color: #2ecc71;
                    font-size: 12px;
                    font-weight: 600;
                }

                /* Skeleton pulse */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .map-portal-card-stats {
                    display: grid;
                    grid-template-columns: repeat(3,1fr);
                    gap: 1px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    background: rgba(255,255,255,0.04);
                }
                .map-portal-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 10px 6px;
                    background: rgba(13,17,28,0.7);
                    gap: 2px;
                }
                .map-portal-stat-label {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(148,163,184,0.6);
                }
                .map-portal-stat-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                    font-family: monospace;
                }
                .map-portal-card-bio {
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .map-portal-bio-label {
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: rgba(148,163,184,0.55);
                    margin: 0 0 6px;
                }
                .map-portal-bio-text {
                    font-size: 11.5px;
                    color: rgba(203,213,225,0.85);
                    line-height: 1.6;
                    margin: 0;
                    font-style: italic;
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .map-portal-card-actions {
                    display: flex;
                    gap: 8px;
                    padding: 12px 16px;
                }
                .map-portal-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px 12px;
                    background: linear-gradient(135deg, #6366f1, #818cf8);
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: opacity 0.2s, transform 0.2s;
                    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
                }
                .map-portal-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
                .map-portal-btn-secondary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 9px 12px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(203,213,225,0.9);
                    font-size: 12px;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .map-portal-btn-secondary:hover { background: rgba(255,255,255,0.12); }

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
            `}</style>
        </div>
    );
}
