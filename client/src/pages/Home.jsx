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

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchPortals = async () => {
            try {
                const res = await axios.get('/api/portals/public?limit=8');
                setPublicPortals(res.data);
            } catch (err) {
                console.error('Portal fetch error:', err);
            }
        };
        fetchPortals();
    }, []);

    // 3D Scroll Animations Logic (Commit 6cba844 Peak)
    const heroScale = 1 + (scrollY / 500);
    const heroRotate = scrollY / 10;
    const heroTranslateY = scrollY * 1.5;
    const heroOpacity = Math.max(1 - scrollY / 600, 0);
    const descOpacity = Math.max(1 - scrollY / 400, 0);

    const marqueeItems = publicPortals.length > 0 ? publicPortals : [
        { name: 'O', _id: '1' }, { name: 'X', _id: '2' }, { name: 'Y', _id: '3' }, 
        { name: 'P', _id: '4' }, { name: 'A', _id: '5' }, { name: 'C', _id: '6' }
    ];

    return (
        <div className="advanced-home">
            <SEO 
                title="Oxypace | Yeni Nesil Global Sosyal Medya" 
                description="Sınırları kaldıran, özgür ve güvenli yeni nesil sosyal medya platformu. Kendi portalını oluştur, dünyayla paylaş."
            />
            
            <Navbar />

            <main className="advanced-home-content">
                {/* HERO SECTION WITH 3D INTERACTIONS */}
                <div className="hero-scroll-wrapper">
                    <div className="hero-sticky-container">
                        {/* Marquee Background System */}
                        <div className="hero-marquee-system">
                            {marqueeItems.length > 0 && (
                                <>
                                    <div className="marquee-track track-1">
                                        {[...marqueeItems, ...marqueeItems].map((p, i) => (
                                            <div key={`t1-${i}`} className="marquee-card">
                                                {p.avatar ? (
                                                    <img src={getImageUrl(p.avatar)} alt="" />
                                                ) : (
                                                    <div className="p-placeholder">{p.name?.charAt(0)}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="marquee-track track-2">
                                        {[...marqueeItems, ...marqueeItems].reverse().map((p, i) => (
                                            <div key={`t2-${i}`} className="marquee-card">
                                                {p.avatar ? (
                                                    <img src={getImageUrl(p.avatar)} alt="" />
                                                ) : (
                                                    <div className="p-placeholder">{p.name?.charAt(0)}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="hero-overlay"></div>

                        {/* Animated Hero Title (Massive 3D) */}
                        <h1
                            className="hero-massive-title"
                            style={{
                                transform: `translate(-50%, -50%) scale(${heroScale}) rotate(${heroRotate}deg) translateY(${heroTranslateY}px)`,
                                opacity: heroOpacity
                            }}
                        >
                            OXYPACE
                        </h1>

                        <div
                            className="hero-intro-text"
                            style={{
                                opacity: descOpacity,
                                transform: `translateY(${scrollY * 0.3}px)`
                            }}
                        >
                            <div className="home-emoji bounce">🌍</div>
                            <h2>Yeni Nesil Global Sosyal Medya</h2>
                            <p>Sıradan platformları unutun. Topluluğunuzu bulun, sınırları kaldırın.</p>
                            <div className="hero-actions">
                                <button
                                    className="hero-cta-btn pulse-glow"
                                    onClick={() => navigate('/search')}
                                >
                                    Portalları Keşfet
                                </button>
                                <button
                                    className="hero-cta-btn secondary"
                                    onClick={() => navigate('/register')}
                                >
                                    Bize Katıl
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT SECTIONS - ENRICHED MOCKUPS */}
                <div className="content-sections-wrapper">

                    <section className="info-section">
                        <div className="info-text">
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
                                    <div className="skeleton-line sm"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="info-section reverse">
                        <div className="info-text">
                            <h3><span className="accent">02.</span> Sınırları Kaldıran İletişim</h3>
                            <p>
                                <strong>Global message</strong> özelliği sayesinde farklı portallardaki arkadaşlarınızla
                                tek bir arayüzden gerçek zamanlı sohbet edin.
                                Kesintisiz etkileşim ve güvenli altyapı her an yanınızda.
                            </p>
                            <button className="section-cta-btn" onClick={() => navigate('/register')}>
                                Aramıza Katıl <span className="arrow">→</span>
                            </button>
                        </div>
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
                    </section>

                    <section className="info-section">
                        <div className="info-text">
                            <h3><span className="accent">03.</span> Kişiselleştirilebilir Deneyim</h3>
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
                                    <div className="profile-name-skeleton"></div>
                                    <div className="profile-btns-skeleton">
                                        <div className="btn-skel"></div>
                                        <div className="btn-skel"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PORTAL DISCOVERY SECTION (MODERN SLIDER) */}
                    <section className="portal-discovery-section slider-mode">
                        <div className="discovery-header">
                            <h2 className="discovery-title">Popüler Portalları Keşfet</h2>
                            <p className="discovery-subtitle">Sizin gibi düşünen insanlarla tanışın ve ilgi alanlarınıza uygun topluluklara katılın.</p>
                        </div>
                        <div className="discovery-slider-container">
                            <div className="discovery-slider-track">
                                {[...publicPortals, ...publicPortals].map((portal, idx) => (
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
                                <p>Sınırları kaldıran dijital iletişim ve özgür topluluk deneyimi sunan küresel platform.</p>
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
                                    <span onClick={() => navigate('/feedback')}>Geri Bildirim</span>
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
