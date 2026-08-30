# 🚀 Oxypace Web Uygulaması Entegrasyon Rehberi

Film/dizi bağlantılarından `.m3u8` (HLS) / `.mp4` akış bağlantılarını ayıklayan ve Oxypace sohbet odalarında/oynatıcısında sorunsuz çalıştırmanızı sağlayan servis hazır ve aktif durumda!

---

## 1. Servis Bağlantı Noktaları (API Endpoints)

- **Servis Adresi:** `http://localhost:3001` (Varsayılan Port: `3001`)
- **Çözümleme Uç Noktası:** `POST /api/resolve-stream`
- **CORS Stream Proxy:** `GET /api/proxy?url=STREAM_URL&referer=REFERER_URL`
- **Sağlık Kontrolü:** `GET /health`

---

## 2. Sohbet Odasından Gelen URL'yi Çözümleme (`POST /api/resolve-stream`)

Kullanıcı sohbet odasına bir film sitesi URL'si yapıştırdığında arka planda bu API'ye `POST` isteği atarak oynatılabilir yayın bilgisini alın.

### İstenen Gövde (JSON):
```json
{
  "url": "https://www.hdfilmcehennemi.nl/batman-kara-sovalye-hd-film-izle-hdf-hdf-7/"
}
```

### Başarılı Yanıt (200 OK):
```json
{
  "status": "success",
  "data": {
    "streamUrl": "https://srv12.cdnimages1574.shop/hls/batman-kara-sovalye.mp4/txt/master.txt",
    "type": "m3u8",
    "pageTitle": "Batman Kara Şövalye izle | Hdfilmcehennemi",
    "headers": {
      "referer": "https://hdfilmcehennemi.mobi/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "origin": "https://hdfilmcehennemi.mobi"
    }
  }
}
```

---

## 3. Oxypace Web Arayüzünde Oynatma (Frontend HLS.js Örneği)

CDN sunucularının koyduğu `Referer` ve `CORS` engelini aşmak için akış URL'sini Oxypace proxy'si üzerinden (`/api/proxy`) oynatıcınıza verin:

```html
<!-- hls.js kütüphanesini ekleyin -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"></script>

<video id="oxypacePlayer" controls style="width: 100%; max-width: 800px; border-radius: 12px;"></video>

<script>
async function playFilmStream(targetUrl) {
  const video = document.getElementById('oxypacePlayer');

  // 1. Stream Resolver API'ye istek at
  const response = await fetch('http://localhost:3001/api/resolve-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl })
  });

  const resData = await response.json();
  if (resData.status !== 'success') {
    alert('Stream çözülemedi: ' + (resData.error?.message || 'Bilinmeyen hata'));
    return;
  }

  const { streamUrl, headers, type } = resData.data;

  // 2. CORS & Referer engellerini aşan Proxy URL'sini oluştur
  const proxyUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(headers.referer)}`;

  // 3. HLS.js ile video oynatıcıya yükle
  if (type === 'm3u8' && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(proxyUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else {
    // Safari (native HLS support) veya MP4 videolar
    video.src = proxyUrl;
    video.play();
  }
}
</script>
```
