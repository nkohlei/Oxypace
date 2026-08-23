import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');

const MOBILE_DIST = path.join(ROOT, 'client', 'dist-mobile');
const BLOG_OUT    = path.join(ROOT, 'blog', 'out');

console.log('📱 Merging original Next.js EVENT HORIZON into Mobile bundle...');

if (!fs.existsSync(MOBILE_DIST)) {
    console.error('❌ client/dist-mobile directory not found!');
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

// 1. Copy original blog static output into dist-mobile EXCEPT index.html (to keep React App as mobile root)
const blogEntries = fs.readdirSync(BLOG_OUT);
for (const entry of blogEntries) {
    const srcPath = path.join(BLOG_OUT, entry);
    const destPath = path.join(MOBILE_DIST, entry);
    if (entry === 'index.html') {
        // Copy original blog home as blog-home.html inside dist-mobile/blog/index.html
        const blogHomeDest = path.join(MOBILE_DIST, 'blog', 'index.html');
        fs.mkdirSync(path.join(MOBILE_DIST, 'blog'), { recursive: true });
        fs.copyFileSync(srcPath, blogHomeDest);
    } else {
        copyRecursive(srcPath, destPath);
    }
}

console.log('✅ Mobile EVENT HORIZON original integration complete!');
