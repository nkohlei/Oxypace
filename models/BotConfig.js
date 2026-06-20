import mongoose from 'mongoose';

const BotConfigSchema = new mongoose.Schema({
    bot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    feeds: [{
        type: String,
        trim: true
    }],
    defaultPortal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portal',
        default: null
    },
    defaultChannel: {
        type: String,
        default: 'general'
    }
}, { timestamps: true });

export default mongoose.model('BotConfig', BotConfigSchema);
