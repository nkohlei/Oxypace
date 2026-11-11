import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

const uploadViaBase64Fallback = (file, fileName, effectiveType, purpose, portalId, onProgress) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64Data = reader.result;
                if (onProgress) onProgress(30);
                const response = await axios.post('/api/media/upload', {
                    mediaBase64: base64Data,
                    fileName,
                    fileType: effectiveType,
                    purpose,
                    portalId,
                }, {
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.total) {
                            const p = 30 + Math.round((progressEvent.loaded * 70) / progressEvent.total);
                            onProgress(Math.min(p, 99));
                        }
                    },
                });
                if (onProgress) onProgress(100);
                resolve(response.data.mediaKey);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı.'));
        reader.readAsDataURL(file);
    });

/**
 * Uploads a File/Blob cleanly via Cloudflare R2 presigned URL (up to 2 GB).
 * Falls back to multipart/base64 proxy upload only for smaller files if R2 direct PUT fails.
 *
 * @param {File|Blob} file - The file or blob to upload.
 * @param {string} purpose - Upload purpose ('post', 'avatar', 'banner', 'message', 'comment', 'feedback').
 * @param {string|null} portalId - Optional portal/context ID.
 * @param {function|null} onProgress - Optional progress callback (0..100).
 * @returns {Promise<string>} - The R2 object key.
 */
export const uploadFile = async (file, purpose = 'post', portalId = null, onProgress = null) => {
    if (!file) return null;

    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
        throw new Error("Dosya boyutu standart 2 GB sınırını aşıyor.");
    }

    const fileName = file.name || `upload-${Date.now()}`;
    const effectiveType = file.type || 'application/octet-stream';

    try {
        // 1. Request a Presigned URL from backend
        const { data: { uploadUrl, mediaKey } } = await axios.post('/api/media/presigned-url', {
            fileName,
            fileType: effectiveType,
            fileSize: file.size || 0,
            purpose,
            portalId,
        });

        // 2. Clean Axios instance (no Authorization header for Cloudflare R2)
        const cleanAxios = axios.create();
        if (cleanAxios.defaults.headers.common) {
            delete cleanAxios.defaults.headers.common['Authorization'];
        }

        await cleanAxios.put(uploadUrl, file, {
            headers: {
                'Content-Type': effectiveType,
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        if (onProgress) onProgress(100);
        return mediaKey;
    } catch (error) {
        console.warn('[uploadUtils] Direct R2 upload error:', error?.message || error);

        // If native WebView failed PUT (e.g. network quirk) and file is small (<= 15 MB), fall back safely
        if (Capacitor.isNativePlatform() && file.size && file.size <= 15 * 1024 * 1024) {
            try {
                return await uploadViaBase64Fallback(file, fileName, effectiveType, purpose, portalId, onProgress);
            } catch (fallbackErr) {
                console.error('[uploadUtils] Base64 fallback also failed:', fallbackErr);
                throw fallbackErr;
            }
        }
        throw error;
    }
};
