import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Eye, EyeOff, ShieldCheck, KeyRound, Lock, CheckCircle2, AlertTriangle, 
    Hourglass, ChevronDown, Sliders, Type, MoveVertical, RotateCcw, 
    Sparkles, Film, Grid, Check, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import UserBadges from '../components/UserBadges';
import { getImageUrl } from '../utils/imageUtils';
import '../components/InfoPage.css';
import './Settings.css';

const Settings = () => {
    const { logout, user, updateUser, loading: authLoading } = useAuth();
    const { socket } = useSocket();
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
    const [videoSettings, setVideoSettings] = useState({
        playbackQuality: 'auto',
        downloadQuality: 'ask',
        downloadFormat: 'ask',
    });
    // Watch Party Subtitle Engine Studio States
    const [wpSubScale, setWpSubScale] = useState(() => {
        const s = localStorage.getItem('watchPartySubScale');
        return s !== null ? parseFloat(s) : 1.0;
    });
    const [wpSubBottom, setWpSubBottom] = useState(() => {
        const b = localStorage.getItem('watchPartySubBottomPercent');
        return b !== null ? parseInt(b, 10) : 6;
    });
    const [wpSubColor, setWpSubColor] = useState(() => {
        return localStorage.getItem('watchPartySubColor') || '#ffffff';
    });
    const [wpSubBg, setWpSubBg] = useState(() => {
        return localStorage.getItem('watchPartySubBg') || 'none';
    });
    const [wpSubShadow, setWpSubShadow] = useState(() => {
        return localStorage.getItem('watchPartySubShadow') || 'deep';
    });
    const [wpSubFont, setWpSubFont] = useState(() => {
        return localStorage.getItem('watchPartySubFont') || 'sans';
    });
    const [wpSampleText, setWpSampleText] = useState('Neyi bekliyorsun? Sen sadece bir insansın.');
    const [isWpDragging, setIsWpDragging] = useState(false);
    const [wpGuidesVisible, setWpGuidesVisible] = useState(true);
    const [wpSavedNotice, setWpSavedNotice] = useState(false);
    const previewContainerRef = useRef(null);
    const wpDragStartRef = useRef({ startY: 0, startBottom: 6 });

    const triggerWpSync = (key, value) => {
        localStorage.setItem(key, typeof value === 'number' ? value.toString() : value);
        window.dispatchEvent(new CustomEvent('watchparty:subtitles-updated'));
        setWpSavedNotice(true);
        setTimeout(() => setWpSavedNotice(false), 2200);
    };

    const handleWpScaleChange = (scale) => {
        const clamped = Math.max(0.6, Math.min(1.8, Math.round(scale * 100) / 100));
        setWpSubScale(clamped);
        triggerWpSync('watchPartySubScale', clamped);
    };

    const handleWpBottomChange = (bottom) => {
        const clamped = Math.max(2, Math.min(85, Math.round(bottom)));
        setWpSubBottom(clamped);
        triggerWpSync('watchPartySubBottomPercent', clamped);
    };

    const handleWpResetDefaults = () => {
        setWpSubScale(1.0);
        setWpSubBottom(6);
        setWpSubColor('#ffffff');
        setWpSubBg('none');
        setWpSubShadow('deep');
        setWpSubFont('sans');
        localStorage.setItem('watchPartySubScale', '1.0');
        localStorage.setItem('watchPartySubBottomPercent', '6');
        localStorage.setItem('watchPartySubColor', '#ffffff');
        localStorage.setItem('watchPartySubBg', 'none');
        localStorage.setItem('watchPartySubShadow', 'deep');
        localStorage.setItem('watchPartySubFont', 'sans');
        window.dispatchEvent(new CustomEvent('watchparty:subtitles-updated'));
        setWpSavedNotice(true);
        setTimeout(() => setWpSavedNotice(false), 2200);
    };

    const handlePreviewSubDragStart = (e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        e.preventDefault();
        e.stopPropagation();
        setIsWpDragging(true);
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        wpDragStartRef.current = { startY: clientY, startBottom: wpSubBottom };

        const onDragMove = (moveEvt) => {
            const curY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
            const deltaY = wpDragStartRef.current.startY - curY;
            const containerHeight = previewContainerRef.current ? previewContainerRef.current.offsetHeight : 320;
            const deltaPercent = (deltaY / containerHeight) * 100;
            const nextPercent = Math.max(2, Math.min(85, Math.round(wpDragStartRef.current.startBottom + deltaPercent)));
            setWpSubBottom(nextPercent);
            localStorage.setItem('watchPartySubBottomPercent', nextPercent.toString());
            window.dispatchEvent(new CustomEvent('watchparty:subtitles-updated'));
        };

        const onDragEnd = () => {
            setIsWpDragging(false);
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
            setWpSavedNotice(true);
            setTimeout(() => setWpSavedNotice(false), 2200);
        };

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    };

    const getWpShadowStyle = (shadowType) => {
        switch (shadowType) {
            case 'strong':
                return '0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.95)';
            case 'glow':
                return '0 0 10px rgba(56, 189, 248, 0.85), 0 0 4px #000, 1px 1px 2px #000, -1px -1px 2px #000';
            case 'clean':
                return '0 1px 2px rgba(0,0,0,0.85)';
            case 'deep':
            default:
                return '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 0 2px 5px rgba(0,0,0,0.95)';
        }
    };

    const getWpBgStyle = (bgType) => {
        switch (bgType) {
            case 'semi':
                return 'rgba(0, 0, 0, 0.65)';
            case 'box':
                return 'rgba(0, 0, 0, 0.92)';
            case 'blur':
                return 'rgba(10, 10, 15, 0.75)';
            case 'none':
            default:
                return 'transparent';
        }
    };

    const getWpFontFamily = (fontType) => {
        switch (fontType) {
            case 'matrix':
            case 'mono':
                return 'Consolas, "SF Mono", monospace';
            case 'serif':
                return 'Georgia, "Times New Roman", serif';
            case 'sans':
            default:
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        }
    };

    // UI State
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [testPushLoading, setTestPushLoading] = useState(false);
    const [testPushStatus, setTestPushStatus] = useState(null);

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

    // Devices State
    const [userDevices, setUserDevices] = useState([]);
    const [devicesLoading, setDevicesLoading] = useState(false);

    const fetchUserDevices = async () => {
        setDevicesLoading(true);
        try {
            const res = await axios.get('/api/users/devices');
            setUserDevices(res.data.devices || []);
        } catch (err) {
            console.error('Fetch devices error:', err);
        } finally {
            setDevicesLoading(false);
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        if (!window.confirm('Bu cihazın erişim kaydını silmek istediğinize emin misiniz?')) return;
        try {
            const res = await axios.delete(`/api/users/devices/${deviceId}`);
            setUserDevices(res.data.devices || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Cihaz silinemedi');
        }
    };

    const handleRenameDevice = async (deviceId, currentName) => {
        const newName = window.prompt('Cihaz için yeni bir isim girin:', currentName);
        if (!newName || !newName.trim() || newName.trim() === currentName) return;
        try {
            const res = await axios.put(`/api/users/devices/${deviceId}/rename`, { deviceName: newName.trim() });
            setUserDevices(res.data.devices || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Cihaz ismi güncellenemedi');
        }
    };

    // Extract query params to open specific section
    useLayoutEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        if (section && ['account', 'verification', 'devices', 'privacy', 'notifications'].includes(section)) {
            setActiveMenu(section);
        } else {
            setActiveMenu('main');
        }
    }, [window.location.search]);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeMenu === 'devices') {
            fetchUserDevices();
        }
    }, [activeMenu]);

    // Sync profileForm and securityAnswers when user is loaded
    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.profile?.displayName || '',
                username: user.username || '',
                bio: user.profile?.bio || '',
            });
            if (user.securityAnswers && user.securityAnswers.length >= 2) {
                setSecurityQ1(user.securityAnswers[0].question || SECURITY_QUESTIONS_POOL[0]);
                setSecurityQ2(user.securityAnswers[1].question || SECURITY_QUESTIONS_POOL[1]);
                
                const rawAns1 = user.securityAnswers[0].answer || '';
                const rawAns2 = user.securityAnswers[1].answer || '';

                // Filter out masked bullets (•) and any bcrypt hash ($2a$, $2b$, $2y$)
                const isHashOrMask = (str) => !str || str.includes('•') || str.startsWith('$2');

                setSecurityA1(isHashOrMask(rawAns1) ? '' : rawAns1);
                setSecurityA2(isHashOrMask(rawAns2) ? '' : rawAns2);
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
            const response = await axios.get('/api/users/me');
            if (response.data.user) {
                const u = response.data.user;
                if (u.securityAnswers && u.securityAnswers.length >= 2) {
                    setSecurityQ1(u.securityAnswers[0].question || SECURITY_QUESTIONS_POOL[0]);
                    setSecurityQ2(u.securityAnswers[1].question || SECURITY_QUESTIONS_POOL[1]);
                    const rawAns1 = u.securityAnswers[0].answer || '';
                    const rawAns2 = u.securityAnswers[1].answer || '';
                    const isHashOrMask = (str) => !str || str.includes('•') || str.startsWith('$2');
                    setSecurityA1(isHashOrMask(rawAns1) ? '' : rawAns1);
                    setSecurityA2(isHashOrMask(rawAns2) ? '' : rawAns2);
                }
            }
            if (response.data.settings) {
                setNotifications((prev) => ({ ...prev, ...response.data.settings.notifications }));
                setPrivacy((prev) => ({ ...prev, ...response.data.settings.privacy }));
                if (response.data.settings.video) {
                    setVideoSettings((prev) => ({ ...prev, ...response.data.settings.video }));
                    if (response.data.settings.video.playbackQuality) {
                        localStorage.setItem('video_playback_quality', response.data.settings.video.playbackQuality);
                    }
                    if (response.data.settings.video.downloadQuality) {
                        localStorage.setItem('video_download_quality', response.data.settings.video.downloadQuality);
                    }
                    if (response.data.settings.video.downloadFormat) {
                        localStorage.setItem('video_download_format', response.data.settings.video.downloadFormat);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVideoSelectChange = async (setting, value) => {
        setVideoSettings((prev) => ({ ...prev, [setting]: value }));
        
        // Save to localStorage for instant client-side sync across all players
        if (setting === 'playbackQuality') {
            localStorage.setItem('video_playback_quality', value);
        } else if (setting === 'downloadQuality') {
            localStorage.setItem('video_download_quality', value);
        } else if (setting === 'downloadFormat') {
            localStorage.setItem('video_download_format', value);
        }

        try {
            await axios.put('/api/users/settings', { video: { [setting]: value } });
            if (user) {
                updateUser({
                    ...user,
                    settings: {
                        ...user.settings,
                        video: {
                            ...(user.settings?.video || {}),
                            [setting]: value
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            fetchSettings();
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

        // Canlı socket güncellemesi
        if (setting === 'showOnlineStatus' && socket) {
            socket.emit('update_show_online_status', { showOnlineStatus: newValue });
        }

        try {
            const payload =
                type === 'notifications'
                    ? { notifications: { [setting]: newValue } }
                    : { privacy: { [setting]: newValue } };

            await axios.put('/api/users/settings', payload);
            if (user) {
                updateUser({
                    ...user,
                    settings: {
                        ...user.settings,
                        [type]: {
                            ...(user.settings?.[type] || {}),
                            [setting]: newValue
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            // Revert on error
            if (type === 'notifications') {
                setNotifications((prev) => ({ ...prev, [setting]: !newValue }));
            } else {
                setPrivacy((prev) => ({ ...prev, [setting]: !newValue }));
            }
            if (setting === 'showOnlineStatus' && socket) {
                socket.emit('update_show_online_status', { showOnlineStatus: !newValue });
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
        if (socket) {
            try {
                socket.emit('logout');
                socket.disconnect();
            } catch (e) {}
        }
        logout();
        navigate('/login');
    };

    // Check for mobile/window width to adjust layout logic if needed
    // For now, we'll use CSS to handle the split, but we might need to know if we are in "mobile view"
    // to handle the 'back' button behavior (hidden on desktop).

    const renderSidebar = () => (
        <div className={`channel-sidebar settings-sidebar-global ${activeMenu !== 'main' ? 'hidden-on-mobile' : ''}`}>
            {/* Sidebar Header mimicking ChannelSidebar */}
            <div className="channel-header" style={{ cursor: 'default' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
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
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                width="24"
                                height="24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                    )}
                    {activeMenu !== 'main' && (
                        <button 
                            className="mobile-back-btn-inline" 
                            onClick={() => setActiveMenu('main')}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                width="24"
                                height="24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
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

                <div
                    className={`channel-item ${activeMenu === 'devices' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('devices')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'devices' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'devices' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    <span style={{ fontWeight: 500 }}>Kayıtlı Cihazlar</span>
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

                <div
                    className={`channel-item ${activeMenu === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('video')}
                    style={{ padding: '8px', margin: '2px 0', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: activeMenu === 'video' ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: activeMenu === 'video' ? 'var(--bg-hover)' : 'transparent' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7a2 2 0 0 0-2.45-1.45L11 8 1 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2.45 1.45L11 16l10 3a2 2 0 0 0 2-2V7z"></path></svg>
                    <span style={{ fontWeight: 500 }}>Video Ayarları</span>
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
            case 'devices':
                title = "Kayıtlı Cihazlar";
                content = renderDevicesMenu();
                break;
            case 'notifications':
                title = "Bildirimler";
                content = renderNotificationsMenu();
                break;
            case 'video':
                title = "Video Ayarları";
                content = renderVideoMenu();
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
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    width="24"
                                    height="24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <h1 className="gradient-title" style={{ fontSize: '2rem' }}>{title}</h1>
                        </div>
                    </div>
                )}
                <div className="settings-content-scrollable custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px 24px' }}>
                    <div className={activeMenu !== 'main' ? 'info-page-content settings-main-panel' : ''} style={activeMenu !== 'main' ? { padding: '30px' } : {}}>
                        {content}
                    </div>
                </div>
            </main>
        );
    };

    const renderAccountMenu = () => (
        <div className="submenu-content animation-slide-in">
            {/* Account Overview Header Card */}
            <div className="settings-card account-profile-card">
                <div className="account-profile-header">
                    {user?.profile?.avatar ? (
                        <img 
                            src={getImageUrl(user.profile.avatar)} 
                            alt={user.username} 
                            className="account-avatar-img"
                        />
                    ) : (
                        <div className="account-avatar-placeholder">
                            {user?.username?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <div className="account-user-details">
                        <div className="account-name-row">
                            <h3 className="account-display-name">
                                {user?.profile?.displayName || user?.username}
                            </h3>
                            <UserBadges user={user} size={18} />
                        </div>
                        <span className="account-username-text">@{user?.username}</span>
                        {user?.profile?.bio && (
                            <p className="account-bio-preview">{user.profile.bio}</p>
                        )}
                    </div>
                    <button 
                        className="account-edit-profile-btn"
                        onClick={() => navigate(`/profile/${user?.username}`)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Profili Düzenle
                    </button>
                </div>
            </div>

            {/* Account Security & Credentials Section */}
            <div className="settings-group-container">
                <h3 className="settings-group-title">Hesap Güvenliği & Kimlik</h3>
                
                <div className="settings-card-stack">
                    {/* E-posta */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-label">E-Posta Adresi</span>
                            <span className="settings-item-value">{user?.email}</span>
                        </div>
                        <span className="settings-badge success">
                            ✓ Doğrulanmış
                        </span>
                    </div>

                    {/* Şifre */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Hesap Şifresi</span>
                            <span className="settings-item-desc">Şifrenizi düzenli aralıklarla değiştirerek hesabınızı koruyabilirsiniz.</span>
                        </div>
                        <button 
                            className="settings-action-btn"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            Şifreyi Güncelle
                        </button>
                    </div>

                    {/* Güvenlik Soruları */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Güvenlik Soruları</span>
                            <span className="settings-item-desc">Şifrenizi unutmanız durumunda hesabınızı kurtarmanızı sağlar.</span>
                        </div>
                        <button 
                            className="settings-action-btn"
                            onClick={() => setActiveMenu('privacy')}
                        >
                            Soruları Yönet
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Details Grid */}
            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">Hesap Detayları</h3>
                
                <div className="settings-grid-two">
                    <div className="settings-grid-card">
                        <span className="settings-item-label">Kayıt Tarihi</span>
                        <span className="settings-grid-value">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                        </span>
                    </div>

                    <div className="settings-grid-card">
                        <span className="settings-item-label">Hesap Rolü</span>
                        <span className="settings-grid-value role">
                            {user?.isAdmin ? 'Baş Yönetici (Admin)' : 'Standart Üye'}
                        </span>
                    </div>

                    <div className="settings-grid-card">
                        <span className="settings-item-label">Oturum Durumu</span>
                        <span className="settings-grid-value status-active">
                            ● Aktif ve Güvenli
                        </span>
                    </div>

                    <div className="settings-grid-card">
                        <span className="settings-item-label">Doğrulama Rozeti</span>
                        <span className="settings-grid-value">
                            {user?.isVerified ? 'Mavi Tık Doğrulanmış' : 'Doğrulanmamış'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Danger Zone Link */}
            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <div className="settings-item-row danger-row">
                    <div className="settings-item-info">
                        <span className="settings-item-title danger">Hesabımı Dondur veya Sil</span>
                        <span className="settings-item-desc">Hesabınızı geçici olarak dondurabilir veya kalıcı olarak silebilirsiniz.</span>
                    </div>
                    <button 
                        className="settings-action-btn danger"
                        onClick={() => setActiveMenu('danger')}
                    >
                        Hesap İşlemleri
                    </button>
                </div>
            </div>
        </div>
    );

    const renderVerificationMenu = () => (
        <div className="submenu-content animation-slide-in">
            {user?.verificationRequest?.status === 'pending' ? (
                <div className="settings-card verification-status-card pending">
                    <div className="verification-status-icon">⏳</div>
                    <div className="verification-status-details">
                        <h4>Doğrulama Başvurunuz İncelemede</h4>
                        <p>Talebiniz ekibimiz tarafından değerlendiriliyor. Sonuçlandığında anlık bildirim alacaksınız.</p>
                    </div>
                </div>
            ) : user?.verificationBadge !== 'none' && user?.verificationBadge !== 'staff' && !reapplyMode ? (
                <div className="settings-card verification-status-card approved">
                    <div className="verification-status-icon success">✓</div>
                    <div className="verification-status-details">
                        <h4>Hesabınız Doğrulandı</h4>
                        <p>Tebrikler! Doğrulanmış rozetiniz aktif durumdadır.</p>
                        <div className="verification-badge-preview-row">
                            <span>Aktif Rozetler:</span>
                            <UserBadges user={user} size={18} />
                        </div>
                        <button
                            className="settings-action-btn"
                            style={{ marginTop: '16px' }}
                            onClick={() => setReapplyMode(true)}
                        >
                            Farklı Bir Kategori İçin Yeniden Başvur
                        </button>
                    </div>
                </div>
            ) : (
                <div className="settings-group-container">
                    {user?.verificationRequest?.status === 'rejected' && (
                            <div className="settings-card verification-status-card rejected">
                                <span className="status-warning-icon">⚠️</span>
                                <div>
                                    <h4>Önceki Başvurunuz Reddedildi</h4>
                                    <p>Önceki doğrulama talebiniz kriterlerimize uymadığı için reddedilmiştir. Bilgilerinizi güncelleyerek tekrar başvurabilirsiniz.</p>
                                </div>
                            </div>
                        )}
                        <p className="settings-section-desc">
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
                            <div className="settings-card badge-preview-card">
                                <span className="settings-item-label">Canlı Rozet Önizlemesi</span>
                                <div className="badge-preview-user-row">
                                    <span className="badge-preview-name">
                                        {profileForm.displayName || user?.profile?.displayName || user?.username}
                                    </span>
                                    <Badge type={
                                        passwordForm.selectedCategory === 'creator' ? 'blue' :
                                        passwordForm.selectedCategory === 'business' ? 'gold' :
                                        passwordForm.selectedCategory === 'government' ? 'platinum' :
                                        passwordForm.selectedCategory === 'partner' ? 'special' : 'none'
                                    } size={18} />
                                </div>
                                <p className="settings-item-desc">Gönderilerinizde ve profil sayfanızda bu şekilde görüntülenecektir.</p>
                            </div>
                        )}

                        {/* Verification Criteria Checklist */}
                        <div className="settings-card verification-criteria-card">
                            <h4 className="verification-criteria-title">
                                📋 Doğrulama Başvuru Şartları
                            </h4>
                            <ul className="verification-criteria-list">
                                <li><strong>Özgünlük:</strong> Hesabınız gerçek bir kişiyi, markayı veya resmi kurumu temsil etmelidir.</li>
                                <li><strong>Tam Profil:</strong> Hesabınızın bir profil fotoğrafı ve biyografisi bulunmalıdır.</li>
                                <li><strong>Aktiflik:</strong> Son 30 günde platformda aktif etkileşimde bulunmuş olmanız gerekir.</li>
                                <li><strong>Güvenilirlik:</strong> Topluluk kurallarına uyum sağlanmalıdır.</li>
                            </ul>
                        </div>

                        <button
                            className="settings-action-btn primary-btn"
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                            Başvuruyu Gönder
                        </button>
                    </div>
                )}
        </div>
    );

    const renderPrivacyMenu = () => (
        <div className="submenu-content animation-slide-in">
            {/* Privacy Status Banner */}
            <div className={`settings-card privacy-status-banner ${privacy.isPrivate ? 'private' : 'public'}`}>
                <div className="privacy-banner-icon">
                    {privacy.isPrivate ? <ShieldCheck size={28} /> : <Lock size={28} />}
                </div>
                <div className="privacy-banner-text">
                    <h4>{privacy.isPrivate ? 'Hesabınız Korumalı' : 'Hesabınız Herkese Açık'}</h4>
                    <p>
                        {privacy.isPrivate 
                            ? 'Sadece onayladığınız arkadaşlarınız profil detaylarınızı ve gönderilerinizi görebilir.' 
                            : 'Tüm Oxypace kullanıcıları profilinizi inceleyebilir ve gönderilerinize erişebilir.'}
                    </p>
                </div>
            </div>

            <div className="settings-group-container">
                <h3 className="settings-group-title">Profil Görünürlüğü</h3>
                <div className="settings-card-stack">
                    {/* 1. Gizli Hesap */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Gizli Hesap</span>
                            <span className="settings-item-desc">Profilinizi kilitler. Yalnızca arkadaşlarınız içeriklerinizi görebilir.</span>
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
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Arama Sonuçlarında Görünme</span>
                            <span className="settings-item-desc">Kapatırsanız, arama sayfasında kullanıcı adınız aratıldığında profiliniz gizlenir.</span>
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
                    <div className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                        <div className="settings-item-info">
                            <span className="settings-item-title">Portal Katılım Görünürlüğü</span>
                            <span className="settings-item-desc">Profil sayfanızda katıldığınız portalları kimlerin listeleyebileceğini seçin.</span>
                        </div>
                        <div className="segmented-options-group">
                            {[
                                { value: 'public', label: 'Herkes (Açık)' },
                                { value: 'friends', label: 'Sadece Arkadaşlarım' },
                                { value: 'private', label: 'Gizli (Yalnızca Ben)' }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`segment-btn ${(privacy.portalVisibility || 'public') === opt.value ? 'active' : ''}`}
                                    onClick={() => handleSelectChange('portalVisibility', opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">İletişim & Etkileşim</h3>
                <div className="settings-card-stack">
                    {/* Çevrimiçi Durumu */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Çevrimiçi Durumunu Göster</span>
                            <span className="settings-item-desc">Aktif olduğunuzda diğer kullanıcılara çevrimiçi simgesini gösterir.</span>
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

                    {/* Okundu Bilgisi */}
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Okundu Bilgisi (Sohbet)</span>
                            <span className="settings-item-desc">Mesajları okuduğunuzda karşı tarafa okundu bilgisi iletilmesini kontrol eder.</span>
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

                    {/* DM İzinleri */}
                    <div className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                        <div className="settings-item-info">
                            <span className="settings-item-title">Doğrudan Mesaj (DM) İzinleri</span>
                            <span className="settings-item-desc">Kimlerin size doğrudan mesaj atabileceğini belirler.</span>
                        </div>
                        <div className="segmented-options-group">
                            {[
                                { value: 'everyone', label: 'Herkes Gönderebilir' },
                                { value: 'friends', label: 'Sadece Arkadaşlarım' },
                                { value: 'none', label: 'Hiç Kimse (Kapalı)' }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`segment-btn ${(privacy.dmSettings || 'everyone') === opt.value ? 'active' : ''}`}
                                    onClick={() => handleSelectChange('dmSettings', opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Güvenlik Soruları Kartı */}
            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">Hesap Kurtarma Soruları</h3>
                <div className="settings-card security-questions-card">
                    <p className="settings-section-desc">
                        Hesap kurtarma durumlarında kimliğinizi doğrulamak için kullanılacak güvenlik sorularınızı güncelleyebilirsiniz. Cevaplarınız görünür durumdadır.
                    </p>

                    <form onSubmit={handleSecurityQuestionsUpdate} className="settings-form">
                        <div className="security-question-item">
                            <div className="security-question-header">
                                <ShieldCheck size={15} /> GÜVENLİK SORUSU 1
                            </div>
                            <div className="security-select-wrapper">
                                <select
                                    value={securityQ1}
                                    onChange={(e) => setSecurityQ1(e.target.value)}
                                    className="security-question-select"
                                >
                                    {SECURITY_QUESTIONS_POOL.map((q) => (
                                        <option key={q} value={q}>{q}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="security-select-arrow" />
                            </div>
                            <div className="security-answer-box">
                                <input
                                    type={showSecurityA1 ? 'text' : 'password'}
                                    placeholder="Birinci cevabınızı yazın..."
                                    required
                                    value={securityA1}
                                    onChange={(e) => setSecurityA1(e.target.value)}
                                    className="security-answer-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecurityA1(!showSecurityA1)}
                                    className="security-eye-toggle"
                                    title={showSecurityA1 ? 'Cevabı Gizle' : 'Cevabı Göster'}
                                >
                                    {showSecurityA1 ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="security-question-item">
                            <div className="security-question-header">
                                <KeyRound size={15} /> GÜVENLİK SORUSU 2
                            </div>
                            <div className="security-select-wrapper">
                                <select
                                    value={securityQ2}
                                    onChange={(e) => setSecurityQ2(e.target.value)}
                                    className="security-question-select"
                                >
                                    {SECURITY_QUESTIONS_POOL.map((q) => (
                                        <option key={q} value={q}>{q}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="security-select-arrow" />
                            </div>
                            <div className="security-answer-box">
                                <input
                                    type={showSecurityA2 ? 'text' : 'password'}
                                    placeholder="İkinci cevabınızı yazın..."
                                    required
                                    value={securityA2}
                                    onChange={(e) => setSecurityA2(e.target.value)}
                                    className="security-answer-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecurityA2(!showSecurityA2)}
                                    className="security-eye-toggle"
                                    title={showSecurityA2 ? 'Cevabı Gizle' : 'Cevabı Göster'}
                                >
                                    {showSecurityA2 ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>

                        {securityError && <div className="settings-msg error">{securityError}</div>}
                        {securitySuccess && <div className="settings-msg success">{securitySuccess}</div>}

                        <button
                            type="submit"
                            disabled={securityLoading}
                            className="settings-action-btn primary-btn"
                            style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                        >
                            {securityLoading ? 'Kaydediliyor...' : 'Güvenlik Sorularını Güncelle'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    const renderDevicesMenu = () => {
        const currentDeviceId = localStorage.getItem('oxypace_device_id');
        return (
            <div className="submenu-content animation-slide-in">
                <div className="settings-group-container">
                    <h3 className="settings-group-title">Kayıtlı Cihazlarınız ve Oturum Geçmişi</h3>
                    <p className="settings-section-desc" style={{ marginBottom: '16px' }}>
                        Hesabınıza erişim izni verilmiş cihazların listesidir. Tanımadığınız bir cihaz görürseniz listeden kaldırarak erişimini sonlandırabilirsiniz.
                    </p>

                    {devicesLoading ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Cihazlar yükleniyor...</div>
                    ) : userDevices.length === 0 ? (
                        <div className="settings-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Kayıtlı cihaz bulunamadı.
                        </div>
                    ) : (
                        <div className="settings-card-stack">
                            {userDevices.map((dev) => {
                                const isCurrent = dev.deviceId === currentDeviceId;
                                return (
                                    <div key={dev.deviceId || dev._id} className="settings-item-row" style={{ alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                fontSize: '20px',
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: isCurrent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isCurrent ? '#22c55e' : '#aaa'
                                            }}>
                                                {dev.deviceType === 'desktop' ? '💻' : (dev.deviceType === 'android' || dev.deviceType === 'ios' || dev.deviceType === 'mobile') ? '📱' : '🌐'}
                                            </div>
                                            <div className="settings-item-info">
                                                <span className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {dev.deviceName || 'Bilinmeyen Cihaz'}
                                                    {isCurrent && (
                                                        <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                                                            Şu Anki Cihaz
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="settings-item-desc" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    Son İP: {dev.lastIP || 'Bilinmiyor'} • İlk Kayıt: {dev.firstSeenAt ? new Date(dev.firstSeenAt).toLocaleDateString('tr-TR') : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                className="settings-action-btn secondary-btn"
                                                onClick={() => handleRenameDevice(dev.deviceId, dev.deviceName)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    background: 'rgba(255, 255, 255, 0.06)',
                                                    color: 'var(--text-primary)',
                                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Yeniden İsimlendir
                                            </button>
                                            <button
                                                className="settings-action-btn danger-btn"
                                                onClick={() => handleRemoveDevice(dev.deviceId || dev._id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Kaldır
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderNotificationsMenu = () => (
        <div className="submenu-content animation-slide-in">
            <div className="settings-group-container">
                <h3 className="settings-group-title">Bildirim Kanalları</h3>
                <div className="settings-card-stack">
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">E-posta Bildirimleri</span>
                            <span className="settings-item-desc">Sistem duyuruları ve önemli etkileşim özetleri e-posta adresinize gönderilir.</span>
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

                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Anlık (Push) Bildirimler</span>
                            <span className="settings-item-desc">Tarayıcı veya mobil cihazınıza anlık etkileşim bildirimleri gönderilir.</span>
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

                    {/* Test Push Notification Diagnostic Tool */}
                    <div className="settings-item-row" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '12px 16px', marginTop: '8px' }}>
                        <div className="settings-item-info">
                            <span className="settings-item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8' }}>
                                🔔 Mobil Cihaz Bildirim Testi
                            </span>
                            <span className="settings-item-desc" style={{ fontSize: '12px' }}>
                                Bu butona basarak telefonunuza anında bir test bildirimi fırlatabilir, bildirim sisteminizin çalıştığını doğrulayabilirsiniz.
                            </span>
                            {testPushStatus && (
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginTop: '4px',
                                    display: 'block',
                                    color: testPushStatus.type === 'success' ? '#22c55e' : '#ef4444'
                                }}>
                                    {testPushStatus.message}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            disabled={testPushLoading}
                            onClick={async () => {
                                setTestPushLoading(true);
                                setTestPushStatus(null);
                                try {
                                    const res = await axios.post('/api/users/test-push');
                                    setTestPushStatus({
                                        type: 'success',
                                        message: `✅ ${res.data.message} (${res.data.tokenCount} cihaz hedeflendi)`
                                    });
                                } catch (err) {
                                    setTestPushStatus({
                                        type: 'error',
                                        message: err.response?.data?.message || '❌ Test bildirimi gönderilemedi.'
                                    });
                                } finally {
                                    setTestPushLoading(false);
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: testPushLoading ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                                opacity: testPushLoading ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            {testPushLoading ? 'Gönderiliyor...' : '📲 Bildirimi Test Et'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">Etkileşim & Hareketler</h3>
                <div className="settings-card-stack">
                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Alıntılar ve Yanıtlar</span>
                            <span className="settings-item-desc">Gönderileriniz alıntılandığında veya yanıtlandığında bildirim alın.</span>
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

                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Arkadaşlık İstekleri</span>
                            <span className="settings-item-desc">Yeni bir arkadaşlık isteği aldığınızda haber verilsin.</span>
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

                    <div className="settings-item-row">
                        <div className="settings-item-info">
                            <span className="settings-item-title">Sistem Duyuruları</span>
                            <span className="settings-item-desc">Oxypace yönetimi tarafından yayınlanan genel güncellemeler ve duyurular.</span>
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
        </div>
    );

    const renderVideoMenu = () => (
        <div className="submenu-content animation-slide-in">
            {/* CANLI ODA "BİRLİKTE İZLE" ALTYAZI GÖRÜNÜM DÜZENLEYİCİSİ MODÜLÜ */}
            <div className="settings-group-container wp-studio-wrapper">
                <div className="wp-studio-header">
                    <div className="wp-studio-header-titles">
                        <div className="wp-studio-badge-tag">
                            <Film size={11} />
                            <span>ENGINE LAB // VOD & LIVE SUBTITLES</span>
                        </div>
                        <h3 className="wp-studio-main-title">
                            Canlı Oda "Birlikte İzle" Altyazı Stüdyosu
                        </h3>
                        <p className="wp-studio-sub-desc">
                            Canlı odalarda izlenen filmlerdeki altyazıların boyutu, konumu, rengi ve sinematik kontrastını bu ekrandan profesyonelce kalibre edin.
                        </p>
                    </div>
                    <div className="wp-studio-header-sync-pill">
                        <span className="wp-studio-pulse-dot" />
                        <span>CANLI SENKRONİZE</span>
                    </div>
                </div>

                {/* SİNEMATİK ÖNİZLEME VİZÖRÜ (MATRIX SAHNESİ) */}
                <div className="wp-studio-viewport-card">
                    {/* Viewport Top Bar */}
                    <div className="wp-studio-viewport-hud">
                        <div className="wp-studio-hud-left">
                            <span className="wp-studio-rec-dot" />
                            <span className="wp-studio-hud-text">CANLI ÖNİZLEME [MATRIX 4K MASTER]</span>
                            <span className="wp-studio-hud-aspect">2.39:1 CINEMASCOPE</span>
                        </div>
                        <div className="wp-studio-hud-right">
                            <button
                                type="button"
                                className={`wp-studio-hud-btn ${wpGuidesVisible ? 'active' : ''}`}
                                onClick={() => setWpGuidesVisible(prev => !prev)}
                                title="Kılavuz Çizgileri Aç/Kapat"
                            >
                                <Grid size={13} />
                                <span>Kılavuz</span>
                            </button>
                            <button
                                type="button"
                                className="wp-studio-hud-btn"
                                onClick={handleWpResetDefaults}
                                title="Varsayılan Ayarlara Dön"
                            >
                                <RotateCcw size={13} />
                                <span>Sıfırla</span>
                            </button>
                        </div>
                    </div>

                    {/* Matrix Scene Viewport Surface */}
                    <div 
                        className={`wp-studio-screen ${isWpDragging ? 'is-dragging' : ''}`}
                        ref={previewContainerRef}
                    >
                        {/* Film Frame Image */}
                        <img 
                            src="/system/matrix-preview.jpg" 
                            alt="Matrix Morpheus Sahnesi" 
                            className="wp-studio-screen-img"
                            draggable={false}
                        />

                        {/* Letterbox Vignette Shadows */}
                        <div className="wp-studio-vignette-overlay" />

                        {/* Guide Lines & Rule of Thirds */}
                        {wpGuidesVisible && (
                            <div className="wp-studio-guides-layer">
                                <div className="wp-guide-line horizontal one-third" />
                                <div className="wp-guide-line horizontal two-thirds" />
                                <div className="wp-guide-line vertical one-third" />
                                <div className="wp-guide-line vertical two-thirds" />
                                <div className="wp-guide-safe-area" />
                                <div className="wp-guide-reticle top-left">+</div>
                                <div className="wp-guide-reticle top-right">+</div>
                                <div className="wp-guide-reticle bottom-left">+</div>
                                <div className="wp-guide-reticle bottom-right">+</div>
                            </div>
                        )}

                        {/* Draggable Subtitle Element directly inside the preview */}
                        <div 
                            className={`wp-studio-sub-overlay ${isWpDragging ? 'dragging' : ''}`}
                            style={{ bottom: `${wpSubBottom}%` }}
                            onMouseDown={handlePreviewSubDragStart}
                            onTouchStart={handlePreviewSubDragStart}
                            title="Yukarı veya aşağı sürükleyerek dikey konumu ayarlayın"
                        >
                            <div className="wp-studio-sub-box">
                                <div className="wp-studio-sub-drag-tag">
                                    <MoveVertical size={10} />
                                    <span>↕ %{wpSubBottom} DİKEY KONUM (SÜRÜKLE)</span>
                                </div>
                                <div 
                                    className="wp-studio-sub-text"
                                    style={{
                                        fontSize: `calc(clamp(13px, 2.5cqw, 24px) * ${wpSubScale})`,
                                        color: wpSubColor,
                                        textShadow: getWpShadowStyle(wpSubShadow),
                                        backgroundColor: getWpBgStyle(wpSubBg),
                                        fontFamily: getWpFontFamily(wpSubFont),
                                        padding: wpSubBg !== 'none' ? '3px 12px' : '0',
                                        borderRadius: wpSubBg !== 'none' ? '6px' : '0',
                                        backdropFilter: wpSubBg === 'blur' ? 'blur(6px)' : 'none',
                                        WebkitBackdropFilter: wpSubBg === 'blur' ? 'blur(6px)' : 'none',
                                        lineHeight: 1.35
                                    }}
                                >
                                    {wpSampleText}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Hint */}
                        <div className="wp-studio-drag-tip">
                            <span>💡 İpucu: Altyazıyı doğrudan görsel üzerinden tutarak istediğiniz yüksekliğe sürükleyebilirsiniz.</span>
                        </div>
                    </div>

                    {/* Save confirmation toast */}
                    {wpSavedNotice && (
                        <div className="wp-studio-saved-banner">
                            <Check size={13} />
                            <span>Tüm canlı odalara ve birlikte izle seanslarına anında aktarıldı.</span>
                        </div>
                    )}
                </div>

                {/* PRO STUDIO CALIBRATION CONTROLS (AGGRESSIVE DARK PANELS) */}
                <div className="wp-studio-controls-grid">
                    {/* Panel 1: Dikey Yükseklik / Konum */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <MoveVertical size={13} />
                                Dikey Konum (Yükseklik)
                            </span>
                            <span className="wp-studio-val-badge">%{wpSubBottom}</span>
                        </div>
                        <div className="wp-studio-slider-wrapper">
                            <input 
                                type="range"
                                min="2"
                                max="85"
                                step="1"
                                value={wpSubBottom}
                                onChange={(e) => handleWpBottomChange(parseInt(e.target.value, 10))}
                                className="wp-studio-range"
                            />
                        </div>
                        <div className="wp-studio-pills-row">
                            {[
                                { label: 'Taban', val: 4 },
                                { label: 'Sinematik', val: 12 },
                                { label: 'Rahat', val: 22 },
                                { label: 'Orta', val: 45 },
                                { label: 'Üst', val: 75 }
                            ].map(p => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className={`wp-studio-pill-btn ${Math.abs(wpSubBottom - p.val) <= 2 ? 'active' : ''}`}
                                    onClick={() => handleWpBottomChange(p.val)}
                                >
                                    {p.label} %{p.val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel 2: Yazı Boyutu / Ölçekleme */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <Type size={13} />
                                Yazı Boyutu (Ölçek)
                            </span>
                            <span className="wp-studio-val-badge">%{Math.round(wpSubScale * 100)}</span>
                        </div>
                        <div className="wp-studio-slider-wrapper">
                            <input 
                                type="range"
                                min="0.6"
                                max="1.8"
                                step="0.05"
                                value={wpSubScale}
                                onChange={(e) => handleWpScaleChange(parseFloat(e.target.value))}
                                className="wp-studio-range"
                            />
                        </div>
                        <div className="wp-studio-pills-row">
                            {[
                                { label: 'Kompakt', scale: 0.8 },
                                { label: 'Normal', scale: 1.0 },
                                { label: 'Büyük', scale: 1.25 },
                                { label: 'Geniş', scale: 1.5 }
                            ].map(p => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className={`wp-studio-pill-btn ${Math.abs(wpSubScale - p.scale) < 0.05 ? 'active' : ''}`}
                                    onClick={() => handleWpScaleChange(p.scale)}
                                >
                                    {p.label} (%{Math.round(p.scale * 100)})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel 3: Metin Rengi */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <Sparkles size={13} />
                                Metin Rengi
                            </span>
                            <span className="wp-studio-val-badge" style={{ color: wpSubColor }}>{wpSubColor}</span>
                        </div>
                        <div className="wp-studio-colors-row">
                            {[
                                { name: 'Saf Beyaz', color: '#ffffff' },
                                { name: 'Sinematik Sarı', color: '#ffe600' },
                                { name: 'Neon Mavi', color: '#38bdf8' },
                                { name: 'Matrix Yeşili', color: '#4ade80' },
                                { name: 'Açık Turuncu', color: '#fb923c' }
                            ].map(c => (
                                <button
                                    key={c.color}
                                    type="button"
                                    className={`wp-studio-color-pill ${wpSubColor === c.color ? 'active' : ''}`}
                                    onClick={() => {
                                        setWpSubColor(c.color);
                                        triggerWpSync('watchPartySubColor', c.color);
                                    }}
                                >
                                    <span className="wp-color-swatch" style={{ background: c.color }} />
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel 4: Kontrast & Gölge */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <Sliders size={13} />
                                Kontrast & Gölge Profili
                            </span>
                        </div>
                        <div className="wp-studio-options-grid">
                            {[
                                { id: 'deep', label: 'Derin Sinematik (Gölge)', desc: 'Doğal sinema gölgesi' },
                                { id: 'strong', label: 'Ağır Kontur (360° Siyah)', desc: 'Keskin harf çerçevesi' },
                                { id: 'glow', label: 'Neon Parıltı (Matrix)', desc: 'Mat sinematik ışıltı' },
                                { id: 'clean', label: 'Temiz / Minimal', desc: 'Yumuşak hafif gölge' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`wp-studio-choice-btn ${wpSubShadow === opt.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setWpSubShadow(opt.id);
                                        triggerWpSync('watchPartySubShadow', opt.id);
                                    }}
                                >
                                    <span className="wp-choice-label">{opt.label}</span>
                                    <span className="wp-choice-sub">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel 5: Arka Plan Kutusu */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <Grid size={13} />
                                Arka Plan / Kutu
                            </span>
                        </div>
                        <div className="wp-studio-options-grid">
                            {[
                                { id: 'none', label: 'Şeffaf (Çerçevesiz)', desc: 'Saf sinema görüntüsü' },
                                { id: 'semi', label: 'Yarı Saydam (%65 Siyah)', desc: 'Göz yormayan koyu bar' },
                                { id: 'blur', label: 'Buzlu Cam (Frosted Glass)', desc: 'Modern cam efekti' },
                                { id: 'box', label: 'Tam Opak (%92 Siyah)', desc: 'Maksimum zıtlık' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`wp-studio-choice-btn ${wpSubBg === opt.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setWpSubBg(opt.id);
                                        triggerWpSync('watchPartySubBg', opt.id);
                                    }}
                                >
                                    <span className="wp-choice-label">{opt.label}</span>
                                    <span className="wp-choice-sub">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Panel 6: Tipografi & Örnek Metin */}
                    <div className="wp-studio-panel">
                        <div className="wp-studio-panel-header">
                            <span className="wp-studio-panel-title">
                                <Type size={13} />
                                Yazı Tipi & Test Metni
                            </span>
                        </div>
                        <div className="wp-studio-fonts-row">
                            {[
                                { id: 'sans', label: 'Modern Sans' },
                                { id: 'matrix', label: 'Konsol / Mono' },
                                { id: 'serif', label: 'Klasik Serif' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`wp-studio-pill-btn ${wpSubFont === f.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setWpSubFont(f.id);
                                        triggerWpSync('watchPartySubFont', f.id);
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="wp-studio-sample-input-wrap">
                            <span className="wp-studio-sample-label">Önizleme Cümlesi:</span>
                            <input 
                                type="text"
                                value={wpSampleText}
                                onChange={(e) => setWpSampleText(e.target.value)}
                                className="wp-studio-sample-input"
                                placeholder="Örnek altyazı cümlesi..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* VİDEO OYNATMA VE İNDİRME GENEL AYARLARI */}
            <div className="settings-group-container" style={{ marginTop: '32px' }}>
                <h3 className="settings-group-title">Video Oynatma Kalitesi</h3>
                <div className="settings-card">
                    <p className="settings-section-desc" style={{ marginBottom: '12px' }}>
                        Videolar oynatılırken varsayılan olarak hangi kalitede açılacağını seçin.
                    </p>
                    <div className="segmented-options-group">
                        {[
                            { value: 'auto', label: 'Otomatik (Önerilen)' },
                            { value: 'performance', label: 'Yüksek Performans' },
                            { value: 'saver', label: 'Veri Tasarrufu' },
                            { value: 'lowest', label: 'En Düşük (144p)' }
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`segment-btn ${(videoSettings.playbackQuality || 'auto') === opt.value ? 'active' : ''}`}
                                onClick={() => handleVideoSelectChange('playbackQuality', opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">Video İndirme Kalitesi</h3>
                <div className="settings-card">
                    <p className="settings-section-desc" style={{ marginBottom: '12px' }}>
                        Video indirmelerinde varsayılan kaliteyi seçin (Görseller ve GIF'ler orijinal kalitede inmeye devam eder).
                    </p>
                    <div className="segmented-options-group">
                        {[
                            { value: 'ask', label: 'Her Defasında Sor' },
                            { value: '1080', label: 'Orijinal (1080p)' },
                            { value: '720', label: 'Yüksek (720p)' },
                            { value: '360', label: 'Standart (360p)' }
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`segment-btn ${(videoSettings.downloadQuality || 'ask') === opt.value ? 'active' : ''}`}
                                onClick={() => handleVideoSelectChange('downloadQuality', opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings-group-container" style={{ marginTop: '24px' }}>
                <h3 className="settings-group-title">İndirilecek Video Biçimi</h3>
                <div className="settings-card">
                    <p className="settings-section-desc" style={{ marginBottom: '12px' }}>
                        Cihazınızın varsayılan galerisinde sorunsuz oynatma için <b>Evrensel MP4</b> önerilir.
                    </p>
                    <div className="segmented-options-group">
                        {[
                            { value: 'ask', label: 'Her Defasında Sor' },
                            { value: 'mp4', label: 'Evrensel MP4 (Önerilen)' },
                            { value: 'original', label: 'Orijinal Ham Biçim' }
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`segment-btn ${(videoSettings.downloadFormat || 'ask') === opt.value ? 'active' : ''}`}
                                onClick={() => handleVideoSelectChange('downloadFormat', opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
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
        <div className="app-wrapper full-height settings-page-wrapper glass-redesign" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Navbar />

            <div className="discord-split-view" style={{ flex: 1, minHeight: 0 }}>
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
