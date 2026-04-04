import mongoose from 'mongoose';
import dotenv from 'dotenv';
import startBotLoop from './bots/newsBot.js';
import BotHistory from './models/BotHistory.js';
import User from './models/User.js';

dotenv.config();

async function forceBlast() {
    try {
        console.log('🚀 Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected.');

        const botUsernames = ['GamesNews', 'TechNews', 'SportNews'];
        
        console.log(`🧹 Clearing history for: ${botUsernames.join(', ')}`);
        await BotHistory.deleteMany({ botName: { $in: botUsernames } });
        
        console.log('🔥 Triggering Fresh News Cycle...');
        // We call startBotLoop, but since it has a setInterval, we wrap the first execution
        await startBotLoop();

        console.log('\n⌛ Waiting 15 seconds for async posts to complete...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        process.exit(0);
    } catch (err) {
        console.error('❌ Force Blast Error:', err);
        process.exit(1);
    }
}

forceBlast();
