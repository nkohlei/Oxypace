/**
 * middleware/validator.js
 *
 * POST /api/resolve-stream isteğinin gövdesindeki `url` alanını doğrular.
 * Geçersiz veya eksik URL durumunda anlamlı hata mesajı döner.
 */

/**
 * URL doğrulama middleware'i.
 * Başarılıysa req.body.url'i temizlenmiş haliyle next()'e iletir.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateUrl(req, res, next) {
  const { url } = req.body;

  // ── 1. Varlık Kontrolü ───────────────────────────────────────────────────────

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '`url` alanı zorunludur ve boş olamaz.',
      code: 'MISSING_URL',
    });
  }

  // ── 2. Format Kontrolü ───────────────────────────────────────────────────────

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz URL formatı. Lütfen tam bir URL girin (örn: https://site.com/film-izle).',
      code: 'INVALID_URL',
    });
  }

  // ── 3. Protokol Kontrolü ─────────────────────────────────────────────────────

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({
      success: false,
      error: 'Yalnızca HTTP ve HTTPS protokolleri desteklenmektedir.',
      code: 'INVALID_PROTOCOL',
    });
  }

  // ── 4. Temizlenmiş URL'yi İlet ───────────────────────────────────────────────

  req.body.url = parsed.href;
  next();
}

module.exports = { validateUrl };
