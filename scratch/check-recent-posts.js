import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from '../models/Post.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const latestVideos = await Post.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        console.log('--- LATEST VIDEO POSTS ---');
        latestVideos.forEach(post => {
            console.log({
                _id: post._id,
                content: post.content,
                media: post.media,
                isProcessing: post.isProcessing,
                processingProgress: post.processingProgress,
                estimatedTime: post.estimatedTime,
                transcodeError: post.transcodeError,
                videoQualities: post.videoQualities,
                video144: post.video144,
                video360: post.video360,
                video720: post.video720,
                video1080: post.video1080
            });
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
