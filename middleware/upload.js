import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

const storage = multer.memoryStorage();

const multerInstance = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
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
        try {
            let pipeline = sharp(file.buffer);
            const metadata = await pipeline.metadata();
            
            // Limit max width to 1200px
            if (metadata.width && metadata.width > 1200) {
                pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
            }
            
            // Convert to webp with 75% quality
            uploadBuffer = await pipeline.webp({ quality: 75 }).toBuffer();
            contentType = 'image/webp';
            key = `${folder}/${file.fieldname}-${uniqueSuffix}.webp`;
            
            file.mimetype = 'image/webp';
            file.size = uploadBuffer.length;
        } catch (err) {
            console.error('Sharp optimization failed, uploading original image:', err);
            const ext = path.extname(file.originalname).toLowerCase();
            key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
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
            console.log('[Upload Middleware] Uploading video directly to R2...');
            
            const cleanFieldName = file.fieldname || 'media';
            const originalKey = `${folder}/original_${cleanFieldName}-${uniqueSuffix}.mp4`;
            const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
            
            // Upload original video to R2 immediately — no local temp file dependency
            await r2.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: originalKey,
                ContentType: 'video/mp4',
                Body: file.buffer,
            }));
            
            const originalUrl = constructProxiedUrl(originalKey);
            file.key = originalKey;
            // Both qualities point to the original until background transcoding completes
            file.videoQualities = {
                high: originalUrl,
                low: originalUrl
            };
            file.mimetype = 'video/mp4';
            file.size = file.buffer.length;
            
            console.log(`[Upload Middleware] Video successfully uploaded to R2: ${originalKey}`);
            
            // Also save to local temp for background transcoding (best-effort, non-blocking)
            try {
                const tempDir = path.join(process.cwd(), 'temp_media');
                fs.mkdirSync(tempDir, { recursive: true });
                const tempFilePath = path.join(tempDir, `original_${cleanFieldName}-${uniqueSuffix}.mp4`);
                fs.writeFileSync(tempFilePath, file.buffer);
                console.log(`[Upload Middleware] Temp copy written for transcoding: ${tempFilePath}`);
            } catch (tempErr) {
                // Non-fatal: video is already on R2, transcoding will download it if needed
                console.warn('[Upload Middleware] Could not write temp copy (non-fatal):', tempErr.message);
            }
        } catch (err) {
            console.error('[Upload Middleware] Video R2 upload failed:', err);
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
