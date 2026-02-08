import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Portal from './models/Portal.js';
import Post from './models/Post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust Env Loading
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('CRITICAL: .env file not found!');
    process.exit(1);
}

const deletePortal = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!MONGO_URI) {
            throw new Error('MONGO_URI missing');
        }

        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected.');

        const portalName = 'test 1';
        // Fuzzy match
        const portals = await Portal.find({});
        const portal = portals.find((p) => /test\s?1/i.test(p.name));

        if (!portal) {
            console.log(`Portal '${portalName}' not found. Nothing to delete.`);
            process.exit(0);
        }

        console.log(`Deleting Portal: ${portal.name} (${portal._id})`);

        // Check for lingering posts
        const postCount = await Post.countDocuments({ portal: portal._id });
        if (postCount > 0) {
            console.warn(`WARNING: There are still ${postCount} posts linked to this portal.`);
            console.warn(
                'Aborting deletion to prevent data loss. Please run merge_portals.js first.'
            );
            process.exit(1);
        }

        // Delete Portal
        await Portal.findByIdAndDelete(portal._id);
        console.log('✅ Portal document deleted.');

        // Clean up Users
        const usersUpdate = await User.updateMany(
            { joinedPortals: portal._id },
            { $pull: { joinedPortals: portal._id } }
        );
        console.log(`✅ Removed portal reference from ${usersUpdate.modifiedCount} users.`);

        console.log('Deletion complete.');
        process.exit(0);
    } catch (err) {
        console.error('Delete Error:', err);
        process.exit(1);
    }
};

deletePortal();
