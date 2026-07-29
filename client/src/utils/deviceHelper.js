import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Returns a unique device identifier and description.
 * Generates a persistent UUID stored in localStorage if not on a native platform.
 */
export const getDeviceInfo = async () => {
    let deviceId = localStorage.getItem('oxypace_device_id');
    let deviceName = 'Web Tarayıcı';
    let deviceType = 'web';

    const isNative = typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : (window.Capacitor && window.Capacitor.isNativePlatform());
    const isElectron = !!(window.desktopAPI && window.desktopAPI.isElectron);

    try {
        if (isNative) {
            const info = await Device.getId();
            const details = await Device.getInfo();
            if (info && info.identifier) {
                deviceId = info.identifier;
            }
            deviceType = details.platform || (Capacitor.getPlatform ? Capacitor.getPlatform() : 'mobile');
            deviceName = `${details.manufacturer || ''} ${details.model || 'Mobil Cihaz'}`.trim();
        } else if (isElectron) {
            deviceType = 'desktop';
            deviceName = 'Masaüstü Uygulaması';
        } else {
            // Web browser info
            const userAgent = navigator.userAgent || '';
            if (userAgent.includes('Windows')) deviceName = 'Windows Bilgisayar';
            else if (userAgent.includes('Macintosh')) deviceName = 'Mac Bilgisayar';
            else if (userAgent.includes('Linux')) deviceName = 'Linux Bilgisayar';
            else if (userAgent.includes('Android')) deviceName = 'Android Tarayıcı';
            else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceName = 'iOS Tarayıcı';
        }
    } catch (e) {
        console.warn('Could not fetch native device details, falling back to persistent ID:', e);
    }

    if (!deviceId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            deviceId = crypto.randomUUID();
        } else {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        }
        localStorage.setItem('oxypace_device_id', deviceId);
    }

    return {
        deviceId,
        deviceName,
        deviceType
    };
};
