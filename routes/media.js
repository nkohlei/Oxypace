import express from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';

const router = express.Router();

/**
 * @route   GET /api/media/*
 * @desc    Proxy R2 media files through backend to avoid CORS and ISP issues
 * @access  Public
 */
router.get('/*', async (req, res) => {
    try {
        // Get the file path from the URL (everything after /api/media/)
        const filePath = req.params[0];

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        console.log('📷 Media proxy request:', filePath);

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'oxypace',
            Key: filePath
        });

        const response = await r2.send(command);

        // Set appropriate headers
        res.set('Content-Type', response.ContentType || 'application/octet-stream');
        res.set('Content-Length', response.ContentLength);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.set('Access-Control-Allow-Origin', '*');

        // Pipe the stream to response
        response.Body.pipe(res);

    } catch (error) {
        console.error('Media proxy error:', error.message);

        if (error.name === 'NoSuchKey') {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(500).json({ message: 'Failed to fetch media' });
    }
});

export default router;
