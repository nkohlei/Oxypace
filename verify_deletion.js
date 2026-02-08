import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Portal from './models/Portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Loading
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Fallback
    dotenv.config();
}

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        const portals = await Portal.find({});
        console.log(`Total Portals: ${portals.length}`);

        const testPortals = portals.filter((p) => /test/i.test(p.name));

        if (testPortals.length > 0) {
            console.log('Found "test" portals:');
            testPortals.forEach((p) => console.log(`- ${p.name} (ID: ${p._id})`));
        } else {
            console.log('No portals matching "test" found.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
