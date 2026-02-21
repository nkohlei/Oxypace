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
        return () => window.removeEventListener('scroll', handleScroll);
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

    // Transition happens over the first 100vh of scrolling
    const maxScroll = windowHeight;
    const progress = Math.min(scrollY / maxScroll, 1);

    // Logo transforms
    const logoScale = 1 - (progress * 0.5); // 1.0 -> 0.5
    const logoRotate = progress * -90; // 0 -> -90 degrees

    // Translate X: move to the left edge.
    // -50% is center. We add px to move it left.
    // For left edge, we need to move it by -(windowWidth / 2) + some margin.
    const maxTranslateX = -(windowWidth / 2) + 80;
    const logoTranslateX = progress * maxTranslateX;

    // Opacity: 1.0 -> 0.15 (Watermark effect)
    const logoOpacity = 1 - (progress * 0.85);

    // Intro text (Yeni Nesil...) fades out faster so it doesn't overlap
    const descOpacity = Math.max(1 - (scrollY / (windowHeight * 0.4)), 0);
    const descTranslateY = scrollY * 0.5;

    // The marquee should have at least 10 items to loop nicely. 
    // We clone the arr multiple times
    const marqueeItems = [...publicPortals, ...publicPortals, ...publicPortals, ...publicPortals];

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

                {/* FIXED MARQUEE BACKGROUND */}
                <div className="marquee-fixed-bg">
                    <div className="marquee-bg-layer" style={{ opacity: 0.15 }}>
                        {marqueeItems.length > 0 && (
                            <>
                                <div className="marquee-track track-1">
                                    {marqueeItems.map((p, i) => (
                                        <div key={`t1-${i}`} className="marquee-card">
                                            {p.avatar ? <img src={getImageUrl(p.avatar)} alt="" /> : <div className="p-placeholder">{p.name?.charAt(0)}</div>}
                                        </div>
                                    ))}
                                </div>
                                <div className="marquee-track track-2">
                                    {marqueeItems.slice().reverse().map((p, i) => (
                                        <div key={`t2-${i}`} className="marquee-card">
                                            {p.avatar ? <img src={getImageUrl(p.avatar)} alt="" /> : <div className="p-placeholder">{p.name?.charAt(0)}</div>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="fixed-bg-overlay"></div>
                </div>

                {/* FIXED LOGO WATERMARK */}
                <img
                    src="/oxypace-text-logo.png"
                    alt="OXYPACE"
                    className="hero-massive-logo"
                    style={{
                        transform: `translate(calc(-50% + ${logoTranslateX}px), -50%) rotate(${logoRotate}deg) scale(${logoScale})`,
                        opacity: logoOpacity
                    }}
                />

                {/* SCROLLABLE CONTENT */}
                <div className="content-scroll-layer">

                    {/* HERO INTRO SECTION */}
                    <section className="hero-intro-section">
                        <div
                            className="hero-intro-text"
                            style={{
                                opacity: descOpacity,
                                transform: `translateY(${descTranslateY}px)`
                            }}
                        >
                            <div className="home-emoji bounce">🌍</div>
                            <h2>Yeni Nesil Global Sosyal Medya</h2>
                            <p>Sıradan platformları unutun. Topluluğunuzu bulun, sınırları kaldırın.</p>
                            <button
                                className="hero-cta-btn pulse-glow"
                                onClick={() => navigate('/search')}
                            >
                                Şimdi Başla
                            </button>
                        </div>
                    </section>

                    {/* CONTENT SECTIONS */}
                    <div className="content-sections-wrapper">

                        <section className="info-section">
                            <div className="info-text fade-in-up">
                                <h3><span className="accent">01.</span> Topluluğunu İnşa Et</h3>
                                <p>
                                    Oxypace, ilgi alanlarına odaklanan modern <strong>portallardan</strong> oluşur.
                                    Kendi portalınızı oluşturun, kurallarınızı belirleyin ve kitlenizi büyütün.
                                    Kaliteli tartışmalar ve paylaşımlar için özel bir alan yaratın.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/search')}>
                                    Portallara Göz At <span className="arrow">→</span>
                                </button>
                            </div>
                            <div className="info-visual floating">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body portals-mockup">
                                        <div className="skeleton-line" style={{ width: '40%' }}></div>
                                        <div className="skeleton-box"></div>
                                        <div className="skeleton-box"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="info-section reverse">
                            <div className="info-visual floating delay-alt">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body chat-mockup">
                                        <div className="chat-bubble left"></div>
                                        <div className="chat-bubble right"></div>
                                        <div className="chat-bubble left short"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="info-text fade-in-up">
                                <h3><span className="accent">02.</span> Sınırları Kaldıran Küresel İletişim</h3>
                                <p>
                                    <strong>Global message</strong> özelliği sayesinde farklı portallardaki arkadaşlarınızla
                                    tek bir arayüzden gerçek zamanlı sohbet edin.
                                    Kesintisiz etkileşim ve güvenli altyapı her an yanınızda.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/register')}>
                                    Aramıza Katıl <span className="arrow">→</span>
                                </button>
                            </div>
                        </section>

                        <section className="info-section">
                            <div className="info-text fade-in-up">
                                <h3><span className="accent">03.</span> Sizi Yansıtan Özelleştirilebilir Yapı</h3>
                                <p>
                                    Karanlık mod, yüksek çözünürlüklü profiller, kapak fotoğrafları ve özel rozetler...
                                    Platformu tamamen kendi tarzınıza göre özelleştirin. Oxypace size tam kontrol sunar.
                                </p>
                                <button className="section-cta-btn pulse-glow primary" onClick={() => navigate('/register')}>
                                    Hemen Şimdi Başla
                                </button>
                            </div>
                            <div className="info-visual floating">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body profile-mockup">
                                        <div className="profile-banner"></div>
                                        <div className="profile-avatar"></div>
                                        <div className="skeleton-line center"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    <div className="home-footer-ad">
                        <AdUnit slot="1234567890" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
