/**
 * server.js
 *
 * Stream Resolver API — Giriş Noktası
 *
 * Başlatmak için:
 *   npm run dev    → Geliştirme (nodemon ile otomatik yeniden başlatma)
 *   npm start      → Production
 *
 * İlk kurulum için:
 *   npm run setup  → Bağımlılıkları yükle + Chromium indir
 */

const path = require('path');
// Ortam değişkenlerini yükle (.env dosyasından - mutlak yol ile)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const streamRoutes = require('./routes/stream');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

/**
 * CORS Yapılandırması
 *
 * Oxypace domain'ini ALLOWED_ORIGINS ortam değişkenine ekle.
 * Örnek .env:
 *   ALLOWED_ORIGINS=https://oxypace.com,https://www.oxypace.com
 */
app.use(cors());

// JSON body parser (maksimum 10KB — güvenlik için sınır)
app.use(express.json({ limit: '10kb' }));

// Demo frontend için statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// ─── Request Loglama ──────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  const { method, path: reqPath, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${method} ${reqPath} → ${res.statusCode} | ${duration}ms | ${ip}`);
  });

  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// API rotaları
app.use('/api', streamRoutes);

/**
 * GET /health
 * Uptime monitörleri ve container health check'ler için sağlık kontrolü.
 * Docker HEALTHCHECK, Kubernetes livenessProbe vb. bu endpoint'i kullanabilir.
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'stream-resolver',
    version: require('./package.json').version,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Demo frontend — tarayıcıda test için
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// iFrame Player — Oxypace veya herhangi bir sitede 1 satır iframe ile oynatma
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint bulunamadı: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
});

// ─── Global Hata Yönetimi ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`Global hata: ${err.message}`, { stack: err.stack });

  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      error: 'Bu kaynaktan erişim izni verilmemiştir.',
      code: 'CORS_ERROR',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Sunucu hatası oluştu.',
    code: 'INTERNAL_ERROR',
  });
});

// ─── Sunucuyu Başlat ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`🚀 Stream Resolver API başlatıldı — http://localhost:${PORT}`);
  logger.info(`📺 Demo UI: http://localhost:${PORT}/`);
  logger.info(`🔍 API: POST http://localhost:${PORT}/api/resolve-stream`);
  logger.info(`💚 Health: GET http://localhost:${PORT}/health`);

  if (process.env.NODE_ENV !== 'production') {
    logger.warn('⚠️  Geliştirme modu — CORS tüm originlere açık. Production\'da ALLOWED_ORIGINS ayarlayın.');
  }
});

// Beklenmedik hatalar için process'i çökme olmadan ele al
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Kritik hata → process'i yeniden başlat (PM2 / Docker otomatik yeniden başlatacak)
  process.exit(1);
});
