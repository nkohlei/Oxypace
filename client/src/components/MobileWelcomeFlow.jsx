import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    LogIn,
    UserPlus
} from 'lucide-react';
import SEO from './SEO';
import './MobileWelcomeFlow.css';

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
// 5 ADET GERÇEK PLATFORM ÖRNEKLEYİCİ ŞABLON GÖRSELİ (Birebir Ekran Görüntüleri)
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

const ONBOARDING_STORAGE_KEY = 'oxypace_onboarding_completed';

const MobileWelcomeFlow = () => {
    const navigate = useNavigate();

    // Has user completed onboarding before? (or logged out previously)
    const hasCompleted = typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';

    // If completed before, show Welcome Screen directly; otherwise start with slide 0
    const [isWelcomeScreen, setIsWelcomeScreen] = useState(hasCompleted);
    const [currentSlide, setCurrentSlide] = useState(hasCompleted ? 5 : 0);

    // Replay key for animated logo lockup
    const [logoAnimKey, setLogoAnimKey] = useState(0);

    // Touch swipe handling
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (!isWelcomeScreen) {
            if (diff > 45) {
                // Swipe Left -> Next
                handleNextSlide();
            } else if (diff < -45) {
                // Swipe Right -> Prev
                handlePrevSlide();
            }
        }
    };

    const handleNextSlide = () => {
        if (currentSlide < 4) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleFinishOnboarding();
        }
    };

    const handlePrevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleFinishOnboarding = () => {
        try {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        } catch (e) {
            console.error('Storage error', e);
        }
        setIsWelcomeScreen(true);
        setCurrentSlide(5);
    };

    const handleReplayLogo = () => {
        setLogoAnimKey(prev => prev + 1);
    };

    // --------------------------------------------------------------------------
    // RENDER: ŞABLON GÖRSELİ
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
                        onClick={handleFinishOnboarding}
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
                    {/* Dots indicator (5 Onboarding) */}
                    <div className="onboarding-indicators-row">
                        {ONBOARDING_SLIDES.map((_, dotIdx) => (
                            <div
                                key={dotIdx}
                                className={`indicator-dot ${currentSlide === dotIdx ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(dotIdx)}
                            ></div>
                        ))}
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
                {/* Replay animation trigger */}
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

                {/* Gateway Action Buttons */}
                <div className="welcome-actions-group">
                    <button
                        className="mobile-silver-primary-btn"
                        onClick={() => navigate('/login')}
                    >
                        <LogIn size={16} />
                        <span>Giriş Yap</span>
                    </button>

                    <button
                        className="mobile-silver-secondary-btn"
                        onClick={() => navigate('/register')}
                    >
                        <UserPlus size={16} />
                        <span>Hesap Oluştur</span>
                    </button>

                    <p className="welcome-legal-text">
                        Devam ederek{' '}
                        <span className="welcome-legal-link" onClick={() => navigate('/terms')}>
                            Kullanım Şartları
                        </span>{' '}
                        ve{' '}
                        <span className="welcome-legal-link" onClick={() => navigate('/privacy')}>
                            Gizlilik Politikasını
                        </span>{' '}
                        kabul etmiş olursunuz.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div
            className="mobile-native-gateway-container theme-dark"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <SEO
                title="Oxypace - Sosyal Medya Platformu"
                description="Oxypace - Yeni nesil sosyal medya ve topluluk platformu."
            />
            <div key={isWelcomeScreen ? 'welcome-screen' : `slide-${currentSlide}`} className="slide-screen-animated">
                {isWelcomeScreen ? renderWelcomeContent() : renderOnboardingContent(currentSlide)}
            </div>
        </div>
    );
};

export default MobileWelcomeFlow;
