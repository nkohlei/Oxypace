import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdUnit from '../components/AdUnit';
import SEO from '../components/SEO';
import Badge from '../components/Badge';
import FloatingScrollTop from '../components/FloatingScrollTop';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [publicPortals, setPublicPortals] = useState([]);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const fetchPortals = async () => {
            try {
                const res = await axios.get('/api/portals/public?limit=12');
                setPublicPortals(res.data);
            } catch (err) {
                console.error('Portal fetch error:', err);
            }
        };
        fetchPortals();
    }, []);

    // Scroll progress for the "Split Logo" animation (User's Design)
    const splitProgress = Math.min(scrollY / (windowHeight * 0.8), 1);
    const leftX = -(splitProgress * 25);
    const rightX = (splitProgress * 25);
    const logoOpacity = 1 - (splitProgress * 0.7); // Fade slightly to background
    const logoScale = 1 - (splitProgress * 0.1);

    // Feature sections fade in scroll logic
    const sectionsOpacity = Math.min(Math.max((scrollY - (windowHeight * 0.4)) / (windowHeight * 0.4), 0), 1);

    return (
        <div className="advanced-home">
            <SEO 
                title="Oxypace | Yeni Nesil Global Sosyal Medya" 
                description="Sınırları kaldıran, özgür ve güvenli yeni nesil sosyal medya platformu. Kendi portalını oluştur, dünyayla paylaş."
            />
            
            <Navbar />

            {/* Video Background (Static but atmospheric) */}
            <video autoPlay loop muted playsInline className="home-bg-video">
                <source src="/auth-bg.mp4" type="video/mp4" />
            </video>
            <div className="home-bg-overlay"></div>

            <main className="advanced-home-content">
                {/* ATMOSPHERIC BACKGROUND (Spheres) */}
                <div className="atmospheric-bg">
                    <div className="gradient-sphere sphere-1"></div>
                    <div className="gradient-sphere sphere-2"></div>
                    <div className="gradient-sphere sphere-3"></div>
                    <div className="gradient-sphere sphere-4"></div>
                </div>

                {/* USER'S DESIGN: SPLIT LOGO HERO */}
                <div className="split-logo-container">
                    <div className="logo-wrapper" style={{ 
                        transform: `translateX(${leftX}vw) scale(${logoScale})`,
                        opacity: logoOpacity
                    }}>
                        <img src="/oxypace-logo-icon.png" alt="" className="hero-logo-icon gradient-glow" />
                    </div>
                    <div className="logo-wrapper" style={{ 
                        transform: `translateX(${rightX}vw) scale(${logoScale})`,
                        opacity: logoOpacity
                    }}>
                        <img src="/oxypace-text-logo.png" alt="OXYPACE" className="hero-logo-text" />
                        <div className="hero-subtitle-typing-container">
                            <p className="hero-subtitle-typing">Yeni nesil küresel iletişim platformu.</p>
                        </div>
                    </div>
                </div>

                {/* SCROLL TRIGGERED CONTENT */}
                <div className="content-scroll-layer" style={{ opacity: sectionsOpacity }}>
                    
                    <div className="hero-intro-section">
                        <div className="hero-intro-text">
                            <h2>Sınırları Kaldırın.</h2>
                            <p>Global topluluğunuzu bulun, portallar oluşturun ve dünyayla kesintisiz iletişim kurun.</p>
                            <div className="hero-actions">
                                <button className="hero-cta-btn primary" onClick={() => navigate('/search')}>Portalları Keşfet</button>
                                <button className="hero-cta-btn" onClick={() => navigate('/register')}>Aramıza Katıl</button>
                            </div>
                        </div>
                    </div>

                    <div className="content-sections-wrapper">
                        {/* Feature 01 - Enhanced with Floating */}
                        <section className="info-section">
                            <div className="info-text">
                                <h3><span className="accent">01.</span><br />Topluluğunu İnşa Et</h3>
                                <p>
                                    Oxypace, ilgi alanlarına odaklanan modern <strong>portallardan</strong> oluşur.
                                    Kendi portalınızı oluşturun, kurallarınızı belirleyin ve kitlenizi büyütün.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/search')}>
                                    Göz At <span className="arrow">→</span>
                                </button>
                            </div>
                            <div className="info-visual floating">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body mockup-01">
                                        <div className="skeleton-line" style={{ width: '40%' }}></div>
                                        <div className="skeleton-box"></div>
                                        <div className="skeleton-box"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Feature 02 - Enhanced with Floating */}
                        <section className="info-section reverse">
                            <div className="info-text">
                                <h3><span className="accent">02.</span><br />Global Mesajlaşma</h3>
                                <p>
                                    <strong>Global message</strong> sayesinde farklı portallardan arkadaşlarınızla
                                    gerçek zamanlı ve güvenli bir şekilde sohbet edin.
                                </p>
                                <button className="section-cta-btn" onClick={() => navigate('/register')}>
                                    Keşfet <span className="arrow">→</span>
                                </button>
                            </div>
                            <div className="info-visual floating delay-alt">
                                <div className="mockup-window">
                                    <div className="mockup-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="mockup-body mockup-02">
                                        <div className="skeleton-line sm"></div>
                                        <div className="skeleton-chat-left"></div>
                                        <div className="skeleton-chat-right accent"></div>
                                        <div className="skeleton-chat-left sm"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Feature 03 - Enhanced with Floating */}
                        <section className="info-section">
                            <div className="info-text">
                                <h3><span className="accent">03.</span><br />Özelleştirilebilir Yapı</h3>
                                <p>
                                    Karanlık mod, yüksek çözünürlüklü profiller, kapak fotoğrafları ve özel rozetler...
                                    Tamamen sizi yansıtan bir dijital alan yaratın.
                                </p>
                                <button className="section-cta-btn primary" onClick={() => navigate('/register')}>
                                    Hemen Başla
                                </button>
                            </div>
                            <div className="info-visual floating">
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
                    </div>

                    {/* PORTAL DISCOVERY SECTION (MODERN SLIDER) */}
                    <section className="portal-discovery-section slider-mode">
                        <div className="discovery-header">
                            <h2 className="discovery-title">Popüler Toplulukları Keşfet</h2>
                            <p className="discovery-subtitle">Sizin gibi düşünen insanlarla tanışın ve ilgi alanlarınıza uygun portallara katılın.</p>
                        </div>
                        <div className="discovery-slider-container">
                            <div className="discovery-slider-track">
                                {[...publicPortals, ...publicPortals, ...publicPortals].map((portal, idx) => (
                                    <div
                                        key={`${portal._id}-${idx}`}
                                        className="modern-portal-card frosted-discovery"
                                        onClick={() => navigate(`/portal/${portal._id}`)}
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
                        </div>
                        <div className="discovery-cta">
                            <button className="section-cta-btn" onClick={() => navigate('/search')}>
                                Tümünü Keşfet <span className="arrow">→</span>
                            </button>
                        </div>
                    </section>

                    <div className="home-footer-ad">
                        <AdUnit slot="1234567890" />
                    </div>

                    {/* PROFESSIONAL FOOTER */}
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
