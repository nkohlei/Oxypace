import React, { useState, useEffect } from 'react';
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
    Compass as ExploreIcon
} from 'lucide-react';
import './MobileDesignShowcase.css';

// --------------------------------------------------------------------------
// ONBOARDING SLIDES (SADE, ZARİF, ASIL KULLANILACAK İÇERİKLER)
// --------------------------------------------------------------------------
const ONBOARDING_SLIDES = [
    {
        id: 0,
        step: '01 / 03',
        title: 'EVRENSEL AĞ VE PORTALLAR',
        subtitle: 'Sınırları Olmayan Bağımsız Topluluklar',
        description: 'Bilim, teknoloji, felsefe ve sanat için tasarlanmış bağımsız portallara anında bağlanın. Kendi uzay üssünüzü kurun veya küresel ağa dahil olun.',
        icon: Globe
    },
    {
        id: 1,
        step: '02 / 03',
        title: 'KAYIPSIZ MEDYA & 4K İLETİM',
        subtitle: 'Sıfır Sıkıştırma, Saf Görsel Netlik',
        description: 'Paylaştığınız hiçbir fotoğraf veya video kaliteden ödün vermez. Akıllı doğrudan aktarım mimarisiyle her piksel tam orijinal netliğinde sunulur.',
        icon: Film
    },
    {
        id: 2,
        step: '03 / 03',
        title: 'IŞIK HIZINDA GÜVENLİ İLETİŞİM',
        subtitle: 'Uçtan Uca Korunan Özel Odalar',
        description: 'Ultra düşük gecikmeli kristal sesli odalar, anlık mesajlaşma ve uçtan uca kriptografik gizlilik. Konuşmalarınız sadece hedef cihazlarda çözülür.',
        icon: Lock
    }
];

// --------------------------------------------------------------------------
// WAITING SCREEN PROGRESS PHASES
// --------------------------------------------------------------------------
const WAITING_PHASES = [
    { progress: 20, label: 'Çekirdek sistem ve yerel önbellek hazırlanıyor...' },
    { progress: 50, label: 'Uçtan uca şifreleme anahtarları doğrulanıyor...' },
    { progress: 80, label: 'Portallar ve veri tüneli senkronize ediliyor...' },
    { progress: 100, label: 'Bağlantı hazır. Portala aktarılıyorsunuz...' }
];

const MobileDesignShowcase = () => {
    // Mode tabs: 'simulator' | 'matrix' | 'welcome' | 'waiting' | 'specs'
    const [viewMode, setViewMode] = useState('simulator');
    
    // Theme Mode: 'dark' (OLED Siyah & Gümüş) | 'light' (Saf Beyaz & Gümüş Gri)
    const [themeMode, setThemeMode] = useState('dark');

    // Simulator Active Screen:
    // 0, 1, 2 = Onboarding Slides
    // 3 = Asıl Karşılama & İlk Giriş Ekranı (Welcome / Auth Gateway Screen)
    // 4 = Uygulama Bekleme Ekranı (Splash Loading Screen)
    const [currentSlide, setCurrentSlide] = useState(0);

    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [deviceFrame, setDeviceFrame] = useState(true);

    // Waiting Screen State
    const [waitingProgress, setWaitingProgress] = useState(20);
    const [waitingPhaseIndex, setWaitingPhaseIndex] = useState(0);
    const [isWaitingSimActive, setIsWaitingSimActive] = useState(true);

    // Auto Play Interval
    useEffect(() => {
        let timer = null;
        if (isAutoPlay && viewMode === 'simulator') {
            timer = setInterval(() => {
                setCurrentSlide((prev) => (prev >= 4 ? 0 : prev + 1));
            }, 3600);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isAutoPlay, viewMode]);

    // Waiting Screen Progress Simulation
    useEffect(() => {
        let interval = null;
        if ((currentSlide === 4 || viewMode === 'waiting') && isWaitingSimActive) {
            setWaitingProgress(20);
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
            }, 180);
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
    // RENDER 1: ONBOARDING SCREEN CONTENT (0, 1, 2)
    // --------------------------------------------------------------------------
    const renderOnboardingContent = (slideIndex) => {
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
                        onClick={() => setCurrentSlide(3)}
                        title="Tanıtımı geç ve ana karşılama sayfasına git"
                    >
                        Geç
                    </button>
                </div>

                {/* Visual Illustration Showcase Box */}
                <div className="onboarding-visual-stage">
                    <div className="visual-orbit-ring orbit-lg"></div>
                    <div className="visual-orbit-ring orbit-md"></div>
                    
                    <div className="visual-core-center">
                        <div className="core-pulse"></div>
                        <IconComponent size={34} strokeWidth={1.8} />
                    </div>
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
                    {/* Dots indicator */}
                    <div className="onboarding-indicators-row">
                        {ONBOARDING_SLIDES.map((_, dotIdx) => (
                            <div
                                key={dotIdx}
                                className={`indicator-dot ${currentSlide === dotIdx ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(dotIdx)}
                            ></div>
                        ))}
                        {/* Dot for Welcome Gateway Screen */}
                        <div
                            className={`indicator-dot ${currentSlide === 3 ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(3)}
                            title="Karşılama & İlk Giriş Ekranı"
                        ></div>
                        {/* Dot for Waiting Splash Screen */}
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
                            <span>{currentSlide === 2 ? 'Başlayın' : 'İleri'}</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER 2: ASIL KARŞILAMA & İLK GİRİŞ EKRANI (WELCOME & AUTH GATEWAY)
    // The screen user sees when not logged in, with Logo, Slogan, and Auth buttons
    // --------------------------------------------------------------------------
    const renderWelcomeContent = () => {
        return (
            <div className="welcome-screen-wrapper">
                {/* Subtle top indicator */}
                <div className="welcome-top-badge">
                    <span>OXYPACE NETWORK</span>
                </div>

                {/* Center Brand Identity: Logo + Slogan */}
                <div className="welcome-center-brand">
                    <div className="welcome-logo-box">
                        <img
                            src="/logo.png"
                            alt="Oxypace Logo"
                            className="welcome-logo-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <Sparkles size={38} className="fallback-logo-icon" />
                    </div>

                    <div className="welcome-title-slogan">
                        <h1 className="welcome-app-name">O X Y P A C E</h1>
                        <h2 className="welcome-slogan">Evrenin Yeni İletişim Ağı</h2>
                        <p className="welcome-desc">
                            Merkeziyetsiz portallar, kayıpsız 4K medya akışı ve yüksek hızlı şifreli ses odaları.
                        </p>
                    </div>
                </div>

                {/* Gateway Action Buttons */}
                <div className="welcome-actions-group">
                    <button
                        className="welcome-btn-primary"
                        onClick={() => setCurrentSlide(4)}
                        title="Giriş yapıldığında bekleme / yükleme ekranına geçer"
                    >
                        <LogIn size={16} />
                        <span>Giriş Yap</span>
                    </button>

                    <button
                        className="welcome-btn-secondary"
                        onClick={() => setCurrentSlide(4)}
                    >
                        <UserPlus size={16} />
                        <span>Hesap Oluştur</span>
                    </button>

                    <button
                        className="welcome-btn-guest"
                        onClick={() => setCurrentSlide(4)}
                    >
                        <span>Misafir Olarak Keşfet</span>
                    </button>

                    <p className="welcome-legal-text">
                        Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER 3: UYGULAMA BEKLEME EKRANI (SPLASH LOADING PROTOTYPE)
    // --------------------------------------------------------------------------
    const renderWaitingContent = () => {
        return (
            <div className="waiting-screen-wrapper">
                {/* Top status bar telemetry */}
                <div className="waiting-top-telemetry">
                    <span>OXYPACE // SECURE</span>
                    <span>12ms</span>
                </div>

                {/* Central Emblem & Orbital Rings */}
                <div className="waiting-core-stage">
                    <div className="waiting-emblem-orbital">
                        <div className="emblem-ring-outer"></div>
                        <div className="emblem-ring-inner"></div>
                        <div className="emblem-radar-sweep"></div>
                        <div className="emblem-center-core">
                            <Sparkles size={28} />
                        </div>
                    </div>

                    <div className="waiting-title-block">
                        <h3>O X Y P A C E</h3>
                        <span className="waiting-version-tag">Evrenin Yeni İletişim Ağı</span>
                    </div>
                </div>

                {/* Progress & Console Area */}
                <div className="waiting-console-box">
                    <div className="waiting-status-label">
                        <span>Uygulama Başlatılıyor</span>
                        <span>%{waitingProgress}</span>
                    </div>

                    <div className="waiting-progress-track">
                        <div
                            className="waiting-progress-bar"
                            style={{ width: `${waitingProgress}%` }}
                        ></div>
                    </div>

                    <div className="waiting-phase-text">
                        {WAITING_PHASES[waitingPhaseIndex]?.label || 'Sistem hazır...'}
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
                        onClick={() => setCurrentSlide(3)}
                        title="Asıl karşılama sayfasına dön"
                    >
                        <ChevronLeft size={13} />
                        <span>Giriş Sayfasına Dön</span>
                    </button>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: DISPATCH TO CURRENT SCREEN
    // --------------------------------------------------------------------------
    const renderScreenContent = (slideIndex) => {
        if (slideIndex === 3) {
            return renderWelcomeContent();
        }
        if (slideIndex === 4) {
            return renderWaitingContent();
        }
        return renderOnboardingContent(slideIndex);
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
                            Mobil tanıtım sayfaları (Onboarding), Asıl Karşılama Ekranı (Logo & Slogan) ve Bekleme Ekranı (Splash) prototip denetleme laboratuvarı.
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
                            setCurrentSlide(3);
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
                                            <span className="slide-picker-num">0{idx + 1} // TANITIM</span>
                                            <span className="slide-picker-name">{slide.title}</span>
                                        </div>
                                        <ChevronRight size={14} />
                                    </button>
                                ))}

                                {/* Screen 3: Welcome & Auth Gateway */}
                                <button
                                    className={`slide-picker-item ${currentSlide === 3 ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(3)}
                                >
                                    <div className="slide-picker-info">
                                        <span className="slide-picker-num">04 // ASIL EKRAN</span>
                                        <span className="slide-picker-name">Karşılama & İlk Giriş</span>
                                    </div>
                                    <span className="slide-picker-gateway-badge">ANA EKRAN</span>
                                </button>

                                {/* Screen 4: Splash Waiting */}
                                <button
                                    className={`slide-picker-item ${currentSlide === 4 ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(4)}
                                >
                                    <div className="slide-picker-info">
                                        <span className="slide-picker-num">05 // BEKLEME</span>
                                        <span className="slide-picker-name">Uygulama Bekleme Ekranı</span>
                                    </div>
                                    <ChevronRight size={14} />
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
                                    {currentSlide === 3 ? 'ASIL EKRAN' : currentSlide === 4 ? 'SPLASH' : `SLIDE ${currentSlide + 1}`}
                                </span>
                            </div>

                            {currentSlide === 3 ? (
                                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Asıl Karşılama Sayfası:</strong> Tanıtım kartları bittiğinde kullanıcının oturum açmamışken karşılaştığı ilk ana ekran.
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Bileşenler:</strong> Oxypace Logosu, <em>"Evrenin Yeni İletişim Ağı"</em> sloganı, <strong>Giriş Yap</strong>, <strong>Hesap Oluştur</strong> ve <strong>Misafir Girişi</strong> aksiyonları.
                                    </p>
                                    <p style={{ margin: 0, color: '#94a3b8' }}>
                                        Herhangi bir butona tıklandığında uygulamanın bağlantı/bekleme sekansı test edilebilir.
                                    </p>
                                </div>
                            ) : currentSlide === 4 ? (
                                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Bekleme Ekranı:</strong> Giriş yapıldığında veya uygulama ilk açıldığında yerel depolama ve tünel bağlantısı kurulurken gösterilen bekleme arayüzü.
                                    </p>
                                    <p style={{ margin: 0, color: '#94a3b8' }}>
                                        Gümüşümsü orbital radar dalgası ve aşamalı yükleme sekansı barındırır.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Tanıtım Kartı:</strong> Mobil uygulamada ilk kez açılışta gösterilecek sadeleştirilmiş özellik tanıtımı.
                                    </p>
                                    <p style={{ margin: 0, color: '#94a3b8' }}>
                                        Gereksiz teknik kalabalıktan arındırılmış, gümüş/platin vurgulu ve odaklanmış tipografi.
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
                                    <span>Tema & Görünüm Denetimi</span>
                                </span>
                                <span className="inspector-card-badge">{themeMode.toUpperCase()}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="spec-token-row">
                                    <span>Aktif Tema</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                                        {themeMode === 'dark' ? 'Karanlık (OLED & Gümüş)' : 'Aydınlık (Saf Beyaz & Gümüş)'}
                                    </span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Gümüş/Platin Vurgular</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Aktif</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Gereksiz Metin İzolasyonu</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Tamamen Temizlendi</span>
                                </div>
                                <div className="spec-token-row">
                                    <span>Gerçek Cam Efekti</span>
                                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Doğal Yansıma</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Navigation Shortcut Buttons */}
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
                                    className="waiting-restart-btn"
                                    onClick={() => setCurrentSlide(0)}
                                >
                                    <span>1. Tanıtımları Baştan Başlat</span>
                                </button>
                                <button
                                    className="waiting-restart-btn"
                                    style={{ background: '#171924', borderColor: '#cbd5e1' }}
                                    onClick={() => setCurrentSlide(3)}
                                >
                                    <span>2. Asıl Karşılama Ekranına Git</span>
                                </button>
                                <button
                                    className="waiting-restart-btn"
                                    onClick={() => setCurrentSlide(4)}
                                >
                                    <span>3. Bekleme Ekranını Test Et</span>
                                </button>
                            </div>
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
                            Tüm prototip sayfaları (3 Tanıtım + Asıl Giriş Sayfası + Bekleme Ekranı) yan yana listelenmiştir. Yukarıdaki butonla temayı Siyah veya Beyaz olarak eş zamanlı değiştirebilirsiniz.
                        </span>
                        <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>
                            TEMA: {themeMode.toUpperCase()}
                        </span>
                    </div>

                    <div className="matrix-devices-grid">
                        {/* 3 Onboarding Cards */}
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

                        {/* 4th Device: Asıl Karşılama & İlk Giriş Ekranı */}
                        <div className="matrix-device-card">
                            <div className="matrix-card-label" style={{ borderColor: '#cbd5e1' }}>
                                <span>KART 4: KARŞILAMA & GİRİŞ</span>
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

                        {/* 5th Device: Bekleme Ekranı */}
                        <div className="matrix-device-card">
                            <div className="matrix-card-label">
                                <span>KART 5: BEKLEME EKRANI</span>
                                <span style={{ color: '#888888' }}>SPLASH</span>
                            </div>
                            <div className={`matrix-phone-frame ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                <div className={`phone-screen ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`}>
                                    <div className="phone-inner-content">
                                        {renderWaitingContent()}
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
                                    <div className="spec-color-preview" style={{ background: '#cbd5e1' }}></div>
                                    <span>--color-silver-light</span>
                                </div>
                                <span>#cbd5e1 (Açık Gümüş)</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#94a3b8' }}></div>
                                    <span>--color-silver-medium</span>
                                </div>
                                <span>#94a3b8 (Platin Gri)</span>
                            </div>

                            <div className="spec-token-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="spec-color-preview" style={{ background: '#e2e8f0' }}></div>
                                    <span>--color-titanium</span>
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
{`// Mobil Uygulama Açılış Zinciri (Onboarding -> Welcome -> Splash)
1. Onboarding Flow (3 Sade Kart)
   └── "Geç" veya "Başlayın" tetiklenir
2. Karşılama & İlk Giriş (Welcome Screen)
   ├── "Giriş Yap" -> Auth Modal / Ekranı
   ├── "Hesap Oluştur" -> Kayıt Ekranı
   └── "Misafir Olarak Keşfet" -> Direkt Giriş
3. Uygulama Bekleme Ekranı (Splash Loading)
   └── Şifreli soket ve portallar bağlandığında ana arayüz açılır.`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileDesignShowcase;
