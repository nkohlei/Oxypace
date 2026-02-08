import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const post = await Post.findOne({
            media: { $exists: true, $ne: '' }
        }).sort({ createdAt: -1 });

        if (post) {
            console.log('=== LATEST POST WITH MEDIA ===');
            console.log('Post ID:', post._id);
            console.log('Portal ID:', post.portal);
            console.log('Media URL:', post.media);

            // Extract the key from the URL
            const url = post.media;
            if (url.includes('/api/media/')) {
                const key = url.split('/api/media/')[1];
                console.log('Extracted Key:', key);
            }
        } else {
            console.log('No posts with media found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
