import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';

dotenv.config();

const debugPost = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find a recent post with media
        const post = await Post.findOne({ media: { $ne: null } }).sort({ createdAt: -1 });

        if (post && post.media) {
            console.log('--- FOUND MEDIA ---');
            console.log('Full URL:', post.media);

            // Extract Key (everything after the domain)
            // Assuming format: https://domain.com/FOLDER/FILE.ext
            const parts = post.media.split('/');
            // We want everything after the domain.
            // format: https: / / domain / path / to / file
            // parts: [0]https: [1] [2]domain [3]path...
            if (parts.length > 3) {
                const key = parts.slice(3).join('/');
                console.log('Extracted Key:', key);
            } else {
                console.log('Could not extract key standardly.');
            }
        } else {
            console.log('No posts with media found.');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

debugPost();
