import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Quality ladder — highest first so we generate best quality first
// Each entry: { label, targetH, bitrate, maxrate, bufsize, audioBitrate }
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_LADDER = [
    { label: 'p1080', targetH: 1080, bitrate: '2000k', maxrate: '2400k', bufsize: '4000k', audioBitrate: '128k' },
    { label: 'p720',  targetH: 720,  bitrate: '1100k', maxrate: '1300k', bufsize: '2200k', audioBitrate: '128k' },
    { label: 'p360',  targetH: 360,  bitrate: '400k',  maxrate: '450k',  bufsize: '800k',  audioBitrate: '64k'  },
    { label: 'p144',  targetH: 144,  bitrate: '150k',  maxrate: '180k',  bufsize: '300k',  audioBitrate: '64k'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Detect if SharedArrayBuffer is available (required for FFmpeg WASM threads).
// Some environments (Capacitor WebView, older browsers) don't expose it.
// ─────────────────────────────────────────────────────────────────────────────
const canUseWasm = () => {
    try {
        return (
            typeof SharedArrayBuffer !== 'undefined' &&
            !Capacitor.isNativePlatform()
        );
    } catch {
        return false;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get video dimensions from a File object without fully loading it.
// ─────────────────────────────────────────────────────────────────────────────
const getVideoDimensions = (file) =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ width: 0, height: 0 });
        };
        video.src = url;
    });

// ─────────────────────────────────────────────────────────────────────────────
// Upload a single Blob/File to Cloudflare R2 via presigned PUT URL.
// Returns the R2 key on success.
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
    delete cleanAxios.defaults.headers.common?.['Authorization'];

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
// Main hook
// ─────────────────────────────────────────────────────────────────────────────
export function useVideoTranscoder() {
    const ffmpegRef = useRef(null);
    const [isTranscoding, setIsTranscoding] = useState(false);
    const [progress, setProgress]           = useState(0);
    const [stage, setStage]                 = useState('');   // e.g. "144p üretiliyor..."
    const [error, setError]                 = useState(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Lazy-load FFmpeg WASM only when needed (saves ~31MB for non-video users)
    // ─────────────────────────────────────────────────────────────────────────
    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return ffmpegRef.current;

        setStage('Video işleyici yükleniyor...');

        // Dynamic import — bundle stays light for everyone else
        const { FFmpeg }   = await import('@ffmpeg/ffmpeg');
        const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();

        // Load the WASM core — use CDN to avoid bundling 31MB into the app
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
            wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegRef.current = { ffmpeg, fetchFile };
        return ffmpegRef.current;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Main entry point: transcode + upload a video file.
    //
    // Returns an object:
    // {
    //   mediaKey: 'posts/xxx/original-yyy.mp4',   // original R2 key
    //   videoQualities: { p144: 'url', p360: 'url', p720: 'url', p1080: 'url' }
    // }
    //
    // On mobile (Capacitor) / WASM-unsupported env: uploads original only.
    // ─────────────────────────────────────────────────────────────────────────
    const transcodeAndUpload = async (file, portalId = null) => {
        setIsTranscoding(true);
        setProgress(0);
        setError(null);

        try {
            // ── Step 1: Upload original immediately (guarantee playback) ──────
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
            const videoQualities = {};

            // Determine which quality label the original falls into
            const { width, height } = await getVideoDimensions(file);
            let originalLabel = 'p144';
            if      (height >= 1080 || width >= 1920) originalLabel = 'p1080';
            else if (height >= 720  || width >= 1280) originalLabel = 'p720';
            else if (height >= 360  || width >= 640 ) originalLabel = 'p360';

            videoQualities[originalLabel] = originalUrl;
            setProgress(25);

            // ── Step 2: WASM transcoding (web only) ──────────────────────────
            if (!canUseWasm()) {
                // Mobile / WASM-unsupported: return single quality
                console.log('[useVideoTranscoder] WASM unavailable — returning original only.');
                setStage('Tamamlandı');
                setProgress(100);
                return { mediaKey: originalKey, videoQualities };
            }

            const { ffmpeg, fetchFile } = await loadFFmpeg();

            // Register progress handler
            ffmpeg.on('progress', ({ progress: p }) => {
                // Map transcode progress into the 25–90% band
                // Will be recalculated per quality step below
            });

            // Write source file into FFmpeg virtual FS once
            const inputName = 'input.mp4';
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Quality steps strictly below source height
            const steps = QUALITY_LADDER.filter(q => height > q.targetH);
            const totalSteps = steps.length;

            for (let i = 0; i < totalSteps; i++) {
                const q = steps[i];
                const outputName = `out_${q.label}.mp4`;
                const stepLabel  = q.label === 'p144' ? '144p' :
                                   q.label === 'p360' ? '360p' :
                                   q.label === 'p720' ? '720p' : '1080p';

                setStage(`${stepLabel} üretiliyor...`);

                // Track per-step transcode progress → map to 25–75% overall
                ffmpeg.on('progress', ({ progress: p }) => {
                    const band = 50; // 25–75%
                    const stepOffset = i / totalSteps;
                    const stepBand   = band / totalSteps;
                    setProgress(Math.round(25 + (stepOffset + (p * stepBand / 100)) * 100 / 2));
                });

                try {
                    await ffmpeg.exec([
                        '-i', inputName,
                        '-vf', `scale=-2:${q.targetH}`,
                        '-vcodec', 'libx264',
                        '-preset', 'ultrafast',
                        '-tune', 'fastdecode',
                        '-threads', '1',
                        '-b:v', q.bitrate,
                        '-maxrate', q.maxrate,
                        '-bufsize', q.bufsize,
                        '-acodec', 'aac',
                        '-b:a', q.audioBitrate,
                        '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart',
                        '-y',
                        outputName
                    ]);

                    const data = await ffmpeg.readFile(outputName);
                    const blob = new Blob([data.buffer], { type: 'video/mp4' });
                    await ffmpeg.deleteFile(outputName);

                    // Upload this quality
                    setStage(`${stepLabel} yükleniyor...`);
                    const stepProgress = 75 + Math.round(((i + 1) / totalSteps) * 20); // 75–95%
                    const key = await uploadBlobToR2(
                        blob,
                        `video_${q.label}_${Date.now()}.mp4`,
                        'video/mp4',
                        'video-quality',
                        portalId,
                        () => setProgress(stepProgress)
                    );
                    videoQualities[q.label] = `/api/media/${key}`;

                } catch (qualityErr) {
                    console.warn(`[useVideoTranscoder] ${q.label} failed, skipping:`, qualityErr.message);
                    // Non-fatal: continue with remaining qualities
                }
            }

            // Clean up FFmpeg FS
            try { await ffmpeg.deleteFile(inputName); } catch (_) {}

            setStage('Tamamlandı');
            setProgress(100);

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
