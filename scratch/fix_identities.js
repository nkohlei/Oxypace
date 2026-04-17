import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Database Connected ---');

        // 1. Reset 'oxypace' Admin Account
        const adminUser = await User.findOne({ username: 'oxypace' });
        if (adminUser) {
            console.log('Updating @oxypace admin account...');
            adminUser.isSystemAccount = false;
            adminUser.profile.displayName = 'Oxypace';
            if (adminUser.profile.avatar === '/system/support_avatar.png') {
                adminUser.profile.avatar = ''; 
            }
            await adminUser.save();
            console.log('✅ @oxypace updated to normal admin.');
        }

        // 2. Setup 'oxypace_support' System Account
        // Find by current username OR email used for support
        let supportUser = await User.findOne({ 
            $or: [
                { username: 'oxypace_support' },
                { email: 'support@oxypace.com' }
            ]
        });

        if (!supportUser) {
            console.log('Creating @oxypace_support account...');
            supportUser = await User.create({
                username: 'oxypace_support',
                email: 'support@oxypace.com',
                password: new mongoose.Types.ObjectId().toString(),
                isSystemAccount: true,
                isVerified: true,
                verificationBadge: 'special',
                profile: {
                    displayName: 'Oxypace Destek',
                    bio: 'Oxypace Resmi Destek ve Geri Bildirim Hesabı',
                    avatar: '/system/support_avatar.png'
                }
            });
            console.log('✅ @oxypace_support created.');
        } else {
            console.log(`Updating existing support account (Current username: ${supportUser.username})...`);
            supportUser.username = 'oxypace_support'; // Standardize the username
            supportUser.isSystemAccount = true;
            supportUser.profile.displayName = 'Oxypace Destek';
            supportUser.profile.avatar = '/system/support_avatar.png';
            await supportUser.save();
            console.log('✅ @oxypace_support updated and renamed.');
        }

        await mongoose.connection.close();
        console.log('--- Fix Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Fix error:', err);
        process.exit(1);
    }
};

fix();
