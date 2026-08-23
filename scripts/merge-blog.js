/**
 * scripts/merge-blog.js
 *
 * Build sonrası birleştirme scripti:
 *
 * 1. Oxypace Portal (Vite SPA) zaten client/dist/ içinde build edildi
 *    ama şimdi onu client/dist/portal/ alt klasörüne taşıyoruz.
 * 2. Blog (Next.js static export) blog/out/ klasöründe.
 *    Bu dosyaları client/dist/ köküne kopyalıyoruz.
 *
 * Sonuç:
 *   client/dist/                  → Blog (Next.js) — oxypace.com.tr/
 *   client/dist/portal/           → Oxypace SPA     — oxypace.com.tr/portal/
 *
 * Netlify veya herhangi bir static host bunu doğrudan kullanabilir.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');

const CLIENT_DIST = path.join(ROOT, 'client', 'dist'); // Vite output
const BLOG_OUT    = path.join(ROOT, 'blog', 'out');     // Next static export
const PUBLISH_DIST = path.join(ROOT, 'dist');           // Netlify publish directory

console.log('🔄 Merging Blog and Portal builds for Web deployment...');

if (!fs.existsSync(CLIENT_DIST)) {
    console.error('❌ client/dist directory not found!');
    process.exit(1);
}

if (!fs.existsSync(BLOG_OUT)) {
    console.error('❌ blog/out directory not found!');
    process.exit(1);
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

// 1. Ensure root dist exists and is clean
if (fs.existsSync(PUBLISH_DIST)) {
    fs.rmSync(PUBLISH_DIST, { recursive: true, force: true });
}
fs.mkdirSync(PUBLISH_DIST, { recursive: true });

// 2. Copy Vite Client Dist to root dist
copyRecursive(CLIENT_DIST, PUBLISH_DIST);

// 3. Save Vite Portal SPA index.html as portal.html and spa-index.html in root dist
const portalHtmlSrc = path.join(CLIENT_DIST, 'index.html');
const portalHtmlDest = path.join(PUBLISH_DIST, 'portal.html');
const spaIndexDest = path.join(PUBLISH_DIST, 'spa-index.html');

let spaHtmlContent = null;
if (fs.existsSync(portalHtmlSrc)) {
    console.log('📦 Preserving Portal SPA HTML as portal.html and spa-index.html...');
    spaHtmlContent = fs.readFileSync(portalHtmlSrc, 'utf-8');
}

// 4. Copy Blog static files into root dist (Blog index.html serves root oxypace.com.tr/)
console.log('🌐 Copying Blog static export over publish dist root...');
copyRecursive(BLOG_OUT, PUBLISH_DIST);

// 5. Restore portal.html and spa-index.html in root dist
if (spaHtmlContent) {
    fs.writeFileSync(portalHtmlDest, spaHtmlContent, 'utf-8');
    fs.writeFileSync(spaIndexDest, spaHtmlContent, 'utf-8');
    console.log('✨ Restored pure Portal SPA HTML to portal.html & spa-index.html in dist/');
}

// 6. Ensure downloads/oxypace.apk is present in dist
const apkSrc = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apkDest = path.join(PUBLISH_DIST, 'downloads', 'oxypace.apk');
if (fs.existsSync(apkSrc)) {
    fs.mkdirSync(path.dirname(apkDest), { recursive: true });
    fs.copyFileSync(apkSrc, apkDest);
    console.log('📱 Included oxypace.apk in publish dist/downloads/');
}

console.log('\n✅ Merge complete for Web Site!');
console.log('   oxypace.com.tr/          → Blog (Next.js - index.html)');
console.log('   oxypace.com.tr/login      → Portal SPA (portal.html)');
console.log('   oxypace.com.tr/messages   → Portal SPA (portal.html)');
console.log('   oxypace.com.tr/portal/:id → Portal SPA (portal.html)');

