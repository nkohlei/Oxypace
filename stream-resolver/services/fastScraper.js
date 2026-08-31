/**
 * services/fastScraper.js
 *
 * Cloudflare ve ASN engellerini aşan hibrit Scraper & Stream Extractor motoru.
 * ScraperAPI (veya doğrudan HTTP) kullanarak sayfadaki gizlenmiş iframe,
 * packer/eval scriptleri, dinamik dc_ şifre çözücü VM ve doğrudan .m3u8/.mp4/master.txt akışlarını ayıklar.
 */

const vm = require('vm');
const logger = require('../utils/logger');

const FAST_STREAM_PATTERNS = [
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/txt\/master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/playlist\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
];

/**
 * Safely executes the embed page's exact dc_ decoder function in an isolated Node.js VM context
 */
function decodeDcFunction(html) {
  try {
    const fnStart = html.indexOf('function dc_');
    if (fnStart === -1) return null;

    const fnEnd = html.indexOf('\n}\n', fnStart) !== -1 ? html.indexOf('\n}\n', fnStart) + 2 : html.indexOf('}', fnStart);
    if (fnEnd === -1) return null;

    const fnBody = html.substring(fnStart, fnEnd + 1);

    const varStart = html.indexOf('var s_', fnEnd);
    if (varStart === -1) return null;

    const varEnd = html.indexOf(';', varStart);
    if (varEnd === -1) return null;

    const varStatement = html.substring(varStart, varEnd + 1);
    const callExprMatch = varStatement.match(/=\s*([^;]+);/);
    if (!callExprMatch) return null;

    const sandbox = {
      atob: (str) => Buffer.from(str, 'base64').toString('binary'),
      btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
      Math,
      String,
      Array,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,
    };

    vm.createContext(sandbox);
    const script = `${fnBody}\n${varStatement}\n__final_stream__ = ${callExprMatch[1]};`;
    vm.runInContext(script, sandbox, { timeout: 1000 });

    const decoded = sandbox.__final_stream__;
    if (decoded && typeof decoded === 'string' && (decoded.startsWith('http://') || decoded.startsWith('https://'))) {
      logger.info(`[FastScraper] 🔓 VM ile gizli akış linki başarıyla çözüldü: ${decoded}`);
      return decoded;
    }
  } catch (err) {
    logger.debug(`[FastScraper] VM dc_ decode hatası: ${err.message}`);
  }
  return null;
}

/**
 * Unpacks P.A.C.K.E.R. obfuscated code
 */
function unpackJs(packedJs) {
  try {
    const match = packedJs.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*\}\('(.*)',\s*(\d+),\s*(\d+),\s*'(.*?)'\.split\('\|'\)/);
    if (!match) return '';
    let [ , p, a, c, k ] = match;
    a = parseInt(a, 10);
    c = parseInt(c, 10);
    const kArray = k.split('|');
    const eFunc = (c) => (c < a ? '' : eFunc(parseInt(c / a, 10))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36));
    while (c--) {
      if (kArray[c]) {
        p = p.replace(new RegExp('\\b' + eFunc(c) + '\\b', 'g'), kArray[c]);
      }
    }
    return p;
  } catch (err) {
    return '';
  }
}

/**
 * Fetches HTML directly or via ScraperAPI if Cloudflare blocked
 */
async function fetchHtmlWithBypass(targetUrl, referer = '') {
  const apiKey = process.env.SCRAPER_API_KEY || 'dd731ac1103c696ebe32ad67ba329a0e';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
  if (referer) headers['Referer'] = referer;

  // 1. Doğrudan İstek Denemesi
  try {
    const res = await fetch(targetUrl, { headers, redirect: 'follow' });
    if (res.ok) {
      const text = await res.text();
      if (!text.includes('error code: 1005') && !text.includes('Attention Required! | Cloudflare') && !text.includes('Access denied') && !text.includes('403 Forbidden')) {
        return text;
      }
    }
  } catch (e) {
    // Proxy fallback'e geç
  }

  // 2. ScraperAPI Standart Bypass
  if (apiKey) {
    try {
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && !text.includes('Request failed. You will not be charged')) {
          return text;
        }
      }
    } catch (err) {
      logger.warn(`[FastScraper] Standard proxy fetch failed: ${err.message}`);
    }

    // 3. ScraperAPI Ultra-Premium / Render Mode (Cloudflare Korumalı Siteler İçin)
    try {
      const ultraProxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&ultra_premium=true&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(ultraProxyUrl, { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && !text.includes('Request failed. You will not be charged')) {
          return text;
        }
      }
    } catch (err) {
      logger.warn(`[FastScraper] Ultra premium proxy fetch failed: ${err.message}`);
    }
  }

  return '';
}

/**
 * Determines the best Referer and Origin for playback of a given stream / embed URL
 */
function determineRefererAndOrigin(streamUrl, embedUrl, targetUrl) {
  let referer = targetUrl;
  
  if (streamUrl.includes('cdnimages') || streamUrl.includes('playmix') || embedUrl.includes('hdfilmcehennemi') || targetUrl.includes('hdfilmcehennemi')) {
    referer = 'https://hdfilmcehennemi.mobi/';
  } else if (streamUrl.includes('closeload') || embedUrl.includes('closeload') || targetUrl.includes('filmmakinesi')) {
    referer = 'https://closeload.filmmakinesi.to/';
  } else if (streamUrl.includes('rapidvid') || embedUrl.includes('rapidvid') || targetUrl.includes('fullhdfilmizlesene')) {
    referer = 'https://rapidvid.net/';
  } else if (streamUrl.includes('vidmoly') || embedUrl.includes('vidmoly')) {
    referer = 'https://vidmoly.to/';
  } else if (streamUrl.includes('vidoza') || embedUrl.includes('vidoza')) {
    referer = 'https://vidoza.net/';
  } else if (streamUrl.includes('filemoon') || embedUrl.includes('filemoon')) {
    referer = 'https://filemoon.sx/';
  } else if (streamUrl.includes('dood') || embedUrl.includes('dood')) {
    referer = 'https://doodstream.com/';
  } else if (embedUrl && /^https?:\/\//i.test(embedUrl)) {
    referer = embedUrl;
  }

  let origin = referer;
  try {
    origin = new URL(referer).origin;
  } catch (e) {
    origin = targetUrl;
  }

  return { referer, origin };
}

/**
 * @param {string} targetUrl
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<{ streamUrl: string, type: string, headers: any, pageTitle: string } | null>}
 */
async function fastResolve(targetUrl, options = {}) {
  try {
    logger.info(`[FastScraper] 🚀 Sayfa taranıyor: ${targetUrl}`);
    const html = await fetchHtmlWithBypass(targetUrl);
    if (!html) return null;

    // Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    // 1. Check dc_ decoded stream in main page
    const decodedFromMain = decodeDcFunction(html);
    if (decodedFromMain) {
      const { referer, origin } = determineRefererAndOrigin(decodedFromMain, '', targetUrl);
      return {
        streamUrl: decodedFromMain,
        type: 'm3u8',
        headers: {
          referer,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          origin,
        },
        pageTitle,
      };
    }

    // 2. Direct stream pattern in main page
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4')) {
          logger.info(`[FastScraper] ✅ Doğrudan akış bulundu: ${streamUrl}`);
          const { referer, origin } = determineRefererAndOrigin(streamUrl, '', targetUrl);
          return {
            streamUrl,
            type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
            headers: {
              referer,
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              origin,
            },
            pageTitle,
          };
        }
      }
    }

    // 3. Extract Embed iFrames and Players
    const embedUrls = new Set();
    let ifrMatch;
    const ifrRegex = /<iframe[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
    while ((ifrMatch = ifrRegex.exec(html)) !== null) {
      let src = ifrMatch[1];
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('http')) embedUrls.add(src);
    }

    const embedScriptRegex = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+(?:embed|video|player|watch|url|fireplayer|hiveplayer|play)\/[^"'\s\\<>{}|^`[\]]*)/gi;
    let sMatch;
    while ((sMatch = embedScriptRegex.exec(html)) !== null) {
      embedUrls.add(sMatch[1]);
    }

    logger.info(`[FastScraper] Bulunan embed URL sayısı: ${embedUrls.size}`);

    for (const embedUrl of embedUrls) {
      if (embedUrl.includes('google') || embedUrl.includes('doubleclick') || embedUrl.includes('recaptcha') || embedUrl.includes('facebook') || embedUrl.includes('wargamings')) continue;

      logger.info(`[FastScraper] Embed taranıyor: ${embedUrl}`);
      const embedHtml = await fetchHtmlWithBypass(embedUrl, targetUrl);
      if (!embedHtml) continue;

      // Check nested iframes inside embed (e.g. HivePlayer -> FirePlayer / VidMoly)
      const nestedIfr = embedHtml.match(/src\s*=\s*["'](https?:\\\/\\\/[^"']+|https?:\/\/[^"']+)["']/i);
      if (nestedIfr) {
        let nestedUrl = nestedIfr[1].replace(/\\\//g, '/');
        if (nestedUrl.startsWith('http') && !embedUrls.has(nestedUrl)) {
          embedUrls.add(nestedUrl);
        }
      }

      // Check dc_ encoded stream inside embed (Closeload, Rapidrame, Playmix Player)
      const decodedStream = decodeDcFunction(embedHtml);
      if (decodedStream) {
        const { referer, origin } = determineRefererAndOrigin(decodedStream, embedUrl, targetUrl);
        return {
          streamUrl: decodedStream,
          type: decodedStream.endsWith('.mp4') ? 'mp4' : 'm3u8',
          headers: {
            referer,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            origin,
          },
          pageTitle: pageTitle || 'Film / Dizi Akışı',
        };
      }

      // Check unpacked JS / Packer eval
      let searchCorpus = embedHtml;
      if (embedHtml.includes('eval(function(p,a,c,k,e,')) {
        const unpacked = unpackJs(embedHtml);
        if (unpacked) {
          searchCorpus += '\n' + unpacked;
          const unpackedDecoded = decodeDcFunction(unpacked);
          if (unpackedDecoded) {
            const { referer, origin } = determineRefererAndOrigin(unpackedDecoded, embedUrl, targetUrl);
            return {
              streamUrl: unpackedDecoded,
              type: 'm3u8',
              headers: {
                referer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin,
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
          }
        }
      }

      // Check direct stream patterns in embed (excluding bogus schema meta tags and blank placeholders)
      for (const pattern of FAST_STREAM_PATTERNS) {
        const match = searchCorpus.match(pattern);
        if (match && match[1]) {
          const streamUrl = match[1].replace(/\\/g, '');
          if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4')) {
            logger.info(`[FastScraper] ✅ Embed akışı bulundu: ${streamUrl}`);
            const { referer, origin } = determineRefererAndOrigin(streamUrl, embedUrl, targetUrl);

            return {
              streamUrl,
              type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
              headers: {
                referer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin,
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
          }
        }
      }
    }

    return null;
  } catch (err) {
    logger.error(`[FastScraper] Hata: ${err.message}`);
    return null;
  }
}

module.exports = { fastResolve, determineRefererAndOrigin };
