import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';
import User from './models/User.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ username: 'bilalyilmaz' });
        if (!user) {
            console.log('User bilalyilmaz not found?');
            return;
        }

        const post = await Post.findOne({ author: user._id }).sort({ createdAt: -1 });

        console.log('\n--- LATEST BILAL POST ---');
        if (!post) {
            console.log('No posts found for user');
        } else {
            console.log('Time:', post.createdAt);
            console.log('Content:', post.content);
            console.log('MEDIA RAW:', post.media);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
