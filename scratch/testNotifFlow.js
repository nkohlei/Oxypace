/**
 * Toplu bildirim akışını simüle eder:
 * 1. Admin'in yerel dosya yükleyip aldığı mediaKey'i backend'e gönderişi
 * 2. Backend'in constructProxiedUrl ile nasıl çözdüğü
 * 3. FCM'e gönderilen final URL
 */

import { constructProxiedUrl, R2_DOMAIN } from '../utils/mediaConfig.js';

const testCases = [
    // Yerel yüklemeden gelen ham mediaKey (en yaygın senaryo)
    'posts/general/post-1718500000000-123456789.jpg',
    // Başka bir yerel yüklemeden gelen ham mediaKey
    'uploads/media-1718500000000-987654321.png',
    // Netlify edge proxy URL (web tarafından gelmiş olabilir)
    '/r2-media/posts/general/post-1718500000000-123456789.jpg',
    // Koyeb proxy URL
    'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app/api/media/posts/general/post-123.jpg',
    // Zaten tam R2 URL (dış URL girilmişse)
    'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev/posts/general/post-123.jpg',
    // Dış URL (kullanıcı URL girmişse)
    'https://example.com/image.jpg',
    // Encoded URL
    '/api/media/posts%2Fgeneral%2Fpost-123.jpg',
];

console.log('=== Toplu Bildirim Görsel URL Çözümleme Testi ===\n');
console.log(`R2 Hedef Domain: ${R2_DOMAIN}\n`);

let allPassed = true;

for (const input of testCases) {
    const result = constructProxiedUrl(input);
    
    // Doğruluk kontrolü: result mutlaka https:// ile başlamalı ve Android'in erişebileceği format olmalı
    const isValid = result && result.startsWith('https://');
    const isDirectR2 = result && result.startsWith(R2_DOMAIN);
    const isExternal = result && !result.startsWith(R2_DOMAIN);
    
    const status = isValid ? '✅' : '❌';
    if (!isValid) allPassed = false;
    
    console.log(`${status} Girdi:  ${input}`);
    console.log(`   Çıktı:  ${result}`);
    console.log(`   Tip:    ${isDirectR2 ? 'Direkt R2 CDN' : (isExternal ? 'Dış URL' : 'GEÇERSİZ')}`);
    console.log('');
}

console.log('=================================================');
console.log(allPassed 
    ? '✅ TÜM TESTLER GEÇTİ - FCM payload doğru URL formatında'
    : '❌ BAZI TESTLER BAŞARISIZ - URL çözümleme hatası mevcut'
);
