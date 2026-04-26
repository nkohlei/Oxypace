import express from 'express';
import axios from 'axios';
import ogs from 'open-graph-scraper-lite';

const router = express.Router();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Extract Twitter/X status info from URL
 * Returns { username, statusId } or null
 */
function parseTwitterUrl(url) {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/i);
    if (match) {
        return { username: match[1], statusId: match[2] };
    }
    return null;
}

/**
 * Fetch Twitter/X preview using fxtwitter JSON API
 * This returns structured data directly — no HTML scraping needed
 */
async function fetchTwitterPreview(originalUrl) {
    const parsed = parseTwitterUrl(originalUrl);
    if (!parsed) return null;

    try {
        const apiUrl = `https://api.fxtwitter.com/${parsed.username}/status/${parsed.statusId}`;
        const { data } = await axios.get(apiUrl, { timeout: 8000 });

        if (!data?.tweet) return null;

        const tweet = data.tweet;

        // Collect photos
        const photos = [];
        if (tweet.media?.photos) {
            tweet.media.photos.forEach(p => photos.push(p.url));
        }

        // Collect videos with their playable URLs
        const videos = [];
        if (tweet.media?.videos) {
            tweet.media.videos.forEach(v => {
                videos.push({
                    url: v.url || '',
                    thumbnail: v.thumbnail_url || '',
                });
            });
        }

        return {
            type: 'tweet',
            title: tweet.author?.name || parsed.username,
            description: tweet.text || '',
            image: photos[0] || videos[0]?.thumbnail || '',
            tweetPhotos: photos,
            tweetVideos: videos,
            authorAvatar: tweet.author?.avatar_url || '',
            authorName: tweet.author?.name || parsed.username,
            authorHandle: tweet.author?.screen_name || parsed.username,
            likes: tweet.likes || 0,
            retweets: tweet.retweets || 0,
            replies: tweet.replies || 0,
            createdAt: tweet.created_at || '',
            url: originalUrl,
            siteName: 'Twitter / X',
            favicon: '',
        };
    } catch (err) {
        console.error('Twitter API error:', err.message);
        return null;
    }
}

/**
 * Fetch generic preview by downloading HTML and parsing OG tags
 */
async function fetchGenericPreview(originalUrl) {
    try {
        const { data: html } = await axios.get(originalUrl, {
            timeout: 8000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            // Only accept text responses (don't download binary files)
            responseType: 'text',
            validateStatus: (status) => status < 400,
        });

        if (!html || typeof html !== 'string') return null;

        // Limit HTML size to prevent memory issues
        const trimmedHtml = html.substring(0, 50000);

        const { result } = await ogs({ html: trimmedHtml });

        const hostname = new URL(originalUrl).hostname.replace('www.', '');

        return {
            title: result?.ogTitle || result?.twitterTitle || result?.dcTitle || hostname,
            description: result?.ogDescription || result?.twitterDescription || '',
            image: result?.ogImage?.[0]?.url || result?.twitterImage?.[0]?.url || '',
            url: originalUrl,
            siteName: result?.ogSiteName || hostname,
            favicon: result?.favicon || '',
        };
    } catch (err) {
        console.error('Generic preview error:', err.message);
        return null;
    }
}

router.get('/', async (req, res) => {
    const originalUrl = req.query.url;

    if (!originalUrl) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        // Check cache first
        if (cache.has(originalUrl)) {
            const cached = cache.get(originalUrl);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return res.json(cached.data);
            }
            cache.delete(originalUrl);
        }

        let previewData = null;

        // Twitter/X gets special treatment via JSON API
        if (originalUrl.includes('x.com/') || originalUrl.includes('twitter.com/')) {
            previewData = await fetchTwitterPreview(originalUrl);
        }

        // Generic OG scraping for everything else (or if Twitter API failed)
        if (!previewData) {
            previewData = await fetchGenericPreview(originalUrl);
        }

        // If we still have nothing, return minimal data
        if (!previewData) {
            try {
                const hostname = new URL(originalUrl).hostname.replace('www.', '');
                previewData = {
                    title: hostname,
                    description: '',
                    image: '',
                    url: originalUrl,
                    siteName: hostname,
                    favicon: '',
                };
            } catch {
                return res.status(422).json({ message: 'Invalid URL' });
            }
        }

        // Cache it
        cache.set(originalUrl, { data: previewData, timestamp: Date.now() });

        // Limit cache size
        if (cache.size > 500) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        return res.json(previewData);

    } catch (err) {
        console.error('Preview route error:', err.message);
        return res.status(500).json({ message: 'Could not fetch preview' });
    }
});

/**
 * Video proxy — streams Twitter videos through our server
 * to bypass Twitter CDN's 403 hotlink protection
 */
router.get('/video', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl || !videoUrl.includes('video.twimg.com')) {
        return res.status(400).json({ message: 'Invalid video URL' });
    }

    try {
        const response = await axios.get(videoUrl, {
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Referer': 'https://twitter.com/',
                'Origin': 'https://twitter.com',
            },
        });

        // Forward content headers
        if (response.headers['content-type']) {
            res.set('Content-Type', response.headers['content-type']);
        }
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        res.set('Accept-Ranges', 'bytes');
        res.set('Cache-Control', 'public, max-age=3600');

        response.data.pipe(res);
    } catch (err) {
        console.error('Video proxy error:', err.message);
        res.status(500).json({ message: 'Failed to load video' });
    }
});

export default router;
