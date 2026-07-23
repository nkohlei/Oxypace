import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const portalHtmlPath = path.join(ROOT, 'client', 'dist', 'portal.html');
const androidAssetsPublic = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public');
const androidAssetsIndex = path.join(androidAssetsPublic, 'index.html');

console.log('📱 Preparing Mobile App Assets (Setting Portal SPA as root index.html)...');

if (fs.existsSync(portalHtmlPath) && fs.existsSync(androidAssetsPublic)) {
    fs.copyFileSync(portalHtmlPath, androidAssetsIndex);
    console.log('✅ Mobile App root index.html set to Oxypace Portal SPA (Login page entry).');
} else {
    console.warn('⚠️ Mobile assets or portal.html not found yet.');
}
