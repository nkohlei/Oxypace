import React, { useState, useEffect, useRef } from 'react';
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
    ExternalLink
} from 'lucide-react';
import './MobileDesignShowcase.css';

// --------------------------------------------------------------------------
// ONBOARDING DATA (4 CARDS)
// --------------------------------------------------------------------------
const ONBOARDING_SLIDES = [
    {
        id: 0,
        badge: 'MODÜL 01 // AĞ & DİNAMİZM',
        title: 'EVRENSEL AĞ VE PORTALLAR',
        subtitle: 'Sınırları Olmayan Bağımsız Topluluklar',
        description: 'Bilim, teknoloji, felsefe ve derin tartışmalar için tasarlanmış bağımsız portallara anında bağlanın. Kendi uzay üssünüzü kurun veya küresel ağa dahil olun.',
        pills: ['Özerk Portallar', 'Konferans Kanalları', 'Akıllı Filtreler'],
        tagTop: 'P2P_MESH_READY',
        tagBottom: 'PORTAL_ID: #GLOBAL',
        icon: Globe
    },
    {
        id: 1,
        badge: 'MODÜL 02 // MEDYA MOTORU',
        title: 'KAYIPSIZ MEDYA & 4K İLETİM',
        subtitle: 'Sıfır Sıkıştırma, Saf Görsel Deneyim',
        description: 'Yüklediğiniz hiçbir fotoğraf veya video kaliteden ödün vermez. Akıllı doğrudan iletim protokolüyle her piksel ve her kare tam orijinal netliğinde paylaşılır.',
        pills: ['100% Orijinal Çözünürlük', '4K Video Oynatıcı', 'Kayıpsız Medya'],
        tagTop: 'RAW_COMPRESSION: 0%',
        tagBottom: '4K_UHD // HDR',
        icon: Film
    },
    {
        id: 2,
        badge: 'MODÜL 03 // KRİPTOGRAFİK GÜVENLİK',
        title: 'IŞIK HIZINDA ŞİFRELİ İLETİŞİM',
        subtitle: 'Uçtan Uca Korunan Özel Kanallar',
        description: 'Ultra düşük gecikmeli sesli odalar, anlık uçtan uca şifreli mesajlaşma ve sarsılmaz gizlilik. Mesajlarınız sadece sizin ve muhatabınızın cihazında çözülür.',
        pills: ['E2EE Kriptografi', 'Kristal Netliğinde Ses', 'Sessiz Bildirimler'],
        tagTop: 'AES-256 + E2EE',
        tagBottom: 'LATENCY: <14MS',
        icon: Lock
    },
    {
        id: 3,
        badge: 'MODÜL 04 // MONOKROM ERGONOMİ',
        title: 'AGRESİF MONOKROM ESTETİK',
        subtitle: 'Gözü Yormayan, Derin Karanlık Tasarım',
        description: 'Gereksiz renk kirliliğinden arındırılmış, OLED ekranlarda pil tasarrufu sağlayan fütüristik siyah-beyaz arayüz. Hızlı, keskin ve dikkat dağıtmayan mimari.',
        pills: ['Saf OLED Siyahı', 'Sıfır Göz Yorgunluğu', 'Yüksek Performans'],
        tagTop: 'OLED_SAVER // ON',
        tagBottom: 'CONTRAST: 1000000:1',
        icon: Zap
    }
];

// --------------------------------------------------------------------------
// WAITING SCREEN SIMULATION PHASES
// --------------------------------------------------------------------------
const WAITING_PHASES = [
    { progress: 15, label: 'Çekirdek sistem ve yerel depolama başlatılıyor...', detail: 'OK // CACHE_INITIALIZED' },
    { progress: 45, label: 'Kriptografik uçtan uca anahtarlar doğrulanıyor...', detail: 'OK // SECURE_KEYPAIR_VALID' },
    { progress: 75, label: 'Global portallar ve ses tüneli senkronize ediliyor...', detail: 'OK // SYNCING_GATEWAYS' },
    { progress: 100, label: 'Güvenli tünel hazır. Uygulamaya aktarılıyorsunuz.', detail: 'READY // TUNNEL_CONNECTED' }
];

const MobileDesignShowcase = () => {
    // Mode tabs: 'simulator' | 'matrix' | 'waiting' | 'specs'
    const [viewMode, setViewMode] = useState('simulator');
    
    // Simulator State
    const [currentSlide, setCurrentSlide] = useState(0); // 0, 1, 2, 3 = onboarding, 4 = waiting screen
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [deviceFrame, setDeviceFrame] = useState(true);

    // Waiting Screen State
    const [waitingProgress, setWaitingProgress] = useState(15);
    const [waitingPhaseIndex, setWaitingPhaseIndex] = useState(0);
    const [isWaitingSimActive, setIsWaitingSimActive] = useState(true);

    // Auto Play Interval
    useEffect(() => {
        let timer = null;
        if (isAutoPlay && viewMode === 'simulator') {
            timer = setInterval(() => {
                setCurrentSlide((prev) => (prev >= 4 ? 0 : prev + 1));
            }, 3500);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isAutoPlay, viewMode]);

    // Waiting Screen Progress Simulation
    useEffect(() => {
        let interval = null;
        if ((currentSlide === 4 || viewMode === 'waiting') && isWaitingSimActive) {
            setWaitingProgress(15);
            setWaitingPhaseIndex(0);

            interval = setInterval(() => {
                setWaitingProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    const next = prev + 5;
                    if (next >= 85) setWaitingPhaseIndex(3);
                    else if (next >= 55) setWaitingPhaseIndex(2);
                    else if (next >= 30) setWaitingPhaseIndex(1);
                    return next;
                });
            }, 200);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentSlide, viewMode, isWaitingSimActive]);

    const handleRestartWaiting = () => {
        setWaitingProgress(10);
        setWaitingPhaseIndex(0);
        setIsWaitingSimActive(false);
        setTimeout(() => setIsWaitingSimActive(true), 50);
    };

    const handleNextSlide = () => {
        if (currentSlide < 4) {
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

    // --------------------------------------------------------------------------
    // RENDER: PHONE SCREEN INTERNAL CONTENT
    // --------------------------------------------------------------------------
    const renderScreenContent = (slideIndex) => {
        // If slide is 4 -> Render Bekleme Ekranı (Waiting Screen)
        if (slideIndex === 4) {
            return (
                <div className="waiting-screen-wrapper">
                    {/* Top status bar telemetry */}
                    <div className="waiting-top-telemetry">
                        <span>OXYPACE_BOOT_v2.8.4</span>
                        <span>LATENCY: 12ms</span>
                    </div>

                    {/* Central Emblem & Orbital Rings */}
                    <div className="waiting-core-stage">
                        <div className="waiting-emblem-orbital">
                            <div className="emblem-ring-outer"></div>
                            <div className="emblem-ring-inner"></div>
                            <div className="emblem-radar-sweep"></div>
                            <div className="emblem-center-core">
                                <Sparkles size={28} color="#ffffff" />
                            </div>
                        </div>

                        <div className="waiting-title-block">
                            <h3>O X Y P A C E</h3>
                            <span className="waiting-version-tag">DECENTRALIZED SPACE NETWORK</span>
                        </div>
                    </div>

                    {/* Progress & Console Area */}
                    <div className="waiting-console-box">
                        <div className="waiting-status-label">
                            <span>SİSTEM BAŞLATILIYOR</span>
                            <span>%{waitingProgress}</span>
                        </div>

                        <div className="waiting-progress-track">
                            <div
                                className="waiting-progress-bar"
                                style={{ width: `${waitingProgress}%` }}
                            ></div>
                        </div>

                        <div className="waiting-terminal-lines">
                            {WAITING_PHASES.map((phase, idx) => (
                                <div
                                    key={idx}
                                    className={`waiting-terminal-line ${waitingPhaseIndex >= idx ? 'active' : ''}`}
                                >
                                    {waitingPhaseIndex >= idx ? `› ${phase.label}` : `· [Beklemede]`}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Action for Testing */}
                    <div className="waiting-bottom-actions">
                        <button
                            className="waiting-restart-btn"
                            onClick={handleRestartWaiting}
                            title="Yükleme simülasyonunu yeniden çalıştır"
                        >
                            <RotateCcw size={13} />
                            <span>Yeniden Test Et</span>
                        </button>
                        <button
                            className="waiting-restart-btn"
                            onClick={() => setCurrentSlide(0)}
                            title="İlk tanıtım sayfasına dön"
                        >
                            <ChevronLeft size={13} />
                            <span>Tanıtıma Dön</span>
                        </button>
                    </div>
                </div>
            );
        }

        // Otherwise -> Render Onboarding Slide (0, 1, 2, or 3)
        const slide = ONBOARDING_SLIDES[slideIndex] || ONBOARDING_SLIDES[0];
        const IconComponent = slide.icon;

        return (
            <div className="onboarding-screen-wrapper">
                {/* Top Nav */}
                <div className="onboarding-top-nav">
                    <div className="onboarding-brand">
                        <Sparkles size={14} />
                        <span>OXYPACE</span>
                    </div>
                    <button
                        className="onboarding-skip-btn"
                        onClick={() => setCurrentSlide(4)}
                        title="Tanıtımı geç ve bekleme ekranına ilerle"
                    >
                        Geç
                    </button>
                </div>

                {/* Visual Stage Illustration */}
                <div className="onboarding-visual-stage">
                    <div className="visual-orbit-ring orbit-lg"></div>
                    <div className="visual-orbit-ring orbit-md"></div>
                    
                    <div className="visual-core-center">
                        <div className="core-pulse"></div>
                        <IconComponent size={36} color="#ffffff" strokeWidth={1.75} />
                    </div>

                    <div className="visual-floating-tag tag-top-right">
                        {slide.tagTop}
                    </div>
                    <div className="visual-floating-tag tag-bottom-left">
                        {slide.tagBottom}
                    </div>
                </div>

                {/* Text Content */}
                <div className="onboarding-text-area">
                    <span className="onboarding-meta-label">{slide.badge}</span>
                    <h2 className="onboarding-headline">{slide.title}</h2>
                    <h3 className="onboarding-subtitle">{slide.subtitle}</h3>
                    <p className="onboarding-desc">{slide.description}</p>
                    
                    <div className="onboarding-pills-row">
                        {slide.pills.map((pill, i) => (
                            <span key={i} className="onboarding-pill">{pill}</span>
                        ))}
                    </div>
                </div>

                {/* Bottom Navigation & Actions */}
                <div className="onboarding-bottom-actions">
                    {/* Dots indicator */}
                    <div className="onboarding-indicators-row">
                        {ONBOARDING_SLIDES.map((_, dotIdx) => (
                            <div
                                key={dotIdx}
                                className={`indicator-dot ${currentSlide === dotIdx ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(dotIdx)}
                            ></div>
                        ))}
                        {/* 5th dot for Waiting Screen */}
                        <div
                            className={`indicator-dot ${currentSlide === 4 ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(4)}
                            title="Bekleme Ekranı"
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
                            className="onboarding-primary-btn"
                            onClick={handleNextSlide}
                        >
                            <span>{currentSlide === 3 ? 'Uygulamayı Başlat' : 'İleri'}</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: SINGLE SMARTPHONE WRAPPER
    // --------------------------------------------------------------------------
    const renderPhoneMockup = (slideIdx) => (
        <div className={`smartphone-chassis ${deviceFrame ? '' : 'no-bezel'}`}>
            <div className="phone-screen">
                {/* Realistic Status Bar */}
                <div className="phone-status-bar">
                    <span>22:15</span>
                    <div className="phone-dynamic-island">
                        <div className="island-camera"></div>
                        <div className="island-sensor"></div>
                    </div>
                    <div className="phone-status-icons">
                        <Wifi size={13} />
                        <Activity size={13} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>98%</span>
                    </div>
                </div>

                {/* Screen Content */}
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
                            Mobil uygulama açılış tanıtım sayfaları (Onboarding) ve bekleme ekranı (Splash) prototip denetleme laboratuvarı.
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
                        className={`mode-tab-btn ${viewMode === 'waiting' ? 'active' : ''}`}
                        onClick={() => {
                            setViewMode('simulator');
                            setCurrentSlide(4);
                        }}
                    >
                        <Activity size={15} />
                        <span>Bekleme Ekranı</span>
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
               TELEMETRY & STATUS STRIP
               ---------------------------------------------------------------------- */}
            <div className="mobile-showcase-telemetry">
                <div className="telemetry-left">
                    <span className="telemetry-tag">
                        <span className="telemetry-dot"></span>
                        CANLI PROTOTİP MOTORU
                    </span>
                    <span className="telemetry-tag">
                        ÇERÇEVE: iPHONE 16 PRO (393 × 852 PT)
                    </span>
                    <span className="telemetry-tag">
                        RENK MODU: OLED BLACK & WHITE (AGRESİF)
                    </span>
                </div>

                <div className="telemetry-right">
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
                        title="Cihaz çerçevesini göster/gizle"
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
                                <span className="inspector-card-badge">5 EKRAN</span>
                            </div>

                            <div className="slide-picker-list">
                                {ONBOARDING_SLIDES.map((slide, idx) => (
                                    <button
                                        key={idx}
                                        className={`slide-picker-item ${currentSlide === idx ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(idx)}
                                    >
                                        <div className="slide-picker-info">
                                            <span className="slide-picker-num">0{idx + 1} // ONBOARDING</span>
                                            <span className="slide-picker-name">{slide.title}</span>
                                        </div>
                                        <ChevronRight size={14} />
                                    </button>
                                ))}

                                <button
                                    className={`slide-picker-item ${currentSlide === 4 ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(4)}
                                >
                                    <div className="slide-picker-info">
                                        <span className="slide-picker-num">05 // SPLASH BEKLEME</span>
                                        <span className="slide-picker-name">Uygulama Bekleme Ekranı</span>
                                    </div>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Inspector: Slide Metadata & Copy */}
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Sparkles size={14} />
                                    <span>Aktif Ekran Detayları</span>
                                </span>
                                <span className="inspector-card-badge">
                                    {currentSlide === 4 ? 'SPLASH' : `SLIDE ${currentSlide + 1}`}
                                </span>
                            </div>

                            {currentSlide === 4 ? (
                                <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Prototip:</strong> Uygulama Bekleme & Bağlantı Kurma Ekranı (Splash Loading Screen).
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Görev:</strong> Tanıtım kartları tamamlandıktan veya uygulama ilk açıldığında yerel depolama yüklenirken gösterilen yüksek teknolojili bekleme katmanı.
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <strong>Radar Çekirdeği:</strong> Sürekli orbital tarama ve telemetri durum güncellemeleri barındırır.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Başlık:</strong> {ONBOARDING_SLIDES[currentSlide]?.title}
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Alt Başlık:</strong> {ONBOARDING_SLIDES[currentSlide]?.subtitle}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <strong>Vurgulanan Özellik:</strong> {ONBOARDING_SLIDES[currentSlide]?.pills.join(' • ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Real Smartphone Mockup */}
                    <div className="phone-viewport-center">
                        {renderPhoneMockup(currentSlide)}
                    </div>

                    {/* Right Inspector: Mobile Design & Flow Audit */}
                    <div className="simulator-sidebar-right">
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Check size={14} />
                                    <span>Mobil Denetim Kriterleri</span>
                                </span>
                                <span className="inspector-card-badge">UYUMLULUK</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="spec-token-row">
                                    <span>Monokrom Palet</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>%100 Siyah/Beyaz</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Mavi/Camgöbeği İzolasyonu</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Tamamen Temizlendi</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>OLED Kontrastı</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Sıfır Işık Sızıntısı</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Buton Kenar Kıvrımları</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Hafif Yumuşak (6-8px)</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Animasyon Performansı</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>60 FPS CSS Hardware</span>
                                </div>
                            </div>
                        </div>

                        {/* Implementation Blueprint */}
                        <div className="inspector-card">
                            <div className="inspector-card-header">
                                <span className="inspector-card-title">
                                    <Cpu size={14} />
                                    <span>Mobil Entegrasyon Akışı</span>
                                </span>
                                <span className="inspector-card-badge">LOGIC</span>
                            </div>

                            <pre className="spec-code-block">
{`// Mobil Giriş Kontrol Mantığı
const hasSeenOnboarding = await 
  Storage.get('oxypace_seen_onboarding');

if (!hasSeenOnboarding) {
  renderScreen('OnboardingFlow');
} else {
  renderScreen('AppWaitingSplash');
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------------------------------------------------------------
               VIEW 2: MATRIX / GRID (ALL 5 DEVICES SIDE-BY-SIDE)
               ---------------------------------------------------------------------- */}
            {viewMode === 'matrix' && (
                <div className="matrix-view-container">
                    <div className="matrix-header-note">
                        <span>
                            Tüm mobil tanıtım sayfaları ve bekleme ekranı yan yana denetim için listelenmiştir. Her cihaz bağımsız olarak incelenebilir.
                        </span>
                        <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>
                            TOPLAM 5 VARYASYON
                        </span>
                    </div>

                    <div className="matrix-devices-grid">
                        {/* 4 Onboarding Cards */}
                        {ONBOARDING_SLIDES.map((slide, idx) => (
                            <div key={idx} className="matrix-device-card">
                                <div className="matrix-card-label">
                                    <span>KART {idx + 1}: {slide.title}</span>
                                    <span style={{ color: '#888888' }}>ONBOARDING</span>
                                </div>
                                <div className="matrix-phone-frame">
                                    <div className="phone-screen">
                                        <div className="phone-inner-content">
                                            {renderScreenContent(idx)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 5th Device: Waiting Screen */}
                        <div className="matrix-device-card">
                            <div className="matrix-card-label">
                                <span>KART 5: BEKLEME EKRANI</span>
                                <span style={{ color: '#888888' }}>SPLASH LOADING</span>
                            </div>
                            <div className="matrix-phone-frame">
                                <div className="phone-screen">
                                    <div className="phone-inner-content">
                                        {renderScreenContent(4)}
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
                            <span className="inspector-card-title">🎨 Renk Belirteçleri (Color Tokens)</span>
                            <span className="inspector-card-badge">OLED B&W</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#000000' }}></div>
                                    <span>--color-oled-black</span>
                                </div>
                                <span>#000000</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#090a0f' }}></div>
                                    <span>--color-carbon-surface</span>
                                </div>
                                <span>#090a0f</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#ffffff' }}></div>
                                    <span>--color-pure-white</span>
                                </div>
                                <span>#ffffff</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#a1a1aa' }}></div>
                                    <span>--color-text-secondary</span>
                                </div>
                                <span>#a1a1aa</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                                    <span>--color-subtle-border</span>
                                </div>
                                <span>rgba(255,255,255,0.1)</span>
                            </div>
                        </div>
                    </div>

                    <div className="inspector-card">
                        <div className="inspector-card-header">
                            <span className="inspector-card-title">🔤 Tipografi & Hiyerarşi</span>
                            <span className="inspector-card-badge">GEOMETRIC</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="spec-token-row">
                                <span>Başlık (Headline)</span>
                                <span>24px / Bold 800 / Uppercase</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Alt Başlık (Subtitle)</span>
                                <span>13px / SemiBold 600</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Gövde Metni (Body)</span>
                                <span>12px / Regular 400 / Line 1.5</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Telemetri & Kod</span>
                                <span>10px / Monospace / Uppercase</span>
                            </div>
                        </div>
                    </div>

                    <div className="inspector-card">
                        <div className="inspector-card-header">
                            <span className="inspector-card-title">📱 Mobil Cihaz Çıktı Boyutları</span>
                            <span className="inspector-card-badge">RATIOS</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="spec-token-row">
                                <span>Standart En/Boy</span>
                                <span>9:19.5 (Tam Ekran Çentikli)</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Tavsiye Edilen Çözünürlük</span>
                                <span>1179 × 2556 px (3x Retinal)</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Güvenli Alan Üst (Safe Area Top)</span>
                                <span>48px / Dynamic Island Uyumlu</span>
                            </div>
                            <div className="spec-token-row">
                                <span>Güvenli Alan Alt (Safe Area Bottom)</span>
                                <span>34px / Home Indicator Bar</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileDesignShowcase;
