import mongoose from 'mongoose';

const botHistorySchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
        unique: true
    },
    botName: {
        type: String,
        required: true
    },
    postedAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Auto-delete after 30 days to keep DB clean
    }
});

export default mongoose.model('BotHistory', botHistorySchema);
