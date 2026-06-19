import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from './mediaConfig.js';

/**
 * Runs FFmpeg commands in the background to transcode the uploaded video
 * to high (720p) and low (480p) streams, uploads them to R2, and updates the database.
 * 
 * @param {string} postId - MongoDB ID of the Post
 * @param {string} mediaKey - Cloudflare R2 file key of the original video
 */
export async function transcodeVideoInBackground(postId, mediaKey) {
    try {
        console.log(`[VideoTranscoder] Starting background transcode for post ${postId}, key: ${mediaKey}`);
        
        // 1. Get absolute URL of the original video to stream it into FFmpeg
        const originalUrl = constructProxiedUrl(mediaKey);
        
        // 2. Setup temp output file paths
        const tempDir = os.tmpdir();
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const out480pPath = path.join(tempDir, `transcode-${uniqueId}-480p.mp4`);
        const out720pPath = path.join(tempDir, `transcode-${uniqueId}-720p.mp4`);
        
        // 3. Define FFmpeg commands
        // Low quality: Max height 480px, low bitrate/crf to save bandwidth
        const cmd480p = `ffmpeg -y -i "${originalUrl}" -vf "scale=-2:'min(480,ih)'" -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 96k "${out480pPath}"`;
        // High quality: Max height 720px, high quality
        const cmd720p = `ffmpeg -y -i "${originalUrl}" -vf "scale=-2:'min(720,ih)'" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "${out720pPath}"`;
        
        // 4. Run transcoding promises
        console.log(`[VideoTranscoder] Transcoding 480p for post ${postId}...`);
        await runCommandPromise(cmd480p);
        
        console.log(`[VideoTranscoder] Transcoding 720p for post ${postId}...`);
        await runCommandPromise(cmd720p);
        
        // 5. Verify output files
        const exists480 = fs.existsSync(out480pPath) && fs.statSync(out480pPath).size > 0;
        const exists720 = fs.existsSync(out720pPath) && fs.statSync(out720pPath).size > 0;
        
        if (!exists480 || !exists720) {
            throw new Error(`Transcoding failed. Files exist: 480p:${exists480}, 720p:${exists720}`);
        }
        
        // 6. Upload variations to R2
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        const parsedKey = path.parse(mediaKey);
        const folder = parsedKey.dir || 'posts/general';
        const baseName = parsedKey.name;
        
        const key480 = `${folder}/${baseName}-480p.mp4`;
        const key720 = `${folder}/${baseName}-720p.mp4`;
        
        console.log(`[VideoTranscoder] Uploading 480p stream to R2: ${key480}`);
        const buffer480 = fs.readFileSync(out480pPath);
        const put480 = new PutObjectCommand({
            Bucket: bucketName,
            Key: key480,
            ContentType: 'video/mp4',
            Body: buffer480
        });
        await r2.send(put480);
        
        console.log(`[VideoTranscoder] Uploading 720p stream to R2: ${key720}`);
        const buffer720 = fs.readFileSync(out720pPath);
        const put720 = new PutObjectCommand({
            Bucket: bucketName,
            Key: key720,
            ContentType: 'video/mp4',
            Body: buffer720
        });
        await r2.send(put720);
        
        // 7. Update database record
        const highUrl = constructProxiedUrl(key720);
        const lowUrl = constructProxiedUrl(key480);
        
        await Post.findByIdAndUpdate(postId, {
            videoQualities: {
                high: highUrl,
                low: lowUrl
            }
        });
        
        console.log(`[VideoTranscoder] Background transcode succeeded for post ${postId}`);
        
        // 8. Cleanup local temp files
        fs.unlinkSync(out480pPath);
        fs.unlinkSync(out720pPath);
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode failed for post ${postId}:`, err.message);
    }
}

function runCommandPromise(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve(stdout);
        });
    });
}
