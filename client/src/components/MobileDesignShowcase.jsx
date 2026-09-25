import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
    Smartphone,
    Layers,
    Shield,
    Wifi,
    Zap,
    Play,
    Pause,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    Check,
    Lock,
    Eye,
    Globe,
    Radio,
    Sparkles,
    Film,
    Code,
    Grid,
    Sliders,
    Monitor,
    Compass,
    Activity,
    Cpu,
    ExternalLink,
    Sun,
    Moon,
    LogIn,
    UserPlus,
    Volume2,
    MessageSquare,
    Heart,
    Share2,
    Users,
    Video,
    Tv,
    FileText,
    BookOpen,
    Compass as CompassIcon,
    Search,
    MapPin,
    Flame,
    ShieldCheck,
    MoreHorizontal,
    Bookmark,
    Send,
    Quote,
    MessageCircle,
    Copy,
    Maximize2,
    CheckCircle2,
    X
} from 'lucide-react';
import './MobileDesignShowcase.css';

// --------------------------------------------------------------------------
// 5 ADET DETAYLI & SADE ONBOARDING TANITIM KARTI VERİSİ
// --------------------------------------------------------------------------
const ONBOARDING_SLIDES = [
    {
        id: 0,
        step: '01 / 05',
        title: 'ÖZGÜR PORTALLAR & YÖNETİM',
        subtitle: 'Gizli veya Herkese Açık Kendi Alanınızı Kurun',
        description: 'Kendi standartlarınıza uygun topluluklar oluşturun. Gelişmiş moderasyon araçları, özel rol yetkilendirmeleri ve tam denetimle alanınızı özgürce ve güvenle yönetin.'
    },
    {
        id: 1,
        step: '02 / 05',
        title: 'KAYIPSIZ PAYLAŞIM & ZENGİN MEDYA',
        subtitle: 'Fotoğraf, Video, PDF, GIF, YouTube ve Twitter',
        description: 'Paylaştığınız hiçbir medya sıkıştırılmaz; 4K videolar, RAW fotoğraflar ve PDF belgeler tam orijinal kalitesinde iletilir. YouTube ve Twitter bağlantıları zengin önizlemeyle sorunsuz açılır.'
    },
    {
        id: 2,
        step: '03 / 05',
        title: 'EŞ ZAMANLI İZLEME (WATCH PARTY)',
        subtitle: 'Birlikte Video, Film ve Yayın Deneyimi',
        description: 'Popüler video platformlarının URL bağlantılarını kullanarak canlı odalarda arkadaşlarınızla anlık senkronizasyonla video ve yayın izleyin; arka planda kopmayan kristal sesle sohbet edin.'
    },
    {
        id: 3,
        step: '04 / 05',
        title: '3D DÜNYA İLE KÜRESEL KEŞİF',
        subtitle: 'Zevklerinize Uygun Portalları Haritada Keşfedin',
        description: 'İlgi alanlarınıza, hobilerinize ve bilimsel konulara göre konumlandırılmış toplulukları yüksek hızlı 3D dünya haritası üzerinde coğrafi ve tematik olarak kolayca bulun.'
    },
    {
        id: 4,
        step: '05 / 05',
        title: 'EVENT HORIZON BİLİM ARŞİVİ',
        subtitle: 'Kuramsal Fizik, Uzay Hesaplamaları ve Fikirler',
        description: 'Solucan deliklerinden zaman genişlemesine, astrofizikten derin felsefi yazılara kadar Oxypace\'in özgün uzay hesaplama araçlarına ve bilimsel yayınlarına doğrudan erişin.'
    }
];

const MobileDesignShowcase = () => {
    // Mode tabs: 'simulator' | 'matrix' | 'welcome' | 'specs'
    const [viewMode, setViewMode] = useState('simulator');
    
    // Theme Mode: 'dark' (OLED Siyah & Gümüş) | 'light' (Saf Beyaz & Gümüş Gri)
    const [themeMode, setThemeMode] = useState('dark');

    // Simulator Active Screen:
    // 0, 1, 2, 3, 4 = 5 Onboarding Slides
    // 5 = Asıl Karşılama & İlk Giriş Ekranı (Welcome Main Screen)
    const [currentSlide, setCurrentSlide] = useState(0);

    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [deviceFrame, setDeviceFrame] = useState(true);

    // Replay key for logo animation
    const [logoAnimKey, setLogoAnimKey] = useState(0);

    // Interactive playable post video state
    const [isPostPlaying, setIsPostPlaying] = useState(false);
    const [postPlayTime, setPostPlayTime] = useState(0);
    const [isPostMuted, setIsPostMuted] = useState(true);
    const postVideoRef = useRef(null);

    const handleTogglePostPlay = (e) => {
        if (e) e.stopPropagation();
        setIsPostPlaying(prev => {
            const nextState = !prev;
            if (postVideoRef.current) {
                if (nextState) {
                    postVideoRef.current.play().catch(() => {
                        if (postVideoRef.current) {
                            postVideoRef.current.muted = true;
                            setIsPostMuted(true);
                            postVideoRef.current.play().catch(() => {});
                        }
                    });
                } else {
                    postVideoRef.current.pause();
                }
            }
            return nextState;
        });
    };

    // Reliable playback time progression
    useEffect(() => {
        let timer = null;
        if (isPostPlaying) {
            timer = setInterval(() => {
                setPostPlayTime(prev => (prev >= 234 ? 0 : prev + 1));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isPostPlaying]);

    // Pause post video when changing slide
    useEffect(() => {
        if (currentSlide !== 1 && isPostPlaying) {
            setIsPostPlaying(false);
            if (postVideoRef.current) {
                postVideoRef.current.pause();
            }
        }
    }, [currentSlide, isPostPlaying]);

    // Auto Play Interval
    useEffect(() => {
        let timer = null;
        if (isAutoPlay && viewMode === 'simulator') {
            timer = setInterval(() => {
                setCurrentSlide((prev) => (prev >= 5 ? 0 : prev + 1));
            }, 4200);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isAutoPlay, viewMode]);

    const handleNextSlide = () => {
        if (currentSlide < 5) {
            setCurrentSlide(currentSlide + 1);
        } else {
            setCurrentSlide(0);
        }
    };

    const handlePrevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    // Replay logo animation
    const handleReplayLogo = () => {
        setLogoAnimKey((prev) => prev + 1);
    };

    // --------------------------------------------------------------------------
    // MINI 3D EARTH CANVAS (Three.js Realistic Earth Globe with Atmosphere & Pins)
    // --------------------------------------------------------------------------
    const MiniEarthCanvas = ({ themeMode: canvasTheme }) => {
        const canvasRef = useRef(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            let animationFrameId;
            const width = canvas.parentElement?.clientWidth || 290;
            const height = canvas.parentElement?.clientHeight || 165;

            // Scene & Camera
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
            camera.position.z = 2.45;

            // WebGL Renderer
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

            // Globe Group with axial tilt
            const globeGroup = new THREE.Group();
            globeGroup.rotation.z = 0.22;
            scene.add(globeGroup);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, canvasTheme === 'light' ? 1.05 : 0.85);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
            dirLight.position.set(3, 2, 4);
            scene.add(dirLight);

            // Earth Sphere Geometry
            const radius = 0.88;
            const sphereGeo = new THREE.SphereGeometry(radius, 48, 48);

            // Procedural Canvas Texture fallback
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 512;
            fallbackCanvas.height = 256;
            const fctx = fallbackCanvas.getContext('2d');
            if (fctx) {
                fctx.fillStyle = '#08254f';
                fctx.fillRect(0, 0, 512, 256);
                fctx.fillStyle = '#10522c';
                fctx.beginPath();
                fctx.ellipse(280, 100, 70, 45, 0, 0, Math.PI * 2);
                fctx.fill();
                fctx.beginPath();
                fctx.ellipse(270, 160, 40, 50, 0.2, 0, Math.PI * 2);
                fctx.fill();
                fctx.beginPath();
                fctx.ellipse(130, 90, 45, 35, -0.2, 0, Math.PI * 2);
                fctx.fill();
                fctx.beginPath();
                fctx.ellipse(150, 170, 35, 55, 0.1, 0, Math.PI * 2);
                fctx.fill();
            }
            const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);

            const earthMaterial = new THREE.MeshStandardMaterial({
                map: fallbackTexture,
                roughness: 0.65,
                metalness: 0.1
            });

            const earthMesh = new THREE.Mesh(sphereGeo, earthMaterial);
            globeGroup.add(earthMesh);

            // Load authentic high-res blue marble texture (matches EarthCanvas.jsx)
            const loader = new THREE.TextureLoader();
            loader.load(
                '//unpkg.com/three-globe@2.24.0/example/img/earth-blue-marble.jpg',
                (loadedTex) => {
                    loadedTex.colorSpace = THREE.SRGBColorSpace;
                    earthMaterial.map = loadedTex;
                    earthMaterial.needsUpdate = true;
                },
                undefined,
                () => {
                    // Graceful fallback to procedural texture
                }
            );

            // Atmospheric feather halo
            const atmosGeo = new THREE.SphereGeometry(radius * 1.06, 32, 32);
            const atmosMat = new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
                        gl_FragColor = vec4(0.3, 0.65, 1.0, 1.0) * intensity * 1.6;
                    }
                `,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            });
            const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
            globeGroup.add(atmosMesh);

            // 3D Portal Pin Markers on surface — nötr renkler, neon yok
            const portalsData = [
                { lat: 41.0, lng: 28.9, color: 0xffffff },
                { lat: 46.2, lng: 6.1,  color: 0xd4d4d4 },
                { lat: 35.6, lng: 139.6, color: 0xffffff },
                { lat: 37.7, lng: -122.4, color: 0xd4d4d4 }
            ];

            const markersGroup = new THREE.Group();
            globeGroup.add(markersGroup);

            const latLngToVector3 = (lat, lng, r) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lng + 180) * (Math.PI / 180);
                return new THREE.Vector3(
                    -(r * Math.sin(phi) * Math.cos(theta)),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
            };

            portalsData.forEach((p) => {
                const pos = latLngToVector3(p.lat, p.lng, radius * 1.01);
                const pinGeo = new THREE.SphereGeometry(0.026, 16, 16);
                const pinMat = new THREE.MeshBasicMaterial({ color: p.color });
                const pinMesh = new THREE.Mesh(pinGeo, pinMat);
                pinMesh.position.copy(pos);
                markersGroup.add(pinMesh);

                const ringGeo = new THREE.RingGeometry(0.038, 0.052, 24);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: p.color,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.55
                });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                ringMesh.position.copy(latLngToVector3(p.lat, p.lng, radius * 1.015));
                ringMesh.lookAt(pos.clone().multiplyScalar(2));
                markersGroup.add(ringMesh);
            });

            // Initial view facing Mediterranean / Europe / Istanbul
            globeGroup.rotation.y = -Math.PI * 0.45;

            // Animation loop
            let lastTime = performance.now();
            const animate = (currentTime) => {
                animationFrameId = requestAnimationFrame(animate);
                const delta = (currentTime - lastTime) / 1000;
                lastTime = currentTime;

                // Slow rotation
                globeGroup.rotation.y += 0.28 * delta;

                renderer.render(scene, camera);
            };
            animationFrameId = requestAnimationFrame(animate);

            const handleResize = () => {
                if (!canvas.parentElement) return;
                const w = canvas.parentElement.clientWidth;
                const h = canvas.parentElement.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                cancelAnimationFrame(animationFrameId);
                renderer.dispose();
                sphereGeo.dispose();
                earthMaterial.dispose();
                atmosGeo.dispose();
                atmosMat.dispose();
            };
        }, [canvasTheme]);

        return <canvas ref={canvasRef} className="mini-earth-canvas" />;
    };

    // --------------------------------------------------------------------------
    // RENDER: 5 ADET ORİJİNAL PLATFORM GÖRÜNÜMÜ MOCKUP'I
    // --------------------------------------------------------------------------
    const renderOnboardingVisual = (slideIndex) => {
        // Şablon 1: Orijinal Portal Kart Görünümü (Birebir modern-portal-card: Oxypace Global)
        if (slideIndex === 0) {
            return (
                <div className="orig-portal-card-mockup modern-portal-card">
                    {/* Banner — birebir Search.jsx card-banner yapısı */}
                    <div
                        className="card-banner"
                        style={{
                            background: 'url(/oxypace-real-banner.png) center/cover',
                            backgroundColor: '#000000'
                        }}
                    />

                    {/* Avatar — birebir Search.jsx card-icon-wrapper */}
                    <div className="card-icon-wrapper">
                        <img
                            src="/oxypace-real-avatar.png"
                            alt="Oxypace Global"
                            className="card-icon-img"
                            width="72"
                            height="72"
                        />
                    </div>

                    {/* card-body — birebir Search.jsx */}
                    <div className="card-body">
                        <h3 className="card-title">
                            Oxypace Global
                            <CheckCircle2 size={18} strokeWidth={2.2} fill="#38bdf8" stroke="#ffffff" />
                            <span className="oxypace-privacy-pill private" title="Gizli Portal">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span className="privacy-pill-text">Gizli</span>
                            </span>
                        </h3>

                        <p className="card-desc">Bi portalcık</p>

                        <div className="card-footer">
                            <div className="member-count">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>11 <span className="member-count-text">Üye</span></span>
                            </div>
                            <button className="join-status-btn joined" onClick={(e) => e.stopPropagation()}>
                                Üyesiniz
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Şablon 2: Orijinal Post Görünümü (@oxypace kullanıcısının 6a722f8f987a926f80bc4497 ID'li gerçek postu)
        if (slideIndex === 1) {
            return (
                <div className="orig-post-card-mockup post-card">
                    <div className="post-avatar-wrapper">
                        <img
                            src="/logo.png"
                            alt="Oxypace"
                            className="post-avatar-img"
                        />
                    </div>

                    <div className="post-main-content">
                        <div className="post-header-row">
                            <div className="header-left">
                                <span className="author-name">Oxypace</span>
                                <span className="post-verified-badge" title="Doğrulanmış Hesap">
                                    <CheckCircle2 size={14} strokeWidth={2.2} fill="#38bdf8" stroke="#ffffff" />
                                </span>
                                <span className="author-username">@oxypace</span>
                                <span className="post-time">· 18 May</span>
                                <span className="oxypace-privacy-pill public" title="Herkese Açık Gönderi" style={{ marginLeft: '4px' }}>
                                    <Globe size={10} />
                                    <span className="privacy-pill-text">Herkese Açık</span>
                                </span>
                            </div>
                            <div className="post-action-buttons">
                                <button className="post-action-btn" title="Gönderiyi Göster" aria-label="Gönderiyi Göster">
                                    <Maximize2 size={13} />
                                </button>
                                <button className="post-action-btn" title="Daha Fazla" aria-label="Daha Fazla">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="post-content-text">
                            <p>Concerning Hobbits (Howard Shore) - Music Video - Lord of the Rings</p>
                        </div>

                        <div className="post-media-box">
                            <div 
                                className="post-video-player-frame playable"
                                onClick={handleTogglePostPlay}
                                title={isPostPlaying ? "Videoyu Duraklat" : "Videoyu Oynat"}
                            >
                                <video
                                    ref={postVideoRef}
                                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                                    className="post-real-video"
                                    playsInline
                                    loop
                                    preload="auto"
                                    muted={isPostMuted}
                                    onPlay={() => setIsPostPlaying(true)}
                                    onPause={() => setIsPostPlaying(false)}
                                    onTimeUpdate={(e) => setPostPlayTime(e.target.currentTime)}
                                />

                                {!isPostPlaying && (
                                    <div className="video-poster-art">
                                        <div className="video-play-orb">
                                            <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                                        </div>
                                    </div>
                                )}

                                <div className="video-top-badges">
                                    <span className="video-quality-tag">1080p 60fps</span>
                                    <span className="video-duration-tag">
                                        {`${Math.floor(postPlayTime / 60)}:${String(Math.floor(postPlayTime % 60)).padStart(2, '0')} / 03:54`}
                                    </span>
                                </div>

                                <div className="post-video-bottom-bar" onClick={(e) => e.stopPropagation()}>
                                    <div className="post-video-scrub-track">
                                        <div 
                                            className="post-video-scrub-filled" 
                                            style={{ width: `${Math.min(100, (postPlayTime / 234) * 100)}%` }} 
                                        />
                                    </div>
                                    <div className="post-video-ctrl-btns">
                                        <button 
                                            type="button"
                                            className="mini-ctrl-btn" 
                                            onClick={handleTogglePostPlay}
                                            title={isPostPlaying ? "Duraklat" : "Oynat"}
                                        >
                                            {isPostPlaying ? <Pause size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                                        </button>
                                        <button 
                                            type="button"
                                            className="mini-ctrl-btn" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsPostMuted(m => {
                                                    if (postVideoRef.current) postVideoRef.current.muted = !m;
                                                    return !m;
                                                });
                                            }}
                                            title={isPostMuted ? "Sesi Aç" : "Sesi Kapat"}
                                        >
                                            {isPostMuted ? <Volume2 size={12} style={{ opacity: 0.5 }} /> : <Volume2 size={12} />}
                                        </button>
                                        <span className="post-video-live-timer">
                                            {isPostPlaying ? 'Oynatılıyor' : 'Tıkla & Oynat'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="post-video-id-badge">
                                <Film size={11} className="video-id-icon" />
                                <span className="video-id-label">Video ID:</span>
                                <code className="video-id-val">6a722f8f987a926f80bc4497</code>
                                <Copy size={11} className="copy-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Şablon 3: Orijinal Canlı Watch Party (WatchPartyPlayer.jsx)
        if (slideIndex === 2) {
            return (
                <div className="orig-watch-party-mockup watch-party-player-wrapper">
                    {/* Header Bar matching WatchPartyPlayer.jsx */}
                    <div className="watch-party-header">
                        <div className="watch-party-header-left">
                            <span className="watch-party-title">Birlikte Video İzle (HLS)</span>
                            <span className="watch-party-live-badge-inline">Canlı</span>
                        </div>
                        <button className="watch-party-stop-btn danger" title="Birlikte İzle Modunu Kapat">
                            <X size={12} />
                            <span>Bitir</span>
                        </button>
                    </div>

                    {/* Native Video Player Container */}
                    <div className="watch-party-player-container">
                        <div className="watch-party-media-screen">
                            <div className="watch-party-playing-tag">
                                <Play size={10} fill="#ffffff" />
                                <span>Lord of the Rings - Senkronize Yayın</span>
                            </div>
                        </div>

                        {/* Native VOD Controls Bar matching WatchPartyPlayer.jsx */}
                        <div className="watch-party-vod-controls">
                            <button className="watch-party-vod-btn" title="Duraklat">
                                <Pause size={12} fill="currentColor" />
                            </button>
                            <span className="watch-party-vod-time">
                                01:24:18 / 03:54:00
                            </span>
                            <div className="watch-party-vod-progress-wrapper">
                                <div className="watch-party-vod-track">
                                    <div className="watch-party-vod-filled" style={{ width: '36%' }} />
                                </div>
                            </div>
                            <Volume2 size={12} style={{ opacity: 0.8 }} />
                        </div>
                    </div>

                    {/* Connected Voice Channel Strip matching VoiceChannel.jsx */}
                    <div className="watch-party-voice-members">
                        <div className="voice-member-chip speaking" title="@oxypace (Konuşuyor)">
                            <img src="/oxypace-real-avatar.png" alt="Oxypace" className="voice-member-avatar" />
                            <span className="voice-member-name">Oxypace</span>
                            <span className="voice-speaking-wave" />
                        </div>
                    </div>
                </div>
            );
        }

        // Şablon 4: Orijinal 3D Dünya Haritası Görünümü (EarthSimulation.jsx)
        if (slideIndex === 3) {
            return (
                <div className="orig-globe-mockup">
                    <MiniEarthCanvas themeMode={themeMode} />
                </div>
            );
        }

        // Şablon 5: Orijinal Event Horizon / Bilimsel Hesaplama Görünümü
        return (
            <div className="orig-eh-mockup">
                <div className="orig-eh-header">
                    <span className="orig-eh-badge">EVENT HORIZON // ARŞİV</span>
                    <span className="orig-eh-sub">BİLİMSEL HESAPLAMA</span>
                </div>

                <h4 className="orig-eh-title">Morris-Thorne Geçilebilir Solucan Deliği</h4>

                <div className="orig-eh-equation-box">
                    <code>ds² = -c²dt² + dr²/(1 - b(r)/r) + r²(dθ² + sin²θ dφ²)</code>
                </div>

                <div className="orig-eh-metrics-grid">
                    <div className="orig-eh-metric-item">
                        <span className="orig-metric-label">BOĞAZ ÇAPI (r₀)</span>
                        <span className="orig-metric-val">1.00 km</span>
                    </div>
                    <div className="orig-eh-metric-item">
                        <span className="orig-metric-label">EGZOTİK MADDE</span>
                        <span className="orig-metric-val">τ₀ &lt; 0</span>
                    </div>
                    <div className="orig-eh-metric-item">
                        <span className="orig-metric-label">GELGİT KUVVETİ</span>
                        <span className="orig-metric-val">0.98 g</span>
                    </div>
                </div>

                <div className="orig-eh-verified-pill">
                    <Check size={11} strokeWidth={3} />
                    <span>Stabil Morris-Thorne Çözümü Doğrulandı</span>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: ONBOARDING SCREEN (0, 1, 2, 3, 4)
    // --------------------------------------------------------------------------
    const renderOnboardingContent = (slideIndex) => {
        const slide = ONBOARDING_SLIDES[slideIndex] || ONBOARDING_SLIDES[0];

        return (
            <div className="onboarding-screen-wrapper">
                {/* Top Nav: Dual Logos (Emblem + Text logo) */}
                <div className="onboarding-top-nav">
                    <div className="onboarding-brand-dual">
                        <img src="/logo.png" alt="Oxypace Emblem" className="onboarding-brand-emblem" />
                        <img src="/oxypace-text-logo2.webp" alt="Oxypace" className="onboarding-brand-text" />
                    </div>
                    <button
                        className="onboarding-skip-btn"
                        onClick={() => setCurrentSlide(5)}
                        title="Tanıtımı geç ve ana karşılama sayfasına git"
                    >
                        Geç
                    </button>
                </div>

                {/* Animated UI Illustration Stage */}
                <div className="onboarding-visual-stage">
                    {renderOnboardingVisual(slideIndex)}
                </div>

                {/* Text Content Area */}
                <div className="onboarding-text-area">
                    <div className="onboarding-step-pill">{slide.step}</div>
                    <h2 className="onboarding-headline">{slide.title}</h2>
                    <h3 className="onboarding-subtitle">{slide.subtitle}</h3>
                    <p className="onboarding-desc">{slide.description}</p>
                </div>

                {/* Bottom Navigation & Actions */}
                <div className="onboarding-bottom-actions">
                    {/* Dots indicator (5 Onboarding + 1 Welcome) */}
                    <div className="onboarding-indicators-row">
                        {ONBOARDING_SLIDES.map((_, dotIdx) => (
                            <div
                                key={dotIdx}
                                className={`indicator-dot ${currentSlide === dotIdx ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(dotIdx)}
                            ></div>
                        ))}
                        {/* Dot for Welcome Main Screen */}
                        <div
                            className={`indicator-dot ${currentSlide === 5 ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(5)}
                            title="Karşılama & İlk Giriş Ekranı"
                        ></div>
                    </div>

                    <div className="onboarding-nav-btns">
                        {currentSlide > 0 && (
                            <button
                                className="onboarding-back-btn"
                                onClick={handlePrevSlide}
                                title="Önceki Sayfa"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        
                        <button
                            className="mobile-silver-primary-btn"
                            onClick={handleNextSlide}
                        >
                            <span>{currentSlide === 4 ? 'Başlayın' : 'İleri'}</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: ASIL KARŞILAMA VE İLK GİRİŞ EKRANI (WELCOME & AUTH MAIN SCREEN)
    // --------------------------------------------------------------------------
    const renderWelcomeContent = () => {
        return (
            <div className="welcome-screen-wrapper">
                {/* Spacer / Replay animation trigger */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <button
                        className="replay-logo-anim-btn"
                        onClick={handleReplayLogo}
                        title="Logo animasyonunu yeniden izle"
                    >
                        <RotateCcw size={11} />
                        <span>Animasyonu Yeniden Oynat</span>
                    </button>
                </div>

                {/* Center Brand Identity: Reversible Animated Logo Lockup */}
                <div className="welcome-center-brand">
                    <div className="welcome-brand-lockup" key={logoAnimKey}>
                        <img
                            src="/logo.png"
                            alt="Oxypace Emblem"
                            className="welcome-emblem-img"
                        />
                        <img
                            src="/oxypace-text-logo2.webp"
                            alt="OXYPACE"
                            className="welcome-text-logo-img"
                        />
                    </div>

                    {/* Slogan: Minimal, Iconic Steve Jobs quote in Handwritten Cursive Style */}
                    <p className="welcome-slogan-quote">
                        "The people who are crazy enough to think they can change the world are the ones who do."
                    </p>
                </div>

                {/* Gateway Action Buttons (No Misafir button!) */}
                <div className="welcome-actions-group">
                    <button
                        className="mobile-silver-primary-btn"
                        onClick={() => alert('Giriş ekranına yönlendiriliyorsunuz.')}
                    >
                        <LogIn size={16} />
                        <span>Giriş Yap</span>
                    </button>

                    <button
                        className="mobile-silver-secondary-btn"
                        onClick={() => alert('Kayıt olma ekranına yönlendiriliyorsunuz.')}
                    >
                        <UserPlus size={16} />
                        <span>Hesap Oluştur</span>
                    </button>

                    <p className="welcome-legal-text">
                        Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: DISPATCH TO CURRENT SCREEN WITH SLIDE ANIMATION
    // --------------------------------------------------------------------------
    const renderScreenContent = (slideIndex) => {
        return (
            <div key={slideIndex} className="slide-screen-animated">
                {slideIndex === 5 ? renderWelcomeContent() : renderOnboardingContent(slideIndex)}
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: PHONE MOCKUP WITH THEME SUPPORT (DARK & LIGHT)
    // --------------------------------------------------------------------------
    const renderPhoneMockup = (slideIdx) => (
        <div className={`smartphone-chassis ${themeMode === 'light' ? 'theme-light' : 'theme-dark'} ${deviceFrame ? '' : 'no-bezel'}`}>
            <div className={`phone-screen ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                {/* Screen Glass Reflection */}
                <div className="phone-glass-reflection"></div>

                {/* Realistic Status Bar */}
                <div className="phone-status-bar">
                    <span>22:15</span>
                    <div className="phone-dynamic-island">
                        <div className="island-camera"></div>
                        <div className="island-sensor"></div>
                    </div>
                    <div className="phone-status-icons">
                        <Wifi size={13} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>5G</span>
                        <div className="battery-icon-wrap">
                            <div className="battery-body">
                                <div className="battery-level"></div>
                            </div>
                            <div className="battery-cap"></div>
                        </div>
                    </div>
                </div>

                {/* Screen Content with slide animation */}
                <div className="phone-inner-content">
                    {renderScreenContent(slideIdx)}
                </div>

                {/* Home Indicator Bar */}
                <div className="phone-home-indicator"></div>
            </div>
        </div>
    );

    return (
        <div className="mobile-showcase-container">
            {/* ----------------------------------------------------------------------
               HEADER & TOP ACTION BAR
               ---------------------------------------------------------------------- */}
            <header className="mobile-showcase-header">
                <div className="mobile-showcase-title-area">
                    <div className="mobile-showcase-icon-badge">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2>Mobil Tasarım Barındırma</h2>
                        <p className="mobile-showcase-subtitle">
                            5 Özgün Tanıtım Sayfası (Onboarding) ve Asıl Karşılama Ekranı (Logo & Slogan) prototip laboratuvarı.
                        </p>
                    </div>
                </div>

                {/* View Mode Navigation */}
                <div className="mobile-showcase-controls">
                    <button
                        className={`mode-tab-btn ${viewMode === 'simulator' ? 'active' : ''}`}
                        onClick={() => setViewMode('simulator')}
                    >
                        <Smartphone size={15} />
                        <span>İnteraktif Simülatör</span>
                    </button>

                    <button
                        className={`mode-tab-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                        onClick={() => setViewMode('matrix')}
                    >
                        <Grid size={15} />
                        <span>Bütünsel Matris (Grid)</span>
                    </button>

                    <button
                        className={`mode-tab-btn ${viewMode === 'welcome' ? 'active' : ''}`}
                        onClick={() => {
                            setViewMode('simulator');
                            setCurrentSlide(5);
                            setLogoAnimKey((k) => k + 1);
                        }}
                    >
                        <Sparkles size={15} />
                        <span>Asıl Giriş Ekranı</span>
                    </button>

                    <button
                        className={`mode-tab-btn ${viewMode === 'specs' ? 'active' : ''}`}
                        onClick={() => setViewMode('specs')}
                    >
                        <Code size={15} />
                        <span>Mobil Spesifikasyonlar</span>
                    </button>
                </div>
            </header>

            {/* ----------------------------------------------------------------------
               TELEMETRY & STATUS STRIP (THEME SWITCHER & CONTROLS)
               ---------------------------------------------------------------------- */}
            <div className="mobile-showcase-telemetry">
                <div className="telemetry-left">
                    <span className="telemetry-tag">
                        <span className="telemetry-dot"></span>
                        CANLI MOBİL PROTOTİP
                    </span>
                    <span className="telemetry-tag">
                        CİHAZ: iPHONE 16 PRO (TITANIUM)
                    </span>
                </div>

                <div className="telemetry-right">
                    {/* Dark vs Light Theme Switcher */}
                    <button
                        className={`theme-switch-btn ${themeMode === 'light' ? 'light-mode' : 'dark-mode'}`}
                        onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                        title="Prototip temasını Siyah (OLED/Gümüş) veya Beyaz (Saf Beyaz/Gümüş Gri) olarak değiştir"
                    >
                        {themeMode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                        <span>{themeMode === 'dark' ? 'Karanlık Tema (OLED)' : 'Aydınlık Tema (Beyaz)'}</span>
                    </button>

                    <button
                        className={`telemetry-btn ${isAutoPlay ? 'active' : ''}`}
                        onClick={() => setIsAutoPlay(!isAutoPlay)}
                        title="Sayfalar arası otomatik geçişi aç/kapat"
                    >
                        {isAutoPlay ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isAutoPlay ? 'Otomatik Oynat: Açık' : 'Otomatik Oynat'}</span>
                    </button>

                    <button
                        className="telemetry-btn"
                        onClick={() => setDeviceFrame(!deviceFrame)}
                        title="Cihaz kasasını göster/gizle"
                    >
                        <Sliders size={13} />
                        <span>{deviceFrame ? 'Çerçeve: Var' : 'Çerçeve: Yok'}</span>
                    </button>
                </div>
            </div>

            {/* ----------------------------------------------------------------------
               VIEW 1: INTERACTIVE SIMULATOR
               ---------------------------------------------------------------------- */}
            {viewMode === 'simulator' && (
                <div className="simulator-layout">
                    {/* Left Inspector: Screen Selector & Hierarchy */}
                    <div className="simulator-sidebar-left">
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Layers size={14} />
                                    <span>Ekran Gezgini</span>
                                </span>
                                <span className="inspector-card-badge">6 EKRAN</span>
                            </div>

                            <div className="slide-picker-list">
                                {ONBOARDING_SLIDES.map((slide, idx) => (
                                    <button
                                        key={idx}
                                        className={`slide-picker-item ${currentSlide === idx ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(idx)}
                                    >
                                        <div className="slide-picker-info">
                                            <span className="slide-picker-num">0{idx + 1} // TANITIM</span>
                                            <span className="slide-picker-name">{slide.title}</span>
                                        </div>
                                        <ChevronRight size={14} />
                                    </button>
                                ))}

                                {/* Screen 5: Welcome & Auth Main Screen */}
                                <button
                                    className={`slide-picker-item ${currentSlide === 5 ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentSlide(5);
                                        setLogoAnimKey((k) => k + 1);
                                    }}
                                >
                                    <div className="slide-picker-info">
                                        <span className="slide-picker-num">06 // ASIL EKRAN</span>
                                        <span className="slide-picker-name">Karşılama & İlk Giriş</span>
                                    </div>
                                    <span className="slide-picker-gateway-badge">ANA EKRAN</span>
                                </button>
                            </div>
                        </div>

                        {/* Inspector: Slide Metadata */}
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Sparkles size={14} />
                                    <span>Aktif Ekran Amacı</span>
                                </span>
                                <span className="inspector-card-badge">
                                    {currentSlide === 5 ? 'ANA EKRAN' : `SLIDE ${currentSlide + 1}`}
                                </span>
                            </div>

                            {currentSlide === 5 ? (
                                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Asıl Karşılama Sayfası:</strong> Tanıtım kartları bittiğinde kullanıcının oturum açmamışken karşılaştığı ilk ana ekran.
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Geri Çekilmeli Logo Animasyonu:</strong> Önce ana amblem görünür; hemen ardından OXYPACE yazı logosu sağdan süzülerek belirir ve ardından geri çekilerek gizlenir, ana logo ortada kalır.
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <strong>El Yazısı Slogan:</strong> Minimal ve zarif italik hat ile Steve Jobs alıntısı.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>{ONBOARDING_SLIDES[currentSlide]?.title}:</strong> {ONBOARDING_SLIDES[currentSlide]?.subtitle}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        Platforma özel gerçek arayüz bileşenleri (Portal Yönetimi, 4K Kayıpsız Medya, Eş Zamanlı Watch Party, 3D Harita veya Event Horizon) canlı animasyonlu olarak temsil edilmiştir.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Real Smartphone Mockup */}
                    <div className="phone-viewport-center">
                        {renderPhoneMockup(currentSlide)}
                    </div>

                    {/* Right Inspector: Theme & Flow Controls */}
                    <div className="simulator-sidebar-right">
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Sun size={14} />
                                    <span>Görünüm & Tema Denetimi</span>
                                </span>
                                <span className="inspector-card-badge">{themeMode.toUpperCase()}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="spec-token-row">
                                    <span>Seçili Tema</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                                        {themeMode === 'dark' ? 'Karanlık (OLED & Gümüş)' : 'Aydınlık (Saf Beyaz & Gümüş)'}
                                    </span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Tanıtım Sayfası</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>5 Özel Şablon</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Sol Üst Köşe</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Birebir Çift Logo</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Sayfa Geçişleri</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Animasyonlu Süzülme</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Logo Animasyonu</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Açıl &rarr; Göster &rarr; Gizlen</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Flow Shortcuts */}
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Cpu size={14} />
                                    <span>Hızlı Akış Testi</span>
                                </span>
                                <span className="inspector-card-badge">AKIS</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    className="mode-tab-btn"
                                    style={{ justifyContent: 'center' }}
                                    onClick={() => setCurrentSlide(0)}
                                >
                                    <span>1. Tanıtımları Baştan Başlat</span>
                                </button>
                                <button
                                    className="mode-tab-btn active"
                                    style={{ justifyContent: 'center' }}
                                    onClick={() => {
                                        setCurrentSlide(5);
                                        setLogoAnimKey((k) => k + 1);
                                    }}
                                >
                                    <span>2. Asıl Karşılama Ekranına Git</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------------
               VIEW 2: MATRIX / GRID (ALL 6 DEVICES SIDE-BY-SIDE)
               ---------------------------------------------------------------------- */}
            {viewMode === 'matrix' && (
                <div className="matrix-view-container">
                    <div className="matrix-header-note">
                        <span>
                            Tüm prototip sayfaları (5 Tanıtım + Asıl Giriş Sayfası) yan yana listelenmiştir. Yukarıdaki butonla temayı Siyah veya Beyaz olarak eş zamanlı değiştirebilirsiniz.
                        </span>
                        <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>
                            TEMA: {themeMode.toUpperCase()}
                        </span>
                    </div>

                    <div className="matrix-devices-grid">
                        {/* 5 Onboarding Cards */}
                        {ONBOARDING_SLIDES.map((slide, idx) => (
                            <div key={idx} className="matrix-device-card">
                                <div className="matrix-card-label">
                                    <span>KART {idx + 1}: {slide.title}</span>
                                    <span style={{ color: '#888888' }}>TANITIM</span>
                                </div>
                                <div className={`matrix-phone-frame ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                    <div className={`phone-screen ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                        <div className="phone-inner-content">
                                            {renderOnboardingContent(idx)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 6th Device: Asıl Karşılama & İlk Giriş Ekranı */}
                        <div className="matrix-device-card">
                            <div className="matrix-card-label" style={{ borderColor: '#cbd5e1' }}>
                                <span>KART 6: KARŞILAMA & GİRİŞ</span>
                                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>ASIL EKRAN</span>
                            </div>
                            <div className={`matrix-phone-frame ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                <div className={`phone-screen ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                    <div className="phone-inner-content">
                                        {renderWelcomeContent()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------------
               VIEW 3: DESIGN SPECIFICATIONS & TOKENS
               ---------------------------------------------------------------------- */}
            {viewMode === 'specs' && (
                <div className="specs-view-container">
                    <div className="inspector-card">
                        <div className="inspector-card-header">
                            <span className="inspector-card-title">🎨 Gümüşümsü & Monokrom Palet</span>
                            <span className="inspector-card-badge">DUAL THEME</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#000000' }}></div>
                                    <span>--color-oled-black</span>
                                </div>
                                <span>#000000 (Karanlık Zemin)</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#ffffff' }}></div>
                                    <span>--color-pure-white</span>
                                </div>
                                <span>#ffffff (Aydınlık Zemin)</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)' }}></div>
                                    <span>--btn-silver-metallic</span>
                                </div>
                                <span>#f8fafc &rarr; #cbd5e1 (Platform Butonu)</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#e2e8f0' }}></div>
                                    <span>--color-titanium-border</span>
                                </div>
                                <span>#e2e8f0 (Titanyum Kenarlık)</span>
                            </div>
                        </div>
                    </div>

                    <div className="inspector-card">
                        <div className="inspector-card-header">
                            <span className="inspector-card-title">📱 Mobil Akış Mimarisi</span>
                            <span className="inspector-card-badge">ROUTING</span>
                        </div>

                        <pre className="spec-code-block">
{`// Mobil Uygulama Açılış Zinciri (5 Onboarding -> Welcome)
1. Onboarding Flow (5 Detaylı & Sade Kart)
   ├── 01: Özgür Portallar & Tam Yetki Moderatörlük
   ├── 02: Kayıpsız Medya (Görsel/Video/PDF/GIF/YouTube/X)
   ├── 03: Canlı Oda & Eş Zamanlı Watch Party + Kesintisiz Ses
   ├── 04: Yüksek Hızlı 3D Dünya Haritası ile Küresel Keşif
   ├── 05: Event Horizon Bilim, Fizik & Uzay Hesaplamaları
   └── "Geç" veya "Başlayın" tıklandığında:
2. Karşılama & İlk Giriş (Welcome Screen)
   ├── Reversible Logo Animasyonu:
   │   [Emblem belirir] -> [OXYPACE sağdan açılır] -> [OXYPACE geri çekilir] -> [Emblem ortada kalır]
   ├── Slogan: "The people who are crazy enough to think they can change the world are the ones who do." (El Yazısı)
   ├── "Giriş Yap" (Gümüşümsü Buton) -> Auth
   └── "Hesap Oluştur" (Gümüş Çerçeve Buton) -> Kayıt`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileDesignShowcase;
