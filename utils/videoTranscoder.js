import path from 'path';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from './mediaConfig.js';
import axios from 'axios';
import https from 'https';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configure fluent-ffmpeg to use system binaries in production, static in development
if (process.env.NODE_ENV === 'production') {
    ffmpeg.setFfmpegPath('ffmpeg');
    ffmpeg.setFfprobePath('ffprobe');
    console.log('[VideoTranscoder] Configured to use system ffmpeg/ffprobe binaries.');
} else {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobeStatic.path);
    console.log('[VideoTranscoder] Configured to use static ffmpeg/ffprobe binaries.');
}

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
            
            const response = await axios({ 
                method: 'get', 
                url: originalUrl, 
                responseType: 'stream',
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            });
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

        // --- Step 2: Analyze dimensions with ffprobe first ---
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

        // Determine quality category of the original video
        let maxLabel = '144p';
        let maxField = 'p144';
        let maxRootField = 'video144';

        if (height >= 2160 || width >= 3840) {
            maxLabel = '2160p';
            maxField = 'p2160';
            maxRootField = 'video2160';
        } else if (height >= 1080 || width >= 1920) {
            maxLabel = '1080p';
            maxField = 'p1080';
            maxRootField = 'video1080';
        } else if (height >= 720 || width >= 1280) {
            maxLabel = '720p';
            maxField = 'p720';
            maxRootField = 'video720';
        } else if (height >= 360 || width >= 640) {
            maxLabel = '360p';
            maxField = 'p360';
            maxRootField = 'video360';
        }

        const keyOriginal = `${folder}/video_${maxLabel}_${postId}.mp4`;

        // --- Step 3: Upload original version immediately & update DB ---
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        console.log(`[VideoTranscoder] Uploading original version (${maxLabel}) to R2 immediately: ${keyOriginal}`);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: keyOriginal,
            ContentType: 'video/mp4',
            Body: fs.readFileSync(localInputPath)
        }));
        
        const urlOriginal = constructProxiedUrl(keyOriginal);
        
        // Pre-save original URL to DB immediately so user has access even if transcode fails
        const initialQualities = {
            high: urlOriginal,
            low: urlOriginal,
            p144: '',
            p360: '',
            p720: '',
            p1080: '',
            p2160: ''
        };
        initialQualities[maxField] = urlOriginal;

        const initialUpdates = {
            videoUrl: urlOriginal,
            media: urlOriginal,
            videoQualities: initialQualities
        };
        initialUpdates[maxRootField] = urlOriginal;

        await Post.findByIdAndUpdate(postId, initialUpdates);

        // --- Step 4: Run transcoding processes sequentially ---
        const targets = [
            { height: 1080, label: '1080p', field: 'p1080', rootField: 'video1080', bitrate: '2000k', maxrate: '2400k', bufsize: '4000k', audio: '128k' },
            { height: 720, label: '720p', field: 'p720', rootField: 'video720', bitrate: '1100k', maxrate: '1300k', bufsize: '2200k', audio: '128k' },
            { height: 360, label: '360p', field: 'p360', rootField: 'video360', bitrate: '400k', maxrate: '450k', bufsize: '800k', audio: '64k' },
            { height: 144, label: '144p', field: 'p144', rootField: 'video144', bitrate: '150k', maxrate: '180k', bufsize: '300k', audio: '64k' }
        ];

        const jobs = [];
        for (const target of targets) {
            // Only transcode to resolutions strictly lower than the original's height
            if (height > target.height) {
                const tempPath = path.join(process.cwd(), 'temp_media', `${target.label}-${postId}.mp4`);
                const key = `${folder}/video_${target.label}_${postId}.mp4`;
                jobs.push({
                    quality: target.label,
                    field: target.field,
                    rootField: target.rootField,
                    path: tempPath,
                    key: key,
                    options: [
                        `-vf scale=-2:${target.height}`,
                        '-pix_fmt yuv420p',
                        '-preset ultrafast',
                        '-threads 1',
                        `-b:v ${target.bitrate}`,
                        `-maxrate ${target.maxrate}`,
                        `-bufsize ${target.bufsize}`
                    ],
                    audioBitrate: target.audio
                });
            }
        }

        console.log(`[VideoTranscoder] Running ${jobs.length} transcoding jobs sequentially with -threads 1 and -preset ultrafast...`);

        const results = [];
        let currentInputPath = localInputPath;

        for (const job of jobs) {
            try {
                console.log(`[VideoTranscoder] Transcoding quality ${job.quality} using input: ${currentInputPath}`);
                const res = await new Promise((resolve, reject) => {
                    ffmpeg(currentInputPath)
                        .videoCodec('libx264')
                        .outputOptions(job.options)
                        .audioCodec('aac')
                        .audioBitrate(job.audioBitrate)
                        .output(job.path)
                        .on('end', () => {
                            console.log(`[VideoTranscoder] ${job.quality} transcode completed locally.`);
                            resolve({ quality: job.quality, field: job.field, rootField: job.rootField, path: job.path, key: job.key });
                        })
                        .on('error', (err) => {
                            console.error(`[VideoTranscoder] ${job.quality} transcode failed:`, err.message);
                            resolve(null); // resolve with null to proceed with remaining jobs
                        })
                        .run();
                });
                if (res) {
                    results.push(res);
                    // Use this successfully generated lower-resolution version as the input for the next job
                    currentInputPath = job.path;
                }
            } catch (jobErr) {
                console.error(`[VideoTranscoder] Failed during job ${job.quality}:`, jobErr.message);
            }
        }
        
        // --- Step 5: Upload successfully generated variations and update DB qualities ---
        const finalQualities = { ...initialQualities };
        const dbUpdates = { videoQualities: finalQualities };

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
                
                finalQualities[res.field] = url;
                dbUpdates[res.rootField] = url;
            }
        }

        // Determine the lowest available resolution URL to populate low/lowVideoUrl
        let lowestUrl = urlOriginal;
        if (finalQualities.p144) lowestUrl = finalQualities.p144;
        else if (finalQualities.p360) lowestUrl = finalQualities.p360;
        else if (finalQualities.p720) lowestUrl = finalQualities.p720;
        else if (finalQualities.p1080) lowestUrl = finalQualities.p1080;
        else if (finalQualities.p2160) lowestUrl = finalQualities.p2160;

        dbUpdates.lowVideoUrl = lowestUrl;
        finalQualities.low = lowestUrl;

        // Apply final updates to Post record
        await Post.findByIdAndUpdate(postId, dbUpdates);
        console.log(`[VideoTranscoder] ✅ Async transcoding pipeline completed for post ${postId}`);
        
        // Clean up temp files
        for (const job of jobs) {
            try { fs.unlinkSync(job.path); } catch(e) {}
        }
        try { fs.unlinkSync(localInputPath); } catch(e) {}
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode pipeline failed for post ${postId}:`, err.message);
        try {
            await Post.findByIdAndUpdate(postId, { transcodeError: `${err.message}\n${err.stack}` });
        } catch (dbErr) {
            console.error('Failed to save transcode error to DB:', dbErr);
        }
    }
}
