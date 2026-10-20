import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Badge from '../models/Badge.js';
import { DEFAULT_BADGES } from '../routes/badges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/oxypace';
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // Remove deprecated/toy default badges if they exist
        const deprecatedSlugs = ['creator', 'science', 'hot'];
        const delRes = await Badge.deleteMany({ slug: { $in: deprecatedSlugs }, isDefault: true });
        console.log('Removed deprecated toy default badges:', delRes.deletedCount);

        let count = 0;
        for (const def of DEFAULT_BADGES) {
            await Badge.findOneAndUpdate(
                { slug: def.slug },
                { $set: { ...def, isDefault: true } },
                { upsert: true, new: true }
            );
            count++;
        }
        console.log(`Successfully synchronized ${count} top-tier corporate & verification badges.`);

        const all = await Badge.find().select('slug shape name isDefault');
        console.log('All DB Badges:');
        all.forEach(b => console.log(` - ${b.slug} (${b.shape}): ${b.name} [default: ${b.isDefault}]`));

        process.exit(0);
    } catch (e) {
        console.error('Error synchronizing badges:', e);
        process.exit(1);
    }
})();
