import express from 'express';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { protect as auth } from '../middleware/auth.js';

import axios from 'axios';
import multer from 'multer';
import sharp from 'sharp';
import r2 from '../config/r2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Memory storage for GIF processing (no disk write needed)
const gifUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(new Error('Sadece GIF dosyaları kabul edilir'), false);
        }
    },
});

/**
 * @route   GET /api/media/*
 * @desc    Smart Media Resolver. 
 *          1. External URLs: Proxies them to bypass Hotlinking/CORS.
 *          2. R2 Keys (Images): Redirects to Cloudflare Edge for speed.
 *          3. R2 Keys (Video/Audio): Proxies with Range support for decoding.
 * @access  Public
 */
router.post('/presigned-url', auth, async (req, res) => {
    try {
        const { fileName, fileType, fileSize, purpose } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ message: 'File name and type are required' });
        }

        // Validate file size (1GB max)
        const MAX_SIZE = 1024 * 1024 * 1024;
        if (fileSize && fileSize > MAX_SIZE) {
            return res.status(400).json({ message: "Dosya boyutu 1 GB'dan büyük olamaz." });
        }

        // Generate unique key
        let folder = 'uploads';
        if (purpose === 'avatar') {
            folder = 'avatars';
        } else if (purpose === 'banner' || purpose === 'cover') {
            folder = 'banners';
        } else if (purpose === 'post' || purpose === 'message' || purpose === 'comment') {
            folder = req.body.portalId ? `posts/${req.body.portalId}` : 'posts/general';
        } else if (purpose === 'video-quality') {
            // Browser-side WASM transcoded quality blobs land here.
            // Same folder as the parent post video for clean R2 organisation.
            folder = req.body.portalId ? `posts/${req.body.portalId}` : 'posts/general';
        } else if (purpose === 'feedback') {
            folder = 'feedback';
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(fileName) || (fileType.split('/')[1] ? `.${fileType.split('/')[1]}` : '');
        const fieldName = purpose || 'media';
        const key = `${folder}/${fieldName}-${uniqueSuffix}${ext}`;

        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: fileType,
        });

        // Generate the presigned URL for PUT
        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // Valid for 1 hour

        res.json({
            uploadUrl,
            mediaKey: key,
        });
    } catch (error) {
        console.error('Presigned URL Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate upload URL' });
    }
});

/**
 * @route   POST /api/media/process-gif
 * @desc    Crop animated GIF on backend using sharp (preserves animation).
 *          Accepts file directly via multipart/form-data to avoid a costly
 *          R2 download round-trip that caused 504 timeouts on Netlify.
 * @access  Private
 */
router.post('/process-gif', auth, (req, res, next) => {
    gifUpload.single('gif')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload hatası: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { sourceX, sourceY, sourceWidth, sourceHeight, rotation, purpose } = req.body;

        // Accept file either as direct upload (multipart) or fallback to R2 key
        let inputBuffer;

        if (req.file && req.file.buffer) {
            // Fast path: file sent directly in request body
            inputBuffer = req.file.buffer;
        } else if (req.body.mediaKey) {
            // Fallback: download from R2 (legacy / native app path)
            const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
            const getCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: req.body.mediaKey,
            });
            const r2Response = await r2.send(getCommand);
            const chunks = [];
            for await (const chunk of r2Response.Body) {
                chunks.push(chunk);
            }
            inputBuffer = Buffer.concat(chunks);
        } else {
            return res.status(400).json({ message: 'GIF dosyası veya mediaKey gerekli' });
        }

        // 1. Process with sharp (animated: true preserves all frames)
        const sharpInstance = sharp(inputBuffer, { animated: true });

        // Reuse the same instance for metadata (avoids double decode)
        const metadata = await sharpInstance.metadata();
        const originalWidth = metadata.width || 1;
        const originalHeight = metadata.height || 1;

        // Calculate effective dimensions after rotation
        const normalizedAngle = ((Number(rotation) % 360) + 360) % 360;
        const is90or270 = normalizedAngle === 90 || normalizedAngle === 270;
        const rotatedWidth = is90or270 ? originalHeight : originalWidth;
        const rotatedHeight = is90or270 ? originalWidth : originalHeight;

        // Build processing pipeline
        let pipeline = sharp(inputBuffer, { animated: true });

        if (normalizedAngle !== 0) {
            pipeline = pipeline.rotate(normalizedAngle);
        }

        // Clamp crop coordinates to image bounds (sharp requires integers)
        const cropLeft = Math.max(0, Math.round(Number(sourceX)));
        const cropTop  = Math.max(0, Math.round(Number(sourceY)));
        const cropWidth  = Math.max(1, Math.round(Number(sourceWidth)));
        const cropHeight = Math.max(1, Math.round(Number(sourceHeight)));

        const finalLeft   = Math.min(cropLeft,  rotatedWidth  - 1);
        const finalTop    = Math.min(cropTop,   rotatedHeight - 1);
        const finalWidth  = Math.min(cropWidth,  rotatedWidth  - finalLeft);
        const finalHeight = Math.min(cropHeight, rotatedHeight - finalTop);

        pipeline = pipeline.extract({
            left:   finalLeft,
            top:    finalTop,
            width:  finalWidth,
            height: finalHeight,
        });

        const outputBuffer = await pipeline.toBuffer();

        // 2. Upload processed GIF to R2
        const folder = purpose === 'avatar' ? 'avatars' : 'banners';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const processedKey = `${folder}/${purpose || 'cropped'}-${uniqueSuffix}.gif`;
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';

        const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: processedKey,
            ContentType: 'image/gif',
            Body: outputBuffer,
        });

        await r2.send(putCommand);

        res.json({ mediaKey: processedKey });

    } catch (error) {
        console.error('Process GIF Error:', error);
        res.status(500).json({ message: 'GIF işleme başarısız oldu: ' + error.message });
    }
});

/**
 * @route   POST /api/media/upload
 * @desc    Direct File Upload to Cloudflare R2 via Backend (Bypasses CORS on client side)
 * @access  Private
 */
router.post('/upload', auth, (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Lütfen yüklenecek bir dosya seçin.' });
        }
        res.json({
            mediaKey: req.file.key,
        });
    } catch (error) {
        console.error('Direct upload error:', error);
        res.status(500).json({ message: 'Dosya yükleme başarısız oldu.' });
    }
});

/**
 * @route   GET /api/media/*
 */
router.get('/*', async (req, res) => {
    try {
        let filePath = req.params[0];

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        // Decode URL if it was encoded (especially for absolute external URLs)
        try {
            filePath = decodeURIComponent(filePath);
        } catch (e) {
            // If decoding fails, continue with original
        }

        // --- CASE 1: EXTERNAL URL PROXYING (News Images, External GIFs) ---
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            console.log('🌐 Proxying External Media:', filePath);
            const range = req.headers.range;
            
            try {
                const response = await axios({
                    method: 'get',
                    url: filePath,
                    responseType: 'stream',
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        ...(range ? { 'Range': range } : {})
                    },
                    validateStatus: (status) => status < 500
                });

                // Forward status and essential headers
                res.status(response.status);
                res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
                res.set('Content-Length', response.headers['content-length']);
                res.set('Content-Range', response.headers['content-range']);
                res.set('Accept-Ranges', response.headers['accept-ranges'] || 'bytes');
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
                res.set('Cross-Origin-Resource-Policy', 'cross-origin');
                res.set('Cache-Control', 'public, max-age=31536000, immutable');
                res.set('Vary', 'Range');

                return response.data.pipe(res);
            } catch (proxyError) {
                console.error('❌ External Proxy Failed:', filePath, proxyError.message);
                return res.status(404).json({ message: 'External media not found' });
            }
        }

        // --- CASE 2: LOCAL STORAGE FALLBACK (Koyeb Persistent Volume / Local Dev) ---
        const localPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(localPath) && fs.lstatSync(localPath).isFile()) {
            console.log('📂 Serving Local Media:', filePath);
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            return res.sendFile(localPath);
        }

        // --- CASE 3: INTERNAL R2 BUCKET LOGIC ---
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        const r2Domain = process.env.R2_PUBLIC_DOMAIN;

        // SANITIZE: If filePath accidentally includes the domain (legacy/error), strip it
        if (r2Domain && filePath.includes(r2Domain)) {
            try {
                const url = new URL(filePath);
                filePath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
            } catch (e) {
                filePath = filePath.replace(r2Domain, '').replace(/^\/+/, '');
            }
        }

        const range = req.headers.range;

        // A. Video/Audio or Range Requests (Must be proxied for HTTP 206)
        if (range) {
            try {
                const headCommand = new HeadObjectCommand({ Bucket: bucketName, Key: filePath });
                const headResponse = await r2.send(headCommand);
                const totalSize = headResponse.ContentLength;

                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

                if (start >= totalSize) {
                    res.status(416).set('Content-Range', `bytes */${totalSize}`).send();
                    return;
                }

                const chunksize = (end - start) + 1;
                const getCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: filePath,
                    Range: `bytes=${start}-${end}`
                });

                const response = await r2.send(getCommand);
                
                // Determine the correct Content-Type
                let contentType = response.ContentType || 'video/mp4';
                const ext = filePath.split('.').pop().toLowerCase();
                if (['mp4', 'mov', 'm4v'].includes(ext)) contentType = 'video/mp4';
                else if (ext === 'webm') contentType = 'video/webm';
                else if (ext === 'ogg') contentType = 'video/ogg';

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Vary': 'Range'
                });

                return response.Body.pipe(res);
            } catch (headError) {
                if (headError.name === 'NotFound' || headError.name === 'NoSuchKey') return res.status(404).json({ message: 'File not found' });
                throw headError;
            }
        }

        // B. Standard R2 Images/Assets (Full Proxy to avoid Client-side SSL Errors)
        console.log('📷 Full R2 Proxy (SSL Fix):', filePath);
        const command = new GetObjectCommand({ Bucket: bucketName, Key: filePath });
        const response = await r2.send(command);

        res.set('Content-Type', response.ContentType || 'application/octet-stream');
        res.set('Content-Length', response.ContentLength);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Accept-Ranges', 'bytes');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');

        return response.Body.pipe(res);

    } catch (error) {
        console.error('Media Resolver Error:', error.message);
        if (error.name === 'NoSuchKey' || error.name === 'NotFound') return res.status(404).json({ message: 'File not found' });
        res.status(500).json({ message: 'Failed to resolve media' });
    }
});

export default router;
