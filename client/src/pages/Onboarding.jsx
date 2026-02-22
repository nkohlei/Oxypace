import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Onboarding = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [preToken, setPreToken] = useState(null);
    const { login } = useAuth(); // Destructure login

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const token = query.get('preToken');
        if (token) {
            setPreToken(token);
            // Optional: Decode token to pre-fill displayName if you have jwt-decode
            // For now, leave empty or static
        } else if (user) {
            setFormData({
                username: user.username || '',
                displayName: user.profile?.displayName || user.username || '',
                bio: '',
            });
        }
    }, [user, window.location.search]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (formData.username.length < 3) {
                setError('Kullanıcı adı en az 3 karakter olmalı');
                setLoading(false);
                return;
            }

            if (preToken) {
                // --- GOOGLE COMPLETION FLOW ---
                const response = await axios.post('/api/auth/google/complete', {
                    preToken,
                    username: formData.username,
                    // Backend extracts other fields from token
                });

                // Login the user with the new token
                login(response.data.token, response.data.user);
                window.location.href = '/'; // Full reload for clean layout
            } else {
                // --- EXISTING USER PROFILE UPDATE ---
                const response = await axios.put('/api/users/me', {
                    username: formData.username,
                    displayName: formData.displayName,
                    bio: formData.bio,
                });

                updateUser(response.data.user);
                window.location.href = '/'; // Full reload for clean layout
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'İşlem başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">
                    <img src="/oxypace-text-logo.png" alt="oxypace" className="logo-text" />
                </div>

                <div className="auth-header">
                    <h1>Hoş Geldin!</h1>
                    <p>Profilini tamamlayarak başlayalım.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                            maxLength={30}
                            placeholder="Benzersiz bir kullanıcı adı"
                        />
                        <small>Bu isimle anılacaksın (@kullaniciadi)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="displayName">Görünecek İsim</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            required
                            placeholder="Adın veya takma adın"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Hakkında (İsteğe bağlı)</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Kendinden kısaca bahset..."
                            rows="3"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                padding: '12px',
                                resize: 'none',
                                width: '100%',
                            }}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <div
                                className="spinner"
                                style={{ width: '20px', height: '20px' }}
                            ></div>
                        ) : (
                            'Kaydet ve Başla'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
