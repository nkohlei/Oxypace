import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDeviceInfo } from '../utils/deviceHelper';
import '../pages/Auth.css';
import './AddAccountModal.css';

const AddAccountModal = ({ isOpen, onClose }) => {
    const { user, addAndSwitchAccount } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Focus email input when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({ email: '', password: '' });
            setError('');
            setShowPassword(false);
            setLoading(false);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim() || !formData.password) {
            setError('Tüm alanları doldurun');
            return;
        }

        setLoading(true);

        try {
            const deviceInfo = await getDeviceInfo();
            const payload = {
                email: formData.email.trim(),
                password: formData.password,
                ...deviceInfo
            };

            const response = await axios.post('/api/auth/login', payload);
            const loggedInUser = response.data?.user;
            const loggedInToken = response.data?.token;

            if (!loggedInToken || !loggedInUser) {
                throw new Error('Giriş cevabı geçersiz.');
            }

            // Check if user is trying to add the active account
            if (user && (loggedInUser._id === user._id || loggedInUser.id === user.id)) {
                setError('Bu hesap zaten şu an aktif olan oturumunuzdur.');
                setLoading(false);
                return;
            }

            addAndSwitchAccount(loggedInToken, loggedInUser);
            onClose();
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || err.message || 'Giriş başarısız. Lütfen tekrar deneyin.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="auth-card fade-in auth-modal-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="auth-modal-close-btn"
                    onClick={onClose}
                    aria-label="Kapat"
                    title="Kapat"
                >
                    <X size={18} />
                </button>

                <div className="auth-header">
                    <h1>Tekrar Hoş Geldiniz</h1>
                    <p>Oxypace Platformuna devam etmek için giriş yapın</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="modal-auth-email">E-posta</label>
                        <input
                            ref={inputRef}
                            type="email"
                            id="modal-auth-email"
                            name="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div
                            className="label-row"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <label htmlFor="modal-auth-password">Şifre</label>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="modal-auth-password"
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
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <div
                                className="spinner"
                                style={{ width: '20px', height: '20px' }}
                            ></div>
                        ) : (
                            'Giriş Yap'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;
