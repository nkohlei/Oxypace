import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portal from './models/Portal.js';
import Post from './models/Post.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const portal = await Portal.findOne({ name: 'Oxypace Global' });

        console.log(`Portal: ${portal._id}`);
        portal.channels.forEach(c => console.log(`Channel: ${c.name} (${c._id})`));

        const posts = await Post.find({ portal: portal._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('content channel createdAt');

        console.log(`\nLast 20 posts:`);
        posts.forEach(p => {
            console.log(`[${p.createdAt.toISOString()}] Ch: ${p.channel} | ${p.content.substring(0, 15)}...`);
        });

    } catch (e) { console.error(e); }
    finally { await mongoose.disconnect(); }
};
check();
