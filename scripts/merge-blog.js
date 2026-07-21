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
const PORTAL_DEST = path.join(CLIENT_DIST, 'portal');  // Subfolder for Vite SPA

console.log('🔄 Merging Blog and Portal builds...');

if (!fs.existsSync(CLIENT_DIST)) {
    console.error('❌ client/dist directory not found!');
    process.exit(1);
}

if (!fs.existsSync(BLOG_OUT)) {
    console.error('❌ blog/out directory not found!');
    process.exit(1);
}

// 1. Move current client/dist items into client/dist/portal (except if it's already portal or blog static files)
const tempPortalDir = path.join(ROOT, 'client', 'temp_portal');
if (fs.existsSync(tempPortalDir)) {
    fs.rmSync(tempPortalDir, { recursive: true, force: true });
}

// Move current client/dist to temp_portal
fs.renameSync(CLIENT_DIST, tempPortalDir);

// Re-create empty client/dist
fs.mkdirSync(CLIENT_DIST, { recursive: true });

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

// 2. Copy Blog static export to client/dist (ROOT)
console.log('🌐 Copying Blog static export to root...');
copyRecursive(BLOG_OUT, CLIENT_DIST);

// 3. Copy Portal SPA to client/dist/portal
console.log('📦 Copying Portal SPA to /portal subfolder...');
copyRecursive(tempPortalDir, PORTAL_DEST);

// Cleanup temp_portal
try {
    fs.rmSync(tempPortalDir, { recursive: true, force: true });
} catch (e) {
    console.warn('⚠️ Could not remove temp_portal:', e.message);
}

console.log('\n✅ Merge complete!');
console.log('   oxypace.com.tr/        → Blog (Next.js)');
console.log('   oxypace.com.tr/portal/ → Oxypace Portal SPA');
