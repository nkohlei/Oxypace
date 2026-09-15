import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Post from '../models/Post.js';

/**
 * Automatically executed on backend startup (server.js boot)
 * Ensures:
 * 1. @oxypace official user exists and is configured.
 * 2. "Oxypace Tanıtım" portal exists and is active.
 * 3. All users who currently have 0 portals are enrolled into "Oxypace Tanıtım".
 * 4. Rich onboarding guide posts and featured portal showcases (+18 excluded)
 *    are posted under @oxypace into "Oxypace Tanıtım".
 */
export async function seedTanitimPortalOnBoot() {
    try {
        console.log('🚀 [TanitimBoot] Checking Oxypace Tanıtım portal and guides...');

        // 1. Find or verify @oxypace
        let oxypaceUser = await User.findOne({ username: { $regex: /^oxypace$/i } });
        if (!oxypaceUser) {
            console.log('⚠️ [TanitimBoot] @oxypace user not found, checking admin user...');
            oxypaceUser = await User.findOne({ isAdmin: true });
        }

        if (!oxypaceUser) {
            console.log('⚠️ [TanitimBoot] No admin user found to author Tanitim posts.');
            return;
        }

        // 2. Find or verify "Oxypace Tanıtım" Portal
        let tanitimPortal = await Portal.findOne({
            name: { $regex: /^Oxypace Tan[ıi]t[ıi]m$/i }
        });

        if (!tanitimPortal) {
            console.log('➕ [TanitimBoot] Creating "Oxypace Tanıtım" portal...');
            tanitimPortal = await Portal.create({
                name: 'Oxypace Tanıtım',
                description: 'Oxypace resmi başlangıç ve tanıtım portalı. Platform kullanım rehberleri, duyurular ve öne çıkan topluluklar.',
                owner: oxypaceUser._id,
                admins: [oxypaceUser._id],
                members: [oxypaceUser._id],
                privacy: 'public',
                themeColor: '#111111',
                isVerified: true,
                badges: ['official'],
                channels: [{ name: 'genel', type: 'text' }],
                status: 'active',
                isNSFW: false,
            });
        }

        const portalId = tanitimPortal._id;
        const targetChannel = tanitimPortal.channels?.[0]?._id?.toString() || 'general';

        // Ensure oxypace is member & admin, themeColor is dark monochrome (no blue!)
        await Portal.findByIdAndUpdate(portalId, {
            $set: { themeColor: '#111111' },
            $addToSet: { members: oxypaceUser._id, admins: oxypaceUser._id }
        });
        await User.findByIdAndUpdate(oxypaceUser._id, {
            $addToSet: { joinedPortals: portalId }
        });

        // 3. Auto-enroll all users who currently have 0 portals
        const usersWithoutPortals = await User.find({
            $or: [
                { joinedPortals: { $exists: false } },
                { joinedPortals: { $size: 0 } },
                { joinedPortals: null }
            ],
            isDeleted: { $ne: true }
        }).select('_id username');

        if (usersWithoutPortals.length > 0) {
            const userIds = usersWithoutPortals.map(u => u._id);
            console.log(`📊 [TanitimBoot] Enrolling ${userIds.length} users without portals into "Oxypace Tanıtım"...`);

            await User.updateMany(
                { _id: { $in: userIds } },
                { $addToSet: { joinedPortals: portalId } }
            );

            await Portal.findByIdAndUpdate(portalId, {
                $addToSet: { members: { $each: userIds } }
            });
            console.log(`✅ [TanitimBoot] Successfully enrolled ${userIds.length} users.`);
        }

        // 4. Wipe all legacy & duplicate posts in Oxypace Tanıtım
        await Post.deleteMany({ portal: portalId });
        console.log('🧹 [TanitimBoot] Wiped all legacy posts in Oxypace Tanıtım');

        // 5. Seed exactly ONE clean, detailed, cool guide post (no emojis, no blue references)
        const singleGuideContent = `OXISPACE CORE DIRECTIVE // PLATFORM REHBERİ

Oxypace; modern, özgür, yüksek performanslı ve gizlilik odaklı yeni nesil bir iletişim altyapısıdır.

[01 // TOPLULUK & PORTAL MİMARİSİ]
İlgi alanlarınıza özel izole portallar kurun. Herkese Açık, Gizli veya Kısıtlı Erişim protokolleriyle alanınızın gizliliğini tam denetim altında tutun.

[02 // SES, SAHNE & İLETİŞİM ALTYAPISI]
Kesintisiz metin kanalları, düşük gecikmeli ses odaları ve seminer/etkinlikler için tasarlanmış sahne konferans altyapısıyla canlı etkileşime geçin.

[03 // ULTRA-HD MEDYA & DOKÜMAN MOTORU]
4K çözünürlüğe kadar otomatik video transcoding ve akıllı oynatıcı. 10 adede kadar yüksek kaliteli görsel galerisi. Doğrudan önizlenebilir ve indirilebilir PDF doküman desteği.

[04 // KRİPTO-GÜVENLİK & VERİ İZOLASYONU]
Sıfır veri madenciliği. Cihaz oturum denetimi ve yetkisiz erişim blokajı. Resmi doğrulama ve onay rozetleri.`;

        await Post.create({
            author: oxypaceUser._id,
            portal: portalId,
            channel: targetChannel,
            content: singleGuideContent,
            isPinned: true,
            pinnedAt: new Date(),
        });
        console.log('✅ [TanitimBoot] Seeded single clean guide post in Oxypace Tanıtım');

        console.log('🏁 [TanitimBoot] Oxypace Tanıtım check and setup complete!');
    } catch (err) {
        console.error('⚠️ [TanitimBoot] Error in seedTanitimPortalOnBoot:', err.message);
    }
}
