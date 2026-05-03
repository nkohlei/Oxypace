import { useNavigate } from 'react-router-dom';
import './Maintenance.css';

const Maintenance = () => {
    const navigate = useNavigate();

    return (
        <div className="maintenance-container">
            {/* Floating Particles */}
            <div className="maintenance-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="maintenance-particle" />
                ))}
            </div>

            {/* Glassmorphism Card */}
            <div className="maintenance-card">
                {/* Rocket / Construction Icon */}
                <div className="maintenance-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                    </svg>
                </div>

                <h1 className="maintenance-title">
                    Oxypace'i Geleceğe Taşıyoruz!
                </h1>

                <div className="maintenance-divider" />

                <p className="maintenance-description">
                    Sizlere daha kesintisiz, hızlı ve bağımsız bir deneyim sunabilmek adına
                    altyapımızı daha güçlü alternatiflere taşıyoruz. Bu kısa geçiş sürecinde
                    gösterdiğiniz anlayış için teşekkür ederiz. Çok yakında daha güçlü bir
                    altyapı ile tekrar aktif olacağız.
                </p>

                <button
                    className="maintenance-cta"
                    onClick={() => navigate('/login')}
                >
                    Giriş Yap
                    {/* Arrow-right icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/>
                        <path d="m12 5 7 7-7 7"/>
                    </svg>
                </button>

                <div className="maintenance-footer">
                    Çalışmalar devam ediyor
                    <span className="dot-pulse">
                        <span /><span /><span />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
