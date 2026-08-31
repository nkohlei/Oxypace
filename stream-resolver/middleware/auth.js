/**
 * middleware/auth.js
 *
 * API Güvenlik Doğrulaması (İsteğe Bağlı)
 *
 * Eğer .env içinde `API_SECRET_KEY` tanımlanmışsa, gelen isteklerde
 * `x-api-key` başlığını veya `Authorization: Bearer <KEY>` kontrol eder.
 * Tanımlanmamışsa kontrolü atlar (geliştirme kolaylığı için).
 */

const logger = require('../utils/logger');

function apiKeyAuth(req, res, next) {
  const secretKey = process.env.API_SECRET_KEY;

  // Eğer secret key tanımlanmamışsa koruma kapalıdır, geçişe izin ver
  if (!secretKey || secretKey.trim() === '') {
    return next();
  }

  // /health veya public demo sayfalarını korumaya dahil etme
  if (req.path === '/health' || req.path === '/' || req.path.startsWith('/public')) {
    return next();
  }

  const clientKey =
    req.headers['x-api-key'] ||
    (req.headers['authorization'] && req.headers['authorization'].replace(/^Bearer\s+/i, ''));

  if (!clientKey || clientKey !== secretKey) {
    logger.warn(`[Auth] Yetkisiz erişim denemesi: IP ${req.ip} — Yol: ${req.path}`);
    return res.status(401).json({
      success: false,
      error: 'Yetkisiz istek: Geçersiz veya eksik API anahtarı (x-api-key veya Authorization Bearer gereklidir).',
      code: 'UNAUTHORIZED'
    });
  }

  next();
}

module.exports = { apiKeyAuth };
