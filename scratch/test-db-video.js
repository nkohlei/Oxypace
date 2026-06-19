import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';

dotenv.config();

async function run() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected! Fetching last 5 video posts...');
        const posts = await Post.find({ mediaType: 'video' }).sort({ createdAt: -1 }).limit(5);
        if (posts.length === 0) {
            console.log('No video posts found.');
        } else {
            posts.forEach((post, i) => {
                console.log(`\n--- Post #${i + 1} (${post._id}) ---`);
                console.log(`Created At: ${post.createdAt}`);
                console.log(`Media URL: ${post.media}`);
                console.log(`videoUrl: ${post.videoUrl}`);
                console.log(`lowVideoUrl: ${post.lowVideoUrl}`);
                console.log(`videoQualities:`, JSON.stringify(post.videoQualities, null, 2));
                console.log(`video144: ${post.video144}`);
                console.log(`video360: ${post.video360}`);
                console.log(`video720: ${post.video720}`);
                console.log(`video1080: ${post.video1080}`);
                console.log(`video2160: ${post.video2160}`);
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

run();
