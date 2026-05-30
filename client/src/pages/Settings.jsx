import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import { getImageUrl } from '../utils/imageUtils';
import '../components/InfoPage.css';
import './Settings.css';

const Settings = () => {
    const { logout, user, updateUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Navigation State
    const [activeMenu, setActiveMenu] = useState('main'); // main, account, notifications, privacy, verification

    // Settings State
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        mentions: true,
        likes: false,
        comments: true,
        friendRequests: true,
        system: true,
    });
    const [privacy, setPrivacy] = useState({
        isPrivate: false,
        portalVisibility: 'public',
        showOnlineStatus: true,
        dmSettings: 'everyone',
        searchVisibility: true,
        readReceipts: true,
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Profile Form State
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        username: '',
        bio: '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

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
    const [reapplyMode, setReapplyMode] = useState(false);

    const SECURITY_QUESTIONS_POOL = [
        'İlk evcil hayvanınızın adı nedir?',
        'En sevdiğiniz film hangisidir?',
        'Annenizin kızlık soyadı nedir?',
        'İlk okulunuzun adı nedir?',
        'Hangi şehirde doğdunuz?',
        'En sevdiğiniz öğretmenin adı nedir?'
    ];
    
    const [securityQ1, setSecurityQ1] = useState(SECURITY_QUESTIONS_POOL[0]);
    const [securityQ2, setSecurityQ2] = useState(SECURITY_QUESTIONS_POOL[1]);
    const [securityA1, setSecurityA1] = useState('');
    const [securityA2, setSecurityA2] = useState('');
    const [showSecurityA1, setShowSecurityA1] = useState(false);
    const [showSecurityA2, setShowSecurityA2] = useState(false);
    const [securitySuccess, setSecuritySuccess] = useState('');
    const [securityError, setSecurityError] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);

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

    // Sync profileForm when user is loaded
    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.profile?.displayName || '',
                username: user.username || '',
                bio: user.profile?.bio || '',
            });
            if (user.securityAnswers && user.securityAnswers.length >= 2) {
                setSecurityQ1(user.securityAnswers[0].question);
                setSecurityQ2(user.securityAnswers[1].question);
                setSecurityA1(user.securityAnswers[0].answer || '');
                setSecurityA2(user.securityAnswers[1].answer || '');
            }
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setProfileLoading(true);

        try {
            const res = await axios.put('/api/users/me', {
                displayName: profileForm.displayName,
                username: profileForm.username,
                bio: profileForm.bio,
            });

            // Sync with auth context
            updateUser({
                ...user,
                username: res.data.user.username,
                profile: res.data.user.profile
            });
            setProfileSuccess('Profil bilgileriniz başarıyla güncellendi.');
            setTimeout(() => setProfileSuccess(''), 4000);
        } catch (err) {
            console.error('Profile update error:', err);
            setProfileError(err.response?.data?.message || 'Profil güncellenemedi.');
            setTimeout(() => setProfileError(''), 4000);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSecurityQuestionsUpdate = async (e) => {
        e.preventDefault();
        setSecurityError('');
        setSecuritySuccess('');

        if (securityQ1 === securityQ2) {
            setSecurityError('Lütfen iki farklı güvenlik sorusu seçin.');
            return;
        }

        if (!securityA1.trim() || !securityA2.trim()) {
            setSecurityError('Cevaplar boş olamaz.');
            return;
        }

        setSecurityLoading(true);

        try {
            const res = await axios.put('/api/users/security-questions', {
                securityAnswers: [
                    { question: securityQ1, answer: securityA1.trim() },
                    { question: securityQ2, answer: securityA2.trim() }
                ]
            });
            updateUser({
                ...user,
                securityQuestionsConfigured: true,
                securityAnswers: res.data.securityAnswers
            });
            setSecuritySuccess('Güvenlik soruları başarıyla güncellendi.');
            setTimeout(() => setSecuritySuccess(''), 4000);
        } catch (err) {
            console.error('Failed to update security questions:', err);
            setSecurityError(err.response?.data?.message || 'Güvenlik soruları güncellenemedi.');
            setTimeout(() => setSecurityError(''), 4000);
        } finally {
            setSecurityLoading(false);
        }
    };

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

    const handleSelectChange = async (setting, value, type = 'privacy') => {
        if (type === 'privacy') {
            setPrivacy((prev) => ({ ...prev, [setting]: value }));
        }
        try {
            await axios.put('/api/users/settings', { [type]: { [setting]: value } });
        } catch (error) {
            console.error('Failed to update settings:', error);
            fetchSettings();
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
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    zIndex: 0
                }}></div>

                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {activeMenu === 'main' && (
                        <button 
                            className="mobile-back-btn-inline" 
                            onClick={() => navigate(-1)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                    )}
                    {activeMenu !== 'main' && (
                        <button 
                            className="mobile-back-btn-inline" 
                            onClick={() => setActiveMenu('main')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                    )}
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
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'account' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'account' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span style={{ fontWeight: 500 }}>Hesabım</span>
                </div>

                <div
                    className={`channel-item ${activeMenu === 'verification' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('verification')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'verification' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'verification' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span style={{ fontWeight: 500 }}>Doğrulama</span>
                </div>

                <div
                    className={`channel-item ${activeMenu === 'privacy' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('privacy')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'privacy' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'privacy' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span style={{ fontWeight: 500 }}>Gizlilik ve Güvenlik</span>
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
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'notifications' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'notifications' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span style={{ fontWeight: 500 }}>Bildirimler</span>
                </div>

                <div style={{
                    padding: '24px 8px 8px 8px',
                    color: '#949ba4',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-primary)'
                }}>
                    Hakkımızda
                </div>

                <div
                    className="channel-item"
                    onClick={() => navigate('/privacy')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#949ba4', backgroundColor: 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span style={{ fontWeight: 500 }}>Gizlilik Politikası</span>
                </div>

                <div
                    className="channel-item"
                    onClick={() => navigate('/terms')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#949ba4', backgroundColor: 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span style={{ fontWeight: 500 }}>Kullanım Koşulları</span>
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
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'danger' ? 'var(--text-primary)' : '#ff4d4d', backgroundColor: activeMenu === 'danger' ? 'rgba(255, 77, 77, 0.1)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ff4d4d' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span style={{ fontWeight: 500, color: '#ff4d4d' }}>Hesap İşlemleri</span>
                </div>

                <div className="settings-footer-info" style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <p>&copy; 2026 Oxypace</p>
                </div>
            </div>
        </div>
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
                title = "Gizlilik ve Güvenlik";
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
                {activeMenu !== 'main' && (
                    <div className="info-page-header" style={{ padding: '8px 24px 0 24px', marginBottom: '6px' }}>
                        <div className="title-group">
                            <button 
                                className="minimal-back-btn" 
                                onClick={() => setActiveMenu('main')}
                                aria-label="Geri Dön"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <h1 className="gradient-title" style={{ fontSize: '2rem' }}>{title}</h1>
                        </div>
                    </div>
                )}
                <div className="settings-content-scrollable custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px 24px' }}>
                    <div className={activeMenu !== 'main' ? 'info-page-content' : ''} style={activeMenu !== 'main' ? { background: 'var(--glass-bg)', padding: '30px' } : {}}>
                        {content}
                    </div>
                </div>
            </main>
        );
    };

    const renderAccountMenu = () => (
        <div className="submenu-content animation-slide-in">
            {/* Real-time Glassmorphic Profile Preview Card */}
            <div className="settings-profile-preview-card" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {user?.profile?.avatar ? (
                        <img 
                            src={getImageUrl(user.profile.avatar)} 
                            alt={user.username} 
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-cyan)' }}
                        />
                    ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                            {user?.username?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {profileForm.displayName || user?.profile?.displayName || user?.username}
                            </span>
                            <Badge type={user?.verificationBadge} />
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>@{profileForm.username || user?.username}</span>
                    </div>
                </div>
                {profileForm.bio && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '8px', fontStyle: 'italic', borderLeft: '3px solid var(--primary-cyan)' }}>
                        {profileForm.bio}
                    </div>
                )}
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                <div className="setting-group" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Profil Bilgileri</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#b5bac1' }}>Görünen İsim</label>
                            <input 
                                type="text" 
                                value={profileForm.displayName} 
                                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                                style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                placeholder="Görünen Adınız"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#b5bac1' }}>Kullanıcı Adı</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span style={{ position: 'absolute', left: '12px', color: '#949ba4', fontWeight: '600' }}>@</span>
                                <input 
                                    type="text" 
                                    value={profileForm.username} 
                                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    style={{ width: '100%', padding: '12px 12px 12px 28px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                    placeholder="kullanici_adi"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#b5bac1' }}>Biyografi</label>
                            <textarea 
                                value={profileForm.bio} 
                                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value.slice(0, 500) })}
                                style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                                placeholder="Kendinizden bahsedin..."
                                rows="3"
                            />
                        </div>
                    </div>
                </div>

                {profileError && <div style={{ color: '#ff4444', fontSize: '13px', fontWeight: '500' }}>{profileError}</div>}
                {profileSuccess && <div style={{ color: '#00c851', fontSize: '13px', fontWeight: '500' }}>{profileSuccess}</div>}

                <button 
                    type="submit" 
                    disabled={profileLoading}
                    className="confirm-btn"
                    style={{
                        padding: '12px 20px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: profileLoading ? 'not-allowed' : 'pointer',
                        alignSelf: 'flex-start',
                        transition: 'background 0.2s',
                    }}
                >
                    {profileLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </form>

            {/* Account Stats & Security */}
            <div className="setting-group" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Hesap & Güvenlik</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* E-posta (Read-Only) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: '700', textTransform: 'uppercase' }}>E-Posta Adresi</span>
                            <span style={{ fontSize: '14px', color: 'white' }}>{user?.email}</span>
                        </div>
                        <span style={{ fontSize: '12px', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Doğrulanmış
                        </span>
                    </div>

                    {/* Şifre Değiştir */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>Şifre</span>
                            <span style={{ fontSize: '12px', color: '#949ba4' }}>Güvenlik amacıyla şifrenizi buradan değiştirebilirsiniz.</span>
                        </div>
                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        >
                            Şifreyi Güncelle
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: '700', textTransform: 'uppercase' }}>Kayıt Tarihi</span>
                            <span style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                            </span>
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: '700', textTransform: 'uppercase' }}>Rol</span>
                            <span style={{ fontSize: '14px', color: user?.isAdmin ? '#ffd700' : 'white', fontWeight: '600' }}>
                                {user?.isAdmin ? 'Baş Yönetici (Admin)' : 'Standart Üye'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderVerificationMenu = () => (
        <div className="submenu-content animation-slide-in">
            <div className="verification-container">
                {user?.verificationRequest?.status === 'pending' ? (
                    <div className="verification-status pending">
                        <div className="status-icon-large">⏳</div>
                        <div className="status-info">
                            <h4>Başvurunuz İnceleniyor</h4>
                            <p>Talebiniz ekibimiz tarafından değerlendiriliyor.</p>

                            <div className="badge-display-row">
                                <span>Talep Edilen:</span>
                                <strong>
                                    {user.verificationRequest.category === 'creator' && 'Mavi Tik (Tanınmış Kişi)'}
                                    {user.verificationRequest.category === 'business' && 'Altın Tik (İşletme)'}
                                    {user.verificationRequest.category === 'government' && 'Platin Tik (Devlet)'}
                                    {user.verificationRequest.category === 'partner' && 'Özel Tik (Partner)'}
                                    {!user.verificationRequest.category && 'Doğrulama Rozeti'}
                                </strong>
                            </div>

                            <div className="pending-progress-bar"></div>
                            <p style={{ fontSize: '0.8rem', marginTop: '12px', opacity: 0.7 }}>
                                Sonuçlandığında bildirim alacaksınız.
                            </p>
                        </div>
                    </div>
                ) : user?.verificationBadge !== 'none' && user?.verificationBadge !== 'staff' && !reapplyMode ? (
                    <div className="verification-status approved">
                        <div className="status-icon-large" style={{ color: '#2ecc71' }}>✓</div>
                        <div className="status-info">
                            <h4>Hesabınız Doğrulandı</h4>
                            <p>Tebrikler! Doğrulanmış rozetiniz aktif durumdadır.</p>
                            <div className="badge-display-row" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                                <span>Aktif Rozet:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                    {user.verificationBadge === 'blue' && 'Mavi Tik'}
                                    {user.verificationBadge === 'gold' && 'Altın Tik'}
                                    {user.verificationBadge === 'platinum' && 'Platin Tik'}
                                    {user.verificationBadge === 'special' && 'Özel Tik'}
                                    <Badge type={user.verificationBadge} size={16} />
                                </div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    onClick={() => setReapplyMode(true)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        background: 'var(--primary-cyan)',
                                        color: 'black',
                                        border: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                                >
                                    Farklı Bir Kategori İçin Yeniden Başvur
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="verification-apply">
                        {user?.verificationRequest?.status === 'rejected' && (
                            <div className="verification-status rejected" style={{
                                background: 'rgba(255, 77, 77, 0.05)',
                                border: '1px solid rgba(255, 77, 77, 0.2)',
                                color: '#ff6b6b',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textAlign: 'left'
                            }}>
                                <span style={{ fontSize: '24px' }}>⚠️</span>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#ff6b6b' }}>Önceki Başvurunuz Reddedildi</h4>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#b5bac1', lineHeight: '1.4' }}>
                                        Önceki doğrulama talebiniz kriterlerimize uymadığı için reddedilmiştir. Bilgilerinizi düzelterek aşağıdan tekrar başvurabilirsiniz.
                                    </p>
                                </div>
                            </div>
                        )}
                        <p className="verification-desc" style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                            Hesabınızın türünü en iyi anlatan kategoriyi seçerek başvurabilirsiniz. Başvurunuz ardından hesabınız topluluk kriterlerimize göre incelenecektir.
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
                                                {passwordForm.selectedCategory === 'creator' && 'Tanınmış Kişi / Üretici'}
                                                {passwordForm.selectedCategory === 'business' && 'İşletme / Kurum'}
                                                {passwordForm.selectedCategory === 'government' && 'Devlet Yetkilisi'}
                                                {passwordForm.selectedCategory === 'partner' && 'Platform Ortağı'}
                                            </span>
                                            <span className="selected-badge-preview">
                                                {passwordForm.selectedCategory === 'creator' && 'Mavi Tik Rozeti'}
                                                {passwordForm.selectedCategory === 'business' && 'Altın Tik Rozeti'}
                                                {passwordForm.selectedCategory === 'government' && 'Platin Tik Rozeti'}
                                                {passwordForm.selectedCategory === 'partner' && 'Özel Tik Rozeti'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="placeholder-text">Kategori Seçimi Yap</span>
                                )}
                                <svg
                                    className="dropdown-arrow"
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
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
                                            setPasswordForm((prev) => ({ ...prev, selectedCategory: 'creator' }));
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
                                            setPasswordForm((prev) => ({ ...prev, selectedCategory: 'business' }));
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
                                            setPasswordForm((prev) => ({ ...prev, selectedCategory: 'government' }));
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
                                            setPasswordForm((prev) => ({ ...prev, selectedCategory: 'partner' }));
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

                        {/* Real-time Badge Preview Card */}
                        {passwordForm.selectedCategory && (
                            <div className="badge-preview-card" style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                margin: '20px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '11px', color: '#949ba4', textTransform: 'uppercase', fontWeight: 'bold' }}>Canlı Rozet Önizlemesi</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'white' }}>
                                        {profileForm.displayName || user?.profile?.displayName || user?.username}
                                    </span>
                                    <Badge type={
                                        passwordForm.selectedCategory === 'creator' ? 'blue' :
                                        passwordForm.selectedCategory === 'business' ? 'gold' :
                                        passwordForm.selectedCategory === 'government' ? 'platinum' :
                                        passwordForm.selectedCategory === 'partner' ? 'special' : 'none'
                                    } size={18} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Raporlarda, gönderilerinizde ve profil sayfanızda bu şekilde görüntülenecektir.</p>
                            </div>
                        )}

                        {/* Verification Criteria Checklist */}
                        <div className="verification-criteria" style={{
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginTop: '24px',
                            marginBottom: '24px'
                        }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📋 Doğrulama Başvuru Şartları
                            </h4>
                            <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
                                <li><strong>Özgünlük:</strong> Hesabınız gerçek bir kişiyi, markayı veya resmi kurumu temsil etmelidir.</li>
                                <li><strong>Tam Profil:</strong> Hesabınızın bir profil fotoğrafı, biyografisi ve en az bir aktif gönderisi bulunmalıdır.</li>
                                <li><strong>Aktiflik:</strong> Son 30 günde platforma giriş yapmış ve etkileşimde bulunmuş olmanız gerekir.</li>
                                <li><strong>Güvenilirlik:</strong> Topluluk kurallarına aykırı davranış veya yakın zamanda ban cezası bulunmamalıdır.</li>
                            </ul>
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
        <div className="submenu-content animation-slide-in">
            {/* Privacy Summary Area */}
            <div style={{
                background: privacy.isPrivate ? 'rgba(52, 152, 219, 0.05)' : 'rgba(230, 126, 34, 0.03)',
                border: `1px solid ${privacy.isPrivate ? 'rgba(52, 152, 219, 0.15)' : 'rgba(255, 255, 255, 0.05)'}`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ fontSize: '32px' }}>
                    {privacy.isPrivate ? '🛡️' : '🌍'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                        {privacy.isPrivate ? 'Hesabınız Korumalı' : 'Hesabınız Herkese Açık'}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                        {privacy.isPrivate 
                            ? 'Sadece onayladığınız arkadaşlarınız profil detaylarınızı ve gönderilerinizi görebilir.' 
                            : 'Tüm Oxypace kullanıcıları profilinizi inceleyebilir ve gönderilerinize erişebilir.'}
                    </p>
                </div>
            </div>

            <div className="settings-section" style={{ margin: 0, padding: 0, background: 'transparent' }}>
                {/* SECTION 1: Profil Görünürlüğü */}
                <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>Profil Görünürlüğü</h3>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 20px', marginBottom: '24px' }}>
                    {/* 1. Gizli Hesap */}
                    <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="setting-info" style={{ paddingRight: '15px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Gizli Hesap</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Profilinizi kilitler. Yalnızca arkadaşlarınız içeriklerinizi görebilir.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={privacy.isPrivate || false}
                                onChange={() => handleToggle('isPrivate', 'privacy')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {/* 2. Arama Görünürlüğü */}
                    <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="setting-info" style={{ paddingRight: '15px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Arama Sonuçlarında Görünme</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Kapatırsanız, arama sayfasında kullanıcı adınız aratıldığında profiliniz gizlenir.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={privacy.searchVisibility !== false}
                                onChange={() => handleToggle('searchVisibility', 'privacy')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {/* 3. Portal Görünürlüğü */}
                    <div className="setting-item" style={{ padding: '16px 0', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                        <div className="setting-info">
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px', color: 'var(--text-primary)' }}>Portal Katılım Görünürlüğü</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Profil sayfanızda katıldığınız portalları kimlerin listeleyebileceğini seçin.</p>
                        </div>
                        <select
                            value={privacy.portalVisibility || 'public'}
                            onChange={(e) => handleSelectChange('portalVisibility', e.target.value)}
                            className="badge-select"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                        >
                            <option value="public">Herkes (Herkese Açık)</option>
                            <option value="friends">Sadece Arkadaşlarım</option>
                            <option value="private">Gizli (Yalnızca Ben)</option>
                        </select>
                    </div>
                </div>

                {/* SECTION 2: İletişim ve Mesajlar */}
                <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>İletişim & Etkileşim</h3>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 20px' }}>
                    {/* 1. Çevrimiçi Durumu */}
                    <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="setting-info" style={{ paddingRight: '15px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Çevrimiçi Durumunu Göster</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Aktif olduğunuzda diğer kullanıcılara yeşil çevrimiçi simgesini gösterir.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={privacy.showOnlineStatus !== false}
                                onChange={() => handleToggle('showOnlineStatus', 'privacy')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {/* 2. Okundu Bilgisi */}
                    <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="setting-info" style={{ paddingRight: '15px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Okundu Bilgisi (Mavi Tik)</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Özel DM sohbetlerinizde mesajları okuduğunuzda karşı tarafa bilgi iletilmesini kontrol eder.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={privacy.readReceipts !== false}
                                onChange={() => handleToggle('readReceipts', 'privacy')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {/* 3. DM İzinleri */}
                    <div className="setting-item" style={{ padding: '16px 0', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                        <div className="setting-info">
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px', color: 'var(--text-primary)' }}>Doğrudan Mesaj (DM) İzinleri</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Sohbet başlatılmamış hangi kullanıcıların size mesaj atabileceğini belirler.</p>
                        </div>
                        <select
                            value={privacy.dmSettings || 'everyone'}
                            onChange={(e) => handleSelectChange('dmSettings', e.target.value)}
                            className="badge-select"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                        >
                            <option value="everyone">Herkes Gönderebilir</option>
                            <option value="friends">Sadece Arkadaşlarım</option>
                            <option value="none">Hiç Kimse (Kapalı)</option>
                        </select>
                    </div>
                </div>

                {/* SECTION 3: Güvenlik Soruları */}
                <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginTop: '28px', marginBottom: '12px', textTransform: 'uppercase' }}>Hesap Kurtarma Soruları</h3>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                }}>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
                        Hesap kurtarma (recovery) durumlarında kimliğinizi doğrulamak için kullanılacak bankacılık düzeyinde güvenlik sorularınızı aşağıdan seçip güncelleyebilirsiniz.
                    </p>

                    <form onSubmit={handleSecurityQuestionsUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Question 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>GÜVENLİK SORUSU 1</label>
                            <select
                                value={securityQ1}
                                onChange={(e) => setSecurityQ1(e.target.value)}
                                className="badge-select"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {SECURITY_QUESTIONS_POOL.map((q) => (
                                    <option key={q} value={q} style={{ backgroundColor: '#18191c', color: 'white' }}>{q}</option>
                                ))}
                            </select>
                            <div style={{ position: 'relative', marginTop: '4px' }}>
                                <input
                                    type={showSecurityA1 ? 'text' : 'password'}
                                    placeholder="Cevabınızı yazın"
                                    required
                                    value={securityA1}
                                    onChange={(e) => setSecurityA1(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        outline: 'none',
                                        fontSize: '13.5px'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecurityA1(!showSecurityA1)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#949ba4',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    {showSecurityA1 ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Question 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>GÜVENLİK SORUSU 2</label>
                            <select
                                value={securityQ2}
                                onChange={(e) => setSecurityQ2(e.target.value)}
                                className="badge-select"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {SECURITY_QUESTIONS_POOL.map((q) => (
                                    <option key={q} value={q} style={{ backgroundColor: '#18191c', color: 'white' }}>{q}</option>
                                ))}
                            </select>
                            <div style={{ position: 'relative', marginTop: '4px' }}>
                                <input
                                    type={showSecurityA2 ? 'text' : 'password'}
                                    placeholder="Cevabınızı yazın"
                                    required
                                    value={securityA2}
                                    onChange={(e) => setSecurityA2(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        outline: 'none',
                                        fontSize: '13.5px'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecurityA2(!showSecurityA2)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#949ba4',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    {showSecurityA2 ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {securityError && (
                            <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                                {securityError}
                            </div>
                        )}
                        {securitySuccess && (
                            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                                {securitySuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={securityLoading}
                            style={{
                                marginTop: '8px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {securityLoading ? 'Kaydediliyor...' : 'Güvenlik Sorularını Güncelle'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    const renderNotificationsMenu = () => (
        <div className="submenu-content animation-slide-in">
            {/* SECTION 1: Sistem Bildirim Kanalları */}
            <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>Bildirim Kanalları</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 20px', marginBottom: '24px' }}>
                {/* E-posta Bildirimleri */}
                <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="setting-info" style={{ paddingRight: '15px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>E-posta Bildirimleri</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Sistem duyuruları ve önemli etkileşim özetleri e-posta adresinize gönderilir.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={() => handleToggle('email')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {/* Anlık Bildirimler */}
                <div className="setting-item" style={{ padding: '16px 0' }}>
                    <div className="setting-info" style={{ paddingRight: '15px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Anlık (Push) Bildirimler</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Tarayıcı veya mobil cihazınıza anlık etkileşim bildirimleri gönderilir.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifications.push}
                            onChange={() => handleToggle('push')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            {/* SECTION 2: Etkileşim Bildirimleri */}
            <h3 style={{ fontSize: '12px', color: '#949ba4', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>Etkileşim & Hareketler</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 20px' }}>
                {/* Alıntılar ve Yanıtlar */}
                <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="setting-info" style={{ paddingRight: '15px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Alıntılar ve Yanıtlar</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Gönderileriniz alıntılandığında veya yanıtlandığında bildirim alın.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifications.comments !== false}
                            onChange={() => handleToggle('comments')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {/* Arkadaşlık İstekleri */}
                <div className="setting-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="setting-info" style={{ paddingRight: '15px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Arkadaşlık İstekleri</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Yeni bir arkadaşlık (tanışma) veya kabul isteği aldığınızda haber verilsin.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifications.friendRequests !== false}
                            onChange={() => handleToggle('friendRequests')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {/* Sistem Duyuruları */}
                <div className="setting-item" style={{ padding: '16px 0' }}>
                    <div className="setting-info" style={{ paddingRight: '15px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Sistem Duyuruları</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Oxypace yönetimi tarafından yayınlanan genel güncellemeler ve duyurular.</p>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={notifications.system !== false}
                            onChange={() => handleToggle('system')}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderDangerMenu = () => (
        <div className="submenu-content">
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
        <div className="app-wrapper full-height settings-page-wrapper glass-redesign">
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
