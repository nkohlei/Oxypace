import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';
import User from './models/User.js';

dotenv.config();

const debugPost = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find the Bot User ID to exclude (optional, or just filter by populated username)
        const botUser = await User.findOne({ username: 'SportsNews' });

        let query = {};
        if (botUser) {
            query = { author: { $ne: botUser._id } };
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('author', 'username');

        if (posts.length === 0) {
            console.log('No human posts found.');
        } else {
            console.log(`--- LAST ${posts.length} HUMAN POSTS DEBUG ---`);
            posts.forEach((p, i) => {
                console.log(`\n[${i + 1}] Author: ${p.author ? p.author.username : 'Unknown'}`);
                console.log(`    Time: ${p.createdAt}`);
                console.log(
                    `    Content: ${p.content ? p.content.substring(0, 50) : 'No Content'}`
                );
                console.log(`    Media: ${p.media || 'None'}`);

                if (p.media) {
                    if (!p.media.startsWith('http')) {
                        console.error('    ❌ INVALID URL (No Protocol)');
                    } else if (p.media.includes('https://https://')) {
                        console.error('    ❌ INVALID URL (Double Protocol)');
                    } else {
                        console.log('    ✅ URL OK');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

debugPost();
