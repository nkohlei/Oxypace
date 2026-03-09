import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';

export const setupChangeStreams = (io) => {
    try {
        // Only run watch if the database is likely to support it (replica set enabled)
        // If it throws, we catch and log gracefully without taking the server down.

        let postStream, userStream;

        try {
            postStream = Post.watch([], { fullDocument: 'updateLookup' });
            userStream = User.watch([], { fullDocument: 'updateLookup' });
        } catch (watchErr) {
            console.warn('⚠️ MongoDB Change Streams unavialable (likely no replica set). Falling back to standard operations.', watchErr.message);
            return;
        }

        if (postStream) {
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
                console.error('⚠️ Post Stream Error (Gracefully handled):', err.message);
            });
        }

        if (userStream) {
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
                console.error('⚠️ User Stream Error (Gracefully handled):', err.message);
            });
        }

        console.log('📡 MongoDB Change Streams dinleniyor...');
    } catch (error) {
        console.error('❌ Error setting up MongoDB Change Streams:', error.message);
    }
};
