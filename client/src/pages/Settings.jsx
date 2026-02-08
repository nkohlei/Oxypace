import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Settings.css';

const Settings = () => {
    const { logout, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Navigation State
    const [activeMenu, setActiveMenu] = useState('main'); // main, account, notifications, privacy, verification

    // Settings State
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        mentions: true,
        likes: false,
    });
    const [privacy, setPrivacy] = useState({
        isPrivate: false,
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Forms State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        selectedCategory: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For custom verification dropdown

    // Extract query params to open specific section
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        if (section && ['account', 'verification'].includes(section)) {
            setActiveMenu(section);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Since we don't have a dedicated GET /settings, we might need to rely on what's in 'user'
            // or fetch the user again. Let's fetch the user profile again to get fresh settings.
            const response = await axios.get('/api/users/me');
            if (response.data.settings) {
                setNotifications((prev) => ({ ...prev, ...response.data.settings.notifications }));
                setPrivacy((prev) => ({ ...prev, ...response.data.settings.privacy }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (setting, type = 'notifications') => {
        const newValue = type === 'notifications' ? !notifications[setting] : !privacy[setting];

        // Optimistic update
        if (type === 'notifications') {
            setNotifications((prev) => ({ ...prev, [setting]: newValue }));
        } else {
            setPrivacy((prev) => ({ ...prev, [setting]: newValue }));
        }

        try {
            const payload =
                type === 'notifications'
                    ? { notifications: { [setting]: newValue } }
                    : { privacy: { [setting]: newValue } };

            await axios.put('/api/users/settings', payload);
        } catch (error) {
            console.error('Failed to update settings:', error);
            // Revert on error
            if (type === 'notifications') {
                setNotifications((prev) => ({ ...prev, [setting]: !newValue }));
            } else {
                setPrivacy((prev) => ({ ...prev, [setting]: !newValue }));
            }
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Yeni şifreler eşleşmiyor.');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        try {
            await axios.put('/api/users/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordSuccess('Şifreniz başarıyla güncellendi.');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                selectedCategory: '',
            });
            setTimeout(() => setShowPasswordModal(false), 2000);
        } catch (error) {
            setPasswordError(error.response?.data?.message || 'Şifre değiştirilemedi.');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete('/api/users/me');
            logout();
            navigate('/register');
        } catch (error) {
            console.error('Delete account error:', error);
            const msg =
                error.response?.data?.message ||
                error.message ||
                'Hesap silinirken bir hata oluştu.';
            alert(`Hata: ${msg} (${error.response?.status})`);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderMainMenu = () => (
        <div className="settings-menu-list">
            <h2 className="settings-header">Ayarlar</h2>
            <div className="menu-item" onClick={() => setActiveMenu('account')}>
                <div className="menu-icon">👤</div>
                <div className="menu-text">Hesap</div>
                <div className="menu-arrow">›</div>
            </div>

            <div className="menu-item" onClick={() => setActiveMenu('notifications')}>
                <div className="menu-icon">🔔</div>
                <div className="menu-text">Bildirimler</div>
                <div className="menu-arrow">›</div>
            </div>

            <div className="menu-item" onClick={() => setActiveMenu('privacy')}>
                <div className="menu-icon">🔒</div>
                <div className="menu-text">Gizlilik</div>
                <div className="menu-arrow">›</div>
            </div>

            <div className="menu-item danger" onClick={() => setActiveMenu('danger')}>
                <div className="menu-icon">⚠</div>
                <div className="menu-text">Tehlikeli Alan</div>
                <div className="menu-arrow">›</div>
            </div>
        </div>
    );

    const renderHeader = (title, backTo = 'main') => (
        <div className="submenu-header">
            <button className="back-btn" onClick={() => setActiveMenu(backTo)}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="24"
                    height="24"
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
            <h2>{title}</h2>
        </div>
    );

    const renderAccountMenu = () => (
        <div className="submenu-content">
            {renderHeader('Hesap')}

            <div className="setting-group">
                <h3>Güvenlik</h3>
                <button className="setting-action-btn" onClick={() => setShowPasswordModal(true)}>
                    <span>Şifre Değiştir</span>
                    <span className="arrow">›</span>
                </button>
            </div>

            <div className="setting-group">
                <h3>Doğrulama</h3>
                <button
                    className="setting-action-btn gold-accent"
                    onClick={() => setActiveMenu('verification')}
                >
                    <span>Onaylanmış Hesap Başvurusu</span>
                    <span className="arrow">›</span>
                </button>
            </div>
        </div>
    );

    const renderVerificationMenu = () => (
        <div className="submenu-content">
            {renderHeader('Doğrulanmış Hesap', 'account')}

            <div className="verification-container">
                {/* Existing Verification UI Logic */}
                {user?.verificationRequest?.status === 'pending' ? (
                    <div className="verification-status pending">
                        <div className="status-icon-large">⏳</div>
                        <div className="status-info">
                            <h4>Başvurunuz İnceleniyor</h4>
                            <p>Talebini aldık ve ekibimiz tarafından değerlendiriliyor.</p>

                            <div className="badge-display-row">
                                <span>Talep Edilen:</span>
                                <strong>
                                    {user.verificationRequest.category === 'creator' &&
                                        'Mavi Tik (Tanınmış Kişi)'}
                                    {user.verificationRequest.category === 'business' &&
                                        'Altın Tik (İşletme)'}
                                    {user.verificationRequest.category === 'government' &&
                                        'Platin Tik (Devlet)'}
                                    {user.verificationRequest.category === 'partner' &&
                                        'Özel Tik (Partner)'}
                                    {!user.verificationRequest.category && 'Doğrulama Rozeti'}
                                </strong>
                            </div>

                            <div className="pending-progress-bar"></div>
                            <p style={{ fontSize: '0.8rem', marginTop: '12px', opacity: 0.7 }}>
                                Sonuçlandığında bildirim alacaksınız.
                            </p>
                        </div>
                    </div>
                ) : user?.verificationBadge !== 'none' && user?.verificationBadge !== 'staff' ? (
                    <div className="verification-status approved">
                        <div className="status-icon-large">✅</div>
                        <div className="status-info">
                            <h4>Hesabınız Doğrulandı</h4>
                            <p>Tebrikler! Mavi tik rozetine sahipsiniz.</p>
                        </div>
                    </div>
                ) : (
                    <div className="verification-apply">
                        <p className="verification-desc">
                            Hesabınızın türünü en iyi anlatan kategoriyi seçerek başvurun.
                        </p>

                        <div className="custom-dropdown-container">
                            <div
                                className={`dropdown-trigger ${isDropdownOpen ? 'open' : ''} ${passwordForm.selectedCategory ? 'has-selection' : ''}`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {passwordForm.selectedCategory ? (
                                    <div className="selected-preview">
                                        <span className="cat-icon-small">
                                            {passwordForm.selectedCategory === 'creator' && '⭐'}
                                            {passwordForm.selectedCategory === 'business' && '🏢'}
                                            {passwordForm.selectedCategory === 'government' && '🏛️'}
                                            {passwordForm.selectedCategory === 'partner' && '🤝'}
                                        </span>
                                        <div className="selected-text-group">
                                            <span className="selected-title">
                                                {passwordForm.selectedCategory === 'creator' &&
                                                    'Tanınmış Kişi / Üretici'}
                                                {passwordForm.selectedCategory === 'business' &&
                                                    'İşletme / Kurum'}
                                                {passwordForm.selectedCategory === 'government' &&
                                                    'Devlet Yetkilisi'}
                                                {passwordForm.selectedCategory === 'partner' &&
                                                    'Platform Ortağı'}
                                            </span>
                                            <span className="selected-badge-preview">
                                                {passwordForm.selectedCategory === 'creator' &&
                                                    'Mavi Tik'}
                                                {passwordForm.selectedCategory === 'business' &&
                                                    'Altın Tik'}
                                                {passwordForm.selectedCategory === 'government' &&
                                                    'Platin Tik'}
                                                {passwordForm.selectedCategory === 'partner' &&
                                                    'Özel Tik'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="placeholder-text">Seçim Yap</span>
                                )}
                                <svg
                                    className="dropdown-arrow"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-options">
                                    <div
                                        className="dropdown-option"
                                        onClick={() => {
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                selectedCategory: 'creator',
                                            }));
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div className="cat-icon-box blue-glow">⭐</div>
                                        <div className="option-info">
                                            <h4>Tanınmış Kişi / Üretici</h4>
                                            <p>Mavi Tik Alırsınız</p>
                                        </div>
                                    </div>

                                    <div
                                        className="dropdown-option"
                                        onClick={() => {
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                selectedCategory: 'business',
                                            }));
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div className="cat-icon-box gold-glow">🏢</div>
                                        <div className="option-info">
                                            <h4>İşletme / Kurum</h4>
                                            <p>Altın Tik Alırsınız</p>
                                        </div>
                                    </div>

                                    <div
                                        className="dropdown-option"
                                        onClick={() => {
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                selectedCategory: 'government',
                                            }));
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div className="cat-icon-box platinum-glow">🏛️</div>
                                        <div className="option-info">
                                            <h4>Devlet Yetkilisi</h4>
                                            <p>Platin Tik Alırsınız</p>
                                        </div>
                                    </div>

                                    <div
                                        className="dropdown-option"
                                        onClick={() => {
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                selectedCategory: 'partner',
                                            }));
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div className="cat-icon-box special-glow">🤝</div>
                                        <div className="option-info">
                                            <h4>Platform Ortağı</h4>
                                            <p>Özel Tik Alırsınız</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="apply-btn"
                            disabled={!passwordForm.selectedCategory}
                            onClick={async () => {
                                if (!passwordForm.selectedCategory) return;
                                try {
                                    await axios.post('/api/users/request-verification', {
                                        category: passwordForm.selectedCategory,
                                    });
                                    window.location.reload();
                                } catch (err) {
                                    alert(err.response?.data?.message || 'Hata oluştu');
                                }
                            }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="20"
                                height="20"
                            >
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                            Başvuruyu Gönder
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderPrivacyMenu = () => (
        <div className="submenu-content">
            {renderHeader('Gizlilik')}
            <div className="settings-section">
                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Gizli Hesap</h3>
                        <p>Hesabını sadece takipçilerin görebilsin</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={privacy.isPrivate}
                            onChange={() => handleToggle('isPrivate', 'privacy')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderNotificationsMenu = () => (
        <div className="submenu-content">
            {renderHeader('Bildirimler')}
            <div className="settings-section">
                {/* Re-implement notification toggles loop */}
                {Object.entries({
                    email: 'E-posta Bildirimleri',
                    push: 'Anlık Bildirimler',
                    mentions: 'Bahsedilmeler',
                    likes: 'Beğeniler',
                }).map(([key, label]) => (
                    <div className="setting-item" key={key}>
                        <div className="setting-info">
                            <h3>{label}</h3>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={notifications[key]}
                                onChange={() => handleToggle(key)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDangerMenu = () => (
        <div className="submenu-content">
            {renderHeader('Tehlikeli Alan')}
            <div className="settings-section danger-section">
                <button className="logout-btn" onClick={handleLogout}>
                    Çıkış Yap
                </button>
                <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
                    Hesabı Sil
                </button>
            </div>
        </div>
    );

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="settings-container">
                    {activeMenu === 'main' && renderMainMenu()}
                    {activeMenu === 'account' && renderAccountMenu()}
                    {activeMenu === 'verification' && renderVerificationMenu()}
                    {activeMenu === 'privacy' && renderPrivacyMenu()}
                    {activeMenu === 'notifications' && renderNotificationsMenu()}
                    {activeMenu === 'danger' && renderDangerMenu()}

                    {/* Modals outside switch */}
                    {showPasswordModal && (
                        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>Şifre Değiştir</h2>
                                <form onSubmit={handlePasswordChange}>
                                    <input
                                        type="password"
                                        placeholder="Mevcut Şifre"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                currentPassword: e.target.value,
                                            })
                                        }
                                        required
                                        className="modal-input"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Yeni Şifre"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                newPassword: e.target.value,
                                            })
                                        }
                                        required
                                        className="modal-input"
                                        minLength={6}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Yeni Şifre (Tekrar)"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        required
                                        className="modal-input"
                                    />
                                    {passwordError && <p className="error-msg">{passwordError}</p>}
                                    {passwordSuccess && (
                                        <p className="success-msg">{passwordSuccess}</p>
                                    )}
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordModal(false)}
                                            className="cancel-btn"
                                        >
                                            İptal
                                        </button>
                                        <button type="submit" className="confirm-btn">
                                            Güncelle
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirm Modal */}
                    {showDeleteModal && (
                        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                            <div
                                className="modal-content danger"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2>Hesabı Sil?</h2>
                                <p>
                                    Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak
                                    silinecektir.
                                </p>
                                <div className="modal-actions">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="cancel-btn"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="delete-confirm-btn"
                                    >
                                        Evet, Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
