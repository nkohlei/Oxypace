import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './UpdateModal.css';

import { App as CapacitorApp } from '@capacitor/app';

// Fallback APK version (used only if CapacitorApp.getInfo() fails)
const CURRENT_VERSION = '2.4.6';
const CURRENT_VERSION_CODE = 246;

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

    useEffect(() => {
        // Only run on native Android app
        if (!Capacitor.isNativePlatform()) return;

        const checkVersion = async () => {
            try {
                let localVer = CURRENT_VERSION;
                try {
                    const appInfo = await CapacitorApp.getInfo();
                    if (appInfo?.version) {
                        localVer = appInfo.version;
                    }
                } catch (e) {
                    console.warn('[UpdateModal] Could not get native app info, using fallback:', e);
                }

                const { data } = await axios.get('/api/app/version');
                if (isNewerVersion(data?.latestVersion, localVer)) {
                    setInfo(data);
                    setShow(true);
                }
            } catch (err) {
                console.warn('[UpdateModal] Version check error:', err.message);
            }
        };

        const timer = setTimeout(checkVersion, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleDownload = () => {
        const downloadUrl = info?.downloadUrl || 'https://oxypace.com.tr/downloads/oxypace.apk';
        window.open(downloadUrl, '_system');
    };

    if (!show) return null;

    const downloadUrl = info?.downloadUrl || 'https://oxypace.com.tr/downloads/oxypace.apk';

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal-header">
                    <h2 className="update-modal-title">
                        Yeni Güncelleme Mevcut
                    </h2>
                    <p className="update-modal-version">
                        Sürüm {CURRENT_VERSION} → <span className="version-new">{info?.latestVersion || '2.4.6'}</span>
                    </p>
                </div>

                {info?.changelog && (
                    <div className="update-modal-changelog">
                        {info.changelog}
                    </div>
                )}

                <div className="update-modal-actions">
                    <button 
                        className="update-btn-download" 
                        onClick={handleDownload}
                    >
                        Şimdi Güncelle
                    </button>
                </div>

                {/* Alternative Direct Chrome Download URL Link */}
                <div className="update-alt-browser-box">
                    <span className="update-alt-label">Alternatif Doğrudan İndirme Bağlantısı:</span>
                    <a 
                        href={downloadUrl}
                        onClick={(e) => {
                            e.preventDefault();
                            handleDownload();
                        }}
                        className="update-alt-link"
                    >
                        {downloadUrl}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
