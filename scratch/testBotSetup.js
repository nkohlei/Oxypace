import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import startBotLoop from '../bots/newsBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to DB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Clear existing MovieNewsBot user and history to trigger a clean run
    console.log('Clearing old MovieNewsBot data to test new translation, filter and scraping rules...');
    await User.deleteOne({ username: 'MovieNewsBot' });
    const BotHistory = (await import('../models/BotHistory.js')).default;
    await BotHistory.deleteMany({ botName: 'MovieNewsBot' });

    // Let's check if the portal 69a48a87c86222e58be4972c exists. If not, let's create a test portal to avoid validation errors during run.
    let portal = await Portal.findById('69a48a87c86222e58be4972c');
    if (!portal) {
        console.log('Test portal 69a48a87c86222e58be4972c not found. Creating a mock portal for verification...');
        // Let's find an existing user to own the portal
        const adminUser = await User.findOne({ isAdmin: true }) || await User.findOne();
        if (!adminUser) {
            console.error('No users found in database to own the mock portal.');
            process.exit(1);
        }
        portal = new Portal({
            _id: '69a48a87c86222e58be4972c',
            name: 'Oxynema',
            description: 'Oxynema cinema news portal',
            owner: adminUser._id,
            members: [adminUser._id],
            channels: [
                {
                    name: 'Movie News',
                    type: 'text'
                }
            ]
        });
        await portal.save();
        console.log('Mock portal created.');
    }

    console.log('Running startBotLoop to trigger bot creation and first cycle...');
    // We pass a mock io object
    const mockIo = {
        emit: (event, data) => {
            console.log(`[Mock IO Emit] Event: ${event}, Data:`, data);
        }
    };

    await startBotLoop(mockIo);

    // Let's verify the MovieNewsBot user
    const botUser = await User.findOne({ username: 'MovieNewsBot' });
    if (botUser) {
        console.log('✅ Bot User verified in DB!');
        console.log('IsBot:', botUser.isBot);
        console.log('Avatar:', botUser.profile.avatar);
    } else {
        console.error('❌ Bot User NOT found in DB!');
    }

    console.log('Closing DB connection...');
    await mongoose.connection.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
