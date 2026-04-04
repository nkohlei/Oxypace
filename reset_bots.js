import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BotHistory from './models/BotHistory.js';

dotenv.config();

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to DB.');

        const botUsernames = ['GamesNews', 'TechNews', 'SportNews'];
        const result = await BotHistory.deleteMany({ botName: { $in: botUsernames } });
        
        console.log(`🧹 Cleared ${result.deletedCount} history entries for bots: ${botUsernames.join(', ')}`);
        console.log('✨ Bots will now re-scan and post the latest 2 items from each feed.');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
reset();
