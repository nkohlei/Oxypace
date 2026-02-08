import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Portal from '../models/Portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORTAL_ID = '69485e416ce2eac8943a5de2'; // Oxypace Global

async function findChannels() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);

    const portal = await Portal.findById(PORTAL_ID);
    if (!portal) {
        console.error('Portal not found!');
        process.exit(1);
    }

    console.log(`Channels for portal '${portal.name}':`);
    portal.channels.forEach((ch) => {
        console.log(`Name: ${ch.name}, ID: ${ch._id}`);
    });

    process.exit(0);
}

findChannels();
