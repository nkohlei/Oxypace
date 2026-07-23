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
    let os = 'Bilinmeyen İŞ';
    let browser = 'Tarayıcı';

    // Detailed OS Detection
    if (ua.includes('Win')) {
        os = 'Windows';
    } else if (ua.includes('iPhone')) {
        os = 'iPhone';
    } else if (ua.includes('iPad')) {
        os = 'iPad';
    } else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
        os = 'macOS';
    } else if (ua.includes('Android')) {
        os = 'Android';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    }

    // Platform Override Check (Capacitor Native / Electron App)
    const isCapacitorNative = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const isElectron = (typeof window !== 'undefined' && window.desktopAPI && window.desktopAPI.isElectron) || ua.includes('Electron');

    if (isElectron) {
        browser = 'Masaüstü Uygulaması';
    } else if (isCapacitorNative) {
        browser = 'Mobil Uygulama';
    } else if (ua.includes('Edg/')) {
        browser = 'Microsoft Edge';
    } else if (ua.includes('OPR/') || ua.includes('Opera')) {
        browser = 'Opera';
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/')) {
        browser = 'Google Chrome';
    } else if (ua.includes('Firefox/')) {
        browser = 'Mozilla Firefox';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        browser = 'Safari';
    } else if (ua.includes('SamsungBrowser')) {
        browser = 'Samsung Internet';
    }

    return `${browser} - ${os}`;
};
