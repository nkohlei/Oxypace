import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/auth/forgot-password', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <span className="logo-text">oxypace</span>
                </div>

                <div className="auth-header">
                    <h1>Şifrenizi mi Unuttunuz?</h1>
                    <p>E-posta adresinizi girin, size bir sıfırlama kodu gönderelim.</p>
                </div>

                {message ? (
                    <div className="success-message" style={{ textAlign: 'center' }}>
                        <p>{message}</p>
                        <br />
                        <Link to="/reset-password" className="btn btn-primary">
                            Kodu Girin
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">E-posta Adresi</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Gönderiliyor...' : 'Sıfırlama Kodu Gönder'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">
                        Giriş Yap'a Dön
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
