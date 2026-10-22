import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const execAsync = promisify(exec);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));

  const missingPosts = await Post.find({
    mediaType: { $in: ['video', 'videoUrl'] },
    $or: [
      { videoThumbnail: { $exists: false } },
      { videoThumbnail: null },
      { videoThumbnail: '' }
    ]
  }).select('_id media mediaType videoThumbnail videoUrl').lean();

  console.log(`Found ${missingPosts.length} posts without videoThumbnail.`);

  for (const post of missingPosts) {
    const streamUrl = post.media || post.videoUrl;
    if (!streamUrl || !streamUrl.startsWith('http')) continue;

    console.log(`\nProcessing post ${post._id} -> ${streamUrl}`);
    const tempFile = `/tmp/thumb_${post._id}_${Date.now()}.jpg`;

    try {
      // Use ffmpeg with user_agent and headers to bypass CDN blocking (e.g. Twitter/twimg)
      const cmd = `ffmpeg -y -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -timeout 8000000 -ss 00:00:01 -i "${streamUrl}" -vframes 1 -q:v 2 -vf "scale=854:-2" "${tempFile}"`;
      await execAsync(cmd, { timeout: 15000 });

      if (fs.existsSync(tempFile) && fs.statSync(tempFile).size > 1000) {
        const fileBuffer = fs.readFileSync(tempFile);
        const key = `thumbnails/${post._id}_thumb.jpg`;

        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME || 'oxypace',
          Key: key,
          Body: fileBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000',
        }));

        await Post.updateOne({ _id: post._id }, { $set: { videoThumbnail: key } });
        console.log(`✅ Uploaded thumbnail to R2 and updated post ${post._id} -> ${key}`);
      } else {
        console.warn(`⚠️ FFmpeg output empty or too small for ${post._id}`);
      }
    } catch (err) {
      console.warn(`❌ Failed to extract frame for ${post._id}: ${err.message}`);
    } finally {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (_) {}
      }
    }
  }

  const remaining = await Post.countDocuments({
    mediaType: { $in: ['video', 'videoUrl'] },
    $or: [
      { videoThumbnail: { $exists: false } },
      { videoThumbnail: null },
      { videoThumbnail: '' }
    ]
  });

  console.log(`\nRemaining missing thumbnails: ${remaining}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
