import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Post from '../models/Post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to DB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const botUsernames = ['GamesNews', 'TechNews', 'SportNews', 'Space', 'MovieNewsBot'];
    
    // Find all bot user IDs
    const bots = await User.find({ username: { $in: botUsernames } });
    const botIds = bots.map(b => b._id);
    
    console.log(`Found ${bots.length} bot accounts. Cleaning up duplicate media fields from their old posts...`);

    const result = await Post.updateMany(
        { author: { $in: botIds } },
        { 
            $set: { 
                media: '', 
                mediaType: 'none' 
            } 
        }
    );

    console.log(`Successfully updated ${result.modifiedCount} old bot posts to remove direct image attachments.`);
    
    console.log('Closing DB connection...');
    await mongoose.connection.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
