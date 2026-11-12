import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateSsrfUrl, safeFetch } from '../utils/security.js';
import { optionalProtect, protect } from '../middleware/auth.js';
import { Readable } from 'stream';
import { createRequire } from 'module';
import crypto from 'crypto';
import zlib from 'zlib';
import vm from 'vm';
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
let resolveSingleEmbed = null;
let collectPageEmbedCandidates = null;
let inProcessMovieSearch = null;
try {
  const scraper = require('../stream-resolver/services/fastScraper.js');
  fastResolve = scraper.fastResolve;
  resolveSingleEmbed = scraper.resolveSingleEmbed;
  collectPageEmbedCandidates = scraper.collectPageEmbedCandidates;
} catch (e) {
  console.warn('[HLSProxy] fastScraper import warning:', e.message);
}
try {
  const searchSvc = require('../stream-resolver/services/movieSearchService.js');
  inProcessMovieSearch = searchSvc.searchMovies;
} catch (e) {
  console.warn('[HLSProxy] movieSearchService import warning:', e.message);
}

// AES-256-GCM sealing so regular users never see external source domains or raw scraping URLs
const SEAL_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.JWT_SECRET || process.env.MEDIA_SEAL_KEY || 'oxypace-media-source-seal-v2'))
  .digest();

function sealSourcePayload(payload) {
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', SEAL_KEY, iv);
    const json = JSON.stringify(payload);
    const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64url');
  } catch {
    return '';
  }
}

function unsealSourcePayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', SEAL_KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(dec);
  } catch {
    return null;
  }
}

function isAdminOrTouristUser(req) {
  return Boolean(req?.user?.isAdmin || req?.user?.isTouristAdmin);
}

const PROVIDER_DISPLAY_NAMES = {
  hdfilmcehennemi: 'HDFilmCehennemi',
  fullhdfilmizlesene: 'FullHDFilmİzlesene',
  filmmakinesi: 'FilmMakinesi',
  filmdozu: 'FilmDozu',
  filmizyon: 'Filmİzyon',
  roketdizi: 'RoketDizi',
};

function inferProviderFromUrl(url = '') {
  const lower = String(url).toLowerCase();
  if (lower.includes('hdfilmcehennemi')) return 'hdfilmcehennemi';
  if (lower.includes('fullhdfilmizlesene')) return 'fullhdfilmizlesene';
  if (lower.includes('filmmakinesi')) return 'filmmakinesi';
  if (lower.includes('filmdozu')) return 'filmdozu';
  if (lower.includes('filmizyon') || lower.includes('vixolity')) return 'filmizyon';
  if (lower.includes('roketdizi') || lower.includes('pichive')) return 'roketdizi';
  return 'external';
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
  // SSRF / option-injection guard: only public http(s) URLs may ever reach the curl binary
  if (!validateSsrfUrl(url).safe) return '';
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
      '--proto', '=http,https',
      '--proto-redir', '=http,https',
      '--max-redirs', '5',
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
      '--proto', '=http,https',
      '--proto-redir', '=http,https',
      '--max-redirs', '5',
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
  if (!validateSsrfUrl(url).safe) return null;
  const runCurl = (useTor = false) => new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '--max-time', String(timeoutSec),
      '--proto', '=http,https',
      '--proto-redir', '=http,https',
      '--max-redirs', '5',
      '--max-filesize', String(25 * 1024 * 1024),
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

// CORS origin resolver shared by the buffered and streaming proxy paths.
// Uses strict hostname matching (the previous `includes('oxypace')` also matched e.g. evil-oxypace.com).
function resolveProxyCorsOrigin(incomingOrigin) {
  if (!incomingOrigin) return '*'; // Direct / server-to-server / mobile webview
  if (incomingOrigin.startsWith('capacitor://') || incomingOrigin.startsWith('ionic://')) return incomingOrigin;
  try {
    const host = new URL(incomingOrigin).hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.netlify.app') ||
      /(^|\.)oxypace\.[a-z.]+$/.test(host)
    ) {
      return incomingOrigin;
    }
  } catch { /* malformed origin */ }
  return null;
}

// Tighter limiter for the expensive resolver endpoints (they scrape third-party pages / spawn processes)
const resolverLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla çözümleme isteği. Lütfen biraz bekleyin.' },
});

// Scaled rate limit for proxy endpoint — handles high-frequency video streaming (.ts chunks and sub-playlists)
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla proxy isteği. Lütfen daha sonra tekrar deneyin.' },
});

const PUBLIC_API_ORIGIN = (process.env.PUBLIC_API_URL || 'https://api.oxypace.com.tr').replace(/\/$/, '');

function getProxyBaseOrigin(req) {
  const host = String(req?.headers?.host || '').toLowerCase();
  if (host.startsWith('localhost:') || host.startsWith('127.0.0.1:')) {
    return `http://${host}`;
  }
  return PUBLIC_API_ORIGIN;
}

// ── Watch Party Jet-Speed RAM Cache & In-Flight Coalescing ──────────────────
// When multiple users in a live room watch the same movie, their players request
// the exact same .m3u8 playlists and .ts/.jpg video chunks within milliseconds.
// Coalescing in-flight fetches and caching recent segments in RAM eliminates
// duplicate upstream CDN fetches and serves segments to mobile/web peers in <1ms.
const PROXY_RAM_CACHE = new Map();
const PROXY_INFLIGHT = new Map();
let proxyRamCacheBytes = 0;
const MAX_PROXY_CACHE_BYTES = 96 * 1024 * 1024; // 96 MB per worker (~384 MB total across 4 workers)
const MAX_CACHEABLE_SEGMENT_BYTES = 6 * 1024 * 1024; // 6 MB per segment

function getCachedProxyEntry(key) {
  const entry = PROXY_RAM_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    proxyRamCacheBytes = Math.max(0, proxyRamCacheBytes - entry.size);
    PROXY_RAM_CACHE.delete(key);
    return null;
  }
  // Refresh LRU order
  PROXY_RAM_CACHE.delete(key);
  PROXY_RAM_CACHE.set(key, entry);
  return entry;
}

function setCachedProxyEntry(key, entry, ttlMs) {
  if (!entry || !entry.buffer || entry.buffer.length > MAX_CACHEABLE_SEGMENT_BYTES) return;
  const existing = PROXY_RAM_CACHE.get(key);
  if (existing) {
    proxyRamCacheBytes = Math.max(0, proxyRamCacheBytes - existing.size);
    PROXY_RAM_CACHE.delete(key);
  }
  const size = entry.buffer.length;
  while (proxyRamCacheBytes + size > MAX_PROXY_CACHE_BYTES && PROXY_RAM_CACHE.size > 0) {
    const oldestKey = PROXY_RAM_CACHE.keys().next().value;
    const oldest = PROXY_RAM_CACHE.get(oldestKey);
    if (oldest) proxyRamCacheBytes = Math.max(0, proxyRamCacheBytes - oldest.size);
    PROXY_RAM_CACHE.delete(oldestKey);
  }
  PROXY_RAM_CACHE.set(key, {
    buffer: entry.buffer,
    contentType: entry.contentType,
    cacheControl: entry.cacheControl,
    size,
    expiresAt: Date.now() + ttlMs,
  });
  proxyRamCacheBytes += size;
}

function shouldKeepDirectMediaUrl(urlStr) {
  try {
    const urlObj = new URL(urlStr);
    const host = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Playlists (.m3u8, .mpd, .txt) must always be proxied so their inner URLs and CORS headers are handled
    const isPlaylist = 
      pathname.endsWith('.m3u8') || 
      pathname.includes('.m3u8') || 
      pathname.endsWith('.mpd') || 
      pathname.includes('.mpd') || 
      pathname.endsWith('.txt');
    if (isPlaylist) {
      return false;
    }

    // Direct CDN hosts for Turkish national broadcasts & geo-restricted streams whose segments
    // natively support CORS or block foreign datacenter IPs:
    if (
      host.includes('medya.trt.com.tr') ||
      host.includes('trt.com.tr') ||
      host.includes('trtworld.com') ||
      host.includes('trt.net.tr') ||
      host.includes('turkuvaz.com.tr') ||
      host.includes('dogus.com.tr') ||
      host.includes('ciner.com.tr') ||
      host.includes('demiroren.com.tr') ||
      host.includes('daioncdn.net')
    ) {
      return true;
    }
  } catch {}
  return false;
}

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

  const proxyBaseOrigin = getProxyBaseOrigin(req);
  const canUseRamCache = !req.headers.range;
  const cacheKey = canUseRamCache ? `${proxyBaseOrigin}|${targetUrl}|${referer || ''}|${origin || ''}` : '';

  if (canUseRamCache) {
    const cached = getCachedProxyEntry(cacheKey);
    if (cached) {
      const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin);
      const hitHeaders = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': cached.contentType,
        'Cache-Control': cached.cacheControl,
        'Content-Length': String(cached.buffer.length),
        'X-Proxy-Cache': 'HIT',
      };
      if (allowedCorsOrigin) hitHeaders['Access-Control-Allow-Origin'] = allowedCorsOrigin;
      res.set(hitHeaders);
      return res.status(200).send(cached.buffer);
    }

    const inflight = PROXY_INFLIGHT.get(cacheKey);
    if (inflight) {
      try {
        const shared = await inflight;
        if (shared && shared.buffer) {
          const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin);
          const sharedHeaders = {
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Content-Type': shared.contentType,
            'Cache-Control': shared.cacheControl,
            'Content-Length': String(shared.buffer.length),
            'X-Proxy-Cache': 'COALESCE',
          };
          if (allowedCorsOrigin) sharedHeaders['Access-Control-Allow-Origin'] = allowedCorsOrigin;
          res.set(sharedHeaders);
          return res.status(200).send(shared.buffer);
        }
      } catch {
        // Fall through to normal fetch if in-flight failed
      }
    }
  }

  let resolveInflight = null;
  if (canUseRamCache && cacheKey) {
    const p = new Promise((resolve) => { resolveInflight = resolve; });
    PROXY_INFLIGHT.set(cacheKey, p);
  }
  const finishInflight = (val) => {
    if (cacheKey) PROXY_INFLIGHT.delete(cacheKey);
    if (resolveInflight) {
      resolveInflight(val);
      resolveInflight = null;
    }
  };

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
        if (targetObj.hostname.includes('vixolity')) {
          originHeader = 'https://pl.vixolity.com';
          refererHeader = 'https://pl.vixolity.com/';
        } else if (targetObj.hostname.includes('playmix')) {
          originHeader = 'https://playmix.uno';
          refererHeader = 'https://playmix.uno/';
        } else if (targetObj.hostname.includes('closeload') || targetObj.hostname.includes('filmmakinesi')) {
          originHeader = 'https://closeload.filmmakinesi.to';
          refererHeader = 'https://closeload.filmmakinesi.to/';
        } else if (targetObj.hostname.includes('imagecdn') || targetObj.hostname.includes('rapidvid')) {
          originHeader = 'https://rapidvid.org';
          refererHeader = 'https://rapidvid.org/';
        } else if (targetObj.hostname.includes('rapidrame')) {
          originHeader = 'https://www.hdfilmcehennemi.nl';
          refererHeader = 'https://www.hdfilmcehennemi.nl/';
        } else if (targetObj.hostname.includes('cdnimages') || targetObj.hostname.includes('shop') || targetObj.hostname.includes('cyou')) {
          originHeader = 'https://hdfilmcehennemi.mobi';
          refererHeader = 'https://hdfilmcehennemi.mobi/';
        } else if (targetObj.hostname.includes('hdfilmcehennemi')) {
          originHeader = 'https://hdfilmcehennemi.mobi';
          refererHeader = 'https://hdfilmcehennemi.mobi/';
        } else if (targetObj.hostname.includes('vidmoly') || targetObj.hostname.includes('vmpx')) {
          originHeader = 'https://vidmoly.to';
          refererHeader = 'https://vidmoly.to/';
        } else if (targetObj.hostname.includes('okcdn') || targetObj.hostname.includes('mycdn') || targetObj.hostname.includes('vkuser')) {
          originHeader = 'https://ok.ru';
          refererHeader = 'https://ok.ru/';
        } else if (targetObj.hostname.includes('uptostream')) {
          originHeader = 'https://uptostream.com';
          refererHeader = 'https://uptostream.com/';
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

    let response = await safeFetch(targetUrl, {
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
            else if (targetUrl.includes('filmdozu')) posterReferer = 'https://filmdozu.com/';
            else if (targetUrl.includes('filmizyon')) posterReferer = 'https://www.filmizyon.net/';
            else if (targetUrl.includes('roketdizi') || targetUrl.includes('macellan')) posterReferer = 'https://roketdizi.life/';
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
          'https://pl.vixolity.com/',
          'https://playmix.uno/',
          'https://hdfilmcehennemi.mobi/',
          'https://www.hdfilmcehennemi.nl/',
          'https://rapidvid.org/',
          'https://closeload.filmmakinesi.to/',
          'https://rapidvid.net/',
          'https://vidmoly.to/',
          'https://ok.ru/',
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
            const fbRes = await safeFetch(targetUrl, { headers: fbHeaders, cache: 'no-store' });
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
      if (isPosterOrImage) {
        const TRANSPARENT_1PX_WEBP = Buffer.from('UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v3V84AAA', 'base64');
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).end(TRANSPARENT_1PX_WEBP);
      }

      // If a binary media chunk (MPEG-TS, m4s, mp4, aac, etc.) failed with 403 or 401 on the server (e.g. geo-restricted or CloudFront blocked),
      // redirect the client with 302 Found so the client browser downloads it directly using their local residential IP!
      const isMediaChunk = 
        lowerUrl.includes('.ts') || 
        lowerUrl.includes('.m4s') || 
        lowerUrl.endsWith('.mp4') || 
        lowerUrl.includes('.aac') || 
        lowerUrl.includes('/segment') ||
        lowerUrl.includes('/fragment');

      if (isMediaChunk && (response.status === 403 || response.status === 401)) {
        console.warn(`[HLSProxy] Upstream ${response.status} for media chunk ${targetUrl}. Redirecting client directly via 302...`);
        const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin) || '*';
        res.writeHead(302, {
          'Location': targetUrl,
          'Access-Control-Allow-Origin': allowedCorsOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'Location',
          'Cache-Control': 'no-cache',
        });
        return res.end();
      }

      return res.status(response.status).json({
        error: `Hedef sunucu hata döndürdü: ${response.status} ${response.statusText}`,
      });
    }

    // ── Streaming fast-path ─────────────────────────────────────────────────────
    // Large progressive files (MP4/MKV VOD) must NOT be buffered into server RAM:
    // a single un-ranged request for a multi-GB file would otherwise OOM the whole API process
    // (which also hosts realtime voice signaling). Playlists/small segments keep the buffered path
    // because they are rewritten / content-sniffed.
    {
      const upstreamType = response.headers.get('Content-Type') || '';
      const declaredLength = Number(response.headers.get('Content-Length')) || 0;
      const looksLikePlaylist =
        lowerUrl.includes('.m3u8') ||
        lowerUrl.includes('.txt') ||
        upstreamType.includes('mpegurl') ||
        upstreamType.includes('m3u8');
      const STREAM_THRESHOLD_BYTES = 8 * 1024 * 1024;
      if (!looksLikePlaylist && !isPosterOrImage && !isSubtitleFile && response.body && declaredLength > STREAM_THRESHOLD_BYTES) {
        const streamHeaders = {
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': upstreamType || 'application/octet-stream',
          'Content-Length': String(declaredLength),
          'Accept-Ranges': response.headers.get('Accept-Ranges') || 'bytes',
          'Cache-Control': 'public, max-age=86400, immutable',
        };
        if (response.headers.get('Content-Range')) streamHeaders['Content-Range'] = response.headers.get('Content-Range');
        const streamCors = resolveProxyCorsOrigin(req.headers.origin);
        if (streamCors) streamHeaders['Access-Control-Allow-Origin'] = streamCors;
        res.writeHead(response.status === 206 ? 206 : 200, streamHeaders);
        const nodeStream = Readable.fromWeb(response.body);
        const teardown = () => { try { nodeStream.destroy(); } catch { /* ignore */ } };
        res.on('close', teardown);
        nodeStream.on('error', () => { try { res.destroy(); } catch { /* ignore */ } });
        nodeStream.pipe(res);
        return;
      }
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
                let proxied = `${proxyBaseOrigin}/api/proxy?url=${encodeURIComponent(absUrl)}`;
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

          // If this is a media segment on a host with direct CORS or geo-restriction, keep it direct
          if (shouldKeepDirectMediaUrl(absUrl)) {
            return absUrl;
          }

          let proxied = `${proxyBaseOrigin}/api/proxy?url=${encodeURIComponent(absUrl)}`;
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
        contentType = 'text/vtt; charset=utf-8';
      } else if (lowerUrl.includes('.srt') || isSubtitleFile) {
        const rawBuf = Buffer.from(responseBody);
        const vttBuf = convertSrtBufferToVtt(rawBuf);
        responseBody = vttBuf.buffer.slice(vttBuf.byteOffset, vttBuf.byteOffset + vttBuf.byteLength);
        contentType = 'text/vtt; charset=utf-8';
      }
    }

    const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin);

    const resHeaders = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': contentType,
    };
    if (isPosterOrImage) {
      resHeaders['Cache-Control'] = 'public, max-age=86400, immutable';
    } else if (contentType === 'video/mp2t' || lowerUrl.includes('.ts') || lowerUrl.includes('.m4s') || (!isPlaylist && !isSubtitleFile)) {
      resHeaders['Cache-Control'] = 'public, max-age=86400, immutable';
    } else if (isPlaylist) {
      resHeaders['Cache-Control'] = 'public, max-age=3';
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

    const finalBuf = Buffer.from(responseBody);
    resHeaders['Content-Length'] = String(finalBuf.length);

    if (canUseRamCache && cacheKey && response.status === 200 && finalBuf.length <= MAX_CACHEABLE_SEGMENT_BYTES) {
      const cacheEntry = {
        buffer: finalBuf,
        contentType,
        cacheControl: resHeaders['Cache-Control'] || 'public, max-age=60',
      };
      // VOD playlists (#EXT-X-ENDLIST) and video segments can stay in RAM for 60s so all Watch Party peers get <1ms hits
      const isVodPlaylist = isPlaylist && sampleHeader.includes('#EXTM3U');
      const ttlMs = isPlaylist ? (isVodPlaylist ? 30_000 : 4_000) : 60_000;
      setCachedProxyEntry(cacheKey, cacheEntry, ttlMs);
      finishInflight(cacheEntry);
    } else {
      finishInflight(null);
    }

    res.set(resHeaders);
    return res.status(response.status === 206 ? 206 : 200).send(finalBuf);
  } catch (error) {
    finishInflight(null);
    if (error && typeof error.message === 'string' && error.message.startsWith('SSRF_BLOCKED')) {
      console.warn(`[SSRF Block] /api/proxy redirect/DNS rejected: ${error.message}`);
      return res.status(400).json({ error: 'Invalid or disallowed target URL' });
    }
    if (res.headersSent) {
      try { res.destroy(); } catch { /* ignore */ }
      return;
    }
    return res.status(500).json({
      error: error.message || 'An error occurred while proxying request',
    });
  } finally {
    finishInflight(null);
  }
});

// GET /api/resolve
router.get('/resolve', resolverLimiter, async (req, res) => {
  const pageUrl = req.query.url;

  if (!pageUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  // SSRF protection (previously unvalidated: allowed requests to localhost / internal services)
  const resolveSsrf = validateSsrfUrl(pageUrl);
  if (!resolveSsrf.safe) {
    console.warn(`[SSRF Block] /api/resolve rejected: ${pageUrl} — ${resolveSsrf.reason}`);
    return res.status(400).json({ error: 'Invalid or disallowed target URL' });
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
    const response = await safeFetch(pageUrl, {
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

function detectSubLanguage(fileUrl) {
  const lower = (fileUrl || '').toLowerCase();
  if (/[-_.]tur(?:kce)?[-_.]|[-_.]tr[-_.]/i.test(lower)) return 'Türkçe';
  if (/[-_.]eng?(?:lish)?[-_.]|[-_.]en[-_.]/i.test(lower)) return 'İngilizce';
  if (/[-_.]fr[-_.]/i.test(lower)) return 'Fransızca';
  if (/[-_.]de[-_.]/i.test(lower)) return 'Almanca';
  if (/[-_.]es[-_.]/i.test(lower)) return 'İspanyolca';
  return 'Altyazı';
}

async function directResolveHDFilmCehennemi(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.includes('hdfilmcehennemi')) return null;
  const start = Date.now();

  const fetchWithTorOrDirect = async (url, headers = [], timeoutSec = 5) => {
    // 1. Tor SOCKS5 priority on Linux server (bypasses Datacenter ASN Cloudflare Error 1005)
    if (process.platform === 'linux') {
      try {
        const argsTor = [
          '-s', '-L',
          '--socks5-hostname', '127.0.0.1:9050',
          '--max-time', String(timeoutSec),
          '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          ...headers.flatMap(h => ['-H', h]),
          url
        ];
        const { stdout } = await execFileAsync('curl', argsTor);
        if (stdout && stdout.length > 500 && !stdout.includes('error code: 1005') && !stdout.includes('Attention Required')) {
          return stdout;
        }
      } catch (e) {}
    }

    // 2. Direct fetch (for local or non-blocked environments)
    try {
      const fHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };
      for (const h of headers) {
        const idx = h.indexOf(':');
        if (idx !== -1) fHeaders[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
      }
      const res = await fetch(url, { headers: fHeaders, signal: AbortSignal.timeout(timeoutSec * 1000) });
      if (res.ok) {
        const t = await res.text();
        if (t.length > 500 && !t.includes('error code: 1005') && !t.includes('Attention Required')) return t;
      }
    } catch (e) {}

    // 3. Direct curl fallback
    try {
      const args = [
        '-s', '-L',
        '--max-time', String(timeoutSec),
        '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...headers.flatMap(h => ['-H', h]),
        url
      ];
      const { stdout } = await execFileAsync(CURL_BIN, args);
      if (stdout && stdout.length > 500 && !stdout.includes('error code: 1005') && !stdout.includes('Attention Required')) {
        return stdout;
      }
    } catch (e) {}

    return '';
  };

  try {
    let text = await fetchWithTorOrDirect(targetUrl, [
      'Referer: https://www.hdfilmcehennemi.nl/',
      'x-requested-with: fetch',
      'Accept: application/json, text/plain, */*'
    ], 6);

    if (!text) return null;
    let html = text;
    if (text.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(text.trim());
        if (parsed.html) html = parsed.html;
      } catch {}
    }
    html = html.replace(/\\"/g, '"').replace(/\\\//g, '/');

    // Extract embed URLs with playmix mirror expansion
    const embedMatches = [
      ...html.matchAll(/<iframe\b[^>]*\b(?:src|data-src)=["']([^"']+)["']/gi),
      ...html.matchAll(/data-(?:src|video|url)=["']([^"']*(?:embed|rapidrame|rplayer|playmix|video)[^"']*)["']/gi),
    ];
    const embedUrls = [];
    for (const [, u] of embedMatches) {
      let clean = u.trim();
      if (clean.startsWith('//')) clean = 'https:' + clean;
      if (clean.startsWith('http') && !embedUrls.includes(clean)) {
        embedUrls.push(clean);

        // Mirror expansion: playmix.uno is the open mirror of hdfilmcehennemi.mobi (bypasses Turnstile)
        const idMatch = clean.match(/\/video\/embed\/([^/?#]+)/) || clean.match(/\/embed\/([^/?#]+)/);
        if (idMatch && idMatch[1]) {
          const mirror = `https://playmix.uno/video/embed/${idMatch[1]}/`;
          if (!embedUrls.includes(mirror)) embedUrls.push(mirror);
          const mirrorAlt = `https://playmix.uno/embed/${idMatch[1]}`;
          if (!embedUrls.includes(mirrorAlt)) embedUrls.push(mirrorAlt);
        }
      }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').replace(/-?\s*HDFilmcehennemi.*/i, '').trim() : 'Film Akışı';

    for (const embedUrl of embedUrls) {
      let embedHost = 'hdfilmcehennemi.mobi';
      try { embedHost = new URL(embedUrl).hostname; } catch {}
      const embedHtml = await fetchWithTorOrDirect(embedUrl, [
        'Referer: https://www.hdfilmcehennemi.nl/',
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      ], 5);

      if (!embedHtml) continue;

      // Collect subtitles
      const subtitles = [];
      const subMatches = [...embedHtml.matchAll(/["']file["']\s*:\s*["'](https?:[^"']+\.vtt[^"']*)["']/gi)];
      for (const [, f] of subMatches) {
        const cleanSub = f.replace(/\\\//g, '/');
        const label = detectSubLanguage(cleanSub);
        if (!subtitles.some(s => s.file === cleanSub)) {
          subtitles.push({ file: cleanSub, label });
        }
      }

      // 1. Direct stream match
      const directMatch = embedHtml.match(/file\s*:\s*["'](https?:\/\/[^"']+\/(?:master\.txt|index\.m3u8|\w+\.m3u8)[^"']*)["']/i);
      if (directMatch && directMatch[1]) {
        const streamUrl = directMatch[1];
        let referer = 'https://hdfilmcehennemi.mobi/';
        let origin = 'https://hdfilmcehennemi.mobi';
        if (streamUrl.includes('playmix')) { referer = 'https://playmix.uno/'; origin = 'https://playmix.uno'; }
        else if (streamUrl.includes('rapidvid')) { referer = 'https://rapidvid.org/'; origin = 'https://rapidvid.org'; }
        return { streamUrl, pageTitle, headers: { referer, origin }, subtitles, elapsed: Date.now() - start };
      }

      // 2. Obfuscated varName resolution via VM sandbox
      const jwMatch = embedHtml.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*([a-zA-Z0-9_$]+)/i) ||
                      embedHtml.match(/file\s*:\s*([a-zA-Z0-9_$]+)\s*,\s*type\s*:\s*["']hls["']/i);
      const varName = jwMatch ? jwMatch[1] : null;
      if (varName) {
        const scriptTags = [...embedHtml.matchAll(/<script\b(?![^>]*type=["'](?:application\/ld\+json|application\/json)["'])[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
        for (const s of scriptTags) {
          if (s.includes(varName) && (s.includes('function') || s.includes('='))) {
            const sandbox = {
              atob: (str) => Buffer.from(str, 'base64').toString('binary'),
              btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
              Math, String, Array, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
              self: { location: { protocol: 'https:', hostname: embedHost } },
              window: { location: { protocol: 'https:', hostname: embedHost } },
              document: { location: { protocol: 'https:', hostname: embedHost } },
              location: { protocol: 'https:', hostname: embedHost },
            };
            try {
              vm.createContext(sandbox);
              vm.runInContext(s + '\n__stream_res__ = (typeof ' + varName + ' !== "undefined") ? ' + varName + ' : null;', sandbox, { timeout: 1500 });
              const streamUrl = sandbox.__stream_res__;
              if (streamUrl && typeof streamUrl === 'string' && streamUrl.startsWith('http')) {
                let referer = 'https://hdfilmcehennemi.mobi/';
                let origin = 'https://hdfilmcehennemi.mobi';
                if (streamUrl.includes('playmix')) { referer = 'https://playmix.uno/'; origin = 'https://playmix.uno'; }
                else if (streamUrl.includes('rapidvid')) { referer = 'https://rapidvid.org/'; origin = 'https://rapidvid.org'; }
                return { streamUrl, pageTitle, headers: { referer, origin }, subtitles, elapsed: Date.now() - start };
              }
            } catch (e) {}
          }
        }
      }

      // 3. Fallback regex
      const fallbackMatch = embedHtml.match(/(https?:\/\/[^"'\s<>]+\/(?:master\.txt|\w+\.m3u8)[^"'\s<>]*)/i);
      if (fallbackMatch && fallbackMatch[1]) {
        const streamUrl = fallbackMatch[1];
        let referer = 'https://hdfilmcehennemi.mobi/';
        let origin = 'https://hdfilmcehennemi.mobi';
        if (streamUrl.includes('playmix')) { referer = 'https://playmix.uno/'; origin = 'https://playmix.uno'; }
        else if (streamUrl.includes('rapidvid')) { referer = 'https://rapidvid.org/'; origin = 'https://rapidvid.org'; }
        return { streamUrl, pageTitle, headers: { referer, origin }, subtitles, elapsed: Date.now() - start };
      }
    }
  } catch (err) {
    console.warn('[directResolveHDFilmCehennemi] Error:', err.message);
  }
  return null;
}

function normalizeProxyHeadersForStream(streamUrl = '', rawHeaders = {}) {
  let streamHeaders = { ...(rawHeaders || {}) };
  const lower = String(streamUrl).toLowerCase();
  if (lower.includes('playmix') && (!streamHeaders.referer || !streamHeaders.referer.includes('playmix.uno'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://playmix.uno/', origin: 'https://playmix.uno' };
  } else if (lower.includes('imagecdn') && (!streamHeaders.referer || !streamHeaders.referer.includes('rapidvid.org'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://rapidvid.org/', origin: 'https://rapidvid.org' };
  } else if ((lower.includes('cdnimages') || lower.includes('shop') || lower.includes('cyou')) && !lower.includes('vixolity') && (!streamHeaders.referer || !streamHeaders.referer.includes('hdfilmcehennemi'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://hdfilmcehennemi.mobi/', origin: 'https://hdfilmcehennemi.mobi' };
  } else if (lower.includes('vixolity')) {
    streamHeaders = { ...streamHeaders, referer: 'https://pl.vixolity.com/', origin: 'https://pl.vixolity.com' };
  } else if (lower.includes('vmpx') || lower.includes('vidmoly')) {
    streamHeaders = { ...streamHeaders, referer: 'https://vidmoly.to/', origin: 'https://vidmoly.to' };
  } else if (lower.includes('okcdn') || lower.includes('mycdn') || lower.includes('vkuser')) {
    streamHeaders = { ...streamHeaders, referer: 'https://ok.ru/', origin: 'https://ok.ru' };
  }
  return streamHeaders;
}

function buildPlayableProxyUrl(resolveBaseOrigin, targetUrl, streamHeaders = {}) {
  return `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(targetUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;
}

async function probeStreamCandidate(streamUrl, streamHeaders = {}) {
  const t0 = Date.now();
  try {
    if (!streamUrl || !validateSsrfUrl(streamUrl).safe) {
      return { ok: false, latencyMs: 99999, maxHeight: 0, score: -99999 };
    }
    const lower = streamUrl.toLowerCase();
    if (lower.includes('filmakinesimp4') || lower.includes('blank.mp4')) {
      return { ok: false, latencyMs: 99999, maxHeight: 0, score: -99999 };
    }
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };
    if (streamHeaders.referer) headers['Referer'] = streamHeaders.referer;
    if (streamHeaders.origin) headers['Origin'] = streamHeaders.origin;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await safeFetch(streamUrl, { headers, method: 'GET', cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, latencyMs: Date.now() - t0, maxHeight: 0, score: -50000 };
    }

    const latencyMs = Date.now() - t0;
    let maxHeight = 0;
    let hasMultiAudio = false;
    if (!lower.endsWith('.mp4')) {
      const text = await res.text().catch(() => '');
      if (!text.includes('#EXTM3U')) {
        return { ok: false, latencyMs, maxHeight: 0, score: -50000 };
      }
      const resMatches = [...text.matchAll(/RESOLUTION=\d+x(\d+)/gi)];
      for (const m of resMatches) {
        const h = parseInt(m[1], 10) || 0;
        if (h > maxHeight) maxHeight = h;
      }
      hasMultiAudio = /#EXT-X-MEDIA:[^\n]*TYPE=AUDIO/i.test(text);
    }

    const qualityPoints =
      maxHeight >= 1080 ? 3000 :
      maxHeight >= 720 ? 2200 :
      maxHeight >= 480 ? 1400 :
      maxHeight > 0 ? 1000 :
      1600; // Single variant or direct MP4
    const audioBonus = hasMultiAudio ? 250 : 0;
    const score = qualityPoints + audioBonus - Math.min(latencyMs, 4000);
    return { ok: true, latencyMs, maxHeight, hasMultiAudio, score };
  } catch {
    return { ok: false, latencyMs: Date.now() - t0, maxHeight: 0, score: -99999 };
  }
}

// POST /api/resolve-stream (Multi-source fast resolver, quality/latency picker & grouped alternatives)
router.post('/resolve-stream', optionalProtect, resolverLimiter, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  const { url, sourceToken, sourceTokens, sources, title, year, imdbId, timeout } = req.body || {};
  const isPrivileged = isAdminOrTouristUser(req);
  const resolveBaseOrigin = getProxyBaseOrigin(req);
  const startTime = Date.now();
  const fetchTimeout = Math.min(parseInt(timeout, 10) || 20000, 21000);

  // 1. Single-alternative lazy resolution via sourceToken
  if (sourceToken && typeof sourceToken === 'string') {
    const unsealed = unsealSourcePayload(sourceToken);
    if (!unsealed || (!unsealed.url && !unsealed.directStreamUrl)) {
      return res.status(400).json({ success: false, error: 'Geçersiz veya süresi dolmuş alternatif anahtarı.' });
    }
    try {
      let chosenStream = unsealed.directStreamUrl || '';
      let streamHeaders = unsealed.headers || {};
      let subtitles = Array.isArray(unsealed.subtitles) ? unsealed.subtitles : [];
      let pageTitle = unsealed.title || title || 'Film Akışı';

      if (!chosenStream && unsealed.url) {
        if (!validateSsrfUrl(unsealed.url).safe) {
          return res.status(400).json({ success: false, error: 'Geçersiz veya izin verilmeyen URL.' });
        }
        if (resolveSingleEmbed && !unsealed.isMoviePage) {
          const singleRes = await resolveSingleEmbed(unsealed.url, unsealed.referer || unsealed.url, { timeout: 12000 });
          if (singleRes?.streamUrl) {
            chosenStream = singleRes.streamUrl;
            streamHeaders = singleRes.headers || streamHeaders;
            if (Array.isArray(singleRes.subtitles) && singleRes.subtitles.length > 0) {
              subtitles = singleRes.subtitles;
            }
          }
        }
        if (!chosenStream && fastResolve) {
          const fr = await fastResolve(unsealed.url, { timeout: 14000, collectAlternatives: false });
          if (fr?.streamUrl) {
            chosenStream = fr.streamUrl;
            streamHeaders = fr.headers || streamHeaders;
            pageTitle = fr.pageTitle || pageTitle;
            if (Array.isArray(fr.subtitles) && fr.subtitles.length > 0) {
              subtitles = fr.subtitles;
            }
          }
        }
        if (!chosenStream && unsealed.url.includes('hdfilmcehennemi')) {
          const dr = await directResolveHDFilmCehennemi(unsealed.url);
          if (dr?.streamUrl) {
            chosenStream = dr.streamUrl;
            streamHeaders = dr.headers || streamHeaders;
            pageTitle = dr.pageTitle || pageTitle;
            if (Array.isArray(dr.subtitles)) subtitles = dr.subtitles;
          }
        }
      }

      if (!chosenStream || chosenStream.includes('filmakinesimp4') || chosenStream.includes('blank.mp4')) {
        return res.status(404).json({ success: false, error: 'Bu alternatif kaynakta aktif video akışı bulunamadı.' });
      }

      streamHeaders = normalizeProxyHeadersForStream(chosenStream, streamHeaders);
      const playableStreamUrl = buildPlayableProxyUrl(resolveBaseOrigin, chosenStream, streamHeaders);
      const proxiedSubtitles = (subtitles || []).map(sub => ({
        ...sub,
        playableUrl: sub.playableUrl || buildPlayableProxyUrl(resolveBaseOrigin, sub.file, streamHeaders),
      }));

      return res.status(200).json({
        success: true,
        status: 'success',
        streamUrl: isPrivileged ? chosenStream : undefined,
        playableStreamUrl,
        type: chosenStream.toLowerCase().endsWith('.mp4') ? 'mp4' : 'm3u8',
        headers: isPrivileged ? streamHeaders : {},
        pageTitle,
        subtitles: proxiedSubtitles,
        resolvedIn: Date.now() - startTime,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || 'Alternatif çözümlenemedi.' });
    }
  }

  // 2. Collect multi-site or single-URL targets
  const targets = [];
  const seenUrls = new Set();
  const addTarget = (targetUrl, meta = {}) => {
    if (!targetUrl || typeof targetUrl !== 'string') return;
    const cleanUrl = targetUrl.trim();
    if (!validateSsrfUrl(cleanUrl).safe || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);
    const pk = meta.providerKey || inferProviderFromUrl(cleanUrl);
    targets.push({
      url: cleanUrl,
      providerKey: pk,
      provider: PROVIDER_DISPLAY_NAMES[pk] || meta.provider || 'Kaynak',
      title: meta.title || title || '',
      year: meta.year || year || '',
      imdbId: meta.imdbId || imdbId || '',
    });
  };

  if (Array.isArray(sourceTokens)) {
    for (const tok of sourceTokens) {
      const u = unsealSourcePayload(tok);
      if (u?.url) addTarget(u.url, u);
    }
  }
  if (Array.isArray(sources)) {
    for (const s of sources) {
      if (s?.sourceToken) {
        const u = unsealSourcePayload(s.sourceToken);
        if (u?.url) addTarget(u.url, u);
      } else if (s?.url) {
        addTarget(s.url, s);
      }
    }
  }
  if (url && typeof url === 'string') {
    addTarget(url, { title, year, imdbId });
  }

  if (targets.length === 0) {
    return res.status(400).json({ success: false, error: 'Geçersiz veya eksik URL/kaynak parametresi.' });
  }

  // Instant fast-path for direct .m3u8 / .mp4 stream URLs
  if (targets.length === 1) {
    const trimmedUrl = targets[0].url;
    const lower = trimmedUrl.toLowerCase();
    if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
      const playableStreamUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(trimmedUrl)}`;
      return res.status(200).json({
        success: true,
        status: 'success',
        streamUrl: isPrivileged ? trimmedUrl : undefined,
        playableStreamUrl,
        type: lower.endsWith('.mp4') ? 'mp4' : 'm3u8',
        headers: {},
        pageTitle: title || 'Doğrudan Akış Kaynağı',
        alternativeGroups: [],
        externalSubtitles: [],
        cached: false,
        resolvedIn: 1,
      });
    }
  }

  // 3. Kick off ready Turkish subtitles search in parallel (soft 4.5s race cap so playback isn't delayed)
  const effectiveTitle = targets.find(t => t.title)?.title || title || '';
  const effectiveImdb = targets.find(t => t.imdbId)?.imdbId || imdbId || '';
  const effectiveYear = targets.find(t => t.year)?.year || year || '';
  const subtitleSearchPromise = (effectiveTitle || effectiveImdb)
    ? Promise.race([
        searchTurkishSubtitles({ title: effectiveTitle, imdbId: effectiveImdb, year: effectiveYear }),
        new Promise(resolve => setTimeout(() => resolve([]), 4500)),
      ]).catch(() => [])
    : Promise.resolve([]);

  // 4. Race resolution across ALL source websites concurrently
  const perSourcePromises = targets.map(async (src) => {
    let resolved = null;
    if (fastResolve) {
      try {
        resolved = await fastResolve(src.url, { timeout: Math.min(fetchTimeout, 13000), collectAlternatives: true });
      } catch {}
    }
    // Backup direct HDF resolver if fastResolve returned nothing for HDFilmCehennemi
    if ((!resolved || !resolved.streamUrl) && src.url.includes('hdfilmcehennemi')) {
      try {
        const directRes = await directResolveHDFilmCehennemi(src.url);
        if (directRes?.streamUrl) {
          resolved = {
            ...directRes,
            alternatives: [{
              label: 'Ana Oynatıcı',
              embedUrl: src.url,
              streamUrl: directRes.streamUrl,
              headers: directRes.headers || {},
              subtitles: directRes.subtitles || [],
            }],
          };
        }
      } catch {}
    }
    return { src, resolved };
  });

  const [resolvedSources, externalSubtitles] = await Promise.all([
    Promise.all(perSourcePromises),
    subtitleSearchPromise,
  ]);

  // 5. Collect playable stream candidates to probe speed & resolution, plus per-site alternatives
  const streamCandidates = [];
  const siteGroupsRaw = [];
  let takedownError = null;
  let resolvedPageTitle = effectiveTitle || 'Film Akışı';

  for (const { src, resolved } of resolvedSources) {
    if (!resolved) continue;
    if (resolved.isTakedown) {
      takedownError = takedownError || resolved.error;
      continue;
    }
    if (resolved.pageTitle && (!resolvedPageTitle || resolvedPageTitle === 'Film Akışı')) {
      resolvedPageTitle = resolved.pageTitle;
    }

    const groupItems = [];
    const seenAltKeys = new Set();

  const siteGroupIndex = siteGroupsRaw.length + 1;

    const pushAlt = (alt) => {
      const sUrl = alt.streamUrl || '';
      const eUrl = alt.embedUrl || src.url;
      if (sUrl && (sUrl.includes('filmakinesimp4') || sUrl.includes('blank.mp4'))) return;
      const dedupKey = sUrl || eUrl;
      if (!dedupKey || seenAltKeys.has(dedupKey)) return;
      seenAltKeys.add(dedupKey);

      const altId = `alt_${siteGroupIndex}_${groupItems.length + 1}`;
      const normHeaders = sUrl ? normalizeProxyHeadersForStream(sUrl, alt.headers || resolved.headers || {}) : (alt.headers || {});
      const token = sealSourcePayload({
        url: eUrl,
        directStreamUrl: sUrl || '',
        providerKey: src.providerKey,
        headers: normHeaders,
        referer: eUrl,
        subtitles: alt.subtitles || resolved.subtitles || [],
        title: resolvedPageTitle,
        isMoviePage: !alt.embedUrl,
      });

      const itemObj = {
        id: altId,
        label: `Alternatif ${groupItems.length + 1}`,
        sourceToken: token,
        isResolved: Boolean(sUrl),
        ...(isPrivileged ? { providerKey: src.providerKey, detailLabel: alt.label || '' } : {}),
      };
      groupItems.push(itemObj);

      if (sUrl) {
        streamCandidates.push({
          altId,
          providerKey: src.providerKey,
          streamUrl: sUrl,
          headers: normHeaders,
          subtitles: alt.subtitles || resolved.subtitles || [],
          pageTitle: resolved.pageTitle || resolvedPageTitle,
        });
      }
    };

    if (resolved.streamUrl) {
      pushAlt({
        label: 'Birincil Akış',
        embedUrl: resolved.embedUrl || src.url,
        streamUrl: resolved.streamUrl,
        headers: resolved.headers || {},
        subtitles: resolved.subtitles || [],
      });
    }
    if (Array.isArray(resolved.alternatives)) {
      for (const alt of resolved.alternatives) {
        pushAlt(alt);
      }
    }

    if (groupItems.length > 0) {
      siteGroupsRaw.push({
        providerKey: src.providerKey,
        providerName: src.provider || PROVIDER_DISPLAY_NAMES[src.providerKey] || 'Kaynak',
        items: groupItems,
      });
    }
  }

  // Fallback for unresolved site links (so user can still switch if a site wasn't pre-resolved cleanly)
  if (siteGroupsRaw.length === 0 && targets.length > 0) {
    // Secondary microservice fallback on primary URL if local fastResolve failed completely
    const resolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
    const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(fetchTimeout, 10000));
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const microResponse = await fetch(`${resolverUrl.replace(/\/+$/, '')}/api/resolve-stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: targets[0].url, timeout: Math.min(fetchTimeout, 10000) }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await microResponse.json().catch(() => null);
      const payload = data?.data || data;
      const sUrl = payload?.streamUrl;
      if (microResponse.ok && sUrl && !sUrl.includes('filmakinesimp4') && !sUrl.includes('blank.mp4')) {
        const sh = normalizeProxyHeadersForStream(sUrl, payload.headers || {});
        const altId = `alt_${targets[0].providerKey}_1`;
        streamCandidates.push({
          altId,
          providerKey: targets[0].providerKey,
          streamUrl: sUrl,
          headers: sh,
          subtitles: payload.subtitles || [],
          pageTitle: payload.pageTitle || resolvedPageTitle,
        });
        siteGroupsRaw.push({
          providerKey: targets[0].providerKey,
          providerName: targets[0].provider,
          items: [{
            id: altId,
            label: 'Alternatif 1',
            sourceToken: sealSourcePayload({ url: targets[0].url, directStreamUrl: sUrl, providerKey: targets[0].providerKey, headers: sh }),
            isResolved: true,
          }],
        });
      }
    } catch {}
  }

  if (streamCandidates.length === 0) {
    if (takedownError) {
      return res.status(451).json({
        success: false,
        error: takedownError,
        code: 'LEGAL_TAKEDOWN',
      });
    }
    return res.status(404).json({
      success: false,
      error: 'Film akışı şu anda hiçbir kaynakta çözümlenemedi. Lütfen başka bir film veya tekrar denemeyi seçin.',
      code: 'STREAM_NOT_FOUND',
    });
  }

  // 6. Probe top stream candidates concurrently to pick the fastest + highest quality stream
  const candidatesToProbe = streamCandidates.slice(0, 6);
  const probeResults = await Promise.all(
    candidatesToProbe.map(async (c) => {
      const probe = await probeStreamCandidate(c.streamUrl, c.headers);
      return { candidate: c, probe };
    })
  );

  probeResults.sort((a, b) => b.probe.score - a.probe.score);
  const bestPick = probeResults.find(r => r.probe.ok) || probeResults[0];
  const winner = bestPick.candidate;

  const playableStreamUrl = buildPlayableProxyUrl(resolveBaseOrigin, winner.streamUrl, winner.headers);
  const proxiedPageSubtitles = (winner.subtitles || []).map(sub => ({
    ...sub,
    playableUrl: sub.playableUrl || buildPlayableProxyUrl(resolveBaseOrigin, sub.file, winner.headers),
  }));

  // Redact group labels for regular users; reveal source site names to admins & tourist admins
  const alternativeGroups = siteGroupsRaw.map((grp, grpIdx) => ({
    groupId: `grp_${grpIdx + 1}`,
    groupLabel: isPrivileged ? grp.providerName : `Kaynak ${grpIdx + 1}`,
    ...(isPrivileged ? { providerKey: grp.providerKey } : {}),
    items: grp.items,
  }));

  return res.status(200).json({
    success: true,
    status: 'success',
    streamUrl: isPrivileged ? winner.streamUrl : undefined,
    playableStreamUrl,
    type: winner.streamUrl.toLowerCase().endsWith('.mp4') ? 'mp4' : 'm3u8',
    headers: isPrivileged ? winner.headers : {},
    pageTitle: winner.pageTitle || resolvedPageTitle,
    subtitles: proxiedPageSubtitles,
    externalSubtitles: externalSubtitles || [],
    alternativeGroups,
    activeAlternativeId: winner.altId,
    bestQualityHeight: bestPick.probe?.maxHeight || 0,
    cached: false,
    resolvedIn: Date.now() - startTime,
  });
});

// ─── Turkish Subtitle Engine (Stremio Cinemeta/OpenSubtitles v3 + turkcealtyazi.org) ───
const subtitleResultCache = new Map();
const subtitleFileCache = new Map();
const SUBTITLE_CACHE_TTL_MS = 30 * 60 * 1000;

function decodeSubtitleText(buf) {
  if (!buf || !buf.length) return '';
  // Strip UTF-8 BOM if present
  const hasUtf8Bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const slice = hasUtf8Bom ? buf.subarray(3) : buf;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(slice);
  } catch {
    try {
      return new TextDecoder('windows-1254').decode(slice);
    } catch {
      return slice.toString('latin1');
    }
  }
}

function convertSrtBufferToVtt(buf) {
  let text = decodeSubtitleText(buf);
  if (!text) return Buffer.from('WEBVTT\n\n', 'utf8');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '');
  if (/^\s*WEBVTT/i.test(text)) {
    return Buffer.from(text, 'utf8');
  }
  const blocks = text.split(/\n{2,}/);
  const vttCues = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trimEnd()).filter(Boolean);
    if (lines.length === 0) continue;
    let startIdx = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length > 1 && lines[1].includes('-->')) {
      startIdx = 1;
    }
    const tsLine = lines[startIdx];
    if (!tsLine || !tsLine.includes('-->')) continue;
    const normalizedTs = tsLine.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2').replace(/(\d{1,2}:\d{2}),(\d{3})/g, '00:$1.$2');
    const body = lines.slice(startIdx + 1).join('\n');
    if (body) {
      vttCues.push(`${normalizedTs}\n${body}`);
    }
  }
  return Buffer.from(`WEBVTT\n\n${vttCues.join('\n\n')}\n`, 'utf8');
}

function extractBestSubFromZipBuffer(zipBuf) {
  if (!zipBuf || zipBuf.length < 22) return null;
  // Locate End of Central Directory (0x06054b50) from end
  let eocdOffset = -1;
  const minOffset = Math.max(0, zipBuf.length - 65557);
  for (let i = zipBuf.length - 22; i >= minOffset; i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  const entries = [];
  if (eocdOffset !== -1) {
    const cdSize = zipBuf.readUInt32LE(eocdOffset + 12);
    const cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);
    let pos = cdOffset;
    const cdEnd = Math.min(zipBuf.length, cdOffset + cdSize);
    while (pos + 46 <= cdEnd && zipBuf.readUInt32LE(pos) === 0x02014b50) {
      const method = zipBuf.readUInt16LE(pos + 10);
      const compSize = zipBuf.readUInt32LE(pos + 20);
      const nameLen = zipBuf.readUInt16LE(pos + 28);
      const extraLen = zipBuf.readUInt16LE(pos + 30);
      const commentLen = zipBuf.readUInt16LE(pos + 32);
      const localOffset = zipBuf.readUInt32LE(pos + 42);
      const fileName = zipBuf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8');
      pos += 46 + nameLen + extraLen + commentLen;

      if (!fileName || fileName.endsWith('/') || fileName.includes('__MACOSX')) continue;
      if (localOffset + 30 > zipBuf.length || zipBuf.readUInt32LE(localOffset) !== 0x04034b50) continue;
      const lNameLen = zipBuf.readUInt16LE(localOffset + 26);
      const lExtraLen = zipBuf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      const compSlice = zipBuf.subarray(dataStart, dataStart + compSize);
      entries.push({ fileName, method, compSlice });
    }
  }
  // Rank entries: prefer .vtt or .srt, skip readme/txt
  const scored = entries
    .filter(e => /\.(srt|vtt|ass|sub)$/i.test(e.fileName))
    .sort((a, b) => {
      const sA = a.fileName.toLowerCase().endsWith('.srt') ? 2 : a.fileName.toLowerCase().endsWith('.vtt') ? 3 : 1;
      const sB = b.fileName.toLowerCase().endsWith('.srt') ? 2 : b.fileName.toLowerCase().endsWith('.vtt') ? 3 : 1;
      return sB - sA;
    });
  for (const entry of scored) {
    try {
      const data = entry.method === 8 ? zlib.inflateRawSync(entry.compSlice) : entry.method === 0 ? entry.compSlice : null;
      if (data && data.length > 20) return data;
    } catch { /* try next */ }
  }
  return null;
}

function cleanMovieTitleForSubtitleSearch(rawTitle = '') {
  return String(rawTitle)
    .replace(/\(\d{4}\)/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(türkçe|turkce|dublaj|altyazılı|altyazili|altyazı|altyazi|dual|full\s*hd|1080p|720p|4k|uhd|izle|film|filmi|hd)\b/gi, ' ')
    .replace(/[|/\\–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveImdbViaCinemeta(title, year) {
  const cleaned = cleanMovieTitleForSubtitleSearch(title);
  if (!cleaned || cleaned.length < 2) return null;
  for (const kind of ['movie', 'series']) {
    try {
      const res = await fetch(`https://v3-cinemeta.strem.io/catalog/${kind}/top/search=${encodeURIComponent(cleaned)}.json`, {
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const metas = Array.isArray(data?.metas) ? data.metas : [];
      if (metas.length === 0) continue;
      const normClean = cleaned.toLowerCase();
      let best = metas[0];
      let bestScore = -1;
      for (const m of metas.slice(0, 8)) {
        let score = 0;
        const mName = String(m.name || '').toLowerCase();
        if (mName === normClean) score += 10;
        else if (mName.includes(normClean) || normClean.includes(mName)) score += 5;
        if (year && m.releaseInfo && String(m.releaseInfo).includes(String(year))) score += 6;
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }
      if (best?.imdb_id && /^tt\d+$/.test(best.imdb_id)) return best.imdb_id;
      if (best?.id && /^tt\d+$/.test(best.id)) return best.id;
    } catch { /* try next */ }
  }
  return null;
}

async function searchOpenSubtitlesStremio(imdbId, cleanTitle, year) {
  const id = imdbId && /^tt\d+$/i.test(imdbId) ? imdbId : await resolveImdbViaCinemeta(cleanTitle, year);
  if (!id) return [];
  try {
    const res = await fetch(`https://opensubtitles-v3.strem.io/subtitles/movie/${encodeURIComponent(id)}.json`, {
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const subs = Array.isArray(data?.subtitles) ? data.subtitles : [];
    const trSubs = subs.filter(s => s && s.url && (s.lang === 'tur' || s.lang === 'tr' || String(s.SubLanguageID || '').toLowerCase() === 'tur'));
    return trSubs.slice(0, 8).map((s, idx) => ({
      id: `os_${idx}_${s.id || idx}`,
      label: `Türkçe Altyazı #${idx + 1}`,
      lang: 'tr',
      kind: 'subtitles',
      playableUrl: `/api/subtitles/vtt?url=${encodeURIComponent(s.url)}`,
      external: true,
    }));
  } catch {
    return [];
  }
}

async function searchTurkceAltyaziOrg(cleanTitle, year) {
  if (!cleanTitle || cleanTitle.length < 2) return [];
  try {
    const findUrl = `https://turkcealtyazi.org/find.php?cat=sub&find=${encodeURIComponent(cleanTitle)}`;
    const findRes = await fetch(findUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!findRes.ok) return [];
    const findBuf = Buffer.from(await findRes.arrayBuffer());
    const findHtml = decodeSubtitleText(findBuf);

    // Collect /mov/<id>/...html links or direct redirect
    const movMatches = [...findHtml.matchAll(/href="(\/mov\/\d+\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)];
    let targetMovPath = null;
    if (findRes.url && findRes.url.includes('/mov/')) {
      targetMovPath = new URL(findRes.url).pathname;
    } else if (movMatches.length > 0) {
      const normClean = cleanTitle.toLowerCase();
      let bestScore = -1;
      for (const m of movMatches.slice(0, 12)) {
        const text = m[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
        let score = 0;
        if (text.includes(normClean)) score += 6;
        if (year && m[0].includes(String(year))) score += 4;
        if (score > bestScore) {
          bestScore = score;
          targetMovPath = m[1];
        }
      }
      if (!targetMovPath) targetMovPath = movMatches[0][1];
    }
    if (!targetMovPath) return [];

    const movUrl = `https://turkcealtyazi.org${targetMovPath.startsWith('/') ? '' : '/'}${targetMovPath}`;
    const movRes = await fetch(movUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': findUrl,
      },
      signal: AbortSignal.timeout(5500),
    });
    if (!movRes.ok) return [];
    const movHtml = decodeSubtitleText(Buffer.from(await movRes.arrayBuffer()));

    // Parse subtitle rows matching /sub/<id>/...html
    const subRows = [];
    const seenSub = new Set();
    const rowRegex = /href="(\/sub\/(\d+)\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = rowRegex.exec(movHtml)) !== null) {
      const subPath = m[1];
      const subId = m[2];
      if (seenSub.has(subId)) continue;
      // Look at surrounding snippet (~400 chars around link) for Turkish language flag / release tag
      const start = Math.max(0, m.index - 250);
      const end = Math.min(movHtml.length, m.index + 600);
      const snippet = movHtml.slice(start, end);
      const isEngOnly = /flag-en|İngilizce|alt="en"/i.test(snippet) && !/flag-tr|Türkçe|alt="tr"/i.test(snippet);
      if (isEngOnly) continue;
      seenSub.add(subId);

      const fpsMatch = snippet.match(/(\d{2}(?:\.\d{3})?)\s*fps/i);
      const releaseMatch = snippet.match(/class="altsonucsurum"[^>]*>([^<]+)</i) || m[3].replace(/<[^>]+>/g, '');
      const fpsText = fpsMatch ? ` (${fpsMatch[1]} fps)` : '';
      const fullSubUrl = `https://turkcealtyazi.org${subPath}`;
      subRows.push({
        id: `ta_${subId}`,
        label: `Türkçe Altyazı TA-${subRows.length + 1}${fpsText}`,
        lang: 'tr',
        kind: 'subtitles',
        playableUrl: `/api/subtitles/ta?subUrl=${encodeURIComponent(fullSubUrl)}`,
        external: true,
        releaseHint: typeof releaseMatch === 'string' ? releaseMatch.trim().slice(0, 40) : '',
      });
      if (subRows.length >= 6) break;
    }
    return subRows;
  } catch {
    return [];
  }
}

async function searchTurkishSubtitles({ title = '', imdbId = '', year = '' } = {}) {
  const cleanTitle = cleanMovieTitleForSubtitleSearch(title);
  if (!cleanTitle && !imdbId) return [];
  const cacheKey = `${imdbId || ''}|${cleanTitle.toLowerCase()}|${year || ''}`;
  const cached = subtitleResultCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SUBTITLE_CACHE_TTL_MS) {
    return cached.items;
  }

  const [osRes, taRes] = await Promise.allSettled([
    searchOpenSubtitlesStremio(imdbId, cleanTitle, year),
    searchTurkceAltyaziOrg(cleanTitle, year),
  ]);

  const combined = [];
  if (osRes.status === 'fulfilled' && Array.isArray(osRes.value)) combined.push(...osRes.value);
  if (taRes.status === 'fulfilled' && Array.isArray(taRes.value)) combined.push(...taRes.value);

  // Deduplicate by playableUrl and limit cleanly
  const deduped = [];
  const seen = new Set();
  for (const item of combined) {
    if (!item?.playableUrl || seen.has(item.playableUrl)) continue;
    seen.add(item.playableUrl);
    deduped.push({
      id: item.id,
      label: `TR Altyazı ${deduped.length + 1}`,
      lang: 'tr',
      kind: 'subtitles',
      playableUrl: item.playableUrl,
      external: true,
    });
  }

  if (deduped.length > 0) {
    subtitleResultCache.set(cacheKey, { ts: Date.now(), items: deduped });
  }
  return deduped;
}

// GET /api/subtitles/search?title=...&imdbId=...&year=...
router.get(['/subtitles/search', '/api/subtitles/search'], async (req, res) => {
  try {
    const { title = '', imdbId = '', year = '' } = req.query || {};
    if (!title && !imdbId) {
      return res.status(400).json({ success: false, error: 'title veya imdbId gereklidir.', subtitles: [] });
    }
    const subtitles = await searchTurkishSubtitles({ title: String(title), imdbId: String(imdbId), year: String(year) });
    return res.status(200).json({ success: true, subtitles, count: subtitles.length });
  } catch (err) {
    return res.status(200).json({ success: false, subtitles: [], count: 0, error: err.message });
  }
});

// GET /api/subtitles/vtt?url=<encoded_srt_or_vtt_or_zip_url>
router.get(['/subtitles/vtt', '/api/subtitles/vtt'], async (req, res) => {
  try {
    const targetUrl = String(req.query?.url || '').trim();
    const ssrf = validateSsrfUrl(targetUrl);
    if (!targetUrl || !ssrf.safe) {
      return res.status(400).json({ error: 'Geçersiz altyazı URL.' });
    }
    const cached = subtitleFileCache.get(`vtt:${targetUrl}`);
    if (cached && Date.now() - cached.ts < SUBTITLE_CACHE_TTL_MS) {
      res.set({
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800',
      });
      return res.status(200).send(cached.buf);
    }

    const upstream = await safeFetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Altyazı indirilemedi.' });
    }
    let rawBuf = Buffer.from(await upstream.arrayBuffer());
    // Check if zip (PK\x03\x04)
    if (rawBuf.length >= 4 && rawBuf[0] === 0x50 && rawBuf[1] === 0x4b && rawBuf[2] === 0x03 && rawBuf[3] === 0x04) {
      const extracted = extractBestSubFromZipBuffer(rawBuf);
      if (!extracted) return res.status(404).json({ error: 'ZIP içerisinden geçerli altyazı çıkmadı.' });
      rawBuf = extracted;
    }
    const vttBuf = convertSrtBufferToVtt(rawBuf);
    subtitleFileCache.set(`vtt:${targetUrl}`, { ts: Date.now(), buf: vttBuf });
    res.set({
      'Content-Type': 'text/vtt; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
    });
    return res.status(200).send(vttBuf);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subtitles/ta?subUrl=<turkcealtyazi_sub_detail_url>
router.get(['/subtitles/ta', '/api/subtitles/ta'], async (req, res) => {
  try {
    const subUrl = String(req.query?.subUrl || '').trim();
    if (!subUrl.startsWith('https://turkcealtyazi.org/sub/') || !validateSsrfUrl(subUrl).safe) {
      return res.status(400).json({ error: 'Geçersiz TürkçeAltyazı adresi.' });
    }
    const cached = subtitleFileCache.get(`ta:${subUrl}`);
    if (cached && Date.now() - cached.ts < SUBTITLE_CACHE_TTL_MS) {
      res.set({
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800',
      });
      return res.status(200).send(cached.buf);
    }

    const detailRes = await safeFetch(subUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://turkcealtyazi.org/',
      },
    });
    if (!detailRes.ok) return res.status(detailRes.status).json({ error: 'Altyazı detay sayfası açılamadı.' });
    const detailHtml = decodeSubtitleText(Buffer.from(await detailRes.arrayBuffer()));

    const idid = detailHtml.match(/name=["']idid["'][^>]+value=["']([^"']+)["']/i)?.[1] || '';
    const altid = detailHtml.match(/name=["']altid["'][^>]+value=["']([^"']+)["']/i)?.[1] || '';
    const sidid = detailHtml.match(/name=["']sidid["'][^>]+value=["']([^"']+)["']/i)?.[1] || '';
    if (!idid || !altid) {
      return res.status(404).json({ error: 'İndirme parametreleri bulunamadı.' });
    }

    const formBody = new URLSearchParams({ idid, altid, sidid }).toString();
    const dlRes = await safeFetch('https://turkcealtyazi.org/ind', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': subUrl,
        'Origin': 'https://turkcealtyazi.org',
      },
      body: formBody,
    });
    if (!dlRes.ok) return res.status(dlRes.status).json({ error: 'Altyazı dosyası indirilemedi.' });
    let fileBuf = Buffer.from(await dlRes.arrayBuffer());
    if (fileBuf.length >= 4 && fileBuf[0] === 0x50 && fileBuf[1] === 0x4b && fileBuf[2] === 0x03 && fileBuf[3] === 0x04) {
      const extracted = extractBestSubFromZipBuffer(fileBuf);
      if (!extracted) return res.status(404).json({ error: 'ZIP arşivinde uygun altyazı bulunamadı.' });
      fileBuf = extracted;
    }
    const vttBuf = convertSrtBufferToVtt(fileBuf);
    subtitleFileCache.set(`ta:${subUrl}`, { ts: Date.now(), buf: vttBuf });
    res.set({
      'Content-Type': 'text/vtt; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
    });
    return res.status(200).send(vttBuf);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/detect-subtitles
// Auto-detects subtitles from active stream, target page, or external Turkish subtitle repositories
router.post(['/detect-subtitles', '/api/detect-subtitles'], resolverLimiter, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  try {
    const { streamUrl, pageUrl, sourceToken, title, imdbId, year } = req.body || {};
    const unsealed = sourceToken ? unsealSourcePayload(sourceToken) : null;
    const resolvedPageUrl = (unsealed && unsealed.url) ? unsealed.url : pageUrl;
    if (!streamUrl && !resolvedPageUrl && !title && !imdbId) {
      return res.status(400).json({ success: false, error: 'streamUrl, pageUrl veya title gereklidir.' });
    }

    // SSRF protection: absolute URLs must be public http(s) addresses.
    for (const candidate of [streamUrl, resolvedPageUrl]) {
      if (!candidate) continue;
      if (typeof candidate !== 'string') {
        return res.status(400).json({ success: false, error: 'Geçersiz URL.' });
      }
      let decoded = candidate;
      try { decoded = decodeURIComponent(candidate); } catch { /* keep raw */ }
      if (/^[a-z][a-z0-9+.-]*:/i.test(decoded) && !validateSsrfUrl(decoded).safe) {
        return res.status(400).json({ success: false, error: 'Geçersiz veya izin verilmeyen URL.' });
      }
    }

    const rawUrl = streamUrl ? decodeURIComponent(streamUrl) : '';
    const subtitles = [];
    const seen = new Set();

    const addSub = (file, label, kind = 'subtitles', directPlayable = null) => {
      const key = directPlayable || file;
      if (!key || seen.has(key)) return;
      seen.add(key);
      const playableUrl = directPlayable || `/api/proxy?url=${encodeURIComponent(file)}`;
      subtitles.push({ file: directPlayable ? undefined : file, playableUrl, label, kind });
    };

    // 1. Detect embed ID in stream URL
    const embedMatch = rawUrl.match(/-([a-zA-Z0-9_-]{8,16})\.mp4/i) || rawUrl.match(/\/embed\/([a-zA-Z0-9_-]{8,16})/i);
    if (embedMatch && embedMatch[1]) {
      const embedId = embedMatch[1];
      const embedUrl = `https://hdfilmcehennemi.mobi/video/embed/${embedId}/`;
      try {
        const html = await fetchWithCurl(embedUrl, ['Referer: https://www.hdfilmcehennemi.nl/'], 6);
        if (html && html.length > 200) {
          const { extractSubtitles } = require('../stream-resolver/services/fastScraper');
          if (extractSubtitles) {
            const found = extractSubtitles(html, 'https://hdfilmcehennemi.mobi/');
            for (const s of found) addSub(s.file, s.label, s.kind);
          }
        }
      } catch {}
    }

    // 2. If resolvedPageUrl is available and subtitles are still empty, inspect page
    if (subtitles.length === 0 && resolvedPageUrl && resolvedPageUrl.startsWith('http') && fastResolve) {
      try {
        const resolved = await fastResolve(resolvedPageUrl, { timeout: 8000 });
        if (resolved && Array.isArray(resolved.subtitles)) {
          for (const s of resolved.subtitles) addSub(s.file, s.label, s.kind);
        }
      } catch {}
    }

    // 3. Always enrich with ready Turkish subtitles from subtitle sites when title or imdbId is provided
    if (title || imdbId) {
      try {
        const trSubs = await searchTurkishSubtitles({ title: title || '', imdbId: imdbId || '', year: year || '' });
        for (const s of trSubs) {
          addSub(null, s.label, s.kind, s.playableUrl);
        }
      } catch {}
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

// POST /api/alternative-labels (Strictly admin / touristAdmin only — unseals provider labels for room watch party)
router.post(['/alternative-labels', '/api/alternative-labels'], protect, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  if (!isAdminOrTouristUser(req)) {
    return res.status(403).json({ success: false, error: 'Bu bilgiye yalnızca yetkililer erişebilir.' });
  }
  const { groups } = req.body || {};
  if (!Array.isArray(groups)) {
    return res.status(200).json({ success: true, labels: {} });
  }
  const labels = {};
  for (const grp of groups.slice(0, 12)) {
    if (!grp || !Array.isArray(grp.items)) continue;
    for (const item of grp.items.slice(0, 16)) {
      if (!item?.sourceToken) continue;
      const unsealed = unsealSourcePayload(item.sourceToken);
      if (unsealed?.providerKey && grp.groupId && !labels[grp.groupId]) {
        labels[grp.groupId] = PROVIDER_DISPLAY_NAMES[unsealed.providerKey] || unsealed.providerKey;
      }
    }
  }
  return res.status(200).json({ success: true, labels });
});

// In-process search cache (30 minutes TTL)
const inProcessSearchCache = new Map();
const SEARCH_CACHE_TTL = 30 * 60 * 1000;

/**
 * FullHDFilmİzlesene doğrudan arama
 */
async function searchFullHDFilm(query) {
  const parseFhfHtml = (html) => {
    const results = [];
    const filmBlockRegex = /<li[^>]*class="film"[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = filmBlockRegex.exec(html)) !== null) {
      const block = match[1];
      const linkMatch = block.match(/href="(https:\/\/www\.fullhdfilmizlesene\.now\/film\/[^"]+)"/i);
      const titleMatch = block.match(/<span class="film-title">([^<]+)<\/span>/i) || block.match(/class="tt"[^>]*>([^<]+)<\/a>/i);
      const yearMatch = block.match(/<span class="film-yil">(\d{4})<\/span>/i) || block.match(/\b(19\d{2}|20\d{2})\b/);
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
          year: yearMatch ? yearMatch[1] : '',
          url: linkMatch[1],
          poster,
        });
      }
    }
    return results;
  };

  try {
    const targetUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
    let html = await fetchWithTlsImpersonator(targetUrl, 'https://www.fullhdfilmizlesene.now/');
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'], 5);
    }
    const results = parseFhfHtml(html || '');
    if (results.length > 0) return results.slice(0, 10);
  } catch {}

  const apiKey = getValidScraperApiKey();
  if (apiKey) {
    try {
      const targetUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
      if (res.status === 403) { exhaustedScraperKeys.add(apiKey); return []; }
      if (!res.ok) return [];
      return parseFhfHtml(await res.text()).slice(0, 10);
    } catch { return []; }
  }
  return [];
}

/**
 * HDFilmCehennemi doğrudan arama (AJAX JSON + HTML fallback)
 */
async function searchHDFilmCehennemi(query) {
  const tryDomains = ['https://www.hdfilmcehennemi.nl', 'https://hdfilmcehennemi.nl'];
  for (const base of tryDomains) {
    try {
      const targetUrl = `${base}/search/?q=${encodeURIComponent(query)}`;
      let raw = '';
      try {
        const fRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': `${base}/`,
            'x-requested-with': 'fetch',
            'Accept': 'application/json, text/plain, */*',
          },
          signal: AbortSignal.timeout(5500),
        });
        if (fRes.ok) raw = await fRes.text();
      } catch {}

      if (!raw || !raw.trim().startsWith('{')) {
        raw = await fetchWithCurl(targetUrl, [
          `Referer: ${base}/`,
          'x-requested-with: fetch',
          'Accept: application/json, text/plain, */*'
        ], 5);
      }

      if (raw && raw.trim().startsWith('{')) {
        const json = JSON.parse(raw);
        const results = [];
        if (json && Array.isArray(json.results)) {
          for (const itemHtml of json.results) {
            const urlMatch = itemHtml.match(/href="([^"]+)"/);
            const titleMatch = itemHtml.match(/<h4 class="title">([^<]+)<\/h4>/i) || itemHtml.match(/alt="([^"]+)"/);
            const yearMatch = itemHtml.match(/class="year"[^>]*>(\d{4})</i) || itemHtml.match(/\b(19\d{2}|20\d{2})\b/);
            const posterMatch = itemHtml.match(/data-src="([^"]+)"/i) || itemHtml.match(/src="([^"]+)"/i);
            if (urlMatch && urlMatch[1]) {
              const rawTitle = titleMatch ? titleMatch[1].trim() : 'Film';
              let finalUrl = urlMatch[1].trim();
              if (!finalUrl.startsWith('http')) {
                finalUrl = `${base}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
              }
              let finalPoster = posterMatch ? posterMatch[1].trim() : null;
              if (finalPoster && finalPoster.startsWith('data:')) finalPoster = null;
              if (finalPoster && !finalPoster.startsWith('http')) {
                finalPoster = `${base}${finalPoster.startsWith('/') ? '' : '/'}${finalPoster}`;
              }
              results.push({
                provider: 'HDFilmCehennemi',
                providerKey: 'hdfilmcehennemi',
                title: decodeHtmlEntities(rawTitle),
                year: yearMatch ? yearMatch[1] : '',
                url: finalUrl,
                poster: finalPoster,
              });
            }
          }
        }
        if (results.length > 0) return results.slice(0, 10);
      }
    } catch {}
  }

  // Fallback to HTML /arama/?s= if AJAX endpoint returned empty
  try {
    const htmlUrl = `https://www.hdfilmcehennemi.nl/arama/?s=${encodeURIComponent(query)}`;
    const html = await fetchWithCurl(htmlUrl, ['Referer: https://www.hdfilmcehennemi.nl/'], 5);
    if (html && !isBlockedOrChallenge(html)) {
      const results = [];
      const cardRegex = /<a[^>]+class="poster"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = cardRegex.exec(html)) !== null) {
        const href = m[1];
        const inner = m[2];
        const title = inner.match(/class="title"[^>]*>([^<]+)</i)?.[1] || inner.match(/alt="([^"]+)"/i)?.[1];
        const poster = inner.match(/data-src="([^"]+)"/i)?.[1] || inner.match(/src="([^"]+)"/i)?.[1] || null;
        if (href && title) {
          results.push({
            provider: 'HDFilmCehennemi',
            providerKey: 'hdfilmcehennemi',
            title: decodeHtmlEntities(title.trim()),
            year: inner.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '',
            url: href.startsWith('http') ? href : `https://www.hdfilmcehennemi.nl${href.startsWith('/') ? '' : '/'}${href}`,
            poster,
          });
        }
      }
      if (results.length > 0) return results.slice(0, 10);
    }
  } catch {}

  return [];
}

/**
 * FilmMakinesi doğrudan arama
 */
async function searchFilmMakinesi(query) {
  try {
    const targetUrl = `https://filmmakinesi.to/arama/?s=${encodeURIComponent(query)}`;
    let html = '';
    try {
      const fRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(5500),
      });
      if (fRes.ok) html = await fRes.text();
    } catch {}
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'], 5);
    }
    const results = [];
    const itemRegex = /<a[^>]+class="item"[^>]+href="([^"]+)"[^>]+data-title="([^"]+)"([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2];
      const inner = match[3] || '';
      const poster = inner.match(/data-src="([^"]+)"/i)?.[1] || inner.match(/src="([^"]+)"/i)?.[1] || '';
      const year = inner.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '';
      const fullUrl = href.startsWith('http') ? href : `https://filmmakinesi.to${href.startsWith('/') ? '' : '/'}${href}`;
      const fullPoster = poster ? (poster.startsWith('http') ? poster : `https://filmmakinesi.to${poster.startsWith('/') ? '' : '/'}${poster}`) : null;
      results.push({
        provider: 'FilmMakinesi',
        providerKey: 'filmmakinesi',
        title: decodeHtmlEntities(title.trim()),
        year,
        url: fullUrl,
        poster: fullPoster,
      });
    }
    if (results.length > 0) return results.slice(0, 10);
  } catch {}
  return [];
}

/**
 * FilmDozu arama (https://filmdozu.com/ara?q=...)
 */
async function searchFilmDozu(query) {
  try {
    const targetUrl = `https://filmdozu.com/ara?q=${encodeURIComponent(query)}`;
    let html = '';
    try {
      const fRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://filmdozu.com/',
        },
        signal: AbortSignal.timeout(5500),
      });
      if (fRes.ok) html = await fRes.text();
    } catch {}
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Referer: https://filmdozu.com/'], 5);
    }
    const results = [];
    const articleRegex = /<article[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let m;
    while ((m = articleRegex.exec(html)) !== null) {
      const block = m[1];
      const href = block.match(/<a[^>]+href="([^"]+)"/i)?.[1];
      const title = block.match(/<h3[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
                 || block.match(/alt="([^"]+)"/i)?.[1]?.trim();
      const poster = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i)?.[1] || null;
      const year = block.match(/<span[^>]*>\s*((?:19|20)\d{2})\s*<\/span>/i)?.[1]
                || block.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '';
      if (href && title) {
        const fullUrl = href.startsWith('http') ? href : `https://filmdozu.com${href.startsWith('/') ? '' : '/'}${href}`;
        const fullPoster = poster ? (poster.startsWith('http') ? poster : `https://filmdozu.com${poster.startsWith('/') ? '' : '/'}${poster}`) : null;
        results.push({
          provider: 'FilmDozu',
          providerKey: 'filmdozu',
          title: decodeHtmlEntities(title),
          year,
          url: fullUrl,
          poster: fullPoster,
        });
      }
    }
    return results.slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Filmİzyon arama (https://www.filmizyon.net/?s=...)
 */
async function searchFilmIzyon(query) {
  try {
    const targetUrl = `https://www.filmizyon.net/?s=${encodeURIComponent(query)}`;
    let html = '';
    try {
      const fRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.filmizyon.net/',
        },
        signal: AbortSignal.timeout(5500),
      });
      if (fRes.ok) html = await fRes.text();
    } catch {}
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Referer: https://www.filmizyon.net/'], 5);
    }
    const results = [];
    const cardRegex = /<article[^>]*class="[^"]*fz-poster-card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let m;
    while ((m = cardRegex.exec(html)) !== null) {
      const block = m[1];
      const linkMatch = block.match(/<a[^>]*class="[^"]*fz-poster-card__link[^"]*"[^>]+href="([^"]+)"([^>]*)>/i)
                     || block.match(/<a[^>]+href="([^"]+)"([^>]*)>/i);
      if (!linkMatch) continue;
      const href = linkMatch[1];
      const attrs = linkMatch[2] || '';
      const aria = attrs.match(/aria-label="([^"]+)"/i)?.[1] || '';
      const heading = block.match(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
                   || block.match(/alt="([^"]+)"/i)?.[1]?.trim()
                   || aria.replace(/\s+(?:19|20)\d{2}(?:\s+\d+(?:\.\d+)?)?$/, '').trim();
      const year = block.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || aria.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '';
      const poster = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i)?.[1] || null;
      if (href && heading) {
        const fullUrl = href.startsWith('http') ? href : `https://www.filmizyon.net${href.startsWith('/') ? '' : '/'}${href}`;
        const fullPoster = poster ? (poster.startsWith('http') ? poster : `https://www.filmizyon.net${poster.startsWith('/') ? '' : '/'}${poster}`) : null;
        results.push({
          provider: 'Filmİzyon',
          providerKey: 'filmizyon',
          title: decodeHtmlEntities(heading),
          year,
          url: fullUrl,
          poster: fullPoster,
        });
      }
    }
    return results.slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * RoketDizi arama (POST https://roketdizi.life/api/mj)
 */
async function searchRoketDizi(query) {
  try {
    for (const action of ['searchContent', 'searchContentFullText']) {
      const res = await fetch('https://roketdizi.life/api/mj', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'Referer': 'https://roketdizi.life/',
          'Origin': 'https://roketdizi.life',
        },
        body: JSON.stringify({ action, params: [query] }),
        signal: AbortSignal.timeout(5500),
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      const items = Array.isArray(data?.result) ? data.result : [];
      if (items.length === 0) continue;

      const results = [];
      for (const item of items.slice(0, 10)) {
        const slug = item.used_slug;
        const name = item.object_name || item.object_alternative_name;
        if (!slug || !name) continue;
        const isSeries = String(item.used_type || '').toUpperCase() === 'SERIES';
        const cleanSlug = String(slug).replace(/^\/+|\/+$/g, '');
        let pagePath = cleanSlug;
        if (isSeries) {
          if (!cleanSlug.startsWith('dizi/')) pagePath = `dizi/${cleanSlug}`;
        } else {
          if (!cleanSlug.startsWith('film/')) pagePath = `film/${cleanSlug}`;
          if (!pagePath.endsWith('/izle')) pagePath = `${pagePath}/izle`;
        }
        const pageUrl = `https://roketdizi.life/${pagePath}`;
        let poster = item.object_poster_url || null;
        if (poster && !poster.startsWith('http')) {
          poster = `https://roketdizi.life${poster.startsWith('/') ? '' : '/'}${poster}`;
        }
        const altName = item.object_alternative_name && item.object_alternative_name !== name
          ? `${name} / ${item.object_alternative_name}`
          : name;
        results.push({
          provider: 'RoketDizi',
          providerKey: 'roketdizi',
          title: decodeHtmlEntities(name),
          altTitle: decodeHtmlEntities(altName),
          year: item.object_release_year ? String(item.object_release_year).slice(0, 4) : '',
          imdbId: item.object_related_imdb_id || '',
          url: pageUrl,
          poster,
          mediaType: isSeries ? 'series' : 'movie',
        });
      }
      if (results.length > 0) return results;
    }
    return [];
  } catch {
    return [];
  }
}

// Film başlıklarını çapraz site birleştirmesi için normalize eder (devam filmlerini korur!)
function normalizeMovieTitleKey(title = '') {
  if (!title) return '';
  let str = String(title).toLowerCase();
  const removeWords = [
    'türkçe dublaj', 'turkce dublaj', 'türkçe altyazı', 'turkce altyazi',
    'altyazılı', 'altyazili', 'dublaj', 'dual', 'tr-en', 'full hd', '1080p',
    '720p', '4k', 'uhd', 'hd', 'izle', 'filmi', 'film'
  ];
  str = str.replace(/\((?:19|20)\d{2}\)/g, ' ');
  str = str.replace(/[()[\]{}_,.:;!?\\|\-–—+&]/g, ' ');
  for (const w of removeWords) {
    const reg = new RegExp('(^|\\s+)' + w + '(\\s+|$)', 'gi');
    while (reg.test(str)) {
      str = str.replace(reg, ' ');
    }
  }
  str = str
    .replace(/[ıİ]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  return str.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function extractTitleAliases(item) {
  const aliases = new Set();
  const rawParts = [item.title, item.altTitle]
    .filter(Boolean)
    .flatMap(t => String(t).split(/\s*[|/]\s*|\s+-\s+/));
  for (const p of rawParts) {
    const norm = normalizeMovieTitleKey(p);
    if (norm && norm.length >= 2) aliases.add(norm);
  }
  const fullNorm = normalizeMovieTitleKey(item.title);
  if (fullNorm) aliases.add(fullNorm);
  return Array.from(aliases);
}

// Çapraz site birleştirme: aynı filmi (tüm sitelerden gelen kaynaklarıyla) tek orijinal kartta toplar, benzer/devam filmlerini ayrı bırakır
function deduplicateMovieResults(movies) {
  const groups = [];

  for (const item of movies) {
    if (!item?.url) continue;
    const aliases = extractTitleAliases(item);
    if (aliases.length === 0) continue;
    const itemYear = String(item.year || item.title?.match(/\b(19\d{2}|20\d{2})\b/)?.[1] || '');
    const itemImdb = item.imdbId || '';

    let matchedGroup = null;
    for (const g of groups) {
      if (itemImdb && g.imdbId) {
        if (itemImdb === g.imdbId) {
          matchedGroup = g;
          break;
        }
        continue; // Farklı IMDB ID'leri asla birleştirme
      }
      const shareAlias = aliases.some(a => g.aliasSet.has(a));
      if (!shareAlias) continue;
      if (itemYear && g.year && Math.abs(Number(itemYear) - Number(g.year)) > 1) {
        continue; // Farklı yıllarda çıkan aynı isimli filmleri (remake vb.) koru
      }
      matchedGroup = g;
      break;
    }

    const cleanDisplayTitle = decodeHtmlEntities(String(item.title || ''))
      .replace(/\b(?:türkçe\s*dublaj|türkçe\s*altyazı|altyazılı|dublajlı|full\s*hd|1080p|720p|4k|izle)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*[-–|\/]\s*$/, '')
      .trim() || item.title;

    const sourceEntry = {
      providerKey: item.providerKey || inferProviderFromUrl(item.url),
      provider: item.provider || PROVIDER_DISPLAY_NAMES[item.providerKey] || 'Harici',
      url: item.url,
      title: item.title,
      year: itemYear,
      imdbId: itemImdb,
    };

    if (!matchedGroup) {
      groups.push({
        id: `mov_${groups.length + 1}`,
        title: cleanDisplayTitle,
        year: itemYear,
        imdbId: itemImdb,
        poster: item.poster || null,
        aliasSet: new Set(aliases),
        sources: [sourceEntry],
      });
    } else {
      for (const a of aliases) matchedGroup.aliasSet.add(a);
      if (!matchedGroup.poster && item.poster) matchedGroup.poster = item.poster;
      if (!matchedGroup.year && itemYear) matchedGroup.year = itemYear;
      if (!matchedGroup.imdbId && itemImdb) matchedGroup.imdbId = itemImdb;
      // Tercihen temiz/İngilizce orijinal başlık veya yıl bilgisi olan başlık seçimi
      if (cleanDisplayTitle.length > 1 && cleanDisplayTitle.length < matchedGroup.title.length && !/[|/]\s/.test(cleanDisplayTitle)) {
        matchedGroup.title = cleanDisplayTitle;
      }
      const existsSameSiteUrl = matchedGroup.sources.some(s => s.url === sourceEntry.url);
      if (!existsSameSiteUrl) {
        // Aynı sitede dublaj varsa ek veya öncelikli tut
        matchedGroup.sources.push(sourceEntry);
      }
    }
  }

  return groups
    .sort((a, b) => b.sources.length - a.sources.length)
    .map(g => ({
      id: g.id,
      title: g.title,
      year: g.year,
      imdbId: g.imdbId,
      poster: g.poster,
      sources: g.sources,
    }));
}

function formatSearchResponseForUser(unifiedGroups, isPrivileged) {
  return unifiedGroups.map((g) => {
    const sourceTokens = g.sources.map(s => sealSourcePayload({
      url: s.url,
      providerKey: s.providerKey,
      title: s.title || g.title,
      year: s.year || g.year,
      imdbId: s.imdbId || g.imdbId,
    })).filter(Boolean);

    const uniqueProviders = [...new Set(g.sources.map(s => s.provider || PROVIDER_DISPLAY_NAMES[s.providerKey] || 'Kaynak'))];

    if (isPrivileged) {
      return {
        id: g.id,
        title: g.title,
        year: g.year,
        imdbId: g.imdbId,
        poster: g.poster,
        sourceTokens,
        sourceCount: g.sources.length,
        url: g.sources[0]?.url,
        provider: uniqueProviders.join(' + '),
        providerKey: g.sources[0]?.providerKey,
        providers: uniqueProviders,
        sources: g.sources.map((s, idx) => ({
          ...s,
          sourceToken: sourceTokens[idx],
        })),
      };
    }

    // Normal kullanıcı: kaynak site adı, logosu veya URL'i KESİNLİKLE dönülmez
    return {
      id: g.id,
      title: g.title,
      year: g.year,
      imdbId: g.imdbId,
      poster: g.poster,
      sourceTokens,
      sourceCount: sourceTokens.length,
    };
  });
}

// GET/POST /api/search-movies and /search-movies
router.all(['/search-movies', '/api/search-movies'], optionalProtect, async (req, res) => {
  const query = req.query.q || req.body?.query || req.body?.q || '';
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Arama terimi en az 2 karakter olmalıdır.', results: [] });
  }

  const trimmedQuery = query.trim();
  const cacheKey = `unified_v2:${trimmedQuery.toLowerCase()}`;
  const isPrivileged = isAdminOrTouristUser(req);

  // 1. Önbellek kontrolü (yetkiye göre dinamik maskelenmiş yanıt üret)
  const cached = inProcessSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    const formatted = formatSearchResponseForUser(cached.results, isPrivileged);
    return res.status(200).json({
      success: true,
      query: trimmedQuery,
      count: formatted.length,
      results: formatted,
      showSources: isPrivileged,
      cached: true,
    });
  }

  // 2. Eşzamanlı 6 kaynak arama (FullHDFilmİzlesene + HDFilmCehennemi + FilmMakinesi + FilmDozu + Filmİzyon + RoketDizi)
  try {
    const settled = await Promise.allSettled([
      searchFullHDFilm(trimmedQuery),
      searchHDFilmCehennemi(trimmedQuery),
      searchFilmMakinesi(trimmedQuery),
      searchFilmDozu(trimmedQuery),
      searchFilmIzyon(trimmedQuery),
      searchRoketDizi(trimmedQuery),
    ]);

    const combined = [];
    for (const s of settled) {
      if (s.status === 'fulfilled' && Array.isArray(s.value)) {
        combined.push(...s.value);
      }
    }

    if (combined.length > 0) {
      const unifiedResults = deduplicateMovieResults(combined);
      // Aynı arama içinde afişi eksik kart varsa yalnızca aynı normalize başlıklı diğer kartlardan al
      inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), results: unifiedResults });
      const formatted = formatSearchResponseForUser(unifiedResults, isPrivileged);
      return res.status(200).json({
        success: true,
        query: trimmedQuery,
        count: formatted.length,
        results: formatted,
        showSources: isPrivileged,
      });
    }
  } catch (fastSearchErr) {
    console.warn('[HLSProxy] Fast search error:', fastSearchErr.message);
  }

  // 3. Playwright tabanlı dahili arama fallback
  if (inProcessMovieSearch) {
    try {
      const rawResults = await inProcessMovieSearch(trimmedQuery);
      if (rawResults && rawResults.length > 0) {
        const unified = deduplicateMovieResults(rawResults);
        inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), results: unified });
        const formatted = formatSearchResponseForUser(unified, isPrivileged);
        return res.status(200).json({
          success: true,
          query: trimmedQuery,
          count: formatted.length,
          results: formatted,
          showSources: isPrivileged,
        });
      }
    } catch (err) {
      console.warn('[HLSProxy] In-process movie search error:', err.message);
    }
  }

  return res.status(200).json({
    success: true,
    query: trimmedQuery,
    count: 0,
    results: [],
    showSources: isPrivileged,
  });
});

export default router;
