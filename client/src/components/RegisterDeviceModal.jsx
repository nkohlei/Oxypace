import { useState } from 'react';
import axios from 'axios';
import './RegisterDeviceModal.css';

const RegisterDeviceModal = ({ isOpen, onClose, deviceId, deviceName, deviceType, token, onRegistered }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleRegister = async () => {
        if (!deviceId) {
            setError('Cihaz kimliği alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await axios.post('/api/users/devices/save', {
                deviceId,
                deviceName: deviceName || 'Bu Cihaz',
                deviceType: deviceType || 'web',
            }, { headers });

            if (onRegistered) onRegistered();
            onClose();
        } catch (err) {
            console.error('Device registration failed:', err);
            setError(err.response?.data?.message || 'Cihaz kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const deviceTypeLabel =
        deviceType === 'desktop' ? 'Masaüstü Uygulaması' :
        deviceType === 'mobile' ? 'Mobil Cihaz' :
        'Web Tarayıcısı';

    return (
        <div className="rdm-overlay" onClick={handleSkip}>
            <div className="rdm-card animation-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Icon — SVG shield, no emoji */}
                <div className="rdm-icon-wrap">
                    <svg className="rdm-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12L11 14L15 10"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <h2 className="rdm-title">Bu Cihazı Kaydet</h2>
                <p className="rdm-desc">
                    Bu cihazı güvenli cihazlar listenize eklemek ister misiniz? Sonraki girişlerinizde güvenlik uyarısı almadan erişebilirsiniz.
                </p>

                <div className="rdm-device-info">
                    <span className="rdm-device-type">{deviceTypeLabel}</span>
                    {deviceName && <span className="rdm-device-name">{deviceName}</span>}
                </div>

                {error && <p className="rdm-error">{error}</p>}

                <div className="rdm-footer">
                    <button className="rdm-btn-secondary" onClick={handleSkip} disabled={loading}>
                        Şimdi Değil
                    </button>
                    <button className="rdm-btn-primary" onClick={handleRegister} disabled={loading}>
                        {loading ? 'Kaydediliyor…' : 'Cihazı Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterDeviceModal;
