import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Portal from './models/Portal.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const listPortals = async () => {
    try {
        console.log('Mongo URI:', process.env.MONGO_URI ? 'Defined' : 'UNDEFINED');
        if (!process.env.MONGO_URI) {
            // Fallback attempt manually reading .env if needed, but usually config() works.
            // Let's assume usage of node -r dotenv/config if this fails.
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected. Listing Portals:');

        const portals = await Portal.find({});
        portals.forEach((p) => {
            console.log(`- "${p.name}" (ID: ${p._id}) | Members: ${p.members.length}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listPortals();
