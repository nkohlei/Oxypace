import express from 'express';
import BlogPost from '../models/BlogPost.js';
import BlogAuthor from '../models/BlogAuthor.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Initial Seed Data (from posts.js)
const INITIAL_POSTS = [
    {
        title: "Zamanın Yönü: Entropi ve Termodinamiğin İkinci Yasası",
        slug: "zamanin-yonu-entropi-ve-termodinamigin-ikinci-yasasi",
        excerpt: "Neden geçmişi hatırlayıp geleceği hatırlayamıyoruz? Termodinamiğin ikinci yasası ve evrenin başlangıcındaki ultra-düşük entropi durumu, zamanın tek yönlü akışını nasıl dikte ediyor?",
        category: "Teorik Fizik",
        readTime: "12 dk okuma",
        date: "14 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `
          <p class="lead text-lg text-zinc-300 mb-6">Fiziğin en temel ve sarsıcı sorularından biri, mikroskobik düzeydeki hareket yasalarının tamamı zaman-simetrik iken (yani denklemlerde zamanı ileri veya geri almak hiçbir şeyi değiştirmezken), makroskobik evrende zamanın neden kararlı bir şekilde tek bir yöne aktığıdır. Bu sorunun cevabı, istatistiksel mekanik ve Termodinamiğin İkinci Yasası'nda saklıdır.</p>
          
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Entropi: Olasılıkların Geometrisi</h2>
          <p class="text-zinc-300 mb-4">Ludwig Boltzmann'ın formüle ettiği üzere entropi, bir sistemin makroskopik durumuna karşılık gelen mikroskobik konfigürasyonların (mikro-durumların) sayısının bir ölçüsüdür. Basit bir ifadeyle, düzenli bir durumun (düşük entropi) gerçekleşme olasılığı çok düşükken, dağınık ve düzensiz durumların (yüksek entropi) gerçekleşme olasılığı ezici derecede yüksektir. İkinci yasa, kapalı bir sistemin entropisinin zamanla her zaman artma eğiliminde olduğunu söyler.</p>
          
          <blockquote class="border-l-4 border-accent pl-4 my-6 italic text-zinc-400">
            "Zaman oku, evrenin düzenden düzensizliğe doğru yaptığı kaçınılmaz istatistiksel yolculuğun makroskopik bir yansımasıdır."
          </blockquote>

          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Geçmiş Hipotezi ve Kozmolojik Başlangıç</h2>
          <p class="text-zinc-300 mb-4">Eğer evren zamanla düzensizliğe gidiyorsa, bu durum geçmişte çok daha düzenli (düşük entropili) olduğu anlamına gelir. Büyük Patlama anında evrenin neden bu kadar olağanüstü derecede düşük entropiye sahip olduğu kozmolojinin en büyük bilmecelerinden biridir. Kozmolog Sean Carroll ve meslektaşları, zamanın yönünü doğrudan bu "Geçmiş Hipotezi"ne bağlar. Eğer Big Bang sırasında madde ve yerçekimi homojen ve ultra-düşük entropili bir yapıda olmasaydı, bugün ne galaksiler, ne yıldızlar ne de zamanı deneyimleyebilecek canlı organizmalar var olabilirdi.</p>
          
          <p class="text-zinc-300 mb-4">Nihayetinde, kahvenize damlattığınız sütün dağılması, kırılan bir bardağın kendiliğinden birleşmemesi ve biyolojik yaşlanma süreçlerimiz, evrenin kozmik ölçekteki entropi artışıyla doğrudan ilintilidir. Zamanın akışı, yerel bir illüzyon değil, kozmosun en derin termodinamik gerçeğidir.</p>
        `
    },
    {
        title: "8000 Metrenin Üstü: Ekstrem Dağcılıkta Hipoksi ve Aklimatizasyon Fiziği",
        slug: "8000-metrenin-ustu-ekstrem-dagcilikta-hipoksi",
        excerpt: "Ölüm Bölgesi olarak adlandırılan ekstrem irtifalarda insan vücudundaki kısmi oksijen basıncının düşüşü, hücresel solunum fiziğini ve aklimatizasyon mekanizmalarını nasıl etkiler?",
        category: "Ekstrem Doğa Fiziği",
        readTime: "10 dk okuma",
        date: "12 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `
          <p class="lead text-lg text-zinc-300 mb-6">Yeryüzündeki 8000 metreyi aşan 14 zirve, dağcılar için sadece fiziksel bir engel değil, aynı zamanda sınırları zorlayan fizyolojik bir laboratuvardır. Bu yüksekliklerde atmosfer basıncı deniz seviyesindekinin yaklaşık üçte birine düşer. Bu durum, havadaki oksijen oranının azalmasından değil, atmosfer basıncının düşmesiyle oksijenin kısmi basıncının azalmasından kaynaklanır.</p>
          
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Ölüm Bölgesi ve Hipoksi</h2>
          <p class="text-zinc-300 mb-4">Fizyolojide 8000 metrenin üzeri 'Ölüm Bölgesi' (Death Zone) olarak tanımlanır. Bu irtifada insan vücudu kendini yenileyemez ve tüketim hızı üretim hızını aşar. Kısmi basınç farkı azaldığı için akciğer alveollerinden kana oksijen geçişi kritik düzeyde yavaşlar. Bu duruma hipoksi (oksijen yetmezliği) denir. Hücreler aerobik solunumdan anaerobik solunuma geçtikçe laktik asit birikir, beyin ve akciğer ödemi riski katlanarak artar.</p>
          
          <blockquote class="border-l-4 border-accent pl-4 my-6 italic text-zinc-400">
            "8000 metrede atılan her adım, fiziksel yerçekimi kuvvetiyle birlikte, kandaki hemoglobin doygunluğunun sınırlarına karşı verilen biyokimyasal bir savaştır."
          </blockquote>

          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Aklimatizasyonun Biyofiziksel Süreci</h2>
          <p class="text-zinc-300 mb-4">İnsan vücudu bu ekstrem koşullara uyum sağlamak için aklimatizasyon (iklimleştirme) adı verilen biyofiziksel süreçleri devreye sokar. Böbreklerden salgılanan eritropoietin (EPO) hormonu kemik iliğini uyararak alyuvar (kırmızı kan hücresi) üretimini artırır. Kanın viskozitesi (akışkanlığa karşı direnci) artar, solunum derinleşir ve kalp debisi yükselir. Ancak bu adaptasyonların bile bir sınırı vardır ve ölüm bölgesinde geçirilen her dakika hücre ömründen çalmaya devam eder.</p>
        `
    },
    {
        title: "Kozmik Boşluklar ve Galaktik İplikçikler: Evrenin En Büyük Yapıları",
        slug: "kozmik-bosluklar-ve-galaktik-iplikcikler",
        excerpt: "Gözlemlenebilir evrenin devasa haritasında yer alan, milyonlarca ışık yılı genişliğindeki kozmik ağ yapıları ve neredeyse hiçbir madde içermeyen devasa boşlukların kökeni.",
        category: "Kozmoloji",
        readTime: "9 dk okuma",
        date: "10 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `
          <p class="lead text-lg text-zinc-300 mb-6">Evrene en büyük ölçekte baktığımızda, galaksilerin rastgele dağılmadığını görürüz. Bunun yerine kozmos, adeta devasa bir örümcek ağına benzeyen Kozmik Ağ (Cosmic Web) yapısıyla örülüdür. Bu ağın düğüm noktalarında galaksi kümeleşmeleri yer alırken, aralarında ise akılalmaz büyüklükte boşluklar bulunur.</p>
          
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Galaktik İplikçikler (Filamentler)</h2>
          <p class="text-zinc-300 mb-4">Galaktik iplikçikler, evrendeki kütleçekimsel olarak birbirine bağlı en büyük ipliksi yapılardır. Karanlık maddenin kütleçekim potansiyel kuyuları boyunca dizilen hidrojen gazı ve galaksilerden oluşurlar. Sloan Büyük Duvarı veya Herkül-Corona Borealis Büyük Duvarı gibi yapılar milyarlarca ışık yılı uzunluğa ulaşarak insan zihninin algı sınırlarını zorlar.</p>
          
          <blockquote class="border-l-4 border-accent pl-4 my-6 italic text-zinc-400">
            "Kozmik ağ, karanlık maddenin evrenin şafağında ördüğü ve görünür maddenin üzerine tutunarak parladığı kozmik bir iskelettir."
          </blockquote>

          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Kozmik Boşluklar (Voids)</h2>
          <p class="text-zinc-300 mb-4">İplikçiklerin çevrelediği devasa, karanlık alanlara kozmik boşluklar (voids) denir. Bu bölgeler o kadar seyrektir ki, metreküp başına düşen madde miktarı evren ortalamasının çok altındadır. Örneğin Bootes Boşluğu (Bootes Void), yaklaşık 330 milyon ışık yılı çapındadır ve içinde neredeyse hiç galaksi barındırmaz. Bu boşlukların incelenmesi, karanlık enerjinin genişleme hızını ve evrenin ivmelenmesini anlamamızda kritik rol oynamaktadır.</p>
        `
    },
    {
        title: "Karanlık Madde Haleleri ve Galaktik Dönme Eğrileri",
        slug: "karanlik-madde-haleleri-galaktik-donme-egrisi",
        excerpt: "Galaksilerin dış kollarındaki yıldızların beklenmedik derecede yüksek yörünge hızları, görünür kütlenin çok ötesinde bir kütle dağılımına işaret eder. Karanlık madde halelerinin morfolojisi ve Vera Rubin'in tarihi keşfi.",
        category: "Kozmoloji",
        readTime: "11 dk okuma",
        date: "8 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `<p class="lead text-lg text-zinc-300 mb-6">Galaksilerin dış bölgelerindeki yıldızların dönme hızları, Newton yerçekimi yasaları çerçevesinde beklenenden çok daha yüksektir. Bu anomali, "düz" dönme eğrilerinin varlığına işaret eder ve görünür baryonik maddenin ötesinde büyük miktarda kütlenin varlığını zorunlu kılmaktadır.</p>
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Karanlık Madde Kanıtları</h2>
          <p class="text-zinc-300 mb-4">Vera Rubin ve Kent Ford'un 1970'lerdeki gözlemleri, Andromeda galaksisinin dış kollarındaki yıldızların galaktik merkeze yakın yıldızlarla neredeyse aynı hızda döndüğünü ortaya koymuştur. Bu, görünür madde dağılımının öngördüğü Kepler dönme profilinden tamamen farklıdır.</p>`
    },
    {
        title: "K2 Dağının Ölüm Bölgesinde Oksijensiz Solunum Fiziği",
        slug: "k2-daginda-oksijensiz-solunum-fizigi",
        excerpt: "Dünyanın en tehlikeli zirvesi K2'nin 8611 metresinde oksijensiz çıkışlarda gerçekleşen alveolar gaz değişimi, mitokondriyal solunum zinciri çöküşü ve serebral hipoksi mekanizmaları.",
        category: "Ekstrem Doğa Fiziği",
        readTime: "13 dk okuma",
        date: "6 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `<p class="lead text-lg text-zinc-300 mb-6">K2'nin 8611 metrelik zirvesinde kısmi oksijen basıncı 33 kPa'ya düşer — deniz seviyesindeki değerin yaklaşık üçte biri. Bu koşulda alveolar PO₂ 35 mmHg civarına geriler ve hemoglobin doygunluğu kritik eşiğin altına iner.</p>
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Mitokondriyal Solunum Zinciri Çöküşü</h2>
          <p class="text-zinc-300 mb-4">Bu seviyede sitokrom c oksidaz enziminin oksijen affinitesi sınıra ulaşır. Aerobik metabolizma hızla yerini anaerobik yolağa bırakır ve laktik asidoz başlar. Serebral otoregülasyon mekanizmaları hipoksiyi telafi etmeye çalışırken beyin ödemi riski üstel olarak artar.</p>`
    },
    {
        title: "Kuantum Tünelleme ve Biyolojik Mutasyon İlişkileri",
        slug: "kuantum-tunelleme-biyolojik-mutasyon",
        excerpt: "DNA polimerazının hata düzeltme mekanizmalarındaki proton transferleri sırasında gerçekleşen kuantum tünelleme olayları, spontan mutasyon oranlarını nasıl belirliyor?",
        category: "Teorik Fizik",
        readTime: "14 dk okuma",
        date: "4 Temmuz 2026",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
        isPublished: true,
        content: `<p class="lead text-lg text-zinc-300 mb-6">DNA'daki Watson-Crick baz çiftlerini bir arada tutan tautomerik protonların, enerji bariyeri altından kuantum mekanik tünelleme ile geçebileceği hipotezi Löwdin tarafından 1963 yılında önerilmiştir. Bu süreç, spontan mutasyonların kaynaklarından biri olabilir.</p>
          <h2 class="text-2xl font-bold text-white mt-8 mb-4">Proton Tünellemesi Mekanizması</h2>
          <p class="text-zinc-300 mb-4">Adenin-Timin baz çiftindeki keto-enol tautomerizasyonu, protonun hidrojen bağı boyunca klasik termal aktivasyon olmaksızın geçişine yol açabilir. Eğer bu tautomer hali DNA replikasyonu sırasında şablon görevi görürse, yanlış baz eşleşmesi ve dolayısıyla mutasyon meydana gelebilir.</p>`
    }
];

// Düz metinleri şık HTML biçimine çeviren akıllı dönüştürücü
function ensureHtmlFormatted(text = '') {
    if (!text || typeof text !== 'string') return '';

    if (/<(p|h1|h2|h3|blockquote|div|ul|ol|table|br)\b[^>]*>/i.test(text)) {
        return text;
    }

    const lines = text.split('\n');
    let htmlResult = [];
    let inList = false;

    for (let line of lines) {
        let trimmed = line.trim();

        if (!trimmed) {
            if (inList) {
                htmlResult.push('</ul>');
                inList = false;
            }
            continue;
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('📌 ')) {
            if (inList) { htmlResult.push('</ul>'); inList = false; }
            const headerText = trimmed.replace(/^(## |📌 )/, '');
            htmlResult.push(`<h2 class="text-2xl font-bold text-white mt-8 mb-4">${headerText}</h2>`);
        }
        else if (trimmed.startsWith('### ') || trimmed.startsWith('🔹 ')) {
            if (inList) { htmlResult.push('</ul>'); inList = false; }
            const subText = trimmed.replace(/^(### |🔹 )/, '');
            htmlResult.push(`<h3 class="text-xl font-bold text-white mt-6 mb-3">${subText}</h3>`);
        }
        else if (trimmed.startsWith('> ') || trimmed.startsWith('💬 ')) {
            if (inList) { htmlResult.push('</ul>'); inList = false; }
            const quoteText = trimmed.replace(/^(> |💬 )/, '');
            htmlResult.push(`<blockquote class="border-l-4 border-accent pl-4 my-6 italic text-zinc-400">"${quoteText}"</blockquote>`);
        }
        else if (trimmed.startsWith('💡 ')) {
            if (inList) { htmlResult.push('</ul>'); inList = false; }
            const infoText = trimmed.replace(/^💡 /, '');
            htmlResult.push(`<div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-6">💡 <strong>Not:</strong> ${infoText}</div>`);
        }
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                htmlResult.push('<ul class="list-disc list-inside space-y-2 mb-6 text-zinc-300">');
                inList = true;
            }
            const itemText = trimmed.replace(/^[-*] /, '');
            htmlResult.push(`  <li>${itemText}</li>`);
        }
        else {
            if (inList) { htmlResult.push('</ul>'); inList = false; }
            let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            htmlResult.push(`<p class="text-zinc-300 mb-4">${formattedLine}</p>`);
        }
    }

    if (inList) {
        htmlResult.push('</ul>');
    }

    return htmlResult.join('\n');
}

// Helper to seed if database is empty
async function seedDatabaseIfEmpty() {
    try {
        const count = await BlogPost.countDocuments();
        if (count === 0) {
            const oxypaceUser = await User.findOne({ username: 'oxypace' });
            const authorId = oxypaceUser ? oxypaceUser._id : null;

            const postsToSeed = INITIAL_POSTS.map(p => ({
                ...p,
                author: authorId
            }));

            await BlogPost.insertMany(postsToSeed);
            console.log('✅ Seeded default blog posts into database.');
        }
    } catch (err) {
        console.error('Error seeding blog posts:', err);
    }
}

// Format Date string in Turkish locale
function formatTurkishDate(d = new Date()) {
    return new Date(d).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Calculate reading time
function calculateReadTime(content = '') {
    const plainText = content.replace(/<[^>]+>/g, '');
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} dk okuma`;
}

// ---------------------------------------------------------
// 1. PUBLIC & AUTHOR SPECIFIC ROUTES (Must come before /:slug!)
// ---------------------------------------------------------

// @route   GET /api/blog
// @desc    Get all published blog posts (Public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        await seedDatabaseIfEmpty();

        const { category, search } = req.query;
        let query = { isPublished: true };

        if (category && category !== 'all' && category !== 'Tümü') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await BlogPost.find(query)
            .sort({ createdAt: -1 })
            .populate('author', 'username profile')
            .populate('authorProfile');

        res.json(posts);
    } catch (error) {
        console.error('Fetch blog posts error:', error);
        res.status(500).json({ message: 'Blog makaleleri alınamadı: ' + error.message });
    }
});

// Helper function to get or create official default Oxypace author
const getOrCreateOfficialAuthor = async () => {
    const oxypaceUser = await User.findOne({ username: 'oxypace' }) || await User.findOne({ isAdmin: true });

    // Find all existing author profiles sorted by creation date (earliest first)
    const allAuthors = await BlogAuthor.find().sort({ createdAt: 1 });
    let official = null;

    if (oxypaceUser) {
        // Priority 1: Profile already linked to oxypaceUser
        official = allAuthors.find(a => a.user && a.user.toString() === oxypaceUser._id.toString());
    }

    if (!official) {
        // Priority 2: Profile marked as official
        official = allAuthors.find(a => a.isOfficial);
    }

    if (!official && allAuthors.length > 0) {
        // Priority 3: Earliest pre-existing author profile in database
        official = allAuthors[0];
    }

    if (official) {
        official.isOfficial = true;
        if (oxypaceUser) {
            official.user = oxypaceUser._id;
        }
        await official.save();

        // Cleanup: If extra duplicate profiles were created for oxypaceUser during testing, merge them
        if (oxypaceUser) {
            const duplicates = allAuthors.filter(a =>
                a._id.toString() !== official._id.toString() &&
                a.user && a.user.toString() === oxypaceUser._id.toString()
            );

            for (const dup of duplicates) {
                await BlogPost.updateMany({ authorProfile: dup._id }, { authorProfile: official._id });
                await BlogAuthor.findByIdAndDelete(dup._id);
            }
        }
    } else {
        official = await BlogAuthor.create({
            user: oxypaceUser ? oxypaceUser._id : null,
            name: 'Oxypace',
            title: 'Oxypace Kurucusu & Baş Yazarı',
            bio: 'Teorik fizik, ekstrem doğa olayları, kozmoloji ve yüksek performanslı yazılım mimarileri üzerine araştırmalar yapıyor.',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            badge: 'Baş Yazar',
            isOfficial: true,
        });
    }

    // Ensure all existing blog posts point to the official profile
    await BlogPost.updateMany({ authorProfile: { $exists: false } }, { authorProfile: official._id });
    await BlogPost.updateMany({ authorProfile: null }, { authorProfile: official._id });

    return official;
};

// @route   GET /api/blog/authors
// @desc    Get all blog author profiles for selection in admin
// @access  Private/Admin
router.get('/authors', protect, admin, async (req, res) => {
    try {
        await getOrCreateOfficialAuthor();
        const authors = await BlogAuthor.find().sort({ isOfficial: -1, createdAt: 1 }).populate('user', 'username name profile');
        res.json(authors);
    } catch (error) {
        console.error('Fetch all blog authors error:', error);
        res.status(500).json({ message: 'Yazar listesi alınamadı: ' + error.message });
    }
});

// @route   GET /api/blog/author
// @desc    Get blog author profile settings (returns current user's profile if logged in, or official author)
// @access  Public / Optional Auth
router.get('/author', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let currentUser = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = (await import('jsonwebtoken')).default;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUser = await User.findById(decoded.id).select('-password');
            } catch (err) {
                // Token invalid
            }
        }

        if (currentUser) {
            const isOxypaceAccount = currentUser.username === 'oxypace' || (currentUser.isAdmin && !currentUser.isTouristAdmin);

            if (isOxypaceAccount) {
                const official = await getOrCreateOfficialAuthor();
                return res.json(official);
            }

            // Tourist admin or other user
            let author = await BlogAuthor.findOne({ user: currentUser._id });
            if (!author) {
                const defaultName = currentUser.name || currentUser.username || 'Yazar';
                const defaultAvatar = currentUser.profile?.avatar || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                author = await BlogAuthor.create({
                    user: currentUser._id,
                    name: defaultName,
                    title: 'Oxypace Yazar & İçerik Üreticisi',
                    bio: `${defaultName} — Oxypace bilim ve teknoloji blogu yazarı.`,
                    avatar: defaultAvatar,
                    badge: 'Yazar',
                    isOfficial: false,
                });
            }
            return res.json(author);
        }

        const official = await getOrCreateOfficialAuthor();
        res.json(official);
    } catch (error) {
        console.error('Fetch blog author error:', error);
        res.status(500).json({ message: 'Yazar profili alınamadı: ' + error.message });
    }
});

// @route   PUT /api/blog/author
// @desc    Update blog author profile settings (for current admin / tourist admin or official profile)
// @access  Private/Admin
router.put('/author', protect, admin, async (req, res) => {
    try {
        const { name, title, bio, avatar, badge, github, twitter, website, linkedin, isOfficialTarget } = req.body;

        const isOxypaceAccount = req.user.username === 'oxypace' || (req.user.isAdmin && !req.user.isTouristAdmin);

        let author;
        if (isOfficialTarget || isOxypaceAccount) {
            author = await getOrCreateOfficialAuthor();
        } else {
            author = await BlogAuthor.findOne({ user: req.user._id });
            if (!author) {
                author = new BlogAuthor({
                    user: req.user._id,
                    isOfficial: false,
                });
            }
        }

        if (name !== undefined) author.name = name.trim();
        if (title !== undefined) author.title = title.trim();
        if (bio !== undefined) author.bio = bio.trim();
        if (avatar !== undefined) author.avatar = avatar.trim();
        if (badge !== undefined) author.badge = badge.trim();
        if (github !== undefined) author.github = github.trim();
        if (twitter !== undefined) author.twitter = twitter.trim();
        if (website !== undefined) author.website = website.trim();
        if (linkedin !== undefined) author.linkedin = linkedin.trim();

        const updatedAuthor = await author.save();
        res.json(updatedAuthor);
    } catch (error) {
        console.error('Update blog author error:', error);
        res.status(500).json({ message: 'Yazar profili güncellenemedi: ' + error.message });
    }
});

// ---------------------------------------------------------
// 2. ADMIN MANAGEMENT ROUTES
// ---------------------------------------------------------

// @route   GET /api/blog/admin/all
// @desc    Get all blog posts including drafts for admin
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        await seedDatabaseIfEmpty();

        const posts = await BlogPost.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username profile')
            .populate('authorProfile');

        res.json(posts);
    } catch (error) {
        console.error('Fetch admin blog posts error:', error);
        res.status(500).json({ message: 'Yönetici blog listesi alınamadı: ' + error.message });
    }
});

// @route   POST /api/blog/admin
// @desc    Create new blog post
// @access  Private/Admin
router.post('/admin', protect, admin, async (req, res) => {
    try {
        const { title, slug, excerpt, content, category, readTime, image, isPublished, authorProfile } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Makale başlığı zorunludur.' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Makale içeriği zorunludur.' });
        }

        const formattedContent = ensureHtmlFormatted(content);

        let finalSlug = slug && slug.trim() ? slug.trim() : BlogPost.generateSlug(title);
        if (!finalSlug) finalSlug = 'post-' + Date.now();

        const existing = await BlogPost.findOne({ slug: finalSlug });
        if (existing) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        let selectedAuthorProfile = authorProfile;
        if (!selectedAuthorProfile && req.user) {
            const userAuthor = await BlogAuthor.findOne({ user: req.user._id });
            if (userAuthor) {
                selectedAuthorProfile = userAuthor._id;
            } else {
                const official = await getOrCreateOfficialAuthor();
                selectedAuthorProfile = official._id;
            }
        }

        const newPost = new BlogPost({
            title: title.trim(),
            slug: finalSlug,
            excerpt: excerpt ? excerpt.trim() : '',
            content: formattedContent,
            category: category ? category.trim() : 'Teorik Fizik',
            readTime: readTime && readTime.trim() ? readTime.trim() : calculateReadTime(formattedContent),
            date: formatTurkishDate(),
            image: image ? image.trim() : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
            isPublished: isPublished !== undefined ? isPublished : true,
            author: req.user ? req.user._id : null,
            authorProfile: selectedAuthorProfile || null,
        });

        const savedPost = await newPost.save();
        const populatedPost = await BlogPost.findById(savedPost._id)
            .populate('author', 'username profile')
            .populate('authorProfile');

        res.status(201).json(populatedPost || savedPost);
    } catch (error) {
        console.error('Create blog post error:', error);
        res.status(500).json({ message: 'Makale oluşturulurken hata oluştu: ' + (error.message || error) });
    }
});

// @route   PUT /api/blog/admin/:id
// @desc    Update existing blog post
// @access  Private/Admin
router.put('/admin/:id', protect, admin, async (req, res) => {
    try {
        const { title, slug, excerpt, content, category, readTime, image, isPublished, authorProfile } = req.body;

        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Makale bulunamadı.' });
        }

        if (title && title.trim()) post.title = title.trim();
        if (slug && slug.trim()) post.slug = slug.trim();
        if (excerpt !== undefined) post.excerpt = excerpt.trim();
        if (content && content.trim()) {
            post.content = ensureHtmlFormatted(content);
            if (!readTime) post.readTime = calculateReadTime(post.content);
        }
        if (category) post.category = category.trim();
        if (readTime) post.readTime = readTime.trim();
        if (image !== undefined) post.image = image.trim();
        if (isPublished !== undefined) post.isPublished = isPublished;
        if (authorProfile !== undefined) post.authorProfile = authorProfile;

        const updatedPost = await post.save();
        const populatedPost = await BlogPost.findById(updatedPost._id)
            .populate('author', 'username profile')
            .populate('authorProfile');

        res.json(populatedPost || updatedPost);
    } catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({ message: 'Makale güncellenirken hata oluştu: ' + (error.message || error) });
    }
});

// @route   PATCH /api/blog/admin/:id/toggle-publish
// @desc    Toggle single-click publish / unpublish status
// @access  Private/Admin
router.patch('/admin/:id/toggle-publish', protect, admin, async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Makale bulunamadı.' });
        }

        post.isPublished = !post.isPublished;
        const updatedPost = await post.save();

        res.json({
            message: post.isPublished ? 'Makale başarıyla yayınlandı.' : 'Makale yayından kaldırıldı.',
            isPublished: post.isPublished,
            post: updatedPost
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({ message: 'Yayın durumu değiştirilemedi: ' + error.message });
    }
});

// @route   DELETE /api/blog/admin/:id
// @desc    Delete blog post
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Makale bulunamadı.' });
        }

        await post.deleteOne();
        res.json({ message: 'Makale başarıyla silindi.' });
    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({ message: 'Makale silinirken hata oluştu: ' + error.message });
    }
});

// ---------------------------------------------------------
// 3. PARAMETERIZED SLUG ROUTE (MUST ALWAYS BE AT THE END!)
// ---------------------------------------------------------

// @route   GET /api/blog/:slug
// @desc    Get single blog post by slug
// @access  Public
router.get('/:slug', async (req, res) => {
    try {
        await seedDatabaseIfEmpty();

        const post = await BlogPost.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('author', 'username profile')
            .populate('authorProfile');

        if (!post) {
            return res.status(404).json({ message: 'Makale bulunamadı.' });
        }

        res.json(post);
    } catch (error) {
        console.error('Fetch single blog post error:', error);
        res.status(500).json({ message: 'Makale detayları alınamadı: ' + error.message });
    }
});

export default router;
