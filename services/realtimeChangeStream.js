import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';

export const setupChangeStreams = (io) => {
    try {
        // Post değişikliklerini izleme
        const postStream = Post.watch([], { fullDocument: 'updateLookup' });

        postStream.on('change', (change) => {
            if (change.operationType === 'insert') {
                const newPost = change.fullDocument;
                io.emit('global:post_created', newPost);
            } else if (change.operationType === 'update') {
                const updatedPost = change.fullDocument;
                if (updatedPost) {
                    io.emit('global:post_updated', updatedPost);
                }
            } else if (change.operationType === 'delete') {
                io.emit('global:post_deleted', { _id: change.documentKey._id });
            }
        });

        postStream.on('error', (err) => {
            console.error('Post Stream Error:', err);
        });

        // Kullanıcı verisi değişikliklerini izleme (Örn: PP, displayName)
        const userStream = User.watch([], { fullDocument: 'updateLookup' });

        userStream.on('change', (change) => {
            if (change.operationType === 'update') {
                io.emit('global:user_updated', {
                    _id: change.documentKey._id,
                    updatedFields: change.updateDescription?.updatedFields,
                    fullDocument: change.fullDocument
                });
            }
        });

        userStream.on('error', (err) => {
            console.error('User Stream Error:', err);
        });

        console.log('📡 MongoDB Change Streams dinleniyor...');
    } catch (error) {
        console.error('❌ Error setting up MongoDB Change Streams:', error);
    }
};
