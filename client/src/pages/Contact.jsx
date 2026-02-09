import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../AppLayout.css';

const Contact = () => {
    const { user, loading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        subject: 'Genel',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setErrorMessage('Mesaj göndermek için giriş yapmalısınız.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            await axios.post('/api/contact', formData);
            setStatus('success');
            setFormData({ subject: 'Genel', message: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Giriş yapmamış kullanıcılar için gösterilecek uyarı componenti
    const GuestsNotice = () => (
        <div style={{
            background: 'var(--bg-primary)',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px dashed var(--border-color)',
            marginTop: '20px'
        }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Bize Ulaşmak İçin Giriş Yapın</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                Güvenlik ve spam önleme politikalarımız gereği, sadece kayıtlı kullanıcılarımız destek formu üzerinden mesaj gönderebilir.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-primary" style={{ padding: '10px 25px', textDecoration: 'none' }}>
                    Giriş Yap
                </Link>
                <Link to="/register" className="btn btn-secondary" style={{ padding: '10px 25px', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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

            <main className="legal-content-wrapper" style={{
                maxWidth: '900px',
                margin: '40px auto',
                padding: '40px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                lineHeight: '1.7'
            }}>
                <div className="legal-header" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', background: 'linear-gradient(45deg, #FF5F1F, #FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>İletişim</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Bize ulaşın, yardımcı olmaktan mutluluk duyarız.</p>
                </div>

                <div className="contact-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    {/* Sol taraf: Bilgiler (Herkes görebilir) */}
                    <div className="contact-info">
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '20px' }}>İletişim Kanalları</h2>
                        <p style={{ marginBottom: '20px' }}>
                            Aşağıdaki kanallar üzerinden bize (veya <code>nqohlei@gmail.com</code> adresine) her zaman ulaşabilirsiniz.
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#FF5F1F', marginBottom: '5px' }}>Doğrudan E-posta</h3>
                            <p>nqohlei@gmail.com</p>
                            <p>support@oxypace.com</p>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #FF5F1F', marginTop: '30px' }}>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>Not:</strong> Destek taleplerine genellikle 24-48 saat içinde yanıt veriyoruz.
                            </p>
                        </div>
                    </div>

                    {/* Sağ taraf: Form (Sadece Üyeler) */}
                    <div className="contact-form-wrapper">
                        {authLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Yükleniyor...</div>
                        ) : !user ? (
                            <GuestsNotice />
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Hızlı Mesaj Gönder</h3>

                                {status === 'success' && (
                                    <div style={{ padding: '10px', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', borderRadius: '4px', textAlign: 'center' }}>
                                        Mesajınız başarıyla iletildi! En kısa sürede <strong>{user.email}</strong> adresine dönüş yapacağız.
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div style={{ padding: '10px', background: 'rgba(255, 87, 34, 0.1)', color: '#ff5722', borderRadius: '4px', textAlign: 'center' }}>
                                        {errorMessage}
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kimden</label>
                                    <input
                                        type="text"
                                        value={`${user.username} <${user.email}>`}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                    <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>E-posta adresiniz hesabınızdan otomatik çekilir.</small>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Konu</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="Genel">Genel Soru</option>
                                        <option value="Destek">Teknik Destek</option>
                                        <option value="Geribildirim">Geri Bildirim / Öneri</option>
                                        <option value="Sikayet">Şikayet Bildirimi</option>
                                        <option value="Isbirligi">İş Birliği</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Mesajınız</label>
                                    <textarea
                                        name="message"
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Size nasıl yardımcı olabiliriz?"
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    style={{
                                        padding: '12px',
                                        background: status === 'loading' ? '#ccc' : '#FF5F1F',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        marginTop: '10px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    {status === 'loading' ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobil Responsive */}
            <style>{`
                @media (max-width: 768px) {
                    .contact-container {
                        grid-template-columns: 1fr !important;
                    }
                    .legal-content-wrapper {
                        padding: 20px !important;
                        margin: 20px auto !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Contact;
