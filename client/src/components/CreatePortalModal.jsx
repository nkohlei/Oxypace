import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../utils/uploadUtils';
import './CreatePortalModal.css';

const CreatePortalModal = ({ onClose }) => {
    const { updateUser, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Basic, 2: Visuals, 3: Settings
    const [canSubmit, setCanSubmit] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        privacy: 'public',
        category: 'general',
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (step === 3) {
            setCanSubmit(false);
            const timer = setTimeout(() => setCanSubmit(true), 500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submitting to API if we are not on the last step
        if (step < 3) {
            if (step === 1 && !formData.name.trim()) return;
            setStep(step + 1);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Create Portal
            const response = await axios.post('/api/portals', formData);
            const newPortal = response.data;

            // 2. Upload Avatar if selected
            if (avatarFile) {
                try {
                    const avatarKey = await uploadFile(avatarFile, 'avatar', newPortal._id);
                    await axios.post(`/api/portals/${newPortal._id}/avatar`, { mediaKey: avatarKey });
                } catch (err) {
                    console.error('Avatar upload failed:', err);
                }
            }

            // 3. Upload Banner if selected
            if (bannerFile) {
                try {
                    const bannerKey = await uploadFile(bannerFile, 'banner', newPortal._id);
                    await axios.post(`/api/portals/${newPortal._id}/banner`, { mediaKey: bannerKey });
                } catch (err) {
                    console.error('Banner upload failed:', err);
                }
            }

            const updatedUser = {
                ...user,
                joinedPortals: [...(user.joinedPortals || []), newPortal],
            };
            updateUser(updatedUser);

            onClose();
            navigate(`/portal/${newPortal._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Portal oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'general', name: 'Genel' },
        { id: 'tech', name: 'Teknoloji' },
        { id: 'art', name: 'Sanat & Tasarım' },
        { id: 'game', name: 'Oyun' },
        { id: 'science', name: 'Bilim' },
        { id: 'music', name: 'Müzik' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content advanced-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Kapat">
                    &times;
                </button>
                <div className="modal-header">
                    <h2>Portal Oluştur</h2>
                </div>

                <div className="progress-bar">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>

                {error && <div className="error-message mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="step-content fade-in">
                            <h3 className="step-title">Temel Bilgiler</h3>
                            
                            <div className="required-info-badge">
                                <span>💡 <b>Portal Adı</b> alanı zorunludur. Diğer bilgileri isteğe bağlı olarak doldurabilirsiniz.</span>
                            </div>

                            <div className="form-group">
                                <label>Portal Adı <span className="required-badge">Zorunlu</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Örn: Yazılım Dünyası"
                                    maxLength={50}
                                    autoFocus
                                />
                                {!formData.name.trim() && (
                                    <span className="input-helper-error">⚠️ İlerlemek için lütfen portal adını belirleyin.</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Bu portal ne hakkında?"
                                    maxLength={500}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Visuals (Avatar & Banner via Local Files) */}
                    {step === 2 && (
                        <div className="step-content fade-in">
                            <h3 className="step-title">Görünüm Ayarları</h3>
                            
                            <div className="visuals-upload-container">
                                {/* Banner Picker */}
                                <div 
                                    className="banner-picker-preview"
                                    style={{
                                        backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                    onClick={() => document.getElementById('banner-file-input').click()}
                                >
                                    {!bannerPreview && (
                                        <div className="picker-overlay-text">
                                            <span>📷 Kapak Görseli Ekle</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        id="banner-file-input" 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setBannerFile(file);
                                                setBannerPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Avatar Picker */}
                                <div className="avatar-picker-wrapper">
                                    <div 
                                        className="avatar-picker-preview"
                                        style={{
                                            backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                        onClick={() => document.getElementById('avatar-file-input').click()}
                                    >
                                        {!avatarPreview && (
                                            <div className="picker-overlay-text-avatar">
                                                <span>📷</span>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            id="avatar-file-input" 
                                            accept="image/*" 
                                            style={{ display: 'none' }} 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setAvatarFile(file);
                                                    setAvatarPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </div>
                                    <span className="avatar-picker-label">Profil Resmi</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Privacy */}
                    {step === 3 && (
                        <div className="step-content fade-in">
                            <h3 className="step-title">Gizlilik Ayarları</h3>
                            <div className="privacy-options">
                                <label
                                    className={`privacy-card ${formData.privacy === 'public' ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="public"
                                        checked={formData.privacy === 'public'}
                                        onChange={(e) =>
                                            setFormData({ ...formData, privacy: e.target.value })
                                        }
                                    />
                                    <div className="privacy-info">
                                        <span className="p-title">🌍 Herkese Açık</span>
                                        <span className="p-desc">
                                            Herkes bu portalı görebilir ve katılabilir.
                                        </span>
                                    </div>
                                </label>

                                <label
                                    className={`privacy-card ${formData.privacy === 'private' ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value="private"
                                        checked={formData.privacy === 'private'}
                                        onChange={(e) =>
                                            setFormData({ ...formData, privacy: e.target.value })
                                        }
                                    />
                                    <div className="privacy-info">
                                        <span className="p-title">🔒 Gizli</span>
                                        <span className="p-desc">
                                            Sadece davet edilenler görebilir ve katılabilir.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="modal-footer advanced-footer">
                        {step > 1 ? (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setStep(step - 1)}
                            >
                                Geri
                            </button>
                        ) : (
                            <button type="button" className="btn-secondary" onClick={onClose}>
                                İptal
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={step === 1 && !formData.name.trim()}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setStep(step + 1);
                                }}
                            >
                                İleri
                            </button>
                        ) : (
                            <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
                                {loading ? 'Oluşturuluyor...' : 'Tamamla & Oluştur'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePortalModal;
