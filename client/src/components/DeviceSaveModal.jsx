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
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }}>
            <div style={{
                background: 'rgba(18, 18, 22, 0.78)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '32px 28px',
                maxWidth: '420px',
                width: '90%',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative'
            }}>
                <button
                    onClick={handleSkip}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        right: '18px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <X size={16} />
                </button>

                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    color: '#ffffff',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
                }}>
                    <Smartphone size={28} strokeWidth={1.8} />
                </div>

                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                    marginBottom: '10px',
                    color: '#ffffff'
                }}>
                    Cihaz Kaydedilsin mi?
                </h3>

                <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: '1.6',
                    marginBottom: '28px',
                    fontWeight: '400'
                }}>
                    Bu cihazı (<b style={{ color: '#ffffff', fontWeight: '600' }}>{deviceName}</b>) hesabınız için kaydetmek ister misiniz? Kaydedilen cihazlardan yapılan sonraki girişlerde güvenlik bildirimi gönderilmez.
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={handleSkip}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '13px',
                            color: 'rgba(255, 255, 255, 0.85)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
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
                            background: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '13px',
                            color: '#0a0a0c',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)',
                            transition: 'all 0.2s ease'
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
