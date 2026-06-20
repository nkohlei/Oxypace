import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const botUsernames = ['GamesNews', 'TechNews', 'SportNews', 'Space', 'MovieNewsBot'];

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const result = await User.updateMany(
        { username: { $in: botUsernames } },
        { $set: { isBot: true } }
    );
    
    console.log('Update result:', result);
    
    const updatedUsers = await User.find({ username: { $in: botUsernames } }).select('username isBot');
    console.log('Updated bots in DB:');
    console.log(updatedUsers);
    
    await mongoose.disconnect();
}

migrate();
