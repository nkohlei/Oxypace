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
            timeout: 8000, // Increased timeout for redirects
            followRedirect: true,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
        };

        const { result, error } = await ogs(options);

        // Even if ogs returns an error, we might have some results
        if (error && !result?.ogTitle && !result?.requestUrl) {
            console.error(`OGS Error for ${url}:`, result);
            return res.status(422).json({ message: 'Could not fetch metadata' });
        }

        const previewData = {
            title: result.ogTitle || result.twitterTitle || result.dcTitle || result.alIosAppName || '',
            description: result.ogDescription || result.twitterDescription || result.dcDescription || '',
            image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || result.ogImageURL || '',
            url: result.ogUrl || result.requestUrl || url,
            siteName: result.ogSiteName || result.twitterSiteName || '',
            favicon: result.favicon || '',
        };

        // Fallback to page title if ogTitle is missing
        if (!previewData.title && result.requestUrl) {
            // Some sites don't have OG tags but have a title
            // ogs-lite might not catch it as ogTitle
            // We can try to extract domain as title if all else fails
            try {
                const domain = new URL(url).hostname;
                previewData.title = domain;
            } catch (e) {
                previewData.title = 'Link Önizleme';
            }
        }

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
