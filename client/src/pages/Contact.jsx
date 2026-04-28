import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InfoPage from '../components/InfoPage';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    
    // Redirect logged in users to the new feedback system
    useEffect(() => {
        if (user && !authLoading) {
            navigate('/feedback');
        }
    }, [user, authLoading, navigate]);

    // Giriş yapmamış kullanıcılar için gösterilecek uyarı componenti
    const GuestsNotice = () => (
        <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            padding: '40px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px dashed rgba(56, 189, 248, 0.2)',
            marginTop: '20px'
        }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Bize Ulaşmak İçin Giriş Yapın</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                Güvenlik ve spam önleme politikalarımız gereği, sadece kayıtlı kullanıcılarımız geri bildirim/destek formu üzerinden mesaj gönderebilir.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-primary">
                    Giriş Yap
                </Link>
                <Link to="/register" className="btn" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    Kayıt Ol
                </Link>
            </div>
        </div>
    );

    return (
        <div className="app-wrapper">
            <Helmet>
                <title>İletişim | Oxypace</title>
                <meta name="description" content="Oxypace ile iletişime geçin. Destek, geri bildirim veya iş birlikleri için bize ulaşın." />
            </Helmet>

            <Navbar />

            <InfoPage title="İletişim">
                <div className="contact-container">
                    <div className="contact-info">
                        <h2 style={{ color: '#38bdf8', fontSize: '1.5rem', marginBottom: '20px' }}>İletişim Kanalları</h2>
                        <p style={{ marginBottom: '20px' }}>
                            Aşağıdaki kanallar üzerinden bize her zaman ulaşabilirsiniz.
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '5px' }}>E-posta Adreslerimiz</h3>
                            <p style={{ color: '#38bdf8' }}>support@oxypace.com</p>
                            <p style={{ color: '#38bdf8' }}>nqohlei@gmail.com</p>
                        </div>

                        <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #38bdf8', marginTop: '30px' }}>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>Not:</strong> Destek taleplerine genellikle 24-48 saat içinde yanıt veriyoruz.
                            </p>
                        </div>
                    </div>

                    <div className="contact-form-wrapper" style={{ marginTop: '40px' }}>
                        {authLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Yükleniyor...</div>
                        ) : (
                            <GuestsNotice />
                        )}
                    </div>
                </div>
            </InfoPage>

            <style>{`
                @media (min-width: 769px) {
                    .contact-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Contact;
