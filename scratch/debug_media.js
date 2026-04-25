import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';

dotenv.config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const posts = await Post.find({ media: { $exists: true } }).limit(5).sort({ updatedAt: -1 });
        posts.forEach(p => console.log(`ID: ${p._id}, Media: ${p.media}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
