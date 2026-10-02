/**
 * services/cacheService.js
 *
 * Akıllı Önbellek Katmanı (Smart In-Memory TTL Cache)
 *
 * Başarıyla çözümlenen video akışlarını (streamUrl, headers, pageTitle)
 * belirli bir süre (TTL) boyunca bellekte tutar. Aynı URL tekrar istendiğinde
 * ağır tarayıcı süreçlerine girmeden anında (<10ms) yanıt verir.
 */

const logger = require('../utils/logger');

class CacheService {
  /**
   * @param {number} defaultTtlMs - Varsayılan saklama süresi (ms)
   * @param {number} maxItems - Bellekte tutulacak maksimum kayıt sayısı
   */
  constructor(defaultTtlMs = 15 * 60 * 1000, maxItems = 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxItems = maxItems;
    /** @type {Map<string, { value: any, expiresAt: number }>} */
    this.cache = new Map();

    // Periyodik temizlik (her 5 dakikada bir süresi geçmiş kayıtları sil)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  /**
   * @param {string} key
   * @returns {any | null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // LRU tazeleme
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs) {
    if (this.cache.size >= this.maxItems) {
      // En eski anahtarı çıkar (LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Süresi dolmuş kayıtları bellekten atar
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      logger.debug(`[Cache] ${expiredCount} adet süresi dolmuş kayıt temizlendi.`);
    }
  }

  /**
   * Önbelleği temizle
   */
  clear() {
    this.cache.clear();
  }

  get stats() {
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      defaultTtlMs: this.defaultTtlMs,
    };
  }
}

const cacheService = new CacheService(
  parseInt(process.env.CACHE_TTL_MS, 10) || 15 * 60 * 1000,
  parseInt(process.env.CACHE_MAX_ITEMS, 10) || 1000
);

module.exports = cacheService;
