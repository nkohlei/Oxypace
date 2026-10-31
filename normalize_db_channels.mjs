import dotenv from 'dotenv';
dotenv.config({ path: '/home/ubuntu/app/.env' });
import mongoose from 'mongoose';
import Portal from './models/Portal.js';
import Post from './models/Post.js';
import BotConfig from './models/BotConfig.js';
import { extractItemImage } from './bots/newsBot.js';

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Starting channel normalization and bot post image backfill...');

    const portals = await Portal.find({}).lean();

    for (const portal of portals) {
        if (!portal.channels || portal.channels.length === 0) continue;
        const primaryChannel = portal.channels[0];
        const primaryChannelIdStr = primaryChannel._id.toString();

        // 1. Normalize posts for this portal
        for (const ch of portal.channels) {
            const chIdStr = ch._id.toString();
            const res = await Post.updateMany(
                { portal: portal._id, channel: ch.name },
                { $set: { channel: chIdStr } }
            );
            if (res.modifiedCount > 0) {
                console.log(`Updated ${res.modifiedCount} posts in portal "${portal.name}" from name "${ch.name}" to channel ID ${chIdStr}`);
            }
        }

        // If portal has only 1 channel, map any legacy 'general' or 'genel' or null posts to this channel
        if (portal.channels.length === 1) {
            const res = await Post.updateMany(
                { portal: portal._id, channel: { $in: ['general', 'genel', '', null] } },
                { $set: { channel: primaryChannelIdStr } }
            );
            if (res.modifiedCount > 0) {
                console.log(`Updated ${res.modifiedCount} legacy general posts in 1-channel portal "${portal.name}" to channel ID ${primaryChannelIdStr}`);
            }
        }

        // 2. Normalize BotConfigs for this portal
        for (const ch of portal.channels) {
            const chIdStr = ch._id.toString();
            await BotConfig.updateMany(
                { defaultPortal: portal._id, defaultChannel: ch.name },
                { $set: { defaultChannel: chIdStr } }
            );
        }
        await BotConfig.updateMany(
            { defaultPortal: portal._id, defaultChannel: { $in: ['general', 'genel', '', null] } },
            { $set: { defaultChannel: primaryChannelIdStr } }
        );
    }

    // 3. Backfill images for recent bot posts that have no media
    console.log('\nChecking recent bot posts without image...');
    const botPostsWithoutMedia = await Post.find({
        portal: { $exists: true, $ne: null },
        $or: [{ media: { $in: ['', null] } }, { mediaType: 'none' }]
    }).sort({ createdAt: -1 }).limit(100);

    console.log(`Found ${botPostsWithoutMedia.length} posts without media.`);

    for (const post of botPostsWithoutMedia) {
        // Look for link in post content
        const urlMatch = (post.content || '').match(/https?:\/\/[^\s\)]+/i);
        if (urlMatch) {
            const link = urlMatch[0];
            try {
                const img = await extractItemImage({ link });
                if (img) {
                    post.mediaType = 'image';
                    post.media = img;
                    await post.save();
                    console.log(`✅ Backfilled image for post "${post.content.substring(0, 30)}": ${img}`);
                }
            } catch (err) {
                console.warn(`Failed image backfill for post ${post._id}:`, err.message);
            }
        }
    }

    console.log('\nMigration and normalization complete!');
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
