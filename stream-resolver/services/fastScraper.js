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
];

/**
 * Safely executes the embed page's exact dc_ decoder function in an isolated Node.js VM context
 */
function decodeDcFunction(html) {
  try {
    // Match the exact function definition: function dc_xxxxx(value_parts) { ... }
    const fnMatch = html.match(/function\s+(dc_[a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\}/);
    // Match the exact variable assignment: var s_xxxxx = dc_yyyyy([...]);
    const varMatch = html.match(/var\s+(s_[a-zA-Z0-9_]+)\s*=\s*(dc_[a-zA-Z0-9_]+\s*\(\s*\[[\s\S]*?\]\s*\));/);

    if (fnMatch && varMatch) {
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
      const executionScript = `
        ${fnMatch[0]}
        ${varMatch[0]}
        var __final_decoded_url__ = ${varMatch[1]};
      `;

      vm.runInContext(executionScript, sandbox, { timeout: 1000 });

      const decodedUrl = sandbox.__final_decoded_url__;
      if (decodedUrl && typeof decodedUrl === 'string' && (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://'))) {
        logger.info(`[FastScraper] 🔓 VM ile asıl gizli CDN stream linki çözüldü: ${decodedUrl}`);
        return decodedUrl;
      }
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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  };
  if (referer) headers['Referer'] = referer;

  // 1. Direct fetch attempt
  try {
    const res = await fetch(targetUrl, { headers, redirect: 'follow' });
    if (res.ok) {
      const text = await res.text();
      if (!text.includes('error code: 1005') && !text.includes('Attention Required! | Cloudflare')) {
        return text;
      }
    }
  } catch (e) {
    // Continue to proxy
  }

  // 2. ScraperAPI Bypass
  if (apiKey) {
    try {
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers });
      if (res.ok) {
        return await res.text();
      }
    } catch (err) {
      logger.warn(`[FastScraper] Proxy fetch failed: ${err.message}`);
    }
  }

  return '';
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
      return {
        streamUrl: decodedFromMain,
        type: 'm3u8',
        headers: {
          referer: 'https://hdfilmcehennemi.mobi/',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          origin: 'https://hdfilmcehennemi.mobi',
        },
        pageTitle,
      };
    }

    // 2. Direct stream pattern in main page
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno')) {
          logger.info(`[FastScraper] ✅ Doğrudan akış bulundu: ${streamUrl}`);
          return {
            streamUrl,
            type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
            headers: {
              referer: targetUrl,
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              origin: new URL(targetUrl).origin,
            },
            pageTitle,
          };
        }
      }
    }

    // 3. Extract Embed iFrames
    const embedUrls = new Set();
    let ifrMatch;
    const ifrRegex = /<iframe[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
    while ((ifrMatch = ifrRegex.exec(html)) !== null) {
      let src = ifrMatch[1];
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('http')) embedUrls.add(src);
    }

    const embedScriptRegex = /(https?:\/\/[^"'\s\\<>{}|^`[\]]+(?:embed|video|player|watch)\/[^"'\s\\<>{}|^`[\]]*)/gi;
    let sMatch;
    while ((sMatch = embedScriptRegex.exec(html)) !== null) {
      embedUrls.add(sMatch[1]);
    }

    logger.info(`[FastScraper] Bulunan embed URL sayısı: ${embedUrls.size}`);

    for (const embedUrl of embedUrls) {
      if (embedUrl.includes('google') || embedUrl.includes('doubleclick') || embedUrl.includes('recaptcha')) continue;

      logger.info(`[FastScraper] Embed taranıyor: ${embedUrl}`);
      const embedHtml = await fetchHtmlWithBypass(embedUrl, targetUrl);
      if (!embedHtml) continue;

      // Check dc_ encoded stream inside embed (Closeload, Rapidrame, Playmix Player)
      const decodedStream = decodeDcFunction(embedHtml);
      if (decodedStream) {
        let effectiveReferer = 'https://closeload.filmmakinesi.to/';
        if (embedUrl.includes('hdfilmcehennemi') || decodedStream.includes('cdnimages') || decodedStream.includes('playmix')) {
          effectiveReferer = 'https://hdfilmcehennemi.mobi/';
        } else if (embedUrl.includes('rapidvid')) {
          effectiveReferer = 'https://rapidvid.net/';
        }

        return {
          streamUrl: decodedStream,
          type: decodedStream.endsWith('.mp4') ? 'mp4' : 'm3u8',
          headers: {
            referer: effectiveReferer,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            origin: new URL(effectiveReferer).origin,
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
            return {
              streamUrl: unpackedDecoded,
              type: 'm3u8',
              headers: {
                referer: 'https://hdfilmcehennemi.mobi/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin: 'https://hdfilmcehennemi.mobi',
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
          }
        }
      }

      // Check direct stream patterns in embed (excluding bogus schema meta tags)
      for (const pattern of FAST_STREAM_PATTERNS) {
        const match = searchCorpus.match(pattern);
        if (match && match[1]) {
          const streamUrl = match[1].replace(/\\/g, '');
          if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno')) {
            logger.info(`[FastScraper] ✅ Embed akışı bulundu: ${streamUrl}`);
            let effectiveReferer = 'https://closeload.filmmakinesi.to/';
            if (embedUrl.includes('hdfilmcehennemi') || streamUrl.includes('cdnimages') || streamUrl.includes('playmix')) {
              effectiveReferer = 'https://hdfilmcehennemi.mobi/';
            } else if (embedUrl.includes('rapidvid')) {
              effectiveReferer = 'https://rapidvid.net/';
            }

            return {
              streamUrl,
              type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
              headers: {
                referer: effectiveReferer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin: new URL(effectiveReferer).origin,
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

module.exports = { fastResolve };
