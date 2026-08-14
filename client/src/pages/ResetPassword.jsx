import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.newPassword.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır');
            return;
        }

        if (!/[A-Z]/.test(formData.newPassword)) {
            setError('Şifre en az bir büyük harf içermelidir (A-Z)');
            return;
        }

        if (!/[a-z]/.test(formData.newPassword)) {
            setError('Şifre en az bir küçük harf içermelidir (a-z)');
            return;
        }

        if (!/[0-9]/.test(formData.newPassword)) {
            setError('Şifre en az bir rakam içermelidir (0-9)');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);

        try {
            await axios.post('/api/auth/reset-password', {
                email: formData.email.trim(),
                code: formData.code.trim(),
                newPassword: formData.newPassword,
            });
            setMessage('Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.message ||
                'Bir hata oluştu.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Disable body scroll when component mounts
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <img src="/oxypace-text-logo1.webp" alt="oxypace" className="logo-text" width="200" height="46" decoding="async" />
                </div>

                <div className="auth-header">
                    <h1>Şifre Sıfırlama</h1>
                    <p>E-postanıza gelen kodu ve yeni şifrenizi girin.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">E-posta Adresi</label>
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
                        <label htmlFor="code">Sıfırlama Kodu</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="6 haneli kod"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">Yeni Şifre</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            placeholder="En az 6 karakter"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Şifreyi tekrar girin"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Sıfırlanıyor...' : 'Şifreyi Güncelle'}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">
                        Giriş Yap'a Dön
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
