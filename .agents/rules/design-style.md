# Project Design & Architecture Directives

## 1. Design Aesthetics & Colors (Strict)
- **NO NEON COLORS:** Asla parlak neon renkler, neon ışıltılar veya aşırı doymuş renkler (cyan, mor, neon yeşil) kullanılmayacak.
- **NO PULSING / FLASHING ANIMATIONS:** Yanıp sönen, sürekli nabız atan (pulsing/ripple) yapay animasyonlar kullanılmayacak.
- **PALETTE:** Metalik koyu gümüş (dark silver), mat antrasit (#0e1016, #1e222d), şık slate gri tonları ve net beyaz kullanılacak.
- **GEOMETRY & EDGES:** Aşırı yuvarlak hap/oval (pill) şekiller yerine keskin ve hafif yuvarlatılmış (8px - 14px) sade modern köşeler kullanılacak.
- **NO MARKETING / SYSTEM FEATURE TEXT:** Kullanıcı arayüzlerine "Ultra düşük gecikmeli...", "Kristal netliğinde...", "HD ses..." gibi gereksiz reklam/pazarlama metinleri eklenmeyecek. Sadece net başlık ve butonlar yer alacak.

## 2. Voice & Live Rooms
- Odalarda duplicate zamanlayıcı (timer) eklenmeyecek.
- Lobi ekranında o anki canlı kullanıcı sayısı Socket & LiveKit senkronizasyonuyla anlık doğru gösterilecek.
