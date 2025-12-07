import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const updateBadge = async (username, badgeType) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOneAndUpdate(
            { username: username },
            { verificationBadge: badgeType },
            { new: true }
        );

        if (user) {
            console.log(`Updated user ${username} with badge: ${badgeType}`);
        } else {
            console.log(`User ${username} not found.`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error updating badge:', error);
        process.exit(1);
    }
};

const username = process.argv[2];
const badge = process.argv[3] || 'blue';

if (!username) {
    console.log('Usage: node update_badge.js <username> [blue|gold|staff|iridescent|none]');
    process.exit(1);
}

updateBadge(username, badge);
