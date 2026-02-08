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

// 1. Explicitly load .env from current directory
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('CRITICAL: .env file not found!');
    process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not defined in .env');
    console.log('Env Keys:', Object.keys(process.env));
    process.exit(1);
}

const mergePortals = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected.');

        // 2. Find Portals (Case insensitive, flexible spaces)
        const portals = await Portal.find({});
        console.log(`Found ${portals.length} portals in DB.`);

        // Regex for "test 1" (matches "test 1", "Test 1", "test1")
        const sourceRegex = /test\s?1/i;
        // Regex for "deepace global" (matches "deepace global", "Deepace Global")
        const targetRegex = /deepace\s?global/i;

        const source = portals.find((p) => sourceRegex.test(p.name));
        const target = portals.find((p) => targetRegex.test(p.name));

        if (!source) {
            console.error('❌ Source portal (test 1) not found.');
            console.log('Available portals:', portals.map((p) => p.name).join(', '));
            process.exit(1);
        }
        if (!target) {
            console.error('❌ Target portal (deepace global) not found.');
            console.log('Available portals:', portals.map((p) => p.name).join(', '));
            process.exit(1);
        }

        console.log('------------------------------------------------');
        console.log(`SOURCE: ${source.name} (${source._id})`);
        console.log(`TARGET: ${target.name} (${target._id})`);
        console.log('------------------------------------------------');

        // 3. Merge Channels
        let channelsAdded = 0;
        if (source.channels && source.channels.length > 0) {
            for (const ch of source.channels) {
                const alreadyExists =
                    target.channels &&
                    target.channels.some((tc) => tc.name.toLowerCase() === ch.name.toLowerCase());

                if (!alreadyExists) {
                    target.channels.push(ch); // Mongoose will handle subdoc creation
                    channelsAdded++;
                }
            }
        }
        console.log(`✅ Channels Merged: ${channelsAdded} new channels added.`);

        // 4. Merge Members
        const initialMembers = target.members ? target.members.length : 0;
        const sourceMembers = source.members || [];
        // Use Set to avoid duplicates
        const memberSet = new Set(target.members.map((m) => m.toString()));
        sourceMembers.forEach((m) => memberSet.add(m.toString()));
        target.members = Array.from(memberSet);
        console.log(`✅ Members Merged: ${initialMembers} -> ${target.members.length}`);

        // 5. Merge Admins
        const adminSet = new Set(target.admins.map((a) => a.toString()));
        if (source.admins) {
            source.admins.forEach((a) => adminSet.add(a.toString()));
        }
        target.admins = Array.from(adminSet);
        console.log(`✅ Admins Merged.`);

        // Save Target Portal
        await target.save();
        console.log('💾 Target portal saved with new data.');

        // 6. Move Posts
        // Update all posts belonging to source portal to target portal
        const postResult = await Post.updateMany(
            { portal: source._id },
            { $set: { portal: target._id } }
        );
        console.log(`✅ Posts Moved: ${postResult.modifiedCount} posts transferred.`);

        // 7. Update Users 'joinedPortals' list
        // Users who were in source need to have source removed and target added (if not already there)
        const usersToUpdate = await User.find({ joinedPortals: source._id });
        console.log(`Processing ${usersToUpdate.length} users for profile updates...`);

        let usersUpdatedCount = 0;
        for (const user of usersToUpdate) {
            let changed = false;
            // Remove source ID
            const originalLength = user.joinedPortals.length;
            user.joinedPortals = user.joinedPortals.filter(
                (pid) => pid.toString() !== source._id.toString()
            );

            if (user.joinedPortals.length !== originalLength) {
                changed = true;
            }

            // Add target ID if not present
            if (!user.joinedPortals.some((pid) => pid.toString() === target._id.toString())) {
                user.joinedPortals.push(target._id);
                changed = true;
            }

            if (changed) {
                await user.save();
                usersUpdatedCount++;
            }
        }
        console.log(`✅ User Profiles Updated: ${usersUpdatedCount} users.`);

        console.log('------------------------------------------------');
        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('------------------------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

mergePortals();
