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
        shape: {
            type: String,
            enum: ['rosette', 'rounded_square', 'circle', 'hexagon', 'shield', 'starburst', 'octagon', 'diamond', 'icon_only'],
            default: 'rosette',
        },
        icon: {
            type: String,
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
                enum: ['solid', 'gradient', 'iridescent', 'metallic', 'neon', 'cosmic', 'animated'],
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
            gradientAngle: {
                type: Number,
                default: 135,
            },
            metallicType: {
                type: String,
                enum: ['none', 'gold', 'silver', 'platinum', 'rose_gold', 'obsidian', 'bronze'],
                default: 'none',
            },
            innerIconColor: {
                type: String,
                default: '#ffffff',
            },
            animationType: {
                type: String,
                enum: ['none', 'pulse', 'glow', 'spin', 'shimmer', 'bounce', 'float'],
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

badgeSchema.index({ category: 1 });

export default mongoose.model('Badge', badgeSchema);
