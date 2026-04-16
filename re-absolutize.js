import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import User from './models/User.js';
import Portal from './models/Portal.js';
import Comment from './models/Comment.js';
import Message from './models/Message.js';
import Feedback from './models/Feedback.js';

async function reAbsolutize() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- 🛡️ DATABASE RE-ABSOLUTIZATION (ROLLBACK) STARTING ---');

        const domain = 'https://pub-094a78010abf4ebf9726834268946cb8.r2.dev';
        const models = [
            { name: 'Post', model: Post, field: 'media' },
            { name: 'UserAvatar', model: User, field: 'profile.avatar' },
            { name: 'UserCover', model: User, field: 'profile.coverImage' },
            { name: 'PortalAvatar', model: Portal, field: 'avatar' },
            { name: 'PortalBanner', model: Portal, field: 'banner' },
            { name: 'Comment', model: Comment, field: 'media' },
            { name: 'Message', model: Message, field: 'media' },
            { name: 'FeedbackFiles', model: Feedback, field: 'files' }
        ];

        const r2Directories = ['posts', 'avatars', 'banners', 'feedback', 'uploads'];

        for (const item of models) {
            console.log(`🔍 Processing ${item.name}...`);
            
            const records = await item.model.find();
            let fixedCount = 0;

            for (const record of records) {
                let value = item.field.split('.').reduce((obj, key) => obj?.[key], record);
                
                if (!value) continue;

                let isDirty = false;
                let newValue;

                if (Array.isArray(value)) {
                    newValue = value.map(val => {
                        const absoluted = absolutePath(val, domain, r2Directories);
                        if (absoluted !== val) isDirty = true;
                        return absoluted;
                    });
                } else if (typeof value === 'string') {
                    newValue = absolutePath(value, domain, r2Directories);
                    if (newValue !== value) isDirty = true;
                }

                if (isDirty) {
                    if (item.field.includes('.')) {
                        const parts = item.field.split('.');
                        record[parts[0]][parts[1]] = newValue;
                    } else {
                        record[item.field] = newValue;
                    }
                    await record.save();
                    fixedCount++;
                }
            }
            if (fixedCount > 0) console.log(`✅ Restored ${fixedCount} absolute URLs in ${item.name}.`);
        }

        console.log('--- 🛡️ RE-ABSOLUTIZATION COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Re-Absolutize Failed:', err);
        process.exit(1);
    }
}

function absolutePath(str, domain, directories) {
    if (!str || typeof str !== 'string') return str;
    if (str.startsWith('http')) return str; // Already absolute

    // If it starts with an internal directory, prepend the domain
    const firstSegment = str.split('/')[0];
    if (directories.includes(firstSegment)) {
        return `${domain}/${str}`;
    }
    
    return str; 
}

reAbsolutize();
