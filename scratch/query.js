import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';

async function run() {
  await mongoose.connect('mongodb://nkohlei:X_1mongoX_1@cluster0.xjf1mlo.mongodb.net/globalmessage?retryWrites=true&w=majority&appName=Cluster0');
  
  const user = await User.findOne({ username: 'ulanbes' });
  if (!user) {
    console.log('User ulanbes not found');
    await mongoose.disconnect();
    return;
  }
  
  const posts = await Post.find({ author: user._id }).populate({
    path: 'quotedPost',
    populate: [{ path: 'author' }, { path: 'portal' }]
  });
  
  console.log(`Found ${posts.length} posts for ulanbes:`);
  for (const p of posts) {
    console.log(`\nPost ID: ${p._id}`);
    console.log(`Content: ${p.content}`);
    console.log(`QuotedPost exists: ${!!p.quotedPost}`);
    if (p.quotedPost) {
      console.log(`QuotedPost ID: ${p.quotedPost._id}`);
      console.log(`QuotedPost Content: ${p.quotedPost.content}`);
      console.log(`QuotedPost Media: ${p.quotedPost.media}`);
      console.log(`QuotedPost MediaType: ${p.quotedPost.mediaType}`);
      console.log(`QuotedPost VideoUrl: ${p.quotedPost.videoUrl}`);
    }
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
