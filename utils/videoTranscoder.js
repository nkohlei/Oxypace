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

const formatEstimatedTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '0 sn';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes} dk ${seconds} sn`;
    }
    return `${seconds} sn`;
};

/**
 * Transcode a single quality level synchronously.
 * Returns the output file path on success, null on failure.
 */
function transcodeQuality({ inputPath, outputPath, scaleFilter, videoBitrate, maxrate, bufsize, onProgress }) {
    return new Promise((resolve) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .outputOptions([
                ...FFMPEG_RAM_SAFE_FLAGS,
                `-vf ${scaleFilter}`,
                `-b:v ${videoBitrate}`,
                `-maxrate ${maxrate}`,
                `-bufsize ${bufsize}`,
                '-c:a aac' // Convert/preserve audio track cleanly as AAC
            ])
            .output(outputPath)
            .on('start', (cmd) => {
                console.log(`[VideoTranscoder] FFmpeg started: ${cmd.slice(0, 120)}...`);
            })
            .on('progress', (progress) => {
                if (onProgress && progress.percent !== undefined) {
                    onProgress(progress.percent);
                }
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
 * Runs FFmpeg transcoding in the background with strict RAM budget.
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

        // Set estimated processing time dynamically based on video duration
        const duration = metadata.format ? parseFloat(metadata.format.duration || 0) : 0;
        const totalEstimatedTimeSeconds = Math.ceil(duration * 1.5) || 60;
        await Post.findByIdAndUpdate(postId, {
            isProcessing: true,
            processingProgress: 0,
            estimatedTime: formatEstimatedTime(totalEstimatedTimeSeconds)
        });

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

        // Broadcast original update to client via Socket.IO
        if (global.io) {
            const updatedPost = await Post.findById(postId)
                .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
                .populate('portal');
            global.io.emit('post:updated', updatedPost);
        }

        // ── Step 5: Sequential low-memory transcoding queue ───────────────────
        const qualityLadder = [
            { targetH: 720,  label: '720p',  field: 'p720',  rootField: 'video720',  bitrate: '1100k', maxrate: '1300k', bufsize: '2200k' },
            { targetH: 360,  label: '360p',  field: 'p360',  rootField: 'video360',  bitrate: '400k',  maxrate: '450k',  bufsize: '800k'  },
            { targetH: 144,  label: '144p',  field: 'p144',  rootField: 'video144',  bitrate: '150k',  maxrate: '180k',  bufsize: '300k'  }
        ];

        // Filter to only jobs strictly below the source resolution
        const jobs = qualityLadder.filter(q => srcHeight > q.targetH);
        console.log(`[VideoTranscoder] ${jobs.length} transcode jobs queued (sequential, -threads 1, -preset ultrafast)`);

        const finalQualities = { ...initialQualities };
        let lastUpdatedProgress = 0;

        for (const job of jobs) {
            const tempOut = path.join(process.cwd(), 'temp_media', `${job.label}-${postId}.mp4`);
            const r2Key   = `${folder}/video_${job.label}_${postId}.mp4`;

            console.log(`[VideoTranscoder] → Starting ${job.label} transcode...`);
            const jobIndex = jobs.indexOf(job);

            const outputPath = await transcodeQuality({
                inputPath:    localInputPath,          // always from original
                outputPath:   tempOut,
                scaleFilter:  `scale=-2:${job.targetH}`, // preserves AR
                videoBitrate: job.bitrate,
                maxrate:      job.maxrate,
                bufsize:      job.bufsize,
                onProgress: async (percent) => {
                    const overallPercent = Math.min(99, Math.round(((jobIndex + (percent / 100)) / jobs.length) * 100));
                    // Update DB every 20% progress interval
                    if (overallPercent - lastUpdatedProgress >= 20) {
                        lastUpdatedProgress = overallPercent;
                        const remainingSeconds = Math.max(1, Math.ceil(totalEstimatedTimeSeconds * (1 - overallPercent / 100)));
                        const formattedRemaining = formatEstimatedTime(remainingSeconds);

                        const updatedPost = await Post.findByIdAndUpdate(postId, {
                            processingProgress: overallPercent,
                            estimatedTime: formattedRemaining
                        }, { new: true })
                        .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
                        .populate('portal');

                        if (global.io) {
                            global.io.emit('post:updated', updatedPost);
                        }
                        console.log(`[VideoTranscoder] ⏳ Progress update: ${overallPercent}% - Kalan: ${formattedRemaining}`);
                    }
                }
            });

            if (outputPath && fs.existsSync(outputPath)) {
                try {
                    console.log(`[VideoTranscoder] Uploading ${job.label} via stream → ${r2Key}`);
                    await uploadFileToR2(outputPath, r2Key, bucketName);
                    const url = constructProxiedUrl(r2Key);

                    finalQualities[job.field]  = url;

                    const overallPercent = Math.min(99, Math.round(((jobIndex + 1) / jobs.length) * 100));
                    lastUpdatedProgress = overallPercent;
                    const remainingSeconds = Math.max(0, Math.ceil(totalEstimatedTimeSeconds * (1 - overallPercent / 100)));
                    const formattedRemaining = formatEstimatedTime(remainingSeconds);

                    // Flush DB after each quality so partial results survive a crash
                    const updatedPost = await Post.findByIdAndUpdate(postId, {
                        videoQualities: { ...finalQualities },
                        [job.rootField]: url,
                        processingProgress: overallPercent,
                        estimatedTime: formattedRemaining
                    }, { new: true })
                    .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
                    .populate('portal');

                    if (global.io) {
                        global.io.emit('post:updated', updatedPost);
                    }
                    console.log(`[VideoTranscoder] ✅ ${job.label} written to DB & emitted.`);
                } catch (uploadErr) {
                    console.error(`[VideoTranscoder] Upload failed for ${job.label}:`, uploadErr.message);
                } finally {
                    safeUnlink(outputPath);
                }
            }
        }

        // ── Step 6: Final DB pass — update low/high pointers and isProcessing ─
        let lowestUrl = urlOriginal;
        if (finalQualities.p144)  lowestUrl = finalQualities.p144;
        else if (finalQualities.p360)  lowestUrl = finalQualities.p360;
        else if (finalQualities.p720)  lowestUrl = finalQualities.p720;
        else if (finalQualities.p1080) lowestUrl = finalQualities.p1080;
        else if (finalQualities.p2160) lowestUrl = finalQualities.p2160;

        finalQualities.low  = lowestUrl;
        finalQualities.high = urlOriginal;

        const updatedPost = await Post.findByIdAndUpdate(postId, {
            lowVideoUrl:    lowestUrl,
            videoQualities: finalQualities,
            isProcessing:   false,
            processingProgress: 100,
            estimatedTime:  '0 sn'
        }, { new: true })
        .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
        .populate('portal');

        if (global.io) {
            global.io.emit('post:updated', updatedPost);
        }

        console.log(`[VideoTranscoder] 🏁 Pipeline complete for post ${postId}`);

    } catch (err) {
        console.error(`[VideoTranscoder] Pipeline failed for post ${postId}:`, err.message);
        try {
            const updatedPost = await Post.findByIdAndUpdate(postId, {
                transcodeError: `${err.message}\n${err.stack}`,
                isProcessing:   false,
                processingProgress: 0,
                estimatedTime:  'Hata'
            }, { new: true })
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
            .populate('portal');

            if (global.io) {
                global.io.emit('post:updated', updatedPost);
            }
        } catch (dbErr) {
            console.error('[VideoTranscoder] Failed to save error to DB:', dbErr);
        }
    } finally {
        // Clean up the original temp file regardless of outcome
        const localKey = mediaKey.startsWith('temp_media/') ? path.join(process.cwd(), mediaKey) : null;
        if (localKey) safeUnlink(localKey);
    }
}
