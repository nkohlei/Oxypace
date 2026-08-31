import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const FFMPEG_RAM_SAFE_FLAGS = [
    '-threads', '1',
    '-preset', 'ultrafast',
    '-tune', 'fastdecode',
    '-pix_fmt', 'yuv420p'
];

async function run() {
    const localInputPath = path.join(process.cwd(), 'temp_media', 'generated-test.mp4');
    fs.mkdirSync(path.dirname(localInputPath), { recursive: true });

    console.log('Generating 3-second test video with FFmpeg...');
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input('color=c=blue:s=1280x720:d=3')
            .inputFormat('lavfi')
            .output(localInputPath)
            .videoCodec('libx264')
            .outputOptions(['-pix_fmt yuv420p', '-t 3'])
            .on('end', () => {
                console.log('Test video generated at:', localInputPath);
                resolve();
            })
            .on('error', (err) => {
                console.error('Video generation error:', err);
                reject(err);
            })
            .run();
    });

    const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(localInputPath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });

    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const srcHeight = videoStream ? parseInt(videoStream.height, 10) : 0;
    console.log('Sample video height:', srcHeight);

    const tempOut = path.join(process.cwd(), 'temp_media', 'test-360p.mp4');
    
    console.log('Running transcode to 360p...');
    ffmpeg(localInputPath)
        .videoCodec('libx264')
        .outputOptions([
            ...FFMPEG_RAM_SAFE_FLAGS,
            '-vf scale=-2:360',
            '-b:v 400k',
            '-maxrate 450k',
            '-bufsize 800k',
            '-c:a aac'
        ])
        .output(tempOut)
        .on('start', (cmd) => {
            console.log('FFmpeg started:', cmd);
        })
        .on('progress', (progress) => {
            console.log(`Progress: ${progress.percent}%`);
        })
        .on('end', () => {
            console.log('✅ Transcode successful!');
            fs.unlinkSync(localInputPath);
            fs.unlinkSync(tempOut);
        })
        .on('error', (err) => {
            console.error('❌ Transcode failed:', err.message);
        })
        .run();
}

run().catch(console.error);
