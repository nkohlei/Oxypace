import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { APP_VERSION_CONFIG } from '../config/appVersion.js';
import { sendSilentOtaPush } from '../services/pushService.js';

async function main() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI or MONGODB_URI environment variable is required.');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    try {
        const minNativeCode = Number(APP_VERSION_CONFIG.otaMinNativeVersionCode || APP_VERSION_CONFIG.versionCode || 262);
        const otaVersion = String(APP_VERSION_CONFIG.otaVersion || '');

        const users = await User.find({
            isDeleted: { $ne: true },
            appPlatform: 'android',
            versionCode: { $gte: minNativeCode },
            $or: [
                { fcmTokens: { $exists: true, $ne: [] } },
                { fcmToken: { $exists: true, $nin: ['', null] } },
            ],
        }).select('fcmTokens fcmToken').lean();

        const tokenSet = new Set();
        for (const u of users) {
            if (Array.isArray(u.fcmTokens)) {
                for (const t of u.fcmTokens) {
                    if (t && typeof t === 'string' && t.trim()) tokenSet.add(t.trim());
                }
            }
            if (u.fcmToken && typeof u.fcmToken === 'string' && u.fcmToken.trim()) {
                tokenSet.add(u.fcmToken.trim());
            }
        }

        const allTokens = Array.from(tokenSet);
        console.log(`📡 [Broadcast OTA] Found ${allTokens.length} unique token(s) for otaVersion=${otaVersion} (minNative=${minNativeCode})`);

        let successCount = 0;
        let failureCount = 0;
        for (let i = 0; i < allTokens.length; i += 500) {
            const batch = allTokens.slice(i, i + 500);
            const resp = await sendSilentOtaPush(batch, otaVersion);
            successCount += resp?.successCount || 0;
            failureCount += resp?.failureCount || 0;
        }

        console.log(`✅ [Broadcast OTA] Done. Success=${successCount}, Failure=${failureCount}`);
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((err) => {
    console.error('❌ [Broadcast OTA] Failed:', err);
    process.exit(1);
});
