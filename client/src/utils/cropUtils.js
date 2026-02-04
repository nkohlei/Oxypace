export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // Only set crossOrigin for remote URLs, not data URIs or local blobs
        if (url.startsWith('http')) {
            image.setAttribute('crossOrigin', 'anonymous');
        }
        image.src = url;
    });

export async function getCroppedImg(imageSrc, pixelCrop) {
    if (!imageSrc || !pixelCrop) {
        throw new Error('Missing image source or crop data');
    }

    try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        // Safe rounding of coordinates
        const safeArea = {
            width: Math.floor(pixelCrop.width),
            height: Math.floor(pixelCrop.height),
            x: Math.floor(pixelCrop.x),
            y: Math.floor(pixelCrop.y)
        };

        // Safety check for empty dimensions
        if (safeArea.width === 0 || safeArea.height === 0) {
            throw new Error("Crop selection is too small");
        }

        // Check for max canvas size to prevent browser crashes on huge images
        // Limit to 4096px max dimension (4K) which is plenty for profile/cover
        const MAX_DIMENSION = 4096;
        let scale = 1;

        if (safeArea.width > MAX_DIMENSION || safeArea.height > MAX_DIMENSION) {
            const maxSide = Math.max(safeArea.width, safeArea.height);
            scale = MAX_DIMENSION / maxSide;
            console.warn(`Image too large, downscaling by ${scale.toFixed(2)}`);
        }

        // Set width/height
        canvas.width = safeArea.width * scale;
        canvas.height = safeArea.height * scale;

        // Draw the cropped image with potential scaling
        ctx.drawImage(
            image,
            safeArea.x,
            safeArea.y,
            safeArea.width,
            safeArea.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Convert to Blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((file) => {
                if (!file) {
                    // Try verbose error logic if possible, or usually this means tainted canvas or 0 size
                    reject(new Error('Canvas toBlob failed (empty result). Image might be too large or corrupted.'));
                    return;
                }
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    } catch (e) {
        console.error("Error in getCroppedImg:", e);
        throw e;
    }
}
