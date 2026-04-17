import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const OLD_DOMAIN_ENCODED = 'https%3A%2F%2Foxypace.vercel.app%2Fr2-media%2F';
const NEW_DOMAIN_ENCODED = 'https%3A%2F%2Fpub-094a78010abf4ebf9726834268946cb8.r2.dev%2F';

async function migrate() {
    try {
        console.log('🚀 Starting Media URL Migration...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        let totalUpdated = 0;

        // 1. Migrate Posts
        const posts = await Post.find({ media: { $regex: OLD_DOMAIN_ENCODED } });
        console.log(`📝 Found ${posts.length} posts with broken URLs`);
        for (const post of posts) {
            post.media = post.media.replace(OLD_DOMAIN_ENCODED, NEW_DOMAIN_ENCODED);
            await post.save();
            totalUpdated++;
        }

        // 2. Migrate User Avatars & Covers
        const users = await User.find({
            $or: [
                { 'profile.avatar': { $regex: OLD_DOMAIN_ENCODED } },
                { 'profile.coverImage': { $regex: OLD_DOMAIN_ENCODED } }
            ]
        });
        console.log(`👤 Found ${users.length} users with broken URLs`);
        for (const user of users) {
            if (user.profile.avatar) {
                user.profile.avatar = user.profile.avatar.replace(OLD_DOMAIN_ENCODED, NEW_DOMAIN_ENCODED);
            }
            if (user.profile.coverImage) {
                user.profile.coverImage = user.profile.coverImage.replace(OLD_DOMAIN_ENCODED, NEW_DOMAIN_ENCODED);
            }
            await user.save();
            totalUpdated++;
        }

        // 3. Migrate Portals
        const portals = await Portal.find({
            $or: [
                { avatar: { $regex: OLD_DOMAIN_ENCODED } },
                { banner: { $regex: OLD_DOMAIN_ENCODED } }
            ]
        });
        console.log(`🏰 Found ${portals.length} portals with broken URLs`);
        for (const portal of portals) {
            if (portal.avatar) {
                portal.avatar = portal.avatar.replace(OLD_DOMAIN_ENCODED, NEW_DOMAIN_ENCODED);
            }
            if (portal.banner) {
                portal.banner = portal.banner.replace(OLD_DOMAIN_ENCODED, NEW_DOMAIN_ENCODED);
            }
            await portal.save();
            totalUpdated++;
        }

        console.log(`\n🎉 Migration completed! Total records updated: ${totalUpdated}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
