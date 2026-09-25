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
    Volume2,
    MessageSquare,
    Heart,
    Share2,
    Users
} from 'lucide-react';
import './MobileDesignShowcase.css';

// --------------------------------------------------------------------------
// ONBOARDING SLIDES (GERÇEK OXYPACE PLATFORM TEMASINA UYGUN, SADE)
// --------------------------------------------------------------------------
const ONBOARDING_SLIDES = [
    {
        id: 0,
        step: '01 / 03',
        title: 'EVRENSEL AĞ VE PORTALLAR',
        subtitle: 'Sınırları Olmayan Bağımsız Topluluklar',
        description: 'Bilim, teknoloji, felsefe ve sanat için tasarlanmış bağımsız portallara anında bağlanın. Kendi uzay üssünüzü kurun veya küresel ağa dahil olun.'
    },
    {
        id: 1,
        step: '02 / 03',
        title: 'KAYIPSIZ MEDYA & 4K İLETİM',
        subtitle: 'Sıfır Sıkıştırma, Saf Görsel Netlik',
        description: 'Paylaştığınız hiçbir fotoğraf veya video kaliteden ödün vermez. Akıllı doğrudan aktarım mimarisiyle her kare tam orijinal netliğinde sunulur.'
    },
    {
        id: 2,
        step: '03 / 03',
        title: 'IŞIK HIZINDA GÜVENLİ İLETİŞİM',
        subtitle: 'Uçtan Uca Korunan Özel Odalar',
        description: 'Ultra düşük gecikmeli kristal sesli odalar, anlık mesajlaşma ve uçtan uca kriptografik gizlilik. Konuşmalarınız sadece hedef cihazlarda çözülür.'
    }
];

const MobileDesignShowcase = () => {
    // Mode tabs: 'simulator' | 'matrix' | 'welcome' | 'specs'
    const [viewMode, setViewMode] = useState('simulator');
    
    // Theme Mode: 'dark' (OLED Siyah & Gümüş) | 'light' (Saf Beyaz & Gümüş Gri)
    const [themeMode, setThemeMode] = useState('dark');

    // Simulator Active Screen:
    // 0, 1, 2 = Onboarding Slides
    // 3 = Asıl Karşılama & İlk Giriş Ekranı (Welcome Main Screen)
    const [currentSlide, setCurrentSlide] = useState(0);

    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [deviceFrame, setDeviceFrame] = useState(true);

    // Replay key for logo animation
    const [logoAnimKey, setLogoAnimKey] = useState(0);

    // Auto Play Interval
    useEffect(() => {
        let timer = null;
        if (isAutoPlay && viewMode === 'simulator') {
            timer = setInterval(() => {
                setCurrentSlide((prev) => (prev >= 3 ? 0 : prev + 1));
            }, 3800);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isAutoPlay, viewMode]);

    const handleNextSlide = () => {
        if (currentSlide < 3) {
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
    // RENDER: AUTHENTIC UI ILLUSTRATIONS FOR ONBOARDING
    // --------------------------------------------------------------------------
    const renderOnboardingVisual = (slideIndex) => {
        // Slide 0: Authentic Portal Card Preview
        if (slideIndex === 0) {
            return (
                <div className="ui-mockup-portal-card">
                    <div className="ui-portal-card-top">
                        <span className="ui-portal-tag">#KUANTUM-FIZIGI</span>
                        <div className="ui-portal-status-online">
                            <span className="telemetry-dot" style={{ width: '5px', height: '5px' }}></span>
                            <span>142 Çevrimiçi</span>
                        </div>
                    </div>
                    <h4 className="ui-portal-title">Derin Uzay & Evren Portalı</h4>
                    <div className="ui-portal-channels-row">
                        <span className="ui-portal-channel-pill">💬 #genel-tartisma</span>
                        <span className="ui-portal-channel-pill">🎙️ Ses Odası (Aktif)</span>
                    </div>
                </div>
            );
        }

        // Slide 1: Authentic Lossless Media Post Preview
        if (slideIndex === 1) {
            return (
                <div className="ui-mockup-media-card">
                    <div className="ui-media-author-bar">
                        <div className="ui-media-avatar">OX</div>
                        <div>
                            <span className="ui-media-author-name">@oxypace</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Kayıpsız Medya Yayını</span>
                        </div>
                    </div>
                    <div className="ui-media-frame">
                        <Sparkles size={28} style={{ opacity: 0.4 }} />
                        <span className="ui-media-badge-4k">4K UHD · RAW</span>
                    </div>
                </div>
            );
        }

        // Slide 2: Authentic Voice Channel Waveform Preview
        return (
            <div className="ui-mockup-voice-card">
                <div className="ui-voice-header">
                    <span className="ui-voice-title">
                        <Volume2 size={15} />
                        <span>Kristal Ses Odası</span>
                    </span>
                    <span className="ui-voice-ping">12ms · P2P</span>
                </div>
                {/* Silver Soundwave Visualizer Bars */}
                <div className="ui-voice-waveform-row">
                    {[14, 24, 32, 18, 36, 28, 20, 34, 16, 26, 38, 22, 18, 30, 26].map((h, i) => (
                        <div
                            key={i}
                            className="ui-voice-bar"
                            style={{ height: `${h}px` }}
                        ></div>
                    ))}
                </div>
                <div className="ui-encrypted-notice">
                    <Lock size={12} />
                    <span>Uçtan uca şifreli oturum aktif</span>
                </div>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // RENDER: ONBOARDING SCREEN (0, 1, 2)
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
                        onClick={() => setCurrentSlide(3)}
                        title="Tanıtımı geç ve ana karşılama sayfasına git"
                    >
                        Geç
                    </button>
                </div>

                {/* Authentic UI Illustration Stage */}
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
                    {/* Dots indicator */}
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
                            className={`indicator-dot ${currentSlide === 3 ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(3)}
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
                            <span>{currentSlide === 2 ? 'Başlayın' : 'İleri'}</span>
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
                {slideIndex === 3 ? renderWelcomeContent() : renderOnboardingContent(slideIndex)}
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
                            Mobil tanıtım sayfaları (Onboarding) ve Asıl Karşılama Ekranı (Logo & Slogan) prototip laboratuvarı.
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
                                <span className="inspector-card-badge">4 EKRAN</span>
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

                                {/* Screen 3: Welcome & Auth Main Screen */}
                                <button
                                    className={`slide-picker-item ${currentSlide === 3 ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentSlide(3);
                                        setLogoAnimKey((k) => k + 1);
                                    }}
                                >
                                    <div className="slide-picker-info">
                                        <span className="slide-picker-num">04 // ASIL EKRAN</span>
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
                                    {currentSlide === 3 ? 'ANA EKRAN' : `SLIDE ${currentSlide + 1}`}
                                </span>
                            </div>

                            {currentSlide === 3 ? (
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
                                        <strong>Tanıtım Kartı:</strong> Sol üstte web sitemizin birebir çift logosu (amblem + yazı) yer alır.
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        Platforma özel gerçek arayüz bileşenleri (Portallar, 4K Medya, Kristal Ses) temsil edilmiştir.
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
                                        setCurrentSlide(3);
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
               VIEW 2: MATRIX / GRID (ALL 4 DEVICES SIDE-BY-SIDE)
               ---------------------------------------------------------------------- */}
            {viewMode === 'matrix' && (
                <div className="matrix-view-container">
                    <div className="matrix-header-note">
                        <span>
                            Tüm prototip sayfaları (3 Tanıtım + Asıl Giriş Sayfası) yan yana listelenmiştir. Yukarıdaki butonla temayı Siyah veya Beyaz olarak eş zamanlı değiştirebilirsiniz.
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
{`// Mobil Uygulama Açılış Zinciri (Onboarding -> Welcome)
1. Onboarding Flow (3 Sade Kart)
   ├── Sol Üst: Birebir Çift Logo (Emblem + OXYPACE)
   ├── Geçişler: 0.36s Yumuşak Süzülme Animasyonu
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
