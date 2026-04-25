import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';

dotenv.config();

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const posts = await Post.find({ mediaType: 'video' }).limit(20);
        console.log(`Found ${posts.length} video posts`);

        posts.forEach(p => {
            console.log(`ID: ${p._id}, Media: ${p.media}`);
        });

        const externalVideos = await Post.countDocuments({ 
            mediaType: 'video', 
            media: { $regex: /^http/ } 
        });
        const internalVideos = await Post.countDocuments({ 
            mediaType: 'video', 
            media: { $not: { $regex: /^http/ } } 
        });

        console.log(`External Videos: ${externalVideos}`);
        console.log(`Internal Videos: ${internalVideos}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

analyze();
