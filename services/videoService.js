import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { fileURLToPath } from 'url';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';

/**
 * Transcodes a video to multiple qualities and updates the post record.
 * @param {string} postId - The ID of the post
 * @param {string} originalKey - The R2 key of the original video
 */
export const transcodeVideo = async (postId, originalKey) => {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const inputPath = path.join(tmpDir, `${postId}-original.mp4`);
    const lowPath = path.join(tmpDir, `${postId}-360p.mp4`);
    const mediumPath = path.join(tmpDir, `${postId}-720p.mp4`);

    try {
        console.log(`🎬 Starting transcoding for post: ${postId}`);

        // 1. Download original file from R2
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: originalKey
        });
        const response = await r2.send(getCommand);
        const writer = fs.createWriteStream(inputPath);
        
        await new Promise((resolve, reject) => {
            response.Body.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`✅ Original downloaded to: ${inputPath}`);

        // 2. Transcode to 360p (Low)
        await processVideo(inputPath, lowPath, '640x360', '800k');
        console.log('✅ 360p created');

        // 3. Transcode to 720p (Medium)
        await processVideo(inputPath, mediumPath, '1280x720', '2500k');
        console.log('✅ 720p created');

        // 4. Upload to R2
        const lowKey = originalKey.replace(/\.[^.]+$/, '-360p.mp4');
        const mediumKey = originalKey.replace(/\.[^.]+$/, '-720p.mp4');

        await uploadToR2(lowPath, lowKey);
        await uploadToR2(mediumPath, mediumKey);
        console.log('✅ Qualities uploaded to R2');

        // 5. Update Post in DB
        await Post.findByIdAndUpdate(postId, {
            mediaQualities: {
                low: constructProxiedUrl(lowKey),
                medium: constructProxiedUrl(mediumKey),
                high: constructProxiedUrl(originalKey)
            }
        });

        console.log(`🎉 Transcoding complete for post: ${postId}`);

    } catch (error) {
        console.error(`❌ Transcoding failed for post ${postId}:`, error.message);
    } finally {
        // Cleanup temp files
        [inputPath, lowPath, mediumPath].forEach(p => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
    }
};

const processVideo = (input, output, size, bitrate) => {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .size(size)
            .videoBitrate(bitrate)
            .format('mp4')
            .on('end', resolve)
            .on('error', reject)
            .save(output);
    });
};

const uploadToR2 = async (filePath, key) => {
    const fileContent = fs.readFileSync(filePath);
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'video/mp4',
        ACL: 'public-read'
    });
    return r2.send(command);
};
