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

    // Check for mobile/window width to adjust layout logic if needed
    // For now, we'll use CSS to handle the split, but we might need to know if we are in "mobile view"
    // to handle the 'back' button behavior (hidden on desktop).

    const renderSidebar = () => (
        <div className={`settings-sidebar ${activeMenu !== 'main' ? 'hidden-on-mobile' : ''}`}>
            <h2 className="settings-header">Ayarlar</h2>
            <div className="settings-menu-list">

                <div className={`menu-item ${activeMenu === 'account' ? 'active' : ''}`} onClick={() => setActiveMenu('account')}>
                    <div className="menu-icon">👤</div>
                    <div className="menu-text">Hesap</div>
                    <div className="menu-arrow">›</div>
                </div>

                <div className={`menu-item ${activeMenu === 'notifications' ? 'active' : ''}`} onClick={() => setActiveMenu('notifications')}>
                    <div className="menu-icon">🔔</div>
                    <div className="menu-text">Bildirimler</div>
                    <div className="menu-arrow">›</div>
                </div>

                <div className={`menu-item ${activeMenu === 'privacy' ? 'active' : ''}`} onClick={() => setActiveMenu('privacy')}>
                    <div className="menu-icon">🔒</div>
                    <div className="menu-text">Gizlilik</div>
                    <div className="menu-arrow">›</div>
                </div>

                <div className={`menu-item danger ${activeMenu === 'danger' ? 'active' : ''}`} onClick={() => setActiveMenu('danger')}>
                    <div className="menu-icon">⚠</div>
                    <div className="menu-text">Tehlikeli Alan</div>
                    <div className="menu-arrow">›</div>
                </div>
            </div>
            <div className="settings-footer-info">
                <p>OxySpace v2.4.0</p>
                <p>&copy; 2026</p>
            </div>
        </div>
    );

    const renderContent = () => {
        // On mobile, if we are in 'main' menu, we might not want to render content at all?
        // Or we render it but it's hidden via CSS.
        // Actually, for mobile 'drill-down', when activeMenu is 'main', we show sidebar.
        // When activeMenu is NOT 'main', we show content.

        let content = null;
        switch (activeMenu) {
            case 'account':
                content = renderAccountMenu();
                break;
            case 'verification':
                content = renderVerificationMenu();
                break;
            case 'privacy':
                content = renderPrivacyMenu();
                break;
            case 'notifications':
                content = renderNotificationsMenu();
                break;
            case 'danger':
                content = renderDangerMenu();
                break;
            default:
                content = <div className="placeholder-content">Ayarlar menüsünden bir seçenek belirleyin.</div>;
        }

        return (
            <div className={`settings-content-area ${activeMenu === 'main' ? 'hidden-on-mobile' : ''}`}>
                {content}
            </div>
        );
    };

    // Helper to render headers with back button logic
    const renderHeader = (title, backTo = 'main') => (
        <div className="submenu-header">
            <button className="back-btn mobile-only" onClick={() => setActiveMenu(backTo)}>
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

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="settings-container">
                    <div className="settings-layout">
                        {renderSidebar()}
                        {renderContent()}
                    </div>

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
