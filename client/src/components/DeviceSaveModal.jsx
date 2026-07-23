import { useState } from 'react';
import axios from 'axios';
import { Smartphone, X } from 'lucide-react';
import { getOrCreateDeviceId, getDeviceName } from '../utils/device';
import { useAuth } from '../context/AuthContext';

const DeviceSaveModal = ({ user }) => {
    const { updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceName();

    // Check if device is already saved in user's trustedDevices array
    const isSaved = user?.trustedDevices?.some(d => d.deviceId === deviceId);

    // Check if user dismissed prompt during this session
    const isSessionDismissed = sessionStorage.getItem(`device_save_dismissed_${user?._id}_${deviceId}`) === 'true';

    if (!user || isSaved || dismissed || isSessionDismissed) {
        return null;
    }

    const handleSaveDevice = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/trust-device', {
                deviceId,
                deviceName
            });

            if (response.data?.trustedDevices) {
                updateUser({
                    ...user,
                    trustedDevices: response.data.trustedDevices
                });
            }
        } catch (err) {
            console.error('Save device error:', err);
            alert('Cihaz kaydedilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (user?._id) {
            sessionStorage.setItem(`device_save_dismissed_${user._id}_${deviceId}`, 'true');
        }
        setDismissed(true);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }}>
            <div style={{
                background: '#18191c',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '28px',
                maxWidth: '420px',
                width: '90%',
                color: '#fff',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                <button
                    onClick={handleSkip}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(102, 126, 234, 0.15)',
                    border: '1px solid rgba(102, 126, 234, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto',
                    color: '#667eea'
                }}>
                    <Smartphone size={30} />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>
                    Cihaz Kaydedilsin mi?
                </h3>

                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', marginBottom: '24px' }}>
                    Bu cihazı (<b>{deviceName}</b>) hesabınız için kaydetmek ister misiniz? Kaydedilen cihazlardan yapılan sonraki girişlerde güvenlik bildirimi gönderilmez.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={handleSkip}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        Şimdi Değil
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDevice}
                        disabled={loading}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        {loading ? 'Kaydediliyor...' : 'Cihazı Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceSaveModal;
