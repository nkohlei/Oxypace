import { create } from 'zustand';
import axios from 'axios';
import { AdaptiveProgressCounter } from '../utils/downloadHelper';

// Extract video dimensions from file blob
const getVideoDimensions = (file) => new Promise((resolve) => {
    try {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => {
            const width = v.videoWidth || 0;
            const height = v.videoHeight || 0;
            try { URL.revokeObjectURL(v.src); } catch (_) {}
            resolve({ width, height });
        };
        v.onerror = () => resolve({ width: 0, height: 0 });
        v.src = URL.createObjectURL(file);
    } catch (_) {
        resolve({ width: 0, height: 0 });
    }
});

// Upload original video directly to Cloudflare R2
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
                onProgress((evt.loaded * 100) / evt.total);
            }
        },
    });

    return mediaKey;
};

export const useUploadStore = create((set, get) => ({
    activeUploads: {}, // { [uploadKey]: { portalId, fileName, progress, stage, status: 'uploading' | 'completed' | 'failed', error } }

    startVideoUpload: async ({ file, portalId = null, channel = null, content, quotedPostId = null, authorId = null, onFinish }) => {
        // Generate a unique upload key
        const uploadKey = portalId ? `portal-${portalId}` : `profile-${authorId || 'general'}`;
        
        set((state) => ({
            activeUploads: {
                ...state.activeUploads,
                [uploadKey]: {
                    portalId,
                    fileName: file.name,
                    progress: 0,
                    stage: 'Video yükleniyor...',
                    status: 'uploading',
                }
            }
        }));

        try {
            // Read dimensions in background while uploading
            const dimPromise = getVideoDimensions(file);

            const counter = new AdaptiveProgressCounter(
                (p) => {
                    set((state) => {
                        const current = state.activeUploads[uploadKey];
                        if (!current) return state;
                        return {
                            activeUploads: {
                                ...state.activeUploads,
                                [uploadKey]: { ...current, progress: p }
                            }
                        };
                    });
                }
            );

            // 1. Upload to R2
            const mediaKey = await uploadBlobToR2(
                file,
                file.name,
                file.type || 'video/mp4',
                'post',
                portalId,
                (progress) => counter.setTarget(progress)
            );

            counter.finish();

            const { width, height } = await dimPromise;

            // 2. Set stage to complete
            set((state) => {
                const current = state.activeUploads[uploadKey];
                if (!current) return state;
                return {
                    activeUploads: {
                        ...state.activeUploads,
                        [uploadKey]: { ...current, progress: 100, stage: 'Gönderi oluşturuluyor...' }
                    }
                };
            });

            // 3. Create the post
            const postData = {
                content,
                portalId,
                channel,
                quotedPostId,
                mediaKey,
                mediaType: 'video',
                videoWidth: width,
                videoHeight: height,
            };

            const response = await axios.post('/api/posts', postData);

            // 4. Remove upload on success
            set((state) => {
                const newUploads = { ...state.activeUploads };
                delete newUploads[uploadKey];
                return { activeUploads: newUploads };
            });

            if (onFinish) {
                onFinish(null, response.data);
            }
        } catch (err) {
            console.error('[useUploadStore] Video upload failed:', err);
            const errMsg = err.response?.data?.message || err.message || 'Video yükleme başarısız oldu.';
            
            // Keep error status for a brief moment or just clear and alert
            set((state) => {
                const current = state.activeUploads[uploadKey];
                if (!current) return state;
                return {
                    activeUploads: {
                        ...state.activeUploads,
                        [uploadKey]: { ...current, status: 'failed', error: errMsg }
                    }
                };
            });

            // Auto-clear error after 5 seconds
            setTimeout(() => {
                set((state) => {
                    const newUploads = { ...state.activeUploads };
                    delete newUploads[uploadKey];
                    return { activeUploads: newUploads };
                });
            }, 5000);

            if (onFinish) {
                onFinish(err);
            }
        }
    }
}));
