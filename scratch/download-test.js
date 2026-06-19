import https from 'https';
import fs from 'fs';
import path from 'path';

const fileUrl = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev/posts/698f48ca55ed38a478568561/video_1080p_6a35bba84be82c034ba5d261.mp4';
const dest = path.join(process.cwd(), 'temp_media', 'test.mp4');

console.log('Downloading video...');
const file = fs.createWriteStream(dest);

https.get(fileUrl, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download completed successfully!');
        process.exit(0);
    });
}).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Download failed:', err.message);
    process.exit(1);
});
