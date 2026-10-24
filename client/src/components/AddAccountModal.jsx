import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, X, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDeviceInfo } from '../utils/deviceHelper';
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

    // Focus first input on open
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
            setError('Lütfen e-posta / kullanıcı adı ve şifrenizi girin.');
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

            // Check if user is trying to add their currently active account
            if (user && loggedInUser._id === user._id) {
                setError('Bu hesap zaten şu an aktif olan oturumunuzdur.');
                setLoading(false);
                return;
            }

            // Add new account to saved list and switch to it immediately
            addAndSwitchAccount(loggedInToken, loggedInUser);
            onClose();
        } catch (err) {
            console.error('Add account failed:', err);
            const msg = err.response?.data?.message || err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-account-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-account-title">
            <div className="add-account-modal glass-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="add-account-header">
                    <div className="add-account-title-group">
                        <div className="add-account-icon-badge">
                            <UserPlus size={22} />
                        </div>
                        <div>
                            <h2 id="add-account-title" className="add-account-title">Hesap Ekle</h2>
                            <p className="add-account-subtitle">Mevcut oturumunuzu kapatmadan başka bir Oxypace hesabına giriş yapın.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="add-account-close-btn"
                        onClick={onClose}
                        title="Kapat"
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="add-account-error-banner animation-fade-in" role="alert">
                        <AlertCircle size={16} className="error-icon" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="add-account-form">
                    <div className="add-account-field">
                        <label htmlFor="add-account-email" className="add-account-label">
                            E-posta veya Kullanıcı Adı
                        </label>
                        <div className="add-account-input-wrap">
                            <Mail size={18} className="field-icon" />
                            <input
                                ref={inputRef}
                                id="add-account-email"
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="kullanici@oxypace.com veya kullanıcı adı"
                                autoCapitalize="none"
                                autoComplete="username"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="add-account-field">
                        <label htmlFor="add-account-password" className="add-account-label">
                            Şifre
                        </label>
                        <div className="add-account-input-wrap">
                            <Lock size={18} className="field-icon" />
                            <input
                                id="add-account-password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="add-account-actions">
                        <button
                            type="button"
                            className="add-account-cancel-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            className="add-account-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="spin-icon" />
                                    <span>Giriş Yapılıyor...</span>
                                </>
                            ) : (
                                <span>Giriş Yap ve Ekle</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;
