import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const BOT_EMAILS = ['techbot@oxypace.com', 'sportsbot@oxypace.com'];

async function verifyBots() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    for (const email of BOT_EMAILS) {
        const result = await User.updateOne({ email }, { $set: { isVerified: true } });
        console.log(`Updated ${email}:`, result);
    }

    process.exit(0);
}

verifyBots();
