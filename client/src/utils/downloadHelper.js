import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import axios from 'axios';
import { getImageUrl } from './imageUtils';

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
            <div style="display:flex; align-items:center; gap:8px; overflow:hidden; max-width:78%;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span id="dl-filename" style="font-weight:600; font-size:12.5px; color:#f4f4f5; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${filename}</span>
            </div>
            <span id="dl-percent" style="font-family:monospace; font-weight:600; font-size:12px; color:#ffffff;">%0</span>
        </div>
        <div style="width:100%; height:4px; background:#27272a; border-radius:4px; overflow:hidden; position:relative;">
            <div id="dl-bar" style="width:0%; height:100%; background:#ffffff; border-radius:4px; transition:width 0.05s linear;"></div>
        </div>
        <div id="dl-status" style="font-size:11px; color:#a1a1aa; margin-top:6px; text-align:left;">İndirme başlatılıyor...</div>
    `;

    Object.assign(toast.style, {
        position: 'fixed',
        top: 'max(64px, calc(env(safe-area-inset-top, 0px) + 54px))',
        left: '50%',
        transform: 'translateX(-50%) translateY(-160px)',
        background: '#18181b',
        color: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        width: 'calc(100% - 32px)',
        maxWidth: '340px',
        zIndex: '9999999',
        boxShadow: '0 12px 28px rgba(0,0,0,0.7)',
        border: '1px solid #27272a',
        boxSizing: 'border-box',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
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
                barEl.style.background = '#e4e4e7';
            }
            if (statusEl) statusEl.innerText = `İndirme tamamlandı.`;

            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-160px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 1800);
        },
        errorProgress: (msg) => {
            if (statusEl) statusEl.innerText = `${msg || 'İndirme başarısız oldu.'}`;
            if (barEl) barEl.style.background = '#ef4444';
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-160px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
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
        if (!url) return;

        let fullUrl = url;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = getImageUrl(fullUrl);
        }

        // Clean filename: strip query params (?...) and hash (#...)
        let cleanFilename = filename || fullUrl.split('/').pop() || `oxypace-${Date.now()}`;
        cleanFilename = cleanFilename.split('?')[0].split('#')[0];
        cleanFilename = cleanFilename.replace(/[/\\?%*:|"<>]/g, '-').trim();
        if (!cleanFilename) cleanFilename = `oxypace-${Date.now()}`;

        // Ensure proper extension if missing
        if (!cleanFilename.includes('.')) {
            const urlLower = fullUrl.split('?')[0].toLowerCase();
            if (urlLower.endsWith('.mp4') || urlLower.includes('.mp4')) cleanFilename += '.mp4';
            else if (urlLower.endsWith('.pdf') || urlLower.includes('.pdf')) cleanFilename += '.pdf';
            else if (urlLower.endsWith('.gif') || urlLower.includes('.gif')) cleanFilename += '.gif';
            else if (urlLower.endsWith('.png') || urlLower.includes('.png')) cleanFilename += '.png';
            else if (urlLower.endsWith('.webp') || urlLower.includes('.webp')) cleanFilename += '.webp';
            else cleanFilename += '.jpg';
        }

        progressToast = createDownloadProgressToast(cleanFilename);

        const counter = new AdaptiveProgressCounter(
            (percent) => progressToast.updateProgress(percent),
            () => progressToast.completeProgress()
        );

        if (Capacitor.isNativePlatform()) {
            let progressListener = null;
            try {
                try {
                    progressListener = await Downloader.addListener('downloadProgress', (data) => {
                        if (data && typeof data.percentage === 'number') {
                            counter.setTarget(data.percentage);
                        }
                        if (data && data.status === 8) { // STATUS_SUCCESSFUL
                            counter.finish();
                            if (progressListener) {
                                progressListener.remove?.();
                                progressListener = null;
                            }
                        } else if (data && data.status === 16) { // STATUS_FAILED
                            progressToast.errorProgress('İndirme başarısız oldu');
                            if (progressListener) {
                                progressListener.remove?.();
                                progressListener = null;
                            }
                        }
                    });
                } catch (listenerErr) {
                    console.warn('[Download] Could not attach listener to Downloader:', listenerErr);
                }

                await Downloader.downloadFile({
                    url: fullUrl,
                    filename: cleanFilename,
                    isApk: false,
                    title: cleanFilename,
                    description: 'Dosya indiriliyor...'
                });

            } catch (nativeErr) {
                console.warn('[Download] Native DownloaderPlugin error, falling back to system intent:', nativeErr);
                try {
                    window.open(fullUrl, '_system');
                    counter.finish();
                } catch (fallbackErr) {
                    progressToast.errorProgress('İndirme başlatılamadı');
                }
            }
        } else {
            // WEB DOWNLOAD VIA BACKEND PROXY WITH LIVE ADAPTIVE AXIOS PROGRESS
            const proxyUrl = `/api/posts/download?url=${encodeURIComponent(fullUrl)}&filename=${encodeURIComponent(cleanFilename)}`;

            const response = await axios.get(proxyUrl, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total && progressEvent.total > 0) {
                        const percent = (progressEvent.loaded * 100) / progressEvent.total;
                        counter.setTarget(percent);
                    } else if (progressEvent.loaded) {
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
            a.download = cleanFilename;
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
