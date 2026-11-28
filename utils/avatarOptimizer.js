import sharp from 'sharp';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import { constructProxiedUrl } from './mediaConfig.js';
import path from 'path';

/**
 * Downloads a file from R2, resizes it using sharp to medium (300x300) and thumbnail (80x80)
 * in WebP format, and uploads the variations back to R2.
 * Works with both file buffer (direct upload) and R2 media key (presigned url).
 * 
 * @param {string|object} mediaKeyOrFile - R2 key string or multer file object
 * @returns {Promise<object>} URLs of the processed images
 */
export async function processAndUploadMultiResAvatars(mediaKeyOrFile) {
    let inputBuffer;
    let originalKey;

    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';

    if (typeof mediaKeyOrFile === 'string') {
        originalKey = mediaKeyOrFile;
        // Download original from R2
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: originalKey,
        });
        const r2Response = await r2.send(getCommand);
        const chunks = [];
        for await (const chunk of r2Response.Body) {
            chunks.push(chunk);
        }
        inputBuffer = Buffer.concat(chunks);
    } else if (mediaKeyOrFile && mediaKeyOrFile.buffer) {
        inputBuffer = mediaKeyOrFile.buffer;
        originalKey = mediaKeyOrFile.key;
    } else {
        throw new Error('Invalid avatar file or key provided');
    }

    // Determine the directory and name parts
    const parsedPath = path.parse(originalKey);
    const folder = parsedPath.dir || 'avatars';
    const baseName = parsedPath.name;

    const isGif = parsedPath.ext?.toLowerCase() === '.gif' ||
                  (mediaKeyOrFile && mediaKeyOrFile.mimetype === 'image/gif') ||
                  (inputBuffer && inputBuffer.length >= 3 && inputBuffer.toString('utf8', 0, 3) === 'GIF');

    // GIF animation protection: Do not convert animated GIFs to static WebP thumbnails
    if (isGif) {
        const originalUrl = constructProxiedUrl(originalKey);
        return {
            original: originalUrl,
            medium: originalUrl,
            thumbnail: originalUrl,
            lowRes: originalUrl
        };
    }

    // Initialize sharp
    const sharpInstance = sharp(inputBuffer);

    // Generate medium: 300x300px, WebP, 80% quality
    const mediumBuffer = await sharpInstance
        .clone()
        .resize(300, 300, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 80 })
        .toBuffer();

    // Generate thumbnail: 80x80px, WebP, 60% quality (Balanced resolution & file size)
    const thumbnailBuffer = await sharpInstance
        .clone()
        .resize(80, 80, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 60 })
        .toBuffer();

    // Generate low_res: 150x150px, WebP, 50% quality
    const lowResBuffer = await sharpInstance
        .clone()
        .resize(150, 150, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 50 })
        .toBuffer();

    const mediumKey = `${folder}/${baseName}-medium.webp`;
    const thumbnailKey = `${folder}/${baseName}-thumbnail.webp`;
    const lowResKey = `${folder}/${baseName}-lowres.webp`;

    // Upload variations to R2
    const uploadParams = [
        { Key: mediumKey, Body: mediumBuffer, ContentType: 'image/webp' },
        { Key: thumbnailKey, Body: thumbnailBuffer, ContentType: 'image/webp' },
        { Key: lowResKey, Body: lowResBuffer, ContentType: 'image/webp' }
    ];

    for (const param of uploadParams) {
        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: param.Key,
            ContentType: param.ContentType,
            Body: param.Body,
        });
        await r2.send(putCommand);
    }

    return {
        original: constructProxiedUrl(originalKey),
        medium: constructProxiedUrl(mediumKey),
        thumbnail: constructProxiedUrl(thumbnailKey),
        lowRes: constructProxiedUrl(lowResKey)
    };
}

/**
 * Optimizes a user cover or portal banner image into a crisp, lightweight WebP
 * (max 1280x480 inside, quality 82, ~40-120 KB instead of 5-15 MB raw PNG/JPG).
 * Preserves animated GIFs and gracefully falls back to the original R2 object on error.
 */
export async function processAndUploadOptimizedBanner(mediaKeyOrFile) {
    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
    let originalKey = typeof mediaKeyOrFile === 'string'
        ? mediaKeyOrFile
        : (mediaKeyOrFile?.key || '');

    if (!originalKey) {
        throw new Error('Invalid banner file or key provided');
    }

    const parsedPath = path.parse(originalKey);
    const folder = parsedPath.dir || 'banners';
    const baseName = parsedPath.name;
    const extLower = (parsedPath.ext || '').toLowerCase();

    // Keep animated GIFs or already-optimized banner WebPs untouched
    if (extLower === '.gif' || baseName.endsWith('-banner')) {
        return constructProxiedUrl(originalKey);
    }

    try {
        let inputBuffer = mediaKeyOrFile?.buffer || null;
        if (!inputBuffer) {
            const r2Response = await r2.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: originalKey,
            }));
            const chunks = [];
            for await (const chunk of r2Response.Body) {
                chunks.push(chunk);
            }
            inputBuffer = Buffer.concat(chunks);
        }

        // Extra GIF magic-bytes guard
        if (inputBuffer.length >= 3 && inputBuffer.toString('utf8', 0, 3) === 'GIF') {
            return constructProxiedUrl(originalKey);
        }

        const bannerBuffer = await sharp(inputBuffer)
            .rotate()
            .resize(1280, 480, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

        const bannerKey = `${folder}/${baseName}-banner.webp`;
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: bannerKey,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
            Body: bannerBuffer,
        }));

        return constructProxiedUrl(bannerKey);
    } catch (err) {
        console.warn('[BannerOptimizer] Falling back to original banner:', err.message);
        return constructProxiedUrl(originalKey);
    }
}
