
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const restoreUser = async () => {
    try {
        const email = process.argv[2];
        if (!email) {
            console.log('Usage: node restoreUser.js <email>');
            process.exit(1);
        }

        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found.');
            process.exit(1);
        }

        user.isVerified = true;
        await user.save();

        console.log(`User ${user.username} (${user.email}) restored. isVerified = true`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

restoreUser();
