import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const diagnostic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ email: 'support@oxypace.com' });
        console.log('Users with support@oxypace.com:');
        users.forEach(u => console.log(`- ${u.username} (ID: ${u._id})`));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

diagnostic();
