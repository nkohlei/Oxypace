import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        icon: {
            type: String,
            enum: ['checkmark', 'star', 'shield', 'lightning', 'diamond', 'crown', 'fire', 'heart', 'rocket', 'globe', 'sparkle', 'music', 'award', 'gem'],
            default: 'checkmark',
        },
        category: {
            type: String,
            enum: ['user', 'portal', 'both'],
            default: 'both',
        },
        style: {
            type: {
                type: String,
                enum: ['solid', 'gradient', 'iridescent', 'animated'],
                default: 'solid',
            },
            primaryColor: {
                type: String,
                default: '#1d9bf0',
            },
            secondaryColor: {
                type: String,
                default: '',
            },
            animationType: {
                type: String,
                enum: ['none', 'pulse', 'glow', 'spin', 'shimmer', 'bounce'],
                default: 'none',
            },
            glowColor: {
                type: String,
                default: '',
            },
            borderStyle: {
                type: String,
                enum: ['none', 'solid', 'glow'],
                default: 'none',
            },
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

badgeSchema.index({ slug: 1 });
badgeSchema.index({ category: 1 });

export default mongoose.model('Badge', badgeSchema);
