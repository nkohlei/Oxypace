import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));
  
  const missingUploaded = await Post.find({
    mediaType: 'video',
    $or: [
      { videoThumbnail: { $exists: false } },
      { videoThumbnail: null },
      { videoThumbnail: '' }
    ]
  }).select('_id media videoThumbnail').lean();

  const missingUrl = await Post.find({
    mediaType: 'videoUrl',
    $or: [
      { videoThumbnail: { $exists: false } },
      { videoThumbnail: null },
      { videoThumbnail: '' }
    ]
  }).select('_id media videoThumbnail').lean();

  console.log('Missing uploaded (mediaType: video):', missingUploaded.length);
  if (missingUploaded.length > 0) {
    console.log(JSON.stringify(missingUploaded, null, 2));
  }
  console.log('Missing external (mediaType: videoUrl):', missingUrl.length);
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
