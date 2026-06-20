import { GetObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import fs from 'fs';
import path from 'path';

async function run() {
    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
    const key = 'posts/69485e416ce2eac8943a5de2/post-1781634262988-632706941.mp4';
    const localInputPath = path.join(process.cwd(), 'temp_media', 'sdk-download-test.mp4');

    console.log('Testing S3 SDK GetObjectCommand download...');
    try {
        fs.mkdirSync(path.dirname(localInputPath), { recursive: true });
        const response = await r2.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        }));
        
        const writer = fs.createWriteStream(localInputPath);
        response.Body.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        console.log('S3 SDK download success! File size:', fs.statSync(localInputPath).size);
    } catch (err) {
        console.error('S3 SDK download failed:', err);
    }
}

run();
