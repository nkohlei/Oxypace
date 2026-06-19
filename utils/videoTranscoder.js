import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from './mediaConfig.js';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configure fluent-ffmpeg to use static binaries
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Runs FFmpeg transcoding in the background.
 * 
 * @param {string} postId - MongoDB ID of the Post
 * @param {string} mediaKey - Cloudflare R2 file key or local temp path
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
        const key144p = `${folder}/video_144p_${postId}.mp4`;
        const key360p = `${folder}/video_360p_${postId}.mp4`;
        const key720p = `${folder}/video_720p_${postId}.mp4`;
        const keyOriginal = `${folder}/video_original_${postId}.mp4`;
        
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

        // --- Step 2: Upload original version immediately & update DB ---
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        console.log(`[VideoTranscoder] Uploading original version to R2 immediately: ${keyOriginal}`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: keyOriginal,
            ContentType: 'video/mp4',
            Body: fs.readFileSync(localInputPath)
        }));
        
        const urlOriginal = constructProxiedUrl(keyOriginal);
        
        // Pre-save original URL to DB immediately so user has access even if transcode fails
        await Post.findByIdAndUpdate(postId, {
            videoOriginal: urlOriginal,
            videoUrl: urlOriginal,
            media: urlOriginal,
            videoQualities: {
                high: urlOriginal,
                p1080: urlOriginal,
                low: urlOriginal,
                p144: urlOriginal,
                p360: urlOriginal
            }
        });

        // --- Step 3: Analyze dimensions with ffprobe ---
        const metadata = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(localInputPath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const height = videoStream ? parseInt(videoStream.height, 10) : 0;
        const width = videoStream ? parseInt(videoStream.width, 10) : 0;
        console.log(`[VideoTranscoder] Video dimensions detected: ${width}x${height}`);

        const has720p = height >= 720 || width >= 1280;
        const has1080p = height >= 1080 || width >= 1920;
        
        // Temp output paths
        const temp144pPath = path.join(process.cwd(), 'temp_media', `144p-${postId}.mp4`);
        const temp360pPath = path.join(process.cwd(), 'temp_media', `360p-${postId}.mp4`);
        const temp720pPath = path.join(process.cwd(), 'temp_media', `720p-${postId}.mp4`);
        
        // --- Step 4: Run transcoding processes asynchronously (concurrently) ---
        const transcodePromises = [];

        console.log(`[VideoTranscoder] Scheduling async transcoding pipelines with -preset ultrafast...`);
        
        // 144p Job
        transcodePromises.push(new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .outputOptions([
                    '-vf scale=256:144:flags=neighbor',
                    '-pix_fmt yuv420p',
                    '-preset ultrafast',
                    '-b:v 100k',
                    '-maxrate 120k',
                    '-bufsize 200k',
                    '-crf 30'
                ])
                .audioCodec('aac')
                .audioBitrate('64k')
                .output(temp144pPath)
                .on('end', () => {
                    console.log(`[VideoTranscoder] 144p transcode completed locally.`);
                    resolve({ quality: '144p', path: temp144pPath, key: key144p });
                })
                .on('error', (err) => {
                    console.error('[VideoTranscoder] 144p transcode failed:', err.message);
                    resolve(null); // resolve with null to keep Promise.all going
                })
                .run();
        }));

        // 360p Job
        transcodePromises.push(new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .outputOptions([
                    '-vf scale=480:360:flags=neighbor',
                    '-pix_fmt yuv420p',
                    '-preset ultrafast',
                    '-b:v 350k',
                    '-maxrate 400k',
                    '-bufsize 700k',
                    '-crf 30'
                ])
                .audioCodec('aac')
                .audioBitrate('64k')
                .output(temp360pPath)
                .on('end', () => {
                    console.log(`[VideoTranscoder] 360p transcode completed locally.`);
                    resolve({ quality: '360p', path: temp360pPath, key: key360p });
                })
                .on('error', (err) => {
                    console.error('[VideoTranscoder] 360p transcode failed:', err.message);
                    resolve(null);
                })
                .run();
        }));

        // 720p Job (Conditional)
        if (has720p) {
            transcodePromises.push(new Promise((resolve, reject) => {
                ffmpeg(localInputPath)
                    .videoCodec('libx264')
                    .outputOptions([
                        '-vf scale=1280:720:flags=neighbor',
                        '-pix_fmt yuv420p',
                        '-preset ultrafast',
                        '-b:v 1100k',
                        '-maxrate 1300k',
                        '-bufsize 2200k',
                        '-crf 24'
                    ])
                    .audioCodec('aac')
                    .audioBitrate('128k')
                    .output(temp720pPath)
                    .on('end', () => {
                        console.log(`[VideoTranscoder] 720p transcode completed locally.`);
                        resolve({ quality: '720p', path: temp720pPath, key: key720p });
                    })
                    .on('error', (err) => {
                        console.error('[VideoTranscoder] 720p transcode failed:', err.message);
                        resolve(null);
                    })
                    .run();
            }));
        }

        // Wait for all transcode tasks to finish
        const results = await Promise.all(transcodePromises);
        
        // --- Step 5: Upload successfully generated variations and update DB qualities ---
        const finalQualities = {
            high: urlOriginal,
            p1080: has1080p ? urlOriginal : ''
        };
        const dbUpdates = {};

        for (const res of results) {
            if (res) {
                console.log(`[VideoTranscoder] Uploading ${res.quality} version to R2: ${res.key}`);
                await r2.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: res.key,
                    ContentType: 'video/mp4',
                    Body: fs.readFileSync(res.path)
                }));
                const url = constructProxiedUrl(res.key);
                
                if (res.quality === '144p') {
                    dbUpdates.video144 = url;
                    dbUpdates.lowVideoUrl = url;
                    finalQualities.p144 = url;
                    finalQualities.low = url;
                } else if (res.quality === '360p') {
                    dbUpdates.video360 = url;
                    finalQualities.p360 = url;
                } else if (res.quality === '720p') {
                    dbUpdates.video720 = url;
                    finalQualities.p720 = url;
                }
            }
        }

        dbUpdates.videoQualities = finalQualities;

        // Apply final updates to Post record
        await Post.findByIdAndUpdate(postId, dbUpdates);
        console.log(`[VideoTranscoder] ✅ Async transcoding pipeline completed for post ${postId}`);
        
        // Clean up temp files
        try { fs.unlinkSync(temp144pPath); } catch(e) {}
        try { fs.unlinkSync(temp360pPath); } catch(e) {}
        if (has720p) {
            try { fs.unlinkSync(temp720pPath); } catch(e) {}
        }
        try { fs.unlinkSync(localInputPath); } catch(e) {}
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode pipeline failed for post ${postId}:`, err.message);
    }
}
