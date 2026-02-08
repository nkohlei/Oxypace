import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find the user bilalyilmaz
        const user = await User.findOne({ username: 'bilalyilmaz' });

        if (!user) {
            console.log('User bilalyilmaz not found');
            return;
        }

        console.log('\n=== USER DOCUMENT ===');
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Profile object:', JSON.stringify(user.profile, null, 2));
        console.log('profile.displayName:', user.profile?.displayName);
        console.log('profile.displayName type:', typeof user.profile?.displayName);
        console.log('profile.displayName === undefined:', user.profile?.displayName === undefined);
        console.log('profile.displayName === null:', user.profile?.displayName === null);
        console.log('profile.displayName === "":', user.profile?.displayName === '');

        // Find latest post by this user and check the populated author
        const post = await Post.findOne({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('author', 'username profile.displayName profile.avatar verificationBadge');

        if (post) {
            console.log('\n=== LATEST POST POPULATED ===');
            console.log('Post author:', JSON.stringify(post.author, null, 2));
            console.log('post.author.profile?.displayName:', post.author.profile?.displayName);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
