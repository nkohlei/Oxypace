import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import axios from 'axios';

const Downloader = registerPlugin('Downloader');

/**
 * Adaptive Smooth Progress Counter
 * Ensures progress numbers increment strictly 1% by 1% (1, 2, 3... 100).
 * Dynamically adjusts interval speed (fast download = tiny delay per step, slow download = larger delay per step).
 */
export class AdaptiveProgressCounter {
    constructor(onStep, onComplete) {
        this.current = 0;
        this.target = 0;
        this.onStep = onStep;
        this.onComplete = onComplete;
        this.timer = null;
        this.isFinished = false;
    }

    setTarget(targetPercent) {
        const rounded = Math.min(100, Math.max(this.current, Math.round(targetPercent)));
        if (rounded > this.target) {
            this.target = rounded;
        }
        if (!this.timer) {
            this.step();
        }
    }

    step = () => {
        if (this.current < this.target) {
            this.current += 1;
            if (this.onStep) this.onStep(this.current);

            if (this.current >= 100) {
                if (this.onComplete) this.onComplete();
                this.timer = null;
                return;
            }

            // Calculate adaptive step delay based on distance to actual target
            const distance = this.target - this.current;
            let delay = 30;
            if (distance > 25) {
                delay = 6;   // Super fast (6ms per 1%)
            } else if (distance > 15) {
                delay = 12;  // Fast (12ms per 1%)
            } else if (distance > 8) {
                delay = 24;  // Medium-fast (24ms per 1%)
            } else if (distance > 3) {
                delay = 45;  // Medium (45ms per 1%)
            } else {
                delay = 75;  // Gentle pacing (75ms per 1%)
            }

            this.timer = setTimeout(this.step, delay);
        } else if (this.current < 100 && !this.isFinished) {
            // Trickle smoothly by 1% while waiting for next download progress event
            const trickleLimit = Math.min(99, this.target + 2);
            if (this.current < trickleLimit) {
                this.current += 1;
                if (this.onStep) this.onStep(this.current);
                this.timer = setTimeout(this.step, 150);
            } else {
                this.timer = setTimeout(this.step, 100);
            }
        } else if (this.current < 100 && this.isFinished) {
            // Download completed; finish remaining steps 1-by-1 to 100%
            this.current += 1;
            if (this.onStep) this.onStep(this.current);

            if (this.current >= 100) {
                if (this.onComplete) this.onComplete();
                this.timer = null;
            } else {
                this.timer = setTimeout(this.step, 15);
            }
        } else {
            if (this.current >= 100 && this.onComplete) {
                this.onComplete();
            }
            this.timer = null;
        }
    };

    finish() {
        this.isFinished = true;
        this.target = 100;
        if (!this.timer) {
            this.step();
        }
    }
}

/**
 * Creates live glassmorphic download progress toast UI at top of screen
 */

const createDownloadProgressToast = (filename) => {
    const existing = document.getElementById('oxypace-download-toast');
    if (existing && document.body.contains(existing)) {
        document.body.removeChild(existing);
    }

    const toast = document.createElement('div');
    toast.id = 'oxypace-download-toast';
    toast.className = 'top-download-toast-modern';

    toast.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px; overflow:hidden; max-width:75%;">
                <span style="font-size:16px;">📥</span>
                <span id="dl-filename" style="font-weight:600; font-size:13px; color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${filename}</span>
            </div>
            <span id="dl-percent" style="font-family:monospace; font-weight:700; font-size:13px; color:#38bdf8;">%0</span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:6px; overflow:hidden; position:relative;">
            <div id="dl-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #0ea5e9, #38bdf8); border-radius:6px; transition:width 0.05s linear;"></div>
        </div>
        <div id="dl-status" style="font-size:11px; color:#94a3b8; margin-top:6px; text-align:left;">İndirme başlatılıyor...</div>
    `;

    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-120px)',
        background: 'rgba(15, 23, 42, 0.92)',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '420px',
        zIndex: '999999',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(14,165,233,0.15)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        opacity: '0'
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });

    const percentEl = toast.querySelector('#dl-percent');
    const barEl = toast.querySelector('#dl-bar');
    const statusEl = toast.querySelector('#dl-status');

    return {
        updateProgress: (percent) => {
            if (percentEl) percentEl.innerText = `%${percent}`;
            if (barEl) barEl.style.width = `${percent}%`;
            if (statusEl && percent < 100) {
                statusEl.innerText = `İndiriliyor... (%${percent})`;
            }
        },
        completeProgress: () => {
            if (percentEl) percentEl.innerText = `%100`;
            if (barEl) {
                barEl.style.width = `100%`;
                barEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            }
            if (statusEl) statusEl.innerText = `🎉 İndirme başarıyla tamamlandı!`;

            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-120px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 400);
            }, 1800);
        },
        errorProgress: (msg) => {
            if (statusEl) statusEl.innerText = `❌ ${msg || 'İndirme başarısız'}`;
            if (barEl) barEl.style.background = '#ef4444';
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-120px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 400);
            }, 2500);
        }
    };
};

/**
 * Downloads a file on web or native platforms.
 * Shows an adaptive step-by-step 1% to 100% live progress bar toast overlay.
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The name of the file to save as
 */
export const downloadFile = async (url, filename) => {
    let progressToast = null;
    try {
        if (!filename) {
            filename = url.split('/').pop() || `oxypace-${Date.now()}`;
        }

        progressToast = createDownloadProgressToast(filename);

        const counter = new AdaptiveProgressCounter(
            (percent) => progressToast.updateProgress(percent),
            () => progressToast.completeProgress()
        );

        if (Capacitor.isNativePlatform()) {
            const notifId = Math.floor(Math.random() * 1000000);
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'Dosya İndiriliyor',
                            body: `${filename} indiriliyor...`,
                            id: notifId
                        }
                    ]
                });
            } catch (err) {}

            try {
                const response = await fetch(url);
                const reader = response.body.getReader();
                const contentLength = +response.headers.get('Content-Length') || 0;
                let receivedLength = 0;
                let chunks = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    receivedLength += value.length;
                    if (contentLength) {
                        const percent = (receivedLength * 100) / contentLength;
                        counter.setTarget(percent);
                    }
                }

                counter.finish();

                const blob = new Blob(chunks);
                const fileReader = new FileReader();
                fileReader.readAsDataURL(blob);
                fileReader.onloadend = async () => {
                    const base64data = fileReader.result;
                    try {
                        await Filesystem.writeFile({
                            path: filename,
                            data: base64data,
                            directory: Directory.ExternalStorage,
                            recursive: true
                        });
                        try {
                            await LocalNotifications.schedule({
                                notifications: [
                                    {
                                        title: 'İndirme Tamamlandı',
                                        body: `${filename} başarıyla indirildi.`,
                                        id: notifId
                                    }
                                ]
                            });
                        } catch (e) {}
                    } catch (err) {
                        try {
                            await Filesystem.writeFile({
                                path: `Oxypace/${filename}`,
                                data: base64data,
                                directory: Directory.Documents,
                                recursive: true
                            });
                        } catch (fallbackErr) {
                            progressToast.errorProgress('Dosya kaydedilemedi');
                        }
                    }
                };
            } catch (fetchErr) {
                progressToast.errorProgress('Bağlantı hatası oluştu');
            }
        } else {
            // WEB DOWNLOAD VIA BACKEND PROXY WITH LIVE ADAPTIVE AXIOS PROGRESS
            const proxyUrl = `/api/posts/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

            const response = await axios.get(proxyUrl, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = (progressEvent.loaded * 100) / progressEvent.total;
                        counter.setTarget(percent);
                    } else if (progressEvent.loaded) {
                        // Fallback estimate if Content-Length header is omitted by proxy
                        const estPercent = Math.min(95, Math.round(progressEvent.loaded / 100000));
                        counter.setTarget(estPercent);
                    }
                }
            });

            counter.finish();

            const blob = response.data;
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
        }
    } catch (error) {
        console.error('Download helper error:', error);
        if (progressToast) {
            progressToast.errorProgress('İndirme başarısız oldu');
        }
    }
};
