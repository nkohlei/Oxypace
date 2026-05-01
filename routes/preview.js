import express from 'express';
import axios from 'axios';
import ogs from 'open-graph-scraper-lite';

import Portal from '../models/Portal.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

const router = express.Router();

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Clear cache on each server restart to ensure fresh data after fixes
cache.clear();

/**
 * Extract Twitter/X status info from URL
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
 * Fetch internal preview from database
 */
async function fetchInternalPreview(urlStr) {
    try {
        const url = new URL(urlStr);
        const path = url.pathname;

        // Portal: /portal/:id
        const portalMatch = path.match(/^\/portal\/([a-f\d]{24})/i);
        if (portalMatch) {
            const portalId = portalMatch[1];
            const portal = await Portal.findById(portalId).select('name description avatar banner');
            if (portal) {
                return {
                    type: 'internal',
                    subType: 'portal',
                    title: portal.name,
                    description: portal.description || 'Oxypace portalını keşfedin.',
                    image: constructProxiedUrl(portal.banner) || '',
                    avatar: constructProxiedUrl(portal.avatar) || '',
                    url: urlStr,
                    siteName: 'Oxypace Portal',
                    favicon: '/favicon.ico'
                };
            }
        }

        // Profile: /profile/:username
        const profileMatch = path.match(/^\/profile\/([a-zA-Z0-9_.]+)/i);
        if (profileMatch) {
            const username = profileMatch[1];
            const user = await User.findOne({ username }).select('username profile');
            if (user) {
                return {
                    type: 'internal',
                    subType: 'profile',
                    title: user.profile?.displayName || user.username,
                    description: user.profile?.bio || `${user.username} profiline göz atın.`,
                    image: constructProxiedUrl(user.profile?.coverImage) || '',
                    avatar: constructProxiedUrl(user.profile?.avatar) || '',
                    url: urlStr,
                    siteName: 'Oxypace Profil',
                    favicon: '/favicon.ico'
                };
            }
        }

        // Post: /post/:id
        const postMatch = path.match(/^\/post\/([a-f\d]{24})/i);
        if (postMatch) {
            const postId = postMatch[1];
            const post = await Post.findById(postId)
                .populate('author', 'username profile.displayName profile.avatar')
                .populate('portal', 'name avatar banner');
            
            if (post) {
                const authorName = post.author?.profile?.displayName || post.author?.username || 'Bilinmeyen Kullanıcı';
                const portalName = post.portal?.name || 'Kişisel Akış';
                
                return {
                    type: 'internal',
                    subType: 'post',
                    title: `${authorName} bir gönderi paylaştı`,
                    description: post.content ? (post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')) : 'Oxypace gönderisine göz atın.',
                    image: constructProxiedUrl(post.media?.[0]?.url || post.portal?.banner) || '',
                    avatar: constructProxiedUrl(post.author?.profile?.avatar || post.portal?.avatar) || '',
                    url: urlStr,
                    siteName: `Oxypace / ${portalName}`,
                    favicon: '/favicon.ico'
                };
            }
        }

        return null;
    } catch (err) {
        console.error('Internal preview error:', err.message);
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
        let imageUrl = result?.ogImage?.[0]?.url || result?.twitterImage?.[0]?.url || '';

        // Resolve relative image URLs for external links
        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                const base = new URL(originalUrl);
                imageUrl = new URL(imageUrl, base.origin).href;
            } catch (e) {
                // Keep as is if parsing fails
            }
        }

        return {
            title: result?.ogTitle || result?.twitterTitle || result?.dcTitle || hostname,
            description: result?.ogDescription || result?.twitterDescription || '',
            image: imageUrl,
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
    const forceRefresh = req.query.refresh === 'true';

    if (!originalUrl) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        // Check cache first (unless forceRefresh is true)
        if (!forceRefresh && cache.has(originalUrl)) {
            const cached = cache.get(originalUrl);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                res.set('X-Preview-Cache', 'HIT');
                return res.json(cached.data);
            }
            cache.delete(originalUrl);
        }

        let previewData = null;
        let mode = 'generic';

        // 1. Try Internal Oxypace Logic (Path-based, domain agnostic)
        try {
            previewData = await fetchInternalPreview(originalUrl);
            if (previewData) {
                mode = 'internal';
            }
        } catch (e) {
            // Silently fail and fall through
        }

        // 2. Twitter/X gets special treatment via JSON API
        if (!previewData && (originalUrl.includes('x.com/') || originalUrl.includes('twitter.com/'))) {
            previewData = await fetchTwitterPreview(originalUrl);
            if (previewData) {
                mode = 'tweet';
            }
        }

        // 3. Generic OG scraping for everything else (or if internal/Twitter failed)
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
        res.set('X-Preview-Mode', mode);
        res.set('X-Preview-Cache', 'MISS');

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
 * to bypass Twitter CDN's 403 hotlink protection.
 * Supports HTTP Range requests for proper video playback.
 */
router.get('/video', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl || !videoUrl.includes('video.twimg.com')) {
        return res.status(400).json({ message: 'Invalid video URL' });
    }

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Referer': 'https://twitter.com/',
            'Origin': 'https://twitter.com',
        };

        // Forward the Range header from the browser
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }

        const response = await axios.get(videoUrl, {
            responseType: 'stream',
            timeout: 30000,
            headers,
            // Accept 206 Partial Content as valid
            validateStatus: (status) => status === 200 || status === 206,
        });

        // Mirror the status code (200 or 206)
        res.status(response.status);

        // Forward all relevant headers
        const forwardHeaders = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
        ];
        forwardHeaders.forEach((h) => {
            if (response.headers[h]) {
                res.set(h, response.headers[h]);
            }
        });

        res.set('Cache-Control', 'public, max-age=3600');

        response.data.pipe(res);

        // Clean up on client disconnect
        req.on('close', () => {
            response.data.destroy();
        });
    } catch (err) {
        console.error('Video proxy error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to load video' });
        }
    }
});

export default router;
