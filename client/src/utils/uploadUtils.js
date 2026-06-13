import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/**
 * Uploads a file directly to Cloudflare R2 using a presigned URL.
 * @param {File|Blob} file - The file object to upload.
 * @param {string} purpose - The purpose of the upload (post, avatar, banner, cover, message, comment).
 * @param {string} portalId - Optional portal ID for folder organization.
 * @returns {Promise<string>} - The key (path) of the uploaded file in R2.
 */
export const uploadFile = async (file, purpose = 'post', portalId = null, onProgress = null) => {
  if (!file) return null;

  const isNative = typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : (window.Capacitor && window.Capacitor.isNativePlatform());

  try {
    if (isNative) {
      // Direct FormData upload via backend endpoint to bypass client-side CORS blocks on R2 bucket
      const formData = new FormData();
      formData.append('media', file);
      if (portalId) {
        formData.append('portalId', portalId);
      }
      
      const response = await axios.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      return response.data.mediaKey;
    }

    // Web / Desktop browser direct upload flow
    const { data: { uploadUrl, mediaKey } } = await axios.post('/api/media/presigned-url', {
      fileName: file.name || `${purpose}.jpg`,
      fileType: file.type,
      fileSize: file.size,
      purpose,
      portalId
    });

    const cleanAxios = axios.create();
    if (cleanAxios.defaults.headers.common) {
      delete cleanAxios.defaults.headers.common['Authorization'];
    }

    const response = await cleanAxios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return mediaKey;
  } catch (error) {
    console.error('Upload Error:', error);
    throw new Error(error.message || 'Dosya yüklenemedi. Lütfen tekrar deneyin.');
  }
};
