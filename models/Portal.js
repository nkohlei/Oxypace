import mongoose from 'mongoose';

const portalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    privacy: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    avatar: {
        type: String, // URL to uploaded image
        default: ''
    },
    banner: {
        type: String,
        default: ''
    },
    themeColor: {
        type: String,
        default: '#3b82f6' // Default blue
    },
    channels: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String, // 'text', 'voice' etc.
            default: 'text'
        },
        isPrivate: {
            type: Boolean,
            default: false
        }
    }],
    joinRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for search performance
portalSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Portal', portalSchema);
