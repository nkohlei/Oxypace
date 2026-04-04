import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './models/Post.js';
import User from './models/User.js';

dotenv.config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5).populate('author', 'username');
        
        console.log('🔔 Recent Posts Check:');
        posts.forEach(p => {
            console.log(`- [${p.author.username}] ${p.content.substring(0, 50)}... (Media: ${p.mediaType})`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDB();
