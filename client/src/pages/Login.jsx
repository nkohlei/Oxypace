import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Tüm alanları doldurun');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/auth/login', formData);
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Giriş başarısız');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        sessionStorage.setItem('auth_intent', 'login');
        // Use absolute URL for production (frontend and backend on different domains)
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        window.location.href = `${apiBase}/api/auth/google`;
    };

    // Check for errors in URL (e.g. from Google Login)
    useState(() => {
        const query = new URLSearchParams(window.location.search);
        const errorMsg = query.get('error');
        if (errorMsg) {
            if (errorMsg === 'AccountNotFound') {
                setError('Hesap bulunamadı. Lütfen önce kayıt olun.');
            } else if (errorMsg === 'NoUser') {
                setError('Giriş başarısız. Google hesabınızdan bilgi alınamadı.');
            } else {
                setError('Giriş başarısız. Lütfen tekrar deneyin.');
            }
        }
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <span className="logo-text">oxypace</span>
                </div>

                <div className="auth-header">
                    <h1>Tekrar Hoşgeldin</h1>
                    <p>Devam etmek için giriş yap</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">E-posta</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label htmlFor="password">Şifre</label>
                            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#667eea', textDecoration: 'none' }}>Şifremi Unuttum</Link>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="Şifrenizi girin"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Giriş Yap'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>veya</span>
                </div>

                <button onClick={handleGoogleLogin} className="btn-google">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google ile Giriş Yap
                </button>

                <div className="auth-footer">
                    <p>
                        Hesabın yok mu? <Link to="/register" className="auth-link">Kayıt Ol</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
