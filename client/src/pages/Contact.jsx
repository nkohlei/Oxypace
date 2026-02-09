import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import '../AppLayout.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('loading');
        // Simüle edilmiş gönderim
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
                    {/* İletişim Bilgileri */}
                    <div className="contact-info">
                        <h2 style={{ color: 'var(--text-highlight)', fontSize: '1.5rem', marginBottom: '20px' }}>Bize Ulaşın</h2>
                        <p style={{ marginBottom: '20px' }}>
                            Sorularınız, önerileriniz veya destek talepleriniz için aşağıdaki formu doldurabilir veya doğrudan e-posta gönderebilirsiniz.
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#FF5F1F', marginBottom: '5px' }}>E-posta</h3>
                            <p>support@oxypace.com</p>
                            <p>press@oxypace.com (Medya)</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#FF5F1F', marginBottom: '5px' }}>Sosyal Medya</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Twitter / X</a>
                                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                                <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Instagram</a>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #FF5F1F', marginTop: '30px' }}>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>Not:</strong> Destek taleplerine genellikle 24-48 saat içinde yanıt veriyoruz.
                            </p>
                        </div>
                    </div>

                    {/* İletişim Formu */}
                    <div className="contact-form-wrapper">
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {status === 'success' && (
                                <div style={{ padding: '10px', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', borderRadius: '4px', textAlign: 'center' }}>
                                    Mesajınız başarıyla gönderildi!
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Adınız</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>E-posta Adresiniz</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
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
                    </div>
                </div>
            </main>

            {/* Mobil Uyum İçin CSS Wrapper */}
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
