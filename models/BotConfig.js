import mongoose from 'mongoose';

const BotConfigSchema = new mongoose.Schema({
    bot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    feeds: [{
        type: String,
        trim: true
    }],
    defaultPortal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portal',
        default: null,
        index: true
    },
    defaultChannel: {
        type: String,
        default: 'general'
    },
    intervalMinutes: {
        type: Number,
        default: 15
    },
    isActive: {
        type: Boolean,
        default: true
    },
    autoTranslate: {
        type: Boolean,
        default: true
    },
    postPrefix: {
        type: String,
        default: '📢'
    },
    includeSourceLink: {
        type: Boolean,
        default: true
    },
    keywords: [{
        type: String,
        trim: true
    }],
    stats: {
        totalPosts: {
            type: Number,
            default: 0
        },
        lastRunAt: {
            type: Date,
            default: null
        },
        lastSuccessAt: {
            type: Date,
            default: null
        },
        lastPostTitle: {
            type: String,
            default: ''
        },
        lastPostUrl: {
            type: String,
            default: ''
        },
        lastError: {
            type: String,
            default: ''
        }
    }
}, { timestamps: true });

export default mongoose.model('BotConfig', BotConfigSchema);
