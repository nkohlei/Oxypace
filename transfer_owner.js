import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Portal from './models/Portal.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const transferOwnership = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find User 'deepace'
        const user = await User.findOne({ username: 'deepace' });
        if (!user) {
            console.log('User deepace not found');
            process.exit(1);
        }
        console.log(`Found user: ${user.username} (${user._id})`);

        // 2. Find Portal 'test 1'
        const portal = await Portal.findOne({ name: 'test 1' });
        if (!portal) {
            console.log('Portal test 1 not found');
            process.exit(1);
        }
        console.log(`Found portal: ${portal.name} (${portal._id})`);

        // 3. Update Owner
        portal.owner = user._id;

        // Ensure they are also in admins and members
        if (!portal.admins.includes(user._id)) {
            portal.admins.push(user._id);
        }
        if (!portal.members.includes(user._id)) {
            portal.members.push(user._id);
        }

        await portal.save();
        console.log(`Ownership transferred to ${user.username}`);

        // Update User's joinedPortals just in case
        if (!user.joinedPortals.includes(portal._id)) {
            user.joinedPortals.push(portal._id);
            await user.save();
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

transferOwnership();
