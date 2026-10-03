/**
 * services/movieSearchService.js
 *
 * Entegre film sitelerinde (HDFilmCehennemi, FullHDFilmİzlesene vb.)
 * film ve dizi arayarak afiş, başlık ve doğrudan sayfa bağlantılarını döner.
 */

const browserPool = require('./browserPool');
const logger = require('../utils/logger');

// Basit 30 dakikalık in-memory arama önbelleği
const searchCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * @typedef {{
 *   provider: string,
 *   providerKey: string,
 *   title: string,
 *   url: string,
 *   poster: string | null
 * }} MovieSearchResult
 */

/**
 * Verilen film adını desteklenen tüm platformlarda arar.
 * @param {string} rawQuery
 * @returns {Promise<MovieSearchResult[]>}
 */
async function searchMovies(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return [];
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.info(`[MovieSearch] ⚡ Önbellekten arama sonucu döndürüldü: "${query}" (${cached.results.length} sonuç)`);
    return cached.results;
  }

  logger.info(`[MovieSearch] 🔍 Film aranıyor: "${query}"`);
  const allResults = [];

  try {
    await browserPool.acquire(async (browser) => {
      let page = null;
      try {
        page = await browser.newPage({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          locale: 'tr-TR',
          extraHTTPHeaders: {
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          }
        });

        // 1. HDFilmCehennemi Arama (Ajax Dropdown API)
        try {
          logger.info(`[MovieSearch] HDFilmCehennemi taranıyor: "${query}"`);
          await page.goto('https://www.hdfilmcehennemi.nl/', { timeout: 12000, waitUntil: 'domcontentloaded' });
          
          const responsePromise = page.waitForResponse(
            res => res.url().includes('search') && res.url().includes('q=') && res.status() === 200,
            { timeout: 7000 }
          ).catch(() => null);

          const searchInput = await page.$('input[placeholder*="Ara"]');
          if (searchInput) {
            await searchInput.fill(query);
          }

          const hdfResponse = await responsePromise;
          if (hdfResponse) {
            const searchJson = await hdfResponse.json().catch(() => null);
            if (searchJson && Array.isArray(searchJson.results)) {
              for (const itemHtml of searchJson.results) {
                const urlMatch = itemHtml.match(/href="([^"]+)"/);
                const titleMatch = itemHtml.match(/alt="([^"]+)"/) || itemHtml.match(/title="([^"]+)"/);
                const posterMatch = itemHtml.match(/src="([^"]+)"/);
                if (urlMatch && urlMatch[1]) {
                  allResults.push({
                    provider: 'HDFilmCehennemi',
                    providerKey: 'hdfilmcehennemi',
                    title: titleMatch ? titleMatch[1].trim() : 'Film',
                    url: urlMatch[1],
                    poster: posterMatch ? posterMatch[1] : null
                  });
                }
              }
            }
          }
        } catch (hdfErr) {
          logger.warn(`[MovieSearch] HDFilmCehennemi arama uyarısı: ${hdfErr.message}`);
        }

        // 2. FullHDFilmİzlesene Arama
        try {
          logger.info(`[MovieSearch] FullHDFilmİzlesene taranıyor: "${query}"`);
          const fhfSearchUrl = `https://www.fullhdfilmizlesene.now/arama/${encodeURIComponent(query)}`;
          await page.goto(fhfSearchUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });

          const fhfItems = await page.$$eval('.film, article, .poster-kapsa', els => els.map(e => {
            const a = e.querySelector('a') || (e.tagName === 'A' ? e : null);
            const img = e.querySelector('img');
            const title = a?.getAttribute('title') || a?.innerText || img?.getAttribute('alt');
            const poster = img?.getAttribute('data-src') || img?.getAttribute('data-original') || img?.src;
            return {
              url: a?.href,
              title: title?.replace(/izle$/i, '')?.trim(),
              poster: (poster && !poster.startsWith('data:')) ? poster : null
            };
          }).filter(x => x.url && x.title && !x.url.includes('/arama/')));

          for (const item of fhfItems) {
            allResults.push({
              provider: 'FullHDFilmİzlesene',
              providerKey: 'fullhdfilmizlesene',
              title: item.title,
              url: item.url,
              poster: item.poster
            });
          }
        } catch (fhfErr) {
          logger.warn(`[MovieSearch] FullHDFilmİzlesene arama uyarısı: ${fhfErr.message}`);
        }

      } finally {
        if (page) await page.close().catch(() => {});
      }
    });
  } catch (poolErr) {
    logger.error(`[MovieSearch] Browser pool hatası: ${poolErr.message}`);
  }

  // Duplicate URL'leri filtrele
  const seenUrls = new Set();
  const uniqueResults = allResults.filter(item => {
    if (!item.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  logger.info(`[MovieSearch] Toplam ${uniqueResults.length} film bulundu: "${query}"`);
  
  if (uniqueResults.length > 0) {
    searchCache.set(cacheKey, { timestamp: Date.now(), results: uniqueResults });
    // En fazla 100 anahtar sakla
    if (searchCache.size > 100) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }
  }

  return uniqueResults;
}

module.exports = {
  searchMovies
};
