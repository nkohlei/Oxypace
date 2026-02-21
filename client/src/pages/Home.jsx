import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdUnit from '../components/AdUnit';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            if (user.joinedPortals && user.joinedPortals.length > 0) {
                // Redirect to the first joined portal
                // Handle both populated object and ID string cases
                const firstPortalId =
                    typeof user.joinedPortals[0] === 'string'
                        ? user.joinedPortals[0]
                        : user.joinedPortals[0]._id;

                navigate(`/portal/${firstPortalId}`);
            }
        }
    }, [user, loading, navigate]);

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

    return (
        <div className="app-wrapper">
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
            <main className="app-content">
                <div className="welcome-container home-welcome-section">
                    <div className="home-emoji">🌍</div>
                    <h1 className="home-title animate-entrance">Oxypace: Yeni Nesil Global Sosyal Medya</h1>
                    <p className="home-description animate-entrance delay-1">
                        Oxypace ile ilgi alanlarınıza uygun <strong>portalları</strong> keşfedin,
                        topluluklara katılın ve dünyayla bağlantı kurun.
                        <strong>Global message</strong> özelliği sayesinde sınırları kaldırın ve özgürce iletişim kurun.
                    </p>

                    <div className="seo-content" style={{ display: 'none' }}>
                        <h2>Neden Oxypace?</h2>
                        <p>Oxypace, kullanıcılarına güvenli, hızlı ve özelleştirilebilir bir sosyal medya deneyimi sunar. Kendi topluluğunuzu oluşturun veya mevcut topluluklara katılın.</p>
                        <h3>Portal Sistemi</h3>
                        <p>Her ilgi alanı için özel portallar. Oyun, teknoloji, sanat veya müzik; aradığınız her şey Oxypace portallarında.</p>
                    </div>

                    <div className="action-buttons animate-entrance delay-2">
                        <button
                            className="btn-primary home-cta-btn"
                            onClick={() => navigate('/search')}
                        >
                            Portalları Keşfet
                        </button>
                    </div>

                    <div className="home-ad-container">
                        <AdUnit slot="1234567890" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
