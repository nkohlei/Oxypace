import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Message from '../models/Message.js';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Database Connected ---');

        // 1. Check support account identity
        const supportUser = await User.findOne({ username: 'oxypace_support' });
        if (supportUser) {
            console.log('✅ Support account found:', supportUser.username);
            console.log('   Display Name:', supportUser.profile.displayName);
            console.log('   Is System Account:', supportUser.isSystemAccount);
        } else {
            console.log('❌ Support account NOT found. (May need a first reply to trigger creation)');
        }

        // 2. Verify admin account is NOT system
        const adminUser = await User.findOne({ username: 'oxypace' });
        if (adminUser) {
            console.log('✅ Admin account found:', adminUser.username);
            console.log('   Is System Account:', adminUser.isSystemAccount);
            if (adminUser.isSystemAccount) {
                console.log('⚠️ WARNING: Admin account is marked as system account. Fixing...');
                adminUser.isSystemAccount = false;
                await adminUser.save();
                console.log('✅ Admin account fixed.');
            }
        }

        await mongoose.connection.close();
        console.log('--- Verification Complete ---');
    } catch (err) {
        console.error('Verification error:', err);
    }
};

verify();
