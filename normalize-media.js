import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import User from './models/User.js';
import Portal from './models/Portal.js';
import Comment from './models/Comment.js';
import Message from './models/Message.js';
import Feedback from './models/Feedback.js';

async function normalize() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
        
        console.log('--- 🛡️ GLOBAL MEDIA NORMALIZATION STARTING ---');
        console.log(`Target R2 Domain: ${r2PublicDomain}`);

        const models = [
            { name: 'Post', model: Post, field: 'media' },
            { name: 'UserAvatar', model: User, field: 'profile.avatar' },
            { name: 'UserCover', model: User, field: 'profile.coverImage' },
            { name: 'PortalAvatar', model: Portal, field: 'avatar' },
            { name: 'PortalBanner', model: Portal, field: 'banner' },
            { name: 'Comment', model: Comment, field: 'media' },
            { name: 'Message', model: Message, field: 'media' },
            { name: 'FeedbackFiles', model: Feedback, field: 'files' } // This is an array
        ];

        for (const item of models) {
            console.log(`🔍 Processing ${item.name}...`);
            
            // Query for any relative paths or proxy URLs
            const query = { 
                $or: [
                    { [item.field]: { $regex: '^/api/media/' } },
                    { [item.field]: { $regex: 'koyeb.app/api/media/' } },
                    { [item.field]: { $regex: 'vercel.app/r2-media/' } },
                    { [item.field]: { $regex: '^uploads/' } },
                    { [item.field]: { $regex: '^avatars/' } },
                    { [item.field]: { $regex: '^posts/' } }
                ]
            };

            const records = await item.model.find(query);
            if (records.length === 0) continue;

            console.log(`Found ${records.length} records to normalize.`);

            for (const record of records) {
                let value = item.field.split('.').reduce((obj, key) => obj?.[key], record);
                
                if (!value) continue;

                // Handle Array field (Feedback files)
                if (Array.isArray(value)) {
                    const newArray = value.map(val => normalizeStr(val, r2PublicDomain));
                    record[item.field] = newArray;
                } else if (typeof value === 'string') {
                    const newValue = normalizeStr(value, r2PublicDomain);
                    
                    // Set back
                    if (item.field.includes('.')) {
                        const parts = item.field.split('.');
                        record[parts[0]][parts[1]] = newValue;
                    } else {
                        record[item.field] = newValue;
                    }
                }

                await record.save();
            }
        }

        console.log('--- 🛡️ NORMALIZATION COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Normalization Failed:', err);
        process.exit(1);
    }
}

function normalizeStr(val, r2Domain) {
    if (!val || typeof val !== 'string') return val;
    if (val.startsWith('http') && val.includes('r2.dev')) return val; // Already good

    const r2Directories = ['posts', 'avatars', 'banners', 'feedback', 'uploads'];
    const segments = val.split('/');
    const folderIndex = segments.findIndex(s => r2Directories.includes(s));

    if (folderIndex !== -1) {
        const key = segments.slice(folderIndex).join('/');
        return `${r2Domain}/${key}`;
    }
    return val;
}

normalize();
