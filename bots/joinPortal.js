import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Portal from '../models/Portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORTAL_ID = '69485e416ce2eac8943a5de2'; // Oxypace Global
const BOT_EMAILS = ['techbot@oxypace.com', 'sportsbot@oxypace.com'];

async function addBotsToPortal() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const portal = await Portal.findById(PORTAL_ID);
    if (!portal) {
        console.error('Portal not found!');
        process.exit(1);
    }

    for (const email of BOT_EMAILS) {
        const user = await User.findOne({ email });
        if (user) {
            // Add user to portal members if not exists
            if (!portal.members.includes(user._id)) {
                portal.members.push(user._id);
                console.log(`Added ${user.username} to portal members.`);
            } else {
                console.log(`${user.username} is already a member.`);
            }

            // Add portal to user joinedPortals if not exists
            if (!user.joinedPortals.includes(portal._id)) {
                user.joinedPortals.push(portal._id);
                await user.save();
                console.log(`Added portal to ${user.username}'s joined list.`);
            }
        }
    }

    await portal.save();
    console.log('Portal members updated.');
    process.exit(0);
}

addBotsToPortal();
