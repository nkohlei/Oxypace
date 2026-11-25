import express from 'express';
import crypto from 'crypto';
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

// Binary image fetch via Python curl_cffi Chrome 124 TLS + Tor (bypasses Cloudflare 444/403 on poster CDNs)
function fetchBinaryWithTlsImpersonator(url, referer = '', timeoutMs = 11000) {
  if (!validateSsrfUrl(url).safe) return Promise.resolve(null);
  return new Promise((resolve) => {
    const pyBin = resolveTlsPythonBin();
    if (!pyBin) return resolve(null);
    const scriptPath = path.join(__dirname, '../stream-resolver/services/tlsFetcher.py');
    const child = spawn(pyBin, [scriptPath, url, referer || '', '--binary']);
    const chunks = [];
    let settled = false;
    const finish = (val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(val);
    };
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      finish(null);
    }, timeoutMs);
    child.stdout.on('data', (c) => chunks.push(c));
    child.on('error', () => finish(null));
    child.on('close', (code) => {
      if (code === 0 && chunks.length > 0) {
        const buf = Buffer.concat(chunks);
        finish(isValidImageBuffer(buf) ? buf : null);
      } else {
        finish(null);
      }
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

function isValidImageBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 250) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WebP: RIFF....WEBP
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return true;
  // AVIF / HEIF ISO BMFF: ....ftyp
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') return true;
  return false;
}

function detectImageMime(buf, fallbackUrl = '') {
  if (Buffer.isBuffer(buf) && buf.length >= 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
    if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    if (buf.subarray(4, 8).toString('ascii') === 'ftyp') return 'image/avif';
  }
  const lower = String(fallbackUrl || '').toLowerCase().split('?')[0];
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.avif')) return 'image/avif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/webp';
}

// Direct curl fetch for binary data (images/posters/subtitles) with Tor & proxy fallback
async function fetchBinaryWithCurl(url, referer = '', timeoutSec = 8, expectImage = false) {
  if (!validateSsrfUrl(url).safe) return null;
  const runCurl = ({ useTor = false, proxyUrl = '' } = {}) => new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '--max-time', String(useTor ? timeoutSec + 2 : timeoutSec),
      '--proto', '=http,https',
      '--proto-redir', '=http,https',
      '--max-redirs', '5',
      '--max-filesize', String(25 * 1024 * 1024),
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ];
    if (expectImage) args.push('-f');
    if (proxyUrl) args.push('-x', proxyUrl);
    else if (useTor) args.push('--socks5-hostname', '127.0.0.1:9050');
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

  const isAcceptable = (buf) => {
    if (!buf || buf.length < 10) return false;
    if (expectImage) return isValidImageBuffer(buf);
    return !isBlockedOrChallenge(buf.toString('utf8', 0, 500));
  };

  const envProxy = buildEnvProxyUrl();
  if (envProxy) {
    try {
      const pBuf = await runCurl({ proxyUrl: envProxy });
      if (isAcceptable(pBuf)) return pBuf;
    } catch {}
  }

  // Known HTTP 444 + Cloudflare-403 CDN on Linux OCI -> go straight to Chrome TLS impersonator over Tor
  const skipPlainCurlOnLinux = process.platform === 'linux' && url.includes('img.fullhdfilmizlesene.now');
  if (!skipPlainCurlOnLinux) {
    try {
      const directBuf = await runCurl({ useTor: false });
      if (isAcceptable(directBuf)) return directBuf;
    } catch {}

    if (await isTorReachable()) {
      try {
        const torBuf = await runCurl({ useTor: true });
        if (isAcceptable(torBuf)) return torBuf;
      } catch {}
    }
  }

  if (expectImage) {
    const tlsBuf = await fetchBinaryWithTlsImpersonator(url, referer, Math.max(10000, timeoutSec * 1000));
    if (isValidImageBuffer(tlsBuf)) return tlsBuf;
  }

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

// ── Watch Party Opaque Vault (AES-256-GCM, stateless across PM2 workers) ───
const WP_VAULT_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.JWT_SECRET || process.env.SESSION_SECRET || 'oxypace-wp-vault-secret-v1'))
  .digest();

const PROVIDER_LEAK_REGEX = /\b(hdfilmcehennemi|fullhdfilmizlesene|filmmakinesi|filmdozu|nadirfilm|kultfilmler|webteizle|playmix|rapidvid|rapidrame|closeload|vidmoly|vidsrc|stellarconductornexus)\b/gi;

function sanitizePublicTitle(rawTitle = '') {
  let t = decodeHtmlEntities(String(rawTitle || ''))
    .replace(/\b(hdfilmcehennemi|fullhdfilmizlesene|filmmakinesi|filmdozu|nadirfilm|kultfilmler|webteizle)\b(?:\.[a-z.]{2,8})?/gi, ' ')
    .replace(/\b(full\s*hd\s*izle|hd\s*film\s*izle|tek\s*par[çc]a\s*izle|donmadan\s*izle|canl[ıi]\s*izle)\b/gi, ' ')
    .replace(/\s+\bizle$/i, '')
    .replace(/\s+[|•–—-]\s*$/g, '')
    .replace(/^\s*[|•–—-]\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t || 'Film Akışı';
}

function sanitizePublicError(msg = '') {
  const s = String(msg || '').trim();
  if (!s || PROVIDER_LEAK_REGEX.test(s) || /https?:\/\/[^\s]+/i.test(s)) {
    return 'Bu kaynaktan şu anda video akışı alınamadı. Lütfen alternatif bir kaynağı deneyin.';
  }
  return s;
}

function sealWpToken(payloadObj, ttlSec = 21600) {
  try {
    const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSec);
    const jsonBuf = Buffer.from(JSON.stringify({ ...payloadObj, e: exp }), 'utf8');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', WP_VAULT_KEY, iv);
    const enc = Buffer.concat([cipher.update(jsonBuf), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64url');
  } catch {
    return '';
  }
}

function openWpToken(rawToken = '') {
  try {
    const clean = String(rawToken || '').trim().replace(/\.(?:m3u8|mp4|vtt|srt|ts|webp|jpg|png)$/i, '');
    if (!clean || clean.length < 32) return null;
    const raw = Buffer.from(clean, 'base64url');
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', WP_VAULT_KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(dec);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.e === 'number' && parsed.e < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

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

function sendMaybeGzip(req, res, statusCode, headersObj, buf, allowGzip = false) {
  let outBuf = buf;
  const outHeaders = { ...headersObj };
  if (allowGzip && Buffer.isBuffer(buf) && buf.length > 2048 && /\bgzip\b/i.test(req.headers['accept-encoding'] || '')) {
    try {
      outBuf = zlib.gzipSync(buf, { level: 4 });
      outHeaders['Content-Encoding'] = 'gzip';
      outHeaders['Vary'] = 'Accept-Encoding';
    } catch {
      outBuf = buf;
    }
  }
  outHeaders['Content-Length'] = String(outBuf.length);
  res.set(outHeaders);
  return res.status(statusCode).send(outBuf);
}

// Shared media proxy core (used by both /api/proxy and opaque /api/wp-stream + /api/wp-seg)
async function serveProxiedMedia(req, res, { targetUrl, referer = '', origin = '', opaqueMode = false, forceImage = false, disableImageMode = false, fallbackImages = [], fallbackTitle = '' }) {
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  const ssrfCheck = validateSsrfUrl(targetUrl);
  if (!ssrfCheck.safe) {
    console.warn(`[SSRF Block] proxy rejected: ${targetUrl} — ${ssrfCheck.reason}`);
    return res.status(400).json({ error: 'Invalid or disallowed target URL' });
  }

  const proxyBaseOrigin = getProxyBaseOrigin(req);
  const canUseRamCache = !req.headers.range;
  const cacheKey = canUseRamCache ? `${proxyBaseOrigin}|${opaqueMode ? 'op' : 'std'}|${targetUrl}|${referer || ''}|${origin || ''}` : '';

  if (canUseRamCache) {
    const cached = getCachedProxyEntry(cacheKey);
    if (cached) {
      const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin);
      const hitHeaders = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': cached.contentType,
        'Cache-Control': cached.cacheControl,
        'X-Proxy-Cache': 'HIT',
      };
      if (allowedCorsOrigin) hitHeaders['Access-Control-Allow-Origin'] = allowedCorsOrigin;
      const isCachedPlaylist = cached.contentType === 'application/x-mpegURL' || cached.contentType.includes('mpegurl');
      return sendMaybeGzip(req, res, 200, hitHeaders, cached.buffer, isCachedPlaylist);
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
            'X-Proxy-Cache': 'COALESCE',
          };
          if (allowedCorsOrigin) sharedHeaders['Access-Control-Allow-Origin'] = allowedCorsOrigin;
          const isSharedPlaylist = shared.contentType === 'application/x-mpegURL' || shared.contentType.includes('mpegurl');
          return sendMaybeGzip(req, res, 200, sharedHeaders, shared.buffer, isSharedPlaylist);
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
        } else if (targetObj.hostname.includes('vmpx') || targetObj.hostname.includes('vidmoly')) {
          originHeader = 'https://vidmoly.net';
          refererHeader = 'https://vidmoly.net/';
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
      'Accept': forceImage ? 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' : '*/*',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    };
    if (refererHeader) headers['Referer'] = refererHeader;
    if (originHeader) headers['Origin'] = originHeader;

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const lowerUrl = targetUrl.toLowerCase();
    const isPosterOrImage =
      !disableImageMode &&
      (Boolean(forceImage) ||
        lowerUrl.includes('/images/thumb/poster/') ||
        lowerUrl.includes('/poster/') ||
        lowerUrl.includes('/assets/img/') ||
        lowerUrl.includes('/wp-content/uploads/'));

    const isSubtitleFile =
      !forceImage &&
      (lowerUrl.endsWith('.vtt') ||
        lowerUrl.endsWith('.srt') ||
        lowerUrl.includes('/vtt/') ||
        lowerUrl.includes('/subtitles/'));

    const inferPosterReferer = (u, defaultRef = '') => {
      if (defaultRef) return defaultRef;
      if (u.includes('fullhdfilmizlesene')) return 'https://www.fullhdfilmizlesene.now/';
      return '';
    };

    let response = null;
    try {
      const skipDirectImgFetch = isPosterOrImage && process.platform === 'linux' && targetUrl.includes('img.fullhdfilmizlesene.now');
      if (skipDirectImgFetch) {
        response = { ok: false, status: 444 };
      } else {
        response = await safeFetch(targetUrl, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(isPosterOrImage ? 6000 : 30000),
        });
      }
    } catch {
      response = { ok: false, status: 502 };
    }

    // Bulletproof cover poster pipeline: direct -> Tor/curl -> fallbackImages -> ScraperAPI
    if (isPosterOrImage) {
      let validImgBuf = null;
      if (response && response.ok) {
        try {
          const directBuf = Buffer.from(await response.arrayBuffer());
          if (isValidImageBuffer(directBuf)) validImgBuf = directBuf;
        } catch {}
      }

      if (!validImgBuf) {
        const posterRef = inferPosterReferer(targetUrl, refererHeader);
        validImgBuf = await fetchBinaryWithCurl(targetUrl, posterRef, 8, true);
      }

      if (!validImgBuf && Array.isArray(fallbackImages) && fallbackImages.length > 0) {
        for (const fb of fallbackImages) {
          const fbUrl = typeof fb === 'string' ? fb : fb?.u;
          const fbRef = inferPosterReferer(fbUrl || '', typeof fb === 'object' ? (fb?.r || '') : '');
          if (!fbUrl || !validateSsrfUrl(fbUrl).safe) continue;
          try {
            const skipDirectFb = process.platform === 'linux' && fbUrl.includes('img.fullhdfilmizlesene.now');
            if (!skipDirectFb) {
              const fbHdrs = {
                'User-Agent': headers['User-Agent'],
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              };
              if (fbRef) fbHdrs['Referer'] = fbRef;
              const fbRes = await safeFetch(fbUrl, {
                headers: fbHdrs,
                cache: 'no-store',
                signal: AbortSignal.timeout(4500),
              });
              if (fbRes.ok) {
                const fbBuf = Buffer.from(await fbRes.arrayBuffer());
                if (isValidImageBuffer(fbBuf)) {
                  validImgBuf = fbBuf;
                  break;
                }
              }
            }
          } catch {}
          const fbCurlBuf = await fetchBinaryWithCurl(fbUrl, fbRef, 6, true);
          if (isValidImageBuffer(fbCurlBuf)) {
            validImgBuf = fbCurlBuf;
            break;
          }
        }
      }

      if (!validImgBuf && fallbackTitle) {
        try {
          const fallbackMetas = await fetchCinemetaCatalog(fallbackTitle);
          for (const meta of fallbackMetas.slice(0, 2)) {
            if (!meta?.poster || !validateSsrfUrl(meta.poster).safe) continue;
            const cRes = await safeFetch(meta.poster, {
              headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'image/*,*/*;q=0.8' },
              cache: 'no-store',
              signal: AbortSignal.timeout(3500),
            }).catch(() => null);
            if (cRes && cRes.ok) {
              const cBuf = Buffer.from(await cRes.arrayBuffer());
              if (isValidImageBuffer(cBuf)) {
                validImgBuf = cBuf;
                break;
              }
            }
          }
        } catch {}
      }

      if (!validImgBuf) {
        const apiKey = getValidScraperApiKey();
        if (apiKey) {
          try {
            const sApiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
            const sRes = await fetch(sApiUrl, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
            if (sRes.ok) {
              const sBuf = Buffer.from(await sRes.arrayBuffer());
              if (isValidImageBuffer(sBuf)) validImgBuf = sBuf;
            } else if (sRes.status === 401 || sRes.status === 403) {
              exhaustedScraperKeys.add(apiKey);
            }
          } catch {}
        }
      }

      if (validImgBuf) {
        const mime = detectImageMime(validImgBuf, targetUrl);
        const cacheEntry = {
          buffer: validImgBuf,
          contentType: mime,
          cacheControl: 'public, max-age=86400',
        };
        if (canUseRamCache && cacheKey) {
          setCachedProxyEntry(cacheKey, cacheEntry, 24 * 60 * 60 * 1000);
        }
        const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin) || '*';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', allowedCorsOrigin);
        res.setHeader('Content-Length', String(validImgBuf.length));
        finishInflight(cacheEntry);
        return res.status(200).end(validImgBuf);
      }

      const TRANSPARENT_1PX_WEBP = Buffer.from('UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v3V84AAA', 'base64');
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.setHeader('Access-Control-Allow-Origin', '*');
      finishInflight(null);
      return res.status(200).end(TRANSPARENT_1PX_WEBP);
    }

    if (!response.ok && (response.status === 403 || response.status === 404)) {
      if (isSubtitleFile) {
        try {
          const posterReferer = inferPosterReferer(targetUrl, refererHeader);
          const buf = await fetchBinaryWithCurl(targetUrl, posterReferer, 8, false);
          if (buf && buf.length > 10) {
            res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            finishInflight(null);
            return res.end(buf);
          }
          try {
            const tlsText = await fetchWithTlsImpersonator(targetUrl, posterReferer);
            if (tlsText && tlsText.length > 10 && !isBlockedOrChallenge(tlsText)) {
              res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              finishInflight(null);
              return res.end(tlsText);
            }
          } catch {}
        } catch {
          const apiKey = getValidScraperApiKey();
          if (apiKey) {
            try {
              const sApiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
              const sRes = await fetch(sApiUrl, { cache: 'no-store' });
              if (sRes.ok) {
                response = sRes;
              } else if (sRes.status === 401 || sRes.status === 403) {
                exhaustedScraperKeys.add(apiKey);
              }
            } catch {}
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
          'https://vidmoly.net/',
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

    if (!response.ok) {
      const isMediaChunk =
        lowerUrl.includes('.ts') ||
        lowerUrl.includes('.m4s') ||
        lowerUrl.endsWith('.mp4') ||
        lowerUrl.includes('.aac') ||
        lowerUrl.includes('/segment') ||
        lowerUrl.includes('/fragment');

      if (!opaqueMode && isMediaChunk && (response.status === 403 || response.status === 401)) {
        console.warn(`[HLSProxy] Upstream ${response.status} for media chunk ${targetUrl}. Redirecting client directly via 302...`);
        const allowedCorsOrigin = resolveProxyCorsOrigin(req.headers.origin) || '*';
        res.writeHead(302, {
          'Location': targetUrl,
          'Access-Control-Allow-Origin': allowedCorsOrigin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Expose-Headers': 'Location',
          'Cache-Control': 'no-cache',
        });
        finishInflight(null);
        return res.end();
      }

      finishInflight(null);
      return res.status(response.status).json({
        error: `Hedef sunucu hata döndürdü: ${response.status}`,
      });
    }

    {
      const upstreamType = response.headers.get('Content-Type') || '';
      const declaredLength = Number(response.headers.get('Content-Length')) || 0;
      const looksLikePlaylist =
        lowerUrl.includes('.m3u8') ||
        lowerUrl.includes('.txt') ||
        upstreamType.includes('mpegurl') ||
        upstreamType.includes('m3u8');
      const STREAM_THRESHOLD_BYTES = 512 * 1024;
      if (!looksLikePlaylist && !isPosterOrImage && !isSubtitleFile && response.body && (declaredLength === 0 || declaredLength > STREAM_THRESHOLD_BYTES)) {
        let streamContentType = upstreamType || 'application/octet-stream';
        if (disableImageMode && (streamContentType.startsWith('image/') || streamContentType.startsWith('text/'))) {
          streamContentType = 'video/mp2t';
        }
        const streamHeaders = {
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': streamContentType,
          'Accept-Ranges': response.headers.get('Accept-Ranges') || 'bytes',
          'Cache-Control': 'public, max-age=86400, immutable',
        };
        if (declaredLength > 0) streamHeaders['Content-Length'] = String(declaredLength);
        if (response.headers.get('Content-Range')) streamHeaders['Content-Range'] = response.headers.get('Content-Range');
        const streamCors = resolveProxyCorsOrigin(req.headers.origin);
        if (streamCors) streamHeaders['Access-Control-Allow-Origin'] = streamCors;
        res.writeHead(response.status === 206 ? 206 : 200, streamHeaders);
        const nodeStream = Readable.fromWeb(response.body);
        const teardown = () => { try { nodeStream.destroy(); } catch { /* ignore */ } };
        res.on('close', teardown);
        nodeStream.on('error', () => { try { res.destroy(); } catch { /* ignore */ } });
        finishInflight(null);
        nodeStream.pipe(res);
        return;
      }
    }

    let responseBody = await response.arrayBuffer();
    let contentType = response.headers.get('Content-Type') || 'application/x-mpegURL';

    const sampleHeader = new TextDecoder('utf-8').decode(responseBody.slice(0, 15));
    const isPlaylist =
      sampleHeader.includes('#EXTM3U') ||
      lowerUrl.includes('.m3u8') ||
      lowerUrl.includes('.txt') ||
      lowerUrl.includes('master.txt') ||
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8');

    const buildProxiedTarget = (absUrl, isSubManifest = false) => {
      if (opaqueMode) {
        const tokenPayload = { u: absUrl };
        if (refererHeader) tokenPayload.r = refererHeader;
        if (originHeader) tokenPayload.o = originHeader;
        const tok = sealWpToken(tokenPayload, 21600);
        return isSubManifest
          ? `/api/wp-stream/${tok}.m3u8`
          : `/api/wp-seg/${tok}`;
      }
      let proxied = `${proxyBaseOrigin}/api/proxy?url=${encodeURIComponent(absUrl)}`;
      if (refererHeader) proxied += `&referer=${encodeURIComponent(refererHeader)}`;
      if (originHeader) proxied += `&origin=${encodeURIComponent(originHeader)}`;
      return proxied;
    };

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

      const isNoSearchInheritHost = /mycdn|okcdn|ok\.ru|vkuser/i.test(baseUrlObj.hostname);
      const lines = manifestText.split('\n');
      let prevLineWasStreamInf = false;
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#')) {
          const isStreamInf = trimmed.startsWith('#EXT-X-STREAM-INF');
          let outLine = line;
          if (trimmed.includes('URI="')) {
            const isKeyOrMap = trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP');
            outLine = line.replace(/URI="([^"]+)"/g, (_, p1) => {
              try {
                let absUrl = new URL(p1, finalBaseUrl).href;
                if (
                  !isNoSearchInheritHost &&
                  !p1.startsWith('http') &&
                  !p1.startsWith('/') &&
                  !p1.includes('?') &&
                  baseUrlObj.search &&
                  !absUrl.includes('?')
                ) {
                  absUrl += baseUrlObj.search;
                }
                const lowerAbs = absUrl.toLowerCase();
                const subPl =
                  !isKeyOrMap &&
                  (trimmed.startsWith('#EXT-X-MEDIA') ||
                    lowerAbs.includes('.m3u8') ||
                    lowerAbs.includes('.txt') ||
                    lowerAbs.includes('manifest'));
                return `URI="${buildProxiedTarget(absUrl, subPl)}"`;
              } catch {
                return `URI="${p1}"`;
              }
            });
          }
          prevLineWasStreamInf = isStreamInf;
          return outLine;
        }

        const forceSubManifest = prevLineWasStreamInf;
        prevLineWasStreamInf = false;

        try {
          let absUrl = new URL(trimmed, finalBaseUrl).href;
          if (
            !isNoSearchInheritHost &&
            !trimmed.startsWith('http') &&
            !trimmed.startsWith('/') &&
            !trimmed.includes('?') &&
            baseUrlObj.search &&
            !absUrl.includes('?')
          ) {
            absUrl += baseUrlObj.search;
          }

          if (!opaqueMode && shouldKeepDirectMediaUrl(absUrl)) {
            return absUrl;
          }

          const lowerAbs = absUrl.toLowerCase();
          const subPl =
            forceSubManifest ||
            lowerAbs.includes('.m3u8') ||
            lowerAbs.includes('.txt') ||
            lowerAbs.includes('manifest');
          return buildProxiedTarget(absUrl, subPl);
        } catch {
          return line;
        }
      });

      manifestText = rewrittenLines.join('\n');
      const textEncoder = new TextEncoder();
      responseBody = textEncoder.encode(manifestText).buffer;
    } else {
      const firstBytes = new Uint8Array(responseBody.slice(0, 4));
      if (isPosterOrImage) {
        if (lowerUrl.endsWith('.webp')) contentType = 'image/webp';
        else if (lowerUrl.endsWith('.avif')) contentType = 'image/avif';
        else if (lowerUrl.endsWith('.png')) contentType = 'image/png';
        else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (!contentType.startsWith('image/')) contentType = 'image/jpeg';
      } else if (firstBytes[0] === 0x47) {
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

    if (canUseRamCache && cacheKey && response.status === 200 && finalBuf.length <= MAX_CACHEABLE_SEGMENT_BYTES) {
      const cacheEntry = {
        buffer: finalBuf,
        contentType,
        cacheControl: resHeaders['Cache-Control'] || 'public, max-age=60',
      };
      const isVodPlaylist = isPlaylist && sampleHeader.includes('#EXTM3U');
      const isFinishedVod = isVodPlaylist && finalBuf.includes('#EXT-X-ENDLIST');
      const ttlMs = isPlaylist ? (isFinishedVod ? 300_000 : (isVodPlaylist ? 30_000 : 4_000)) : 60_000;
      setCachedProxyEntry(cacheKey, cacheEntry, ttlMs);
      finishInflight(cacheEntry);
    } else {
      finishInflight(null);
    }

    return sendMaybeGzip(req, res, response.status === 206 ? 206 : 200, resHeaders, finalBuf, isPlaylist);
  } catch (error) {
    finishInflight(null);
    if (error && typeof error.message === 'string' && error.message.startsWith('SSRF_BLOCKED')) {
      console.warn(`[SSRF Block] proxy redirect/DNS rejected: ${error.message}`);
      return res.status(400).json({ error: 'Invalid or disallowed target URL' });
    }
    if (res.headersSent) {
      try { res.destroy(); } catch { /* ignore */ }
      return;
    }
    return res.status(500).json({
      error: opaqueMode ? 'Akış verisi alınamadı.' : (error.message || 'An error occurred while proxying request'),
    });
  } finally {
    finishInflight(null);
  }
}

// GET /api/proxy and /api/proxy-hls
router.get(['/proxy', '/proxy-hls'], proxyLimiter, async (req, res) => {
  return serveProxiedMedia(req, res, {
    targetUrl: req.query.url,
    referer: req.query.referer || '',
    origin: req.query.origin || '',
    opaqueMode: false,
  });
});

// Opaque encrypted poster proxy — zero external domains exposed to client/DOM/Network
router.get('/wp-asset/:token', proxyLimiter, async (req, res) => {
  const payload = openWpToken(req.params.token);
  if (!payload || !payload.u) {
    const TRANSPARENT_1PX_WEBP = Buffer.from('UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v3V84AAA', 'base64');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).end(TRANSPARENT_1PX_WEBP);
  }
  return serveProxiedMedia(req, res, {
    targetUrl: payload.u,
    referer: payload.r || '',
    origin: payload.o || '',
    opaqueMode: true,
    forceImage: true,
    disableImageMode: false,
    fallbackImages: Array.isArray(payload.alts) ? payload.alts : [],
    fallbackTitle: payload.t || '',
  });
});

// Opaque encrypted stream, segment, and subtitle proxy routes — zero external domains in Network tab
router.get(['/wp-stream/:token', '/wp-seg/:token'], proxyLimiter, async (req, res) => {
  const payload = openWpToken(req.params.token);
  if (!payload || !payload.u) {
    return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş yayın belirteci.' });
  }
  return serveProxiedMedia(req, res, {
    targetUrl: payload.u,
    referer: payload.r || '',
    origin: payload.o || '',
    opaqueMode: true,
    disableImageMode: true,
  });
});

router.get('/wp-sub/:token', proxyLimiter, async (req, res) => {
  const payload = openWpToken(req.params.token);
  if (!payload || !payload.u) {
    return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş altyazı belirteci.' });
  }
  return serveProxiedMedia(req, res, {
    targetUrl: payload.u,
    referer: payload.r || '',
    origin: payload.o || '',
    opaqueMode: true,
    disableImageMode: true,
  });
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

const movieResolveCache = new Map();
const prewarmInFlight = new Set();
const MOVIE_RESOLVE_CACHE_TTL = 15 * 60 * 1000;

function extractEmbedUrlsFromHtml(html, baseUrl = '') {
  const urls = [];
  const seen = new Set();
  if (!html || typeof html !== 'string') return urls;
  const cleanedHtml = html.replace(/\\"/g, '"').replace(/\\\//g, '/');

  const pushUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    let u = decodeHtmlEntities(raw.trim());
    if (u.startsWith('//')) u = 'https:' + u;
    if (!u.startsWith('http') && baseUrl) {
      try { u = new URL(u, baseUrl).href; } catch { return; }
    }
    if (!u.startsWith('http')) return;
    const lower = u.toLowerCase();
    if (
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('google') ||
      lower.includes('doubleclick') ||
      lower.includes('facebook') ||
      lower.includes('schema.org') ||
      /\.(?:jpg|jpeg|png|webp|gif|svg|css|js|ico|woff2?)(\?|$)/i.test(lower)
    ) return;
    if (!seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  };

  for (const [, u] of cleanedHtml.matchAll(/<iframe\b[^>]*\b(?:data-src|src|data-nfp-src)=["']([^"']+)["']/gi)) {
    pushUrl(u);
  }
  for (const [, u] of cleanedHtml.matchAll(/data-(?:src|video|url|embed|frame)=["']([^"']+)["']/gi)) {
    pushUrl(u);
  }
  for (const [, u] of cleanedHtml.matchAll(/["'](https?:\/\/[^"'\s<>\\]+(?:vidmoly|ok\.ru\/videoembed|sibnet|closeload|rapidvid|playmix|filemoon|dood|voe|vk\.com\/video_ext)[^"'\s<>\\]*)["']/gi)) {
    pushUrl(u);
  }

  // Prioritize fastest, reliably playable embeds first (vidmoly > ok.ru > others)
  const scoreEmbed = (u) => {
    const l = u.toLowerCase();
    if (l.includes('vidmoly')) return 100;
    if (l.includes('ok.ru')) return 90;
    if (l.includes('playmix')) return 85;
    if (l.includes('rapidvid')) return 80;
    if (l.includes('closeload')) return 75;
    if (l.includes('sibnet')) return 60;
    return 10;
  };
  urls.sort((a, b) => scoreEmbed(b) - scoreEmbed(a));
  return urls;
}

async function fastHttpFetchText(targetUrl, headers = {}, timeoutMs = 6000) {
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        ...headers,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      const txt = await res.text();
      if (txt && !isBlockedOrChallenge(txt)) return txt;
    }
  } catch {}
  return '';
}

async function resolveEmbedUrl(embedUrl, pageReferer = '', pageTitle = '') {
  if (!embedUrl || typeof embedUrl !== 'string') return null;
  const lower = embedUrl.toLowerCase();

  // 1. Vidmoly embed -> direct HLS master.m3u8 (verified ~200-350ms on OCI)
  if (lower.includes('vidmoly')) {
    const ref = pageReferer || 'https://vidmoly.net/';
    let html = await fastHttpFetchText(embedUrl, { Referer: ref }, 6000);
    if (!html) {
      html = await fetchWithCurl(embedUrl, [`Referer: ${ref}`], 5);
    }
    if (html) {
      const m3u8Match =
        html.match(/file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i) ||
        html.match(/(https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*)/i);
      if (m3u8Match && m3u8Match[1]) {
        const streamUrl = m3u8Match[1].replace(/\\\//g, '/');
        const subtitles = [];
        for (const [, subFile, subLabel] of html.matchAll(/file\s*:\s*["'](https?:\/\/[^"']+\.vtt[^"']*)["'][^}]*?(?:label\s*:\s*["']([^"']*)["'])?/gi)) {
          const cleanSub = subFile.replace(/\\\//g, '/');
          if (!subtitles.some(s => s.file === cleanSub)) {
            subtitles.push({ file: cleanSub, label: subLabel || detectSubLanguage(cleanSub) });
          }
        }
        return {
          streamUrl,
          type: 'm3u8',
          headers: { referer: 'https://vidmoly.net/', origin: 'https://vidmoly.net' },
          pageTitle: sanitizePublicTitle(pageTitle),
          subtitles,
        };
      }
    }
  }

  // 2. OK.ru videoembed -> HLS or MP4 via data-options metadata JSON
  if (lower.includes('ok.ru/videoembed') || lower.includes('ok.ru/video/')) {
    const targetOk = lower.includes('ok.ru/video/')
      ? `https://ok.ru/videoembed/${(embedUrl.split('/video/')[1] || '').split(/[/?#]/)[0]}`
      : embedUrl;
    const ref = pageReferer || 'https://ok.ru/';
    let html = await fastHttpFetchText(targetOk, { Referer: ref }, 6000);
    if (!html) {
      html = await fetchWithCurl(targetOk, [`Referer: ${ref}`], 5);
    }
    if (html) {
      const dataOptMatch = html.match(/data-options="([^"]+)"/i);
      if (dataOptMatch && dataOptMatch[1]) {
        try {
          const optJson = JSON.parse(decodeHtmlEntities(dataOptMatch[1]));
          const metaStr = optJson?.flashvars?.metadata;
          const meta = typeof metaStr === 'string' ? JSON.parse(metaStr) : metaStr;
          if (meta) {
            if (meta.hlsManifestUrl && String(meta.hlsManifestUrl).startsWith('http')) {
              return {
                streamUrl: meta.hlsManifestUrl,
                type: 'm3u8',
                headers: { referer: 'https://ok.ru/', origin: 'https://ok.ru' },
                pageTitle: sanitizePublicTitle(pageTitle || meta.movie?.title || ''),
                subtitles: [],
              };
            }
            if (Array.isArray(meta.videos) && meta.videos.length > 0) {
              const sortedVids = [...meta.videos].sort((a, b) => (parseInt(b.name, 10) || 0) - (parseInt(a.name, 10) || 0));
              const best = sortedVids.find(v => v.url && v.url.startsWith('http'));
              if (best) {
                return {
                  streamUrl: best.url,
                  type: 'mp4',
                  headers: { referer: 'https://ok.ru/', origin: 'https://ok.ru' },
                  pageTitle: sanitizePublicTitle(pageTitle || meta.movie?.title || ''),
                  subtitles: [],
                };
              }
            }
          }
        } catch {}
      }
      const hlsFallback = html.match(/hlsManifestUrl\\?":\\?"(https?:[^"\\]+)\\?"/i);
      if (hlsFallback && hlsFallback[1]) {
        const cleanStream = hlsFallback[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        return {
          streamUrl: cleanStream,
          type: 'm3u8',
          headers: { referer: 'https://ok.ru/', origin: 'https://ok.ru' },
          pageTitle: sanitizePublicTitle(pageTitle),
          subtitles: [],
        };
      }
    }
  }

  // 3. Fallback to fastResolve for Playmix, RapidVid, Closeload, etc.
  if (fastResolve) {
    try {
      const fr = await fastResolve(embedUrl, { timeout: 6000 });
      if (fr && fr.streamUrl && !fr.streamUrl.includes('filmakinesimp4') && !fr.streamUrl.includes('blank.mp4')) {
        return {
          ...fr,
          pageTitle: sanitizePublicTitle(pageTitle || fr.pageTitle),
        };
      }
    } catch {}
  }

  return null;
}

function raceFirstSuccess(promises, timeoutMs = 13000) {
  return new Promise((resolve) => {
    if (!promises || promises.length === 0) return resolve(null);
    let settledCount = 0;
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(val);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    for (const p of promises) {
      Promise.resolve(p)
        .then((res) => {
          if (res && res.streamUrl && !res.blocked && !res.isTakedown) {
            finish(res);
          } else {
            settledCount++;
            if (settledCount >= promises.length) finish(null);
          }
        })
        .catch(() => {
          settledCount++;
          if (settledCount >= promises.length) finish(null);
        });
    }
  });
}

async function resolveSingleSource(rawUrl, providerKey = '', timeoutMs = 12000, embedMode = false, pageReferer = '') {
  if (!rawUrl || !validateSsrfUrl(rawUrl).safe) return null;
  const cacheHit = movieResolveCache.get(rawUrl);
  if (cacheHit && Date.now() - cacheHit.ts < MOVIE_RESOLVE_CACHE_TTL) {
    return cacheHit.result;
  }

  const lower = rawUrl.toLowerCase();
  let result = null;

  if (embedMode || lower.includes('vidmoly') || lower.includes('ok.ru')) {
    result = await resolveEmbedUrl(rawUrl, pageReferer || '', '');
  } else if (fastResolve) {
    try {
      result = await fastResolve(rawUrl, { timeout: Math.min(timeoutMs, 10000) });
    } catch {}
  }

  // Fallback to microservice Playwright ONLY if not explicitly blocked / takedown
  if (!result && fastResolve && !embedMode) {
    try {
      result = await fastResolve(rawUrl, { timeout: Math.min(timeoutMs, 9000) });
    } catch {}
  }

  if (!result && !embedMode && !result?.blocked) {
    const resolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
    const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const microRes = await fetch(`${resolverUrl.replace(/\/+$/, '')}/api/resolve-stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: rawUrl, timeout: Math.min(timeoutMs, 12000) }),
        signal: AbortSignal.timeout(Math.min(timeoutMs + 1000, 13000)),
      });
      const data = await microRes.json().catch(() => null);
      const p = data?.data || data;
      if (microRes.ok && p?.streamUrl && !p.streamUrl.includes('filmakinesimp4') && !p.streamUrl.includes('blank.mp4')) {
        result = {
          streamUrl: p.streamUrl,
          type: p.type || (p.streamUrl.toLowerCase().includes('.mp4') ? 'mp4' : 'm3u8'),
          headers: p.headers || {},
          pageTitle: sanitizePublicTitle(p.pageTitle || ''),
          subtitles: Array.isArray(p.subtitles) ? p.subtitles : [],
        };
      }
    } catch {}
  }

  if (result && result.streamUrl) {
    if (!validateSsrfUrl(result.streamUrl).safe) {
      return null;
    }
    if (!result.blocked && !result.isTakedown) {
      movieResolveCache.set(rawUrl, { ts: Date.now(), result });
      if (movieResolveCache.size > 400) {
        const oldest = movieResolveCache.keys().next().value;
        if (oldest) movieResolveCache.delete(oldest);
      }
    }
  }
  return result;
}

function normalizeStreamDedupeKey(streamUrl = '') {
  try {
    const u = new URL(streamUrl);
    const idParam = u.searchParams.get('id') || u.searchParams.get('video_id') || '';
    return `${u.origin.toLowerCase()}${u.pathname}${idParam ? `?id=${idParam}` : ''}`;
  } catch {
    return String(streamUrl || '').split('?')[0];
  }
}

function buildOpaqueResolvedPayload(result, resolveBaseOrigin, displayTitle = '') {
  let streamHeaders = result.headers || {};
  const streamUrl = result.streamUrl;
  if (streamUrl.includes('playmix') && (!streamHeaders.referer || !streamHeaders.referer.includes('playmix.uno'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://playmix.uno/', origin: 'https://playmix.uno' };
  } else if (streamUrl.includes('imagecdn') && (!streamHeaders.referer || !streamHeaders.referer.includes('rapidvid.org'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://rapidvid.org/', origin: 'https://rapidvid.org' };
  } else if ((streamUrl.includes('cdnimages') || streamUrl.includes('shop') || streamUrl.includes('cyou')) && (!streamHeaders.referer || !streamHeaders.referer.includes('hdfilmcehennemi'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://hdfilmcehennemi.mobi/', origin: 'https://hdfilmcehennemi.mobi' };
  } else if ((streamUrl.includes('vmpx') || streamUrl.includes('vidmoly')) && (!streamHeaders.referer || !streamHeaders.referer.includes('vidmoly'))) {
    streamHeaders = { ...streamHeaders, referer: 'https://vidmoly.net/', origin: 'https://vidmoly.net' };
  }

  const isMp4 = (result.type === 'mp4') || streamUrl.toLowerCase().split('?')[0].endsWith('.mp4');
  const streamTok = sealWpToken({ u: streamUrl, r: streamHeaders.referer || '', o: streamHeaders.origin || '' }, 21600);
  const playableStreamUrl = `${resolveBaseOrigin}/api/wp-stream/${streamTok}.${isMp4 ? 'mp4' : 'm3u8'}`;

  const proxiedSubtitles = (result.subtitles || []).map(sub => {
    const subFile = sub.file;
    const subTok = sealWpToken({ u: subFile, r: streamHeaders.referer || '', o: streamHeaders.origin || '' }, 21600);
    return {
      label: sub.label || detectSubLanguage(subFile),
      kind: sub.kind || 'subtitles',
      playableUrl: `${resolveBaseOrigin}/api/wp-sub/${subTok}.vtt`,
    };
  });

  return {
    playableStreamUrl,
    type: isMp4 ? 'mp4' : 'm3u8',
    pageTitle: sanitizePublicTitle(displayTitle || result.pageTitle || ''),
    subtitles: proxiedSubtitles,
  };
}

// POST /api/resolve-movie — Parallel fastest-source racer + 100% pre-verified alternatives + opaque stream vault
router.post('/resolve-movie', resolverLimiter, (req, res, next) => (req.body ? next() : express.json()(req, res, next)), async (req, res) => {
  const { sources, sourceToken, title, timeout } = req.body || {};
  const resolveBaseOrigin = getProxyBaseOrigin(req);
  const startTime = Date.now();
  const maxTimeout = Math.min(parseInt(timeout, 10) || 14000, 18000);

  const withCap = (p, ms) => Promise.race([
    Promise.resolve(p).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

  try {
    // Mode 1: Explicit source selected by user (manual alternative switch — already pre-verified & cached)
    if (typeof sourceToken === 'string' && sourceToken.trim()) {
      const cleanTok = sourceToken.trim();
      const payload = openWpToken(cleanTok);
      if (!payload || !payload.u) {
        return res.status(400).json({ success: false, error: 'Geçersiz veya süresi dolmuş kaynak belirteci.' });
      }
      const result = await resolveSingleSource(payload.u, payload.p || '', maxTimeout, !!payload.embed, payload.r || '');
      if (!result || result.blocked || result.isTakedown || !result.streamUrl) {
        return res.status(404).json({
          success: false,
          error: result?.isTakedown
            ? 'Bu içerik telif nedeniyle yayından kaldırılmış. Alternatif bir kaynağı deneyin.'
            : 'Seçilen kaynaktan şu anda video akışı alınamadı. Lütfen diğer kaynağı deneyin.',
          code: 'STREAM_NOT_FOUND',
        });
      }
      const opaque = buildOpaqueResolvedPayload(result, resolveBaseOrigin, title);
      const passedTokens = Array.isArray(sources) && sources.length > 0 ? sources : [cleanTok];
      const seenRaw = new Set();
      const alternatives = [];
      for (const t of passedTokens) {
        if (typeof t !== 'string') continue;
        const p = openWpToken(t);
        if (!p || !p.u || seenRaw.has(p.u)) continue;
        seenRaw.add(p.u);
        const aType = (t === cleanTok && result.audioType && result.audioType !== 'unknown' && (!p.a || p.a === 'unknown'))
          ? result.audioType
          : (p.a || 'unknown');
        alternatives.push({ token: t, label: `Kaynak ${alternatives.length + 1}`, audioType: aType });
      }
      if (!alternatives.some((a) => a.token === cleanTok)) {
        alternatives.push({
          token: cleanTok,
          label: `Kaynak ${alternatives.length + 1}`,
          audioType: result.audioType || payload.a || 'unknown',
        });
      }
      const activeIdx = alternatives.findIndex((a) => a.token === cleanTok);
      return res.status(200).json({
        success: true,
        ...opaque,
        activeSourceToken: cleanTok,
        activeSourceIndex: activeIdx >= 0 ? activeIdx : 0,
        alternatives,
        resolvedIn: Date.now() - startTime,
      });
    }

    // Mode 2: Automatic fastest-source race + parallel verification of ALL sibling sources & extra embeds
    const tokenList = Array.isArray(sources) ? sources.filter(t => typeof t === 'string' && t.trim()) : [];
    const decodedList = tokenList
      .map((tok, idx) => ({ tok, idx, payload: openWpToken(tok) }))
      .filter(x => x.payload && x.payload.u);

    if (decodedList.length === 0) {
      return res.status(400).json({ success: false, error: 'Geçerli film kaynağı bulunamadı.' });
    }

    // Start resolving ALL candidate sources simultaneously at t=0
    const inflightJobs = decodedList.map((item) => ({
      item,
      promise: resolveSingleSource(item.payload.u, item.payload.p || '', maxTimeout, !!item.payload.embed, item.payload.r || '')
        .then((resObj) => (resObj && resObj.streamUrl && !resObj.blocked && !resObj.isTakedown)
          ? { ...resObj, _item: item }
          : null)
        .catch(() => null),
    }));

    const won = await raceFirstSuccess(inflightJobs.map((j) => j.promise), maxTimeout);
    if (!won || !won.streamUrl) {
      return res.status(404).json({
        success: false,
        error: 'Bu film için şu anda erişilebilir oynatma kaynağı bulunamadı. Alternatif kaynakları veya farklı bir sonucu deneyin.',
        code: 'STREAM_NOT_FOUND',
        resolvedIn: Date.now() - startTime,
      });
    }

    // Wait briefly ONLY if multiple sources raced; single-source resolves immediately with 0 wait
    const siblingResults = decodedList.length <= 1
      ? [won]
      : await Promise.all(inflightJobs.map((j) => withCap(j.promise, 2600)));

    // Collect extra embed candidates from resolved site pages (max 3 fast embeds)
    const embedCandidates = [];
    const seenRawUrls = new Set(decodedList.map((d) => d.payload.u));
    for (const sr of siblingResults) {
      if (!sr || !sr.streamUrl) continue;
      const parentUrl = sr._item?.payload?.u || '';
      const rawExtras = [
        ...(Array.isArray(sr.extraEmbeds) ? sr.extraEmbeds : []),
        ...(Array.isArray(sr.extraEmbedUrls) ? sr.extraEmbedUrls.map((u) => ({ url: u, audioType: 'unknown' })) : []),
      ];
      for (const ext of rawExtras) {
        const embUrl = typeof ext === 'string' ? ext : ext?.url;
        const embAudio = (typeof ext === 'object' && ext?.audioType) ? ext.audioType : 'unknown';
        if (!embUrl || seenRawUrls.has(embUrl) || !/vidmoly|ok\.ru|rapidvid/i.test(embUrl)) continue;
        seenRawUrls.add(embUrl);
        embedCandidates.push({ url: embUrl, audioType: embAudio, parentUrl });
        if (embedCandidates.length >= 3) break;
      }
      if (embedCandidates.length >= 3) break;
    }

    // Pre-verify extra embeds in parallel with a tight 1.2s cap so dead embeds never stall playback
    const verifiedEmbeds = embedCandidates.length > 0
      ? await Promise.all(
          embedCandidates.map((ec) =>
            withCap(
              resolveSingleSource(ec.url, '', 2200, true, ec.parentUrl).then((r) =>
                r && r.streamUrl && !r.blocked && !r.isTakedown ? { ...ec, resolved: r } : null
              ),
              1200
            )
          )
        )
      : [];

    // Assemble 100% verified, stream-deduplicated alternatives list (winner kept at its exact token)
    const wonItem = won._item;
    const seenStreams = new Set();
    const verifiedAlts = [];

    // 1. Add winning source first so activeSourceToken is guaranteed present
    const wonStreamKey = normalizeStreamDedupeKey(won.streamUrl);
    seenStreams.add(wonStreamKey);
    const wonAudio = (won.audioType && won.audioType !== 'unknown')
      ? won.audioType
      : (wonItem.payload.a || 'unknown');
    // Re-seal token if audioType improved, otherwise keep exact token
    verifiedAlts.push({
      token: wonItem.tok,
      audioType: wonAudio,
    });

    // 2. Add verified sibling site sources
    for (const sr of siblingResults) {
      if (!sr || !sr.streamUrl || sr._item.tok === wonItem.tok) continue;
      const sk = normalizeStreamDedupeKey(sr.streamUrl);
      if (seenStreams.has(sk)) continue;
      seenStreams.add(sk);
      const aType = (sr.audioType && sr.audioType !== 'unknown')
        ? sr.audioType
        : (sr._item.payload.a || 'unknown');
      verifiedAlts.push({
        token: sr._item.tok,
        audioType: aType,
      });
    }

    // 3. Add verified extra player embeds (Vidmoly / Ok.Ru / RapidVid / etc.)
    for (const ve of verifiedEmbeds) {
      if (!ve || !ve.resolved?.streamUrl) continue;
      if (verifiedAlts.length >= 8) break;
      const sk = normalizeStreamDedupeKey(ve.resolved.streamUrl);
      if (seenStreams.has(sk)) continue;
      seenStreams.add(sk);
      const aType = ve.audioType !== 'unknown'
        ? ve.audioType
        : (ve.resolved.audioType || 'unknown');
      const embTok = sealWpToken({ u: ve.url, embed: true, r: ve.parentUrl || '', a: aType }, 21600);
      if (embTok) {
        verifiedAlts.push({
          token: embTok,
          audioType: aType,
        });
      }
    }

    const alternatives = verifiedAlts.map((item, idx) => ({
      token: item.token,
      label: `Kaynak ${idx + 1}`,
      audioType: item.audioType || 'unknown',
    }));

    const opaque = buildOpaqueResolvedPayload(won, resolveBaseOrigin, title);
    return res.status(200).json({
      success: true,
      ...opaque,
      activeSourceToken: wonItem.tok,
      activeSourceIndex: 0,
      alternatives,
      cached: false,
      resolvedIn: Date.now() - startTime,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: sanitizePublicError(err?.message),
    });
  }
});

// POST /api/resolve-stream (Manual URL Paste Resolver — returns opaque /api/wp-stream URL with zero provider leaks)
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
    const isMp4Direct = lower.endsWith('.mp4');
    const tok = sealWpToken({ u: trimmedUrl, r: '', o: '' }, 21600);
    const playableStreamUrl = `${resolveBaseOrigin}/api/wp-stream/${tok}.${isMp4Direct ? 'mp4' : 'm3u8'}`;
    return res.status(200).json({
      success: true,
      status: 'success',
      playableStreamUrl,
      type: isMp4Direct ? 'mp4' : 'm3u8',
      pageTitle: 'Doğrudan Akış Kaynağı',
      cached: false,
      resolvedIn: 1,
    });
  }

  const startTime = Date.now();
  const fetchTimeout = Math.min(parseInt(timeout, 10) || 16000, 18000);

  try {
    const resolved = await resolveSingleSource(trimmedUrl, '', fetchTimeout, false);
    if (resolved && resolved.isTakedown) {
      return res.status(451).json({
        success: false,
        error: 'Bu içerik yasal nedenlerle yayından kaldırılmıştır.',
        code: 'LEGAL_TAKEDOWN',
      });
    }
    if (resolved && resolved.streamUrl && !resolved.blocked) {
      const opaque = buildOpaqueResolvedPayload(resolved, resolveBaseOrigin, resolved.pageTitle);
      return res.status(200).json({
        success: true,
        status: 'success',
        ...opaque,
        cached: false,
        resolvedIn: Date.now() - startTime,
      });
    }
    return res.status(404).json({
      success: false,
      error: 'Bu bağlantıdan şu anda oynatılabilir akış alınamadı. Lütfen alternatif bir link veya arama sekmesini deneyin.',
      code: 'STREAM_NOT_FOUND',
      resolvedIn: Date.now() - startTime,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: sanitizePublicError(err?.message),
      code: 'RESOLVER_ERROR',
      resolvedIn: Date.now() - startTime,
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

    // 1. If pageUrl is available and subtitles are still empty, inspect pageUrl
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

const SOURCE_PRIORITY = {
  fullhdfilmizlesene: 100,
};

const SOURCE_REFERER = {
  fullhdfilmizlesene: 'https://www.fullhdfilmizlesene.now/',
};

function stripTurkishChars(str = '') {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectAudioTypeFromText(text = '') {
  const s = stripTurkishChars(String(text || ''));
  const hasDub = /\b(dublaj|dublajli|tr dublaj|turkce dublaj|turkce ses)\b|trz-dublaj|tag-tr/.test(s);
  const hasSub = /\b(altyazi|altyazili|turkce altyazi|alt yazi)\b|trz-altyazi|tag-en/.test(s);
  const hasDual = /\b(dual|dublaj\s*[-–—&+/]\s*altyazi|altyazi\s*[-–—&+/]\s*dublaj)\b|trz-dual/.test(s) || (hasDub && hasSub);
  if (hasDual) return 'dual';
  if (hasDub) return 'dublaj';
  if (hasSub) return 'altyazi';
  return 'unknown';
}

function normalizeMovieTitleParts(title = '') {
  const cleanRaw = sanitizePublicTitle(title);

  const normOne = (s) => {
    let str = stripTurkishChars(s)
      .replace(/['’‘`]/g, '')
      .replace(/\(\s*\d{4}\s*\)/g, ' ')
      .replace(/\b(19\d\d|20[0-3]\d)\b/g, ' ')
      .replace(/[()[\]{}_,.:;!?\\/|\-–—+&"]/g, ' ');
    const removeWords = [
      'turkce dublaj', 'turkce altyazili', 'turkce altyazi', 'altyazili',
      'altyazi', 'dublajli', 'dublaj', 'dual', 'tr en', 'full hd', '1080p',
      '720p', '480p', '4k', 'uhd', 'hd', 'izle', 'filmi', 'film', 'tek parca',
      'sansursuz', 'unrated', 'extended', 'remastered', 'directors cut',
      'special edition', 'deluxe edition', 'the movie'
    ];
    for (const w of removeWords) {
      const reg = new RegExp('(?:^|\\s+)' + w + '(?=\\s+|$)', 'gi');
      str = str.replace(reg, ' ');
    }
    str = str
      .replace(/\b(bolum|kisim)\b/g, 'part')
      .replace(/\bpart\s+one\b/g, 'part 1')
      .replace(/\bpart\s+two\b/g, 'part 2')
      .replace(/\bpart\s+three\b/g, 'part 3')
      .replace(/\bpart\s+four\b/g, 'part 4')
      .replace(/\b(\d+)\s+part\b/g, 'part $1')
      .replace(/\bii\b/g, '2')
      .replace(/\biii\b/g, '3')
      .replace(/\biv\b/g, '4')
      .replace(/\bv\b/g, '5')
      .replace(/\bvi\b/g, '6')
      .replace(/\bvii\b/g, '7')
      .replace(/\bviii\b/g, '8')
      .replace(/\bix\b/g, '9')
      .replace(/\bx\b/g, '10');
    str = str.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    // Strip leading articles repeatedly ("the matrix" -> "matrix")
    while (/^(?:the|a|an|bir)\s+/.test(str)) {
      str = str.replace(/^(?:the|a|an|bir)\s+/, '').trim();
    }
    return str;
  };

  const addAliases = (normStr, keySet) => {
    if (!normStr || normStr.length < 2) return;
    keySet.add(normStr);
    const toks = normStr.split(' ').filter(Boolean);
    if (toks.length >= 2) {
      const last = toks[toks.length - 1];
      const prev = toks[toks.length - 2];
      // "matrix 1" -> "matrix", NEVER "part 1" -> "part"
      if (last === '1' && !/^(part|vol|volume|chapter|sezon|season)$/.test(prev)) {
        const dropped1 = toks.slice(0, -1).join(' ');
        if (dropped1.length >= 2) keySet.add(dropped1);
      }
      // Inline sequence digit: "matrix 2 reloaded" -> "matrix reloaded", "matrix 4 resurrections" -> ["matrix 4", "matrix resurrections"]
      for (let i = 1; i < toks.length - 1; i++) {
        if (/^[1-9]$/.test(toks[i]) && !/^(part|vol|volume|chapter|sezon|season)$/.test(toks[i - 1])) {
          const withoutSeq = [...toks.slice(0, i), ...toks.slice(i + 1)].join(' ');
          if (withoutSeq.length >= 3) keySet.add(withoutSeq);
          const upToSeq = toks.slice(0, i + 1).join(' ');
          if (upToSeq.length >= 3) keySet.add(upToSeq);
        }
      }
      // Conservative Turkish word synonym normalization for multi-word titles (e.g. Kızıl Başlık vs Kırmızı Başlığın)
      if (toks.length >= 3) {
        const synStr = normStr
          .replace(/\bkirmizi\b/g, 'kizil')
          .replace(/\bbasligin\b/g, 'baslik')
          .replace(/\buzun\s+cadilar\s+bayrami\b/g, 'the long halloween')
          .replace(/\bbitmeyen\s+cadilar\s+bayrami\b/g, 'the long halloween');
        if (synStr !== normStr && synStr.length >= 4) {
          keySet.add(normOne(synStr));
        }
      }
    }
  };

  const fullKey = normOne(cleanRaw);
  const keySet = new Set();
  addAliases(fullKey, keySet);

  // Split ONLY on whitespace-surrounded bilingual separators (-, –, —, /, |); NEVER split on ':'
  const sepParts = cleanRaw.split(/\s+(?:[-–—/|])\s+/).map((p) => p.trim()).filter(Boolean);
  if (sepParts.length === 2) {
    const leftNorm = normOne(sepParts[0]);
    const rightNorm = normOne(sepParts[1]);
    if (
      leftNorm.length >= 3 &&
      rightNorm.length >= 3 &&
      !/^(part|vol|volume|chapter|sezon|season)\b/.test(rightNorm)
    ) {
      const leftWords = new Set(leftNorm.split(' ').filter((w) => w.length >= 3));
      const rightWords = new Set(rightNorm.split(' ').filter((w) => w.length >= 3));
      const shared = [...leftWords].filter((w) => rightWords.has(w));
      // Only treat both halves as independent movie aliases if bilingual (zero shared content words)
      if (shared.length === 0) {
        addAliases(leftNorm, keySet);
        addAliases(rightNorm, keySet);
      }
    }
  }

  const keys = Array.from(keySet);
  return { fullKey, keys: keys.length > 0 ? keys : [fullKey || stripTurkishChars(cleanRaw)] };
}

function scorePosterQuality(src) {
  if (!src?.poster) return -1;
  const p = src.providerKey;
  if (p === 'fullhdfilmizlesene') return 80;
  return 20;
}

async function fetchCinemetaCatalog(query) {
  try {
    const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(query)}.json`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    const metas = Array.isArray(data?.metas) ? data.metas.slice(0, 20) : [];
    return metas
      .filter((m) => m && m.name && m.poster && /^https?:\/\//i.test(m.poster))
      .map((m) => ({
        name: String(m.name),
        keys: normalizeMovieTitleParts(m.name).keys,
        poster: String(m.poster),
        year: String(m.releaseInfo || '').slice(0, 4),
      }));
  } catch {
    return [];
  }
}

function scoreDisplayTitleQuality(t) {
  const s = String(t || '').trim();
  if (!s) return -999;
  let score = 50;
  if (/\b1\s*$/.test(s) && !/\bpart\s*1\b/i.test(s)) score -= 25;
  if (s.includes('-')) score -= 5;
  if (s === s.toUpperCase() && s.length > 4) score -= 12;
  if (s.length > 68) score -= 15;
  score += Math.min(20, s.length * 0.4);
  return score;
}

function unifyRawMovieGroups(combined, query = '', cinemetaList = []) {
  const activeGroups = new Set();
  const keyToGroup = new Map();

  const mergeGroupsInto = (target, other) => {
    if (!target || !other || target === other) return;
    for (const s of other.sources) {
      if (!target.urlSet.has(s.url)) {
        target.urlSet.add(s.url);
        target.sources.push(s);
      }
    }
    for (const k of other.allKeys) {
      target.allKeys.add(k);
      keyToGroup.set(k, target);
    }
    for (const pObj of other.posters) {
      if (pObj?.u && !target.posters.some((x) => x.u === pObj.u)) {
        target.posters.push(pObj);
      }
    }
    if (!target.altTitle && other.altTitle) {
      target.altTitle = other.altTitle;
    }
    if (scoreDisplayTitleQuality(other.title) > scoreDisplayTitleQuality(target.title)) {
      target.title = other.title;
    }
    activeGroups.delete(other);
  };

  for (const item of combined) {
    if (!item || !item.url || !item.title) continue;
    const cleanTitle = sanitizePublicTitle(item.title);
    if (!cleanTitle) continue;
    const { fullKey, keys: baseKeys } = normalizeMovieTitleParts(cleanTitle);
    const keySet = new Set(baseKeys);

    let firstAlt = '';
    if (item.altTitle && typeof item.altTitle === 'string') {
      const cleanTokenWordCount = fullKey.split(' ').filter(Boolean).length;
      const altSegments = item.altTitle.split(/\s+(?:[-–—/|])\s+/).map((x) => sanitizePublicTitle(x)).filter((x) => x && x.length >= 4);
      for (const seg of altSegments) {
        if (!firstAlt && /[a-zA-Z]/.test(seg)) firstAlt = seg;
        const { keys: altKeys } = normalizeMovieTitleParts(seg);
        for (const ak of altKeys) {
          if (ak.length >= 4 && !(cleanTokenWordCount >= 2 && !ak.includes(' '))) {
            keySet.add(ak);
          }
        }
      }
    }
    const keys = Array.from(keySet);

    const matchedSet = new Set();
    for (const k of keys) {
      const g = keyToGroup.get(k);
      if (g && activeGroups.has(g)) matchedSet.add(g);
    }

    const srcPriority = SOURCE_PRIORITY[item.providerKey] || 10;
    const itemAudio = item.audioType && item.audioType !== 'unknown'
      ? item.audioType
      : detectAudioTypeFromText(`${cleanTitle} ${item.url}`);
    const isDub = itemAudio === 'dublaj' || itemAudio === 'dual';
    const srcEntry = {
      url: item.url,
      providerKey: item.providerKey || 'ext',
      priority: srcPriority + (isDub ? 2 : 0),
      poster: item.poster || null,
      rawTitle: cleanTitle,
      audioType: itemAudio,
    };

    const posterObj = item.poster && /^https?:\/\//i.test(item.poster)
      ? { u: item.poster, r: SOURCE_REFERER[item.providerKey] || '', score: scorePosterQuality(item), p: item.providerKey }
      : null;

    if (matchedSet.size === 0) {
      const group = {
        canonicalKey: fullKey || cleanTitle.toLowerCase(),
        allKeys: new Set(keys),
        title: cleanTitle,
        altTitle: firstAlt || '',
        posters: posterObj ? [posterObj] : [],
        sources: [srcEntry],
        urlSet: new Set([item.url]),
      };
      activeGroups.add(group);
      for (const k of keys) keyToGroup.set(k, group);
    } else {
      const matched = Array.from(matchedSet);
      const target = matched[0];
      for (let i = 1; i < matched.length; i++) {
        mergeGroupsInto(target, matched[i]);
      }
      for (const k of keys) {
        target.allKeys.add(k);
        keyToGroup.set(k, target);
      }
      if (!target.altTitle && firstAlt) {
        target.altTitle = firstAlt;
      }
      if (!target.urlSet.has(item.url)) {
        target.urlSet.add(item.url);
        target.sources.push(srcEntry);
      }
      if (scoreDisplayTitleQuality(cleanTitle) > scoreDisplayTitleQuality(target.title)) {
        target.title = cleanTitle;
      }
      if (posterObj && !target.posters.some((x) => x.u === posterObj.u)) {
        target.posters.push(posterObj);
      }
    }
  }

  // Final compact alphanumeric collision pass (zero duplicates guarantee)
  const groups = Array.from(activeGroups);
  const compactMap = new Map();
  for (const g of groups) {
    if (!activeGroups.has(g)) continue;
    const compact = normalizeMovieTitleParts(g.title).fullKey.replace(/\s+/g, '');
    if (compact.length >= 4) {
      const existing = compactMap.get(compact);
      if (existing && existing !== g && activeGroups.has(existing)) {
        mergeGroupsInto(existing, g);
      } else {
        compactMap.set(compact, g);
      }
    }
  }

  const finalGroups = Array.from(activeGroups);
  const normQuery = stripTurkishChars(query).replace(/\s+/g, ' ').trim();

  for (const g of finalGroups) {
    // Keep at most 2 distinct URLs per internal provider (e.g. dublaj + altyazı), sort fastest/most reliable first
    g.sources.sort((a, b) => b.priority - a.priority);
    const perProviderCount = new Map();
    const filtered = [];
    for (const s of g.sources) {
      const cnt = perProviderCount.get(s.providerKey) || 0;
      if (cnt >= 2) continue;
      perProviderCount.set(s.providerKey, cnt + 1);
      filtered.push(s);
    }
    g.sources = filtered.slice(0, 6);
    g.topPriority = g.sources[0]?.priority || 0;
    const tNorm = stripTurkishChars(g.title);
    const altNorm = stripTurkishChars(g.altTitle || '');
    const exactMatch = tNorm === normQuery || altNorm === normQuery || g.allKeys.has(normQuery);
    const startsMatch = tNorm.startsWith(normQuery) || (altNorm && altNorm.startsWith(normQuery));
    const includesMatch = tNorm.includes(normQuery) || (altNorm && altNorm.includes(normQuery));
    g.queryScore = exactMatch ? 120 : (startsMatch ? 60 : (includesMatch ? 30 : 0));

    // Order cover posters: fast direct hosts first, Cinemeta fallback/boost for Tor-only hosts
    g.posters.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (Array.isArray(cinemetaList) && cinemetaList.length > 0) {
      const cinMatch = cinemetaList.find((m) => m.keys.some((k) => g.allKeys.has(k)));
      if (cinMatch && cinMatch.poster && !g.posters.some((x) => x.u === cinMatch.poster)) {
        const hasFastDirectPoster = g.posters.some((p) => p.p !== 'fullhdfilmizlesene');
        if (hasFastDirectPoster) {
          g.posters.push({ u: cinMatch.poster, r: '', score: 55, p: 'meta' });
        } else {
          // Put fast CDN cover poster before HTTP-444 Tor-only poster, keeping Tor poster as fallback
          g.posters.unshift({ u: cinMatch.poster, r: '', score: 80, p: 'meta' });
        }
      }
    }
  }

  finalGroups.sort((a, b) => (b.queryScore - a.queryScore) || (b.topPriority - a.topPriority) || (b.sources.length - a.sources.length));

  return finalGroups.map((g) => ({
    canonicalKey: g.canonicalKey,
    id: crypto.createHash('sha1').update(g.canonicalKey).digest('hex').slice(0, 12),
    title: g.title,
    altTitle: g.altTitle || '',
    bestPoster: g.posters[0]?.u || null,
    posterReferer: g.posters[0]?.r || SOURCE_REFERER[g.sources[0]?.providerKey] || '',
    posterAlts: g.posters.slice(1, 4).map((p) => ({ u: p.u, r: p.r || '' })),
    sources: g.sources.map((s) => ({ u: s.url, p: s.providerKey, a: s.audioType || 'unknown' })),
  }));
}

function sealUnifiedMovieResults(rawGroups, proxyBaseOrigin) {
  return rawGroups.map((g) => {
    let sealedPoster = null;
    if (g.bestPoster && /^https?:\/\//i.test(g.bestPoster)) {
      const pPayload = { u: g.bestPoster, r: g.posterReferer || '', t: g.altTitle || g.title };
      if (Array.isArray(g.posterAlts) && g.posterAlts.length > 0) {
        pPayload.alts = g.posterAlts;
      }
      const pTok = sealWpToken(pPayload, 86400);
      if (pTok) sealedPoster = `${proxyBaseOrigin}/api/wp-asset/${pTok}`;
    }
    const sealedSources = g.sources
      .map((s, idx) => {
        const audioType = s.a || 'unknown';
        const tok = sealWpToken({ u: s.u, p: s.p, a: audioType }, 21600);
        return tok ? { token: tok, label: `Kaynak ${idx + 1}`, audioType } : null;
      })
      .filter(Boolean);
    return {
      id: g.id,
      title: g.title,
      poster: sealedPoster,
      sourceCount: sealedSources.length,
      sources: sealedSources,
    };
  }).filter((g) => g.sources.length > 0);
}

/**
 * 1. FullHDFilmİzlesene doğrudan arama (TLS/Tor + ScraperAPI fallback)
 */
async function searchFullHDFilm(query) {
  try {
    const targetUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
    let html = await fetchWithTlsImpersonator(targetUrl, 'https://www.fullhdfilmizlesene.now/');
    if (!html || isBlockedOrChallenge(html)) {
      html = await fetchWithCurl(targetUrl, ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'], 4);
    }

    const parseFhfHtml = (srcHtml) => {
      const list = [];
      const filmBlockRegex = /<li[^>]*class="film"[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = filmBlockRegex.exec(srcHtml)) !== null) {
        const block = match[1];
        const linkMatch = block.match(/href="(https:\/\/www\.fullhdfilmizlesene\.now\/film\/[^"]+)"/i);
        const titleMatch = block.match(/<span class="film-title">([^<]+)<\/span>/i) || block.match(/class="tt"[^>]*>([^<]+)<\/a>/i);
        const ktMatch = block.match(/<span class="kt">([^<]+)<\/span>/i);
        const posterMatch = block.match(/srcset="(https:\/\/img\.fullhdfilmizlesene\.now\/poster\/[^\s"]+)/i) ||
                            block.match(/data-src="([^"]+)"/i) ||
                            block.match(/src="([^"]+)"/i);
        if (linkMatch && titleMatch) {
          let poster = posterMatch ? posterMatch[1] : null;
          if (poster && poster.startsWith('data:')) poster = null;
          const cleanTitle = decodeHtmlEntities(titleMatch[1].trim());
          const altTitle = ktMatch ? decodeHtmlEntities(ktMatch[1].trim()) : '';
          const audioType = /trz-dual/i.test(block)
            ? 'dual'
            : (/trz-(?:dublaj|du\b)/i.test(block)
                ? 'dublaj'
                : (/trz-(?:altyazi|ay\b)/i.test(block) ? 'altyazi' : detectAudioTypeFromText(`${block} ${cleanTitle}`)));
          list.push({
            providerKey: 'fullhdfilmizlesene',
            title: cleanTitle,
            altTitle,
            url: linkMatch[1],
            poster,
            audioType,
          });
        }
      }
      return list;
    };

    const directResults = parseFhfHtml(html);
    if (directResults.length > 0) return directResults;

    const apiKey = getValidScraperApiKey();
    if (apiKey) {
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4500) });
      if (res.status === 401 || res.status === 403) {
        exhaustedScraperKeys.add(apiKey);
        return [];
      }
      if (res.ok) return parseFhfHtml(await res.text());
    }
  } catch {}
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
  const proxyBaseOrigin = getProxyBaseOrigin(req);

  // 1. Önbellek kontrolü (raw unified groups cached, sealed cleanly per request with opaque tokens)
  const cached = inProcessSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL && Array.isArray(cached.rawGroups)) {
    const sealed = sealUnifiedMovieResults(cached.rawGroups, proxyBaseOrigin);
    return res.status(200).json({
      success: true,
      query: trimmedQuery,
      count: sealed.length,
      results: sealed,
      cached: true,
    });
  }

  // 2. FullHDFilmİzlesene + Cover Metadata Eşzamanlı Hızlı Arama (max 4.5s soft cap)
  const withSoftCap = (p, ms = 4500) => Promise.race([
    p.catch(() => []),
    new Promise((resolve) => setTimeout(() => resolve([]), ms)),
  ]);

  try {
    const settled = await Promise.all([
      withSoftCap(searchFullHDFilm(trimmedQuery), 4500),
      withSoftCap(fetchCinemetaCatalog(trimmedQuery), 2800),
    ]);

    let cinemetaList = settled.pop() || [];
    const combined = settled.flat().filter((item) => item && item.url && item.title);

    // Cover fallback for Turkish search terms when Cinemeta returned nothing for the TR query
    if (combined.length > 0 && cinemetaList.length === 0) {
      const normQ = stripTurkishChars(trimmedQuery).replace(/\s+/g, ' ').trim();
      const counterpartSet = new Set();
      for (const item of combined.slice(0, 6)) {
        const cTitle = sanitizePublicTitle(item.title || '');
        if (cTitle && cTitle.length >= 3 && cTitle.length <= 48 && stripTurkishChars(cTitle) !== normQ) {
          counterpartSet.add(cTitle);
        }
        if (item.altTitle) {
          const firstAlt = sanitizePublicTitle(String(item.altTitle).split(/\s+(?:[-–—/|])\s+/)[0] || '');
          if (firstAlt && firstAlt.length >= 3 && firstAlt.length <= 48 && stripTurkishChars(firstAlt) !== normQ) {
            counterpartSet.add(firstAlt);
          }
        }
        if (counterpartSet.size >= 2) break;
      }
      if (counterpartSet.size > 0) {
        const extraSettled = await Promise.all(
          [...counterpartSet].map((cq) => withSoftCap(fetchCinemetaCatalog(cq), 2200))
        );
        for (const arr of extraSettled) {
          if (Array.isArray(arr) && arr.length > 0) {
            cinemetaList = [...cinemetaList, ...arr];
          }
        }
      }
    }

    if (combined.length > 0) {
      const rawGroups = unifyRawMovieGroups(combined, trimmedQuery, cinemetaList);
      inProcessSearchCache.set(cacheKey, { timestamp: Date.now(), rawGroups });
      if (inProcessSearchCache.size > 150) {
        const oldestKey = inProcessSearchCache.keys().next().value;
        if (oldestKey) inProcessSearchCache.delete(oldestKey);
      }
      const sealed = sealUnifiedMovieResults(rawGroups, proxyBaseOrigin);
      const topUrl = rawGroups[0]?.sources?.[0]?.u;
      if (topUrl && !movieResolveCache.has(topUrl) && !prewarmInFlight.has(topUrl)) {
        prewarmInFlight.add(topUrl);
        resolveSingleSource(topUrl, 'fullhdfilmizlesene', 10000, false)
          .catch(() => null)
          .finally(() => prewarmInFlight.delete(topUrl));
      }
      return res.status(200).json({
        success: true,
        query: trimmedQuery,
        count: sealed.length,
        results: sealed,
      });
    }
  } catch (fastSearchErr) {
    console.warn('[HLSProxy] Fast unified search error:', fastSearchErr.message);
  }

  // Hiçbir sonuç bulunamazsa 200 ile boş dizi döner (UI bozulmaz)
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
    .replace(/\b(1080p|720p|480p|4k|uhd|bluray|web-?dl|hdrip|türkçe dublaj|türkçe altyazı|altyazılı|dublaj|full hd|izle|film izle)\b/gi, ' ')
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

async function inspectSubtitleSpanSec(rawSubUrl) {
  if (!rawSubUrl) return null;
  try {
    let vttBuf = subtitleFileCache.get(`vtt:${rawSubUrl}`)?.buf || null;
    if (!vttBuf) {
      const ssrf = validateSsrfUrl(rawSubUrl);
      if (!ssrf.safe) return null;
      const upstream = await safeFetch(rawSubUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(2500),
      });
      if (!upstream.ok) return null;
      let rawBuf = Buffer.from(await upstream.arrayBuffer());
      if (rawBuf.length >= 4 && rawBuf[0] === 0x50 && rawBuf[1] === 0x4b && rawBuf[2] === 0x03 && rawBuf[3] === 0x04) {
        const extracted = extractBestSubFromZipBuffer(rawBuf);
        if (!extracted) return null;
        rawBuf = extracted;
      }
      if (rawBuf.length < 30) return null;
      vttBuf = convertSrtBufferToVtt(rawBuf);
      subtitleFileCache.set(`vtt:${rawSubUrl}`, { ts: Date.now(), buf: vttBuf });
    }
    const text = vttBuf.toString('utf8');
    const matches = [...text.matchAll(/(\d{2,3}):(\d{2}):(\d{2})\.\d{3}\s*-->/g)];
    if (matches.length < 5) return null;
    const last = matches[matches.length - 1];
    return parseInt(last[1], 10) * 3600 + parseInt(last[2], 10) * 60 + parseInt(last[3], 10);
  } catch {
    return null;
  }
}

async function searchTurkishSubtitles({ title = '', imdbId = '', year = '', duration = 0 } = {}) {
  const cleanTitle = cleanMovieTitleForSubtitleSearch(title);
  if (!cleanTitle && !imdbId) return [];
  const durBucket = duration > 300 ? Math.round(duration / 60) : 0;
  const cacheKey = `${imdbId || ''}|${cleanTitle.toLowerCase()}|${year || ''}|${durBucket}`;
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

  // If video duration is known (> 5 min), verify top 6 candidates' actual runtime span
  // so 2-CD splits, trailers, or wrong-cut subtitles are filtered out and closest-duration wins
  if (duration > 300 && combined.length > 0) {
    await Promise.allSettled(combined.slice(0, 6).map(async (item) => {
      if (!item?.playableUrl?.startsWith('/api/subtitles/vtt?url=')) return;
      const rawUrl = decodeURIComponent(item.playableUrl.replace('/api/subtitles/vtt?url=', ''));
      const spanSec = await inspectSubtitleSpanSec(rawUrl);
      if (spanSec && spanSec > 60) {
        item.spanSec = spanSec;
        const ratio = spanSec / duration;
        if (ratio < 0.65 || ratio > 1.20) {
          item.score = (item.score || 0) - 200;
        } else {
          const diffPct = Math.abs(1 - ratio);
          item.score = (item.score || 0) + Math.max(0, Math.round(35 - diffPct * 250));
        }
      }
    }));
    combined.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const deduped = [];
  const seen = new Set();
  for (const item of combined) {
    if (!item?.playableUrl || seen.has(item.playableUrl)) continue;
    if (duration > 300 && item.score <= -100) continue;
    seen.add(item.playableUrl);
    const durTag = item.spanSec ? `${Math.round(item.spanSec / 60)}dk` : '';
    const hints = [item.releaseTag, item.fpsHint, durTag].filter(Boolean);
    const suffix = hints.length > 0 ? ` (${hints.join(' • ')})` : '';
    deduped.push({
      id: item.id,
      label: `Hazır TR ${deduped.length + 1}${suffix}`,
      fps: item.fps || 0,
      spanSec: item.spanSec || 0,
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

// GET /api/subtitles/search?title=...&imdbId=...&year=...&duration=...
router.get('/subtitles/search', resolverLimiter, async (req, res) => {
  try {
    const { title = '', imdbId = '', year = '', duration = '0' } = req.query || {};
    if (!title && !imdbId) {
      return res.status(400).json({ success: false, error: 'title veya imdbId gereklidir.', subtitles: [] });
    }
    const durSec = Math.max(0, parseInt(String(duration || '0'), 10) || 0);
    const subtitles = await searchTurkishSubtitles({ title: String(title), imdbId: String(imdbId), year: String(year), duration: durSec });
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
