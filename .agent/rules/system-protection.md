# Oxypace Sistem Koruma ve Regresyon Önleme Kuralları

Bu kurallar, bir özelliği düzenlerken çalışan başka bir sistemi (WebRTC canlı oda ses/görüntü, FCM bildirim izolasyonu, medya paylaşımı vb.) bozmamak için **her zaman** uygulanmalıdır:

## 1. Derleme ve Dağıtım Öncesi Zorunlu Doğrulama (`npm run verify`)
- Herhangi bir kod değişikliğinden sonra, `bundle:push`, `mobile:build` veya `git push` çalıştırmadan önce mutlaka `npm run verify` çalıştırılmalıdır (`mobile:build` ve `build:client` içine otomatik entegre edilmiştir).
- `no-undef` (tanımsız değişken, ör. `rState is not defined`, `fetchPosts is not defined`) veya `jsx-no-undef` hataları sıfır toleransla engellenir.

## 2. WebRTC Canlı Oda (Ses / Görüntü / Ekran Paylaşımı) Koruması (`VoiceContext.jsx`)
- **Unified Plan Eşleşme Kuralı:** `createPeerConnection` içinde ses veya görüntü için **asla** boş `pc.addTransceiver('audio')` veya `pc.addTransceiver('video')` kullanılmamalıdır. Her zaman `createPlaceholderVideoTrack()` ve `createPlaceholderAudioTrack()` ile `pc.addTrack(track, localStreamRef.current)` kullanılmalıdır.
- **Aktif Transceiver Hedefleme:** `toggleMicrophone` ve `handleVideoOffer` içinde ses transceiver'ı aranırken mutlaka `t.mid !== null` olan (SDP ile eşleşmiş) transceiver hedeflenmelidir.
- **Donanım Kapatma Sırası:** Mikrofon veya kamera kapatılırken önce `replaceTrack(placeholderTrack)` ile sahte (sessiz/siyah) track'e geçiş yapılmalı, **ancak ondan sonra** fiziksel `track.stop()` çağrılmalıdır.
- **Ekran Paylaşımı Sesi Ayrımı:** `pc.ontrack` içinde gelen ses track'i yalnızca `stream.id === tracks.screenStreamId` veya `track.label` açıkça `screen`/`system`/`tab` içeriyorsa `tracks.screenAudio` olarak sınıflandırılmalıdır; aksi halde her zaman mikrofon sesi (`tracks.audio`) olarak işlenmelidir.

## 3. Tek Oturum (Single-Session) FCM Bildirim İzolasyonu ve Görünümü
- Uygulamada aynı anda yalnızca **1 aktif hesap** oturumu açıktır. Hızlı geçiş için kaydedilen diğer hesapların oturumu açık değildir.
- Hesap geçişlerinde, giriş/çıkışlarda ve uygulama açılışında cihazın FCM token'ı diğer tüm hesaplardan (`$pull`) temizlenmeli ve native Android `CallManager.setActiveAccount` ile `active_session_user_id` senkronize edilmelidir.
- Portal bildirimlerinde sol taraftaki yuvarlak ikonda (`largeIcon` / `senderAvatar`) **her zaman** portalın kendi avatarı yer almalı; gönderi içeriğindeki görsel/video/GIF/PDF kapağı ise yalnızca büyük önizleme (`imageUrl` / `BigPictureStyle`) alanında gösterilmelidir.

## 4. Çift Platform (Web + Mobil OTA) Senkron Dağıtım Kuralı
- Ön yüz (`client/src`) değişiklikleri yapıldığında hem:
  1. Mobil OTA paketi (`npm run bundle:push` -> `130.61.26.105` sunucusunda `/downloads/bundle.zip` güncellemesi ve `pm2 reload oxypace-backend`),
  2. Web (`git push origin main` -> Netlify `https://oxypace.com.tr` derlemesi)
  birlikte güncellenmeli ve her ikisinin de canlıya geçtiği doğrulanmalıdır.

