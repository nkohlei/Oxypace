import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
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
    // Build a strict POSIX-compliant ZIP with forward slashes and NO "./" root entry.
    // Windows tar.exe emits a "./" root entry that @capgo/capacitor-updater v8 rejects
    // with "Path escapes base directory: ./" during unzip.
    const pyZipScript = [
        'import os, sys, zipfile',
        'src = os.path.abspath(sys.argv[1])',
        'dst = os.path.abspath(sys.argv[2])',
        'count = 0',
        'with zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:',
        '    for root, dirs, files in os.walk(src):',
        '        dirs.sort()',
        '        files.sort()',
        '        for fname in files:',
        '            full_path = os.path.join(root, fname)',
        '            rel_path = os.path.relpath(full_path, src).replace(os.sep, "/")',
        '            if not rel_path or rel_path == "." or rel_path.startswith("./") or rel_path.startswith("/") or ".." in rel_path.split("/"):',
        '                continue',
        '            zf.write(full_path, rel_path)',
        '            count += 1',
        'print(f"Packed {count} clean POSIX entries into {dst}")',
    ].join('\n');

    execFileSync('python', ['-c', pyZipScript, distMobileDir, tempZipPath], {
        stdio: 'inherit',
    });

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
