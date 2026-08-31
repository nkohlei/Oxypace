# 🌐 Canlı Sunucu (Production) & Cloudflare Bypass Kurulum Rehberi

Bu rehber, **Stream Resolver** microservice'ini gerçek bir Linux sunucuya (VPS) kurarken ve canlı web sitenize entegre ederken **Cloudflare, IP Engelleri ve CORS/Referer** kısıtlamalarını aşmanız için gereken tüm adımları anlatır.

---

## 📌 1. Neden Lokalde Çalışırken Sunucuda Engellenir?

- **Veri Merkezi IP'leri:** Hetzner, DigitalOcean, AWS gibi sunucuların IP blokları Cloudflare ve film CDN'leri tarafından "Datacenter" olarak bilinir ve doğrudan engellenir.
- **Bot Parmak İzi (Fingerprint):** Standart tarayıcı otomasyonları bot olarak işaretlenir.
- **CORS / Referer:** Kullanıcı tarayıcıları üçüncü taraf sitelerin Referer başlığını taklit edemez.

Bu projeye eklediğimiz **Stealth Motoru**, **Residential Proxy Desteği** ve **Gelişmiş Stream Proxy** ile bu engeller çözülmüştür.

---

## 🚀 2. Canlı Sunucuya Kurulum (2 Farklı Yöntem)

### Yöntem A: Docker ile Tek Komutla Kurulum (Önerilen)

En temiz ve zahmetsiz yöntemdir (tüm Chromium bağımlılıkları Docker imajında hazır gelir).

1. Projeyi sunucunuza yükleyin:
   ```bash
   git clone <repo-url> /opt/stream-resolver
   cd /opt/stream-resolver
   ```
2. `.env` dosyanızı oluşturun ve düzenleyin:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Docker Compose ile arka planda başlatın:
   ```bash
   docker compose up -d --build
   ```

---

### Yöntem B: Ubuntu VPS Üzerinde PM2 ile Kurulum

1. Sunucuda Node.js 18+ ve Playwright sistem kütüphanelerini kurun:
   ```bash
   # Ubuntu bağımlılıkları
   sudo apt update && sudo apt install -y curl git
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
2. Proje dizininde bağımlılıkları ve Chromium'u kurun:
   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```
3. PM2 ile servisi başlatın:
   ```bash
   pm2 start server.js --name "stream-resolver"
   pm2 save
   pm2 startup
   ```

---

## 🛡️ 3. Cloudflare ve IP Engelini Aşmak İçin Proxy Tanımlama

Cloudflare Turnstile veya sıkı IP engeli uygulayan siteleri sunucudan sorunsuz çözmek için `.env` dosyanıza bir **Residential (Ev İnterneti) Proxy** ekleyin:

```env
# .env dosyası
PROXY_SERVER=http://p.webshare.io:80
PROXY_USERNAME=kullanici_adiniz
PROXY_PASSWORD=sifreniz
```

> **İpucu:** Webshare.io, IPRoyal veya Smartproxy gibi sağlayıcılardan aylık çok cüzi (1-2$) ücretlerle "Residential/Rotating Proxy" alabilirsiniz. Bu proxy sayesinde sunucunuz hedef siteye İstanbul'daki bir ev kullanıcısı gibi görünür ve Cloudflare engelleri tamamen kalkar.

---

## 🔒 4. API Güvenliğini Sağlama (API Key)

Sunucunuzun başkaları tarafından gereksiz yere kullanılıp yorulmasını engellemek için `.env` dosyasına gizli bir anahtar belirleyin:

```env
API_SECRET_KEY=CokGizliAnahtar123!
```

Ana web sitenizden istek atarken bu anahtarı HTTP Header olarak gönderin:
```javascript
fetch('https://resolver.siteniz.com/api/resolve-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'CokGizliAnahtar123!'
  },
  body: JSON.stringify({ url: 'https://film-linki.com' })
});
```

---

## 🎬 5. Web Sitenizde Videoyu Oynatma (Frontend Örneği)

Çözülen linki video oynatıcınıza verirken CORS engeline takılmamak için `/api/proxy` rotasını kullanın:

```javascript
// 1. Linki çöz
const res = await fetch('https://resolver.siteniz.com/api/resolve-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'CokGizliAnahtar123!' },
  body: JSON.stringify({ url: filmSayfaUrl })
});
const data = await res.json();

if (data.success) {
  // 2. Proxy URL'sini oluştur
  const proxyStreamUrl = `https://resolver.siteniz.com/api/proxy?url=${encodeURIComponent(data.streamUrl)}&referer=${encodeURIComponent(data.headers.referer || '')}`;
  
  // 3. Hls.js veya Video elementine ver
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(proxyStreamUrl);
    hls.attachMedia(document.getElementById('videoPlayer'));
  }
}
```
