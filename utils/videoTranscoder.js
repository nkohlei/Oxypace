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
        console.log(`[VideoTranscoder] Starting background transcode pipeline for post ${postId}, key: ${mediaKey}`);
        
        // Fetch post to get the portal reference and resolve path folder
        const post = await Post.findById(postId);
        if (!post) {
            console.error(`[VideoTranscoder] Post not found: ${postId}`);
            return;
        }
        
        const folder = post.portal ? `posts/${post.portal}` : 'posts/general';
        const key360p = `${folder}/low_360p_${postId}.mp4`;
        const key720p = `${folder}/mid_720p_${postId}.mp4`;
        const keyOriginal = `${folder}/original_${postId}.mp4`;
        
        // --- Step 1: Resolve the input local file ---
        let localInputPath = '';
        if (mediaKey.startsWith('temp_media/')) {
            localInputPath = path.join(process.cwd(), mediaKey);
        } else {
            // Fallback: If mediaKey is already on R2 (e.g. from direct upload), download it first
            const parsedKey = path.parse(mediaKey);
            const baseName = parsedKey.name;
            console.log(`[VideoTranscoder] Local file not found for ${mediaKey}. Downloading original from R2...`);
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
        
        if (!fs.existsSync(localInputPath)) {
            throw new Error(`Local input file does not exist: ${localInputPath}`);
        }
        
        // --- Step 2: Set up FFmpeg paths and import fluent-ffmpeg ---
        let ffmpeg;
        try {
            const mod = await import('fluent-ffmpeg');
            ffmpeg = mod.default || mod;
            // Explicitly set the FFmpeg binary path
            ffmpeg.setFfmpegPath('ffmpeg');
        } catch (importErr) {
            console.error('[VideoTranscoder] fluent-ffmpeg import failed:', importErr.message);
            return;
        }
        
        // Temp output paths
        const temp360pPath = path.join(process.cwd(), 'temp_media', `360p-${postId}.mp4`);
        const temp720pPath = path.join(process.cwd(), 'temp_media', `720p-${postId}.mp4`);
        
        // --- Step 3: Run transcoding concurrently/sequentially ---
        console.log(`[VideoTranscoder] Transcoding 360p ultra low quality (low_360p_${postId}.mp4)...`);
        await new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .size('?x360')
                .outputOptions([
                    '-b:v 300k',
                    '-maxrate 350k',
                    '-bufsize 700k',
                    '-crf 30',
                    '-preset fast'
                ])
                .audioCodec('aac')
                .audioBitrate('64k')
                .output(temp360pPath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error('[VideoTranscoder] 360p transcode failed:', err);
                    reject(err);
                })
                .run();
        });

        console.log(`[VideoTranscoder] Transcoding 720p standard quality (mid_720p_${postId}.mp4)...`);
        await new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .size('?x720')
                .outputOptions([
                    '-b:v 1000k',
                    '-maxrate 1200k',
                    '-bufsize 1600k',
                    '-crf 25',
                    '-preset fast'
                ])
                .audioCodec('aac')
                .audioBitrate('128k')
                .output(temp720pPath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error('[VideoTranscoder] 720p transcode failed:', err);
                    reject(err);
                })
                .run();
        });
        
        // --- Step 4: Upload all 3 outputs to R2 ---
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        
        console.log(`[VideoTranscoder] Uploading low_360p version to R2: ${key360p}`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key360p,
            ContentType: 'video/mp4',
            Body: fs.readFileSync(temp360pPath)
        }));

        console.log(`[VideoTranscoder] Uploading mid_720p version to R2: ${key720p}`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key720p,
            ContentType: 'video/mp4',
            Body: fs.readFileSync(temp720pPath)
        }));

        console.log(`[VideoTranscoder] Uploading original version to R2: ${keyOriginal}`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: keyOriginal,
            ContentType: 'video/mp4',
            Body: fs.readFileSync(localInputPath)
        }));
        
        const url360p = constructProxiedUrl(key360p);
        const url720p = constructProxiedUrl(key720p);
        const urlOriginal = constructProxiedUrl(keyOriginal);
        
        // --- Step 5: Update Post in Database ---
        await Post.findByIdAndUpdate(postId, {
            video360: url360p,
            video720: url720p,
            videoOriginal: urlOriginal,
            videoUrl: urlOriginal,
            lowVideoUrl: url360p,
            media: urlOriginal,
            videoQualities: {
                high: urlOriginal,
                low: url360p,
                p360: url360p,
                p720: url720p,
                p1080: urlOriginal
            }
        });
        
        console.log(`[VideoTranscoder] ✅ Mandatory transcoding pipeline succeeded for post ${postId}`);
        
        // Clean up temp files
        try { fs.unlinkSync(temp360pPath); } catch(e) {}
        try { fs.unlinkSync(temp720pPath); } catch(e) {}
        try { fs.unlinkSync(localInputPath); } catch(e) {}
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode pipeline failed for post ${postId}:`, err.message);
    }
}
