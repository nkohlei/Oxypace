import express from 'express';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';

const router = express.Router();

/**
 * @route   GET /api/media/*
 * @desc    Proxy R2 media files through backend. FULL HTTP 206 RANGE SUPPORT ENFORCED.
 * @access  Public
 */
router.get('/*', async (req, res) => {
    try {
        const filePath = req.params[0];

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        const range = req.headers.range;

        // --- HTTP 206 PARTIAL CONTENT SUPPORT FOR VIDEO AUDIO DECODING ---
        if (range) {
            try {
                // 1. Get the total file size from R2
                const headCommand = new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: filePath
                });
                const headResponse = await r2.send(headCommand);
                const totalSize = headResponse.ContentLength;

                // 2. Parse the Range header provided by Chrome/Safari
                const parts = range.replace(/bytes=/, "").split("-");
                let start = parseInt(parts[0], 10);
                
                // Chrome usually sends 'bytes=0-', meaning "give me an appropriate chunk"
                // We default to a generous ~5MB chunk, or end of file
                let end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + (5 * 1024 * 1024), totalSize - 1);

                if (isNaN(start)) start = 0;
                
                // Bounds enforcement
                if (start >= totalSize || end >= totalSize) {
                    end = totalSize - 1;
                }
                if (start > end) {
                     return res.status(416).send(`Requested range not satisfiable\n${start} >= ${totalSize}`);
                }

                const chunksize = (end - start) + 1;

                console.log(`🎥 Stream Request: ${filePath} | ${start}-${end}/${totalSize} (${(chunksize/1024).toFixed(1)} KB)`);

                // 3. Request the precise byte range from R2
                const getCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: filePath,
                    Range: `bytes=${start}-${end}`
                });

                const response = await r2.send(getCommand);

                // 4. Send the required HTTP 206 headers so the browser unblocks Audio decoding
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': response.ContentType || 'video/mp4', // Help browser infer mp4
                    'Access-Control-Allow-Origin': '*',
                    'Cross-Origin-Resource-Policy': 'cross-origin'
                });

                response.Body.pipe(res);
                return;

            } catch (headError) {
                 if (headError.name === 'NotFound' || headError.name === 'NoSuchKey') {
                     return res.status(404).json({ message: 'File not found' });
                 }
                 console.error('🎥 Head Error in Range Request:', headError);
                 throw headError;
            }
        }

        // --- HTTP 200 FULL FILE FALLBACK (Images, initial GIF loads) ---
        console.log('📷 Standard Request (No-Range):', filePath);

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: filePath,
        });

        const response = await r2.send(command);

        res.set('Content-Type', response.ContentType || 'application/octet-stream');
        res.set('Content-Length', response.ContentLength);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.set('Accept-Ranges', 'bytes'); // Inform browser it CAN ask for segments
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');

        response.Body.pipe(res);

    } catch (error) {
        console.error('Media proxy error:', error.message);

        if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(500).json({ message: 'Failed to fetch media' });
    }
});

export default router;
