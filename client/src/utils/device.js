export const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('oxypace_device_id');
    if (!deviceId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            deviceId = 'dev_' + crypto.randomUUID();
        } else {
            deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        }
        localStorage.setItem('oxypace_device_id', deviceId);
    }
    return deviceId;
};

export const getDeviceName = () => {
    const ua = navigator.userAgent || '';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Electron')) browser = 'Desktop App';

    if (window.desktopAPI && window.desktopAPI.isElectron) {
        browser = 'Desktop App';
    }

    return `${browser} (${os})`;
};
