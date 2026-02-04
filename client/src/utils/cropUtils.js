export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
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

        // Set width/height to the cropped area size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert to Blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((file) => {
                if (!file) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                // Fix: preserve file type if possible, or default to jpeg with high quality
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    } catch (e) {
        console.error("Error in getCroppedImg:", e);
        throw e;
    }
}
