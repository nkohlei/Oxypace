export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB standard limit
export const MAX_FILE_SIZE_LABEL = '2 GB';
export const MAX_POST_ATTACHMENTS = 15;

const BLOCKED_EXECUTABLE_EXTS = new Set([
    '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',
    '.vbs', '.vbe', '.jse', '.wsf', '.wsh', '.ps1', '.psm1',
    '.dll', '.sys', '.drv', '.cpl', '.hta', '.reg', '.msc', '.jar'
]);

const YOUTUBE_URL_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)/i;

/**
 * Automatically detects a YouTube URL inside free-form post text.
 * Returns { url, id } or null.
 */
export const extractYouTubeInfo = (text = '') => {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(YOUTUBE_URL_REGEX);
    if (!match || !match[1]) return null;
    let url = match[0].replace(/[.,!?;:)\]]+$/, '');
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }
    return { url, id: match[1] };
};

export const getFileExtension = (fileName = '') => {
    const clean = String(fileName || '').split('?')[0].split('#')[0];
    const dotIdx = clean.lastIndexOf('.');
    if (dotIdx === -1) return '';
    return clean.slice(dotIdx).toLowerCase();
};

export const formatFileSize = (bytes = 0) => {
    const n = Number(bytes) || 0;
    if (n <= 0) return '0 KB';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatDuration = (seconds = 0) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const validateSelectableFile = (file) => {
    if (!file) return { valid: false, error: 'Geçersiz dosya.' };
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `"${file.name}" standart ${MAX_FILE_SIZE_LABEL} yükleme sınırını aşıyor.`,
        };
    }
    const ext = getFileExtension(file.name);
    if (ext && BLOCKED_EXECUTABLE_EXTS.has(ext)) {
        return {
            valid: false,
            error: `Güvenlik nedeniyle "${ext}" çalıştırılabilir dosya türü yüklenemez.`,
        };
    }
    return { valid: true };
};

export const categorizeFile = (file) => {
    const name = file?.name || '';
    const mime = String(file?.type || '').toLowerCase();
    const ext = getFileExtension(name);
    const bareExt = ext.startsWith('.') ? ext.slice(1).toUpperCase() : 'DOSYA';

    if (ext === '.pdf' || mime === 'application/pdf') {
        return { kind: 'pdf', ext, mimeType: mime || 'application/pdf', badge: 'PDF' };
    }
    if (ext === '.gif' || mime === 'image/gif') {
        return { kind: 'gif', ext, mimeType: mime || 'image/gif', badge: 'GIF' };
    }
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp', '.heic'].includes(ext) || (mime.startsWith('image/') && !mime.includes('svg'))) {
        return { kind: 'image', ext, mimeType: mime || 'image/jpeg', badge: bareExt };
    }
    if (['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi', '.flv', '.3gp', '.wmv'].includes(ext) || mime.startsWith('video/')) {
        return { kind: 'video', ext, mimeType: mime || 'video/mp4', badge: bareExt };
    }
    if (['.mp3', '.wav', '.ogg', '.oga', '.opus', '.m4a', '.aac', '.flac', '.weba', '.amr', '.wma'].includes(ext) || mime.startsWith('audio/')) {
        return { kind: 'audio', ext, mimeType: mime || 'audio/mpeg', badge: bareExt };
    }

    // Document / Presentation / Spreadsheet / Web / Code / Archive
    return {
        kind: 'file',
        ext,
        mimeType: mime || 'application/octet-stream',
        badge: bareExt.slice(0, 6) || 'DOSYA',
    };
};

export const createAttachmentDraftFromFile = (file, extra = {}) => {
    const check = validateSelectableFile(file);
    if (!check.valid) {
        throw new Error(check.error);
    }
    const meta = categorizeFile(file);
    const isMediaPreview = meta.kind === 'image' || meta.kind === 'gif' || meta.kind === 'video' || meta.kind === 'audio';
    const previewUrl = isMediaPreview ? URL.createObjectURL(file) : '';

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        kind: extra.kind || meta.kind,
        file,
        previewUrl,
        name: extra.name || file.name,
        ext: meta.ext,
        badge: extra.badge || meta.badge,
        mimeType: meta.mimeType,
        size: file.size || 0,
        duration: Number(extra.duration) || 0,
        folderName: extra.folderName || '',
        fileCount: Number(extra.fileCount) || 0,
        folderFiles: extra.folderFiles || [],
    };
};

export const revokeAttachmentDraft = (draft) => {
    if (draft?.previewUrl && draft.previewUrl.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(draft.previewUrl);
        } catch (_) {}
    }
};

export const getVideoDimensionsAndPoster = (file) =>
    new Promise((resolve) => {
        try {
            const v = document.createElement('video');
            v.preload = 'metadata';
            v.muted = true;
            v.playsInline = true;

            let finished = false;
            const cleanup = () => {
                if (finished) return;
                finished = true;
                try { URL.revokeObjectURL(v.src); } catch (_) {}
            };

            const timeout = setTimeout(() => {
                cleanup();
                resolve({ width: v.videoWidth || 0, height: v.videoHeight || 0, posterBlob: null });
            }, 4500);

            v.onloadedmetadata = () => {
                v.currentTime = v.duration > 0.5 ? Math.min(0.5, v.duration / 3) : 0.05;
            };

            v.onseeked = () => {
                clearTimeout(timeout);
                try {
                    const width = v.videoWidth || 0;
                    const height = v.videoHeight || 0;
                    if (!width || !height) {
                        cleanup();
                        return resolve({ width, height, posterBlob: null });
                    }
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, 1280 / Math.max(width, height));
                    canvas.width = Math.round(width * scale);
                    canvas.height = Math.round(height * scale);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        cleanup();
                        resolve({ width, height, posterBlob: blob });
                    }, 'image/jpeg', 0.84);
                } catch (_) {
                    cleanup();
                    resolve({ width: v.videoWidth || 0, height: v.videoHeight || 0, posterBlob: null });
                }
            };

            v.onerror = () => {
                clearTimeout(timeout);
                cleanup();
                resolve({ width: 0, height: 0, posterBlob: null });
            };

            v.src = URL.createObjectURL(file);
        } catch (_) {
            resolve({ width: 0, height: 0, posterBlob: null });
        }
    });

/**
 * Shared composer helper: validates & appends selected files into an attachment drafts array.
 * Returns { nextDrafts, addedCount, warnings }.
 */
export const appendAttachmentDrafts = (
    currentDrafts = [],
    rawFiles = [],
    { extra = {}, imagesOnly = false, maxCount = MAX_POST_ATTACHMENTS } = {}
) => {
    const warnings = [];
    const nextDrafts = [...currentDrafts];
    let addedCount = 0;

    for (const file of rawFiles) {
        if (!file) continue;
        if (nextDrafts.length >= maxCount) {
            warnings.push(`Bir gönderiye en fazla ${maxCount} dosya veya içerik eklenebilir.`);
            break;
        }
        try {
            const draft = createAttachmentDraftFromFile(file, extra);
            if (imagesOnly && draft.kind !== 'image' && draft.kind !== 'gif') {
                revokeAttachmentDraft(draft);
                warnings.push('Görsel kanallarında yalnızca görsel veya GIF paylaşılabilir.');
                continue;
            }
            nextDrafts.push(draft);
            addedCount += 1;
        } catch (err) {
            warnings.push(err?.message || 'Dosya eklenemedi.');
        }
    }

    return { nextDrafts, addedCount, warnings };
};

/**
 * Converts a zipped folder package from FileFolderPickerModal into a draft object.
 */
export const createFolderDraftFromPackage = (packaged) => {
    if (!packaged?.zipFile) return null;
    return createAttachmentDraftFromFile(packaged.zipFile, {
        kind: 'folder',
        badge: 'KLASÖR',
        name: packaged.folderName || packaged.zipFile.name,
        folderName: packaged.folderName || '',
        fileCount: packaged.fileCount || 0,
        folderFiles: packaged.folderFiles || [],
    });
};

/**
 * Builds optimistic feed post media fields from current drafts & detected YouTube URL.
 */
export const buildOptimisticPostMedia = (drafts = [], detectedYouTube = null) => {
    if (!drafts || drafts.length === 0) {
        if (detectedYouTube?.url) {
            return { media: detectedYouTube.url, mediaType: 'youtube', attachments: [], isVideoUpload: false };
        }
        return { media: null, mediaType: 'none', attachments: [], isVideoUpload: false };
    }

    const firstVideo = drafts.find((d) => d.kind === 'video');
    if (firstVideo && drafts.length === 1 && !detectedYouTube) {
        return {
            media: firstVideo.previewUrl,
            mediaType: 'video',
            attachments: [],
            isVideoUpload: true,
        };
    }

    if (!detectedYouTube && drafts.every((d) => d.kind === 'image')) {
        return {
            media: drafts.length === 1 ? drafts[0].previewUrl : drafts.map((d) => d.previewUrl),
            mediaType: 'image',
            attachments: [],
            isVideoUpload: false,
        };
    }

    if (!detectedYouTube && drafts.length === 1 && drafts[0].kind === 'gif') {
        return {
            media: drafts[0].previewUrl,
            mediaType: 'gif',
            attachments: [],
            isVideoUpload: false,
        };
    }

    const attachments = drafts.map((d) => ({
        kind: d.kind,
        url: d.previewUrl || '',
        name: d.name,
        mimeType: d.mimeType,
        ext: d.ext,
        size: d.size,
        duration: d.duration || 0,
        folderName: d.folderName || '',
        fileCount: d.fileCount || 0,
        folderFiles: d.folderFiles || [],
    }));
    if (detectedYouTube?.url) {
        attachments.push({
            kind: 'youtube',
            url: detectedYouTube.url,
            youtubeId: detectedYouTube.id,
            name: 'YouTube Video',
        });
    }

    const singleKind = !detectedYouTube && drafts.length === 1 ? drafts[0].kind : 'mixed';
    return {
        media: attachments[0]?.url || null,
        mediaType: singleKind === 'file' || singleKind === 'folder' || singleKind === 'audio' ? singleKind : 'mixed',
        attachments,
        isVideoUpload: Boolean(firstVideo),
    };
};

const uploadDraftItem = async (draft, uploadFileFn, targetId, onDraftProgress) => {
    const key = await uploadFileFn(draft.file, 'post', targetId, onDraftProgress);
    let thumbnailKey = '';
    let width = 0;
    let height = 0;

    if (draft.kind === 'video') {
        try {
            const meta = await getVideoDimensionsAndPoster(draft.file);
            width = meta.width || 0;
            height = meta.height || 0;
            if (meta.posterBlob) {
                const thumbFile = new File([meta.posterBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
                thumbnailKey = await uploadFileFn(thumbFile, 'post', targetId);
            }
        } catch (_) {}
    }

    return {
        kind: draft.kind,
        key,
        name: draft.name,
        mimeType: draft.mimeType,
        ext: draft.ext,
        size: draft.size,
        duration: draft.duration || 0,
        width,
        height,
        thumbnailKey,
        folderName: draft.folderName || '',
        fileCount: draft.fileCount || 0,
        folderFiles: draft.folderFiles || [],
    };
};

/**
 * Uploads composer attachment drafts cleanly, supporting homogeneous, video-with-mixed, and mixed posts.
 * Returns { mode: 'video', primaryVideoFile, extraAttachments } OR { mode: 'post', payloadFields }.
 */
export const prepareAndUploadPostAttachments = async ({
    drafts = [],
    uploadFileFn,
    targetId,
    onProgress,
    hasAutoYouTube = false,
}) => {
    if (!drafts || drafts.length === 0) {
        onProgress?.(100);
        return { mode: 'post', payloadFields: {} };
    }

    const primaryVideoIdx = drafts.findIndex((d) => d.kind === 'video');
    if (primaryVideoIdx !== -1) {
        const primaryVideoDraft = drafts[primaryVideoIdx];
        const restDrafts = drafts.filter((_, idx) => idx !== primaryVideoIdx);
        let extraAttachments = [];

        if (restDrafts.length > 0) {
            const progresses = new Array(restDrafts.length).fill(0);
            extraAttachments = await Promise.all(
                restDrafts.map((draft, idx) =>
                    uploadDraftItem(draft, uploadFileFn, targetId, (p) => {
                        progresses[idx] = p;
                        const avg = Math.round(progresses.reduce((a, b) => a + b, 0) / restDrafts.length);
                        onProgress?.(avg);
                    })
                )
            );
        }

        return {
            mode: 'video',
            primaryVideoFile: primaryVideoDraft.file,
            extraAttachments,
        };
    }

    const total = drafts.length;
    const progresses = new Array(total).fill(0);
    const uploaded = await Promise.all(
        drafts.map((draft, idx) =>
            uploadDraftItem(draft, uploadFileFn, targetId, (p) => {
                progresses[idx] = p;
                const avg = Math.round(progresses.reduce((a, b) => a + b, 0) / total);
                onProgress?.(avg);
            })
        )
    );

    if (!hasAutoYouTube && uploaded.every((u) => u.kind === 'image')) {
        if (uploaded.length === 1) {
            return { mode: 'post', payloadFields: { mediaKey: uploaded[0].key, mediaType: 'image' } };
        }
        return { mode: 'post', payloadFields: { mediaKeys: uploaded.map((u) => u.key), mediaType: 'image' } };
    }

    if (!hasAutoYouTube && uploaded.length === 1 && uploaded[0].kind === 'pdf') {
        return {
            mode: 'post',
            payloadFields: {
                mediaKey: uploaded[0].key,
                pdfName: uploaded[0].name,
                pdfSize: uploaded[0].size,
            },
        };
    }

    if (!hasAutoYouTube && uploaded.length === 1 && uploaded[0].kind === 'gif') {
        return {
            mode: 'post',
            payloadFields: { mediaKey: uploaded[0].key },
        };
    }

    return {
        mode: 'post',
        payloadFields: { attachments: uploaded },
    };
};
