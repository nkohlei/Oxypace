import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AdUnit from '../components/AdUnit';
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
            <Navbar />
            <main className="app-content">
                <div className="welcome-container home-welcome-section">
                    <div className="home-emoji">🌍</div>
                    <h1 className="home-title">Global Message'a Hoş Geldiniz</h1>
                    <p className="home-description">
                        İlgi alanlarınıza uygun toplulukları keşfedin, sohbetlere katılın ve
                        dünyayla bağlantı kurun. Oxypace ile sınırları kaldırın.
                    </p>

                    <div className="action-buttons">
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
