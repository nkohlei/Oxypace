import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find posts with media, newest first
        const posts = await Post.find({
            media: { $exists: true, $ne: '' }
        }).sort({ createdAt: -1 }).limit(3);

        console.log('\n=== LATEST 3 POSTS WITH MEDIA ===\n');

        for (const post of posts) {
            console.log('---');
            console.log('Created:', post.createdAt);
            console.log('Author ID:', post.author);
            console.log('Content:', post.content || '(no content)');
            console.log('FULL MEDIA URL:');
            console.log(post.media);
            console.log('Media Type:', post.mediaType);
            console.log('---\n');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
