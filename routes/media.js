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

        // B. Standard R2 Images/Assets (Fast Single-Shot Proxy)
        let targetKey = filePath;
        if (targetKey.startsWith('post-') && !targetKey.startsWith('posts/')) {
            targetKey = `posts/general/${targetKey}`;
        }

        const command = new GetObjectCommand({ Bucket: bucketName, Key: targetKey });
        const response = await r2.send(command);

        res.set('Content-Type', response.ContentType || 'application/octet-stream');
        if (response.ContentLength) res.set('Content-Length', response.ContentLength);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Accept-Ranges', 'bytes');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');

        return response.Body.pipe(res);

        res.set('Content-Type', response.ContentType || 'application/octet-stream');
        if (response.ContentLength) res.set('Content-Length', response.ContentLength);
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



/**
 * @route   POST /api/media/validate-stream
 * @desc    Validate watch party URL stream type (VOD vs Live) by fetching manifest contents.
 * @access  Private
 */
router.post('/validate-stream', auth, async (req, res) => {
    try {
        const { url, portalId } = req.body;
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

        const isHls = cleanUrl.endsWith('.m3u8') || url.includes('.m3u8') || url.includes('/hls/');
        const isDash = cleanUrl.endsWith('.mpd') || url.includes('.mpd') || url.includes('/dash/');

        if (!isHls && !isDash) {
            return res.json({ isLive: false, type: 'unknown' });
        }

        console.log(`[StreamValidator] Inspecting manifest for: ${url}`);
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            }
        });

        const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

        if (isHls) {
            const hasEndList = content.includes('#EXT-X-ENDLIST');
            return res.json({
                isLive: !hasEndList,
                type: hasEndList ? 'hls_vod' : 'hls_live'
            });
        }

        if (isDash) {
            const isStaticDash = content.includes('type="static"') || content.includes("type='static'");
            return res.json({
                isLive: !isStaticDash,
                type: isStaticDash ? 'dash_vod' : 'dash_live'
            });
        }

        return res.json({ isLive: false, type: 'unknown' });
    } catch (error) {
        console.error('[StreamValidator] Error validating stream:', error.message);
        const cleanUrl = req.body.url ? req.body.url.split('?')[0].split('#')[0].toLowerCase() : '';
        const isManifest = cleanUrl.endsWith('.m3u8') || cleanUrl.endsWith('.mpd') || req.body.url?.includes('.m3u8');
        res.json({ isLive: isManifest, type: 'fallback', error: error.message });
    }
});

export default router;
