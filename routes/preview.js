import express from 'express';
import ogs from 'open-graph-scraper-lite';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Simple in-memory cache to avoid redundant fetches
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

router.get('/', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Check cache
        if (cache.has(url)) {
            const cachedData = cache.get(url);
            if (Date.now() - cachedData.timestamp < CACHE_TTL) {
                return res.json(cachedData.data);
            }
            cache.delete(url);
        }

        const options = {
            url,
            timeout: 5000,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
        };

        const { result, error } = await ogs(options);

        if (error) {
            console.error(`OGS Error for ${url}:`, result);
            return res.status(422).json({ message: 'Could not fetch metadata' });
        }

        const previewData = {
            title: result.ogTitle || result.twitterTitle || '',
            description: result.ogDescription || result.twitterDescription || '',
            image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
            url: result.ogUrl || url,
            siteName: result.ogSiteName || result.twitterSiteName || '',
            favicon: result.favicon || '',
        };

        // Cache the result
        cache.set(url, {
            data: previewData,
            timestamp: Date.now(),
        });

        // Limit cache size
        if (cache.size > 1000) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        res.json(previewData);
    } catch (error) {
        console.error('Link preview error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
