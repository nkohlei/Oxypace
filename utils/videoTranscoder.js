import path from 'path';
import fs from 'fs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import { constructProxiedUrl } from './mediaConfig.js';
import axios from 'axios';
import https from 'https';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configure fluent-ffmpeg to use static binaries or system binaries safely
if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
}

if (ffprobeStatic && ffprobeStatic.path && fs.existsSync(ffprobeStatic.path)) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
} else {
    ffmpeg.setFfprobePath('/usr/bin/ffprobe');
}
console.log('[VideoTranscoder] Configured ffmpeg/ffprobe binaries.');

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

const FFMPEG_SAFE_FLAGS = [
    '-threads', '2',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p'
];

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
 * Transcode a single quality level with YouTube-standard clean scaling and in-loop deblocking.
 * Deblocking is preserved (no fastdecode) to prevent square macroblock / ceramic tile artifacts.
 * Bicubic scaling ensures smooth anti-aliased detail.
 * Returns the output file path on success, null on failure.
 */
function transcodeQuality({ inputPath, outputPath, scaleFilter, crf, maxrate, bufsize, audioBitrate, onProgress }) {
    return new Promise((resolve) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .outputOptions([
                ...FFMPEG_SAFE_FLAGS,
                '-vf', scaleFilter,
                '-crf', String(crf || 23),
                '-maxrate', maxrate,
                '-bufsize', bufsize,
                '-c:a', 'aac',
                '-b:a', audioBitrate || '96k',
                '-ar', '44100',
                '-movflags', '+faststart'
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

            console.log(`[VideoTranscoder] Fetching from bucket: ${bucketName}, key: ${mediaKey}`);
            const response = await r2.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: mediaKey
            }));

            const writer = fs.createWriteStream(localInputPath);
            response.Body.pipe(writer);

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

        const videoStream = (metadata.streams || []).find(s => s.codec_type === 'video');
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

        // ── Step 3: Determine original quality label & dimensions ────────────
        const srcShortSide = (srcWidth && srcHeight) ? Math.min(srcWidth, srcHeight) : (srcHeight || srcWidth || 0);
        const srcLongSide  = (srcWidth && srcHeight) ? Math.max(srcWidth, srcHeight) : 0;
        const maxLabel     = `${srcShortSide || 720}p`;

        // ── Step 4: Upload original immediately → guarantee playback from t=0 ─
        const keyOriginal = `${folder}/video_original_${postId}.mp4`;
        console.log(`[VideoTranscoder] Uploading original (${maxLabel}) via stream → ${keyOriginal}`);
        await uploadFileToR2(localInputPath, keyOriginal, bucketName);
        const urlOriginal = constructProxiedUrl(keyOriginal);

        // Write original to DB right away — video is playable via videoUrl even if transcode crashes
        const initialQualities = {
            high:     urlOriginal,
            low:      urlOriginal,
            p144:     '',
            p360:     srcShortSide === 360 ? urlOriginal : '',
            p720:     srcShortSide === 720 ? urlOriginal : '',
            p1080:    srcShortSide === 1080 ? urlOriginal : '',
            p1440:    srcShortSide === 1440 ? urlOriginal : '',
            p2160:    srcShortSide === 2160 ? urlOriginal : '',
            original: urlOriginal
        };

        const initialUpdates = {
            videoUrl:            urlOriginal,
            media:               urlOriginal,
            lowVideoUrl:         urlOriginal,
            videoQualities:      initialQualities,
            videoOriginalHeight: srcShortSide,
            videoOriginalWidth:  srcLongSide,
            isProcessing:        true,
            processingProgress:  0,
            processingStage:     `${maxLabel} kaynak video yüklendi, alt kaliteler ayrıştırılıyor...`,
            estimatedTime:       formatEstimatedTime(totalEstimatedTimeSeconds)
        };
        if (srcShortSide === 360)  initialUpdates.video360  = urlOriginal;
        if (srcShortSide === 720)  initialUpdates.video720  = urlOriginal;
        if (srcShortSide === 1080) initialUpdates.video1080 = urlOriginal;
        if (srcShortSide === 1440) initialUpdates.video1440 = urlOriginal;
        if (srcShortSide === 2160) initialUpdates.video2160 = urlOriginal;

        const postAfterOriginal = await Post.findByIdAndUpdate(postId, initialUpdates, { new: true })
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
            .populate('portal');

        console.log(`[VideoTranscoder] ✅ Original quality (${maxLabel}) saved to DB. Video is immediately playable.`);

        // Broadcast original update to client via Socket.IO
        if (global.io && postAfterOriginal) {
            global.io.emit('post:updated', postAfterOriginal);
        }

        const codecName = videoStream?.codec_name?.toLowerCase() || '';
        const isH264 = codecName === 'h264';
        console.log(`[VideoTranscoder] Source codec: ${codecName} (isH264: ${isH264})`);

        // ── Step 5: Sequential low-memory transcoding queue ───────────────────
        // YouTube-standard encoding ladder:
        // Bicubic anti-aliased scaling, in-loop deblocking enabled (eliminates ceramic block tiles),
        // balanced CRF + VBV maxrate/bufsize for crystal clarity and smooth playback.
        const qualityLadder = [
            { targetH: 1440, label: '1440p', field: 'p1440', rootField: 'video1440', crf: 20, maxrate: '7000k', bufsize: '14000k', audioBitrate: '192k' },
            { targetH: 1080, label: '1080p', field: 'p1080', rootField: 'video1080', crf: 21, maxrate: '4200k', bufsize: '8400k',  audioBitrate: '160k' },
            { targetH: 720,  label: '720p',  field: 'p720',  rootField: 'video720',  crf: 22, maxrate: '2200k', bufsize: '4400k',  audioBitrate: '128k' },
            { targetH: 360,  label: '360p',  field: 'p360',  rootField: 'video360',  crf: 24, maxrate: '900k',  bufsize: '1800k',  audioBitrate: '96k'  },
            { targetH: 144,  label: '144p',  field: 'p144',  rootField: 'video144',  crf: 26, maxrate: '320k',  bufsize: '640k',   audioBitrate: '64k'   }
        ];

        // MUST transcode to all quality ladder rungs strictly below the video's original height!
        const jobs = qualityLadder.filter(q => q.targetH < srcShortSide);
        console.log(`[VideoTranscoder] ${jobs.length} transcode jobs queued for ${maxLabel} source (strictly below ${srcShortSide}p)`);

        const finalQualities = { ...initialQualities };
        let lastUpdatedProgress = 0;

        // Ensure post has a video cover thumbnail (fallback via ffmpeg)
        try {
            const existingPostDoc = await Post.findById(postId);
            if (existingPostDoc && !existingPostDoc.videoThumbnail) {
                const tempThumb = path.join(process.cwd(), 'temp_media', `thumb-${postId}.jpg`);
                const r2ThumbKey = `${folder}/thumb_${postId}.jpg`;
                await new Promise((resolveThumb) => {
                    ffmpeg(localInputPath)
                        .screenshots({
                            timestamps: ['0.5'],
                            filename: `thumb-${postId}.jpg`,
                            folder: path.join(process.cwd(), 'temp_media'),
                            size: '1280x?'
                        })
                        .on('end', resolveThumb)
                        .on('error', (thumbErr) => {
                            console.warn('[VideoTranscoder] Fallback thumbnail screenshot failed:', thumbErr.message);
                            resolveThumb();
                        });
                });

                if (fs.existsSync(tempThumb)) {
                    const thumbStream = fs.createReadStream(tempThumb);
                    const thumbStat = fs.statSync(tempThumb);
                    await r2.send(new PutObjectCommand({
                        Bucket: bucketName,
                        Key: r2ThumbKey,
                        ContentType: 'image/jpeg',
                        ContentLength: thumbStat.size,
                        Body: thumbStream
                    }));
                    const thumbUrl = constructProxiedUrl(r2ThumbKey);
                    await Post.findByIdAndUpdate(postId, { videoThumbnail: thumbUrl });
                    safeUnlink(tempThumb);
                    console.log(`[VideoTranscoder] Fallback thumbnail created & saved: ${thumbUrl}`);
                }
            }
        } catch (err) {
            console.warn('[VideoTranscoder] Non-blocking error generating fallback thumbnail:', err.message);
        }

        for (const job of jobs) {
            const tempOut = path.join(process.cwd(), 'temp_media', `${job.label}-${postId}.mp4`);
            const r2Key   = `${folder}/video_${job.label}_${postId}.mp4`;

            console.log(`[VideoTranscoder] → Starting ${job.label} transcode...`);
            const jobIndex = jobs.indexOf(job);

            const outputPath = await transcodeQuality({
                inputPath:    localInputPath,          // always from original
                outputPath:   tempOut,
                scaleFilter:  `scale='trunc(oh*a/2)*2':${job.targetH}:flags=bicubic`, // clean anti-aliased scaling
                crf:          job.crf,
                maxrate:      job.maxrate,
                bufsize:      job.bufsize,
                audioBitrate: job.audioBitrate,
                onProgress: async (percent) => {
                    const overallPercent = Math.min(99, Math.round(((jobIndex + (percent / 100)) / jobs.length) * 100));
                    // Update DB every 10% progress interval
                    if (overallPercent - lastUpdatedProgress >= 10) {
                        lastUpdatedProgress = overallPercent;
                        const remainingSeconds = Math.max(1, Math.ceil(totalEstimatedTimeSeconds * (1 - overallPercent / 100)));
                        const formattedRemaining = formatEstimatedTime(remainingSeconds);

                        const updatedPost = await Post.findByIdAndUpdate(postId, {
                            isProcessing: true,
                            processingProgress: overallPercent,
                            processingStage: `${job.label} kalitesi ayrıştırılıyor...`,
                            estimatedTime: formattedRemaining
                        }, { new: true })
                        .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
                        .populate('portal');

                        if (global.io && updatedPost) {
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

                    finalQualities[job.field] = url;

                    const overallPercent = Math.min(99, Math.round(((jobIndex + 1) / jobs.length) * 100));
                    lastUpdatedProgress = overallPercent;
                    const remainingSeconds = Math.max(0, Math.ceil(totalEstimatedTimeSeconds * (1 - overallPercent / 100)));
                    const formattedRemaining = formatEstimatedTime(remainingSeconds);

                    // Flush DB after each quality so partial results survive a crash
                    const updatedPost = await Post.findByIdAndUpdate(postId, {
                        videoQualities: { ...finalQualities },
                        [job.rootField]: url,
                        isProcessing: true,
                        processingProgress: overallPercent,
                        processingStage: `${job.label} tamamlandı`,
                        estimatedTime: formattedRemaining
                    }, { new: true })
                    .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
                    .populate('portal');

                    if (global.io && updatedPost) {
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
        if (finalQualities.p144)       lowestUrl = finalQualities.p144;
        else if (finalQualities.p360)  lowestUrl = finalQualities.p360;
        else if (finalQualities.p720)  lowestUrl = finalQualities.p720;
        else if (finalQualities.p1080) lowestUrl = finalQualities.p1080;
        else if (finalQualities.p1440) lowestUrl = finalQualities.p1440;
        else if (finalQualities.p2160) lowestUrl = finalQualities.p2160;

        finalQualities.low      = lowestUrl;
        finalQualities.high     = urlOriginal;
        finalQualities.original = urlOriginal;

        const updateFields = {
            videoUrl:            urlOriginal,
            lowVideoUrl:         lowestUrl,
            videoQualities:      finalQualities,
            videoOriginalHeight: srcShortSide,
            videoOriginalWidth:  srcLongSide,
            isProcessing:        false,
            processingProgress:  100,
            processingStage:     'Tüm kaliteler hazır',
            estimatedTime:       '0 sn'
        };

        const currentDoc = await Post.findById(postId);
        if (currentDoc && !Array.isArray(currentDoc.media)) {
            updateFields.media = urlOriginal;
        }

        const updatedPost = await Post.findByIdAndUpdate(postId, updateFields, { new: true })
        .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted')
        .populate('portal');

        if (global.io && updatedPost) {
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

            if (global.io && updatedPost) {
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
