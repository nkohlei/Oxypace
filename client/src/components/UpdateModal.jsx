import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import './UpdateModal.css';

// Current APK version — set to 1.9.8 as requested by user
const CURRENT_VERSION = '1.9.9';

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
    const [progress, setProgress] = useState(0);
    const [downloadCompleted, setDownloadCompleted] = useState(false);
    const progressListenerRef = useRef(null);

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
        const timer = setTimeout(checkVersion, 2000);
        return () => {
            clearTimeout(timer);
            if (progressListenerRef.current) {
                progressListenerRef.current.remove?.();
            }
        };
    }, []);

    const handleDismiss = () => {
        if (info?.forceUpdate || downloading) return; // Cannot dismiss during download or if force update
        const dismissedKey = `update_dismissed_${info?.latestVersion || CURRENT_VERSION}`;
        sessionStorage.setItem(dismissedKey, '1');
        setShow(false);
        setDismissed(true);
    };

    const handleDownload = async () => {
        if (!info?.downloadUrl) return;

        setDownloading(true);
        setProgress(0);
        setDownloadCompleted(false);

        if (Capacitor.isNativePlatform()) {
            try {
                const { registerPlugin } = await import('@capacitor/core');
                const Downloader = registerPlugin('Downloader');

                // Remove existing listener if any
                if (progressListenerRef.current) {
                    progressListenerRef.current.remove?.();
                }

                // Add listener to track live progress from Android DownloadManager
                progressListenerRef.current = await Downloader.addListener('downloadProgress', (data) => {
                    if (data && typeof data.percentage === 'number') {
                        setProgress(data.percentage);
                        if (data.percentage >= 100) {
                            setDownloadCompleted(true);
                            setDownloading(false);
                        }
                    }
                });

                // Trigger the download in Android system DownloadManager
                await Downloader.downloadFile({
                    url: info.downloadUrl,
                    filename: 'oxypace.apk'
                });

            } catch (err) {
                console.error('Native download failed, falling back to browser:', err);
                window.open(info.downloadUrl, '_system');
                setDownloading(false);
            }
        } else {
            window.open(info.downloadUrl, '_system');
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

    if (!show || (dismissed && !info?.forceUpdate)) return null;

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal-icon">{downloadCompleted ? '✅' : '🚀'}</div>
                <h2 className="update-modal-title">
                    {downloadCompleted 
                        ? 'İndirme Tamamlandı!' 
                        : (info?.forceUpdate ? 'Zorunlu Güncelleme' : 'Yeni Sürüm Mevcut!')}
                </h2>
                <p className="update-modal-version">
                    Mevcut: <span className="version-old">{CURRENT_VERSION}</span>
                    {' → '}
                    <span className="version-new">{info?.latestVersion}</span>
                </p>

                {!downloading && !downloadCompleted && info?.changelog && (
                    <p className="update-modal-changelog">{info.changelog}</p>
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
                                style={{ width: `${Math.max(5, progress)}%` }}
                            />
                        </div>
                        <p className="update-status-hint">
                            İndirme cihazınızın bildirim çubuğunda da takip edilebilir. Tamamlandığında kurulum penceresi otomatik açılacaktır.
                        </p>
                    </div>
                )}

                {downloadCompleted && (
                    <div className="update-progress-box">
                        <p className="update-status-hint" style={{ color: '#34d399', fontWeight: '600' }}>
                            Kurulum penceresi açılmadıysa aşağıdaki butona dokunarak güncellemeyi hemen yükleyebilirsiniz.
                        </p>
                    </div>
                )}

                <div className="update-modal-actions">
                    {!downloading && !downloadCompleted && (
                        <button 
                            className="update-btn-download" 
                            onClick={handleDownload}
                        >
                            ⬇️ Şimdi Güncelle
                        </button>
                    )}

                    {downloadCompleted && (
                        <button 
                            className="update-btn-install" 
                            onClick={handleManualInstall}
                        >
                            📦 Şimdi Yükle
                        </button>
                    )}

                    {!info?.forceUpdate && !downloading && (
                        <button className="update-btn-later" onClick={handleDismiss}>
                            {downloadCompleted ? 'Kapat' : 'Daha Sonra'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;

