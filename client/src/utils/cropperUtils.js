/**
 * cropperUtils.js - Sıfırdan Canvas API ile görsel kırpma yardımcı fonksiyonları
 */

/**
 * Görsel yükler ve bir Image objesi döndürür
 * @param {string} src - Base64 veya URL
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Görsel yüklenemedi'));
        img.src = src;
    });
}

/**
 * Görseli kırpar ve Blob olarak döndürür
 * @param {HTMLImageElement} image - Kaynak görsel
 * @param {Object} crop - Kırpma alanı {x, y, width, height}
 * @param {number} zoom - Zoom seviyesi
 * @param {Object} position - Görsel pozisyonu {x, y}
 * @param {Object} outputSize - Çıktı boyutu {width, height}
 * @returns {Promise<Blob>}
 */
export async function cropImage(image, crop, zoom, position, outputSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas context oluşturulamadı');
    }

    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    // Görselin zoom ve pozisyona göre hesaplanmış kaynak koordinatları
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;

    // Kırpma alanının görsel üzerindeki gerçek koordinatları
    const sourceX = (crop.x - position.x) / zoom;
    const sourceY = (crop.y - position.y) / zoom;
    const sourceWidth = crop.width / zoom;
    const sourceHeight = crop.height / zoom;

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize.width,
        outputSize.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Görsel oluşturulamadı'));
                }
            },
            'image/jpeg',
            0.98 // High quality for sharp images
        );
    });
}

/**
 * Görselin container'a sığması için gereken başlangıç zoom ve pozisyonu hesaplar
 * @param {number} imageWidth 
 * @param {number} imageHeight 
 * @param {number} containerWidth 
 * @param {number} containerHeight 
 * @returns {{zoom: number, x: number, y: number}}
 */
export function calculateInitialFit(imageWidth, imageHeight, containerWidth, containerHeight) {
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;

    let zoom;
    if (imageAspect > containerAspect) {
        // Görsel daha geniş, yüksekliğe göre sığdır
        zoom = containerHeight / imageHeight;
    } else {
        // Görsel daha uzun, genişliğe göre sığdır
        zoom = containerWidth / imageWidth;
    }

    // Görseli ortala
    const scaledWidth = imageWidth * zoom;
    const scaledHeight = imageHeight * zoom;
    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;

    return { zoom, x, y };
}

/**
 * Pozisyonu sınırlar içinde tutar (görsel kırpma alanını aşmasın)
 * @param {Object} position 
 * @param {Object} imageSize 
 * @param {number} zoom 
 * @param {Object} cropArea 
 * @returns {Object}
 */
export function clampPosition(position, imageSize, zoom, cropArea) {
    const scaledWidth = imageSize.width * zoom;
    const scaledHeight = imageSize.height * zoom;

    // Minimum: görsel kırpma alanının sağ/alt kenarını geçmemeli
    // Maximum: görsel kırpma alanının sol/üst kenarını geçmemeli
    const minX = cropArea.x + cropArea.width - scaledWidth;
    const maxX = cropArea.x;
    const minY = cropArea.y + cropArea.height - scaledHeight;
    const maxY = cropArea.y;

    return {
        x: Math.min(Math.max(position.x, minX), maxX),
        y: Math.min(Math.max(position.y, minY), maxY)
    };
}
