import express from 'express';
import axios from 'axios';
import ogs from 'open-graph-scraper-lite';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import mongoose from 'mongoose';
import { validateSsrfUrl } from '../utils/security.js';

import Portal from '../models/Portal.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

// Whitelisted domains for proxy-image — only R2 CDN is permitted
const PROXY_IMAGE_ALLOWLIST = [
    'pub-094a78010abf4ebf9726834268946cb8.r2.dev',
    'r2.dev',
];


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
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

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
// Cloudflare R2 Public Domain
const R2_DOMAIN = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';

/**
 * Helper to ensure we have a full URL, routing through our own proxy to avoid ISP/SSL blocks
 */
function ensureFullUrl(key, baseUrl = '') {
    if (!key) return '';
    if (typeof key !== 'string') return '';
    if (key.startsWith('http')) return key;
    
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    const r2Url = `${R2_DOMAIN}/${cleanKey}`;
    
    // Use absolute URL for the proxy if baseUrl is provided
    return `${baseUrl}/api/preview/proxy-image?url=${encodeURIComponent(r2Url)}`;
}

async function fetchInternalPreview(urlStr, baseUrl = '') {
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
                    image: ensureFullUrl(portal.banner, baseUrl),
                    avatar: ensureFullUrl(portal.avatar, baseUrl),
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
                    image: ensureFullUrl(user.profile?.coverImage, baseUrl),
                    avatar: ensureFullUrl(user.profile?.avatar, baseUrl),
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
                .populate('author', 'username profile.displayName profile.avatar isDeleted')
                .populate('portal', 'name avatar banner');
            
            if (post) {
                const authorName = post.author?.profile?.displayName || post.author?.username || 'Bilinmeyen Kullanıcı';
                const portalName = post.portal?.name || 'Kişisel Akış';
                
                return {
                    type: 'internal',
                    subType: 'post',
                    title: `${authorName} bir gönderi paylaştı`,
                    description: post.content ? (post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')) : 'Oxypace gönderisine göz atın.',
                    image: ensureFullUrl(post.media?.[0]?.url || post.portal?.banner, baseUrl),
                    avatar: ensureFullUrl(post.author?.profile?.avatar || post.portal?.avatar, baseUrl),
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
        // SSRF Protection: block requests to private/reserved IP ranges
        const ssrfCheck = validateSsrfUrl(originalUrl);
        if (!ssrfCheck.safe) {
            console.warn(`[SSRF Block] fetchGenericPreview rejected: ${originalUrl} — ${ssrfCheck.reason}`);
            return null;
        }

        const { data: html } = await axios.get(originalUrl, {
            timeout: 12000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            responseType: 'text',
            validateStatus: (status) => status < 400,
        });

        if (!html || typeof html !== 'string') return null;

        const hostname = new URL(originalUrl).hostname.replace('www.', '');

        // 1. Cheerio primary robust HTML parsing
        const $ = cheerio.load(html);

        let title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('meta[property="twitter:title"]').attr('content') ||
                    $('title').text() ||
                    hostname;

        let description = $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content') ||
                          $('meta[property="twitter:description"]').attr('content') ||
                          $('meta[name="description"]').attr('content') ||
                          '';

        let image = $('meta[property="og:image:secure_url"]').attr('content') ||
                    $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image:src"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') ||
                    $('meta[property="twitter:image"]').attr('content') ||
                    $('link[rel="image_src"]').attr('href') ||
                    '';

        let siteName = $('meta[property="og:site_name"]').attr('content') || hostname;

        let favicon = $('link[rel="icon"]').attr('href') ||
                      $('link[rel="shortcut icon"]').attr('href') ||
                      $('link[rel="apple-touch-icon"]').attr('href') ||
                      '/favicon.ico';

        // 2. Safe OGS enhancement (wrapped so JSON-LD parse errors never crash extraction)
        try {
            const trimmedHtml = html.substring(0, 250000);
            const ogsRes = await ogs({ html: trimmedHtml });
            if (ogsRes && ogsRes.result) {
                const r = ogsRes.result;
                if ((!title || title === hostname) && (r.ogTitle || r.twitterTitle)) {
                    title = r.ogTitle || r.twitterTitle;
                }
                if (!description && (r.ogDescription || r.twitterDescription)) {
                    description = r.ogDescription || r.twitterDescription;
                }
                if (!image && r.ogImage) {
                    if (Array.isArray(r.ogImage) && r.ogImage.length > 0) {
                        image = r.ogImage[0]?.url || r.ogImage[0] || '';
                    } else if (typeof r.ogImage === 'object') {
                        image = r.ogImage.url || '';
                    } else if (typeof r.ogImage === 'string') {
                        image = r.ogImage;
                    }
                }
                if ((!siteName || siteName === hostname) && r.ogSiteName) {
                    siteName = r.ogSiteName;
                }
                if (!favicon && r.favicon) {
                    favicon = r.favicon;
                }
            }
        } catch (_) {
            // OGS parser issue ignored; Cheerio already extracted the data
        }

        // 3. Fallback: first article/content image if still missing
        if (!image) {
            const articleImg = $('article img, .post-content img, .entry-content img, main img').first().attr('src');
            if (articleImg && !articleImg.includes('1x1') && !articleImg.includes('spacer') && !articleImg.includes('pixel')) {
                image = articleImg;
            }
        }

        // 4. Resolve relative URLs
        if (image && !image.startsWith('http')) {
            try {
                image = new URL(image, originalUrl).href;
            } catch (_) {}
        }
        if (favicon && !favicon.startsWith('http')) {
            try {
                favicon = new URL(favicon, originalUrl).href;
            } catch (_) {}
        }

        return {
            title: (title || hostname).trim(),
            description: (description || '').trim(),
            image: (image || '').trim(),
            url: originalUrl,
            siteName: (siteName || hostname).trim(),
            favicon: (favicon || '').trim(),
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
            // Pass the current base URL to ensure absolute proxy links
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.get('host');
            const baseUrl = `${protocol}://${host}`;
            
            previewData = await fetchInternalPreview(originalUrl, baseUrl);
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

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Final Safety Check: Force Proxy for ANY R2 URL (Internal or Generic)
        if (previewData && previewData.image && previewData.image.includes(R2_DOMAIN) && !previewData.image.includes('/api/preview/proxy-image')) {
            previewData.image = `${baseUrl}/api/preview/proxy-image?url=${encodeURIComponent(previewData.image)}`;
        }
        
        if (previewData && previewData.avatar && previewData.avatar.includes(R2_DOMAIN) && !previewData.avatar.includes('/api/preview/proxy-image')) {
            previewData.avatar = `${baseUrl}/api/preview/proxy-image?url=${encodeURIComponent(previewData.avatar)}`;
        }

        // Cache it
        cache.set(originalUrl, { data: previewData, timestamp: Date.now() });
        res.set('X-Preview-Mode', mode);
        res.set('X-Preview-Cache', 'MISS');

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
router.options('/video', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});

router.get('/video', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const videoUrl = req.query.url;

    if (!videoUrl || !(videoUrl.includes('twimg.com') || videoUrl.includes('twitter.com') || videoUrl.includes('x.com'))) {
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

/**
 * Image Proxy to bypass ISP/SSL blocks on R2 domain
 */
router.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('URL is required');

    // SSRF Protection: Only allow requests to the whitelisted R2 CDN domain
    let parsedImageUrl;
    try {
        parsedImageUrl = new URL(imageUrl);
    } catch {
        return res.status(400).send('Invalid URL');
    }

    const isAllowed = PROXY_IMAGE_ALLOWLIST.some(domain => parsedImageUrl.hostname === domain || parsedImageUrl.hostname.endsWith('.' + domain));
    if (!isAllowed) {
        console.warn(`[SSRF Block] /proxy-image rejected hostname: ${parsedImageUrl.hostname}`);
        return res.status(403).send('Disallowed image host');
    }

    try {
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        // Pass through content-type
        if (response.headers['content-type']) {
            res.set('Content-Type', response.headers['content-type']);
        }
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24h
        
        response.data.pipe(res);

        req.on('close', () => {
            response.data.destroy();
        });
    } catch (err) {
        console.error('Image proxy error:', err.message);
        if (!res.headersSent) {
            res.status(500).send('Failed to fetch image');
        }
    }
});

/**
 * OG Thumbnail generator to compress and resize images specifically for WhatsApp (max 300KB)
 */
router.get('/thumbnail', async (req, res) => {
    const imageUrl = req.query.url;
    const isVideo = req.query.type === 'video';

    if (isVideo) {
        try {
            const svgPlayButton = `
            <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#060913"/>
              <circle cx="200" cy="180" r="50" fill="#2563eb" opacity="0.9"/>
              <polygon points="185,155 185,205 225,180" fill="#ffffff"/>
              <text x="200" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">OXYPACE VIDEO</text>
              <text x="200" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Oynatmak için tıklayın</text>
            </svg>
            `;
            const buffer = await sharp(Buffer.from(svgPlayButton))
                .jpeg({ quality: 85 })
                .toBuffer();

            res.set('Content-Type', 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24h
            return res.send(buffer);
        } catch (svgErr) {
            console.error('Failed to generate SVG video thumbnail:', svgErr.message);
            const clientBase = process.env.CLIENT_URL || 'https://oxypace.com.tr';
            return res.redirect(`${clientBase.replace(/\/$/, '')}/logo.png`);
        }
    }

    if (!imageUrl) return res.status(400).send('URL is required');

    // SSRF Protection: validate thumbnail source URL
    const thumbSsrfCheck = validateSsrfUrl(imageUrl);
    if (!thumbSsrfCheck.safe) {
        console.warn(`[SSRF Block] /thumbnail rejected: ${imageUrl} — ${thumbSsrfCheck.reason}`);
        return res.status(400).send('Invalid or disallowed URL');
    }

    try {
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer', // Get as buffer to process with sharp
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const inputBuffer = Buffer.from(response.data);
        
        // Resize to maximum 400x400 maintaining aspect ratio and convert to compressed jpeg
        const processedBuffer = await sharp(inputBuffer)
            .resize(400, 400, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24h
        return res.send(processedBuffer);

    } catch (err) {
        console.error('Thumbnail generation error:', err.message);
        // Fallback to direct redirect if sharp fails
        return res.redirect(imageUrl);
    }
});

export default router;
