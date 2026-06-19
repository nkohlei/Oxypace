import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from './mediaConfig.js';
import axios from 'axios';

/**
 * Runs FFmpeg commands in the background to transcode the uploaded video
 * to original high quality and low (360p) streams, uploads them to R2, and updates the database.
 * 
 * @param {string} postId - MongoDB ID of the Post
 * @param {string} mediaKey - Cloudflare R2 file key of the original video
 */
export async function transcodeVideoInBackground(postId, mediaKey) {
    try {
        console.log(`[VideoTranscoder] Starting background transcode for post ${postId}, key: ${mediaKey}`);
        
        const parsedKey = path.parse(mediaKey);
        const folder = parsedKey.dir || 'posts/general';
        const baseName = parsedKey.name;
        
        // Check if there is a local raw temp file
        let localInputPath = path.join(process.cwd(), 'temp_media', `${baseName}.mp4`);
        let isLocal = fs.existsSync(localInputPath);
        
        if (!isLocal) {
            console.log(`[VideoTranscoder] Local file not found: ${localInputPath}. Downloading from R2...`);
            const originalUrl = constructProxiedUrl(mediaKey);
            localInputPath = path.join(process.cwd(), 'temp_media', `download-${baseName}.mp4`);
            
            // Ensure directory exists
            fs.mkdirSync(path.dirname(localInputPath), { recursive: true });
            
            const response = await axios({
                method: 'get',
                url: originalUrl,
                responseType: 'stream'
            });
            const writer = fs.createWriteStream(localInputPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`[VideoTranscoder] Download complete: ${localInputPath}`);
        }
        
        const tempHighPath = path.join(process.cwd(), 'temp_media', `high-${baseName}.mp4`);
        const tempLowPath = path.join(process.cwd(), 'temp_media', `low-${baseName}.mp4`);
        
        // Define R2 target keys
        const cleanBaseName = baseName.replace(/^original_/, '');
        const highKey = `${folder}/original_${cleanBaseName}.mp4`;
        const lowKey = `${folder}/low_360p_${cleanBaseName}.mp4`;
        
        console.log(`[VideoTranscoder] Transcoding high quality MP4 for post ${postId}...`);
        await new Promise((resolve, reject) => {
            ffmpeg(localInputPath)
                .videoCodec('libx264')
                .outputOptions([
                    '-crf 23',
                    '-preset fast'
                ])
                .audioCodec('aac')
                .audioBitrate('128k')
                .output(tempHighPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        
        console.log(`[VideoTranscoder] Transcoding low 360p quality MP4 for post ${postId}...`);
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
        
        const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
        
        // Upload high version
        console.log(`[VideoTranscoder] Uploading high version to R2: ${highKey}`);
        const bufferHigh = fs.readFileSync(tempHighPath);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: highKey,
            ContentType: 'video/mp4',
            Body: bufferHigh
        }));
        
        // Upload low version
        console.log(`[VideoTranscoder] Uploading low 360p version to R2: ${lowKey}`);
        const bufferLow = fs.readFileSync(tempLowPath);
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: lowKey,
            ContentType: 'video/mp4',
            Body: bufferLow
        }));
        
        const highUrl = constructProxiedUrl(highKey);
        const lowUrl = constructProxiedUrl(lowKey);
        
        // Update Post document
        await Post.findByIdAndUpdate(postId, {
            media: highUrl,
            videoUrl: highUrl,
            lowVideoUrl: lowUrl,
            videoQualities: {
                high: highUrl,
                low: lowUrl
            }
        });
        
        console.log(`[VideoTranscoder] Background transcode succeeded for post ${postId}`);
        
        // Clean up temp files
        try { fs.unlinkSync(tempHighPath); } catch(e){}
        try { fs.unlinkSync(tempLowPath); } catch(e){}
        try { fs.unlinkSync(localInputPath); } catch(e){}
        
        // If we downloaded it, or if we had a local raw file, we can also delete the raw mediaKey from R2 to not store raw file
        if (mediaKey !== highKey) {
            console.log(`[VideoTranscoder] Deleting raw source file from R2: ${mediaKey}`);
            try {
                await r2.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: mediaKey
                }));
            } catch (err) {
                console.error(`[VideoTranscoder] Failed to delete raw source from R2:`, err.message);
            }
        }
        
    } catch (err) {
        console.error(`[VideoTranscoder] Background transcode failed for post ${postId}:`, err.message);
    }
}
