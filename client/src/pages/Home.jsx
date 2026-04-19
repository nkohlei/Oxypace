import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdUnit from '../components/AdUnit';
import SEO from '../components/SEO';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import Badge from '../components/Badge';
import FloatingScrollTop from '../components/FloatingScrollTop';
import './Home.css';

// Fisher-Yates shuffle
const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const Home = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [publicPortals, setPublicPortals] = useState([]);
    const [scrollY, setScrollY] = useState(0);
    const [revealedSections, setRevealedSections] = useState(new Set());
    const sectionRefs = useRef([]);

    // Auto-redirect logged-in users
    useEffect(() => {
        if (!loading && user) {
            // Check if user clicked a portal before logging in
            const pendingPortal = localStorage.getItem('oxypace_pending_portal');
            if (pendingPortal) {
                localStorage.removeItem('oxypace_pending_portal');
                navigate(`/portal/${pendingPortal}`);
                return;
            }
            if (user.joinedPortals && user.joinedPortals.length > 0) {
                const firstPortalId =
                    typeof user.joinedPortals[0] === 'string'
                        ? user.joinedPortals[0]
                        : user.joinedPortals[0]._id;
                navigate(`/portal/${firstPortalId}`);
            }
        }
    }, [user, loading, navigate]);

    // Fetch portals and shuffle for randomized display
    useEffect(() => {
        const fetchPortals = async () => {
            try {
                const res = await axios.get('/api/portals?keyword='); // Fix: Old endpoint /api/portals/public didn't exist
                if (res.data && res.data.length > 0) {
                    // Limit to 30 and shuffle
                    const selected = res.data.slice(0, 30);
                    setPublicPortals(shuffleArray(selected));
                }
            } catch (err) {
                console.error("Failed to fetch portals", err);
            }
        };
        fetchPortals();
    }, []);

    // Scroll tracking - perfectly tracks any element's scroll via capture phase
    useEffect(() => {
        const handleScroll = (e) => {
            const target = e.target;
            if (target === document || target === window) {
                setScrollY(window.scrollY);
            } else if (target.scrollTop !== undefined) {
                setScrollY(target.scrollTop);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        // Initial setup
        handleScroll({ target: window });
        
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, []);

    // Intersection Observer for scroll-reveal
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setRevealedSections(prev => new Set([...prev, entry.target.dataset.section]));
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        sectionRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
        return () => observer.disconnect();
    }, []);

    const setSectionRef = useCallback((index) => (el) => {
        sectionRefs.current[index] = el;
    }, []);

    // Handle portal card click - save portal ID and redirect to login
    const handlePortalClick = useCallback((portalId) => {
        localStorage.setItem('oxypace_pending_portal', portalId);
        navigate('/login');
    }, [navigate]);

    if (loading) {
        return (
            <div className="app-wrapper advanced-home">
                <Navbar />
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    // Scroll-based hero animation
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const splitProgress = Math.min(scrollY / (windowHeight * 0.6), 1);
    
    // "başlık arka plana ve ekranın ortasına doğru küçülerek geçecek ve buğulu/sisli bir hale gelecek"
    // We stay perfectly centered (no translateY), scale down to 0.5, become foggy/blurry up to 25px, and keep some opacity so it's visible in the background
    const logoScale = 1 - (splitProgress * 0.5);
    const logoBlur = splitProgress * 25; 
    const logoOpacity = 1 - (splitProgress * 0.4); 

    // Tripled for infinite scroll illusion
    const sliderPortals = useMemo(() => {
        if (publicPortals.length === 0) return [];
        return [...publicPortals, ...publicPortals, ...publicPortals];
    }, [publicPortals]);

    // Smooth scroll to discovery section
    const scrollToDiscovery = () => {
        const el = document.getElementById('discovery-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const features = [
        {
            num: '01',
            title: 'Topluluğunu İnşa Et',
            desc: 'Oxypace, ilgi alanlarına odaklanan modern portallardan oluşur. Kendi portalınızı oluşturun, kurallarınızı belirleyin ve kitlenizi büyütün. Kaliteli tartışmalar ve paylaşımlar için özel bir alan yaratın.',
            cta: 'Portallara Göz At',
            ctaAction: scrollToDiscovery,
            icon: '🌐',
            mockup: 'portal'
        },
        {
            num: '02',
            title: 'Küresel İletişim',
            desc: 'Global message özelliği sayesinde farklı portallardaki arkadaşlarınızla tek bir arayüzden gerçek zamanlı sohbet edin. Kesintisiz etkileşim ve güvenli altyapı her an yanınızda.',
            cta: 'Aramıza Katıl',
            ctaAction: () => navigate('/register'),
            icon: '💬',
            mockup: 'chat'
        },
        {
            num: '03',
            title: 'Sizi Yansıtan Yapı',
            desc: 'Karanlık mod, yüksek çözünürlüklü profiller, kapak fotoğrafları ve özel rozetler... Platformu tamamen kendi tarzınıza göre özelleştirin. Oxypace size tam kontrol sunar.',
            cta: 'Hemen Başla',
            ctaAction: () => navigate('/register'),
            icon: '✨',
            mockup: 'profile',
            primary: true
        }
    ];

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

            <Navbar hideThemeToggle />

            <main className="advanced-home-content">
                {/* VIDEO BACKGROUND */}
                <video className="home-bg-video" autoPlay muted loop playsInline>
                    <source src="/auth-bg.mp4" type="video/mp4" />
                </video>
                <div className="home-bg-overlay"></div>

                {/* ATMOSPHERIC SPHERES */}
                <div className="atmospheric-bg">
                    <div className="gradient-sphere sphere-1"></div>
                    <div className="gradient-sphere sphere-2"></div>
                    <div className="gradient-sphere sphere-3"></div>
                </div>

                {/* HERO TITLE - User's Logo Image masked with an actual CSS Gradient overlay */}
                <div className="hero-title-container" style={{
                    transform: `scale(${logoScale})`,
                    opacity: logoOpacity,
                    filter: `blur(${logoBlur}px)`
                }}>
                    <div className="hero-gradient-glow"></div>
                    
                    <div className="hero-logo-mask-container">
                        <img src="/oxypace-text-logo.png" alt="OXYPACE Layout Reference" className="hero-logo-layout-reference" />
                        <div className="hero-logo-gradient-overlay" />
                    </div>

                    <div className="hero-subtitle-typing-container">
                        <h2 className="hero-subtitle-typing">Oda'ya davetlisin, özgürce takıl!</h2>
                    </div>
                    <div className="hero-scroll-hint">
                        <div className="scroll-mouse"><div className="scroll-dot"></div></div>
                        <span>Keşfetmek için kaydır</span>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="content-scroll-layer">
                    <section className="hero-empty-section"></section>

                    {/* FEATURE SECTIONS */}
                    <div className="content-sections-wrapper">
                        {features.map((feat, i) => (
                            <section
                                key={feat.num}
                                className={`info-section ${revealedSections.has(`feature-${i}`) ? 'revealed' : ''}`}
                                data-section={`feature-${i}`}
                                ref={setSectionRef(i)}
                            >
                                <div className="info-text">
                                    <div className="feature-icon-badge">{feat.icon}</div>
                                    <h3>
                                        <span className="accent">{feat.num}.</span>
                                        <br />{feat.title}
                                    </h3>
                                    <p>{feat.desc}</p>
                                    <button
                                        className={`section-cta-btn ${feat.primary ? 'primary' : ''}`}
                                        onClick={feat.ctaAction}
                                    >
                                        {feat.cta} <span className="arrow">→</span>
                                    </button>
                                </div>
                                <div className="info-visual">
                                    {feat.mockup === 'portal' && (
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
                                    )}
                                    {feat.mockup === 'chat' && (
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
                                    )}
                                    {feat.mockup === 'profile' && (
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
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* PORTAL DISCOVERY - Randomized, clickable, no content */}
                    <section
                        id="discovery-section"
                        className={`portal-discovery-section slider-mode ${revealedSections.has('discovery') ? 'revealed' : ''}`}
                        data-section="discovery"
                        ref={setSectionRef(3)}
                    >
                        <div className="discovery-header">
                            <h2 className="discovery-title">Popüler Toplulukları Keşfet</h2>
                            <p className="discovery-subtitle">Sizin gibi düşünen insanlarla tanışın ve ilgi alanlarınıza uygun portallara katılın.</p>
                        </div>
                        <div className="discovery-slider-container">
                            <div className="discovery-slider-track">
                                {sliderPortals.map((portal, idx) => (
                                    <div
                                        key={`${portal._id}-${idx}`}
                                        className="modern-portal-card frosted-discovery"
                                        onClick={() => handlePortalClick(portal._id)}
                                    >
                                        <div
                                            className="card-banner"
                                            style={{
                                                background: portal.banner
                                                    ? `url(${getImageUrl(portal.banner)}) center/cover`
                                                    : 'linear-gradient(135deg, #0a0a2e, #1a1a4e)'
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
                        </div>
                    </section>

                    <div className="home-footer-ad">
                        <AdUnit slot="1234567890" />
                    </div>

                    {/* FOOTER */}
                    <footer className="home-advanced-footer">
                        <div className="footer-content">
                            <div className="footer-brand">
                                <img src="/oxypace-text-logo.png" alt="OXYPACE" className="footer-logo" />
                                <p>Sınırsız dijital iletişim ve özgür topluluk deneyimi sunan global platform.</p>
                            </div>
                            <div className="footer-links-grid">
                                <div className="footer-col">
                                    <h4>Platform</h4>
                                    <span onClick={scrollToDiscovery}>Portalları Keşfet</span>
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
                        <div className="footer-bottom">
                            <p>&copy; {new Date().getFullYear()} Oxypace. Tüm hakları saklıdır.</p>
                        </div>
                    </footer>
                </div>
            </main>

            <FloatingScrollTop />
        </div>
    );
};

export default Home;
