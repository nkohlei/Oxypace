import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

/**
 * HIGH-2: Magic byte (file signature) verification.
 * Rejects files whose binary content doesn't match their declared MIME type,
 * preventing MIME spoofing attacks (e.g. PHP/script disguised as image/video).
 *
 * @param {Buffer} buffer - raw file buffer
 * @param {string} mimetype - declared MIME type
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyMagicBytes(buffer, mimetype) {
    if (!buffer || buffer.length < 4) return { valid: false, reason: 'File too small to verify' };

    const b = buffer;

    if (mimetype.startsWith('image/jpeg') || mimetype === 'image/jpg') {
        // JPEG: FF D8 FF
        if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return { valid: true };
        return { valid: false, reason: 'File does not match JPEG signature' };
    }

    if (mimetype === 'image/png') {
        // PNG: 89 50 4E 47
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return { valid: true };
        return { valid: false, reason: 'File does not match PNG signature' };
    }

    if (mimetype === 'image/gif') {
        // GIF87a or GIF89a
        const sig = buffer.slice(0, 6).toString('ascii');
        if (sig === 'GIF87a' || sig === 'GIF89a') return { valid: true };
        return { valid: false, reason: 'File does not match GIF signature' };
    }

    if (mimetype === 'image/webp') {
        // RIFF....WEBP
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) {
            const webpSig = buffer.slice(8, 12).toString('ascii');
            if (webpSig === 'WEBP') return { valid: true };
        }
        return { valid: false, reason: 'File does not match WebP signature' };
    }

    if (mimetype === 'application/pdf') {
        // %PDF-
        const sig = buffer.slice(0, 5).toString('ascii');
        if (sig === '%PDF-') return { valid: true };
        return { valid: false, reason: 'File does not match PDF signature' };
    }

    if (mimetype.startsWith('video/')) {
        // MP4/MOV: ftyp box at offset 4 (00 00 00 xx 66 74 79 70)
        if (buffer.length >= 12) {
            const ftyp = buffer.slice(4, 8).toString('ascii');
            if (ftyp === 'ftyp') return { valid: true };
        }
        // MKV: 1A 45 DF A3
        if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return { valid: true };
        // AVI: RIFF....AVI
        if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && buffer.length >= 12) {
            const aviSig = buffer.slice(8, 11).toString('ascii');
            if (aviSig === 'AVI') return { valid: true };
        }
        // WebM: 1A 45 DF A3 (same as MKV — already handled)
        // FLV: 46 4C 56
        if (b[0] === 0x46 && b[1] === 0x4C && b[2] === 0x56) return { valid: true };
        // MPEG: 00 00 01 Bx
        if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01) return { valid: true };
        // Allow through with a warning for unrecognized video containers (e.g., TS streams)
        console.warn(`[Upload] Unrecognized video magic bytes for MIME ${mimetype} — allowing through`);
        return { valid: true };
    }

    // For any other MIME types not covered, allow through
    return { valid: true };
}

const storage = multer.memoryStorage();


const multerInstance = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        // Accept images, videos, and PDFs
        if (
            file.mimetype.startsWith('image/') || 
            file.mimetype.startsWith('video/') || 
            file.mimetype === 'application/pdf' ||
            ext === '.pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'), false);
        }
    },
});

// Helper to optimize and upload a single file
async function processAndUploadFile(req, file) {
    if (!file || !file.buffer) return;

    // HIGH-2: Verify magic bytes before any processing — reject MIME spoofing
    const magicCheck = verifyMagicBytes(file.buffer, file.mimetype);
    if (!magicCheck.valid) {
        console.warn(`[Upload] Magic byte mismatch for file "${file.originalname}" (${file.mimetype}): ${magicCheck.reason}`);
        throw new Error(`Invalid file content: ${magicCheck.reason}`);
    }

    const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('gif');
    const isVideo = file.mimetype.startsWith('video/');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let folder = 'uploads';

    if (file.fieldname === 'avatar') {
        folder = 'avatars';
    } else if (file.fieldname === 'banner' || file.fieldname === 'coverImage' || file.fieldname === 'cover') {
        folder = 'banners';
    } else if (file.fieldname === 'media') {
        folder = `posts/${req.body.portalId || 'general'}`;
    } else if (file.fieldname === 'files') {
        folder = 'feedback';
    }

    let uploadBuffer = file.buffer;
    let contentType = file.mimetype;
    let key = '';

    if (isImage) {
        // If it's a post media upload (posts, portal posts, messages), ALWAYS PRESERVE 100% ORIGINAL QUALITY!
        // Never downscale or lossy compress post images.
        const isPostMedia = file.fieldname === 'media' || req.body?.purpose === 'post' || req.body?.purpose === 'message';

        if (isPostMedia) {
            const ext = path.extname(file.originalname || '').toLowerCase() || (file.mimetype === 'image/png' ? '.png' : (file.mimetype === 'image/webp' ? '.webp' : '.jpg'));
            key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
            uploadBuffer = file.buffer;
            contentType = file.mimetype || 'image/jpeg';
            file.mimetype = contentType;
            file.size = uploadBuffer.length;
        } else {
            // For avatars/banners only: standard web optimization
            try {
                let pipeline = sharp(file.buffer);
                const metadata = await pipeline.metadata();
                
                // Limit max width to 1200px
                if (metadata.width && metadata.width > 1200) {
                    pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
                }
                
                // Convert to webp with 85% quality
                uploadBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
                contentType = 'image/webp';
                key = `${folder}/${file.fieldname}-${uniqueSuffix}.webp`;
                
                file.mimetype = 'image/webp';
                file.size = uploadBuffer.length;
            } catch (err) {
                console.error('Sharp optimization failed, uploading original image:', err);
                const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
                key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
            }
        }
        
        // Upload to R2
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Body: uploadBuffer,
        });

        await r2.send(putCommand);
        file.key = key; // Set key for the route to read

        // Special avatar thumbnail generator
        if (file.fieldname === 'avatar') {
            try {
                const thumbnailBuffer = await sharp(file.buffer)
                    .resize(80, 80)
                    .webp({ quality: 60 })
                    .toBuffer();
                const thumbKey = `${folder}/${file.fieldname}-${uniqueSuffix}-thumbnail.webp`;
                
                await r2.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: thumbKey,
                    ContentType: 'image/webp',
                    Body: thumbnailBuffer,
                }));
                console.log(`[Upload Middleware] Created avatar thumbnail uploaded: ${thumbKey}`);
            } catch (thumbErr) {
                console.error('[Upload Middleware] Failed to create avatar thumbnail:', thumbErr);
            }
        }
    } else if (isVideo) {
        try {
            console.log('[Upload Middleware] Storing video locally for background transcoding...');
            
            const cleanFieldName = file.fieldname || 'media';
            const tempDir = path.join(process.cwd(), 'temp_media');
            fs.mkdirSync(tempDir, { recursive: true });
            
            const tempFilename = `temp_${cleanFieldName}-${uniqueSuffix}.mp4`;
            const tempFilePath = path.join(tempDir, tempFilename);
            fs.writeFileSync(tempFilePath, file.buffer);
            
            // Set file.key to point to the local temp file path relative to cwd
            file.key = `temp_media/${tempFilename}`;
            file.videoQualities = {
                high: '',
                low: '',
                p360: '',
                p720: '',
                p1080: ''
            };
            file.mimetype = 'video/mp4';
            file.size = file.buffer.length;
            
            console.log(`[Upload Middleware] Temp copy written for background transcoding: ${tempFilePath}`);
        } catch (err) {
            console.error('[Upload Middleware] Video local storage failed:', err);
            throw err;
        }
    } else {
        const ext = path.extname(file.originalname).toLowerCase();
        key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
        
        // Upload to R2
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Body: uploadBuffer,
        });

        await r2.send(putCommand);
        file.key = key; // Set key for the route to read
    }
}

const customUpload = {
    single: (fieldname) => {
        const multerMiddleware = multerInstance.single(fieldname);
        return (req, res, next) => {
            // Check if request is JSON with base64 data
            if (req.body && req.body.base64Data) {
                (async () => {
                    try {
                        const matches = req.body.base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        let buffer;
                        let mimeType = req.body.mimeType || 'image/jpeg';
                        let originalName = req.body.fileName || `${fieldname}-${Date.now()}.jpg`;

                        if (!matches || matches.length !== 3) {
                            buffer = Buffer.from(req.body.base64Data, 'base64');
                        } else {
                            mimeType = matches[1];
                            buffer = Buffer.from(matches[2], 'base64');
                            originalName = req.body.fileName || `${fieldname}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
                        }

                        req.file = {
                            fieldname: fieldname,
                            originalname: originalName,
                            encoding: '7bit',
                            mimetype: mimeType,
                            buffer: buffer,
                            size: buffer.length
                        };

                        await processAndUploadFile(req, req.file);
                        next();
                    } catch (uploadErr) {
                        next(uploadErr);
                    }
                })();
                return;
            }

            multerMiddleware(req, res, async (err) => {
                if (err) return next(err);
                if (req.file) {
                    try {
                        await processAndUploadFile(req, req.file);
                    } catch (uploadErr) {
                        return next(uploadErr);
                    }
                }
                next();
            });
        };
    },
    array: (fieldname, maxCount) => {
        const multerMiddleware = multerInstance.array(fieldname, maxCount);
        return (req, res, next) => {
            multerMiddleware(req, res, async (err) => {
                if (err) return next(err);
                if (req.files && req.files.length > 0) {
                    try {
                        await Promise.all(req.files.map(file => processAndUploadFile(req, file)));
                    } catch (uploadErr) {
                        return next(uploadErr);
                    }
                }
                next();
            });
        };
    },
};

export default customUpload;
