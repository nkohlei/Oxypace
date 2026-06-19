import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        portal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Portal',
        },
        channel: {
            type: String, // 'general' or Channel ObjectId
            default: 'general',
        },
        content: {
            type: String,
            maxlength: 5000,
        },
        mediaType: {
            type: String,
            enum: ['none', 'image', 'gif', 'video', 'youtube', 'pdf'],
            default: 'none',
        },
        media: {
            type: String, // URL to uploaded image/gif
            default: '',
        },
        pdfUrl: {
            type: String,
            default: '',
        },
        pdfThumbnailUrl: {
            type: String,
            default: '',
        },
        pdfName: {
            type: String,
            default: '',
        },
        pdfSize: {
            type: Number,
            default: 0,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        likeCount: {
            type: Number,
            default: 0,
        },
        commentCount: {
            type: Number,
            default: 0,
        },
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedAt: {
            type: Date,
        },
        quotedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
        videoQualities: {
            high: { type: String, default: '' },
            low: { type: String, default: '' },
            p360: { type: String, default: '' },
            p720: { type: String, default: '' },
            p1080: { type: String, default: '' }
        },
        videoUrl: {
            type: String,
            default: '',
        },
        lowVideoUrl: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Cleanup associated notifications when post is deleted
postSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        await mongoose.model('Notification').deleteMany({ post: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ portal: 1, createdAt: -1 });
postSchema.index({ portal: 1, author: 1, createdAt: -1 });
postSchema.index({ portal: 1, channel: 1, createdAt: -1 }); // Optimized feed query
postSchema.index({ likes: 1 });
postSchema.index({ mentions: 1 });

export default mongoose.model('Post', postSchema);
