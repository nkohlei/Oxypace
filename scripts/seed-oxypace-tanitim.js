import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import Post from '../models/Post.js';

async function main() {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/globalmessage2';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Find or Create @oxypace User
    console.log('🔍 Checking @oxypace official admin account...');
    let oxypaceUser = await User.findOne({ username: { $regex: /^oxypace$/i } });

    if (!oxypaceUser) {
        console.log('➕ Creating @oxypace official account...');
        const hashedPassword = await bcrypt.hash('Oxypace2026!Admin', 10);
        oxypaceUser = await User.create({
            username: 'oxypace',
            email: 'admin@oxypace.com',
            password: hashedPassword,
            isAdmin: true,
            isVerified: true,
            verificationBadge: 'gold',
            profile: {
                displayName: 'Oxypace Resmi',
                bio: 'Oxypace platformunun resmi tanıtım ve duyuru kanalı.',
            },
        });
        console.log(`✅ @oxypace created with ID: ${oxypaceUser._id}`);
    } else {
        if (!oxypaceUser.isAdmin || oxypaceUser.verificationBadge === 'none') {
            oxypaceUser.isAdmin = true;
            oxypaceUser.isVerified = true;
            if (oxypaceUser.verificationBadge === 'none') oxypaceUser.verificationBadge = 'gold';
            await oxypaceUser.save();
        }
        console.log(`✅ @oxypace account verified (ID: ${oxypaceUser._id})`);
    }

    // 2. Find or Create "Oxypace Tanıtım" Portal
    console.log('🔍 Checking "Oxypace Tanıtım" portal...');
    let tanitimPortal = await Portal.findOne({
        name: { $regex: /^Oxypace Tan[ıi]t[ıi]m$/i }
    });

    if (!tanitimPortal) {
        console.log('➕ Creating "Oxypace Tanıtım" portal...');
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
            channels: [
                { name: 'genel', type: 'text' }
            ],
            status: 'active',
            isNSFW: false,
        });
        console.log(`✅ Portal created with ID: ${tanitimPortal._id}`);
    } else {
        let updated = false;
        if (!tanitimPortal.admins.some(a => a.toString() === oxypaceUser._id.toString())) {
            tanitimPortal.admins.push(oxypaceUser._id);
            updated = true;
        }
        if (!tanitimPortal.members.some(m => m.toString() === oxypaceUser._id.toString())) {
            tanitimPortal.members.push(oxypaceUser._id);
            updated = true;
        }
        if (tanitimPortal.isNSFW) {
            tanitimPortal.isNSFW = false;
            updated = true;
        }
        if (updated) await tanitimPortal.save();
        console.log(`✅ "Oxypace Tanıtım" portal verified (ID: ${tanitimPortal._id})`);
    }

    // Ensure @oxypace has this portal in joinedPortals
    await User.findByIdAndUpdate(oxypaceUser._id, {
        $addToSet: { joinedPortals: tanitimPortal._id }
    });

    // 3. Batch Auto-enroll All Existing Users who have 0 portals or are not members
    console.log('🔄 Enrolling existing users with 0 portals into "Oxypace Tanıtım"...');
    const usersWithoutPortals = await User.find({
        $or: [
            { joinedPortals: { $exists: false } },
            { joinedPortals: { $size: 0 } }
        ]
    }).select('_id username joinedPortals');

    console.log(`📊 Found ${usersWithoutPortals.length} users with 0 portals.`);

    let enrolledCount = 0;
    const userIdsToEnroll = [];

    for (const u of usersWithoutPortals) {
        userIdsToEnroll.push(u._id);
    }

    if (userIdsToEnroll.length > 0) {
        await User.updateMany(
            { _id: { $in: userIdsToEnroll } },
            { $addToSet: { joinedPortals: tanitimPortal._id } }
        );

        await Portal.findByIdAndUpdate(tanitimPortal._id, {
            $addToSet: { members: { $each: userIdsToEnroll } }
        });
        enrolledCount = userIdsToEnroll.length;
    }

    console.log(`✅ Successfully enrolled ${enrolledCount} users into "Oxypace Tanıtım"!`);

    // 4. Seed Guide Posts authored by @oxypace
    const targetChannel = tanitimPortal.channels?.[0]?._id?.toString() || 'general';

    console.log('📝 Seeding Onboarding Guide Posts in "Oxypace Tanıtım"...');

    const guidePosts = [
        {
            key: 'welcome',
            isPinned: true,
            content: `✨ Oxypace'e Hoş Geldiniz! 🚀\n\nOxypace; modern, özgür, hızlı ve güvenli bir topluluk deneyimi sunmak için tasarlandı.\n\n📱 Neler Yapabilirsiniz?\n• Kendi ilgi alanlarınıza özel Portallar oluşturabilir ve topluluklarınızı büyütebilirsiniz.\n• Metin, Sesli sohbet ve Sahne modlu Konferans odalarıyla arkadaşlarınızla canlı iletişim kurabilirsiniz.\n• 4K çözünürlüğe kadar yüksek kaliteli videolar, çoklu görseller ve PDF dokümanları paylaşabilirsiniz.\n• Hem Aydınlık Beyaz (Light) hem de Karanlık Siyah (OLED Dark) temalarla gözlerinizi yormayan tasarımı keşfedebilirsiniz.\n\nAşağıdaki rehber paylaşımlarını inceleyerek platformun tüm inceliklerini hemen öğrenebilirsiniz! 👇`,
        },
        {
            key: 'portals_guide',
            isPinned: false,
            content: `🏰 Rehber: Portallar ve Kanallar Nasıl Kullanılır?\n\nOxypace'de her topluluk bir "Portal" olarak adlandırılır:\n\n1️⃣ Portal Keşfetme ve Katılma:\nSol menüdeki pusula simgesine veya arama çubuğuna tıklayarak açık veya gizli portalları keşfedebilir, tek dokunuşla katılabilirsiniz.\n\n2️⃣ Kendi Portalınızı Oluşturma:\nSol menüdeki (+) butonuna basarak kendi portalınızı saniyeler içinde oluşturabilirsiniz. Gizlilik ayarını Herkese Açık, Gizli veya Kısıtlı Erişim olarak seçebilirsiniz.\n\n3️⃣ Kanal Çeşitleri:\n💬 Metin Kanalları: Günlük sohbetler ve paylaşımlar için.\n🎙️ Ses Kanalları: Düşük gecikmeli, kristal netliğinde sesli iletişim.\n🎥 Sahne Konferans Kanalları: Seminerler, etkinlikler ve sunumlar için konuşmacı-dinleyici modlu odalar!`,
        },
        {
            key: 'media_guide',
            isPinned: false,
            content: `📸 Rehber: Zengin Medya ve Gönderi Paylaşımı\n\nOxypace akışında fikirlerinizi dilediğiniz gibi özgürce ifade edin:\n\n🎬 Video Oynatıcı & Transcoding:\nYüklediğiniz videolar arka planda otomatik optimize edilir. 360p'den 4K'ya kadar bant genişliğinize en uygun kalitede izleyebilirsiniz.\n\n🖼️ Çoklu Görsel Paylaşımı:\nTek bir gönderide 10 adede kadar yüksek çözünürlüklü görsel yükleyebilir, modern galeri görünümünde sunabilirsiniz.\n\n📄 PDF & Doküman Desteği:\nKitap, makale, ders notu veya sunumlarınızı doğrudan PDF kartı olarak paylaşabilir; tek tıkla cihazınıza indirebilirsiniz.\n\n🔗 YouTube Entegrasyonu:\nYouTube bağlantılarını yapıştırdığınızda doğrudan gönderi içerisine hafif, hızlı oynatıcı yerleşir!`,
        },
        {
            key: 'security_guide',
            isPinned: false,
            content: `🛡️ Rehber: Hesap Güvenliği ve Doğrulama Rozetleri\n\nGüvenliğiniz Oxypace için en birinci önceliktir:\n\n🔑 Güvenlik Soruları:\nAyarlar > Güvenlik menüsünden güvenlik sorularınızı tanımlayarak hesabınızı parola unutma durumlarına karşı koruyabilirsiniz.\n\n📲 Cihaz Yönetimi:\nHesabınıza giriş yapılan tüm cihazları ve IP geçmişini inceleyebilir, tanımadığınız oturumları tek tuşla sonlandırabilirsiniz.\n\n⭐ Onaylı Hesap (Mavi/Altın Rozet):\nProfil sayfanızdan veya Ayarlar sekmesinden doğrulama rozeti talebinde bulunarak toplulukta güvenilirliğinizi taçlandırabilirsiniz!`,
        },
    ];

    for (const gp of guidePosts) {
        const existing = await Post.findOne({
            author: oxypaceUser._id,
            portal: tanitimPortal._id,
            content: { $regex: new RegExp(gp.key === 'welcome' ? 'Oxypace.*Hoş Geldiniz' : gp.key === 'portals_guide' ? 'Portallar ve Kanallar' : gp.key === 'media_guide' ? 'Zengin Medya' : 'Hesap Güvenliği', 'i') }
        });

        if (!existing) {
            await Post.create({
                author: oxypaceUser._id,
                portal: tanitimPortal._id,
                channel: targetChannel,
                content: gp.content,
                isPinned: gp.isPinned,
                pinnedAt: gp.isPinned ? new Date() : undefined,
            });
            console.log(`✅ Seeded guide post: ${gp.key}`);
        } else {
            console.log(`ℹ️ Guide post already exists: ${gp.key}`);
        }
    }

    // 5. Seed Popular / Featured Portal Showcases (+18 Strictly Excluded!)
    console.log('🌟 Seeding Popular Portal Showcases with 1-Click Join Interface...');

    const featuredPortals = await Portal.find({
        _id: { $ne: tanitimPortal._id },
        isNSFW: { $ne: true }, // +18 STRICTLY EXCLUDED!
        status: 'active',
        privacy: { $in: ['public', 'private'] }
    }).limit(6);

    console.log(`📊 Found ${featuredPortals.length} eligible portals for showcase.`);

    for (const p of featuredPortals) {
        const existingPromo = await Post.findOne({
            author: oxypaceUser._id,
            portal: tanitimPortal._id,
            promotedPortal: p._id
        });

        if (!existingPromo) {
            const promoContent = `🌟 Öne Çıkan Topluluk: ${p.name}\n\n${p.description || 'Oxypace platformunun popüler ve aktif topluluklarından biri. Hemen aramıza katılın!'}\n\n👇 Aşağıdaki kart üzerinden tek tıkla katılabilir veya portalı inceleyebilirsiniz:`;

            await Post.create({
                author: oxypaceUser._id,
                portal: tanitimPortal._id,
                channel: targetChannel,
                content: promoContent,
                promotedPortal: p._id,
            });
            console.log(`✅ Seeded showcase post for portal: "${p.name}"`);
        } else {
            console.log(`ℹ️ Showcase post already exists for portal: "${p.name}"`);
        }
    }

    console.log('\n🎉 ALL DONE! Oxypace Tanıtım portal is fully initialized and operational.');
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('❌ Error executing seed script:', err);
    process.exit(1);
});
