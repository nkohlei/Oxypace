/**
 * scripts/merge-blog.js
 *
 * Build sonrası birleştirme scripti:
 *
 * 1. Oxypace Portal (Vite SPA) zaten client/dist/ içinde build edildi
 *    ama şimdi onu client/dist/portal/ alt klasörüne taşıyoruz.
 * 2. Blog (Next.js static export) blog/out/ klasöründe.
 *    Bu dosyaları client/dist/ ve root dist/ klasörüne kopyalıyoruz.
 *
 * Sonuç:
 *   client/dist/ & dist/          → Blog (Next.js) — oxypace.com.tr/
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
const ROOT_DIST   = path.join(ROOT, 'dist');           // Root dist for Netlify publish

console.log('🔄 Merging Blog and Portal builds...');

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

// 1. Preserve Vite Portal SPA index.html as portal.html
const portalHtmlSrc = path.join(CLIENT_DIST, 'index.html');
const portalHtmlDest = path.join(CLIENT_DIST, 'portal.html');
if (fs.existsSync(portalHtmlSrc)) {
    console.log('📦 Preserving Portal SPA HTML as portal.html...');
    fs.copyFileSync(portalHtmlSrc, portalHtmlDest);
}

// 2. Copy Blog static files into client/dist (Blog index.html overrides root index.html)
console.log('🌐 Copying Blog static export over dist root...');
copyRecursive(BLOG_OUT, CLIENT_DIST);

// 3. Mirror merged output to ROOT/dist to guarantee Netlify publish works everywhere
console.log('📦 Mirroring merged output to ROOT/dist...');
copyRecursive(CLIENT_DIST, ROOT_DIST);

console.log('\n✅ Merge complete!');
console.log('   oxypace.com.tr/          → Blog (Next.js - index.html)');
console.log('   oxypace.com.tr/login      → Portal SPA (portal.html)');
console.log('   oxypace.com.tr/messages   → Portal SPA (portal.html)');
console.log('   oxypace.com.tr/portal/:id → Portal SPA (portal.html)');
