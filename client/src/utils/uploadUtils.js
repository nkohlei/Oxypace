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
      const fileToBase64 = (f) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };

      const base64Data = await fileToBase64(file);
      
      const response = await axios.post('/api/media/upload', {
        base64Data,
        fileName: file.name || `${purpose}-${Date.now()}.jpg`,
        mimeType: file.type || 'image/jpeg',
        purpose,
        portalId
      }, {
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
