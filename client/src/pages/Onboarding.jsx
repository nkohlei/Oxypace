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
        bio: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                displayName: user.profile?.displayName || user.username || '',
                bio: ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check username availability if changed (optional optimization, basic check here)
            if (formData.username.length < 3) {
                setError('Kullanıcı adı en az 3 karakter olmalı');
                setLoading(false);
                return;
            }

            // Update user profile
            // We reuse the existing PUT /api/users/me endpoint which handles displayName, bio
            // But we might need a specific/new endpoint if updating username is restricted?
            // Usually username update is restricted. Let's check user controller.
            // Looking at routes/users.js, PUT /api/users/me allows updating displayName, bio, avatar.
            // It does NOT update username.
            // We need to implement a way to update username for new users, OR rely on a new endpoint.
            // For now, let's assume we need to add username update capability or a specific "complete-profile" endpoint.
            // Since I can't easily change backend massively right now without checking constraints,
            // let's try to update what we can (Display Name & Bio) and inform user Username might be fixed
            // OR simpler: Let's add a quick endpoint or field to the PUT request if the backend supports it.
            // Wait, I am the developer. I should check `routes/users.js` logic again.
            // The `routes/users.js` `PUT /me` only updates `displayName`, `bio`, `avatar`.

            // To properly support changing username, I need to update the backend route `PUT /api/users/me` 
            // to allow username change OR create `POST /api/users/onboarding`.
            // Let's create `POST /api/users/onboarding` or update `PUT /api/users/me` on the fly.
            // Updating `PUT /api/users/me` is cleaner.

            // For this specific step, I will assume the backend WILL be updated to support username change.
            // I will write the frontend code to send `username` as well.

            const response = await axios.put('/api/users/me', {
                username: formData.username,
                displayName: formData.displayName,
                bio: formData.bio
            });

            updateUser(response.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Profil güncellenemedi');
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
                                width: '100%'
                            }}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Kaydet ve Başla'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
