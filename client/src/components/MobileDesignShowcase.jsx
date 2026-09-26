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

// --------------------------------------------------------------------------
// 5 ADET GERÇEK PLATFORM ÖRNEKLEYİCİ ŞABLON GÖRSELİ (Birebir Kullanıcı Ekran Görüntüleri)
// --------------------------------------------------------------------------
const AUTHENTIC_SHOWCASE_SLIDES = [
    {
        id: 0,
        webp: '/onboarding-showcase/slide-1-portal.webp',
        png: '/onboarding-showcase/slide-1-portal.png',
        alt: 'Oxypace Global Portal Kartı'
    },
    {
        id: 1,
        webp: '/onboarding-showcase/slide-2-post.webp',
        png: '/onboarding-showcase/slide-2-post.png',
        alt: 'Kayıpsız Medya ve Video Post Paylaşımı'
    },
    {
        id: 2,
        webp: '/onboarding-showcase/slide-3-watch-party.webp',
        png: '/onboarding-showcase/slide-3-watch-party.png',
        alt: 'Eş Zamanlı İzleme (Watch Party) Canlı Oynatıcı'
    },
    {
        id: 3,
        webp: '/onboarding-showcase/slide-4-globe.webp',
        png: '/onboarding-showcase/slide-4-globe.png',
        alt: '3D Dünya Üzerinde Konumlu Portallar ve Keşif Haritası'
    },
    {
        id: 4,
        webp: '/onboarding-showcase/slide-5-event-horizon.webp',
        png: '/onboarding-showcase/slide-5-event-horizon.png',
        alt: 'Event Horizon Bilim, Fikir ve Kuramsal Hesaplamalar'
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
    // RENDER: KULLANICININ VERDİĞİ GERÇEK VE ÖZGÜN PLATFORM ŞABLON GÖRSELLERİ
    // --------------------------------------------------------------------------
    const renderOnboardingVisual = (slideIndex) => {
        const item = AUTHENTIC_SHOWCASE_SLIDES[slideIndex] || AUTHENTIC_SHOWCASE_SLIDES[0];

        return (
            <div className={`authentic-showcase-wrapper slide-variant-${slideIndex}`}>
                <picture>
                    <source srcSet={item.webp} type="image/webp" />
                    <img
                        src={item.png}
                        alt={item.alt}
                        className="authentic-showcase-image"
                        loading="eager"
                        decoding="async"
                    />
                </picture>
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
