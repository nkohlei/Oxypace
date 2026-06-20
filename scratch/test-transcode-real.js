import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Post from '../models/Post.js';
import { transcodeVideoInBackground } from '../utils/videoTranscoder.js';

dotenv.config();

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected! Running transcode for latest post video...');
        
        console.log('Querying latest video post...');
        const p = await Post.findOne({ mediaType: 'video' }).sort({ createdAt: -1 });
        console.log('Post found in test script:', p ? p._id : 'none');
        if (!p) {
            console.log('No video posts to test.');
            return;
        }
        
        // Extract media key from the URL
        const mediaUrl = p.media || p.videoUrl;
        console.log('Original media URL:', mediaUrl);
        const urlObj = new URL(mediaUrl);
        let key = urlObj.pathname.substring(1); // remove leading slash
        console.log('Extracted key:', key);

        await transcodeVideoInBackground(
            p._id.toString(),
            key
        );
        console.log('Finished transcode run.');
    } catch (err) {
        console.error('Fatal test error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
