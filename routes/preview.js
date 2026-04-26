import express from 'express';
import ogs from 'open-graph-scraper-lite';

const router = express.Router();

// Simple in-memory cache to avoid redundant fetches
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

router.get('/', async (req, res) => {
    let url = req.query.url;

    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        // Special handling for Twitter/X to avoid being blocked
        // fxtwitter.com is the most reliable service for providing OG metadata for tweets
        if (url.includes('x.com') || url.includes('twitter.com')) {
            url = url.replace(/https?:\/\/(www\.)?(x|twitter)\.com/, 'https://fxtwitter.com');
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
            timeout: 10000,
            followRedirect: true,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
        };

        // Wrap OGS in its own try-catch to prevent parent crash
        let ogsResponse;
        try {
            ogsResponse = await ogs(options);
        } catch (ogsErr) {
            console.error('OGS Fetch Error:', ogsErr.message);
            // Fallback: If OGS fails, try to return at least the domain as title
            const domain = new URL(url).hostname;
            return res.json({
                title: domain,
                description: '',
                image: '',
                url: url,
                siteName: domain
            });
        }

        const { result, error } = ogsResponse;
        const originalUrl = req.query.url;

        let fallbackTitle = new URL(originalUrl).hostname;
        if (fallbackTitle.includes('x.com') || fallbackTitle.includes('twitter.com')) {
            fallbackTitle = 'Twitter / X';
        }

        const previewData = {
            title: result?.ogTitle || result?.twitterTitle || result?.dcTitle || fallbackTitle,
            description: result?.ogDescription || result?.twitterDescription || '',
            image: result?.ogImage?.[0]?.url || result?.twitterImage?.[0]?.url || '',
            url: originalUrl,
            siteName: result?.ogSiteName || result?.twitterSiteName || (fallbackTitle.includes('Twitter') ? 'Twitter' : ''),
            favicon: result?.favicon || '',
        };

        // Cache the result
        cache.set(url, {
            data: previewData,
            timestamp: Date.now(),
        });

        // Limit cache size
        if (cache.size > 500) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        return res.json(previewData);

    } catch (err) {
        console.error('General Preview Error:', err.message);
        // ABSOLUTE FALLBACK: Never return 500
        try {
            const domain = new URL(url).hostname;
            return res.json({
                title: domain,
                description: '',
                image: '',
                url: url,
                siteName: domain
            });
        } catch (e) {
            return res.status(422).json({ message: 'Invalid URL' });
        }
    }
});

export default router;
