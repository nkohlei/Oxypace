import express from 'express';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { protect as auth } from '../middleware/auth.js';

import axios from 'axios';
import upload from '../middleware/upload.js';
import multer from 'multer';
import sharp from 'sharp';
import r2 from '../config/r2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logActivity from '../utils/auditLogger.js';

import Post from '../models/Post.js';

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

// ── In-Memory Fast LRU Media Cache (Avatars, Thumbnails, Banners, Photos <= 8MB) ──
const MEDIA_CACHE = new Map();
const MAX_CACHE_ITEMS = 2000;
const MAX_CACHE_BYTES = 256 * 1024 * 1024; // 256 MB high-speed RAM cache limit
let currentCacheBytes = 0;

function getCachedMedia(key) {
    const item = MEDIA_CACHE.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        currentCacheBytes -= item.buffer.length;
        MEDIA_CACHE.delete(key);
        return null;
    }
    // Refresh LRU position
    MEDIA_CACHE.delete(key);
    MEDIA_CACHE.set(key, item);
    return item;
}

function setCachedMedia(key, { buffer, contentType, contentLength, etag }) {
    if (!buffer || buffer.length > 8 * 1024 * 1024) return;
    if (MEDIA_CACHE.has(key)) {
        currentCacheBytes -= MEDIA_CACHE.get(key).buffer.length;
        MEDIA_CACHE.delete(key);
    }
    while (MEDIA_CACHE.size >= MAX_CACHE_ITEMS || (currentCacheBytes + buffer.length) > MAX_CACHE_BYTES) {
        const oldestKey = MEDIA_CACHE.keys().next().value;
        if (!oldestKey) break;
        const oldest = MEDIA_CACHE.get(oldestKey);
        if (oldest && oldest.buffer) {
            currentCacheBytes -= oldest.buffer.length;
        }
        MEDIA_CACHE.delete(oldestKey);
    }
    MEDIA_CACHE.set(key, {
        buffer,
        contentType,
        contentLength,
        etag: etag || `"${Date.now()}"`,
        expiresAt: Date.now() + (6 * 60 * 60 * 1000) // 6 hours TTL
    });
    currentCacheBytes += buffer.length;
}

// ── In-Memory Fast Video Metadata Cache (Zero R2 roundtrip for Range byte seeks) ──
const VIDEO_META_CACHE = new Map();
const MAX_VIDEO_META_ITEMS = 5000;

function getVideoMetadata(key) {
    const item = VIDEO_META_CACHE.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
        VIDEO_META_CACHE.delete(key);
        return null;
    }
    return item;
}

function setVideoMetadata(key, totalSize, contentType) {
    if (VIDEO_META_CACHE.size >= MAX_VIDEO_META_ITEMS) {
        const oldestKey = VIDEO_META_CACHE.keys().next().value;
        if (oldestKey) VIDEO_META_CACHE.delete(oldestKey);
    }
    VIDEO_META_CACHE.set(key, {
        totalSize,
        contentType,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours TTL
    });
}

// ── In-Memory Fast Variant & Negative Caches (Eliminates repeated 404 roundtrips) ──
const VARIANT_RESOLVE_CACHE = new Map();
const MAX_VARIANT_CACHE = 10000;
const NEGATIVE_404_CACHE = new Map();
const NEGATIVE_CACHE_TTL = 180 * 1000; // 3 minutes negative cache

function getCachedVariant(key) {
    return VARIANT_RESOLVE_CACHE.get(key) || null;
}

function setCachedVariant(key, resolvedKey) {
    if (VARIANT_RESOLVE_CACHE.size >= MAX_VARIANT_CACHE) {
        const oldest = VARIANT_RESOLVE_CACHE.keys().next().value;
        if (oldest) VARIANT_RESOLVE_CACHE.delete(oldest);
    }
    VARIANT_RESOLVE_CACHE.set(key, resolvedKey);
}

function isNegativeCached(key) {
    const exp = NEGATIVE_404_CACHE.get(key);
    if (!exp) return false;
    if (Date.now() > exp) {
        NEGATIVE_404_CACHE.delete(key);
        return false;
    }
    return true;
}

function setNegativeCache(key) {
    if (NEGATIVE_404_CACHE.size >= 5000) {
        const oldest = NEGATIVE_404_CACHE.keys().next().value;
        if (oldest) NEGATIVE_404_CACHE.delete(oldest);
    }
    NEGATIVE_404_CACHE.set(key, Date.now() + NEGATIVE_CACHE_TTL);
}

async function streamToBuffer(readableStream) {
    const chunks = [];
    for await (const chunk of readableStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

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

        // Validate file size (2GB max)
        const MAX_SIZE = 2 * 1024 * 1024 * 1024;
        if (fileSize && fileSize > MAX_SIZE) {
            return res.status(400).json({ message: "Dosya boyutu 2 GB'dan büyük olamaz." });
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

        logActivity({
            user: req.user?._id,
            username: req.user?.username,
            action: 'SIGNED_URL_GENERATE',
            category: 'storage',
            req,
            targetId: key,
            targetName: fileName,
            details: {
                key,
                fileName,
                fileType,
                fileSize,
                purpose,
                bucket: bucketName
            }
        });

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
        const {
            sourceX, sourceY, sourceWidth, sourceHeight,
            scale, offsetX, offsetY,
            cropWidth, cropHeight,
            outputWidth, outputHeight,
            rotation, purpose
        } = req.body;

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

        let outputBuffer = inputBuffer;

        try {
            // 1. Process with sharp (animated: true preserves all frames, limitInputPixels: false handles any pixel count)
            const sharpInstance = sharp(inputBuffer, { animated: true, limitInputPixels: false });

            // Reuse the same instance for metadata (avoids double decode)
            const metadata = await sharpInstance.metadata();
            const originalWidth = metadata.width || 1;
            // In sharp with animated: true, pageHeight is the height of a single frame
            const originalHeight = metadata.pageHeight || metadata.height || 1;

            // Calculate effective dimensions after rotation
            const normalizedAngle = ((Number(rotation) % 360) + 360) % 360;
            const is90or270 = normalizedAngle === 90 || normalizedAngle === 270;
            const rotatedWidth = is90or270 ? originalHeight : originalWidth;
            const rotatedHeight = is90or270 ? originalWidth : originalHeight;

            const outW = Math.max(1, Math.round(Number(outputWidth) || 512));
            const outH = Math.max(1, Math.round(Number(outputHeight) || 512));

            let pipeline = sharp(inputBuffer, { animated: true, limitInputPixels: false });

            if (normalizedAngle !== 0) {
                pipeline = pipeline.rotate(normalizedAngle);
            }

            if (scale && cropWidth && cropHeight) {
                // High-precision viewport-relative cropping:
                // Perfectly mirrors the user's screen zoom & pan
                const userScale = Number(scale) || 1;
                const viewW = Number(cropWidth) || outW;
                const userOffsetX = Number(offsetX) || 0;
                const userOffsetY = Number(offsetY) || 0;

                const k = outW / viewW;
                const targetW = Math.max(1, Math.round(rotatedWidth * userScale * k));
                const targetH = Math.max(1, Math.round(rotatedHeight * userScale * k));

                const targetCenterX = Math.round(outW / 2 + userOffsetX * k);
                const targetCenterY = Math.round(outH / 2 + userOffsetY * k);

                const targetLeft = targetCenterX - Math.round(targetW / 2);
                const targetTop = targetCenterY - Math.round(targetH / 2);

                pipeline = pipeline.resize(targetW, targetH);

                const extractX = -targetLeft;
                const extractY = -targetTop;

                const safeLeft = Math.max(0, Math.min(extractX, Math.max(0, targetW - outW)));
                const safeTop = Math.max(0, Math.min(extractY, Math.max(0, targetH - outH)));
                const safeW = Math.min(outW, targetW - safeLeft);
                const safeH = Math.min(outH, targetH - safeTop);

                pipeline = pipeline.extract({
                    left: safeLeft,
                    top: safeTop,
                    width: safeW,
                    height: safeH,
                });

                if (safeW !== outW || safeH !== outH) {
                    pipeline = pipeline.resize(outW, outH, { fit: 'cover' });
                }
            } else {
                // Clamp crop coordinates to image bounds (sharp requires integers)
                const cropLeft = Math.max(0, Math.round(Number(sourceX) || 0));
                const cropTop  = Math.max(0, Math.round(Number(sourceY) || 0));
                const cropWidthVal  = Math.max(1, Math.round(Number(sourceWidth) || rotatedWidth));
                const cropHeightVal = Math.max(1, Math.round(Number(sourceHeight) || rotatedHeight));

                const finalLeft   = Math.min(cropLeft,  rotatedWidth  - 1);
                const finalTop    = Math.min(cropTop,   rotatedHeight - 1);
                const finalWidth  = Math.min(cropWidthVal,  rotatedWidth  - finalLeft);
                const finalHeight = Math.min(cropHeightVal, rotatedHeight - finalTop);

                pipeline = pipeline.extract({
                    left:   finalLeft,
                    top:    finalTop,
                    width:  finalWidth,
                    height: finalHeight,
                });

                pipeline = pipeline.resize(outW, outH, { fit: 'cover' });
            }

            outputBuffer = await pipeline.gif({ loop: 0 }).toBuffer();
        } catch (procErr) {
            console.error('[process-gif] Sharp crop failed:', procErr);
            return res.status(500).json({ message: 'GIF kırpma işlemi başarısız oldu: ' + procErr.message });
        }

        // 2. Upload processed (or fallback original) GIF to R2
        const folder = purpose === 'avatar' ? 'avatars' : (purpose === 'banner' || purpose === 'cover' ? 'banners' : 'uploads');
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

        logActivity({
            user: req.user?._id,
            username: req.user?.username,
            action: 'FILE_UPLOAD',
            category: 'storage',
            req,
            targetId: req.file.key,
            targetName: req.file.originalname,
            details: {
                key: req.file.key,
                fileName: req.file.originalname,
                sizeBytes: req.file.size,
                mimeType: req.file.mimetype,
                storageBucket: process.env.R2_BUCKET_NAME || 'cloudflare-r2'
            }
        });

        res.json({
            mediaKey: req.file.key,
        });
    } catch (error) {
        console.error('Direct upload error:', error);
        res.status(500).json({ message: 'Dosya yükleme başarısız oldu.' });
    }
});

/**
 * @route   GET /api/media/proxy-hls
 * @desc    Proxy HLS m3u8 or txt manifest files to bypass CORS.
 * @access  Public
 */
router.get('/proxy-hls', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Dynamically extract origin and referer from target url to bypass CDN hotlink protections
        let origin = '';
        let referer = '';
        try {
            const parsedUrl = new URL(targetUrl);
            origin = parsedUrl.origin;
            referer = parsedUrl.origin + '/';
        } catch (e) {}

        // Generate a comprehensive guesser list for all hdfilmcehennemi TLDs dynamically
        const tlds = ['cx', 'life', 'cool', 'live', 'com.tr', 'de', 'be', 'vip', 'website', 'lol', 'cc', 'pro', 'pw', 'today', 'org', 'net', 'co', 'biz', 'info', 'us', 'me', 'tv', 'ws', 'xyz', 'online', 'site', 'store', 'tech', 'link', 'click', 'space', 'club', 'best', 'top', 'icu', 'win', 'bid', 'gdn', 'trade', 'loan', 'download', 'stream', 'date', 'party'];
        const refererList = [];
        tlds.forEach(tld => {
            refererList.push(`https://www.hdfilmcehennemi.${tld}/`);
            refererList.push(`https://hdfilmcehennemi.${tld}/`);
        });

        refererList.push(
            'https://www.filmmodu.org/',
            'https://filmmodu.org/',
            'https://www.filmmodu.dev/',
            'https://fullhdfilmizlesene.pw/',
            'https://www.fullhdfilmizlesene.pw/',
            'https://fullhdfilmizlesene.com/',
            'https://www.fullhdfilmizlesene.com/',
            origin + '/',
            '' // No referer fallback
        );

        let response = null;
        let workingReferer = '';

        // Try to fetch manifest by guessing referrers until one returns 200 OK
        for (const ref of refererList) {
            try {
                let tempOrigin = '';
                if (ref) {
                    tempOrigin = new URL(ref).origin;
                }
                const res = await axios.get(targetUrl, {
                    responseType: 'text',
                    validateStatus: () => true,
                    timeout: 1000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        ...(tempOrigin ? { 'Origin': tempOrigin } : {}),
                        ...(ref ? { 'Referer': ref } : {})
                    }
                });
                if (res.status === 200 && res.data && (res.data.includes('#EXTM3U') || res.data.includes('#EXT-X-STREAM-INF') || res.data.includes('master') || res.data.includes('playlist'))) {
                    response = res;
                    workingReferer = ref;
                    console.log(`[HlsProxy] Working referer found: "${ref}" for URL: ${targetUrl}`);
                    break;
                }
            } catch (err) {
                // Ignore and try next
            }
        }

        // Fallback fetch if loop failed to find a working referrer
        if (!response) {
            response = await axios.get(targetUrl, {
                responseType: 'text',
                validateStatus: () => true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    ...(origin ? { 'Origin': origin } : {}),
                    ...(referer ? { 'Referer': referer } : {})
                }
            });
        }

        if (response.status !== 200) {
            res.set('Access-Control-Allow-Origin', '*');
            return res.status(response.status).send(response.data);
        }

        const manifestText = response.data;
        const lines = manifestText.split(/\r?\n/);
        const rewrittenLines = [];

        const resolveUrl = (base, relative) => {
            try {
                return new URL(relative, base).toString();
            } catch (e) {
                return relative;
            }
        };

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                rewrittenLines.push(line);
                continue;
            }

            if (trimmed.startsWith('#')) {
                // Rewrite URI="..." attributes in tags like #EXT-X-KEY or #EXT-X-MAP
                let updatedLine = line;
                const uriRegex = /(URI=")([^"]+)(")/g;
                updatedLine = updatedLine.replace(uriRegex, (match, p1, p2, p3) => {
                    const resolved = resolveUrl(targetUrl, p2);
                    const proxied = `/api/media/proxy-chunk?url=${encodeURIComponent(resolved)}${workingReferer ? `&referer=${encodeURIComponent(workingReferer)}` : ''}`;
                    return `${p1}${proxied}${p3}`;
                });
                rewrittenLines.push(updatedLine);
            } else {
                // It is a segment or sub-playlist URL
                const resolved = resolveUrl(targetUrl, trimmed);
                const isSubPlaylist = resolved.includes('.m3u8') || resolved.includes('.txt') || resolved.includes('manifest');
                
                let proxiedUrl;
                if (isSubPlaylist) {
                    // Forward working referrer to sub-playlists too
                    proxiedUrl = `/api/media/proxy-hls?url=${encodeURIComponent(resolved)}`;
                } else {
                    proxiedUrl = `/api/media/proxy-chunk?url=${encodeURIComponent(resolved)}${workingReferer ? `&referer=${encodeURIComponent(workingReferer)}` : ''}`;
                }
                rewrittenLines.push(proxiedUrl);
            }
        }

        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(rewrittenLines.join('\n'));
    } catch (error) {
        console.error('[HlsProxy] Error proxying manifest:', error.message);
        res.status(500).json({ message: 'Failed to proxy manifest', error: error.message });
    }
});

/**
 * @route   GET /api/media/proxy-chunk
 * @desc    Proxy manifest segments/chunks to bypass CORS.
 * @access  Public
 */
router.get('/proxy-chunk', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Dynamically extract origin and referer from target url to bypass CDN hotlink protections
        let origin = '';
        let referer = '';
        try {
            const parsedUrl = new URL(targetUrl);
            origin = parsedUrl.origin;
            referer = parsedUrl.origin + '/';
        } catch (e) {}

        const customReferer = req.query.referer || '';
        let customOrigin = '';
        if (customReferer) {
            try {
                customOrigin = new URL(customReferer).origin;
            } catch (e) {}
        }

        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            validateStatus: () => true, // Prevent Axios from throwing on 404/403/etc.
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                ...(customOrigin ? { 'Origin': customOrigin } : (origin ? { 'Origin': origin } : {})),
                ...(customReferer ? { 'Referer': customReferer } : (referer ? { 'Referer': referer } : {}))
            }
        });

        if (response.status !== 200 && response.status !== 206) {
            res.set('Access-Control-Allow-Origin', '*');
            res.status(response.status);
            return response.data.pipe(res);
        }

        if (response.headers['content-type']) {
            res.set('Content-Type', response.headers['content-type']);
        }
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        res.set('Access-Control-Allow-Origin', '*');

        response.data.pipe(res);
    } catch (error) {
        console.error('[HlsProxy] Error proxying chunk:', error.message);
        res.status(500).json({ message: 'Failed to proxy chunk', error: error.message });
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

        // Check if the original URL is proxying an external media URL
        const mediaPrefix = '/api/media/';
        const mediaIndex = req.originalUrl.indexOf(mediaPrefix);
        if (mediaIndex !== -1) {
            const rawTarget = req.originalUrl.substring(mediaIndex + mediaPrefix.length);
            if (rawTarget.startsWith('http%3A%2F%2F') || rawTarget.startsWith('https%3A%2F%2F') || rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
                try {
                    filePath = decodeURIComponent(rawTarget);
                } catch (e) {
                    filePath = rawTarget;
                }
            } else {
                try {
                    filePath = decodeURIComponent(filePath);
                } catch (e) {}
            }
        } else {
            try {
                filePath = decodeURIComponent(filePath);
            } catch (e) {}
        }

        // --- CASE 1: EXTERNAL URL PROXYING (News Images, External GIFs, Live Streams) ---
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            console.log('🌐 Proxying External Media:', filePath);
            const isManifest = filePath.includes('.m3u8') || filePath.includes('.mpd');
            const range = req.headers.range;
            
            try {
                const parsedUrl = new URL(filePath);
                const targetOrigin = parsedUrl.origin;
                
                // Determine the correct Referer and Origin based on the target stream domain to bypass hotlinking protection
                let targetReferer = targetOrigin + '/';
                let targetOriginHeader = undefined;
                const lowerFilePath = filePath.toLowerCase();
                
                if (lowerFilePath.includes('trt') || lowerFilePath.includes('daioncdn')) {
                    targetReferer = 'https://www.tabii.com/';
                    targetOriginHeader = 'https://www.tabii.com';
                } else if (lowerFilePath.includes('kanald')) {
                    targetReferer = 'https://www.kanald.com.tr/';
                    targetOriginHeader = 'https://www.kanald.com.tr';
                } else if (lowerFilePath.includes('atv')) {
                    targetReferer = 'https://www.atv.com.tr/';
                    targetOriginHeader = 'https://www.atv.com.tr';
                } else if (lowerFilePath.includes('showtv')) {
                    targetReferer = 'https://www.showtv.com.tr/';
                    targetOriginHeader = 'https://www.showtv.com.tr';
                } else if (lowerFilePath.includes('startv')) {
                    targetReferer = 'https://www.startv.com.tr/';
                    targetOriginHeader = 'https://www.startv.com.tr';
                } else if (lowerFilePath.includes('tv8')) {
                    targetReferer = 'https://www.tv8.com.tr/';
                    targetOriginHeader = 'https://www.tv8.com.tr';
                }

                if (isManifest) {
                    const response = await axios({
                        method: 'get',
                        url: filePath,
                        responseType: 'text',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Referer': targetReferer,
                            ...(targetOriginHeader ? { 'Origin': targetOriginHeader } : {})
                        }
                    });

                    let body = response.data;
                    const requestHost = req.get('host');
                    const requestProtocol = req.protocol;
                    const proxyPrefix = `${requestProtocol}://${requestHost}/api/media/`;

                    if (filePath.includes('.m3u8')) {
                        const lines = body.split('\n');
                        const baseUrl = new URL(filePath);
                        const parentSearch = baseUrl.search;
                        
                        body = lines.map(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return line;
                            if (trimmed.startsWith('#')) {
                                return line.replace(/(URI=["'])([^"']*)(["'])/g, (match, p1, p2, p3) => {
                                    try {
                                        if (p2.startsWith('data:') || p2.includes('/api/media/')) return match;
                                        const resolvedUrl = new URL(p2, baseUrl);
                                        if (parentSearch && !resolvedUrl.search) {
                                            resolvedUrl.search = parentSearch;
                                        }
                                        const absolute = resolvedUrl.href;
                                        return `${p1}${proxyPrefix}${encodeURIComponent(absolute)}${p3}`;
                                    } catch (e) {
                                        return match;
                                    }
                                });
                            } else {
                                try {
                                    if (trimmed.includes('/api/media/')) return line;
                                    const resolvedUrl = new URL(trimmed, baseUrl);
                                    if (parentSearch && !resolvedUrl.search) {
                                        resolvedUrl.search = parentSearch;
                                    }
                                    const absolute = resolvedUrl.href;
                                    return `${proxyPrefix}${encodeURIComponent(absolute)}`;
                                } catch (e) {
                                    return line;
                                }
                            }
                        }).join('\n');
                    } else if (filePath.includes('.mpd')) {
                        const urlRegex = /(https?:\/\/[^\s"']+)/g;
                        body = body.replace(urlRegex, (matched) => {
                            if (matched.includes('/api/media/')) return matched;
                            return `${proxyPrefix}${encodeURIComponent(matched)}`;
                        });
                        
                        const baseUrl = new URL(filePath);
                        const parentSearch = baseUrl.search;
                        const proxiedBaseUrl = `${proxyPrefix}${encodeURIComponent(baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1) + parentSearch)}`;
                        
                        if (body.includes('<BaseURL>')) {
                            body = body.replace(/<BaseURL>[^<]+<\/BaseURL>/g, `<BaseURL>${proxiedBaseUrl}</BaseURL>`);
                        } else {
                            body = body.replace(/<MPD([^>]*)>/, `<MPD$1>\n<BaseURL>${proxiedBaseUrl}</BaseURL>`);
                        }
                    }

                    res.status(response.status);
                    res.set('Content-Type', response.headers['content-type'] || (filePath.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'application/dash+xml'));
                    res.set('Access-Control-Allow-Origin', '*');
                    res.set('Access-Control-Expose-Headers', '*');
                    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
                    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                    return res.send(body);
                } else {
                    const response = await axios({
                        method: 'get',
                        url: filePath,
                        responseType: 'stream',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Referer': targetReferer,
                            ...(targetOriginHeader ? { 'Origin': targetOriginHeader } : {}),
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
                }
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

        // Strip any residual leading slashes, r2-media, or api/media prefixes
        filePath = filePath.replace(/^\/+/, '').replace(/^r2-media\//, '').replace(/^api\/media\//, '');

        const range = req.headers.range;

        // A. Video/Audio or Range Requests (Must be proxied for HTTP 206)
        if (range) {
            try {
                let totalSize = 0;
                let detContentType = 'video/mp4';
                const cachedMeta = getVideoMetadata(filePath);

                if (cachedMeta) {
                    totalSize = cachedMeta.totalSize;
                    detContentType = cachedMeta.contentType;
                } else {
                    const headCommand = new HeadObjectCommand({ Bucket: bucketName, Key: filePath });
                    const headResponse = await r2.send(headCommand);
                    totalSize = headResponse.ContentLength;

                    detContentType = headResponse.ContentType || 'video/mp4';
                    const ext = filePath.split('.').pop().toLowerCase();
                    if (['mp4', 'mov', 'm4v'].includes(ext)) detContentType = 'video/mp4';
                    else if (ext === 'webm') detContentType = 'video/webm';
                    else if (ext === 'ogg') detContentType = 'video/ogg';

                    setVideoMetadata(filePath, totalSize, detContentType);
                }

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
                
                // Fast cleanup: when client seeks or closes request, abort upstream R2 connection immediately
                req.on('close', () => {
                    try {
                        if (response?.Body?.destroy) response.Body.destroy();
                    } catch (_) {}
                });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': detContentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Vary': 'Range',
                    'Connection': 'keep-alive'
                });

                return response.Body.pipe(res);
            } catch (headError) {
                if (headError.name === 'NotFound' || headError.name === 'NoSuchKey') return res.status(404).json({ message: 'File not found' });
                throw headError;
            }
        }

        // B. Standard R2 Images/Assets (High Performance Edge Proxy with LRU In-Memory Cache & ETag 304)
        let targetKey = filePath;
        if (targetKey.startsWith('post-') && !targetKey.startsWith('posts/')) {
            targetKey = `posts/general/${targetKey}`;
        }

        // Fast negative cache rejection (prevents repeated 404 storming)
        if (isNegativeCached(targetKey)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const clientEtag = req.headers['if-none-match'];

        // 1. Check In-Memory LRU Cache first (<1ms response, 0 R2 roundtrips)
        const cached = getCachedMedia(targetKey);
        if (cached) {
            if (clientEtag && (clientEtag === cached.etag || clientEtag === `W/${cached.etag}`)) {
                return res.status(304).end();
            }
            res.removeHeader('set-cookie');
            res.removeHeader('Set-Cookie');
            res.set('Content-Type', cached.contentType);
            res.set('Content-Length', cached.contentLength);
            res.set('ETag', cached.etag);
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
            res.set('Netlify-CDN-Cache-Control', 'public, max-age=31536000, durable');
            res.set('CDN-Cache-Control', 'public, max-age=31536000, durable');
            res.set('Accept-Ranges', 'bytes');
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            res.set('X-Cache', 'HIT');
            return res.send(cached.buffer);
        }

        // 2. Fetch from R2 with Fast Cached Variant Fallback
        let response = null;
        let finalKey = getCachedVariant(targetKey) || targetKey;

        try {
            const command = new GetObjectCommand({ Bucket: bucketName, Key: finalKey });
            response = await r2.send(command);
        } catch (r2Err) {
            if ((r2Err.name === 'NoSuchKey' || r2Err.name === 'NotFound') && 
                (targetKey.includes('-thumbnail.webp') || targetKey.includes('-medium.webp') || targetKey.includes('-lowres.webp'))) {
                
                const baseWithoutSuffix = targetKey.replace(/-(thumbnail|medium|lowres)\.webp$/, '');
                const fallbackCandidates = [
                    baseWithoutSuffix,
                    `${baseWithoutSuffix}.webp`,
                    `${baseWithoutSuffix}.png`,
                    `${baseWithoutSuffix}.jpg`,
                    `${baseWithoutSuffix}.jpeg`,
                    `${baseWithoutSuffix}.gif`
                ];

                // Parallel candidate lookup with Promise.any to eliminate 5x serial roundtrips
                try {
                    const candidatePromises = fallbackCandidates.map(candidateKey => 
                        r2.send(new GetObjectCommand({ Bucket: bucketName, Key: candidateKey }))
                            .then(res => ({ response: res, key: candidateKey }))
                    );
                    const winner = await Promise.any(candidatePromises);
                    response = winner.response;
                    finalKey = winner.key;
                    setCachedVariant(targetKey, finalKey);
                } catch (_) {
                    // All candidates failed
                    setNegativeCache(targetKey);
                    return res.status(404).json({ message: 'File not found' });
                }
            } else if (r2Err.name === 'NoSuchKey' || r2Err.name === 'NotFound') {
                setNegativeCache(targetKey);
                return res.status(404).json({ message: 'File not found' });
            } else {
                throw r2Err;
            }
        }

        if (!response) {
            setNegativeCache(targetKey);
            return res.status(404).json({ message: 'File not found' });
        }

        // 3. ETag 304 Validation from R2 response
        const etag = response.ETag || `"${targetKey}"`;
        if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
            return res.status(304).end();
        }

        const contentType = response.ContentType || 'image/jpeg';
        const contentLength = response.ContentLength;

        // Clean headers for Edge CDN caching (Netlify / Cloudflare Edge)
        res.removeHeader('set-cookie');
        res.removeHeader('Set-Cookie');
        res.set('Content-Type', contentType);
        res.set('ETag', etag);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Netlify-CDN-Cache-Control', 'public, max-age=31536000, durable');
        res.set('CDN-Cache-Control', 'public, max-age=31536000, durable');
        res.set('Accept-Ranges', 'bytes');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');

        // 4. Cache small images (<= 1.5MB - Avatars, Badges, Icons) in memory for instant subsequent loads
        if (contentLength && contentLength <= 1.5 * 1024 * 1024) {
            try {
                const buffer = await streamToBuffer(response.Body);
                setCachedMedia(targetKey, {
                    buffer,
                    contentType,
                    contentLength: buffer.length,
                    etag
                });

                res.set('Content-Length', buffer.length);
                res.set('X-Cache', 'MISS');
                return res.send(buffer);
            } catch (buffErr) {
                console.warn('Buffering media stream failed, streaming directly:', buffErr.message);
            }
        }

        // 5. Direct Zero-Copy Streaming for larger assets (Instant TTFB, zero RAM accumulation)
        if (contentLength) res.set('Content-Length', contentLength);
        res.set('X-Cache', 'STREAM');
        return response.Body.pipe(res);

    } catch (error) {
        if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
            return res.status(404).json({ message: 'File not found' });
        }
        console.error('Media Resolver Error:', error.message);
        res.status(500).json({ message: 'Failed to resolve media' });
    }
});



/**
 * @route   POST /api/media/validate-stream
 * @desc    Validate watch party URL stream type (VOD vs Live) by fetching manifest contents.
 * @access  Private
 */
router.post('/validate-stream', auth, async (req, res) => {
    try {
        const { url, portalId, isLiveHint } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Check if url contains or is a Post/Video ID (e.g. 24-character hexadecimal ObjectId)
        const hexIdMatch = String(url).match(/\b([a-fA-F0-9]{24})\b/);
        if (hexIdMatch) {
            const possiblePostId = hexIdMatch[1];
            try {
                const post = await Post.findById(possiblePostId).populate('portal');
                if (post && (post.mediaType === 'video' || post.mediaType === 'videoUrl' || (post.media && String(post.media).match(/\.(mp4|m4v|webm|mov|mkv|ogg|m3u8|mpd)$/i)))) {
                    // Portal Privacy Check
                    if (post.portal) {
                        const portal = post.portal;
                        const userId = req.user?._id;
                        const isAuthor = userId && post.author && post.author.toString() === userId.toString();

                        if (portal.privacy === 'private' || portal.privacy === 'restricted') {
                            // Rule 1: Private portal videos CANNOT be played in another portal's room
                            if (!portalId || String(portalId) !== String(portal._id)) {
                                return res.status(403).json({
                                    message: 'Gizli bir portalın videosu başka bir portalda izlenemez.',
                                    isForbidden: true
                                });
                            }

                            // Rule 2: User must be a member or allowed in this private portal
                            if (!isAuthor) {
                                const isBlocked = userId && portal.blockedUsers?.some(id => id.toString() === userId.toString());
                                if (isBlocked) {
                                    return res.status(403).json({ message: 'Gizli bir portalda paylaşılan video izlenemez.', isForbidden: true });
                                }

                                const isMember = userId && portal.members?.some(id => id.toString() === userId.toString());
                                const isAllowed = userId && portal.allowedUsers?.some(id => id.toString() === userId.toString());

                                if (!isMember && !isAllowed) {
                                    return res.status(403).json({ message: 'Gizli bir portalda paylaşılan video izlenemez.', isForbidden: true });
                                }
                            }
                        } else if (!isAuthor) {
                            const isBlocked = userId && portal.blockedUsers?.some(id => id.toString() === userId.toString());
                            if (isBlocked) {
                                return res.status(403).json({ message: 'Gizli bir portalda paylaşılan video izlenemez.', isForbidden: true });
                            }
                        }
                    }

                    // Privacy check passed! Get video source
                    const videoSrc = post.video720 || post.video1080 || post.video360 || post.videoUrl || post.media;
                    return res.json({
                        isLive: false,
                        type: 'post_video',
                        streamUrl: videoSrc,
                        postId: post._id
                    });
                }
            } catch (postErr) {
                console.warn('[StreamValidator] Post lookup failed, treating as standard URL:', postErr.message);
            }
        }

        const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
        const isStaticVideo = cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.ogg');
        
        if (isStaticVideo) {
            return res.json({ isLive: false, type: 'static' });
        }

        const isPlatform = [
            'youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv',
            'soundcloud.com', 'facebook.com', 'dailymotion.com',
            'wistia.com'
        ].some(domain => cleanUrl.includes(domain));

        if (isPlatform) {
            return res.json({ isLive: false, type: 'platform' });
        }

        let targetFetchUrl = url;
        let reqReferer = 'https://closeload.filmmakinesi.to/';
        let reqOrigin = 'https://closeload.filmmakinesi.to';

        if (url.includes('/api/proxy')) {
            try {
                const parsedProxy = new URL(url, 'http://localhost:5000');
                const rawTarget = parsedProxy.searchParams.get('url');
                if (rawTarget) targetFetchUrl = rawTarget;
                const ref = parsedProxy.searchParams.get('referer');
                if (ref) reqReferer = ref;
                const orig = parsedProxy.searchParams.get('origin');
                if (orig) reqOrigin = orig;
            } catch (e) {}
        }

        if (targetFetchUrl.includes('playmix')) {
            reqReferer = 'https://playmix.uno/';
            reqOrigin = 'https://playmix.uno';
        } else if (targetFetchUrl.includes('cdnimages') || targetFetchUrl.includes('shop') || targetFetchUrl.includes('hdfilmcehennemi')) {
            reqReferer = 'https://hdfilmcehennemi.mobi/';
            reqOrigin = 'https://hdfilmcehennemi.mobi';
        }

        const targetClean = targetFetchUrl.split('?')[0].split('#')[0].toLowerCase();
        const isHls = targetClean.endsWith('.m3u8') || targetFetchUrl.includes('.m3u8') || targetFetchUrl.includes('/hls/') || targetClean.endsWith('.txt') || targetFetchUrl.includes('master.txt');
        const isDash = targetClean.endsWith('.mpd') || targetFetchUrl.includes('.mpd') || targetFetchUrl.includes('/dash/');

        if (!isHls && !isDash) {
            return res.json({ isLive: !!isLiveHint, type: 'unknown' });
        }

        console.log(`[StreamValidator] Inspecting manifest for target: ${targetFetchUrl}`);
        const response = await axios.get(targetFetchUrl, {
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': reqReferer,
                'Origin': reqOrigin,
                'Accept': '*/*'
            }
        });

        const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        if (isHls) {
            const hasEndList = content.includes('#EXT-X-ENDLIST') || content.includes('#EXT-X-PLAYLIST-TYPE:VOD');
            // If it's a master playlist pointing to sub-variants, check stream type or default to VOD if not explicit live
            const isMaster = content.includes('#EXT-X-STREAM-INF');
            const determinedLive = isMaster ? (isLiveHint === true) : !hasEndList;

            return res.json({
                isLive: determinedLive,
                type: determinedLive ? 'hls_live' : 'hls_vod'
            });
        }

        if (isDash) {
            const isStaticDash = content.includes('type="static"') || content.includes("type='static'");
            return res.json({
                isLive: !isStaticDash,
                type: isStaticDash ? 'dash_vod' : 'dash_live'
            });
        }

        return res.json({ isLive: !!isLiveHint, type: 'unknown' });
    } catch (error) {
        console.error('[StreamValidator] Error validating stream:', error.message);
        // On error, honor caller's isLiveHint if provided (e.g. false for movie resolver) instead of forcing true
        const determinedFallbackLive = typeof req.body?.isLiveHint === 'boolean' ? req.body.isLiveHint : false;
        res.json({ isLive: determinedFallbackLive, type: 'fallback', error: error.message });
    }
});

export default router;
