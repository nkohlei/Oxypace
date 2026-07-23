import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { downloadFile } from '../utils/downloadHelper';
import './UpdateModal.css';

// Current APK version — updated for release 1.1.7
const CURRENT_VERSION = '1.1.7';

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
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Only run on native Android app
        if (!Capacitor.isNativePlatform()) return;

        const checkVersion = async () => {
            try {
                const { data } = await axios.get('/api/app/version');
                if (isNewerVersion(data.latestVersion, CURRENT_VERSION) || data.forceUpdate) {
                    setInfo(data);
                    setShow(true);
                }
            } catch (err) {
                console.warn('[UpdateModal] Version check failed:', err.message);
            }
        };

        const timer = setTimeout(checkVersion, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        const apkUrl = info?.downloadUrl || 'https://oxypace.com.tr/downloads/oxypace.apk';
        const targetFilename = `oxypace_v${info?.latestVersion || '1.1.7'}.apk`;

        try {
            await downloadFile(apkUrl, targetFilename);
        } catch (err) {
            console.error('Update download error:', err);
        }
    };

    if (!show) return null;

    return (
        <div className="update-modal-overlay">
            <div className="update-modal">
                <div className="update-modal-icon">🚀</div>
                <h2 className="update-modal-title">Zorunlu Güncelleme Mevcut</h2>
                <p className="update-modal-subtitle">
                    Oxypace platformunu kullanmaya devam etmek için lütfen yeni sürümü yükleyin.
                </p>
                <div className="update-modal-version-box">
                    <span>Mevcut: <strong>{CURRENT_VERSION}</strong></span>
                    <span className="version-arrow">→</span>
                    <span>Yeni Sürüm: <strong>{info?.latestVersion || '1.1.7'}</strong></span>
                </div>
                {info?.changelog && (
                    <div className="update-modal-changelog">
                        <p>{info.changelog}</p>
                    </div>
                )}
                <div className="update-modal-actions">
                    <button 
                        className="update-btn-download" 
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? '⚡ İndirme Başlatıldı...' : `⬇️ Sürüm ${info?.latestVersion || '1.1.7'} İndir ve Yükle`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
