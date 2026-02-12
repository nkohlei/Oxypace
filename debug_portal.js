import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

// We need to import models. Assuming they are ESM too.
// If models are CJS, we might need createRequire. 
// But the project uses `import` in client, let's check backend.
// Actually, let's look at `server.js` to see if it uses import or require.
// If I can't be sure, I'll use a robust approach.
// But first, let's try to just read server.js to know the module system.
// Wait, I don't want to waste a turn. The project roots likely use CommonJS if `require` failed with "ES Module" error? 
// No, "ReferenceError: require is not defined" means the file is treated as ESM.

// Let's rewrite as ESM.
// Note: We need to point to the correct model files.
// `models/Portal.js` etc.

import Portal from './models/Portal.js';
import Post from './models/Post.js';
import User from './models/User.js';

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
}

const debugPortal = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const portals = await Portal.find({ name: /OXY/i });

        console.log(`Found ${portals.length} portals matching "OXY".`);

        for (const portal of portals) {
            console.log('--------------------------------------------------');
            console.log(`Portal Name: ${portal.name}`);
            console.log(`Portal ID: ${portal._id}`);
            console.log(`Channels:`, JSON.stringify(portal.channels, null, 2));

            const posts = await Post.find({ portal: portal._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('author', 'username profile') // Ensure this path is valid in your schema
                .lean();

            console.log(`Found ${posts.length} recent posts.`);

            posts.forEach((post, i) => {
                console.log(`Post #${i + 1}:`);
                console.log(`  ID: ${post._id}`);
                console.log(`  Channel: ${post.channel} (Type: ${typeof post.channel})`);
                console.log(`  Content: ${post.content ? post.content.substring(0, 50) : 'NULL'}`);
                console.log(`  Author:`, post.author ? post.author.username : 'NULL/MISSING');
                console.log(`  Media: ${post.media}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

debugPortal();
