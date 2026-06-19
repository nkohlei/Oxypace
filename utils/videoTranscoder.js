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

// ─────────────────────────────────────────────────────────────────────────────
// RAM-SAFE UPLOAD: stream file directly to R2 instead of readFileSync.
// readFileSync on a 100MB video buffers the entire file into Node heap — fatal
// on a 512 MB Koyeb instance. createReadStream keeps RAM usage near-zero.
// ─────────────────────────────────────────────────────────────────────────────
async function uploadFileToR2(localPath, r2Key, bucketName) {
    const fileStream = fs.createReadStream(localPath);
    const stat = fs.statSync(localPath);
    await r2.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: r2Key,
        ContentType: 'video/mp4',
        ContentLength: stat.size,
        Body: fileStream
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE DELETE: swallow ENOENT — file may already have been cleaned up.
// ─────────────────────────────────────────────────────────────────────────────
function safeUnlink(filePath) {
    try { fs.unlinkSync(filePath); } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE HARDWARE-OPTIMISED FFmpeg OPTIONS
//
//  -threads 1          → single encoder thread; keeps CPU & RAM minimal
//  -frame-threads 1    → decode one frame at a time (no multi-frame buffering)
//  -tile-columns 0     → disable parallel tile encoding (VP9/AV1 guard, libx264 no-op but safe)
//  -preset ultrafast   → fastest x264 compression mode; least RAM per frame
//  -tune fastdecode    → optimise bitstream for low-cost decoding on mobile/web
//  -pix_fmt yuv420p    → universal colour space; avoids extra conversion passes
//
// All together these cap peak RAM at ~60-80 MB per FFmpeg child process.
// ─────────────────────────────────────────────────────────────────────────────
const FFMPEG_RAM_SAFE_FLAGS = [
    '-threads 1',
    '-frame-threads 1',
    '-tile-columns 0',
    '-preset ultrafast',
    '-tune fastdecode',
    '-pix_fmt yuv420p'
];

/**
 * Transcode a single quality level synchronously.
 * Returns the output file path on success, null on failure.
 * Caller is responsible for cleaning up the output file.
 */
function transcodeQuality({ inputPath, outputPath, scaleFilter, videoBitrate, maxrate, bufsize, audioBitrate }) {
    return new Promise((resolve) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .outputOptions([
                ...FFMPEG_RAM_SAFE_FLAGS,
                `-vf ${scaleFilter}`,
                `-b:v ${videoBitrate}`,
                `-maxrate ${maxrate}`,
                `-bufsize ${bufsize}`
            ])
            .audioCodec('aac')
            .audioBitrate(audioBitrate)
            .output(outputPath)
            .on('start', (cmd) => {
                console.log(`[VideoTranscoder] FFmpeg started: ${cmd.slice(0, 120)}...`);
            })
            .on('end', () => {
                console.log(`[VideoTranscoder] ✅ Transcode done → ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`[VideoTranscoder] ❌ Transcode failed: ${err.message}`);
                resolve(null); // Non-fatal: continue with remaining qualities
            })
            .run();
    });
}

/**
 * Runs FFmpeg transcoding in the background with strict 512 MB RAM budget.
 *
 * @param {string} postId  - MongoDB ID of the Post
 * @param {string} mediaKey - Cloudflare R2 file key or local temp path
 */
export async function transcodeVideoInBackground(postId, mediaKey) {
    try {
        console.log(`[VideoTranscoder] 🎬 Starting pipeline for post ${postId}, key: ${mediaKey}`);

        const post = await Post.findById(postId);
        if (!post) {
            console.error(`[VideoTranscoder] Post not found: ${postId}`);
            return;
        }

        const folder = post.portal ? `posts/${post.portal}` : 'posts/general';
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';

        // ── Step 1: Resolve local input file ──────────────────────────────────
        let localInputPath = '';
        if (mediaKey.startsWith('temp_media/')) {
            localInputPath = path.join(process.cwd(), mediaKey);
        } else {
            const baseName = path.parse(mediaKey).name;
            console.log(`[VideoTranscoder] Downloading original from R2: ${mediaKey}`);
            localInputPath = path.join(process.cwd(), 'temp_media', `download-${baseName}.mp4`);
            fs.mkdirSync(path.dirname(localInputPath), { recursive: true });

            const response = await axios({
                method: 'get',
                url: constructProxiedUrl(mediaKey),
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

        // ── Step 2: Probe video dimensions ────────────────────────────────────
        const metadata = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(localInputPath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const srcHeight = videoStream ? parseInt(videoStream.height, 10) : 0;
        const srcWidth  = videoStream ? parseInt(videoStream.width,  10) : 0;
        console.log(`[VideoTranscoder] Source dimensions: ${srcWidth}x${srcHeight}`);

        // ── Step 3: Determine original quality label ──────────────────────────
        let maxLabel     = '144p';
        let maxField     = 'p144';
        let maxRootField = 'video144';

        if      (srcHeight >= 2160 || srcWidth >= 3840) { maxLabel = '2160p'; maxField = 'p2160'; maxRootField = 'video2160'; }
        else if (srcHeight >= 1080 || srcWidth >= 1920) { maxLabel = '1080p'; maxField = 'p1080'; maxRootField = 'video1080'; }
        else if (srcHeight >= 720  || srcWidth >= 1280) { maxLabel = '720p';  maxField = 'p720';  maxRootField = 'video720';  }
        else if (srcHeight >= 360  || srcWidth >= 640 ) { maxLabel = '360p';  maxField = 'p360';  maxRootField = 'video360';  }

        // ── Step 4: Upload original immediately → guarantee playback from t=0 ─
        const keyOriginal = `${folder}/video_${maxLabel}_${postId}.mp4`;
        console.log(`[VideoTranscoder] Uploading original (${maxLabel}) via stream → ${keyOriginal}`);
        await uploadFileToR2(localInputPath, keyOriginal, bucketName);
        const urlOriginal = constructProxiedUrl(keyOriginal);

        // Write original to DB right away — video is playable even if transcode crashes
        const initialQualities = {
            high:  urlOriginal,
            low:   urlOriginal,
            p144:  '',
            p360:  '',
            p720:  '',
            p1080: '',
            p2160: ''
        };
        initialQualities[maxField] = urlOriginal;

        const initialUpdates = {
            videoUrl:       urlOriginal,
            media:          urlOriginal,
            videoQualities: initialQualities
        };
        initialUpdates[maxRootField] = urlOriginal;

        await Post.findByIdAndUpdate(postId, initialUpdates);
        console.log(`[VideoTranscoder] ✅ Original quality (${maxLabel}) saved to DB. Video is immediately playable.`);

        // ── Step 5: Sequential low-memory transcoding queue ───────────────────
        //
        // Quality ladder — highest to lowest so each job is a downscale.
        // -vf scale=-2:H  = maintain original aspect ratio; width rounded to even.
        //
        // We always transcode FROM THE ORIGINAL (localInputPath) to prevent
        // chained quality loss AND avoid keeping two temp files open at once.
        // After each job completes + uploads, we immediately delete the temp file.
        // ─────────────────────────────────────────────────────────────────────
        const qualityLadder = [
            { targetH: 720,  label: '720p',  field: 'p720',  rootField: 'video720',  bitrate: '1100k', maxrate: '1300k', bufsize: '2200k', audio: '128k' },
            { targetH: 360,  label: '360p',  field: 'p360',  rootField: 'video360',  bitrate: '400k',  maxrate: '450k',  bufsize: '800k',  audio: '64k'  },
            { targetH: 144,  label: '144p',  field: 'p144',  rootField: 'video144',  bitrate: '150k',  maxrate: '180k',  bufsize: '300k',  audio: '64k'  }
        ];

        // Filter to only jobs strictly below the source resolution
        const jobs = qualityLadder.filter(q => srcHeight > q.targetH);
        console.log(`[VideoTranscoder] ${jobs.length} transcode jobs queued (sequential, -threads 1, -preset ultrafast)`);

        const finalQualities = { ...initialQualities };
        const dbUpdates      = { videoQualities: finalQualities };

        for (const job of jobs) {
            const tempOut = path.join(process.cwd(), 'temp_media', `${job.label}-${postId}.mp4`);
            const r2Key   = `${folder}/video_${job.label}_${postId}.mp4`;

            console.log(`[VideoTranscoder] → Starting ${job.label} transcode...`);

            const outputPath = await transcodeQuality({
                inputPath:    localInputPath,          // always from original — no chained quality loss
                outputPath:   tempOut,
                scaleFilter:  `scale=-2:${job.targetH}`, // -2 preserves AR with even-width constraint
                videoBitrate: job.bitrate,
                maxrate:      job.maxrate,
                bufsize:      job.bufsize,
                audioBitrate: job.audio
            });

            if (outputPath && fs.existsSync(outputPath)) {
                try {
                    console.log(`[VideoTranscoder] Uploading ${job.label} via stream → ${r2Key}`);
                    await uploadFileToR2(outputPath, r2Key, bucketName);
                    const url = constructProxiedUrl(r2Key);

                    finalQualities[job.field]  = url;
                    dbUpdates[job.rootField]   = url;

                    // Flush DB after each quality so partial results survive a crash
                    await Post.findByIdAndUpdate(postId, {
                        videoQualities: { ...finalQualities },
                        [job.rootField]: url
                    });
                    console.log(`[VideoTranscoder] ✅ ${job.label} written to DB.`);
                } catch (uploadErr) {
                    console.error(`[VideoTranscoder] Upload failed for ${job.label}:`, uploadErr.message);
                } finally {
                    // Immediately free disk + RAM — do NOT wait for next job
                    safeUnlink(outputPath);
                }
            }
        }

        // ── Step 6: Final DB pass — update low/high pointers ─────────────────
        let lowestUrl = urlOriginal;
        if (finalQualities.p144)  lowestUrl = finalQualities.p144;
        else if (finalQualities.p360)  lowestUrl = finalQualities.p360;
        else if (finalQualities.p720)  lowestUrl = finalQualities.p720;
        else if (finalQualities.p1080) lowestUrl = finalQualities.p1080;
        else if (finalQualities.p2160) lowestUrl = finalQualities.p2160;

        finalQualities.low  = lowestUrl;
        finalQualities.high = urlOriginal;

        await Post.findByIdAndUpdate(postId, {
            lowVideoUrl:    lowestUrl,
            videoQualities: finalQualities
        });

        console.log(`[VideoTranscoder] 🏁 Pipeline complete for post ${postId}`);

    } catch (err) {
        console.error(`[VideoTranscoder] Pipeline failed for post ${postId}:`, err.message);
        try {
            await Post.findByIdAndUpdate(postId, {
                transcodeError: `${err.message}\n${err.stack}`
            });
        } catch (dbErr) {
            console.error('[VideoTranscoder] Failed to save error to DB:', dbErr);
        }
    } finally {
        // Clean up the original temp file regardless of outcome
        const localKey = mediaKey.startsWith('temp_media/') ? path.join(process.cwd(), mediaKey) : null;
        if (localKey) safeUnlink(localKey);
    }
}
