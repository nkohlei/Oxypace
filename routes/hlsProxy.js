import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateSsrfUrl, safeFetch } from '../utils/security.js';
import { Readable } from 'stream';
import { createRequire } from 'module';
import vm from 'vm';
import { execFile, execFileSync, spawn } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import path from 'path';
import zlib from 'zlib';
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
  const envKeys = (process.env.SCRAPERAPI_KEYS || process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY || '')
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

let cachedTlsPythonBin = undefined;
function resolveTlsPythonBin() {
  if (cachedTlsPythonBin !== undefined) return cachedTlsPythonBin;
  const candidates = [
    process.env.TLS_PYTHON_BIN,
    path.join(__dirname, '../stream-resolver/venv/bin/python'),
    path.join(__dirname, '../venv/bin/python'),
    '/home/ubuntu/venv/bin/python',
    'python3',
    'python',
  ].filter(Boolean);
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['-c', 'import curl_cffi'], { timeout: 2500, stdio: 'ignore' });
      cachedTlsPythonBin = bin;
      return bin;
    } catch {}
  }
  cachedTlsPythonBin = null;
  return null;
}

function buildEnvProxyUrl() {
  const raw = String(process.env.PROXY_SERVER || '').trim();
  if (!raw) return '';
  try {
    const withScheme = raw.includes('://') ? raw : `http://${raw}`;
    const u = new URL(withScheme);
    const user = String(process.env.PROXY_USERNAME || '').trim();
    const pass = String(process.env.PROXY_PASSWORD || '').trim();
    if (user && !u.username) {
      u.username = user;
      if (pass) u.password = pass;
    }
    return u.toString();
  } catch {
    return raw;
  }
}

let cachedTorReachable = null;
let cachedTorCheckedAt = 0;
function isTorReachable() {
  if (Date.now() - cachedTorCheckedAt < 30000 && cachedTorReachable !== null) {
    return Promise.resolve(cachedTorReachable);
  }
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      cachedTorReachable = ok;
      cachedTorCheckedAt = Date.now();
      try { sock.destroy(); } catch {}
      resolve(ok);
    };
    sock.setTimeout(250);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    try { sock.connect(9050, '127.0.0.1'); } catch { done(false); }
  });
}

// Python curl_cffi TLS impersonator (available on server)
function fetchWithTlsImpersonator(url, referer = '') {
  return new Promise((resolve) => {
    const pyBin = resolveTlsPythonBin();
    if (!pyBin) return resolve('');
    const scriptPath = path.join(__dirname, '../stream-resolver/services/tlsFetcher.py');
    execFile(pyBin, [scriptPath, url, referer], { timeout: 12000, maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
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
        !lower.includes('<title>access denied') &&
        !lower.includes('used cloudflare to restrict access') &&
        !lower.includes('yasal nedenlerle') &&
        !(lower.includes('<title>404 not found</title>') && lower.includes('nginx'))) {
      return false;
    }
  }
  const lower = text.toLowerCase();
  if (lower.includes('<title>just a moment...</title>')) return true;
  if (lower.includes('<title>attention required! | cloudflare</title>')) return true;
  if (lower.includes('<title>access denied') || lower.includes('used cloudflare to restrict access')) return true;
  if (lower.includes('451 - yasal') || lower.includes('yasal nedenlerle')) return true;
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

  // 1b. Configured PROXY_SERVER via curl (if set in .env)
  const envProxy = buildEnvProxyUrl();
  if (envProxy) {
    try {
      const argsProxy = [
        '-s', '-L', '-x', envProxy,
        '--max-time', String(timeoutSec + 2),
        '--proto', '=http,https',
        '--proto-redir', '=http,https',
        '--max-redirs', '5',
        '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        '-H', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        ...headers.flatMap(h => ['-H', h]),
        url
      ];
      const { stdout } = await execFileAsync(CURL_BIN, argsProxy);
      if (!isBlockedOrChallenge(stdout)) {
        return stdout;
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
  if (await isTorReachable()) {
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
  }

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
        contentType = 'text/vtt';
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

  const isValidHdfResponse = (t) => Boolean(t && t.length > 500 && !isBlockedOrChallenge(t));

  const fetchWithTorOrDirect = async (url, headers = [], timeoutSec = 5) => {
    // 0. Configured PROXY_SERVER (residential/TR proxy if set in .env)
    const envProxy = buildEnvProxyUrl();
    if (envProxy) {
      try {
        const argsProxy = [
          '-s', '-L', '-x', envProxy,
          '--max-time', String(timeoutSec + 2),
          '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          ...headers.flatMap(h => ['-H', h]),
          url
        ];
        const { stdout } = await execFileAsync(CURL_BIN, argsProxy);
        if (isValidHdfResponse(stdout)) {
          return stdout;
        }
      } catch (e) {}
    }

    // 1. Tor SOCKS5 priority on Linux server (bypasses Datacenter ASN Cloudflare Error 1005)
    if (process.platform === 'linux' && await isTorReachable()) {
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
        if (isValidHdfResponse(stdout)) {
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
        if (isValidHdfResponse(t)) return t;
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
      if (isValidHdfResponse(stdout)) {
        return stdout;
      }
    } catch (e) {}

    // 4. ScraperAPI TR fallback (only if configured and not exhausted)
    const apiKey = getValidScraperApiKey();
    if (apiKey) {
      try {
        const fHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        };
        for (const h of headers) {
          const idx = h.indexOf(':');
          if (idx !== -1) fHeaders[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
        }
        const sUrl = `https://api.scraperapi.com/?api_key=${apiKey}&country_code=tr&keep_headers=true&url=${encodeURIComponent(url)}`;
        const res = await fetch(sUrl, { headers: fHeaders, signal: AbortSignal.timeout((timeoutSec + 10) * 1000) });
        if (res.status === 401 || res.status === 403) {
          exhaustedScraperKeys.add(apiKey);
        } else if (res.ok) {
          const t = await res.text();
          if (isValidHdfResponse(t)) return t;
        }
      } catch (e) {}
    }

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

// POST /api/resolve-stream (Stream Resolver Microservice Bridge & In-Process Resolver)
router.post('/resolve-stream', resolverLimiter, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  const { url, timeout } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Geçersiz veya eksik URL parametresi.' });
  }

  const resolveStreamSsrf = validateSsrfUrl(url.trim());
  if (!resolveStreamSsrf.safe) {
    console.warn(`[SSRF Block] /api/resolve-stream rejected: ${url} — ${resolveStreamSsrf.reason}`);
    return res.status(400).json({ success: false, error: 'Geçersiz veya izin verilmeyen URL.' });
  }

  const trimmedUrl = url.trim();
  const lower = trimmedUrl.toLowerCase();
  const resolveBaseOrigin = getProxyBaseOrigin(req);

  // Instant fast-path for direct stream URLs (.m3u8, master.txt, .mp4)
  if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
    const playableStreamUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(trimmedUrl)}`;
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

  // 0. Instant Standalone Direct Resolver for HDFilmCehennemi (Pure Node.js fetch & VM sandbox, 0 dependencies)
  if (trimmedUrl.includes('hdfilmcehennemi')) {
    try {
      const directResult = await directResolveHDFilmCehennemi(trimmedUrl);
      if (directResult && directResult.streamUrl) {
        const streamHeaders = directResult.headers || {};
        const playableStreamUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(directResult.streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;
        const proxiedSubtitles = (directResult.subtitles || []).map(sub => ({
          ...sub,
          playableUrl: `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(sub.file)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`,
        }));
        return res.status(200).json({
          success: true,
          status: 'success',
          streamUrl: directResult.streamUrl,
          playableStreamUrl,
          type: 'm3u8',
          headers: streamHeaders,
          pageTitle: directResult.pageTitle || 'Film Akışı',
          subtitles: proxiedSubtitles,
          cached: false,
          resolvedIn: Date.now() - startTime,
        });
      }
    } catch (directErr) {
      console.warn('[HLSProxy] directResolveHDFilmCehennemi warning:', directErr.message);
    }
  }

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
        } else if ((fastResult.streamUrl.includes('cdnimages') || fastResult.streamUrl.includes('shop') || fastResult.streamUrl.includes('cyou')) && (!streamHeaders.referer || !streamHeaders.referer.includes('hdfilmcehennemi'))) {
          streamHeaders = { ...streamHeaders, referer: 'https://hdfilmcehennemi.mobi/', origin: 'https://hdfilmcehennemi.mobi' };
        }
        const playableStreamUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(fastResult.streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;

        const proxiedSubtitles = (fastResult.subtitles || []).map(sub => {
          const subFile = sub.file;
          const playableUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(subFile)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;
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
      let errMsg = data?.error?.message || data?.error || 'Stream çözülemedi veya kaynak bulunamadı.';
      if (trimmedUrl.includes('fullhdfilmizlesene')) {
        errMsg = 'Bu film FullHDFilmİzlesene üzerinde harici bot korumalı bir oynatıcıda (VidMoxy vb.) barındırılıyor. Lütfen arama listesindeki HDFilmCehennemi alternatifini seçerek açmayı deneyin.';
      } else if (trimmedUrl.includes('filmmakinesi')) {
        errMsg = 'FilmMakinesi şu anda Cloudflare veri merkezi engeli (Error 1005) uyguladığı için yayın çözümlenemedi. Lütfen HDFilmCehennemi veya FullHDFilmİzlesene alternatifini seçin.';
      }
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

    const playableStreamUrl = `${resolveBaseOrigin}/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;

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
router.post('/detect-subtitles', resolverLimiter, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  try {
    const { streamUrl, pageUrl, title } = req.body || {};
    if (!streamUrl && !pageUrl) {
      return res.status(400).json({ success: false, error: 'streamUrl veya pageUrl gereklidir.' });
    }

    // SSRF protection: absolute URLs must be public http(s) addresses. Relative values (e.g. the
    // `/api/proxy?url=...` playable URL or an uploaded media key) are legitimate client inputs and can
    // never be used as a fetch target on their own; the curl helpers re-validate at the point of use.
    for (const candidate of [streamUrl, pageUrl]) {
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
  // 1. Direct Node fetch with AJAX headers (ultra-fast, ~500ms, zero external dependencies)
  try {
    const targetUrl = `https://www.hdfilmcehennemi.nl/search/?q=${encodeURIComponent(query)}`;
    let raw = '';
    try {
      const fRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://www.hdfilmcehennemi.nl/',
          'x-requested-with': 'fetch',
          'Accept': 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (fRes.ok) {
        raw = await fRes.text();
      }
    } catch {}

    // Fallback to Python TLS Impersonator or curl if direct fetch fails
    if (!raw || !raw.startsWith('{')) {
      raw = await fetchWithTlsImpersonator(targetUrl, 'https://www.hdfilmcehennemi.nl/');
    }
    if (!raw || !raw.startsWith('{')) {
      raw = await fetchWithCurl(targetUrl, [
        'Referer: https://www.hdfilmcehennemi.nl/',
        'x-requested-with: fetch',
        'Accept: application/json, text/plain, */*'
      ], 6);
    }
    if (!raw || !raw.startsWith('{')) {
      const apiKey = getValidScraperApiKey();
      if (apiKey) {
        try {
          const sUrl = `https://api.scraperapi.com/?api_key=${apiKey}&country_code=tr&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
          const sRes = await fetch(sUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Referer': 'https://www.hdfilmcehennemi.nl/',
              'x-requested-with': 'fetch',
              'Accept': 'application/json, text/plain, */*',
            },
            signal: AbortSignal.timeout(15000),
          });
          if (sRes.status === 401 || sRes.status === 403) {
            exhaustedScraperKeys.add(apiKey);
          } else if (sRes.ok) {
            raw = await sRes.text();
          }
        } catch {}
      }
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

// ==========================================
// READY TURKISH SUBTITLE SEARCH & VTT PROXY
// ==========================================
const subtitleResultCache = new Map();
const subtitleFileCache = new Map();
const SUBTITLE_CACHE_TTL_MS = 30 * 60 * 1000;

function decodeSubtitleText(buf) {
  if (!buf || !buf.length) return '';
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    try {
      return new TextDecoder('windows-1254').decode(buf);
    } catch {
      return buf.toString('utf8');
    }
  }
}

function convertSrtBufferToVtt(buf) {
  let text = decodeSubtitleText(buf);
  if (!text) return Buffer.from('WEBVTT\n\n', 'utf8');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '');

  const normalizeVttTs = (rawTs) => {
    const clean = String(rawTs || '').trim();
    const m = clean.match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{1,3})/);
    if (!m) return null;
    const h = String(m[1] ? parseInt(m[1], 10) : 0).padStart(2, '0');
    const mm = String(parseInt(m[2], 10)).padStart(2, '0');
    const ss = String(parseInt(m[3], 10)).padStart(2, '0');
    const ms = String(m[4]).padEnd(3, '0').slice(0, 3);
    const totalSec = parseInt(h, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10) + parseInt(ms, 10) / 1000;
    return { formatted: `${h}:${mm}:${ss}.${ms}`, totalSec };
  };

  if (/^\s*WEBVTT/i.test(text)) {
    const fixed = text.replace(
      /(\d{1,3}:\d{2}(?::\d{2})?)[,.](\d{1,3})/g,
      (_m, hms, ms) => `${hms}.${String(ms).padEnd(3, '0').slice(0, 3)}`
    );
    return Buffer.from(fixed, 'utf8');
  }

  const blocks = text.split(/\n{2,}/);
  const parsedCues = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trimEnd()).filter(Boolean);
    if (lines.length === 0) continue;
    let startIdx = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length > 1 && lines[1].includes('-->')) {
      startIdx = 1;
    }
    const tsLine = lines[startIdx];
    if (!tsLine || !tsLine.includes('-->')) continue;
    const arrowParts = tsLine.split(/\s*-->\s*/);
    if (arrowParts.length < 2) continue;
    const startObj = normalizeVttTs(arrowParts[0]);
    const endTokens = arrowParts[1].trim().split(/\s+/);
    const endObj = normalizeVttTs(endTokens[0]);
    if (!startObj || !endObj || endObj.totalSec <= startObj.totalSec) continue;
    const cueSettings = endTokens.slice(1).join(' ');
    const header = `${startObj.formatted} --> ${endObj.formatted}${cueSettings ? ` ${cueSettings}` : ''}`;
    const body = lines.slice(startIdx + 1).join('\n');
    if (body) {
      parsedCues.push({ startSec: startObj.totalSec, text: `${header}\n${body}` });
    }
  }
  parsedCues.sort((a, b) => a.startSec - b.startSec);
  return Buffer.from(`WEBVTT\n\n${parsedCues.map(c => c.text).join('\n\n')}\n`, 'utf8');
}

function extractBestSubFromZipBuffer(zipBuf) {
  if (!Buffer.isBuffer(zipBuf) || zipBuf.length < 30) return null;
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  const candidates = [];
  if (eocdOffset !== -1) {
    const cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);
    const totalEntries = zipBuf.readUInt16LE(eocdOffset + 10);
    let pos = cdOffset;
    for (let idx = 0; idx < totalEntries && pos + 46 <= zipBuf.length; idx++) {
      if (zipBuf.readUInt32LE(pos) !== 0x02014b50) break;
      const method = zipBuf.readUInt16LE(pos + 10);
      const compSize = zipBuf.readUInt32LE(pos + 20);
      const uncompSize = zipBuf.readUInt32LE(pos + 24);
      const nameLen = zipBuf.readUInt16LE(pos + 28);
      const extraLen = zipBuf.readUInt16LE(pos + 30);
      const commentLen = zipBuf.readUInt16LE(pos + 32);
      const localHeaderOffset = zipBuf.readUInt32LE(pos + 42);
      const fileName = zipBuf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8');
      pos += 46 + nameLen + extraLen + commentLen;
      const lower = fileName.toLowerCase();
      if (!lower.endsWith('.srt') && !lower.endsWith('.vtt')) continue;
      if (/\b(trailer|teaser|sample|fragman)\b/i.test(lower)) continue;
      if (localHeaderOffset + 30 > zipBuf.length || zipBuf.readUInt32LE(localHeaderOffset) !== 0x04034b50) continue;
      const lNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
      const lExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
      const dataEnd = dataStart + compSize;
      if (dataEnd > zipBuf.length) continue;
      const compData = zipBuf.subarray(dataStart, dataEnd);
      try {
        let outBuf = null;
        if (method === 0) outBuf = compData;
        else if (method === 8) outBuf = zlib.inflateRawSync(compData);
        if (outBuf && outBuf.length > 30) {
          let score = lower.endsWith('.vtt') ? 10 : 8;
          if (/web[\s.-]?dl|webrip/i.test(lower)) score += 6;
          if (/bluray|brrip/i.test(lower)) score += 4;
          if (/23\.?976/.test(lower)) score += 5;
          if (/\.tr\.|\.tur\.|turkce/i.test(lower)) score += 4;
          score += Math.min(5, (uncompSize || outBuf.length) / 30000);
          candidates.push({ score, buf: outBuf });
        }
      } catch {}
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.buf || null;
}

function cleanMovieTitleForSubtitleSearch(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let t = decodeHtmlEntities(rawTitle)
    .replace(/\b(1080p|720p|480p|4k|uhd|bluray|web-?dl|hdrip|türkçe dublaj|türkçe altyazı|altyazılı|dublaj|full hd|izle|film izle|hdfilmcehennemi|fullhdfilmizlesene|filmmakinesi)\b/gi, ' ')
    .replace(/\(\s*\d{4}\s*\)/g, ' ')
    .replace(/[|•–—]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
}

function splitTitleCandidates(cleanTitle) {
  if (!cleanTitle) return [];
  const parts = cleanTitle.split(/\s+-\s+/).map(p => p.trim()).filter(p => p.length >= 2);
  // Prefer second part if bilingual (e.g. "Yıldızlar Arasında - Interstellar")
  const ordered = [];
  if (parts.length >= 2) ordered.push(parts[parts.length - 1], parts[0]);
  ordered.push(cleanTitle);
  return [...new Set(ordered)];
}

function parseSubtitleReleaseMeta(rawText = '', explicitFps = 0) {
  const s = String(rawText || '').toLowerCase();
  let fps = explicitFps > 15 ? explicitFps : 0;
  if (!fps) {
    if (/23\.?976|23\.?98/.test(s)) fps = 23.976;
    else if (/\b25(?:\.000?)?\s*fps\b|\b25fps\b/.test(s)) fps = 25;
    else if (/\b24(?:\.000?)?\s*fps\b|\b24fps\b/.test(s)) fps = 24;
  }
  let releaseTag = '';
  let score = 0;
  if (/web[\s._-]?dl|webrip|amzn|nf|dsnp|hmax|atvp/i.test(s)) {
    releaseTag = 'WEB-DL';
    score += 22;
  } else if (/bluray|blu-ray|bdrip|brrip|remux/i.test(s)) {
    releaseTag = 'BluRay';
    score += 18;
  } else if (/hdrip|hdtv/i.test(s)) {
    releaseTag = 'HDTV';
    score += 6;
  } else if (/dvdrip|cam|ts\b|telesync/i.test(s)) {
    releaseTag = 'DVDRip';
    score -= 10;
  }
  if (fps === 23.976) score += 12;
  else if (fps === 24) score += 4;
  else if (fps === 25) score -= 6;
  return {
    fps,
    fpsLabel: fps ? `${fps} fps` : '',
    releaseTag,
    score,
  };
}

async function resolveImdbViaCinemeta(cleanTitle, year = '') {
  const candidates = splitTitleCandidates(cleanTitle);
  for (const q of candidates) {
    try {
      const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(q)}.json`, {
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const metas = Array.isArray(data?.metas) ? data.metas : [];
      if (metas.length === 0) continue;
      const match = year ? (metas.find(m => String(m.releaseInfo || '').includes(String(year))) || metas[0]) : metas[0];
      if (match?.imdb_id && /^tt\d+$/i.test(match.imdb_id)) return match.imdb_id;
      if (match?.id && /^tt\d+$/i.test(match.id)) return match.id;
    } catch {}
  }
  return '';
}

async function searchOpenSubtitlesStremio(imdbId, cleanTitle, year) {
  const id = imdbId && /^tt\d+$/i.test(imdbId) ? imdbId : await resolveImdbViaCinemeta(cleanTitle, year);
  if (!id) return [];
  try {
    const res = await fetch(`https://opensubtitles-v3.strem.io/subtitles/movie/${encodeURIComponent(id)}.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const subs = Array.isArray(data?.subtitles) ? data.subtitles : [];
    const trSubs = subs.filter(s => s && s.url && (s.lang === 'tur' || s.lang === 'tr' || String(s.SubLanguageID || '').toLowerCase() === 'tur'));
    const mapped = [];
    trSubs.forEach((s, idx) => {
      const metaFields = [
        s.subtitleFileName,
        s.movieReleaseName,
        s.releaseFormat,
        s.releaseOther,
        s.release,
        s.SubFileName,
        s.filename,
      ].filter(Boolean).join(' ');
      if (/\b(teaser|trailer|fragman|sample|preview)\b/i.test(metaFields)) return;
      const explicitFps = Number(s.fpsMilli) > 15000 ? Number((Number(s.fpsMilli) / 1000).toFixed(3)) : 0;
      const meta = parseSubtitleReleaseMeta(metaFields, explicitFps);
      const downloads = Number(s.downloadCount || s.downloads || 0);
      const dlBonus = downloads > 0 ? Math.log10(downloads + 1) * 4 : 0;
      mapped.push({
        id: `os_${idx}_${s.id || idx}`,
        fps: meta.fps,
        fpsHint: meta.fpsLabel,
        releaseTag: meta.releaseTag,
        score: meta.score + dlBonus + Math.max(0, 4 - idx * 0.2),
        lang: 'tr',
        kind: 'subtitles',
        playableUrl: `/api/subtitles/vtt?url=${encodeURIComponent(s.url)}`,
        external: true,
      });
    });
    return mapped;
  } catch {
    return [];
  }
}

async function searchTurkceAltyaziOrg(cleanTitle, year) {
  const candidates = splitTitleCandidates(cleanTitle);
  for (const q of candidates) {
    if (!q || q.length < 2) continue;
    try {
      const findUrl = `https://turkcealtyazi.org/find.php?cat=sub&find=${encodeURIComponent(q)}`;
      const findRes = await fetch(findUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(4500),
      });
      if (!findRes.ok) continue;
      const findHtml = decodeSubtitleText(Buffer.from(await findRes.arrayBuffer()));
      const movMatches = [...findHtml.matchAll(/href="(\/mov\/\d+\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)];
      let targetMovPath = null;
      if (findRes.url && findRes.url.includes('/mov/')) {
        targetMovPath = new URL(findRes.url).pathname;
      } else if (movMatches.length > 0) {
        const normQ = q.toLowerCase();
        let bestScore = -1;
        for (const m of movMatches.slice(0, 12)) {
          const text = m[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
          const around = findHtml.slice(Math.max(0, m.index - 100), Math.min(findHtml.length, m.index + 300));
          let score = 0;
          if (text === normQ) score += 10;
          else if (text.includes(normQ)) score += 6;
          if (year && (m[0].includes(String(year)) || around.includes(String(year)))) score += 8;
          if (score > bestScore) {
            bestScore = score;
            targetMovPath = m[1];
          }
        }
        if (!targetMovPath) targetMovPath = movMatches[0][1];
      }
      if (!targetMovPath) continue;

      const movUrl = `https://turkcealtyazi.org${targetMovPath.startsWith('/') ? '' : '/'}${targetMovPath}`;
      const movRes = await fetch(movUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': findUrl,
        },
        signal: AbortSignal.timeout(4500),
      });
      if (!movRes.ok) continue;
      const movHtml = decodeSubtitleText(Buffer.from(await movRes.arrayBuffer()));
      const subMatches = [...movHtml.matchAll(/href="(\/sub\/(\d+)\/[^"]+\.html)"/gi)];
      const seenSubIds = new Set();
      const mapped = [];
      for (const sm of subMatches) {
        const subId = sm[2];
        if (seenSubIds.has(subId)) continue;
        seenSubIds.add(subId);
        const ctx = movHtml.slice(Math.max(0, sm.index - 220), Math.min(movHtml.length, sm.index + 500));
        if (/flag-(?:en|gb|de|fr|es|it|ru)/i.test(ctx) && !/flag-tr/i.test(ctx)) continue;
        if (/\b(teaser|trailer|fragman|sample|preview)\b/i.test(ctx)) continue;
        const meta = parseSubtitleReleaseMeta(ctx, 0);
        mapped.push({
          id: `ta_${subId}`,
          fps: meta.fps,
          fpsHint: meta.fpsLabel,
          releaseTag: meta.releaseTag,
          score: meta.score + (/flag-tr/i.test(ctx) ? 10 : 0),
          lang: 'tr',
          kind: 'subtitles',
          playableUrl: `/api/subtitles/turkcealtyazi?id=${encodeURIComponent(subId)}&ref=${encodeURIComponent(movUrl)}`,
          external: true,
        });
        if (mapped.length >= 10) break;
      }
      if (mapped.length > 0) return mapped;
    } catch {}
  }
  return [];
}

async function searchTurkishSubtitles({ title = '', imdbId = '', year = '' } = {}) {
  const cleanTitle = cleanMovieTitleForSubtitleSearch(title);
  if (!cleanTitle && !imdbId) return [];
  const cacheKey = `${imdbId || ''}|${cleanTitle.toLowerCase()}|${year || ''}`;
  const cached = subtitleResultCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SUBTITLE_CACHE_TTL_MS) {
    return cached.items;
  }

  const withSoftCap = (promise, ms) => Promise.race([
    promise.catch(() => []),
    new Promise(resolve => setTimeout(() => resolve([]), ms)),
  ]);

  const [osRes, taRes] = await Promise.allSettled([
    withSoftCap(searchOpenSubtitlesStremio(imdbId, cleanTitle, year), 4500),
    withSoftCap(searchTurkceAltyaziOrg(cleanTitle, year), 4500),
  ]);

  const combined = [];
  if (osRes.status === 'fulfilled' && Array.isArray(osRes.value)) combined.push(...osRes.value);
  if (taRes.status === 'fulfilled' && Array.isArray(taRes.value)) combined.push(...taRes.value);

  combined.sort((a, b) => (b.score || 0) - (a.score || 0));

  const deduped = [];
  const seen = new Set();
  for (const item of combined) {
    if (!item?.playableUrl || seen.has(item.playableUrl)) continue;
    seen.add(item.playableUrl);
    const hints = [item.releaseTag, item.fpsHint].filter(Boolean);
    const suffix = hints.length > 0 ? ` (${hints.join(' • ')})` : '';
    deduped.push({
      id: item.id,
      label: `Hazır TR ${deduped.length + 1}${suffix}`,
      fps: item.fps || 0,
      lang: 'tr',
      kind: 'subtitles',
      playableUrl: item.playableUrl,
      external: true,
    });
    if (deduped.length >= 10) break;
  }

  if (deduped.length > 0) {
    subtitleResultCache.set(cacheKey, { ts: Date.now(), items: deduped });
  }
  return deduped;
}

// GET /api/subtitles/search?title=...&imdbId=...&year=...
router.get('/subtitles/search', resolverLimiter, async (req, res) => {
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
router.get('/subtitles/vtt', resolverLimiter, async (req, res) => {
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
    if (rawBuf.length >= 4 && rawBuf[0] === 0x50 && rawBuf[1] === 0x4b && rawBuf[2] === 0x03 && rawBuf[3] === 0x04) {
      const extracted = extractBestSubFromZipBuffer(rawBuf);
      if (!extracted) return res.status(404).json({ error: 'ZIP içerisinden geçerli altyazı çıkmadı.' });
      rawBuf = extracted;
    }
    const rawHead = rawBuf.subarray(0, 128).toString('utf8').trimStart().toLowerCase();
    if (rawHead.startsWith('<!doctype') || rawHead.startsWith('<html') || rawBuf.length < 30) {
      return res.status(404).json({ error: 'Geçerli altyazı içeriği alınamadı.' });
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

// GET /api/subtitles/turkcealtyazi?id=<subId>&ref=<movUrl>
router.get('/subtitles/turkcealtyazi', resolverLimiter, async (req, res) => {
  try {
    const subId = String(req.query?.id || '').trim();
    const refUrl = String(req.query?.ref || 'https://turkcealtyazi.org/').trim();
    if (!/^\d+$/.test(subId)) {
      return res.status(400).json({ error: 'Geçersiz altyazı ID.' });
    }
    const cacheKey = `ta:${subId}`;
    const cached = subtitleFileCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SUBTITLE_CACHE_TTL_MS) {
      res.set({
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=1800',
      });
      return res.status(200).send(cached.buf);
    }

    const form = new URLSearchParams({ idid: subId, altid: subId, submit: 'Altyazıyı İndir' });
    const dlRes = await fetch('https://turkcealtyazi.org/ind', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': refUrl.startsWith('https://turkcealtyazi.org') ? refUrl : 'https://turkcealtyazi.org/',
        'Origin': 'https://turkcealtyazi.org',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(9000),
    });
    if (!dlRes.ok) {
      return res.status(dlRes.status).json({ error: 'TurkceAltyazi indirilemedi.' });
    }
    let rawBuf = Buffer.from(await dlRes.arrayBuffer());
    if (rawBuf.length >= 4 && rawBuf[0] === 0x50 && rawBuf[1] === 0x4b && rawBuf[2] === 0x03 && rawBuf[3] === 0x04) {
      const extracted = extractBestSubFromZipBuffer(rawBuf);
      if (!extracted) return res.status(404).json({ error: 'ZIP içerisinden geçerli altyazı çıkmadı.' });
      rawBuf = extracted;
    }
    const rawHead = rawBuf.subarray(0, 128).toString('utf8').trimStart().toLowerCase();
    if (rawHead.startsWith('<!doctype') || rawHead.startsWith('<html') || rawBuf.length < 30) {
      return res.status(404).json({ error: 'Geçerli altyazı içeriği alınamadı.' });
    }
    const vttBuf = convertSrtBufferToVtt(rawBuf);
    subtitleFileCache.set(cacheKey, { ts: Date.now(), buf: vttBuf });
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

export default router;
