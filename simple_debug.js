import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Find latest post where media is NOT null and NOT empty string
        const post = await Post.findOne({
            media: { $exists: true, $ne: '' },
        }).sort({ createdAt: -1 });

        console.log('\n--- LATEST MEDIA POST ---');
        if (!post) {
            console.log('No posts with media found');
        } else {
            console.log('Time:', post.createdAt);
            console.log('Author:', post.author); // ID is fine for now
            console.log('Content:', post.content);
            console.log('MEDIA URL:', post.media);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
