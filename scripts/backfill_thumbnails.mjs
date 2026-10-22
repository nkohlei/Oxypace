import 'dotenv/config';
import mongoose from 'mongoose';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';
import Post from '../models/Post.js';
import { constructProxiedUrl } from '../utils/mediaConfig.js';

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const bucketName = process.env.R2_BUCKET_NAME || 'oxypace';
    const tempDir = path.join(process.cwd(), 'temp_media');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const posts = await Post.find({
        mediaType: 'video',
        $or: [
            { videoThumbnail: { $exists: false } },
            { videoThumbnail: null },
            { videoThumbnail: '' }
        ]
    });

    console.log(`Found ${posts.length} video posts needing thumbnails.`);

    for (const post of posts) {
        let videoSrc = post.media || post.videoUrl || post.videoQualities?.high || post.videoQualities?.low;
        if (Array.isArray(videoSrc)) videoSrc = videoSrc[0];
        if (!videoSrc || typeof videoSrc !== 'string') {
            console.log(`Skipping post ${post._id} (no valid video src)`);
            continue;
        }

        const fullVideoUrl = constructProxiedUrl(videoSrc);
        console.log(`Processing post ${post._id} with URL: ${fullVideoUrl}...`);
        const tempThumb = path.join(tempDir, `thumb_${post._id}.jpg`);
        try {
            // Use ffmpeg to extract frame at 0.5s
            execSync(`ffmpeg -y -ss 00:00:00.500 -i "${fullVideoUrl}" -vframes 1 -q:v 2 "${tempThumb}"`, {
                stdio: 'ignore',
                timeout: 30000
            });

            if (!fs.existsSync(tempThumb) || fs.statSync(tempThumb).size === 0) {
                // Try 0.05s fallback
                execSync(`ffmpeg -y -ss 00:00:00.050 -i "${fullVideoUrl}" -vframes 1 -q:v 2 "${tempThumb}"`, {
                    stdio: 'ignore',
                    timeout: 30000
                });
            }

            if (fs.existsSync(tempThumb) && fs.statSync(tempThumb).size > 0) {
                const folder = post.portal ? `posts/${post.portal}` : 'posts/general';
                const r2Key = `${folder}/thumb_${post._id}.jpg`;
                const fileStream = fs.createReadStream(tempThumb);
                const stat = fs.statSync(tempThumb);

                await r2.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: r2Key,
                    ContentType: 'image/jpeg',
                    ContentLength: stat.size,
                    Body: fileStream
                }));

                const thumbUrl = constructProxiedUrl(r2Key);
                post.videoThumbnail = thumbUrl;
                await post.save();
                console.log(`✅ Post ${post._id} updated with thumbnail: ${thumbUrl}`);
            } else {
                console.warn(`❌ Failed to extract frame for post ${post._id}`);
            }
        } catch (err) {
            console.error(`Error processing post ${post._id}:`, err.message);
        } finally {
            try { if (fs.existsSync(tempThumb)) fs.unlinkSync(tempThumb); } catch (_) {}
        }
    }

    console.log('Thumbnail backfill complete.');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
