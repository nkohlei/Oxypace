import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Quality ladder — highest first so we generate best quality first
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_LADDER = [
    { label: 'p720',  targetH: 720,  bitrate: '1100k', maxrate: '1300k', bufsize: '2200k', audioBitrate: '128k' },
    { label: 'p360',  targetH: 360,  bitrate: '400k',  maxrate: '450k',  bufsize: '800k',  audioBitrate: '64k'  },
    { label: 'p144',  targetH: 144,  bitrate: '150k',  maxrate: '180k',  bufsize: '300k',  audioBitrate: '64k'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// canUseWasm: only blocks Capacitor native platform.
// SharedArrayBuffer check is REMOVED — we use the single-threaded FFmpeg core
// which does NOT require SharedArrayBuffer or COOP/COEP headers.
// Works on Chrome, Firefox, Safari 16+ without any server header changes.
// ─────────────────────────────────────────────────────────────────────────────
const canUseWasm = () => {
    try {
        return !Capacitor.isNativePlatform();
    } catch {
        return true; // Assume web if Capacitor check throws
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
// Main hook
// ─────────────────────────────────────────────────────────────────────────────
export function useVideoTranscoder() {
    const ffmpegRef = useRef(null);
    const [isTranscoding, setIsTranscoding] = useState(false);
    const [progress, setProgress]           = useState(0);
    const [stage, setStage]                 = useState('');
    const [error, setError]                 = useState(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Lazy-load FFmpeg WASM only when needed.
    // Uses the SINGLE-THREADED core (@ffmpeg/core, not @ffmpeg/core-mt).
    // This means NO SharedArrayBuffer, NO COOP/COEP headers needed.
    // ─────────────────────────────────────────────────────────────────────────
    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return ffmpegRef.current;

        setStage('Video işleyici yükleniyor...');

        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();

        // Single-threaded core — works everywhere without special headers
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            // NO workerURL → single-threaded mode, no SharedArrayBuffer needed
        });

        console.log('[useVideoTranscoder] FFmpeg WASM (single-threaded) loaded.');
        ffmpegRef.current = { ffmpeg, fetchFile };
        return ffmpegRef.current;
    };

    const transcodeAndUpload = async (file, portalId = null) => {
        setIsTranscoding(true);
        setProgress(0);
        setError(null);

        try {
            // ── Step 1: Upload original immediately → guaranteed playback ─────
            setStage('Orijinal video yükleniyor...');
            const originalKey = await uploadBlobToR2(
                file,
                file.name,
                file.type || 'video/mp4',
                'post',
                portalId,
                (p) => setProgress(Math.round(p * 0.2)) // 0→20%
            );

            const originalUrl = `/api/media/${originalKey}`;
            const videoQualities = {};

            // Detect source resolution
            const { width, height } = await getVideoDimensions(file);
            console.log(`[useVideoTranscoder] Source: ${width}x${height}`);

            let originalLabel = 'p144';
            if      (height >= 1080 || width >= 1920) originalLabel = 'p1080';
            else if (height >= 720  || width >= 1280) originalLabel = 'p720';
            else if (height >= 360  || width >= 640 ) originalLabel = 'p360';

            videoQualities[originalLabel] = originalUrl;
            setProgress(20);

            // ── Step 2: WASM transcoding ──────────────────────────────────────
            if (!canUseWasm()) {
                console.log('[useVideoTranscoder] Native platform — skipping WASM, returning original only.');
                setStage('Tamamlandı');
                setProgress(100);
                return { mediaKey: originalKey, videoQualities };
            }

            let ffmpegInstance, fetchFileUtil;
            try {
                const loaded = await loadFFmpeg();
                ffmpegInstance = loaded.ffmpeg;
                fetchFileUtil  = loaded.fetchFile;
            } catch (loadErr) {
                console.warn('[useVideoTranscoder] FFmpeg WASM load failed, returning original only:', loadErr.message);
                setStage('Tamamlandı');
                setProgress(100);
                return { mediaKey: originalKey, videoQualities };
            }

            // Write source once into FFmpeg virtual FS
            const inputName = 'input.mp4';
            setStage('Video analiz ediliyor...');
            await ffmpegInstance.writeFile(inputName, await fetchFileUtil(file));
            setProgress(25);

            // Filter quality steps to only those below source resolution
            const steps = QUALITY_LADDER.filter(q => height > q.targetH);
            console.log(`[useVideoTranscoder] Will transcode ${steps.length} qualities:`, steps.map(s => s.label));

            const totalSteps = steps.length;

            for (let i = 0; i < totalSteps; i++) {
                const q = steps[i];
                const outputName = `out_${q.label}.mp4`;
                const stepLabel  = q.label === 'p144' ? '144p' :
                                   q.label === 'p360' ? '360p' :
                                   q.label === 'p720' ? '720p' : '1080p';

                setStage(`${stepLabel} üretiliyor...`);

                // Register a fresh progress listener for this step only
                const progressHandler = ({ progress: p }) => {
                    // Each step occupies an equal slice of the 25–75% band
                    const sliceStart = 25 + (i / totalSteps) * 50;
                    const sliceSize  = 50 / totalSteps;
                    setProgress(Math.round(sliceStart + p * sliceSize));
                };
                ffmpegInstance.on('progress', progressHandler);

                try {
                    await ffmpegInstance.exec([
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

                    const data = await ffmpegInstance.readFile(outputName);
                    const blob = new Blob([data.buffer], { type: 'video/mp4' });
                    await ffmpegInstance.deleteFile(outputName);

                    // Upload this quality blob
                    setStage(`${stepLabel} yükleniyor...`);
                    const uploadStart = 75 + (i / totalSteps) * 20;
                    const key = await uploadBlobToR2(
                        blob,
                        `video_${q.label}_${Date.now()}.mp4`,
                        'video/mp4',
                        'video-quality',
                        portalId,
                        (p) => setProgress(Math.round(uploadStart + (p / 100) * (20 / totalSteps)))
                    );

                    videoQualities[q.label] = `/api/media/${key}`;
                    console.log(`[useVideoTranscoder] ✅ ${stepLabel} ready: ${key}`);

                } catch (qualityErr) {
                    console.warn(`[useVideoTranscoder] ⚠️ ${stepLabel} failed (non-fatal):`, qualityErr.message);
                } finally {
                    // Always remove the listener for this step to prevent stacking
                    ffmpegInstance.off('progress', progressHandler);
                }
            }

            // Clean up virtual FS
            try { await ffmpegInstance.deleteFile(inputName); } catch (_) {}

            setStage('Tamamlandı');
            setProgress(100);

            console.log('[useVideoTranscoder] 🏁 Done. Quality map:', videoQualities);
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
