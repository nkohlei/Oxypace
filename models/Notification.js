import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: [
                'like',
                'comment',
                'reply',
                'follow',
                'follow_request',
                'system',
                'portal_invite',
                'message',
                'friend_connected',
            ],
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
        portal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Portal',
        },
        read: {
            type: Boolean,
            default: false,
        },
        content: {
            type: String,
        },
        link: {
            type: String, // Optional direct link
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Notification', notificationSchema);
