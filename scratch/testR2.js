import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function run() {
    try {
        console.log('Fetching objects from R2...');
        const response = await r2.send(new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME || 'oxypace',
            MaxKeys: 10,
        }));

        if (!response.Contents || response.Contents.length === 0) {
            console.log('No objects found in bucket.');
            return;
        }

        console.log('Found objects:');
        for (const obj of response.Contents) {
            console.log(`- ${obj.Key} (${obj.Size} bytes)`);
            const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${obj.Key}`;
            console.log(`  Public URL: ${publicUrl}`);
            
            try {
                const res = await axios.head(publicUrl);
                console.log(`  Public Access Status: ${res.status} (${res.headers['content-type']})`);
            } catch (err) {
                console.log(`  Public Access Failed: ${err.message}`);
            }
        }
    } catch (err) {
        console.error('Error running test:', err);
    }
}

run();
