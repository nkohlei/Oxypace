/**
 * OG (Open Graph) Meta Injection Route
 *
 * WhatsApp, Telegram, Facebook gibi mesajlaşma uygulamaları bir URL
 * paylaşıldığında önizleme oluşturmak için bot olarak sunucuya istek atar.
 * Bu botlar JavaScript çalıştırmaz — sadece ham HTML'deki meta etiketlerini okur.
 *
 * Bu route:
 * 1. /post/:id ve /profile/:username için bot User-Agent'ı tespit eder
 * 2. Post/profil verisini DB'den çeker
 * 3. İçine OG meta etiketleri gömülmüş bir HTML sayfası döndürür
 * 4. Normal kullanıcılar bu route'a düşmez (index.html'e yönlendirilir)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import connectDB from '../config/db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Sabitler ─────────────────────────────────────────────────────────────────

const SITE_URL = process.env.CLIENT_URL || 'https://oxypace.netlify.app';
const SITE_NAME = 'Oxypace';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
const BACKEND_URL = process.env.BACKEND_URL || 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app';

// ── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────────

/**
 * Verilen media key/URL'yi tam bir public URL'e dönüştürür
 */
function resolveMediaUrl(media) {
    if (!media) return null;
    if (typeof media !== 'string') return null;
    if (media.startsWith('http://') || media.startsWith('https://')) {
        return media;
    }
    // R2 key → public URL
    const cleanKey = media.startsWith('/') ? media.slice(1) : media;
    return `${R2_PUBLIC_DOMAIN}/${cleanKey}`;
}

/**
 * WhatsApp için görselin backend'deki sıkıştırma/boyutlandırma endpoint'i üzerinden geçmesini sağlar.
 */
function getOGImageUrl(url, isVideo) {
    if (isVideo) {
        // Videolar için dinamik bir oynat butonu görseli oluştur
        return `${BACKEND_URL}/api/preview/thumbnail?type=video`;
    }
    if (!url) return DEFAULT_IMAGE;
    if (url.includes('img.youtube.com')) return url; // YouTube thumbnail'larını doğrudan geçir
    return `${BACKEND_URL}/api/preview/thumbnail?url=${encodeURIComponent(url)}`;
}

/**
 * YouTube video ID'sini URL'den çıkarır
 */
function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Post için en iyi thumbnail URL'ini belirler
 * - image/gif → doğrudan görsel
 * - video    → R2 video URL (WhatsApp bazı durumlarda frame alır)
 * - youtube  → YouTube maxresdefault thumbnail
 */
function getThumbnailForPost(post) {
    const mediaType = post.mediaType || 'none';
    const mediaUrl = resolveMediaUrl(
        Array.isArray(post.media) ? post.media[0] : post.media
    );

    if (mediaType === 'youtube') {
        const ytId = extractYouTubeId(mediaUrl || post.media);
        if (ytId) {
            return {
                imageUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
                videoUrl: null,
                isVideo: false,
            };
        }
    }

    if (mediaType === 'video' && mediaUrl) {
        return {
            imageUrl: mediaUrl,  // WhatsApp video URL'den thumbnail almaya çalışır
            videoUrl: mediaUrl,
            isVideo: true,
        };
    }

    if ((mediaType === 'image' || mediaType === 'gif') && mediaUrl) {
        return {
            imageUrl: mediaUrl,
            videoUrl: null,
            isVideo: false,
        };
    }

    return { imageUrl: null, videoUrl: null, isVideo: false };
}

/**
 * Metin içeriğini meta etiket için temizler ve kırpar
 */
function sanitizeText(text, maxLength = 160) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .substring(0, maxLength)
        .trim() + (text.length > maxLength ? '...' : '');
}

/**
 * OG meta etiketlerini içeren minimal HTML sayfası oluşturur.
 * Bu sayfa botların okuyacağı sayfa; kullanıcıları gerçek siteye yönlendirir.
 */
function buildOGHtml({ title, description, imageUrl, videoUrl, pageUrl, type = 'article', authorName }) {
    const safeTitle = sanitizeText(title, 100) || SITE_NAME;
    const safeDesc = sanitizeText(description, 160) || `${SITE_NAME} - Sosyal Medya Platformu`;
    const safeImage = imageUrl || DEFAULT_IMAGE;
    const safePageUrl = pageUrl || SITE_URL;
    const ogType = type;

    const videoMeta = videoUrl ? `
    <!-- Video OG Tags (WhatsApp / Telegram video önizlemesi) -->
    <meta property="og:video" content="${videoUrl}" />
    <meta property="og:video:secure_url" content="${videoUrl}" />
    <meta property="og:video:type" content="video/mp4" />
    <meta property="og:video:width" content="1280" />
    <meta property="og:video:height" content="720" />` : '';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | ${SITE_NAME}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph / WhatsApp / Facebook / Telegram -->
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:url" content="${safePageUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:locale" content="tr_TR" />${videoMeta}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${videoUrl ? 'player' : 'summary_large_image'}" />
  <meta name="twitter:site" content="@oxypace" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Kullanıcıları gerçek siteye yönlendir (0 saniye) -->
  <meta http-equiv="refresh" content="0;url=${safePageUrl}" />
  <link rel="canonical" href="${safePageUrl}" />
</head>
<body>
  <p>
    Yönlendiriliyorsunuz... 
    <a href="${safePageUrl}">${safeTitle}</a>
  </p>
  <script>window.location.replace("${safePageUrl}");</script>
</body>
</html>`;
}

// ── Bot Tespiti ───────────────────────────────────────────────────────────────

/**
 * User-Agent'ı inceleyerek isteğin bir paylaşım botu olup olmadığını belirler.
 * WhatsApp, Telegram, Facebook, Twitter, Discord, Slack, LinkedIn vb. botlar
 * bu listedeki kalıpları içeren User-Agent kullanır.
 */
function isBot(userAgent) {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    const botPatterns = [
        'whatsapp',
        'facebookexternalhit',
        'facebot',
        'twitterbot',
        'telegrambot',
        'linkedinbot',
        'slackbot',
        'discordbot',
        'pinterest',
        'vkshare',
        'w3c_validator',
        'skype',
        'viber',
        'imessage',
        'imsybot',
        'googlebot',
        'bingbot',
        'applebot',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'sogou',
        'exabot',
        'ia_archiver',
        'semrushbot',
        'ahrefsbot',
        'mj12bot',
        'rogerbot',
        'screaming frog',
        'curl/',
        'python-requests',
        'go-http-client',
        'axios/',
        'node-fetch',
        'ogpreviewfetcher',
        'preview',
    ];
    return botPatterns.some((pattern) => ua.includes(pattern));
}

// ── Route Handler'ları ────────────────────────────────────────────────────────

/**
 * GET /og/post/:postId
 *
 * Bot isteği → OG meta etiketleri içeren HTML
 * Normal kullanıcı → Bu route'a düşmemeli (sunucu konfigürasyonu bunu önler)
 */
router.get('/post/:postId', async (req, res) => {
    const { postId } = req.params;
    const userAgent = req.headers['user-agent'] || '';
    const pageUrl = `${SITE_URL}/post/${postId}`;

    // MongoDB bağlantısını sağla
    try {
        await connectDB();
    } catch (dbErr) {
        console.error('[OG] DB connect error:', dbErr.message);
        // DB hatasında fallback HTML döndür
        return res.send(buildOGHtml({
            title: 'Oxypace Gönderisi',
            description: 'Oxypace\'te paylaşılan bir gönderi.',
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }

    try {
        // MongoDB ObjectId formatını doğrula
        if (!/^[a-f\d]{24}$/i.test(postId)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(buildOGHtml({
                title: 'Gönderi Bulunamadı',
                description: 'Aradığınız gönderi mevcut değil veya silinmiş olabilir.',
                imageUrl: DEFAULT_IMAGE,
                pageUrl,
            }));
        }

        const post = await Post.findById(postId)
            .populate('author', 'username profile.displayName profile.avatar')
            .populate('portal', 'name')
            .lean();

        if (!post) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(buildOGHtml({
                title: 'Gönderi Bulunamadı',
                description: 'Aradığınız gönderi mevcut değil veya silinmiş olabilir.',
                imageUrl: DEFAULT_IMAGE,
                pageUrl,
            }));
        }

        const authorName = post.author?.profile?.displayName || post.author?.username || 'Bilinmeyen';
        const portalTag = post.portal ? ` • ${post.portal.name}` : '';

        const title = post.content
            ? `${authorName}${portalTag}`
            : `${authorName} bir gönderi paylaştı${portalTag}`;

        const description = post.content
            ? post.content.substring(0, 160)
            : 'Oxypace\'te paylaşılan bir gönderi.';

        const { imageUrl, videoUrl, isVideo } = getThumbnailForPost(post);

        const html = buildOGHtml({
            title,
            description,
            imageUrl: getOGImageUrl(imageUrl, isVideo),
            videoUrl,
            pageUrl,
            type: isVideo ? 'video.other' : 'article',
            authorName,
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 dakika cache
        return res.send(html);

    } catch (err) {
        console.error('[OG] Post route error:', err.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(buildOGHtml({
            title: 'Hata',
            description: 'Gönderi yüklenirken bir hata oluştu.',
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }
});

/**
 * GET /og/profile/:username
 *
 * Profil sayfaları için OG önizlemesi
 */
router.get('/profile/:username', async (req, res) => {
    const { username } = req.params;
    const pageUrl = `${SITE_URL}/profile/${username}`;

    try {
        await connectDB();
    } catch (dbErr) {
        console.error('[OG] Profile route DB error:', dbErr.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(buildOGHtml({
            title: `@${username} | Oxypace`,
            description: `@${username} profiline göz atın.`,
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }

    try {
        const user = await User.findOne({ username })
            .select('username profile')
            .lean();

        if (!user) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(buildOGHtml({
                title: 'Profil Bulunamadı',
                description: 'Aradığınız kullanıcı profili mevcut değil.',
                imageUrl: DEFAULT_IMAGE,
                pageUrl,
            }));
        }

        const displayName = user.profile?.displayName || user.username;
        const bio = user.profile?.bio || `${displayName} - Oxypace profili`;
        const avatar = resolveMediaUrl(user.profile?.avatar);
        const cover = resolveMediaUrl(user.profile?.coverImage);

        const html = buildOGHtml({
            title: displayName,
            description: bio,
            imageUrl: getOGImageUrl(cover || avatar || DEFAULT_IMAGE, false),
            pageUrl,
            type: 'profile',
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
        return res.send(html);

    } catch (err) {
        console.error('[OG] Profile route error:', err.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(buildOGHtml({
            title: `@${username} | Oxypace`,
            description: `@${username} profiline göz atın.`,
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }
});

/**
 * GET /og/portal/:portalId
 *
 * Portal sayfaları için OG önizlemesi
 */
router.get('/portal/:portalId', async (req, res) => {
    const { portalId } = req.params;
    const pageUrl = `${SITE_URL}/portal/${portalId}`;

    try {
        await connectDB();
    } catch (dbErr) {
        console.error('[OG] Portal route DB error:', dbErr.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(buildOGHtml({
            title: 'Portal | Oxypace',
            description: 'Oxypace portalına göz atın.',
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }

    try {
        if (!/^[a-f\d]{24}$/i.test(portalId)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(buildOGHtml({
                title: 'Portal Bulunamadı',
                description: 'Aradığınız portal mevcut değil.',
                imageUrl: DEFAULT_IMAGE,
                pageUrl,
            }));
        }

        const portal = await Portal.findById(portalId)
            .select('name description avatar banner privacy')
            .lean();

        if (!portal || portal.privacy === 'private') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(buildOGHtml({
                title: 'Portal Bulunamadı',
                description: portal?.privacy === 'private' ? 'Bu portal gizlidir.' : 'Aradığınız portal mevcut değil.',
                imageUrl: DEFAULT_IMAGE,
                pageUrl,
            }));
        }

        const banner = resolveMediaUrl(portal.banner);
        const avatar = resolveMediaUrl(portal.avatar);

        const html = buildOGHtml({
            title: portal.name,
            description: portal.description || `${portal.name} - Oxypace portali`,
            imageUrl: getOGImageUrl(banner || avatar || DEFAULT_IMAGE, false),
            pageUrl,
            type: 'website',
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
        return res.send(html);

    } catch (err) {
        console.error('[OG] Portal route error:', err.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(buildOGHtml({
            title: 'Portal | Oxypace',
            description: 'Oxypace portalına göz atın.',
            imageUrl: DEFAULT_IMAGE,
            pageUrl,
        }));
    }
});

export default router;
