import r2 from './config/r2.js';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Create a dummy file for testing
const testFileName = 'test-upload-' + Date.now() + '.txt';
fs.writeFileSync(testFileName, 'This is a test upload content.');

const run = async () => {
    console.log('--- STARTING LOCAL R2 UPLOAD TEST ---');
    console.log('Bucket:', process.env.R2_BUCKET_NAME || 'oxypace');
    console.log('Endpoint:', process.env.R2_ENDPOINT);
    console.log('Access Key ID:', process.env.R2_ACCESS_KEY_ID ? '***' : 'MISSING');

    try {
        const fileStream = fs.createReadStream(testFileName);

        const upload = new Upload({
            client: r2,
            params: {
                Bucket: process.env.R2_BUCKET_NAME || 'oxypace',
                Key: `debug/${testFileName}`,
                Body: fileStream,
                ContentType: 'text/plain',
                ACL: 'public-read',
            },
        });

        console.log('Uploading...');
        upload.on('httpUploadProgress', (progress) => {
            console.log(progress);
        });

        const result = await upload.done();
        console.log('✅ UPLOAD SUCCESS!');
        console.log('Location:', result.Location);
    } catch (error) {
        console.error('❌ UPLOAD FAILED:', error);
    } finally {
        // Cleanup
        if (fs.existsSync(testFileName)) {
            fs.unlinkSync(testFileName);
        }
    }
};

run();
