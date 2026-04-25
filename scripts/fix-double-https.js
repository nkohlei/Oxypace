import mongoose from 'mongoose';
import dotenv from 'dotenv';
const PostSchema = new mongoose.Schema({ media: String }, { strict: false });
const UserSchema = new mongoose.Schema({ profile: { avatar: String, coverImage: String } }, { strict: false });
const PortalSchema = new mongoose.Schema({ avatar: String, banner: String }, { strict: false });

dotenv.config();

async function fixDoubleHttps() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Post = mongoose.model('Post', PostSchema);
        const User = mongoose.model('User', UserSchema);
        const Portal = mongoose.model('Portal', PortalSchema);

        console.log('🛠️ Fixing double https:// prefix in database...');

        const fixPath = (path) => {
            if (!path) return path;
            // Fix encoded double https (https%3A%2F%2Fhttps%3A%2F%2F)
            return path.replace(/https%3A%2F%2Fhttps%3A%2F%2F/g, 'https%3A%2F%2F');
        };

        // Update Posts
        const posts = await Post.find({ media: { $regex: /https%3A%2F%2Fhttps%3A%2F%2F/ } });
        for (const post of posts) {
            post.media = fixPath(post.media);
            await post.save();
        }
        console.log(`✅ Fixed ${posts.length} posts`);

        // Update Users
        const users = await User.find({ $or: [{ 'profile.avatar': { $regex: /https%3A%2F%2Fhttps%3A%2F%2F/ } }, { 'profile.coverImage': { $regex: /https%3A%2F%2Fhttps%3A%2F%2F/ } }] });
        for (const user of users) {
            if (user.profile?.avatar) user.profile.avatar = fixPath(user.profile.avatar);
            if (user.profile?.coverImage) user.profile.coverImage = fixPath(user.profile.coverImage);
            await user.save();
        }
        console.log(`✅ Fixed ${users.length} users`);

        // Update Portals
        const portals = await Portal.find({ $or: [{ avatar: { $regex: /https%3A%2F%2Fhttps%3A%2F%2F/ } }, { banner: { $regex: /https%3A%2F%2Fhttps%3A%2F%2F/ } }] });
        for (const portal of portals) {
            if (portal.avatar) portal.avatar = fixPath(portal.avatar);
            if (portal.banner) portal.banner = fixPath(portal.banner);
            await portal.save();
        }
        console.log(`✅ Fixed ${portals.length} portals`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixDoubleHttps();
