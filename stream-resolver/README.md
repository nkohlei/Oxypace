# 🎬 Stream Resolver API

> Oxypace entegrasyonu için — Film/dizi sitelerinden HLS (`.m3u8`) ve MP4 akış URL'lerini Playwright headless tarayıcısıyla çözen REST API servisi.

---

## 🚀 Kurulum

```bash
# 1. Bağımlılıkları yükle + Chromium'u indir (tek seferlik)
npm run setup

# 2. Ortam değişkenlerini yapılandır
cp .env.example .env
# .env dosyasını düzenle → ALLOWED_ORIGINS'e Oxypace domain'ini ekle

# 3. Geliştirme sunucusunu başlat
npm run dev

# 4. Production başlatma
npm start
```

Demo UI: [http://localhost:3001](http://localhost:3001)

---

## 📡 API Kullanımı

### `POST /api/resolve-stream`

```http
POST http://localhost:3001/api/resolve-stream
Content-Type: application/json

{
  "url": "https://www.hdfilmcehennemi.nl/batman-kara-sovalye-hd-film-izle/",
  "timeout": 30000
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "streamUrl": "https://cdn.example.com/hls/master.m3u8?token=abc123",
  "type": "m3u8",
  "headers": {
    "referer": "https://www.hdfilmcehennemi.nl/...",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "origin": "https://www.hdfilmcehennemi.nl"
  },
  "pageTitle": "Batman: Kara Şövalye - HD Film İzle",
  "resolvedIn": 8432
}
```

**Hata Yanıtları:**

| HTTP Kodu | `code` | Açıklama |
|---|---|---|
| `400` | `MISSING_URL` | URL alanı eksik |
| `400` | `INVALID_URL` | Geçersiz URL formatı |
| `404` | `STREAM_NOT_FOUND` | Stream bulunamadı |
| `408` | `TIMEOUT` | Zaman aşımı |
| `429` | `RATE_LIMITED` | Çok fazla istek |
| `500` | `RESOLVER_ERROR` | Sunucu hatası |

---

## 🔌 Oxypace Entegrasyonu

### Seçenek 1: React Component (Tavsiye Edilen)

```jsx
// OxypacePlayer.jsx dosyasını projenize kopyalayın
import OxypacePlayer from './components/OxypacePlayer';

// hls.js'i kurun
// npm install hls.js

function WatchPage() {
  return (
    <OxypacePlayer
      apiBaseUrl="https://api.oxypace.com"  // Kendi API URL'niz
      onStreamFound={(data) => {
        console.log('Stream bulundu:', data.streamUrl);
        console.log('Süre:', data.resolvedIn + 'ms');
      }}
    />
  );
}
```

### Seçenek 2: Fetch API ile Direkt Kullanım

```javascript
// Herhangi bir framework/plain JS ile
async function getStreamUrl(filmPageUrl) {
  const res = await fetch('https://api.oxypace.com/api/resolve-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: filmPageUrl }),
  });

  const data = await res.json();

  if (data.success) {
    const { streamUrl, type, headers } = data;

    if (type === 'm3u8') {
      // hls.js ile oynat
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
    } else {
      // MP4 — native
      videoElement.src = streamUrl;
    }
  }
}
```

---

## 🌐 CORS & Referer Engeli

Bazı CDN'ler `.m3u8` akışlarını `Referer` header kontrolüyle korur.
Frontend'den doğrudan erişim CORS hatası verebilir. Bu durumda:

### Proxy Çözümü (Gerekirse Ekle)

```javascript
// Kendi proxy endpoint'inizi yazın:
// GET /api/proxy-stream?url=ENCODED_M3U8_URL

app.get('/api/proxy-stream', async (req, res) => {
  const { url } = req.query;
  const { referer, origin } = req.query; // Kaydedilen header'lar

  const response = await fetch(url, {
    headers: {
      'Referer': referer || '',
      'Origin': origin || '',
      'User-Agent': 'Mozilla/5.0...',
    },
  });

  res.set('Content-Type', response.headers.get('content-type'));
  response.body.pipe(res);
});
```

---

## ⚙️ Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `3001` | Sunucu portu |
| `LOG_LEVEL` | `info` | `error\|warn\|info\|debug` |
| `DEFAULT_TIMEOUT` | `30000` | Playwright timeout (ms) |
| `ALLOWED_ORIGINS` | `*` | İzin verilen CORS originler |
| `RATE_LIMIT_MAX` | `10` | IP başına max istek/dakika |

---

## 📁 Proje Yapısı

```
stream-resolver/
├── server.js                    ← Express sunucu giriş noktası
├── package.json
├── .env.example                 ← Ortam değişkenleri şablonu
├── routes/
│   └── stream.js                ← /api/resolve-stream endpoint
├── services/
│   └── playwrightResolver.js    ← Playwright çekirdek servisi ⭐
├── middleware/
│   ├── validator.js             ← URL doğrulama
│   └── rateLimiter.js           ← Rate limiting
├── utils/
│   └── logger.js                ← Winston logger
└── public/
    ├── index.html               ← Standalone demo UI
    └── OxypacePlayer.jsx        ← React bileşeni (Oxypace için)
```

---

## 🏭 Production Notları

- **PM2** veya **Docker** ile çalıştırın (otomatik yeniden başlatma için)
- `ALLOWED_ORIGINS`'i production'da mutlaka ayarlayın
- Playwright her istekte yeni bir Chromium açar — sunucunuzun en az **512MB RAM** olduğundan emin olun
- Rate limit'i (`RATE_LIMIT_MAX`) yükünüze göre ayarlayın

---

## 📜 Lisans

Bu proje eğitim ve araştırma amaçlıdır.
Üçüncü taraf içeriklerin izinsiz kullanımı telif hakkı yasalarına aykırı olabilir.
