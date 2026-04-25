import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';

dotenv.config();

const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'pub-094a78010abf4ebf9726834268946cb8.r2.dev';
const PROXY_PREFIX = '/api/media/';

async function fixPaths() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🚀 Starting Media Path Optimization...');

        const cleanPath = (path) => {
            if (!path) return path;
            let newPath = path;

            // 1. Remove recursive proxying or redundant proxying
            if (newPath.includes(PROXY_PREFIX)) {
                try {
                    const parts = newPath.split(PROXY_PREFIX);
                    const lastPart = parts[parts.length - 1];
                    newPath = decodeURIComponent(lastPart);
                    // Recursively clean if it was double-proxied
                    return cleanPath(newPath);
                } catch (e) {
                    console.warn(`Failed to decode path: ${newPath}`);
                }
            }

            // 2. Internalize R2 URLs to relative paths
            if (newPath.includes(R2_DOMAIN)) {
                try {
                    const urlString = newPath.startsWith('http') ? newPath : `https://${newPath}`;
                    const url = new URL(urlString);
                    newPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                } catch (e) {
                     const index = newPath.indexOf(R2_DOMAIN);
                     newPath = newPath.substring(index + R2_DOMAIN.length).replace(/^\/+/, '');
                }
            }

            return newPath;
        };

        // Update Posts
        const posts = await Post.find({ media: { $exists: true } });
        let postCount = 0;
        for (const post of posts) {
            const newMedia = cleanPath(post.media);
            if (newMedia !== post.media) {
                console.log(`Updating Post ${post._id}: ${post.media} -> ${newMedia}`);
                post.media = newMedia;
                await post.save();
                postCount++;
            }
        }
        console.log(`✅ Updated ${postCount} posts`);

        // Update Users
        const users = await User.find({ 
            $or: [
                { 'profile.avatar': { $exists: true } }, 
                { 'profile.coverImage': { $exists: true } }
            ] 
        });
        let userCount = 0;
        for (const user of users) {
            let changed = false;
            if (user.profile?.avatar) {
                const newAvatar = cleanPath(user.profile.avatar);
                if (newAvatar !== user.profile.avatar) {
                    user.profile.avatar = newAvatar;
                    changed = true;
                }
            }
            if (user.profile?.coverImage) {
                const newCover = cleanPath(user.profile.coverImage);
                if (newCover !== user.profile.coverImage) {
                    user.profile.coverImage = newCover;
                    changed = true;
                }
            }
            if (changed) {
                await user.save();
                userCount++;
            }
        }
        console.log(`✅ Updated ${userCount} users`);

        // Update Portals
        const portals = await Portal.find({ 
            $or: [
                { avatar: { $exists: true } }, 
                { banner: { $exists: true } }
            ] 
        });
        let portalCount = 0;
        for (const portal of portals) {
            let changed = false;
            if (portal.avatar) {
                const newAvatar = cleanPath(portal.avatar);
                if (newAvatar !== portal.avatar) {
                    portal.avatar = newAvatar;
                    changed = true;
                }
            }
            if (portal.banner) {
                const newBanner = cleanPath(portal.banner);
                if (newBanner !== portal.banner) {
                    portal.banner = newBanner;
                    changed = true;
                }
            }
            if (changed) {
                await portal.save();
                portalCount++;
            }
        }
        console.log(`✅ Updated ${portalCount} portals`);

        console.log('\n🎉 Optimization Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

fixPaths();
