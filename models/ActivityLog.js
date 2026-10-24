import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    username: {
        type: String,
        default: '',
        index: true,
    },
    action: {
        type: String,
        required: true,
        index: true,
    }, // LOGIN, LOGOUT, REGISTER, POST_CREATE, POST_DELETE, PORTAL_CREATE, PORTAL_UPDATE, PORTAL_JOIN, COMMENT_CREATE, PROFILE_UPDATE, BAN_USER, UNBAN_USER, SHADOWBAN_USER, TOURIST_ADMIN_ASSIGN, BOT_POST, etc.
    category: {
        type: String,
        default: 'general',
        index: true,
    }, // 'auth', 'content', 'portal', 'security', 'admin', 'bot'
    ip: {
        type: String,
        default: '',
        index: true,
    },
    userAgent: {
        type: String,
        default: '',
    },
    device: {
        os: { type: String, default: 'Bilinmiyor' },
        browser: { type: String, default: 'Bilinmiyor' },
        deviceType: { type: String, default: 'Masaüstü' },
    },
    targetId: {
        type: String,
        default: '',
    },
    targetType: {
        type: String,
        default: '',
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true
});

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', ActivityLogSchema);
