import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        excerpt: {
            type: String,
            default: '',
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            default: 'Teorik Fizik',
            trim: true,
        },
        readTime: {
            type: String,
            default: '5 dk okuma',
        },
        date: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: '',
        },
        isPublished: {
            type: Boolean,
            default: true,
            index: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        authorProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BlogAuthor',
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Slugify helper
blogPostSchema.statics.generateSlug = function (title) {
    return title
        .toString()
        .toLowerCase()
        .trim()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

export default mongoose.model('BlogPost', blogPostSchema);
