import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const BOTS = [
    { email: 'techbot@oxypace.com', channelId: '69835873dff9f89766c44c26' }, // Fastest Technology NEWS
    { email: 'sportsbot@oxypace.com', channelId: '69835858dff9f89766c44c20' }, // Fastest Sports NEWS
];

async function migratePosts() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    for (const bot of BOTS) {
        const user = await User.findOne({ email: bot.email });
        if (!user) {
            console.log(`Bot user not found: ${bot.email}`);
            continue;
        }

        const result = await Post.updateMany(
            { author: user._id },
            { $set: { channel: bot.channelId } }
        );

        console.log(`Migrated posts for ${bot.email}: ${result.modifiedCount} posts updated.`);
    }

    process.exit(0);
}

migratePosts();
