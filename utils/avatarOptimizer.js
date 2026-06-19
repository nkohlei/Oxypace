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

    // Initialize sharp
    const sharpInstance = sharp(inputBuffer);

    // Generate medium: 300x300px, WebP, 80% quality
    const mediumBuffer = await sharpInstance
        .clone()
        .resize(300, 300, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 80 })
        .toBuffer();

    // Generate thumbnail: 40x40px, WebP, 40% quality (Aggressive micro-downgrade)
    const thumbnailBuffer = await sharpInstance
        .clone()
        .resize(40, 40, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 40 })
        .toBuffer();

    const mediumKey = `${folder}/${baseName}-medium.webp`;
    const thumbnailKey = `${folder}/${baseName}-thumbnail.webp`;

    // Upload variations to R2
    const uploadParams = [
        { Key: mediumKey, Body: mediumBuffer, ContentType: 'image/webp' },
        { Key: thumbnailKey, Body: thumbnailBuffer, ContentType: 'image/webp' }
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
        thumbnail: constructProxiedUrl(thumbnailKey)
    };
}
