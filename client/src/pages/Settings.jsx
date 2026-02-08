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
        <div className={`channel-sidebar ${activeMenu !== 'main' ? 'hidden-on-mobile' : ''} settings-sidebar-global`}>
            {/* Sidebar Header mimicking ChannelSidebar */}
            <div className="channel-header" style={{ cursor: 'default' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, #2b2d31, #1e1f22)',
                    zIndex: 0
                }}></div>

                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        color: 'var(--text-primary)',
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: 0
                    }}>Ayarlar</h2>
                </div>
            </div>

            {/* Menu List */}
            <div className="custom-scrollbar" style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
                <div style={{
                    padding: '0 8px 8px 8px',
                    color: '#949ba4',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-primary)'
                }}>
                    Hesap & Gizlilik
                </div>

                <div
                    className={`channel-item ${activeMenu === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('account')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'account' ? 'white' : '#949ba4', backgroundColor: activeMenu === 'account' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span style={{ fontWeight: 500 }}>Hesabım</span>
                </div>

                <div
                    className={`channel-item ${activeMenu === 'verification' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('verification')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'verification' ? 'white' : '#949ba4', backgroundColor: activeMenu === 'verification' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span style={{ fontWeight: 500 }}>Doğrulama</span>
                </div>

                <div
                    className={`channel-item ${activeMenu === 'privacy' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('privacy')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'privacy' ? 'white' : '#949ba4', backgroundColor: activeMenu === 'privacy' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span style={{ fontWeight: 500 }}>Gizlilik</span>
                </div>

                <div style={{
                    padding: '24px 8px 8px 8px',
                    color: '#949ba4',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-primary)'
                }}>
                    Uygulama
                </div>

                <div
                    className={`channel-item ${activeMenu === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('notifications')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'notifications' ? 'white' : '#949ba4', backgroundColor: activeMenu === 'notifications' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span style={{ fontWeight: 500 }}>Bildirimler</span>
                </div>

                <div style={{
                    padding: '24px 8px 8px 8px',
                    color: '#ff4d4d',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-primary)'
                }}>
                    Tehlikeli Alan
                </div>

                <div
                    className={`channel-item ${activeMenu === 'danger' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('danger')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'danger' ? 'white' : '#ff4d4d', backgroundColor: activeMenu === 'danger' ? 'rgba(255, 77, 77, 0.1)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ff4d4d' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span style={{ fontWeight: 500, color: '#ff4d4d' }}>Hesap İşlemleri</span>
                </div>

                <div className="settings-footer-info" style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <p>OxySpace v2.4.0</p>
                    <p>&copy; 2026</p>
                </div>
            </div>
        </div>
    );

    const renderHeader = (title, backTo = 'main') => (
        <header className="channel-top-bar" style={{ marginBottom: '20px' }}>
            <div className="channel-title-wrapper" style={{ flex: 1 }}>
                <button
                    className="back-btn mobile-only"
                    onClick={() => setActiveMenu(backTo)}
                    style={{ marginRight: '16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <span className="hashtag" style={{ color: 'var(--primary-color)' }}>#</span>
                <h3 className="channel-name" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            </div>
        </header>
    );

    const renderContent = () => {
        let content = null;
        let title = "Ayarlar";

        switch (activeMenu) {
            case 'account':
                title = "Hesabım";
                content = renderAccountMenu();
                break;
            case 'verification':
                title = "Doğrulama";
                content = renderVerificationMenu();
                break;
            case 'privacy':
                title = "Gizlilik";
                content = renderPrivacyMenu();
                break;
            case 'notifications':
                title = "Bildirimler";
                content = renderNotificationsMenu();
                break;
            case 'danger':
                title = "Tehlikeli Alan";
                content = renderDangerMenu();
                break;
            default:
                content = (
                    <div className="placeholder-content">
                        <div className="placeholder-icon">⚙️</div>
                        <h3>Ayarlar</h3>
                        <p>Sol menüden bir seçenek belirleyerek ayarlarınızı yönetebilirsiniz.</p>
                    </div>
                );
        }

        return (
            <main className={`discord-main-content ${activeMenu === 'main' ? 'hidden-on-mobile' : ''}`}>
                {activeMenu !== 'main' && renderHeader(title)}
                <div className="settings-content-scrollable custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}>
                    {content}
                </div>
            </main>
        );
    };

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
                            Belgeleriniz titizlikle incelenir.
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
                                    <span className="placeholder-text">Kategori Seçimi Yap</span>
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
        <div className="app-wrapper full-height discord-layout">
            <Navbar />

            <div className="discord-split-view">
                {renderSidebar()}
                {renderContent()}

                {/* Modals */}
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
        </div>
    );
};

export default Settings;
