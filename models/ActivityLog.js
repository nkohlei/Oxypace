import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
    // Actor / Performer
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    username: {
        type: String,
        default: '',
        index: true,
    },
    actorRole: {
        type: String,
        default: 'user', // 'admin', 'tourist_admin', 'portal_owner', 'portal_admin', 'user', 'system', 'bot'
    },

    // Action Code & Enterprise Category
    action: {
        type: String,
        required: true,
        index: true,
    },
    // Categories:
    // 1. 'auth'    : Kullanıcı ve Kimlik Doğrulama Kayıtları (Auth & Profile Logs)
    // 2. 'portal'  : Portal ve Kanal Yönetim Kayıtları (Portal & Channel Audit Logs)
    // 3. 'rtc'     : Canlı Oda, Ses/Görüntü ve Watch Party Kayıtları (Real-Time & RTC Logs)
    // 4. 'storage' : Medya, Dosya ve Gizli Depo Kayıtları (Storage & Media Logs)
    // 5. 'bot'     : Otomasyon, Bot ve Entegrasyon Kayıtları (Bot & Webhook Logs)
    // 6. 'content' : İçerik Etkileşim ve Mesajlaşma Kayıtları (Content & Messaging Events)
    // 7. 'system'  : Sistem, Altyapı ve Güvenlik Duvarı Kayıtları (System & Telemetry Logs)
    category: {
        type: String,
        enum: ['auth', 'portal', 'rtc', 'storage', 'bot', 'content', 'system', 'general'],
        default: 'general',
        index: true,
    },

    // Severity / Risk Level
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical', 'security'],
        default: 'info',
        index: true,
    },

    // Portal Context (for Portal Owner Audit Logs)
    portal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portal',
        default: null,
        index: true,
    },
    portalName: {
        type: String,
        default: '',
        index: true,
    },
    channel: {
        type: String,
        default: '',
    },

    // Target (User, Portal, Channel, Post, File, Bot, Room, etc.)
    targetId: {
        type: String,
        default: '',
        index: true,
    },
    targetType: {
        type: String,
        default: '', // 'user', 'portal', 'channel', 'post', 'file', 'bot', 'room', 'system'
        index: true,
    },
    targetName: {
        type: String,
        default: '',
    },

    // Network & Device Footprints
    ip: {
        type: String,
        default: '',
        index: true,
    },
    country: {
        type: String,
        default: '', // e.g. 'TR', 'DE', 'US'
    },
    city: {
        type: String,
        default: '', // e.g. 'Istanbul', 'Ankara'
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

    // Dynamic Event Details (Payload, Old vs New values, Telemetry, Metadata)
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true
});

// Compound & High-Performance Search Indexes
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ severity: 1, createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ portal: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ ip: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', ActivityLogSchema);
