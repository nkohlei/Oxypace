/**
 * utils/logger.js
 *
 * Winston tabanlı merkezi logger.
 * Console'a renkli çıktı, /logs klasörüne JSON formatında dosya çıktısı verir.
 *
 * Kullanım:
 *   const logger = require('./utils/logger');
 *   logger.info('Mesaj');
 *   logger.error('Hata', { detail: '...' });
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// logs/ klasörünü oluştur (yoksa)
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, colorize, printf, errors, json } = format;

// Console formatı: "21:30:45 [info]: Mesaj"
const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' }),
  ),
  transports: [
    // Renkli terminal çıktısı
    new transports.Console({
      format: combine(colorize({ all: true }), consoleFormat),
    }),
    // Yalnızca hatalar için ayrı dosya
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 3,
    }),
    // Tüm loglar
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
