import 'dotenv/config';
import { S3Client, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import path from 'path';

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const Bucket = process.env.R2_BUCKET_NAME || 'oxypace';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

async function exists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
        return true;
    } catch (_) {
        return false;
    }
}

async function processAvatar(key) {
    const ext = path.extname(key).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return;
    if (key.includes('-thumbnail') || key.includes('-medium') || key.includes('-lowres')) return;

    const baseWithoutExt = key.substring(0, key.lastIndexOf('.'));
    const thumbKey = `${baseWithoutExt}-thumbnail.webp`;
    const medKey = `${baseWithoutExt}-medium.webp`;

    const hasThumb = await exists(thumbKey);
    const hasMed = await exists(medKey);

    if (hasThumb && hasMed) {
        return;
    }

    console.log(`Processing avatar: ${key} (needs: ${!hasThumb ? 'thumb ' : ''}${!hasMed ? 'med' : ''})`);

    try {
        const getResp = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
        const originalBuf = await streamToBuffer(getResp.Body);

        if (!hasThumb) {
            const thumbBuf = await sharp(originalBuf, { failOnError: false, animated: false })
                .resize(100, 100, { fit: 'cover', withoutEnlargement: false })
                .webp({ quality: 75, effort: 3 })
                .toBuffer();

            await s3.send(new PutObjectCommand({
                Bucket,
                Key: thumbKey,
                Body: thumbBuf,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000, immutable'
            }));
            console.log(`  -> Created ${thumbKey} (${(thumbBuf.length / 1024).toFixed(1)} KB)`);
        }

        if (!hasMed) {
            const medBuf = await sharp(originalBuf, { failOnError: false, animated: false })
                .resize(320, 320, { fit: 'cover', withoutEnlargement: false })
                .webp({ quality: 80, effort: 3 })
                .toBuffer();

            await s3.send(new PutObjectCommand({
                Bucket,
                Key: medKey,
                Body: medBuf,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000, immutable'
            }));
            console.log(`  -> Created ${medKey} (${(medBuf.length / 1024).toFixed(1)} KB)`);
        }
    } catch (err) {
        console.error(`  x Failed to process ${key}:`, err.message);
    }
}

async function processBanner(key) {
    const ext = path.extname(key).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return;
    if (key.includes('-thumbnail') || key.includes('-medium') || key.includes('-lowres')) return;

    const baseWithoutExt = key.substring(0, key.lastIndexOf('.'));
    const medKey = `${baseWithoutExt}-medium.webp`;

    if (await exists(medKey)) return;

    console.log(`Processing banner: ${key}`);
    try {
        const getResp = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
        const originalBuf = await streamToBuffer(getResp.Body);

        const medBuf = await sharp(originalBuf, { failOnError: false, animated: false })
            .resize(640, 360, { fit: 'cover', withoutEnlargement: false })
            .webp({ quality: 80, effort: 3 })
            .toBuffer();

        await s3.send(new PutObjectCommand({
            Bucket,
            Key: medKey,
            Body: medBuf,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable'
        }));
        console.log(`  -> Created ${medKey} (${(medBuf.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
        console.error(`  x Failed to process banner ${key}:`, err.message);
    }
}

async function run() {
    console.log('Listing all avatars and banners from R2...');
    const allKeys = [];
    let token;
    do {
        const resp = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken: token, MaxKeys: 1000 }));
        for (const o of resp.Contents || []) {
            if (o.Key.startsWith('avatars/') || o.Key.startsWith('banners/') || o.Key.startsWith('portals/')) {
                allKeys.push(o.Key);
            }
        }
        token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (token);

    console.log(`Found ${allKeys.length} items in avatars/banners/portals.`);

    const avatars = allKeys.filter(k => k.startsWith('avatars/') || k.startsWith('portals/'));
    const banners = allKeys.filter(k => k.startsWith('banners/'));

    console.log(`Starting avatar backfill (${avatars.length} candidates)...`);
    for (const key of avatars) {
        await processAvatar(key);
    }

    console.log(`Starting banner backfill (${banners.length} candidates)...`);
    for (const key of banners) {
        await processBanner(key);
    }

    console.log('Backfill complete!');
}

run().catch(console.error);
