import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const BOTS_TO_CREATE = [
    {
        email: 'techbot@oxypace.com',
        username: 'TechNews',
        password: 'password123',
        profile: {
            displayName: 'Tech News Bot',
            bio: 'Automated technology news aggregator.',
            avatar: '' // You can add a default URL here
        },
        verificationBadge: 'special' // Make them look official
    },
    {
        email: 'sportsbot@oxypace.com',
        username: 'SportsNews',
        password: 'password123',
        profile: {
            displayName: 'World Sports',
            bio: 'Latest sports updates from around the globe.',
            avatar: ''
        },
        verificationBadge: 'special'
    }
];

async function setupBots() {
    console.log('--- Bot Setup Started ---');
    console.log('Connecting to DB...');

    // Connect to DB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI is missing in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        for (const botData of BOTS_TO_CREATE) {
            const exists = await User.findOne({ email: botData.email });
            if (exists) {
                console.log(`Bot already exists: ${botData.username}`);
            } else {
                console.log(`Creating bot: ${botData.username}`);
                const user = new User(botData);
                // Pre-save hook will hash the password
                await user.save();
                console.log(`Created! ID: ${user._id}`);
            }
        }

        console.log('--- Bot Setup Finished ---');
        process.exit(0);

    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setupBots();
