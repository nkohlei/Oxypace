import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { transcodeVideoInBackground } from '../utils/videoTranscoder.js';

dotenv.config();

async function run() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected! Starting transcode with local dummy video...');
        
        // We pass the key as 'temp_media/dummy.mp4' so it bypasses R2 download in Step 1
        await transcodeVideoInBackground(
            '6a35bd3c2fc88e92969740c5',
            'temp_media/dummy.mp4'
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
