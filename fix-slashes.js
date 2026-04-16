import 'dotenv/config';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import User from './models/User.js';
import Portal from './models/Portal.js';
import Comment from './models/Comment.js';
import Message from './models/Message.js';
import Feedback from './models/Feedback.js';

async function fixSlashes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- 🛡️ DATABASE SLASH NORMALIZATION STARTING ---');

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

        for (const item of models) {
            console.log(`🔍 Checking ${item.name}...`);
            
            const records = await item.model.find();
            let fixedCount = 0;

            for (const record of records) {
                let value = item.field.split('.').reduce((obj, key) => obj?.[key], record);
                
                if (!value) continue;

                let isDirty = false;
                let newValue;

                if (Array.isArray(value)) {
                    newValue = value.map(val => {
                        const cleaned = cleanSlash(val);
                        if (cleaned !== val) isDirty = true;
                        return cleaned;
                    });
                } else if (typeof value === 'string') {
                    newValue = cleanSlash(value);
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
            if (fixedCount > 0) console.log(`✅ Fixed ${fixedCount} slashes in ${item.name}.`);
        }

        console.log('--- 🛡️ SLASH NORMALIZATION COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Slash Fix Failed:', err);
        process.exit(1);
    }
}

function cleanSlash(str) {
    if (!str || typeof str !== 'string') return str;
    // Fix double slashes while preserving the protocol
    // https://domain.com//path -> https://domain.com/path
    return str.replace(/([^:]\/)\/+/g, '$1');
}

fixSlashes();
