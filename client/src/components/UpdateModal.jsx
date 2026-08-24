import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './UpdateModal.css';

import { App as CapacitorApp } from '@capacitor/app';

// Fallback APK version
const CURRENT_VERSION = '2.0.4';

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
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadCompleted, setDownloadCompleted] = useState(false);
    const progressListenerRef = useRef(null);

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
        return () => {
            clearTimeout(timer);
            if (progressListenerRef.current) {
                progressListenerRef.current.remove?.();
            }
        };
    }, []);

    const handleDownload = async () => {
        const downloadUrl = info?.downloadUrl || 'https://oxypace.com.tr/downloads/oxypace.apk';

        setDownloading(true);
        setProgress(0);
        setDownloadCompleted(false);

        if (Capacitor.isNativePlatform()) {
            try {
                const { registerPlugin } = await import('@capacitor/core');
                const Downloader = registerPlugin('Downloader');

                if (progressListenerRef.current) {
                    progressListenerRef.current.remove?.();
                }

                // Add listener to track live progress from native Downloader
                progressListenerRef.current = await Downloader.addListener('downloadProgress', (data) => {
                    if (data && typeof data.percentage === 'number') {
                        setProgress(data.percentage);
                        if (data.percentage >= 100) {
                            setDownloadCompleted(true);
                            setDownloading(false);
                        }
                    }
                });

                await Downloader.downloadFile({
                    url: downloadUrl,
                    filename: 'oxypace.apk'
                });

            } catch (err) {
                console.error('Native download error, opening system browser:', err);
                window.open(downloadUrl, '_system');
                setDownloading(false);
            }
        } else {
            window.open(downloadUrl, '_system');
            setDownloading(false);
        }
    };

    const handleManualInstall = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const { registerPlugin } = await import('@capacitor/core');
                const Downloader = registerPlugin('Downloader');
                await Downloader.installExistingApk({ filename: 'oxypace.apk' });
            } catch (e) {
                console.error('Manual install trigger failed:', e);
            }
        }
    };

    const handleOpenInChrome = () => {
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
                        {downloadCompleted ? 'Güncelleme Hazır' : 'Zorunlu Güncelleme'}
                    </h2>
                    <p className="update-modal-version">
                        Sürüm {CURRENT_VERSION} → <span className="version-new">{info?.latestVersion || '1.9.8'}</span>
                    </p>
                </div>

                {!downloading && !downloadCompleted && info?.changelog && (
                    <div className="update-modal-changelog">
                        {info.changelog}
                    </div>
                )}

                {downloading && (
                    <div className="update-progress-box">
                        <div className="update-progress-info">
                            <span>İndiriliyor...</span>
                            <span className="update-progress-percent">%{progress}</span>
                        </div>
                        <div className="update-progress-track">
                            <div 
                                className="update-progress-fill" 
                                style={{ width: `${Math.max(4, progress)}%` }}
                            />
                        </div>
                        <p className="update-status-hint">
                            İndirme işlemi bildirim çubuğunuzda da ilerlemektedir. Tamamlandığında yükleme penceresi otomatik açılacaktır.
                        </p>
                    </div>
                )}

                {downloadCompleted && (
                    <div className="update-progress-box">
                        <p className="update-status-hint" style={{ color: '#e0e0e0' }}>
                            Yükleme penceresi açılmadıysa aşağıdaki butona dokunarak güncellemeyi başlatabilirsiniz.
                        </p>
                    </div>
                )}

                <div className="update-modal-actions">
                    {!downloading && !downloadCompleted && (
                        <button 
                            className="update-btn-download" 
                            onClick={handleDownload}
                        >
                            Şimdi Güncelle
                        </button>
                    )}

                    {downloadCompleted && (
                        <button 
                            className="update-btn-install" 
                            onClick={handleManualInstall}
                        >
                            Yüklemeyi Başlat
                        </button>
                    )}
                </div>

                {/* Alternative Direct Chrome Download URL Link */}
                <div className="update-alt-browser-box">
                    <span className="update-alt-label">Alternatif Doğrudan İndirme Bağlantısı:</span>
                    <a 
                        href={downloadUrl}
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpenInChrome();
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


