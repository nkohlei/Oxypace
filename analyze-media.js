import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import Comment from './models/Comment.js';

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    
    console.log('--- Posts with GIF ---');
    const gifPosts = await Post.find({ mediaType: 'gif' }).limit(10);
    console.log(JSON.stringify(gifPosts, null, 2));

    console.log('\n--- Recent Posts Media ---');
    const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(20).select('media mediaType content');
    console.log(JSON.stringify(recentPosts, null, 2));

    process.exit(0);
}
check();
