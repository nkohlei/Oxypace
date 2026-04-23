import axios from 'axios';

/**
 * Uploads a file directly to Cloudflare R2 using a presigned URL.
 * @param {File|Blob} file - The file object to upload.
 * @param {string} purpose - The purpose of the upload (post, avatar, banner, cover, message, comment).
 * @param {string} portalId - Optional portal ID for folder organization.
 * @returns {Promise<string>} - The key (path) of the uploaded file in R2.
 */
export const uploadFile = async (file, purpose = 'post', portalId = null) => {
  if (!file) return null;

  try {
    // 1. Get Presigned URL from Backend
    const { data: { uploadUrl, mediaKey } } = await axios.post('/api/media/presigned-url', {
      fileName: file.name || `${purpose}.jpg`,
      fileType: file.type,
      fileSize: file.size,
      purpose,
      portalId
    });

    // 2. Upload directly to R2 using PUT
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    return mediaKey;
  } catch (error) {
    console.error('Direct Upload Error:', error);
    throw new Error(error.message || 'Dosya yüklenemedi. Lütfen tekrar deneyin.');
  }
};
