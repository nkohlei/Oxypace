import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './UpdateModal.css';

// Current APK version — update this string with each release
const CURRENT_VERSION = '1.9.8';

/**
 * Compares two semver strings. Returns true if remote > local.
 */
const isNewerVersion = (remote, local) => {
    const parse = (v) => (v || '0.0.0').split('.').map(Number);
    const [rMaj = 0, rMin = 0, rPatch = 0] = parse(remote);
    const [lMaj = 0, lMin = 0, lPatch = 0] = parse(local);
    if (rMaj !== lMaj) return rMaj > lMaj;
    if (rMin !== lMin) return rMin > lMin;
    return rPatch > lPatch;
};

const UpdateModal = () => {
    const [show, setShow] = useState(false);
    const [info, setInfo] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Only run on native Android app
        if (!Capacitor.isNativePlatform()) return;

        const checkVersion = async () => {
            try {
                const { data } = await axios.get('/api/app/version');
                const isForce = !!data?.forceUpdate;
                const dismissedKey = `update_dismissed_${data?.latestVersion || CURRENT_VERSION}`;

                // If not forced and already dismissed in this session, skip
                if (!isForce && sessionStorage.getItem(dismissedKey)) return;

                if (isNewerVersion(data.latestVersion, CURRENT_VERSION)) {
                    setInfo(data);
                    setShow(true);
                }
            } catch (err) {
                // Silently fail — no update check if offline
                console.warn('[UpdateModal] Version check failed:', err.message);
            }
        };

        // Delay check slightly so app feels snappy on startup
        const timer = setTimeout(checkVersion, 2500);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        if (info?.forceUpdate) return; // Cannot dismiss force update
        const dismissedKey = `update_dismissed_${info?.latestVersion || CURRENT_VERSION}`;
        sessionStorage.setItem(dismissedKey, '1');
        setShow(false);
        setDismissed(true);
    };

    const handleDownload = async () => {
        if (info?.downloadUrl) {
            setDownloading(true);
            if (Capacitor.isNativePlatform()) {
                try {
                    // Call the custom native DownloaderPlugin registered on MainActivity
                    const { registerPlugin } = await import('@capacitor/core');
                    const Downloader = registerPlugin('Downloader');
                    await Downloader.downloadFile({
                        url: info.downloadUrl,
                        filename: 'oxypace.apk'
                    });
                    if (!info?.forceUpdate) {
                        setShow(false);
                        setDismissed(true);
                    }
                } catch (err) {
                    console.error('Native download failed, falling back to browser:', err);
                    window.open(info.downloadUrl, '_system');
                    if (!info?.forceUpdate) {
                        setShow(false);
                        setDismissed(true);
                    }
                } finally {
                    setDownloading(false);
                }
            } else {
                window.open(info.downloadUrl, '_system');
                setDownloading(false);
            }
        }
    };

    if (!show || (dismissed && !info?.forceUpdate)) return null;

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal-icon">🚀</div>
                <h2 className="update-modal-title">
                    {info?.forceUpdate ? 'Zorunlu Güncelleme' : 'Yeni Sürüm Mevcut!'}
                </h2>
                <p className="update-modal-version">
                    Mevcut: <span className="version-old">{CURRENT_VERSION}</span>
                    {' → '}
                    <span className="version-new">{info?.latestVersion}</span>
                </p>
                {info?.changelog && (
                    <p className="update-modal-changelog">{info.changelog}</p>
                )}
                <div className="update-modal-actions">
                    <button 
                        className="update-btn-download" 
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? '⏳ İndiriliyor ve Başlatılıyor...' : '⬇️ Şimdi Güncelle'}
                    </button>
                    {!info?.forceUpdate && (
                        <button className="update-btn-later" onClick={handleDismiss}>
                            Daha Sonra
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
