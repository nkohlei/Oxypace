import { useState } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Upload original video directly to Cloudflare R2
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
// useVideoTranscoder - now acts as a high-speed direct uploader that triggers
// backend asynchronous transcoding pipeline on post creation.
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
        setStage('Video yükleniyor...');

        try {
            const originalKey = await uploadBlobToR2(
                file,
                file.name,
                file.type || 'video/mp4',
                'post',
                portalId,
                (p) => setProgress(p)
            );
            setProgress(100);
            setStage('Yükleme tamamlandı');
            return { mediaKey: originalKey, videoQualities: null };
        } catch (err) {
            console.error('[useVideoTranscoder] Direct upload failed:', err);
            setError(err.message || 'Video yükleme başarısız oldu.');
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
