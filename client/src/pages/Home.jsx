import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
                const firstPortalId = typeof user.joinedPortals[0] === 'string'
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
                <div className="welcome-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌍</div>
                    <h1>Global Message'a Hoş Geldiniz</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Artık topluluk odaklıyız! Sol menüden bir portala katılın veya arama sayfasından yeni topluluklar keşfedin.
                    </p>


                    <div className="action-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/search')}
                            style={{ padding: '12px 30px', borderRadius: '25px', border: 'none', background: 'var(--primary-color)', color: 'white', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            Topluluk Keşfet
                        </button>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <AdUnit slot="1234567890" />
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default Home;
