import { useRef, useState } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Upload a single Blob/File to Cloudflare R2 via presigned PUT URL.
// ─────────────────────────────────────────────────────────────────────────────
const uploadBlobToR2 = async (blob, fileName, fileType, purpose, portalId, onProgress) => {
    const { data: { uploadUrl, mediaKey } } = await axios.post('/api/media/presigned-url', {
        fileName,
        fileType,
        fileSize: blob.size,
        purpose,
        portalId,
    });

    const cleanAxios = axios.create();
    if (cleanAxios.defaults.headers.common) {
        delete cleanAxios.defaults.headers.common['Authorization'];
    }

    await cleanAxios.put(uploadUrl, blob, {
        headers: { 'Content-Type': fileType },
        onUploadProgress: (evt) => {
            if (onProgress && evt.total) {
                onProgress(Math.round((evt.loaded * 100) / evt.total));
            }
        },
    });

    return mediaKey;
};

// ─────────────────────────────────────────────────────────────────────────────
// Transcode video using pure browser canvas rendering and MediaRecorder.
// ─────────────────────────────────────────────────────────────────────────────
const transcodeQuality = (file, targetWidth, targetHeight, bitrate, onProgressStep) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        document.body.appendChild(video);

        let stream = null;
        let mediaRecorder = null;
        let animationFrameId = null;

        const cleanup = () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                try { mediaRecorder.stop(); } catch (e) {}
            }
            if (video.src) URL.revokeObjectURL(video.src);
            try { document.body.removeChild(video); } catch (e) {}
        };

        video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            const duration = video.duration || 1;
            
            // Capture stream at 24fps
            try {
                stream = canvas.captureStream(24);
            } catch (err) {
                cleanup();
                return reject(new Error('Canvas captureStream not supported in this browser: ' + err.message));
            }

            // Optional: Extract audio from video
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    const audioContext = new AudioContextClass();
                    const source = audioContext.createMediaElementSource(video);
                    const destination = audioContext.createMediaStreamDestination();
                    source.connect(destination);
                    source.connect(audioContext.destination);
                    const audioTrack = destination.stream.getAudioTracks()[0];
                    if (audioTrack) {
                        stream.addTrack(audioTrack);
                    }
                }
            } catch (audioErr) {
                console.warn('Audio capture failed (non-fatal):', audioErr);
            }

            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
            
            const options = { bitsPerSecond: bitrate };
            if (MediaRecorder.isTypeSupported(mimeType)) {
                options.mimeType = mimeType;
            }

            try {
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (recErr) {
                cleanup();
                return reject(new Error('MediaRecorder initialization failed: ' + recErr.message));
            }

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' });
                cleanup();
                resolve(blob);
            };

            video.play().then(() => {
                mediaRecorder.start();

                const draw = () => {
                    if (video.paused || video.ended) {
                        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
                        return;
                    }
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    if (onProgressStep) {
                        const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
                        onProgressStep(pct);
                    }
                    animationFrameId = requestAnimationFrame(draw);
                };
                draw();
            }).catch((playErr) => {
                cleanup();
                reject(playErr);
            });
        };

        video.onerror = (err) => {
            cleanup();
            reject(new Error('Video loading error: ' + err.message));
        };
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────────────────────
export function useVideoTranscoder() {
    const [isTranscoding, setIsTranscoding] = useState(false);
    const [progress, setProgress]           = useState(0);
    const [stage, setStage]                 = useState('');
    const [error, setError]                 = useState(null);

    const transcodeAndUpload = async (file, portalId = null) => {
        setIsTranscoding(true);
        setProgress(0);
        setError(null);

        try {
            // ── Step 1: Upload original immediately → 1080p/Original ─────
            setStage('Orijinal video yükleniyor...');
            const originalKey = await uploadBlobToR2(
                file,
                file.name,
                file.type || 'video/mp4',
                'post',
                portalId,
                (p) => setProgress(Math.round(p * 0.25)) // 0→25%
            );
            const originalUrl = `/api/media/${originalKey}`;
            
            // ── Step 2: Transcode 144p ──
            setStage('144p kalitesi üretiliyor...');
            const blob144 = await transcodeQuality(file, 256, 144, 150000, (p) => setProgress(25 + Math.round(p * 0.15)));
            setStage('144p kalitesi yükleniyor...');
            const key144 = await uploadBlobToR2(blob144, `video_144p_${Date.now()}.mp4`, blob144.type, 'video-quality', portalId);
            const url144 = `/api/media/${key144}`;
            
            // ── Step 3: Transcode 360p ──
            setStage('360p kalitesi üretiliyor...');
            const blob360 = await transcodeQuality(file, 480, 360, 400000, (p) => setProgress(40 + Math.round(p * 0.2)));
            setStage('360p kalitesi yükleniyor...');
            const key360 = await uploadBlobToR2(blob360, `video_360p_${Date.now()}.mp4`, blob360.type, 'video-quality', portalId);
            const url360 = `/api/media/${key360}`;

            // ── Step 4: Transcode 720p ──
            setStage('720p kalitesi üretiliyor...');
            const blob720 = await transcodeQuality(file, 1280, 720, 1000000, (p) => setProgress(60 + Math.round(p * 0.2)));
            setStage('720p kalitesi yükleniyor...');
            const key720 = await uploadBlobToR2(blob720, `video_720p_${Date.now()}.mp4`, blob720.type, 'video-quality', portalId);
            const url720 = `/api/media/${key720}`;

            const videoQualities = {
                "144p": url144,
                "360p": url360,
                "720p": url720,
                "1080p": originalUrl
            };

            // Fail-safe verification: Ensure all 4 tracks are present
            if (!videoQualities["144p"] || !videoQualities["360p"] || !videoQualities["720p"] || !videoQualities["1080p"]) {
                throw new Error("Çoklu kalite video hazırlığı başarısız: Tüm 4 kalite kanalı oluşturulamadı.");
            }

            setProgress(100);
            setStage('Tamamlandı');
            console.log('[useVideoTranscoder] Multi-quality transcoding complete:', videoQualities);
            return { mediaKey: originalKey, videoQualities };

        } catch (err) {
            console.error('[useVideoTranscoder] Fatal error:', err);
            setError(err.message || 'Video işleme başarısız oldu.');
            throw err;
        } finally {
            setIsTranscoding(false);
        }
    };

    return {
        transcodeAndUpload,
        isTranscoding,
        progress,
        stage,
        error,
    };
}
