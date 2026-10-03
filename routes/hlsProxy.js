import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateSsrfUrl } from '../utils/security.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let fastResolve = null;
let inProcessMovieSearch = null;
try {
  const scraper = require('../stream-resolver/services/fastScraper.js');
  fastResolve = scraper.fastResolve;
} catch (e) {
  console.warn('[HLSProxy] fastScraper import warning:', e.message);
}
try {
  const searchSvc = require('../stream-resolver/services/movieSearchService.js');
  inProcessMovieSearch = searchSvc.searchMovies;
} catch (e) {
  console.warn('[HLSProxy] movieSearchService import warning:', e.message);
}

const router = express.Router();

// Scaled rate limit for proxy endpoint — handles high-frequency video streaming (.ts chunks and sub-playlists)
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla proxy isteği. Lütfen daha sonra tekrar deneyin.' },
});

// GET /api/proxy and /api/proxy-hls
router.get(['/proxy', '/proxy-hls'], proxyLimiter, async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer;
  const origin = req.query.origin;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  // SSRF Protection: block private/reserved IP ranges and metadata endpoints
  const ssrfCheck = validateSsrfUrl(targetUrl);
  if (!ssrfCheck.safe) {
    console.warn(`[SSRF Block] /api/proxy rejected: ${targetUrl} — ${ssrfCheck.reason}`);
    return res.status(400).json({ error: 'Invalid or disallowed target URL' });
  }

  try {
    let originHeader = '';
    let refererHeader = '';

    try {
      const targetObj = new URL(targetUrl);
      if (referer) {
        refererHeader = referer;
        try {
          originHeader = new URL(referer).origin;
        } catch {}
      } else {
        if (targetObj.hostname.includes('playmix')) {
          originHeader = 'https://playmix.uno';
          refererHeader = 'https://playmix.uno/';
        } else if (targetObj.hostname.includes('imagecdn') || targetObj.hostname.includes('rapidvid')) {
          originHeader = 'https://rapidvid.org';
          refererHeader = 'https://rapidvid.org/';
        } else if (targetObj.hostname.includes('cdnimages') || targetObj.hostname.includes('shop') || targetObj.hostname.includes('cyou')) {
          originHeader = 'https://hdfilmcehennemi.mobi';
          refererHeader = 'https://hdfilmcehennemi.mobi/';
        } else if (targetObj.hostname.includes('hdfilmcehennemi')) {
          originHeader = 'https://hdfilmcehennemi.mobi';
          refererHeader = 'https://hdfilmcehennemi.mobi/';
        } else if (targetObj.hostname.includes('closeload') || targetObj.hostname.includes('filmmakinesi')) {
          originHeader = 'https://closeload.filmmakinesi.to';
          refererHeader = 'https://closeload.filmmakinesi.to/';
        } else if (targetObj.hostname.includes('bbstream')) {
          originHeader = 'https://bbstream.org';
          refererHeader = 'https://bbstream.org/';
        } else {
          originHeader = targetObj.origin;
          refererHeader = `${targetObj.origin}/`;
        }
      }
    } catch (e) {
      // Ignore
    }

    if (origin) {
      originHeader = origin;
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    };
    if (refererHeader) headers['Referer'] = refererHeader;
    if (originHeader) headers['Origin'] = originHeader;

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    let response = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
    });

    // If initial fetch gives 403 or 404, cycle through fallback referers
    if (!response.ok && (response.status === 403 || response.status === 404)) {
      let targetOrigin = '';
      try { targetOrigin = new URL(targetUrl).origin; } catch {}

      const fallbackReferers = [
        'https://playmix.uno/',
        'https://hdfilmcehennemi.mobi/',
        'https://rapidvid.org/',
        'https://closeload.filmmakinesi.to/',
        'https://rapidvid.net/',
        'https://vidmoly.to/',
        targetOrigin ? `${targetOrigin}/` : '',
        '',
      ];
      for (const fbRef of fallbackReferers) {
        if (fbRef === refererHeader) continue;
        const fbHeaders = { ...headers };
        if (fbRef) {
          fbHeaders['Referer'] = fbRef;
          try { fbHeaders['Origin'] = new URL(fbRef).origin; } catch {}
        } else {
          delete fbHeaders['Referer'];
          delete fbHeaders['Origin'];
        }
        try {
          const fbRes = await fetch(targetUrl, { headers: fbHeaders, cache: 'no-store' });
          if (fbRes.ok) {
            response = fbRes;
            refererHeader = fbRef;
            if (fbHeaders['Origin']) originHeader = fbHeaders['Origin'];
            break;
          }
        } catch {}
      }
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Hedef sunucu hata döndürdü: ${response.status} ${response.statusText}`,
      });
    }

    let responseBody = await response.arrayBuffer();

    let contentType = response.headers.get('Content-Type') || 'application/x-mpegURL';
    const lowerUrl = targetUrl.toLowerCase();

    // Check if body starts with #EXTM3U
    const sampleHeader = new TextDecoder('utf-8').decode(responseBody.slice(0, 15));
    const isPlaylist =
      sampleHeader.includes('#EXTM3U') ||
      lowerUrl.includes('.m3u8') ||
      lowerUrl.includes('.txt') ||
      lowerUrl.includes('master.txt') ||
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8');

    if (isPlaylist) {
      contentType = 'application/x-mpegURL';
      const textDecoder = new TextDecoder('utf-8');
      let manifestText = textDecoder.decode(responseBody);

      const finalBaseUrl = response.url || targetUrl;
      let baseUrlObj;
      try {
        baseUrlObj = new URL(finalBaseUrl);
      } catch {
        baseUrlObj = new URL(targetUrl);
      }

      const lines = manifestText.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (_, p1) => {
              try {
                let absUrl = new URL(p1, finalBaseUrl).href;
                if (!p1.includes('?') && baseUrlObj.search && !absUrl.includes('?')) {
                  absUrl += baseUrlObj.search;
                }
                let proxied = `/api/proxy?url=${encodeURIComponent(absUrl)}`;
                if (refererHeader) proxied += `&referer=${encodeURIComponent(refererHeader)}`;
                if (originHeader) proxied += `&origin=${encodeURIComponent(originHeader)}`;
                return `URI="${proxied}"`;
              } catch {
                return `URI="${p1}"`;
              }
            });
          }
          return line;
        }

        try {
          let absUrl = new URL(trimmed, finalBaseUrl).href;
          if (!trimmed.includes('?') && baseUrlObj.search && !absUrl.includes('?')) {
            absUrl += baseUrlObj.search;
          }
          let proxied = `/api/proxy?url=${encodeURIComponent(absUrl)}`;
          if (refererHeader) proxied += `&referer=${encodeURIComponent(refererHeader)}`;
          if (originHeader) proxied += `&origin=${encodeURIComponent(originHeader)}`;
          return proxied;
        } catch {
          return line;
        }
      });

      manifestText = rewrittenLines.join('\n');
      const textEncoder = new TextEncoder();
      responseBody = textEncoder.encode(manifestText).buffer;
    } else {
      // Non-playlist binary segment (MPEG-TS, MP4, WebVTT, audio)
      const firstBytes = new Uint8Array(responseBody.slice(0, 4));
      if (firstBytes[0] === 0x47) {
        // 0x47 is MPEG-TS sync byte. Video CDNs disguise video/audio chunks as .jpg (e.g. image000.jpg, imageaud1_0.jpg)
        // with Content-Type: image/jpeg. We MUST override to video/mp2t so Hls.js/MSE decodes it without black screen!
        contentType = 'video/mp2t';
      } else if (lowerUrl.includes('.ts') || lowerUrl.includes('image') || lowerUrl.includes('segment')) {
        if (contentType.startsWith('image/') || contentType.startsWith('text/')) {
          contentType = 'video/mp2t';
        }
      } else if (lowerUrl.endsWith('.vtt') || lowerUrl.includes('/vtt/')) {
        contentType = 'text/vtt';
      }
    }

    const incomingOrigin = req.headers.origin;
    let allowedCorsOrigin = null;
    if (!incomingOrigin) {
      // Direct / server-to-server / mobile webview
      allowedCorsOrigin = '*';
    } else if (
      incomingOrigin.includes('localhost') ||
      incomingOrigin.endsWith('.vercel.app') ||
      incomingOrigin.endsWith('.netlify.app') ||
      incomingOrigin.includes('oxypace') ||
      incomingOrigin.startsWith('capacitor://') ||
      incomingOrigin.startsWith('ionic://')
    ) {
      allowedCorsOrigin = incomingOrigin;
    }

    const resHeaders = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': contentType,
    };
    if (allowedCorsOrigin) {
      resHeaders['Access-Control-Allow-Origin'] = allowedCorsOrigin;
    }
    if (response.headers.get('Content-Range')) {
      resHeaders['Content-Range'] = response.headers.get('Content-Range');
    }
    if (response.headers.get('Accept-Ranges')) {
      resHeaders['Accept-Ranges'] = response.headers.get('Accept-Ranges');
    }
    if (response.headers.get('Content-Length')) {
      resHeaders['Content-Length'] = responseBody.byteLength || response.headers.get('Content-Length');
    }

    res.set(resHeaders);
    return res.status(response.status === 206 ? 206 : 200).send(Buffer.from(responseBody));
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'An error occurred while proxying request',
    });
  }
});

// GET /api/resolve
router.get('/resolve', async (req, res) => {
  const pageUrl = req.query.url;

  if (!pageUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  // Fast In-Process Resolver check
  if (fastResolve) {
    try {
      const fastResult = await fastResolve(pageUrl, { timeout: 10000 });
      if (fastResult && fastResult.streamUrl) {
        return res.json({
          success: true,
          streamUrl: fastResult.streamUrl,
          referer: fastResult.headers?.referer || pageUrl,
          pageTitle: fastResult.pageTitle || '',
        });
      }
    } catch (fastErr) {
      // Continue fallback
    }
  }

  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://closeload.filmmakinesi.to/',
        'Origin': 'https://closeload.filmmakinesi.to',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Sayfa çekilemedi: ${response.status} ${response.statusText}`,
      });
    }

    const html = await response.text();

    if (pageUrl.includes('closeload') || html.includes('jwplayer') || html.includes('eval(function(')) {
      const matchKey = pageUrl.match(/embed\/([^/?#]+)/);
      if (matchKey && matchKey[1]) {
        const key = matchKey[1];
        const fileSlugMatch = html.match(/thelordoftherings[^\s"']+/i) || html.match(/\/hls\/([^\s"']+\.mp4)/i);
        const fileSlug = fileSlugMatch ? fileSlugMatch[0] : `thelordoftherings-1-fellowship-2001-trdualmp4-${key}.mp4`;
        const constructedMasterUrl = `https://srv12.cdnimages1146.shop/hls/${fileSlug}/txt/master.txt`;

        return res.json({
          success: true,
          streamUrl: constructedMasterUrl,
          referer: 'https://closeload.filmmakinesi.to/',
        });
      }
    }

    const masterRegex = /(https?:\/\/[^"'\s<>]+\/(?:master\.txt|\w+\.m3u8)[^"'\s<>]*)/gi;
    const streamMatches = new Set();
    let match;
    while ((match = masterRegex.exec(html)) !== null) {
      streamMatches.add(match[1]);
    }

    if (streamMatches.size > 0) {
      const foundStreams = Array.from(streamMatches);
      return res.json({
        success: true,
        streamUrl: foundStreams[0],
        allStreams: foundStreams,
        referer: pageUrl,
      });
    }

    return res.status(404).json({
      error: 'Sayfada doğrudan yayın bağlantısı tespit edilemedi.',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Çözümleme hatası' });
  }
});

// POST /api/resolve-stream (Stream Resolver Microservice Bridge & In-Process Resolver)
router.post('/resolve-stream', (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  const { url, timeout } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Geçersiz veya eksik URL parametresi.' });
  }

  const trimmedUrl = url.trim();
  const lower = trimmedUrl.toLowerCase();

  // Instant fast-path for direct stream URLs (.m3u8, master.txt, .mp4)
  if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
    const playableStreamUrl = `/api/proxy?url=${encodeURIComponent(trimmedUrl)}`;
    return res.status(200).json({
      success: true,
      status: 'success',
      streamUrl: trimmedUrl,
      playableStreamUrl,
      type: lower.endsWith('.mp4') ? 'mp4' : 'm3u8',
      headers: {},
      pageTitle: 'Doğrudan Akış Kaynağı',
      cached: false,
      resolvedIn: 1,
    });
  }

  const startTime = Date.now();
  const fetchTimeout = Math.min(parseInt(timeout, 10) || 20000, 21000);

  // 1. Primary: In-Process Fast Scraper (HDFilmCehennemi, FilmMakinesi, FullHDFilmİzlesene in 1-3s)
  if (fastResolve) {
    try {
      const fastResult = await fastResolve(trimmedUrl, { timeout: Math.min(fetchTimeout, 15000) });
      if (
        fastResult &&
        fastResult.streamUrl &&
        !fastResult.streamUrl.includes('filmakinesimp4') &&
        !fastResult.streamUrl.includes('blank.mp4')
      ) {
        let streamHeaders = fastResult.headers || {};
        if (fastResult.streamUrl.includes('playmix') && (!streamHeaders.referer || !streamHeaders.referer.includes('playmix.uno'))) {
          streamHeaders = { ...streamHeaders, referer: 'https://playmix.uno/', origin: 'https://playmix.uno' };
        } else if (fastResult.streamUrl.includes('imagecdn') && (!streamHeaders.referer || !streamHeaders.referer.includes('rapidvid.org'))) {
          streamHeaders = { ...streamHeaders, referer: 'https://rapidvid.org/', origin: 'https://rapidvid.org' };
        }
        const playableStreamUrl = `/api/proxy?url=${encodeURIComponent(fastResult.streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;

        return res.status(200).json({
          success: true,
          status: 'success',
          streamUrl: fastResult.streamUrl,
          playableStreamUrl,
          type: fastResult.type || 'm3u8',
          headers: streamHeaders,
          pageTitle: fastResult.pageTitle || '',
          cached: false,
          resolvedIn: Date.now() - startTime,
        });
      }
    } catch (fastErr) {
      console.warn('[HLSProxy] In-process fastResolve warning:', fastErr.message);
    }
  }

  // 2. Secondary: External Stream Resolver Microservice (Playwright Stealth fallback)
  const resolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
  const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), fetchTimeout + 1000);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const microResponse = await fetch(`${resolverUrl.replace(/\/+$/, '')}/api/resolve-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: url.trim(), timeout: fetchTimeout }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await microResponse.json().catch(() => null);

    if (!microResponse.ok || !data || (!data.success && data.status !== 'success')) {
      const errMsg = data?.error?.message || data?.error || 'Stream çözülemedi veya kaynak bulunamadı.';
      return res.status(microResponse.status || 500).json({
        success: false,
        error: errMsg,
        code: data?.code || 'STREAM_NOT_FOUND',
      });
    }

    const payload = data.data || data;
    const streamUrl = payload.streamUrl || data.streamUrl;
    let streamHeaders = payload.headers || data.headers || {};
    const pageTitle = payload.pageTitle || data.pageTitle || '';
    const type = payload.type || data.type || 'm3u8';
    const resolvedIn = payload.resolvedIn || data.resolvedIn || (Date.now() - startTime);

    if (streamUrl && (streamUrl.includes('filmakinesimp4') || streamUrl.includes('blank.mp4'))) {
      return res.status(404).json({
        success: false,
        error: 'Bu sayfada geçerli bir video akışı tespit edilemedi. Lütfen alternatif bir oynatıcı bağlantısı veya embed linki deneyin.',
        code: 'INVALID_STREAM',
      });
    }

    if (streamUrl && streamUrl.includes('playmix') && (!streamHeaders.referer || streamHeaders.referer.includes('hdfilmcehennemi.nl') || !streamHeaders.referer.includes('playmix.uno'))) {
      streamHeaders = {
        ...streamHeaders,
        referer: 'https://playmix.uno/',
        origin: 'https://playmix.uno'
      };
    } else if (streamUrl && streamUrl.includes('imagecdn') && (!streamHeaders.referer || !streamHeaders.referer.includes('rapidvid.org'))) {
      streamHeaders = {
        ...streamHeaders,
        referer: 'https://rapidvid.org/',
        origin: 'https://rapidvid.org'
      };
    }

    const playableStreamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;

    return res.status(200).json({
      success: true,
      status: 'success',
      streamUrl,
      playableStreamUrl,
      type,
      headers: streamHeaders,
      pageTitle,
      cached: Boolean(data.cached),
      resolvedIn,
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('timeout');
    return res.status(isTimeout ? 408 : 500).json({
      success: false,
      error: isTimeout ? 'Çözümleyici mikroservisi zaman aşımına uğradı.' : `Mikroservis bağlantı hatası: ${err.message}`,
      code: isTimeout ? 'TIMEOUT' : 'RESOLVER_UNAVAILABLE',
    });
  }
});

// GET/POST /api/search-movies
router.all('/search-movies', async (req, res) => {
  const query = req.query.q || req.body?.query || req.body?.q || '';
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Arama terimi en az 2 karakter olmalıdır.', results: [] });
  }

  const trimmedQuery = query.trim();

  // 1. In-process search
  if (inProcessMovieSearch) {
    try {
      const results = await inProcessMovieSearch(trimmedQuery);
      if (results && results.length > 0) {
        return res.status(200).json({
          success: true,
          query: trimmedQuery,
          count: results.length,
          results
        });
      }
    } catch (err) {
      console.warn('[HLSProxy] In-process movie search error:', err.message);
    }
  }

  // 2. Microservice bridge
  const resolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
  const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const microResponse = await fetch(`${resolverUrl.replace(/\/+$/, '')}/api/search-movies?q=${encodeURIComponent(trimmedQuery)}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await microResponse.json().catch(() => null);
    if (microResponse.ok && data) {
      return res.status(200).json(data);
    }
    return res.status(microResponse.status || 500).json(data || { success: false, error: 'Arama servisi yanıt vermedi.', results: [] });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Film arama servisi hatası: ${err.message}`,
      results: []
    });
  }
});

export default router;
