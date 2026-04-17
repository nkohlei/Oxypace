import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Database Connected ---');

        const supportUser = await User.findOne({ username: 'oxypace_support' });
        if (supportUser && supportUser.isSystemAccount) {
            console.log('✅ @oxypace_support is a verified system account.');
        } else {
            console.log('❌ @oxypace_support system account check failed.');
        }

        const adminUser = await User.findOne({ username: 'oxypace' });
        if (adminUser && !adminUser.isSystemAccount) {
            console.log('✅ @oxypace is a verified personal admin account.');
        } else {
            console.log('❌ @oxypace personal account check failed.');
        }

        await mongoose.connection.close();
        console.log('--- Verification Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Verification error:', err);
        process.exit(1);
    }
};

verify();
