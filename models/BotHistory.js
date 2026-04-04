import mongoose from 'mongoose';

const botHistorySchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
    },
    botName: {
        type: String,
        required: true,
    },
    postedAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days to keep DB clean
    },
});

// Compound index to ensure uniqueness per bot, but allow shared news across bots
botHistorySchema.index({ guid: 1, botName: 1 }, { unique: true });

export default mongoose.model('BotHistory', botHistorySchema);
