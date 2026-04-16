import 'dotenv/config';
import mongoose from 'mongoose';
import Portal from './models/Portal.js';

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    const portals = await Portal.find().select('name avatar banner');
    console.log(JSON.stringify(portals, null, 2));
    process.exit(0);
}
check();
