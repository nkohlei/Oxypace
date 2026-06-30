import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './UpdateModal.css';

// Current APK version — update this string with each release
const CURRENT_VERSION = '1.0.8';

/**
 * Compares two semver strings. Returns true if remote > local.
 */
const isNewerVersion = (remote, local) => {
    const parse = (v) => (v || '0.0.0').split('.').map(Number);
    const [rMaj, rMin, rPatch] = parse(remote);
    const [lMaj, lMin, lPatch] = parse(local);
    if (rMaj !== lMaj) return rMaj > lMaj;
    if (rMin !== lMin) return rMin > lMin;
    return rPatch > lPatch;
};

const UpdateModal = () => {
    const [show, setShow] = useState(false);
    const [info, setInfo] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Only run on native Android app
        if (!Capacitor.isNativePlatform()) return;

        // Don't re-check within the same session if already dismissed
        const dismissedKey = `update_dismissed_${CURRENT_VERSION}`;
        if (sessionStorage.getItem(dismissedKey)) return;

        const checkVersion = async () => {
            try {
                const { data } = await axios.get('/api/app/version');
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
        const timer = setTimeout(checkVersion, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        const dismissedKey = `update_dismissed_${CURRENT_VERSION}`;
        sessionStorage.setItem(dismissedKey, '1');
        setShow(false);
        setDismissed(true);
    };

    const handleDownload = () => {
        if (info?.downloadUrl) {
            // Use window.location.href so Android shouldOverrideUrlLoading opens Chrome
            window.open(info.downloadUrl, '_system');
        }
    };

    if (!show || dismissed) return null;

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal-icon">🚀</div>
                <h2 className="update-modal-title">Yeni Sürüm Mevcut!</h2>
                <p className="update-modal-version">
                    Mevcut: <span className="version-old">{CURRENT_VERSION}</span>
                    {' → '}
                    <span className="version-new">{info?.latestVersion}</span>
                </p>
                {info?.changelog && (
                    <p className="update-modal-changelog">{info.changelog}</p>
                )}
                <div className="update-modal-actions">
                    <button className="update-btn-download" onClick={handleDownload}>
                        ⬇️ Şimdi Güncelle
                    </button>
                    <button className="update-btn-later" onClick={handleDismiss}>
                        Daha Sonra
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
