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
            postStream.on('change', async (change) => {
                try {
                    if (change.operationType === 'insert') {
                        // Document comes from updateLookup but is NOT populated by default.
                        // We must populate it so clients don't crash expecting an author object.
                        const newPost = await Post.findById(change.documentKey._id).populate('author', 'username profile verificationBadge');
                        if (newPost) {
                            // 1. Emit to the specific portal room
                            if (newPost.portal) {
                                io.to(`portal:${newPost.portal.toString()}`).emit('post:created', newPost);
                            }

                            // 2. Emit to the specific channel room
                            if (newPost.channel) {
                                io.to(`channel:${newPost.channel.toString()}`).emit('post:created', newPost);
                            }

                            // 2.1 BROADCAST GLOBAL PORTAL ACTIVITY (For Sidebar Badges)
                            if (newPost.portal) {
                                io.emit('global:portal_activity', {
                                    portalId: newPost.portal.toString(),
                                    channelId: newPost.channel?.toString(),
                                    postId: newPost._id.toString()
                                });
                            }
                            // 3. Keep global for things that listen to everything (like an admin or global feed)
                            // ONLY emit if it's NOT a portal post to ensure strict isolation
                            if (!newPost.portal) {
                                io.emit('global:post_created', newPost);
                            }
                        }
                    } else if (change.operationType === 'update') {
                        const updatedPost = await Post.findById(change.documentKey._id).populate('author', 'username profile verificationBadge');
                        if (updatedPost) {
                            if (updatedPost.portal) {
                                io.to(`portal:${updatedPost.portal.toString()}`).emit('post:updated', updatedPost);
                            }
                            if (updatedPost.channel) {
                                io.to(`channel:${updatedPost.channel.toString()}`).emit('post:updated', updatedPost);
                            }
                            if (!updatedPost.portal) {
                                io.emit('global:post_updated', updatedPost);
                            }
                        }
                    } else if (change.operationType === 'delete') {
                        // Deletions are sent globally to ensure cleanup everywhere
                        io.emit('global:post_deleted', { _id: change.documentKey._id });
                    }
                } catch (err) {
                    console.error('Error populating Realtime Post:', err.message);
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
