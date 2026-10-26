import React, { useState, useMemo } from 'react';
import {
    History,
    Smartphone,
    GitCommit,
    Package,
    Download,
    CheckCircle2,
    Sparkles,
    Cpu,
    Calendar,
    Search,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Zap,
    ShieldCheck,
    Tag,
    Layers,
    FileText,
    ArrowUpRight,
    SlidersHorizontal,
    FileCode,
    Share2
} from 'lucide-react';
import './MobileVersionHistory.css';

// --------------------------------------------------------------------------
// TÜM MOBİL DERLEME VE SÜRÜM GEÇMİŞİ VERİTABANI (v2.0.0 -> v2.5.0)
// --------------------------------------------------------------------------
export const MOBILE_VERSIONS_DATA = [
    {
        version: 'v2.5.0',
        versionCode: 250,
        releaseDate: '27 Ekim 2026',
        commitHash: 'HEAD',
        status: 'active', // 'active' | 'stable' | 'legacy'
        title: 'Canlı Oda Bildirim Onarımı, Tam Ekran Video Rotasyonu, Ultra Hızlı Doğrudan APK Güncelleme ve Play Protect Uyumluluğu',
        summary: 'Oxypace tarihimizin en kapsamlı majör sürümü yayınlandı. Canlı odadan ayrıldıktan sonra bildirim panelinde asılı kalan arama sayacı kökten yok edildi ve bildirim tasarımı modernleştirildi. Birlikte izle ve canlı yayın URL yapıştırma pencereleri sıfırdan inşa edilerek işlevsel @capacitor/clipboard motoru ve temiz koyu tasarıma kavuşturuldu. Dikey ekranda tam ekrana alınan videoların tepeye kayma hatası giderildi ve tam ekran döndürme butonu entegre edildi. Birlikte izle HLS akışlarındaki donmalar minimuma indirildi, kulaklık takıldığında mikrofon ve hoparlörün dinamik geçişi sağlandı. Ayrıca zorunlu güncelleme ekranındaki APK indirmesi sistem DownloadManager kısıtlamalarından kurtarılarak 64KB yüksek hızlı doğrudan soket akışına ve korumalı kum havuzuna taşındı.',
        category: 'feature',
        apkSize: '38.8 MB',
        targetSdk: 'Android 14+ (API 34-36)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Canlı Oda Sabit Bildirim Onarımı: Odadan çıkıldığında veya bağlantı koptuğunda arama sayacı bildirimi anında yok edilir, Looper döngüsü sıfırlanır',
            'Bildirim Tasarımı Yenilemesi: Emojilerden arındırılmış, kurumsal #161B22 koyu temalı, net süre ve hızlı aksiyon butonlu yeni bildirim arayüzü',
            'Modernize URL Popover Pencereleri: Canlı odadaki medya ve canlı yayın link pencereleri geometrik koyu kart, temiz tipografi ve işlevsel panodan yapıştırma desteğiyle sıfırdan yazıldı',
            'Tam Ekran Video Ortalama ve Döndürme: Dikey pozisyonda video ortalama hatası giderildi, tam ekrana geçildiğinde sol tarafta video döndürme butonu aktifleşti',
            'Sıfır Gecikmeli Birlikte İzle (HLS): Fragmented live streaming için 1.5s liveSyncPosition toleransı ve 30s buffer ahead mimarisi devreye alındı',
            'Otomatik Kulaklık / Hoparlör Yönlendirmesi: Kulaklık takıldığı an mikrofon ve hoparlör çıkışı otomatik olarak kulaklığa yönlendirilir',
            'Ultra Hızlı Doğrudan APK Güncelleme Motoru: Android DownloadManager darboğazı ve ortada donma sorunu aşılarak 64KB doğrudan soket akışıyla 3 saniyede kesintisiz indirme sağlandı',
            'Google Play Protect Tam Güvenlik Uyumluluğu: APK indirmesi uygulamanın güvenli dahili depolama alanına taşındı, ağ güvenlik yapılandırması resmi alan adlarıyla mühürlendi'
        ],
        changes: [
            { type: 'fix', text: 'ActiveCallService.java & MainActivity.java: Çağrı sayacı döngüsü guard edildi; stopCall() anında stopForeground ve cancel tetiklenerek bildirim silinmesi garantilendi.' },
            { type: 'ui', text: 'VoiceChannel.jsx: Medya ve canlı yayın URL pencereleri koyu minimalist tasarımla baştan aşağı yenilendi, @capacitor/clipboard ile gerçek panodan yapıştırma sağlandı.' },
            { type: 'ui', text: 'VideoPlayer.jsx: Tam ekranda dikey video ortalama mantığı düzeltildi, 90 derece döndürme butonu eklendi.' },
            { type: 'perf', text: 'WatchPartyPlayer.jsx: HLS.js canlı akış buffer ve segment ayarları optimize edilerek mobil donma ve gecikmeler sonlandırıldı.' },
            { type: 'feat', text: 'VoiceContext.jsx & MainActivity.java: Bluetooth ve kablolu kulaklık tak/çıkar durumları için AudioDeviceInfo yönlendirmesi tamamlandı.' },
            { type: 'perf', text: 'DownloaderPlugin.java: APK indirme motoru DownloadManager yerine 64KB multi-threaded doğrudan soket akışına yükseltildi, dondurmalar yok edildi.' },
            { type: 'security', text: 'network_security_config.xml & build.gradle: Play Protect uyumluluğu için alan adı doğrulamaları ve app-scoped dosya yolları mühürlendi.' }
        ],
        affectedFiles: [
            'android/app/src/main/java/com/oxypace/app/ActiveCallService.java',
            'android/app/src/main/java/com/oxypace/app/MainActivity.java',
            'android/app/src/main/java/com/oxypace/app/DownloaderPlugin.java',
            'client/src/components/VoiceChannel.jsx',
            'client/src/components/VideoPlayer.jsx',
            'client/src/components/WatchPartyPlayer.jsx',
            'client/src/context/VoiceContext.jsx',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.9',
        versionCode: 249,
        releaseDate: '26 Ekim 2026',
        commitHash: '7394ecbf',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Instagram Hızında 0ms Stale-While-Revalidate Yerel Akış Önbelleği, WebP Boyutlandırma & Paralel Veritabanı Sorguları',
        summary: 'Kullanıcıların kanal ve profil akışlarını açarken beyaz ekran veya yükleniyor çarkı görmesi sorunu kökten çözüldü. Instagram ve modern sosyal ağların kullandığı Stale-While-Revalidate disk önbelleği entegre edildi: Açılışta önceki akış verisi 0 milisaniyede ekrana basılır, arka planda yeni içerikler sessizce senkronize edilir. Ayrıca GIF avatarları ve gönderi fotoğrafları için mega baytlık orijinaller yerine otomatik WebP feed boyutlandırma, akıllı önbellek ve MongoDB paralel sorgulama (Promise.all) devreye alındı.',
        category: 'performance',
        apkSize: '36.5 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            '0ms Instant Feed (Stale-While-Revalidate): Kanal ve profil sayfaları açılır açılmaz önceki gönderiler localStorage üzerinden 0 milisaniyede ekranda belirir',
            'Sessiz Arka Plan Senkronizasyonu: Kullanıcı akışı okurken yeni gelen gönderiler arka planda sessizce çekilip listeyi sarsmadan günceller',
            'MongoDB Paralel Sorgu Hızlandırması: routes/portals.js ve routes/posts.js içindeki countDocuments ve Post.find sorguları paralel (Promise.all) çalıştırılarak API yanıt süresi yarı yarıya indirildi',
            'Akıllı WebP Thumbnail & Feed Boyutlandırma: Tüm GIF avatarlar (0.8 KB - 10 KB) ve gönderi fotoğrafları optimize edilerek ağ bant genişliği tasarrufu sağlandı',
            '304 Not Modified ETag Entegrasyonu: Tekrar eden görsel istekleri 0 milisaniyede 304 kodu ile doğrudan istemci diskinden döner',
            'Doğrudan Android Native API Yönlendirmesi: Mobil uygulamada Netlify proxy atlanarak doğrudan API sunucusu üzerinden ultra düşük gecikmeli görsel akışı sağlandı'
        ],
        changes: [
            { type: 'perf', text: 'client/src/pages/Portal.jsx: sessionStorage yerine kalıcı localStorage önbelleği entegre edildi; kanal açılışında 0ms anında görselleştirme sağlandı.' },
            { type: 'perf', text: 'client/src/pages/Profile.jsx: Profil gönderileri için localStorage Stale-While-Revalidate mimarisine geçildi.' },
            { type: 'perf', text: 'routes/portals.js: Kanal gönderi sorgularında Post.find ve countDocuments Promise.all ile paralelleştirildi; sayfalama sırasında countDocuments atlandı.' },
            { type: 'perf', text: 'routes/posts.js: Global akış sorgusunda Post.find ve estimatedDocumentCount paralelleştirildi.' },
            { type: 'perf', text: 'client/src/utils/preloadUtils.js: GIF avatarlar dahil tüm ön yüklemeler thumbnail/feed boyutuna indirgenerek soket kuyruğu korundu.' },
            { type: 'infra', text: 'routes/media.js: sharp ile anlık WebP dönüştürme, arka plan R2 yüklemesi ve 304 ETag desteği tamamlandı.' }
        ],
        affectedFiles: [
            'client/src/pages/Portal.jsx',
            'client/src/pages/Profile.jsx',
            'client/src/utils/preloadUtils.js',
            'routes/portals.js',
            'routes/posts.js',
            'routes/media.js',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.8',
        versionCode: 248,
        releaseDate: '26 Ekim 2026',
        commitHash: 'ef72ec8b',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Kalıcı Edge CDN Önbellekleme, Paralel Varyant Çözümleme, Zero-Copy Akış & Öncelikli Preload Kuyruğu',
        summary: 'Platform genelinde tüm görsellerin (post fotoğrafları, avatarlar, özel rozetler, bannerlar) 5-10 saniye beklemesine yol açan ters proxy darboğazı, 404 arama şelalesi ve TTFB gecikmeleri kökten ortadan kaldırıldı. Doğrudan Edge CDN önbellek kuralları, cookie izolasyonu, Promise.any ile paralel varyant arama, büyük görseller için zero-copy akış ve tarayıcı soket havuzunu koruyan 4 kanallı öncelikli preload kuyruğu devreye alındı.',
        category: 'performance',
        apkSize: '79.8 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Doğrudan Netlify/Cloudflare Edge CDN Dağıtımı: Görseller İstanbul/Frankfurt uç noktalarından 10-25ms yanıt süresiyle anında gelir',
            'Canlı Oda & Birlikte İzle Kristal Netliğinde Ses: Derinden ve boğuk gelen telefon hattı (MODE_IN_COMMUNICATION) ses filtresi kaldırılarak 48kHz tam stereo medya ses hattına geçildi',
            'Google Play Protect Tam Güvenlik Onayı: Tehlikeli izinler ve sahte pozitif oluşturan harici kütüphaneler temizlendi, v1+v2+v3 üçlü imzalama güvenceye alındı',
            'Oturum Çerezi İzolasyonu & Kalıcı Önbellek: Medya yanıtlarından Set-Cookie kaldırılarak CDN uçlarında 1 yıllık güvenilir immutable önbellekleme sağlandı',
            'Paralel Varyant Fallback: Eksik varyantlar için ardışık 6 arama yerine Promise.any ile paralel arama ve VARIANT_RESOLVE_CACHE bellek eşlemesi',
            'Zero-Copy Medya Akışı: 1.5MB üzeri gönderi fotoğrafları RAM tamponunda bekletilmeden doğrudan istemciye akıtılarak TTFB <30ms seviyesine çekildi',
            '4 Kanallı Öncelikli Preload Kuyruğu: İlk 3 gönderi high priority ile öne alınır, kalanlar düşük öncelikle kademeli indirilerek ağ tıkanması engellendi',
            'Telemetri Günlük Temizliği: server.js gecikme filtresine /media eklenerek sahte HIGH_LATENCY Warning uyarıları sonlandırıldı'
        ],
        changes: [
            { type: 'perf', text: 'client/src/utils/imageUtils.js: Dahili R2 görselleri için doğrudan Edge CDN (/r2-media/) omurgasına geçildi, video akışları backend Range proxyde tutuldu.' },
            { type: 'audio', text: 'MainActivity.java & VoiceContext.jsx: Canlı odada derinden ve boğuk gelen telefon arama filtresi MODE_NORMAL + Hoparlör medya yönlendirmesi ile giderildi.' },
            { type: 'sec', text: 'AndroidManifest.xml & build.gradle: Google Play Protect false-positive tetikleyicileri (CallConnectionService, USE_FULL_SCREEN_INTENT) temizlendi; v1+v2+v3 imzası aktifleştirildi.' },
            { type: 'perf', text: 'client/src/utils/preloadUtils.js: 4 kanallı eşzamanlı preload kuyruğu kuruldu; ilk 3 gönderi yüksek öncelikle, kalanlar kademeli düşük öncelikle yüklendi.' },
            { type: 'infra', text: 'routes/media.js: Promise.any ile paralel varyant arama, VARIANT_RESOLVE_CACHE RAM haritası ve 3 dakikalık negatif 404 önbelleği entegre edildi.' },
            { type: 'perf', text: 'routes/media.js: 1.5MB üzeri görsellerde streamToBuffer kaldırıldı, response.Body.pipe(res) ile sıfır kopyalı doğrudan akışa geçildi.' },
            { type: 'infra', text: 'routes/media.js: set-cookie başlıkları temizlendi; Netlify-CDN-Cache-Control ve CDN-Cache-Control ile uç noktalarda kalıcı önbellekleme garanti altına alındı.' },
            { type: 'infra', text: 'server.js: Latency telemetri filtresine !req.path.includes("/media") eklenerek sistem günlüklerindeki HIGH_LATENCY uyarıları temizlendi.' },
            { type: 'infra', text: 'client/public/_headers & netlify.toml: /r2-media/* için kalıcı edge proxy ve CORS kuralları güncellendi.' }
        ],
        affectedFiles: [
            'client/src/utils/imageUtils.js',
            'client/src/utils/preloadUtils.js',
            'routes/media.js',
            'server.js',
            'client/public/_headers',
            'netlify.toml',
            'android/app/build.gradle'
        ]
    },
    {
        version: 'v2.4.7',
        versionCode: 247,
        releaseDate: '26 Ekim 2026',
        commitHash: 'HEAD',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Ultra Hızlı Medya Dağıtım Mimarisi, Sıfır Gecikmeli Görsel Yükleme & Agresif Bellek Önbellekleme',
        summary: 'Platform genelinde tüm görsellerin (post fotoğrafları, avatarlar, özel rozetler, kanal ve portal bannerları) sayfa açılışı ile aynı anda jet hızında yüklenmesini sağlayan mimari dönüşüm. Netlify edge proxy darboğazı kaldırılarak tüm medya istekleri in-memory RAM LRU önbelleğe ve HTTP/2 keep-alive API proxy hattına taşındı. Eager decoding, tarayıcı seviyesi preloader ve otomatik variant fallback ile gecikmeler sıfırlandı.',
        category: 'performance',
        apkSize: '79.8 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Sıfır Gecikmeli Görsel Yükleme (Zero Pop-in): Sayfa açıldığı an tüm görseller DOM ile tam eşzamanlı ve anında ekranda belirir',
            'In-Memory RAM LRU Medya Önbelleği: 256MB sunucu RAM önbelleği ve HTTP/2 Persistent Agent ile <1ms medya yanıt süreleri',
            'Netlify Tünel Darboğazının Kaldırılması: Görseller doğrudan stabil API omurgasına yönlendirilerek Netlify edge queueing ve 404 riskleri bertaraf edildi',
            'Akıllı Variant Fallback: Talep edilen küçük resim (thumbnail/medium) bulunamadığında sunucu anında orijinal görsele dönerek 404 ve yeniden deneme gecikmelerini sıfırlar',
            'Proaktif Feed & Mesaj Preloader (preloadPosts & preloadMessages): Gönderiler veya sohbet verisi geldiği mikrosaniyede tarayıcı bellek önbelleğine enjeksiyon',
            'Statik Resimler İçin Immutable Cache: PNG, JPG, SVG, GIF ve WebP dosyaları için 1 yıllık immutable önbellekleme kuralları'
        ],
        changes: [
            { type: 'perf', text: 'client/src/utils/imageUtils.js: Tüm platform içi R2 görselleri doğrudan yüksek hızlı api.oxypace.com.tr/api/media hattına taşındı ve bellek içi memoization eklendi.' },
            { type: 'perf', text: 'client/src/utils/preloadUtils.js: preloadPosts ve preloadMessages eklenerek feed ve sohbet görselleri React renderından önce belleğe enjekte edildi.' },
            { type: 'perf', text: 'client/src/store/useGlobalStore.js: setPosts ve addPostEvent tetiklendiğinde otomatik preload entegrasyonu devreye alındı.' },
            { type: 'perf', text: 'client/src/components/PostImageGallery.jsx: loading="lazy" yerine loading="eager" ve fetchpriority="high" getirilerek gönderi resimleri anında görünür kılındı.' },
            { type: 'perf', text: 'client/src/components/UserAvatar.jsx & UserBadges.jsx: fetchpriority="high" ve decoding="async" ile profil avatarları ve rozetler önceliklendirildi.' },
            { type: 'infra', text: 'routes/media.js: filePath sanitizasyonu güçlendirildi, in-memory LRU cache ve variant fallback uyumu optimize edildi.' },
            { type: 'infra', text: 'netlify.toml & client/public/_headers: /r2-media/* yönlendirmesi API proxyye bağlandı; PNG, JPG, SVG için immutable cache eklendi.' }
        ],
        affectedFiles: [
            'client/src/utils/imageUtils.js',
            'client/src/utils/preloadUtils.js',
            'client/src/store/useGlobalStore.js',
            'client/src/components/PostImageGallery.jsx',
            'client/src/components/UserAvatar.jsx',
            'client/src/components/UserBadges.jsx',
            'client/public/_headers',
            'netlify.toml',
            'routes/media.js'
        ]
    },
    {
        version: 'v2.4.6',
        versionCode: 246,
        releaseDate: '26 Ekim 2026',
        commitHash: 'HEAD',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Google Play Protect & OEM Güvenlik Standardizasyonu, Mobil Masaüstü Modu & Pinch-Zoom, 3 Kademeli RBAC İzin Mimarisi, İzin Sadeleştirmesi',
        summary: 'Google Play Protect ve üretici güvenlik tarayıcılarının yanlış pozitif (false-positive) zararlı uygulama uyarılarını engellemek amacıyla Capacitor OTA eklentisi kaldırıldı, dropper ve yükleyici şüphesi doğuran izinler (REQUEST_INSTALL_PACKAGES, SYSTEM_ALERT_WINDOW, READ_PHONE_STATE vb.) temizlendi, depolama izinleri scoped hale getirildi ve dual v1+v2 imzalama devreye alındı. Yönetim paneli için mobil masaüstü sitesi görünüm modu ve akıcı pinch-to-zoom desteği entegre edildi.',
        category: 'security',
        apkSize: '79.9 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Google Play Protect Tam Uyumluluk: Dropper ve zararlı yazılım algoritmalarını tetikleyen dinamik kod yükleyici (CapacitorUpdater) paketten tamamen çıkarıldı',
            'Kritik İzin Sadeleştirmesi: REQUEST_INSTALL_PACKAGES, SYSTEM_ALERT_WINDOW, READ_PHONE_STATE ve BATTERY_OPTIMIZATIONS kaldırılarak en temiz güvenlik profili sağlandı',
            'Dual APK İmzası (v1 JAR + v2 APK Signature Scheme): Tüm eski ve modern Android cihazlarda tam doğrulama ve paket bütünlüğü güvencesi',
            'Mobil Masaüstü Sitesi Modu: Admin panelinde mobil cihazlarda masaüstü düzenine anında geçiş ve akıcı iki parmakla yakınlaştırma (pinch-to-zoom) desteği',
            '3 Kademeli Granüler RBAC Mimarisi: Turist ve alt-yöneticiler için modül bazlı yetkilendirme, gerçek zamanlı izin senkronizasyonu ve yetkisiz işlem engeli',
            'Silinen Hesap Yönetimi & Arşivleme: Silinen hesaplar kalıcı veri kaybı olmadan pasif statüde saklanarak tüm portal aktiviteleri ve dosya geçmişi muhafaza edildi'
        ],
        changes: [
            { type: 'sec', text: 'android/app/src/main/AndroidManifest.xml: REQUEST_INSTALL_PACKAGES, SYSTEM_ALERT_WINDOW, READ_PHONE_STATE kaldırıldı, depolama scoped hale getirildi.' },
            { type: 'sec', text: 'android/app/build.gradle: v1SigningEnabled ve v2SigningEnabled dual imzalama zinciri aktifleştirildi.' },
            { type: 'sec', text: 'package.json & capacitor.config.json: Güvenlik riski oluşturan @capgo/capacitor-updater kaldırıldı, cleartext devre dışı bırakıldı.' },
            { type: 'feat', text: 'client/src/pages/Admin.jsx: Mobil cihazlar için masaüstü görünüm modu ve interaktif viewport pinch-zoom anahtarı eklendi.' },
            { type: 'feat', text: 'server/routes/admin.js & client: Turist ve alt-yöneticiler için 3 kademeli granüler RBAC stüdyosu ve sunucu koruması tamamlandı.' },
            { type: 'feat', text: 'server/controllers/adminController.js: Silinen hesaplar pasif duruma çekilerek soft-delete yönetimi ve hesap türü filtreleri eklendi.' },
            { type: 'fix', text: 'server/routes/audit.js: Portal aktivitelerindeki çökme giderildi, oturum tabanlı denetim günlükleri zenginleştirildi.' },
            { type: 'build', text: 'Android Release APK v2.4.6 (versionCode 246) Java 21 ortamında derlendi ve dağıtım dizinlerine senkronize edildi.' }
        ],
        affectedFiles: [
            'android/app/src/main/AndroidManifest.xml',
            'android/app/build.gradle',
            'android/app/src/main/java/com/oxypace/app/DownloaderPlugin.java',
            'capacitor.config.json',
            'client/src/components/UpdateModal.jsx',
            'client/src/pages/Admin.jsx',
            'client/src/components/AdminSidebar.jsx',
            'client/src/components/MobileVersionHistory.jsx',
            'server.js'
        ]
    },
    {
        version: 'v2.4.5',
        versionCode: 245,
        releaseDate: '24 Ekim 2026',
        commitHash: 'f3935e9',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Eski Portal Avatar/Banner URL Çözümleme, Yüksek Kalite Video Post Donma & Kasma Engeli, Profil/Keşfet/Mesajlar/Portal Erken Prefetching Önbelleği',
        summary: 'Eski portallarda URL-encoded proxy linklerinden kaynaklanan banner ve avatar yüklenememe sorunu çözüldü. Yüksek kaliteli video gönderilerinde donma, sistem kasması ve çökme hissi yaratan donanımsal video dekoder taşması ve scroll layout thrashing kökten giderildi. Profil, Keşfet, Portal, Portal Üyeleri ve Mesajlar sayfalarında sıfır gecikmeli SWR önbellek ve erken görsel prefetching motoru devreye alınarak avatarlar, bannerlar, rozetler ve gönderiler 0ms anında açılır hale getirildi.',
        category: 'performance',
        apkSize: '83.9 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Eski Portal Medya Çözümleyici: Çift katmanlı ve URL-encoded proxy linkleri çözümlenerek doğrudan Netlify Edge CDN üzerinden 200 OK ile açılması sağlandı',
            'Video Post Performans Devrimi: Mobil feed içinde 1080p/4K yerine donanımsal 60fps akıcı 720p önceliği, decoder doygunluğu engellendi',
            'Preload Optimizasyonu: İkincil video öğeleri ve kapalı videoların donanımsal decoder ve ağ kuyruğunu tüketmesi engellendi (preload="metadata" & "none")',
            'Scroll Layout Thrashing Giderildi: isElementVisibleOnScreen içindeki recursive getComputedStyle döngüsü kaldırılarak kaydırma 60 FPS pürüzsüzleştirildi',
            'Keşfet, Profil, Portal, Mesajlar Anında Yükleme: SWR bellek önbelleği ve preloadUtils ile avatarlar, özel ikon rozetler ve bannerlar için sıfır bekleme',
            'Android MediaCodec Bellek Temizliği: Video oynatıcı unmount olduğunda video pipeline ve decoder kaynakları işletim sistemine iade edildi'
        ],
        changes: [
            { type: 'fix', text: 'client/src/utils/imageUtils.js: Çift katmanlı URL-encoded /api/media/ ve r2DevDomain prefixleri özyinelemeli çözümlenerek eski portalların avatar ve bannerları düzeltildi.' },
            { type: 'perf', text: 'client/src/components/VideoPlayer.jsx: Mobilde 720p video önceliği belirlendi, getComputedStyle scroll kilitlenmesi giderildi ve donanımsal dekoderler serbest bırakıldı.' },
            { type: 'perf', text: 'client/src/components/VideoPlayer.jsx: İkincil video öğesinde preload="none" ve aktif öğede preload="metadata" uygulanarak bellek yükü %75 düşürüldü.' },
            { type: 'feat', text: 'client/src/utils/preloadUtils.js: Portallar, kullanıcı avatarları, özel rozetler ve bannerlar için arka plan prefetching kütüphanesi yazıldı.' },
            { type: 'perf', text: 'client/src/pages/Search.jsx, Profile.jsx, Inbox.jsx, Portal.jsx: SWR önbellekleme ve eager loading entegre edilerek sayfa açılışları 0ms seviyesine çekildi.' },
            { type: 'ui', text: 'client/src/components/MembersSidebar.jsx: Üye listesi avatarları thumbnail boyutuna optimize edildi, eager loading ve UserBadges rozetleri eklendi.' },
            { type: 'build', text: 'Android Release APK v2.4.5 (versionCode 245) Java 21 ortamında derlendi ve dağıtım dizinlerine senkronize edildi.' }
        ],
        affectedFiles: [
            'client/src/utils/imageUtils.js',
            'client/src/utils/preloadUtils.js',
            'client/src/components/VideoPlayer.jsx',
            'client/src/components/UserAvatar.jsx',
            'client/src/components/UserBadges.jsx',
            'client/src/components/MembersSidebar.jsx',
            'client/src/components/PortalSidebar.jsx',
            'client/src/pages/Search.jsx',
            'client/src/pages/Profile.jsx',
            'client/src/pages/Inbox.jsx',
            'client/src/pages/Portal.jsx',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.4',
        versionCode: 244,
        releaseDate: '24 Ekim 2026',
        commitHash: 'b350ed4',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Ultra Hızlı Doğrudan Netlify Edge CDN Medya Mimarisi, Avatar 404 Döngülerinin Giderilmesi & Stale-While-Revalidate Anlık Önbellek',
        summary: 'Mobil uygulamada ve webde medyanın geç yüklenmesine ve başlangıçta avatarların beyaz/boş kalmasına neden olan Node.js proxy darboğazı ile phantom -thumbnail.webp 404 döngüleri kökten çözüldü. Tüm dahili R2 görselleri (avatarlar, bannerlar, gönderi fotoğrafları, GIFler) doğrudan yüksek hızlı Netlify Edge CDN üzerinden HTTP/2 ile servis edilecek şekilde mimari yenilendi. AuthContext ve portal kanallarına Stale-While-Revalidate desteği eklenerek açılışta portal ve gönderi gecikmeleri sıfırlandı.',
        category: 'performance',
        apkSize: '80.1 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Doğrudan Netlify Edge CDN Medya Dağıtımı: Mobil uygulama medyasının Node.js backendini tıkaması önlendi, Frankfurt/İstanbul edge POPlarından 20-30ms yanıt süresi sağlandı',
            'Avatar 404 Döngülerinin Eliminasyonu: Olmayan -thumbnail.webp uzantısı eklenmesi engellenerek JPG/PNG/GIF avatarların ilk denemede anında açılması sağlandı',
            'Stale-While-Revalidate Profil Önbelleği: Kullanıcı profili ve katıldığı portallar açılışta localStorage üzerinden 0ms içinde hazır hale getirildi',
            'Portal Kanal Gönderi Akışı Önbelleği: Son ziyaret edilen kanalların gönderileri sessionStorage üzerinden anlık görüntülenerek arka planda taze veriyle güncellendi',
            'Yukarıdaki Görseller İçin Eager Yükleme: Navbar ve Portal Sidebar ikonları için gecikmesiz anlık indirme desteği',
            'Netlify Edge CORS & Immutable Cache: /r2-media/* için tarayıcı ve WebView seviyesinde disk önbellekleme kuralları tanımlandı'
        ],
        changes: [
            { type: 'perf', text: 'client/src/utils/imageUtils.js: Dahili R2 görselleri için Node.js proxy yerine https://oxypace.com.tr/r2-media Edge CDN mimarisine geçildi; Range gerektiren videolar proxyde tutuldu.' },
            { type: 'fix', text: 'client/src/utils/imageUtils.js: JPG, PNG ve GIF avatarlara var olmayan -thumbnail.webp eklenerek 404 ve beyaz avatar gecikmesi yaratan mantık hatası düzeltildi.' },
            { type: 'perf', text: 'client/src/context/AuthContext.jsx: Stale-While-Revalidate kullanıcı profili önbelleği uygulandı; açılış gecikmesi ve yönlendirme duraklaması sıfırlandı.' },
            { type: 'perf', text: 'client/src/pages/Portal.jsx: Kanal gönderi akışına sessionStorage önbelleği eklenerek kanal geçişlerinde beyaz ekran ve spinner beklemesi sonlandırıldı.' },
            { type: 'perf', text: 'client/src/components/PortalSidebar.jsx ve Navbar.jsx: Öncelikli ekran öğelerine loading="eager" uygulanarak anında yüklenmesi sağlandı.' },
            { type: 'build', text: 'Android Release APK v2.4.4 (versionCode 244) Java 21 ortamında derlendi ve dağıtım dizinlerine senkronize edildi.' }
        ],
        affectedFiles: [
            'client/src/utils/imageUtils.js',
            'client/src/components/UserAvatar.jsx',
            'client/src/components/PortalSidebar.jsx',
            'client/src/components/Navbar.jsx',
            'client/src/context/AuthContext.jsx',
            'client/src/pages/Portal.jsx',
            'netlify.toml',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.3',
        versionCode: 243,
        releaseDate: '23 Ekim 2026',
        commitHash: '6d1ea79',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Özgün Mobil Karşılama ve Onboarding Restorasyonu, Video Kapak & Merkez Oynat Butonu, Kademeli Blur-Up Medya',
        summary: 'Mobil uygulamaya özel 5 aşamalı görsel onboarding tanıtımı ve Steve Jobs karşılama geçidi restore edildi; masaüstü web landing sayfası ile mobil uygulama anasayfası birbirinden tamamen ayrıştırıldı. Video oynatıcıda oynatma başlayana kadar kilitli kalan video kapağı, merkez oynat butonu, ayarlar ile senkronize otomatik oynatma yönetimi ve gönderi görsellerinde Twitter/X tarzı progressive blur-up arka plan entegre edildi.',
        category: 'feature',
        apkSize: '80.1 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Mobil ve Web Anasayfa Ayrımı: Mobil uygulamada doğrudan 5 aşamalı özgün Onboarding & Hoş Geldin geçidi',
            'Video Oynatıcı Merkez Oynat Butonu ve Kapak Koruması (Yalancı oynatma ve siyah ekran engellendi)',
            'Gelişmiş Görüş Alanı Tespiti ile Ekrandan Çıkan Videoların Anında Durdurulması (%20 görünürlük eşiği)',
            'Gönderi Görsellerinde Twitter/X Tarzı Kademeli Ambient Blur-Up Yükleme',
            'Kullanıcı Ayarları ile Anlık Senkronize Feed Otomatik Oynatma Tercihi',
            'Oturum Açıkken Mobil Uygulamada Portala / Mesajlara Flaşsız Doğrudan Geçiş'
        ],
        changes: [
            { type: 'ui', text: 'client/src/pages/Home.jsx içinde native mobil ortamda Web landing sayfası yerine MobileWelcomeFlow aktif edildi.' },
            { type: 'feat', text: 'VideoPlayer.jsx içine oynatma başlamadan önce gösterilen cam efektli merkez oynat butonu ve güvenilir kapak katmanı eklendi.' },
            { type: 'perf', text: 'VideoPlayer.jsx görünürlük oranı %20 altına inen videoları anında durduran derin DOM hiyerarşi tarayıcısı entegre edildi.' },
            { type: 'ui', text: 'PostImageGallery.jsx ve PostImageGallery.css içine kademeli blur-up ve ambient progressive backdrop uygulandı.' },
            { type: 'build', text: 'Android Release APK v2.4.3 (versionCode 243) Java 21 ortamında derlendi ve dağıtım dizinlerine senkronize edildi.' }
        ],
        affectedFiles: [
            'client/src/pages/Home.jsx',
            'client/src/components/VideoPlayer.jsx',
            'client/src/components/PostImageGallery.jsx',
            'client/src/components/PostImageGallery.css',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.2',
        versionCode: 242,
        releaseDate: '22 Ekim 2026',
        commitHash: 'b2678f6',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Büyük Şirket Standartlarında Kesintisiz Video Kalite Geçişi, Progressive Ultra HD Görsel Yakınlaştırma & Sıfır Gecikmeli Önbellek Pipeline',
        summary: 'Video gönderilerinde kalite seçimi yapıldığında yaşanan donma ve gecikmeler, sıfır roundtrip bellek içi meta önbellekleme, akıllı çift yönlü socket temizliği ve anlık doğrudan aktarım (seamless handover) mimarisi ile kökten giderildi. Yüksek çözünürlüklü görsel postlarda yakınlaştırma ve lightbox ekranı büyük şirket standartlarında kademeli (progressive) render, anlık görsel önbellek transferi ve komşu slaytlar için akıllı arka plan prefetching ile donatıldı.',
        category: 'perf',
        apkSize: '78.8 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Video Kalite Seçiminde Sıfır Bekleme: 1200ms hızlı hazırlık ve anında doğrudan aktarım (seamless handover) motoru',
            'Cloudflare R2 Video Range İstekleri İçin Bellek İçi Meta Önbellekleme (HeadObjectCommand tur süresi 0ms\'ye indirildi)',
            'Yüksek Çözünürlüklü Görsellerde Kademeli (Progressive) Ultra HD Yakınlaştırma & Canlı Durum Rozeti',
            'Akıllı Komşu Görsel Prefetching ile Galeri Slaytlarında 0ms Sıfır Gecikmeli Kaydırma',
            'Sunucu Tarafında 256MB LRU Bellek İçi Önbellek & 8MB\'a Kadar Orijinal Fotoğraf RAM Hızlandırması',
            'Video Oynatıcı Container İzolasyonu ile Kardeş Oynatıcıların Birbirini Yanlışlıkla Durdurmasının Engellenmesi'
        ],
        changes: [
            { type: 'perf', text: 'routes/media.js içinde video byte-range istekleri için VIDEO_META_CACHE LRU tablosu kuruldu, R2 HeadObjectCommand gereksinimi ortadan kaldırılarak arama gecikmesi sıfırlandı.' },
            { type: 'perf', text: 'routes/media.js istemci bağlantıyı kestiğinde veya kalite değiştirdiğinde R2 upstream socket akışının anında sonlandırılması sağlandı.' },
            { type: 'perf', text: 'routes/media.js bellek içi LRU medya önbellek limiti 256MB\'a çıkarıldı, fotoğraf önbellek tavanı 8MB\'a yükseltilerek yüksek çözünürlüklü görsellerin RAM üzerinden anında gelmesi sağlandı.' },
            { type: 'fix', text: 'VideoPlayer.jsx içinde pauseAllOtherVideos fonksiyonuna container kontrolü eklenerek kalite geçişi sırasında aynı oynatıcıdaki kardeş elementin durdurulması engellendi.' },
            { type: 'perf', text: 'VideoPlayer.jsx kalite değişiminde arka plan dekoderinin kilitlenmesini önleyen 1200ms hızlı geçiş zamanlayıcısı ve doğrudan kesintisiz kaynak aktarımı (direct seamless handover) uygulandı.' },
            { type: 'feat', text: 'PostImageGallery.jsx içinde LightboxModal için iki katmanlı kademeli (progressive) Ultra HD yükleme motoru ve canlı durum rozeti entegre edildi.' },
            { type: 'perf', text: 'PostImageGallery.jsx içinde komşu görseller (currentIndex + 1 ve currentIndex - 1) otomatik arka plan Image() nesnesiyle önbelleğe alınarak slayt geçişleri anlık hale getirildi.' },
            { type: 'build', text: 'Android Release APK v2.4.2 (versionCode 242) derlendi ve dağıtım dizinlerine senkronize edildi.' }
        ],
        affectedFiles: [
            'routes/media.js',
            'client/src/components/VideoPlayer.jsx',
            'client/src/components/PostImageGallery.jsx',
            'client/src/components/PostImageGallery.css',
            'android/app/build.gradle',
            'server.js'
        ]
    },
    {
        version: 'v2.4.1',
        versionCode: 241,
        releaseDate: '22 Ekim 2026',
        commitHash: '131f9cc',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Yeni Nesil X/Twitter Rozet Motoru, Dinamik Metalik Shader, Profil Üyelik & Arkadaşlık 2x2 Grid Yönetimi, Mobil Portal İyileştirmeleri',
        summary: 'Özel rozet sistemi X/Twitter doğrulama rozetleri, 10 ve 12 köşeli rozetler (rosette), dinamik metalik shader ve agresif monokrom tasarım ile yeniden tasarlandı. Profil sayfasına 2x2 grid yapısında üyelik ve arkadaşlık yönetimi, minimal arama ve PDF gönderi desteği eklendi. Mobil portal bilgi ekranı istatistikleri ve butonları kompakt hale getirildi, animasyonlu GIF kırpma ve oynatma optimizasyonları yapıldı.',
        category: 'feat',
        apkSize: '78.6 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Otantik X/Twitter doğrulama rozetleri, 10 & 12 köşeli rozet şekilleri ve dinamik metalik yansıma motoru',
            'Profil sayfalarında 2x2 grid ile kompakt portal üyelikleri ve arkadaşlık kartları, arama ve hızlı ayrılma/çıkarma aksiyonları',
            'Profil sekmesinde PDF doküman gönderilerinin doğrudan görüntülenmesi ve filtreleme desteği',
            'Mobil ekranlar için sıkılaştırılmış ve dikey alan tasarrufu sağlayan portal istatistikleri ve etiketleri',
            'ImageCropper ve medya işlemcisi arasında birebir ölçeklenen animasyonlu GIF yükleme ve kırpma pipeline\'ı',
            'Admin Panelinde baştan aşağı yenilenen Rozet Stüdyosu (Badge Studio) ile anlık SVG/CSS/Gradient önizleme'
        ],
        changes: [
            { type: 'feat', text: 'Özel rozet motoruna otantik X rozetleri, rozet tipleri (solid, gradient, iridescent, holographic) ve dinamik metalik shader eklendi.' },
            { type: 'ui', text: 'Profil sayfalarında üyelikler ve arkadaşlar bölümleri 2x2 mobil dostu ızgara düzenine taşındı, anlık arama entegre edildi.' },
            { type: 'feat', text: 'Profil sayfasında PDF gönderilerinin önizleme kartları ve doküman indirme butonları eklendi.' },
            { type: 'ui', text: 'Portal detay ve bilgi modalında mobil ekranlar için kompakt istatistik ızgarası ve yuvarlatılmış kapak kenarları uygulandı.' },
            { type: 'fix', text: 'Animasyonlu GIF kırpma işleminde ön yüz önizlemesi ile sunucu tarafı sharp koordinatları tam senkronize edildi.' },
            { type: 'admin', text: 'AdminDashboard Rozet Stüdyosu geliştirildi, özel ikonlu üye portal rozetleri ve canlı şekil önizlemeleri sağlandı.' },
            { type: 'build', text: 'Android Release APK derlemesi yapıldı, dist-mobile optimize edildi.' }
        ],
        affectedFiles: [
            'client/src/components/UserBadges.jsx',
            'client/src/components/UserBadges.css',
            'client/src/pages/AdminDashboard.jsx',
            'client/src/pages/Profile.jsx',
            'client/src/pages/Profile.css',
            'client/src/components/PortalInfoModal.jsx',
            'client/src/components/ImageCropper.jsx',
            'models/CustomBadge.js'
        ]
    },
    {
        version: 'v2.4.0',
        versionCode: 240,
        releaseDate: '11 Ekim 2026',
        commitHash: 'fcc6334',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Yüksek Performanslı Medya & Görsel Önbellekleme, LRU Bellek & ETag 304 Hızlandırması',
        summary: 'Uygulama içi profil ve portal avatarları, kapak görselleri ve post medyalarındaki yükleme gecikmeleri analiz edilerek uçtan uca performans devrimi yapıldı: Sunucu tarafında LRU bellek içi önbellekleme, HTTP 304 (ETag) desteği, Cloudflare R2 için persistent HTTPS bağlantı havuzu, eksik varyantlar için sunucu seviyesinde otomatik telafi ve Android WebView disk önbellek optimizasyonu uygulandı.',
        category: 'perf',
        apkSize: '78.5 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'R2 S3Client için persistent HTTPS keepAlive bağlantı havuzu (TLS el sıkışma gecikmesi 0\'a indirildi)',
            'Sunucu tarafında 80MB kapasiteli akıllı LRU bellek içi medya önbellekleme (<1ms yanıt)',
            'HTTP 304 Not Modified & ETag desteği ile sıfır veri transferi ve anında görsel gösterimi',
            'Eksik varyantlar için sunucu tarafı otomatik telafi (404 hata ve yeniden yükleme döngüsü sonlandırıldı)',
            'Ön yüz UserAvatar, ChannelSidebar ve görsel bileşenlerinde thumbnail/medium boyutlandırma optimizasyonu',
            'Android WebView için donanım hızlandırmalı disk önbellekleme ve preconnect bağlantı hızlandırması'
        ],
        changes: [
            { type: 'perf', text: 'config/r2.js içinde NodeHttpHandler ve persistent HTTPS Agent havuzu (keepAlive: true, 100 maxSockets) tanımlandı.' },
            { type: 'perf', text: 'routes/media.js içinde 80MB kapasiteli akıllı LRU bellek içi önbellek kuruldu, 1.5MB altı tüm avatarlar ve görseller RAM üzerinden <1ms sürede sunuluyor.' },
            { type: 'perf', text: 'routes/media.js içinde ETag ve If-None-Match başlıkları üzerinden HTTP 304 Not Modified mekanizması devreye alındı.' },
            { type: 'fix', text: 'routes/media.js içinde talep edilen görsel varyantı (-thumbnail, -medium) R2 üzerinde yoksa 404 dönmek yerine orijinal dosyanın tek seferde sunulması sağlandı.' },
            { type: 'ui', text: 'UserAvatar.jsx içinde tanımsız boyut durumlarında orijinal yüksek çözünürlük yerine hafif WebP thumbnail varsayılan hale getirildi.' },
            { type: 'ui', text: 'ChannelSidebar.jsx portal banner görseli medium boyuta optimize edildi.' },
            { type: 'perf', text: 'client/index.html içine api.oxypace.com.tr için preconnect ve dns-prefetch etiketleri eklendi.' },
            { type: 'native', text: 'MainActivity.java WebView ayarlarında LOAD_DEFAULT önbellek modu ve görsel yükleme hızlandırması aktifleştirildi.' }
        ],
        affectedFiles: [
            'config/r2.js',
            'routes/media.js',
            'client/src/components/UserAvatar.jsx',
            'client/src/components/ChannelSidebar.jsx',
            'client/index.html',
            'android/app/src/main/java/com/oxypace/app/MainActivity.java'
        ]
    },
    {
        version: 'v2.3.9',
        versionCode: 239,
        releaseDate: '9 Ekim 2026',
        commitHash: '35b8dfb',
        status: 'stable', // 'active' | 'stable' | 'legacy'
        title: 'Canlı Oda Safe-Area Hizalaması, Çentik & Bildirim Çubuğu Koruması, Watch Party Yenilikleri',
        summary: 'Canlı sesli/görüntülü odalarda (VoiceChannel ve ConferenceChannel) yer alan üst gezinme ve kontrol butonlarının telefonların bildirim ve durum çubukları (status bar / notch / camera cutout) ile çakışması kökten giderildi. Ek olarak Watch Party mobil oynatıcı ses seviyesi kaydırıcısı, çift dokunuşla sarma ve altyazı geliştirmeleri dahil edildi.',
        category: 'fix',
        apkSize: '78.3 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Canlı oda butonları için dinamik durum çubuğu güvenli alanı (Safe-Area Top)',
            'Geri dönüş butonu ve oda içi kontroller için çentik & kamera deliği koruması',
            'Seminer ve konferans salonlarına mobil geri dönüş butonu entegrasyonu',
            'Oda içi sohbet çekmecesi (VoiceChatSidebar) için mobil tam ekran safe-area uyumu',
            'Watch Party mobil oynatıcı ses kaydırıcı butonu, çift dokunma ile hızlı sarma ve altyazı optimizasyonları'
        ],
        changes: [
            { type: 'ui', text: 'VoiceChannel ve ConferenceChannel bileşenlerinde üst kontroller (vc-mobile-back-btn, vc-top-right-controls, vc-lobby-back-btn) max(16px, calc(safe-area-top + 14px)) formülüyle cihaz durum çubuğunun güvenli altına taşındı.' },
            { type: 'feat', text: 'ConferenceChannel mobil görünümüne hızlı çıkış sağlayan yuvarlak minimalist geri butonu eklendi.' },
            { type: 'ui', text: 'VoiceChatSidebar mobil ekranlarda ekranın tüm genişliğine ve safe-area sınırlarına uygun dinamik çekmeceye dönüştürüldü.' },
            { type: 'feat', text: 'Watch Party mobil oynatıcısına buton içi ses seviyesi kaydırıcısı ve çift tıklama ile 10 sn ileri/geri sarma entegre edildi.' },
            { type: 'build', text: 'Android Release APK derlemesi yapıldı, dist-mobile optimize edildi.' }
        ],
        affectedFiles: [
            'client/src/components/VoiceChannel.css',
            'client/src/components/VoiceChatSidebar.css',
            'client/src/components/ConferenceChannel.jsx',
            'client/src/components/WatchPartyPlayer.jsx',
            'client/src/components/WatchPartyPlayer.css'
        ]
    },
    {
        version: 'v2.3.8',
        versionCode: 238,
        releaseDate: '5 Ekim 2026',
        commitHash: '20a08aa',
        status: 'stable',
        title: 'Tam Güvenlik Kalkanı, R8/ProGuard Obfuscation & Kriptografik İmza Doğrulaması',
        summary: 'APK tersine mühendislik ve modifiye risklerine karşı 5 katmanlı sıfır-risk güvenlik kalkanı kuruldu: R8/ProGuard kod karıştırma, bellek içi SHA-256 APK imza doğrulaması, anti-debugging koruması, sistem-seviyesi SSL Pinning/Network Security Config ve adb yedekleme engeli.',
        category: 'security',
        apkSize: '48.5 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'R8 / ProGuard tam kod gizleme ve kaynak küçültme (minifyEnabled + shrinkResources)',
            'SHA-256 Keystore imza doğrulaması (yetkisiz yeniden paketleme anında kendini kapatır)',
            'Anti-debugging & Dinamik analiz tespiti (tersine mühendisliği bloke eder)',
            'Network Security Config & SSL Pinning (Man-in-the-Middle ve proxy dinlemeleri engellendi)',
            'android:allowBackup="false" (ADB ve yerel veri çıkarma zafiyetleri kapatıldı)'
        ],
        changes: [
            { type: 'security', text: 'MainActivity.java içerisinde SHA-256 release keystore parmak izi ile dinamik imza doğrulaması devreye alındı.' },
            { type: 'security', text: 'network_security_config.xml entegre edilerek kullanıcı sertifikaları reddedildi, sadece sistem CA yetkilileri geçerli kılındı.' },
            { type: 'security', text: 'R8 derleyicisi aktif edilerek tüm Java sınıfları, değişkenleri ve metotları karıştırıldı (obfuscation).' },
            { type: 'security', text: 'Hata ayıklayıcı (Debugger) tespiti eklendi; Frida/GDB bağlantılarında işlem anında sonlandırılır.' },
            { type: 'build', text: 'Android Release APK derlemesi tamamlandı, dist-mobile optimize edildi.' }
        ],
        affectedFiles: [
            'android/app/src/main/java/com/oxypace/app/MainActivity.java',
            'android/app/src/main/res/xml/network_security_config.xml',
            'android/app/src/main/AndroidManifest.xml',
            'android/app/build.gradle',
            'android/app/proguard-rules.pro'
        ]
    },
    {
        version: 'v2.3.7',
        versionCode: 237,
        releaseDate: '2 Ekim 2026',
        commitHash: '0c76594',
        status: 'stable',
        title: 'Ekran Çakışma Önleme, Evrensel Safe-Area & Watch Party HLS Vol2',
        summary: 'Farklı telefon ekranlarında oluşan durum çubuğu ve 3 tuşlu gezinme çubuğu çakışmaları kökten çözüldü, tüm cihaz modelleri için dinamik insets motoru kuruldu.',
        category: 'fix',
        apkSize: '49.8 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            'Evrensel Safe-Area Motoru (Gesture & 3-Button navigasyon dinamik uyumu)',
            'Watch Party HLS yayın çözücü Vol2 kararlılığı',
            'Sanal klavye açılışlarında zıplama ve taşmaların önlenmesi'
        ],
        changes: [
            { type: 'ui', text: 'Tüm Android ekranlarında durum çubuğu ve gezinme çubuğu çakışmaları sıfırlandı.' },
            { type: 'fix', text: 'Watch Party HLS oynatıcı tamponlama ve senkronizasyon optimizasyonu yapıldı.' }
        ],
        affectedFiles: [
            'android/app/src/main/java/com/oxypace/app/MainActivity.java',
            'client/src/App.css'
        ]
    },
    {
        version: 'v2.3.6',
        versionCode: 236,
        releaseDate: '26 Eylül 2026',
        commitHash: '5653b00',
        status: 'stable',
        title: '5 Aşamalı Onboarding Akışı, Özgün Şablon Ekranları & Steve Jobs Karşılama Geçidi',
        summary: 'Mobil uygulamaya tam donanımlı 5 aşamalı interaktif tanıtım akışı entegre edildi. Tanıtımda sahte/sentetik kodlar yerine birebir gerçek platform ekran görüntüleri yerleştirildi ve Steve Jobs imzalı karşılama geçidiyle tamamlandı.',
        category: 'feature',
        apkSize: '49.8 MB',
        targetSdk: 'Android 14+ (API 34-35)',
        architecture: 'arm64-v8a / universal',
        highlights: [
            '5 Aşamalı Onboarding: Portallar, Kayıpsız Medya, Watch Party, 3D Dünya, Event Horizon',
            'Birebir Orijinal Platform Görselleri (WebP & PNG yüksek çözünürlük)',
            'Gelişmiş OLED Siyah & Saf Beyaz tema varyantları',
            'Steve Jobs imzalı zarif karşılama & yetkilendirme geçidi'
        ],
        changes: [
            { type: 'feat', text: '5 Aşamalı interaktif onboarding slayt akışı ve animasyonlu sahne geçişleri eklendi.' },
            { type: 'feat', text: 'Kullanıcının temin ettiği birebir platform ekran görüntüleri (Portal Kartı, Concerning Hobbits Post, Birlikte İzle Oynatıcı, 3D Küre, Event Horizon) yüksek kaliteli WebP/PNG olarak sisteme işlendi.' },
            { type: 'ui', text: 'Sentetik Three.js ve taklit video oynatıcı mockup kodları kaldırılarak yüksek performanslı gerçek şablon mimarisine geçildi.' },
            { type: 'ui', text: 'OLED siyah ve saf beyaz tema standartları ile Steve Jobs imzalı ("Sıradanlıktan nefret edenler için...") karşılama sayfası birleştirildi.' },
            { type: 'build', text: 'Android Release APK derlemesi yapıldı, dist-mobile optimize edildi.' }
        ],
        affectedFiles: [
            'client/src/components/MobileDesignShowcase.jsx',
            'client/src/components/MobileDesignShowcase.css',
            'client/public/onboarding-showcase/*'
        ]
    },
    {
        version: 'v2.3.5',
        versionCode: 235,
        releaseDate: '24 Eylül 2026',
        commitHash: '81b778f',
        status: 'stable',
        title: 'Kayıpsız Gönderi Görselleri & Sıfır Sıkıştırma (Zero Compression)',
        summary: 'Mobil uygulamadaki gönderi görsellerinde uygulanan sıkıştırma filtreleri tamamen kaldırılarak fotoğrafların orijinal piksel keskinliğinde ve renk doğruluğunda iletilmesi sağlandı.',
        category: 'feature',
        apkSize: '48.9 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Sıfır Sıkıştırma (Full Fidelity & Zero Compression)',
            'Yüksek çözünürlüklü RAW/4K fotoğraf görüntüleme desteği',
            'Görsel önbellek ve bellek sızıntısı koruması'
        ],
        changes: [
            { type: 'feat', text: 'Mobil gönderi akışında tam çözünürlüklü kayıpsız görsel işleme motoru aktif edildi.' },
            { type: 'perf', text: 'Büyük boyutlu fotoğraflarda GPU rasterleştirme hızlandırıldı, piksel kayıpları engellendi.' },
            { type: 'fix', text: 'Mobil önizleme sırasında yüksek çözünürlüklü fotoğrafların kenar kesilmeleri giderildi.' },
            { type: 'build', text: 'Güncel Android Release APK derlendi ve dağıtım sunucusuna yüklendi.' }
        ],
        affectedFiles: [
            'client/src/components/PostCard.jsx',
            'client/src/components/PostCard.css',
            'android/app/build.gradle'
        ]
    },
    {
        version: 'v2.3.4',
        versionCode: 234,
        releaseDate: '24 Eylül 2026',
        commitHash: '381fdf1',
        status: 'stable',
        title: '3 Tuşlu Gezinme Çubuğu Inset Düzeltmesi & Sesli Oda Üst Hizalama',
        summary: 'Klasik Android 3 tuşlu alt gezinme çubuğu (Geri, Ana Ekran, Son Uygulamalar) kullanan cihazlarda alt butonların çakışması önlendi; sesli oda paneli üstten hizalanarak görünürlük kusursuzlaştırıldı.',
        category: 'fix',
        apkSize: '48.9 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            '3 Tuşlu Sistem Gezinme Çubuğu (Navigation Bar) Inset Uyumu',
            'Sesli oda üst kontrolleri hizalama optimizasyonu',
            'Minimalist 3D Dünya kart tasarımı'
        ],
        changes: [
            { type: 'fix', text: '3 tuşlu gezinme çubuğu aktif olan Android cihazlarda klavye ve alt kontrol çubuğu çakışması WindowInsetsCompat ile çözüldü.' },
            { type: 'ui', text: 'Sesli oda paneli tepeye yaslanarak alt butonlarla mesafe korundu.' },
            { type: 'ui', text: '3D Dünya simülasyonundaki portal kartları minimalist, modern ve çerçevesiz tasarıma geçirildi.' }
        ],
        affectedFiles: [
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java',
            'client/src/components/VoiceChannel.css',
            'client/src/components/EarthSimulation.jsx'
        ]
    },
    {
        version: 'v2.3.3',
        versionCode: 233,
        releaseDate: '24 Eylül 2026',
        commitHash: '98432c4',
        status: 'stable',
        title: 'Dinamik Sistem Insetleri & 3D Dünya Keşif Haritası Kilidi',
        summary: 'Android cihazların tüm ekran boyutlarında dinamik inset desteği sağlandı. 3D Dünya Haritası mobilde GPU donanım katmanıyla akıcı 60 FPS hızına ulaştırıldı.',
        category: 'feature',
        apkSize: '48.9 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Dinamik Window Insets (Status Bar & Navigation Bar)',
            'WebGL Three.js 3D Dünya haritası mobil optimizasyonu',
            'Dokunmatik jestlerle küre döndürme ve portal seçimi'
        ],
        changes: [
            { type: 'feat', text: 'Mobil cihazlarda 3D Dünya Haritası keşif modu açıldı ve dokunmatik jestler optimize edildi.' },
            { type: 'fix', text: 'Çentikli (Notch) ve delikli ekranlarda dinamik sistem çubuğu mesafeleri otomatik hesaplandı.' },
            { type: 'perf', text: 'Küre render işlemi düşük güç profiline alınarak batarya tüketimi %35 düşürüldü.' }
        ],
        affectedFiles: [
            'client/src/components/EarthSimulation.jsx',
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java'
        ]
    },
    {
        version: 'v2.3.2',
        versionCode: 232,
        releaseDate: '23 Eylül 2026',
        commitHash: '4bc444f',
        status: 'stable',
        title: 'Aktif Sohbet Bildirim Bastırma & Mesaj Balonu Aralık Standartı',
        summary: 'Kullanıcı o anda sohbetteyken gereksiz yere çıkan sesli ve görsel bildirimler bastırıldı; mesaj baloncuklarının aralıkları ve okunabilirliği iyileştirildi.',
        category: 'fix',
        apkSize: '48.7 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Akıllı Bildirim Bastırma (In-App Active Chat Suppression)',
            'Bildirim Çekmecesi Otomatik Temizleme (Auto Dismiss on Open)',
            'Modern Mesaj Balonu Spacing & Padding Düzeltmesi'
        ],
        changes: [
            { type: 'fix', text: 'Açık olan odadan gelen mesajlarda Android bildirim sesinin ve banner\'ının tetiklenmesi engellendi.' },
            { type: 'fix', text: 'Mesaj okunduğunda Android bildirim çekmecesindeki bekleyen bildirim otomatik olarak kaldırıldı.' },
            { type: 'ui', text: 'Mesaj balonu dikey aralıkları (bubble margin) daraltılarak ekranda daha fazla mesaj görünmesi sağlandı.' }
        ],
        affectedFiles: [
            'client/src/components/MessageBubble.css',
            'client/src/pages/Inbox.jsx',
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java'
        ]
    },
    {
        version: 'v2.3.1',
        versionCode: 231,
        releaseDate: '23 Eylül 2026',
        commitHash: '6fa6a98',
        status: 'stable',
        title: 'Bildirim Çekmecesi Senkronizasyonu & Mesaj Düzeni',
        summary: 'Android bildirim merkezi ile uygulama içi okundu durumu senkronize edildi, teslim edilen bildirimlerin anında kapanması güvenceye alındı.',
        category: 'fix',
        apkSize: '48.7 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Çift taraflı bildirim temizleme döngüsü',
            'Mesaj listesi kaydırma akıcılığı'
        ],
        changes: [
            { type: 'fix', text: 'Sohbete tıklandığında ilgili bildirim ID\'si `NotificationManager` üzerinden doğrudan dismiss edildi.' },
            { type: 'ui', text: 'Sohbet içi tarih ayıraçları ve kullanıcı takma adları kontrastı artırıldı.' }
        ],
        affectedFiles: [
            'client/src/pages/Inbox.jsx',
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java'
        ]
    },
    {
        version: 'v2.3.0',
        versionCode: 230,
        releaseDate: '23 Eylül 2026',
        commitHash: '38075d3',
        status: 'stable',
        title: 'Yüksek Hızlı Tema Geçişleri (High-FPS Transitions) & Akıcı Portal Akışı',
        summary: 'Karanlık ve aydınlık tema değişiminde oluşan takılmalar ve titremeler giderildi; portal ana sayfası akışı 60+ FPS performansına yükseltildi.',
        category: 'perf',
        apkSize: '48.6 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Donanımsal Hızlandırmalı Tema Geçişleri',
            'Portal Beslemesi Sanallaştırma ve Sıfır Titreme',
            'Yenilenmiş Android Release APK'
        ],
        changes: [
            { type: 'perf', text: 'CSS geçişlerindeki repaints/reflows döngüleri `will-change: transform` ile optimize edildi.' },
            { type: 'ui', text: 'Portal listeleme kartlarında titreme (jitter) olmadan pürüzsüz kaydırma sağlandı.' },
            { type: 'build', text: 'Android Release APK derlendi ve sunucuya aktarıldı.' }
        ],
        affectedFiles: [
            'client/src/index.css',
            'client/src/pages/Portal.jsx',
            'client/src/pages/Portal.css'
        ]
    },
    {
        version: 'v2.2.9',
        versionCode: 229,
        releaseDate: '22 Eylül 2026',
        commitHash: 'f753333',
        status: 'stable',
        title: 'PostCard Mobil Kenar Boşlukları & Portal Genişlik Düzeltmesi',
        summary: 'Gönderi kartlarındaki hover etkilerinin mobil dokunmatik ekranlardaki kalıcılığı önlendi; portal kanal başlığı ve yazma çubuğu mobil ekran genişliğine tam oturacak şekilde revize edildi.',
        category: 'ui',
        apkSize: '48.4 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Mobil dokunmatik ekranlarda hover yapışkanlığının (@media hover: none) kaldırılması',
            'Portal akışı kenar boşluklarının (padding) daraltılarak ekran kullanımının artırılması',
            'Android build.gradle 2.2.9 sürüm koduna yükseltildi'
        ],
        changes: [
            { type: 'ui', text: 'Gönderi kartlarına dokunulduğunda oluşan sahte hover çerçevesi mobil cihazlarda devre dışı bırakıldı.' },
            { type: 'ui', text: 'Kanal başlığı, mesaj gönderme çubuğu ve gönderiler mobilde dar yan boşluklarla genişletildi.' },
            { type: 'build', text: 'Android build.gradle `versionCode 229` ve `versionName "2.2.9"` olarak paketlendi.' }
        ],
        affectedFiles: [
            'client/src/components/PostCard.css',
            'client/src/pages/Portal.css',
            'android/app/build.gradle'
        ]
    },
    {
        version: 'v2.2.8',
        versionCode: 228,
        releaseDate: '22 Eylül 2026',
        commitHash: '3fc067d',
        status: 'stable',
        title: 'Medya Galerisi Çimdikle Yakınlaştırma (Pinch-to-Zoom) & Skeleton Loader',
        summary: 'Gönderi fotoğraflarına mobil cihazlarda iki parmakla çimdikleyerek serbest yakınlaştırma (pinch-to-zoom) ve masaüstünde fare tekerleğiyle zoom yeteneği eklendi. Video yükleme esnasında şık iskelet yükleyici eklendi.',
        category: 'feature',
        apkSize: '48.2 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'İki parmakla serbest Pinch-to-Zoom & Pan mekanizması',
            'İçerik yükleme iskelet animasyonları (Skeleton Loaders)',
            'Video bellek yönetimi optimizasyonları'
        ],
        changes: [
            { type: 'feat', text: 'Tam ekran medya galerisine mobil dokunmatik jestler (Touch gestures) entegre edildi.' },
            { type: 'perf', text: 'Arka planda kalan videoların önbelleği temizlenerek Android WebView RAM kullanımı sınırlandı.' }
        ],
        affectedFiles: [
            'client/src/components/PostCard.jsx',
            'client/src/components/PostCard.css'
        ]
    },
    {
        version: 'v2.2.7',
        versionCode: 227,
        releaseDate: '20 Eylül 2026',
        commitHash: 'a04acd9',
        status: 'stable',
        title: 'Keşfet & Arama Sadeleştirme ve Mikro Hareket Animasyonları',
        summary: 'Keşfet sayfasındaki hantal başlıklar ve koyu kutular kaldırılarak butonlar mobilde tek satıra toplandı; mikro hareket animasyonlarıyla kullanıcı deneyimi modernize edildi.',
        category: 'ui',
        apkSize: '48.0 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Sade ve kutusuz (unboxed) Keşfet & Arama arayüzü',
            'Mobilde geri butonu ve arama çubuğu yan yana hizalandı',
            'İkon etiketleri mobilde gizlenerek butonlar kompaktlaştırıldı'
        ],
        changes: [
            { type: 'ui', text: 'Arama çubuğuna 6px yumuşak köşeler uygulandı ve butonların kırılması önlendi.' },
            { type: 'ui', text: 'Profil düzenleme modalı monokrom kartlar ve tema desteğiyle baştan tasarlandı.' }
        ],
        affectedFiles: [
            'client/src/pages/Search.jsx',
            'client/src/pages/Search.css',
            'client/src/pages/Profile.jsx'
        ]
    },
    {
        version: 'v2.2.6',
        versionCode: 226,
        releaseDate: '14 Eylül 2026',
        commitHash: '07515d4',
        status: 'stable',
        title: 'Video İndirme Format Seçimi (Universal MP4 vs Raw) & Kalite Doğrulama',
        summary: 'Kullanıcıların videoları hem her telefonda/WhatsApp\'ta anında açılan Universal MP4 formatında hem de orijinal RAW kalitesinde indirebilmesi sağlandı. Kalite etiketi doğruluğu onarıldı.',
        category: 'feature',
        apkSize: '47.8 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Universal MP4 (H.264/AAC geniş uyumluluk) & Raw İndirme Seçeneği',
            'Kalite etiketlerinin (1080p, 720p, 480p) gerçek akışla doğrulanması',
            'Telefon galerisi anında tanıma motoru'
        ],
        changes: [
            { type: 'feat', text: 'Video indirme modalına format seçimi eklendi: "Evrensel MP4" ve "Orijinal Kaynak".' },
            { type: 'fix', text: 'Farklı codec yapısına sahip videoların Android galerisinde siyah ekran kalması giderildi.' }
        ],
        affectedFiles: [
            'client/src/components/VideoDownloadModal.jsx',
            'client/src/components/VideoDownloadModal.css',
            'client/src/components/PostCard.jsx'
        ]
    },
    {
        version: 'v2.2.5',
        versionCode: 225,
        releaseDate: '14 Eylül 2026',
        commitHash: 'dedd372',
        status: 'stable',
        title: 'Yerinde MP4 Faststart Yeniden Konumlandırma & Galeri Zaman Damgası',
        summary: 'İndirilen MP4 dosyalarının moov atomunu dosyanın başına taşıyan yerel faststart motoru yazıldı. Dosya tarihi yamalama ile galeri sıralamasının güncel kalması sağlandı.',
        category: 'perf',
        apkSize: '47.6 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Binary seviyesinde moov/mdat atom yeniden konumlandırma (Faststart relocation)',
            'MediaStore gecikmeli tarama ile eksik thumbnail sorununu çözme',
            'Gerçek zamanlı indirme ilerleme yüzdesi ve indirme hızı göstergesi'
        ],
        changes: [
            { type: 'perf', text: 'Büyük MP4 videolarında akışın indirme biter bitmez anında açılması sağlandı.' },
            { type: 'fix', text: 'İndirilen medyanın telefon galerisinin en üstünde doğru zaman damgasıyla çıkması sağlandı.' }
        ],
        affectedFiles: [
            'client/src/components/VideoDownloadModal.jsx',
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java'
        ]
    },
    {
        version: 'v2.2.0',
        versionCode: 220,
        releaseDate: '12 Eylül 2026',
        commitHash: '4c52758',
        status: 'stable',
        title: 'Android 14+ FGS Ekran Paylaşımı, Yerel PiP & Yüzen Pencere Kontrolleri',
        summary: 'Android 14+ zorunlu Foreground Service (FGS) mediaProjection yükseltmesi tamamlandı. Güvenilir mobil ekran paylaşımı, donanımsal Android Picture-in-Picture (PiP) ve yüzen pencere butonları aktifleştirildi.',
        category: 'infrastructure',
        apkSize: '47.5 MB',
        targetSdk: 'Android 14+ (API 34)',
        architecture: 'arm64-v8a',
        highlights: [
            'Android 14 (API 34) Foreground Service mediaProjection desteği',
            'Donanımsal Picture-in-Picture (PiP) mikrofon/kamera eylem butonları',
            'Uygulama içi kenara yapışan çerçevesiz yüzen pencere (Floating PIP)',
            'Sessiz arama bildirim çubuğu (Silent Call Notification Bar)'
        ],
        changes: [
            { type: 'feat', text: 'Android 14 güvenlik kısıtlamalarına tam uyumlu MediaProjection FGS servisi kodlandı.' },
            { type: 'feat', text: 'Android yerel PiP moduna mikrofon aç/kapa ve çağrıdan ayrıl butonları eklendi.' },
            { type: 'feat', text: 'Ekran paylaşımı esnasında mobil sunum akışı ve katılımcı senkronizasyonu sağlandı.' },
            { type: 'fix', text: 'Masaüstü overlay ve gereksiz web pencerelerinin mobilde açılması engellendi.' }
        ],
        affectedFiles: [
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java',
            'android/app/src/main/AndroidManifest.xml',
            'client/src/components/GlobalVideoPIP.jsx',
            'client/src/components/VoiceChannel.jsx'
        ]
    },
    {
        version: 'v2.1.2',
        versionCode: 212,
        releaseDate: '11 Eylül 2026',
        commitHash: 'dc74559',
        status: 'legacy',
        title: 'ARM64-v8a Özel APK Paketi ile %42 Boyut Tasarrufu',
        summary: 'Gereksiz 32-bit x86/armeabi kütüphaneleri arındırılarak modern Android cihazlara özel optimize edilmiş ARM64-v8a paketi derlendi. APK boyutu 81.6 MB\'tan 47.2 MB\'a düşürüldü.',
        category: 'perf',
        apkSize: '47.2 MB',
        targetSdk: 'Android 13+ (API 33)',
        architecture: 'arm64-v8a',
        highlights: [
            '81.6 MB -> 47.2 MB (%42 Hafifletme)',
            'Gelişmiş başlatma hızı ve bellek verimliliği',
            'Play Protect yanlış pozitif uyarılarının giderilmesi'
        ],
        changes: [
            { type: 'perf', text: '`ndk.abiFilters "arm64-v8a"` yapılandırmasıyla APK dosya boyutu yarı yarıya düşürüldü.' },
            { type: 'build', text: 'Ağır CSS filtreleri ve mobil canvas gereksinimleri kaldırılarak WebView donanım hızlandırması açıldı.' }
        ],
        affectedFiles: [
            'android/app/build.gradle',
            'android/app/proguard-rules.pro'
        ]
    },
    {
        version: 'v2.0.0',
        versionCode: 200,
        releaseDate: '23 Ağustos 2026',
        commitHash: 'e7200f5',
        status: 'legacy',
        title: 'Büyük 2.0 Dönüşümü: EVENT HORIZON Entegrasyonu & CDN Altyapısı',
        summary: 'Oxypace 2.0 mimarisi: Next.js EVENT HORIZON bilimsel hesaplama portalı uygulama içine gömüldü, Cloudflare R2 CDN avatar/medya akışı kuruldu ve sıfırdan güvenli oturum devamlılığı sağlandı.',
        category: 'feature',
        apkSize: '77.0 MB',
        targetSdk: 'Android 13 (API 33)',
        architecture: 'universal',
        highlights: [
            'Next.js EVENT HORIZON Bilim Portalı yerel entegrasyonu',
            'Cloudflare R2 CDN medya boru hattı',
            'Flaşsız anlık oturum kurtarma (Instant Session Resume)'
        ],
        changes: [
            { type: 'feat', text: 'Kuramsal fizik ve uzay hesaplama araçları doğrudan mobil uygulama içinde çalıştırıldı.' },
            { type: 'infra', text: 'Medya ve avatar yüklemeleri Cloudflare R2 proxy altyapısına bağlandı.' },
            { type: 'ui', text: 'Çift glassmorphism giriş geçidi ve Google Auth deep link desteği eklendi.' }
        ],
        affectedFiles: [
            'blog/out/*',
            'scripts/merge-blog.js',
            'client/dist-mobile/*',
            'android/app/src/main/java/com/globalmessage/app/MainActivity.java'
        ]
    }
];

const MobileVersionHistory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'cards'
    const [expandedVersions, setExpandedVersions] = useState({ 'v2.5.0': true });
    const [copiedVersion, setCopiedVersion] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('markdown'); // 'markdown' | 'json'
    const [exportCopied, setExportCopied] = useState(false);

    // Toggle single version expansion
    const toggleExpand = (ver) => {
        setExpandedVersions((prev) => ({
            ...prev,
            [ver]: !prev[ver]
        }));
    };

    // Expand all or Collapse all
    const handleExpandAll = () => {
        const allExpanded = {};
        MOBILE_VERSIONS_DATA.forEach((v) => {
            allExpanded[v.version] = true;
        });
        setExpandedVersions(allExpanded);
    };

    const handleCollapseAll = () => {
        setExpandedVersions({});
    };

    // Copy commit or version info
    const handleCopyCommit = (hash, version) => {
        navigator.clipboard.writeText(hash);
        setCopiedVersion(version);
        setTimeout(() => setCopiedVersion(null), 2000);
    };

    // Filtered data
    const filteredVersions = useMemo(() => {
        return MOBILE_VERSIONS_DATA.filter((v) => {
            const matchesCategory =
                selectedCategory === 'all' ||
                v.category === selectedCategory ||
                (selectedCategory === 'active' && v.status === 'active');

            const query = searchQuery.trim().toLowerCase();
            if (!query) return matchesCategory;

            const matchesText =
                v.version.toLowerCase().includes(query) ||
                v.title.toLowerCase().includes(query) ||
                v.summary.toLowerCase().includes(query) ||
                v.commitHash.toLowerCase().includes(query) ||
                v.changes.some((c) => c.text.toLowerCase().includes(query)) ||
                v.highlights.some((h) => h.toLowerCase().includes(query));

            return matchesCategory && matchesText;
        });
    }, [searchQuery, selectedCategory]);

    // Generate Export Text
    const exportContent = useMemo(() => {
        if (exportFormat === 'json') {
            return JSON.stringify(MOBILE_VERSIONS_DATA, null, 2);
        }

        // Markdown format
        return MOBILE_VERSIONS_DATA.map((v) => {
            return `## [${v.version}] - ${v.releaseDate} (${v.commitHash})
**${v.title}**
*${v.summary}*

- **APK Boyutu:** ${v.apkSize}
- **Hedef SDK:** ${v.targetSdk}
- **Mimari:** ${v.architecture}

### Öne Çıkanlar:
${v.highlights.map((h) => `- ${h}`).join('\n')}

### Değişiklik Günlüğü:
${v.changes.map((c) => `- [${c.type.toUpperCase()}] ${c.text}`).join('\n')}
`;
        }).join('\n---\n\n');
    }, [exportFormat]);

    const handleCopyExport = () => {
        navigator.clipboard.writeText(exportContent);
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2200);
    };

    const latestActive = MOBILE_VERSIONS_DATA[0];

    return (
        <div className="mobile-version-history-container fade-in">
            {/* 1. TOP HEADER & HERO DASHBOARD */}
            <div className="mvh-header-card">
                <div className="mvh-header-main">
                    <div className="mvh-title-row">
                        <div className="mvh-icon-orb">
                            <History size={26} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="mvh-badge-track">
                                <span className="mvh-status-pill live">
                                    <span className="mvh-live-ping" />
                                    CANLI DERLEME TAKİBİ
                                </span>
                                <span className="mvh-version-chip">
                                    Aktif: <strong>{latestActive.version}</strong>
                                </span>
                            </div>
                            <h1 className="mvh-title">Mobil Sürüm Günlüğü & Changelog</h1>
                            <p className="mvh-subtitle">
                                Oxypace Android istemcisinin v2.0.0'dan v2.4.8'e kadar derlenen tüm sürümleri, APK optimizasyonları ve adım adım değişiklik kayıtları.
                            </p>
                        </div>
                    </div>

                    <div className="mvh-header-actions">
                        <a
                            href="/oxypace.apk"
                            download="oxypace.apk"
                            className="mvh-btn-primary"
                            title="En son kararlı derlemeyi cihazınıza indirin"
                        >
                            <Download size={16} />
                            <span>Son APK İndir ({latestActive.apkSize})</span>
                        </a>

                        <button
                            type="button"
                            className="mvh-btn-secondary"
                            onClick={() => setShowExportModal(true)}
                            title="Sürüm notlarını Markdown veya JSON olarak dışa aktar"
                        >
                            <Share2 size={16} />
                            <span>Dışa Aktar / Paylaş</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Stats Grid */}
                <div className="mvh-metrics-grid">
                    <div className="mvh-metric-box">
                        <div className="mvh-metric-icon-wrap cyan">
                            <Smartphone size={18} />
                        </div>
                        <div className="mvh-metric-info">
                            <span className="mvh-metric-label">Aktif Kararlı Sürüm</span>
                            <div className="mvh-metric-val-row">
                                <span className="mvh-metric-value">{latestActive.version}</span>
                                <span className="mvh-metric-sub-tag">Güncel</span>
                            </div>
                            <span className="mvh-metric-desc">Yayın: {latestActive.releaseDate}</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="mvh-metric-icon-wrap emerald">
                            <Package size={18} />
                        </div>
                        <div className="mvh-metric-info">
                            <span className="mvh-metric-label">Kayıtlı Sürüm Sayısı</span>
                            <div className="mvh-metric-val-row">
                                <span className="mvh-metric-value">{MOBILE_VERSIONS_DATA.length} Derleme</span>
                            </div>
                            <span className="mvh-metric-desc">v2.0.0 → v2.4.8 Gelişim Süreci</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="mvh-metric-icon-wrap purple">
                            <Cpu size={18} />
                        </div>
                        <div className="mvh-metric-info">
                            <span className="mvh-metric-label">APK Mimarisi & Boyut</span>
                            <div className="mvh-metric-val-row">
                                <span className="mvh-metric-value">49.8 MB</span>
                                <span className="mvh-metric-sub-tag save">-42% Opt.</span>
                            </div>
                            <span className="mvh-metric-desc">ARM64-v8a Standart Paket</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="mvh-metric-icon-wrap orange">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="mvh-metric-info">
                            <span className="mvh-metric-label">Platform Desteği</span>
                            <div className="mvh-metric-val-row">
                                <span className="mvh-metric-value">Android 10 - 15</span>
                            </div>
                            <span className="mvh-metric-desc">API 29 - 35 (FGS & Insets Uyumlu)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SEARCH & FILTER TOOLBAR */}
            <div className="mvh-toolbar-card">
                <div className="mvh-search-wrap">
                    <Search size={16} className="mvh-search-icon" />
                    <input
                        type="text"
                        placeholder="Sürüm ara (örn: v2.3, onboarding, inset, webrtc, bildirim, faststart)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mvh-search-input"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="mvh-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            Temizle
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="mvh-filter-pills">
                    <button
                        type="button"
                        className={`mvh-filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Tümü ({MOBILE_VERSIONS_DATA.length})
                    </button>
                    <button
                        type="button"
                        className={`mvh-filter-pill ${selectedCategory === 'feature' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('feature')}
                    >
                        <Sparkles size={13} />
                        <span>Yeni Özellikler</span>
                    </button>
                    <button
                        type="button"
                        className={`mvh-filter-pill ${selectedCategory === 'fix' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('fix')}
                    >
                        <Zap size={13} />
                        <span>Hata Onarımları</span>
                    </button>
                    <button
                        type="button"
                        className={`mvh-filter-pill ${selectedCategory === 'infrastructure' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('infrastructure')}
                    >
                        <Cpu size={13} />
                        <span>Android & Altyapı</span>
                    </button>
                    <button
                        type="button"
                        className={`mvh-filter-pill ${selectedCategory === 'perf' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('perf')}
                    >
                        <Layers size={13} />
                        <span>Performans & Boyut</span>
                    </button>
                </div>

                {/* View Switcher & Expand/Collapse Controls */}
                <div className="mvh-toolbar-right">
                    <div className="mvh-expand-btns">
                        <button
                            type="button"
                            className="mvh-mini-btn"
                            onClick={handleExpandAll}
                            title="Tüm sürümlerin ayrıntılarını aç"
                        >
                            Tümünü Aç
                        </button>
                        <button
                            type="button"
                            className="mvh-mini-btn"
                            onClick={handleCollapseAll}
                            title="Tüm ayrıntıları kapat"
                        >
                            Kapat
                        </button>
                    </div>

                    <div className="mvh-view-toggle">
                        <button
                            type="button"
                            className={`mvh-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                            onClick={() => setViewMode('timeline')}
                            title="Zaman Tüneli Görünümü"
                        >
                            <SlidersHorizontal size={14} />
                            <span>Zaman Tüneli</span>
                        </button>
                        <button
                            type="button"
                            className={`mvh-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                            onClick={() => setViewMode('cards')}
                            title="Kompakt Kart Görünümü"
                        >
                            <FileText size={14} />
                            <span>Kompakt</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. VERSION TIMELINE / CARDS CONTENT */}
            {filteredVersions.length === 0 ? (
                <div className="mvh-empty-state">
                    <History size={40} className="mvh-empty-icon" />
                    <h3>Eşleşen sürüm bulunamadı</h3>
                    <p>Arama terimini veya seçtiğiniz kategori filtresini değiştirip tekrar deneyin.</p>
                    <button
                        type="button"
                        className="mvh-btn-secondary"
                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    >
                        Filtreleri Sıfırla
                    </button>
                </div>
            ) : (
                <div className={`mvh-content-wrapper view-${viewMode}`}>
                    {viewMode === 'timeline' && <div className="mvh-timeline-spine-line" />}

                    {filteredVersions.map((item, index) => {
                        const isExpanded = !!expandedVersions[item.version];
                        const isLatest = index === 0;

                        return (
                            <div
                                key={item.version}
                                className={`mvh-version-card ${isLatest ? 'is-latest' : ''} ${isExpanded ? 'expanded' : ''}`}
                            >
                                {/* Timeline Node Marker */}
                                {viewMode === 'timeline' && (
                                    <div className="mvh-timeline-node">
                                        <div className={`mvh-node-dot ${isLatest ? 'pulsing' : ''}`}>
                                            {isLatest ? <Sparkles size={12} /> : <GitCommit size={12} />}
                                        </div>
                                    </div>
                                )}

                                {/* Main Card Content */}
                                <div className="mvh-card-inner">
                                    {/* Card Header */}
                                    <div className="mvh-card-header" onClick={() => toggleExpand(item.version)}>
                                        <div className="mvh-header-left">
                                            <div className="mvh-version-pill-group">
                                                <span className={`mvh-version-tag ${isLatest ? 'latest' : ''}`}>
                                                    {item.version}
                                                </span>
                                                {isLatest && (
                                                    <span className="mvh-badge-active-release">
                                                        <CheckCircle2 size={12} />
                                                        <span>AKTİF SÜRÜM</span>
                                                    </span>
                                                )}
                                                <span className={`mvh-category-tag ${item.category}`}>
                                                    {item.category === 'feature' && 'YENİ ÖZELLİK'}
                                                    {item.category === 'fix' && 'HATA ONARIMI'}
                                                    {item.category === 'perf' && 'PERFORMANS'}
                                                    {item.category === 'infrastructure' && 'ALTYAPI & FGS'}
                                                    {item.category === 'ui' && 'TASARIM & UI'}
                                                </span>
                                            </div>

                                            <h3 className="mvh-version-title">{item.title}</h3>
                                        </div>

                                        <div className="mvh-header-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="mvh-version-meta-tags">
                                                <span className="mvh-meta-tag date" title="Derleme Tarihi">
                                                    <Calendar size={12} />
                                                    <span>{item.releaseDate}</span>
                                                </span>
                                                <span
                                                    className="mvh-meta-tag commit"
                                                    title="Commit kodunu kopyala"
                                                    onClick={() => handleCopyCommit(item.commitHash, item.version)}
                                                >
                                                    <GitCommit size={12} />
                                                    <code>#{item.commitHash}</code>
                                                    {copiedVersion === item.version ? (
                                                        <Check size={11} className="mvh-copy-state success" />
                                                    ) : (
                                                        <Copy size={11} className="mvh-copy-state" />
                                                    )}
                                                </span>
                                                <span className="mvh-meta-tag apk" title="Paket Boyutu">
                                                    <Package size={12} />
                                                    <span>{item.apkSize}</span>
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="mvh-btn-toggle-expand"
                                                onClick={() => toggleExpand(item.version)}
                                                title={isExpanded ? 'Detayları Daralt' : 'Detayları Göster'}
                                                aria-label={isExpanded ? 'Detayları Daralt' : 'Detayları Göster'}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Line */}
                                    <p className="mvh-version-summary">{item.summary}</p>

                                    {/* Highlights Row */}
                                    <div className="mvh-version-highlights-chips">
                                        {item.highlights.map((h, hIdx) => (
                                            <span key={hIdx} className="mvh-highlight-chip">
                                                <CheckCircle2 size={11} className="mvh-chip-check" />
                                                <span>{h}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expanded Step-by-Step Details */}
                                    {isExpanded && (
                                        <div className="mvh-version-expanded-body">
                                            {/* Detailed Changes List */}
                                            <div className="changes-section">
                                                <h4 className="mvh-changes-section-title">
                                                    <Zap size={14} />
                                                    <span>Adım Adım Yapılan Değişiklikler ({item.changes.length})</span>
                                                </h4>
                                                <ul className="mvh-changes-list">
                                                    {item.changes.map((c, cIdx) => (
                                                        <li key={cIdx} className={`mvh-change-item type-${c.type}`}>
                                                            <span className={`mvh-change-type-badge ${c.type}`}>
                                                                {c.type === 'feat' && 'ÖZELLİK'}
                                                                {c.type === 'fix' && 'ONARIM'}
                                                                {c.type === 'ui' && 'ARAYÜZ'}
                                                                {c.type === 'perf' && 'HIZ'}
                                                                {c.type === 'build' && 'DERLEME'}
                                                                {c.type === 'infra' && 'ALTYAPI'}
                                                            </span>
                                                            <span className="mvh-change-text">{c.text}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Technical Specs Footer Strip */}
                                            <div className="mvh-tech-specs-strip">
                                                <div className="mvh-spec-item">
                                                    <span className="mvh-spec-label">Hedef Android SDK:</span>
                                                    <code className="mvh-spec-val">{item.targetSdk}</code>
                                                </div>
                                                <div className="mvh-spec-item">
                                                    <span className="mvh-spec-label">Mimari:</span>
                                                    <code className="mvh-spec-val">{item.architecture}</code>
                                                </div>
                                                <div className="mvh-spec-item">
                                                    <span className="mvh-spec-label">Versiyon Kodu:</span>
                                                    <code className="mvh-spec-val">{item.versionCode}</code>
                                                </div>
                                                <div className="mvh-spec-item affected-files">
                                                    <span className="mvh-spec-label">Kritik Dosyalar:</span>
                                                    <div className="mvh-files-pill-row">
                                                        {item.affectedFiles.map((f, fIdx) => (
                                                            <span key={fIdx} className="mvh-file-pill" title={f}>
                                                                <FileCode size={11} />
                                                                <span>{f.split('/').pop()}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4. EXPORT & SHARE MODAL */}
            {showExportModal && (
                <div className="mvh-modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="mvh-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="mvh-modal-header">
                            <div className="mvh-modal-title-left">
                                <Share2 size={20} className="mvh-modal-icon" />
                                <h3>Sürüm Notlarını Dışa Aktar</h3>
                            </div>
                            <button
                                type="button"
                                className="mvh-modal-close-btn"
                                onClick={() => setShowExportModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mvh-modal-tabs">
                            <button
                                type="button"
                                className={`mvh-modal-tab ${exportFormat === 'markdown' ? 'active' : ''}`}
                                onClick={() => setExportFormat('markdown')}
                            >
                                Markdown (GitHub Releases)
                            </button>
                            <button
                                type="button"
                                className={`mvh-modal-tab ${exportFormat === 'json' ? 'active' : ''}`}
                                onClick={() => setExportFormat('json')}
                            >
                                JSON Formatı
                            </button>
                        </div>

                        <div className="mvh-modal-code-area">
                            <textarea
                                readOnly
                                value={exportContent}
                                className="mvh-export-textarea"
                                rows={14}
                            />
                        </div>

                        <div className="mvh-modal-footer">
                            <button
                                type="button"
                                className="mvh-btn-primary"
                                onClick={handleCopyExport}
                            >
                                {exportCopied ? (
                                    <>
                                        <Check size={16} />
                                        <span>Panoya Kopyalandı!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        <span>Metni Kopyala</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="mvh-btn-secondary"
                                onClick={() => setShowExportModal(false)}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileVersionHistory;
