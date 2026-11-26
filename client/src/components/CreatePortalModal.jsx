import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, Check, ImagePlus, Camera, Globe, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../utils/uploadUtils';
import { normalizeImageFileForBrowser } from '../utils/heicHelper';
import './CreatePortalModal.css';

const CreatePortalModal = ({ onClose }) => {
    const { updateUser, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Temel, 2: Görünüm, 3: Gizlilik
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
    const [showNameError, setShowNameError] = useState(false);

    const bannerInputRef = useRef(null);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (step === 3) {
            setCanSubmit(false);
            const timer = setTimeout(() => setCanSubmit(true), 500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleNextStep = (e) => {
        if (e) e.preventDefault();
        if (step === 1 && !formData.name.trim()) {
            setShowNameError(true);
            return;
        }
        setShowNameError(false);
        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent submitting to API if we are not on the last step
        if (step < 3) {
            if (step === 1 && !formData.name.trim()) {
                setShowNameError(true);
                return;
            }
            setShowNameError(false);
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
                joinedPortals: [...(user?.joinedPortals || []), newPortal],
                portals: [...(user?.portals || []), newPortal],
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
        { id: 'art', name: 'Sanat' },
        { id: 'game', name: 'Oyun' },
        { id: 'science', name: 'Bilim' },
        { id: 'music', name: 'Müzik' },
    ];

    const stepsMeta = [
        { num: 1, label: 'Temel' },
        { num: 2, label: 'Görünüm' },
        { num: 3, label: 'Gizlilik' },
    ];

    return (
        <div className="cpm-overlay" onClick={onClose}>
            <div className="cpm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cpm-header">
                    <h2>Portal Oluştur</h2>
                    <button
                        type="button"
                        className="cpm-close-btn"
                        onClick={onClose}
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="cpm-stepper">
                    {stepsMeta.map((s, idx) => {
                        const isDone = step > s.num;
                        const isActive = step === s.num;
                        return (
                            <div key={s.num} className="cpm-step-item">
                                <div className={`cpm-step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                    {isDone ? <Check size={13} strokeWidth={2.5} /> : s.num}
                                </div>
                                <span className={`cpm-step-label ${isActive || isDone ? 'active' : ''}`}>
                                    {s.label}
                                </span>
                                {idx < stepsMeta.length - 1 && (
                                    <div className={`cpm-step-line ${isDone ? 'done' : ''}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="cpm-error">
                        <AlertCircle size={15} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="cpm-body">
                    {/* STEP 1: Temel Bilgiler */}
                    {step === 1 && (
                        <div className="cpm-step-content">
                            <div className="cpm-field">
                                <div className="cpm-label-row">
                                    <label htmlFor="cpm-portal-name">Portal Adı</label>
                                    <span className="cpm-counter">{(formData.name || '').length}/20</span>
                                </div>
                                <input
                                    id="cpm-portal-name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value.slice(0, 20) });
                                        if (e.target.value.trim()) {
                                            setShowNameError(false);
                                        }
                                    }}
                                    placeholder="Örn: Yazılım"
                                    maxLength={20}
                                    autoFocus
                                    className="cpm-input"
                                />
                                {showNameError && !formData.name.trim() && (
                                    <span className="cpm-field-error">
                                        <AlertCircle size={13} />
                                        <span>Portal adı gerekli.</span>
                                    </span>
                                )}
                            </div>

                            <div className="cpm-field">
                                <div className="cpm-label-row">
                                    <label>Kategori</label>
                                </div>
                                <div className="cpm-category-grid">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`cpm-cat-pill ${formData.category === cat.id ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="cpm-field">
                                <div className="cpm-label-row">
                                    <label htmlFor="cpm-portal-desc">Açıklama</label>
                                    <span className="cpm-optional">İsteğe bağlı</span>
                                </div>
                                <textarea
                                    id="cpm-portal-desc"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Kısa açıklama (isteğe bağlı)"
                                    maxLength={500}
                                    rows={3}
                                    className="cpm-textarea"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Görünüm */}
                    {step === 2 && (
                        <div className="cpm-step-content">
                            <div className="cpm-visuals">
                                <div
                                    className={`cpm-banner-picker ${bannerPreview ? 'has-image' : ''}`}
                                    style={
                                        bannerPreview
                                            ? {
                                                  backgroundImage: `url(${bannerPreview})`,
                                                  backgroundSize: 'cover',
                                                  backgroundPosition: 'center',
                                              }
                                            : undefined
                                    }
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {!bannerPreview ? (
                                        <div className="cpm-picker-placeholder">
                                            <ImagePlus size={18} />
                                            <span>Kapak Görseli</span>
                                        </div>
                                    ) : (
                                        <div className="cpm-picker-change-badge">
                                            <ImagePlus size={14} />
                                        </div>
                                    )}
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*,.heic,.heif,image/heic,image/heif"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const rawFile = e.target.files?.[0];
                                            if (rawFile) {
                                                try {
                                                    const file = await normalizeImageFileForBrowser(rawFile);
                                                    setBannerFile(file);
                                                    setBannerPreview(URL.createObjectURL(file));
                                                } catch (err) {
                                                    setError(err?.message || 'HEIC görseli dönüştürülemedi.');
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div
                                    className={`cpm-avatar-picker ${avatarPreview ? 'has-image' : ''}`}
                                    style={
                                        avatarPreview
                                            ? {
                                                  backgroundImage: `url(${avatarPreview})`,
                                                  backgroundSize: 'cover',
                                                  backgroundPosition: 'center',
                                              }
                                            : undefined
                                    }
                                    onClick={() => avatarInputRef.current?.click()}
                                    title="Profil Resmi Seç"
                                >
                                    {!avatarPreview && <Camera size={20} />}
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*,.heic,.heif,image/heic,image/heif"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const rawFile = e.target.files?.[0];
                                            if (rawFile) {
                                                try {
                                                    const file = await normalizeImageFileForBrowser(rawFile);
                                                    setAvatarFile(file);
                                                    setAvatarPreview(URL.createObjectURL(file));
                                                } catch (err) {
                                                    setError(err?.message || 'HEIC görseli dönüştürülemedi.');
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div className="cpm-preview-meta">
                                    <span className="cpm-preview-name">
                                        {formData.name.trim() || 'Portal Adı'}
                                    </span>
                                    <span className="cpm-preview-hint">Görseller isteğe bağlı</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Gizlilik */}
                    {step === 3 && (
                        <div className="cpm-step-content">
                            <div className="cpm-privacy-list">
                                <button
                                    type="button"
                                    className={`cpm-privacy-card ${formData.privacy === 'public' ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, privacy: 'public' })}
                                >
                                    <div className="cpm-privacy-icon">
                                        <Globe size={18} />
                                    </div>
                                    <div className="cpm-privacy-info">
                                        <span className="cpm-privacy-title">Herkese Açık</span>
                                        <span className="cpm-privacy-desc">Herkes görebilir ve katılabilir.</span>
                                    </div>
                                    <div className="cpm-privacy-check">
                                        {formData.privacy === 'public' && <Check size={13} strokeWidth={2.5} />}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`cpm-privacy-card ${formData.privacy === 'private' ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, privacy: 'private' })}
                                >
                                    <div className="cpm-privacy-icon">
                                        <Lock size={18} />
                                    </div>
                                    <div className="cpm-privacy-info">
                                        <span className="cpm-privacy-title">Gizli</span>
                                        <span className="cpm-privacy-desc">Sadece davetle katılım.</span>
                                    </div>
                                    <div className="cpm-privacy-check">
                                        {formData.privacy === 'private' && <Check size={13} strokeWidth={2.5} />}
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="cpm-footer">
                        {step > 1 ? (
                            <button
                                type="button"
                                className="cpm-btn-ghost"
                                onClick={() => setStep(step - 1)}
                            >
                                Geri
                            </button>
                        ) : (
                            <button type="button" className="cpm-btn-ghost" onClick={onClose}>
                                İptal
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                className="cpm-btn-primary"
                                onClick={handleNextStep}
                            >
                                İleri
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="cpm-btn-primary"
                                disabled={loading || !canSubmit}
                            >
                                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePortalModal;
