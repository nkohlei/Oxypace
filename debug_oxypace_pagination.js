import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portal from './models/Portal.js';
import Post from './models/Post.js';

dotenv.config();

const simulatePagination = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const portal = await Portal.findOne({ name: 'Oxypace Global' });
        if (!portal) return console.log('Portal not found');

        // Find "genel sohbet" ID
        const channel = portal.channels.find(c => c.name.includes('genel') || c.name.includes('general'));
        console.log(`Channel: ${channel.name} (${channel._id})`);

        // Page 1
        console.log('--- Page 1 ---');
        const posts1 = await Post.find({
            portal: portal._id,
            channel: channel._id
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('content createdAt');

        posts1.forEach((p, i) => console.log(`[${i}] ${p._id} | ${p.createdAt.toISOString()} | ${p.content.substring(0, 10)}`));

        if (posts1.length < 10) return console.log('Not enough posts for page 2');

        const lastPost = posts1[posts1.length - 1];
        const beforeDate = lastPost.createdAt;
        console.log(`\nFetching before: ${beforeDate.toISOString()}`);

        // Page 2
        console.log('--- Page 2 ---');
        const posts2 = await Post.find({
            portal: portal._id,
            channel: channel._id,
            createdAt: { $lt: beforeDate }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('content createdAt');

        posts2.forEach((p, i) => console.log(`[${i}] ${p._id} | ${p.createdAt.toISOString()} | ${p.content.substring(0, 10)}`));

        // Check for overlap
        const ids1 = new Set(posts1.map(p => p._id.toString()));
        const duplicates = posts2.filter(p => ids1.has(p._id.toString()));

        if (duplicates.length > 0) {
            console.log('\n❌ DUPLICATES FOUND!');
            duplicates.forEach(p => console.log(`Duplicate: ${p._id}`));
        } else {
            console.log('\n✅ No duplicates between pages.');
        }

    } catch (e) { console.error(e); }
    finally { await mongoose.disconnect(); }
};

simulatePagination();
