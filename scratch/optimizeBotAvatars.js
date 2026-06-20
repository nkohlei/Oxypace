import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import User from '../models/User.js';
import { processAndUploadMultiResAvatars } from '../utils/avatarOptimizer.js';

dotenv.config();

async function run() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI is missing');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const bots = await User.find({ isBot: true });
    console.log(`Found ${bots.length} bot accounts`);

    for (const bot of bots) {
        const avatarPath = bot.profile?.avatar;
        if (!avatarPath) {
            console.log(`Bot ${bot.username} has no avatar.`);
            continue;
        }

        console.log(`Processing bot ${bot.username} with avatar: ${avatarPath}`);

        // If it is a local upload path, e.g. /uploads/cinema_bot_avatar.png
        if (avatarPath.startsWith('/uploads/') || avatarPath.startsWith('uploads/')) {
            const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
            const fullLocalPath = path.join(process.cwd(), cleanPath);

            if (!fs.existsSync(fullLocalPath)) {
                console.error(`File does not exist locally: ${fullLocalPath}`);
                continue;
            }

            const parsedPath = path.parse(cleanPath);
            const folder = parsedPath.dir;
            const baseName = parsedPath.name;

            const inputBuffer = fs.readFileSync(fullLocalPath);
            const sharpInstance = sharp(inputBuffer);

            // Generate medium
            const mediumPath = path.join(process.cwd(), folder, `${baseName}-medium.webp`);
            const mediumBuffer = await sharpInstance
                .clone()
                .resize(300, 300, { fit: 'cover', withoutEnlargement: false })
                .webp({ quality: 80 })
                .toBuffer();
            fs.writeFileSync(mediumPath, mediumBuffer);
            console.log(`Created: ${mediumPath}`);

            // Generate thumbnail
            const thumbnailPath = path.join(process.cwd(), folder, `${baseName}-thumbnail.webp`);
            const thumbnailBuffer = await sharpInstance
                .clone()
                .resize(80, 80, { fit: 'cover', withoutEnlargement: false })
                .webp({ quality: 60 })
                .toBuffer();
            fs.writeFileSync(thumbnailPath, thumbnailBuffer);
            console.log(`Created: ${thumbnailPath}`);

            // Generate lowres
            const lowResPath = path.join(process.cwd(), folder, `${baseName}-lowres.webp`);
            const lowResBuffer = await sharpInstance
                .clone()
                .resize(150, 150, { fit: 'cover', withoutEnlargement: false })
                .webp({ quality: 50 })
                .toBuffer();
            fs.writeFileSync(lowResPath, lowResBuffer);
            console.log(`Created: ${lowResPath}`);

            // Update user in DB
            bot.profile.lowResAvatar = `/${folder}/${baseName}-lowres.webp`;
            await bot.save();
            console.log(`Updated bot database profile.lowResAvatar to: ${bot.profile.lowResAvatar}`);
        } else {
            // It is likely on R2
            try {
                let mediaKey = avatarPath;
                if (avatarPath.includes('/r2-media/')) {
                    mediaKey = avatarPath.substring(avatarPath.indexOf('/r2-media/') + 10);
                } else if (avatarPath.includes('/api/media/')) {
                    mediaKey = decodeURIComponent(avatarPath.substring(avatarPath.indexOf('/api/media/') + 11));
                }

                if (mediaKey && !mediaKey.startsWith('http') && !mediaKey.startsWith('data:') && !mediaKey.startsWith('blob:') && !mediaKey.startsWith('/system/')) {
                    console.log(`Optimizing R2 avatar: ${mediaKey}`);
                    const result = await processAndUploadMultiResAvatars(mediaKey);
                    bot.profile.avatar = result.original;
                    bot.profile.lowResAvatar = result.lowRes;
                    await bot.save();
                    console.log(`Successfully generated and uploaded optimized bot R2 avatars! Updated lowResAvatar to: ${bot.profile.lowResAvatar}`);
                } else {
                    console.log(`Bot ${bot.username} avatar path is a system fallback or external URL. Skipping.`);
                }
            } catch (err) {
                console.error(`Failed to optimize bot avatar on R2 for bot ${bot.username}:`, err.message);
            }
        }
    }

    await mongoose.disconnect();
    console.log('Done!');
}

run().catch(err => {
    console.error('Error running script:', err);
    process.exit(1);
});
