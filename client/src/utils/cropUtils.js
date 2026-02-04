export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // Important: Handle cross-origin images for canvas
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export async function getCroppedImg(imageSrc, pixelCrop) {
    if (!imageSrc || !pixelCrop) {
        throw new Error("Görsel veya kırpma verisi eksik.");
    }

    try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error("Canvas context oluşturulamadı.");

        // Set proper canvas dimensions
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw image
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

        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((file) => {
                if (!file) {
                    reject(new Error("Canvas boş çıktı (toBlob failed)."));
                    return;
                }
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    } catch (e) {
        console.error("Kırpma hatası (cropUtils):", e);
        // Throw a user-friendly error
        throw new Error(e.message || "Görsel işlenirken teknik bir hata oluştu.");
    }
}
