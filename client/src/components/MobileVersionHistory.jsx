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
// TÜM MOBİL DERLEME VE SÜRÜM GEÇMİŞİ VERİTABANI (v2.0.0 -> v2.3.6)
// --------------------------------------------------------------------------
export const MOBILE_VERSIONS_DATA = [
    {
        version: 'v2.3.6',
        versionCode: 236,
        releaseDate: '26 Eylül 2026',
        commitHash: '5653b00',
        status: 'active', // 'active' | 'stable' | 'legacy'
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
    const [expandedVersions, setExpandedVersions] = useState({ 'v2.3.6': true });
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
                                    <span className="live-ping" />
                                    CANLI DERLEME TAKİBİ
                                </span>
                                <span className="mvh-version-chip">
                                    Aktif: <strong>{latestActive.version}</strong>
                                </span>
                            </div>
                            <h1 className="mvh-title">Mobil Sürüm Günlüğü & Changelog</h1>
                            <p className="mvh-subtitle">
                                Oxypace Android istemcisinin v2.0.0'dan v2.3.6'ya kadar derlenen tüm sürümleri, APK optimizasyonları ve adım adım değişiklik kayıtları.
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
                        <div className="metric-icon-wrap cyan">
                            <Smartphone size={18} />
                        </div>
                        <div className="metric-info">
                            <span className="metric-label">Aktif Kararlı Sürüm</span>
                            <div className="metric-val-row">
                                <span className="metric-value">{latestActive.version}</span>
                                <span className="metric-sub-tag">Güncel</span>
                            </div>
                            <span className="metric-desc">Yayın: {latestActive.releaseDate}</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="metric-icon-wrap emerald">
                            <Package size={18} />
                        </div>
                        <div className="metric-info">
                            <span className="metric-label">Kayıtlı Sürüm Sayısı</span>
                            <div className="metric-val-row">
                                <span className="metric-value">{MOBILE_VERSIONS_DATA.length} Derleme</span>
                            </div>
                            <span className="metric-desc">v2.0.0 → v2.3.6 Gelişim Süreci</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="metric-icon-wrap purple">
                            <Cpu size={18} />
                        </div>
                        <div className="metric-info">
                            <span className="metric-label">APK Mimarisi & Boyut</span>
                            <div className="metric-val-row">
                                <span className="metric-value">49.8 MB</span>
                                <span className="metric-sub-tag save">-42% Opt.</span>
                            </div>
                            <span className="metric-desc">ARM64-v8a Standart Paket</span>
                        </div>
                    </div>

                    <div className="mvh-metric-box">
                        <div className="metric-icon-wrap orange">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="metric-info">
                            <span className="metric-label">Platform Desteği</span>
                            <div className="metric-val-row">
                                <span className="metric-value">Android 10 - 15</span>
                            </div>
                            <span className="metric-desc">API 29 - 35 (FGS & Insets Uyumlu)</span>
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
                        className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Tümü ({MOBILE_VERSIONS_DATA.length})
                    </button>
                    <button
                        type="button"
                        className={`filter-pill ${selectedCategory === 'feature' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('feature')}
                    >
                        <Sparkles size={13} />
                        <span>Yeni Özellikler</span>
                    </button>
                    <button
                        type="button"
                        className={`filter-pill ${selectedCategory === 'fix' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('fix')}
                    >
                        <Zap size={13} />
                        <span>Hata Onarımları</span>
                    </button>
                    <button
                        type="button"
                        className={`filter-pill ${selectedCategory === 'infrastructure' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('infrastructure')}
                    >
                        <Cpu size={13} />
                        <span>Android & Altyapı</span>
                    </button>
                    <button
                        type="button"
                        className={`filter-pill ${selectedCategory === 'perf' ? 'active' : ''}`}
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
                            className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                            onClick={() => setViewMode('timeline')}
                            title="Zaman Tüneli Görünümü"
                        >
                            <SlidersHorizontal size={14} />
                            <span>Zaman Tüneli</span>
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
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
                    <History size={40} className="empty-icon" />
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
                    {viewMode === 'timeline' && <div className="timeline-spine-line" />}

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
                                    <div className="timeline-node">
                                        <div className={`node-dot ${isLatest ? 'pulsing' : ''}`}>
                                            {isLatest ? <Sparkles size={12} /> : <GitCommit size={12} />}
                                        </div>
                                    </div>
                                )}

                                {/* Main Card Content */}
                                <div className="mvh-card-inner">
                                    {/* Card Header */}
                                    <div className="mvh-card-header" onClick={() => toggleExpand(item.version)}>
                                        <div className="header-left">
                                            <div className="version-pill-group">
                                                <span className={`version-tag ${isLatest ? 'latest' : ''}`}>
                                                    {item.version}
                                                </span>
                                                {isLatest && (
                                                    <span className="badge-active-release">
                                                        <CheckCircle2 size={12} />
                                                        <span>AKTİF SÜRÜM</span>
                                                    </span>
                                                )}
                                                <span className={`category-tag ${item.category}`}>
                                                    {item.category === 'feature' && 'YENİ ÖZELLİK'}
                                                    {item.category === 'fix' && 'HATA ONARIMI'}
                                                    {item.category === 'perf' && 'PERFORMANS'}
                                                    {item.category === 'infrastructure' && 'ALTYAPI & FGS'}
                                                    {item.category === 'ui' && 'TASARIM & UI'}
                                                </span>
                                            </div>

                                            <h3 className="version-title">{item.title}</h3>
                                        </div>

                                        <div className="header-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="version-meta-tags">
                                                <span className="meta-tag date" title="Derleme Tarihi">
                                                    <Calendar size={12} />
                                                    <span>{item.releaseDate}</span>
                                                </span>
                                                <span
                                                    className="meta-tag commit"
                                                    title="Commit kodunu kopyala"
                                                    onClick={() => handleCopyCommit(item.commitHash, item.version)}
                                                >
                                                    <GitCommit size={12} />
                                                    <code>#{item.commitHash}</code>
                                                    {copiedVersion === item.version ? (
                                                        <Check size={11} className="copy-state success" />
                                                    ) : (
                                                        <Copy size={11} className="copy-state" />
                                                    )}
                                                </span>
                                                <span className="meta-tag apk" title="Paket Boyutu">
                                                    <Package size={12} />
                                                    <span>{item.apkSize}</span>
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-toggle-expand"
                                                onClick={() => toggleExpand(item.version)}
                                                title={isExpanded ? 'Detayları Daralt' : 'Detayları Göster'}
                                                aria-label={isExpanded ? 'Detayları Daralt' : 'Detayları Göster'}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Line */}
                                    <p className="version-summary">{item.summary}</p>

                                    {/* Highlights Row */}
                                    <div className="version-highlights-chips">
                                        {item.highlights.map((h, hIdx) => (
                                            <span key={hIdx} className="highlight-chip">
                                                <CheckCircle2 size={11} className="chip-check" />
                                                <span>{h}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expanded Step-by-Step Details */}
                                    {isExpanded && (
                                        <div className="version-expanded-body">
                                            {/* Detailed Changes List */}
                                            <div className="changes-section">
                                                <h4 className="changes-section-title">
                                                    <Zap size={14} />
                                                    <span>Adım Adım Yapılan Değişiklikler ({item.changes.length})</span>
                                                </h4>
                                                <ul className="changes-list">
                                                    {item.changes.map((c, cIdx) => (
                                                        <li key={cIdx} className={`change-item type-${c.type}`}>
                                                            <span className={`change-type-badge ${c.type}`}>
                                                                {c.type === 'feat' && 'ÖZELLİK'}
                                                                {c.type === 'fix' && 'ONARIM'}
                                                                {c.type === 'ui' && 'ARAYÜZ'}
                                                                {c.type === 'perf' && 'HIZ'}
                                                                {c.type === 'build' && 'DERLEME'}
                                                                {c.type === 'infra' && 'ALTYAPI'}
                                                            </span>
                                                            <span className="change-text">{c.text}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Technical Specs Footer Strip */}
                                            <div className="tech-specs-strip">
                                                <div className="spec-item">
                                                    <span className="spec-label">Hedef Android SDK:</span>
                                                    <code className="spec-val">{item.targetSdk}</code>
                                                </div>
                                                <div className="spec-item">
                                                    <span className="spec-label">Mimari:</span>
                                                    <code className="spec-val">{item.architecture}</code>
                                                </div>
                                                <div className="spec-item">
                                                    <span className="spec-label">Versiyon Kodu:</span>
                                                    <code className="spec-val">{item.versionCode}</code>
                                                </div>
                                                <div className="spec-item affected-files">
                                                    <span className="spec-label">Kritik Dosyalar:</span>
                                                    <div className="files-pill-row">
                                                        {item.affectedFiles.map((f, fIdx) => (
                                                            <span key={fIdx} className="file-pill" title={f}>
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
                            <div className="modal-title-left">
                                <Share2 size={20} className="modal-icon" />
                                <h3>Sürüm Notlarını Dışa Aktar</h3>
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setShowExportModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mvh-modal-tabs">
                            <button
                                type="button"
                                className={`modal-tab ${exportFormat === 'markdown' ? 'active' : ''}`}
                                onClick={() => setExportFormat('markdown')}
                            >
                                Markdown (GitHub Releases)
                            </button>
                            <button
                                type="button"
                                className={`modal-tab ${exportFormat === 'json' ? 'active' : ''}`}
                                onClick={() => setExportFormat('json')}
                            >
                                JSON Formatı
                            </button>
                        </div>

                        <div className="mvh-modal-code-area">
                            <textarea
                                readOnly
                                value={exportContent}
                                className="export-textarea"
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
