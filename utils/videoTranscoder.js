import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from './mediaConfig.js';
import axios from 'axios';

/**
 * Checks if FFmpeg is available on the system.
 */
async function isFfmpegAvailable() {
    try {
        const { exec } = await import('child_process');
        return new Promise((resolve) => {
            exec('ffmpeg -version', { timeout: 5000 }, (err) => resolve(!err));
        });
    } catch {
        return false;
    }
}

/**
 * Runs FFmpeg transcoding in the background.
 * If FFmpeg is not available, falls back gracefully and sets low quality to the original.
 * 
 * @param {string} postId - MongoDB ID of the Post
 * @param {string} mediaKey - Cloudflare R2 file key of the original video
 */
export async function transcodeVideoInBackground(postId, mediaKey) {
    try {
        console.log(`[VideoTranscoder] Starting background transcode for post ${postId}, key: ${mediaKey}`);
        
        // --- Step 1: Check if FFmpeg is available ---
        const ffmpegReady = await isFfmpegAvailable();
        if (!ffmpegReady) {
            console.warn(`[VideoTranscoder] FFmpeg not available on this server. Skipping transcode for post ${postId}.`);
            console.warn(`[VideoTranscoder] Video is already on R2 as original quality. No action needed.`);
            return;
        }
        
        // --- Step 2: Prepare paths ---
        const parsedKey = path.parse(mediaKey);
        const folder = parsedKey.dir || 'posts/general';
        const baseName = parsedKey.name;
        const cleanBaseName = baseName.replace(/^original_/, '');
        const lowKey = `${folder}/low_360p_${cleanBaseName}.mp4`;
        
        // --- Step 3: Get the source video (prefer local temp, fallback to R2 download) ---
        let localInputPath = path.join(process.cwd(), 'temp_media', `${baseName}.mp4`);
        const isLocal = fs.existsSync(localInputPath);
        
        if (!isLocal) {
            console.log(`[VideoTranscoder] Local file not found. Downloading original from R2...`);
            const originalUrl = constructProxiedUrl(mediaKey);
            localInputPath = path.join(process.cwd(), 'temp_media', `download-${baseName}.mp4`);
            fs.mkdirSync(path.dirname(localInputPath), { recursive: true });
            
            const response = await axios({ method: 'get', url: originalUrl, responseType: 'stream' });
            const writer = fs.createWriteStream(localInputPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`[VideoTranscoder] Download complete: ${localInputPath}`);
        }
        
        // --- Step 4: Transcode to 360p ---
        const tempLowPath = path.join(process.cwd(), 'temp_media', `low-${baseName}.mp4`);
        
        // Dynamic import of fluent-ffmpeg to avoid startup crash if package is missing
        let ffmpeg;
        try {
            const mod = await import('fluent-ffmpeg');
            ffmpeg = mod.default || mod;
        } catch (importErr) {
            console.error('[VideoTranscoder] fluent-ffmpeg import failed:', importErr.message);
            try { fs.unlinkSync(localInputPath); } catch(e) {}
            return;
        }
        
        console.log(`[VideoTranscoder] Transcoding 360p low quality for post ${postId}...`);
        await new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .size('?x360')
                .outputOptions([
                    '-b:v 450k',
                    '-maxrate 500k',
                    '-bufsize 1000k',
                    '-crf 28',
                    '-preset fast'
                ])
                .audioCodec('aac')
                .audioBitrate('64k')
                .output(tempLowPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        
        // --- Step 5: Upload 360p to R2 ---
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        console.log(`[VideoTranscoder] Uploading low 360p version to R2: ${lowKey}`);
        const bufferLow = fs.readFileSync(tempLowPath);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: lowKey,
            ContentType: 'video/mp4',
            Body: bufferLow
        }));
        
        const lowUrl = constructProxiedUrl(lowKey);
        const highUrl = constructProxiedUrl(mediaKey); // original is already high quality
        
        // --- Step 6: Update Post with the new low quality URL ---
        await Post.findByIdAndUpdate(postId, {
            lowVideoUrl: lowUrl,
            videoQualities: {
                high: highUrl,
                low: lowUrl
            }
        });
        
        console.log(`[VideoTranscoder] ✅ 360p transcode succeeded for post ${postId}`);
        
        // Cleanup temp files
        try { fs.unlinkSync(tempLowPath); } catch(e) {}
        try { fs.unlinkSync(localInputPath); } catch(e) {}
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode failed for post ${postId}:`, err.message);
        // Non-fatal: original video is still accessible on R2
    }
}
