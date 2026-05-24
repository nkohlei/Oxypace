import mongoose from 'mongoose';

const BannedIPSchema = new mongoose.Schema(
    {
        ip: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        reason: {
            type: String,
            default: '',
        },
        bannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('BannedIP', BannedIPSchema);
