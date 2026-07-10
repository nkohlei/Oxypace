const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../client/dist');
const dest = path.join(__dirname, 'client-dist');

// Recursive directory copy helper using pure node APIs
function copyDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Clean destDir first
if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
}

console.log('Copying client build from:', src, '->', dest);
if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log('Client build files copied successfully!');
} else {
    console.error('Error: Source directory client/dist does not exist. Make sure client is built first.');
    process.exit(1);
}
