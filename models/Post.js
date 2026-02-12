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
            enum: ['none', 'image', 'gif', 'video', 'youtube'],
            default: 'none',
        },
        media: {
            type: String, // URL to uploaded image/gif
            default: '',
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
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ portal: 1, channel: 1, createdAt: -1 }); // Optimized feed query
postSchema.index({ likes: 1 });
postSchema.index({ mentions: 1 });

export default mongoose.model('Post', postSchema);
