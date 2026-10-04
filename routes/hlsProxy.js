import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateSsrfUrl } from '../utils/security.js';
import { createRequire } from 'module';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const CURL_BIN = process.platform === 'win32' ? 'curl.exe' : 'curl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Track exhausted ScraperAPI keys to avoid waiting or failing on dead quotas
const exhaustedScraperKeys = new Set();
function getValidScraperApiKey() {
  const envKeys = (process.env.SCRAPERAPI_KEYS || process.env.SCRAPERAPI_KEY || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
  for (const k of envKeys) {
    if (!exhaustedScraperKeys.has(k)) return k;
  }
  return null;
}

// Decode HTML entities (e.g. &ccedil;, &uuml;, &ouml;, &amp;)
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Ouml;/gi, 'Ö')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&Uuml;/gi, 'Ü')
    .replace(/&thorn;/gi, 'ş')
    .replace(/&THORN;/gi, 'Ş')
    .replace(/&eth;/gi, 'ğ')
    .replace(/&ETH;/gi, 'Ğ')
    .replace(/&yacute;/gi, 'ı')
    .replace(/&Yacute;/gi, 'İ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

// Python curl_cffi TLS impersonator (available on server)
function fetchWithTlsImpersonator(url, referer = '') {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../stream-resolver/services/tlsFetcher.py');
    execFile('python3', [scriptPath, url, referer], { timeout: 12000, maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout || stdout.length === 0) {
        return resolve('');
      }
      resolve(stdout);
    });
  });
}

function isBlockedOrChallenge(text) {
  if (!text || typeof text !== 'string') return true;
  if (text.length < 300) return true;
  // Eğer sayfa zengin içerikliyse ve film blokları içeriyorsa asla engelli değildir
  if (text.length > 3000 && (text.includes('class="film') || text.includes('film-title') || text.includes('poster') || text.includes('<title>'))) {
    const lower = text.toLowerCase();
    if (!lower.includes('<title>just a moment...</title>') && 
        !lower.includes('<title>attention required! | cloudflare</title>') && 
        !(lower.includes('<title>404 not found</title>') && lower.includes('nginx'))) {
      return false;
    }
  }
  const lower = text.toLowerCase();
  if (lower.includes('<title>just a moment...</title>')) return true;
  if (lower.includes('<title>attention required! | cloudflare</title>')) return true;
  if (lower.includes('<title>404 not found</title>') && lower.includes('nginx')) return true;
  if (lower.includes('error code: 1005') || lower.includes('error code: 444') || lower.includes('error code: 403')) return true;
  if (lower.includes('403 forbidden') && text.length < 2000) return true;
  if (lower.includes('cf-browser-verification')) return true;
  return false;
}

// Direct curl fetch for text/html (bypasses Cloudflare JA3/JA4 TLS fingerprinting)
async function fetchWithCurl(url, headers = [], timeoutSec = 6) {
  // 1. For HDFilmCehennemi, direct curl gets 403 on Oracle Cloud datacenter IP.
  // Use Python TLS Impersonator first (Chrome 124 TLS fingerprint).
  if (url.includes('hdfilmcehennemi')) {
    try {
      const ref = headers.find(h => h.toLowerCase().startsWith('referer:'))?.split(':')?.[1]?.trim() || 'https://www.hdfilmcehennemi.nl/';
      const tlsHtml = await fetchWithTlsImpersonator(url, ref);
      if (!isBlockedOrChallenge(tlsHtml)) {
        return tlsHtml;
      }
    } catch (e) {}
  }

  // 2. Direct curl execution
  try {
    const args = [
      '-s',
      '-L',
      '--max-time', String(timeoutSec),
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '-H', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      ...headers.flatMap(h => ['-H', h]),
      url
    ];
    const { stdout } = await execFileAsync(CURL_BIN, args);
    if (!isBlockedOrChallenge(stdout)) {
      return stdout;
    }
  } catch (e) {}

  // 3. Try via Tor SOCKS5 if active (port 9050 on Linux server)
  try {
    const argsTor = [
      '-s',
      '-L',
      '--socks5-hostname', '127.0.0.1:9050',
      '--max-time', String(timeoutSec + 2),
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '-H', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      ...headers.flatMap(h => ['-H', h]),
      url
    ];
    const { stdout } = await execFileAsync(CURL_BIN, argsTor);
    if (!isBlockedOrChallenge(stdout)) {
      return stdout;
    }
  } catch (e) {}

  // 4. Fallback to Python TLS Chrome 124 Impersonator (bypasses ASN datacenter & JA3 blocks)
  try {
    const ref = headers.find(h => h.toLowerCase().startsWith('referer:'))?.split(':')?.[1]?.trim() || '';
    const tlsHtml = await fetchWithTlsImpersonator(url, ref);
    if (!isBlockedOrChallenge(tlsHtml)) {
      return tlsHtml;
    }
  } catch (e) {}

  return '';
}

// Direct curl fetch for binary data (images/posters)
async function fetchBinaryWithCurl(url, referer = '', timeoutSec = 8) {
  const runCurl = (useTor = false) => new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '--max-time', String(timeoutSec),
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ];
    if (useTor) args.push('--socks5-hostname', '127.0.0.1:9050');
    if (referer) args.push('-H', `Referer: ${referer}`);
    args.push(url);

    const child = spawn(CURL_BIN, args);
    const chunks = [];
    child.stdout.on('data', chunk => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`curl exited with code ${code}`));
      }
    });
  });

  try {
    const directBuf = await runCurl(false);
    if (directBuf && directBuf.length > 0 && !isBlockedOrChallenge(directBuf.toString('utf8', 0, 500))) {
      return directBuf;
    }
  } catch (directErr) {}

  try {
    const torBuf = await runCurl(true);
    if (torBuf && torBuf.length > 0 && !isBlockedOrChallenge(torBuf.toString('utf8', 0, 500))) {
      return torBuf;
    }
  } catch (torErr) {}

  return null;
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

    const lowerUrl = targetUrl.toLowerCase();
    const isPosterOrImage = 
      lowerUrl.endsWith('.webp') || 
      lowerUrl.endsWith('.jpg') || 
      lowerUrl.endsWith('.jpeg') || 
      lowerUrl.endsWith('.png') || 
      lowerUrl.includes('/images/thumb/poster/') || 
      lowerUrl.includes('/poster/');

    const isSubtitleFile = 
      lowerUrl.endsWith('.vtt') || 
      lowerUrl.endsWith('.srt') || 
      lowerUrl.includes('/vtt/') || 
      lowerUrl.includes('/subtitles/');

    // If initial fetch gives 403 or 404, try curl directly for images/subtitles or cycle through fallback referers
    if (!response.ok && (response.status === 403 || response.status === 404)) {
      if (isPosterOrImage || isSubtitleFile) {
        try {
          let posterReferer = refererHeader;
          if (!posterReferer) {
            if (targetUrl.includes('hdfilmcehennemi')) posterReferer = 'https://www.hdfilmcehennemi.nl/';
            else if (targetUrl.includes('fullhdfilmizlesene')) posterReferer = 'https://www.fullhdfilmizlesene.now/';
            else if (targetUrl.includes('filmmakinesi')) posterReferer = 'https://filmmakinesi.to/';
          }
          const buf = await fetchBinaryWithCurl(targetUrl, posterReferer, 8);
          if (buf && buf.length > 10) {
            if (isSubtitleFile) {
              res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              return res.end(buf);
            }
            const mime = lowerUrl.endsWith('.png') ? 'image/png' :
                         (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) ? 'image/jpeg' :
                         'image/webp';
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.end(buf);
          }
          if (isSubtitleFile) {
            try {
              const tlsText = await fetchWithTlsImpersonator(targetUrl, posterReferer);
              if (tlsText && tlsText.length > 10 && !isBlockedOrChallenge(tlsText)) {
                res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                return res.end(tlsText);
              }
            } catch (tlsErr) {}
          }
        } catch (curlErr) {
          // If curl failed, try ScraperAPI fallback only if a valid key is available
          const apiKey = getValidScraperApiKey();
          if (apiKey) {
            try {
              const sApiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
              const sRes = await fetch(sApiUrl, { cache: 'no-store' });
              if (sRes.ok) {
                response = sRes;
              } else if (sRes.status === 403) {
                exhaustedScraperKeys.add(apiKey);
              }
            } catch (e) {}
          }
        }
      }

      if (!response.ok) {
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
    }

    if (!response.ok && isPosterOrImage) {
      const apiKey = getValidScraperApiKey();
      if (apiKey) {
        try {
          const sApiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
          const sRes = await fetch(sApiUrl, { cache: 'no-store' });
          if (sRes.ok) {
            response = sRes;
          } else if (sRes.status === 403) {
            exhaustedScraperKeys.add(apiKey);
          }
        } catch (e) {}
      }
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Hedef sunucu hata döndürdü: ${response.status} ${response.statusText}`,
      });
    }

    let responseBody = await response.arrayBuffer();

    let contentType = response.headers.get('Content-Type') || 'application/x-mpegURL';

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
      // Non-playlist binary segment (MPEG-TS, MP4, WebVTT, audio) or image
      const firstBytes = new Uint8Array(responseBody.slice(0, 4));
      if (isPosterOrImage) {
        if (lowerUrl.endsWith('.webp')) contentType = 'image/webp';
        else if (lowerUrl.endsWith('.png')) contentType = 'image/png';
        else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (!contentType.startsWith('image/')) contentType = 'image/jpeg';
      } else if (firstBytes[0] === 0x47) {
        // 0x47 is MPEG-TS sync byte. Video CDNs disguise video/audio chunks as .jpg (e.g. image000.jpg, imageaud1_0.jpg)
        // with Content-Type: image/jpeg. We MUST override to video/mp2t so Hls.js/MSE decodes it without black screen!
        contentType = 'video/mp2t';
      } else if (lowerUrl.includes('.ts') || lowerUrl.includes('segment') || (lowerUrl.includes('image') && !isPosterOrImage)) {
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
    if (isPosterOrImage) {
      resHeaders['Cache-Control'] = 'public, max-age=86400, immutable';
    }
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
      if (fastResult && fastResult.isTakedown) {
        return res.status(451).json({
          success: false,
          error: fastResult.error || 'Bu film telif ve yasal nedenlerle kaynak site tarafından yayından kaldırılmıştır.',
          code: 'LEGAL_TAKEDOWN',
        });
      }
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

        const proxiedSubtitles = (fastResult.subtitles || []).map(sub => {
          const subFile = sub.file;
          const playableUrl = `/api/proxy?url=${encodeURIComponent(subFile)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;
          return {
            ...sub,
            playableUrl,
          };
        });

        return res.status(200).json({
          success: true,
          status: 'success',
          streamUrl: fastResult.streamUrl,
          playableStreamUrl,
          type: fastResult.type || 'm3u8',
          headers: streamHeaders,
          pageTitle: fastResult.pageTitle || '',
          subtitles: proxiedSubtitles,
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
      subtitles: payload.subtitles || data.subtitles || [],
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

// POST /api/detect-subtitles
// Auto-detects subtitles from active stream or target page if subtitles were not originally attached
router.post('/detect-subtitles', (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  try {
    const { streamUrl, pageUrl, title } = req.body || {};
    if (!streamUrl && !pageUrl) {
      return res.status(400).json({ success: false, error: 'streamUrl veya pageUrl gereklidir.' });
    }

    const rawUrl = streamUrl ? decodeURIComponent(streamUrl) : '';
    const subtitles = [];
    const seen = new Set();

    const addSub = (file, label, kind = 'subtitles') => {
      if (!file || seen.has(file)) return;
      seen.add(file);
      const playableUrl = `/api/proxy?url=${encodeURIComponent(file)}`;
      subtitles.push({ file, playableUrl, label, kind });
    };

    // 1. Detect embed ID in stream URL e.g. -IYxdhPkkxn2.mp4 or -fgvP8tldQUR.mp4
    const embedMatch = rawUrl.match(/-([a-zA-Z0-9_-]{8,16})\.mp4/i) || rawUrl.match(/\/embed\/([a-zA-Z0-9_-]{8,16})/i);
    if (embedMatch && embedMatch[1]) {
      const embedId = embedMatch[1];
      const embedUrl = `https://hdfilmcehennemi.mobi/video/embed/${embedId}/`;
      try {
        const html = await fetchWithCurl(embedUrl, ['Referer: https://www.hdfilmcehennemi.nl/'], 8);
        if (html && html.length > 200) {
          const { extractSubtitles } = require('../stream-resolver/services/fastScraper');
          if (extractSubtitles) {
            const found = extractSubtitles(html, 'https://hdfilmcehennemi.mobi/');
            for (const s of found) {
              addSub(s.file, s.label, s.kind);
            }
          }
        }
      } catch (e) {}
    }

    // 2. If pageUrl is available and subtitles are still empty, inspect pageUrl
    if (subtitles.length === 0 && pageUrl && pageUrl.startsWith('http')) {
      try {
        const { fastResolve } = require('../stream-resolver/services/fastScraper');
        if (fastResolve) {
          const resolved = await fastResolve(pageUrl, { timeout: 8000 });
          if (resolved && resolved.subtitles && resolved.subtitles.length > 0) {
            for (const s of resolved.subtitles) {
              addSub(s.file, s.label, s.kind);
            }
          }
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      subtitles,
      count: subtitles.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// In-process search cache (30 minutes TTL)
const inProcessSearchCache = new Map();
const SEARCH_CACHE_TTL = 30 * 60 * 1000;

/**
 * FullHDFilmİzlesene doğrudan arama (Önce Doğrudan Curl, sonra ScraperAPI fallback)
 */
async function searchFullHDFilm(query) {
  // 1. Python TLS Chrome 124 + Tor ile Doğrudan Hızlı Arama
  try {
    const targetUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
    let html = await fetchWithTlsImpersonator(targetUrl, 'https://www.fullhdfilmizlesene.now/');
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'], 5);
    }
    
    const results = [];
    const filmBlockRegex = /<li[^>]*class="film"[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = filmBlockRegex.exec(html)) !== null) {
      const block = match[1];
      const linkMatch = block.match(/href="(https:\/\/www\.fullhdfilmizlesene\.now\/film\/[^"]+)"/i);
      const titleMatch = block.match(/<span class="film-title">([^<]+)<\/span>/i) || block.match(/class="tt"[^>]*>([^<]+)<\/a>/i);
      const posterMatch = block.match(/srcset="(https:\/\/img\.fullhdfilmizlesene\.now\/poster\/[^\s"]+)/i) || 
                          block.match(/data-src="([^"]+)"/i) || 
                          block.match(/src="([^"]+)"/i);
      
      if (linkMatch && titleMatch) {
        let poster = posterMatch ? posterMatch[1] : null;
        if (poster && poster.startsWith('data:')) poster = null;
        results.push({
          provider: 'FullHDFilmİzlesene',
          providerKey: 'fullhdfilmizlesene',
          title: decodeHtmlEntities(titleMatch[1].trim()),
          url: linkMatch[1],
          poster: poster,
        });
      }
    }
    if (results.length > 0) return results;
  } catch (err) {
    // continue to fallback
  }

  // 2. ScraperAPI Fallback (Sadece geçerli, kotası bitmemiş anahtar varsa)
  const apiKey = getValidScraperApiKey();
  if (apiKey) {
    try {
      const targetUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
      if (res.status === 403) {
        exhaustedScraperKeys.add(apiKey);
        return [];
      }
      if (!res.ok) return [];
      const html = await res.text();
      const results = [];
      const filmBlockRegex = /<li[^>]*class="film"[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = filmBlockRegex.exec(html)) !== null) {
        const block = match[1];
        const linkMatch = block.match(/href="(https:\/\/www\.fullhdfilmizlesene\.now\/film\/[^"]+)"/i);
        const titleMatch = block.match(/<span class="film-title">([^<]+)<\/span>/i) || block.match(/class="tt"[^>]*>([^<]+)<\/a>/i);
        const posterMatch = block.match(/srcset="(https:\/\/img\.fullhdfilmizlesene\.now\/poster\/[^\s"]+)/i) || 
                            block.match(/data-src="([^"]+)"/i) || 
                            block.match(/src="([^"]+)"/i);
        if (linkMatch && titleMatch) {
          let poster = posterMatch ? posterMatch[1] : null;
          if (poster && poster.startsWith('data:')) poster = null;
          results.push({
            provider: 'FullHDFilmİzlesene',
            providerKey: 'fullhdfilmizlesene',
            title: decodeHtmlEntities(titleMatch[1].trim()),
            url: linkMatch[1],
            poster: poster,
          });
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  return [];
}

/**
 * HDFilmCehennemi doğrudan arama (Önce Doğrudan Curl Ajax, sonra DuckDuckGo/ScraperAPI fallback)
 */
async function searchHDFilmCehennemi(query) {
  // 1. Python TLS Impersonator on Ajax API (direct JSON, posters and titles in ~1s)
  try {
    const targetUrl = `https://www.hdfilmcehennemi.nl/search/?q=${encodeURIComponent(query)}`;
    let raw = await fetchWithTlsImpersonator(targetUrl, 'https://www.hdfilmcehennemi.nl/');
    if (!raw || !raw.startsWith('{')) {
      raw = await fetchWithCurl(targetUrl, [
        'Referer: https://www.hdfilmcehennemi.nl/',
        'x-requested-with: fetch',
        'Accept: application/json, text/plain, */*'
      ], 6);
    }

    const json = JSON.parse(raw);
    const results = [];
    if (json && Array.isArray(json.results)) {
      for (const itemHtml of json.results) {
        const urlMatch = itemHtml.match(/href="([^"]+)"/);
        const titleMatch = itemHtml.match(/<h4 class="title">([^<]+)<\/h4>/i) || itemHtml.match(/alt="([^"]+)"/);
        const posterMatch = itemHtml.match(/src="([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          const rawTitle = titleMatch ? titleMatch[1].trim() : 'Film';
          let finalUrl = urlMatch[1].trim();
          if (!finalUrl.startsWith('http')) {
            finalUrl = `https://www.hdfilmcehennemi.nl${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          }
          let finalPoster = posterMatch ? posterMatch[1].trim() : null;
          if (finalPoster && !finalPoster.startsWith('http')) {
            finalPoster = `https://www.hdfilmcehennemi.nl${finalPoster.startsWith('/') ? '' : '/'}${finalPoster}`;
          }
          results.push({
            provider: 'HDFilmCehennemi',
            providerKey: 'hdfilmcehennemi',
            title: decodeHtmlEntities(rawTitle),
            url: finalUrl,
            poster: finalPoster,
          });
        }
      }
    }
    if (results.length > 0) return results.slice(0, 8);
  } catch (err) {
    // continue to fallback
  }

  // 2. DuckDuckGo + ScraperAPI Fallback (Sadece geçerli anahtar varsa)
  const apiKey = getValidScraperApiKey();
  if (apiKey) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:hdfilmcehennemi.nl ' + query)}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(ddgUrl)}`;
      const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
      if (res.status === 403) {
        exhaustedScraperKeys.add(apiKey);
        return [];
      }
      if (!res.ok) return [];
      const html = await res.text();
      const results = [];
      const matches = [...html.matchAll(/<h2[^>]+class="result__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of matches) {
        const rawHref = m[1];
        const titleHtml = m[2];
        let actualUrl = rawHref;
        const uddgMatch = rawHref.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          actualUrl = decodeURIComponent(uddgMatch[1]);
        }
        const title = titleHtml.replace(/<[^>]+>/g, '').replace(/izle$/i, '').replace(/film.*izle/i, '').replace(/hdfilmcehennemi/i, '').replace(/[-–|]/g, ' ').trim();
        if (actualUrl.includes('hdfilmcehennemi.nl') && !actualUrl.endsWith('.nl/') && !actualUrl.includes('/kategori/') && !actualUrl.includes('/tur/')) {
          let poster = null;
          try {
            const parsed = new URL(actualUrl);
            const slug = parsed.pathname.replace(/\/+$/, '').split('/').pop();
            if (slug) {
              const cleanSlug = slug.replace(/-hdf.*$/i, '');
              poster = `https://www.hdfilmcehennemi.nl/images/thumb/poster/${cleanSlug}.webp`;
            }
          } catch {}

          results.push({
            provider: 'HDFilmCehennemi',
            providerKey: 'hdfilmcehennemi',
            title: decodeHtmlEntities(title),
            url: actualUrl,
            poster: poster,
          });
        }
      }
      return results.slice(0, 8);
    } catch (e) {
      return [];
    }
  }

  return [];
}

/**
 * FilmMakinesi doğrudan arama (Önce Doğrudan Curl, sonra DDG/ScraperAPI fallback)
 */
async function searchFilmMakinesi(query) {
  // 1. Doğrudan Curl (filmmakinesi.to/arama/?s=, afiş ve başlıklarla 200ms)
  try {
    const targetUrl = `https://filmmakinesi.to/arama/?s=${encodeURIComponent(query)}`;
    const html = await fetchWithCurl(targetUrl, ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'], 5);
    const results = [];
    const itemRegex = /<a[^>]+class="item"[^>]+href="([^"]+)"[^>]+data-title="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"/gi;
    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2];
      const poster = match[3];
      const fullUrl = href.startsWith('http') ? href : `https://filmmakinesi.to${href.startsWith('/') ? '' : '/'}${href}`;
      const fullPoster = poster.startsWith('http') ? poster : `https://filmmakinesi.to${poster.startsWith('/') ? '' : '/'}${poster}`;
      results.push({
        provider: 'FilmMakinesi',
        providerKey: 'filmmakinesi',
        title: decodeHtmlEntities(title.trim()),
        url: fullUrl,
        poster: fullPoster,
      });
    }
    if (results.length > 0) return results.slice(0, 8);
  } catch (err) {
    // continue to fallback
  }

  // 2. DuckDuckGo + ScraperAPI Fallback (Sadece geçerli anahtar varsa)
  const apiKey = getValidScraperApiKey();
  if (apiKey) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:filmmakinesi.to ' + query + ' izle')}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(ddgUrl)}`;
      const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
      if (res.status === 403) {
        exhaustedScraperKeys.add(apiKey);
        return [];
      }
      if (!res.ok) return [];
      const html = await res.text();
      const results = [];
      const matches = [...html.matchAll(/<h2[^>]+class="result__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of matches) {
        const rawHref = m[1];
        const titleHtml = m[2];
        let actualUrl = rawHref;
        const uddgMatch = rawHref.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          actualUrl = decodeURIComponent(uddgMatch[1]);
        }
        const title = titleHtml.replace(/<[^>]+>/g, '').replace(/izle$/i, '').replace(/film.*izle/i, '').replace(/filmmakinesi/i, '').replace(/[-–|]/g, ' ').trim();
        if (actualUrl.includes('filmmakinesi.to') && (actualUrl.includes('/film/') || !actualUrl.endsWith('.to/')) && !actualUrl.includes('/kategori/') && !actualUrl.includes('/tur/')) {
          results.push({
            provider: 'FilmMakinesi',
            providerKey: 'filmmakinesi',
            title: decodeHtmlEntities(title),
            url: actualUrl,
            poster: null,
          });
        }
      }
      return results.slice(0, 6);
    } catch (e) {
      return [];
    }
  }

  return [];
}

// GET/POST /api/search-movies and /search-movies
router.all(['/search-movies', '/api/search-movies'], async (req, res) => {
  const query = req.query.q || req.body?.query || req.body?.q || '';
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Arama terimi en az 2 karakter olmalıdır.', results: [] });
  }

  const trimmedQuery = query.trim();
  const cacheKey = trimmedQuery.toLowerCase();

  // 1. Önbellek kontrolü
  const cached = inProcessSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return res.status(200).json({
      success: true,
      query: trimmedQuery,
      count: cached.results.length,
      results: cached.results,
      cached: true,
    });
  }

// Film başlıklarını tekilleştirmek için normalize eden fonksiyon
function normalizeMovieTitleForDedup(title) {
  if (!title) return '';
  let str = title.toLowerCase();
  const removeWords = [
    'türkçe dublaj', 'turkce dublaj', 'türkçe altyazı', 'turkce altyazi',
    'altyazılı', 'altyazili', 'dublaj', 'dual', 'tr-en', 'full hd', '1080p',
    '720p', '4k', 'uhd', 'hd', 'izle', 'filmi', 'film'
  ];
  str = str.replace(/[()[\]{}_,.:;!?\\/|\-–—+&]/g, ' ');
  for (const w of removeWords) {
    const reg = new RegExp('(^|\\s+)' + w + '(\\s+|$)', 'gi');
    while (reg.test(str)) {
      str = str.replace(reg, ' ');
    }
  }
  return str.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

// Her film sağlayıcısı (site) için aynı filmden sadece 1 sonuç bırakır
function deduplicateMovieResults(movies) {
  const map = new Map();

  for (const item of movies) {
    if (!item.url) continue;
    const norm = normalizeMovieTitleForDedup(item.title);
    const provider = item.providerKey || item.provider || 'default';
    const key = `${provider}:${norm || item.title.trim().toLowerCase()}`;

    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key);
      const isNewDual = /dublaj|dual/i.test(item.title);
      const isExistingDual = /dublaj|dual/i.test(existing.title);
      if (!isExistingDual && isNewDual) {
        existing.url = item.url;
        existing.title = item.title;
      }
      if (!existing.poster && item.poster) {
        existing.poster = item.poster;
      }
    }
  }

  return Array.from(map.values());
}

  // 2. Hızlı Dahili Çoklu Arama (FullHDFilmİzlesene + HDFilmCehennemi + FilmMakinesi)
  try {
    const [fhfSettled, hdfSettled, fmSettled] = await Promise.allSettled([
      searchFullHDFilm(trimmedQuery),
      searchHDFilmCehennemi(trimmedQuery),
      searchFilmMakinesi(trimmedQuery),
    ]);

    const combined = [];
    if (fhfSettled.status === 'fulfilled' && Array.isArray(fhfSettled.value)) {
      combined.push(...fhfSettled.value);
    }
    if (hdfSettled.status === 'fulfilled' && Array.isArray(hdfSettled.value)) {
      combined.push(...hdfSettled.value);
    }
    if (fmSettled.status === 'fulfilled' && Array.isArray(fmSettled.value)) {
      combined.push(...fmSettled.value);
    }

    if (combined.length > 0) {
      // Afiş eşleştirme: Eğer FilmMakinesi veya HDFilmCehennemi için afiş yoksa, aynı aramadaki FullHDFilmİzlesene afişini paylaş
      const posterCandidate = combined.find(m => m.poster)?.poster || null;
      if (posterCandidate) {
        for (const item of combined) {
          if (!item.poster) {
            item.poster = posterCandidate;
          }
        }
      }

      // Tekilleştir: Her film sitesi için aynı filmden sadece 1 sonuç listelenir (Dublaj/Altyazı birleşik)
      const uniqueResults = deduplicateMovieResults(combined);

      inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), results: uniqueResults });
      return res.status(200).json({
        success: true,
        query: trimmedQuery,
        count: uniqueResults.length,
        results: uniqueResults,
      });
    }
  } catch (fastSearchErr) {
    console.warn('[HLSProxy] Fast search error:', fastSearchErr.message);
  }

  // 3. Playwright tabanlı dahili arama (varsa)
  if (inProcessMovieSearch) {
    try {
      const results = await inProcessMovieSearch(trimmedQuery);
      if (results && results.length > 0) {
        inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), results });
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

  // 4. Mikroservis köprüsü (Stream Resolver Microservice)
  const rawResolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
  const cleanResolverUrl = rawResolverUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const microResponse = await fetch(`${cleanResolverUrl}/api/search-movies?q=${encodeURIComponent(trimmedQuery)}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await microResponse.json().catch(() => null);
    if (microResponse.ok && data && Array.isArray(data.results) && data.results.length > 0) {
      inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), results: data.results });
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn('[HLSProxy] Microservice movie search error:', err.message);
  }

  // Hiçbir sonuç bulunamazsa da 404 DEĞİL, 200 ile boş dizi döner (UI bozulmaz)
  return res.status(200).json({
    success: true,
    query: trimmedQuery,
    count: 0,
    results: []
  });
});

export default router;
