import { useState } from 'react';
import axios from 'axios';
import './RegisterDeviceModal.css';

const RegisterDeviceModal = ({ isOpen, onClose, deviceId, deviceName, deviceType, onRegistered }) => {
    const [loading, setLoading] = useState(false);
    const [customName, setCustomName] = useState(deviceName || 'Bu Cihaz');

    if (!isOpen) return null;

    const handleRegister = async () => {
        setLoading(true);
        try {
            await axios.post('/api/users/devices/save', {
                deviceId,
                deviceName: customName || deviceName || 'Kayıtlı Cihaz',
                deviceType: deviceType || 'web',
            });
            // Mark as opted out so modal won't show again for this session
            sessionStorage.setItem('oxypace_device_prompt_handled', 'true');
            if (onRegistered) onRegistered();
            onClose();
        } catch (err) {
            console.error('Device registration failed:', err);
            alert('Cihaz kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // Remember decision for this session (until logout/re-login)
        sessionStorage.setItem('oxypace_device_prompt_handled', 'true');
        onClose();
    };

    return (
        <div className="device-modal-overlay" onClick={handleSkip}>
            <div className="device-modal-card animation-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="device-modal-header">
                    <div className="device-modal-icon">
                        🛡️
                    </div>
                    <h2>Bu Cihazı Kaydetmek İster Mısınız?</h2>
                    <p>
                        Bu cihazı <strong>Kayıtlı Cihazlar</strong> listenize ekleyerek daha sonraki girişlerinizde güvenlik uyarısı almadan hızlıca erişebilirsiniz.
                    </p>
                </div>

                <div className="device-modal-body">
                    <label className="device-input-label">Cihaz İsmi (İsteğe Bağlı)</label>
                    <input
                        type="text"
                        className="device-modal-input"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Örn: Evdeki Bilgisayarım, Telefonum"
                    />
                    <div className="device-type-badge">
                        <span>Tür:</span> <strong>{deviceType === 'desktop' ? 'Masaüstü Uygulaması' : deviceType === 'mobile' ? 'Mobil Cihaz' : 'Web Tarayıcı'}</strong>
                    </div>
                </div>

                <div className="device-modal-footer">
                    <button
                        className="device-btn-secondary"
                        onClick={handleSkip}
                        disabled={loading}
                    >
                        Şimdilik İstemiyorum
                    </button>
                    <button
                        className="device-btn-primary"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? 'Kaydediliyor...' : 'Evet, Cihazı Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterDeviceModal;
