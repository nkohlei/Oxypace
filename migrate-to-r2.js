import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import r2 from './config/r2.js';

// Models
import User from './models/User.js';
import Post from './models/Post.js';
import Portal from './models/Portal.js';
import Message from './models/Message.js';
import Comment from './models/Comment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'oxypace';
const BACKEND_URL = process.env.BACKEND_URL || 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app';

if (!R2_PUBLIC_DOMAIN) {
    console.error('❌ R2_PUBLIC_DOMAIN is not defined in .env');
    process.exit(1);
}

async function uploadToR2(filePath, key) {
    try {
        // Check if already exists
        try {
            await r2.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
            console.log(`  - File already exists in R2: ${key}`);
            return true;
        } catch (e) {
            // Not found, proceed to upload
        }

        const fileContent = fs.readFileSync(filePath);
        const contentType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 
                          path.extname(filePath).toLowerCase() === '.jpg' || path.extname(filePath).toLowerCase() === '.jpeg' ? 'image/jpeg' : 
                          'application/octet-stream';

        await r2.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            ACL: 'public-read'
        }));
        console.log(`  ✅ Uploaded to R2: ${key}`);
        return true;
    } catch (error) {
        console.error(`  ❌ Error uploading ${key}:`, error.message);
        return false;
    }
}

function getR2Url(key) {
    return `${R2_PUBLIC_DOMAIN}/${key}`;
}

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('🚀 Connected to MongoDB');

        // 1. Migrate Users (Avatar, Cover)
        console.log('\n--- Migrating Users ---');
        const users = await User.find({ 
            $or: [
                { 'profile.avatar': { $regex: 'uploads|koyeb|/api/media' } },
                { 'profile.coverImage': { $regex: 'uploads|koyeb|/api/media' } }
            ]
        });
        console.log(`Found ${users.length} users to update.`);

        for (const user of users) {
            console.log(`User: ${user.username}`);
            // Fix Avatar
            if (user.profile.avatar) {
                user.profile.avatar = await fixMediaUrl(user.profile.avatar, 'avatars');
            }
            // Fix Cover
            if (user.profile.coverImage) {
                user.profile.coverImage = await fixMediaUrl(user.profile.coverImage, 'banners');
            }
            await user.save();
        }

        // 2. Migrate Posts
        console.log('\n--- Migrating Posts ---');
        const posts = await Post.find({ media: { $regex: 'uploads|koyeb|/api/media' } });
        console.log(`Found ${posts.length} posts to update.`);
        for (const post of posts) {
            console.log(`Post: ${post._id}`);
            post.media = await fixMediaUrl(post.media, 'posts');
            await post.save();
        }

        // 3. Migrate Portals
        console.log('\n--- Migrating Portals ---');
        const portals = await Portal.find({ 
            $or: [
                { avatar: { $regex: 'uploads|koyeb|/api/media' } },
                { banner: { $regex: 'uploads|koyeb|/api/media' } }
            ]
        });
        console.log(`Found ${portals.length} portals to update.`);
        for (const portal of portals) {
            console.log(`Portal: ${portal.name}`);
            if (portal.avatar) portal.avatar = await fixMediaUrl(portal.avatar, 'portals/avatars');
            if (portal.banner) portal.banner = await fixMediaUrl(portal.banner, 'portals/banners');
            await portal.save();
        }

        // 4. Migrate Messages
        console.log('\n--- Migrating Messages ---');
        const messages = await Message.find({ media: { $regex: 'uploads|koyeb|/api/media' } });
        console.log(`Found ${messages.length} messages to update.`);
        for (const msg of messages) {
            console.log(`Message: ${msg._id}`);
            msg.media = await fixMediaUrl(msg.media, 'messages');
            await msg.save();
        }

        // 5. Migrate Comments
        console.log('\n--- Migrating Comments ---');
        const comments = await Comment.find({ media: { $regex: 'uploads|koyeb|/api/media' } });
        console.log(`Found ${comments.length} comments to update.`);
        for (const comment of comments) {
            console.log(`Comment: ${comment._id}`);
            comment.media = await fixMediaUrl(comment.media, 'comments');
            await comment.save();
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
}

async function fixMediaUrl(url, defaultFolder) {
    if (!url) return url;

    // Already a Cloudflare URL?
    if (url.includes(R2_PUBLIC_DOMAIN)) return url;

    // Case 1: Local /uploads/ path
    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
        const filename = path.basename(url);
        const localPath = path.join(UPLOADS_DIR, filename);
        const r2Key = `${defaultFolder}/${filename}`;
        
        if (fs.existsSync(localPath)) {
            const success = await uploadToR2(localPath, r2Key);
            if (success) return getR2Url(r2Key);
        } else {
            console.warn(`  ⚠️ File not found locally: ${localPath}`);
        }
    }

    // Case 2: Proxy or Koyeb URL
    if (url.includes('/api/media/')) {
        const key = url.split('/api/media/')[1];
        if (key) {
            // Check if it already exists on R2
            try {
                await r2.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
                return getR2Url(key);
            } catch (e) {
                console.warn(`  ⚠️ Proxy key not found in R2: ${key}`);
                // If it's a proxy key but not in R2, maybe it's in the local uploads?
                const localPath = path.join(UPLOADS_DIR, path.basename(key));
                if (fs.existsSync(localPath)) {
                    await uploadToR2(localPath, key);
                    return getR2Url(key);
                }
            }
        }
    }
    
    // Case 3: Hardcoded Backend URL without proxy (unlikely but possible)
    if (url.includes(BACKEND_URL) && !url.includes('/api/media/')) {
         const filename = path.basename(url);
         const localPath = path.join(UPLOADS_DIR, filename);
         const r2Key = `${defaultFolder}/${filename}`;
         if (fs.existsSync(localPath)) {
             await uploadToR2(localPath, r2Key);
             return getR2Url(r2Key);
         }
    }

    return url; // Return original if we can't fix it
}

migrate();
