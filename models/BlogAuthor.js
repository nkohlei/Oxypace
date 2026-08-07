import mongoose from 'mongoose';

const blogAuthorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            sparse: true,
            index: true,
        },
        isOfficial: {
            type: Boolean,
            default: false,
            index: true,
        },
        name: {
            type: String,
            default: 'Oxypace',
            trim: true,
        },
        title: {
            type: String,
            default: 'Oxypace Kurucusu & Baş Yazarı',
            trim: true,
        },
        bio: {
            type: String,
            default: 'Teorik fizik, ekstrem doğa olayları, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor.',
            trim: true,
        },
        avatar: {
            type: String,
            default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        },
        badge: {
            type: String,
            default: 'Baş Yazar',
            trim: true,
        },
        github: {
            type: String,
            default: '',
            trim: true,
        },
        twitter: {
            type: String,
            default: '',
            trim: true,
        },
        website: {
            type: String,
            default: '',
            trim: true,
        },
        linkedin: {
            type: String,
            default: '',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('BlogAuthor', blogAuthorSchema);
