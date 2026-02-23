import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdUnit from '../components/AdUnit';
import SEO from '../components/SEO';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import './Home.css';

const Home = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [publicPortals, setPublicPortals] = useState([]);
    const [scrollY, setScrollY] = useState(0);

    // Auto-redirect logged-in users to their first joined portal
    useEffect(() => {
        if (!loading && user) {
            if (user.joinedPortals && user.joinedPortals.length > 0) {
                const firstPortalId =
                    typeof user.joinedPortals[0] === 'string'
                        ? user.joinedPortals[0]
                        : user.joinedPortals[0]._id;

                navigate(`/portal/${firstPortalId}`);
            }
        }
    }, [user, loading, navigate]);

    // Fetch popular/public portals for the background marquee
    useEffect(() => {
        const fetchPortals = async () => {
            try {
                const res = await axios.get('/api/portals?keyword=');
                if (res.data && res.data.length > 0) {
                    setPublicPortals(res.data.slice(0, 15)); // Take up to 15
                }
            } catch (err) {
                console.error("Failed to fetch portals for marquee", err);
            }
        };
        fetchPortals();
    }, []);

    // Track scroll position for animations
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Initial check
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    if (loading) {
        return (
            <div className="app-wrapper">
                <Navbar />
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    // Mathematical calculations for hero scroll animation
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // --- LOGO ALIGNMENT LOGIC 3.3 ---
    // progress 0.0 -> 1.0 (over 100vh)
    const splitProgress = Math.min(scrollY / (windowHeight * 0.8), 1);

    // Initial side-by-side gap to avoid overlap
    const baseGap = windowWidth < 768 ? 40 : 80;

    // Hat icon stays left, Text stays right - no overlap ever
    const hatTranslateX = -(baseGap) + (splitProgress * -(windowWidth * 0.08));
    const textTranslateX = (baseGap) + (splitProgress * (windowWidth * 0.08));

    // Both scale down and retreat
    const logoScale = 1 - (splitProgress * 0.5); // 1.0 -> 0.5
    const logoZIndex = splitProgress > 0.8 ? 1 : 50;
    const logoOpacity = 1 - (splitProgress * 0.7); // Fade to background
    const logoTranslateY = splitProgress * -50; // Move up slightly

    // Feature sections fade in much later
    const contentOpacity = Math.min(Math.max((scrollY - (windowHeight * 0.5)) / (windowHeight * 0.4), 0), 1);
    const contentTranslateY = (1 - contentOpacity) * 50;

    // The background should have scattered items
    // We clone the arr and give them random positions
    const scatteredItems = [...publicPortals, ...publicPortals];

    return (
        <div className="app-wrapper advanced-home">
            <SEO
                title="Ana Sayfa | Global Message & Portallar"
                description="Oxypace - Yeni nesil sosyal medya ve topluluk platformu. Kendi portalınızı oluşturun, arkadaşlarınızla sohbet edin ve global mesajlaşmanın keyfini çıkarın."
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Oxypace",
                    "url": window.location.origin,
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${window.location.origin}/search?q={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                }}
            />

            <Navbar />

            <main className="advanced-home-content">

                {/* ATMOSPHERIC BACKGROUND */}
                <div className="atmospheric-bg">
                    <div className="gradient-sphere sphere-1"></div>
                    <div className="gradient-sphere sphere-2"></div>
                    <div className="gradient-sphere sphere-3"></div>
                    <div className="gradient-sphere sphere-4"></div>
                    <div className="gradient-sphere sphere-5"></div>
                    <div className="fixed-bg-overlay-3"></div>
                </div>

                {/* SPLIT LOGO SYSTEM - SIDE-BY-SIDE (3.3) */}
                <div className="split-logo-container">
                    <div
                        className="logo-wrapper hat-wrapper"
                        style={{
                            transform: `translateX(${hatTranslateX}px) translateY(${logoTranslateY}px) scale(${logoScale})`,
                            opacity: logoOpacity,
                            zIndex: logoZIndex
                        }}
                    >
                        <img src="/logo.png" alt="Icon" className="hero-logo-icon" />
                    </div>
                    <div
                        className="logo-wrapper text-wrapper"
                        style={{
                            transform: `translateX(${textTranslateX}px) translateY(${logoTranslateY}px) scale(${logoScale})`,
                            opacity: logoOpacity,
                            zIndex: logoZIndex
                        }}
                    >
                        <img src="/oxypace-text-logo.png" alt="OXYPACE" className="hero-logo-text" />
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="content-scroll-layer">

                    {/* HERO EMPTY SPACER */}
                    <section className="hero-empty-section"></section>

                    {/* CONTENT SECTIONS */}
                    <div
                        className="content-sections-wrapper"
                        style={{
                            opacity: contentOpacity,
                            transform: `translateY(${contentTranslateY}px)`
                        }}
                    >

                        {/* Feature 01 */}
                        <section className="info-section">
                            <div className="info-text">
                                <h3><span className="accent">01.</span><br />Topluluğunu İnşa Et</h3>
                                <p>
                                    Oxypace, ilgi alanlarına odaklanan modern <strong>portallardan</strong> oluşur.
                                    Kendi portalınızı oluşturun, kurallarınızı belirleyin ve kitlenizi büyütün.
                                    Kaliteli tartışmalar ve paylaşımlar için özel bir alan yaratın.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/search')}>
                                    Portallara Göz At <span className="arrow">→</span>
                                </button>
                            </div>
                            <div className="info-visual">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body mockup-01">
                                        <div className="skeleton-line sm"></div>
                                        <div className="skeleton-box"></div>
                                        <div className="skeleton-box"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Feature 02 */}
                        <section className="info-section">
                            <div className="info-text">
                                <h3><span className="accent">02.</span><br />Sınırları Kaldıran Küresel İletişim</h3>
                                <p>
                                    <strong>Global message</strong> özelliği sayesinde farklı portallardaki arkadaşlarınızla
                                    tek bir arayüzden gerçek zamanlı sohbet edin.
                                    Kesintisiz etkileşim ve güvenli altyapı her an yanınızda.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/register')}>
                                    Aramıza Katıl <span className="arrow">→</span>
                                </button>
                            </div>
                            <div className="info-visual">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body mockup-02">
                                        <div className="skeleton-chat-left"></div>
                                        <div className="skeleton-chat-right accent"></div>
                                        <div className="skeleton-chat-left sm"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Feature 03 */}
                        <section className="info-section">
                            <div className="info-text">
                                <h3><span className="accent">03.</span><br />Sizi Yansıtan Özelleştirilebilir Yapı</h3>
                                <p>
                                    Karanlık mod, yüksek çözünürlüklü profiller, kapak fotoğrafları ve özel rozetler...
                                    Platformu tamamen kendi tarzınıza göre özelleştirin. Oxypace size tam kontrol sunar.
                                </p>
                                <button className="section-cta-btn primary" onClick={() => navigate('/register')}>
                                    Hemen Şimdi Başla
                                </button>
                            </div>
                            <div className="info-visual">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body mockup-03">
                                        <div className="skeleton-box large">
                                            <div className="profile-circle"></div>
                                        </div>
                                        <div className="skeleton-line center w-50 mt-default"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PORTAL DISCOVERY SECTION (3.3) */}
                        <section className="portal-discovery-section">
                            <div className="discovery-header">
                                <h2 className="discovery-title">Popüler Toplulukları Keşfet</h2>
                                <p className="discovery-subtitle">Sizin gibi düşünen insanlarla tanışın ve ilgi alanlarınıza uygun portallara katılın.</p>
                            </div>
                            <div className="modern-portals-grid">
                                {publicPortals.slice(0, 6).map((portal) => (
                                    <div
                                        key={portal._id}
                                        className="modern-portal-card static"
                                    >
                                        <div
                                            className="card-banner"
                                            style={{
                                                background: portal.banner
                                                    ? `url(${getImageUrl(portal.banner)}) center/cover`
                                                    : 'linear-gradient(45deg, #1a1a1a, #333)'
                                            }}
                                        ></div>
                                        <div className="card-icon-wrapper">
                                            {portal.avatar ? (
                                                <img src={getImageUrl(portal.avatar)} alt={portal.name} className="card-icon-img" />
                                            ) : (
                                                <div className="card-icon-placeholder">{portal.name?.substring(0, 2).toUpperCase()}</div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h3 className="card-title">
                                                {portal.name}
                                                <Badge type={portal.isVerified ? 'verified' : portal.badges?.[0]} size={18} />
                                            </h3>
                                            <p className="card-desc">
                                                {portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.'}
                                            </p>
                                            <div className="card-footer">
                                                <div className="member-count">
                                                    <div className="status-dot"></div>
                                                    <span>{portal.memberCount || 0} Üye</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="discovery-cta">
                                <button className="section-cta-btn" onClick={() => navigate('/search')}>
                                    Tümünü Keşfet <span className="arrow">→</span>
                                </button>
                            </div>
                        </section>

                    </div>

                    <div className="home-footer-ad">
                        <AdUnit slot="1234567890" />
                    </div>

                    {/* PROFESSIONAL FOOTER (Links only, no bottom bar) */}
                    <footer className="home-advanced-footer">
                        <div className="footer-content">
                            <div className="footer-brand">
                                <img src="/oxypace-text-logo.png" alt="OXYPACE" className="footer-logo" />
                                <p>Sınırsız dijital iletişim ve özgür topluluk deneyimi sunan global platform.</p>
                            </div>
                            <div className="footer-links-grid">
                                <div className="footer-col">
                                    <h4>Platform</h4>
                                    <span onClick={() => navigate('/search')}>Portalları Keşfet</span>
                                    <span onClick={() => navigate('/login')}>Giriş Yap</span>
                                    <span onClick={() => navigate('/register')}>Kayıt Ol</span>
                                </div>
                                <div className="footer-col">
                                    <h4>Yasal</h4>
                                    <span onClick={() => navigate('/privacy')}>Gizlilik Politikası</span>
                                    <span onClick={() => navigate('/terms')}>Kullanım Koşulları</span>
                                </div>
                                <div className="footer-col">
                                    <h4>İletişim</h4>
                                    <span onClick={() => navigate('/contact')}>Bize Ulaşın</span>
                                    <a href="mailto:nqohlei@gmail.com">Destek</a>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default Home;
