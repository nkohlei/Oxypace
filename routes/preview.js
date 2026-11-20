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
import Badge from '../models/Badge.js';

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
            const portal = await Portal.findById(portalId).select(
                'name description avatar banner badges isVerified customBadge isNSFW privacy'
            );
            if (portal) {
                return {
                    type: 'internal',
                    subType: 'portal',
                    portalId: portal._id,
                    title: portal.name,
                    description: portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.',
                    image: ensureFullUrl(portal.banner, baseUrl),
                    avatar: ensureFullUrl(portal.avatar, baseUrl),
                    badges: portal.badges || [],
                    isVerified: Boolean(portal.isVerified),
                    customBadge: portal.customBadge || null,
                    isNSFW: Boolean(portal.isNSFW),
                    privacy: portal.privacy || 'public',
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

// ── Dynamic Portal OG Card Generator (1200x630) ─────────────────────────────

function escapeSvgXml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function wrapCardLines(text, maxCharsPerLine = 54, maxLines = 2) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const words = clean.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxCharsPerLine) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            current = word;
            if (lines.length === maxLines - 1) break;
        }
    }
    if (current && lines.length < maxLines) {
        lines.push(current);
    }
    if (lines.length === maxLines) {
        const joined = lines.join(' ');
        if (joined.length < clean.length) {
            let last = lines[maxLines - 1];
            if (last.length > maxCharsPerLine - 3) {
                last = last.slice(0, maxCharsPerLine - 3).trimEnd();
            }
            lines[maxLines - 1] = `${last}...`;
        }
    }
    return lines;
}

function resolveDirectMediaUrl(media) {
    if (!media || typeof media !== 'string') return '';
    const trimmed = media.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const cleanKey = trimmed.replace(/^\/+/, '');
    return `${R2_DOMAIN}/${cleanKey}`;
}

async function fetchImageBufferSafe(url, timeoutMs = 8000) {
    if (!url) return null;
    try {
        const check = validateSsrfUrl(url);
        if (!check.safe) return null;
        const resp = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: timeoutMs,
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        return Buffer.from(resp.data);
    } catch (_) {
        return null;
    }
}

const OG_BADGE_ICONS = {
    checkmark: 'M9.86 16.29l-3.3-3.3a1 1 0 0 1 1.41-1.41l1.89 1.89 5.3-5.3a1 1 0 0 1 1.41 1.41l-6.71 6.71z',
    verified: 'M9.86 16.29l-3.3-3.3a1 1 0 0 1 1.41-1.41l1.89 1.89 5.3-5.3a1 1 0 0 1 1.41 1.41l-6.71 6.71z',
    star: 'M12 6.5l1.65 3.35 3.7.54-2.68 2.61.63 3.69L12 14.95l-3.3 1.74.63-3.69-2.68-2.61 3.7-.54L12 6.5z',
    shield: 'M12 6L7 8.2v4.2c0 3.2 2.1 6.2 5 7 2.9-.8 5-3.8 5-7V8.2L12 6z',
    crown: 'M7 16h10l1-7-3.5 2.5L12 7l-2.5 4.5L6 9l1 7z',
    lightning: 'M13 5.5l-5 7.5h4l-1 5.5 5-7.5h-4l1-5.5z',
    fire: 'M12 5.5c.5 1.5 0 2.5-1 3.5-1 1-1.5 2-1.5 3 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.8-1-3-2-4 .5 1.5 0 2.5-1 3-.3-1.5-.2-3.5-1.5-5.5z',
    heart: 'M12 16.7l-.9-.82C7.9 13.01 5.75 11.06 5.75 8.67 5.75 6.72 7.3 5.2 9.25 5.2c1.1 0 2.16.51 2.75 1.32.59-.81 1.65-1.32 2.75-1.32 1.95 0 3.5 1.52 3.5 3.47 0 2.39-2.15 4.34-5.35 7.21l-.9.82z',
    diamond: 'M12 6L17.5 12 12 18 6.5 12 12 6z',
    sparkle: 'M12 5.5l1.3 3.9 3.9 1.3-3.9 1.3L12 15.9l-1.3-3.9-3.9-1.3 3.9-1.3L12 5.5z',
};

const OG_ROSETTE_PATH =
    'M 12 3.2 A 2.9 2.9 0 0 1 17.173 4.881 A 2.9 2.9 0 0 1 20.369 9.281 A 2.9 2.9 0 0 1 20.369 14.719 A 2.9 2.9 0 0 1 17.173 19.119 A 2.9 2.9 0 0 1 12 20.8 A 2.9 2.9 0 0 1 6.827 19.119 A 2.9 2.9 0 0 1 3.631 14.719 A 2.9 2.9 0 0 1 3.631 9.281 A 2.9 2.9 0 0 1 6.827 4.881 A 2.9 2.9 0 0 1 12 3.2 Z';

function getBadgeFillColor(slug, badgeDef) {
    if (badgeDef?.style?.metallicType === 'gold' || slug.includes('gold')) return '#eab308';
    if (badgeDef?.style?.metallicType === 'silver' || slug.includes('silver')) return '#cbd5e1';
    if (badgeDef?.style?.metallicType === 'platinum') return '#e2e8f0';
    if (badgeDef?.style?.metallicType === 'rose_gold') return '#f4a29e';
    if (badgeDef?.style?.metallicType === 'bronze') return '#d97706';
    if (badgeDef?.style?.primaryColor) return badgeDef.style.primaryColor;
    if (slug.includes('crown') || slug.includes('founder') || slug.includes('owner')) return '#f59e0b';
    return '#e4e4e7';
}

router.get('/portal-card/:portalId', async (req, res) => {
    const { portalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(portalId)) {
        return res.status(400).send('Invalid portal id');
    }

    try {
        const portal = await Portal.findById(portalId)
            .select('name description avatar banner badges isVerified customBadge privacy members')
            .lean();

        if (!portal || portal.privacy === 'private') {
            return res.status(404).send('Portal not found');
        }

        const rawBadges = Array.isArray(portal.badges)
            ? portal.badges.filter((b) => b && typeof b === 'string' && b !== 'none')
            : [];
        const systemBadges = rawBadges.length > 0 ? rawBadges : (portal.isVerified ? ['verified'] : []);

        const [postCount, badgeDocs, bannerRaw, avatarRaw, customBadgeRaw] = await Promise.all([
            Post.countDocuments({ portal: portalId }),
            systemBadges.length > 0 ? Badge.find({ slug: { $in: systemBadges } }).lean() : Promise.resolve([]),
            fetchImageBufferSafe(resolveDirectMediaUrl(portal.banner)),
            fetchImageBufferSafe(resolveDirectMediaUrl(portal.avatar)),
            portal.customBadge?.url ? fetchImageBufferSafe(resolveDirectMediaUrl(portal.customBadge.url)) : Promise.resolve(null),
        ]);

        const badgeMap = new Map(badgeDocs.map((b) => [b.slug, b]));
        const W = 1200;
        const H = 630;
        const BANNER_H = 310;
        const AVATAR_FRAME = 188;
        const AVATAR_SIZE = 170;
        const AVATAR_X = 56;
        const AVATAR_Y = BANNER_H - Math.round(AVATAR_FRAME / 2);

        const composites = [];

        // 1. Banner image (or gradient fallback drawn on base)
        if (bannerRaw) {
            try {
                const resizedBanner = await sharp(bannerRaw)
                    .resize(W, BANNER_H, { fit: 'cover', position: 'center' })
                    .toBuffer();
                composites.push({ input: resizedBanner, left: 0, top: 0 });
            } catch (_) {}
        }

        // 2. Card overlay SVG (avatar centered on banner/body seam, large title + badges dead-center on seam beside avatar)
        const titleText = String(portal.name || 'Portal').slice(0, 22);
        const approxTitleWidth = Math.min(660, Math.max(100, Math.round(titleText.length * 40)));
        const titleX = AVATAR_X + AVATAR_FRAME + 24;
        const titleBaselineY = BANNER_H + 22;

        let badgeCursorX = titleX + approxTitleWidth + 18;
        const badgeSvgItems = systemBadges.slice(0, 4).map((slug) => {
            const def = badgeMap.get(slug);
            const fill = getBadgeFillColor(slug, def);
            const iconKey = def?.icon || (slug.includes('crown') ? 'crown' : 'checkmark');
            const iconPath = OG_BADGE_ICONS[iconKey] || OG_BADGE_ICONS.checkmark;
            const innerColor = def?.style?.innerIconColor || '#ffffff';
            const bx = badgeCursorX;
            badgeCursorX += 56;
            return `<g transform="translate(${bx}, ${titleBaselineY - 46}) scale(2.1)">
                <path d="${OG_ROSETTE_PATH}" fill="${escapeSvgXml(fill)}"/>
                <path d="${iconPath}" fill="${escapeSvgXml(innerColor)}"/>
            </g>`;
        });

        const descLines = wrapCardLines(
            portal.description || 'Bu topluluk hakkında henüz bir açıklama yok.',
            56,
            2
        );
        const descSvg = descLines
            .map(
                (line, idx) =>
                    `<text x="56" y="${456 + idx * 40}" font-family="DejaVu Sans, Arial, sans-serif" font-size="28" fill="#a1a1aa">${escapeSvgXml(line)}</text>`
            )
            .join('\n');

        const memberCount = Array.isArray(portal.members) ? portal.members.length : 0;
        const initials = escapeSvgXml(titleText.substring(0, 2).toUpperCase());

        const overlaySvg = `
        <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bannerFallback" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#18181b"/>
              <stop offset="50%" stop-color="#27272a"/>
              <stop offset="100%" stop-color="#3f3f46"/>
            </linearGradient>
            <linearGradient id="bannerFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="35%" stop-color="#0e1015" stop-opacity="0"/>
              <stop offset="72%" stop-color="#0e1015" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#0e1015" stop-opacity="0.88"/>
            </linearGradient>
          </defs>
          ${!bannerRaw ? `<rect x="0" y="0" width="${W}" height="${BANNER_H}" fill="url(#bannerFallback)"/>` : ''}
          <rect x="0" y="0" width="${W}" height="${BANNER_H}" fill="url(#bannerFade)"/>
          <rect x="0" y="${BANNER_H}" width="${W}" height="${H - BANNER_H}" fill="#0e1015"/>

          <!-- Avatar Cutout Frame (Exact 50/50 on boundary) -->
          <rect x="${AVATAR_X}" y="${AVATAR_Y}" width="${AVATAR_FRAME}" height="${AVATAR_FRAME}" rx="34" fill="#0e1015"/>
          ${!avatarRaw ? `
          <rect x="${AVATAR_X + 9}" y="${AVATAR_Y + 9}" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" rx="26" fill="#27272a"/>
          <text x="${AVATAR_X + AVATAR_FRAME / 2}" y="${AVATAR_Y + AVATAR_FRAME / 2 + 20}" font-family="DejaVu Sans, Arial, sans-serif" font-size="60" font-weight="700" fill="#f8fafc" text-anchor="middle">${initials}</text>
          ` : ''}

          <!-- Portal Title & Badges dead-center on boundary beside Avatar -->
          <text x="${titleX}" y="${titleBaselineY}" font-family="DejaVu Sans, Arial, sans-serif" font-size="68" font-weight="800" fill="#ffffff">${escapeSvgXml(titleText)}</text>
          ${badgeSvgItems.join('\n')}

          <!-- Description -->
          ${descSvg}

          <!-- Stats Pills -->
          <rect x="56" y="544" width="144" height="44" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
          <text x="128" y="573" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="#d4d4d8" text-anchor="middle">${memberCount} Üye</text>

          <rect x="216" y="544" width="168" height="44" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
          <text x="300" y="573" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="#d4d4d8" text-anchor="middle">${postCount} Gönderi</text>

          <text x="1144" y="573" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="#71717a" text-anchor="end">oxypace.com.tr</text>
        </svg>`;

        composites.push({ input: Buffer.from(overlaySvg), left: 0, top: 0 });

        // 3. Rounded Avatar composite on top of the cutout frame
        if (avatarRaw) {
            try {
                const avatarMask = Buffer.from(
                    `<svg width="${AVATAR_SIZE}" height="${AVATAR_SIZE}"><rect x="0" y="0" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" rx="26" fill="#fff"/></svg>`
                );
                const roundedAvatar = await sharp(avatarRaw)
                    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'center' })
                    .composite([{ input: avatarMask, blend: 'dest-in' }])
                    .png()
                    .toBuffer();
                composites.push({ input: roundedAvatar, left: AVATAR_X + 9, top: AVATAR_Y + 9 });
            } catch (_) {}
        }

        // 4. Custom Badge image composite right next to system badges
        if (customBadgeRaw && badgeCursorX < W - 80) {
            try {
                const cbSize = 42;
                const cbRadius = portal.customBadge?.shape === 'square' ? 10 : cbSize / 2;
                const cbMask = Buffer.from(
                    `<svg width="${cbSize}" height="${cbSize}"><rect x="0" y="0" width="${cbSize}" height="${cbSize}" rx="${cbRadius}" fill="#fff"/></svg>`
                );
                const roundedCb = await sharp(customBadgeRaw)
                    .resize(cbSize, cbSize, { fit: 'cover', position: 'center' })
                    .composite([{ input: cbMask, blend: 'dest-in' }])
                    .png()
                    .toBuffer();
                composites.push({ input: roundedCb, left: badgeCursorX, top: titleBaselineY - 35 });
            } catch (_) {}
        }

        const finalBuffer = await sharp({
            create: {
                width: W,
                height: H,
                channels: 4,
                background: { r: 14, g: 16, b: 21, alpha: 1 },
            },
        })
            .composite(composites)
            .jpeg({ quality: 84, mozjpeg: true })
            .toBuffer();

        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=1800');
        return res.send(finalBuffer);
    } catch (err) {
        console.error('Portal OG card error:', err.message);
        const clientBase = process.env.CLIENT_URL || 'https://oxypace.com.tr';
        return res.redirect(`${clientBase.replace(/\/$/, '')}/logo.png`);
    }
});

export default router;
