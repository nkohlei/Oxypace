import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const appVersionPath = path.join(rootDir, 'config', 'appVersion.js');
const otaUpdaterPath = path.join(rootDir, 'client', 'src', 'utils', 'otaUpdater.js');

const appVerSrc = fs.readFileSync(appVersionPath, 'utf8');
const match = appVerSrc.match(/otaVersion:\s*'([^']+)'/);
if (!match) {
    console.error('❌ Could not find otaVersion in config/appVersion.js');
    process.exit(1);
}

const currentOta = match[1];
const otaParts = currentOta.match(/^(.*-ota\.)(\d+)$/);
const nextOta = otaParts ? `${otaParts[1]}${Number(otaParts[2]) + 1}` : `${currentOta}.1`;

console.log(`🔄 [OTA Release] Bumping OTA bundle version: ${currentOta} -> ${nextOta}`);

const updatedAppVer = appVerSrc.replace(/otaVersion:\s*'[^']+'/, `otaVersion: '${nextOta}'`);
fs.writeFileSync(appVersionPath, updatedAppVer, 'utf8');

if (fs.existsSync(otaUpdaterPath)) {
    const otaSrc = fs.readFileSync(otaUpdaterPath, 'utf8');
    const updatedOtaSrc = otaSrc.replace(
        /export const CURRENT_OTA_VERSION = '[^']+';/,
        `export const CURRENT_OTA_VERSION = '${nextOta}';`
    );
    fs.writeFileSync(otaUpdaterPath, updatedOtaSrc, 'utf8');
}

execSync('npm run mobile:build', { cwd: rootDir, stdio: 'inherit' });
execSync('node scripts/create-bundle.js', { cwd: rootDir, stdio: 'inherit' });

const bundlePath = path.join(rootDir, 'public', 'downloads', 'bundle.zip');
const sizeMb = fs.existsSync(bundlePath)
    ? (fs.statSync(bundlePath).size / (1024 * 1024)).toFixed(2)
    : 'unknown';

console.log(`\n✅ [OTA Release Ready] otaVersion=${nextOta} | public/downloads/bundle.zip (${sizeMb} MB)`);
console.log('   Deploy to OCI / push origin/main so all installed apps auto-update on next foreground/open.');
