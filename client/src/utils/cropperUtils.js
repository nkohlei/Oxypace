/**
 * cropperUtils.js - Profesyonel, kararlı ve merkez odaklı görsel kırpma motoru
 */

/**
 * Görsel yükler ve HTMLImageElement döndürür
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
 * 90 derecelik rotasyon açısına göre etkin (rotated) boyutları döndürür
 * @param {number} width - Orijinal genişlik
 * @param {number} height - Orijinal yükseklik
 * @param {number} rotation - Derece (0, 90, 180, 270)
 * @returns {{width: number, height: number}}
 */
export function getRotatedDimensions(width, height, rotation = 0) {
    const normAngle = ((rotation % 360) + 360) % 360;
    const is90or270 = normAngle === 90 || normAngle === 270;
    return {
        width: is90or270 ? height : width,
        height: is90or270 ? width : height,
    };
}

/**
 * Görselin kırpma alanını (cropSize) her iki eksende tamamen kaplaması için gereken asgari ölçeği hesaplar
 * @param {number} naturalWidth - Orijinal genişlik
 * @param {number} naturalHeight - Orijinal yükseklik
 * @param {number} cropWidth - Kırpma alanı genişliği
 * @param {number} cropHeight - Kırpma alanı yüksekliği
 * @param {number} rotation - Derece (0, 90, 180, 270)
 * @returns {number}
 */
export function getMinScale(naturalWidth, naturalHeight, cropWidth, cropHeight, rotation = 0) {
    const { width: effWidth, height: effHeight } = getRotatedDimensions(naturalWidth, naturalHeight, rotation);
    if (!effWidth || !effHeight) return 1;
    return Math.max(cropWidth / effWidth, cropHeight / effHeight);
}

/**
 * Görsel merkezinin kırpma alanı merkezine göre deplasmanını (offset),
 * görselin kırpma alanını terk etmeyeceği (boşluk kalmayacağı) sınırlar içinde tutar.
 *
 * @param {{x: number, y: number}} offset - İstenen deplasman
 * @param {number} naturalWidth - Orijinal görsel genişliği
 * @param {number} naturalHeight - Orijinal görsel yüksekliği
 * @param {number} scale - Geçerli zoom katsayısı
 * @param {number} cropWidth - Kırpma alanı genişliği
 * @param {number} cropHeight - Kırpma alanı yüksekliği
 * @param {number} rotation - Derece (0, 90, 180, 270)
 * @returns {{x: number, y: number}}
 */
export function clampOffset(offset, naturalWidth, naturalHeight, scale, cropWidth, cropHeight, rotation = 0) {
    const { width: effWidth, height: effHeight } = getRotatedDimensions(naturalWidth, naturalHeight, rotation);

    const renderedWidth = effWidth * scale;
    const renderedHeight = effHeight * scale;

    // Görsel kırpma alanından büyük veya eşit olduğunda serbest hareket payı:
    const maxOffsetX = Math.max(0, (renderedWidth - cropWidth) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - cropHeight) / 2);

    return {
        x: Math.min(Math.max(offset.x, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(offset.y, -maxOffsetY), maxOffsetY),
    };
}

/**
 * Orijinal görseli doğrudan hedef canvas'a merkez odaklı transformasyon ile kayıpsız çizer ve JPEG Blob döndürür.
 *
 * @param {HTMLImageElement} image - Orijinal kaynak görsel
 * @param {{width: number, height: number}} cropSize - Kırpma vizörü boyutları
 * @param {number} scale - Zoom katsayısı
 * @param {{x: number, y: number}} offset - Görselin merkez deplasmanı
 * @param {number} rotation - Rotasyon açısı (derece)
 * @param {{width: number, height: number}} outputSize - Çıktı çözünürlüğü (örn. 512x512)
 * @returns {Promise<Blob>}
 */
export async function cropImage(image, cropSize, scale, offset, rotation = 0, outputSize = { width: 512, height: 512 }) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas context oluşturulamadı');
    }

    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    // En yüksek kalitede ölçekleme yumuşatma
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Ekran vizörü ile çıktı canvas'ı arasındaki ölçek katsayısı
    const k = outputSize.width / cropSize.width;

    // Canvas merkezine git
    ctx.translate(outputSize.width / 2, outputSize.height / 2);

    // Merkez deplasmanını çıktı ölçeğiyle uygula
    ctx.translate(offset.x * k, offset.y * k);

    // Döndürmeyi uygula
    const normAngle = ((rotation % 360) + 360) % 360;
    ctx.rotate((normAngle * Math.PI) / 180);

    // Zoom ölçeğini uygula
    ctx.scale(scale * k, scale * k);

    // Orijinal görseli kendi merkezine göre çiz
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    ctx.drawImage(image, -w / 2, -h / 2, w, h);

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
            0.98
        );
    });
}
