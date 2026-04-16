import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import User from './models/User.js';
import Portal from './models/Portal.js';
import Comment from './models/Comment.js';
import Message from './models/Message.js';

async function repair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
        
        console.log('--- 🛡️ COMPREHENSIVE DATA REPAIR STARTING ---');
        console.log(`Target R2 Domain: ${r2PublicDomain}`);

        const models = [
            { name: 'Post', model: Post, field: 'media' },
            { name: 'UserAvatar', model: User, field: 'profile.avatar' },
            { name: 'UserCover', model: User, field: 'profile.coverImage' },
            { name: 'PortalAvatar', model: Portal, field: 'avatar' },
            { name: 'PortalBanner', model: Portal, field: 'banner' },
            { name: 'Comment', model: Comment, field: 'media' },
            { name: 'Message', model: Message, field: 'media' }
        ];

        for (const item of models) {
            console.log(`🔍 Checking ${item.name}...`);
            
            // Query for records containing legacy strings
            const query = { [item.field]: { $regex: 'vercel.app|r2-media|koyeb.app/uploads' } };
            const records = await item.model.find(query);

            if (records.length === 0) continue;
            console.log(`Found ${records.length} records in ${item.name} to fix.`);

            for (const record of records) {
                // Get the value (handle nested fields)
                let value = item.field.split('.').reduce((obj, key) => obj?.[key], record);
                
                if (!value || typeof value !== 'string') continue;

                console.log(`Updating ${record._id}: ${value}`);

                // Strip the incorrect domain/path and extract just the R2 key
                // Example: https://oxypace.vercel.app/r2-media/posts/abc.jpg -> posts/abc.jpg
                const r2Directories = ['posts', 'avatars', 'banners', 'feedback', 'uploads'];
                const segments = value.split('/');
                const folderIndex = segments.findIndex(s => r2Directories.includes(s));

                if (folderIndex !== -1) {
                    const key = segments.slice(folderIndex).join('/');
                    const newValue = `${r2PublicDomain}/${key}`;
                    
                    // Set the value back (handle nested)
                    if (item.field.includes('.')) {
                        const parts = item.field.split('.');
                        record[parts[0]][parts[1]] = newValue;
                    } else {
                        record[item.field] = newValue;
                    }
                    
                    await record.save();
                    console.log(`✅ Fixed: ${newValue}`);
                }
            }
        }

        console.log('--- 🛡️ REPAIR COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Repair Failed:', err);
        process.exit(1);
    }
}
repair();
