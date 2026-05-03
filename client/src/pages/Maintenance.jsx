import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Maintenance.css';

const Maintenance = () => {
    const [showModal, setShowModal] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passphrase.trim()) {
            setError('Parola boş bırakılamaz');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/auth/maintenance-login', { passphrase });
            login(response.data.token, response.data.user);
            window.location.href = '/'; // Full reload for clean layout
        } catch (err) {
            setError(err.response?.data?.message || 'Giriş başarısız');
            setPassphrase('');
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setShowModal(true);
        setError('');
        setPassphrase('');
    };

    const closeModal = () => {
        setShowModal(false);
        setError('');
        setPassphrase('');
    };

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
                {/* Rocket Icon */}
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

                <button className="maintenance-cta" onClick={openModal}>
                    Giriş Yap
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

            {/* ── Password Modal ── */}
            {showModal && (
                <div className="maintenance-modal-overlay" onClick={closeModal}>
                    <div className="maintenance-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button className="maintenance-modal-close" onClick={closeModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                            </svg>
                        </button>

                        {/* Lock icon */}
                        <div className="maintenance-modal-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>

                        <h2 className="maintenance-modal-title">Erişim Parolası</h2>
                        <p className="maintenance-modal-desc">
                            Sisteme erişim için yetkili parolayı girin.
                        </p>

                        <form onSubmit={handleSubmit} className="maintenance-modal-form">
                            <input
                                type="password"
                                className={`maintenance-modal-input ${error ? 'has-error' : ''}`}
                                placeholder="Parolayı girin..."
                                value={passphrase}
                                onChange={(e) => { setPassphrase(e.target.value); setError(''); }}
                                autoFocus
                                disabled={loading}
                            />

                            {error && (
                                <div className="maintenance-modal-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="maintenance-modal-submit" disabled={loading}>
                                {loading ? (
                                    <div className="maintenance-spinner" />
                                ) : (
                                    'Doğrula'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;
