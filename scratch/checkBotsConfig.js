import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import { BOT_CONFIGS } from '../bots/newsBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkConfig() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to DB...');
    await mongoose.connect(mongoUri);

    let allFine = true;

    for (const config of BOT_CONFIGS) {
        console.log(`\n--- Checking Bot: ${config.botUsername} ---`);
        const user = await User.findOne({ username: config.botUsername });
        if (!user) {
            console.log(`❌ User "${config.botUsername}" not found.`);
            allFine = false;
        } else {
            console.log(`✅ User "${config.botUsername}" found. ID: ${user._id}`);
        }

        const portal = await Portal.findOne({ name: config.portalName });
        if (!portal) {
            console.log(`❌ Portal "${config.portalName}" not found.`);
            allFine = false;
        } else {
            console.log(`✅ Portal "${config.portalName}" found. ID: ${portal._id}`);
            const channel = portal.channels.find(c => c.name === config.channelName);
            if (!channel) {
                console.log(`❌ Channel "${config.channelName}" not found in portal "${config.portalName}".`);
                console.log('Available channels:', portal.channels.map(c => c.name));
                allFine = false;
            } else {
                console.log(`✅ Channel "${config.channelName}" found. ID: ${channel._id}`);
            }
        }
    }

    await mongoose.connection.close();
    
    if (allFine) {
        console.log('\n🎉 ALL CONFIGURATIONS ARE 100% CORRECT!');
        process.exit(0);
    } else {
        console.error('\n❌ SOME CONFIGURATIONS ARE MISMATCHED/MISSING!');
        process.exit(1);
    }
}

checkConfig();
