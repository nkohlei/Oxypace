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

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');

const PORTAL_DIST = path.join(ROOT, 'client', 'dist');   // Vite output
const BLOG_OUT    = path.join(ROOT, 'blog', 'out');       // Next.js static export
const PORTAL_DEST = path.join(PORTAL_DIST, 'portal');     // destination for SPA

// ── 1. Portal SPA → client/dist/portal/ ──────────────────────────────────────
console.log('📦 Organizing Portal SPA into /portal subfolder...');

if (!fs.existsSync(PORTAL_DIST)) {
    console.error('❌ client/dist does not exist. Run client build first.');
    process.exit(1);
}

// Move all portal files to /portal subfolder
// The Vite build is already in client/dist — but we need to move them to /portal
// Strategy: create /portal, move everything except /portal itself

fs.mkdirSync(PORTAL_DEST, { recursive: true });

const distEntries = fs.readdirSync(PORTAL_DIST).filter(e => e !== 'portal');
for (const entry of distEntries) {
    const src  = path.join(PORTAL_DIST, entry);
    const dest = path.join(PORTAL_DEST, entry);
    fs.renameSync(src, dest);
    console.log(`  moved: dist/${entry} → dist/portal/${entry}`);
}

// ── 2. Blog static files → client/dist/ (root) ───────────────────────────────
console.log('\n🌐 Copying Blog static export to dist root...');

if (!fs.existsSync(BLOG_OUT)) {
    console.error('❌ blog/out does not exist. Run blog build (next build --export) first.');
    process.exit(1);
}

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursive(BLOG_OUT, PORTAL_DIST);
console.log(`  copied: blog/out/* → dist/`);

console.log('\n✅ Merge complete!');
console.log('   oxypace.com.tr/        → Blog (Next.js static)');
console.log('   oxypace.com.tr/portal/ → Oxypace Portal SPA');
