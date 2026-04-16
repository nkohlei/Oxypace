import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const post = await Post.findOne().sort({ createdAt: -1 });
        console.log('LATEST POST:', JSON.stringify(post, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
