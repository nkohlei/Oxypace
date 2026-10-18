import mongoose from 'mongoose';

const customBadgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        url: {
            type: String,
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
        shape: {
            type: String,
            enum: ['round', 'rounded', 'none'],
            default: 'round',
        },
        borderStyle: {
            type: String,
            enum: ['thin', 'subtle', 'glow', 'none'],
            default: 'thin',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('CustomBadge', customBadgeSchema);
