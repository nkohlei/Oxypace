import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './CreatePortalModal.css';

const CreatePortalModal = ({ onClose }) => {
    const { updateUser, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Basic, 2: Details, 3: Settings
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        privacy: 'public',
        category: 'general',
        tags: '',
        avatar: '', // Text URL for now
        banner: '', // Text URL for now
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Convert comma separated tags to array if backend supports it
            // Assuming backend might need string for now or array, keeping as string in form
            // but let's send as array if we updated backend model.
            // Current model likely just takes what we send if loose,
            // but let's stick to the structure.
            const response = await axios.post('/api/portals', formData);

            const newPortal = response.data;
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
                <div className="modal-header">
                    <h2>Portal Oluştur</h2>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
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
                            <div className="form-group">
                                <label>Portal Adı</label>
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

                    {/* STEP 2: Visuals & Tags */}
                    {step === 2 && (
                        <div className="step-content fade-in">
                            <h3 className="step-title">Görünüm & Etiketler</h3>
                            <div className="form-group">
                                <label>Etiketler (Virgül ile ayırın)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tags: e.target.value })
                                    }
                                    placeholder="örn: react, javascript, kodlama"
                                />
                            </div>

                            <div className="form-group">
                                <label>Profil Görseli (URL)</label>
                                <input
                                    type="text"
                                    value={formData.avatar}
                                    onChange={(e) =>
                                        setFormData({ ...formData, avatar: e.target.value })
                                    }
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Kapak Görseli (URL)</label>
                                <input
                                    type="text"
                                    value={formData.banner}
                                    onChange={(e) =>
                                        setFormData({ ...formData, banner: e.target.value })
                                    }
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Privacy & Rules (Simplified) */}
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
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                İptal
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setStep(step + 1)}
                            >
                                İleri
                            </button>
                        ) : (
                            <button type="submit" className="btn-submit" disabled={loading}>
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
