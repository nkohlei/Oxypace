import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['post', 'user'],
        required: true
    },
    targetPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'harassment', 'hate_speech', 'violence', 'sexual_content', 'other']
    },
    details: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Report', reportSchema);
