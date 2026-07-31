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

            // Mark as handled so modal won't show again for this session
            sessionStorage.setItem('oxypace_device_prompt_handled', 'true');
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
        sessionStorage.setItem('oxypace_device_prompt_handled', 'true');
        onClose();
    };

    const deviceTypeLabel =
        deviceType === 'desktop' ? 'Masaüstü Uygulaması' :
        deviceType === 'mobile' ? 'Mobil Cihaz' :
        'Web Tarayıcısı';

    return (
        <div className="rdm-overlay" onClick={handleSkip}>
            <div className="rdm-card animation-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="rdm-icon">🛡️</div>
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
