/**
 * services/playwrightResolver.js
 *
 * Film/dizi sayfasını headless Chromium ile açar, ağ trafiğini izleyerek
 * HLS (.m3u8) veya MP4 video akış URL'sini ve HTTP başlıklarını (Referer, User-Agent, Origin) döner.
 *
 * Referer Mantığı:
 *   - Gerçek ağ isteğinde gönderilen Referer header'ı (eğer varsa)
 *   - Video oynatıcının yüklendiği iFrame'in kendi tam URL'si (örn. https://rapidvid.net/vod/v1xb22f10f9)
 *   - Özel domain kuralları (closeload.filmmakinesi.to, hdfilmcehennemi.mobi, rapidvid.net)
 */

const { chromium } = require('playwright');
const vm = require('vm');
const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Public Proxy aracılığıyla HTML çekip embed URL ayıklama
// (Cloudflare'ın Oracle datacenter IP'sini bloklaması durumunda kullanılır)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * allorigins.win veya benzer bir public proxy üzerinden URL'nin HTML içeriğini çeker.
 * @param {string} targetUrl
 * @returns {Promise<string|null>}
 */
async function fetchHtmlViaPublicProxy(targetUrl) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const html = await new Promise((resolve, reject) => {
        const lib = proxyUrl.startsWith('https') ? https : http;
        const req = lib.get(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
          },
          timeout: 12000,
        }, (res) => {
          if (res.statusCode !== 200) { res.resume(); return reject(new Error(`Status ${res.statusCode}`)); }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', chunk => { data += chunk; if (data.length > 500000) { res.destroy(); resolve(data); } });
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      if (html && html.length > 500) {
        logger.info(`[PreFetch] HTML alındı: ${html.length} bayt (proxy: ${proxyUrl.substring(0, 50)})`);
        return html;
      }
    } catch (e) {
      logger.debug(`[PreFetch] Proxy başarısız (${proxyUrl.substring(0, 50)}): ${e.message}`);
    }
  }
  return null;
}

/**
 * HTML içeriğinden iframe/embed URL'lerini ayıklar.
 * @param {string} html
 * @param {string} baseUrl
 * @returns {string[]}
 */
function extractEmbedUrlsFromHtml(html, baseUrl) {
  const results = new Set();

  // iframe src
  const iframeSrcRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = iframeSrcRegex.exec(html)) !== null) {
    const src = m[1].trim();
    if (src && src.startsWith('http') && !src.includes('google') && !src.includes('facebook') && !src.includes('twitter') && !src.includes('doubleclick')) {
      results.add(src);
    } else if (src && src.startsWith('//')) {
      results.add('https:' + src);
    }
  }

  // data-src, data-embed, data-url in iframes
  const dataAttrRegex = /<(?:iframe|div|section)[^>]+data-(?:src|embed|url|video|link)=["']([^"']+)["']/gi;
  while ((m = dataAttrRegex.exec(html)) !== null) {
    const src = m[1].trim();
    if (src && src.startsWith('http')) results.add(src);
  }

  // Embedded JS player URLs (source:, file:, playerUrl:)
  const jsUrlRegex = /(?:source|file|playerUrl|embed_url|video_url|stream_url)["\s]*:[\s]*["']([^"'\s]+\.(?:m3u8|mp4|txt)[^"'\s]*)["']/gi;
  while ((m = jsUrlRegex.exec(html)) !== null) {
    if (m[1].startsWith('http')) results.add(m[1]);
  }

  // Direct m3u8/mp4 URL in page
  const streamRegex = /(https?:\/\/[^"'\s<>{}|]+\.(?:m3u8|txt|mp4)[^"'\s<>{}|]*)/gi;
  while ((m = streamRegex.exec(html)) !== null) {
    const u = m[1];
    if (!u.includes('sample') && !u.includes('theme') && !u.includes('placeholder')) {
      results.add(u);
    }
  }

  logger.info(`[PreFetch] Ayıklanan embed URL'ler: ${results.size}`);
  [...results].forEach(u => logger.debug(`[PreFetch]   → ${u.substring(0, 100)}`));
  return [...results];
}

/** Cloudflare tarafından engellenen bilinen domain'ler */
const CLOUDFLARE_BLOCKED_DOMAINS = [
  'hdfilmcehennemi', 'fullhdfilmizlesene', 'filmmakinesi', 'turkanime',
  'dizipal', 'animeler', 'anizm', 'hdfilmcehennemi', 'izlemax',
  'fullhdfilmizle', 'yabancidizi', 'dizibox',
];

// ─────────────────────────────────────────────────────────────────────────────
// Sabitler
// ─────────────────────────────────────────────────────────────────────────────

/** @typedef {{ regex: RegExp, type: 'm3u8' | 'mp4' }} StreamPattern */

/** @type {StreamPattern[]} */
const STREAM_PATTERNS = [
  // ── Standart HLS m3u8 / master.txt ───────────────────────────────────────
  { regex: /master\.m3u8(\?[^"'\s<>]*)?/i,            type: 'm3u8' },
  { regex: /master\.txt(\?[^"'\s<>]*)?/i,             type: 'm3u8' },
  { regex: /index\.m3u8(\?[^"'\s<>]*)?/i,             type: 'm3u8' },
  { regex: /playlist\.m3u8(\?[^"'\s<>]*)?/i,          type: 'm3u8' },
  { regex: /manifest\.m3u8(\?[^"'\s<>]*)?/i,          type: 'm3u8' },
  { regex: /\/hls\/.*\.m3u8(\?[^"'\s<>]*)?/i,         type: 'm3u8' },
  { regex: /\/stream\/.*\.m3u8(\?[^"'\s<>]*)?/i,      type: 'm3u8' },
  { regex: /\.m3u8(\?[^"'\s<>]*)?/i,                  type: 'm3u8' },
  { regex: /\.m3u8/i,                                 type: 'm3u8' },
  // ── Popüler CDN / Provider desenleri ────────────────────────────────────
  { regex: /rapidvid\.net.*\.m3u8/i,                  type: 'm3u8' },
  { regex: /closeload.*\.m3u8/i,                      type: 'm3u8' },
  { regex: /cdnimages.*\.txt/i,                       type: 'm3u8' },
  { regex: /playmix.*\.txt/i,                         type: 'm3u8' },
  { regex: /\/vod\/.*\.m3u8/i,                         type: 'm3u8' },
  { regex: /rapidrame.*\.m3u8/i,                       type: 'm3u8' },
  { regex: /filemoon.*\.m3u8/i,                        type: 'm3u8' },
  { regex: /doodstream.*\.m3u8/i,                      type: 'm3u8' },
  { regex: /cloudfront\.net.*\.m3u8/i,                 type: 'm3u8' },
  { regex: /akamaized\.net.*\.m3u8/i,                  type: 'm3u8' },
  { regex: /\/video\/hls\//i,                          type: 'm3u8' },
  { regex: /storage\.googleapis\.com.*\.m3u8/i,        type: 'm3u8' },
  // ── Popüler Genel Video Hostları / Oynatıcılar ─────────────────────────
  { regex: /vidmoly\.[a-z]+\/.*\.m3u8/i,              type: 'm3u8' },
  { regex: /vidoza\.[a-z]+\/.*\.m3u8/i,               type: 'm3u8' },
  { regex: /sibnet\.ru\/.*\.mp4/i,                    type: 'mp4'  },
  { regex: /vk\.com\/.*\.mp4/i,                       type: 'mp4'  },
  { regex: /mail\.ru\/.*\.mp4/i,                      type: 'mp4'  },
  { regex: /ok\.ru\/.*\.m3u8/i,                       type: 'm3u8' },
  { regex: /streamtape\.[a-z]+\/.*\.mp4/i,            type: 'mp4'  },
  { regex: /mixdrop\.[a-z]+\/.*\.m3u8/i,              type: 'm3u8' },
  { regex: /voe\.sx\/.*\.m3u8/i,                      type: 'm3u8' },
  // ── MP4 ─────────────────────────────────────────────────────────────────
  { regex: /\.mp4(\?[^"'\s<>]*)?$/i,                   type: 'mp4'  },
  { regex: /\/video\.mp4/i,                            type: 'mp4'  },
];

/** Response body taranırken m3u8/mp4 URL'si bulmak için kullanılan regex */
const BODY_M3U8_REGEX = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/gi;
const BODY_MP4_REGEX  = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.mp4[^"'\s\\<>{}|^`[\]]*)/gi;

/** Yoksayılacak URL'ler ve bilinen static sample string'ler @type {RegExp[]} */
const IGNORE_PATTERNS = [
  /google-analytics\.com/i, /googletagmanager\.com/i, /doubleclick\.net/i,
  /facebook\.com\/tr/i,     /hotjar\.com/i,
  /fonts\.googleapis\.com/i,
  /filmakinesimp4-f9gx1M12BwC/i, // Static theme JS template string
  /\/uploads\/malker\//i,       // Static site sample mp4
  /\/theme\/.*\.mp4/i,          // Theme sample mp4
  /\.css(\?.*)?$/i, /\.png(\?.*)?$/i, /\.jpg(\?.*)?$/i,
  /\.gif(\?.*)?$/i, /\.webp(\?.*)?$/i, /\.ico(\?.*)?$/i, /\.woff2?(\?.*)?$/i,
  /\.svg(\?.*)?$/i,
];

/** Taranacak içerik tipleri */
const SCANNABLE_CONTENT_TYPES = [
  'application/json', 'json', 'text/html', 'html', 'javascript', 'application/javascript', 'text/javascript',
];

/** iFrame URL'lerindeki embed URL parametrelerini çıkarmak için desenler */
const EMBED_URL_PARAM_PATTERNS = [
  /[?&]url=([^&]+)/i,
  /[?&]embed=([^&]+)/i,
  /[?&]src=([^&]+)/i,
  /[?&]link=([^&]+)/i,
  /[?&]file=([^&]+)/i,
];

/** Video oynatıcı play butonu CSS seçicileri @type {string[]} */
const PLAY_SELECTORS = [
  '[aria-label*="Play" i]', '[title*="Play" i]', '[data-plyr="play"]',
  'button[class*="play" i]', 'div[class*="play-button" i]', 'span[class*="play-button" i]',
  '[class*="play-btn" i]', '[class*="playBtn" i]', '[id*="play-button" i]',
  '.jw-display-icon-display', '.jw-icon-display', '.jwplayer .jw-svg-icon-play',
  '.vjs-big-play-button', '.video-js .vjs-play-control',
  '.plyr__control--overlaid', '.fp-play', '.fp-ui',
  '.dplayer-play-icon', '.dplayer-mask', '.play-wrapper',
  '.video-overlay', '.player-overlay', '.cover-play',
];

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────────────────────
// Ana Fonksiyon
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   streamUrl: string,
 *   type: 'm3u8' | 'mp4',
 *   headers: { referer: string, 'user-agent': string, origin: string },
 *   pageTitle: string
 * }} StreamResult
 */

/**
 * @param {string} targetUrl
 * @param {{ timeout?: number }} options
 * @returns {Promise<StreamResult | null>}
 */
const PROXY_SERVERS = [
  'http://51.159.115.233:3128',
  'http://157.245.97.60:80',
  'http://185.199.229.156:7492',
  'http://198.199.86.11:80',
  'http://45.79.207.135:80',
  'http://143.244.166.243:80'
];

async function resolveStreamUrl(targetUrl, options = {}) {
  const { timeout = 30000 } = options;
  let browser = null;

  try {
    logger.debug(`[Playwright] Chromium başlatılıyor...`);

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
        '--disable-gpu', '--disable-extensions',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    };

    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      launchOptions.proxy = { server: process.env.HTTP_PROXY || process.env.HTTPS_PROXY };
    }

    browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
      extraHTTPHeaders: {
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      viewport: { width: 1920, height: 1080 },
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
    });

    /** @type {StreamResult | null} */
    let foundStream = null;

    /**
     * Bir URL'nin stream URL'si olup olmadığını kontrol eder, varsa kaydeder.
     * @param {string} url
     * @param {Record<string, string>} [reqHeaders]
     * @param {string} [frameUrl]
     * @param {boolean} [isDirectStream]
     */
    function checkAndSaveStream(url, reqHeaders, frameUrl, isDirectStream = false) {
      if (foundStream || !url || typeof url !== 'string') return;
      if (url.length < 10) return;
      if (IGNORE_PATTERNS.some((p) => p.test(url))) return;

      const matchedPattern = isDirectStream
        ? { regex: /.*/, type: 'm3u8' }
        : STREAM_PATTERNS.find(({ regex }) => regex.test(url));

      if (matchedPattern) {
        const { type } = matchedPattern;
          const rawReferer = reqHeaders && reqHeaders['referer'];
          let finalReferer = '';

          // 1. Sağlayıcı / Site Bazlı Öncelikli Referer Kuralları
          if (targetUrl.includes('filmmakinesi') || url.includes('closeload') || (frameUrl && frameUrl.includes('closeload'))) {
            finalReferer = 'https://closeload.filmmakinesi.to/';
          } else if (targetUrl.includes('fullhdfilmizlesene') || url.includes('rapidvid') || (frameUrl && frameUrl.includes('rapidvid'))) {
            finalReferer = 'https://rapidvid.net/';
          } else if (targetUrl.includes('hdfilmcehennemi') || url.includes('cdnimages') || url.includes('playmix') || (frameUrl && frameUrl.includes('hdfilmcehennemi'))) {
            finalReferer = 'https://hdfilmcehennemi.mobi/';
          }
          // 2. İstekte gönderilen gerçek Referer (varsa)
          else if (rawReferer && /^https?:\/\//i.test(rawReferer) && !rawReferer.startsWith('about:')) {
            finalReferer = rawReferer;
          }
          // 3. iFrame URL'si
          else if (frameUrl && /^https?:\/\//i.test(frameUrl) && !frameUrl.startsWith('about:')) {
            finalReferer = frameUrl;
          }
          // 4. Varsayılan Hedef URL
          else {
            finalReferer = targetUrl;
          }

          const originUrl = (() => {
            try { return new URL(finalReferer).origin; } catch { return targetUrl; }
          })();

          foundStream = {
            streamUrl: url,
            type,
            headers: {
              referer:      finalReferer,
              'user-agent': (reqHeaders && reqHeaders['user-agent'])  || DEFAULT_USER_AGENT,
              origin:       (reqHeaders && reqHeaders['origin'])       || originUrl,
              cookie:       (reqHeaders && reqHeaders['cookie'])       || '',
            },
          };
          logger.info(`[Interceptor] ✅ ${type.toUpperCase()} yakalandı: ${url}`);
          logger.info(`[Interceptor] Referer: ${finalReferer}`);
        }
    }

    /**
     * Sadece JSON API yanıtlarını tarar (statik JS dosyaları taranmaz!).
     * @param {import('playwright').Response} response
     */
    async function scanResponseBody(response) {
      if (foundStream) return;

      const contentType = (response.headers()['content-type'] || '').toLowerCase();
      const resUrl = response.url();
      logger.debug(`[ScanAttempt] Content-Type: "${contentType}" | URL: ${resUrl.substring(0, 100)}`);

      const shouldScan = SCANNABLE_CONTENT_TYPES.some((t) => contentType.includes(t));
      if (!shouldScan) return;

      const frameUrl = response.frame() ? response.frame().url() : resUrl;

      try {
        const body = await response.text();
        if (!body || body.length > 500_000) return;

        if (resUrl.includes('embed') || resUrl.includes('check')) {
          logger.info(`[EmbedBody] URL: ${resUrl.substring(0, 80)} | len: ${body.length} | has_dc: ${body.includes('dc_')} | has_master: ${body.includes('master')}`);
          if (body.includes('dc_')) {
            const sample = body.substring(body.indexOf('dc_'), body.indexOf('dc_') + 300);
            logger.info(`[EmbedBodySample] ${sample}`);
          }
        }

        // 1. m3u8 URL'si var mı?
        const m3u8Matches = [...body.matchAll(BODY_M3U8_REGEX)];
        for (const [, url] of m3u8Matches) {
          if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
            logger.debug(`[BodyScan] m3u8 bulundu: ${url}`);
            checkAndSaveStream(url, {}, frameUrl);
            if (foundStream) return;
          }
        }

        // 2. Dynamic VM Eval — dc_ ve JS şifreli stream çözücü
        if (body.includes('dc_')) {
          const scriptBlocks = [...body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
          for (const m of scriptBlocks) {
            const code = m[1];
            if (code && code.includes('dc_')) {
              try {
                const sandbox = {
                  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
                  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
                  console: { log: () => {} },
                  window: {},
                  document: { addEventListener: () => {}, querySelector: () => null }
                };
                vm.createContext(sandbox);
                vm.runInContext(code, sandbox, { timeout: 1000 });

                for (const key of Object.keys(sandbox)) {
                  const val = sandbox[key];
                  if (typeof val === 'string' && val.startsWith('http') && (val.includes('m3u8') || val.includes('master') || val.includes('mp4') || val.includes('txt'))) {
                    logger.info(`[BodyScan] 🔓 VM ile şifreli stream çözüldü: ${val}`);
                    checkAndSaveStream(val, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
              } catch (e) {
                logger.debug(`[BodyScan] VM Eval uyarısı: ${e.message}`);
              }
            }
          }
        }

        // 3. Packed JS (Dean Edwards eval(function(p,a,c,k,e,d)...)) Unpacker
        if (body.includes('eval(function(p,a,c,k,e,d)')) {
          const packedMatches = [...body.matchAll(/eval\s*\(\s*(function\s*\([^)]*\)\s*\{[\s\S]*?\.split\(['"]\|['"]\)\s*\))\s*\)/gi)];
          for (const m of packedMatches) {
            try {
              const unpacked = vm.runInNewContext('(' + m[1] + ')');
              if (typeof unpacked === 'string') {
                const m3u8Matches = [...unpacked.matchAll(BODY_M3U8_REGEX)];
                for (const [, url] of m3u8Matches) {
                  if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
                    logger.info(`[BodyScan] 🔓 Packed JS içinden m3u8 çözüldü: ${url}`);
                    checkAndSaveStream(url, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
                const mp4Matches = [...unpacked.matchAll(BODY_MP4_REGEX)];
                for (const [, url] of mp4Matches) {
                  if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
                    logger.info(`[BodyScan] 🔓 Packed JS içinden mp4 çözüldü: ${url}`);
                    checkAndSaveStream(url, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
              }
            } catch {}
          }
        }

        // mp4 URL'si var mı?
        const mp4Matches = [...body.matchAll(BODY_MP4_REGEX)];
        for (const [, url] of mp4Matches) {
          if (!url || IGNORE_PATTERNS.some((p) => p.test(url))) continue;
          logger.debug(`[BodyScan] mp4 bulundu: ${url}`);
          checkAndSaveStream(url, {}, frameUrl);
          if (foundStream) return;
        }
      } catch {
        // Body okunamadı — yoksay
      }
    }

    /**
     * @param {import('playwright').Page} pg
     * @param {string} label
     */
    function attachListeners(pg, label) {
      pg.on('request', (req) => {
        const url = req.url();
        const frameUrl = req.frame() ? req.frame().url() : pg.url();
        logger.debug(`[${label}] → ${url.substring(0, 120)}`);
        checkAndSaveStream(url, req.headers(), frameUrl);
      });

      pg.on('response', async (res) => {
        const frameUrl = res.frame() ? res.frame().url() : pg.url();
        const contentType = (res.headers()['content-type'] || '').toLowerCase();
        const isMpegUrl = contentType.includes('mpegurl') || contentType.includes('mpegURL');

        checkAndSaveStream(res.url(), res.request() ? res.request().headers() : {}, frameUrl, isMpegUrl);
        await scanResponseBody(res);
      });
    }

    // ── Ön-Adım: Cloudflare Engeli Olan Domain'lerde HTML'yi Public Proxy Üzerinden Çek ──
    const isBlockedDomain = CLOUDFLARE_BLOCKED_DOMAINS.some(d => targetUrl.toLowerCase().includes(d));
    let prefetchedEmbedUrls = [];
    let pageTitle = '';

    if (isBlockedDomain) {
      logger.info(`[PreFetch] Cloudflare engeli tespit edildi. allorigins proxy ile HTML çekiliyor: ${targetUrl}`);
      const html = await fetchHtmlViaPublicProxy(targetUrl);
      if (html) {
        // Hemen m3u8/mp4 URL var mı kontrol et
        const directStreams = extractEmbedUrlsFromHtml(html, targetUrl);
        for (const u of directStreams) {
          if (u.includes('.m3u8') || u.includes('.txt') || u.includes('master')) {
            checkAndSaveStream(u, {}, targetUrl);
            if (foundStream) {
              logger.info(`[PreFetch] ✅ Direct stream bulundu HTML içinde: ${u}`);
              return { ...foundStream, pageTitle };
            }
          }
        }
        // Title çek
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) pageTitle = titleMatch[1].trim();
        // Embed URL'lerini topla, Playwright bunlara gidecek
        prefetchedEmbedUrls = directStreams.filter(u =>
          !u.includes('.m3u8') && !u.includes('.mp4') &&
          (u.includes('rapidvid') || u.includes('closeload') || u.includes('vidmoly') ||
           u.includes('vidoza') || u.includes('fembed') || u.includes('dood') ||
           u.includes('mixdrop') || u.includes('streamtape') || u.includes('player') ||
           u.includes('embed') || u.includes('/v/') || u.includes('/e/'))
        );
        logger.info(`[PreFetch] ${prefetchedEmbedUrls.length} embed URL bulundu, Playwright'a yönlendiriliyor.`);
      }
    }

    // ── Ana Sayfa (Engellenmiyorsa doğrudan aç) ───────────────────────────────
    const page = await context.newPage();
    attachListeners(page, 'MAIN');

    if (!isBlockedDomain || prefetchedEmbedUrls.length === 0) {
      logger.debug(`[Playwright] Navigating → ${targetUrl}`);
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: Math.min(timeout, 25000) });
        await page.waitForTimeout(4000);
        if (!pageTitle) pageTitle = await page.title().catch(() => '');
        logger.debug(`[Playwright] Başlık: "${pageTitle}"`);

        if (foundStream) return { ...foundStream, pageTitle };
        await checkVideoSrcFromDOM(page, checkAndSaveStream);
        if (foundStream) return { ...foundStream, pageTitle };

        logger.debug(`[Playwright] Play butonları deneniyor...`);
        await tryClickPlayButton(page, PLAY_SELECTORS);
        await page.waitForTimeout(5000);
        if (foundStream) return { ...foundStream, pageTitle };
        await checkVideoSrcFromDOM(page, checkAndSaveStream);
        if (foundStream) return { ...foundStream, pageTitle };
      } catch (navErr) {
        logger.warn(`[Playwright] Ana sayfa navigasyon hatası: ${navErr.message}`);
      }
    } else {
      logger.info(`[Playwright] Engelli domain — ana sayfa atlanıyor, embed URL'lerine doğrudan gidiliyor.`);
    }

    // PreFetch embed URL'lerini doğrudan iFrame listesine ekle
    if (prefetchedEmbedUrls.length > 0) {
      logger.info(`[PreFetch] ${prefetchedEmbedUrls.length} embed URL Playwright embed kuyruğuna ekleniyor.`);
    }

    // ── iFrame Stratejisi ──────────────────────────────────────────────────────
    logger.debug(`[Playwright] iFrame'ler taranıyor...`);
    const frames = page.frames();
    logger.debug(`[Playwright] ${frames.length} frame bulundu.`);

    /** @type {Set<string>} */
    const embedUrls = new Set();

    // PreFetch'ten gelen embed URL'lerini kuyruğa ekle (bunlar engellenmemiş)
    prefetchedEmbedUrls.forEach(u => embedUrls.add(u));

    // DOM'daki lazy-load iframe ve embed URL'lerini topla (data-src, data-url vb.)
    try {
      const domEmbedUrls = await page.evaluate(() => {
        const found = [];
        const attrs = ['data-src', 'data-url', 'data-embed', 'data-link', 'data-video', 'data-lazy-src', 'data-frame', 'src'];
        document.querySelectorAll('iframe, [data-src], [data-url], [data-embed], [data-link], [data-video]').forEach((el) => {
          for (const attr of attrs) {
            const val = el.getAttribute(attr);
            if (val && typeof val === 'string' && /^https?:\/\//i.test(val)) {
              if (!/\.(jpg|jpeg|png|gif|webp|svg|css)(\?.*)?$/i.test(val)) {
                if (!val.includes('youtube.com') && !val.includes('google.com') && !val.includes('facebook.com') && !val.includes('doubleclick')) {
                  found.push(val);
                }
              }
            }
          }
        });
        return [...new Set(found)];
      });
      domEmbedUrls.forEach((u) => embedUrls.add(u));
    } catch {}

    for (const frame of frames) {
      if (frame === page.mainFrame()) continue;
      let frameUrl = frame.url();
      if (!frameUrl || frameUrl === 'about:blank' || frameUrl.startsWith('data:')) continue;

      const innerEmbedUrl = extractEmbedUrl(frameUrl);
      if (innerEmbedUrl) {
        embedUrls.add(innerEmbedUrl);
      } else {
        embedUrls.add(frameUrl);
      }

      logger.debug(`[Playwright] iFrame taranıyor: ${frameUrl}`);

      await tryClickPlayButton(frame, PLAY_SELECTORS);
      await page.waitForTimeout(3000);
      if (foundStream) return { ...foundStream, pageTitle };

      await checkVideoSrcFromDOM(frame, checkAndSaveStream);
      if (foundStream) return { ...foundStream, pageTitle };
    }

    // ── Embed URL'lerine Doğrudan Git ─────────────────────────────────────────

    for (const embedUrl of embedUrls) {
      if (foundStream) break;

      logger.debug(`[Playwright] Embed sayfası açılıyor: ${embedUrl}`);
      const embedPage = await context.newPage();
      attachListeners(embedPage, 'EMBED');

      try {
        await embedPage.goto(embedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: Math.min(timeout, 25000),
          headers: { Referer: targetUrl },
        });

        await embedPage.waitForTimeout(3000);
        if (foundStream) { await embedPage.close().catch(() => {}); break; }
        await checkVideoSrcFromDOM(embedPage, checkAndSaveStream);
        if (foundStream) { await embedPage.close().catch(() => {}); break; }

        const embedClicked = await tryClickPlayButton(embedPage, PLAY_SELECTORS);
        if (embedClicked) {
          logger.debug(`[Playwright] Embed play tıklandı — 6s bekleniyor...`);
          await embedPage.waitForTimeout(6000);
          if (foundStream) { await embedPage.close().catch(() => {}); break; }
          await checkVideoSrcFromDOM(embedPage, checkAndSaveStream);
          if (foundStream) { await embedPage.close().catch(() => {}); break; }
        }

        const embedFrames = embedPage.frames();
        for (const ef of embedFrames) {
          if (ef === embedPage.mainFrame()) continue;
          const efUrl = ef.url();
          if (!efUrl || efUrl === 'about:blank') continue;
          logger.debug(`[Playwright] Embed iFrame: ${efUrl}`);
          checkAndSaveStream(efUrl, {}, efUrl);
          await tryClickPlayButton(ef, PLAY_SELECTORS);
          await embedPage.waitForTimeout(2000);
          if (foundStream) break;
        }

      } catch (e) {
        logger.debug(`[Playwright] Embed hatası: ${e.message}`);
      } finally {
        await embedPage.close().catch(() => {});
      }

      if (foundStream) return { ...foundStream, pageTitle };
    }

    // ── Son Bekleme ────────────────────────────────────────────────────────────

    logger.debug(`[Playwright] Son bekleme (5s)...`);
    await page.waitForTimeout(5000);
    if (foundStream) return { ...foundStream, pageTitle };

    logger.warn(`[Playwright] Stream bulunamadı: ${targetUrl}`);
    return null;

  } finally {
    if (browser) {
      await browser.close();
      logger.debug(`[Playwright] Tarayıcı kapatıldı.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı Fonksiyonlar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DOM'daki video elementlerinin src / currentSrc özelliklerini kontrol eder.
 * @param {import('playwright').Page} page
 * @param {Function} checkFn
 */
async function checkVideoSrcFromDOM(page, checkFn) {
  try {
    const srcs = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('video').forEach((v) => {
        if (v.src)        results.push(v.src);
        if (v.currentSrc) results.push(v.currentSrc);
        v.querySelectorAll('source').forEach((s) => {
          if (s.src) results.push(s.src);
        });
      });
      if (window.Hls && window.hls && window.hls.url) {
        results.push(window.hls.url);
      }
      return [...new Set(results)].filter(Boolean);
    });

    const currentFrameUrl = page.url();
    for (const src of (srcs || [])) {
      checkFn(src, {}, currentFrameUrl);
    }
  } catch {}
}

/**
 * iFrame URL'sinden saklı embed URL'sini çıkarır.
 * @param {string} frameUrl
 * @returns {string | null}
 */
function extractEmbedUrl(frameUrl) {
  try {
    for (const pattern of EMBED_URL_PARAM_PATTERNS) {
      const match = frameUrl.match(pattern);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    }
  } catch {}
  return null;
}

/**
 * CSS seçicilerini sırayla dener; ilk bulduğu elemana tıklar.
 * @param {import('playwright').Page | import('playwright').Frame} ctx
 * @param {string[]} selectors
 * @returns {Promise<boolean>}
 */
async function tryClickPlayButton(ctx, selectors) {
  for (const selector of selectors) {
    try {
      const el = await ctx.$(selector);
      if (!el) continue;
      await el.click({ timeout: 2000, force: true }).catch(async () => {
        await el.evaluate((e) => {
          e.click();
          if (e.dispatchEvent) {
            e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          }
        }).catch(() => {});
      });
      logger.debug(`[Click] ✓ "${selector}"`);
      return true;
    } catch {}
  }

  // Fallback: Frame içindeki video, player veya body elemanlarına tıklamayı zorla
  try {
    const fallbackSelectors = ['#player', '.jwplayer', '#container', 'body'];
    for (const fs of fallbackSelectors) {
      const el = await ctx.$(fs);
      if (el) {
        await el.click({ timeout: 1500, force: true }).catch(async () => {
          await el.evaluate((e) => e.click()).catch(() => {});
        });
        logger.debug(`[Click Fallback] ✓ "${fs}"`);
        return true;
      }
    }
  } catch {}

  return false;
}

module.exports = { resolveStreamUrl };
