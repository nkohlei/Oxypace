import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Portal from '../models/Portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function findPortal() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const portals = await Portal.find({ name: { $regex: 'Oxypace', $options: 'i' } });

    console.log('Found Portals:');
    portals.forEach((p) => {
        console.log(`Name: ${p.name}, ID: ${p._id}`);
    });

    process.exit(0);
}

findPortal();
