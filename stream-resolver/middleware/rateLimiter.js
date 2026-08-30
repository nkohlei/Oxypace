/**
 * middleware/rateLimiter.js
 *
 * Playwright her çağrıda bir Chromium işlemi başlatır; bu yüksek kaynak
 * tüketimine neden olur. Rate limiting ile aşırı/kötü niyetli kullanımı önlüyoruz.
 *
 * Varsayılan: IP başına dakikada 10 istek.
 * RATE_LIMIT_MAX ortam değişkeniyle değiştirilebilir.
 */

const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  // Zaman penceresi: 1 dakika
  windowMs: 60 * 1000,

  // Pencere başına maksimum istek sayısı
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Standart RateLimit-* başlıklarını ekle (RFC 6585)
  standardHeaders: true,
  legacyHeaders: false,

  // Limit aşıldığında dönen yanıt
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil(rateLimiter.windowMs / 1000),
    });
  },

  // IP tespiti için güvenilir proxy desteği
  // Nginx/Cloudflare arkasında çalışıyorsa gereklidir
  // skip: (req) => req.ip === '127.0.0.1', // Localhost'u atla (opsiyonel)
});

module.exports = { rateLimiter };
