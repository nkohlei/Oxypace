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
                themeColor: '#0284c7',
                isVerified: true,
                badges: ['official'],
                channels: [{ name: 'genel', type: 'text' }],
                status: 'active',
                isNSFW: false,
            });
        }

        const portalId = tanitimPortal._id;
        const targetChannel = tanitimPortal.channels?.[0]?._id?.toString() || 'general';

        // Ensure oxypace is member & admin
        await Portal.findByIdAndUpdate(portalId, {
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

        // 4. Seed Guide Posts if not already present
        const existingPostsCount = await Post.countDocuments({ portal: portalId });
        console.log(`ℹ️ [TanitimBoot] Current posts in Tanitim portal: ${existingPostsCount}`);

        const guidePosts = [
            {
                key: 'welcome',
                isPinned: true,
                content: `✨ Oxypace'e Hoş Geldiniz! 🚀\n\nOxypace; modern, özgür, hızlı ve güvenli bir topluluk deneyimi sunmak için tasarlandı.\n\n📱 Neler Yapabilirsiniz?\n• Kendi ilgi alanlarınıza özel Portallar oluşturabilir ve topluluklarınızı büyütebilirsiniz.\n• Metin, Sesli sohbet ve Sahne modlu Konferans odalarıyla arkadaşlarınızla canlı iletişim kurabilirsiniz.\n• 4K çözünürlüğe kadar yüksek kaliteli videolar, çoklu görseller ve PDF dokümanları paylaşabilirsiniz.\n• Hem Aydınlık Beyaz (Light) hem de Karanlık Siyah (OLED Dark) temalarla gözlerinizi yormayan tasarımı keşfedebilirsiniz.\n\nAşağıdaki rehber paylaşımlarını inceleyerek platformun tüm inceliklerini hemen öğrenebilirsiniz! 👇`,
            },
            {
                key: 'portals',
                isPinned: false,
                content: `🏰 Rehber: Portallar ve Kanallar Nasıl Kullanılır?\n\nOxypace'de her topluluk bir "Portal" olarak adlandırılır:\n\n1️⃣ Portal Keşfetme ve Katılma:\nSol menüdeki pusula simgesine veya arama çubuğuna tıklayarak açık veya gizli portalları keşfedebilir, tek dokunuşla katılabilirsiniz.\n\n2️⃣ Kendi Portalınızı Oluşturma:\nSol menüdeki (+) butonuna basarak kendi portalınızı saniyeler içinde oluşturabilirsiniz. Gizlilik ayarını Herkese Açık, Gizli veya Kısıtlı Erişim olarak seçebilirsiniz.\n\n3️⃣ Kanal Çeşitleri:\n💬 Metin Kanalları: Günlük sohbetler ve paylaşımlar için.\n🎙️ Ses Kanalları: Düşük gecikmeli, kristal netliğinde sesli iletişim.\n🎥 Sahne Konferans Kanalları: Seminerler, etkinlikler ve sunumlar için konuşmacı-dinleyici modlu odalar!`,
            },
            {
                key: 'media',
                isPinned: false,
                content: `📸 Rehber: Zengin Medya ve Gönderi Paylaşımı\n\nOxypace akışında fikirlerinizi dilediğiniz gibi özgürce ifade edin:\n\n🎬 Video Oynatıcı & Transcoding:\nYüklediğiniz videolar arka planda otomatik optimize edilir. 360p'den 4K'ya kadar bant genişliğinize en uygun kalitede izleyebilirsiniz.\n\n🖼️ Çoklu Görsel Paylaşımı:\nTek bir gönderide 10 adede kadar yüksek çözünürlüklü görsel yükleyebilir, modern galeri görünümünde sunabilirsiniz.\n\n📄 PDF & Doküman Desteği:\nKitap, makale, ders notu veya sunumlarınızı doğrudan PDF kartı olarak paylaşabilir; tek tıkla cihazınıza indirebilirsiniz.\n\n🔗 YouTube Entegrasyonu:\nYouTube bağlantılarını yapıştırdığınızda doğrudan gönderi içerisine hafif, hızlı oynatıcı yerleşir!`,
            },
            {
                key: 'security',
                isPinned: false,
                content: `🛡️ Rehber: Hesap Güvenliği ve Doğrulama Rozetleri\n\nGüvenliğiniz Oxypace için en birinci önceliktir:\n\n🔑 Güvenlik Soruları:\nAyarlar > Güvenlik menüsünden güvenlik sorularınızı tanımlayarak hesabınızı parola unutma durumlarına karşı koruyabilirsiniz.\n\n📲 Cihaz Yönetimi:\nHesabınıza giriş yapılan tüm cihazları ve IP geçmişini inceleyebilir, tanımadığınız oturumları tek tuşla sonlandırabilirsiniz.\n\n⭐ Onaylı Hesap (Mavi/Altın Rozet):\nProfil sayfanızdan veya Ayarlar sekmesinden doğrulama rozeti talebinde bulunarak toplulukta güvenilirliğinizi taçlandırabilirsiniz!`,
            },
        ];

        for (const gp of guidePosts) {
            const pattern = gp.key === 'welcome'
                ? 'Oxypace.*Hoş Geldiniz'
                : gp.key === 'portals'
                ? 'Portallar ve Kanallar'
                : gp.key === 'media'
                ? 'Zengin Medya'
                : 'Hesap Güvenliği';

            const existing = await Post.findOne({
                portal: portalId,
                content: { $regex: new RegExp(pattern, 'i') }
            });

            if (!existing) {
                await Post.create({
                    author: oxypaceUser._id,
                    portal: portalId,
                    channel: targetChannel,
                    content: gp.content,
                    isPinned: gp.isPinned,
                    pinnedAt: gp.isPinned ? new Date() : undefined,
                });
                console.log(`✅ [TanitimBoot] Seeded guide post: ${gp.key}`);
            }
        }

        // 5. Seed Featured Portal Showcases (+18 Strictly Excluded!)
        const featuredPortals = await Portal.find({
            _id: { $ne: portalId },
            isNSFW: { $ne: true }, // Filter +18 portals
            status: 'active',
            privacy: { $in: ['public', 'private'] }
        }).limit(6);

        for (const p of featuredPortals) {
            const existingPromo = await Post.findOne({
                portal: portalId,
                promotedPortal: p._id
            });

            if (!existingPromo) {
                const promoContent = `🌟 Öne Çıkan Topluluk: ${p.name}\n\n${p.description || 'Oxypace platformunun popüler ve aktif topluluklarından biri. Hemen aramıza katılın!'}\n\n👇 Aşağıdaki kart üzerinden tek tıkla katılabilir veya portalı inceleyebilirsiniz:`;

                await Post.create({
                    author: oxypaceUser._id,
                    portal: portalId,
                    channel: targetChannel,
                    content: promoContent,
                    promotedPortal: p._id,
                });
                console.log(`✅ [TanitimBoot] Seeded showcase post for portal: "${p.name}"`);
            }
        }

        console.log('🎉 [TanitimBoot] Oxypace Tanıtım check and seeding complete!');
    } catch (err) {
        console.error('⚠️ [TanitimBoot] Error in seedTanitimPortalOnBoot:', err.message);
    }
}
