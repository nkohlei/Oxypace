/**
 * services/browserPool.js
 *
 * Tarayıcı Havuzu ve Eşzamanlılık Yöneticisi (Browser Pool & Concurrency Limiter)
 *
 * - Tek bir Chromium örneğini sıcak (warm) tutarak her istekte sıfırdan tarayıcı açma maliyetini önler.
 * - Eşzamanlı sekme sayısını sınırlar (Queue), sunucunun RAM/CPU aşımıyla çökmesini engeller.
 * - Belirli sayıda istekten veya süreden sonra bellek temizliği için tarayıcıyı otomatik yeniler (Recycling).
 */

const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());

const logger = require('../utils/logger');

class BrowserPool {
  constructor() {
    /** @type {import('playwright').Browser | null} */
    this.browser = null;
    this.isInitializing = false;
    this.initPromise = null;

    // Eşzamanlılık ve Kuyruk Yapılandırması
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_RESOLVES, 10) || 6;
    this.activeWorkers = 0;
    /** @type {Array<() => void>} */
    this.queue = [];

    // Bellek Sızıntısı Koruması (Her 200 işlemde bir tarayıcıyı yenile)
    this.requestCount = 0;
    this.maxRequestsBeforeRecycle = 200;
  }

  /**
   * Tarayıcı örneğini başlatır veya mevcut olanı döner.
   */
  async getBrowser() {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        const proxyServer = process.env.PROXY_SERVER || 'socks5://127.0.0.1:9050';
        const proxyUsername = process.env.PROXY_USERNAME;
        const proxyPassword = process.env.PROXY_PASSWORD;

        const launchOptions = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        };

        if (proxyServer && proxyServer.trim() !== '') {
          launchOptions.proxy = {
            server: proxyServer.trim(),
            ...(proxyUsername && { username: proxyUsername.trim() }),
            ...(proxyPassword && { password: proxyPassword.trim() }),
          };
          logger.info(`[BrowserPool] Stealth Proxy devrede: ${proxyServer.replace(/\/\/.*@/, '//***@')}`);
        }

        logger.info('[BrowserPool] Yeni Chromium ana süreci başlatılıyor...');
        this.browser = await chromium.launch(launchOptions);
        this.requestCount = 0;

        this.browser.on('disconnected', () => {
          logger.warn('[BrowserPool] Chromium bağlantısı koptu.');
          this.browser = null;
        });

        return this.browser;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Eşzamanlılık kuyruğu üzerinden bir görev çalıştırır.
   * @template T
   * @param {(browser: import('playwright').Browser) => Promise<T>} taskFn
   * @returns {Promise<T>}
   */
  async acquire(taskFn) {
    if (this.activeWorkers >= this.maxConcurrent) {
      logger.debug(`[BrowserPool] Kuyrukta bekleniyor (Aktif: ${this.activeWorkers}, Bekleyen: ${this.queue.length + 1})`);
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.activeWorkers++;
    this.requestCount++;

    try {
      // Gerekirse tarayıcıyı geri dönüştür
      if (this.requestCount >= this.maxRequestsBeforeRecycle && this.activeWorkers === 1) {
        logger.info('[BrowserPool] Bellek optimizasyonu için tarayıcı geri dönüştürülüyor...');
        await this.recycle();
      }

      const browser = await this.getBrowser();
      return await taskFn(browser);
    } finally {
      this.activeWorkers--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  /**
   * Tarayıcıyı güvenli şekilde kapatıp sıfırlar.
   */
  async recycle() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (err) {
        logger.warn(`[BrowserPool] Kapatma hatası: ${err.message}`);
      }
      this.browser = null;
    }
  }

  /**
   * Graceful shutdown (Sunucu durdurulurken tüm süreçleri temizler)
   */
  async close() {
    if (this.browser) {
      logger.info('[BrowserPool] Tarayıcı kapatılıyor...');
      await this.browser.close();
      this.browser = null;
    }
  }
}

const browserPool = new BrowserPool();
module.exports = browserPool;
