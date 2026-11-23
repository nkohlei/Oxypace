import axios from 'axios';

const HEIC_EXT_RE = /\.(heic|heif)$/i;
const HEIC_MIMES = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

export function isHeicClientFile(file) {
    if (!file) return false;
    const name = String(file.name || '');
    const type = String(file.type || '').toLowerCase();
    return HEIC_EXT_RE.test(name) || HEIC_MIMES.has(type);
}

/**
 * Convert a .heic / .heif File into a browser-renderable JPEG File using the backend converter.
 * Returns non-HEIC files unchanged.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function normalizeImageFileForBrowser(file) {
    if (!file || !isHeicClientFile(file)) return file;

    const formData = new FormData();
    formData.append('file', file, file.name || 'image.heic');

    const res = await axios.post('/api/media/convert-heic', formData, {
        responseType: 'blob',
    });

    const jpegBlob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'image/jpeg' });
    const baseName = (file.name || 'image').replace(HEIC_EXT_RE, '');
    return new File([jpegBlob], `${baseName || 'image'}.jpg`, {
        type: 'image/jpeg',
        lastModified: file.lastModified || Date.now(),
    });
}

/**
 * Normalize an array/FileList of mixed files, converting any HEIC/HEIF images to JPEG.
 * Non-HEIC files pass through untouched.
 * @param {File[]|FileList} files
 * @returns {Promise<File[]>}
 */
export async function normalizeImageFilesForBrowser(files) {
    const list = Array.from(files || []).filter(Boolean);
    if (list.length === 0) return [];
    const results = [];
    for (const file of list) {
        if (isHeicClientFile(file)) {
            results.push(await normalizeImageFileForBrowser(file));
        } else {
            results.push(file);
        }
    }
    return results;
}
