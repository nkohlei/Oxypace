import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2 from '../config/r2.js';

dotenv.config();

const postIds = [
  '6ad4d822db2275f17c9eb714',
  '6ad4d926db2275f17c9eb749',
  '6ad4db270228c4ea96c1e550',
  '6ad52c6ef66573eea25b7a12',
  '6ad52d1670f95f2fc4113567'
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));

  for (const id of postIds) {
    const file = `/tmp/${id}.jpg`;
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}`);
      continue;
    }

    const stat = fs.statSync(file);
    if (stat.size < 1000) {
      console.log(`File too small: ${file}`);
      continue;
    }

    const key = `thumbnails/${id}_thumb.jpg`;
    const buffer = fs.readFileSync(file);

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'oxypace',
      Key: key,
      ContentType: 'image/jpeg',
      Body: buffer,
      CacheControl: 'public, max-age=31536000',
    }));

    await Post.updateOne({ _id: id }, { $set: { videoThumbnail: key } });
    console.log(`✅ Uploaded & updated post ${id} -> ${key}`);
    try { fs.unlinkSync(file); } catch (_) {}
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
