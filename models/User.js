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
        fcmToken: {
            type: String,
            default: null,
        },
        isSystemAccount: {
            type: Boolean,
            default: false,
        },
        isBot: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationBadge: {
            type: String,
            default: 'none',
        },
        customBadge: {
            url: {
                type: String,
                default: '',
            },
            name: {
                type: String,
                default: '',
            },
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
            lowResAvatar: {
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
                comments: { type: Boolean, default: true },
                friendRequests: { type: Boolean, default: true },
                system: { type: Boolean, default: true },
            },
            privacy: {
                isPrivate: { type: Boolean, default: false },
                portalVisibility: {
                    type: String,
                    enum: ['public', 'friends', 'private'],
                    default: 'public',
                },
                showOnlineStatus: { type: Boolean, default: true },
                dmSettings: {
                    type: String,
                    enum: ['everyone', 'friends', 'none'],
                    default: 'everyone',
                },
                searchVisibility: { type: Boolean, default: true },
                readReceipts: { type: Boolean, default: true },
            },
            video: {
                playbackQuality: {
                    type: String,
                    enum: ['auto', 'performance', 'saver', 'lowest'],
                    default: 'auto',
                },
                downloadQuality: {
                    type: String,
                    enum: ['ask', '1080', '720', '360'],
                    default: 'ask',
                }
            }
        },
        lastActive: {
            type: Date,
        },
        fcmTokens: [
            {
                type: String,
            },
        ],
        portalNotificationSettings: [
            {
                portal: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Portal',
                },
                mutedChannels: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                    }
                ],
                isAllMuted: {
                    type: Boolean,
                    default: false,
                }
            }
        ],
        isBanned: {
            type: Boolean,
            default: false,
        },
        banReason: {
            type: String,
            default: '',
        },
        banExpiresAt: {
            type: Date,
            default: null,
        },
        isShadowbanned: {
            type: Boolean,
            default: false,
        },
        lastIP: {
            type: String,
            default: '',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletionReason: {
            type: String,
            default: '',
        },
        recoveryStatus: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none',
        },
        recoveryReason: {
            type: String,
            default: '',
        },
        recoveryAttempts: {
            type: Number,
            default: 0,
        },
        securityAnswers: [
            {
                question: String,
                answer: String,
            }
        ],
        isTouristAdmin: {
            type: Boolean,
            default: false,
        },
        touristAdminExpiresAt: {
            type: Date,
            default: null,
        },
        assignedBy: {
            type: String,
            default: '',
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
