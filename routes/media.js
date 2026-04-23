import express from 'express';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import auth from '../middleware/auth.js';

import axios from 'axios';
import r2 from '../config/r2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
 * @route   GET /api/media/*

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
            
            try {
                const response = await axios({
                    method: 'get',
                    url: filePath,
                    responseType: 'stream',
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                // Forward essential headers with aggressive caching for mobile stability
                res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
                res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Cross-Origin-Resource-Policy', 'cross-origin');

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
                let start = parseInt(parts[0], 10);
                let end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + (5 * 1024 * 1024), totalSize - 1);

                if (isNaN(start)) start = 0;
                if (start >= totalSize || end >= totalSize) end = totalSize - 1;
                if (start > end) return res.status(416).send(`Requested range not satisfiable`);

                const chunksize = (end - start) + 1;
                const getCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: filePath,
                    Range: `bytes=${start}-${end}`
                });

                const response = await r2.send(getCommand);
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': response.ContentType || 'video/mp4',
                    'Access-Control-Allow-Origin': '*',
                    'Cross-Origin-Resource-Policy': 'cross-origin',
                    'Cache-Control': 'public, max-age=31536000, immutable'
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
