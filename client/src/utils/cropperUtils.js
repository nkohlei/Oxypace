/**
 * cropperUtils.js - Profesyonel, kararlı ve merkez odaklı görsel kırpma motoru
 * Derece cinsinden keyfi rotasyon (arbitrary degree rotation) desteği içerir.
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
 * Belirtilen dereceye göre kırpma alanının görsel eksenlerindeki projeksiyonunu hesaplar
 * ve görselin kırpma alanını (cropSize) tamamen kaplaması için gereken asgari ölçeği döndürür.
 *
 * @param {number} naturalWidth - Orijinal genişlik
 * @param {number} naturalHeight - Orijinal yükseklik
 * @param {number} cropWidth - Kırpma alanı genişliği
 * @param {number} cropHeight - Kırpma alanı yüksekliği
 * @param {number} rotation - Derece cinsinden rotasyon açısı
 * @returns {number}
 */
export function getMinScale(naturalWidth, naturalHeight, cropWidth, cropHeight, rotation = 0) {
    if (!naturalWidth || !naturalHeight) return 1;

    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    // Görsel koordinatlarında kırpma kutusunun kapsayan kutusu (bounding box):
    const requiredWidth = cropWidth * cos + cropHeight * sin;
    const requiredHeight = cropWidth * sin + cropHeight * cos;

    return Math.max(requiredWidth / naturalWidth, requiredHeight / naturalHeight);
}

/**
 * Görsel merkezinin kırpma alanına göre deplasmanını (offset),
 * istenen herhangi bir açıda (derece) kırpma kutusunun dışına taşmayacak şekilde sınırlar.
 *
 * @param {{x: number, y: number}} offset - Ekran koordinatlarında istenen deplasman
 * @param {number} naturalWidth - Orijinal görsel genişliği
 * @param {number} naturalHeight - Orijinal görsel yüksekliği
 * @param {number} scale - Zoom katsayısı
 * @param {number} cropWidth - Kırpma alanı genişliği
 * @param {number} cropHeight - Kırpma alanı yüksekliği
 * @param {number} rotation - Derece cinsinden rotasyon açısı
 * @returns {{x: number, y: number}}
 */
export function clampOffset(offset, naturalWidth, naturalHeight, scale, cropWidth, cropHeight, rotation = 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const absCos = Math.abs(cos);
    const absSin = Math.abs(sin);

    // Kırpma alanının görsel eksenlerindeki etkin boyutu
    const boundingCropW = cropWidth * absCos + cropHeight * absSin;
    const boundingCropH = cropWidth * absSin + cropHeight * absCos;

    const scaledW = naturalWidth * scale;
    const scaledH = naturalHeight * scale;

    const maxImgX = Math.max(0, (scaledW - boundingCropW) / 2);
    const maxImgY = Math.max(0, (scaledH - boundingCropH) / 2);

    // Ekran deplasmanını görsel koordinat sistemine dönüştür (R(-theta))
    const imgOffsetX = offset.x * cos + offset.y * sin;
    const imgOffsetY = -offset.x * sin + offset.y * cos;

    // Görsel eksenlerinde sınırla
    const clampedImgX = Math.min(Math.max(imgOffsetX, -maxImgX), maxImgX);
    const clampedImgY = Math.min(Math.max(imgOffsetY, -maxImgY), maxImgY);

    // Tekrar ekran koordinat sistemine dönüştür (R(theta))
    const screenOffsetX = clampedImgX * cos - clampedImgY * sin;
    const screenOffsetY = clampedImgX * sin + clampedImgY * cos;

    return {
        x: screenOffsetX,
        y: screenOffsetY,
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
    const rad = (rotation * Math.PI) / 180;
    ctx.rotate(rad);

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
