import mongoose from 'mongoose';

const chatPreferenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mutedUntil: {
            type: Date,
            default: null,
        },
        isFavorite: {
            type: Boolean,
            default: false,
        },
        theme: {
            type: String,
            default: 'default',
            maxlength: 32,
        },
        disappearingSeconds: {
            type: Number,
            default: 0,
            min: 0,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        clearedAt: {
            type: Date,
            default: null,
        },
        hiddenAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

chatPreferenceSchema.index({ user: 1, partner: 1 }, { unique: true });

const ChatPreference = mongoose.model('ChatPreference', chatPreferenceSchema);

export default ChatPreference;
