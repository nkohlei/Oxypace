import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));
  
  const remaining = await Post.find({ isProcessing: true }).select('_id createdAt isProcessing mediaType video720 video1080').lean();
  console.log('Remaining 11 posts:', JSON.stringify(remaining, null, 2));

  // If any of these also should not be processing (e.g. have resolutions or createdAt missing or older than 5 mins)
  const result = await Post.updateMany(
    { isProcessing: true },
    { $set: { isProcessing: false, processingProgress: 100, estimatedTime: '' } }
  );
  console.log(`Cleaned up remaining ${result.modifiedCount} posts!`);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
