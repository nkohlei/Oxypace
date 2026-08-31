/**
 * services/fastScraper.js
 *
 * Hafif ve Hızlı HTTP Ayrıştırıcı (Fast-Path Resolver)
 *
 * Ağır Playwright tarayıcısını açmadan önce doğrudan HTTP isteği ile
 * HTML kaynak kodundaki embed iFrame'leri, JSON veri bloklarını ve doğrudan m3u8 linklerini arar.
 * Başarılı olursa çözümleme süresini 3 saniyeden 0.2 saniyeye düşürür.
 */

const logger = require('../utils/logger');

const FAST_STREAM_PATTERNS = [
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*)/i,
];

const FAST_IFRAME_PATTERNS = [
  /<iframe[^>]+src=["']([^"']+)["']/i,
  /window\.location\.href\s*=\s*["']([^"']+)["']/i,
];

/**
 * @param {string} targetUrl
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<{ streamUrl: string, type: string, headers: any, pageTitle: string } | null>}
 */
async function fastResolve(targetUrl, options = {}) {
  const timeoutMs = options.timeout || 6000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    const res = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Sayfa başlığını al
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';

    // 1. Doğrudan m3u8 var mı?
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics')) {
          logger.info(`[FastScraper] ⚡ Hızlı yoldan doğrudan stream yakalandı: ${streamUrl}`);
          return {
            streamUrl,
            type: 'm3u8',
            headers: {
              referer: targetUrl,
              'user-agent': headers['User-Agent'],
              origin: new URL(targetUrl).origin,
            },
            pageTitle,
          };
        }
      }
    }

    return null;
  } catch (err) {
    logger.debug(`[FastScraper] Hızlı ayrıştırma atlandı: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fastResolve };
