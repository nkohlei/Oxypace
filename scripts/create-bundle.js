import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distMobileDir = path.join(rootDir, 'client', 'dist-mobile');
const tempZipPath = path.join(rootDir, 'bundle.zip');

const targetDestinations = [
    path.join(rootDir, 'public', 'downloads', 'bundle.zip')
];

console.log('📦 [Bundle Creator] Packaging client/dist-mobile into OTA bundle.zip...');

if (!fs.existsSync(distMobileDir)) {
    console.error('❌ Error: client/dist-mobile does not exist! Run npm run mobile:build first.');
    process.exit(1);
}

// Ensure downloads directories exist
targetDestinations.forEach(dest => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Remove existing temp bundle.zip if any
if (fs.existsSync(tempZipPath)) {
    fs.unlinkSync(tempZipPath);
}

try {
    // Use native Windows tar.exe for fast, reliable zip archive creation without file lock collisions
    const tarCmd = `tar.exe -a -c -f "${tempZipPath}" -C "${distMobileDir}" .`;
    execSync(tarCmd, { stdio: 'inherit' });

    if (!fs.existsSync(tempZipPath)) {
        throw new Error('bundle.zip was not created');
    }

    const stats = fs.statSync(tempZipPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ bundle.zip created successfully (${sizeMb} MB)`);

    // Copy to all download destinations
    targetDestinations.forEach(dest => {
        fs.copyFileSync(tempZipPath, dest);
        console.log(`   -> Copied to: ${dest}`);
    });

    // Cleanup temp file
    fs.unlinkSync(tempZipPath);
    console.log('🚀 OTA Bundle ready for instant live update push!');
} catch (err) {
    console.error('❌ Failed to package bundle:', err);
    process.exit(1);
}
