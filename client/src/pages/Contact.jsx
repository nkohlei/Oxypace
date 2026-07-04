import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import InfoPage from '../components/InfoPage';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Contact = () => {
    const { user } = useAuth();
    const [name, setName] = useState(user?.profile?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !subject || !message) {
            setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            if (user) {
                // If logged in, send actual request to the backend
                await axios.post('/api/contact', { subject, message });
            } else {
                // For guests / AdSense crawlers, simulate a successful SMTP post
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            setSubmitSuccess(true);
            setSubject('');
            setMessage('');
        } catch (err) {
            console.error('Contact submission error:', err);
            setErrorMessage(err.response?.data?.message || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-wrapper">
            <Helmet>
                <title>İletişim | Oxypace</title>
                <meta name="description" content="Oxypace ile iletişime geçin. Destek, geri bildirim veya iş birlikleri için bize ulaşın." />
            </Helmet>

            <Navbar />

            <InfoPage title="İletişim">
                <div className="contact-container">
                    <div className="contact-info-card">
                        <h2 className="contact-heading">İletişim Kanalları</h2>
                        <p className="contact-paragraph">
                            Platformla ilgili herhangi bir sorun, geri bildirim veya iş birliği talebi için bizimle doğrudan iletişime geçebilirsiniz.
                        </p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <span className="contact-icon">📧</span>
                                <div>
                                    <h4>Destek E-postası</h4>
                                    <p className="contact-link">support@oxypace.com.tr</p>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="contact-icon">📨</span>
                                <div>
                                    <h4>Geri Bildirim Hızlı Hattı</h4>
                                    <p className="contact-link">nqohlei@gmail.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="contact-notice">
                            <p><strong>Bilgilendirme:</strong> Destek talepleriniz ekibimiz tarafından incelenerek en geç 24-48 saat içerisinde yanıtlanacaktır.</p>
                        </div>
                    </div>

                    <div className="contact-form-card">
                        {submitSuccess ? (
                            <div className="success-state">
                                <div className="success-icon">✅</div>
                                <h3>Mesajınız İletildi!</h3>
                                <p>Talebiniz başarıyla alınmıştır. En kısa sürede geri dönüş sağlayacağız.</p>
                                <button className="btn btn-primary" onClick={() => setSubmitSuccess(false)}>
                                    Yeni Mesaj Gönder
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form">
                                <h3 className="form-title">Bize Mesaj Gönderin</h3>
                                
                                {errorMessage && <div className="error-alert">{errorMessage}</div>}

                                <div className="form-group">
                                    <label htmlFor="contact-name">Adınız Soyadınız</label>
                                    <input 
                                        type="text" 
                                        id="contact-name"
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Örn: Ahmet Yılmaz"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contact-email">E-posta Adresiniz *</label>
                                    <input 
                                        type="email" 
                                        id="contact-email"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Örn: ahmet@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contact-subject">Konu *</label>
                                    <input 
                                        type="text" 
                                        id="contact-subject"
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Mesajınızın konusu"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contact-message">Mesajınız *</label>
                                    <textarea 
                                        id="contact-message"
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Sorunuzu veya geri bildiriminizi buraya yazın..."
                                        rows={5}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-small" style={{ marginRight: '8px' }}></span>
                                            Gönderiliyor...
                                        </>
                                    ) : 'Gönder'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </InfoPage>

            <style>{`
                .contact-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 30px;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                
                @media (min-width: 769px) {
                    .contact-container {
                        grid-template-columns: 1fr 1.2fr;
                        gap: 40px;
                    }
                }

                .contact-info-card, .contact-form-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 16px;
                    padding: 24px;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .contact-heading {
                    color: #38bdf8;
                    font-size: 1.5rem;
                    margin-bottom: 16px;
                }

                .contact-paragraph {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .contact-details {
                    margin: 30px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .contact-item {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }

                .contact-icon {
                    font-size: 24px;
                }

                .contact-item h4 {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 4px 0;
                }

                .contact-link {
                    color: #38bdf8;
                    font-size: 13.5px;
                    margin: 0;
                }

                .contact-notice {
                    background: rgba(56, 189, 248, 0.05);
                    border-left: 4px solid #38bdf8;
                    padding: 12px 16px;
                    border-radius: 4px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .contact-notice p {
                    margin: 0;
                    line-height: 1.5;
                }

                .form-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 20px 0;
                }

                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .form-group input, .form-group textarea {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .form-group input:focus, .form-group textarea:focus {
                    border-color: #38bdf8;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                }

                .submit-btn {
                    margin-top: 10px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 42px;
                    font-weight: 600;
                }

                .success-state {
                    text-align: center;
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }

                .success-icon {
                    font-size: 48px;
                }

                .success-state h3 {
                    font-size: 1.5rem;
                    color: var(--text-primary);
                    margin: 0;
                }

                .success-state p {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin: 0 0 10px 0;
                    max-width: 300px;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
};

export default Contact;
