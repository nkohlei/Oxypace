/**
 * routes/stream.js
 *
 * /api/resolve-stream endpoint'ini tanımlar.
 * Rate limiting ve URL doğrulama middleware'lerini uygular,
 * ardından Playwright resolver servisini çağırır.
 */

const express = require('express');
const router = express.Router();

const { validateUrl } = require('../middleware/validator');
const { rateLimiter } = require('../middleware/rateLimiter');
const { apiKeyAuth } = require('../middleware/auth');
const { resolveStreamUrl } = require('../services/playwrightResolver');
const { fastResolve } = require('../services/fastScraper');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/resolve-stream
 *
 * Üçüncü taraf film sitesindeki video akış URL'sini ve HTTP başlıklarını döner.
 *
 * @example İstek Gövdesi
 *   {
 *     "url": "https://www.hdfilmcehennemi.nl/batman-kara-sovalye-hd-film-izle/",
 *     "timeout": 30000   // opsiyonel, ms cinsinden (varsayılan: 30000)
 *   }
 *
 * @example Başarılı Yanıt (200)
 *   {
 *     "success": true,
 *     "streamUrl": "https://cdn.example.com/hls/master.m3u8?token=abc123",
 *     "type": "m3u8",
 *     "headers": {
 *       "referer": "https://www.hdfilmcehennemi.nl/...",
 *       "user-agent": "Mozilla/5.0 ...",
 *       "origin": "https://www.hdfilmcehennemi.nl"
 *     },
 *     "pageTitle": "Batman: Kara Şövalye - HD Film İzle",
 *     "resolvedIn": 8432
 *   }
 *
 * @example Hata Yanıtı (404)
 *   { "success": false, "error": "...", "code": "STREAM_NOT_FOUND" }
 */
router.post(
  '/resolve-stream',
  apiKeyAuth,       // 1. İsteğe bağlı API Key koruması
  rateLimiter,      // 2. IP başına rate limiting
  validateUrl,      // 3. URL doğrulama
  async (req, res) => {
    const { url, timeout } = req.body;
    const resolveTimeout = timeout
      ? Math.min(parseInt(timeout, 10), 20000) // Netlify 26s proxy limitini aşmamak için max 20s
      : 20000;

    logger.info(`[Route] Yeni istek — URL: ${url} | Timeout: ${resolveTimeout}ms`);
    const startTime = Date.now();

    // 1. Aşama: Akıllı Önbellek Kontrolü (<10ms)
    const cachedResult = cacheService.get(url);
    if (cachedResult) {
      const lowerCached = (cachedResult.streamUrl || '').toLowerCase();
      if (lowerCached.endsWith('.vtt') || lowerCached.endsWith('.srt') || lowerCached.includes('/vtt/')) {
        logger.warn(`[Route] 🧹 Geçersiz önbellek girdisi (.vtt) temizlendi: ${cachedResult.streamUrl}`);
        cacheService.del(url);
      } else {
        const resolvedIn = Date.now() - startTime;
        logger.info(`[Route] ⚡ Önbellekten döndü (${resolvedIn}ms): ${cachedResult.streamUrl}`);
        return res.status(200).json({
          success: true,
          status: 'success',
          cached: true,
          streamUrl:   cachedResult.streamUrl,
          type:        cachedResult.type,
          headers:     cachedResult.headers,
          pageTitle:   cachedResult.pageTitle || '',
          resolvedIn,
          data: {
            streamUrl:   cachedResult.streamUrl,
            type:        cachedResult.type,
            headers:     cachedResult.headers,
            pageTitle:   cachedResult.pageTitle || '',
            resolvedIn
          }
        });
      }
    }

    try {
      // 2. Aşama: Hızlı HTTP Ayrıştırma (Fast-Path, 200-500ms)
      let result = await fastResolve(url, { timeout: Math.min(resolveTimeout, 5000) });

      // 3. Aşama: Başarısızsa Tam Donanımlı Stealth Playwright Motoru
      if (!result) {
        result = await resolveStreamUrl(url, { timeout: resolveTimeout });
      }

      const resolvedIn = Date.now() - startTime;

      // ── Stream Bulunamadı ───────────────────────────────────────────────────

      if (!result) {
        logger.warn(`[Route] Stream bulunamadı (${resolvedIn}ms): ${url}`);
        return res.status(404).json({
          success: false,
          error:
            'Bu sayfada oynatılabilir bir video akışı bulunamadı. ' +
            'Sayfa giriş gerektiriyor veya video farklı bir yöntemle yüklenmiş olabilir.',
          code: 'STREAM_NOT_FOUND',
          resolvedIn,
        });
      }

      // Başarılı sonucu önbelleğe al (altyazı dosyalarını ASLA önbelleğe alma)
      const lowerRes = (result.streamUrl || '').toLowerCase();
      if (!lowerRes.endsWith('.vtt') && !lowerRes.endsWith('.srt') && !lowerRes.includes('/vtt/')) {
        cacheService.set(url, result);
      }

      // ── Başarılı ───────────────────────────────────────────────────────────

      logger.info(
        `[Route] ✅ Başarılı — ${result.type.toUpperCase()} (${resolvedIn}ms): ${result.streamUrl}`,
      );

      return res.status(200).json({
        success: true,
        status: 'success',
        cached: false,
        streamUrl:   result.streamUrl,
        type:        result.type,           // "m3u8" | "mp4"
        headers:     result.headers,        // Referer, User-Agent, Origin
        pageTitle:   result.pageTitle || '',
        resolvedIn,
        data: {
          streamUrl:   result.streamUrl,
          type:        result.type,
          headers:     result.headers,
          pageTitle:   result.pageTitle || '',
          resolvedIn
        }
      });

    } catch (err) {
      const resolvedIn = Date.now() - startTime;
      logger.error(`[Route] Hata (${resolvedIn}ms): ${err.message}`);

      // ── Timeout Hatası ─────────────────────────────────────────────────────
      if (
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.toLowerCase().includes('exceeded')
      ) {
        return res.status(408).json({
          success: false,
          error: `Sayfa ${Math.round(resolveTimeout / 1000)} saniye içinde yanıt vermedi. ` +
                 'Lütfen daha yüksek bir timeout değeri deneyin.',
          code: 'TIMEOUT',
          resolvedIn,
        });
      }

      // ── Genel Hata ─────────────────────────────────────────────────────────
      return res.status(500).json({
        success: false,
        error: 'Stream çözülürken beklenmeyen bir hata oluştu.',
        code: 'RESOLVER_ERROR',
        resolvedIn,
      });
    }
  },
);


// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/proxy
 *
 * HLS m3u8/txt ve TS/MP4 medya parçacıklarını Referer/Origin başlıklarıyla çeker
 * ve tarayıcıya CORS uyumlu olarak iletir.
 */
router.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer || '';
  const origin = req.query.origin || '';
  const userAgent =
    req.query['user-agent'] ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  // CORS başlıklarını ekle
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Origin, Referer, User-Agent');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
  res.setHeader('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let effectiveReferer = referer;
    if (!effectiveReferer || effectiveReferer === 'about:blank') {
      if (targetUrl.includes('rapidvid') || targetUrl.includes('fullhdfilmizlesene')) {
        effectiveReferer = 'https://rapidvid.net/';
      } else if (targetUrl.includes('closeload') || targetUrl.includes('filmmakinesi')) {
        effectiveReferer = 'https://closeload.filmmakinesi.to/';
      } else if (targetUrl.includes('playmix') || targetUrl.includes('hdfilmcehennemi')) {
        effectiveReferer = 'https://hdfilmcehennemi.mobi/';
      }
    }

    const effectiveOrigin = origin || (() => {
      try { return new URL(effectiveReferer).origin; } catch { return ''; }
    })();

    const fetchHeaders = {
      'User-Agent': userAgent,
    };
    if (effectiveReferer) fetchHeaders['Referer'] = effectiveReferer;
    if (effectiveOrigin) fetchHeaders['Origin'] = effectiveOrigin;
    if (req.headers.range) fetchHeaders['Range'] = req.headers.range;

    let response = await fetch(targetUrl, { headers: fetchHeaders });

    // Eğer ilk referer ile 403 veya 404 dönerse, alternatif Referer ile tekrar dene
    if (!response.ok && (response.status === 403 || response.status === 404)) {
      const fallbackReferers = [
        'https://rapidvid.net/',
        'https://closeload.filmmakinesi.to/',
        'https://hdfilmcehennemi.mobi/',
        '',
      ];
      for (const fbRef of fallbackReferers) {
        if (fbRef === effectiveReferer) continue;
        const fbHeaders = { 'User-Agent': userAgent };
        if (fbRef) fbHeaders['Referer'] = fbRef;
        if (req.headers.range) fbHeaders['Range'] = req.headers.range;
        const fbRes = await fetch(targetUrl, { headers: fbHeaders });
        if (fbRes.ok) {
          response = fbRes;
          effectiveReferer = fbRef;
          logger.info(`[Proxy] Fallback Referer çalıştı: ${fbRef}`);
          break;
        }
      }
    }

    if (!response.ok && response.status !== 206) {
      logger.warn(`[Proxy] Fetch failed (${response.status}): ${targetUrl} (Referer: ${effectiveReferer})`);
      return res.status(response.status).send(`Proxy fetch failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isManifest =
      targetUrl.includes('.m3u8') ||
      targetUrl.includes('.txt') ||
      contentType.includes('mpegurl') ||
      contentType.includes('mpegURL') ||
      (contentType.includes('text/plain') && !targetUrl.includes('.ts'));

    if (isManifest) {
      const text = await response.text();
      // Playlist format kontrolü
      if (text.includes('#EXTM3U') || targetUrl.includes('.m3u8') || targetUrl.includes('.txt')) {
        const baseUrl = new URL(targetUrl);
        const lines = text.split('\n');
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            // URI attribute içeren etiketleri tünelle (EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA vb.)
            if (trimmed.includes('URI="')) {
              return line.replace(/URI="([^"]+)"/g, (match, uri) => {
                try {
                  const absoluteUri = new URL(uri, baseUrl).href;
                  const proxiedUri = `/api/proxy?url=${encodeURIComponent(absoluteUri)}&referer=${encodeURIComponent(effectiveReferer)}&origin=${encodeURIComponent(effectiveOrigin)}`;
                  return `URI="${proxiedUri}"`;
                } catch {
                  return match;
                }
              });
            }
            return line;
          }
          // Segment veya alt playlist URL'sini tünelle
          try {
            const absoluteSegmentUrl = new URL(trimmed, baseUrl).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteSegmentUrl)}&referer=${encodeURIComponent(effectiveReferer)}&origin=${encodeURIComponent(effectiveOrigin)}`;
          } catch {
            return line;
          }
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.status(200).send(rewrittenLines.join('\n'));
      } else {
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        return res.status(response.status).send(text);
      }
    } else {
      // TS / MP4 / Medya chunk'ları
      res.setHeader('Content-Type', contentType || 'video/mp2t');
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range'));
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }

      res.status(response.status);
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    logger.error(`[Proxy] Error fetching ${targetUrl}: ${err.message}`);
    return res.status(500).send('Proxy internal error');
  }
});

// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;

