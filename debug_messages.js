
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Message from './models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Loading
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('CRITICAL: .env file not found!');
    process.exit(1);
}

const debugMessages = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!MONGO_URI) throw new Error('MONGO_URI missing');

        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected.');

        // 1. Get deepace user
        const user = await User.findOne({ username: 'deepace' });
        if (!user) {
            console.log('User deepace not found');
            process.exit(0);
        }
        console.log(`Checking messages for: ${user.username} (${user._id})`);

        // 2. Fetch raw messages
        const messages = await Message.find({
            $or: [{ sender: user._id }, { recipient: user._id }],
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'username')
            .populate('recipient', 'username');

        console.log(`Found ${messages.length} raw messages.`);

        // 3. Simulate Logic
        const conversationsMap = new Map();
        let errors = 0;

        messages.forEach((msg, index) => {
            try {
                if (!msg.sender) throw new Error(`Message ${msg._id}: Sender is NULL`);
                if (!msg.recipient) throw new Error(`Message ${msg._id}: Recipient is NULL`);

                const otherUser = msg.sender._id.toString() === user._id.toString()
                    ? msg.recipient
                    : msg.sender;

                // If we got here, populates worked.
                // console.log(`Msg ${index}: With ${otherUser.username}`);

            } catch (err) {
                console.error(`ERROR Processing Msg ${msg._id}:`, err.message);
                errors++;
            }
        });

        console.log(`Simulation Complete. ${errors} errors found.`);
        process.exit(0);
    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
};

debugMessages();
