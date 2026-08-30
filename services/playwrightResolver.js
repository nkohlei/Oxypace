/**
 * services/playwrightResolver.js
 *
 * Film/dizi sayfasını headless Chromium ile açar, ağ trafiğini izleyerek
 * HLS (.m3u8) veya MP4 video akış URL'sini ve HTTP başlıklarını (Referer, User-Agent, Origin) döner.
 */

import { chromium } from 'playwright';
import vm from 'vm';

const STREAM_PATTERNS = [
  { regex: /master\.m3u8(\?[^"'\s<>]*)?/i,            type: 'm3u8' },
  { regex: /master\.txt(\?[^"'\s<>]*)?/i,             type: 'm3u8' },
  { regex: /index\.m3u8(\?[^"'\s<>]*)?/i,             type: 'm3u8' },
  { regex: /playlist\.m3u8(\?[^"'\s<>]*)?/i,          type: 'm3u8' },
  { regex: /manifest\.m3u8(\?[^"'\s<>]*)?/i,          type: 'm3u8' },
  { regex: /\/hls\/.*\.m3u8(\?[^"'\s<>]*)?/i,         type: 'm3u8' },
  { regex: /\/stream\/.*\.m3u8(\?[^"'\s<>]*)?/i,      type: 'm3u8' },
  { regex: /\.m3u8(\?[^"'\s<>]*)?/i,                  type: 'm3u8' },
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
  { regex: /vidmoly\.[a-z]+\/.*\.m3u8/i,              type: 'm3u8' },
  { regex: /vidoza\.[a-z]+\/.*\.m3u8/i,               type: 'm3u8' },
  { regex: /sibnet\.ru\/.*\.mp4/i,                    type: 'mp4'  },
  { regex: /vk\.com\/.*\.mp4/i,                       type: 'mp4'  },
  { regex: /mail\.ru\/.*\.mp4/i,                      type: 'mp4'  },
  { regex: /ok\.ru\/.*\.m3u8/i,                       type: 'm3u8' },
  { regex: /streamtape\.[a-z]+\/.*\.mp4/i,            type: 'mp4'  },
  { regex: /mixdrop\.[a-z]+\/.*\.m3u8/i,              type: 'm3u8' },
  { regex: /voe\.sx\/.*\.m3u8/i,                      type: 'm3u8' },
  { regex: /\.mp4(\?[^"'\s<>]*)?$/i,                   type: 'mp4'  },
  { regex: /\/video\.mp4/i,                            type: 'mp4'  },
];

const BODY_M3U8_REGEX = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/gi;
const BODY_MP4_REGEX  = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.mp4[^"'\s\\<>{}|^`[\]]*)/gi;

const IGNORE_PATTERNS = [
  /google-analytics\.com/i, /googletagmanager\.com/i, /doubleclick\.net/i,
  /facebook\.com\/tr/i,     /hotjar\.com/i,
  /fonts\.googleapis\.com/i,
  /filmakinesimp4-f9gx1M12BwC/i,
  /\/uploads\/malker\//i,
  /\/theme\/.*\.mp4/i,
  /\.css(\?.*)?$/i, /\.png(\?.*)?$/i, /\.jpg(\?.*)?$/i,
  /\.gif(\?.*)?$/i, /\.webp(\?.*)?$/i, /\.ico(\?.*)?$/i, /\.woff2?(\?.*)?$/i,
  /\.svg(\?.*)?$/i,
];

const SCANNABLE_CONTENT_TYPES = [
  'application/json', 'json', 'text/html', 'html', 'javascript', 'application/javascript', 'text/javascript',
];

const EMBED_URL_PARAM_PATTERNS = [
  /[?&]url=([^&]+)/i,
  /[?&]embed=([^&]+)/i,
  /[?&]src=([^&]+)/i,
  /[?&]link=([^&]+)/i,
  /[?&]file=([^&]+)/i,
];

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

export async function resolveStreamUrl(targetUrl, options = {}) {
  const { timeout = 30000 } = options;
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
        '--disable-gpu', '--disable-extensions',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

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

    let foundStream = null;

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

        if (targetUrl.includes('filmmakinesi') || url.includes('closeload') || (frameUrl && frameUrl.includes('closeload'))) {
          finalReferer = 'https://closeload.filmmakinesi.to/';
        } else if (targetUrl.includes('fullhdfilmizlesene') || url.includes('rapidvid') || (frameUrl && frameUrl.includes('rapidvid'))) {
          finalReferer = 'https://rapidvid.net/';
        } else if (targetUrl.includes('hdfilmcehennemi') || url.includes('cdnimages') || url.includes('playmix') || (frameUrl && frameUrl.includes('hdfilmcehennemi'))) {
          finalReferer = 'https://hdfilmcehennemi.mobi/';
        } else if (rawReferer && /^https?:\/\//i.test(rawReferer) && !rawReferer.startsWith('about:')) {
          finalReferer = rawReferer;
        } else if (frameUrl && /^https?:\/\//i.test(frameUrl) && !frameUrl.startsWith('about:')) {
          finalReferer = frameUrl;
        } else {
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
        console.log(`[StreamResolver] ✅ ${type.toUpperCase()} yakalandı: ${url}`);
      }
    }

    async function scanResponseBody(response) {
      if (foundStream) return;

      const contentType = (response.headers()['content-type'] || '').toLowerCase();
      const shouldScan = SCANNABLE_CONTENT_TYPES.some((t) => contentType.includes(t));
      if (!shouldScan) return;

      const frameUrl = response.frame() ? response.frame().url() : response.url();

      try {
        const body = await response.text();
        if (!body || body.length > 500_000) return;

        const m3u8Matches = [...body.matchAll(BODY_M3U8_REGEX)];
        for (const [, url] of m3u8Matches) {
          if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
            checkAndSaveStream(url, {}, frameUrl);
            if (foundStream) return;
          }
        }

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
                    checkAndSaveStream(val, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
              } catch {}
            }
          }
        }

        if (body.includes('eval(function(p,a,c,k,e,d)')) {
          const packedMatches = [...body.matchAll(/eval\s*\(\s*(function\s*\([^)]*\)\s*\{[\s\S]*?\.split\(['"]\|['"]\)\s*\))\s*\)/gi)];
          for (const m of packedMatches) {
            try {
              const unpacked = vm.runInNewContext('(' + m[1] + ')');
              if (typeof unpacked === 'string') {
                const m3u8Matches = [...unpacked.matchAll(BODY_M3U8_REGEX)];
                for (const [, url] of m3u8Matches) {
                  if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
                    checkAndSaveStream(url, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
                const mp4Matches = [...unpacked.matchAll(BODY_MP4_REGEX)];
                for (const [, url] of mp4Matches) {
                  if (url && !IGNORE_PATTERNS.some((p) => p.test(url))) {
                    checkAndSaveStream(url, {}, frameUrl);
                    if (foundStream) return;
                  }
                }
              }
            } catch {}
          }
        }

        const mp4Matches = [...body.matchAll(BODY_MP4_REGEX)];
        for (const [, url] of mp4Matches) {
          if (!url || IGNORE_PATTERNS.some((p) => p.test(url))) continue;
          checkAndSaveStream(url, {}, frameUrl);
          if (foundStream) return;
        }
      } catch {}
    }

    function attachListeners(pg) {
      pg.on('request', (req) => {
        const url = req.url();
        const frameUrl = req.frame() ? req.frame().url() : pg.url();
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

    const page = await context.newPage();
    attachListeners(page);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(3000);

    const pageTitle = await page.title().catch(() => '');

    if (foundStream) return { ...foundStream, pageTitle };

    await checkVideoSrcFromDOM(page, checkAndSaveStream);
    if (foundStream) return { ...foundStream, pageTitle };

    const clicked = await tryClickPlayButton(page, PLAY_SELECTORS);
    if (clicked) {
      await page.waitForTimeout(6000);
      if (foundStream) return { ...foundStream, pageTitle };
      await checkVideoSrcFromDOM(page, checkAndSaveStream);
      if (foundStream) return { ...foundStream, pageTitle };
    }

    const frames = page.frames();
    const embedUrls = new Set();

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
      if (innerEmbedUrl) embedUrls.add(innerEmbedUrl);
      else embedUrls.add(frameUrl);

      await tryClickPlayButton(frame, PLAY_SELECTORS);
      await page.waitForTimeout(4000);
      if (foundStream) return { ...foundStream, pageTitle };

      await checkVideoSrcFromDOM(frame, checkAndSaveStream);
      if (foundStream) return { ...foundStream, pageTitle };
    }

    for (const embedUrl of embedUrls) {
      if (foundStream) break;

      const embedPage = await context.newPage();
      attachListeners(embedPage);

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
          checkAndSaveStream(efUrl, {}, efUrl);
          await tryClickPlayButton(ef, PLAY_SELECTORS);
          await embedPage.waitForTimeout(2000);
          if (foundStream) break;
        }
      } catch {} finally {
        await embedPage.close().catch(() => {});
      }

      if (foundStream) return { ...foundStream, pageTitle };
    }

    await page.waitForTimeout(5000);
    if (foundStream) return { ...foundStream, pageTitle };

    return null;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function checkVideoSrcFromDOM(page, checkFn) {
  try {
    const srcs = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('video').forEach((v) => {
        if (v.src) results.push(v.src);
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
      return true;
    } catch {}
  }

  try {
    const fallbackSelectors = ['#player', '.jwplayer', '#container', 'body'];
    for (const fs of fallbackSelectors) {
      const el = await ctx.$(fs);
      if (el) {
        await el.click({ timeout: 1500, force: true }).catch(async () => {
          await el.evaluate((e) => e.click()).catch(() => {});
        });
        return true;
      }
    }
  } catch {}

  return false;
}
