/**
 * services/fastScraper.js
 *
 * Cloudflare ve ASN engellerini aşan hibrit Scraper & Stream Extractor motoru.
 * ScraperAPI (veya doğrudan HTTP) kullanarak sayfadaki gizlenmiş iframe,
 * packer/eval scriptleri ve doğrudan .m3u8/.mp4/master.txt akışlarını ayıklar.
 */

const logger = require('../utils/logger');

const FAST_STREAM_PATTERNS = [
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/txt\/master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
];

const IFRAME_PATTERNS = [
  /<iframe[^>]+(?:data-src|src)=["']([^"']+)["']/gi,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+(?:embed|video|player|watch|v)\/[^"'\s\\<>{}|^`[\]]*)/gi,
];

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

    // 1. Direct stream in main page
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js')) {
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

    // 2. Extract Embed iFrames (e.g. closeload, rapidrame, playmix, vidmoly)
    const embedUrls = new Set();
    let ifrMatch;
    const ifrRegex = /<iframe[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
    while ((ifrMatch = ifrRegex.exec(html)) !== null) {
      let src = ifrMatch[1];
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('http')) embedUrls.add(src);
    }

    // Also look for closeload / rapidrame URLs inside javascript strings
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

      // Check unpacked JS / Packer eval
      let searchCorpus = embedHtml;
      if (embedHtml.includes('eval(function(p,a,c,k,e,')) {
        const unpacked = unpackJs(embedHtml);
        if (unpacked) {
          searchCorpus += '\n' + unpacked;
        }
      }

      // Check direct stream patterns in embed
      for (const pattern of FAST_STREAM_PATTERNS) {
        const match = searchCorpus.match(pattern);
        if (match && match[1]) {
          const streamUrl = match[1].replace(/\\/g, '');
          if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js')) {
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

      // Special Closeload / Hdfilmcehennemi CDN Master construct pattern
      const fileSlugMatch = searchCorpus.match(/([a-zA-Z0-9_-]+\.mp4)/i);
      const cdnHostMatch = searchCorpus.match(/(https?:\/\/srv\d+\.[^/]+)/i);
      if (fileSlugMatch && cdnHostMatch) {
        const constructedMasterUrl = `${cdnHostMatch[1]}/hls/${fileSlugMatch[1]}/txt/master.txt`;
        logger.info(`[FastScraper] ✅ Oluşturulan Master CDN akışı: ${constructedMasterUrl}`);
        return {
          streamUrl: constructedMasterUrl,
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

    return null;
  } catch (err) {
    logger.error(`[FastScraper] Hata: ${err.message}`);
    return null;
  }
}

module.exports = { fastResolve };
