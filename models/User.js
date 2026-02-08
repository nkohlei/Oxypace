import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId; // Password required only if not Google OAuth
            },
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationBadge: {
            type: String,
            enum: ['blue', 'gold', 'platinum', 'special', 'staff', 'none'],
            default: 'none',
        },
        verificationRequest: {
            status: {
                type: String,
                enum: ['none', 'pending', 'approved', 'rejected'],
                default: 'none',
            },
            badgeType: {
                type: String,
                enum: ['blue', 'gold', 'platinum', 'special'],
                default: 'blue',
            },
            category: {
                type: String,
                enum: ['creator', 'business', 'government', 'partner'],
                default: 'creator',
            },
            requestedAt: {
                type: Date,
            },
        },
        verificationToken: {
            type: String,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        profile: {
            displayName: {
                type: String,
                default: function () {
                    return this.username;
                },
            },
            bio: {
                type: String,
                default: '',
                maxlength: 500,
            },
            avatar: {
                type: String,
                default: '',
            },
            coverImage: {
                type: String,
                default: '',
            },
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        followRequests: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        joinedPortals: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Portal',
            },
        ],
        followerCount: {
            type: Number,
            default: 0,
        },
        followingCount: {
            type: Number,
            default: 0,
        },
        postCount: {
            type: Number,
            default: 0,
        },
        savedPosts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Post',
            },
        ],
        hiddenPosts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Post',
            },
        ],
        settings: {
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                mentions: { type: Boolean, default: true },
                likes: { type: Boolean, default: false },
            },
            privacy: {
                isPrivate: { type: Boolean, default: false },
                portalVisibility: {
                    type: String,
                    enum: ['public', 'friends', 'private'],
                    default: 'public',
                },
            },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
