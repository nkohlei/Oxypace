import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { transcodeVideoInBackground } from '../utils/videoTranscoder.js';

dotenv.config();

async function run() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected! Starting transcode...');
        
        await transcodeVideoInBackground(
            '6a35bba84be82c034ba5d261',
            'posts/698f48ca55ed38a478568561/post-1781906334763-441942657.mp4'
        );
        
        console.log('Transcode function completed execution.');
    } catch (err) {
        console.error('Fatal transcode error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

run();
