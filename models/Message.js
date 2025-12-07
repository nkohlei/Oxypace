import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: false, // Content not required if there's media or sharedPost
        maxlength: 2000,
    },
    media: {
        type: String, // URL to uploaded image
    },
    sharedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
